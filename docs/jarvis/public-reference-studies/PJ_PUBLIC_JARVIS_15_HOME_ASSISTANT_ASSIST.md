# PJ Public Jarvis Study 15 — Home Assistant Assist

Status: RECORDED
Repository branch recorded to: main
Study type: Public assistant architecture reference
Primary public reference: Home Assistant Assist / voice assistant documentation
Kingsmen use: Safe intent pipeline, local-first voice control, built-in/custom sentence mapping, device/service connector discipline

---

## 1. Why this project matters

Home Assistant Assist is not branded as a hobby Jarvis repo, but it is one of the most useful public assistant systems for Kingsmen Jarvis because it shows how a real assistant safely turns natural language into controlled actions.

Home Assistant documentation describes Assist as the voice assistant built into Home Assistant. It can control a smart home with natural language and can run fully on the user's own hardware so voice commands stay private. It can run in the companion app, dedicated voice hardware, and self-built ESPHome devices.

This matters for Kingsmen because Kingsmen Jarvis must eventually control many tools and apps:

```txt
GitHub
Airtable
n8n
Supabase / PostgreSQL
Gmail
Google Drive
Google Calendar
PayFast
WhatsApp urgent-only
Oracle deployment
local PowerShell tools
browser scout tools
validators
```

But it must do that through controlled intents, not random AI actions.

---

## 2. Core lesson for Kingsmen

Home Assistant Assist teaches this design rule:

```txt
Natural language must be translated into known intents before action.
```

Kingsmen version:

```txt
Founder command
  -> transcript / text finalizer
  -> intent classifier
  -> known Kingsmen command
  -> slot extraction
  -> policy gate
  -> approval gate if risky
  -> tool/app connector
  -> evidence ledger
  -> response
```

This prevents Jarvis from guessing dangerous actions.

---

## 3. Built-in intent lesson

Home Assistant developer docs list built-in intents such as turning devices on/off, getting state, responding without action, broadcasting, setting positions, getting date/time, changing lights/climate, lists, timers, media, volume, weather, fans, vacuums, and lawn mowers.

Kingsmen must use the same principle, but for business operations.

Examples:

```txt
KingsmenGetRepoStatus
KingsmenRunValidator
KingsmenExplainFailure
KingsmenCreateBuildPlan
KingsmenCreateRepoFile
KingsmenScanSecrets
KingsmenShowChangedFiles
KingsmenPrepareCommit
KingsmenCreatePullRequestDraft
KingsmenAirtableDryRun
KingsmenN8nWorkflowValidate
KingsmenSupabaseMigrationDryRun
KingsmenResearchSource
KingsmenGenerateManualApplicationPackage
KingsmenQueueCandidateReview
KingsmenPrepareEmailDraft
KingsmenRequestFounderApproval
KingsmenNevermind
KingsmenRespondOnly
```

The key is that every action has a known command shape.

---

## 4. Slot-filling lesson

Home Assistant intents use slots such as name, area, floor, domain, device_class, state, brightness, color, temperature, item, and list name.

Kingsmen needs its own slot set:

```txt
module_id: N04, N05, N06, etc.
worker_id: W01, W02, W03, etc.
candidate_id
application_id
route_id
institution_id
province
source_url
connector_name
risk_level
environment: local | staging | production
approval_required: true | false
file_path
validator_name
commit_message
```

Jarvis should not execute until required slots are known or safely defaulted.

---

## 5. Local-first privacy lesson

Assist can run fully on the user's own hardware so voice commands stay private. This aligns with Kingsmen's doctrine.

Kingsmen adaptation:

```txt
Local repo reads stay local where possible.
Voice transcript processing should prefer local/dev boundaries where possible.
Candidate-sensitive data must not be placed into casual memory.
Production secrets stay in vault/.env/GitHub Secrets, not prompts.
```

---

## 6. Custom sentences lesson

Home Assistant supports built-in sentences and custom sentences. Kingsmen needs a custom command grammar.

Examples:

```txt
Jarvis, build N04 candidate auth.
Jarvis, validate the Jarvis connector law.
Jarvis, scan this branch for secrets.
Jarvis, create a dry-run Airtable sync.
Jarvis, prepare but do not send the email.
Jarvis, open a MAP for this blocked application.
Jarvis, explain why the validator failed.
Jarvis, nevermind.
```

The command grammar must map to approved commands, not uncontrolled freeform execution.

---

## 7. Wake word and satellite lesson

Assist can be used from dashboard, companion app, dedicated voice hardware, Android wake-word detection, ESPHome satellites, Linux voice assistants, and even a private analog-phone-style assistant.

Kingsmen should not build all of that now, but it should design for future channels:

```txt
Phase 1: Web HUD text command
Phase 2: Browser voice button
Phase 3: Local PowerShell voice helper
Phase 4: Optional phone/desktop/satellite helper
Phase 5: Urgent-only WhatsApp command notification boundary
```

No always-on microphone should be enabled by default.

---

## 8. What Kingsmen should adapt

```txt
JarvisIntentCatalog
JarvisCommandSentenceRegistry
JarvisSlotFiller
JarvisEntityResolver
JarvisNevermindCancelIntent
JarvisRespondOnlyIntent
JarvisLocalFirstVoiceMode
JarvisDashboardAssistButton
JarvisWakeWordOptionalMode
JarvisSatelliteChannelContract
JarvisCustomSentenceCompiler
JarvisIntentValidationHarness
```

---

## 9. What Kingsmen must reject

```txt
voice command directly causing production action
unknown intent execution
custom sentences that bypass policy
always-on microphone by default
candidate-sensitive data in assistant memory
connector actions without evidence logging
production app changes without approval
external LLM deciding final authority
```

---

## 10. Kingsmen architecture fit

```txt
Founder voice/chat/HUD command
  -> JarvisCommandIntake
  -> TranscriptFinalizer
  -> JarvisIntentCatalog
  -> CustomSentenceMatcher
  -> SlotFiller
  -> EntityResolver
  -> DoctrinePolicyGate
  -> RiskClassifier
  -> ApprovalGate if risky
  -> Tool/App Connector or Builder Core
  -> EvidenceLedger
  -> ResponseComposer
  -> HUD/voice response
```

This is the strongest controlled way to make Jarvis conversational and powerful without letting it become dangerous.

---

## 11. Connection to current Kingsmen build

This study should influence these current/future files:

```txt
apps/web/src/lib/jarvis/runtime/intent-router.ts
apps/web/src/lib/jarvis/runtime/command-registry.ts
apps/web/src/lib/jarvis/runtime/policy-gate.ts
apps/web/src/lib/jarvis/runtime/evidence-ledger.ts
apps/web/src/app/api/jarvis/voice/route.ts
manifests/jarvis/jarvis-intent-taxonomy.json
manifests/jarvis/jarvis-command-registry.json
manifests/jarvis/jarvis-voice-command-safety.json
manifests/jarvis/jarvis-tool-routing-matrix.json
```

---

## 12. Kingsmen build decision

Home Assistant Assist becomes the Kingsmen lesson for:

```txt
intent-first assistant execution
custom command grammar
slot filling
cancel/nevermind safety
respond-only mode
local-first voice privacy
voice satellites as future extension
controlled integration mapping
```

It does not replace Kingsmen backend, PostgreSQL truth, validators, evidence ledger, or founder approval.

Final decision:

```txt
ADAPT: intent pipeline, slot filling, custom sentences, local-first voice pattern
REJECT: voice-to-production action without gate
BUILD INTO KINGSMEN: JarvisIntentCatalog + JarvisSlotFiller + JarvisCustomSentenceRegistry
```
