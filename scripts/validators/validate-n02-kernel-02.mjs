import fs from "node:fs";

const requiredFiles = [
  "docs/n02/N02_KERNEL_02_IDEMPOTENCY_AUDIT_QUEUE_BOUNDARY.md",
  "manifests/n02/n02-kernel-02-idempotency-audit-queue-boundary.json",
  "packages/contracts/src/n02-idempotency-contract.ts",
  "packages/contracts/src/n02-audit-context-contract.ts",
  "packages/contracts/src/n02-queue-dispatch-contract.ts",
  "packages/backend/src/n02/idempotency-store.ts",
  "packages/backend/src/n02/audit-context.ts",
  "packages/backend/src/n02/queue-dispatch-boundary.ts",
  "reports/n02/n02-kernel-01-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n02/n02-kernel-02-idempotency-audit-queue-boundary.json")
  ? JSON.parse(fs.readFileSync("manifests/n02/n02-kernel-02-idempotency-audit-queue-boundary.json", "utf8"))
  : {};

for (const key of [
  "requiresN02Kernel01",
  "idempotencyBuilt",
  "auditContextBuilt",
  "queueDispatchBoundaryBuilt",
  "duplicateCommandProtectionBuilt",
  "auditRequiredForDispatch",
  "oracleLiteQueueDiscipline"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const queueFile = fs.existsSync("packages/backend/src/n02/queue-dispatch-boundary.ts")
  ? fs.readFileSync("packages/backend/src/n02/queue-dispatch-boundary.ts", "utf8")
  : "";

for (const phrase of [
  "assertN02CommandAllowed",
  "assertIdempotentCommand",
  "buildAuditContext",
  "maxAttempts: 3",
  "oracleLiteSafe"
]) {
  if (!queueFile.includes(phrase)) failures.push(`Queue boundary missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n02-kernel-02-validation.v1",
  module: "N02-KERNEL-02",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n02-kernel-02-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N02-KERNEL-02 validation passed.");