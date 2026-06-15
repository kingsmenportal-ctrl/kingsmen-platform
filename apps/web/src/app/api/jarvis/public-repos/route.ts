import { NextRequest, NextResponse } from 'next/server';
import {
  getLivePublicRepoIntegrations,
  getPublicRepoIntegration,
  listPublicRepoIntegrations,
  summarizePublicRepoIntegrations,
} from '@/lib/public-repos/live/public-repo-integration-registry';
import { listPublicRepoAdapterContracts } from '@/lib/public-repos/live/public-repo-adapter-contracts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const liveOnly = url.searchParams.get('live') === '1' || url.searchParams.get('live') === 'true';

  if (id) {
    const record = getPublicRepoIntegration(id);
    if (!record) {
      return NextResponse.json({ ok: false, error: 'PUBLIC_REPO_INTEGRATION_NOT_FOUND', id }, { status: 404 });
    }
    return NextResponse.json({ ok: true, mode: 'single_public_repo_integration', record });
  }

  return NextResponse.json({
    ok: true,
    mode: liveOnly ? 'live_public_repo_integrations' : 'all_public_repo_integrations',
    doctrine: {
      integrationRule: 'Study public projects, then use Kingsmen-owned adapter contracts.',
      approvalRule: 'A sensitive adapter requires founder approval before use.',
      authority: 'PostgreSQL Truth Vault and backend command bus remain authority.',
    },
    summary: summarizePublicRepoIntegrations(),
    records: liveOnly ? getLivePublicRepoIntegrations() : listPublicRepoIntegrations(),
    adapterContracts: listPublicRepoAdapterContracts(),
  });
}
