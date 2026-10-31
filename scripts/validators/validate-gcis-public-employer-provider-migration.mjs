import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationPath = path.join(root, "db/migrations/0102_seed_gcis_public_employer_directory.sql");
const manifestPath = path.join(root, "manifests/institutions/cross-sector-institution-source-extension.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const sql = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, "utf8") : "";
const expected = [
  ["soe_acsa", "Airports Company South Africa (ACSA)", "https://www.airports.co.za/"],
  ["soe_denel", "Denel (Pty) Ltd", "https://www.denel.co.za/"],
  ["soe_prasa", "Passenger Rail Agency of South Africa (PRASA)", "https://www.prasa.com/"],
  ["soe_saa", "South African Airways (SAA)", "https://www.flysaa.com/"],
  ["soe_sabc", "South African Broadcasting Corporation (SABC)", "https://www.sabc.co.za/"],
  ["soe_sanral", "South African National Road Agency (SANRAL)", "https://www.nra.co.za/"],
  ["soe_sapo", "South African Post Office (SAPO)", "https://www.postoffice.co.za/"],
  ["soe_telkom", "Telkom SA (Ltd)", "https://www.telkom.co.za/"],
  ["soe_transnet", "Transnet (Ltd)", "https://www.transnet.net"]
];
const errors = [];
const check = (name, condition) => {
  console.log((condition ? "PASS " : "FAIL ") + name);
  if (!condition) errors.push(name);
};
const sources = manifest.sources ?? [];
check("migration exists and is transaction-wrapped", Boolean(sql) && /^BEGIN;/m.test(sql) && /COMMIT;\s*$/.test(sql));
check("GCIS official 123-organisation directory anchor is in the manifest and migration", sources.some(row => row.source_id === "gcis_public_entities_and_soe_directory") && sql.includes("gcis_public_entities_and_soe_directory"));
check("nine verified GCIS employer profile keys are distinct and present", expected.length === 9 && new Set(expected.map(row => row[0])).size === 9 && expected.every(([key]) => sources.some(row => row.provider_key === key)));
check("all nine employer provider keys, names and official websites are seeded", expected.every(([key,name,url]) => sql.includes("('" + key + "', '" + name.replace(/'/g,"''") + "', '" + url + "'")));
check("employer source URLs are attached to the government directory source authority", sql.includes("gcis_public_entities_and_soe_directory") && sql.includes("https://www.gov.za/about-government/contact-directory/soe-s"));
check("records use EMPLOYER, confidence D, NEEDS_REVIEW and public_safe=false", sql.includes("'EMPLOYER'") && sql.includes("'D'") && sql.includes("'NEEDS_REVIEW'") && sql.includes("public_safe,") && /\n\s*false,\n\s*false,/.test(sql));
check("metadata keeps vacancies, eligibility and application routes unverified", ["'vacancy_status', 'UNKNOWN'","'eligibility_status', 'UNKNOWN'","'application_route_status', 'NOT_VERIFIED'","'integration_status', 'NOT_CONNECTED'","'partnership_status', 'NOT_A_PARTNER'","'automation_authorized', false","'provider_receipt_supported', false"].every(fragment => sql.includes(fragment)));
check("existing provider records and reviewer decisions are never overwritten", sql.includes("ON CONFLICT (provider_key) DO NOTHING") && !/UPDATE\s+public\.route_providers/i.test(sql));
check("postflight checks every employer against its exact key/name/URL and safe review status", sql.includes("expected_count integer := 9") && sql.includes("provider_name IS DISTINCT FROM e.provider_name") && sql.includes("verification_status IS DISTINCT FROM 'NEEDS_REVIEW'") && sql.includes("public_safe IS DISTINCT FROM false"));
check("no vacancy, programme, deadline, application or outcome rows are seeded", !/INSERT\s+INTO\s+public\.(route_programmes|opportunity_programmes|opportunity_deadlines|candidate_applications)/i.test(sql));

if (errors.length) {
  console.error("GCIS public-employer provider migration validation FAILED: " + errors.length + " checks");
  process.exit(1);
}
console.log("GCIS public-employer provider migration validation PASSED: nine non-public review-only employer records, no vacancies or connectors.");
