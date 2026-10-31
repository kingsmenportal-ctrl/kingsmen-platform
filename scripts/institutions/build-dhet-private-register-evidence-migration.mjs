#!/usr/bin/env node
import fs from "node:fs";
const allowedStatuses=new Set(["REGISTERED","PROVISIONAL","CANCELLED","LAPSED","WITHDRAWN_OR_DEREGISTERED_REVIEW","STATUS_UNRESOLVED"]);
const quote=v=>v==null?"NULL":"'"+String(v).replace(/'/g,"''")+"'";
const json=v=>quote(JSON.stringify(v??[]))+"::jsonb";
export function validateManifest(m){
 const errors=[];
 if(m?.schema!=="kingsmen.institutions.dhet-private-register-candidates.v1")errors.push("unsupported manifest schema");
 if(!Array.isArray(m.records)||!m.records.length)errors.push("records must be non-empty");
 const seen=new Set(),regIds=new Map();
 for(const [i,r] of (m.records??[]).entries()){
  for(const k of ["source_record_ref","source_register","source_snapshot_date","canonical_name_candidate","normalized_name_key","source_url","registration_status"])if(!r[k])errors.push("record "+i+" missing "+k);
  if(!allowedStatuses.has(r.registration_status))errors.push("record "+i+" has unsupported registration status");
  if(!/^https:\/\/www\.dhet\.gov\.za\//.test(r.source_url??""))errors.push("record "+i+" lacks official DHET source URL");
  if(r.official_route_status!=="NOT_VERIFIED"||r.integration_status!=="NOT_CONNECTED"||r.automation_authorized!==false)errors.push("record "+i+" has unsafe route/integration state");
  const key=[r.source_register,r.source_snapshot_date,r.source_record_ref].join("|");
  if(seen.has(key))errors.push("duplicate snapshot source key "+key);seen.add(key);
  if(r.registration_identifier){const ik=[r.source_register,r.source_snapshot_date,r.registration_identifier].join("|");const prior=regIds.get(ik);if(prior&&prior!==r.normalized_name_key)errors.push("registration identifier maps to conflicting normalized names: "+ik);regIds.set(ik,r.normalized_name_key);}
 }
 return errors;
}
export function buildMigration(m){
 const errors=validateManifest(m);if(errors.length)throw Error(errors.join("\n"));
 const rows=m.records.map(r=>"  ("+[quote(r.source_register),quote(r.source_snapshot_date)+"::date",quote(r.source_record_ref),quote(r.canonical_name_candidate),quote(r.normalized_name_key),quote(r.registration_identifier),quote(r.registration_status),json(r.province_candidates),json(r.alias_candidates),quote(r.source_url),quote(r.source_excerpt)].join(", ")+")").join(",\n");
 return `-- Generated from a reviewed DHET register candidate manifest. Do not apply without independent review and approved change control.
-- Registry evidence only; this migration does not create application routes or mark providers connected.
BEGIN;
CREATE TABLE IF NOT EXISTS public.private_institution_registry_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_register text NOT NULL CHECK (source_register IN ('private_higher_education','private_colleges')),
 source_snapshot_date date NOT NULL,
 source_record_ref text NOT NULL,
 canonical_name_candidate text NOT NULL,
 normalized_name_key text NOT NULL,
 registration_identifier text,
 registration_status text NOT NULL CHECK (registration_status IN ('REGISTERED','PROVISIONAL','CANCELLED','LAPSED','WITHDRAWN_OR_DEREGISTERED_REVIEW','STATUS_UNRESOLVED')),
 province_candidates jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(province_candidates)='array'),
 alias_candidates jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(alias_candidates)='array'),
 source_url text NOT NULL CHECK (source_url LIKE 'https://www.dhet.gov.za/%'),
 source_excerpt text NOT NULL,
 canonical_provider_key text,
 identity_review_status text NOT NULL DEFAULT 'NEEDS_CANONICAL_IDENTITY_REVIEW',
 official_route_status text NOT NULL DEFAULT 'NOT_VERIFIED',
 integration_status text NOT NULL DEFAULT 'NOT_CONNECTED',
 automation_authorized boolean NOT NULL DEFAULT false,
 imported_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(source_register,source_snapshot_date,source_record_ref)
);
CREATE INDEX IF NOT EXISTS idx_private_registry_registration_id ON public.private_institution_registry_entries(source_register,registration_identifier) WHERE registration_identifier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_private_registry_normalized_name ON public.private_institution_registry_entries(normalized_name_key);
CREATE TEMP TABLE _dhet_private_registry_stage ON COMMIT DROP AS
SELECT * FROM (VALUES
${rows}
) AS v(source_register,source_snapshot_date,source_record_ref,canonical_name_candidate,normalized_name_key,registration_identifier,registration_status,province_candidates,alias_candidates,source_url,source_excerpt);
DO $preflight$
BEGIN
 IF EXISTS (SELECT 1 FROM _dhet_private_registry_stage GROUP BY source_register,source_snapshot_date,source_record_ref HAVING count(*)>1) THEN
  RAISE EXCEPTION 'DHET_REGISTER_DUPLICATE_SOURCE_KEY';
 END IF;
 IF EXISTS (SELECT 1 FROM _dhet_private_registry_stage WHERE registration_identifier IS NOT NULL GROUP BY source_register,source_snapshot_date,registration_identifier HAVING count(DISTINCT normalized_name_key)>1) THEN
  RAISE EXCEPTION 'DHET_REGISTER_REGISTRATION_IDENTITY_CONFLICT';
 END IF;
 IF EXISTS (
  SELECT 1 FROM _dhet_private_registry_stage s JOIN public.private_institution_registry_entries t
   USING(source_register,source_snapshot_date,source_record_ref)
  WHERE t.registration_identifier IS DISTINCT FROM s.registration_identifier
     OR t.normalized_name_key IS DISTINCT FROM s.normalized_name_key
 ) THEN RAISE EXCEPTION 'DHET_REGISTER_EXISTING_CANONICAL_IDENTITY_CONFLICT'; END IF;
END
$preflight$;
INSERT INTO public.private_institution_registry_entries
 (source_register,source_snapshot_date,source_record_ref,canonical_name_candidate,normalized_name_key,registration_identifier,registration_status,province_candidates,alias_candidates,source_url,source_excerpt,identity_review_status,official_route_status,integration_status,automation_authorized)
SELECT source_register,source_snapshot_date,source_record_ref,canonical_name_candidate,normalized_name_key,registration_identifier,registration_status,province_candidates,alias_candidates,source_url,source_excerpt,'NEEDS_CANONICAL_IDENTITY_REVIEW','NOT_VERIFIED','NOT_CONNECTED',false
FROM _dhet_private_registry_stage
ON CONFLICT(source_register,source_snapshot_date,source_record_ref) DO UPDATE SET
 province_candidates=EXCLUDED.province_candidates,
 alias_candidates=EXCLUDED.alias_candidates,
 source_excerpt=EXCLUDED.source_excerpt,
 registration_status=EXCLUDED.registration_status,
 source_url=EXCLUDED.source_url
WHERE public.private_institution_registry_entries.registration_identifier IS NOT DISTINCT FROM EXCLUDED.registration_identifier
 AND public.private_institution_registry_entries.normalized_name_key=EXCLUDED.normalized_name_key;
DO $postflight$
BEGIN
 IF EXISTS (SELECT 1 FROM public.private_institution_registry_entries WHERE official_route_status<>'NOT_VERIFIED' OR integration_status<>'NOT_CONNECTED' OR automation_authorized IS TRUE) THEN
  RAISE EXCEPTION 'DHET_REGISTER_ROUTE_SAFETY_POSTFLIGHT_FAILED';
 END IF;
 IF EXISTS (SELECT 1 FROM _dhet_private_registry_stage s LEFT JOIN public.private_institution_registry_entries t USING(source_register,source_snapshot_date,source_record_ref) WHERE t.id IS NULL) THEN
  RAISE EXCEPTION 'DHET_REGISTER_IMPORT_POSTFLIGHT_MISSING_RECORD';
 END IF;
END
$postflight$;
COMMIT;
`;
}
if(process.argv.includes("--self-test")){
 const base={source_register:"private_colleges",source_snapshot_date:"2026-07-15",source_record_ref:"private_colleges:2020/FE07/117",canonical_name_candidate:"Example College",normalized_name_key:"example-college",registration_identifier:"2020/FE07/117",registration_status:"CANCELLED",province_candidates:["Limpopo"],alias_candidates:[],source_url:"https://www.dhet.gov.za/Registers_DocLib/example.pdf",source_excerpt:"Example College, 2020/FE07/117",official_route_status:"NOT_VERIFIED",integration_status:"NOT_CONNECTED",automation_authorized:false};
 const m={schema:"kingsmen.institutions.dhet-private-register-candidates.v1",records:[base]};
 if(validateManifest(m).length)throw Error("valid fixture rejected");
 const sql=buildMigration(m);
 for(const x of ["BEGIN;","ON CONFLICT(source_register,source_snapshot_date,source_record_ref) DO UPDATE","DHET_REGISTER_REGISTRATION_IDENTITY_CONFLICT","NOT_VERIFIED","NOT_CONNECTED","DHET_REGISTER_ROUTE_SAFETY_POSTFLIGHT_FAILED"])if(!sql.includes(x))throw Error("migration missing "+x);
 const bad={...m,records:[base,{...base,source_record_ref:"different-ref",canonical_name_candidate:"Other Name",normalized_name_key:"other-name"}]};
 if(!validateManifest(bad).some(x=>x.includes("conflicting normalized names")))throw Error("conflict check failed");
 console.log("PASS DHET idempotent evidence-migration generator self-test");
}else{
 const args=Object.fromEntries(process.argv.slice(2).map((x,i,a)=>x.startsWith("--")?[x.slice(2),a[i+1]]:null).filter(Boolean));
 if(!args.manifest||!args.out)throw Error("Usage: node scripts/institutions/build-dhet-private-register-evidence-migration.mjs --manifest reviewed.json --out migration.sql");
 const manifest=JSON.parse(fs.readFileSync(args.manifest,"utf8"));fs.writeFileSync(args.out,buildMigration(manifest));console.log("Wrote idempotent registry-evidence migration; no database changes were made.");
}
