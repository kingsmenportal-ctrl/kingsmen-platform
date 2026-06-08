import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const moduleName = "PERSONAL-JOBS-14 - Personal Job Desk Navigation / Real Use Gate Expansion";
const proofPath = "reports/personal-jobs/personal-jobs-14-navigation-real-use-gate-expansion-proof.json";

const expectedFiles = [
  "apps/web/src/app/personal-job-desk/navigation/page.tsx",
  "apps/web/src/app/personal-job-desk/navigation/NavigationHubClient.tsx",
  "apps/web/src/app/personal-job-desk/real-use-gate/page.tsx",
  "docs/personal-jobs/personal-jobs-14-navigation-real-use-gate-expansion.md",
  "manifests/personal-jobs/personal-jobs-14-navigation-real-use-gate-expansion.json",
  "packages/contracts/src/personal-jobs-14-navigation-real-use-gate-expansion.ts",
  "scripts/proof/prove-personal-jobs-14-navigation-real-use-gate-expansion.mjs",
  "scripts/validators/validate-personal-jobs-14-navigation-real-use-gate-expansion.mjs"
];

const dependencyReports = [
  "reports/personal-jobs/personal-jobs-11-local-job-search-import-desk-proof.json",
  "reports/validation/personal-jobs-11-local-job-search-import-desk-latest.json",
  "reports/personal-jobs/personal-jobs-12-real-job-search-source-runner-verified-lead-finder-proof.json",
  "reports/validation/personal-jobs-12-real-job-search-source-runner-verified-lead-finder-latest.json",
  "reports/personal-jobs/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer-proof.json",
  "reports/validation/personal-jobs-13-pj02-lead-schema-compatibility-repair-import-normalizer-latest.json"
];

const checks = [];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8").replace(/^\uFEFF/, "");
}

