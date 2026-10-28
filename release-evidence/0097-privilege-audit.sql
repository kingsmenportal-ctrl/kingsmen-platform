-- READ-ONLY pre/post audit for migration 0097.
-- Captures the exact pg_tables scope targeted by migration 0097 plus default ACLs.
-- Run before and after an independently approved application; no DDL is executed.

BEGIN TRANSACTION READ ONLY;

-- A) Non-DML privileges on the 230-table population targeted by migration 0097.
WITH target_roles(role_name) AS (
  VALUES ('anon'), ('authenticated')
), target_privileges(privilege_name) AS (
  VALUES ('TRUNCATE'), ('REFERENCES'), ('TRIGGER'), ('MAINTAIN')
)
SELECT t.schemaname AS schema_name, t.tablename AS table_name,
       r.role_name, p.privilege_name,
       has_table_privilege(r.role_name, format('%I.%I',t.schemaname,t.tablename), p.privilege_name) AS has_privilege
FROM pg_tables t
CROSS JOIN target_roles r
CROSS JOIN target_privileges p
WHERE t.schemaname='public'
ORDER BY t.tablename, r.role_name, p.privilege_name;

-- B) DML grants that must be preserved. Sort and compare pre vs post outputs.
SELECT t.schemaname AS schema_name, t.tablename AS table_name,
       r.rolname AS role_name,
       has_table_privilege(r.rolname,format('%I.%I',t.schemaname,t.tablename),'SELECT') AS can_select,
       has_table_privilege(r.rolname,format('%I.%I',t.schemaname,t.tablename),'INSERT') AS can_insert,
       has_table_privilege(r.rolname,format('%I.%I',t.schemaname,t.tablename),'UPDATE') AS can_update,
       has_table_privilege(r.rolname,format('%I.%I',t.schemaname,t.tablename),'DELETE') AS can_delete
FROM pg_tables t
CROSS JOIN pg_roles r
WHERE t.schemaname='public'
  AND r.rolname IN ('anon','authenticated')
ORDER BY t.tablename, r.rolname;

-- C) Direct PUBLIC grants on current public tables. Clients inherit PUBLIC grants;
-- expected count of any of these four privileges is zero after migration.
SELECT t.schemaname AS schema_name, t.tablename AS table_name,
       x.privilege_type, x.is_grantable
FROM pg_tables t
JOIN pg_class c ON c.relname=t.tablename
JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname=t.schemaname
CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r',c.relowner))) x
WHERE t.schemaname='public'
  AND x.grantee=0
  AND x.privilege_type IN ('TRUNCATE','REFERENCES','TRIGGER','MAINTAIN')
ORDER BY t.tablename, x.privilege_type;

-- D) Default ACLs for current public table creators.
SELECT owner.rolname AS owner_role,
       COALESCE(ns.nspname, '<all schemas>') AS schema_name,
       d.defaclobjtype,
       acl.grantee,
       CASE WHEN acl.grantee=0 THEN 'PUBLIC' ELSE grantee_role.rolname END AS grantee_name,
       acl.privilege_type, acl.is_grantable
FROM pg_default_acl d
JOIN pg_roles owner ON owner.oid=d.defaclrole
LEFT JOIN pg_namespace ns ON ns.oid=d.defaclnamespace
CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
LEFT JOIN pg_roles grantee_role ON grantee_role.oid=acl.grantee
WHERE owner.rolname IN ('postgres','supabase_admin')
  AND (ns.nspname='public' OR d.defaclnamespace=0)
ORDER BY owner_role, schema_name, d.defaclobjtype, grantee_name, acl.privilege_type;

-- E) Exact raw ACLs for object-level diagnosis.
SELECT t.schemaname AS schema_name, t.tablename AS table_name,
       pg_get_userbyid(c.relowner) AS owner_name, c.relacl
FROM pg_tables t
JOIN pg_class c ON c.relname=t.tablename
JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname=t.schemaname
WHERE t.schemaname='public'
ORDER BY t.tablename;

ROLLBACK;

-- Acceptance after 0097:
-- 1. Section A has no TRUE result for either role/any targeted privilege.
-- 2. Section C returns zero rows (no direct PUBLIC grants).
-- 3. Section D has no PUBLIC/anon/authenticated grant of any four privileges
--    on future public tables for either creator role.
-- 4. Section B is identical pre/post after canonical sorting (DML preserved).
-- 5. Any unexpected delta is a release blocker. Never blanket-regrant ACLs.
