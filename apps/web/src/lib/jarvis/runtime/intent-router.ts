import type { JarvisIntentResult, JarvisRuntimeRequest } from './types';

const includesAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

export function routeJarvisIntent(request: JarvisRuntimeRequest): JarvisIntentResult {
  const text = request.input.trim().toLowerCase();

  if (!text) {
    return {
      intentId: 'general_dialogue',
      confidence: 'low',
      freshnessRequired: false,
      policyGateRequired: false,
      reason: 'Empty Commander input; safe clarification required.',
    };
  }

  if (includesAny(text, ['bypass approval', 'ignore evidence', 'submit silently', 'make payment decision', 'act as public chatbot'])) {
    return {
      intentId: 'blocked_unsafe_action',
      confidence: 'blocked',
      freshnessRequired: false,
      policyGateRequired: true,
      reason: 'Input matched blocked unsafe action terms.',
    };
  }

  if (includesAny(text, ['voice gateway', 'voice session', 'wake word', 'wakeword', 'openwakeword', 'whisper.cpp', 'speech to text', 'stt', 'text to speech', 'tts', 'piper'])) {
    return {
      intentId: 'jarvis_voice_gateway',
      confidence: 'high',
      freshnessRequired: false,
      policyGateRequired: true,
      reason: 'Input asks for Jarvis voice session, wake-word, STT, or TTS gateway work.',
    };
  }

  if (includesAny(text, ['public repo', 'public repos', 'github stack', 'open source stack', 'docling', 'langfuse', 'gitleaks', 'trivy'])) {
    return {
      intentId: 'public_repo_integration',
      confidence: 'high',
      freshnessRequired: true,
      policyGateRequired: false,
      reason: 'Input asks about live public repository integrations or adapter readiness.',
    };
  }

  if (includesAny(text, ['latest', 'current', 'today', 'now', 'deadline', 'closing date', 'fee', 'price', 'job', 'learnership', 'weather', 'news'])) {
    return {
      intentId: 'live_research',
      confidence: 'high',
      freshnessRequired: true,
      policyGateRequired: false,
      reason: 'Input requires current/live information.',
    };
  }

  if (includesAny(text, ['github', 'repo', 'commit', 'issue', 'branch', 'pull request'])) {
    return {
      intentId: 'repo_inspection',
      confidence: 'high',
      freshnessRequired: true,
      policyGateRequired: false,
      reason: 'Input asks about repository state or evidence.',
    };
  }

  if (includesAny(text, ['validate', 'validator', 'run build', 'test', 'prove', 'boot test'])) {
    return {
      intentId: 'validation_build',
      confidence: 'high',
      freshnessRequired: false,
      policyGateRequired: true,
      reason: 'Input asks for validation or build action.',
    };
  }

  if (includesAny(text, ['playwright', 'portal', 'screenshot', 'captcha', 'otp', 'blocker'])) {
    return {
      intentId: 'playwright_scout',
      confidence: 'high',
      freshnessRequired: true,
      policyGateRequired: true,
      reason: 'Input asks for portal scouting or browser evidence.',
    };
  }

  if (includesAny(text, ['database', 'postgres', 'postgresql', 'supabase', 'read model', 'queue count'])) {
    return {
      intentId: 'database_read_model',
      confidence: 'high',
      freshnessRequired: true,
      policyGateRequired: true,
      reason: 'Input asks for approved database/read-model summary.',
    };
  }

  if (includesAny(text, ['visual', 'dashboard', 'hud', 'cards', 'panel', 'mobile view', 'black and white'])) {
    return {
      intentId: 'visual_hud_request',
      confidence: 'high',
      freshnessRequired: false,
      policyGateRequired: false,
      reason: 'Input asks for Jarvis visual HUD/product surface.',
    };
  }

  if (includesAny(text, ['report', 'digest', 'summary', 'briefing', 'roadmap', 'evidence pack', 'plan'])) {
    return {
      intentId: 'report_generation',
      confidence: 'high',
      freshnessRequired: false,
      policyGateRequired: false,
      reason: 'Input asks for a generated report or plan.',
    };
  }

  if (includesAny(text, ['kingsmen', 'jarvis', 'workflow', 'pricing', 'route universe', 'control plane', 'n-series'])) {
    return {
      intentId: 'kingsmen_knowledge',
      confidence: 'high',
      freshnessRequired: false,
      policyGateRequired: false,
      reason: 'Input asks about Kingsmen/Jarvis knowledge.',
    };
  }

  return {
    intentId: 'general_dialogue',
    confidence: 'medium',
    freshnessRequired: false,
    policyGateRequired: false,
    reason: 'No operational intent detected; safe dialogue route selected.',
  };
}
