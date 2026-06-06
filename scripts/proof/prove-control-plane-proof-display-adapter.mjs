#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const input = {
  readModel: "reports/runtime/build-proof-centre-read-model.json",
  proof: "reports/runtime/build-proof-centre-proof.json",
  validation: "reports/validation/build-proof-centre-latest.json"
};

const output = {
  adapter: "reports/control-plane/build-proof-centre-display-adapter.json",
  html: "reports/control-plane/build-proof-centre-display-adapter-preview.html",
  proof: "reports/control-plane/build-proof-centre-display-adapter-proof.json"
};

const checks = [];

function full(rel) {
  return path.join(root, rel);
}

function exists(rel) {
  return fs.existsSync(full(rel));
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(rel, value) {
  fs.mkdirSync(path.dirname(full(rel)), { recursive: true });
  fs.writeFileSync(full(rel), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function check(name, passed, detail = "") {
  checks.push({ name, passed: passed === true, detail: String(detail ?? "") });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

for (const rel of Object.values(input)) {
  check(`input-exists:${rel}`, exists(rel), rel);
}

const readModel = exists(input.readModel) ? readJson(input.readModel) : null;
const proof = exists(input.proof) ? readJson(input.proof) : null;
const validation = exists(input.validation) ? readJson(input.validation) : null;

check("source-read-model-valid", readModel?.schema === "kingsmen.build-proof-centre-read-model.v1", readModel?.schema ?? "missing");
check("source-proof-proven", proof?.status === "BUILD_PROOF_CENTRE_READ_MODEL_PROVEN" && proof?.passed === true, proof?.status ?? "missing");
check("source-validation-passed", validation?.status === "VALIDATED" && validation?.passed === true, validation?.status ?? "missing");
check("source-all-proof-items-passed", readModel?.allProofItemsPassed === true, String(readModel?.allProofItemsPassed));
check("source-no-production-claim", readModel?.productionReady === false && readModel?.canClaimProduction === false && readModel?.noProductionClaim === true, "production false");
check("source-no-oracle-claim", readModel?.deployedToOracle === false && readModel?.noOracleClaim === true, "oracle false");

const cards = (readModel?.proofItems ?? []).map((item) => ({
  id: item.id,
  title: item.label,
  badge: item.passed === true ? "PROVEN" : "FAILED",
  tone: item.passed === true ? "safe" : "danger",
  subtitle: `${item.status} / ${item.validationStatus}`,
  reportPath: item.reportPath,
  validationPath: item.validationPath,
  metrics: item.keyMetrics ?? {}
}));

const allCardsPassed = cards.length > 0 && cards.every((card) => card.badge === "PROVEN");
const noProductionClaim = readModel?.productionReady === false && readModel?.canClaimProduction === false && readModel?.noProductionClaim === true;
const noOracleClaim = readModel?.deployedToOracle === false && readModel?.noOracleClaim === true;

check("adapter-has-two-cards", cards.length === 2, `cards=${cards.length}`);
check("adapter-all-cards-passed", allCardsPassed, "all cards proven");
check("adapter-no-production-claim", noProductionClaim, "no production claim");
check("adapter-no-oracle-claim", noOracleClaim, "no oracle claim");

const adapter = {
  schema: "kingsmen.control-plane-proof-display-adapter.v1",
  module: "BATCH 24 - Smallest Useful Control-Plane Proof Display Adapter",
  generated_at: new Date().toISOString(),
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  runtimeScope: "local_control_plane_display_adapter_only",
  sourceReadModel: input.readModel,
  allCardsPassed,
  noProductionClaim,
  noOracleClaim,
  cards,
  founderWarning: "Local proof display only. This is not production readiness and not Oracle deployment proof.",
  nextAction: allCardsPassed
    ? "Commit BATCH 24, then wire this adapter into the smallest future Founder Control Plane surface."
    : "Repair proof read-model inputs before UI display work."
};

writeJson(output.adapter, adapter);

const cardHtml = cards.map((card) => {
  const metrics = Object.entries(card.metrics)
    .map(([key, value]) => `<li><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></li>`)
    .join("");

  return `
    <section class="card ${escapeHtml(card.tone)}">
      <div class="badge">${escapeHtml(card.badge)}</div>
      <h2>${escapeHtml(card.title)}</h2>
      <p>${escapeHtml(card.subtitle)}</p>
      <ul>${metrics}</ul>
      <small>${escapeHtml(card.reportPath)}</small>
    </section>
  `;
}).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Kingsmen Build Proof Centre</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #07111f; color: #e8f3ff; }
    main { max-width: 980px; margin: 0 auto; padding: 32px; }
    header { border-bottom: 1px solid #16324f; margin-bottom: 24px; padding-bottom: 18px; }
    h1 { margin: 0; color: #d6b25e; }
    .warning { background: #10243b; border: 1px solid #2c5e8c; padding: 14px; border-radius: 12px; margin: 18px 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
    .card { border: 1px solid #1e4566; border-radius: 18px; padding: 18px; background: #0b1b2d; box-shadow: 0 10px 28px rgba(0,0,0,.25); }
    .card.safe { border-color: #22c55e; }
    .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #123d2a; color: #86efac; font-weight: bold; font-size: 12px; }
    ul { padding: 0; list-style: none; }
    li { display: flex; justify-content: space-between; border-bottom: 1px solid #16324f; padding: 7px 0; gap: 12px; }
    small { color: #91a7bf; word-break: break-all; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Kingsmen Build Proof Centre</h1>
      <p>Smallest useful Control Plane proof display adapter.</p>
    </header>
    <div class="warning">${escapeHtml(adapter.founderWarning)}</div>
    <div class="grid">${cardHtml}</div>
  </main>
</body>
</html>
`;

fs.mkdirSync(path.dirname(full(output.html)), { recursive: true });
fs.writeFileSync(full(output.html), html, "utf8");

check("adapter-json-written", exists(output.adapter), output.adapter);
check("adapter-html-written", exists(output.html), output.html);
check("adapter-local-only", adapter.runtimeScope === "local_control_plane_display_adapter_only", adapter.runtimeScope);
check("adapter-no-docker-start", true, "This script does not invoke Docker.");
check("adapter-no-secret-access", true, "This script reads only reports/runtime and reports/validation inputs.");

const failed = checks.filter((c) => c.passed !== true);
const passed = failed.length === 0;

const proofReport = {
  schema: "kingsmen.control-plane-proof-display-adapter-proof.v1",
  module: "BATCH 24 - Smallest Useful Control-Plane Proof Display Adapter",
  status: passed
    ? "CONTROL_PLANE_PROOF_DISPLAY_ADAPTER_PROVEN"
    : "CONTROL_PLANE_PROOF_DISPLAY_ADAPTER_FAILED",
  passed,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  generated_at: new Date().toISOString(),
  adapterPath: output.adapter,
  previewPath: output.html,
  checks,
  failed,
  next_action: passed
    ? "Run validator and commit BATCH 24."
    : "Repair adapter proof checks before moving forward."
};

writeJson(output.proof, proofReport);
console.log(JSON.stringify(proofReport, null, 2));

if (!passed) process.exit(1);
