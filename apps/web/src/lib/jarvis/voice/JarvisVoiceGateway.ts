import { runJarvisApiKernelBridge } from '@/lib/jarvis/api/api-runtime-bridge';
import type { JarvisApiKernelBridgeOutput } from '@/lib/jarvis/api/api-runtime-bridge';
import type { JarvisVoiceEngine, JarvisVoiceGatewayRequest, JarvisVoiceGatewayResult, JarvisVoiceInputMode } from '@/lib/public-repos/live/adapters/JarvisVoiceGateway.contract';
import { assertJarvisVoiceRequestSafe } from '@/lib/public-repos/live/adapters/JarvisVoiceGateway.contract';

export interface JarvisVoiceKernelResult extends JarvisVoiceGatewayResult {
  kernel?: JarvisApiKernelBridgeOutput;
}

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

function createSessionId(inputMode: JarvisVoiceInputMode) {
  return `jarvis_voice_${inputMode}_${Date.now()}`;
}

function normalizeEngine(engine?: JarvisVoiceEngine): JarvisVoiceEngine {
  return engine ?? 'browser_speech_api';
}

function requiresConfirmation(transcript: string) {
  const lower = transcript.toLowerCase();
  return [
    'send',
    'submit',
    'delete',
    'pay',
    'payment',
    'approve',
    'reject',
    'update profile',
    'change candidate',
    'application'
  ].some((term) => lower.includes(term));
}

export function prepareJarvisVoiceCommand(request: JarvisVoiceGatewayRequest): JarvisVoiceGatewayResult {
  const sessionId = request.sessionId || createSessionId(request.inputMode);
  const engine = normalizeEngine(request.engine);
  const transcript = clean(request.transcript ?? '');
  const warnings = assertJarvisVoiceRequestSafe({ ...request, transcript });
  const confirmation = requiresConfirmation(transcript);
  const blocked = warnings.some((warning) => warning.toLowerCase().includes('blocked')) || !transcript;

  return {
    ok: !blocked,
    decision: blocked ? 'blocked' : confirmation ? 'needs_confirmation' : 'accepted_for_kernel',
    transcript,
    warnings,
    requiresConfirmation: confirmation,
    evidence: {
      adapterId: 'JarvisVoiceGateway',
      publicRepos: ['dscripka/openWakeWord', 'ggml-org/whisper.cpp', 'OHF-Voice/piper1-gpl'],
      sessionId,
      deviceSessionId: request.deviceSessionId,
      inputMode: request.inputMode,
      engine,
      createdAt: new Date().toISOString(),
      rawAudioStored: false,
      alwaysOnMicrophone: false,
      bypassedPolicyGate: false,
      requiresKernelPolicy: true,
    },
  };
}

export function routeJarvisVoiceToKernel(request: JarvisVoiceGatewayRequest): JarvisVoiceKernelResult {
  const prepared = prepareJarvisVoiceCommand(request);

  if (!prepared.ok) {
    return prepared;
  }

  if (prepared.requiresConfirmation && !request.approvalToken) {
    return {
      ...prepared,
      ok: false,
      decision: 'needs_confirmation',
      warnings: [...prepared.warnings, 'Voice command contains sensitive/action terms and requires confirmation before kernel routing.'],
    };
  }

  const kernel = runJarvisApiKernelBridge({
    message: prepared.transcript,
    actor: request.actor ?? 'commander',
    nowIso: prepared.evidence.createdAt,
  });

  return {
    ...prepared,
    ok: kernel.ok,
    decision: 'accepted_for_kernel',
    kernel,
  };
}
