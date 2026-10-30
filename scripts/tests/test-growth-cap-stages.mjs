import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const growthSource = fs.readFileSync(path.join(root, "apps/api/src/governance/growth-cap-governance.ts"), "utf8");
const capacitySource = fs.readFileSync(path.join(root, "apps/api/src/observability/capacity-monitor.ts"), "utf8");
const registeredStages = [500, 1000, 5000, 10000, 25000];

assert.ok(growthSource.includes("REGISTERED_GROWTH_CAP_STAGES = [500, 1000, 5000, 10000, 25000]"), "the API source must expose the exact registered growth stages");
assert.ok(growthSource.includes("input.requestedActiveCandidateCap !== next"), "growth increase must allow only the next registered stage");
assert.ok(growthSource.includes("CURRENT_GROWTH_CAP_NOT_REGISTERED"), "unknown existing caps must fail closed");
assert.ok(growthSource.includes("NO_FURTHER_REGISTERED_GROWTH_STAGE"), "the final 25,000 stage must not silently permit arbitrary growth");
assert.ok(growthSource.includes("NO_GROWTH_CAP_INCREASE_WITHOUT_OUTCOME_QUALITY_EVIDENCE"), "growth increase must require outcome evidence");
assert.ok(growthSource.includes('review.operatorDecision !== "APPROVE"'), "growth increase must require explicit operator approval");
assert.ok(growthSource.includes("GROWTH_CAP_RISK_SUMMARY_REQUIRED"), "growth review must include a risk summary");

function nextStage(current) {
  const index = registeredStages.indexOf(current);
  if (index < 0) throw new Error("CURRENT_GROWTH_CAP_NOT_REGISTERED");
  return registeredStages[index + 1] || null;
}
function buildReview(current, requested, evidence, risk) {
  const next = nextStage(current);
  if (next === null) throw new Error("NO_FURTHER_REGISTERED_GROWTH_STAGE");
  if (requested !== next) throw new Error("GROWTH_CAP_STAGE_OUT_OF_ORDER");
  if (!risk.trim()) throw new Error("GROWTH_CAP_RISK_SUMMARY_REQUIRED");
  return { current, requested, evidence, decision: null };
}
function approve(review) {
  if (review.evidence.length === 0) throw new Error("NO_GROWTH_CAP_INCREASE_WITHOUT_OUTCOME_QUALITY_EVIDENCE");
  if (review.decision !== "APPROVE") throw new Error("GROWTH_CAP_INCREASE_REQUIRES_OPERATOR_APPROVAL");
}
for (let index = 0; index < registeredStages.length - 1; index++) {
  const review = buildReview(registeredStages[index], registeredStages[index + 1], ["evidence://outcomes/" + registeredStages[index]], "Stage outcome and risk review.");
  review.decision = "APPROVE";
  assert.doesNotThrow(() => approve(review));
}
for (const [current, requested] of [[500, 5000], [1000, 10000], [500, 750], [25000, 50000]]) {
  assert.throws(() => buildReview(current, requested, ["evidence://test"], "Negative test."));
}
assert.throws(() => buildReview(750, 1000, [], "Unknown current cap."));
assert.throws(() => buildReview(500, 1000, ["evidence://test"], ""));
assert.throws(() => approve(buildReview(500, 1000, [], "No outcome evidence.")));
assert.throws(() => approve(buildReview(500, 1000, ["evidence://test"], "Approval omitted.")));

assert.ok(capacitySource.includes("const activeCandidateCap = input.activeCandidateCap ?? 500"), "capacity snapshot defaults to 500");
assert.ok(capacitySource.includes("if (snapshot.activeCandidates > snapshot.activeCandidateCap)"), "capacity snapshot assertion blocks values above cap");
assert.ok(capacitySource.includes("ACTIVE_CANDIDATE_CAP_EXCEEDED"), "capacity overrun has a stable fail-closed error");

function assertCap(activeCandidates, cap) {
  if (activeCandidates > cap) throw new Error("ACTIVE_CANDIDATE_CAP_EXCEEDED");
}
assert.doesNotThrow(() => assertCap(500, 500));
assert.throws(() => assertCap(501, 500), /ACTIVE_CANDIDATE_CAP_EXCEEDED/);

console.log("PASS: source-guarded 500-cap boundary and sequential 1,000 / 5,000 / 10,000 / 25,000 growth-governance decision table.");
