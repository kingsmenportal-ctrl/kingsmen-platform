import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const scout = read("apps/web/scripts/institution-browser-scout.mjs");
const policy = read("scripts/agents/institution-browser-scout-policy.mjs");
const registry = read("packages/jarvis-core/src/jarvis-tool-registry.ts");
const targets = JSON.parse(read("manifests/institutions/browser-scout-targets.example.json"));
const manifest = JSON.parse(read("manifests/institutions/institution-browser-scout-policy.json"));
const packageJson = JSON.parse(read("package.json"));

const checks = [
  ["Playwright browser engines are used", /from "playwright"/.test(scout)],
  ["Fresh isolated contexts are created per target", /browser\.newContext/.test(scout)],
  ["Only allowlisted HTTPS GET requests are permitted", /validateProbeRequest/.test(scout) && /NON_GET_REQUEST_BLOCKED/.test(policy) && /HTTPS_ONLY/.test(policy)],
  ["Private and local host targets are rejected", /PRIVATE_OR_LOCAL_HOST_FORBIDDEN/.test(policy)],
  ["Candidate input values are not read", !/\.inputValue\(|\.evaluate\([^)]*\.value/.test(scout)],
  ["No clicks, fills, typing or submit operations exist", !/\.click\(|\.fill\(|\.type\(|\.press\(/.test(scout)],
  ["No saved storage state or credentials are used", /storageStatePersisted: false/.test(scout) && !/storageState\(/.test(scout)],
  ["No CAPTCHA/OTP bypass capability exists", /captchaOrOtpBypassAttempted: false/.test(scout) && !/solver|stealth|inject.*token/i.test(scout)],
  ["Network bodies and authentication headers are excluded", /requestOrResponseBodiesCaptured: false/.test(scout) && /cookiesOrAuthHeadersRecorded: false/.test(scout)],
  ["Mapping drift is flagged for human review", /MAPPING_DRIFT_REVIEW_REQUIRED/.test(scout)],
  ["No Truth Vault write or candidate publication is attempted", /truthVaultWriteAttempted: false/.test(scout) && /publicationAttempted: false/.test(scout) && !/createClient|SUPABASE_SERVICE_ROLE_KEY/.test(scout)],
  ["Capability cards are not candidate-safe by default", /candidateFacingSafe: false/.test(scout) && /humanReviewRequired: true/.test(scout)],
  ["Jarvis Browser Scout remains dry-run without candidate or secret capability", /toolRef: 'jarvis\.browser\.scout'/.test(registry) && /trustLevel: 'TRUST_2_DRY_RUN'/.test(registry) && /candidateDataCapable: false/.test(registry) && /secretsCapable: false/.test(registry)],
  ["Every sample target is disabled by default", targets.targets.every((target) => target.enabled === false)],
  ["Policy manifest explicitly forbids write and bypass operations", manifest.forbiddenOperations.includes("submit_application") && manifest.forbiddenOperations.includes("captcha_or_otp_bypass")],
  ["Root test chain invokes Browser Scout source and unit checks", packageJson.scripts.test.includes("npm run institutions:browser-scout:check") && packageJson.scripts["institutions:browser-scout:check"])
];

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
console.log(JSON.stringify({
  schema: "kingsmen.institution-browser-scout-source-validation.v1",
  status: failures.length ? "FAILED" : "PASSED",
  passedChecks: checks.length - failures.length,
  totalChecks: checks.length,
  failures,
  liveNetworkUsed: false,
  liveDatabaseTouched: false
}, null, 2));
assert.equal(failures.length, 0, "Institution Browser Scout source contract failed.");
