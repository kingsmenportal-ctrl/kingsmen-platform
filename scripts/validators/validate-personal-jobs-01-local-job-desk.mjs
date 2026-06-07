#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const checks = [];
const validationPath = "reports/validation/personal-jobs-01-local-job-desk-latest.json";
const proofPath = "reports/personal-jobs/personal-jobs-01-local-job-desk-proof.json";
const localPrivateProfilePath = "data/personal-job-desk/personal-candidate.local.json";

const expectedFiles = [
  ".gitignore",
  "apps/web/src/app/personal-job-desk/page.tsx",
  "apps/web/src/app/personal-job-desk/PersonalJobDeskClient.tsx",
  "docs/personal-jobs/personal-jobs-01-local-job-desk.md",
  "manifests/personal-jobs/personal-jobs-01-local-job-desk.json",
  "packages/contracts/src/personal-jobs-01-local-job-desk.ts",
  "scripts/proof/prove-personal-jobs-01-local-job-desk.mjs",
  "scripts/validators/validate-personal-jobs-01-local-job-desk.mjs",
  proofPath
];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readText(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeJson(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

for (const file of expectedFiles) {
  check(`expected-file:${file}`, exists(file), file);
}

const proof = exists(proofPath) ? readJson(proofPath) : null;

check("proof-schema", proof?.schema === "kingsmen.personal-jobs-01-proof.v1", proof?.schema ?? "missing");
check("proof-status", proof?.status === "PERSONAL_JOBS_01_LOCAL_JOB_DESK_PROVEN", proof?.status ?? "missing");
check("proof-passed", proof?.passed === true, String(proof?.passed));
check("proof-not-production", proof?.productionReady === false && proof?.canClaimProduction === false, "production false");
check("proof-not-oracle", proof?.deployedToOracle === false, "oracle false");
check("proof-no-docker", proof?.startsDocker === false, "docker false");
check("proof-no-failed-checks", Array.isArray(proof?.failed) && proof.failed.length === 0, `failed=${proof?.failed?.length ?? "unknown"}`);

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

check("route-file-loads-client", page.includes("PersonalJobDeskClient"), "server to client route");
check("route-file-loads-private-profile", page.includes("personal-candidate.local.json"), "private profile read");
check("client-route-marker", client.includes('data-kingsmen-personal-jobs-desk="true"'), "desk marker");
check("client-local-storage", client.includes("window.localStorage"), "local tracking");
check("client-opportunity-board", client.includes("Tracked opportunities"), "opportunity board");
check("client-cv-atelier", client.includes("CV & Motivation Atelier"), "CV planner");

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const validation = {
  schema: "kingsmen.validation-report.v1",
  module: "PERSONAL-JOBS-01 - Local Personal Job Desk",
  status: passed ? "VALIDATED" : "FAILED",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: expectedFiles,
  files_checked: expectedFiles.length,
  missing_files: expectedFiles.filter((file) => !exists(file)),
  failed_checks: failed,
  warnings: [
    "Local private profile exists for this workstation only and is intentionally not committed."
  ],
  oracle_lite_impact: "none_local_ui_only",
  route: "/personal-job-desk",
  local_private_profile: localPrivateProfilePath,
  next_action: passed
    ? "Commit PERSONAL-JOBS-01 tracked files only. Do not add the local private profile."
    : "Repair PERSONAL-JOBS-01 before moving forward."
};

writeJson(validationPath, validation);
console.log(JSON.stringify(validation, null, 2));

if (!passed) process.exit(1);
