import { NextResponse } from 'next/server';
import { buildJarvisPublicIntegrationHud } from '@/lib/jarvis/public-integrations/JarvisPublicIntegrationHud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(buildJarvisPublicIntegrationHud());
}
