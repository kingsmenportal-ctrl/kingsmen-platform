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
  for(const k of ["source_record_ref","source_register","source_snapshot_date","canonical_name_candidate","normalized_name_key","source_url","source_excerpt","registration_status","registration_identifier"])if(!r[k])errors.push("record "+i+" missing "+k);
  if(!allowedStatuses.has(r.registration_status))errors.push("record "+i+" has unsupported registration status");
  if(!Array.isArray(r.registration_identifiers_observed)||r.registration_identifiers_observed.length!==1)errors.push("record "+i+" must have exactly one registration identifier");
  if(r.registration_identifier!==r.registration_identifiers_observed?.[0])errors.push("record "+i+" has inconsistent registration identifier fields");
  if(r.identity_conflict_status==="CONFLICT_REVIEW_REQUIRED"||r.identity_conflict_status==="DUPLICATE_SOURCE_ENTRY_REVIEW"||(r.conflict_flags??[]).length)errors.push("record "+i+" has unresolved registration identity/status conflict");
  if(r.registration_status_review_required===true)errors.push("record "+i+" has unresolved registration status requiring manual adjudication");

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
 const rows=m.records.map(r=>"  ("+[quote(r.source_register),quote(r.source_snapshot_date)+"::date",quote(r.source_record_ref),quote(r.canonical_name_candidate),quote(r.normalized_name_key),quote(r.registration_identifier),quote(r.registration_status),json(r.registration_identifiers_observed),quote(r.registration_status_review_required===true?"true":"false"),json(r.province_candidates),quote(r.province_status??"NOT_EXTRACTED"),json(r.campus_site_candidates),quote(r.campus_extraction_status??"MANUAL_REVIEW_REQUIRED"),json(r.alias_candidates),json(r.possible_existing_provider_matches),quote(r.alias_reconciliation_status??"MANUAL_REVIEW_REQUIRED"),quote(r.identity_conflict_status??"NO_CONFLICT_DETECTED_REVIEW_STILL_REQUIRED"),json(r.conflict_flags),quote(r.source_url),quote(r.source_excerpt)].join(", ")+")").join(",\n");
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
 registration_identifiers_observed jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(registration_identifiers_observed)='array'),
 registration_status_review_required boolean NOT NULL DEFAULT true,
 province_candidates jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(province_candidates)='array'),
 province_status text NOT NULL DEFAULT 'NOT_EXTRACTED',
 campus_site_candidates jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(campus_site_candidates)='array'),
 campus_extraction_status text NOT NULL DEFAULT 'MANUAL_REVIEW_REQUIRED',
 alias_candidates jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(alias_candidates)='array'),
 possible_existing_provider_matches jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(possible_existing_provider_matches)='array'),
 alias_reconciliation_status text NOT NULL DEFAULT 'MANUAL_REVIEW_REQUIRED',
 identity_conflict_status text NOT NULL DEFAULT 'NEEDS_CANONICAL_IDENTITY_REVIEW',
 conflict_flags jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(conflict_flags)='array'),
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
ALTER TABLE public.private_institution_registry_entries ADD COLUMN IF NOT EXISTS registration_identifiers_observed jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.private_institution_registry_entries ADD COLUMN IF NOT EXISTS registration_status_review_required boolean NOT NULL DEFAULT true;
ALTER TABLE public.private_institution_registry_entries ADD COLUMN IF NOT EXISTS province_status text NOT NULL DEFAULT 'NOT_EXTRACTED';
ALTER TABLE public.private_institution_registry_entries ADD COLUMN IF NOT EXISTS campus_site_candidates jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.private_institution_registry_entries ADD COLUMN IF NOT EXISTS campus_extraction_status text NOT NULL DEFAULT 'MANUAL_REVIEW_REQUIRED';
ALTER TABLE public.private_institution_registry_entries ADD COLUMN IF NOT EXISTS identity_conflict_status text NOT NULL DEFAULT 'NEEDS_CANONICAL_IDENTITY_REVIEW';
ALTER TABLE public.private_institution_registry_entries ADD COLUMN IF NOT EXISTS conflict_flags jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_private_registry_registration_id ON public.private_institution_registry_entries(source_register,registration_identifier) WHERE registration_identifier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_private_registry_normalized_name ON public.private_institution_registry_entries(normalized_name_key);
CREATE TEMP TABLE _dhet_private_registry_stage ON COMMIT DROP AS
SELECT * FROM (VALUES
${rows}
) AS v(source_register,source_snapshot_date,source_record_ref,canonical_name_candidate,normalized_name_key,registration_identifier,registration_status,registration_identifiers_observed,registration_status_review_required,province_candidates,province_status,campus_site_candidates,campus_extraction_status,alias_candidates,possible_existing_provider_matches,alias_reconciliation_status,identity_conflict_status,conflict_flags,source_url,source_excerpt);
DO $preflight$
BEGIN
 IF EXISTS (SELECT 1 FROM _dhet_private_registry_stage GROUP BY source_register,source_snapshot_date,source_record_ref HAVING count(*)>1) THEN
  RAISE EXCEPTION 'DHET_REGISTER_DUPLICATE_SOURCE_KEY';
 END IF;
 IF EXISTS (SELECT 1 FROM _dhet_private_registry_stage WHERE registration_identifier IS NOT NULL GROUP BY source_register,source_snapshot_date,registration_identifier HAVING count(DISTINCT normalized_name_key)>1) THEN
  RAISE EXCEPTION 'DHET_REGISTER_REGISTRATION_IDENTITY_CONFLICT';
 END IF;
 IF EXISTS (SELECT 1 FROM _dhet_private_registry_stage WHERE registration_identifier IS NOT NULL GROUP BY source_register,source_snapshot_date,registration_identifier HAVING count(DISTINCT registration_status)>1) THEN
  RAISE EXCEPTION 'DHET_REGISTER_REGISTRATION_STATUS_CONFLICT';
 END IF;
 IF EXISTS (SELECT 1 FROM _dhet_private_registry_stage WHERE jsonb_array_length(registration_identifiers_observed)<>1 OR registration_status_review_required IS TRUE OR identity_conflict_status='CONFLICT_REVIEW_REQUIRED' OR jsonb_array_length(conflict_flags)>0) THEN
  RAISE EXCEPTION 'DHET_REGISTER_UNRESOLVED_RECORD_CONFLICT';
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
 (source_register,source_snapshot_date,source_record_ref,canonical_name_candidate,normalized_name_key,registration_identifier,registration_status,registration_identifiers_observed,registration_status_review_required,province_candidates,province_status,campus_site_candidates,campus_extraction_status,alias_candidates,possible_existing_provider_matches,alias_reconciliation_status,identity_conflict_status,conflict_flags,source_url,source_excerpt,identity_review_status,official_route_status,integration_status,automation_authorized)
