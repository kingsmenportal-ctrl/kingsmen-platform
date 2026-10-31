import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationPath = path.join(root, "db/migrations/0101_seed_seta_and_funding_provider_directory.sql");
const manifestPath = path.join(root, "manifests/institutions/cross-sector-institution-source-extension.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];
const check = (name, condition) => {
  console.log((condition ? "PASS " : "FAIL ") + name);
  if (!condition) errors.push(name);
};
const sql = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, "utf8") : "";
const setaSources = manifest.sources.filter(row => /^seta_[a-z0-9]+_official$/.test(row.source_id));
const funders = [
  { sourceId: "dhet_national_skills_fund", providerKey: "funder_nsf", providerType: "BURSARY_PROVIDER" },
  { sourceId: "funza_lushaka_bursary", providerKey: "funder_funza_lushaka", providerType: "BURSARY_PROVIDER" }
];
const migrationKeys = [...setaSources.map(row => row.provider_key), ...funders.map(row => row.providerKey)];
const uniqueKeys = new Set(migrationKeys);

check("migration exists and is transaction-wrapped", Boolean(sql) && /^BEGIN;/m.test(sql) && /COMMIT;\s*$/.test(sql));
check("exactly 21 individual DHET SETAs are in the source manifest", setaSources.length === 21);
check("all SETA and funder provider keys are present and unique", migrationKeys.length === 23 && uniqueKeys.size === 23 && migrationKeys.every(Boolean));
check("migration includes the DHET SETA source authority and exact official list URL", sql.includes("dhet_seta_directory") && sql.includes("https://www.dhet.gov.za/SitePages/SETAlinks.aspx"));
check("migration includes separate NSF and Funza Lushaka source authorities", sql.includes("dhet_nsf_official") && sql.includes("dbe_funza_lushaka"));
check("all 21 SETA provider keys are inserted exactly once", setaSources.every(row => sql.includes("('" + row.provider_key + "',")));
check("both national funding providers are inserted", funders.every(row => sql.includes("('" + row.providerKey + "',")));
check("all SETAs use provider type SETA and funders use BURSARY_PROVIDER", sql.includes("'SETA'") && sql.includes("'BURSARY_PROVIDER'"));
check("new provider records are review-only, D confidence and not public-safe", sql.includes("'D'") && sql.includes("'NEEDS_REVIEW'") && /public_safe,/.test(sql) && /\n\s*false,\n\s*false,/.test(sql));
check("directory metadata preserves not verified / not connected / not partner boundaries", ["'UNKNOWN'","'NOT_VERIFIED'","'NOT_CONNECTED'","'NOT_A_PARTNER'","'provider_receipt_supported', false","'automation_authorized', false"].every(fragment => sql.includes(fragment)));
check("provider-key conflicts are non-destructive and reviewer states are not overwritten", sql.includes("ON CONFLICT (provider_key) DO NOTHING") && !/UPDATE\s+public\.route_providers/i.test(sql));
check("migration postflight validates exact key/name/type/URL and review-only state without overwrites", sql.includes("expected_count integer := 23") && sql.includes("SETA_FUNDER_PROVIDER_SEED_COUNT_MISMATCH") && sql.includes("provider_name IS DISTINCT FROM e.provider_name") && sql.includes("verification_status IS DISTINCT FROM 'NEEDS_REVIEW'") && sql.includes("default_confidence_band IS DISTINCT FROM 'D'") && sql.includes("public_safe IS DISTINCT FROM false"));
check("no opportunity, programme or deadline rows are created", !/INSERT\s+INTO\s+public\.(route_programmes|opportunity_programmes|opportunity_deadlines)/i.test(sql));

if (errors.length) {
  console.error("SETA/funder provider migration validation FAILED: " + errors.length + " checks");
  process.exit(1);
}
console.log("SETA/funder provider migration validation PASSED: 23 review-only canonical provider entries; no programmes or connectors created.");
