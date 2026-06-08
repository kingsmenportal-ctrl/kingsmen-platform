import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const checks = [];
const reportPath = path.join(root, "reports/personal-jobs/personal-jobs-18-sa-source-expansion-proof.json");

function abs(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(abs(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(abs(relativePath), "utf8").replace(/^\uFEFF/, "");
}

function parseJson(relativePath) {
  try {
    return JSON.parse(read(relativePath));
  } catch {
    return null;
  }
}

function addCheck(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail: String(detail ?? "") });
}

const expectedFiles = [
  ".gitignore",
  "data/personal-job-desk/sa-job-sources.local.example.json",
  "scripts/agents/personal-job-sa-source-runner.mjs",
  "apps/web/src/app/api/personal-jobs/sa-sources/run/route.ts",
  "apps/web/src/app/personal-job-desk/sa-sources/page.tsx",
  "apps/web/src/app/personal-job-desk/sa-sources/SaSourcesClient.tsx",
  "packages/contracts/src/personal-jobs-18-sa-source-expansion.ts",
  "docs/personal-jobs/personal-jobs-18-sa-source-expansion.md",
  "manifests/personal-jobs/personal-jobs-18-sa-source-expansion.json",
  "scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs",
  "scripts/validators/validate-personal-jobs-18-sa-source-expansion.mjs"
];

for (const file of expectedFiles) {
  addCheck(`expected-file:${file}`, exists(file), file);
}

const gitignore = exists(".gitignore") ? read(".gitignore") : "";
const sourceExample = exists(expectedFiles[1]) ? parseJson(expectedFiles[1]) : null;
const agent = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const api = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const page = exists(expectedFiles[4]) ? read(expectedFiles[4]) : "";
const client = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";
const contract = exists(expectedFiles[6]) ? read(expectedFiles[6]) : "";
const doc = exists(expectedFiles[7]) ? read(expectedFiles[7]) : "";
const manifest = exists(expectedFiles[8]) ? parseJson(expectedFiles[8]) : null;