SELECT source_register,source_snapshot_date,source_record_ref,canonical_name_candidate,normalized_name_key,registration_identifier,registration_status,registration_identifiers_observed,registration_status_review_required,province_candidates,province_status,campus_site_candidates,campus_extraction_status,alias_candidates,possible_existing_provider_matches,alias_reconciliation_status,identity_conflict_status,conflict_flags,source_url,source_excerpt,'NEEDS_CANONICAL_IDENTITY_REVIEW','NOT_VERIFIED','NOT_CONNECTED',false
FROM _dhet_private_registry_stage
ON CONFLICT(source_register,source_snapshot_date,source_record_ref) DO UPDATE SET
 registration_identifiers_observed=EXCLUDED.registration_identifiers_observed,
 registration_status_review_required=EXCLUDED.registration_status_review_required,
 province_candidates=EXCLUDED.province_candidates,
 province_status=EXCLUDED.province_status,
 campus_site_candidates=EXCLUDED.campus_site_candidates,
 campus_extraction_status=EXCLUDED.campus_extraction_status,
 alias_candidates=EXCLUDED.alias_candidates,
 possible_existing_provider_matches=EXCLUDED.possible_existing_provider_matches,
 alias_reconciliation_status=EXCLUDED.alias_reconciliation_status,
 identity_conflict_status=EXCLUDED.identity_conflict_status,
 conflict_flags=EXCLUDED.conflict_flags,
 source_excerpt=EXCLUDED.source_excerpt,
 registration_status=EXCLUDED.registration_status,
 source_url=EXCLUDED.source_url
