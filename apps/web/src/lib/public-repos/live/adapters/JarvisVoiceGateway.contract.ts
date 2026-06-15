export type JarvisVoiceInputMode = 'push_to_talk' | 'wake_event' | 'transcript_only';
export type JarvisVoiceEngine = 'browser_speech_api' | 'openwakeword_contract' | 'whisper_cpp_contract' | 'piper_contract';
export type JarvisVoiceDecision = 'accepted_for_kernel' | 'needs_confirmation' | 'blocked';

export interface JarvisVoiceGatewayRequest {
  sessionId?: string;
  deviceSessionId?: string;
  inputMode: JarvisVoiceInputMode;
  transcript?: string;
  wakePhraseDetected?: boolean;
  languageHint?: string;
  engine?: JarvisVoiceEngine;
  actor?: 'commander' | 'founder_operator';
  approvalToken?: string;
}

export interface JarvisVoiceGatewayEvidence {
  adapterId: 'JarvisVoiceGateway';
  publicRepos: ['dscripka/openWakeWord', 'ggml-org/whisper.cpp', 'OHF-Voice/piper1-gpl'];
  sessionId: string;
  deviceSessionId?: string;
  inputMode: JarvisVoiceInputMode;
  engine: JarvisVoiceEngine;
  createdAt: string;
  rawAudioStored: false;
  alwaysOnMicrophone: false;
  bypassedPolicyGate: false;
  requiresKernelPolicy: true;
}

export interface JarvisVoiceGatewayResult {
  ok: boolean;
  decision: JarvisVoiceDecision;
  transcript: string;
  warnings: string[];
  requiresConfirmation: boolean;
  evidence: JarvisVoiceGatewayEvidence;
}

export const JarvisVoiceGatewayContract = {
  adapterId: 'JarvisVoiceGateway',
  publicRepos: ['dscripka/openWakeWord', 'ggml-org/whisper.cpp', 'OHF-Voice/piper1-gpl'],
  status: 'contract_ready',
  defaultInputMode: 'push_to_talk',
  rawAudioStorageAllowed: false,
  alwaysOnMicrophoneDefault: false,
  voiceMayBypassPolicy: false,
  allowedInputs: ['transcript', 'wake_event', 'device_session_id', 'language_hint'],
  blockedInputs: ['raw_audio_archive', 'candidate_recording_storage', 'secret_capture', 'voice_command_direct_execution'],
  outputMustInclude: ['transcript', 'decision', 'evidence', 'kernel_result_when_accepted']
} as const;

export function assertJarvisVoiceRequestSafe(request: JarvisVoiceGatewayRequest): string[] {
  const warnings: string[] = [];

  if (!request.inputMode) warnings.push('inputMode is required.');
  if (request.inputMode === 'wake_event' && !request.wakePhraseDetected) warnings.push('wake_event requires wakePhraseDetected=true.');
  if (!request.transcript?.trim()) warnings.push('transcript is required before Jarvis kernel routing.');
  if (request.transcript && request.transcript.length > 2000) warnings.push('transcript is too long for a single safe voice command.');

  const lower = request.transcript?.toLowerCase() ?? '';
  if (lower.includes('ignore policy') || lower.includes('bypass approval') || lower.includes('submit silently')) {
    warnings.push('transcript contains blocked bypass language.');
  }

  return warnings;
}
