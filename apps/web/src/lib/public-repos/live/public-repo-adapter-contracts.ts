import type { PublicRepoIntegrationRecord } from './public-repo-integration-registry';
import { getPublicRepoIntegration } from './public-repo-integration-registry';

export type PublicRepoAdapterKind =
  | 'document_extraction'
  | 'portal_scout'
  | 'voice_wakeword'
  | 'voice_stt'
  | 'voice_tts'
  | 'trace_gateway'
  | 'security_scan';

export type PublicRepoAdapterRisk = 'safe_read' | 'review_required' | 'approval_required' | 'blocked';

export interface PublicRepoAdapterInput {
  adapterId: string;
  requestedBy: 'commander' | 'founder_operator' | 'system_validator';
  purpose: string;
  payloadShape: Record<string, string>;
  approvalToken?: string;
}

export interface PublicRepoAdapterContract {
  adapterId: string;
  repoId: string;
  kind: PublicRepoAdapterKind;
  risk: PublicRepoAdapterRisk;
  live: boolean;
  executesThirdPartyCode: boolean;
  requiresApproval: boolean;
  allowedInputs: string[];
  blockedInputs: string[];
  outputEvidence: string[];
  implementationTarget: string;
}

export interface PublicRepoAdapterPlan {
  ok: boolean;
  adapterId: string;
  repository?: string;
  status: 'READY_FOR_IMPLEMENTATION' | 'APPROVAL_REQUIRED' | 'BLOCKED' | 'UNKNOWN_ADAPTER';
  reason: string;
  contract?: PublicRepoAdapterContract;
  boundaries?: string[];
  acceptance?: string[];
}

const contracts: PublicRepoAdapterContract[] = [
  {
    adapterId: 'DoclingAdapter',
    repoId: 'docling',
    kind: 'document_extraction',
    risk: 'approval_required',
    live: true,
    executesThirdPartyCode: false,
    requiresApproval: true,
    allowedInputs: ['document_id', 'storage_path', 'mime_type', 'candidate_id_optional'],
    blockedInputs: ['raw_id_number_in_prompt', 'api_keys', 'payment_data', 'unredacted_candidate_bundle'],
    outputEvidence: ['draft_fields', 'field_confidence', 'extraction_warnings', 'review_required_fields'],
    implementationTarget: 'apps/web/src/lib/documents/extraction/DocumentExtractionService.ts'
  },
  {
    adapterId: 'PlaywrightScoutGateway',
    repoId: 'playwright',
    kind: 'portal_scout',
    risk: 'approval_required',
    live: true,
    executesThirdPartyCode: false,
    requiresApproval: true,
    allowedInputs: ['route_id', 'allowlisted_url', 'scout_goal', 'source_confidence_id'],
    blockedInputs: ['password', 'otp_code', 'payment_card', 'captcha_solution', 'unapproved_submit_action'],
    outputEvidence: ['http_state', 'portal_state', 'screenshot_reference', 'manual_fallback_reason'],
    implementationTarget: 'apps/web/src/lib/routes/scout/RouteScoutService.ts'
  },
  {
    adapterId: 'JarvisWakeWordService',
    repoId: 'openwakeword',
    kind: 'voice_wakeword',
    risk: 'review_required',
    live: true,
    executesThirdPartyCode: false,
    requiresApproval: true,
    allowedInputs: ['local_audio_event', 'device_session_id', 'wake_phrase'],
    blockedInputs: ['always_on_remote_recording', 'candidate_audio_storage', 'secret_phrase_capture'],
    outputEvidence: ['wake_event_id', 'voice_session_id', 'device_local_state'],
    implementationTarget: 'tools/jarvis-voice/wakeword-service/'
  },
  {
    adapterId: 'JarvisSpeechToTextService',
    repoId: 'whisper-cpp',
    kind: 'voice_stt',
    risk: 'review_required',
    live: true,
    executesThirdPartyCode: false,
    requiresApproval: true,
    allowedInputs: ['voice_session_id', 'local_audio_buffer_reference', 'language_hint'],
    blockedInputs: ['raw_candidate_recording_archive', 'secret_capture', 'payment_voice_data'],
    outputEvidence: ['transcript', 'confidence', 'transcription_warnings'],
    implementationTarget: 'tools/jarvis-voice/stt-service/'
  },
  {
    adapterId: 'JarvisTextToSpeechService',
    repoId: 'piper',
    kind: 'voice_tts',
    risk: 'review_required',
    live: false,
    executesThirdPartyCode: false,
    requiresApproval: true,
    allowedInputs: ['response_text', 'voice_profile_id', 'safe_speech_flag'],
    blockedInputs: ['unredacted_secret_output', 'sensitive_candidate_data_without_setting'],
    outputEvidence: ['spoken_response_id', 'tts_mode', 'fallback_used'],
    implementationTarget: 'tools/jarvis-voice/tts-service/'
  },
  {
    adapterId: 'LangfuseTraceGateway',
    repoId: 'langfuse',
    kind: 'trace_gateway',
    risk: 'review_required',
    live: true,
    executesThirdPartyCode: false,
    requiresApproval: true,
    allowedInputs: ['trace_id', 'model_name', 'redacted_prompt', 'tool_call_summary', 'evidence_id'],
    blockedInputs: ['api_key', 'raw_sensitive_document', 'candidate_secret', 'payment_secret'],
    outputEvidence: ['trace_reference', 'redaction_status', 'model_event_summary'],
    implementationTarget: 'apps/web/src/lib/jarvis/evidence/LangfuseTraceGateway.ts'
  },
  {
    adapterId: 'SecurityScanGate',
    repoId: 'gitleaks',
    kind: 'security_scan',
    risk: 'safe_read',
    live: true,
    executesThirdPartyCode: false,
    requiresApproval: false,
    allowedInputs: ['repo_path', 'changed_files', 'scan_profile'],
    blockedInputs: ['print_secret_values', 'upload_repo_to_unknown_service'],
    outputEvidence: ['scan_status', 'redacted_findings', 'release_gate_decision'],
    implementationTarget: 'scripts/validators/validate-n21-live-public-repos.mjs'
  }
];

