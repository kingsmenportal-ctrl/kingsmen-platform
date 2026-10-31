import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifests/institutions/cross-sector-institution-source-extension.json"),"utf8"));
const migrationPath=path.join(root,"db/migrations/0106_seed_dpsa_and_private_employer_career_providers.sql");
const sql=fs.existsSync(migrationPath)?fs.readFileSync(migrationPath,"utf8"):"";
const errors=[];
const check=(name,ok)=>{console.log((ok?"PASS ":"FAIL ")+name);if(!ok)errors.push(name);};
const expected=[
 ["dpsa_public_service_vacancies","https://www.dpsa.gov.za/newsroom/psvc/"],
 ["private_employer_pepkor","https://pepkor.co.za/careers/"],
 ["private_employer_sasol","https://www.sasol.com/careers/"],
 ["private_employer_woolworths","https://careers.woolworths.co.za/applicant/index.php?controller=Page&name=jobsearch"],
 ["private_employer_mr_price","https://mrpricegroup.com/careers/"],
 ["private_employer_vodafone","https://careers.vodafone.com/"],
 ["private_employer_pepsico_sa","https://www.pepsicojobs.com/southafrica/"],
 ["private_employer_nedbank","https://jobs.nedbank.co.za/"],
 ["private_employer_clicks_group","https://careers.clicksgroup.co.za/"],
 ["private_employer_tfg","https://tfglimited.co.za/careers/"],
 ["private_employer_standard_bank","https://www.standardbank.com/careers/"]
];
const seedStart=sql.indexOf("WITH provider_seed(");
const seedEnd=sql.indexOf("),\nsource_linked AS",seedStart);
const seed=seedStart>=0&&seedEnd>seedStart?sql.slice(seedStart,seedEnd):"";
check("manifest contains DPSA and ten official private-employer providers",expected.every(([key,url])=>manifest.sources.some(s=>s.provider_key===key&&s.url===url)));
check("migration is transaction wrapped and imports exactly 11 canonical provider keys",/^BEGIN;/m.test(sql)&&/COMMIT;\s*$/.test(sql)&&expected.length===11&&expected.every(([key])=>seed.includes("('"+key+"',")));
check("DPSA remains a government authority while private organisations remain employers",sql.includes("'GOVERNMENT_AUTHORITY'")&&sql.includes("'EMPLOYER'"));
check("each provider is backed by an official source-authority row and external career portal URL",sql.includes("ON CONFLICT (source_key) DO NOTHING")&&sql.includes("official_external_career_portal"));
check("all new provider rows stay D-confidence, NEEDS_REVIEW and private",sql.includes("'D','NEEDS_REVIEW',false,false")&&sql.includes("EMPLOYER_CAREER_PROVIDER_REVIEW_STATE_INVALID"));
check("current vacancy, programme, intake and eligibility states remain unknown",["vacancy_status','UNKNOWN_UNTIL_EXACT_LIVE_NOTICE_CHECK","programme_status','UNKNOWN","intake_status','UNKNOWN","eligibility_status','UNKNOWN","application_route_status','OFFICIAL_EXTERNAL_PORTAL_NOT_CONNECTED"].every(x=>sql.includes(x)));
check("Kingsmen is not authorised to automate, submit or claim a receipt",["integration_status','NOT_CONNECTED","partnership_status','NOT_A_PARTNER","automation_authorized',false","provider_submission_supported_by_kingsmen',false","provider_receipt_supported',false"].every(x=>sql.includes(x)));
check("provider collisions never overwrite an existing route or reviewer decision",sql.includes("ON CONFLICT (provider_key) DO NOTHING")&&!/UPDATE\s+public\.route_providers/i.test(sql));
const page = fs.readFileSync(path.join(root,"apps/web/src/app/candidate/institutions/page.tsx"),"utf8");
const edge = fs.readFileSync(path.join(root,"supabase/functions/candidate-application-preparation/index.ts"),"utf8");
check("all six employment planning routes are mapped in candidate UI and Edge function",expected.every(([key])=>manifest.sources.some(source=>source.provider_key===key)) &&
  page.includes("isPrivateEmployer") && page.includes("isDpsaVacancySource") &&
  expected.every(([key])=>edge.includes(key + ':"EMPLOYMENT"') || edge.includes(key + ':[\"EMPLOYMENT\"]')));
if(errors.length){console.error("DPSA/private employer provider migration validation FAILED: "+errors.length+" checks");process.exit(1);}
console.log("DPSA/private employer provider migration validation PASSED: 11 official external career destinations; no Kingsmen submissions or open-vacancy claims.");
