#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/runtime/free-destiny-map-api-wiring-proof.json");

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

const checks = [];

function check(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}

const requiredRuntimeFiles = [
  "apps/api/src/routes/free-destiny-map-intake.routes.ts",
  "apps/api/src/routes/free-destiny-map-persistence.routes.ts",
  "apps/api/src/services/free-destiny-map-intake.service.ts",
  "apps/api/src/services/free-destiny-map-persistence.service.ts",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/lib/kingsmen/free-destiny-map-client.ts"
];

for (const file of requiredRuntimeFiles) {
  check(`file-exists:${file}`, exists(file), file);
}

if (exists("apps/web/src/lib/kingsmen/free-destiny-map-client.ts")) {
  const client = read("apps/web/src/lib/kingsmen/free-destiny-map-client.ts");
  check("client-posts-local-endpoint", client.includes("FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT"), "client uses endpoint contract");
  check("client-builds-formdata-payload", client.includes("buildFreeDestinyMapClientPayload"), "client builds payload from FormData");
  check("client-uses-json", client.includes("application/json"), "client posts json");
}

if (exists("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx")) {
  const form = read("apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx");
  check("form-is-client-component", form.includes('"use client"'), "Next client component");
  check("form-has-consent", form.includes("consentToBeContacted") && form.includes("consentToProcessBasicInfo"), "consent fields present");
  check("form-has-route-interests", form.includes("routeInterests"), "route interest fields present");
  check("form-has-local-shell-warning", form.includes("Production storage") || form.includes("local intake API shell"), "safe local shell warning present");
}

if (exists("apps/api/src/routes/free-destiny-map-persistence.routes.ts")) {
  const route = read("apps/api/src/routes/free-destiny-map-persistence.routes.ts");
  check("route-local-endpoint-exists", route.includes("/api/public/free-destiny-map/intake/local"), "local endpoint present");
  check("route-keeps-production-false", route.includes("productionReady: false"), "production false");
  check("route-blocks-official-submission", route.includes("officialApplicationSubmitted: false"), "official submission false");
}

const failed = checks.filter((item) => item.passed !== true);
const passed = failed.length === 0;

const report = {
  schema: "kingsmen.runtime-proof.v1",
  module: "BATCH 07 - Public Form to Intake API Wiring / Local API Boot Proof",
  status: passed ? "RUNTIME_SHELL_PROVEN" : "BUILT_PENDING_RUNTIME_PROOF",
  passed,
  generated_at: new Date().toISOString(),
  checks,
  failed,
  oracle_lite_impact: "none_runtime_yet",
  runtime_scope: "static local boot proof only; no server started; no production storage",
  next_action: passed ? "Run validator and commit BATCH 07." : "Repair wiring proof failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
