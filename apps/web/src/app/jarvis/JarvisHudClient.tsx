"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./JarvisHud.module.css";

type JarvisCard = {
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
  risk: "SAFE_READ" | "POLICY_REVIEW" | "BLOCKED";
};

type JarvisStatus = {
  ok: boolean;
  generatedAt: string;
  cards: JarvisCard[];
  commands: JarvisCommand[];
  doctrine: string[];
};

type JarvisResult = {
  ok: boolean;
  commandId: string;
  title: string;
  category: string;
  risk: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  stdout: string;
  stderr: string;
  evidencePath: string | null;
  message: string;
};

type ProofState =
  | "Runtime Verified"
  | "Needs Runtime Proof"
  | "Referenced Only"
  | "Blocked / Missing Credentials";

type DeckItem = {
  name: string;
  role: string;
  state: ProofState;
};

const quickCommands = [
  "SYSTEM_VALIDATE_N20",
  "DB_LEDGER_CHECK",
  "OPENCLAW_GRIP_CHECK",
  "QUEUE_HEALTH_CHECK",
  "INCIDENT_REVIEW",
  "MANUAL_FALLBACK_REVIEW",
  "FOUNDER_OVERRIDE_REVIEW",
  "PUBLIC_ROUTE_HOUSE_CHECK",
  "CANDIDATE_PORTAL_CHECK"
];

const providers: DeckItem[] = [
  { name: "GitHub", role: "commit + validator proof", state: "Needs Runtime Proof" },
  { name: "Netlify", role: "deployment surface", state: "Needs Runtime Proof" },
  { name: "PostgreSQL", role: "source of truth", state: "Needs Runtime Proof" },
  { name: "Airtable", role: "mirror only", state: "Referenced Only" },
  { name: "n8n", role: "thin wrapper only", state: "Referenced Only" },
  { name: "OpenAI Platform", role: "AI provider boundary", state: "Blocked / Missing Credentials" },
  { name: "AI Voice Generator", role: "ceremonial voice asset", state: "Needs Runtime Proof" },
  { name: "Google Drive", role: "documents and evidence", state: "Needs Runtime Proof" },
  { name: "Canva", role: "visual design surface", state: "Referenced Only" },
  { name: "Lovable", role: "prototype reference", state: "Referenced Only" }
];

const agents: DeckItem[] = [
  { name: "Sentinel", role: "risk and anomaly", state: "Needs Runtime Proof" },
  { name: "Chancellor", role: "governance and tribunal", state: "Referenced Only" },
  { name: "Cartographer", role: "route and codebase map", state: "Needs Runtime Proof" },
  { name: "Herald", role: "email-first comms", state: "Referenced Only" },
  { name: "Warden", role: "secrets and access", state: "Blocked / Missing Credentials" }
];

const robots: DeckItem[] = [
  { name: "OpenClaw", role: "operator grip boundary", state: "Needs Runtime Proof" },
  { name: "Playwright", role: "probe and scout only", state: "Needs Runtime Proof" },
  { name: "Oracle Lite", role: "Commander runtime boundary", state: "Needs Runtime Proof" },
  { name: "PowerShell Creator", role: "local system scribe", state: "Referenced Only" }
];

const tools: DeckItem[] = [
  { name: "Evidence Vault", role: "proof reports", state: "Needs Runtime Proof" },
  { name: "Validator Reports", role: "source checks", state: "Needs Runtime Proof" },
  { name: "Commit Ledger", role: "Git proof trail", state: "Needs Runtime Proof" },
  { name: "Voice Bridge", role: "browser voice only", state: "Needs Runtime Proof" },
  { name: "Payments Rail", role: "PayFast proof required", state: "Blocked / Missing Credentials" }
];

const apps: DeckItem[] = [
  { name: "Command House", role: "founder-facing", state: "Needs Runtime Proof" },
  { name: "Founder Plane", role: "signed intent", state: "Referenced Only" },
  { name: "Candidate Portal", role: "candidate surface", state: "Referenced Only" },
  { name: "Mobile Watch", role: "PWA future surface", state: "Referenced Only" }
];

const nodeNames = [
  "Constitution",
  "Foundation",
  "Backend",
  "Truth Vault",
  "Candidate Core",
  "Document Vault",
  "Route Universe",
  "Airtable Mirror",
  "Command Room",
  "Notifications",
  "Finance",
  "AI Engine",
  "Governance",
  "Observability",
  "Integrations",
  "Opportunity",
  "Orchestrator",
  "Founder Plane",
  "Public Web",
  "Mobile PWA",
  "Final Assembly"
];

