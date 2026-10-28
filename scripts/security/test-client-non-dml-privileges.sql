-- Run after migration 0097 in staging. Fails closed if current grants or creator defaults retain client non-DML privileges.
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

  -- Default ACLs are independent of current table ACLs. Check each public-table creator context.
  for t in
    select d.defaclrole::regrole::text as creator_role,
           r.rolname as grantee_role,
           x.privilege_type
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) x
    join pg_roles r on r.oid = x.grantee
    where d.defaclnamespace = 'public'::regnamespace
      and d.defaclobjtype = 'r'
      and r.rolname in ('anon', 'authenticated')
      and x.privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
  loop
    raise exception 'Creator role % still grants default % to % on public tables',
      t.creator_role, t.privilege_type, t.grantee_role;
  end loop;
end
$$;
