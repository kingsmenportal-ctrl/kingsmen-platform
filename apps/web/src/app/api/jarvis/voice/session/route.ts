import { NextRequest, NextResponse } from 'next/server';
import { prepareJarvisVoiceCommand, routeJarvisVoiceToKernel } from '@/lib/jarvis/voice/JarvisVoiceGateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
    deviceSessionId?: string;
    inputMode?: 'push_to_talk' | 'wake_event' | 'transcript_only';
    transcript?: string;
    wakePhraseDetected?: boolean;
    languageHint?: string;
    engine?: 'browser_speech_api' | 'openwakeword_contract' | 'whisper_cpp_contract' | 'piper_contract';
    actor?: 'commander' | 'founder_operator';
    approvalToken?: string;
    routeToKernel?: boolean;
  };

  const inputMode = body.inputMode ?? 'transcript_only';
  const requestPayload = {
    sessionId: body.sessionId,
    deviceSessionId: body.deviceSessionId,
    inputMode,
    transcript: body.transcript,
    wakePhraseDetected: body.wakePhraseDetected,
    languageHint: body.languageHint,
    engine: body.engine ?? 'browser_speech_api',
    actor: body.actor ?? 'commander',
    approvalToken: body.approvalToken,
  } as const;

  const result = body.routeToKernel ? routeJarvisVoiceToKernel(requestPayload) : prepareJarvisVoiceCommand(requestPayload);

  return NextResponse.json(
    {
      ok: result.ok,
      mode: body.routeToKernel ? 'voice_to_jarvis_kernel' : 'voice_command_prepare',
      result,
      doctrine: {
        voiceBoundary: 'Transcript/session data only. Raw audio storage is not accepted here.',
        policyBoundary: 'Voice commands do not bypass Jarvis intent router, policy gate, approval boundary, or evidence ledger.',
        microphoneBoundary: 'No always-on microphone is enabled by this API.',
      },
    },
    { status: result.ok ? 200 : 422 },
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: 'Jarvis Voice Session API',
    adapterId: 'JarvisVoiceGateway',
    method: 'POST',
    inputModes: ['push_to_talk', 'wake_event', 'transcript_only'],
    engines: ['browser_speech_api', 'openwakeword_contract', 'whisper_cpp_contract', 'piper_contract'],
    safety: 'No raw audio storage. No always-on microphone. No voice command bypasses policy.',
  });
}
