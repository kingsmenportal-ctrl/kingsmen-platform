# N21.4 Build Report — Jarvis Voice Gateway

Branch: `n21-live-public-repo-adapters`  
Status: committed  
Result: Kingsmen now has a review-safe Jarvis voice gateway foundation tied to public repo voice adapters.

## Public repo adapters represented

| Adapter | Public repo | Purpose | Status |
|---|---|---|---|
| `JarvisWakeWordService` | `dscripka/openWakeWord` | Local wake phrase event boundary | Contract-ready |
| `JarvisSpeechToTextService` | `ggml-org/whisper.cpp` | Local STT/transcript boundary | Contract-ready |
| `JarvisTextToSpeechService` | `OHF-Voice/piper1-gpl` | Local TTS/spoken response boundary | Planned-next / contract-aware |
| `BrowserSpeechFallback` | Browser Speech APIs | Browser fallback for early Jarvis voice mode | Live-safe fallback |

## Built/updated files

1. `apps/web/src/lib/public-repos/live/adapters/JarvisVoiceGateway.contract.ts`
2. `apps/web/src/lib/jarvis/voice/JarvisVoiceGateway.ts`
3. `apps/web/src/app/api/jarvis/voice/session/route.ts`
4. `apps/web/src/lib/jarvis/voice/JarvisVoiceGateway.api-example.json`
5. `scripts/validators/validate-n21-jarvis-voice-gateway.mjs`
6. `apps/web/src/lib/public-repos/live/adapters/index.ts`
7. `apps/web/src/lib/jarvis/runtime/types.ts`
8. `apps/web/src/lib/jarvis/runtime/intent-router.ts`
9. `apps/web/src/lib/jarvis/runtime/command-registry.ts`
10. `apps/web/src/lib/jarvis/runtime/adapter-selector.ts`

## Live API

```text
GET  /api/jarvis/voice/session
POST /api/jarvis/voice/session
```

## Supported input modes

- `push_to_talk`
- `wake_event`
- `transcript_only`

## Supported engines/contracts

- `browser_speech_api`
- `openwakeword_contract`
- `whisper_cpp_contract`
- `piper_contract`

## Safety boundaries

- no raw audio storage;
- no always-on microphone enabled by this API;
- no voice command may bypass Jarvis policy;
- sensitive/action transcripts require confirmation;
- accepted transcripts route through `runJarvisApiKernelBridge` into the Jarvis kernel.

## Local commands

```powershell
node scripts/validators/validate-n21-jarvis-voice-gateway.mjs
cd apps\web
npm run dev
```

Open:

```text
/api/jarvis/voice/session
```

## Example POST

```json
{
  "inputMode": "transcript_only",
  "transcript": "Jarvis, show me the public repo integration board",
  "engine": "browser_speech_api",
  "actor": "commander",
  "routeToKernel": true
}
```

## What is not done yet

This does not install openWakeWord, whisper.cpp, or Piper binaries. It creates the Kingsmen-owned gateway, safety boundary, API, kernel route, and validation proof first.

## Next build

N21.5 — Jarvis Trace/Evidence Gateway using Langfuse contract with privacy redaction.
