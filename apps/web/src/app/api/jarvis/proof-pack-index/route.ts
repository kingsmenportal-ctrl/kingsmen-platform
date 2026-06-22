import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validators = [
  "scripts/validators/validate-jarvis-completion-board.mjs",
  "scripts/validators/validate-jarvis-dashboard-completion-board.mjs",
  "scripts/validators/validate-jarvis-provider-credential-checklist.mjs",
  "scripts/validators/validate-jarvis-final-command-room.mjs",
  "scripts/validators/validate-jarvis-final-launch-control.mjs",
  "scripts/validators/validate-jarvis-source-completion-seal.mjs",
  "scripts/validators/validate-jarvis-openclaw-operator-policy-boundary.mjs",
  "scripts/validators/validate-jarvis-playwright-scout-map-fallback-boundary.mjs",
  "scripts/validators/validate-jarvis-live-index-openclaw-runtime.mjs"
];

const reports = [
  "reports/jarvis/jarvis-openclaw-operator-policy-boundary-proof-latest.json",
  "reports/jarvis/jarvis-playwright-scout-map-fallback-boundary-proof-latest.json"
];

const manifests = [
  "manifests/jarvis/jarvis-completion-board-v1.json",
  "manifests/jarvis/jarvis-dashboard-completion-board-v1.json",
  "manifests/jarvis/jarvis-source-completion-seal-v1.json",
  "manifests/jarvis/jarvis-openclaw-operator-policy-boundary-v1.json",
  "manifests/jarvis/jarvis-playwright-scout-map-fallback-boundary-v1.json"
];

const routes = [
  "/jarvis",
  "/jarvis/final",
  "/founder/providers/jarvis-credentials",
  "/founder/proof-centre/jarvis",
  "/founder/launch-control/jarvis",
  "/founder/launch-control/jarvis-source-seal",
  "/api/jarvis/final-command-hud",
  "/api/jarvis/final-launch-control",
  "/api/jarvis/source-completion-seal",
  "/api/jarvis/completion-board",
  "/api/jarvis/provider-credential-checklist",
  "/api/jarvis/evidence-collector",
  "/api/jarvis/source-launch-gate",
  "/api/jarvis/proof-pack-index",
  "/api/jarvis/live-index"
];

const blockers = [
  {
    id: "local-docker-runtime",
    title: "Local Docker/API runtime instability",
    state: "BLOCKED",
    detail: "Blocks runtime proof only. Source-safe Jarvis construction continues."
  },
  {
    id: "provider-credentials",
    title: "Provider credentials outside Git",
    state: "PENDING",
    detail: "Required for AI, Email, PayFast, n8n, Airtable, GitHub runtime proof, and storage."
  },
  {
    id: "launch-security-proof",
    title: "Branch protection and final launch audit",
    state: "PENDING",
    detail: "Required before public launch."
  }
];

export async function GET() {
  return NextResponse.json({
    schema: "kingsmen.jarvis-proof-pack-index.v1",
    module: "Jarvis Proof Pack Index",
    generatedAt: new Date().toISOString(),
    productionReady: false,
    publicLaunchAllowed: false,
    jarvisSourcePackReady: true,
    jarvisFinalCommandRoomIndexed: true,
    jarvisFinalLaunchControlIndexed: true,
    jarvisSourceCompletionSealIndexed: true,
    dockerIndependentBuildAllowed: true,
    noFakeData: true,
    rawSecretsReturned: false,
    secretValuesReturned: false,
    localShellExecuted: false,
    directDatabaseAccessFromWeb: false,
    validators,
    reports,
    manifests,
    routes,
    blockers,
    nextAction: "Jarvis source/design is sealed. Clear runtime/provider/security blockers before public launch."
  });
}
