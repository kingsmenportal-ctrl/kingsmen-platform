import { NextResponse } from 'next/server';
import { buildJarvisLocalInstallationReadiness } from '@/lib/jarvis/public-integrations/JarvisLocalInstallationReadiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = await buildJarvisLocalInstallationReadiness();
  return NextResponse.json(readiness);
}
