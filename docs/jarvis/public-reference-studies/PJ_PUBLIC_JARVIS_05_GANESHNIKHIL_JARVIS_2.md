# PJ Public Jarvis Study 05 — ganeshnikhil/J.A.R.V.I.S.2.0

Status: RECORDED
Repo branch recorded to: main
Study purpose: Extract useful patterns for Kingsmen Jarvis without importing unsafe assumptions.
Public project: ganeshnikhil/J.A.R.V.I.S.2.0
Public source: https://github.com/ganeshnikhil/J.A.R.V.I.S.2.0

---

## 1. What this public project is

`ganeshnikhil/J.A.R.V.I.S.2.0` is a public open-source Jarvis-style assistant. Its GitHub page describes it as an open-source hybrid assistant using small models, Gemini, image and agentic tool capabilities, RAG with efficient memory, and Android support using ADB.

The repository page shows:

- Public repository
- Default branch: main
- About 120 commits at the time studied
- Python-first implementation
- Files/folders including `DATA`, `src`, `ui.py`, `requirements.txt`, `intialize.sh`, images, and device IP configuration
- A Streamlit launch path using `streamlit run ui.py`

This is not a production business operating system. It is a hobby/open assistant reference with useful ideas for local/cloud hybrid AI, multimodal tools, RAG, phone/device actions, and task execution.

---

## 2. Main features observed

The README describes features including:

- Voice activation
- Speech recognition
- AI-generated text-to-speech responses
- Sending emails
- Weather summaries
- CSV/data analysis
- Personalized chat
- News headlines
- Image generation
- Database functions
- Phone call automation using ADB
- AI-based task execution
- Website/application automation
- Image processing using Gemini
- RAG knowledge interactions
- Timeout handling
- Automatic input finalization
- Multiple function calls

The project also describes a model mix:

- Small Ollama/local models such as Gemma and Granite variants
- Embedding model usage
- Gemini as a fallback/function-calling layer
- Image-to-text model usage
- RAG over markdown knowledge files

---

## 3. Why this matters for Kingsmen Jarvis

This project contributes the **hybrid intelligence pattern**.

Kingsmen Jarvis must not rely on only one model or one API. It should be able to use:

1. Fast local/small model for simple routing and low-risk chat
2. Stronger cloud model for complex reasoning and builder tasks
3. RAG for Kingsmen doctrine, repo docs, institutional source facts, and build memory
4. Embeddings/search for evidence retrieval
5. Multimodal input later for screenshots, portal proof, and document views
6. Device/local automation only through approved, logged, and permissioned adapters

The strongest lesson is: **route the task to the cheapest safe intelligence that can do the job, then escalate only when needed.**

---

## 4. Kingsmen adaptation map

| Public Jarvis idea | Kingsmen Jarvis adaptation |
|---|---|
| Small local models | Use for safe command classification, draft summaries, low-risk routing |
| Gemini/cloud fallback | Use a stronger cloud model only for complex planning, code generation, deep reasoning |
| RAG markdown knowledge | Kingsmen doctrine/docs/source-confidence RAG over repo + verified source snapshots |
| Multiple function calls | Tool-router can plan several safe non-production actions with evidence |
| Image processing | Screenshot/document interpretation for portal health and evidence, not uncontrolled action |
| Streamlit UI | Do not copy directly; Kingsmen already has Next.js HUD direction |
| ADB phone automation | Only future local-device helper, never candidate/production automation by default |
| Email sending | Draft-first only; production send requires approval |
| Website/app automation | Browser scout only, no CAPTCHA/OTP/rate-limit bypass |

---

## 5. What Kingsmen should copy

Kingsmen should copy these design patterns:

1. Hybrid local/cloud model routing
2. RAG-backed answers instead of pure hallucination-prone chat
3. Tool/function-calling layer
4. Separate function execution from normal conversation
5. Timeout and command-finalization logic for voice input
6. Multimodal readiness: text, voice, image, screenshot
7. Data-analysis helper for CSV/report inspection
8. Low-spec system awareness
9. Mobile-device concept as a future optional helper

---

## 6. What Kingsmen must reject

Kingsmen must reject or strictly gate:

1. Direct production email sending
2. Direct phone/device control without approval
3. Raw `.env` examples that encourage weak secret handling
4. Website/application automation without Kingsmen policy gates
5. Any action that bypasses CAO/NSFAS/university portal protections
6. Any connector that treats AI function calling as authority
7. Any candidate data memory stored casually
8. Any assistant behavior that acts before repository evidence exists

Kingsmen rule remains: model output is only a proposal. Policy gate, backend truth, validators, evidence ledger, and founder approval decide.

---

## 7. Kingsmen Jarvis module impact

This study advances these Kingsmen Jarvis modules:

```txt
apps/web/src/lib/jarvis/model-router.ts
apps/web/src/lib/jarvis/function-call-router.ts
apps/web/src/lib/jarvis/rag/knowledge-retriever.ts
apps/web/src/lib/jarvis/rag/source-bound-answer.ts
apps/web/src/lib/jarvis/voice/voice-session-state.ts
apps/web/src/lib/jarvis/multimodal/screenshot-reader.ts
apps/web/src/lib/jarvis/device/local-device-adapter.ts
apps/web/src/lib/jarvis/policy-gate.ts
apps/web/src/lib/jarvis/evidence-ledger.ts
```

It also informs these manifests:

```txt
manifests/jarvis/jarvis-model-routing-policy.json
manifests/jarvis/jarvis-function-call-policy.json
manifests/jarvis/jarvis-rag-source-policy.json
manifests/jarvis/jarvis-device-adapter-law.json
manifests/jarvis/jarvis-voice-session-law.json
```

---

## 8. How it combines into one Kingsmen Jarvis system

The combined Kingsmen path should be:

```txt
Founder voice/chat/HUD command
  -> Voice/session finalizer if spoken
  -> Conversation engine
  -> Intent classifier using cheap/safe model
  -> Doctrine and policy gate
  -> RAG retrieval from Kingsmen docs/source evidence
  -> Model router selects local/cloud/code/research model
  -> Function-call router builds safe plan
  -> Approval gate if production-risk
  -> Builder core / app connector / validator / local helper
  -> Evidence ledger records all steps
  -> Response composer explains result
```

This makes Jarvis responsive, cheap to operate, powerful enough for deep building, and safer than hobby assistants.

---

## 9. Build recommendation for Kingsmen

Implement this in Kingsmen as **Hybrid Model Router + RAG Function Call Layer**.

Minimum first build:

1. `model-router.ts` with task classes: chat, route, code, research, vision, app-action
2. `function-call-router.ts` with allowlist-only tools
3. `rag/knowledge-retriever.ts` reading repo doctrine/docs first
4. `voice-session-state.ts` for timeout/finalization rules
5. `jarvis-function-call-policy.json` to block unsafe tools
6. Evidence record for every tool call decision

Do not build Android/ADB control first. Device control is later and only local-founder helper, not candidate or production automation.

---

## 10. Kingsmen verdict

`ganeshnikhil/J.A.R.V.I.S.2.0` is a useful public reference for **hybrid AI routing, RAG, function calling, multimodal readiness, and low-spec operation**.

It is not safe enough to copy directly into Kingsmen. Kingsmen should absorb the architecture lessons and implement them under:

- Jarvis connector law
- production approval boundary
- repository-first build rule
- evidence ledger
- source-confidence doctrine
- PostgreSQL truth
- backend state-machine authority

Final decision: ADAPT SELECTIVELY.
