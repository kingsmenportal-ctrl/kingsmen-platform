"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./JarvisProductionCommand.module.css";

type JarvisStatusCard = {
  key: string;
  title: string;
  state: string;
  detail: string;
  ok: boolean;
};

type JarvisCommand = {
  id: string;
  title: string;
  description: string;
  category: string;
  risk: string;
};

type JarvisStatusPayload = {
  ok: boolean;
  generatedAt: string;
  backendBoundary?: {
    mode?: string;
    baseUrl?: string;
    configured?: boolean;
  };
  backendHealthStatus?: number;
  backendHealth?: Record<string, unknown> | null;
  cards?: JarvisStatusCard[];
  commands?: JarvisCommand[];
  doctrine?: string[];
};

type CompletionState = "SOURCE_READY" | "RUNTIME_PASSED" | "PENDING_RUNTIME_PROOF" | "PENDING_CREDENTIALS" | "DEFERRED" | "BLOCKED_BY_LOCAL_DOCKER";

type CompletionItem = {
  id: string;
  title: string;
  group: string;
  state: CompletionState;
  detail: string;
  validatorScript?: string;
  runtimeProofScript?: string;
  boundaryRoute?: string;
  evidenceRef?: string;
  launchCritical: boolean;
};

type CompletionBoardPayload = {
  schema: string;
  module: string;
  generatedAt: string;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  dockerIndependentBuildAllowed: boolean;
  noFakeData: boolean;
  rawSecretsReturned: boolean;
  localShellExecuted: boolean;
  directDatabaseAccessFromWeb: boolean;
  counts?: Record<CompletionState, number>;
  completionItems?: CompletionItem[];
  nextSourceBatches?: string[];
  nextRuntimeGate?: string;
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
  schema: string;
  generatedAt: string;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  dockerIndependentBuildAllowed?: boolean;
  runtimeBlocker?: string;
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
  backendPolicy?: unknown;
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

function stamp() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function riskTone(risk?: string) {
  const value = (risk ?? "SAFE_READ").toLowerCase();
  if (value.includes("approval")) return styles.riskApproval;
  if (value.includes("review")) return styles.riskReview;
  return styles.riskSafe;
}

function normalizeHealthStatus(status?: JarvisStatusPayload | null) {
  if (!status) return "CONNECTING";
  if (status.ok) return "ONLINE";
  return "REVIEW";
}

function stateClass(state?: string) {
  const value = state ?? "PENDING_RUNTIME_PROOF";
  if (value === "RUNTIME_PASSED" || value === "LIVE") return styles.runtimePassed;
  if (value === "SOURCE_READY" || value === "DOCKER_INDEPENDENT_SOURCE_READY") return styles.sourceReady;
  if (value === "BLOCKED_BY_LOCAL_DOCKER" || value.includes("BLOCKED")) return styles.blockedState;
  if (value === "DEFERRED") return styles.deferredState;
  return styles.pendingState;
}

function countFor(board: CompletionBoardPayload | null, state: CompletionState) {
  return board?.counts?.[state] ?? 0;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "en-ZA";
  voice.rate = 0.95;
  voice.pitch = 0.9;
  window.speechSynthesis.speak(voice);
}

function speechRecognitionConstructor() {
  const api = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return api.SpeechRecognition || api.webkitSpeechRecognition;
}

async function readJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as T;
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return payload;
}

