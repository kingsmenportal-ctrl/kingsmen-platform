#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-controlled-next-boot-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-controlled-next-boot-proof.md",
  "manifests/runtime/free-destiny-map-controlled-next-boot-proof.json",
  "packages/contracts/src/free-destiny-map-controlled-next-boot.ts",
  "scripts/runtime/Invoke-FreeDestinyMapControlledNextBoot.ps1",
  "scripts/proof/prove-free-destiny-map-controlled-next-boot.mjs",
  "reports/runtime/free-destiny-map-controlled-next-boot-proof.json",
  "scripts/validators/validate-free-destiny-map-controlled-next-boot.mjs",
  "reports/validation/free-destiny-map-controlled-next-boot-latest.json"
];

const upstreamFiles = [
  "apps/web/package.json",
  "apps/web/package-lock.json",
  "apps/web/next.config.mjs",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "reports/runtime/free-destiny-map-real-web-readiness-proof.json",
  "reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json"
];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function parseJson(rel) {
  return JSON.parse(read(rel));
}

const failures = [];
const warnings = [];
const checked = [];

for (const file of requiredFiles) {
  checked.push(file);
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(path.join(root, file)).size === 0) failures.push(`Empty required file: ${file}`);
}

for (const file of upstreamFiles) {
  checked.push(file);
  if (!exists(file)) failures.push(`Missing upstream file: ${file}`);
  else if (fs.statSync(path.join(root, file)).size === 0) failures.push(`Empty upstream file: ${file}`);
}

if (exists("manifests/runtime/free-destiny-map-controlled-next-boot-proof.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-controlled-next-boot-proof.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.webRoute !== "/free-destiny-map") failures.push("Manifest web route mismatch.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["packages/contracts/src/free-destiny-map-controlled-next-boot.ts", ["CONTROLLED_NEXT_BOOT_PROVEN", "serverStarted", "serverStopped", "canClaimProduction: false"]],
  ["scripts/runtime/Invoke-FreeDestinyMapControlledNextBoot.ps1", ["TimeoutSeconds", "controlled Next web boot proof", "does not claim production"]],
  ["scripts/proof/prove-free-destiny-map-controlled-next-boot.mjs", ["CONTROLLED_NEXT_BOOT_PROVEN", "npm", "next dev", "controlled-next-route-status-200", "controlled-next-server-stopped"]],
  ["reports/runtime/free-destiny-map-controlled-next-boot-proof.json", ["schema", "module", "status"]],
  ["apps/web/package.json", ["next dev", "next build", "next start"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-controlled-next-boot-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-controlled-next-boot-proof.json");
  if (proof.passed !== true) failures.push("Controlled Next boot proof must pass.");
  if (proof.status !== "CONTROLLED_NEXT_BOOT_PROVEN") failures.push("Controlled Next boot proof status must be CONTROLLED_NEXT_BOOT_PROVEN.");
  if (proof.productionReady !== false) failures.push("Controlled Next boot proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Controlled Next boot proof must keep canClaimProduction false.");
  if (proof.serverStarted !== true) failures.push("Controlled Next boot proof must start server.");
  if (proof.serverStopped !== true) failures.push("Controlled Next boot proof must stop server.");
  if (proof.webStatus !== 200) failures.push("Controlled Next boot proof must record webStatus 200.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 10) failures.push("Controlled Next boot proof must include detailed checks.");
}

const forbiddenFiles = [
  "docs/runtime/free-destiny-map-controlled-next-boot-proof.md",
  "manifests/runtime/free-destiny-map-controlled-next-boot-proof.json",
  "packages/contracts/src/free-destiny-map-controlled-next-boot.ts",
  "scripts/runtime/Invoke-FreeDestinyMapControlledNextBoot.ps1",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx"
];

const forbiddenPatterns = [
  [/productionReady\s*[:=]\s*true/i, "productionReady true"],
  [/canClaimProduction\s*[:=]\s*true/i, "canClaimProduction true"],
  [/officialApplicationSubmitted:\s*true/i, "official application submitted true"],
  [/paymentInstructionSent:\s*true/i, "payment instruction sent true"],
  [/emailSent:\s*true/i, "email sent true"],
  [/documentUploadAccepted:\s*true/i, "document upload accepted true"]
];

for (const file of forbiddenFiles) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden pattern: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 14 - Controlled Local Next Web Boot Proof",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  upstream_files_checked: upstreamFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Adds controlled real Next local web boot proof for Free Destiny Map.",
  runtime_proof: "reports/runtime/free-destiny-map-controlled-next-boot-proof.json",
  next_action: passed ? "Proceed to BATCH 15 - Controlled local API integration or production build proof." : "Repair controlled Next boot failures and rerun proof plus validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
