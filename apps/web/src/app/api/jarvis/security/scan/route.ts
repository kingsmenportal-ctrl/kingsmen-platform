import { NextRequest, NextResponse } from 'next/server';
import { runJarvisSecurityScanGate } from '@/lib/jarvis/security/JarvisSecurityScanGate';
import type { SecurityScanScope, SecurityScanToolId } from '@/lib/public-repos/live/adapters/SecurityScanGate.contract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    source?: string;
    actor?: string;
    scope?: SecurityScanScope;
    tools?: SecurityScanToolId[];
    scanText?: string;
    changedFiles?: string[];
    commandId?: string;
    approvalToken?: string;
  };

  if (!body.source || !body.actor || !body.scope) {
    return NextResponse.json(
      {
        ok: false,
        error: 'SOURCE_ACTOR_SCOPE_REQUIRED',
        message: 'Security scan gate requires source, actor, and scope.',
      },
      { status: 400 },
    );
  }

  const result = runJarvisSecurityScanGate({
    source: body.source,
    actor: body.actor,
    scope: body.scope,
    tools: body.tools,
    scanText: body.scanText,
    changedFiles: body.changedFiles,
    commandId: body.commandId,
    approvalToken: body.approvalToken,
  });

  return NextResponse.json({
    ...result,
    doctrine: {
      securityBoundary: 'Detection and reporting only.',
      safeOutputBoundary: 'No raw private values are returned or stored by this gateway.',
      actionBoundary: 'No automatic fix, commit, push, or deployment block is performed.',
      authorityBoundary: 'PostgreSQL evidence ledger remains Kingsmen authority.',
    },
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'Jarvis Security Scan Gate',
    adapterId: 'SecurityScanGate',
    repositories: ['gitleaks/gitleaks', 'aquasecurity/trivy', 'semgrep/semgrep'],
    method: 'POST',
    required: ['source', 'actor', 'scope'],
    optional: ['tools', 'scanText', 'changedFiles', 'commandId', 'approvalToken'],
    safety: 'Detection/report only. No raw private values. No automatic fix, commit, push, or deployment block.',
  });
}
