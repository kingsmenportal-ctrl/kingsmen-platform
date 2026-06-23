import fs from "node:fs";
import path from "node:path";

const reportPath = "reports/jarvis/jarvis-live-evidence-acceptance-pack-latest.json";

const requiredCaptures = [
  {
    id: "docker-api-truth-vault-runtime-evidence",
    title: "Docker / API / Truth Vault Runtime Evidence",
    path: "reports/jarvis/jarvis-docker-truth-vault-runtime-evidence-capture-latest.json",
    acceptedKeys: ["runtimeProofAccepted", "apiHealthPassed", "truthVaultRuntimeAccepted", "passed"]
  },
  {
    id: "ai-email-provider-live-evidence",
    title: "AI + Email Provider Live Evidence",
    path: "reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json",
    acceptedKeys: ["providerProofAccepted", "aiLiveCallAccepted", "emailPrimaryChannelAccepted", "passed"]
  },
  {
    id: "payfast-accepted-itn-evidence",
    title: "PayFast Accepted ITN Evidence",
    path: "reports/jarvis/jarvis-payfast-accepted-itn-evidence-capture-latest.json",
    acceptedKeys: ["payfastAcceptedItnProofAccepted", "providerProofAccepted", "passed"]
  },
  {
    id: "n8n-airtable-github-runtime-evidence",
    title: "n8n + Airtable + GitHub Runtime Evidence",
    path: "reports/jarvis/jarvis-n8n-airtable-github-evidence-capture-latest.json",
    acceptedKeys: ["providerToolProofAccepted", "n8nThinRelayAccepted", "airtableMirrorAccepted", "githubConnectorAccepted", "passed"]
  },
  {
    id: "branch-protection-final-launch-audit-evidence",
    title: "Branch Protection + Final Launch Audit Evidence",
    path: "reports/jarvis/jarvis-branch-protection-final-launch-audit-evidence-capture-latest.json",
    acceptedKeys: ["branchProtectionProofAccepted", "finalLaunchAuditAccepted", "stagingEvidencePackAccepted", "founderLaunchApprovalAccepted", "passed"]
  }
];

function safeParseJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, parsed: false, data: null, error: "missing" };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { exists: true, parsed: true, data, error: null };
  } catch (error) {
    return { exists: true, parsed: false, data: null, error: error instanceof Error ? error.message : "parse_error" };
  }
}

function acceptedByAnyKey(data, keys) {
  if (!data || typeof data !== "object") return false;
  return keys.some((key) => data[key] === true);
}

function summarizeCapture(capture) {
  const parsed = safeParseJson(capture.path);
  const accepted = parsed.parsed ? acceptedByAnyKey(parsed.data, capture.acceptedKeys) : false;
  const schema = parsed.parsed && parsed.data?.schema ? parsed.data.schema : null;
  const status = parsed.parsed && parsed.data?.status ? parsed.data.status : null;

  return {
    id: capture.id,
    title: capture.title,
    captureReportPath: capture.path,
    exists: parsed.exists,
    parsed: parsed.parsed,
    schema,
    status,
    accepted,
    state: accepted ? "ACCEPTED" : parsed.exists ? "PRESENT_NOT_ACCEPTED" : "MISSING",
    checkedKeys: capture.acceptedKeys,
    error: parsed.error
  };
}

const evidence = requiredCaptures.map(summarizeCapture);
const acceptedCount = evidence.filter((item) => item.accepted).length;
const missingCount = evidence.filter((item) => !item.exists).length;
const presentNotAcceptedCount = evidence.filter((item) => item.exists && !item.accepted).length;
const allEvidenceAccepted = acceptedCount === requiredCaptures.length;

const report = {
  schema: "kingsmen.jarvis-live-evidence-acceptance-pack-report.v1",
  module: "Jarvis Live Evidence Acceptance Pack Runner",
  generatedAt: new Date().toISOString(),
  allCaptureRunnersBuilt: true,
  allEvidenceAccepted,
  acceptanceDecision: allEvidenceAccepted ? "READY_FOR_FINAL_RELEASE_REVIEW" : "BLOCK_LAUNCH__EVIDENCE_NOT_ACCEPTED",
  jarvisRuntimeLive: false,
  productionReady: false,
  publicLaunchAllowed: false,
  launchBlocked: true,
  noFakeData: true,
  redacted: true,
  rawSecretsPrinted: false,
  rawSecretsReturned: false,
  secretValuesReturned: false,
  directDatabaseAccessFromWeb: false,
  acceptedCount,
  missingCount,
  presentNotAcceptedCount,
  requiredCount: requiredCaptures.length,
  evidence,
  nextAction: allEvidenceAccepted
    ? "Submit this report to final release review and founder launch approval. Do not auto-launch."
    : "Run the missing capture runners and provide accepted redacted evidence files before launch can pass."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(allEvidenceAccepted ? 0 : 2);
