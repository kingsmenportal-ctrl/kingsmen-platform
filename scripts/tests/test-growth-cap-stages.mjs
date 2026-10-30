import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

async function importTypeScript(relativePath) {
  const file = path.join(process.cwd(), relativePath);
  const source = fs.readFileSync(file, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  }).outputText;
  return import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
}

const stages = [500, 1000, 5000, 10000, 25000];
const growth = await importTypeScript("apps/api/src/governance/growth-cap-governance.ts");
assert.deepEqual(growth.REGISTERED_GROWTH_CAP_STAGES, stages);

for (let index = 0; index < stages.length - 1; index++) {
  const review = growth.createGrowthCapReview({
    currentActiveCandidateCap: stages[index],
    requestedActiveCandidateCap: stages[index + 1],
    outcomeQualityEvidenceRefs: ["evidence://outcomes/" + stages[index]],
    riskSummary: "Prior-stage quality and operating evidence reviewed."
  });
  assert.equal(review.reviewStatus, "PENDING_REVIEW");
  review.operatorDecision = "APPROVE";
  assert.doesNotThrow(() => growth.assertGrowthCapIncreaseAllowed(review));
}

for (const pair of [[500, 5000], [1000, 10000], [500, 750], [25000, 50000]]) {
  assert.throws(() => growth.createGrowthCapReview({
    currentActiveCandidateCap: pair[0],
    requestedActiveCandidateCap: pair[1],
    outcomeQualityEvidenceRefs: ["evidence://test"],
    riskSummary: "Negative test."
  }), /GROWTH_CAP_STAGE_OUT_OF_ORDER|NO_FURTHER_REGISTERED_GROWTH_STAGE/);
}
assert.throws(() => growth.createGrowthCapReview({
  currentActiveCandidateCap: 750,
  requestedActiveCandidateCap: 1000,
  outcomeQualityEvidenceRefs: [],
  riskSummary: "Negative test."
}), /CURRENT_GROWTH_CAP_NOT_REGISTERED/);

const capacity = await importTypeScript("apps/api/src/observability/capacity-monitor.ts");
const base = { cpuUsedRatio: 0.2, memoryUsedRatio: 0.2, storageUsedRatio: 0.2, dbUsedRatio: 0.2, queueUsedRatio: 0.2, evidenceRefs: ["capacity://fixture"] };
const atCap = capacity.buildOracleLiteCapacitySnapshot({ ...base, activeCandidates: 500, activeCandidateCap: 500 });
assert.doesNotThrow(() => capacity.assertCapNotExceeded(atCap));
const overCap = capacity.buildOracleLiteCapacitySnapshot({ ...base, activeCandidates: 501, activeCandidateCap: 500 });
assert.equal(overCap.queuePressure, "CRITICAL");
assert.throws(() => capacity.assertCapNotExceeded(overCap), /ACTIVE_CANDIDATE_CAP_EXCEEDED/);

const noEvidence = growth.createGrowthCapReview({ currentActiveCandidateCap: 500, requestedActiveCandidateCap: 1000, outcomeQualityEvidenceRefs: [], riskSummary: "No outcome evidence." });
noEvidence.operatorDecision = "APPROVE";
assert.throws(() => growth.assertGrowthCapIncreaseAllowed(noEvidence), /NO_GROWTH_CAP_INCREASE_WITHOUT_OUTCOME_QUALITY_EVIDENCE/);
const noApproval = growth.createGrowthCapReview({ currentActiveCandidateCap: 500, requestedActiveCandidateCap: 1000, outcomeQualityEvidenceRefs: ["evidence://outcomes/500"], riskSummary: "Approval omitted." });
assert.throws(() => growth.assertGrowthCapIncreaseAllowed(noApproval), /GROWTH_CAP_INCREASE_REQUIRES_OPERATOR_APPROVAL/);

console.log("PASS: capacity boundary and sequential registered growth-stage governance.");
