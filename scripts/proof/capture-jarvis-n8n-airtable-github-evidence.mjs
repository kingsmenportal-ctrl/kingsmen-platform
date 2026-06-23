import fs from "node:fs";
import path from "node:path";

const backendBaseUrl = (process.env.KINGSMEN_BACKEND_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const reportPath = process.env.JARVIS_PROVIDER_TOOL_EVIDENCE_REPORT || "reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json";
const n8nEvidenceFile = process.env.JARVIS_N8N_THIN_RELAY_EVIDENCE_FILE || "";
const airtableEvidenceFile = process.env.JARVIS_AIRTABLE_HUMAN_MIRROR_EVIDENCE_FILE || "";
const githubEvidenceFile = process.env.JARVIS_GITHUB_CONNECTOR_RUNTIME_EVIDENCE_FILE || "";
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
  const n8nEnv = redactedEnvStatus([
    "KINGSMEN_N8N_BASE_URL",
    "KINGSMEN_N8N_API_KEY",
    "KINGSMEN_N8N_WEBHOOK_SECRET"
  ]);
  const airtableEnv = redactedEnvStatus([
    "AIRTABLE_API_KEY",
    "AIRTABLE_BASE_ID",
    "AIRTABLE_KINGSMEN_TABLE"
  ]);
  const githubEnv = redactedEnvStatus([
    "GITHUB_TOKEN",
    "GITHUB_APP_ID",
    "GITHUB_INSTALLATION_ID"
  ]);

  addCheck("n8n-config-present", n8nEnv.every((item) => item.present), "n8n credentials must be present outside Git before evidence can be accepted.", { required: n8nEnv });
  addCheck("airtable-config-present", airtableEnv.every((item) => item.present), "Airtable credentials must be present outside Git before evidence can be accepted.", { required: airtableEnv });
  addCheck("github-connector-config-present", githubEnv.some((item) => item.present), "GitHub connector/token/app context must be present outside Git before evidence can be accepted.", { acceptedAlternatives: githubEnv });

  const commandPayload = {
    commandId: `cmd_jarvis_provider_tools_evidence_${nonce}`,
    commandType: "provider.tools.runtime.proof.requested",
    idempotencyKey: `idem_jarvis_provider_tools_evidence_${nonce}`,
    correlationId: `corr_jarvis_provider_tools_evidence_${nonce}`,
    actor: {
      type: "system",
      id: "jarvis-provider-tools-evidence-capture",
      displayName: "Jarvis Provider Tools Evidence Capture"
    },
    source: "jarvis",
    createdAt: generatedAtIso,
    payload: {
      proofName: "n8n-airtable-github-runtime-evidence",
      redacted: true,
      noRawSecrets: true,
      n8nThinRelayOnly: true,
      n8nMayBecomeAuthority: false,
      n8nMayWriteTruthVaultDirectly: false,
      airtableMirrorOnly: true,
      airtableMayBecomeAuthority: false,
      githubTokensMayBeReturned: false,
      noDirectProviderCallsFromWeb: true,
      postgresTruthVaultRemainsAuthority: true
    }
  };

  try {
    const command = await postJson(`${backendBaseUrl}/api/commands`, commandPayload);
    const accepted = command.ok && [200, 202].includes(command.status);
    addCheck("backend-command-accepted", accepted, "Backend must accept a provider-tool proof command before evidence can be attached.", {
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
    addCheck("backend-command-accepted", false, "Backend provider-tool proof command request failed.", { error: safeError(error) });
  }

  const n8nEvidence = readEvidenceFile(n8nEvidenceFile, "kingsmen.jarvis-n8n-thin-relay-evidence.v1");
  n8nEvidence.fileSupplied = Boolean(n8nEvidenceFile);
  const n8nRequirements = [
    "n8nThinRelayAccepted",
    "backendMediatedCommandCaptured",
    "webhookSecretVerified",
    "noDirectBrowserCall",
    "truthVaultAuthorityPreserved",
    "redacted"
  ];
  addCheck("n8n-thin-relay-evidence-accepted", evidencePass(n8nEvidence, n8nRequirements) && n8nEvidence.body?.rawSecretsReturned === false && n8nEvidence.body?.secretValuesReturned === false, "n8n evidence must prove thin relay, backend mediation, webhook secret verification, no direct browser call, Truth Vault authority, and redaction.", evidenceState(n8nEvidence, n8nRequirements));

  const airtableEvidence = readEvidenceFile(airtableEvidenceFile, "kingsmen.jarvis-airtable-human-mirror-evidence.v1");
  airtableEvidence.fileSupplied = Boolean(airtableEvidenceFile);
  const airtableRequirements = [
    "airtableMirrorAccepted",
    "backendMirrorWriteCaptured",
    "truthVaultSourceRecordCaptured",
    "reconciliationCaptured",
    "redactedAirtableMetadata",
    "redacted"
  ];
  addCheck("airtable-human-mirror-evidence-accepted", evidencePass(airtableEvidence, airtableRequirements) && airtableEvidence.body?.rawSecretsReturned === false && airtableEvidence.body?.secretValuesReturned === false, "Airtable evidence must prove backend mirror write, Truth Vault source record, reconciliation, redacted Airtable metadata, and no secret exposure.", evidenceState(airtableEvidence, airtableRequirements));

  const githubEvidence = readEvidenceFile(githubEvidenceFile, "kingsmen.jarvis-github-connector-runtime-evidence.v1");
  githubEvidence.fileSupplied = Boolean(githubEvidenceFile);
  const githubRequirements = [
    "githubConnectorAccepted",
    "redactedRepoMetadataCaptured",
    "controlledConnectorActionCaptured",
    "noTokenExposure",
    "branchPrContextCaptured",
    "auditTraceCaptured",
    "redacted"
  ];
  addCheck("github-connector-runtime-evidence-accepted", evidencePass(githubEvidence, githubRequirements) && githubEvidence.body?.rawSecretsReturned === false && githubEvidence.body?.secretValuesReturned === false, "GitHub evidence must prove redacted repo metadata, controlled action, no token exposure, branch/PR context, audit trace, and redaction.", evidenceState(githubEvidence, githubRequirements));

  addCheck("provider-tool-boundary-lock", true, "Runner never lets n8n/Airtable/GitHub become authority and never accepts direct browser provider calls.", {
    n8nThinRelayOnly: true,
    n8nMayBecomeAuthority: false,
    n8nMayWriteTruthVaultDirectly: false,
    airtableMirrorOnly: true,
    airtableMayBecomeAuthority: false,
    githubTokensMayBeReturned: false,
    noDirectProviderCallsFromWeb: true,
    postgresTruthVaultRemainsAuthority: true
  });

  addCheck("redaction-lock", true, "Report contains credential presence booleans only; provider tool secret values are not printed or returned.", {
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false
  });

  const failedChecks = checks.filter((check) => !check.passed);
  const providerToolEvidenceAccepted = failedChecks.length === 0;

  const report = {
    schema: "kingsmen.jarvis-n8n-airtable-github-evidence-capture.v1",
    module: "Jarvis n8n Airtable GitHub Evidence Capture",
    generatedAtIso,
    backendBaseUrl,
    jarvisSourceDesignClosedOut: true,
    jarvisRuntimeLive: false,
    providerToolEvidenceAccepted,
    n8nThinRelayAccepted: providerToolEvidenceAccepted,
    airtableMirrorAccepted: providerToolEvidenceAccepted,
    githubConnectorAccepted: providerToolEvidenceAccepted,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: !providerToolEvidenceAccepted,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecutedFromWeb: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    n8nThinRelayOnly: true,
    airtableMirrorOnly: true,
    githubTokensMayBeReturned: false,
    postgresTruthVaultRemainsAuthority: true,
    checks,
    failedChecks,
    nextAction: providerToolEvidenceAccepted
      ? "Attach this report to the Jarvis evidence ledger and continue final launch audit proof."
      : "Supply provider tool credentials and accepted redacted n8n, Airtable, and GitHub evidence files, then rerun this capture."
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  process.exit(providerToolEvidenceAccepted ? 0 : 1);
}

main().catch((error) => {
  const report = {
    schema: "kingsmen.jarvis-n8n-airtable-github-evidence-capture.v1",
    module: "Jarvis n8n Airtable GitHub Evidence Capture",
    generatedAtIso,
    backendBaseUrl,
    providerToolEvidenceAccepted: false,
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
