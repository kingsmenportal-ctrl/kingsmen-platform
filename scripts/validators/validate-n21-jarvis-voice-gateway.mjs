import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'apps/web/src/lib/public-repos/live/adapters/JarvisVoiceGateway.contract.ts',
  'apps/web/src/lib/jarvis/voice/JarvisVoiceGateway.ts',
  'apps/web/src/app/api/jarvis/voice/session/route.ts',
  'apps/web/src/lib/jarvis/voice/JarvisVoiceGateway.api-example.json',
  'apps/web/src/lib/jarvis/runtime/types.ts',
  'apps/web/src/lib/jarvis/runtime/intent-router.ts',
  'apps/web/src/lib/jarvis/runtime/command-registry.ts',
  'apps/web/src/lib/jarvis/runtime/adapter-selector.ts',
  'apps/web/src/lib/public-repos/live/adapters/index.ts'
];

const requiredContent = [
  ['apps/web/src/lib/public-repos/live/adapters/JarvisVoiceGateway.contract.ts', 'rawAudioStorageAllowed: false'],
  ['apps/web/src/lib/public-repos/live/adapters/JarvisVoiceGateway.contract.ts', 'voiceMayBypassPolicy: false'],
  ['apps/web/src/lib/public-repos/live/adapters/JarvisVoiceGateway.contract.ts', 'dscripka/openWakeWord'],
  ['apps/web/src/lib/public-repos/live/adapters/JarvisVoiceGateway.contract.ts', 'ggml-org/whisper.cpp'],
  ['apps/web/src/lib/public-repos/live/adapters/JarvisVoiceGateway.contract.ts', 'OHF-Voice/piper1-gpl'],
  ['apps/web/src/lib/jarvis/voice/JarvisVoiceGateway.ts', 'routeJarvisVoiceToKernel'],
  ['apps/web/src/lib/jarvis/voice/JarvisVoiceGateway.ts', 'runJarvisApiKernelBridge'],
  ['apps/web/src/app/api/jarvis/voice/session/route.ts', 'No raw audio storage'],
  ['apps/web/src/app/api/jarvis/voice/session/route.ts', 'No always-on microphone'],
  ['apps/web/src/lib/jarvis/runtime/types.ts', 'jarvis_voice_gateway'],
  ['apps/web/src/lib/jarvis/runtime/types.ts', 'JARVIS_VOICE_SESSION'],
  ['apps/web/src/lib/jarvis/runtime/intent-router.ts', 'voice gateway'],
  ['apps/web/src/lib/jarvis/runtime/command-registry.ts', 'jarvis_voice_gateway_adapter'],
  ['apps/web/src/lib/jarvis/runtime/adapter-selector.ts', 'jarvis_voice_gateway_adapter'],
  ['apps/web/src/lib/public-repos/live/adapters/index.ts', 'JarvisVoiceGateway.contract']
];

const results = [];
let passed = true;

for (const file of requiredFiles) {
  const ok = fs.existsSync(path.join(root, file));
  results.push({ check: 'file_exists', file, ok });
  if (!ok) passed = false;
}

for (const [file, needle] of requiredContent) {
  const full = path.join(root, file);
  const content = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  const ok = content.includes(needle);
  results.push({ check: 'content_contains', file, needle, ok });
  if (!ok) passed = false;
}

const report = {
  validator: 'validate-n21-jarvis-voice-gateway',
  passed,
  checkedAt: new Date().toISOString(),
  summary: {
    files: requiredFiles.length,
    contentChecks: requiredContent.length
  },
  results
};

const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'n21-jarvis-voice-gateway-latest.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
