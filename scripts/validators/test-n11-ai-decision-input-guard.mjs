import assert from "node:assert/strict";
import { calculateRouteMatch, calculatePlacementScore, screenEligibility, assertAiActionAllowed, aiCanSubmitOfficialApplication, aiCanApproveRefund, aiCanConfirmFraud } from "../../apps/api/dist/ai-decision/index.js";

const candidate = {
  signalRef:"sig-test", candidateRef:"candidate-test", profileCompleteness:80, documentReadiness:75,
  academicFit:82, fundingNeed:60, accommodationNeed:40, urgencyScore:55,
  sectorPreferences:["higher_education"], riskFlags:[], evidenceRefs:["candidate-evidence:test"], sourceConfidence:"HIGH"
};
const route = {
  routeRef:"route-test", routeSector:"higher_education", institutionRef:"institution-test",
  sourceConfidence:"OFFICIAL_VERIFIED", portalHealth:"HEALTHY", deadlineUrgency:60,
  documentFit:80, academicFit:85, fundingFit:70, accommodationFit:65, evidenceRefs:["official-source:test"]
};
const match=calculateRouteMatch({candidate,route});
const placement=calculatePlacementScore({candidate,route});
assert.ok(match.matchScore>=0 && match.matchScore<=100,"match score must be bounded");
assert.ok(placement.finalScore>=0 && placement.finalScore<=100,"placement score must be bounded");
assert.deepEqual(match.evidenceRefs,["candidate-evidence:test","official-source:test"]);
const eligible=screenEligibility({candidate,route,requiredDocuments:["ID"],candidateDocuments:["id"]});
assert.equal(eligible.eligibilityStatus,"ELIGIBLE");
assert.equal(eligible.reviewRequired,false);
assert.throws(()=>calculateRouteMatch({candidate:{...candidate,academicFit:101},route}),/AI_INPUT_INVALID_SCORE:academicFit/);
assert.throws(()=>calculatePlacementScore({candidate:{...candidate,profileCompleteness:Number.NaN},route}),/AI_INPUT_INVALID_SCORE:profileCompleteness/);
assert.throws(()=>screenEligibility({candidate:{...candidate,evidenceRefs:[]},route}),/AI_INPUT_EVIDENCE_REQUIRED:candidate/);
assert.throws(()=>calculateRouteMatch({candidate,route:{...route,sourceConfidence:"UNVERIFIED"}}),/AI_INPUT_INVALID_SOURCE_CONFIDENCE:route/);
assert.throws(()=>calculatePlacementScore({candidate,route:{...route,portalHealth:"UP"}}),/AI_INPUT_INVALID_PORTAL_HEALTH/);
assert.throws(()=>screenEligibility({candidate,route:{...route,evidenceRefs:[]}}),/AI_INPUT_EVIDENCE_REQUIRED:route/);
for (const action of ["money","refunds","official status","submissions","fraud","privacy","hard blockers"]) {
  assert.throws(()=>assertAiActionAllowed(action),/AI_ACTION_BLOCKED/);
}
assert.equal(aiCanSubmitOfficialApplication(),false);
assert.equal(aiCanApproveRefund(),false);
assert.equal(aiCanConfirmFraud(),false);
console.log(JSON.stringify({passed:true,checks:15,scope:"N11 AI decision input guard",liveProviderCalls:0,officialSubmissions:0},null,2));
