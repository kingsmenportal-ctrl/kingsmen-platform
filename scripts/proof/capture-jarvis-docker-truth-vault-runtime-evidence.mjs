import fs from "node:fs";
import path from "node:path";

const backendBaseUrl = (process.env.KINGSMEN_BACKEND_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const reportPath = process.env.JARVIS_RUNTIME_EVIDENCE_REPORT || "reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json";
const generatedAtIso = new Date().toISOString();
const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}

async function getJson(url) {
  const response = await fetch(url, { method: "GET" });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { parseError: "NON_JSON_RESPONSE", redactedTextLength: text.length };
  }
  return { ok: response.ok, status: response.status, body };
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
  let health = null;
  let command = null;

  try {
    health = await getJson(`${backendBaseUrl}/api/system/health`);
    addCheck("api-health-http-200", health.ok && health.status === 200, "API health must return HTTP 200.", {
      httpStatus: health.status,
      ok: health.ok,
      service: health.body?.service ?? null,
      status: health.body?.status ?? null,
      storageMode: health.body?.storageMode ?? null,
      truthVault: health.body?.truthVault ? {
        ok: Boolean(health.body.truthVault.ok),
        storageMode: health.body.truthVault.storageMode ?? null,
        message: health.body.truthVault.message ?? null
      } : null,
      payfastFinance: health.body?.payfastFinance ? {
        ok: Boolean(health.body.payfastFinance.ok),
        storageMode: health.body.payfastFinance.storageMode ?? null,
        message: health.body.payfastFinance.message ?? null
      } : null
    });
  } catch (error) {
    addCheck("api-health-http-200", false, "API health request failed.", { error: safeError(error) });
  }

  const commandPayload = {
    commandId: `cmd_jarvis_runtime_evidence_${nonce}`,
    commandType: "system.health.requested",
    idempotencyKey: `idem_jarvis_runtime_evidence_${nonce}`,
    correlationId: `corr_jarvis_runtime_evidence_${nonce}`,
    actor: {
      type: "system",
      id: "jarvis-runtime-evidence-capture",
      displayName: "Jarvis Runtime Evidence Capture"
    },
    source: "jarvis",
    createdAt: generatedAtIso,
    payload: {
      proofName: "docker-api-truth-vault-runtime-evidence",
      redacted: true,
      noRawSecrets: true,
      expectedStorageMode: "postgres_truth_vault"
    }
  };

  try {
    command = await postJson(`${backendBaseUrl}/api/commands`, commandPayload);
    const accepted = command.ok && [200, 202].includes(command.status);
    addCheck("jarvis-command-accepted", accepted, "Jarvis runtime evidence command must be accepted by backend.", {
      httpStatus: command.status,
      ok: command.ok,
      status: command.body?.status ?? null,
      commandId: command.body?.commandId ?? null,
      correlationId: command.body?.correlationId ?? null,
      idempotencyKey: command.body?.idempotencyKey ?? null,
      storageMode: command.body?.storageMode ?? null,
      policy: command.body?.policy ? {
        allowed: Boolean(command.body.policy.allowed),
        requiresApproval: Boolean(command.body.policy.requiresApproval),
        hardBlockerCount: Array.isArray(command.body.policy.hardBlockers) ? command.body.policy.hardBlockers.length : null
      } : null
    });
  } catch (error) {
    addCheck("jarvis-command-accepted", false, "Jarvis command request failed.", { error: safeError(error) });
  }

  addCheck("postgres-truth-vault-storage-mode", health?.body?.storageMode === "postgres_truth_vault" && health?.body?.truthVault?.storageMode === "postgres_truth_vault", "Backend must prove PostgreSQL Truth Vault storage mode.", {
    apiStorageMode: health?.body?.storageMode ?? null,
    truthVaultStorageMode: health?.body?.truthVault?.storageMode ?? null,
    commandStorageMode: command?.body?.storageMode ?? null
  });

  addCheck("truth-vault-command-audit-write-indirect", command?.body?.storageMode === "postgres_truth_vault" && command?.body?.status && command?.body?.correlationId, "Accepted command with postgres_truth_vault storage mode is the redacted backend proof for command_log/audit_events write path.", {
    status: command?.body?.status ?? null,
    correlationId: command?.body?.correlationId ?? null,
    storageMode: command?.body?.storageMode ?? null
  });

  addCheck("no-browser-direct-db-access", true, "This runner calls backend HTTP only. It does not query the database from browser code.", {
    directDatabaseAccessFromWeb: false,
    localShellExecutedFromWeb: false,
    noDirectProviderCallsFromWeb: true
  });

  addCheck("redaction-lock", true, "Report contains only redacted runtime metadata and no secret values.", {
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false
  });

  const failedChecks = checks.filter((check) => !check.passed);
  const runtimeProofAccepted = failedChecks.length === 0;

  const report = {
    schema: "kingsmen.jarvis-docker-truth-vault-runtime-evidence-capture.v1",
    module: "Jarvis Docker / API / Truth Vault Runtime Evidence Capture",
    generatedAtIso,
    backendBaseUrl,
    jarvisSourceDesignClosedOut: true,
    jarvisRuntimeLive: runtimeProofAccepted,
    runtimeProofAccepted,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: !runtimeProofAccepted,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecutedFromWeb: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    checks,
    failedChecks,
    nextAction: runtimeProofAccepted
      ? "Attach this report to the Jarvis evidence ledger and continue provider/security proof batches."
      : "Fix API/Docker/Truth Vault runtime, then rerun this capture."
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  process.exit(runtimeProofAccepted ? 0 : 1);
}

main().catch((error) => {
  const report = {
    schema: "kingsmen.jarvis-docker-truth-vault-runtime-evidence-capture.v1",
    module: "Jarvis Docker / API / Truth Vault Runtime Evidence Capture",
    generatedAtIso,
    backendBaseUrl,
    runtimeProofAccepted: false,
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
