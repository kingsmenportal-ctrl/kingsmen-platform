import fs from "node:fs";
import path from "node:path";

const backendBaseUrl = (process.env.KINGSMEN_BACKEND_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const reportPath = process.env.JARVIS_PAYFAST_EVIDENCE_REPORT || "reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json";
const sandboxCheckoutEvidenceFile = process.env.JARVIS_PAYFAST_SANDBOX_CHECKOUT_EVIDENCE_FILE || "";
const acceptedItnEvidenceFile = process.env.JARVIS_PAYFAST_ACCEPTED_ITN_EVIDENCE_FILE || "";
const rejectionEvidenceFile = process.env.JARVIS_PAYFAST_REJECTION_EVIDENCE_FILE || "";
const refundApprovalEvidenceFile = process.env.JARVIS_PAYFAST_REFUND_APPROVAL_EVIDENCE_FILE || "";
const generatedAtIso = new Date().toISOString();
const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}

function hasEnv(name) {
  return Boolean(process.env[name] && String(process.env[name]).trim().length > 0);
}

function redactedEnvStatus(names) {
  return names.map((name) => ({ name, present: hasEnv(name), valueReturned: false }));
}

function readEvidenceFile(filePath, expectedSchema) {
  if (!filePath) return { present: false, parsed: false, body: null, reason: "NO_FILE_PATH_SUPPLIED" };
  if (!fs.existsSync(filePath)) return { present: false, parsed: false, body: null, reason: "FILE_NOT_FOUND" };
  try {
    const body = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { present: true, parsed: true, schemaMatches: body?.schema === expectedSchema, body };
  } catch (error) {
    return { present: true, parsed: false, body: null, reason: safeError(error) };
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { parseError: "NON_JSON_RESPONSE", redactedTextLength: text.length };
  }
  return { ok: response.ok, status: response.status, body };
}

const checks = [];
function addCheck(id, passed, detail, evidence = {}) {
  checks.push({ id, passed, detail, evidence });
}

function evidencePass(evidence, requirements) {
  const body = evidence.body ?? {};
  return Boolean(evidence.present && evidence.parsed && evidence.schemaMatches && requirements.every((key) => body[key] === true));
}

function evidenceState(evidence, requirements) {
  const body = evidence.body ?? {};
  return {
    evidenceFileSupplied: Boolean(evidence?.fileSupplied),
    present: Boolean(evidence.present),
    parsed: Boolean(evidence.parsed),
    schemaMatches: Boolean(evidence.schemaMatches),
    reason: evidence.reason ?? null,
    requiredBooleans: Object.fromEntries(requirements.map((key) => [key, body[key] === true])),
    redacted: body.redacted === true,
    rawSecretsReturned: body.rawSecretsReturned === false,
    secretValuesReturned: body.secretValuesReturned === false
  };
}