WHERE public.private_institution_registry_entries.registration_identifier IS NOT DISTINCT FROM EXCLUDED.registration_identifier
 AND public.private_institution_registry_entries.normalized_name_key=EXCLUDED.normalized_name_key;
DO $postflight$
BEGIN
 IF EXISTS (
  SELECT required.column_name FROM (VALUES
   ('registration_identifiers_observed'),('registration_status_review_required'),('province_status'),
   ('campus_site_candidates'),('campus_extraction_status'),('identity_conflict_status'),('conflict_flags')
  ) required(column_name)
  WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name='private_institution_registry_entries' AND c.column_name=required.column_name)
 ) THEN RAISE EXCEPTION 'DHET_REGISTER_SCHEMA_POSTFLIGHT_FAILED'; END IF;
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
 const base={source_register:"private_colleges",source_snapshot_date:"2026-07-15",source_record_ref:"private_colleges:section-a:001:2020/fe07/117",canonical_name_candidate:"Example College",normalized_name_key:"example-college",registration_identifier:"2020/FE07/117",registration_identifiers_observed:["2020/FE07/117"],registration_status:"CANCELLED",registration_status_review_required:false,province_candidates:["Limpopo"],province_status:"SOURCE_LISTED_CANDIDATE",campus_site_candidates:["Makotse Road, Zebediela"],campus_extraction_status:"REVIEW_REQUIRED",alias_candidates:[],possible_existing_provider_matches:[],alias_reconciliation_status:"NO_EXACT_MATCH_FOUND_STILL_REQUIRES_MANUAL_REVIEW",identity_conflict_status:"NO_CONFLICT_DETECTED_REVIEW_STILL_REQUIRED",conflict_flags:[],source_url:"https://www.dhet.gov.za/Registers_DocLib/example.pdf",source_excerpt:"Example College, 2020/FE07/117",official_route_status:"NOT_VERIFIED",integration_status:"NOT_CONNECTED",automation_authorized:false};
 const m={schema:"kingsmen.institutions.dhet-private-register-candidates.v1",records:[base]};
 if(validateManifest(m).length)throw Error("valid fixture rejected");
 const sql=buildMigration(m);
 for(const x of ["BEGIN;","ON CONFLICT(source_register,source_snapshot_date,source_record_ref) DO UPDATE","DHET_REGISTER_REGISTRATION_IDENTITY_CONFLICT","NOT_VERIFIED","NOT_CONNECTED","DHET_REGISTER_ROUTE_SAFETY_POSTFLIGHT_FAILED"])if(!sql.includes(x))throw Error("migration missing "+x);
 const bad={...m,records:[base,{...base,source_record_ref:"different-ref",canonical_name_candidate:"Other Name",normalized_name_key:"other-name"}]};
 if(!validateManifest(bad).some(x=>x.includes("conflicting normalized names")))throw Error("conflict check failed");
 const unresolved={...m,records:[{...base,identity_conflict_status:"CONFLICT_REVIEW_REQUIRED",conflict_flags:["REGISTRATION_IDENTIFIER_REUSED_WITH_DIFFERENT_NAME"]}]};
 if(!validateManifest(unresolved).some(x=>x.includes("unresolved registration identity/status conflict")))throw Error("unresolved identity conflict was not blocked");
 const multi={...m,records:[{...base,registration_identifiers_observed:["2020/FE07/117","2021/FE07/118"]}]};
 if(!validateManifest(multi).some(x=>x.includes("exactly one registration identifier")))throw Error("multiple registration identifiers were not blocked");
 console.log("PASS DHET idempotent evidence-migration generator self-test");
}else{
 const args=Object.fromEntries(process.argv.slice(2).map((x,i,a)=>x.startsWith("--")?[x.slice(2),a[i+1]]:null).filter(Boolean));
 if(!args.manifest||!args.out)throw Error("Usage: node scripts/institutions/build-dhet-private-register-evidence-migration.mjs --manifest reviewed.json --out migration.sql");
 const manifest=JSON.parse(fs.readFileSync(args.manifest,"utf8"));fs.writeFileSync(args.out,buildMigration(manifest));console.log("Wrote idempotent registry-evidence migration; no database changes were made.");
}
