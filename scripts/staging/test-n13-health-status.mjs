import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(root, "apps/api/src/observability/health-status.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const loaded = { exports: {} };
new Function("exports", "require", "module", "__filename", "__dirname", compiled)(
  loaded.exports,
  require,
  loaded,
  sourcePath,
  path.dirname(sourcePath)
);
const { buildSystemHealthSnapshot, deriveHealthStatus, assertNoFalseGreen } = loaded.exports;

const base = {
  activeCandidates: 12,
  activeCandidateCap: 500,
  pendingWorkflows: 0,
  failedWorkflows: 0,
  documentBacklog: 0,
  manualFallbackBacklog: 0,
  paymentPendingCount: 0,
  sourceReviewBacklog: 0,
  incidentOpenCount: 0,
  openSev1Count: 0,
  openSev2Count: 0,
  serviceChecks: [],
  pressureSignals: ["LOW"],
  evidenceRefs: ["test:n13-health"]
};

assert.equal(buildSystemHealthSnapshot(base).status, "GREEN", "healthy system should be green");
assert.equal(
  buildSystemHealthSnapshot({ ...base, incidentOpenCount: 1 }).status,
  "AMBER",
  "any open incident must prevent a green status even when severity counts are missing or delayed"
);
assert.equal(
  buildSystemHealthSnapshot({ ...base, incidentOpenCount: 1, openSev1Count: 1 }).status,
  "RED",
  "an open SEV1 incident must force red"
);
assert.equal(
  buildSystemHealthSnapshot({ ...base, pressureSignals: ["MEDIUM"] }).status,
  "AMBER",
  "medium capacity pressure must not be reported as green"
);
assert.equal(
  deriveHealthStatus({
    openSev1Count: 0,
    openSev2Count: 0,
    openIncidentCount: 0,
    failedWorkflows: 0,
    capacityPressure: "LOW",
    downServices: 1,
    degradedServices: 0
  }),
  "RED",
  "a down service must force red"
);
assert.throws(
  () => assertNoFalseGreen({
    ...buildSystemHealthSnapshot(base),
    status: "GREEN",
    incidentOpenCount: 1
  }),
  /NO_FALSE_GREEN_HEALTH_STATUS/,
  "defence-in-depth assertion must reject inconsistent green snapshots"
);

console.log("N13 health-status regression tests passed: 6 assertions");
