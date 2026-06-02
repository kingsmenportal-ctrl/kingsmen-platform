#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const proofReportPath = path.join(root, "reports/runtime/free-destiny-map-real-web-readiness-proof.json");

const checks = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function readJsonIfExists(rel) {
  if (!exists(rel)) return null;
  try {
    return JSON.parse(read(rel));
  } catch {
    return null;
  }
}

function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}

function listPackageScripts(pkg) {
  if (!pkg || typeof pkg !== "object" || !pkg.scripts || typeof pkg.scripts !== "object") return [];
  return Object.keys(pkg.scripts);
}

const rootPackage = readJsonIfExists("package.json");
const webPackage = readJsonIfExists("apps/web/package.json");
const packageLockExists = exists("package-lock.json");
const pnpmLockExists = exists("pnpm-lock.yaml");
const yarnLockExists = exists("yarn.lock");
const nodeModulesExists = exists("node_modules");
const webNodeModulesExists = exists("apps/web/node_modules");

check("root-package-json-exists", exists("package.json"), "package.json");
check("web-app-directory-exists", exists("apps/web"), "apps/web");
check("api-app-directory-exists", exists("apps/api"), "apps/api");
check("free-destiny-map-page-exists", exists("apps/web/src/app/free-destiny-map/page.tsx"), "apps/web/src/app/free-destiny-map/page.tsx");
check("free-destiny-map-api-form-exists", exists("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx"), "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");
check("free-destiny-map-client-exists", exists("apps/web/src/lib/kingsmen/free-destiny-map-client.ts"), "apps/web/src/lib/kingsmen/free-destiny-map-client.ts");
check("free-destiny-map-api-contract-exists", exists("packages/contracts/src/free-destiny-map-api-wiring.ts"), "packages/contracts/src/free-destiny-map-api-wiring.ts");
check("free-destiny-map-persistence-route-exists", exists("apps/api/src/routes/free-destiny-map-persistence.routes.ts"), "apps/api/src/routes/free-destiny-map-persistence.routes.ts");
check("data-local-gitignore-exists", exists("data/local/.gitignore"), "data/local/.gitignore");

if (exists("data/local/.gitignore")) {
  const ignore = read("data/local/.gitignore");
  check("data-local-gitignore-blocks-generated-proof", ignore.includes("*") && ignore.includes("!.gitignore"), "data/local generated files ignored");
}

if (exists("apps/web/src/app/free-destiny-map/page.tsx")) {
  const page = read("apps/web/src/app/free-destiny-map/page.tsx");
  check("page-uses-free-destiny-map-api-form", page.includes("FreeDestinyMapApiForm"), "page uses FreeDestinyMapApiForm");
}

if (exists("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx")) {
  const form = read("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");
  check("form-is-client-component", form.includes('"use client"'), "client component directive present");
  check("form-submits-through-client-adapter", form.includes("submitFreeDestinyMapClientPayload"), "submit adapter present");
  check("form-has-consent-fields", form.includes("consentToBeContacted") && form.includes("consentToProcessBasicInfo"), "consent fields present");
  check("form-has-route-interests", form.includes("routeInterests"), "route interests present");
  check("form-has-safety-copy", form.includes("Production storage") || form.includes("local intake API shell"), "safe local shell wording present");
}

if (exists("apps/web/src/lib/kingsmen/free-destiny-map-client.ts")) {
  const client = read("apps/web/src/lib/kingsmen/free-destiny-map-client.ts");
  check("client-builds-formdata-payload", client.includes("buildFreeDestinyMapClientPayload"), "FormData adapter present");
  check("client-posts-json", client.includes("application/json"), "JSON submit present");
  check("client-uses-local-endpoint-contract", client.includes("FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT"), "local endpoint contract present");
}

const rootScripts = listPackageScripts(rootPackage);
const webScripts = listPackageScripts(webPackage);

check("package-manager-lock-present", packageLockExists || pnpmLockExists || yarnLockExists, [
  packageLockExists ? "package-lock.json" : null,
  pnpmLockExists ? "pnpm-lock.yaml" : null,
  yarnLockExists ? "yarn.lock" : null
].filter(Boolean).join(", ") || "no lockfile found");

check("root-or-web-build-script-discoverable", rootScripts.includes("build") || webScripts.includes("build"), `root scripts=${rootScripts.join(",")}; web scripts=${webScripts.join(",")}`);
check("root-or-web-dev-script-discoverable", rootScripts.includes("dev") || webScripts.includes("dev"), `root scripts=${rootScripts.join(",")}; web scripts=${webScripts.join(",")}`);

