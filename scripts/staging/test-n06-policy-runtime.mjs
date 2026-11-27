import assert from "node:assert/strict";
import { assertN06OfficialRouteInstructionAllowed } from "../../packages/backend/src/n06/source-confidence-route-policy.ts";
import { assertN06RouteInstructionSafety } from "../../packages/backend/src/n06/route-instruction-safety-policy.ts";
import { assertN06WorkbenchApiSafe } from "../../packages/backend/src/n06/workbench-api-policy.ts";
import { optimizeN06CaoChoices } from "../../packages/backend/src/n06/cao-choice-optimizer.ts";

assert.equal(assertN06OfficialRouteInstructionAllowed({
  instructionType: "deadline",
  sourceConfidence: "official_verified",
  sourceUrl: "https://example.gov.za/official"
}), true);
assert.throws(() => assertN06OfficialRouteInstructionAllowed({
  instructionType: "deadline",
  sourceConfidence: "low",
  sourceUrl: "https://example.gov.za/official"
}), /blocked without verified source/);
assert.throws(() => assertN06OfficialRouteInstructionAllowed({
  instructionType: "fee",
  sourceConfidence: "high"
}), /requires source URL/);

assert.equal(assertN06RouteInstructionSafety({
  instructionType: "application_link",
  sourceConfidence: "high",
  sourceUrl: "https://example.gov.za/apply",
  noGuaranteeLanguageRequired: true
}), true);
assert.throws(() => assertN06RouteInstructionSafety({
  instructionType: "payment_channel",
  sourceConfidence: "unverified",
  sourceUrl: "https://example.gov.za/pay",
  noGuaranteeLanguageRequired: true
}), /blocked without verified source/);
assert.throws(() => assertN06RouteInstructionSafety({
  instructionType: "general_advice",
  sourceConfidence: "high",
  sourceUrl: "https://example.gov.za",
  noGuaranteeLanguageRequired: false
}), /requires no-guarantee language/);

assert.equal(assertN06WorkbenchApiSafe({
  actorType: "candidate",
  action: "prepare_draft",
  productionReady: false,
  serviceRoleVisibleToBrowser: false
}), true);
for (const action of ["verify_source", "mark_paid", "mark_submitted", "verify_outcome", "change_source_confidence", "override_choice_order_as_final"]) {
  assert.throws(() => assertN06WorkbenchApiSafe({ actorType: "candidate", action }), /candidate cannot perform truth-authority/);
}
assert.throws(() => assertN06WorkbenchApiSafe({
  actorType: "candidate",
  action: "prepare_draft",
  serviceRoleVisibleToBrowser: true
}), /service_role must never be visible/);
assert.throws(() => assertN06WorkbenchApiSafe({
  actorType: "operator",
  action: "read",
  productionReady: true
}), /cannot claim productionReady=true/);

const optimized = optimizeN06CaoChoices({
  parentApplicationId: "cao-parent-001",
  choices: [
    { choiceId: "choice-low", programmeName: "Programme A", institutionName: "Institution A", sourceConfidence: "high", fitScore: 50, riskScore: 20, candidatePreferenceRank: 2 },
    { choiceId: "choice-high", programmeName: "Programme B", institutionName: "Institution B", sourceConfidence: "official_verified", fitScore: 90, riskScore: 5, candidatePreferenceRank: 1 }
  ]
});
assert.equal(optimized.countsAsOneKingsmenApplication, true);
assert.equal(optimized.productionReady, false);
assert.equal(optimized.noGuaranteeLanguageRequired, true);
assert.equal(optimized.orderedChoices[0].choiceId, "choice-high");
assert.ok(optimized.orderedChoices.every((choice) => choice.countsAsSeparateKingsmenApplication === false));
assert.ok(optimized.orderedChoices.every((choice) => choice.parentApplicationId === "cao-parent-001"));
assert.throws(() => optimizeN06CaoChoices({ parentApplicationId: "", choices: [] }), /requires parentApplicationId/);
assert.throws(() => optimizeN06CaoChoices({ parentApplicationId: "cao-parent-002", choices: [] }), /requires at least one child choice/);

console.log("N06 policy runtime tests passed: source confidence, instruction safety, candidate authority, service-role boundary, CAO parent/child semantics.");
