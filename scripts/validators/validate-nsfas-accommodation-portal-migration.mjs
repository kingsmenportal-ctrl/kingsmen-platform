import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pathName = "db/migrations/0104_seed_nsfas_accommodation_portal_provider.sql";
const sql = fs.existsSync(path.join(root,pathName)) ? fs.readFileSync(path.join(root,pathName),"utf8") : "";
const manifest = JSON.parse(fs.readFileSync(path.join(root,"manifests/institutions/cross-sector-institution-source-extension.json"),"utf8"));
const edge = fs.readFileSync(path.join(root,"supabase/functions/candidate-application-preparation/index.ts"),"utf8");
const page = fs.readFileSync(path.join(root,"apps/web/src/app/candidate/institutions/page.tsx"),"utf8");
const errors=[];
const check=(name,ok)=>{console.log((ok?"PASS ":"FAIL ")+name);if(!ok)errors.push(name);};
const source=manifest.sources.find(row=>row.source_id==="nsfas_accommodation_directory");

check("NSFAS accommodation provider is represented by the official portal source anchor", Boolean(source) && source.provider_key==="nsfas_accommodation_portal" && source.url==="https://profprod.nsfas.org.za/accommodations");
check("migration is transaction-wrapped and declares the exact official portal source authority", /^BEGIN;/m.test(sql) && /COMMIT;\s*$/.test(sql) && sql.includes("nsfas_student_accommodation_portal") && sql.includes("https://profprod.nsfas.org.za/"));
check("canonical provider seed is one accommodation portal row and not a property catalogue", sql.includes("'nsfas_accommodation_portal'") && sql.includes("'ACCOMMODATION_PROVIDER'") && !/INSERT\s+INTO\s+public\.(route_programmes|opportunity_programmes|opportunity_deadlines)/i.test(sql));
check("portal provider is review-only, D confidence and not public-safe or connected", sql.includes("'NEEDS_REVIEW'") && sql.includes("'D'") && sql.includes("public_safe,") && sql.includes("'NOT_CONNECTED'") && sql.includes("'NOT_A_PARTNER'"));
check("migration explicitly records no Kingsmen portal submission authority", sql.includes("'provider_submission_supported_by_kingsmen', false") && sql.includes("'automation_authorized', false") && sql.includes("'provider_receipt_supported', false"));
check("candidate directory maps the route as accommodation and exposes a Kingsmen planning path", page.includes("nsfas_accommodation_directory") && page.includes("ACCOMMODATION_PROVIDER") && page.includes("Prepare with Kingsmen"));
check("Edge planner restricts the NSFAS portal to higher-education and TVET planning", edge.includes('nsfas_accommodation_portal:["HIGHER_EDUCATION","TVET"]'));
check("migration is idempotent without overwriting provider/reviewer state", sql.includes("ON CONFLICT (source_key) DO NOTHING") && sql.includes("ON CONFLICT (provider_key) DO NOTHING") && !/UPDATE\s+public\.route_providers/i.test(sql));

if(errors.length){console.error("NSFAS accommodation portal migration validation FAILED: "+errors.length+" checks");process.exit(1);}
console.log("NSFAS accommodation portal migration validation PASSED: official external portal only, no property claims or Kingsmen submission.");