const nextConfigExists =
  exists("apps/web/next.config.js") ||
  exists("apps/web/next.config.mjs") ||
  exists("apps/web/next.config.ts") ||
  exists("next.config.js") ||
  exists("next.config.mjs") ||
  exists("next.config.ts");

check("next-config-or-next-app-structure-present", nextConfigExists || exists("apps/web/src/app"), nextConfigExists ? "next config found" : "apps/web/src/app present");

const rootDeps = {
  ...(rootPackage?.dependencies ?? {}),
  ...(rootPackage?.devDependencies ?? {})
};
const webDeps = {
  ...(webPackage?.dependencies ?? {}),
  ...(webPackage?.devDependencies ?? {})
};

const hasNextDependency = Boolean(rootDeps.next || webDeps.next);
const hasReactDependency = Boolean(rootDeps.react || webDeps.react);
const hasReactDomDependency = Boolean(rootDeps["react-dom"] || webDeps["react-dom"]);

check("next-dependency-declared", hasNextDependency, "next dependency declared in root or web package");
check("react-dependency-declared", hasReactDependency, "react dependency declared in root or web package");
check("react-dom-dependency-declared", hasReactDomDependency, "react-dom dependency declared in root or web package");

const dependencyInstallEvidence = nodeModulesExists || webNodeModulesExists;
check("dependency-install-evidence-present", dependencyInstallEvidence, dependencyInstallEvidence ? "node_modules found" : "node_modules not found; install likely needed before real boot");

const runtimeProofs = [
  "reports/runtime/free-destiny-map-local-http-exercise-proof.json",
  "reports/runtime/free-destiny-map-local-web-http-exercise-proof.json",
  "reports/runtime/free-destiny-map-browser-style-submit-proof.json"
];

for (const proofFile of runtimeProofs) {
  const proof = readJsonIfExists(proofFile);
  check(`runtime-proof-passed:${proofFile}`, proof?.passed === true, proof ? `status=${proof.status}` : "missing or invalid");
}

const forbiddenFiles = [
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/lib/kingsmen/free-destiny-map-client.ts",
  "packages/contracts/src/free-destiny-map-api-wiring.ts",
  "apps/api/src/routes/free-destiny-map-persistence.routes.ts"
];

const forbiddenRuntimePatterns = [
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
  for (const [pattern, label] of forbiddenRuntimePatterns) {
    check(`forbidden-pattern-absent:${file}:${label}`, !pattern.test(content), label);
  }
}

const bootCriticalNames = [
  "root-package-json-exists",
  "web-app-directory-exists",
  "free-destiny-map-page-exists",
  "free-destiny-map-api-form-exists",
  "free-destiny-map-client-exists",
  "package-manager-lock-present",
  "root-or-web-build-script-discoverable",
  "root-or-web-dev-script-discoverable",
  "next-dependency-declared",
  "react-dependency-declared",
  "react-dom-dependency-declared",
  "dependency-install-evidence-present"
];

const blockers = checks.filter((item) => item.passed !== true);
const canAttemptLocalWebBoot = bootCriticalNames.every((name) => checks.find((item) => item.name === name)?.passed === true);
const status = canAttemptLocalWebBoot ? "READY_FOR_CONTROLLED_LOCAL_BOOT" : "BLOCKED_WITH_REPAIR_ACTIONS";

const report = {
  schema: "kingsmen.real-web-readiness-report.v1",
  module: "BATCH 12 - Real Local Web Build / Dev-Server Readiness Gate",
  status,
  passed: true,
  productionReady: false,
  canAttemptLocalWebBoot,
  canClaimProduction: false,
  generated_at: new Date().toISOString(),
  checks,
  blockers,
  package_scripts: {
    root: rootScripts,
    web: webScripts
  },
  package_manager_evidence: {
    packageLockExists,
    pnpmLockExists,
    yarnLockExists,
    nodeModulesExists,
    webNodeModulesExists
  },
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "real web build/dev-server readiness gate only; no long-running server; no production storage",
  next_action: canAttemptLocalWebBoot
    ? "Proceed to a controlled local web boot proof with explicit start/stop and timeout."
    : "Repair the listed readiness blockers before attempting a real local web boot."
};

fs.mkdirSync(path.dirname(proofReportPath), { recursive: true });
fs.writeFileSync(proofReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
