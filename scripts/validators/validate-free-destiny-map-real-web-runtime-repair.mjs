#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-real-web-runtime-repair-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-real-web-runtime-repair.md",
  "manifests/runtime/free-destiny-map-real-web-runtime-repair.json",
  "apps/web/package.json",
  "apps/web/.gitignore",
  "apps/web/next.config.mjs",
  "apps/web/tsconfig.json",
  "apps/web/next-env.d.ts",
  "apps/web/src/app/layout.tsx",
  "packages/contracts/src/free-destiny-map-real-web-runtime-repair.ts",
  "scripts/runtime/Invoke-FreeDestinyMapWebRuntimeRepair.ps1",
  "scripts/proof/prove-free-destiny-map-real-web-runtime-repair.mjs",
  "reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json",
  "scripts/validators/validate-free-destiny-map-real-web-runtime-repair.mjs",
  "reports/validation/free-destiny-map-real-web-runtime-repair-latest.json"
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

if (exists("manifests/runtime/free-destiny-map-real-web-runtime-repair.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-real-web-runtime-repair.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

if (exists("apps/web/package.json")) {
  const pkg = parseJson("apps/web/package.json");
  if (!pkg.scripts?.dev || !String(pkg.scripts.dev).includes("next dev")) failures.push("apps/web package must have next dev script.");
  if (!pkg.scripts?.build || !String(pkg.scripts.build).includes("next build")) failures.push("apps/web package must have next build script.");
  if (!pkg.scripts?.start || !String(pkg.scripts.start).includes("next start")) failures.push("apps/web package must have next start script.");
  if (!pkg.dependencies?.next) failures.push("apps/web package must declare next dependency.");
  if (!pkg.dependencies?.react) failures.push("apps/web package must declare react dependency.");
  if (!pkg.dependencies?.["react-dom"]) failures.push("apps/web package must declare react-dom dependency.");
  if (!pkg.devDependencies?.typescript) failures.push("apps/web package must declare typescript devDependency.");
}

const tokenChecks = [
  ["apps/web/.gitignore", ["node_modules", ".next"]],
  ["apps/web/next.config.mjs", ["reactStrictMode", "externalDir"]],
  ["apps/web/tsconfig.json", ["@kingsmen/contracts", "jsx"]],
  ["apps/web/src/app/layout.tsx", ["RootLayout", "Kingsmen"]],
  ["packages/contracts/src/free-destiny-map-real-web-runtime-repair.ts", ["WEB_RUNTIME_REPAIR_APPLIED", "canAttemptNextControlledBoot"]],
  ["scripts/runtime/Invoke-FreeDestinyMapWebRuntimeRepair.ps1", ["-RunInstall", "npm", "FreeDestinyMapApiForm"]],
  ["scripts/proof/prove-free-destiny-map-real-web-runtime-repair.mjs", ["WEB_RUNTIME_REPAIR_APPLIED", "dependency-install-evidence-present", "web-build-script-present"]],
  ["reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json");
  if (proof.passed !== true) failures.push("Runtime repair proof must pass.");
  if (proof.status !== "WEB_RUNTIME_REPAIR_APPLIED") failures.push("Runtime repair proof status must be WEB_RUNTIME_REPAIR_APPLIED.");
  if (proof.productionReady !== false) failures.push("Runtime repair proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Runtime repair proof must keep canClaimProduction false.");
  if (proof.canAttemptNextControlledBoot !== true) failures.push("Runtime repair proof must set canAttemptNextControlledBoot true.");
}

if (!exists("apps/web/package-lock.json")) failures.push("apps/web/package-lock.json must exist after npm install.");
if (!exists("apps/web/node_modules/next/package.json")) failures.push("apps/web/node_modules/next/package.json must exist after npm install.");
if (!exists("apps/web/node_modules/react/package.json")) failures.push("apps/web/node_modules/react/package.json must exist after npm install.");
if (!exists("apps/web/node_modules/react-dom/package.json")) failures.push("apps/web/node_modules/react-dom/package.json must exist after npm install.");

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 13 - Repair Real Web Build Blockers / Add Next App Package Runtime",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Repairs real web build/dev-server blockers for Free Destiny Map.",
  runtime_proof: "reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json",
  next_action: passed ? "Rerun BATCH 12 readiness. If ready, proceed to BATCH 14 controlled local web boot proof." : "Repair runtime package blockers and rerun proof plus validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
