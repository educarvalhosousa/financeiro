-- 1. Tabela de Perfis (opcional, para metadados extras)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  email text
);

-- 2. Tabela de Categorias
create table categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Transações
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  value decimal(12,2) not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

-- Políticas de Segurança (Usuário só vê o que é dele)
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can manage own categories" on categories for all using (auth.uid() = user_id);
create policy "Users can manage own transactions" on transactions for all using (auth.uid() = user_id);

-- Gatilho para criar perfil automaticamente no login (opcional)
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
