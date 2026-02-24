-- ======================================================
-- SCRIPT DE MANUTENÇÃO: REPARAR USUÁRIOS EXISTENTES
-- ======================================================

-- 1. Criar casas para usuários que ainda não possuem uma
do $$
declare
    r record;
    new_h_id uuid;
begin
    for r in select id from public.profiles where household_id is null
    loop
        -- Criar uma nova casa
        insert into public.households (name) values ('Minha Casa') returning id into new_h_id;
        
        -- Vincular o usuário a essa casa
        update public.profiles set household_id = new_h_id where id = r.id;
    end loop;
end;
$$;

-- 2. Verificar se todos os perfis estão corretos
select id, full_name, household_id from public.profiles;
