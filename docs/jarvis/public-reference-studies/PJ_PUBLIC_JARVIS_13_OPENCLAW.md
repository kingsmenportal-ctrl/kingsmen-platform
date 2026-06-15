# PJ Public Jarvis Study 13 — OpenClaw

Status: RECORDED
Repository branch: main
Study type: Public Jarvis / personal AI assistant reference
Public reference: openclaw/openclaw

---

## 1. Why this project matters

OpenClaw is a public personal AI assistant project that is closer to a real multi-channel operating assistant than a hobby voice bot.

It describes itself as a personal AI assistant that runs on the user's own devices, responds through many communication channels, supports live visual canvas work, and uses a gateway/control-plane model.

For Kingsmen, this project is important because Kingsmen Jarvis must eventually operate through multiple surfaces without losing control:

- Web HUD
- Voice shell
- Local PowerShell tools
- GitHub/repo commands
- Email-first communication
- Urgent WhatsApp boundary
- App connectors
- Agent/tool routing
- Evidence logging
- Approval gates

OpenClaw gives a strong reference for channel routing, session routing, pairing/allowlists, sandboxed sessions, tools, skills, and operator commands.

---

## 2. Public features observed

OpenClaw presents these useful patterns:

1. Local-first gateway/control plane
2. Multi-channel inbox
3. Multi-agent routing
4. Voice wake / talk mode
5. Live canvas / visual workspace
6. First-class tools
7. Companion apps
8. Onboarding-driven setup
9. Skills registry
10. Chat commands such as status, reset, compact, think level, verbose, trace, usage, restart
11. Pairing/allowlist security for remote DMs
12. Sandbox model for non-main sessions
13. Gateway doctor / risk checks

---

## 3. Kingsmen adaptation

Kingsmen Jarvis should adapt these ideas:

```txt
JarvisGateway
JarvisChannelRouter
JarvisSessionManager
JarvisAllowedSenderPolicy
JarvisFounderPairingGate
JarvisWorkspaceSession
JarvisToolSandboxPolicy
JarvisLiveCanvasHud
JarvisOperatorCommands
JarvisDoctorCommand
JarvisSkillRegistry
JarvisCompanionNode
```

The strongest lesson is:

```txt
Every channel must be treated as untrusted until paired, approved, and routed through policy.
```

This is directly relevant to Kingsmen because the platform will connect to email, WhatsApp, GitHub, n8n, Airtable, Supabase, PayFast, Google, and possibly future partner portals.

---

## 4. Kingsmen rejection list

Kingsmen must reject or harden these areas:

1. No public-channel command may reach production directly.
2. WhatsApp must not become the primary communication system.
3. Unknown senders must never control Jarvis.
4. Group/chat/channel input must be treated as untrusted.
5. Tool execution must not run unrestricted for non-main sessions.
6. Skills must be reviewed before activation.
7. Live canvas must not become authority over backend truth.
8. Agent autonomy must not bypass the Kingsmen backend state machine.
9. Production actions require founder approval.
10. No channel may expose secrets, candidate data, or internal reports.

---

## 5. How it fits into Kingsmen Jarvis

Target flow:

```txt
Founder / approved channel
  -> JarvisGateway
  -> ChannelRouter
  -> SenderPairingGate
  -> SessionManager
  -> ConversationEngine
  -> IntentClassifier
  -> CommandRegistry
  -> DoctrinePolicyGate
  -> ToolSandboxPolicy
  -> ApprovalGate if risky
  -> BuilderCore / AppConnector / Validator / ResearchAgent
  -> EvidenceLedger
  -> LiveHud / ResponseComposer / Channel reply
```

Remote/non-main channel flow:

```txt
Inbound message
  -> Treat as untrusted
  -> Pairing or allowlist check
  -> No production tools by default
  -> Sandbox-only tools
  -> Evidence logging
  -> Safe reply
```

---

## 6. Concrete Kingsmen build modules unlocked by this study

This study supports these Kingsmen modules:

```txt
JarvisGateway
JarvisMultiChannelInbox
JarvisChannelAllowlist
JarvisFounderPairingCode
JarvisRemoteCommandPolicy
JarvisSessionMemoryBoundary
JarvisSandboxedToolRunner
JarvisSkillInstallerReviewGate
JarvisDoctorRiskScan
JarvisLiveCanvasHud
JarvisOperatorQuickCommands
```

---

## 7. Relationship to Kingsmen doctrine

OpenClaw is useful, but Kingsmen law remains stronger.

Kingsmen authority remains:

1. PostgreSQL Truth Vault
2. Backend API Kernel and state machine
3. GitHub repository and change history
4. Validators and boot blockers
5. Evidence ledger
6. Founder approval for production-risk actions

Jarvis may operate through many channels, but channel convenience does not equal authority.

---

## 8. Final verdict

OpenClaw should be used as the Kingsmen reference for:

```txt
multi-channel Jarvis control
remote command pairing
session routing
sandboxed tool execution
live canvas/HUD thinking
operator commands
skills registry discipline
security doctor checks
```

It should not replace Kingsmen doctrine, backend, PostgreSQL truth, approval gates, or email-first communication doctrine.

Kingsmen conclusion:

```txt
OpenClaw = multi-channel gateway lesson.
Kingsmen Jarvis = sovereign controlled builder/operator with evidence and approval.
```
