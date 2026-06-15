# PJ_PUBLIC_JARVIS_26 — Microsoft Semantic Kernel / Agent Framework Transition

Status: RECORDED
Branch recorded: main
Scope: Kingsmen Jarvis public reference study
Reference type: public open-source agent/orchestration framework study
Primary public reference: microsoft/semantic-kernel

---

## 1. Public project studied

Project:

```txt
microsoft/semantic-kernel
```

Current public positioning:

Semantic Kernel is a Microsoft open-source SDK for building, orchestrating, and deploying AI agents and multi-agent systems. Its current README says Semantic Kernel is now Microsoft Agent Framework, and that Microsoft Agent Framework is the enterprise-ready successor with stable APIs, multi-agent orchestration, multi-provider model support, and cross-runtime interoperability through A2A and MCP.

This means Kingsmen should study Semantic Kernel as both:

1. a plugin/orchestration pattern, and
2. a migration warning: do not bind Kingsmen Jarvis to a framework that is being repositioned unless the runtime dependency is separately approved.

---

## 2. Why this matters for Kingsmen Jarvis

Kingsmen Jarvis needs a disciplined way to expose real functions to AI without letting AI become the authority.

The useful pattern is:

```txt
agent request
  -> declared plugin/tool
  -> typed function
  -> policy gate
  -> approval gate if risky
  -> execution adapter
  -> result contract
  -> evidence ledger
```

Semantic Kernel shows how AI agents can call plugins, use prompt templates, connect to OpenAPI/MCP tools, route across model providers, use vector databases, process multimodal inputs, and participate in structured multi-agent workflows.

Kingsmen must adapt the architecture, not surrender control to it.

---

## 3. Kingsmen lesson

Project 26 gives Kingsmen the **plugin-orchestrated agent runtime** lesson.

Jarvis cannot call arbitrary code directly.

Jarvis must call named Kingsmen tools through a declared contract:

```txt
JarvisPlugin
  -> JarvisFunction
  -> KingsmenPolicyGate
  -> RiskClassifier
  -> ApprovalGate if risky
  -> ToolAdapter
  -> EvidenceLedger
```

This fits the already locked Jarvis connector law.

---

## 4. What Kingsmen should adapt

```txt
JarvisKernel
JarvisPluginRegistry
JarvisFunctionContract
JarvisToolInvocationPolicy
JarvisModelProviderRouter
JarvisMultiAgentOrchestrator
JarvisProcessFramework
JarvisMcpGateway
JarvisOpenApiToolBridge
JarvisVectorMemoryAdapter
JarvisMultimodalInputRouter
JarvisStructuredOutputContract
JarvisAgentMigrationWatch
```

---

## 5. What Kingsmen must reject

```txt
framework as final authority
agent framework replacing backend state machine
plugins bypassing doctrine policy gate
MCP/OpenAPI tools without trust classification
secrets in plugin configuration or logs
production connector actions from a normal chat agent
multi-agent orchestration before the mini builder core is proven
model routing without cost/risk policy
candidate data sent into vector memory without POPIA boundary
adopting a changing runtime without migration plan
```

---

## 6. Kingsmen implementation shape

```txt
Founder HUD / voice / chat
  -> JarvisCommandIntake
  -> JarvisModeManager
  -> DoctrinePolicyGate
  -> JarvisKernel
  -> PluginRegistry
  -> FunctionContractResolver
  -> RiskClassifier
  -> ApprovalGate if risky
  -> ToolAdapter / AppConnector / BuilderCore / ResearchAgent
  -> StructuredOutputContract
  -> EvidenceLedger
  -> ResponseComposer
```

---

## 7. Correct Kingsmen build order

```txt
1. JarvisMiniBuilderCore
2. JarvisCommandRegistry
3. JarvisPluginRegistry
4. JarvisFunctionContract
5. Policy and risk checks on every function
6. Validator-backed execution
7. MCP/OpenAPI bridge only after trust classification
8. Multi-agent orchestration only after evidence works
```

This obeys the Kingsmen rule:

```txt
No useless layers.
```

---

## 8. Final Kingsmen decision

Semantic Kernel / Microsoft Agent Framework is useful as a reference for plugin orchestration, model-provider routing, multi-agent structure, MCP/OpenAPI bridges, and typed function invocation.

It is not Kingsmen's brain.

Kingsmen authority remains:

```txt
PostgreSQL Truth Vault
Backend API state machine
GitHub repository
Kingsmen doctrine files
validators and boot-blockers
founder approval
```
