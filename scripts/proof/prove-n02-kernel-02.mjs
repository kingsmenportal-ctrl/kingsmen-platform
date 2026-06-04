import fs from "node:fs";

const required = [
  "docs/n02/N02_KERNEL_02_IDEMPOTENCY_AUDIT_QUEUE_BOUNDARY.md",
  "manifests/n02/n02-kernel-02-idempotency-audit-queue-boundary.json",
  "packages/contracts/src/n02-idempotency-contract.ts",
  "packages/contracts/src/n02-audit-context-contract.ts",
  "packages/contracts/src/n02-queue-dispatch-contract.ts",
  "packages/backend/src/n02/idempotency-store.ts",
  "packages/backend/src/n02/audit-context.ts",
  "packages/backend/src/n02/queue-dispatch-boundary.ts",
  "scripts/validators/validate-n02-kernel-02.mjs",
  "reports/n02/n02-kernel-01-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n02/n02-kernel-02-idempotency-audit-queue-boundary.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.auditRequiredForDispatch !== true) failures.push("auditRequiredForDispatch must be true");
if (manifest.oracleLiteQueueDiscipline !== true) failures.push("oracleLiteQueueDiscipline must be true");

const report = {
  schema: "kingsmen.n02-kernel-02-proof.v1",
  module: "N02-KERNEL-02 - Idempotency / Audit Context / Queue Dispatch Boundary",
  status: failures.length === 0 ? "N02_KERNEL_IDEMPOTENCY_AUDIT_QUEUE_BOUNDARY_PROVEN" : "N02_KERNEL_IDEMPOTENCY_AUDIT_QUEUE_BOUNDARY_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  requiresN02Kernel01: true,
  idempotencyBuilt: manifest.idempotencyBuilt === true,
  auditContextBuilt: manifest.auditContextBuilt === true,
  queueDispatchBoundaryBuilt: manifest.queueDispatchBoundaryBuilt === true,
  duplicateCommandProtectionBuilt: manifest.duplicateCommandProtectionBuilt === true,
  auditRequiredForDispatch: manifest.auditRequiredForDispatch === true,
  oracleLiteQueueDiscipline: manifest.oracleLiteQueueDiscipline === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N02-KERNEL-03 - API health, backend readiness, and policy smoke test."
    : "Repair N02-KERNEL-02 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n02", { recursive: true });
fs.writeFileSync("reports/n02/n02-kernel-02-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N02-KERNEL-02 proof passed.");