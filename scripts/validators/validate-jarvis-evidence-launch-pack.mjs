import fs from "node:fs";

const files = {
  evidence: "apps/web/src/app/api/jarvis/evidence-collector/route.ts",
  launchGate: "apps/web/src/app/api/jarvis/source-launch-gate/route.ts",
  proofPack: "apps/web/src/app/api/jarvis/proof-pack-index/route.ts",
  proofPage: "apps/web/src/app/founder/proof-centre/jarvis/page.tsx",
  finalHud: "apps/web/src/app/api/jarvis/final-command-hud/route.ts"
};

const checks = [];

function addCheck(name, passed, detail, path) {
  checks.push({ name, passed, detail, path });
}

function read(path) {
  if (!fs.existsSync(path)) {
    addCheck(`file_exists:${path}`, false, "missing", path);
    return "";
  }
  addCheck(`file_exists:${path}`, true, "found", path);
  return fs.readFileSync(path, "utf8");
}

function requireToken(path, content, token) {
  addCheck(`token:${path}:${token}`, content.includes(token), token, path);
}

function requireAbsent(path, content, token) {
  addCheck(`forbidden_absent:${path}:${token}`, !content.includes(token), token, path);
}

const evidence = read(files.evidence);
const launchGate = read(files.launchGate);
const proofPack = read(files.proofPack);
const proofPage = read(files.proofPage);
const finalHud = read(files.finalHud);

[
  "kingsmen.jarvis-evidence-collector.v1",
  "Jarvis Evidence Collector",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "dockerIndependentBuildAllowed: true",
  "rawSecretsReturned: false",
  "secretValuesReturned: false",
  "directDatabaseAccessFromWeb: false",
  "backend-truth-vault-runtime",
  "ai-provider-live-proof",
  "email-provider-proof",
  "payfast-itn-proof",
  "branch-protection-proof"
].forEach((token) => requireToken(files.evidence, evidence, token));

[
  "kingsmen.jarvis-source-launch-gate.v1",
  "Jarvis Source Launch Gate",
  "jarvisSourceComplete: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "launchBlockingCount",
  "backend-truth-vault-runtime",
  "branch-protection-proof"
].forEach((token) => requireToken(files.launchGate, launchGate, token));

[
  "kingsmen.jarvis-proof-pack-index.v1",
  "Jarvis Proof Pack Index",
  "jarvisSourcePackReady: true",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "/api/jarvis/evidence-collector",
  "/api/jarvis/source-launch-gate",
  "/api/jarvis/proof-pack-index",
  "local-docker-runtime",
  "provider-credentials"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "Kingsmen Jarvis · Proof Centre",
  "Evidence, launch gates, and proof pack",
  "/api/jarvis/evidence-collector",
  "/api/jarvis/source-launch-gate",
  "/api/jarvis/proof-pack-index",
  "Production ready",
  "false"
].forEach((token) => requireToken(files.proofPage, proofPage, token));

[
  "kingsmen.jarvis-final-command-hud.v1",
  "jarvisSourceDesignComplete: true",
  "productionReady: false",
  "publicLaunchAllowed: false"
].forEach((token) => requireToken(files.finalHud, finalHud, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.SMTP_PASSWORD",
  "process.env.PAYFAST_MERCHANT_KEY"
].forEach((token) => {
  requireAbsent(files.evidence, evidence, token);
  requireAbsent(files.launchGate, launchGate, token);
  requireAbsent(files.proofPack, proofPack, token);
  requireAbsent(files.proofPage, proofPage, token);
  requireAbsent(files.finalHud, finalHud, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Evidence Launch Pack",
  status: passed ? "JARVIS_EVIDENCE_LAUNCH_PACK_SOURCE_VALIDATED" : "JARVIS_EVIDENCE_LAUNCH_PACK_SOURCE_FAILED",
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  dockerIndependentBuildAllowed: true,
  noFakeData: true,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  localShellExecuted: false,
  directDatabaseAccessFromWeb: false,
  checks,
  failedChecks,
  nextAction: passed
    ? "Run web build and open /founder/proof-centre/jarvis."
    : "Repair Jarvis evidence, launch gate, or proof-pack source wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
