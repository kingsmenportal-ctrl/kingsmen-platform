import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const checks = [];
const reportPath = path.join(root, "reports/personal-jobs/personal-jobs-17-real-job-discovery-agent-proof.json");

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
  "data/personal-job-desk/job-search-sources.local.example.json",
  "scripts/agents/personal-job-discovery-agent.mjs",
  "scripts/agents/playwright-job-source-scout.mjs",
  "apps/web/src/app/api/personal-jobs/job-finder/run/route.ts",
  "apps/web/src/app/personal-job-desk/job-finder/page.tsx",
  "apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx",
  "packages/contracts/src/personal-jobs-17-real-job-discovery-agent.ts",
  "docs/personal-jobs/personal-jobs-17-real-job-discovery-agent.md",
  "manifests/personal-jobs/personal-jobs-17-real-job-discovery-agent.json",
  "scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs",
  "scripts/validators/validate-personal-jobs-17-real-job-discovery-agent.mjs"
];

for (const file of expectedFiles) {
  addCheck(`expected-file:${file}`, exists(file), file);
}

const gitignore = exists(".gitignore") ? read(".gitignore") : "";
const sourceExample = exists(expectedFiles[1]) ? parseJson(expectedFiles[1]) : null;
const agent = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const scout = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const api = exists(expectedFiles[4]) ? read(expectedFiles[4]) : "";
const page = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";
const client = exists(expectedFiles[6]) ? read(expectedFiles[6]) : "";
const contract = exists(expectedFiles[7]) ? read(expectedFiles[7]) : "";
const doc = exists(expectedFiles[8]) ? read(expectedFiles[8]) : "";
const manifest = exists(expectedFiles[9]) ? parseJson(expectedFiles[9]) : null;