addCheck("gitignore-sa-local-config", gitignore.includes("data/personal-job-desk/sa-job-sources.local.json"), "SA local config ignored");
addCheck("gitignore-sa-discovered", gitignore.includes("data/personal-job-desk/sa-discovered-jobs.local.json"), "SA discovered jobs ignored");
addCheck("source-example-valid-json", Boolean(sourceExample), "valid json");
addCheck("source-example-sa-country", sourceExample?.schema === "kingsmen.personal-jobs-18.sa-sources.v1", sourceExample?.schema);
addCheck("source-example-dpsa", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "dpsaLanding"), "dpsaLanding");
addCheck("source-example-public-careers", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "publicCareersPage"), "publicCareersPage");
addCheck("source-example-search-landings", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "searchLanding"), "searchLanding");
addCheck("agent-reads-one-profile", agent.includes("personal-candidate.local.json"), "one profile");
addCheck("agent-sa-source-config", agent.includes("sa-job-sources.local.json"), "SA source config");
addCheck("agent-dpsa-adapter", agent.includes("dpsaLandingAdapter"), "DPSA adapter");
addCheck("agent-public-careers-adapter", agent.includes("publicCareersPageAdapter"), "public careers adapter");
addCheck("agent-search-landing-adapter", agent.includes("searchLandingAdapter"), "search landing adapter");
addCheck("agent-sa-query-builder", agent.includes("buildSaQueries"), "SA query builder");
addCheck("agent-sa-scoring", agent.includes("scoreSaLead"), "SA lead score");
addCheck("agent-pj02-shape", agent.includes("toPj02Shape"), "PJ02 export");
addCheck("agent-combines-pj17", agent.includes("PJ17_DISCOVERED_PATH"), "combines PJ17 leads");
addCheck("agent-no-auto-apply", agent.includes("requiresHumanApprovalBeforeApply") && agent.includes("sendsApplications: false"), "no auto apply");
addCheck("api-runs-agent", api.includes("personal-job-sa-source-runner.mjs") && api.includes("spawnSync"), "API runs agent");
addCheck("api-node-runtime", api.includes('runtime = "nodejs"'), "nodejs runtime");
addCheck("page-client", page.includes("SaSourcesClient"), "SaSourcesClient");
addCheck("client-run-button", client.includes("Run SA source runner"), "run button");
addCheck("client-api-call", client.includes("/api/personal-jobs/sa-sources/run"), "API route call");
addCheck("client-pj02-export", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 key");
addCheck("client-manual-fallback", client.includes("Manual job entry remains fallback only"), "manual fallback only");
addCheck("contract-capabilities", contract.includes("countryFocusSouthAfrica: true") && contract.includes("exportsToPj02Shape: true"), "contract capabilities");
addCheck("contract-boundaries", contract.includes("sendsApplications: false") && contract.includes("contactsEmployers: false"), "contract boundaries");
addCheck("doc-purpose", doc.includes("South African source discovery"), "SA purpose");
addCheck("doc-local-private-files", doc.includes("sa-discovered-jobs.local.json"), "local privacy");
addCheck("manifest-valid-json", Boolean(manifest), "manifest json");
addCheck("manifest-route", manifest?.route === "/personal-job-desk/sa-sources", manifest?.route);
addCheck("manifest-country-focus", manifest?.country_focus === "South Africa", manifest?.country_focus);
addCheck("manifest-real-sources", manifest?.searches_real_sources === true, "real sources true");
addCheck("manifest-manual-entry-fallback", manifest?.manual_job_entry_fallback_only === true, "manual fallback");
addCheck("manifest-no-production", manifest?.production_ready === false && manifest?.deployed_to_oracle === false, "no production claim");
addCheck("manifest-no-send", manifest?.sends_email === false && manifest?.sends_whatsapp === false && manifest?.sends_applications === false, "no send/apply");
addCheck("manifest-human-approval", manifest?.requires_human_approval_before_apply === true, "approval required");

const syntaxTargets = [
  "scripts/agents/personal-job-sa-source-runner.mjs",
  "scripts/proof/prove-personal-jobs-18-sa-source-expansion.mjs"
];

for (const file of syntaxTargets) {
  if (exists(file)) {
    const check = spawnSync(process.execPath, ["--check", abs(file)], {
      cwd: root,
      encoding: "utf8"
    });

    addCheck(`node-syntax:${file}`, check.status === 0, check.stderr || "syntax ok");
  }
}

if (exists("scripts/agents/personal-job-sa-source-runner.mjs")) {
  const dryRun = spawnSync(process.execPath, ["scripts/agents/personal-job-sa-source-runner.mjs", "--dry-run", "--json"], {
    cwd: root,
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 1024 * 1024 * 4
  });

  let dryJson = null;
  try {
    dryJson = JSON.parse(dryRun.stdout);
  } catch {
    dryJson = null;
  }

  addCheck("agent-dry-run-exit-zero", dryRun.status === 0, dryRun.stderr || "dry run ok");
  addCheck("agent-dry-run-sa-country", dryJson?.countryFocus === "South Africa", dryJson?.countryFocus);
  addCheck("agent-dry-run-generates-queries", Array.isArray(dryJson?.searchQueries) && dryJson.searchQueries.length > 0, `${dryJson?.searchQueries?.length ?? 0} queries`);
  addCheck("agent-dry-run-uses-one-profile", dryJson?.usedOneProfile === true, "usedOneProfile true");
}

const committedText = [
  "scripts/agents/personal-job-sa-source-runner.mjs",
  "apps/web/src/app/api/personal-jobs/sa-sources/run/route.ts",
  "apps/web/src/app/personal-job-desk/sa-sources/SaSourcesClient.tsx",
  "packages/contracts/src/personal-jobs-18-sa-source-expansion.ts",
  "docs/personal-jobs/personal-jobs-18-sa-source-expansion.md",
  "manifests/personal-jobs/personal-jobs-18-sa-source-expansion.json"
].filter(exists).map(read).join("\n");

const forbidden = [
  "smtp.send",
  "sendEmail(",
  "sendWhatsApp(",
  "submitApplication(",
  "payfast-passphrase",
  "service_role",
  "PRODUCTION_READY_TRUE",
  "DEPLOYED_TO_ORACLE_TRUE"
];

for (const item of forbidden) {
  addCheck(`forbidden-not-present:${item}`, !committedText.includes(item), item);
}

const passed = checks.every((check) => check.passed);

const result = {
  schema: "kingsmen.personal-jobs-18-proof.v1",
  module: "PERSONAL-JOBS-18 - South African Job Source Expansion / Real Local Lead Adapters",
  status: passed ? "PERSONAL_JOBS_18_SA_SOURCE_EXPANSION_PROVEN" : "PERSONAL_JOBS_18_SA_SOURCE_EXPANSION_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  route: "/personal-job-desk/sa-sources",
  apiRoute: "/api/personal-jobs/sa-sources/run",
  countryFocus: "South Africa",
  searchesRealSources: true,
  manualJobEntryRequired: false,
  manualJobEntryFallbackOnly: true,
  supportsDpsaLandingAdapter: true,
  supportsPublicCareersPageAdapter: true,
  supportsSearchLandingAdapter: true,
  exportsToPj02Shape: true,
  combinesWithPj17Leads: true,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  contactsEmployers: false,
  generated_at: new Date().toISOString(),
  checks,
  failed: checks.filter((check) => !check.passed),
  next_action: passed
    ? "Run validator, commit PJ18 files, then open /personal-job-desk/sa-sources and press Run SA source runner."
    : "Repair failed PJ18 checks before committing."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (!passed) process.exitCode = 1;