export default function JarvisProductionCommandClient() {
  const [status, setStatus] = useState<JarvisStatusPayload | null>(null);
  const [completionBoard, setCompletionBoard] = useState<CompletionBoardPayload | null>(null);
  const [liveIndex, setLiveIndex] = useState<LiveIndexPayload | null>(null);
  const [statusError, setStatusError] = useState<string>("");
  const [selectedCommandId, setSelectedCommandId] = useState<string>("");
  const [commandContext, setCommandContext] = useState<string>("Run live backend-safe proof and return evidence.");
  const [events, setEvents] = useState<JarvisEvent[]>([
    {
      id: newId("boot"),
      role: "system",
      title: "Jarvis production shell booting",
      detail: "This surface reads Jarvis status, completion board, live index, and whitelisted backend command boundaries. No fake data is rendered as truth.",
      ok: true,
      generatedAt: stamp()
    }
  ]);
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [voiceState, setVoiceState] = useState("voice standby");
  const [visualActive, setVisualActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const commands = status?.commands ?? [];
  const selectedCommand = commands.find((command) => command.id === selectedCommandId) ?? commands[0];
  const statusCards = status?.cards ?? [];
  const doctrine = status?.doctrine ?? [];
  const healthState = normalizeHealthStatus(status);
  const onlineCount = statusCards.filter((card) => card.ok).length;
  const reviewCount = statusCards.length - onlineCount;
  const completionItems = completionBoard?.completionItems ?? [];
  const liveEntries = liveIndex?.entries ?? [];
  const sourceReadyCount = countFor(completionBoard, "SOURCE_READY");
  const runtimePassedCount = countFor(completionBoard, "RUNTIME_PASSED");
  const pendingCredentialsCount = countFor(completionBoard, "PENDING_CREDENTIALS");
  const localDockerBlocked = countFor(completionBoard, "BLOCKED_BY_LOCAL_DOCKER");
  const launchCriticalPending = completionItems.filter((item) => item.launchCritical && !["SOURCE_READY", "RUNTIME_PASSED"].includes(item.state)).length;
  const dockerRuntimeEntry = completionItems.find((item) => item.id === "local-docker-runtime");
  const nextBatches = completionBoard?.nextSourceBatches ?? [];

  const evidenceEvents = useMemo(
    () => events.filter((event) => event.evidencePath || event.stderr || event.stdout),
    [events]
  );

  const backendMode = status?.backendBoundary?.mode ?? liveIndex?.runtimeBlocker ?? "backend boundary pending";
  const backendStatus = typeof status?.backendHealthStatus === "number"
    ? `HTTP ${status.backendHealthStatus}`
    : typeof liveIndex?.backendHealthStatus === "number"
      ? `HTTP ${liveIndex.backendHealthStatus}`
      : "not confirmed";

  async function loadStatus() {
    setRefreshing(true);
    const [statusResult, boardResult, liveIndexResult] = await Promise.allSettled([
      readJson<JarvisStatusPayload>("/api/jarvis/status"),
      readJson<CompletionBoardPayload>("/api/jarvis/completion-board"),
      readJson<LiveIndexPayload>("/api/jarvis/live-index")
    ]);

    if (statusResult.status === "fulfilled") {
      const payload = statusResult.value;
      setStatus(payload);
      const nextCommand = payload.commands?.[0]?.id ?? "";
      setSelectedCommandId((current) => current || nextCommand);
    }

    if (boardResult.status === "fulfilled") {
      setCompletionBoard(boardResult.value);
    }

    if (liveIndexResult.status === "fulfilled") {
      setLiveIndex(liveIndexResult.value);
    }

    const errors = [statusResult, boardResult, liveIndexResult]
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => result.reason instanceof Error ? result.reason.message : "Jarvis request failed.");

    setStatusError(errors.join(" · "));

    if (errors.length) {
      setEvents((items) => [
        ...items,
        {
          id: newId("status_error"),
          role: "jarvis",
          title: "Jarvis board partially unavailable",
          detail: errors.join(" · "),
          ok: false,
          generatedAt: stamp()
        }
      ]);
    }

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
          surface: "jarvis_production_command_surface",
          localShellRequested: false,
          directDatabaseAccessRequested: false
        })
      });
      const payload = (await response.json()) as JarvisCommandResponse;
      const ok = response.ok && payload.ok !== false;
      const detail = payload.message || payload.stdout || payload.stderr || "Jarvis backend command response received.";
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
      speak(ok ? `${payload.title ?? commandId} accepted by backend boundary.` : `Command needs review. ${payload.stderr ?? "Backend boundary rejected it."}`);
      await loadStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Jarvis command request failed.";
      setEvents((items) => [
        ...items,
        {
          id: newId("jarvis_error"),
          role: "jarvis",
          title: "Command boundary failed",
          detail: message,
          ok: false,
          commandId,
          generatedAt: stamp()
        }
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
    recognition.onend = () => setVoiceState((current) => (current === "listening" ? "voice standby" : current));
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
    loadStatus();
    const id = window.setInterval(loadStatus, 30000);
    return () => {
      window.clearInterval(id);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <main className={styles.shell}>
      <div className={styles.nebula} />
      <div className={styles.grid} />
      <section className={styles.frame}>
        <header className={styles.hero}>
          <div className={styles.identity}>
            <span className={styles.kicker}>KINGSMEN LIVE OPERATING SYSTEM · PRODUCTION COMMAND SURFACE</span>
            <h1>JARVIS COMMAND</h1>
            <p>
              Live API status, whitelisted command envelopes, backend authority, completion board, live index, voice, visual feed, evidence drawer, and no fake production claims.
            </p>
            <div className={styles.heroActions}>
              <button onClick={loadStatus} disabled={refreshing}>{refreshing ? "Refreshing" : "Refresh live state"}</button>
              <button onClick={startVoice}>Voice context</button>
              <button onClick={toggleVisual}>{visualActive ? "Stop visual" : "Start visual"}</button>
              <button onClick={() => window.open("/api/jarvis/completion-board", "_blank", "noopener,noreferrer")}>Completion JSON</button>
              <button onClick={() => window.open("/api/jarvis/live-index", "_blank", "noopener,noreferrer")}>Live index JSON</button>
            </div>
          </div>
          <aside className={styles.orbPanel}>
            <div className={running ? styles.orbRunning : styles.orb}>
              <span />
              <b>J</b>
            </div>
            <strong>{healthState}</strong>
            <small>{backendMode} · {backendStatus}</small>
          </aside>
        </header>

        <section className={styles.truthStrip}>
          <article><span>Live cards</span><strong>{statusCards.length}</strong></article>
          <article><span>Online</span><strong>{onlineCount}</strong></article>
          <article><span>Review</span><strong>{reviewCount}</strong></article>
          <article><span>Commands</span><strong>{commands.length}</strong></article>
          <article><span>Runtime passed</span><strong>{runtimePassedCount}</strong></article>
          <article><span>Credentials</span><strong>{pendingCredentialsCount}</strong></article>
          <article><span>Launch blockers</span><strong>{launchCriticalPending}</strong></article>
          <article><span>Docker</span><strong>{localDockerBlocked ? "blocked" : "clear"}</strong></article>
        </section>

        {statusError ? <div className={styles.alert}>Jarvis board warning: {statusError}</div> : null}

        <section className={styles.mainGrid}>
          <aside className={styles.leftRail}>
            <section className={styles.panel}>
              <h2>Jarvis completion board</h2>
              <div className={styles.miniStats}>
                <article><span>Source ready</span><strong>{sourceReadyCount}</strong></article>
                <article><span>Runtime passed</span><strong>{runtimePassedCount}</strong></article>
                <article><span>Pending creds</span><strong>{pendingCredentialsCount}</strong></article>
                <article><span>Docker block</span><strong>{localDockerBlocked}</strong></article>
              </div>
              <div className={styles.completionCards}>
                {completionItems.length ? completionItems.slice(0, 6).map((item) => (
                  <article key={item.id} className={styles.completionCard}>
                    <span className={`${styles.statePill} ${stateClass(item.state)}`}>{item.state}</span>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    {item.validatorScript ? <code>{item.validatorScript}</code> : null}
                  </article>
                )) : <p className={styles.empty}>Waiting for /api/jarvis/completion-board. No placeholder data is substituted.</p>}
              </div>
            </section>

            <section className={styles.panel}>
              <h2>Live backend cards</h2>
              <div className={styles.statusCards}>
                {statusCards.length ? statusCards.map((card) => (
                  <article key={card.key} className={card.ok ? styles.statusOk : styles.statusReview}>
                    <span>{card.state}</span>
                    <strong>{card.title}</strong>
                    <p>{card.detail}</p>
                  </article>
                )) : <p className={styles.empty}>Waiting for /api/jarvis/status. No placeholder data is substituted.</p>}
              </div>
            </section>

            <section className={styles.panel}>
              <h2>Visual feed</h2>
              <div className={styles.videoFrame}>
                <video ref={videoRef} autoPlay muted playsInline />
                {!visualActive ? <span>Camera standby</span> : null}
              </div>
            </section>
          </aside>

          <section className={styles.commandCore}>
            <section className={styles.commandPanel}>
              <div>
                <span className={styles.kicker}>Backend-safe command deck</span>
                <h2>Choose a live command</h2>
                <p>Buttons are loaded from /api/jarvis/status, then submitted to /api/jarvis/command. The page never runs local shell commands.</p>
              </div>
              <form onSubmit={submit} className={styles.commandForm}>
                <select value={selectedCommandId} onChange={(event) => setSelectedCommandId(event.target.value)}>
                  {commands.map((command) => <option key={command.id} value={command.id}>{command.title}</option>)}
                </select>
                <textarea value={commandContext} onChange={(event) => setCommandContext(event.target.value)} />
                <button disabled={running || !selectedCommand}>{running ? "Executing" : "Send to backend"}</button>
              </form>
            </section>

            <section className={styles.commandDeck}>
              {commands.length ? commands.map((command) => (
                <button key={command.id} className={`${styles.commandCard} ${riskTone(command.risk)}`} onClick={() => {
                  setSelectedCommandId(command.id);
                  runCommand(command.id);
                }} disabled={running}>
                  <span>{command.category}</span>
                  <strong>{command.title}</strong>
                  <small>{command.description}</small>
                </button>
              )) : <p className={styles.empty}>No command registry received yet.</p>}
            </section>

            <section className={styles.timeline}>
              {events.slice(-12).reverse().map((event) => (
                <article key={event.id} className={event.role === "founder" ? styles.founderEvent : event.ok === false ? styles.errorEvent : styles.jarvisEvent}>
                  <div><strong>{event.role.toUpperCase()} · {event.title}</strong><span>{new Date(event.generatedAt).toLocaleTimeString()}</span></div>
                  <p>{event.detail}</p>
                  {event.stdout ? <pre>{event.stdout}</pre> : null}
                  {event.stderr ? <pre className={styles.errorText}>{event.stderr}</pre> : null}
                  {event.evidencePath ? <code>Evidence: {event.evidencePath}</code> : null}
                </article>
              ))}
            </section>
          </section>

          <aside className={styles.rightRail}>
            <section className={styles.panel}>
              <h2>Live index map</h2>
              <div className={styles.miniStats}>
                <article><span>Total</span><strong>{liveIndex?.summary?.total ?? liveEntries.length}</strong></article>
                <article><span>Live</span><strong>{liveIndex?.summary?.live ?? 0}</strong></article>
                <article><span>Runtime</span><strong>{liveIndex?.summary?.pendingRuntimeProof ?? 0}</strong></article>
                <article><span>Mode</span><strong>{liveIndex?.backendStorageMode ?? "pending"}</strong></article>
              </div>
              <div className={styles.completionCards}>
                {liveEntries.length ? liveEntries.slice(0, 7).map((entry) => (
                  <article key={entry.id} className={styles.completionCard}>
                    <span className={`${styles.statePill} ${stateClass(entry.state)}`}>{entry.state}</span>
                    <strong>{entry.title}</strong>
                    <p>{entry.detail}</p>
                    {entry.boundaryRoute ? <code>{entry.boundaryRoute}</code> : null}
                  </article>
                )) : <p className={styles.empty}>Waiting for /api/jarvis/live-index. No placeholder data is substituted.</p>}
              </div>
            </section>

            <section className={styles.panel}>
              <h2>Evidence drawer</h2>
              {evidenceEvents.length ? evidenceEvents.slice(-10).reverse().map((item) => (
                <article key={item.id} className={styles.evidenceItem}>
                  <strong>{item.commandId ?? item.title}</strong>
                  <span>{item.evidencePath ?? "Backend response captured"}</span>
                </article>
              )) : <p className={styles.empty}>No evidence captured in this browser session yet.</p>}
            </section>

            <section className={styles.panel}>
              <h2>Next source batches</h2>
              <ul className={styles.doctrineList}>
                {nextBatches.length ? nextBatches.map((item) => <li key={item}>{item}</li>) : <li>Completion board will list next build batches.</li>}
              </ul>
              {dockerRuntimeEntry ? <p className={styles.blockerText}>{dockerRuntimeEntry.detail}</p> : null}
            </section>

            <section className={styles.panel}>
              <h2>Doctrine lock</h2>
              <ul className={styles.doctrineList}>
                {doctrine.length ? doctrine.map((item) => <li key={item}>{item}</li>) : <li>Doctrine will load from live status.</li>}
              </ul>
            </section>

            <section className={styles.panel}>
              <h2>No fake data rule</h2>
              <p>Anything unavailable stays unavailable. This page does not fabricate status, payment, candidate, route, or AI-provider data.</p>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
