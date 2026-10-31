import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests/institutions/cross-sector-institution-source-extension.json"),"utf8"));
const migrationPath=path.join(root,"db/migrations/0105_seed_gcis_public_entity_profiles.sql");
const sql=fs.existsSync(migrationPath)?fs.readFileSync(migrationPath,"utf8"):"";
const errors=[];
const check=(name,ok)=>{console.log((ok?"PASS ":"FAIL ")+name);if(!ok)errors.push(name);};
const profiles=(manifest.sources??[]).filter(s=>s.metadata?.gcis_profile_url||s.metadata?.official_gcis_profile_url);
const urls=profiles.map(s=>s.metadata.gcis_profile_url||s.metadata.official_gcis_profile_url);
const keys=profiles.map(s=>s.provider_key);
const start=sql.indexOf("WITH provider_seed(");
const end=sql.indexOf("),\nsource_linked AS",start);
const seedBlock=start>=0&&end>start?sql.slice(start,end):"";

check("manifest contains exactly 123 individual GCIS profile records",profiles.length===123);
check("all 123 GCIS URLs and canonical provider keys are unique",new Set(urls).size===123&&new Set(keys).size===123&&keys.every(Boolean));
check("0105 migration exists and is wrapped in a transaction",/^BEGIN;/m.test(sql)&&/COMMIT;\s*$/.test(sql));
check("migration uses the official GCIS directory source authority",sql.includes("gcis_public_entities_and_soe_directory")&&sql.includes("https://www.gov.za/about-government/contact-directory/soe-s"));
check("the seed block contains every provider key from the manifest",profiles.every(s=>seedBlock.includes("("+String.fromCharCode(39)+s.provider_key+String.fromCharCode(39)+",")));
check("new provider records default to confidence D, NEEDS_REVIEW and public_safe false",sql.includes("'D','NEEDS_REVIEW',false,false"));
check("vacancy/programme/eligibility/application route and connector states stay unverified",["'vacancy_status','UNKNOWN'","'programme_status','UNKNOWN'","'intake_status','UNKNOWN'","'eligibility_status','UNKNOWN'","'application_route_status','NOT_VERIFIED'","'integration_status','NOT_CONNECTED'","'partnership_status','NOT_A_PARTNER'"].every(x=>sql.includes(x)));
check("provider submission, receipt and automation remain disabled",["'provider_submission_supported_by_kingsmen',false","'provider_receipt_supported',false","'automation_authorized',false"].every(x=>sql.includes(x)));
const conflictStart=sql.indexOf("ON CONFLICT (provider_key) DO UPDATE");
const postflightStart=sql.indexOf("DO $postflight$",conflictStart);
const conflictClause=conflictStart>=0&&postflightStart>conflictStart?sql.slice(conflictStart,postflightStart):"";
check("canonical provider-key conflicts append distinct provider source evidence",conflictClause.includes("provider_source_evidence")&&conflictClause.includes("jsonb_array_elements")&&conflictClause.includes("UNION"));
check("canonical provider-key conflicts merge institution classes deterministically",conflictClause.includes("'{institution_classes}'")&&conflictClause.includes("jsonb_array_elements_text")&&conflictClause.includes("SELECT DISTINCT"));
check("existing provider identity, source authority, confidence and verification decisions are preserved",!/\b(?:provider_name|provider_type|province|base_url|source_authority_id|default_confidence_band|verification_status|public_safe|private_provider_requires_accreditation_check)\s*=/.test(conflictClause));
check("inserted source evidence preserves source authority, profile URL, source ID and snapshot date",["'provider_source_evidence'","'source_authority_id'","'source_profile_url'","'source_id'","'source_snapshot_date'"].every(x=>sql.includes(x)));
check("postflight proves all 123 source evidence rows and institution-class metadata",sql.includes("GCIS_PUBLIC_ENTITY_SOURCE_EVIDENCE_COUNT_MISMATCH")&&sql.includes("GCIS_PUBLIC_ENTITY_CLASS_METADATA_MISSING"));
check("postflight checks all 123 unique provider records",sql.includes("expected_count integer := 123")&&sql.includes("GCIS_PUBLIC_ENTITY_PROVIDER_SEED_COUNT_MISMATCH")&&sql.includes("GCIS_PUBLIC_ENTITY_PROVIDER_DUPLICATE_KEYS"));

if(errors.length){console.error("GCIS 123-profile import validator FAILED: "+errors.length+" checks");process.exit(1);}
console.log("GCIS 123-profile import validator PASSED: all profiles included, review-only, no vacancy or integration claim.");
