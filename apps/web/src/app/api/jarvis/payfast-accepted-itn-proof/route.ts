import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PayFastProofRequirement = {
  id: string;
  title: string;
  state: "PENDING_CREDENTIALS" | "PENDING_EVIDENCE" | "BLOCKED_BY_PROVIDER_EVIDENCE" | "REJECTED_UNTIL_ACCEPTED_ITN";
  launchCritical: boolean;
  detail: string;
  acceptedOnlyWhen: string[];
  rejectionRules: string[];
};

const requirements: PayFastProofRequirement[] = [
  {
    id: "payfast-credentials-outside-git",
    title: "PayFast Credentials Outside Git",
    state: "PENDING_CREDENTIALS",
    launchCritical: true,
    detail: "PayFast merchant ID, merchant key, passphrase, notify URL, and payment provider secret must be configured outside Git before live payment proof can run.",
    acceptedOnlyWhen: ["secret scan passes", "runtime environment is redacted", "no PayFast credential value is returned to web/API responses"],
    rejectionRules: ["reject raw merchant key exposure", "reject passphrase printed in logs", "reject credentials committed to Git"]
  },
  {
    id: "payfast-sandbox-checkout",
    title: "Sandbox Checkout Proof",
    state: "PENDING_EVIDENCE",
    launchCritical: true,
    detail: "A sandbox checkout must be generated through backend payment flow and tied to a Truth Vault finance/order record.",
    acceptedOnlyWhen: ["backend-created checkout", "order correlation ID captured", "finance evidence ledger row created"],
    rejectionRules: ["reject manual screenshot only", "reject checkout not linked to order", "reject browser-only fake checkout"]
  },
  {
    id: "payfast-accepted-itn",
    title: "Accepted ITN Payment Proof",
    state: "REJECTED_UNTIL_ACCEPTED_ITN",
    launchCritical: true,
    detail: "Only a verified PayFast ITN may mark an order paid. Return URL and cancel URL are not payment proof.",
    acceptedOnlyWhen: ["accepted ITN signature/verification proof", "payment_status COMPLETE or accepted sandbox equivalent", "amount and merchant reference match", "Truth Vault finance state transition captured"],
    rejectionRules: ["reject return URL as paid", "reject cancel URL as paid", "reject manual paid notes", "reject unverified ITN", "reject mismatched amount or reference"]
  },
  {
    id: "payfast-duplicate-itn-rejection",
    title: "Duplicate ITN Rejection Proof",
    state: "PENDING_EVIDENCE",
    launchCritical: true,
    detail: "Duplicate PayFast notifications must be idempotent and must not double-credit a candidate or order.",
    acceptedOnlyWhen: ["idempotency key or ITN fingerprint captured", "duplicate event rejected or ignored", "single ledger transition remains authoritative"],
    rejectionRules: ["reject double paid transition", "reject duplicate ledger credit", "reject missing idempotency evidence"]
  },
  {
    id: "payfast-failed-payment-rejection",
    title: "Failed Payment Rejection Proof",
    state: "PENDING_EVIDENCE",
    launchCritical: true,
    detail: "Failed, cancelled, pending, or mismatched payment notifications must not clear a payment task or candidate finance status.",
    acceptedOnlyWhen: ["failed/cancelled/pending notification captured", "payment remains unpaid or review-only", "candidate communication uses email evidence"],
    rejectionRules: ["reject paid status from failed payment", "reject paid status from pending payment", "reject payment clearance without ledger evidence"]
  },
  {
    id: "payfast-refund-review-founder-approval",
    title: "Refund Review and Founder Approval",
    state: "BLOCKED_BY_PROVIDER_EVIDENCE",
    launchCritical: true,
    detail: "Refunds and payment corrections require review boundaries and founder approval before launch readiness can pass.",
    acceptedOnlyWhen: ["refund review queue exists", "founder approval captured", "audit event written", "candidate communication evidence captured"],
    rejectionRules: ["reject automatic refund without review", "reject finance correction without audit", "reject missing founder approval"]
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-payfast-accepted-itn-proof.v1",
    module: "Jarvis PayFast Accepted ITN Proof Gate",
    generatedAt: new Date().toISOString(),
    jarvisSourceReady: true,
    payfastProofGateConnected: true,
    payfastSandboxProofAccepted: false,
    payfastAcceptedItnProofAccepted: false,
    duplicateItnRejected: false,
    failedPaymentRejected: false,
    refundReviewBoundaryAccepted: false,
    founderPaymentApprovalAccepted: false,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    providerProofAccepted: false,
    launchBlocked: true,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    payfastMayMarkPaidFromReturnUrl: false,
    payfastMayMarkPaidFromCancelUrl: false,
    truthVaultFinanceAuthorityRequired: true,
    emailPrimaryChannel: true,
    whatsappUrgentOnly: true,
    requirements,
    acceptanceDecision: "BLOCK_PAYFAST_LIVE_UNTIL_ACCEPTED_ITN_EVIDENCE",
    nextAction: "Provide redacted PayFast sandbox checkout, accepted ITN, duplicate rejection, failed-payment rejection, refund review, and founder approval evidence before PayFast can pass."
  });
}
