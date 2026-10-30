-- Run after migration 0097 in staging.
-- Fails closed if current postgres-owned public-table grants, postgres creator defaults,
-- or supabase_admin-owned public objects/extensions remain outside the supported boundary.
do $$
declare
  t record;
  role_name text;
  privilege_name text;
begin
  for t in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
    order by tablename
  loop
    foreach role_name in array array['anon', 'authenticated'] loop
      foreach privilege_name in array array['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'] loop
        if has_table_privilege(role_name, format('%I.%I', t.schemaname, t.tablename), privilege_name) then
          raise exception 'Client role % retains % on %.%', role_name, privilege_name, t.schemaname, t.tablename;
        end if;
      end loop;
    end loop;
  end loop;

  -- postgres defaults are owned by this project's migration role and are modifiable.
  -- Do not assert that reserved supabase_admin defaults are empty: Supabase does not
  -- permit postgres to change them. Instead assert that they own no public objects
  -- to which those internal defaults could apply.
  for t in
    select d.defaclrole::regrole::text as creator_role,
           case when x.grantee = 0 then 'PUBLIC' else r.rolname end as grantee_role,
           x.privilege_type
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) x
    left join pg_roles r on r.oid = x.grantee
    where d.defaclnamespace = 'public'::regnamespace
      and d.defaclobjtype = 'r'
      and d.defaclrole = 'postgres'::regrole
      and (x.grantee = 0 or r.rolname in ('anon', 'authenticated'))
      and x.privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
  loop
    raise exception 'Creator role % still grants default % to % on public tables',
      t.creator_role, t.privilege_type, t.grantee_role;
  end loop;

  if exists (
    select 1
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relowner = 'supabase_admin'::regrole
      and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
    union all
    select 1
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proowner = 'supabase_admin'::regrole
  ) then
    raise exception 'supabase_admin owns objects in public; reserved default ACLs may apply';
  end if;

  if exists (
    select 1 from pg_extension
    where extnamespace = 'public'::regnamespace
  ) then
    raise exception 'An extension is installed in public; review its schema/ownership before accepting 0097';
  end if;
end
$$;
