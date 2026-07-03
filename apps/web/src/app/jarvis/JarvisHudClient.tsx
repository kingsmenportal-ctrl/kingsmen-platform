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
  const [cameraActive, setCameraActive] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "speaking" | "unsupported">("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  async function toggleCamera() {
    if (cameraActive) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCameraActive(false);
    }
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
      ? "Welcome to Kingsmen Command, Commander. Jarvis web surface is online. Backend boundary reports stable. No external provider is claimed live without runtime proof."
      : "Welcome to Kingsmen Command, Commander. Jarvis web surface is awake. Backend proof is still under review. No external provider is claimed live without runtime proof.";

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
      streamRef.current?.getTracks().forEach((track) => track.stop());
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

  return (
    <main className={styles.shell}>
      <div className={styles.gridGlow} />

      <nav className={styles.topNav}>
        <div className={styles.brand}>
          <span>KINGSMEN</span>
          <strong>JARVIS · COMMAND HOUSE</strong>
        </div>
        <div className={styles.navPills}>
          <span>Overview</span>
          <span>Agents</span>
          <span>Robots</span>
          <span>Providers</span>
          <span>Evidence</span>
          <span>Ledger</span>
          <span>Founder</span>
        </div>
      </nav>

      <section className={styles.hud}>
        <header className={styles.header}>
          <div>
            <div className={styles.kicker}>FOUNDER · COMMANDER · {surface}</div>
            <h1>JARVIS</h1>
            <p>
              Premium real wired command surface. This UI calls the backend API boundary, keeps risky actions proof-gated,
              and refuses to claim apps, tools, robots, agents, or providers are live without runtime evidence.
            </p>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>PostgreSQL · truth</span>
              <span className={styles.badge}>Airtable · mirror only</span>
              <span className={styles.badge}>n8n · thin wrapper only</span>
              <span className={styles.badge}>GitHub commits + validators = proof</span>
            </div>
          </div>

          <aside className={styles.topStatus}>
            <span className={status?.ok ? styles.dotOk : styles.dotWarn} />
            <strong>{status?.ok ? "SYSTEM GRIP STABLE" : "SYSTEM NEEDS REVIEW"}</strong>
            <small>{status ? `${okCount}/${totalCount} surfaces confirmed` : "loading truth..."}</small>
            <small>{status?.generatedAt ? `Last truth sync ${new Date(status.generatedAt).toLocaleTimeString()}` : "No status payload yet"}</small>
          </aside>
        </header>

        <section className={styles.coreLayout}>
          <aside className={styles.leftRail}>
            <div className={styles.panelTitle}>Founder Command Plane</div>
            <div className={styles.founderSeal}>
              <span>COMMANDER</span>
              <strong>{running ? "EXECUTING" : "READY"}</strong>
              <small>Signed intent · sealed execution</small>
            </div>

            <div className={styles.doctrineBox}>
              {(status?.doctrine ?? [
                "Backend state machine remains authority.",
                "Jarvis surfaces truth and safe actions.",
                "Risky actions require policy and evidence gates."
              ]).map((line) => (
                <p key={line}>› {line}</p>
              ))}
            </div>

            <div className={styles.panelTitle}>System Truth</div>
            <div className={styles.cardStack}>
              {(status?.cards ?? []).map((card) => (
                <article key={card.key} className={card.ok ? styles.truthCardOk : styles.truthCardWarn}>
                  <div className={styles.cardState}>{card.state}</div>
                  <h3>{card.title}</h3>
                  <p>{card.detail}</p>
                </article>
              ))}
              {statusError ? (
                <article className={styles.truthCardWarn}>
                  <div className={styles.cardState}>ERROR</div>
                  <h3>Status API</h3>
                  <p>{statusError}</p>
                </article>
              ) : null}
            </div>

            <div className={styles.panelTitle}>Providers · Honest States</div>
            <div className={styles.deckStack}>
              {providers.map((item) => <DeckCard key={item.name} item={item} />)}
            </div>
          </aside>

          <section className={styles.centerCore}>
            <section className={styles.orbWrap}>
              <div className={styles.ringOne} />
              <div className={styles.ringTwo} />
              <div className={styles.ringThree} />
              <div className={styles.orb}>
                <span>J</span>
              </div>
              <div className={styles.orbCaption}>
                <strong>{running ? `EXECUTING ${running}` : "COMMAND BRAIN · JARVIS CORE"}</strong>
                <small>{backendVerified ? "Backend boundary verified" : "Backend boundary needs runtime proof"}</small>
              </div>
            </section>

            <section className={styles.statGrid}>
              <article><span>Cortex Load</span><strong>{running ? "ACTIVE" : "STANDBY"}</strong></article>
              <article><span>Truth Sync</span><strong>{backendVerified ? "OK" : "REVIEW"}</strong></article>
              <article><span>Voice Bridge</span><strong>{voiceState.toUpperCase()}</strong></article>
              <article><span>Evidence</span><strong>{result ? "RETURNED" : "WAITING"}</strong></article>
              <article><span>Runtime</span><strong>{runtimeVerified ? "CONFIRMED" : "PROOF NEEDED"}</strong></article>
              <article><span>Ledger</span><strong>GIT + API</strong></article>
            </section>

            <div className={styles.proofLine}>
              No app, tool, robot or agent is claimed live without runtime proof.
            </div>

            <form className={styles.commandForm} onSubmit={submitCommand}>
              <input
                value={commandInput}
                onChange={(event) => setCommandInput(event.target.value)}
                placeholder="Type command e.g. DB_LEDGER_CHECK"
                aria-label="Jarvis command input"
              />
              <button type="submit" disabled={running !== null}>
                {running ? "RUNNING" : "EXECUTE"}
              </button>
              <button type="button" onClick={startVoice} disabled={running !== null} className={styles.secondaryButton}>
                {voiceState === "listening" ? "LISTENING" : voiceState === "unsupported" ? "NO VOICE" : "LISTEN"}
              </button>
              <button type="button" onClick={speakStatus} className={styles.secondaryButton}>
                {voiceState === "speaking" ? "SPEAKING" : "SPEAK"}
              </button>
            </form>

            <div className={styles.quickDeck}>
              {quickCommands.map((command) => (
                <button key={command} type="button" onClick={() => { setCommandInput(command); runCommand(command); }} disabled={running !== null}>
                  {command}
                </button>
              ))}
            </div>

            <section className={styles.resultPanel}>
              <div className={styles.panelTitle}>Live Command Result</div>
              {result ? (
                <>
                  <div className={result.ok ? styles.resultOk : styles.resultFail}>
                    {result.ok ? "SUCCESS" : "FAILED"} · {result.commandId} · {result.durationMs}ms
                  </div>
                  <p>{result.message}</p>
                  <small>Evidence: {result.evidencePath ?? "backend evidence required"}</small>
                  <pre>{safeOutput(result.stdout + (result.stderr ? `\n\nSTDERR:\n${result.stderr}` : ""))}</pre>
                </>
              ) : (
                <p className={styles.muted}>
                  Execute a SAFE_READ command. Jarvis will return backend-boundary output here. Evidence remains the authority.
                </p>
              )}
            </section>

            <section className={styles.latticePanel}>
              <div className={styles.panelTitle}>Node Mesh · N00 → N20</div>
              <div className={styles.nodeGrid}>
                {nodeNames.map((name, index) => {
                  const state = nodeState(index);
                  return (
                    <article key={name} className={styles.nodeCard}>
                      <strong>N{String(index).padStart(2, "0")}</strong>
                      <span>{name}</span>
                      <small className={stateClass(state)}>{state}</small>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>

          <aside className={styles.rightRail}>
            <section className={styles.voicePanel}>
              <div className={styles.panelTitle}>Voice · Commander Channel</div>
              <h3>Jarvis Voice Bridge</h3>
              <strong>{voiceState === "unsupported" ? "Unavailable in this browser" : "Browser Runtime Only"}</strong>
              <p>Greeting: Welcome to Kingsmen Command, Commander.</p>
              <div className={styles.voiceButtons}>
                <button type="button" onClick={speakStatus}>WAKE</button>
                <button type="button" onClick={startVoice}>LISTEN</button>
                <button type="button" onClick={speakStatus}>SPEAK</button>
              </div>
              <small>STT/TTS provider claims remain proof-gated.</small>
            </section>

            <section className={styles.cameraPanel}>
              <video ref={videoRef} autoPlay muted playsInline className={styles.video} />
              {!cameraActive ? (
                <div className={styles.cameraPlaceholder}>
                  <strong>VISUAL FEED STANDBY</strong>
                  <span>Enable camera only when founder visual mode is needed.</span>
                </div>
              ) : null}
            </section>
            <button className={styles.fullButton} type="button" onClick={toggleCamera}>
              {cameraActive ? "STOP VISUAL FEED" : "START VISUAL FEED"}
            </button>
            <button className={styles.fullButton} type="button" onClick={() => runCommand("OPENCLAW_GRIP_CHECK")} disabled={running !== null}>
              RUN OPENCLAW GRIP CHECK
            </button>

            <section className={styles.boundaryBox}>
              <div>
                <strong>Oracle Lite</strong>
                <span>Read · Inspect · Report</span>
              </div>
              <div>
                <strong>Commander</strong>
                <span>Execute · Commit · Seal</span>
              </div>
              <p>Boundary enforced by founder command plane. Runtime mutation requires signed intent and evidence.</p>
            </section>

            <div className={styles.panelTitle}>Agents</div>
            <div className={styles.compactDeck}>{agents.map((item) => <DeckCard key={item.name} item={item} />)}</div>

            <div className={styles.panelTitle}>Robots · Runtime</div>
            <div className={styles.compactDeck}>{robots.map((item) => <DeckCard key={item.name} item={item} />)}</div>

            <div className={styles.panelTitle}>Tools</div>
            <div className={styles.compactDeck}>{tools.map((item) => <DeckCard key={item.name} item={item} />)}</div>

            <div className={styles.panelTitle}>Apps</div>
            <div className={styles.compactDeck}>{apps.map((item) => <DeckCard key={item.name} item={item} />)}</div>

            <div className={styles.commandGroups}>
              <div className={styles.panelTitle}>Command Registry</div>
              {Object.entries(grouped).map(([category, commands]) => (
                <details key={category} open={category === "System" || category === "OpenClaw"}>
                  <summary>{category}</summary>
                  {commands.map((command) => (
                    <button key={command.id} type="button" onClick={() => { setCommandInput(command.id); runCommand(command.id); }} disabled={running !== null}>
                      <strong>{command.id}</strong>
                      <span>{command.description}</span>
                    </button>
                  ))}
                </details>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
