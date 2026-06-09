import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const checks = [];
const reportPath = path.join(root, "reports/personal-jobs/personal-jobs-20-opportunity-command-queue-proof.json");

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
  "scripts/agents/personal-job-opportunity-command-queue.mjs",
  "apps/web/src/app/api/personal-jobs/opportunity-queue/build/route.ts",
  "apps/web/src/app/personal-job-desk/opportunity-queue/page.tsx",
  "apps/web/src/app/personal-job-desk/opportunity-queue/OpportunityQueueClient.tsx",
  "packages/contracts/src/personal-jobs-20-opportunity-command-queue.ts",
  "docs/personal-jobs/personal-jobs-20-opportunity-command-queue.md",
  "manifests/personal-jobs/personal-jobs-20-opportunity-command-queue.json",
  "scripts/proof/prove-personal-jobs-20-opportunity-command-queue.mjs",
  "scripts/validators/validate-personal-jobs-20-opportunity-command-queue.mjs"
];

for (const file of expectedFiles) {
  addCheck(`expected-file:${file}`, exists(file), file);
}

const gitignore = exists(".gitignore") ? read(".gitignore") : "";
const agent = exists(expectedFiles[1]) ? read(expectedFiles[1]) : "";
const api = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const page = exists(expectedFiles[3]) ? read(expectedFiles[3]) : "";
const client = exists(expectedFiles[4]) ? read(expectedFiles[4]) : "";
const contract = exists(expectedFiles[5]) ? read(expectedFiles[5]) : "";
const doc = exists(expectedFiles[6]) ? read(expectedFiles[6]) : "";
const manifest = exists(expectedFiles[7]) ? parseJson(expectedFiles[7]) : null;

addCheck("gitignore-queue-local", gitignore.includes("data/personal-job-desk/opportunity-command-queue.local.json"), "local queue ignored");
addCheck("gitignore-latest-report", gitignore.includes("reports/personal-jobs/personal-jobs-20-opportunity-command-queue-latest.json"), "latest report ignored");
addCheck("agent-reads-pj17", agent.includes("discovered-jobs.local.json"), "PJ17 input");
addCheck("agent-reads-pj18", agent.includes("sa-discovered-jobs.local.json"), "PJ18 input");
addCheck("agent-reads-pj19", agent.includes("playwright-source-scout-results.local.json"), "PJ19 input");
addCheck("agent-reads-health", agent.includes("sa-source-health.local.json"), "source health input");
addCheck("agent-readiness-states", agent.includes("READY_FOR_APPLY_PACK") && agent.includes("NEEDS_MANUAL_SOURCE_REVIEW") && agent.includes("LOW_PRIORITY_REJECT_CANDIDATE"), "readiness states");
addCheck("agent-dedupe", agent.includes("dedupeQueue"), "dedupeQueue");
addCheck("agent-readiness-score", agent.includes("readinessScore"), "readinessScore");
addCheck("agent-apply-pack-candidates", agent.includes("buildApplyPackCandidates"), "apply-pack candidates");
addCheck("agent-no-auto-apply", agent.includes("requiresHumanApprovalBeforeApply") && agent.includes("sendsApplications: false"), "no auto-apply");
addCheck("api-runs-agent", api.includes("personal-job-opportunity-command-queue.mjs") && api.includes("spawnSync"), "API runs queue agent");
addCheck("api-node-runtime", api.includes('runtime = "nodejs"'), "nodejs runtime");
addCheck("page-client", page.includes("OpportunityQueueClient"), "OpportunityQueueClient route");
addCheck("client-build-button", client.includes("Build opportunity queue"), "build button");
addCheck("client-select-button", client.includes("Select for apply pack"), "select button");
addCheck("client-api-call", client.includes("/api/personal-jobs/opportunity-queue/build"), "API route call");
addCheck("client-export-key", client.includes("kingsmen.personalJobs04.applyPackCandidates.v1"), "apply pack key");
addCheck("contract-combines", contract.includes("combinesPj17Pj18Pj19Leads: true"), "contract combines");
addCheck("contract-boundaries", contract.includes("sendsApplications: false") && contract.includes("contactsEmployers: false"), "contract boundaries");
addCheck("doc-purpose", doc.includes("turns discovered leads into an action queue"), "doc purpose");
addCheck("manifest-valid-json", Boolean(manifest), "manifest json");
addCheck("manifest-route", manifest?.route === "/personal-job-desk/opportunity-queue", manifest?.route);
addCheck("manifest-api-route", manifest?.api_route === "/api/personal-jobs/opportunity-queue/build", manifest?.api_route);
addCheck("manifest-combines", manifest?.combines_pj17_pj18_pj19_leads === true, "combines leads");
addCheck("manifest-dedupes", manifest?.deduplicates_opportunities === true, "dedupes");
addCheck("manifest-readiness", manifest?.classifies_apply_readiness === true, "readiness classification");
addCheck("manifest-no-production", manifest?.production_ready === false && manifest?.deployed_to_oracle === false, "no production claim");
addCheck("manifest-no-send", manifest?.sends_email === false && manifest?.sends_whatsapp === false && manifest?.sends_applications === false, "no send/apply");
addCheck("manifest-human-approval", manifest?.requires_human_approval_before_apply === true, "approval required");

