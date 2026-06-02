#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/public-website-free-destiny-map-latest.json");

const requiredFiles = [
  "docs/public/first-public-website-free-destiny-map.md",
  "manifests/public/free-destiny-map-shell.json",
  "packages/contracts/src/free-destiny-map.ts",
  "apps/web/src/components/kingsmen/PublicRouteCard.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapFormShell.tsx",
  "apps/web/src/components/kingsmen/PublicWebsiteShell.tsx",
  "apps/web/src/app/kingsmen/page.tsx",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "scripts/validators/validate-public-website-free-destiny-map.mjs",
  "reports/validation/public-website-free-destiny-map-latest.json"
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

if (exists("manifests/public/free-destiny-map-shell.json")) {
  const manifest = parseJson("manifests/public/free-destiny-map-shell.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
  for (const route of ["/kingsmen", "/free-destiny-map"]) {
    if (!manifest.routes?.includes(route)) failures.push(`Manifest missing route ${route}`);
  }
}

const tokenChecks = [
  ["packages/contracts/src/free-destiny-map.ts", ["FreeDestinyMapDraft", "KINGSMEN_PUBLIC_ROUTE_CARDS", "FREE_DESTINY_MAP_DISCLAIMER", "accommodation", "cv_readiness"]],
  ["apps/web/src/components/kingsmen/PublicWebsiteShell.tsx", ["University routes", "TVET routes", "SETA", "NSFAS", "Accommodation", "does not guarantee"]],
  ["apps/web/src/components/kingsmen/FreeDestinyMapFormShell.tsx", ["Free Destiny Map", "Need accommodation", "Improve CV", "backend connection comes next"]],
  ["apps/web/src/app/kingsmen/page.tsx", ["PublicWebsiteShell"]],
  ["apps/web/src/app/free-destiny-map/page.tsx", ["FreeDestinyMapFormShell"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

const forbiddenPatterns = [
  [/\b(we|kingsmen)\s+guarantees?\s+acceptance\b/i, "direct acceptance guarantee"],
  [/\b(we|kingsmen)\s+guarantees?\s+funding\b/i, "direct funding guarantee"],
  [/\b(we|kingsmen)\s+guarantees?\s+(a\s+)?job\b/i, "direct job guarantee"],
  [/\b(we|kingsmen)\s+guarantees?\s+accommodation\b/i, "direct accommodation guarantee"],
  [/productionReady\s*[:=]\s*true/i, "productionReady true"]
];

for (const file of requiredFiles.filter((item) => exists(item))) {
  const content = read(file);
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden claim: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 04 - First Public Website + Free Destiny Map Shell",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Adds first public user-facing Kingsmen shell and Free Destiny Map route.",
  next_action: passed ? "Proceed to BATCH 05 - Free Destiny Map intake contract/backend shell or next approved batch." : "Repair public website shell failures and rerun validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
