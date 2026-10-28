-- READ-ONLY pre/post audit for migration 0097.
-- Run before and after an approved application, capture both outputs and compare.
-- Does not apply or roll back the migration.

BEGIN TRANSACTION READ ONLY;

-- A) Current public tables: non-DML privileges that 0097 intends to revoke.
WITH target_roles(role_name) AS (
  VALUES ('anon'), ('authenticated')
), target_privileges(privilege_name) AS (
  VALUES ('TRUNCATE'), ('REFERENCES'), ('TRIGGER'), ('MAINTAIN')
)
SELECT n.nspname AS schema_name, c.relname AS table_name,
       r.role_name, p.privilege_name,
       has_table_privilege(r.role_name, c.oid, p.privilege_name) AS has_privilege
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN target_roles r
CROSS JOIN target_privileges p
WHERE n.nspname='public'
  AND c.relkind IN ('r','p','v','m','f')
ORDER BY c.relname, r.role_name, p.privilege_name;

-- B) Preserve and compare intended DML privileges independently.
SELECT n.nspname AS schema_name, c.relname AS object_name,
       r.rolname AS role_name,
       has_table_privilege(r.rolname,c.oid,'SELECT') AS can_select,
       has_table_privilege(r.rolname,c.oid,'INSERT') AS can_insert,
       has_table_privilege(r.rolname,c.oid,'UPDATE') AS can_update,
       has_table_privilege(r.rolname,c.oid,'DELETE') AS can_delete
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN pg_roles r
WHERE n.nspname='public'
  AND c.relkind IN ('r','p','v','m','f')
  AND r.rolname IN ('anon','authenticated')
ORDER BY c.relname, r.rolname;

-- C) Default ACLs for postgres and supabase_admin in public.
-- Check both roles exist before interpreting empty output.
SELECT owner.rolname AS owner_role,
       COALESCE(ns.nspname, '<all schemas>') AS schema_name,
       d.defaclobjtype,
       acl.grantee,
       CASE WHEN acl.grantee=0 THEN 'PUBLIC'
            ELSE grantee_role.rolname END AS grantee_name,
       acl.privilege_type, acl.is_grantable
FROM pg_default_acl d
JOIN pg_roles owner ON owner.oid=d.defaclrole
LEFT JOIN pg_namespace ns ON ns.oid=d.defaclnamespace
CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
LEFT JOIN pg_roles grantee_role ON grantee_role.oid=acl.grantee
WHERE owner.rolname IN ('postgres','supabase_admin')
  AND (ns.nspname='public' OR d.defaclnamespace=0)
ORDER BY owner_role, schema_name, d.defaclobjtype, grantee_name, acl.privilege_type;

-- D) Explicit table ACLs; useful to explain privilege results.
SELECT n.nspname AS schema_name, c.relname AS object_name,
       pg_get_userbyid(c.relowner) AS owner_name,
       c.relacl
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public'
  AND c.relkind IN ('r','p','v','m','f')
ORDER BY c.relname;

ROLLBACK;

-- Acceptance after reviewed 0097:
-- 1. No anon/authenticated has TRUNCATE, REFERENCES, TRIGGER or MAINTAIN on targeted objects.
-- 2. DML grants match approved pre-change baseline; do not blanket-revoke SELECT/INSERT/UPDATE/DELETE.
-- 3. Default ACL results match the migration's intended scope for postgres and supabase_admin.
-- 4. Any mismatch is a release blocker; do not restore ACLs blindly. Use a reviewed corrective migration.