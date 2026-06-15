# PJ_PUBLIC_JARVIS_27_CREWAI

Status: RECORDED
Branch recorded: main
Project number: 27
Public reference: crewAIInc/crewAI
Public URL: https://github.com/crewAIInc/crewAI
Study type: pattern study only
Kingsmen decision: adapt selected patterns; do not make CrewAI the Kingsmen brain

---

## 1. Public project snapshot

CrewAI is a public Python framework for orchestrating role-playing autonomous AI agents.

Public page description:

> Framework for orchestrating role-playing, autonomous AI agents. By fostering collaborative intelligence, CrewAI empowers agents to work together seamlessly, tackling complex tasks.

Observed public signals on 2026-06-15:

- Repository: crewAIInc/crewAI
- Visibility: public
- Stars shown: about 53.6k
- Forks shown: about 7.5k
- Commits shown: about 2,526
- License shown: MIT
- Main README positioning: fast and flexible multi-agent automation framework
- Core split: CrewAI Crews and CrewAI Flows

CrewAI presents two complementary patterns:

1. Crews — teams of agents with autonomy, collaboration, delegation, specialized roles, goals, and flexible problem-solving.
2. Flows — event-driven workflows with precise control, structured state, conditional routing, and production-style orchestration.

---

## 2. Why this matters to Kingsmen Jarvis

Kingsmen Jarvis must eventually use specialist helpers, but it must not become an uncontrolled group chat of agents.

The useful lesson from CrewAI is not "let agents do everything".

The useful lesson is:

```txt
Role-based specialists are useful only when wrapped inside controlled flows, declared tasks, typed outputs, policy gates, validation, and evidence.
```

Kingsmen already has the correct authority model:

```txt
Founder command
  -> Kingsmen doctrine
  -> backend policy/state machine
  -> mode manager
  -> task contract
  -> tool approval
  -> validator proof
  -> evidence ledger
```

CrewAI helps name a future pattern:

```txt
specialist agent + task + expected output + allowed tools + flow step + validation result
```

---

## 3. Kingsmen adaptation

Adapt these concepts:

```txt
JarvisCrewContract
JarvisSpecialistRoleCard
JarvisTaskContract
JarvisExpectedOutputSchema
JarvisFlowStep
JarvisFlowState
JarvisFlowRouter
JarvisCrewStepWrapper
JarvisDelegationPolicy
JarvisHumanReviewTask
JarvisAgentGuardrailConfig
JarvisStructuredTaskOutput
JarvisCrewTelemetryBoundary
JarvisEnterpriseControlPlaneLater
```

Use specialist roles only where they are necessary:

```txt
DoctrineGuardianAgent
RepoBuilderAgent
ValidatorAgent
ResearchVerifierAgent
ConnectorPlannerAgent
CommsDraftAgent
SecurityReviewAgent
FinancePolicyAgent
```

Each specialist must have:

```txt
role
purpose
allowed modes
allowed tools
forbidden tools
input contract
output contract
evidence requirement
approval boundary
validator requirement
```

---

## 4. Correct Kingsmen interpretation of Crews and Flows

CrewAI Crews map to Kingsmen specialist collaboration.

Kingsmen version:

```txt
JarvisCrew
  -> named specialist roles
  -> no self-granted authority
  -> no production connector access by default
  -> no direct state transitions
```

CrewAI Flows map to Kingsmen controlled execution.

Kingsmen version:

```txt
JarvisControlledFlow
  -> declared state
  -> declared step
  -> declared tool access
  -> decision router
  -> policy gate
  -> human review checkpoint
  -> validator step
  -> evidence step
```

For Kingsmen, Flows are safer than free Crews.

Build order:

```txt
1. Mini Builder Core
2. Mode Manager
3. Task Contract
4. Validator Runner
5. Evidence Ledger
6. Controlled Flow
7. Specialist role registry
8. Crew wrapper only when necessary
```

---

## 5. What Kingsmen must reject

Reject:

```txt
agent crews as the default brain
agents delegating production authority to each other
auto-generated specialist roles without founder approval
unbounded crew memory
crew conversations becoming truth
tasks without expected output schemas
external tools without trust classification
MCP/docs tools bypassing source-confidence rules
telemetry or share settings that expose sensitive context
candidate data in agent backstories, prompts, memory, or traces
crew flows replacing the Kingsmen backend state machine
enterprise control plane becoming the source of truth
```

CrewAI mentions telemetry and optional deeper sharing modes. Kingsmen must keep telemetry off by default for sensitive operations and must never share candidate, founder, payment, document, credential, or production data into third-party telemetry.

---

## 6. Kingsmen-safe flow pattern

```txt
Founder command
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> DoctrinePolicyGate
  -> TaskContractBuilder
  -> ControlledFlowState
  -> SpecialistStep if necessary
  -> ToolPolicyGate
  -> HumanReviewTask if risky
  -> ValidatorStep
  -> EvidenceLedger
  -> ResponseComposer
```

Example:

```txt
Task: Fix N04 validator failure

Flow:
1. DoctrineGuardianAgent checks locked rules.
2. RepoBuilderAgent proposes minimal patch.
3. ValidatorAgent runs targeted checks.
4. SecurityReviewAgent checks secrets and forbidden edits.
5. EvidenceLedger records changed files, commands, and result.
6. Founder approves commit.
```

No agent can approve its own risky action.

---

## 7. Kingsmen final decision

CrewAI is useful as a design reference for:

```txt
role cards
task contracts
expected outputs
human review tasks
controlled flows
specialist collaboration
enterprise observability ideas
```

CrewAI is not the Kingsmen core brain.

Kingsmen Jarvis must remain:

```txt
repo-first
validator-first
policy-gated
founder-approved
Oracle Lite realistic
no useless layers
```
