import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../..");

const moduleName = "PERSONAL-JOBS-16 - GitHub Proof Index / Build Ledger / Founder Handover";
const route = "/personal-job-desk/proof-index";

const reportPath = path.join(
  root,
  "reports/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover-proof.json"
);

const checks = [];

function normalizePath(relativePath) {
  return relativePath.replace(/\\/g, "/");
}

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
  checks.push({
    name,
    passed: Boolean(passed),
    detail: String(detail ?? "")
  });
}

function findReport(prefix, directory, suffix) {
  const directoryPath = abs(directory);

  if (!fs.existsSync(directoryPath)) {
    return null;
  }

  const match = fs
    .readdirSync(directoryPath)
    .filter((fileName) => fileName.startsWith(prefix) && fileName.endsWith(suffix))
    .sort()
    .at(-1);

  return match ? normalizePath(path.join(directory, match)) : null;
}

function git(args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

const expectedFiles = [
  "apps/web/src/app/personal-job-desk/proof-index/page.tsx",
  "apps/web/src/app/personal-job-desk/proof-index/ProofIndexClient.tsx",
  "docs/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover.md",
  "manifests/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover.json",
  "packages/contracts/src/personal-jobs-16-github-proof-index-build-ledger-founder-handover.ts",
  "scripts/proof/prove-personal-jobs-16-github-proof-index-build-ledger-founder-handover.mjs",
  "scripts/validators/validate-personal-jobs-16-github-proof-index-build-ledger-founder-handover.mjs"
];

for (const filePath of expectedFiles) {
  addCheck(`expected-file:${filePath}`, exists(filePath), filePath);
}

const pageText = exists(expectedFiles[0]) ? read(expectedFiles[0]) : "";
const clientText = exists(expectedFiles[1]) ? read(expectedFiles[1]) : "";
const docText = exists(expectedFiles[2]) ? read(expectedFiles[2]) : "";
const manifest = exists(expectedFiles[3]) ? parseJson(expectedFiles[3]) : null;
const contractText = exists(expectedFiles[4]) ? read(expectedFiles[4]) : "";

addCheck("page-uses-proof-index-client", pageText.includes("ProofIndexClient"), "ProofIndexClient");
addCheck("page-force-dynamic", pageText.includes('dynamic = "force-dynamic"'), "force dynamic local route");
addCheck("client-marker", clientText.includes("PERSONAL_JOBS_16_GITHUB_PROOF_INDEX_BUILD_LEDGER_FOUNDER_HANDOVER"), "PJ16 marker");
addCheck("client-build-ledger", clientText.includes("Build ledger"), "Build ledger");
addCheck("client-founder-handover", clientText.includes("Founder handover"), "Founder handover");
addCheck("client-local-storage-visit", clientText.includes("kingsmen.personalJobs16.githubProofIndex.v1"), "visit key");
addCheck("client-local-storage-handover", clientText.includes("kingsmen.personalJobs16.founderHandover.v1"), "handover key");
addCheck("client-runtime-click-test-link", clientText.includes("/personal-job-desk/runtime-click-test"), "runtime click test route");
addCheck("client-navigation-link", clientText.includes("/personal-job-desk/navigation"), "navigation route");
addCheck("client-no-send-boundary", clientText.includes("does not perform internet search"), "no-send boundary");
addCheck("doc-proof-authority", docText.includes("The proof authority remains the repository"), "proof authority");
addCheck("doc-locked-boundary", docText.includes("Locked boundary"), "locked boundary");
addCheck("contract-export", contractText.includes("PERSONAL_JOBS_16_MODULE"), "contract export");
addCheck("contract-route", contractText.includes(route), route);
addCheck("contract-production-false", contractText.includes("productionReady: false"), "production false");

addCheck("manifest-json-valid", Boolean(manifest), "valid json");
addCheck("manifest-status-built-pending-validation", manifest?.status === "BUILT_PENDING_VALIDATION", manifest?.status);
addCheck("manifest-route", manifest?.route === route, manifest?.route);
addCheck("manifest-no-production", manifest?.production_ready === false, "production false");
addCheck("manifest-no-oracle", manifest?.deployed_to_oracle === false, "oracle false");
addCheck("manifest-no-docker", manifest?.starts_docker === false, "docker false");
addCheck("manifest-no-send-email", manifest?.sends_email === false, "email false");
addCheck("manifest-no-whatsapp", manifest?.sends_whatsapp === false, "whatsapp false");
addCheck("manifest-no-payment", manifest?.touches_payments === false, "payments false");
addCheck("manifest-required-dependency-count", Array.isArray(manifest?.required_dependency_modules) && manifest.required_dependency_modules.length === 13, "13 dependency modules");

const requiredModuleNumbers = ["01", "02", "03", "04", "06", "07", "08", "10", "11", "12", "13", "14", "15"];
const dependencyIndex = [];

for (const number of requiredModuleNumbers) {
  const prefix = `personal-jobs-${number}-`;
  const proof = findReport(prefix, "reports/personal-jobs", "-proof.json");
  const validation = findReport(prefix, "reports/validation", "-latest.json");

  addCheck(`dependency-proof-exists:PJ${number}`, Boolean(proof), proof ?? "missing");
  addCheck(`dependency-validation-exists:PJ${number}`, Boolean(validation), validation ?? "missing");

  const proofJson = proof ? parseJson(proof) : null;
  const validationJson = validation ? parseJson(validation) : null;

  addCheck(`dependency-proof-passed:PJ${number}`, proofJson?.passed === true, proofJson?.status ?? "missing proof json");
  addCheck(`dependency-validation-passed:PJ${number}`, validationJson?.passed === true, validationJson?.status ?? "missing validation json");

  dependencyIndex.push({
    module: `PERSONAL-JOBS-${number}`,
    proof,
    proofPassed: proofJson?.passed === true,
    validation,
    validationPassed: validationJson?.passed === true
  });
}

const committedFiles = [
  "apps/web/src/app/personal-job-desk/proof-index/page.tsx",
  "apps/web/src/app/personal-job-desk/proof-index/ProofIndexClient.tsx",
  "docs/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover.md",
  "manifests/personal-jobs/personal-jobs-16-github-proof-index-build-ledger-founder-handover.json",
  "packages/contracts/src/personal-jobs-16-github-proof-index-build-ledger-founder-handover.ts"
];

const committedText = committedFiles
  .filter(exists)
  .map(read)
  .join("\n");

const forbiddenRuntimeStrings = [
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
  "PRODUCTION_READY_TRUE",
  "DEPLOYED_TO_ORACLE_TRUE"
];

for (const forbidden of forbiddenRuntimeStrings) {
  addCheck(`runtime-no-forbidden:${forbidden}`, !committedText.includes(forbidden), forbidden);
}

const containsPersonalContact =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(committedText) ||
  /(?:^|[^0-9])(?:\+27|0)(?:\s|-)?[6-8][0-9](?:\s|-)?[0-9]{3}(?:\s|-)?[0-9]{4}(?:[^0-9]|$)/.test(committedText);

addCheck("committed-files-no-personal-contact", !containsPersonalContact, "no email or phone in committed PJ16 files");

const gitInside = git(["rev-parse", "--is-inside-work-tree"]);
const gitHead = git(["rev-parse", "--short", "HEAD"]);
const gitBranch = git(["branch", "--show-current"]);
const gitRemote = git(["remote", "get-url", "origin"]);
const gitStatusShort = git(["status", "--short"]) ?? "";

addCheck("git-worktree", gitInside === "true", gitInside ?? "not a git worktree");
addCheck("git-head-readable", Boolean(gitHead), gitHead ?? "missing");
addCheck("git-branch-readable", Boolean(gitBranch), gitBranch ?? "missing");
addCheck("git-origin-readable", Boolean(gitRemote), gitRemote ? "origin configured" : "missing origin");

const passed = checks.every((check) => check.passed);

const result = {
  schema: "kingsmen.personal-jobs-16-proof.v1",
  module: moduleName,
  status: passed
    ? "PERSONAL_JOBS_16_GITHUB_PROOF_INDEX_BUILD_LEDGER_FOUNDER_HANDOVER_PROVEN"
    : "PERSONAL_JOBS_16_GITHUB_PROOF_INDEX_BUILD_LEDGER_FOUNDER_HANDOVER_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route,
  writesLocalStorageKeys: [
    "kingsmen.personalJobs16.githubProofIndex.v1",
    "kingsmen.personalJobs16.founderHandover.v1"
  ],
  dependencyModuleCount: dependencyIndex.length,
  dependencyIndex,
  git: {
    insideWorktree: gitInside === "true",
    branch: gitBranch ?? "not available",
    head: gitHead ?? "not available",
    originConfigured: Boolean(gitRemote),
    workingTreeCleanBeforeCommit: gitStatusShort.trim().length === 0,
    statusShort: gitStatusShort
  },
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
  failed: checks.filter((check) => !check.passed),
  next_action: passed
    ? "Run validator and commit PERSONAL-JOBS-16 tracked files only."
    : "Repair failed checks before committing PERSONAL-JOBS-16."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(JSON.stringify(result, null, 2));

if (!passed) {
  process.exitCode = 1;
}