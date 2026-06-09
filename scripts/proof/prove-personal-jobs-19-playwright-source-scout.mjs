import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const checks = [];
const reportPath = path.join(root, "reports/personal-jobs/personal-jobs-19-playwright-source-scout-proof.json");

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
  "data/personal-job-desk/source-scout-queue.local.example.json",
  "scripts/agents/personal-job-playwright-source-scout.mjs",
  "apps/web/src/app/api/personal-jobs/source-scout/run/route.ts",
  "apps/web/src/app/personal-job-desk/source-scout/page.tsx",
  "apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx",
  "packages/contracts/src/personal-jobs-19-playwright-source-scout.ts",
  "docs/personal-jobs/personal-jobs-19-playwright-source-scout.md",
  "manifests/personal-jobs/personal-jobs-19-playwright-source-scout.json",
  "scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs",
  "scripts/validators/validate-personal-jobs-19-playwright-source-scout.mjs"
];

for (const file of expectedFiles) {
  addCheck(`expected-file:${file}`, exists(file), file);
}

const gitignore = exists(".gitignore") ? read(".gitignore") : "";
const queueExample = exists(expectedFiles[1]) ? parseJson(expectedFiles[1]) : null;
const agent = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const api = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const page = exists(expectedFiles[4]) ? read(expectedFiles[4]) : "";
const client = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";
const contract = exists(expectedFiles[6]) ? read(expectedFiles[6]) : "";
const doc = exists(expectedFiles[7]) ? read(expectedFiles[7]) : "";
const manifest = exists(expectedFiles[8]) ? parseJson(expectedFiles[8]) : null;

addCheck("gitignore-scout-results", gitignore.includes("data/personal-job-desk/playwright-source-scout-results.local.json"), "scout results ignored");
addCheck("gitignore-source-health", gitignore.includes("data/personal-job-desk/sa-source-health.local.json"), "source health ignored");
addCheck("gitignore-latest-report", gitignore.includes("reports/personal-jobs/personal-jobs-19-source-scout-latest.json"), "latest run report ignored");
addCheck("queue-example-valid-json", Boolean(queueExample), "valid queue example json");
addCheck("queue-example-schema", queueExample?.schema === "kingsmen.personal-jobs-19.source-scout-queue.v1", queueExample?.schema);
addCheck("queue-example-safety", queueExample?.safety?.noAutoApply === true && queueExample?.safety?.noCaptchaBypass === true, "queue safety");
addCheck("agent-dynamic-playwright-import", agent.includes('import("playwright")'), "dynamic playwright import");
addCheck("agent-reads-one-profile", agent.includes("personal-candidate.local.json"), "one profile");
addCheck("agent-reads-pj18-sources", agent.includes("sa-job-sources.local.json"), "PJ18 source registry");
addCheck("agent-queue-override", agent.includes("source-scout-queue.local.json"), "local queue override");
addCheck("agent-health-statuses", agent.includes("HEALTHY_JS_RENDERED") && agent.includes("BLOCKED_BY_CAPTCHA") && agent.includes("MANUAL_REVIEW_REQUIRED"), "health statuses");
addCheck("agent-max-concurrency-one", agent.includes("maxConcurrency: 1"), "max concurrency 1");
addCheck("agent-extracts-links", agent.includes('page.$$eval("a[href]"'), "visible link extraction");
addCheck("agent-blocker-detection", agent.includes("detectBlockers") && agent.includes("BLOCKED_BY_LOGIN"), "blocker detection");
addCheck("agent-pj02-shape", agent.includes("toPj02Shape"), "PJ02 export");
addCheck("agent-combines-pj17-pj18", agent.includes("PJ17_DISCOVERED_PATH") && agent.includes("PJ18_DISCOVERED_PATH"), "combines prior leads");
addCheck("agent-no-auto-apply", agent.includes("requiresHumanApprovalBeforeApply") && agent.includes("sendsApplications: false"), "no auto-apply");
addCheck("api-runs-agent", api.includes("personal-job-playwright-source-scout.mjs") && api.includes("spawnSync"), "API runs scout agent");
addCheck("api-node-runtime", api.includes('runtime = "nodejs"'), "node runtime");
addCheck("page-client", page.includes("SourceScoutClient"), "SourceScoutClient route");
addCheck("client-run-button", client.includes("Run Playwright source scout"), "run button");
addCheck("client-api-call", client.includes("/api/personal-jobs/source-scout/run"), "API route call");
addCheck("client-pj02-export", client.includes("kingsmen.personalJobs02.externalLeads.v1"), "PJ02 local storage export");
addCheck("client-health-key", client.includes("kingsmen.personalJobs19.sourceHealth.v1"), "source health local storage");
addCheck("contract-playwright", contract.includes("usesPlaywrightScout: true") && contract.includes("reportsSourceHealth: true"), "contract capabilities");
addCheck("contract-boundaries", contract.includes("sendsApplications: false") && contract.includes("bypassesLoginOrCaptcha: false"), "contract boundaries");
addCheck("doc-purpose", doc.includes("controlled Playwright scout"), "doc purpose");
addCheck("doc-health-statuses", doc.includes("BLOCKED_BY_CAPTCHA") && doc.includes("TIMEOUT"), "doc health statuses");
addCheck("manifest-valid-json", Boolean(manifest), "manifest json");
addCheck("manifest-route", manifest?.route === "/personal-job-desk/source-scout", manifest?.route);
addCheck("manifest-api-route", manifest?.api_route === "/api/personal-jobs/source-scout/run", manifest?.api_route);
addCheck("manifest-country-focus", manifest?.country_focus === "South Africa", manifest?.country_focus);
addCheck("manifest-playwright-true", manifest?.uses_playwright_scout === true, "uses playwright");
addCheck("manifest-max-concurrency-one", manifest?.max_concurrency === 1, "max concurrency 1");
addCheck("manifest-source-health", manifest?.reports_source_health === true, "source health");
addCheck("manifest-no-production", manifest?.production_ready === false && manifest?.deployed_to_oracle === false, "no production claim");
addCheck("manifest-no-send", manifest?.sends_email === false && manifest?.sends_whatsapp === false && manifest?.sends_applications === false, "no send/apply");
addCheck("manifest-no-bypass", manifest?.bypasses_login_or_captcha === false, "no bypass");
addCheck("manifest-human-approval", manifest?.requires_human_approval_before_apply === true, "approval required");

