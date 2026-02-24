-- ======================================================
-- MUDANÇAS FASE 8: COMPARTILHAMENTO DE CONTAS
-- ======================================================

-- 1. Criar Tabela de Casas (Households)
create table households (
  id uuid default gen_random_uuid() primary key,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Atualizar Tabela de Perfis para incluir Vínculo com a Casa
alter table public.profiles 
add column household_id uuid references households(id) on delete set null;

-- 3. Atualizar Tabela de Categorias para incluir Vínculo com a Casa
alter table public.categories 
add column household_id uuid references households(id) on delete cascade;

-- 4. Atualizar Tabela de Transações para incluir Vínculo com a Casa
alter table public.transactions 
add column household_id uuid references households(id) on delete cascade;

-- 5. Habilitar RLS para a tabela de Casas
alter table households enable row level security;

-- Política para permitir que usuários logados vejam as casas (necessário para o convite)
create policy "Allow authenticated users to select households" on households
for select using (auth.role() = 'authenticated');

-- ======================================================
-- NOVAS POLÍTICAS DE SEGURANÇA (RLS)
-- ======================================================

-- Remover políticas antigas para evitar conflitos
drop policy "Users can manage own categories" on categories;
drop policy "Users can manage own transactions" on transactions;

-- Novas políticas baseadas no household_id
-- Agora o critério é: "O usuário pode ver/gerenciar se pertencer à mesma household do registro"

-- Categorias
create policy "Users can manage household categories" on categories
for all using (
  auth.uid() in (
    select id from profiles where household_id = categories.household_id
  )
);

-- Transações
create policy "Users can manage household transactions" on transactions
for all using (
  auth.uid() in (
    select id from profiles where household_id = transactions.household_id
  )
);

-- ======================================================
-- FUNÇÃO AUXILIAR: Criar casa automática para novos usuários
-- ======================================================
-- Garante o Requisito 1: Cadastro Autônomo com casa privada inicial

create or replace function public.handle_new_user_with_household()
returns trigger as $$
declare
  new_household_id uuid;
begin
  -- 1. Criar uma nova household privada
  insert into public.households (name) values ('Minha Casa') returning id into new_household_id;

  -- 2. Inserir perfil vinculado à nova household
  insert into public.profiles (id, full_name, avatar_url, email, household_id)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email, new_household_id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Substituir o gatilho antigo pelo novo
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_with_household();
