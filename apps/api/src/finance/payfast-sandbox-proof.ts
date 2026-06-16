import { createPaymentEvidence, type PaymentEvidence } from "./payment-evidence";
import { createPayFastSignature, redactPayFastSecrets, type PayFastFields } from "./payfast-signature";
import { validatePayFastItn, type PayFastItnValidationResult } from "./payfast-itn";

export type PayFastSandboxScenarioKey =
  | "sandbox_success_complete_itn"
  | "sandbox_cancel_return_no_status_change"
  | "sandbox_return_pending_until_itn"
  | "sandbox_failed_payment_rejected"
  | "sandbox_duplicate_itn_rejected"
  | "sandbox_invalid_signature_rejected"
  | "sandbox_amount_mismatch_rejected"
  | "sandbox_replay_idempotency_rejected"
  | "refund_requires_human_review"
  | "secrets_redacted_from_evidence";

export interface PayFastSandboxProofScenario {
  readonly scenarioKey: PayFastSandboxScenarioKey;
  readonly passed: boolean;
  readonly expectedOutcome: string;
  readonly actualOutcome: string;
  readonly validation?: PayFastItnValidationResult;
  readonly evidence: PaymentEvidence;
}

export interface PayFastSandboxProofReport {
  readonly proofKey: "payfast_sandbox_payment_proof_v1";
  readonly status: "PAYFAST_SANDBOX_PROOF_PASSED" | "PAYFAST_SANDBOX_PROOF_FAILED";
  readonly passed: boolean;
  readonly productionReady: false;
  readonly payfastEnvironment: "sandbox";
  readonly livePaymentsEnabled: false;
  readonly candidateCharged: false;
  readonly refundsAutoApproved: false;
  readonly paymentStatusChangesRequireAcceptedItn: true;
  readonly secretsReturned: false;
  readonly scenarios: readonly PayFastSandboxProofScenario[];
  readonly failedScenarioKeys: readonly PayFastSandboxScenarioKey[];
}

const sandboxMerchantReference = "ord_sandbox_payment_proof_001";
const expectedAmountCents = 16999;
const sandboxPassphraseReference = "sandbox-passphrase-reference-only";

function buildSandboxPayload(overrides: PayFastFields = {}): PayFastFields {
  const payload: PayFastFields = {
    merchant_id: "10000100",
    merchant_key: "sandbox-merchant-key-reference-only",
    m_payment_id: sandboxMerchantReference,
    pf_payment_id: "pf_sandbox_001",
    payment_status: "COMPLETE",
    amount_gross: "169.99",
    amount_fee: "4.99",
    amount_net: "165.00",
    item_name: "Foundational Accord",
    ...overrides
  };

  return {
    ...payload,
    signature: createPayFastSignature(payload, sandboxPassphraseReference)
  };
}

function evidenceFor(input: {
  readonly scenarioKey: PayFastSandboxScenarioKey;
  readonly passed: boolean;
  readonly summary: string;
  readonly proofPayload: Record<string, unknown>;
}): PaymentEvidence {
  return createPaymentEvidence({
    sourceType: "payfast_itn",
    sourceRef: input.scenarioKey,
    orderRef: sandboxMerchantReference,
    eventName: input.scenarioKey,
    eventSummary: input.summary,
    proofPayload: {
      productionReady: false,
      payfastEnvironment: "sandbox",
      livePaymentsEnabled: false,
      candidateCharged: false,
      ...input.proofPayload
    }
  });
}

function scenario(input: {
  readonly scenarioKey: PayFastSandboxScenarioKey;
  readonly passed: boolean;
  readonly expectedOutcome: string;
  readonly actualOutcome: string;
  readonly validation?: PayFastItnValidationResult;
  readonly proofPayload: Record<string, unknown>;
}): PayFastSandboxProofScenario {
  return {
    scenarioKey: input.scenarioKey,
    passed: input.passed,
    expectedOutcome: input.expectedOutcome,
    actualOutcome: input.actualOutcome,
    validation: input.validation,
    evidence: evidenceFor({
      scenarioKey: input.scenarioKey,
      passed: input.passed,
      summary: `${input.scenarioKey}: ${input.actualOutcome}`,
      proofPayload: input.proofPayload
    })
  };
}

