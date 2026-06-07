#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const checks = [];

const committedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/page.tsx",
  "apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx",
  "docs/personal-jobs/personal-jobs-01-local-job-desk.md",
  "manifests/personal-jobs/personal-jobs-01-local-job-desk.json",
  "packages/contracts/src/personal-jobs-01-local-job-desk.ts",
  "scripts/proof/prove-personal-jobs-01-local-job-desk.mjs",
  "scripts/validators/validate-personal-jobs-01-local-job-desk.mjs"
];

const localPrivateProfilePath = "data/personal-job-desk/personal-candidate.local.json";
const proofPath = "reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json";

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function writeJson(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of committedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

check("local-private-profile-exists", exists(localPrivateProfilePath), "local private profile must exist for founder local use");

let profileLoaded = false;
if (exists(localPrivateProfilePath)) {
  const parsed = JSON.parse(readText(localPrivateProfilePath));
  profileLoaded =
    parsed?.privacy === "LOCAL_ONLY_NOT_FOR_GIT" &&
    typeof parsed?.candidate?.displayName === "string" &&
    Array.isArray(parsed?.candidate?.targetRoles) &&
    parsed.candidate.targetRoles.length >= 10 &&
    Array.isArray(parsed?.candidate?.proofPoints) &&
    parsed.candidate.proofPoints.length >= 5;
}

check("local-private-profile-valid", profileLoaded, "profile shape and campaign data");

let ignored = false;
try {
  execSync(`git check-ignore ${localPrivateProfilePath}`, { cwd: root, stdio: "pipe" });
  ignored = true;
} catch {
  ignored = false;
}

check("local-private-profile-ignored-by-git", ignored, localPrivateProfilePath);

let trackedPrivateProfile = "";
try {
  trackedPrivateProfile = execSync(`git ls-files ${localPrivateProfilePath}`, { cwd: root, encoding: "utf8" }).trim();
} catch {
  trackedPrivateProfile = "git ls-files failed";
}

check("local-private-profile-not-tracked", trackedPrivateProfile.length === 0, "private profile must not be tracked");

const page = exists("apps/web/src/app/personal-job-desk/page.tsx")
  ? readText("apps/web/src/app/personal-job-desk/page.tsx")
  : "";

const client = exists("apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx")
  ? readText("apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx")
  : "";

check("page-reads-local-private-profile", page.includes("personal-candidate.local.json"), "server page reads ignored local profile");
check("page-force-dynamic", page.includes('dynamic = "force-dynamic"'), "local profile should be read at runtime");
check("client-has-personal-job-desk-marker", client.includes('data-kingsmen-personal-jobs-desk="true"'), "desk marker");
check("client-has-opportunity-capture", client.includes('data-kingsmen-add-opportunity="true"'), "opportunity capture marker");
check("client-uses-local-storage", client.includes("window.localStorage"), "browser localStorage tracker");
check("client-has-15-cv-slots", client.includes("length: 15"), "15 CV and motivation-letter slots");
check("client-has-no-email-send", !client.includes("sendEmail") && !client.includes("gmail") && !client.includes("SMTP"), "no outbound email runtime");
const clientHasPaymentRuntime = /payfast|pay_fast|checkoutSession|checkoutProvider|merchant[_-]?key|paymentProvider|processPayment|createPayment|paymentIntent/i.test(client);
check("client-has-no-payment-runtime", !clientHasPaymentRuntime, "no payment runtime");
const clientHasWhatsAppRuntime = /WHATSAPP_TOKEN|sendWhatsApp|wa\.me|api\.whatsapp\.com|whatsappBusiness|twilio/i.test(client);
check("client-has-no-whatsapp-runtime", !clientHasWhatsAppRuntime, "no WhatsApp runtime");

const committedCombined = committedFiles
  .filter((file) => exists(file))
  .map((file) => readText(file))
  .join("\n");

const contactPatterns = [
  /ndabenhlemvel@gmail\.com/i,
  /072\s*064\s*6072/i
];

for (const pattern of contactPatterns) {
  check(`committed-files-no-personal-contact:${pattern}`, !pattern.test(committedCombined), "personal contact must remain local-only");
}

const runtimeCombined = [page, client].join("\n");

const forbiddenRuntimePatterns = [
  { name: "service_role", regex: /service_role/i },
  { name: "PAYFAST_PASSPHRASE", regex: /PAYFAST_PASSPHRASE/i },
  { name: "private-key-material", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { name: "oci-private-path", regex: /\.oci[\\/]/i },
  { name: "ssh-private-path", regex: /\.ssh[\\/]/i },
  { name: "docker-compose-up-runtime", regex: /\bdocker\s+compose\s+up\b/i },
  { name: "positive-oracle-claim", regex: /deployedToOracle\s*[:=]\s*true|deployedToOracle"\s*:\s*true/i },
  { name: "positive-production-claim", regex: /productionReady\s*[:=]\s*true|productionReady"\s*:\s*true/i }
];

for (const item of forbiddenRuntimePatterns) {
  check(`runtime-no-forbidden:${item.name}`, !item.regex.test(runtimeCombined), item.name);
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.personal-jobs-01-proof.v1",
  module: "PERSONAL-JOBS-01 - Local Personal Job Desk",
  status: passed ? "PERSONAL_JOBS_01_LOCAL_JOB_DESK_PROVEN" : "PERSONAL_JOBS_01_LOCAL_JOB_DESK_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  generated_at: new Date().toISOString(),
  route: "/personal-job-desk",
  localPrivateProfilePath,
  localPrivateProfileIgnoredByGit: ignored,
  committedFilesContainPersonalContact: false,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit PERSONAL-JOBS-01 tracked files only."
    : "Repair PERSONAL-JOBS-01 before committing."
};

writeJson(proofPath, report);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);

