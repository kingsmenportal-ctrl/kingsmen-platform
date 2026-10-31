import fs from "node:fs";
import path from "node:path";

const file=path.join(process.cwd(),"supabase/migrations/20261031145500_seed_n15_official_opportunity_evidence_batch.sql");
const sql=fs.readFileSync(file,"utf8");
const failures=[];
const check=(name,ok)=>{console.log((ok?"PASS ":"FAIL ")+name);if(!ok)failures.push(name);};

const programmeRefs=[
 "ndoh_forensic_mental_health_ndoh_82_2026","ndoh_secretary_hospital_facilities_ndoh_87_2026",
 "dbe_public_examinations_dbe_74_2026","dbe_whole_school_evaluation_dbe_75_2026",
 "dbe_health_promotion_dbe_76_2026","dbe_bids_contract_admin_dbe_77_2026",
 "dbe_senior_secretary_dbe_78_2026","dbe_senior_admin_clerk_dbe_79_2026",
 "nwpg_victor_thebe_sifora_bursary_2027"
];
check("migration is transactional and ends with COMMIT",sql.startsWith("-- N15 official opportunity evidence batch")&&sql.includes("BEGIN;")&&sql.trimEnd().endsWith("COMMIT;"));
check("migration is fail-closed on recent encrypted backup and isolated restore evidence",sql.includes("N15_OFFICIAL_EVIDENCE_IMPORT_BLOCKED")&&sql.includes("metadata @> '{\"encrypted\":true}'::jsonb")&&sql.includes("metadata @> '{\"restore_isolated\":true}'::jsonb"));
check("three official providers and nine individually named programmes are seeded",["ndoh","dbe","nwpg_victor_thebe_sifora_bursary",...programmeRefs].every(x=>sql.includes("'"+x+"'")));
check("every programme has official HTTPS source and non-empty evidence refs",sql.includes("candidate_facing_safe,exact_link,evidence_refs")&&sql.includes("https://www.health.gov.za/")&&sql.includes("https://www.education.gov.za/")&&sql.includes("https://bursaries.nwpg.gov.za/")&&sql.includes("cardinality(evidence_refs)=0"));
check("source observations are verified but expire after 24 hours",sql.includes("'OFFICIAL_VERIFIED','VERIFIED','2026-10-31T14:55:00+02:00','2026-11-01T14:55:00+02:00','2026-11-01T14:55:00+02:00'"));
check("date-only employment deadlines do not invent a closing time",sql.includes("'MANUAL_CHECK_REQUIRED','OFFICIAL_VERIFIED','Africa/Johannesburg'")&&sql.includes("'2026-11-13T23:59:00+02:00','CONFIRMED'"));
check("no candidate-specific match, submission receipt or outcome is fabricated",!sql.includes("INSERT INTO public.candidate_opportunity_matches")&&!/submission_status\s*=\s*'SUBMITTED'/i.test(sql)&&sql.includes("Candidate-specific matches are intentionally not created"));
check("identity conflicts fail closed rather than overwriting an existing provider/programme",sql.includes("N15_OFFICIAL_EVIDENCE_PROVIDER_IDENTITY_CONFLICT")&&sql.includes("N15_OFFICIAL_EVIDENCE_PROGRAMME_IDENTITY_CONFLICT"));
check("postflight verifies provider, programme, observation counts and safe delivery defaults",sql.includes("N15_OFFICIAL_EVIDENCE_PROVIDER_POSTFLIGHT_FAILED")&&sql.includes("N15_OFFICIAL_EVIDENCE_PROGRAMME_POSTFLIGHT_FAILED")&&sql.includes("N15_OFFICIAL_EVIDENCE_OBSERVATION_POSTFLIGHT_FAILED")&&sql.includes("N15_OFFICIAL_EVIDENCE_PROGRAMME_SAFETY_POSTFLIGHT_FAILED"));
console.log("N15 official evidence batch contract: "+(failures.length?"FAILED":"PASS")+" ("+failures.length+" failures)");
if(failures.length)process.exit(1);