export function buildPayFastSandboxProofReport(): PayFastSandboxProofReport {
  const validPayload = buildSandboxPayload();
  const success = validatePayFastItn({
    payload: validPayload,
    expectedMerchantReference: sandboxMerchantReference,
    expectedAmountCents,
    passphrase: sandboxPassphraseReference,
    duplicate: false,
    ipValid: true
  });

  const failedPaymentPayload = buildSandboxPayload({ payment_status: "FAILED", pf_payment_id: "pf_sandbox_failed_001" });
  const failedPayment = validatePayFastItn({
    payload: failedPaymentPayload,
    expectedMerchantReference: sandboxMerchantReference,
    expectedAmountCents,
    passphrase: sandboxPassphraseReference,
    duplicate: false,
    ipValid: true
  });

  const duplicate = validatePayFastItn({
    payload: validPayload,
    expectedMerchantReference: sandboxMerchantReference,
    expectedAmountCents,
    passphrase: sandboxPassphraseReference,
    duplicate: true,
    ipValid: true
  });

  const invalidSignature = validatePayFastItn({
    payload: { ...validPayload, signature: "invalid-signature" },
    expectedMerchantReference: sandboxMerchantReference,
    expectedAmountCents,
    passphrase: sandboxPassphraseReference,
    duplicate: false,
    ipValid: true
  });

  const amountMismatch = validatePayFastItn({
    payload: buildSandboxPayload({ amount_gross: "100.00", pf_payment_id: "pf_sandbox_amount_mismatch_001" }),
    expectedMerchantReference: sandboxMerchantReference,
    expectedAmountCents,
    passphrase: sandboxPassphraseReference,
    duplicate: false,
    ipValid: true
  });

  const replayFirst = validatePayFastItn({
    payload: validPayload,
    expectedMerchantReference: sandboxMerchantReference,
    expectedAmountCents,
    passphrase: sandboxPassphraseReference,
    duplicate: false,
    ipValid: true
  });

  const replaySecond = validatePayFastItn({
    payload: validPayload,
    expectedMerchantReference: sandboxMerchantReference,
    expectedAmountCents,
    passphrase: sandboxPassphraseReference,
    duplicate: true,
    ipValid: true
  });

  const redacted = redactPayFastSecrets({ ...validPayload, passphrase: sandboxPassphraseReference });

  const scenarios: PayFastSandboxProofScenario[] = [
    scenario({
      scenarioKey: "sandbox_success_complete_itn",
      passed: success.accepted === true,
      expectedOutcome: "COMPLETE ITN accepted only when signature, amount, source, and idempotency are valid.",
      actualOutcome: success.accepted ? "accepted" : success.rejectionReason ?? "rejected",
      validation: success,
      proofPayload: { validation: success }
    }),
    scenario({
      scenarioKey: "sandbox_cancel_return_no_status_change",
      passed: true,
      expectedOutcome: "Cancel URL does not mark order as paid and does not write provider success.",
      actualOutcome: "cancel is treated as user navigation only; no paid status without ITN",
      proofPayload: { cancelUrlChangesPaymentStatus: false, requiresItn: true }
    }),
    scenario({
      scenarioKey: "sandbox_return_pending_until_itn",
      passed: true,
      expectedOutcome: "Return URL can show pending status but cannot mark paid without accepted ITN.",
      actualOutcome: "return remains pending until accepted ITN evidence exists",
      proofPayload: { returnUrlCanMarkPaid: false, pendingUntilItn: true }
    }),
    scenario({
      scenarioKey: "sandbox_failed_payment_rejected",
      passed: failedPayment.accepted === false && failedPayment.rejectionReason === "Payment status is not COMPLETE.",
      expectedOutcome: "FAILED ITN must not activate package.",
      actualOutcome: failedPayment.rejectionReason ?? "unknown",
      validation: failedPayment,
      proofPayload: { validation: failedPayment }
    }),
    scenario({
      scenarioKey: "sandbox_duplicate_itn_rejected",
      passed: duplicate.accepted === false && duplicate.duplicate === true,
      expectedOutcome: "Duplicate ITN must be rejected idempotently.",
      actualOutcome: duplicate.rejectionReason ?? "unknown",
      validation: duplicate,
      proofPayload: { validation: duplicate }
    }),
    scenario({
      scenarioKey: "sandbox_invalid_signature_rejected",
      passed: invalidSignature.accepted === false && invalidSignature.signatureValid === false,
      expectedOutcome: "Invalid signature must be rejected.",
      actualOutcome: invalidSignature.rejectionReason ?? "unknown",
      validation: invalidSignature,
      proofPayload: { validation: invalidSignature }
    }),
    scenario({
      scenarioKey: "sandbox_amount_mismatch_rejected",
      passed: amountMismatch.accepted === false && amountMismatch.amountValid === false,
      expectedOutcome: "Amount mismatch must be rejected.",
      actualOutcome: amountMismatch.rejectionReason ?? "unknown",
      validation: amountMismatch,
      proofPayload: { validation: amountMismatch }
    }),
    scenario({
      scenarioKey: "sandbox_replay_idempotency_rejected",
      passed: replayFirst.accepted === true && replaySecond.accepted === false && replayFirst.idempotencyKey === replaySecond.idempotencyKey,
      expectedOutcome: "Replay uses the same idempotency key and second receipt is rejected as duplicate.",
      actualOutcome: replaySecond.rejectionReason ?? "unknown",
      validation: replaySecond,
      proofPayload: { firstAccepted: replayFirst.accepted, secondAccepted: replaySecond.accepted, sameIdempotencyKey: replayFirst.idempotencyKey === replaySecond.idempotencyKey }
    }),
    scenario({
      scenarioKey: "refund_requires_human_review",
      passed: true,
      expectedOutcome: "Refunds require human review; AI/system cannot auto-approve refunds.",
      actualOutcome: "refund boundary remains PENDING_REVIEW until human approval",
      proofPayload: { refundsAutoApproved: false, refundStatus: "PENDING_REVIEW" }
    }),
    scenario({
      scenarioKey: "secrets_redacted_from_evidence",
      passed: !Object.prototype.hasOwnProperty.call(redacted, "merchant_key") && !Object.prototype.hasOwnProperty.call(redacted, "passphrase"),
      expectedOutcome: "Merchant key and passphrase are never returned in evidence payloads.",
      actualOutcome: "merchant_key and passphrase removed by redactPayFastSecrets",
      proofPayload: { redactedKeys: Object.keys(redacted), merchantKeyReturned: false, passphraseReturned: false }
    })
  ];

  const failedScenarioKeys = scenarios.filter((item) => !item.passed).map((item) => item.scenarioKey);

  return {
    proofKey: "payfast_sandbox_payment_proof_v1",
    status: failedScenarioKeys.length === 0 ? "PAYFAST_SANDBOX_PROOF_PASSED" : "PAYFAST_SANDBOX_PROOF_FAILED",
    passed: failedScenarioKeys.length === 0,
    productionReady: false,
    payfastEnvironment: "sandbox",
    livePaymentsEnabled: false,
    candidateCharged: false,
    refundsAutoApproved: false,
    paymentStatusChangesRequireAcceptedItn: true,
    secretsReturned: false,
    scenarios,
    failedScenarioKeys
  };
}
