import fs from "node:fs";

export function getN02KernelHealth() {
  return {
    schema: "kingsmen.n02-health.v1",
    ok: true,
    productionReady: false,
    constitutionLoaded: fs.existsSync("manifests/constitution/n00-constitution-doctrine-lock.json"),
    commandPolicyGuardPresent: fs.existsSync("packages/backend/src/n02/command-policy-guard.ts"),
    idempotencyBoundaryPresent: fs.existsSync("packages/backend/src/n02/idempotency-store.ts"),
    auditBoundaryPresent: fs.existsSync("packages/backend/src/n02/audit-context.ts"),
    queueBoundaryPresent: fs.existsSync("packages/backend/src/n02/queue-dispatch-boundary.ts"),
    publicSafe: true,
    secretsIncluded: false,
    checkedAt: new Date().toISOString()
  } as const;
}