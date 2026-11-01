import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "manifests/institutions/seed/dhet-tvet-occupational-programmes-2026.json");
const migrationPath = path.join(root, "db/migrations/0100_seed_dhet_occupational_source_observations.sql");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const sql = fs.readFileSync(migrationPath, "utf8");
const failures = [];
const check = (name, condition) => {
  const pass = Boolean(condition);
  console.log((pass ? "PASS " : "FAIL ") + name);
  if (!pass) failures.push(name);
};
const withoutComments = sql.split(/\r?\n/).filter(line => !line.trim().startsWith("--")).join("\n");
const expectedUrl = data.source.url;

check("migration has explicit transaction boundaries", /^\s*BEGIN;/i.test(withoutComments) && /COMMIT;\s*$/i.test(withoutComments));
check("source dataset has 38 distinct qualifications", data.programmes.length === 38 && new Set(data.programmes.map(p => p.saqa_id)).size === 38);
check("official source URL is exact", sql.includes(expectedUrl));
check("source authority inserted idempotently", /INSERT INTO public\.source_authorities/i.test(sql) && /ON CONFLICT \(source_key\) DO NOTHING/i.test(sql));
check("source authority does not claim recent verification", /verification_required, last_verified_at, verification_notes[\s\S]*?true,\s*NULL,/i.test(sql));
check("opportunity source authority remains medium confidence", /ARRAY\['TVET','SETA','LEARNERSHIP','APPRENTICESHIP'\]::text\[\],[\s\S]*?'MEDIUM'[\s\S]*?true,/i.test(sql));
check("observation import is idempotent without overwriting review state", /INSERT INTO public\.external_source_observations/i.test(sql) && /ON CONFLICT \(observation_ref\) DO NOTHING/i.test(sql));
check("all seed observations are review-only", /'MEDIUM',\s*'NEEDS_REVIEW',/i.test(sql));
check("source observation time is not future dated in this run", /'2026-10-31 00:00:00\+02'/i.test(sql) && !/2026-10-31 12:00:00\+02/.test(sql));
check("no source observation has a fabricated expiry/freshness date", /'2026-10-31 00:00:00\+02',\s*NULL,\s*NULL,\s*NULL,/i.test(sql));
check("all observations require human review and record layout limitation", /NEEDS HUMAN REVIEW:[\s\S]*?PDF screenshot rendering was unavailable/i.test(sql));
check("no candidate-facing route/programme rows are created", !/INSERT INTO public\.(route_programmes|opportunity_programmes|route_deadlines|opportunity_deadlines|route_requirements|route_eligibility|opportunity_eligibility_rules|route_fees|opportunity_fee_records)/i.test(sql));
check("observations are not promoted to VERIFIED", !/observation_status\s*=\s*'VERIFIED'|,\s*'VERIFIED',/i.test(sql));
check("migration includes expected count assertion", /v_total <> 38/i.test(sql) && /v_review_only < 38/i.test(sql));
for (const p of data.programmes) {
  check("source observation ID present: " + p.saqa_id, sql.includes("'dhet_2026_tvet_occ_" + p.saqa_id + "'"));
  check("published qualification number present: " + p.saqa_id, sql.includes(p.published_number));
  check("provider-transcription review reason present: " + p.saqa_id, sql.includes("SAQA ID " + p.saqa_id) && sql.includes(p.name));
}
const result = {
  schema: "kingsmen.validation-report.v1",
  module: "Proposed DHET occupational source-observation migration",
  status: failures.length ? "FAILED" : "VALIDATED_REVIEW_ONLY",
  passed: failures.length === 0,
  observation_rows: data.programmes.length,
  creates_candidate_facing_programmes: false,
  migration_applied: false,
  failed_checks: failures
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