function check(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

for (const report of dependencyReports) {
  const reportExists = exists(report);
  check(`dependency-report-exists:${report}`, reportExists, report);

  if (reportExists) {
    const parsed = readJson(report);
    check(`dependency-report-passed:${report}`, parsed.passed === true, String(parsed.passed));
  }
}

const page = exists(expectedFiles[0]) ? read(expectedFiles[0]) : "";
const client = exists(expectedFiles[1]) ? read(expectedFiles[1]) : "";
const gate = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const doc = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const manifest = exists(expectedFiles[4]) ? read(expectedFiles[4]) : "{}";
const contract = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";

check("page-uses-navigation-client", page.includes("NavigationHubClient"), "navigation client imported");
check("page-force-dynamic", page.includes('dynamic = "force-dynamic"'), "force dynamic local route");
check("gate-uses-navigation-client", gate.includes("../navigation/NavigationHubClient"), "real use gate imports hub");
check("gate-variant", gate.includes('variant="gate"'), "real use gate variant");
check("client-marker", client.includes("PERSONAL_JOBS_14_NAVIGATION_EXPANSION"), "PJ14 marker");
check("client-no-send-boundary", client.includes("NO_SEND_BOUNDARY"), "no-send boundary marker");
check("client-pj11-route", client.includes("/personal-job-desk/import-search"), "PJ11 route");
check("client-pj12-route", client.includes("/personal-job-desk/source-runner"), "PJ12 route");
check("client-pj13-route", client.includes("/personal-job-desk/normalizer"), "PJ13 route");
check("client-pj14-route", client.includes("/personal-job-desk/navigation"), "PJ14 route");
check("client-real-use-gate-route", client.includes("/personal-job-desk/real-use-gate"), "real-use gate route");
check("client-daily-loop-route", client.includes("/personal-job-desk/daily-loop"), "daily loop route");
check("client-local-storage-visit", client.includes("kingsmen.personalJobs14.navigationVisits.v1"), "PJ14 visit key");
check("client-normalizer-report-key", client.includes("kingsmen.personalJobs13.normalizerReports.v1"), "PJ13 report key");
check("client-normalizer-backup-key", client.includes("kingsmen.personalJobs13.normalizerBackups.v1"), "PJ13 backup key");
check("client-pj02-lead-key", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 lead key");
check("doc-boundary", doc.includes("does not send applications") && doc.includes("does not contact employers"), "doc boundary");
check("doc-daily-order", doc.includes("Real-use daily order") && doc.includes("Normalize imported leads"), "daily order");
check("contract-export", contract.includes("PERSONAL_JOBS_14_MODULE"), "contract export");
check("contract-route", contract.includes("/personal-job-desk/navigation"), "contract route");
check("contract-no-production", contract.includes("productionReady: false"), "contract production false");

let parsedManifest = {};
try {
  parsedManifest = JSON.parse(manifest);
  check("manifest-json-valid", true, "valid json");
} catch (error) {
  check("manifest-json-valid", false, error.message);
}

check("manifest-status", parsedManifest.status === "BUILT_PENDING_VALIDATION", String(parsedManifest.status));
check("manifest-route", parsedManifest.route === "/personal-job-desk/navigation", String(parsedManifest.route));
check("manifest-expanded-real-use-gate", parsedManifest.expanded_route === "/personal-job-desk/real-use-gate", String(parsedManifest.expanded_route));
check("manifest-no-production", parsedManifest.production_ready === false, "production false");
check("manifest-no-oracle", parsedManifest.deployed_to_oracle === false, "oracle false");
check("manifest-no-docker", parsedManifest.starts_docker === false, "docker false");
check("manifest-no-send", parsedManifest.sends_applications === false && parsedManifest.sends_email === false && parsedManifest.sends_whatsapp === false, "send false");
check("manifest-no-payment", parsedManifest.touches_payments === false, "payments false");
check("manifest-no-external", parsedManifest.searches_internet === false && parsedManifest.opens_external_pages === false && parsedManifest.scrapes_websites === false, "external false");
check("manifest-route-count", Array.isArray(parsedManifest.routes_connected) && parsedManifest.routes_connected.length >= 12, "12+ routes");

const runtimeText = [page, client, gate, manifest, contract].join("\n");

const forbiddenRuntimeMarkers = [
  "window.open(",
  "fetch(",
  "axios.",
  "puppeteer",
  "playwright",
  "sendEmail(",
  "sendWhatsApp(",
  "submitApplication(",
  "smtp.send",
  "service_role",
  "payfast-passphrase",
  "OPENAI_API_KEY",
  "PRODUCTION_READY_TRUE",
  "DEPLOYED_TO_ORACLE_TRUE"
];

for (const marker of forbiddenRuntimeMarkers) {
  check(`runtime-no-forbidden:${marker}`, !runtimeText.includes(marker), marker);
}

const committedText = expectedFiles
  .filter((file) => exists(file))
  .map((file) => read(file))
  .join("\n");

const containsPersonalContact =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(committedText) ||
  /(?:^|[^0-9])(?:\+27|0)(?:\s|-)?[6-8][0-9](?:\s|-)?[0-9]{3}(?:\s|-)?[0-9]{4}(?:[^0-9]|$)/.test(committedText);

check("committed-files-no-personal-contact", !containsPersonalContact, "no email or phone in committed PJ14 files");

const failed = checks.filter((item) => !item.passed);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.personal-jobs-14-proof.v1",
  module: moduleName,
  status: passed
    ? "PERSONAL_JOBS_14_NAVIGATION_REAL_USE_GATE_EXPANSION_PROVEN"
    : "PERSONAL_JOBS_14_NAVIGATION_REAL_USE_GATE_EXPANSION_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk/navigation",
  expandedRoute: "/personal-job-desk/real-use-gate",
  connectsPersonalJobs11: client.includes("/personal-job-desk/import-search"),
  connectsPersonalJobs12: client.includes("/personal-job-desk/source-runner"),
  connectsPersonalJobs13: client.includes("/personal-job-desk/normalizer"),
  writesLocalStorageKey: "kingsmen.personalJobs14.navigationVisits.v1",
  searchesInternet: false,
  opensExternalPages: false,
  scrapesWebsites: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit PERSONAL-JOBS-14 tracked files only."
    : "Repair PERSONAL-JOBS-14 before moving forward."
};

fs.mkdirSync(path.dirname(absolute(proofPath)), { recursive: true });
fs.writeFileSync(absolute(proofPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);