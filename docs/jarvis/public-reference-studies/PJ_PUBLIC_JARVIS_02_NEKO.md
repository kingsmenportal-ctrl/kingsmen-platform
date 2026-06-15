# PJ PUBLIC JARVIS 02 — Project-N-E-K-O / N.E.K.O

Status: RECORDED
Branch: kimi-kingsmen-setup
Doctrine: docs/N00-doctrine/jarvis-app-connector-law.md
Purpose: Preserve public Jarvis research so Kingsmen Jarvis design knowledge is not lost in chat.

---

## 1. Source identity

Public project studied:

```txt
Project-N-E-K-O / N.E.K.O
```

GitHub topic source describes it as an AI companion that watches, reads, listens, and plays alongside the user, powered by human-like memory and an embodied emotional engine. The GitHub jarvis-assistant topic listed it among 109 public repositories matching the topic, with Python as the language and a June 15, 2026 update marker.

This study does not import N.E.K.O code into Kingsmen. It records architectural lessons only.

---

## 2. What N.E.K.O represents

N.E.K.O is not mainly a business automation builder. It is closer to a personal AI companion pattern.

Core ideas visible from the public listing:

1. Watches alongside the user
2. Reads alongside the user
3. Listens alongside the user
4. Plays alongside the user
5. Uses human-like memory
6. Uses embodied emotional behavior
7. Belongs to the AI agents / own-your-data / jarvis-assistant category

For Kingsmen, the value is not the emotional companion theme itself. The value is continuous context awareness, memory, multimodal presence, and a more alive assistant experience.

---

## 3. What Kingsmen should learn from it

Kingsmen Jarvis must not be a cold command prompt only. It must feel present, responsive, and aware of the founder's operating context.

Useful patterns to adapt:

1. Always-present assistant shell
2. Conversation continuity
3. Memory of prior commands, failures, fixes, and doctrine
4. Context sensing from current screen/repo state where allowed
5. Natural emotional tone without fake drama
6. Multimodal input readiness: text, voice, files, screenshots, logs
7. User-owned data discipline
8. Assistant personality that stays consistent under pressure

---

## 4. What Kingsmen must not copy

Do not copy companion or entertainment features that do not directly help Kingsmen.

Rejected for Kingsmen unless explicitly justified:

1. Waifu/persona dependency
2. Emotion engine as a decision authority
3. Always-watching behavior without explicit permission
4. Storing sensitive candidate data in personal memory
5. Uncontrolled screen/camera/microphone access
6. Play/game behavior not connected to Kingsmen operations
7. Companion-first design that weakens founder control

Kingsmen rule: personality may improve usability, but doctrine, backend state machine, PostgreSQL truth, validators, and founder approval remain authority.

---

## 5. Kingsmen fit map

| N.E.K.O idea | Kingsmen Jarvis adaptation |
|---|---|
| Watches | Repo/status/HUD awareness, only with permission |
| Reads | Reads docs, logs, validator reports, source pages, uploaded files |
| Listens | Voice command intake, wake greeting, urgent mode |
| Plays alongside | Not copied; replaced with founder work-session mode |
| Human-like memory | Doctrine-safe memory vault and evidence ledger |
| Emotional engine | Controlled personality kernel, not decision authority |
| Own-your-data | Local-first memory and no secret exposure |
| AI agent category | Agent orchestrator with strict permissions |

---

## 6. How it advances Kingsmen Jarvis

N.E.K.O advances Kingsmen Jarvis in the human-interface layer.

Kingsmen Jarvis must be able to:

1. Hold long conversations without forgetting the build goal.
2. Remember what was already decided and locked.
3. Detect when a user is repeating a solved step.
4. Stay calm and operational when repo errors happen.
5. Read logs and explain them naturally.
6. Maintain a founder-session memory for what is being built now.
7. Provide status without waiting for a perfect command.
8. Support voice interaction as a first-class interface later.

This is especially useful because Kingsmen is being built by one founder first. The assistant must reduce cognitive load, not add layers.

---

## 7. Required Kingsmen modules inspired by this study

These modules should exist or be strengthened in Kingsmen Jarvis:

```txt
apps/web/src/lib/jarvis/conversation-engine.ts
apps/web/src/lib/jarvis/context-snapshot.ts
apps/web/src/lib/jarvis/session-memory.ts
apps/web/src/lib/jarvis/personality-kernel.ts
apps/web/src/lib/jarvis/evidence-ledger.ts
apps/web/src/lib/jarvis/voice-session.ts
apps/web/src/lib/jarvis/screen-context-boundary.ts
manifests/jarvis/jarvis-memory-law.json
manifests/jarvis/jarvis-personality-law.json
manifests/jarvis/jarvis-context-permission-law.json
manifests/jarvis/jarvis-voice-command-safety.json
```

If files already exist under different names, the principle is to align them, not duplicate useless layers.

---

## 8. Unified system placement

N.E.K.O-inspired features should sit here:

```txt
Founder / operator
  -> Jarvis HUD + voice/chat interface
  -> Conversation engine
  -> Session memory
  -> Context snapshot boundary
  -> Intent router
  -> Policy gate
  -> Tool / agent router
  -> Builder core / connectors / validators
  -> Evidence ledger
```

They must not bypass:

```txt
Doctrine gate
Approval gate
State machine
Secrets law
Production boundaries
```

---

## 9. Implementation path for Kingsmen

Phase A — Record-only
- Save this study.
- Add manifest entry.
- Do not import external N.E.K.O code.

Phase B — Conversation/session memory
- Add a controlled session memory module.
- Memory stores build state, not secrets.
- Memory is scoped by task/session/module.

Phase C — Context snapshot boundary
- Allow Jarvis to summarize repo state, current branch, latest commit, validator status, and open tasks.
- Screen/file access must be opt-in.

Phase D — Personality kernel
- Add consistent Kingsmen Jarvis tone: calm, direct, founder-supportive, operational, not theatrical.
- Emotional tone must never override policy.

Phase E — Voice-ready session
- Add voice command state machine.
- Voice commands map into the same command registry as text commands.
- Voice must obey approval gates.

---

## 10. Acceptance criteria

A Kingsmen implementation inspired by N.E.K.O is accepted only if:

1. Jarvis can keep context across a build session.
2. Jarvis can summarize what has been built and what remains.
3. Jarvis never stores secrets in memory.
4. Jarvis asks before any production-risk action.
5. Jarvis can explain errors in plain language.
6. Jarvis can use voice/chat without splitting doctrine.
7. Jarvis remains useful to Kingsmen operations, not entertainment.

---

## 11. Final verdict

N.E.K.O is useful to Kingsmen as a reference for presence, memory, continuity, and assistant personality.

It should influence:

```txt
Conversation brain
Session memory
Context awareness
Voice/HUD experience
Personality kernel
```

It should not influence:

```txt
Production authority
Candidate data handling
External app permissions
State machine decisions
Payment or application submissions
```

Kingsmen conclusion:

```txt
N.E.K.O = presence and memory reference.
Kingsmen Jarvis = sovereign builder/operator with controlled presence.
```