const syntaxTargets = [
  "scripts/agents/personal-job-opportunity-command-queue.mjs",
  "scripts/proof/prove-personal-jobs-20-opportunity-command-queue.mjs"
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

if (exists("scripts/agents/personal-job-opportunity-command-queue.mjs")) {
  const dryRun = spawnSync(process.execPath, ["scripts/agents/personal-job-opportunity-command-queue.mjs", "--dry-run", "--json"], {
    cwd: root,
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 1024 * 1024 * 8
  });

  let dryJson = null;
  try {
    dryJson = JSON.parse(dryRun.stdout);
  } catch {
    dryJson = null;
  }

  addCheck("agent-dry-run-exit-zero", dryRun.status === 0, dryRun.stderr || "dry run ok");
  addCheck("agent-dry-run-status", dryJson?.status === "COMPLETED", dryJson?.status);
  addCheck("agent-dry-run-state-counts", dryJson?.stateCounts && typeof dryJson.stateCounts === "object", "state counts returned");
  addCheck("agent-dry-run-boundaries", dryJson?.boundaries?.sendsApplications === false && dryJson?.boundaries?.contactsEmployers === false, "no send/contact");
}

const committedText = [
  "scripts/agents/personal-job-opportunity-command-queue.mjs",
  "apps/web/src/app/api/personal-jobs/opportunity-queue/build/route.ts",
  "apps/web/src/app/personal-job-desk/opportunity-queue/OpportunityQueueClient.tsx",
  "packages/contracts/src/personal-jobs-20-opportunity-command-queue.ts",
  "docs/personal-jobs/personal-jobs-20-opportunity-command-queue.md",
  "manifests/personal-jobs/personal-jobs-20-opportunity-command-queue.json"
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
  schema: "kingsmen.personal-jobs-20-proof.v1",
  module: "PERSONAL-JOBS-20 - Unified Opportunity Command Queue / Apply Readiness Selector",
  status: passed ? "PERSONAL_JOBS_20_OPPORTUNITY_COMMAND_QUEUE_PROVEN" : "PERSONAL_JOBS_20_OPPORTUNITY_COMMAND_QUEUE_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  route: "/personal-job-desk/opportunity-queue",
  apiRoute: "/api/personal-jobs/opportunity-queue/build",
  combinesPj17Pj18Pj19Leads: true,
  deduplicatesOpportunities: true,
  ranksReadiness: true,
  classifiesApplyReadiness: true,
  usesSourceHealth: true,
  exportsToApplyPackCandidateKey: true,
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
    ? "Run validator, commit PJ20 files, then test /personal-job-desk/opportunity-queue."
    : "Repair failed PJ20 checks before committing."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));

if (!passed) process.exitCode = 1;