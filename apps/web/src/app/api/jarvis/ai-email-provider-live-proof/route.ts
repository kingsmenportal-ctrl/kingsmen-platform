import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProofState = "PENDING_CREDENTIALS" | "PENDING_PROVIDER_EVIDENCE" | "REJECTED_UNTIL_REAL_EVIDENCE";

type ProviderProofRequirement = {
  id: string;
  title: string;
  state: ProofState;
  launchCritical: boolean;
  providerAuthority: "backend_only" | "email_primary_channel";
  acceptedEvidence: string[];
  missingEvidence: string[];
  rejectionRules: string[];
  reportTarget: string;
};

const captureRunner = "scripts/proof/capture-jarvis-ai-email-provider-live-evidence.mjs";
const captureReportPath = "reports/jarvis/jarvis-ai-email-provider-live-evidence-capture-latest.json";
const captureValidator = "scripts/validators/validate-jarvis-ai-email-provider-live-evidence-capture.mjs";

const proofRequirements: ProviderProofRequirement[] = [
  {
    id: "ai-provider-live-call-proof",
    title: "AI Provider Live Call Proof",
    state: "PENDING_CREDENTIALS",
    launchCritical: true,
    providerAuthority: "backend_only",
    acceptedEvidence: [],
    missingEvidence: [
      "KINGSMEN_AI_PROVIDER selected outside Git",
      "KINGSMEN_AI_MODEL selected outside Git",
      "OPENAI_API_KEY or provider key stored outside Git",
      "backend-controlled live call succeeds",
      "policy gate applies before call",
      "cost/rate boundary recorded",
      "redacted request and response evidence captured",
      "AI evidence file accepted by capture runner"
    ],
    rejectionRules: [
      "reject browser-side provider calls",
      "reject mock completions as live proof",
      "reject raw API key exposure",
      "reject unredacted prompt or response evidence",
      "reject calls without policy and cost boundary"
    ],
    reportTarget: "reports/jarvis/ai-provider-live-call-proof.json"
  },
  {
    id: "email-primary-channel-proof",
    title: "Email Primary Channel Proof",
    state: "PENDING_CREDENTIALS",
    launchCritical: true,
    providerAuthority: "email_primary_channel",
    acceptedEvidence: [],
    missingEvidence: [
      "SMTP or provider credentials stored outside Git",
      "test send evidence captured",
      "delivery or receive evidence captured",
      "bounce or failed-send handling captured",
      "opt-out rule captured",
      "message evidence ledger write captured",
      "redacted output captured",
      "Email evidence file accepted by capture runner"
    ],
    rejectionRules: [
      "reject WhatsApp/SMS as replacement for email primary proof",
      "reject email proof without message evidence ledger",
      "reject raw SMTP password exposure",
      "reject proof without bounce or failed-send boundary",
      "reject proof without opt-out rule"
    ],
    reportTarget: "reports/jarvis/email-primary-channel-proof.json"
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-ai-email-provider-live-proof.v1",
    module: "Jarvis AI + Email Provider Live Proof Gate",
    generatedAt: new Date().toISOString(),
    jarvisSourceReady: true,
    jarvisRuntimeLive: false,
    productionReady: false,
    publicLaunchAllowed: false,
    launchBlocked: true,
    providerProofAccepted: false,
    aiLiveCallAccepted: false,
    emailPrimaryChannelAccepted: false,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    redacted: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    noDirectProviderCallsFromWeb: true,
    backendControlledAiOnly: true,
    emailPrimaryChannel: true,
    whatsappUrgentOnly: true,
    smsBackupOnly: true,
    captureRunner,
    captureReportPath,
    captureValidator,
    requiredEvidenceSchemas: [
      "kingsmen.jarvis-ai-live-call-evidence.v1",
      "kingsmen.jarvis-email-primary-channel-evidence.v1",
      "kingsmen.jarvis-ai-email-provider-live-evidence-capture.v1"
    ],
    proofRequirements,
    nextAction: "Supply real AI and Email credentials outside Git, capture redacted evidence files, run the capture runner, and keep launch blocked until both provider proofs are accepted."
  });
}