function nodeState(index: number): ProofState {
  if ([1, 2, 3, 4, 8, 12, 13].includes(index)) return "Needs Runtime Proof";
  if ([10, 17, 20].includes(index)) return "Blocked / Missing Credentials";
  return "Referenced Only";
}

function normalizeCommand(value: string) {
  return value.trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase();
}

function safeOutput(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "No output returned.";
}

function stateClass(state: ProofState) {
  if (state === "Runtime Verified") return styles.stateVerified;
  if (state === "Needs Runtime Proof") return styles.stateProof;
  if (state === "Blocked / Missing Credentials") return styles.stateBlocked;
  return styles.stateReferenced;
}

function DeckCard({ item }: { item: DeckItem }) {
  return (
    <article className={styles.deckCard}>
      <div className={styles.deckTop}>
        <strong>{item.name}</strong>
        <span className={stateClass(item.state)}>{item.state}</span>
      </div>
      <p>{item.role}</p>
    </article>
  );
}

export default function JarvisHudClient({ surface }: { surface: string }) {
  const [status, setStatus] = useState<JarvisStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("SYSTEM_VALIDATE_N20");
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<JarvisResult | null>(null);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "speaking" | "unsupported">("idle");
  const hudRef = useRef<HTMLElement | null>(null);

  async function loadStatus() {
    try {
      setStatusError(null);
      const response = await fetch("/api/jarvis/status", { cache: "no-store" });
      const payload = (await response.json()) as JarvisStatus;
      setStatus(payload);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Jarvis status failed.");
    }
  }

  async function runCommand(commandId: string) {
    const normalized = normalizeCommand(commandId);
    if (!normalized) return;

    setRunning(normalized);
    setResult(null);

    try {
      const response = await fetch("/api/jarvis/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ commandId: normalized })
      });

      const payload = (await response.json()) as JarvisResult;
      setResult(payload);
      await loadStatus();
    } catch (error) {
      setResult({
        ok: false,
        commandId: normalized,
        title: "Jarvis command failed",
        category: "Runtime",
        risk: "SAFE_READ",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Unknown command failure.",
        evidencePath: "backend-boundary-unavailable",
        message: "Jarvis could not complete the command request."
      });
    } finally {
      setRunning(null);
    }
  }

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runCommand(commandInput);
  }

  function startVoice() {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceState("unsupported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-ZA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceState("listening");

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      const normalized = normalizeCommand(transcript);
      setCommandInput(normalized);
      setVoiceState("idle");
      if (normalized) runCommand(normalized);
    };

    recognition.onerror = () => setVoiceState("idle");
    recognition.onend = () => setVoiceState("idle");
    recognition.start();
  }

  function speakStatus() {
    if (!("speechSynthesis" in window)) {
      setVoiceState("unsupported");
      return;
    }

    const text = status?.ok
      ? "Welcome to Kingsmen Command, Commander. Jarvis web surface is online through the status API. No external provider is claimed live without runtime proof."
      : "Welcome to Kingsmen Command, Commander. Jarvis web surface is awake. Runtime proof is still required before live claims.";

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-ZA";
    utterance.rate = 0.94;
    utterance.pitch = 0.88;
    utterance.onend = () => setVoiceState("idle");

    setVoiceState("speaking");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    loadStatus();
    const timer = window.setInterval(loadStatus, 15000);
    return () => {
      window.clearInterval(timer);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const grouped = useMemo(() => {
    const list = status?.commands ?? [];
    return list.reduce<Record<string, JarvisCommand[]>>((acc, command) => {
      acc[command.category] = acc[command.category] ?? [];
      acc[command.category].push(command);
      return acc;
    }, {});
  }, [status]);

  const okCount = status?.cards.filter((card) => card.ok).length ?? 0;
  const totalCount = status?.cards.length ?? 0;
  const backendVerified = status?.cards.find((card) => card.key === "backend-api-boundary")?.ok === true;
  const runtimeVerified = status?.cards.find((card) => card.key === "jarvis-runtime-authority")?.ok === true;

  const statusCards = status?.cards ?? [];
  const proofNeededCount = status ? Math.max(totalCount - okCount, 0) : "proof-needed";
  const commandCount = status ? status.commands.length : "proof-needed";
  const syncLabel = status?.generatedAt ? new Date(status.generatedAt).toLocaleString() : "proof-needed";

  const missionStats = [
    { label: "API surfaces", value: status ? totalCount : "proof-needed" },
    { label: "Confirmed", value: status ? okCount : "proof-needed" },
    { label: "Proof needed", value: proofNeededCount },
    { label: "Commands", value: commandCount }
  ];

  const executionTimeline = statusCards.length > 0 ? statusCards.slice(0, 5) : [];
  const commandCategories = Object.keys(grouped);
  const providerMatrix = [...providers, ...agents, ...robots, ...tools, ...apps];

  return (
    <main className={styles.shell} ref={hudRef}>
      <div className={styles.gridGlow} />

      <section className={styles.lockedHud}>
        <header className={styles.lockedTopBar}>
          <div className={styles.lockedBrand}>
            <span className={styles.crestMark}>K</span>
            <div>
              <span>KINGSMEN</span>
              <strong>JARVIS · COMMAND HOUSE</strong>
            </div>
          </div>

          <div className={styles.topMeta}>
            <span className={status?.ok ? styles.stateVerified : styles.stateProof}>
              {status?.ok ? "api-online" : "proof-needed"}
            </span>
            <span className={backendVerified ? styles.stateVerified : styles.stateProof}>
              {backendVerified ? "backend verified" : "backend proof-needed"}
            </span>
            <span>{syncLabel}</span>
          </div>
        </header>

        <section className={styles.lockedColumns}>
          <aside className={styles.lockedLeft}>
            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Commander profile</div>
              <div className={styles.commanderProfile}>
                <span className={styles.crestMark}>K</span>
                <div>
                  <strong>Kingsmen Founder</strong>
                  <p>Commander private surface · {surface}</p>
                  <small>Runtime claims remain proof-gated.</small>
                </div>
              </div>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Mission stats</div>
              <div className={styles.missionGrid}>
                {missionStats.map((stat) => (
                  <article key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Voice Link</div>
              <div className={styles.voiceWave}>
                <div className={styles.waveform} />
                <strong>{voiceState === "unsupported" ? "proof-needed" : voiceState}</strong>
              </div>
              <div className={styles.voiceButtons}>
                <button type="button" onClick={speakStatus}>WAKE</button>
                <button type="button" onClick={startVoice}>LISTEN</button>
                <button type="button" onClick={speakStatus}>SPEAK</button>
              </div>
              <small className={styles.muted}>Jarvis will not fake voice, microphone access, or speech output.</small>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Candidate Operations snapshot</div>
              <div className={styles.snapshotList}>
                <span>Intake · adapter-gated</span>
                <span>Documents · proof-needed</span>
                <span>Workbench · proof-needed</span>
                <span>Finance/comms · proof-needed</span>
              </div>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Route Universe map</div>
              <div className={styles.routeMap}>
                <span>CAO</span>
                <span>NSFAS</span>
                <span>TVET</span>
                <span>SETA</span>
                <span>Employer</span>
              </div>
              <small className={styles.muted}>Route counts stay proof-needed until route API proof exists.</small>
            </section>
          </aside>

          <section className={styles.lockedCentre}>
            <section className={styles.heroCore}>
              <div className={styles.blueWave} />
              <div className={styles.ringOne} />
              <div className={styles.ringTwo} />
              <div className={styles.ringThree} />
              <div className={styles.orb}>
                <span>J</span>
              </div>
              <div className={styles.orbCaption}>
                <strong>{running ? `EXECUTING ${running}` : "JARVIS COMMAND BRAIN"}</strong>
                <small>{backendVerified ? "Backend boundary verified" : "Backend boundary proof-needed"}</small>
              </div>
            </section>

            <form className={styles.commandForm} onSubmit={submitCommand}>
              <input
                value={commandInput}
                onChange={(event) => setCommandInput(event.target.value)}
                placeholder="Ask, plan, decide, or give an objective..."
                aria-label="Jarvis command input"
              />
              <button type="submit" disabled={running !== null}>
                {running ? "RUNNING" : "EXECUTE"}
              </button>
            </form>

            <section className={styles.latticePanel}>
              <div className={styles.panelTitle}>Kingsmen Work Map · N00-N20</div>
              <div className={styles.nodeGrid}>
                {nodeNames.map((name, index) => {
                  const state = nodeState(index);
                  return (
                    <article key={name} className={styles.nodeCard}>
                      <strong>N{String(index).padStart(2, "0")}</strong>
                      <span>{name}</span>
                      <small className={stateClass(state)}>{state === "Referenced Only" ? "adapter-gated" : "proof-needed"}</small>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className={styles.centreLowerGrid}>
              <section className={styles.resultPanel}>
                <div className={styles.panelTitle}>Live Execution Timeline</div>
                {executionTimeline.length > 0 ? executionTimeline.map((card) => (
                  <article key={card.key} className={card.ok ? styles.truthCardOk : styles.truthCardWarn}>
                    <div className={styles.cardState}>{card.ok ? "API" : "PROOF"}</div>
                    <h3>{card.title}</h3>
                    <p>{card.detail}</p>
                  </article>
                )) : (
                  <p className={styles.muted}>proof-needed · waiting for status API timeline.</p>
                )}
              </section>

              <section className={styles.resultPanel}>
                <div className={styles.panelTitle}>Active Incidents</div>
                {statusError ? (
                  <article className={styles.truthCardWarn}>
                    <div className={styles.cardState}>ERROR</div>
                    <h3>Status API</h3>
                    <p>{statusError}</p>
                  </article>
                ) : result && !result.ok ? (
                  <article className={styles.truthCardWarn}>
                    <div className={styles.cardState}>INCIDENT</div>
                    <h3>{result.title}</h3>
                    <p>{result.message}</p>
                  </article>
                ) : (
                  <p className={styles.muted}>adapter-gated / proof-needed incident feed.</p>
                )}
              </section>

              <section className={styles.resultPanel}>
                <div className={styles.panelTitle}>Route Safety mini-map</div>
                <div className={styles.routeSafetyMap}>
                  <span>SAFE · verified route proof-needed</span>
                  <span>WATCH · portal behaviour proof-needed</span>
                  <span>RISK · manual review required</span>
                  <span>BLOCK · MAP fallback required</span>
                </div>
              </section>
            </section>
          </section>

          <aside className={styles.lockedRight}>
            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>OpenClaw Gateway</div>
              <p>Command registry · policy gate · evidence ledger.</p>
              <span className={styles.stateProof}>proof-needed</span>
              <button className={styles.fullButton} type="button" onClick={() => runCommand("OPENCLAW_GRIP_CHECK")} disabled={running !== null}>
                Run OpenClaw check
              </button>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Playwright Scout</div>
              <p>Probe only · manual fallback · MAP boundary.</p>
              <span className={styles.stateProof}>proof-needed</span>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Oracle Lite Runtime</div>
              <p>Local Commander runtime boundary.</p>
              <span className={runtimeVerified ? styles.stateVerified : styles.stateProof}>
                {runtimeVerified ? "runtime verified" : "proof-needed"}
              </span>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Provider Matrix</div>
              <div className={styles.providerMatrix}>
                {providerMatrix.map((item) => (
                  <article key={`${item.name}-${item.role}`}>
                    <strong>{item.name}</strong>
                    <span className={stateClass(item.state)}>
                      {item.state === "Runtime Verified" ? "runtime-verified" : item.state === "Blocked / Missing Credentials" ? "blocked / proof-needed" : "adapter-gated / proof-needed"}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Founder Command Plane</div>
              <div className={styles.founderActions}>
                {quickCommands.slice(0, 7).map((command) => (
                  <button key={command} type="button" onClick={() => { setCommandInput(command); runCommand(command); }} disabled={running !== null}>
                    {command.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              <div className={styles.commandCategoryRail}>
                {commandCategories.length > 0 ? commandCategories.map((category) => (
                  <span key={category}>{category} · API</span>
                )) : <span>Command registry · proof-needed</span>}
              </div>
            </section>

            <section className={styles.layoutPanel}>
              <div className={styles.panelTitle}>Evidence & Proof Centre</div>
              <div className={styles.evidenceGrid}>
                <article><strong>{status ? totalCount : "proof-needed"}</strong><span>Checks</span></article>
                <article><strong>{status ? okCount : "proof-needed"}</strong><span>Confirmed</span></article>
                <article><strong>{status ? proofNeededCount : "proof-needed"}</strong><span>Proof needed</span></article>
              </div>
              <p className={styles.muted}>No app, tool, robot or agent is claimed live without runtime proof.</p>
            </section>
          </aside>
        </section>

        <footer className={styles.bottomStrip}>
          <span>KINGSMEN PROTOCOL · Zero trust architecture · Evidence before claims</span>
          <span>{status?.generatedAt ? `Truth sync ${syncLabel}` : "Truth sync proof-needed"}</span>
        </footer>
      </section>
    </main>
  );
}