async function main() {
  const payfastEnv = redactedEnvStatus([
    "PAYFAST_MERCHANT_ID",
    "PAYFAST_MERCHANT_KEY",
    "PAYFAST_PASSPHRASE",
    "PAYFAST_NOTIFY_URL",
    "PAYMENT_PROVIDER_SECRET"
  ]);

  addCheck("payfast-config-present", payfastEnv.every((item) => item.present), "PayFast credentials must be present outside Git before evidence can be accepted.", {
    required: payfastEnv
  });

  let command = null;
  const commandPayload = {
    commandId: `cmd_jarvis_payfast_itn_evidence_${nonce}`,
    commandType: "payment.payfast.itn.proof.requested",
    idempotencyKey: `idem_jarvis_payfast_itn_evidence_${nonce}`,
    correlationId: `corr_jarvis_payfast_itn_evidence_${nonce}`,
    actor: {
      type: "system",
      id: "jarvis-payfast-itn-evidence-capture",
      displayName: "Jarvis PayFast ITN Evidence Capture"
    },
    source: "jarvis",
    createdAt: generatedAtIso,
    payload: {
      proofName: "payfast-accepted-itn-evidence",
      redacted: true,
      noRawSecrets: true,
      truthVaultFinanceAuthorityRequired: true,
      payfastMayMarkPaidFromReturnUrl: false,
      payfastMayMarkPaidFromCancelUrl: false,
      acceptedItnRequired: true,
      emailPrimaryChannel: true,
      whatsappUrgentOnly: true,
      smsBackupOnly: true
    }
  };

  try {
    command = await postJson(`${backendBaseUrl}/api/commands`, commandPayload);
    const accepted = command.ok && [200, 202].includes(command.status);
    addCheck("backend-command-accepted", accepted, "Backend must accept a PayFast ITN proof command before evidence can be attached.", {
      httpStatus: command.status,
      ok: command.ok,
      status: command.body?.status ?? null,
      commandId: command.body?.commandId ?? null,
      correlationId: command.body?.correlationId ?? null,
      storageMode: command.body?.storageMode ?? null,
      policy: command.body?.policy ? {
        allowed: Boolean(command.body.policy.allowed),
        requiresApproval: Boolean(command.body.policy.requiresApproval),
        hardBlockerCount: Array.isArray(command.body.policy.hardBlockers) ? command.body.policy.hardBlockers.length : null
      } : null
    });
  } catch (error) {
    addCheck("backend-command-accepted", false, "Backend PayFast proof command request failed.", { error: safeError(error) });
  }

  const sandboxEvidence = readEvidenceFile(sandboxCheckoutEvidenceFile, "kingsmen.jarvis-payfast-sandbox-checkout-evidence.v1");
  sandboxEvidence.fileSupplied = Boolean(sandboxCheckoutEvidenceFile);
  const sandboxRequirements = [
    "sandboxCheckoutAccepted",
    "backendCreatedCheckout",
    "orderCorrelationCaptured",
    "financeLedgerCaptured",
    "redacted"
  ];
  addCheck("payfast-sandbox-checkout-evidence-accepted", evidencePass(sandboxEvidence, sandboxRequirements) && sandboxEvidence.body?.rawSecretsReturned === false && sandboxEvidence.body?.secretValuesReturned === false, "Sandbox checkout evidence must prove backend-created checkout, order correlation, finance ledger, and redaction.", evidenceState(sandboxEvidence, sandboxRequirements));

  const itnEvidence = readEvidenceFile(acceptedItnEvidenceFile, "kingsmen.jarvis-payfast-accepted-itn-evidence.v1");
  itnEvidence.fileSupplied = Boolean(acceptedItnEvidenceFile);
  const itnRequirements = [
    "acceptedItnProofAccepted",
    "itnVerified",
    "paymentStatusAccepted",
    "amountReferenceMatched",
    "truthVaultFinanceTransitionCaptured",
    "redacted"
  ];
  addCheck("payfast-accepted-itn-evidence-accepted", evidencePass(itnEvidence, itnRequirements) && itnEvidence.body?.rawSecretsReturned === false && itnEvidence.body?.secretValuesReturned === false, "Accepted ITN evidence must prove verified ITN, accepted payment status, amount/reference match, Truth Vault finance transition, and redaction.", evidenceState(itnEvidence, itnRequirements));

  const rejectionEvidence = readEvidenceFile(rejectionEvidenceFile, "kingsmen.jarvis-payfast-rejection-evidence.v1");
  rejectionEvidence.fileSupplied = Boolean(rejectionEvidenceFile);
  const rejectionRequirements = [
    "duplicateItnRejected",
    "failedPaymentRejected",
    "returnUrlRejectedAsPaid",
    "cancelUrlRejectedAsPaid",
    "idempotencyCaptured",
    "redacted"
  ];
  addCheck("payfast-rejection-evidence-accepted", evidencePass(rejectionEvidence, rejectionRequirements) && rejectionEvidence.body?.rawSecretsReturned === false && rejectionEvidence.body?.secretValuesReturned === false, "Rejection evidence must prove duplicate ITN rejection, failed-payment rejection, return/cancel URL rejection, idempotency, and redaction.", evidenceState(rejectionEvidence, rejectionRequirements));

  const refundEvidence = readEvidenceFile(refundApprovalEvidenceFile, "kingsmen.jarvis-payfast-refund-founder-approval-evidence.v1");
  refundEvidence.fileSupplied = Boolean(refundApprovalEvidenceFile);
  const refundRequirements = [
    "refundReviewBoundaryAccepted",
    "founderPaymentApprovalAccepted",
    "auditEventCaptured",
    "candidateCommunicationEvidenceCaptured",
    "redacted"
  ];
  addCheck("payfast-refund-founder-approval-evidence-accepted", evidencePass(refundEvidence, refundRequirements) && refundEvidence.body?.rawSecretsReturned === false && refundEvidence.body?.secretValuesReturned === false, "Refund/founder approval evidence must prove review boundary, founder approval, audit event, candidate communication evidence, and redaction.", evidenceState(refundEvidence, refundRequirements));

  addCheck("no-return-cancel-paid-state", true, "Runner never accepts return URL or cancel URL as paid-state proof.", {
    payfastMayMarkPaidFromReturnUrl: false,
    payfastMayMarkPaidFromCancelUrl: false,
    acceptedItnRequired: true
  });

  addCheck("redaction-lock", true, "Report contains credential presence booleans only; no PayFast secret values are printed or returned.", {
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false
  });

  const failedChecks = checks.filter((check) => !check.passed);
  const payfastEvidenceAccepted = failedChecks.length === 0;

  const report = {
    schema: "kingsmen.jarvis-payfast-accepted-itn-evidence-capture.v1",
    module: "Jarvis PayFast Accepted ITN Evidence Capture",
    generatedAtIso,
    backendBaseUrl,
    jarvisSourceDesignClosedOut: true,
    jarvisRuntimeLive: false,
    payfastEvidenceAccepted,
    payfastSandboxProofAccepted: payfastEvidenceAccepted,
    payfastAcceptedItnProofAccepted: payfastEvidenceAccepted,
    duplicateItnRejected: payfastEvidenceAccepted,
    failedPaymentRejected: payfastEvidenceAccepted,
    refundReviewBoundaryAccepted: payfastEvidenceAccepted,
    founderPaymentApprovalAccepted: payfastEvidenceAccepted,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: !payfastEvidenceAccepted,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecutedFromWeb: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    payfastMayMarkPaidFromReturnUrl: false,
    payfastMayMarkPaidFromCancelUrl: false,
    truthVaultFinanceAuthorityRequired: true,
    checks,
    failedChecks,
    nextAction: payfastEvidenceAccepted
      ? "Attach this report to the Jarvis evidence ledger and continue provider-tool/security proof batches."
      : "Supply PayFast credentials and accepted redacted sandbox, ITN, rejection, and approval evidence files, then rerun this capture."
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  process.exit(payfastEvidenceAccepted ? 0 : 1);
}

main().catch((error) => {
  const report = {
    schema: "kingsmen.jarvis-payfast-accepted-itn-evidence-capture.v1",
    module: "Jarvis PayFast Accepted ITN Evidence Capture",
    generatedAtIso,
    backendBaseUrl,
    payfastEvidenceAccepted: false,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    error: safeError(error)
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
});
