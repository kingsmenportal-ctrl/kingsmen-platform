# PJ_PUBLIC_JARVIS_25_AUTOGEN

Status: RECORDED_REFERENCE_STUDY
Branch: main
Project: Microsoft AutoGen
Repository: https://github.com/microsoft/autogen
Checked date: 2026-06-15
Kingsmen use: PATTERN_STUDY_ONLY
Runtime dependency decision: DO_NOT_DEPEND_AS_FOUNDATION

## 1. Public source summary

AutoGen is a Microsoft-origin open-source framework for creating multi-agent AI applications that can act autonomously or work alongside humans.

Important current warning: the public README marks AutoGen as in maintenance mode. It says AutoGen will not receive new features or enhancements and is community-managed going forward. New users are directed to Microsoft Agent Framework as the enterprise-ready successor.

This means Kingsmen must study AutoGen for architecture patterns, not adopt it as the core runtime foundation.

Observed public facts from the repository page:

- Repository: microsoft/autogen
- Public project
- About: A programming framework for agentic AI
- Approximate stars at check time: 59k
- Approximate forks at check time: 8.9k
- Approximate commits at check time: 3,782
- Main folders include docs, dotnet, protos, python, and configuration/support files.
- README says AutoGen requires Python 3.10 or later.
- README shows AgentChat installation with autogen-agentchat and autogen-ext.
- README includes AutoGen Studio as a no-code GUI for prototyping multi-agent workflows.
- README warns that only trusted MCP servers should be connected because they may execute local commands or expose sensitive information.

## 2. Why this matters to Kingsmen Jarvis

AutoGen gives Kingsmen the multi-agent role-and-message pattern.

Kingsmen Jarvis cannot be one large uncontrolled AI brain. It needs named workers with clear duties, bounded tools, evidence, and founder approval.

Useful lesson:

```text
command
  -> mode manager
  -> specialist agents / skills
  -> message passing
  -> tool execution under policy
  -> evidence ledger
  -> final response
```

AutoGen also shows that multi-agent systems need developer tools for prototyping, visual inspection, debugging, and benchmarking.

## 3. Kingsmen adaptation

Kingsmen should adapt these concepts:

```text
JarvisAgentRoleRegistry
JarvisMessageBus
JarvisSpecialistAgentContract
JarvisAgentToolWrapper
JarvisAgentChatPattern
JarvisMultiAgentPrototypeStudio
JarvisAgentBenchHarness
JarvisMcpTrustPolicy
JarvisTeamRunTranscript
JarvisAgentDelegationBoundary
JarvisAgentCapabilityCard
JarvisHumanSidecarMode
```

## 4. Kingsmen specialist-agent map

AutoGen-style roles become Kingsmen-controlled specialists:

```text
FounderCommander
  -> receives approved founder commands only

DoctrineGuardianAgent
  -> checks locked Kingsmen doctrine, POPIA, no-useless-layer rule

RepoBuilderAgent
  -> edits repo files only inside approved scope

ValidatorAgent
  -> runs tests, validators, boot-blockers, and evidence checks

ResearchAgent
  -> verifies public sources and source confidence

ConnectorPlannerAgent
  -> prepares GitHub/Airtable/n8n/Supabase/Google/PayFast actions in dry-run mode

CommsDraftAgent
  -> drafts email/status replies but does not mass-send

SecurityReviewAgent
  -> checks secrets, unsafe logs, permission risk, and production gates
```

No agent receives production authority by default.

## 5. Kingsmen rejection list

Kingsmen must reject:

```text
AutoGen as the runtime foundation while it is in maintenance mode
unbounded multi-agent autonomy
agents selecting their own production tools
MCP servers without trust classification
local command execution through MCP without approval
agent group chats that override deterministic state machine rules
AutoGen Studio as a production control panel
specialist agents writing doctrine
candidate data in free-form agent conversations
secrets in prompts, logs, transcripts, or Studio config
benchmark scores replacing Kingsmen validators
```

## 6. Kingsmen implementation direction

Kingsmen should not begin with a large multi-agent swarm.

Correct order:

```text
1. Build JarvisMiniBuilderCore.
2. Add JarvisModeManager.
3. Add JarvisAgentRoleRegistry.
4. Add only necessary specialist agents.
5. Add message/evidence transcript.
6. Add validator-first repair loop.
7. Add multi-agent delegation only when it proves useful.
```

This obeys the no-useless-layer law.

## 7. Kingsmen runtime boundary

AutoGen-inspired specialist agents may assist, but authority remains:

```text
PostgreSQL Truth Vault
Backend API state machine
locked doctrine files
GitHub evidence
validators and boot-blockers
founder approval
```

Agent outputs are advice or drafts until validated and approved.

## 8. Fit into final Kingsmen Jarvis

```text
Founder HUD / voice / chat
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> DoctrinePolicyGate
  -> AgentRoleRegistry
  -> SpecialistAgentDelegation
  -> ToolPolicyGate
  -> ValidatorAgent
  -> EvidenceLedger
  -> HumanApprovalGate if risky
  -> ResponseComposer
```

## 9. Final Kingsmen decision

AutoGen is useful for:

```text
multi-agent role separation
agent-to-agent message passing
AgentChat-style prototyping
MCP trust warnings
AutoGen Studio-style visual prototyping
benchmark/evaluation thinking
```

AutoGen is not selected as a Kingsmen core dependency because it is in maintenance mode and Microsoft points new users to Microsoft Agent Framework.

Kingsmen may later study Microsoft Agent Framework separately as a successor reference, but Kingsmen Jarvis must still remain Kingsmen-controlled, repo-first, validator-first, and approval-gated.