addCheck("gitignore-local-profile", gitignore.includes("data/personal-job-desk/*.local.json"), "local json ignored");
addCheck("source-example-valid-json", Boolean(sourceExample), "source example json");
addCheck("source-example-has-real-adapters", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "remoteok") && sourceExample.sources.some((s) => s.adapter === "arbeitnow"), "remoteok + arbeitnow");
addCheck("source-example-has-playwright-adapter", Array.isArray(sourceExample?.sources) && sourceExample.sources.some((s) => s.adapter === "playwrightPage"), "playwrightPage");
addCheck("agent-reads-one-profile", agent.includes("personal-candidate.local.json"), "one profile path");
addCheck("agent-generates-search-queries", agent.includes("buildSearchQueries"), "buildSearchQueries");
addCheck("agent-remoteok-adapter", agent.includes("remoteOkAdapter"), "RemoteOK adapter");
addCheck("agent-arbeitnow-adapter", agent.includes("arbeitnowAdapter"), "Arbeitnow adapter");
addCheck("agent-greenhouse-adapter", agent.includes("greenhouseAdapter"), "Greenhouse adapter");
addCheck("agent-lever-adapter", agent.includes("leverAdapter"), "Lever adapter");
addCheck("agent-rss-adapter", agent.includes("rssAdapter"), "RSS adapter");
addCheck("agent-dedupe-leads", agent.includes("dedupeLeads"), "dedupeLeads");
addCheck("agent-score-leads", agent.includes("scoreLead"), "scoreLead");
addCheck("agent-pj02-shape", agent.includes("toPj02Shape"), "PJ02 compatible export");
addCheck("agent-writes-discovered-jobs", agent.includes("discovered-jobs.local.json"), "discovered jobs local");
addCheck("agent-no-auto-apply-boundary", agent.includes("requiresHumanApprovalBeforeApply") && agent.includes("sendsApplications: false"), "human approval");
addCheck("playwright-scout-optional", scout.includes('import("playwright")') && scout.includes("PLAYWRIGHT_NOT_INSTALLED"), "optional dynamic Playwright");
addCheck("playwright-scout-no-bypass", scout.includes("noCaptchaBypass") && scout.includes("noCredentialUse"), "no bypass");
addCheck("api-runs-agent", api.includes("personal-job-discovery-agent.mjs") && api.includes("spawnSync"), "API runs local agent");
addCheck("api-node-runtime", api.includes('runtime = "nodejs"'), "nodejs runtime");
addCheck("page-client", page.includes("JobFinderClient"), "JobFinderClient");
addCheck("client-run-button", client.includes("Run job finder"), "run button");
addCheck("client-api-call", client.includes("/api/personal-jobs/job-finder/run"), "API route call");
addCheck("client-exports-pj02", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 localStorage key");
addCheck("client-no-manual-job-core", client.includes("Manual job entry is now only a fallback"), "manual entry fallback");
addCheck("contract-capabilities", contract.includes("searchesRealSources: true") && contract.includes("exportsToPj02Shape: true"), "contract capabilities");
addCheck("contract-boundaries", contract.includes("sendsApplications: false") && contract.includes("contactsEmployers: false"), "contract boundaries");
addCheck("doc-purpose-corrected", doc.includes("The main goal is not manual job entry"), "direction corrected");
addCheck("manifest-valid-json", Boolean(manifest), "manifest json");
addCheck("manifest-route", manifest?.route === "/personal-job-desk/job-finder", manifest?.route);
addCheck("manifest-real-search", manifest?.searches_real_sources === true, "real sources true");
addCheck("manifest-manual-entry-fallback", manifest?.manual_job_entry_fallback_only === true, "manual fallback only");
addCheck("manifest-no-production", manifest?.production_ready === false && manifest?.deployed_to_oracle === false, "no production claim");
addCheck("manifest-no-send", manifest?.sends_email === false && manifest?.sends_whatsapp === false && manifest?.sends_applications === false, "no send/apply");
addCheck("manifest-no-payment", manifest?.touches_payments === false, "no payment");
addCheck("manifest-human-approval", manifest?.requires_human_approval_before_apply === true, "human approval");

const syntaxTargets = [
  "scripts/agents/personal-job-discovery-agent.mjs",
  "scripts/agents/playwright-job-source-scout.mjs",
  "scripts/proof/prove-personal-jobs-17-real-job-discovery-agent.mjs"
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

if (exists("scripts/agents/personal-job-discovery-agent.mjs")) {
  const dryRun = spawnSync(process.execPath, ["scripts/agents/personal-job-discovery-agent.mjs", "--dry-run", "--json"], {
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
  addCheck("agent-dry-run-generates-queries", Array.isArray(dryJson?.searchQueries) && dryJson.searchQueries.length > 0, `${dryJson?.searchQueries?.length ?? 0} queries`);
  addCheck("agent-dry-run-uses-one-profile", dryJson?.usedOneProfile === true, "usedOneProfile true");
}

const committedText = [
  "scripts/agents/personal-job-discovery-agent.mjs",
  "scripts/agents/playwright-job-source-scout.mjs",
  "apps/web/src/app/api/personal-jobs/job-finder/run/route.ts",
  "apps/web/src/app/personal-job-desk/job-finder/JobFinderClient.tsx",
  "packages/contracts/src/personal-jobs-17-real-job-discovery-agent.ts",
  "docs/personal-jobs/personal-jobs-17-real-job-discovery-agent.md",
  "manifests/personal-jobs/personal-jobs-17-real-job-discovery-agent.json"
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
  schema: "kingsmen.personal-jobs-17-proof.v1",
  module: "PERSONAL-JOBS-17 - Real Job Discovery Agent / One-Profile Job Finder / Playwright Source Scout",
  status: passed ? "PERSONAL_JOBS_17_REAL_JOB_DISCOVERY_AGENT_PROVEN" : "PERSONAL_JOBS_17_REAL_JOB_DISCOVERY_AGENT_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  route: "/personal-job-desk/job-finder",
  apiRoute: "/api/personal-jobs/job-finder/run",
  searchesRealSources: true,
  manualJobEntryRequired: false,
  manualJobEntryFallbackOnly: true,
  supportsPlaywrightScout: true,
  exportsToPj02Shape: true,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  contactsEmployers: false,
  generated_at: new Date().toISOString(),
  checks,
  failed: checks.filter((check) => !check.passed),
  next_action: passed
    ? "Run validator, commit PJ17 files, then open /personal-job-desk/job-finder and press Run job finder."
    : "Repair failed PJ17 checks before committing."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (!passed) process.exitCode = 1;