const syntaxTargets = [
  "scripts/agents/personal-job-playwright-source-scout.mjs",
  "scripts/proof/prove-personal-jobs-19-playwright-source-scout.mjs"
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

if (exists("scripts/agents/personal-job-playwright-source-scout.mjs")) {
  const dryRun = spawnSync(process.execPath, ["scripts/agents/personal-job-playwright-source-scout.mjs", "--dry-run", "--json"], {
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
  addCheck("agent-dry-run-status", dryJson?.status === "DRY_RUN_READY", dryJson?.status);
  addCheck("agent-dry-run-queue", Number(dryJson?.queueCount ?? 0) >= 1, `${dryJson?.queueCount ?? 0} queued`);
  addCheck("agent-dry-run-health-statuses", Array.isArray(dryJson?.healthStatuses) && dryJson.healthStatuses.includes("BLOCKED_BY_CAPTCHA"), "health statuses returned");
  addCheck("agent-dry-run-boundaries", dryJson?.boundaries?.sendsApplications === false && dryJson?.boundaries?.contactsEmployers === false, "no send/contact");
}

const committedText = [
  "scripts/agents/personal-job-playwright-source-scout.mjs",
  "apps/web/src/app/api/personal-jobs/source-scout/run/route.ts",
  "apps/web/src/app/personal-job-desk/source-scout/SourceScoutClient.tsx",
  "packages/contracts/src/personal-jobs-19-playwright-source-scout.ts",
  "docs/personal-jobs/personal-jobs-19-playwright-source-scout.md",
  "manifests/personal-jobs/personal-jobs-19-playwright-source-scout.json"
].filter(exists).map(read).join("\n");

const forbidden = [
  "smtp.send",
  "sendEmail(",
  "sendWhatsApp(",
  "submitApplication(",
  "payfast-passphrase",
  "service_role",
  "captcha.solve",
  "bypassCaptcha",
  "PRODUCTION_READY_TRUE",
  "DEPLOYED_TO_ORACLE_TRUE"
];

for (const item of forbidden) {
  addCheck(`forbidden-not-present:${item}`, !committedText.includes(item), item);
}

const passed = checks.every((check) => check.passed);

const result = {
  schema: "kingsmen.personal-jobs-19-proof.v1",
  module: "PERSONAL-JOBS-19 - Playwright Source Queue / Employer Career Page Scout / SA Source Health Report",
  status: passed ? "PERSONAL_JOBS_19_PLAYWRIGHT_SOURCE_SCOUT_PROVEN" : "PERSONAL_JOBS_19_PLAYWRIGHT_SOURCE_SCOUT_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  route: "/personal-job-desk/source-scout",
  apiRoute: "/api/personal-jobs/source-scout/run",
  countryFocus: "South Africa",
  usesPlaywrightScout: true,
  maxConcurrency: 1,
  reportsSourceHealth: true,
  extractsVisibleJobLinks: true,
  exportsToPj02Shape: true,
  combinesWithPj17AndPj18Leads: true,
  manualJobEntryRequired: false,
  manualJobEntryFallbackOnly: true,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  contactsEmployers: false,
  bypassesLoginOrCaptcha: false,
  generated_at: new Date().toISOString(),
  checks,
  failed: checks.filter((check) => !check.passed),
  next_action: passed
    ? "Run validator, commit PJ19 files, install Playwright if needed, then test /personal-job-desk/source-scout."
    : "Repair failed PJ19 checks before committing."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (!passed) process.exitCode = 1;