import assert from "node:assert/strict";
import {
  CORE_PATHWAYS, canonicalizeSourceUrl, assessSourceAuthority, assessFreshness,
  normalizeDuplicateKey, reconcileDuplicateObservations, assessDeadline,
  assessEligibility, assessCandidateMatch
} from "../../apps/api/src/opportunity/n15-source-intelligence-policy.mjs";

const now = "2026-10-23T12:00:00.000Z";
const checks = [];
function test(name, fn) { fn(); checks.push(name); }
test("six core pathways defined", () => assert.equal(CORE_PATHWAYS.length, 6));
test("canonical URL strips tracking and fragment", () => assert.equal(canonicalizeSourceUrl("https://Example.org/path/?utm_source=x&b=2#frag").canonicalUrl, "https://example.org/path?b=2"));
test("HTTP source rejected", () => assert.equal(canonicalizeSourceUrl("http://example.org").reason, "HTTPS_REQUIRED"));
test("URL credentials rejected", () => assert.equal(canonicalizeSourceUrl("https://user:pass@example.org").reason, "URL_CREDENTIALS_FORBIDDEN"));
test("official subdomain matches registered authority", () => assert.equal(assessSourceAuthority({ sourceUrl:"https://apply.dhet.gov.za/x", registeredAuthorityUrls:["https://dhet.gov.za"] }).confidenceCeiling, "OFFICIAL_VERIFIED"));
test("lookalike domain cannot impersonate authority", () => assert.equal(assessSourceAuthority({ sourceUrl:"https://dhet.gov.za.attacker.example", registeredAuthorityUrls:["https://dhet.gov.za"], claimedOfficial:true }).authorityMatched, false));
test("unregistered claimed official source is capped", () => assert.equal(assessSourceAuthority({ sourceUrl:"https://random.example/x", registeredAuthorityUrls:["https://dhet.gov.za"], claimedOfficial:true }).confidenceCeiling, "MEDIUM"));
test("fresh explicit source is fresh", () => assert.equal(assessFreshness({observedAt:"2026-10-22T12:00:00Z",lastCheckedAt:"2026-10-23T10:00:00Z",staleAfter:"2026-10-24T12:00:00Z",now}).status, "FRESH"));
test("missing last check fails closed", () => assert.equal(assessFreshness({observedAt:"2026-10-22T12:00:00Z",staleAfter:"2026-10-24T12:00:00Z",now}).candidateFacingSafe, false));
test("missing stale policy requires review", () => assert.equal(assessFreshness({observedAt:"2026-10-22T12:00:00Z",lastCheckedAt:"2026-10-23T10:00:00Z",now}).status, "NEEDS_REVIEW"));
test("expired source is stale", () => assert.equal(assessFreshness({observedAt:"2026-10-22T12:00:00Z",lastCheckedAt:"2026-10-22T12:00:00Z",staleAfter:"2026-10-23T11:00:00Z",now}).status, "STALE"));
test("future timestamp requires review", () => assert.equal(assessFreshness({observedAt:"2026-10-24T12:00:00Z",lastCheckedAt:"2026-10-24T12:00:00Z",staleAfter:"2026-10-25T12:00:00Z",now}).status, "NEEDS_REVIEW"));
test("duplicate key normalises case and punctuation", () => assert.equal(normalizeDuplicateKey({providerName:"College A",title:"IT Support!",sector:"TVET"}).key, normalizeDuplicateKey({providerName:"COLLEGE A",title:"it-support",sector:"tvet"}).key));
test("duplicate reconciliation groups repeats", () => assert.equal(reconcileDuplicateObservations([{providerName:"A",title:"X",sector:"TVET",observationRef:"1"},{providerName:"A",title:"X",sector:"TVET",observationRef:"2"}]).duplicateObservationCount, 1));
test("incomplete duplicate key rejected", () => assert.equal(normalizeDuplicateKey({providerName:"",title:"X",sector:"TVET"}).ok, false));
test("deadline requires evidence", () => assert.equal(assessDeadline({closesAt:"2026-10-30T00:00:00Z",deadlineStatus:"CONFIRMED",now}).candidateFacingSafe, false));
test("past deadline marked stale", () => assert.equal(assessDeadline({closesAt:"2026-10-20T00:00:00Z",deadlineStatus:"CONFIRMED",evidenceRefs:["e1"],now}).status, "STALE"));
test("estimated deadline is not candidate-safe", () => assert.equal(assessDeadline({closesAt:"2026-10-30T00:00:00Z",deadlineStatus:"ESTIMATED",evidenceRefs:["e1"],now}).candidateFacingSafe, false));
test("confirmed future deadline with evidence accepted", () => assert.equal(assessDeadline({closesAt:"2026-10-30T00:00:00Z",deadlineStatus:"CONFIRMED",evidenceRefs:["e1"],now}).candidateFacingSafe, true));
test("missing eligibility remains unknown", () => assert.equal(assessEligibility().status, "UNKNOWN"));
test("unreviewed eligibility rule requires review", () => assert.equal(assessEligibility({rules:[{reviewRequired:true,sourceConfidence:"HIGH",evidenceRefs:["e1"]}],evidenceRefs:["e1"]}).candidateFacingSafe, false));
test("eligible rule never removes human review", () => assert.equal(assessEligibility({rules:[{reviewRequired:false,sourceConfidence:"OFFICIAL_VERIFIED",evidenceRefs:["e1"]}],evidenceRefs:["e1"]}).humanReviewRequired, true));
test("TVET routes to TVET pathway", () => assert.ok(assessCandidateMatch({sector:"TVET"}).pathwayCoverage.includes("TVET")));
test("unknown opening cannot match as candidate-safe", () => assert.equal(assessCandidateMatch({sector:"UNIVERSITY",sourceConfidence:"OFFICIAL_VERIFIED",openingStatus:"UNKNOWN",freshness:{status:"FRESH",candidateFacingSafe:true},eligibility:{candidateFacingSafe:true},providerSafe:true,programmeEvidenceRefs:["p"],candidateEvidenceRefs:["c"]}).candidateFacingSafe, false));
test("strong evidence still requires human review", () => assert.equal(assessCandidateMatch({sector:"UNIVERSITY",sourceConfidence:"OFFICIAL_VERIFIED",openingStatus:"OPEN",freshness:{status:"FRESH",candidateFacingSafe:true},eligibility:{candidateFacingSafe:true},providerSafe:true,programmeEvidenceRefs:["p"],candidateEvidenceRefs:["c"]}).humanReviewRequired, true));
console.log(`N15 source intelligence regression tests passed: ${checks.length} tests.`);
