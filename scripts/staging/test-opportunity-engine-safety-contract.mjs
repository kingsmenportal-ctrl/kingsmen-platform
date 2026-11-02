import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import Module from "node:module";

const require = createRequire(path.resolve("apps/api/package.json"));
const ts = require("typescript");
const sourcePath = path.resolve("apps/api/src/opportunity/opportunity-engine.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const loaded = new Module(sourcePath);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(compiled, sourcePath);
const { isStaleObservation, verifyProgrammeCandidateFacingSafety, buildOpportunityMatch } = loaded.exports;

const checks = [];
function test(name, fn) { fn(); checks.push(name); }
const now = "2026-10-29T12:00:00.000Z";
const provider = {
  providerRef: "provider-1", providerName: "Provider", providerType: "PUBLIC",
  sector: "UNIVERSITY", accreditationStatus: "OFFICIAL_VERIFIED",
  sourceConfidence: "OFFICIAL_VERIFIED", safeToRecommend: true, evidenceRefs: ["provider-evidence"]
};
const programme = (overrides = {}) => ({
  programmeRef: "programme-1", providerRef: "provider-1", programmeName: "Programme",
  sector: "UNIVERSITY", openingStatus: "OPEN", sourceConfidence: "OFFICIAL_VERIFIED",
  candidateFacingSafe: true, exactLink: "https://provider.example/apply",
  evidenceRefs: ["programme-evidence"], observedAt: "2026-10-28T12:00:00.000Z",
  lastCheckedAt: "2026-10-29T11:00:00.000Z", staleAfter: "2026-10-30T12:00:00.000Z",
  ...overrides
});

test("missing staleAfter is treated as stale", () => assert.equal(isStaleObservation({ observedAt: "2026-10-28T12:00:00.000Z" }, now), true));
test("invalid freshness timestamp is treated as stale", () => assert.equal(isStaleObservation({ observedAt: "2026-10-28T12:00:00.000Z", staleAfter: "not-a-date" }, now), true));
test("explicit unexpired freshness window is accepted", () => assert.equal(isStaleObservation({ observedAt: "2026-10-28T12:00:00.000Z", staleAfter: "2026-10-30T12:00:00.000Z" }, now), false));
test("future observation is treated as stale", () => assert.equal(isStaleObservation({ observedAt: "2026-10-30T12:00:00.000Z", staleAfter: "2026-10-31T12:00:00.000Z" }, now), true));
test("missing programme freshness metadata fails closed", () => assert.equal(verifyProgrammeCandidateFacingSafety(programme({ lastCheckedAt: undefined }), provider, now).candidateFacingSafe, false));
test("non-open programme cannot be candidate-facing safe", () => assert.equal(verifyProgrammeCandidateFacingSafety(programme({ openingStatus: "UPCOMING" }), provider, now).candidateFacingSafe, false));
test("non-HTTPS programme link cannot be candidate-facing safe", () => assert.equal(verifyProgrammeCandidateFacingSafety(programme({ exactLink: "http://provider.example/apply" }), provider, now).candidateFacingSafe, false));
test("expired freshness cannot be candidate-facing safe", () => assert.equal(verifyProgrammeCandidateFacingSafety(programme({ staleAfter: "2026-10-29T11:59:59.000Z" }), provider, now).candidateFacingSafe, false));
test("future source check cannot be candidate-facing safe", () => assert.equal(verifyProgrammeCandidateFacingSafety(programme({ lastCheckedAt: "2026-10-29T12:01:00.000Z" }), provider, now).candidateFacingSafe, false));
test("fresh open programme with HTTPS evidence can pass the source gate", () => assert.equal(verifyProgrammeCandidateFacingSafety(programme(), provider, now).candidateFacingSafe, true));
test("automatic matching never final-approves a candidate match", () => {
  const result = buildOpportunityMatch({ candidateRef: "candidate-1", programme: programme(), provider, fitScore: 0.9, evidenceRefs: ["match-evidence"] });
  assert.equal(result.matchStatus, "READY_FOR_REVIEW");
  assert.equal(result.humanReviewRequired, true);
});
console.log(`Opportunity runtime safety tests passed: ${checks.length} assertions.`);
