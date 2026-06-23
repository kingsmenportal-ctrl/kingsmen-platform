"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./JarvisProductionCommand.module.css";

type JarvisCommand = {
  id: string;
  title: string;
  description: string;
  category: string;
  risk: string;
};

type JarvisStatusPayload = {
  ok?: boolean;
  generatedAt?: string;
  backendBoundary?: {
    mode?: string;
    baseUrl?: string;
    configured?: boolean;
  };
  backendHealthStatus?: number;
  backendHealth?: Record<string, unknown> | null;
  cards?: Array<{ key: string; title: string; state: string; detail: string; ok: boolean }>;
  commands?: JarvisCommand[];
  doctrine?: string[];
};

type LiveIndexEntry = {
  id: string;
  title: string;
  group?: string;
  state: string;
  detail: string;
  launchCritical?: boolean;
  boundaryRoute?: string;
  evidenceRef?: string;
};

type LiveIndexPayload = {
  schema?: string;
  generatedAt?: string;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  runtimeBlocker?: string | null;
  backendHealthStatus?: number;
  backendStorageMode?: string;
  openClawRuntimeProven?: boolean;
  summary?: {
    total?: number;
    live?: number;
    sourceReady?: number;
    pendingRuntimeProof?: number;
    pendingCredentials?: number;
    deferred?: number;
    blockedByLocalDocker?: number;
  };
  entries?: LiveIndexEntry[];
};

type AcceptanceGatePayload = {
  generatedAt?: string;
  productionReady?: boolean;
  publicLaunchAllowed?: boolean;
  acceptanceDecision?: string;
  launchBlocked?: boolean;
  launchBlockingCount?: number;
  counts?: Record<string, number>;
  gates?: Array<{ id: string; title: string; state: string; launchCritical?: boolean; proofGateRoute?: string; requiredEvidence?: string[] }>;
  launchBlocking?: Array<{ id: string; title: string; state: string; launchCritical?: boolean; proofGateRoute?: string; requiredEvidence?: string[] }>;
};

type JarvisCommandResponse = {
  ok: boolean;
  commandId: string;
  backendCommandId?: string;
  correlationId?: string;
  idempotencyKey?: string;
  title?: string;
  category?: string;
  risk?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  stdout?: string;
  stderr?: string;
  backendStatus?: number;
  backendStorageMode?: string | null;
  evidencePath?: string | null;
  localShellExecuted?: boolean;
  localFileWritten?: boolean;
  directDatabaseAccessFromWeb?: boolean;
  message?: string;
};

type JarvisEvent = {
  id: string;
  role: "founder" | "jarvis" | "system";
  title: string;
  detail: string;
  ok?: boolean;
  commandId?: string;
  stdout?: string;
  stderr?: string;
  evidencePath?: string | null;
  generatedAt: string;
};

const fallbackCommands: JarvisCommand[] = [
  { id: "COMMAND_PERSISTENCE_PROOF", title: "Truth Vault command evidence", description: "Prove backend command_log and audit_events write boundary.", category: "Evidence", risk: "SAFE_READ" },
  { id: "OPENCLAW_OPERATOR_POLICY_CHECK", title: "OpenClaw operator policy", description: "Confirm OpenClaw remains operator-only and cannot bypass policy.", category: "OpenClaw", risk: "SAFE_READ" },
  { id: "PLAYWRIGHT_SCOUT_MAP_FALLBACK_CHECK", title: "Playwright MAP fallback", description: "Confirm scout/probe-only automation and manual fallback doctrine.", category: "Automation", risk: "SAFE_READ" },
  { id: "AI_PROVIDER_ROUTER_CHECK", title: "AI provider router", description: "Review backend-controlled AI provider readiness without exposing keys.", category: "AI", risk: "SAFE_READ" },
  { id: "EMAIL_PRIMARY_CHANNEL_CHECK", title: "Email primary channel", description: "Review email-first evidence boundary; WhatsApp and SMS cannot replace it.", category: "Communications", risk: "SAFE_READ" },
  { id: "PAYFAST_PROVIDER_PROOF_QUEUE_CHECK", title: "PayFast proof queue", description: "Review PayFast sandbox, ITN, duplicate, failed-payment, and founder approval gates.", category: "Payments", risk: "SAFE_READ" },
  { id: "N8N_THIN_RELAY_CHECK", title: "n8n thin relay", description: "Review n8n as relay-only with no direct Truth Vault authority.", category: "Automation", risk: "SAFE_READ" },
  { id: "GITHUB_TOOL_CONNECTOR_CHECK", title: "GitHub connector", description: "Review redacted GitHub connector boundary and repository metadata proof.", category: "Tools", risk: "SAFE_READ" }
];

