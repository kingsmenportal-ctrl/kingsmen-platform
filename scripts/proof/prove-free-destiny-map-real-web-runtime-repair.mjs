#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-real-web-runtime-repair-proof.json");
const checks = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function parseJson(rel) {
  return JSON.parse(read(rel));
}

function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}

const webPackagePath = "apps/web/package.json";
const webPackage = exists(webPackagePath) ? parseJson(webPackagePath) : null;

check("apps-web-package-json-exists", exists(webPackagePath), webPackagePath);
check("apps-web-gitignore-exists", exists("apps/web/.gitignore"), "apps/web/.gitignore");
check("apps-web-next-config-exists", exists("apps/web/next.config.mjs"), "apps/web/next.config.mjs");
check("apps-web-tsconfig-exists", exists("apps/web/tsconfig.json"), "apps/web/tsconfig.json");
check("apps-web-next-env-exists", exists("apps/web/next-env.d.ts"), "apps/web/next-env.d.ts");
check("apps-web-root-layout-exists", exists("apps/web/src/app/layout.tsx"), "apps/web/src/app/layout.tsx");

if (webPackage) {
  const scripts = webPackage.scripts ?? {};
  const deps = webPackage.dependencies ?? {};
  const devDeps = webPackage.devDependencies ?? {};

  check("web-dev-script-present", typeof scripts.dev === "string" && scripts.dev.includes("next dev"), scripts.dev ?? "");
  check("web-build-script-present", typeof scripts.build === "string" && scripts.build.includes("next build"), scripts.build ?? "");
  check("web-start-script-present", typeof scripts.start === "string" && scripts.start.includes("next start"), scripts.start ?? "");
  check("next-dependency-declared", Boolean(deps.next), deps.next ?? "missing");
  check("react-dependency-declared", Boolean(deps.react), deps.react ?? "missing");
  check("react-dom-dependency-declared", Boolean(deps["react-dom"]), deps["react-dom"] ?? "missing");
  check("typescript-dev-dependency-declared", Boolean(devDeps.typescript), devDeps.typescript ?? "missing");
  check("react-types-declared", Boolean(devDeps["@types/react"]), devDeps["@types/react"] ?? "missing");
}

if (exists("apps/web/.gitignore")) {
  const ignore = read("apps/web/.gitignore");
  check("web-gitignore-blocks-node-modules", ignore.includes("node_modules"), "node_modules ignored");
  check("web-gitignore-blocks-next-output", ignore.includes(".next"), ".next ignored");
}

if (exists("apps/web/src/app/layout.tsx")) {
  const layout = read("apps/web/src/app/layout.tsx");
  check("layout-exports-root-layout", layout.includes("RootLayout"), "RootLayout present");
  check("layout-keeps-local-shell-branding", layout.includes("Kingsmen"), "Kingsmen metadata present");
}

if (exists("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx")) {
  const form = read("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");
  check("form-client-import-path-repaired", form.includes("../../lib/kingsmen/free-destiny-map-client"), "client import path");
  check("form-contract-import-path-repaired", form.includes("../../../../../packages/contracts/src/free-destiny-map-api-wiring"), "contract import path");
  check("form-still-client-component", form.includes('"use client"'), "client directive present");
  check("form-still-has-consent-fields", form.includes("consentToBeContacted") && form.includes("consentToProcessBasicInfo"), "consent fields present");
}

const installEvidence = exists("apps/web/node_modules/next/package.json") &&
  exists("apps/web/node_modules/react/package.json") &&
  exists("apps/web/node_modules/react-dom/package.json");

check("dependency-install-evidence-present", installEvidence, installEvidence ? "apps/web/node_modules contains next/react/react-dom" : "Run npm install --prefix apps/web --no-audit --no-fund");

if (exists("apps/web/package-lock.json")) {
  check("web-package-lock-created", true, "apps/web/package-lock.json");
} else {
  check("web-package-lock-created", false, "apps/web/package-lock.json missing");
}

const forbiddenFiles = [
  "apps/web/package.json",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/lib/kingsmen/free-destiny-map-client.ts"
];

const forbiddenPatterns = [
  [/\bidentityNumber\s*[:=]/i, "identity number field assignment"],
  [/\bidNumber\s*[:=]/i, "id number field assignment"],
  [/\bpassportNumber\s*[:=]/i, "passport number field assignment"],
  [/\bpassword\s*[:=]/i, "password field assignment"],
  [/\bcardNumber\s*[:=]/i, "card number field assignment"],
  [/\bcvv\s*[:=]/i, "cvv field assignment"],
  [/\bdocumentBase64\s*[:=]/i, "document payload assignment"],
  [/officialApplicationSubmitted:\s*true/i, "official application submitted true"],
  [/paymentInstructionSent:\s*true/i, "payment instruction sent true"],
  [/emailSent:\s*true/i, "email sent true"],
  [/productionReady\s*[:=]\s*true/i, "productionReady true"]
];

for (const file of forbiddenFiles) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const [pattern, label] of forbiddenPatterns) {
    check(`forbidden-pattern-absent:${file}:${label}`, !pattern.test(content), label);
  }
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.real-web-runtime-repair-report.v1",
  module: "BATCH 13 - Repair Real Web Build Blockers / Add Next App Package Runtime",
  status: passed ? "WEB_RUNTIME_REPAIR_APPLIED" : "WEB_RUNTIME_REPAIR_BLOCKED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  canAttemptNextControlledBoot: passed,
  generated_at: new Date().toISOString(),
  checks,
  failed,
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "local web runtime dependency and package repair only; no production build; no long-running server",
  next_action: passed
    ? "Rerun BATCH 12 readiness. If it becomes READY_FOR_CONTROLLED_LOCAL_BOOT, proceed to BATCH 14 controlled local web boot proof."
    : "Repair failed checks, especially npm install evidence, then rerun BATCH 13 proof."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
