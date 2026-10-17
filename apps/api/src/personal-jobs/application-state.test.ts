import test from "node:test";
import assert from "node:assert/strict";
import { decideApplicationTransition } from "./application-state";

const candidateReceipt = {
  kind: "candidate_submission_receipt" as const,
  reference: "candidate-provided-receipt-1",
  recordedBy: "candidate" as const,
  recordedAt: "2026-10-17T04:00:00.000Z"
};
const employerInterview = {
  kind: "employer_interview_invitation" as const,
  reference: "employer-email-1",
  recordedBy: "employer" as const,
  recordedAt: "2026-10-17T04:00:00.000Z"
};

test("permits normal preparation and manual-submission readiness transitions", () => {
  assert.equal(decideApplicationTransition({ from: "preparation", to: "ready_for_manual_submission" }).allowed, true);
  assert.equal(decideApplicationTransition({ from: "ready_for_manual_submission", to: "submission_in_progress" }).allowed, true);
});

test("rejects impossible and backward terminal transitions", () => {
  assert.deepEqual(decideApplicationTransition({ from: "preparation", to: "offer_received" }), { allowed: false, code: "INVALID_TRANSITION" });
  assert.deepEqual(decideApplicationTransition({ from: "closed", to: "interview" }), { allowed: false, code: "INVALID_TRANSITION" });
});

test("cannot claim verified submission without a candidate receipt", () => {
  assert.deepEqual(decideApplicationTransition({ from: "submission_in_progress", to: "submitted_verified" }), { allowed: false, code: "EVIDENCE_REQUIRED" });
  assert.deepEqual(decideApplicationTransition({ from: "submission_in_progress", to: "submitted_verified", evidence: { ...candidateReceipt, reference: "  " } }), { allowed: false, code: "INVALID_EVIDENCE" });
  assert.deepEqual(decideApplicationTransition({ from: "submission_in_progress", to: "submitted_verified", evidence: employerInterview }), { allowed: false, code: "EVIDENCE_MISMATCH" });
});

test("cannot fabricate interview, rejection, or offer as candidate-authored facts", () => {
  assert.deepEqual(decideApplicationTransition({ from: "submitted_verified", to: "interview" }), { allowed: false, code: "EVIDENCE_REQUIRED" });
  assert.deepEqual(decideApplicationTransition({ from: "submitted_verified", to: "interview", evidence: { ...employerInterview, recordedBy: "candidate" } }), { allowed: false, code: "EVIDENCE_MISMATCH" });
  assert.deepEqual(decideApplicationTransition({ from: "submitted_verified", to: "offer_received", evidence: employerInterview }), { allowed: false, code: "EVIDENCE_MISMATCH" });
});

test("accepted transitions explicitly require audit and atomic persistence", () => {
  assert.deepEqual(decideApplicationTransition({ from: "submission_in_progress", to: "submitted_verified", evidence: candidateReceipt }), {
    allowed: true, requiresAudit: true, requiresAtomicPersistence: true
  });
});

test("closure from active states requires a documented closure note", () => {
  assert.deepEqual(decideApplicationTransition({ from: "preparation", to: "closed" }), { allowed: false, code: "EVIDENCE_REQUIRED" });
  assert.equal(decideApplicationTransition({ from: "preparation", to: "closed", evidence: {
    kind: "candidate_closure_note", reference: "candidate-request-1", recordedBy: "candidate", recordedAt: "2026-10-17T04:00:00.000Z"
  }).allowed, true);
});
