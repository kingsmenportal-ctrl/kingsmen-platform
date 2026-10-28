-- Run after migration 0097 in staging. Fails closed if a client role retains a non-DML privilege.
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
end
$$;
