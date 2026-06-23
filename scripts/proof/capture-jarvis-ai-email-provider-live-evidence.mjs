import fs from "node:fs";
import path from "node:path";

const backendBaseUrl = (process.env.KINGSMEN_BACKEND_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const reportPath = process.env.JARVIS_AI_EMAIL_EVIDENCE_REPORT || "reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json";
const aiEvidenceFile = process.env.JARVIS_AI_LIVE_EVIDENCE_FILE || "";
const emailEvidenceFile = process.env.JARVIS_EMAIL_LIVE_EVIDENCE_FILE || "";
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

async function main() {
  const aiEnv = redactedEnvStatus(["KINGSMEN_AI_PROVIDER", "KINGSMEN_AI_MODEL"]);
  const aiKeyNames = ["OPENAI_API_KEY", "KINGSMEN_AI_PROVIDER_API_KEY", "AI_PROVIDER_API_KEY"];
  const aiKeyPresent = aiKeyNames.some((name) => hasEnv(name));
  const emailEnv = redactedEnvStatus(["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"]);

  addCheck("ai-provider-config-present", aiEnv.every((item) => item.present) && aiKeyPresent, "AI provider/model and one provider key must be present outside Git.", {
    required: aiEnv,
    acceptedKeyNames: aiKeyNames.map((name) => ({ name, present: hasEnv(name), valueReturned: false }))
  });

  addCheck("email-provider-config-present", emailEnv.every((item) => item.present), "Email provider credentials must be present outside Git.", {
    required: emailEnv
  });

  let command = null;
  const commandPayload = {
    commandId: `cmd_jarvis_ai_email_evidence_${nonce}`,
    commandType: "provider.ai_email.proof.requested",
    idempotencyKey: `idem_jarvis_ai_email_evidence_${nonce}`,
    correlationId: `corr_jarvis_ai_email_evidence_${nonce}`,
    actor: {
      type: "system",
      id: "jarvis-ai-email-evidence-capture",
      displayName: "Jarvis AI Email Evidence Capture"
    },
    source: "jarvis",
    createdAt: generatedAtIso,
    payload: {
      proofName: "ai-email-provider-live-evidence",
      redacted: true,
      noRawSecrets: true,
      backendControlledAiOnly: true,
      emailPrimaryChannel: true,
      whatsappUrgentOnly: true,
      smsBackupOnly: true
    }
  };

  try {
    command = await postJson(`${backendBaseUrl}/api/commands`, commandPayload);
    const accepted = command.ok && [200, 202].includes(command.status);
    addCheck("backend-command-accepted", accepted, "Backend must accept a provider proof command before evidence can be attached.", {
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
    addCheck("backend-command-accepted", false, "Backend provider proof command request failed.", { error: safeError(error) });
  }

  const aiEvidence = readEvidenceFile(aiEvidenceFile, "kingsmen.jarvis-ai-live-call-evidence.v1");
  const aiBody = aiEvidence.body ?? {};
  addCheck("ai-live-evidence-file-accepted", Boolean(
    aiEvidence.present &&
    aiEvidence.parsed &&
    aiEvidence.schemaMatches &&
    aiBody.aiLiveCallAccepted === true &&
    aiBody.backendControlledAiOnly === true &&
    aiBody.policyGateApplied === true &&
    aiBody.costRateBoundaryRecorded === true &&
    aiBody.redacted === true &&
    aiBody.rawSecretsReturned === false &&
    aiBody.secretValuesReturned === false
  ), "AI live-call evidence file must prove a backend-controlled, policy-gated, redacted provider call.", {
    evidenceFileSupplied: Boolean(aiEvidenceFile),
    present: Boolean(aiEvidence.present),
    parsed: Boolean(aiEvidence.parsed),
    schemaMatches: Boolean(aiEvidence.schemaMatches),
    aiLiveCallAccepted: aiBody.aiLiveCallAccepted === true,
    backendControlledAiOnly: aiBody.backendControlledAiOnly === true,
    policyGateApplied: aiBody.policyGateApplied === true,
    costRateBoundaryRecorded: aiBody.costRateBoundaryRecorded === true,
    redacted: aiBody.redacted === true,
    rawSecretsReturned: aiBody.rawSecretsReturned === false,
    secretValuesReturned: aiBody.secretValuesReturned === false,
    reason: aiEvidence.reason ?? null
  });

  const emailEvidence = readEvidenceFile(emailEvidenceFile, "kingsmen.jarvis-email-primary-channel-evidence.v1");
  const emailBody = emailEvidence.body ?? {};
  addCheck("email-primary-evidence-file-accepted", Boolean(
    emailEvidence.present &&
    emailEvidence.parsed &&
    emailEvidence.schemaMatches &&
    emailBody.emailPrimaryChannelAccepted === true &&
    emailBody.testSendAccepted === true &&
    emailBody.deliveryOrReceiveEvidenceCaptured === true &&
    emailBody.bounceOrFailedSendHandlingCaptured === true &&
    emailBody.optOutRuleCaptured === true &&
    emailBody.messageEvidenceLedgerCaptured === true &&
    emailBody.redacted === true &&
    emailBody.rawSecretsReturned === false &&
    emailBody.secretValuesReturned === false
  ), "Email primary channel evidence file must prove send/receive, failure handling, opt-out, ledger, and redaction.", {
    evidenceFileSupplied: Boolean(emailEvidenceFile),
    present: Boolean(emailEvidence.present),
    parsed: Boolean(emailEvidence.parsed),
    schemaMatches: Boolean(emailEvidence.schemaMatches),
    emailPrimaryChannelAccepted: emailBody.emailPrimaryChannelAccepted === true,
    testSendAccepted: emailBody.testSendAccepted === true,
    deliveryOrReceiveEvidenceCaptured: emailBody.deliveryOrReceiveEvidenceCaptured === true,
    bounceOrFailedSendHandlingCaptured: emailBody.bounceOrFailedSendHandlingCaptured === true,
    optOutRuleCaptured: emailBody.optOutRuleCaptured === true,
    messageEvidenceLedgerCaptured: emailBody.messageEvidenceLedgerCaptured === true,
    redacted: emailBody.redacted === true,
    rawSecretsReturned: emailBody.rawSecretsReturned === false,
    secretValuesReturned: emailBody.secretValuesReturned === false,
    reason: emailEvidence.reason ?? null
  });

  addCheck("no-browser-direct-provider-call", true, "This runner does not call AI or Email providers from browser code and does not expose provider secrets.", {
    noDirectProviderCallsFromWeb: true,
    localShellExecutedFromWeb: false,
    directDatabaseAccessFromWeb: false
  });

  addCheck("redaction-lock", true, "Report contains credential presence booleans only; no secret values are printed or returned.", {
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false
  });

  const failedChecks = checks.filter((check) => !check.passed);
  const providerProofAccepted = failedChecks.length === 0;

  const report = {
    schema: "kingsmen.jarvis-ai-email-provider-live-evidence-capture.v1",
    module: "Jarvis AI + Email Provider Live Evidence Capture",
    generatedAtIso,
    backendBaseUrl,
    jarvisSourceDesignClosedOut: true,
    jarvisRuntimeLive: false,
    providerProofAccepted,
    aiLiveCallAccepted: providerProofAccepted,
    emailPrimaryChannelAccepted: providerProofAccepted,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: !providerProofAccepted,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecutedFromWeb: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    checks,
    failedChecks,
    nextAction: providerProofAccepted
      ? "Attach this report to the Jarvis evidence ledger and continue PayFast/provider/security proof batches."
      : "Supply real credentials and accepted redacted evidence files, then rerun this capture."
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  process.exit(providerProofAccepted ? 0 : 1);
}

main().catch((error) => {
  const report = {
    schema: "kingsmen.jarvis-ai-email-provider-live-evidence-capture.v1",
    module: "Jarvis AI + Email Provider Live Evidence Capture",
    generatedAtIso,
    backendBaseUrl,
    providerProofAccepted: false,
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
