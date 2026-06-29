export type JarvisPayFastAction =
  | 'checkout_intent'
  | 'provider_notification'
  | 'provider_confirmation'
  | 'finance_reconciliation'
  | 'paid_unlock_request'
  | 'refund_review'
  | 'dispute_review'
  | 'runtime_probe';

export type JarvisPayFastEnvironment = 'sandbox' | 'live' | 'unknown';

export type JarvisPayFastPolicyStatus = 'allowed' | 'needs_approval' | 'blocked';

export interface JarvisPayFastPaymentRequest {
  readonly commandRef: string;
  readonly action: JarvisPayFastAction;
  readonly environment: JarvisPayFastEnvironment;
  readonly paymentRef: string;
  readonly hasProviderConfirmation: boolean;
  readonly hasFinanceEvidence: boolean;
  readonly hasBackendPaymentState: boolean;
  readonly hasEvidenceLedgerRef: boolean;
  readonly requestsPaidUnlock: boolean;
  readonly touchesRefundOrDispute: boolean;
  readonly touchesSecrets: boolean;
  readonly requestedByCommander: boolean;
}

export interface JarvisPayFastPaymentDecision {
  readonly intent: 'PAYFAST_PAYMENT_PROVIDER_BOUNDARY';
  readonly providerRole: 'payment_provider_not_finance_truth_by_itself';
  readonly action: JarvisPayFastAction;
  readonly environment: JarvisPayFastEnvironment;
  readonly paymentRef: string;
  readonly policyStatus: JarvisPayFastPolicyStatus;
  readonly paidExecutionLocked: boolean;
  readonly approvalRequired: boolean;
  readonly providerConfirmationRequired: boolean;
  readonly financeEvidenceRequired: boolean;
  readonly backendStateRequired: boolean;
  readonly evidenceLedgerRequired: boolean;
  readonly forbiddenClaims: readonly string[];
  readonly requiredProof: readonly string[];
  readonly runtimeProof: null;
  readonly completionStatus: 'payfast_boundary_built_not_provider_runtime_proven';
}

const forbiddenClaims = [
  'checkout_intent_must_not_be_treated_as_payment_success',
  'screenshot_must_not_be_treated_as_final_payment_truth',
  'provider_notification_must_not_unlock_paid_execution_without_verification',
  'payfast_must_not_replace_postgresql_payment_state',
  'repo_code_must_not_be_treated_as_live_payment_provider_proof',
  'payment_secrets_must_not_be_exposed_client_side'
] as const;

export function jarvisAssessPayFastPaymentRequest(
  request: JarvisPayFastPaymentRequest
): JarvisPayFastPaymentDecision {
  const providerConfirmationRequired = request.requestsPaidUnlock || request.action === 'provider_confirmation' || request.action === 'provider_notification';
  const financeEvidenceRequired = request.touchesRefundOrDispute || request.action === 'finance_reconciliation';
  const backendStateRequired = request.requestsPaidUnlock || request.action === 'paid_unlock_request';
  const evidenceLedgerRequired = request.requestsPaidUnlock || request.touchesRefundOrDispute || request.action !== 'checkout_intent';

  const missingPaymentProof =
    (providerConfirmationRequired && !request.hasProviderConfirmation) ||
    (financeEvidenceRequired && !request.hasFinanceEvidence) ||
    (backendStateRequired && !request.hasBackendPaymentState) ||
    (evidenceLedgerRequired && !request.hasEvidenceLedgerRef);

  const policyStatus: JarvisPayFastPolicyStatus = request.touchesSecrets || missingPaymentProof
    ? 'blocked'
    : request.requestsPaidUnlock || request.touchesRefundOrDispute || request.environment === 'live'
      ? 'needs_approval'
      : 'allowed';

  return {
    intent: 'PAYFAST_PAYMENT_PROVIDER_BOUNDARY',
    providerRole: 'payment_provider_not_finance_truth_by_itself',
    action: request.action,
    environment: request.environment,
    paymentRef: request.paymentRef,
    policyStatus,
    paidExecutionLocked: policyStatus !== 'allowed' || request.requestsPaidUnlock,
    approvalRequired: policyStatus === 'needs_approval',
    providerConfirmationRequired,
    financeEvidenceRequired,
    backendStateRequired,
    evidenceLedgerRequired,
    forbiddenClaims,
    requiredProof: [
      'provider_confirmation_or_verified_payment_proof',
      'backend_payment_state_record',
      'evidence_ledger_reference',
      'finance_reconciliation_for_refund_or_dispute',
      'server_side_secret_boundary',
      'sandbox_or_live_runtime_output_before_claiming_provider_success'
    ],
    runtimeProof: null,
    completionStatus: 'payfast_boundary_built_not_provider_runtime_proven'
  };
}

export const JARVIS_PAYFAST_PAYMENT_RUNTIME_STATUS = {
  doctrineFile: 'created_in_github',
  boundaryRuntime: 'built_as_code_contract',
  paymentProviderConnection: 'not_proven_without_runtime_probe',
  providerConfirmation: 'required_before_paid_unlock',
  backendPaymentState: 'required_before_paid_execution',
  evidenceLedger: 'required_for_payment_truth',
  productionCompletion: 'not_claimed_from_code_alone'
} as const;
