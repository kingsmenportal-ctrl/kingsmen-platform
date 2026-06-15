# PJ Public Jarvis 09 — OpenVoiceOS / ovos-core

Status: RECORDED
Repo branch recorded: main
Study purpose: Extract public voice-assistant architecture lessons for Kingsmen Jarvis.
Public reference: https://github.com/OpenVoiceOS/ovos-core

---

## 1. What OpenVoiceOS is

OpenVoiceOS / ovos-core is a public open-source voice assistant core. It is described by its GitHub README as the central component of OpenVoiceOS, an open-source platform for smart speakers and other voice-centric devices. It continues the historical Mycroft voice-assistant lineage.

OpenVoiceOS is important to Kingsmen because it is not just a chatbot. It is a voice-first assistant stack with:

- wake/listen/speak style operation
- skills
- headless Raspberry Pi / embedded-device style deployment
- persona fallback support
- plugin/solver routing
- a mature voice-assistant lineage

---

## 2. Kingsmen value

OpenVoiceOS gives Kingsmen Jarvis the voice operating-system lesson:

Jarvis must have a real voice pipeline, not only a browser text box.

Kingsmen Jarvis should eventually support:

1. Wake or button-triggered listening.
2. Speech-to-text transcription.
3. Intent classification.
4. Doctrine and policy gate.
5. Skill/tool routing.
6. Response generation.
7. Text-to-speech answer.
8. Evidence logging.
9. Cancel/stop interaction.
10. Headless/local operation later.

---

## 3. What Kingsmen should adapt

Kingsmen should adapt these OpenVoiceOS lessons:

- Voice pipeline separation.
- Skills as isolated action modules.
- Persona fallback as controlled conversation mode.
- Headless operation for low-resource devices.
- Raspberry Pi / local-machine assistant concept.
- Community skill idea, but only after Kingsmen review.
- Standalone core that can be embedded into a bigger system.

---

## 4. What Kingsmen must reject

Kingsmen must reject or restrict:

- Unreviewed public/community skills.
- Persona mode as system authority.
- Always-on microphone as default.
- Voice commands that bypass policy gate.
- Any voice layer that directly controls production apps.
- Storing candidate data in assistant skill memory.
- Secrets inside persona JSON, prompts, logs, or repo files.

---

## 5. Kingsmen architecture adaptation

Kingsmen Jarvis voice route:

```txt
Founder voice or button command
  -> JarvisVoiceSession
  -> SpeechCapture
  -> TranscriptFinalizer
  -> IntentClassifier
  -> CommandRegistry
  -> DoctrinePolicyGate
  -> ApprovalGate if risky
  -> SkillToolRouter
  -> BuilderCore / Validator / AppConnector / ResearchAgent
  -> EvidenceLedger
  -> ResponseComposer
  -> TextToSpeech or HUD reply
```

---

## 6. Skill system mapping

OpenVoiceOS skill concept becomes Kingsmen approved skills:

```txt
skills/kingsmen-repo/
skills/kingsmen-github/
skills/kingsmen-airtable/
skills/kingsmen-n8n/
skills/kingsmen-supabase/
skills/kingsmen-google/
skills/kingsmen-payfast/
skills/kingsmen-comms/
skills/kingsmen-browser-scout/
skills/kingsmen-deploy/
```

Every skill must include:

1. Scope.
2. Allowed actions.
3. Forbidden actions.
4. Required scripts.
5. Required environment variables.
6. Dry-run requirement where relevant.
7. Production approval boundary.
8. Evidence event type.

---

## 7. Persona mapping

OpenVoiceOS persona support teaches a useful fallback pattern.

Kingsmen version:

- `operator_persona`: answers founder operations questions.
- `builder_persona`: explains repo/build work.
- `research_persona`: explains source findings.
- `support_persona`: drafts candidate-safe support messages.

But persona is presentation only. It must not bypass:

- doctrine
- state machine
- PostgreSQL truth
- approval gates
- validators
- evidence ledger

---

## 8. Why this matters for Kingsmen Jarvis

Kingsmen Jarvis must become usable hands-free, especially for the founder operating alone.

Voice should help with:

- start Jarvis
- check status
- run validator
- explain failure
- open local portal
- create build plan
- read progress report
- stop/cancel task
- ask for next safe action

Voice must not directly:

- submit candidate applications
- send mass messages
- activate production workflows
- delete Airtable fields
- run destructive migrations
- process refunds
- expose secrets

---

## 9. Build order contribution

OpenVoiceOS contributes to this Kingsmen Jarvis build order:

```txt
Phase V1: Button-to-talk in web HUD
Phase V2: Browser speech input and spoken response
Phase V3: Local PowerShell voice bridge
Phase V4: Dedicated voice session state machine
Phase V5: Optional headless/local assistant service
Phase V6: Optional hardware/mobile companion
```

This prevents visual/voice excitement from weakening the real Kingsmen backend and repository builder.

---

## 10. Final verdict

OpenVoiceOS should influence Kingsmen Jarvis voice architecture, skill separation, local/headless thinking, and persona fallback.

It must not replace Kingsmen Jarvis core.

Kingsmen remains:

```txt
PostgreSQL truth
+ Backend state machine
+ GitHub repo evidence
+ Jarvis doctrine law
+ Policy gate
+ Approval gate
+ Validator proof
+ Controlled app connectors
```

OpenVoiceOS lesson:

```txt
Make Jarvis speak/listen like a real assistant, but keep Kingsmen law as the brain and boundary.
```