export function listPublicRepoAdapterContracts(): PublicRepoAdapterContract[] {
  return contracts;
}

export function getPublicRepoAdapterContract(adapterId: string): PublicRepoAdapterContract | undefined {
  return contracts.find((contract) => contract.adapterId.toLowerCase() === adapterId.toLowerCase());
}

export function planPublicRepoAdapter(input: PublicRepoAdapterInput): PublicRepoAdapterPlan {
  const contract = getPublicRepoAdapterContract(input.adapterId);

  if (!contract) {
    return {
      ok: false,
      adapterId: input.adapterId,
      status: 'UNKNOWN_ADAPTER',
      reason: 'No public repo adapter contract is registered for this adapter id.'
    };
  }

  const integration: PublicRepoIntegrationRecord | undefined = getPublicRepoIntegration(contract.repoId);

  if (!integration) {
    return {
      ok: false,
      adapterId: input.adapterId,
      status: 'UNKNOWN_ADAPTER',
      reason: 'Adapter contract exists but public repo integration record is missing.'
    };
  }

  if (!contract.live || integration.liveStatus === 'blocked') {
    return {
      ok: false,
      adapterId: contract.adapterId,
      repository: integration.repository,
      status: 'BLOCKED',
      reason: 'Adapter is not live for implementation yet.',
      contract,
      boundaries: integration.boundaries,
      acceptance: integration.acceptance
    };
  }

  if (contract.requiresApproval && !input.approvalToken) {
    return {
      ok: false,
      adapterId: contract.adapterId,
      repository: integration.repository,
      status: 'APPROVAL_REQUIRED',
      reason: 'Adapter contract is live, but production implementation or execution requires founder approval.',
      contract,
      boundaries: integration.boundaries,
      acceptance: integration.acceptance
    };
  }

  return {
    ok: true,
    adapterId: contract.adapterId,
    repository: integration.repository,
    status: 'READY_FOR_IMPLEMENTATION',
    reason: 'Adapter contract is live and may be implemented through Kingsmen-owned code within the recorded boundaries.',
    contract,
    boundaries: integration.boundaries,
    acceptance: integration.acceptance
  };
}