function stamp() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function stateClass(state?: string) {
  const value = (state ?? "PENDING_RUNTIME_PROOF").toUpperCase();
  if (["LIVE", "RUNTIME_PASSED", "ACCEPTED_PREVIOUS_RUNTIME", "ACCEPTED_SOURCE"].includes(value)) return styles.stateLive;
  if (value.includes("SOURCE")) return styles.stateSource;
  if (value.includes("BLOCK") || value.includes("REJECT")) return styles.stateBlocked;
  if (value.includes("DEFER")) return styles.stateDeferred;
  return styles.statePending;
}

async function readJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as T;
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return payload;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "en-ZA";
  voice.rate = 0.92;
  voice.pitch = 0.85;
  window.speechSynthesis.speak(voice);
}

function speechRecognitionConstructor() {
  const api = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return api.SpeechRecognition || api.webkitSpeechRecognition;
}

export default function JarvisProductionCommandClient() {
  const [status, setStatus] = useState<JarvisStatusPayload | null>(null);
  const [liveIndex, setLiveIndex] = useState<LiveIndexPayload | null>(null);
  const [gate, setGate] = useState<AcceptanceGatePayload | null>(null);
  const [proofQueue, setProofQueue] = useState<Record<string, unknown> | null>(null);
  const [credentials, setCredentials] = useState<Record<string, unknown> | null>(null);
  const [selectedCommandId, setSelectedCommandId] = useState("COMMAND_PERSISTENCE_PROOF");
  const [commandContext, setCommandContext] = useState("Run one live backend-safe Jarvis proof and return redacted evidence.");
  const [events, setEvents] = useState<JarvisEvent[]>([
    {
      id: newId("boot"),
      role: "system",
      title: "Unified Jarvis booted",
      detail: "One Jarvis surface is loading live index, command boundary, proof queue, acceptance gate, credentials and evidence. No split command room. No fake production claim.",
      ok: true,
      generatedAt: stamp()
    }
  ]);
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [voiceState, setVoiceState] = useState("standby");
  const [visualActive, setVisualActive] = useState(false);
  const [errorText, setErrorText] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const liveEntries = liveIndex?.entries ?? [];
  const commands = status?.commands?.length ? status.commands : fallbackCommands;
  const selectedCommand = commands.find((command) => command.id === selectedCommandId) ?? commands[0];
  const launchBlocking = gate?.launchBlocking ?? [];
  const gateList = gate?.gates ?? [];
  const queueItems = useMemo(() => {
    if (!proofQueue) return [];
    return [
      ...toArray((proofQueue as Record<string, unknown>).proofs),
      ...toArray((proofQueue as Record<string, unknown>).queue),
      ...toArray((proofQueue as Record<string, unknown>).items),
      ...toArray((proofQueue as Record<string, unknown>).entries)
    ].slice(0, 8);
  }, [proofQueue]);

  const backendLive = liveIndex?.backendHealthStatus === 200 || status?.backendHealthStatus === 200;
  const truthVaultLive = liveIndex?.backendStorageMode === "postgres_truth_vault" || status?.backendHealth?.storageMode === "postgres_truth_vault";
  const runtimeLive = Boolean(backendLive && truthVaultLive && !liveIndex?.runtimeBlocker);
  const productionReady = Boolean(liveIndex?.productionReady || gate?.productionReady);
  const publicLaunchAllowed = Boolean(liveIndex?.publicLaunchAllowed || gate?.publicLaunchAllowed);
  const launchBlocked = gate?.launchBlocked ?? !publicLaunchAllowed;
  const launchBlockerCount = gate?.launchBlockingCount ?? launchBlocking.length;
  const credentialCount = Number((credentials?.credentialCount ?? credentials?.total ?? credentials?.requiredCredentialCount ?? 0) as number);
  const credentialReady = Number((credentials?.readyCredentialCount ?? credentials?.configuredCount ?? credentials?.ready ?? 0) as number);
  const evidenceEvents = events.filter((event) => event.evidencePath || event.stdout || event.stderr);

  const systemLine = runtimeLive
    ? "Backend and Truth Vault are online. Provider/payment/security evidence still controls launch."
    : liveIndex?.runtimeBlocker ?? errorText ?? "Waiting for live boundary.";

  async function loadJarvis() {
    setRefreshing(true);
    const [statusResult, liveIndexResult, gateResult, queueResult, credentialResult] = await Promise.allSettled([
      readJson<JarvisStatusPayload>("/api/jarvis/status"),
      readJson<LiveIndexPayload>("/api/jarvis/live-index"),
      readJson<AcceptanceGatePayload>("/api/jarvis/live-proof-acceptance-gate"),
      readJson<Record<string, unknown>>("/api/jarvis/live-proof-queue"),
      readJson<Record<string, unknown>>("/api/jarvis/provider-credential-checklist")
    ]);

    if (statusResult.status === "fulfilled") {
      setStatus(statusResult.value);
      const firstCommand = statusResult.value.commands?.[0]?.id;
      if (firstCommand) setSelectedCommandId((current) => current || firstCommand);
    }

    if (liveIndexResult.status === "fulfilled") setLiveIndex(liveIndexResult.value);
    if (gateResult.status === "fulfilled") setGate(gateResult.value);
    if (queueResult.status === "fulfilled") setProofQueue(queueResult.value);
    if (credentialResult.status === "fulfilled") setCredentials(credentialResult.value);

    const errors = [statusResult, liveIndexResult, gateResult, queueResult, credentialResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason instanceof Error ? result.reason.message : "Jarvis request failed.");

    setErrorText(errors.join(" · "));
    setRefreshing(false);
  }

  async function runCommand(commandId = selectedCommand?.id) {
    if (!commandId || running) return;
    const command = commands.find((item) => item.id === commandId);
    setRunning(true);
    setEvents((items) => [
      ...items,
      {
        id: newId("founder"),
        role: "founder",
        title: command?.title ?? commandId,
        detail: commandContext || "No additional context supplied.",
        ok: true,
        commandId,
        generatedAt: stamp()
      }
    ]);

    try {
      const response = await fetch("/api/jarvis/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          commandId,
          clientRequestId: newId("jarvis_ui"),
          context: commandContext,
          surface: "unified_jarvis_surface",
          localShellRequested: false,
          directDatabaseAccessRequested: false
        })
      });
      const payload = (await response.json()) as JarvisCommandResponse;
      const ok = response.ok && payload.ok !== false;
      const detail = payload.message || payload.stdout || payload.stderr || "Backend command boundary responded.";
      setEvents((items) => [
        ...items,
        {
          id: newId("jarvis"),
          role: "jarvis",
          title: payload.title ?? command?.title ?? commandId,
          detail,
          ok,
          commandId,
          stdout: payload.stdout,
          stderr: payload.stderr,
          evidencePath: payload.evidencePath ?? null,
          generatedAt: stamp()
        }
      ]);
      speak(ok ? `${payload.title ?? commandId} accepted by backend.` : `Command needs review.`);
      await loadJarvis();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Jarvis command request failed.";
      setEvents((items) => [
        ...items,
        { id: newId("jarvis_error"), role: "jarvis", title: "Command boundary failed", detail: message, ok: false, commandId, generatedAt: stamp() }
      ]);
      speak("Jarvis command boundary failed.");
    } finally {
      setRunning(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runCommand();
  }

  async function startVoice() {
    const Recognition = speechRecognitionConstructor();
    if (!Recognition) {
      setVoiceState("unsupported");
      speak("Voice is unsupported in this browser. Use Chrome or Edge.");
      return;
    }
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((track) => track.stop());
    } catch {
      setVoiceState("microphone blocked");
      speak("Microphone access is blocked.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-ZA";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceState("listening");
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setCommandContext(transcript);
      setVoiceState(`heard: ${transcript}`);
    };
    recognition.onerror = (event: any) => setVoiceState(`voice error: ${event?.error ?? "unknown"}`);
    recognition.onend = () => setVoiceState((current) => (current === "listening" ? "standby" : current));
    recognition.start();
  }

  async function toggleVisual() {
    if (visualActive) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setVisualActive(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setVisualActive(true);
    } catch {
      setVisualActive(false);
    }
  }

  useEffect(() => {
    loadJarvis();
    const id = window.setInterval(loadJarvis, 15000);
    return () => {
      window.clearInterval(id);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <main className={styles.shell}>
      <div className={styles.horizon} />
      <section className={styles.wrap}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>KINGSMEN LIVE OPERATING SYSTEM</span>
            <h1>JARVIS</h1>
            <p>One founder cockpit for runtime state, command execution, proof queue, acceptance gates, credentials, evidence and visual context. No duplicate Jarvis rooms. No fake launch claim.</p>
            <div className={styles.actions}>
              <button className={styles.primary} onClick={loadJarvis} disabled={refreshing}>{refreshing ? "Syncing" : "Sync Jarvis"}</button>
              <button onClick={() => runCommand("COMMAND_PERSISTENCE_PROOF")} disabled={running}>Truth Vault proof</button>
              <button onClick={startVoice}>Voice: {voiceState}</button>
              <button onClick={toggleVisual}>{visualActive ? "Stop visual" : "Start visual"}</button>
            </div>
          </div>

          <aside className={styles.corePanel}>
            <div className={`${styles.statusOrb} ${runtimeLive ? styles.online : styles.offline}`}>
              <span className={styles.orbRing} />
              <b>J</b>
            </div>
            <strong>{runtimeLive ? "RUNTIME ONLINE" : "SYNCING RUNTIME"}</strong>
            <small>{systemLine}</small>
          </aside>
        </header>

        <section className={styles.quickStats}>
          <article className={runtimeLive ? styles.statOk : styles.statWarn}><span>runtime</span><strong>{runtimeLive ? "LIVE" : "WAIT"}</strong></article>
          <article><span>backend</span><strong>{backendLive ? "HTTP 200" : "PENDING"}</strong></article>
          <article><span>truth vault</span><strong>{truthVaultLive ? "POSTGRES" : "PENDING"}</strong></article>
          <article><span>live cards</span><strong>{liveIndex?.summary?.live ?? 0}</strong></article>
          <article className={launchBlocked ? styles.statWarn : styles.statOk}><span>launch blockers</span><strong>{launchBlockerCount}</strong></article>
          <article><span>credentials</span><strong>{credentialReady}/{credentialCount}</strong></article>
          <article><span>production</span><strong>{productionReady ? "TRUE" : "FALSE"}</strong></article>
          <article><span>public launch</span><strong>{publicLaunchAllowed ? "TRUE" : "FALSE"}</strong></article>
        </section>

        {errorText ? <section className={styles.alert}>Partial load: {errorText}</section> : null}

        <section className={styles.bodyGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.kicker}>Live operating spine</span>
              <button onClick={() => window.open("/api/jarvis/live-index", "_blank", "noopener,noreferrer")}>JSON</button>
            </div>
            <div className={styles.liveList}>
              {liveEntries.length ? liveEntries.map((entry) => (
                <article key={entry.id} className={styles.liveItem}>
                  <span className={`${styles.statePill} ${stateClass(entry.state)}`}>{entry.state}</span>
                  <strong>{entry.title}</strong>
                  <p>{entry.detail}</p>
                  {entry.boundaryRoute ? <code>{entry.boundaryRoute}</code> : null}
                </article>
              )) : <p className={styles.empty}>Waiting for the live index. This is unavailable until the web route responds.</p>}
            </div>
          </section>

          <section className={`${styles.panel} ${styles.commandConsole}`}>
            <div className={styles.panelHeader}>
              <span className={styles.kicker}>Backend-safe command core</span>
              <b>{running ? "EXECUTING" : "READY"}</b>
            </div>
            <form onSubmit={submit} className={styles.commandForm}>
              <select value={selectedCommandId} onChange={(event) => setSelectedCommandId(event.target.value)}>
                {commands.map((command) => <option key={command.id} value={command.id}>{command.title}</option>)}
              </select>
              <textarea value={commandContext} onChange={(event) => setCommandContext(event.target.value)} />
              <button className={styles.primary} disabled={running || !selectedCommand}>{running ? "Running" : "Send to backend"}</button>
            </form>
            <div className={styles.commandGrid}>
              {commands.map((command) => (
                <button key={command.id} className={styles.commandButton} onClick={() => {
                  setSelectedCommandId(command.id);
                  runCommand(command.id);
                }} disabled={running}>
                  <span>{command.category}</span>
                  <strong>{command.title}</strong>
                  <small>{command.description}</small>
                </button>
              ))}
            </div>
            <div className={styles.timeline}>
              {events.slice(-10).reverse().map((event) => (
                <article key={event.id} className={event.ok === false ? styles.eventBad : styles.event}>
                  <div><strong>{event.role.toUpperCase()} · {event.title}</strong><span>{new Date(event.generatedAt).toLocaleTimeString()}</span></div>
                  <p>{event.detail}</p>
                  {event.stdout ? <pre>{event.stdout}</pre> : null}
                  {event.stderr ? <pre>{event.stderr}</pre> : null}
                  {event.evidencePath ? <code>Evidence: {event.evidencePath}</code> : null}
                </article>
              ))}
            </div>
          </section>

          <aside className={styles.sideStack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.kicker}>Launch gates</span>
                <button onClick={() => window.open("/api/jarvis/live-proof-acceptance-gate", "_blank", "noopener,noreferrer")}>JSON</button>
              </div>
              <div className={styles.gateList}>
                {(launchBlocking.length ? launchBlocking : gateList).slice(0, 8).map((item) => (
                  <article key={item.id} className={styles.gateItem}>
                    <span className={`${styles.statePill} ${stateClass(item.state)}`}>{item.state}</span>
                    <strong>{item.title}</strong>
                    {item.proofGateRoute ? <code>{item.proofGateRoute}</code> : null}
                  </article>
                ))}
                {!launchBlocking.length && !gateList.length ? <p className={styles.empty}>Waiting for acceptance gate.</p> : null}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.kicker}>Proof queue</span>
                <button onClick={() => window.open("/api/jarvis/live-proof-queue", "_blank", "noopener,noreferrer")}>JSON</button>
              </div>
              <div className={styles.gateList}>
                {queueItems.length ? queueItems.map((item: any, index) => (
                  <article key={item.id ?? index} className={styles.gateItem}>
                    <span className={`${styles.statePill} ${stateClass(item.state)}`}>{item.state ?? "PENDING"}</span>
                    <strong>{item.title ?? item.id ?? `Proof item ${index + 1}`}</strong>
                    {item.proofRoute ? <code>{item.proofRoute}</code> : null}
                  </article>
                )) : <p className={styles.empty}>Queue route loaded when available. Values hidden.</p>}
              </div>
            </section>

            <section className={styles.visualPanel}>
              <video ref={videoRef} autoPlay muted playsInline className={visualActive ? styles.videoLive : styles.videoHidden} />
              {!visualActive ? <span>Visual standby</span> : null}
            </section>
          </aside>
        </section>

        <section className={styles.dock}>
          <article><span>Evidence drawer</span><strong>{evidenceEvents.length}</strong></article>
          <article><span>Acceptance</span><strong>{gate?.acceptanceDecision ?? "PENDING"}</strong></article>
          <article><span>Storage</span><strong>{liveIndex?.backendStorageMode ?? "UNKNOWN"}</strong></article>
          <article><span>Last sync</span><strong>{new Date(liveIndex?.generatedAt ?? gate?.generatedAt ?? status?.generatedAt ?? stamp()).toLocaleTimeString()}</strong></article>
        </section>
      </section>
    </main>
  );
}
