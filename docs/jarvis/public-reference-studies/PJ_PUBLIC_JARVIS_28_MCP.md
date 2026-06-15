# PJ_PUBLIC_JARVIS_28_MCP

Status: recorded
Branch: main
Project number: 28
Public reference: Model Context Protocol (MCP)
Primary organization: modelcontextprotocol
Study type: connector-standard pattern
Kingsmen classification: useful but high-risk connector gateway standard

## 1. Why this project matters

Model Context Protocol (MCP) is a public open standard for connecting AI applications to external systems, data sources, tools, and workflows.

For Kingsmen Jarvis, MCP is important because Jarvis must eventually connect to many external systems without becoming uncontrolled:

- GitHub
- Google apps
- Airtable
- Supabase/PostgreSQL
- n8n
- PayFast
- browser scouts
- local filesystem helpers
- validator runners
- future partner APIs

The lesson is not "connect everything and let the AI act".

The Kingsmen lesson is:

> A connector must be typed, trusted, scoped, logged, reviewed, and routed through policy before it can be used.

## 2. Public facts used for this study

Official MCP documentation describes MCP as an open-source standard for connecting AI applications to external systems. It can connect AI apps to local files, databases, tools, search engines, calculators, and workflows.

The official GitHub organization describes MCP as a protocol for seamless integration between LLM applications and external data sources and tools. The organization includes documentation/specification, SDKs, maintained servers, inspector, and conformance projects.

The GitHub organization also lists official SDKs for TypeScript, Python, Java, Kotlin, C#, Go, PHP, Ruby, Rust, and Swift.

The source ecosystem is large and active, but recent public security research also shows that MCP-style tool gateways create serious risks if servers, tool descriptions, permissions, identity, and runtime execution are not governed properly.

## 3. Kingsmen interpretation

MCP is a connector standard.

It must not become Kingsmen authority.

Kingsmen authority remains:

- PostgreSQL Truth Vault
- Backend API state machine
- Kingsmen doctrine files
- validators and boot-blockers
- GitHub evidence
- founder approval

MCP can help Jarvis expose or consume tools, but it cannot decide final state transitions, production actions, candidate submissions, payments, refunds, credential changes, or compliance outcomes.

## 4. What Kingsmen should adapt

Kingsmen should adapt the following MCP-inspired components:

```txt
JarvisMcpGateway
JarvisTrustedServerRegistry
JarvisToolManifest
JarvisToolCapabilityCard
JarvisToolSchemaVerifier
JarvisToolTrustClassifier
JarvisConnectorPolicyGate
JarvisToolBudgetGuard
JarvisStructuredErrorContract
JarvisToolInvocationLedger
JarvisPromptInjectionScanner
JarvisToolOutputSanitizer
JarvisMcpInspectorHarness
JarvisConformanceCheckHarness
JarvisToolDescriptionQualityCheck
JarvisRemoteConnectorApprovalFlow
```

## 5. Kingsmen MCP trust levels

Every tool/server must be classified before use.

```txt
TRUST_0_UNKNOWN
- not allowed to execute
- can only be inspected

TRUST_1_READ_ONLY
- can read public or founder-approved data
- no writes
- no secrets

TRUST_2_DRY_RUN
- can prepare actions
- no real external mutation

TRUST_3_STAGING_WRITE
- can write only to staging/test systems
- requires evidence ledger

TRUST_4_PRODUCTION_APPROVAL_REQUIRED
- can touch production only after explicit founder approval

TRUST_5_BLOCKED
- unsafe, unverifiable, or unnecessary
```

Default for new MCP servers:

```txt
TRUST_0_UNKNOWN
```

## 6. What Kingsmen must reject

Kingsmen must reject:

- unknown MCP servers controlling Jarvis
- marketplace tools installed without review
- connector tools without typed schemas
- tool descriptions treated as security boundaries
- tool outputs trusted without sanitization
- MCP servers receiving secrets by default
- prompt injection from remote tools
- multiple MCP servers sharing implicit trust
- production actions without explicit approval
- candidate data sent to random connectors
- connector actions without evidence ledger
- MCP as a replacement for backend state machine
- remote code execution through unchecked local command tools

## 7. Required Kingsmen connector flow

```txt
Founder command
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> DoctrinePolicyGate
  -> ConnectorNeedDecision
  -> TrustedServerRegistry
  -> ToolCapabilityCard
  -> ToolSchemaVerifier
  -> RiskClassifier
  -> ApprovalGate if risky
  -> ToolBudgetGuard
  -> ToolInvocation
  -> ToolOutputSanitizer
  -> StructuredResultContract
  -> EvidenceLedger
  -> ResponseComposer
```

## 8. Kingsmen app examples

### GitHub MCP-style connector

Allowed:

- read repo files
- create branch
- create patch
- open PR
- fetch CI result
- read issues

Restricted:

- merge PR
- delete branch
- force push
- alter branch protection
- expose secrets

### Google MCP-style connector

Allowed:

- search/read approved email or calendar context
- draft email
- prepare event

Restricted:

- send mass email
- delete emails
- change calendar without approval
- expose candidate data to unrelated prompts

### Airtable MCP-style connector

Allowed:

- read mirror data
- prepare update proposal

Restricted:

- use Airtable as truth
- delete records without approval
- bypass backend state machine

### n8n MCP-style connector

Allowed:

- inspect workflow JSON
- prepare workflow file
- validate node pattern

Restricted:

- activate production workflow without approval
- orchestration logic inside n8n
- multiple backend result posts

### PayFast MCP-style connector

Allowed:

- verify payment evidence
- prepare reconciliation report

Restricted:

- refund without explicit approval
- payment action without ledger
- credential exposure

## 9. Security lessons

MCP-style connectors create new attack surfaces:

- prompt injection through tool output
- malicious tool descriptions
- false capability claims
- implicit trust propagation between servers
- unsafe command execution
- missing identity propagation
- weak error semantics
- stale config not enforced at runtime
- tool budget exhaustion

Kingsmen must therefore implement a Jarvis connector firewall.

Minimum controls:

```txt
server allowlist
capability attestation record
tool schema verification
risk classification
manual approval for risky tools
output sanitization
prompt injection scanner
timeout and budget guard
structured error contract
evidence ledger
secret redaction
connector kill switch
```

## 10. Build order for Kingsmen

Do not start by connecting every app.

Correct build order:

```txt
1. JarvisToolManifest
2. JarvisTrustedServerRegistry
3. JarvisToolSchemaVerifier
4. JarvisConnectorPolicyGate
5. JarvisToolInvocationLedger
6. Local read-only GitHub/repo tool
7. Validator command tool
8. Dry-run connector actions
9. Staging connector writes
10. Production connector approval flow
```

This obeys the locked Kingsmen doctrine:

```txt
No useless layers.
No uncontrolled brain.
No production action without founder approval.
PostgreSQL/backend/GitHub/validators remain authority.
```

## 11. Final Kingsmen decision

MCP is valuable for Kingsmen Jarvis, but only as a governed connector standard.

Kingsmen Jarvis should use MCP-style design for typed tools, app connectors, local utilities, and future integrations.

Kingsmen Jarvis must not trust MCP servers by default, must not install random tools, and must not allow connector execution outside the doctrine policy gate.

Project 28 becomes the Kingsmen lesson for:

- trusted connector registry
- typed tool manifests
- connector policy gate
- tool schema verification
- security scanning
- tool budget control
- evidence-bound invocation
- approval-required production tools
- MCP-style gateway without losing Kingsmen authority
