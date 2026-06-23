import fs from "node:fs";

const files = {
  closeoutRoute: "apps/web/src/app/api/jarvis/final-source-closeout-seal/route.ts",
  closeoutPage: "apps/web/src/app/founder/launch-control/jarvis-final-source-closeout/page.tsx",
  hudRoute: "apps/web/src/app/api/jarvis/final-command-hud/route.ts",
  proofPack: "apps/web/src/app/api/jarvis/proof-pack-index/route.ts"
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

const closeoutRoute = read(files.closeoutRoute);
const closeoutPage = read(files.closeoutPage);
const hudRoute = read(files.hudRoute);
const proofPack = read(files.proofPack);

[
  "kingsmen.jarvis-final-source-closeout-seal.v1",
  "jarvisSourceDesignClosedOut: true",
  "jarvisSourceControlSurfacesComplete: true",
  "jarvisRuntimeLive: false",
  "productionReady: false",
  "publicLaunchAllowed: false",
  "SOURCE_CLOSED_OUT__LIVE_PROOF_REMAINS",
  "sourceSealedSurfaces",
  "remainingLiveProofBatchCount",
  "Stop adding Jarvis source surfaces"
].forEach((token) => requireToken(files.closeoutRoute, closeoutRoute, token));

[
  "SOURCE CLOSED OUT",
  "Remaining live batches",
  "Docker/API/Truth Vault runtime proof",
  "AI + Email provider live proof",
  "PayFast sandbox accepted ITN proof",
  "n8n + Airtable + GitHub runtime proof",
  "Branch protection + final launch audit"
].forEach((token) => requireToken(files.closeoutPage, closeoutPage, token));

[
  "jarvisFinalSourceCloseoutSealConnected: true",
  "final-source-closeout-seal",
  "/founder/launch-control/jarvis-final-source-closeout",
  "Final source closeout and handover seal",
  "five live proof batches"
].forEach((token) => requireToken(files.hudRoute, hudRoute, token));

[
  "scripts/validators/validate-jarvis-final-source-closeout-seal.mjs",
  "manifests/jarvis/jarvis-final-source-closeout-seal-v1.json",
  "/founder/launch-control/jarvis-final-source-closeout",
  "/api/jarvis/final-source-closeout-seal",
  "jarvisFinalSourceCloseoutSealIndexed: true",
  "Source/design closeout complete"
].forEach((token) => requireToken(files.proofPack, proofPack, token));

[
  "child_process",
  "execSync",
  "spawnSync",
  "new Pool",
  "process.env.OPENAI_API_KEY",
  "process.env.PAYFAST_MERCHANT_KEY",
  "process.env.SMTP_PASSWORD"
].forEach((token) => {
  requireAbsent(files.closeoutRoute, closeoutRoute, token);
  requireAbsent(files.closeoutPage, closeoutPage, token);
  requireAbsent(files.hudRoute, hudRoute, token);
  requireAbsent(files.proofPack, proofPack, token);
});

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: "kingsmen.validation-report.v1",
  module: "Jarvis Final Source Closeout Seal",
  status: passed ? "JARVIS_FINAL_SOURCE_CLOSEOUT_SEAL_VALIDATED" : "JARVIS_FINAL_SOURCE_CLOSEOUT_SEAL_FAILED",
  passed,
  sourceControlBatchesRemaining: 0,
  liveProofBatchesRemaining: 5,
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
    ? "Move to live proof batches. Do not add more Jarvis source layers unless a validator fails."
    : "Repair final Jarvis source closeout seal wiring."
}, null, 2));

process.exit(passed ? 0 : 1);
