# PJ_PUBLIC_JARVIS_11 — small-cactus / M.I.L.E.S Study

Status: RECORDED
Recorded for: Kingsmen Jarvis public reference study set
Target repository branch: main
Public project: small-cactus/M.I.L.E.S

---

## 1. Public project identity

Repository: `small-cactus/M.I.L.E.S`

M.I.L.E.S presents itself as a GPT-4-Turbo powered voice assistant for macOS and Windows. The public repository description emphasizes natural voice control, Spotify, system/Spotify volume, calculations, web browsing, weather, date/time, long-term memories, and self-adapting prompts/models.

The public page shows a real app-style structure with folders such as `.github`, `Miles-V2`, `screenshots`, README, security policy, logo assets, and installer links for macOS and Windows.

---

## 2. Useful public features observed

M.I.L.E.S is useful as a reference because it focuses on assistant experience rather than only backend code.

Notable public design ideas:

1. Natural language voice commands rather than rigid keyword syntax.
2. Wake-word detection trained for a custom assistant name.
3. Follow-up context so the user does not repeat the wake word every time.
4. Self-adapting prompt/model behavior for cost and capability changes.
5. Persistent memory for details the user explicitly asks the assistant to remember.
6. Plugin support through user-created Python functions.
7. Home Assistant integration for selected smart devices.
8. Weather, calculator, internet browsing, music control, and image recognition utilities.
9. Setup/welcome screens for API keys and configuration.
10. Projection-style UI concept for an ambient Jarvis surface.
11. Privacy-first claims around local processing and short-term listening windows.

---

## 3. Kingsmen relevance

M.I.L.E.S contributes the **natural voice + adaptive assistant experience layer**.

Kingsmen Jarvis must eventually feel responsive and conversational, not like a rigid command-line script.

Useful Kingsmen lessons:

```txt
Founder says: Jarvis, continue N04.
Jarvis understands the current module context.
Jarvis does not require exact command syntax every time.
Jarvis remembers the current build session.
Jarvis can switch between cheap/fast mode and strong/deep mode.
Jarvis can explain what it is doing while it works.
Jarvis can use plugins/tools only through approved gates.
```

---

## 4. What Kingsmen should adapt

Kingsmen should adapt these concepts:

```txt
JarvisNaturalCommandParser
JarvisFollowUpContext
JarvisWakeWordOrButtonSession
JarvisCostModeSelector
JarvisModelCapabilityRouter
JarvisExplicitMemoryWriteFlow
JarvisPluginContract
JarvisSetupWizard
JarvisProjectionHudMode
JarvisShortTermListeningWindow
JarvisPrivacyBoundary
```

The strongest useful ideas are:

1. Natural conversation as the command surface.
2. Explicit memory writes instead of uncontrolled memory.
3. Model/cost mode switching.
4. Plugins as controlled tool adapters.
5. Setup screens for configuration rather than secrets in chat.
6. A projection/HUD mode for founder operations.

---

## 5. What Kingsmen must reject or harden

Kingsmen must not copy M.I.L.E.S blindly.

Reject or harden:

```txt
assistant rewriting its own core instructions without doctrine validation
unreviewed user-created plugins
always-listening or background transcription as default
smart-home/device control without approval gate
music/media features distracting from Kingsmen operations
persistent memory without domain separation and retention policy
camera/image recognition without explicit session permission
production actions from natural voice alone
```

For Kingsmen, natural language is only the surface. The backend rules still decide what is allowed.

---

## 6. Kingsmen-safe version

Kingsmen Jarvis may support natural conversation, but every action must pass through:

```txt
Conversation Engine
  -> Intent Classifier
  -> Command Registry
  -> Doctrine Policy Gate
  -> Risk Classifier
  -> Approval Gate if risky
  -> Tool / Plugin Router
  -> Evidence Ledger
  -> Response Composer
```

This means the user can speak naturally, but Jarvis still obeys strict Kingsmen law.

---

## 7. Memory lesson

M.I.L.E.S highlights persistent memory. Kingsmen should adapt this carefully.

Kingsmen memory must be separated into domains:

```txt
founder_preferences
current_build_session
repo_build_history
connector_configuration_metadata
candidate_safe_support_context
source_research_memory
```

Forbidden memory:

```txt
raw secrets
unredacted candidate documents
unapproved health/financial/personal sensitive data
production tokens
private credentials
unverified claims presented as facts
```

Memory writes must be explicit, logged, and deletable.

---

## 8. Plugin lesson

M.I.L.E.S supports plugins through Python functions. Kingsmen should convert this into an approved adapter system.

Kingsmen plugin contract:

```txt
plugin_id
name
scope
allowed_actions
forbidden_actions
required_env_keys
risk_level
requires_approval
validator_command
evidence_event_type
```

No community plugin may run in Kingsmen until reviewed, sandboxed, and registered in the approved tool manifest.

---

## 9. Cost/model switching lesson

M.I.L.E.S includes the idea of cost-effective mode and model/prompt adaptation.

Kingsmen should implement:

```txt
FAST_MODE      cheap, short, local/simple classification
BUILD_MODE     strong code/build reasoning
RESEARCH_MODE  citation/source checking
VISION_MODE    screenshots/documents/images
AUDIT_MODE     validators, policy, security, evidence
```

Jarvis may choose a cheaper or stronger mode, but must log the routing reason.

---

## 10. Fit into the one Kingsmen Jarvis system

```txt
Founder voice/chat/HUD command
  -> wake/button/session intake
  -> natural command parser
  -> follow-up context resolver
  -> conversation engine
  -> doctrine policy gate
  -> model/cost router
  -> approved plugin/tool router
  -> builder core / validator / connector / research / local utility
  -> evidence ledger
  -> spoken + HUD response
```

---

## 11. Kingsmen build implication

Project 11 should influence these Kingsmen components:

```txt
JarvisConversationEngine
JarvisFollowUpContextResolver
JarvisExplicitMemoryWriter
JarvisCostModeSelector
JarvisModelRouter
JarvisPluginContract
JarvisSetupWizard
JarvisProjectionHudMode
JarvisPrivacyBoundary
```

This project should not become Kingsmen architecture. It is a reference for natural interaction and adaptive assistant experience.

---

## 12. Final verdict

M.I.L.E.S is useful for the **natural voice, memory, plugin, model switching, and projection HUD lessons**.

Kingsmen should adapt the experience concepts while enforcing stronger rules:

```txt
natural speech allowed
self-changing doctrine forbidden
plugins approved only
memory explicit only
camera/mic permissioned only
production actions approval-gated
all actions evidence-logged
```

Kingsmen Jarvis must be more disciplined than M.I.L.E.S because Kingsmen controls real candidate, finance, workflow, and operational systems.
