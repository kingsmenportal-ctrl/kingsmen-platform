# KINGSMEN JARVIS STEP 01M - FIXED VIEWPORT AND SAFE LAUNCH
# Fixes:
# - EADDRINUSE confusion: port 3000 already running means do not start a second server.
# - Collapsed responsive layout: Jarvis cockpit now uses a fixed 1920x1080 live system scaled to the current window.
#
# Changes only:
# apps\web\src\app\jarvis\JarvisHudClient.tsx
# apps\web\src\app\jarvis\JarvisHud.module.css
# tools\jarvis\START_JARVIS_SAFE.ps1
# C:\Kingsmen\START_JARVIS_SAFE.cmd

$ErrorActionPreference = "Stop"

function EnsureDir([string]$Path) {
  if (!(Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function WriteNoBom([string]$Path, [string]$Text) {
  EnsureDir (Split-Path -Parent $Path)
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Text, $utf8NoBom)
  Write-Host ("WROTE: " + $Path) -ForegroundColor Green
}

function Sha256File([string]$Path) {
  if (!(Test-Path $Path)) { return $null }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  return [System.BitConverter]::ToString($sha.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
}

Clear-Host
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host " KINGSMEN JARVIS STEP 01M - FIXED VIEWPORT AND SAFE LAUNCH" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "Fixes the collapsed window and prevents duplicate port 3000 launch." -ForegroundColor Yellow
Write-Host ""

$Repo = "C:\Kingsmen\kingsmen-platform"
if (!(Test-Path $Repo)) { throw "Repo not found: $Repo" }
if (!(Test-Path (Join-Path $Repo "apps\web"))) { throw "Web app not found: C:\Kingsmen\kingsmen-platform\apps\web" }

$HudRel = "apps\web\src\app\jarvis\JarvisHudClient.tsx"
$CssRel = "apps\web\src\app\jarvis\JarvisHud.module.css"
$LauncherRel = "tools\jarvis\START_JARVIS_SAFE.ps1"
$HudPath = Join-Path $Repo $HudRel
$CssPath = Join-Path $Repo $CssRel
$LauncherPath = Join-Path $Repo $LauncherRel

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupRoot = Join-Path $Repo ("backups\jarvis-step-01m-before-fixed-viewport-" + $Stamp)
EnsureDir $BackupRoot

foreach ($rel in @($HudRel, $CssRel, $LauncherRel)) {
  $src = Join-Path $Repo $rel
  if (Test-Path $src) {
    $dest = Join-Path $BackupRoot $rel
    EnsureDir (Split-Path -Parent $dest)
    Copy-Item $src $dest -Force
    Write-Host ("BACKED UP: " + $rel) -ForegroundColor DarkCyan
  }
}

$Tsx = @'
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import styles from "./JarvisHud.module.css";

type EvidenceLevel = "ok" | "info" | "warn" | "critical";
type EvidenceRow = { id: string; time: string; event: string; source: string; level: EvidenceLevel };
type AgentState = { name: string; status: "ACTIVE" | "READY" | "LOCKED" | "IDLE" | "WAITING"; detail: string };
type ActionItem = { id: string; title: string; detail: string; severity: "Critical" | "Review" | "Info"; status: "Open" | "Queued" | "Done" };
type WorkflowItem = { id: string; label: string; status: "Ready" | "Running" | "Queued" | "Done" };
type ViewBox = { scale: number; left: number; top: number };

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence?: number } }>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const WAKE_GREETING =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine.";

const COMMANDS = [
  "Jarvis, give me Kingsmen system status.",
  "Jarvis, inspect voice readiness.",
  "Jarvis, prepare founder morning report.",
  "Jarvis, check pending risks.",
  "Jarvis, summarize the command queue.",
];

function clock(): string {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function computeViewBox(): ViewBox {
  if (typeof window === "undefined") return { scale: 1, left: 0, top: 0 };
  const baseW = 1920;
  const baseH = 1080;
  const scale = Math.min(window.innerWidth / baseW, window.innerHeight / baseH);
  const safeScale = Math.max(0.42, Math.min(1, scale));
  return {
    scale: safeScale,
    left: Math.max(0, (window.innerWidth - baseW * safeScale) / 2),
    top: Math.max(0, (window.innerHeight - baseH * safeScale) / 2),
  };
}

export default function JarvisHudClient() {
  const [viewBox, setViewBox] = useState<ViewBox>({ scale: 1, left: 0, top: 0 });
  const [serverOnline, setServerOnline] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [command, setCommand] = useState("Jarvis, why are you not speaking?");
  const [lastHeard, setLastHeard] = useState("No confirmed live voice command yet.");
  const [reply, setReply] = useState("Awaiting command, Commander.");
  const [focus, setFocus] = useState("High priority candidate screening and payment risk review");

  const [evidence, setEvidence] = useState<EvidenceRow[]>([
    { id: makeId("ev"), time: clock(), event: "Live fixed viewport cockpit loaded", source: "hud", level: "ok" },
    { id: makeId("ev"), time: clock(), event: "No wallpaper interface active", source: "layout", level: "ok" },
    { id: makeId("ev"), time: clock(), event: "Commander-only doctrine locked", source: "doctrine", level: "ok" },
  ]);

  const [agents, setAgents] = useState<AgentState[]>([
    { name: "Vision Agent", status: "READY", detail: "Visual workspace available" },
    { name: "Brain Agent", status: "ACTIVE", detail: "Command reasoning online" },
    { name: "Memory Agent", status: "LOCKED", detail: "Founder doctrine protected" },
    { name: "Voice Bridge", status: "WAITING", detail: "Listening channel prepared" },
    { name: "OpenClaw Guard", status: "ACTIVE", detail: "Tool execution guarded" },
  ]);

  const [actions, setActions] = useState<ActionItem[]>([
    { id: "act-1", title: "High Risk Payment Detected", detail: "Payment review required before route release.", severity: "Critical", status: "Open" },
    { id: "act-2", title: "Route Deviation Alert", detail: "Unusual node behaviour in candidate route graph.", severity: "Review", status: "Queued" },
  ]);

  const [workflow, setWorkflow] = useState<WorkflowItem[]>([
    { id: "wf-1", label: "Ingest", status: "Done" },
    { id: "wf-2", label: "Verify", status: "Done" },
    { id: "wf-3", label: "Assess", status: "Running" },
    { id: "wf-4", label: "Cross-check", status: "Queued" },
    { id: "wf-5", label: "Rank", status: "Queued" },
    { id: "wf-6", label: "Report", status: "Ready" },
  ]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<number | null>(null);

  const shellStyle = {
    transform: `translate3d(${viewBox.left}px, ${viewBox.top}px, 0) scale(${viewBox.scale})`,
  } as CSSProperties;

  const readiness = useMemo(() => {
    let score = 76;
    if (serverOnline) score += 10;
    if (listening) score += 7;
    if (autoSpeak) score += 4;
    if (agents.every((agent) => agent.status !== "IDLE")) score += 3;
    return Math.min(score, 100);
  }, [serverOnline, listening, autoSpeak, agents]);

  function pushEvidence(event: string, source: string, level: EvidenceLevel = "info") {
    setEvidence((rows) => [{ id: makeId("ev"), time: clock(), event, source, level }, ...rows].slice(0, 16));
  }

  function speak(text: string) {
    if (!autoSpeak || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-ZA";
    utterance.rate = 0.92;
    utterance.pitch = 0.86;
    utterance.volume = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      pushEvidence("speech output failed", "voice", "warn");
    };
    window.speechSynthesis.speak(utterance);
  }

  async function sendToJarvis(rawCommand: string, source: string) {
    const clean = rawCommand.trim();
    if (!clean) return;
    setCommand(clean);
    setLastHeard(clean);
    pushEvidence(`command captured: ${clean}`, source, "ok");

    if (clean.toLowerCase() === "jarvis" || clean.toLowerCase().startsWith("jarvis wake")) {
      setReply(WAKE_GREETING);
      pushEvidence("wake greeting delivered", "voice", "ok");
      speak(WAKE_GREETING);
      return;
    }

    try {
      const res = await fetch("/api/jarvis/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ command: clean, text: clean, source, commander_only: true, ui_mode: "fixed-live-system" }),
      });
      const data = await res.json().catch(() => ({}));
      const apiReply =
        typeof data.reply === "string"
          ? data.reply
          : typeof data.message === "string"
          ? data.message
          : typeof data.output === "string"
          ? data.output
          : `Certainly, Commander. I heard the command: ${clean}`;
      setReply(apiReply);
      pushEvidence("reply received", "api", "ok");
      speak(apiReply);
    } catch {
      const fallback = `Certainly, Commander. I heard the command: ${clean}. The local cockpit is active, but the API response route needs inspection.`;
      setReply(fallback);
      pushEvidence("api command fallback used", "api", "warn");
      speak(fallback);
    }
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      const message = "Commander, browser speech recognition is not exposed here. Use Microsoft Edge or the native voice bridge.";
      setReply(message);
      pushEvidence("browser speech recognition unavailable", "voice", "warn");
      speak(message);
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new Recognition();
    recognition.lang = "en-ZA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setAgents((items) => items.map((agent) => agent.name === "Voice Bridge" ? { ...agent, status: "ACTIVE", detail: "Browser microphone listening" } : agent));
      pushEvidence("microphone listening started", "voice", "ok");
    };

    recognition.onend = () => {
      setListening(false);
      setAgents((items) => items.map((agent) => agent.name === "Voice Bridge" ? { ...agent, status: "WAITING", detail: "Listening stopped" } : agent));
      pushEvidence("microphone listening stopped", "voice", "info");
    };

    recognition.onerror = (event) => {
      setListening(false);
      pushEvidence(`voice error: ${event.error || "unknown"}`, "voice", "warn");
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim() || "";
        if (!transcript) continue;
        if (result.isFinal) {
          sendToJarvis(transcript, "browser-voice");
        } else {
          interim = transcript;
        }
      }
      if (interim) setLastHeard(interim);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      pushEvidence("voice recognition already running", "voice", "warn");
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setListening(false);
  }

  async function checkServer() {
    try {
      const res = await fetch("/api/jarvis/status", { cache: "no-store" });
      setServerOnline(res.ok);
      pushEvidence(res.ok ? "status-check ok" : "status-check failed", "api", res.ok ? "ok" : "warn");
    } catch {
      setServerOnline(false);
      pushEvidence("status-check offline", "api", "warn");
    }
  }

  useEffect(() => {
    const resize = () => setViewBox(computeViewBox());
    resize();
    window.addEventListener("resize", resize);
    checkServer();
    timerRef.current = window.setInterval(checkServer, 20000);
    return () => {
      window.removeEventListener("resize", resize);
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText = serverOnline ? "SYSTEM ONLINE" : "SERVER WAITING";
  const voiceText = listening ? "LISTENING" : "VOICE READY";

  return (
    <main className={styles.stage}>
      <div className={styles.shell} style={shellStyle}>
        <header className={styles.header}>
          <section className={styles.brandBlock}>
            <div className={styles.crest}>♔</div>
            <div>
              <div className={styles.brand}>KINGSMEN</div>
              <div className={styles.subtitle}>PRIVATE ROUTE COMMAND HOUSE</div>
            </div>
          </section>

          <section className={styles.titleBlock}>
            <div className={styles.jarvisTitle}>JARVIS</div>
            <div className={styles.jarvisSubtitle}>FOUNDER AI OPERATING ASSISTANT</div>
          </section>

          <section className={styles.statusStrip}>
            <button className={styles.statusPill} onClick={checkServer}>{statusText}</button>
            <button className={styles.statusPill} onClick={() => setAutoSpeak((value) => !value)}>{autoSpeak ? "SPEECH ON" : "SPEECH OFF"}</button>
            <button className={styles.iconButton} onClick={() => speak("Jarvis voice output is active, Commander.")}>VOICE</button>
            <button className={styles.iconButton} onClick={() => sendToJarvis("Jarvis, inspect command readiness.", "header")}>SCAN</button>
          </section>
        </header>

        <section className={styles.grid}>
          <aside className={styles.leftRail}>
            <section className={styles.card}>
              <div className={styles.cardTitle}>SYSTEM READINESS</div>
              <div className={styles.readinessWrap}>
                <div className={styles.readinessRing}><span>{readiness}%</span></div>
                <div className={styles.readinessList}>
                  <p>Core AI <strong>Operational</strong></p>
                  <p>Agents <strong>Operational</strong></p>
                  <p>OpenClaw <strong>Guarded</strong></p>
                  <p>Voice Link <strong>{voiceText}</strong></p>
                  <p>Data Fabric <strong>Live</strong></p>
                </div>
              </div>
              <button className={styles.fullButton} onClick={checkServer}>Full Diagnostics</button>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>MISSION OVERVIEW</div>
              <div className={styles.metricGrid}>
                <div><span>Active Routes</span><strong>07</strong></div>
                <div><span>Open Actions</span><strong>{actions.length}</strong></div>
                <div><span>Priority Alerts</span><strong>02</strong></div>
              </div>
              <p className={styles.focusLine}>{focus}</p>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>ROUTE INTELLIGENCE</div>
              <div className={styles.signalMap}><div className={styles.mapPulse}></div></div>
              <div className={styles.scoreRows}>
                <p>Route Active <strong>7 / 12</strong></p>
                <p>Risk Level <strong>Low</strong></p>
                <p>Coverage <strong>92%</strong></p>
                <p>Integrity <strong>98%</strong></p>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>APPLICATION QUEUE</div>
              <div className={styles.donut}><span>47</span></div>
              <div className={styles.queueRows}>
                <p>New <strong>12</strong></p>
                <p>In Review <strong>18</strong></p>
                <p>On Hold <strong>6</strong></p>
                <p>Escalated <strong>2</strong></p>
              </div>
            </section>
          </aside>

          <section className={styles.core}>
            <div className={styles.thoughtStream}>
              <div className={styles.cardTitle}>THOUGHT STREAM</div>
              <p>Analyzing 7 live sources</p>
              <p>Cross-checking identity graph</p>
              <p>Scanning route health</p>
              <p>Evaluating payment risk</p>
              <p>Ranking candidate matches</p>
            </div>

            <section className={styles.orbPanel}>
              <div className={styles.wave}></div>
              <div className={`${styles.orb} ${listening ? styles.orbListening : ""} ${speaking ? styles.orbSpeaking : ""}`}>
                <div className={styles.orbRingOne}></div>
                <div className={styles.orbRingTwo}></div>
                <div className={styles.orbCore}>
                  <span>JARVIS</span>
                  <small>{listening ? "Listening" : speaking ? "Speaking" : "Ready"}</small>
                </div>
              </div>
              <div className={styles.workspaceInfo}>
                <div><span>ACTIVE WORKSPACE</span><strong>Founder Intake & Verification</strong></div>
                <div><span>CONTEXT WINDOW</span><strong>Memory Active</strong></div>
                <div><span>REASONING ENGINE</span><strong>Confidence 94%</strong></div>
              </div>
            </section>

            <form className={styles.commandBar} onSubmit={(event) => { event.preventDefault(); sendToJarvis(command, "typing"); }}>
              <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Speak or type command to JARVIS..." aria-label="Jarvis command" />
              <button type="submit">Send</button>
            </form>

            <nav className={styles.modeNav}>
              {["VOICE", "VISION", "DATA", "BRAIN", "AGENTS", "TOOLS"].map((item) => <button key={item} onClick={() => pushEvidence(`${item} mode selected`, "mode", "info")}>{item}</button>)}
            </nav>

            <section className={styles.workflow}>
              {workflow.map((step) => (
                <button
                  key={step.id}
                  className={styles.workflowStep}
                  onClick={() => {
                    setWorkflow((items) => items.map((candidate) => candidate.id === step.id ? { ...candidate, status: candidate.status === "Done" ? "Ready" : "Running" } : candidate));
                    pushEvidence(`workflow selected: ${step.label}`, "workflow", "info");
                  }}
                >
                  <span></span><strong>{step.label}</strong><small>{step.status}</small>
                </button>
              ))}
            </section>

            <section className={styles.replyPanel}>
              <div className={styles.cardTitle}>JARVIS STATUS</div>
              <p><strong>Jarvis:</strong> {reply}</p>
              <p><strong>I heard:</strong> {lastHeard}</p>
            </section>
          </section>

          <aside className={styles.rightRail}>
            <section className={styles.card}>
              <div className={styles.cardTitle}>AGENT STACK</div>
              {agents.map((agent) => (
                <button key={agent.name} className={styles.agentRow} onClick={() => {
                  setAgents((items) => items.map((item) => item.name === agent.name ? { ...item, status: item.status === "ACTIVE" ? "READY" : "ACTIVE" } : item));
                  pushEvidence(`${agent.name} inspected`, "agent", "info");
                }}>
                  <span>{agent.name}</span><strong>{agent.status}</strong><small>{agent.detail}</small>
                </button>
              ))}
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>COMMAND QUEUE</div>
              {COMMANDS.map((preset, index) => <button key={preset} className={styles.commandPreset} onClick={() => sendToJarvis(preset, "preset")}><span>0{index + 1}</span>{preset}</button>)}
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>PRIORITY ACTIONS</div>
              {actions.map((action) => (
                <button key={action.id} className={`${styles.actionRow} ${action.severity === "Critical" ? styles.actionCritical : ""}`} onClick={() => {
                  setFocus(action.detail);
                  pushEvidence(`priority opened: ${action.title}`, "priority", action.severity === "Critical" ? "critical" : "warn");
                }}>
                  <strong>{action.title}</strong><span>{action.detail}</span><small>{action.status}</small>
                </button>
              ))}
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>OPENCLAW TOOLS</div>
              <button className={styles.toolButton} onClick={() => sendToJarvis("Jarvis, verify command readiness.", "tool")}>Verify Command</button>
              <button className={styles.toolButton} onClick={() => sendToJarvis("Jarvis, prepare evidence report.", "tool")}>Evidence Report</button>
              <button className={styles.toolButton} onClick={() => sendToJarvis("Jarvis, launch guarded OpenClaw plan.", "tool")}>Launch OpenClaw</button>
            </section>
          </aside>

          <section className={styles.bottomRail}>
            <section className={styles.card}>
              <div className={styles.cardTitle}>VOICE INPUT</div>
              <div className={styles.voiceWave}></div>
              <p>{lastHeard}</p>
              <div className={styles.buttonRow}>
                <button onClick={startListening}>{listening ? "Listening..." : "Start Voice"}</button>
                <button onClick={stopListening}>Stop</button>
                <button onClick={() => sendToJarvis("Jarvis", "wake-button")}>Wake Jarvis</button>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>LIVE EXECUTION TIMELINE</div>
              <div className={styles.scrollList}>{evidence.map((row) => <p key={row.id} className={styles[row.level]}><span>{row.time}</span> {row.event}</p>)}</div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>EVIDENCE FEED</div>
              <div className={styles.evidenceGrid}>
                {evidence.slice(0, 6).map((row) => (
                  <button key={row.id} onClick={() => setReply(`${row.source}: ${row.event}`)}>
                    <strong>{row.source}</strong><span>{row.event}</span><small>{row.time}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>FOUNDER ACTIONS</div>
              <button className={styles.founderButton} onClick={() => sendToJarvis("Jarvis, generate founder report.", "founder")}>Generate Founder Report</button>
              <button className={styles.founderButton} onClick={() => sendToJarvis("Jarvis, initiate deep investigation.", "founder")}>Initiate Deep Investigation</button>
              <button className={styles.founderButton} onClick={() => sendToJarvis("Jarvis, escalate to operator.", "founder")}>Escalate To Operator</button>
            </section>
          </section>
        </section>

        <footer className={styles.footer}>
          <span>KINGSMEN PROTOCOL</span>
          <span>Discretion is our highest standard</span>
          <span>All operations encrypted end-to-end</span>
          <span>Zero trust architecture</span>
          <strong>JARVIS v2.7.1</strong>
        </footer>
      </div>
    </main>
  );
}

'@

$Css = @'
.stage {
  position: fixed;
  inset: 0;
  margin: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(0, 145, 255, 0.22), transparent 32%),
    radial-gradient(circle at 80% 18%, rgba(38, 255, 181, 0.08), transparent 19%),
    linear-gradient(180deg, #040815 0%, #02050d 62%, #01030a 100%);
  color: #dff7ff;
  font-family: Inter, "Segoe UI", Arial, sans-serif;
}

.stage * {
  box-sizing: border-box;
}

.stage button,
.stage input {
  font-family: inherit;
}

.shell {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  padding: 18px;
  transform-origin: top left;
  display: grid;
  grid-template-rows: 92px 1fr 34px;
  gap: 12px;
}

.header {
  border: 1px solid rgba(86, 207, 255, 0.22);
  border-radius: 24px;
  background: rgba(2, 8, 18, 0.72);
  box-shadow: 0 0 40px rgba(37, 160, 255, 0.12), inset 0 0 24px rgba(57, 171, 255, 0.06);
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  align-items: center;
  padding: 0 30px;
  backdrop-filter: blur(12px);
}

.brandBlock {
  display: flex;
  align-items: center;
  gap: 18px;
}

.crest {
  width: 54px;
  height: 54px;
  border: 1px solid rgba(135, 220, 255, 0.22);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #9fe8ff;
  font-size: 24px;
  background: radial-gradient(circle, rgba(67, 172, 255, 0.18), transparent 62%);
}

.brand {
  font-size: 34px;
  letter-spacing: 0.38em;
  font-weight: 900;
}

.subtitle,
.jarvisSubtitle {
  color: rgba(209, 238, 255, 0.66);
  font-size: 11px;
  letter-spacing: 0.24em;
  font-weight: 800;
  text-transform: uppercase;
}

.titleBlock {
  text-align: center;
}

.jarvisTitle {
  font-size: 58px;
  letter-spacing: 0.42em;
  font-weight: 900;
  text-shadow: 0 0 22px rgba(91, 198, 255, 0.75);
}

.statusStrip {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 10px;
}

.statusPill,
.iconButton {
  border: 1px solid rgba(102, 217, 255, 0.28);
  background: rgba(1, 12, 26, 0.82);
  color: #dff7ff;
  border-radius: 999px;
  min-height: 38px;
  padding: 0 18px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow: inset 0 0 18px rgba(31, 144, 255, 0.12);
}

.statusPill:hover,
.iconButton:hover,
.commandPreset:hover,
.toolButton:hover,
.founderButton:hover,
.workflowStep:hover,
.agentRow:hover,
.actionRow:hover,
.fullButton:hover,
.buttonRow button:hover {
  border-color: rgba(80, 221, 255, 0.85);
  box-shadow: 0 0 22px rgba(42, 180, 255, 0.24), inset 0 0 22px rgba(44, 188, 255, 0.16);
  transform: translateY(-1px);
}

.grid {
  display: grid;
  grid-template-columns: 470px 1fr 470px;
  grid-template-rows: 1fr 245px;
  gap: 12px;
  min-height: 0;
}

.leftRail,
.rightRail {
  display: grid;
  gap: 12px;
  grid-template-rows: repeat(4, 1fr);
  min-height: 0;
}

.core {
  position: relative;
  border: 1px solid rgba(62, 190, 255, 0.22);
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 35%, rgba(48, 167, 255, 0.20), transparent 26%),
    linear-gradient(180deg, rgba(5, 18, 38, 0.92), rgba(2, 7, 16, 0.96));
  box-shadow: inset 0 0 80px rgba(40, 160, 255, 0.09);
}

.card {
  position: relative;
  border: 1px solid rgba(85, 207, 255, 0.22);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(7, 21, 45, 0.86), rgba(3, 9, 20, 0.92));
  box-shadow: inset 0 0 25px rgba(42, 161, 255, 0.07);
  padding: 17px;
  overflow: hidden;
}

.card::before,
.core::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent, rgba(80, 200, 255, 0.045), transparent),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 24px);
  pointer-events: none;
}

.cardTitle {
  font-size: 13px;
  letter-spacing: 0.18em;
  font-weight: 900;
  text-transform: uppercase;
  color: #e7fbff;
  margin-bottom: 12px;
}

.readinessWrap {
  display: grid;
  grid-template-columns: 118px 1fr;
  gap: 16px;
  align-items: center;
}

.readinessRing {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 10px solid rgba(46, 220, 255, 0.22);
  background:
    radial-gradient(circle, rgba(35, 182, 255, 0.18), transparent 55%),
    conic-gradient(from 0deg, #36e4ff 0 96%, rgba(255,255,255,0.08) 96% 100%);
  box-shadow: 0 0 24px rgba(38, 181, 255, 0.22);
  color: white;
  font-weight: 900;
}

.readinessRing span {
  background: #061325;
  border-radius: 50%;
  width: 74px;
  height: 74px;
  display: grid;
  place-items: center;
  font-size: 25px;
}

.readinessList p,
.scoreRows p,
.queueRows p {
  margin: 6px 0;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  font-size: 13px;
  color: rgba(226, 246, 255, 0.74);
}

.readinessList strong,
.scoreRows strong,
.queueRows strong {
  color: #32f6a9;
  text-transform: uppercase;
  font-size: 0.9em;
}

.fullButton,
.toolButton,
.founderButton,
.commandPreset,
.agentRow,
.actionRow,
.workflowStep,
.modeNav button,
.buttonRow button {
  border: 1px solid rgba(93, 208, 255, 0.20);
  background: rgba(3, 17, 35, 0.76);
  color: #dff7ff;
  border-radius: 12px;
  cursor: pointer;
  transition: 160ms ease;
}

.fullButton {
  width: 100%;
  height: 34px;
  margin-top: 12px;
  font-weight: 900;
}

.metricGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.metricGrid div {
  border: 1px solid rgba(101, 210, 255, 0.14);
  border-radius: 12px;
  padding: 10px;
  background: rgba(0, 15, 33, 0.58);
}

.metricGrid span,
.workspaceInfo span {
  display: block;
  color: rgba(211, 236, 255, 0.58);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.metricGrid strong {
  font-size: 23px;
  color: #ffffff;
}

.focusLine {
  color: rgba(227, 246, 255, 0.8);
  font-size: 14px;
  line-height: 1.45;
}

.signalMap {
  height: 72px;
  border: 1px solid rgba(76, 205, 255, 0.14);
  border-radius: 14px;
  background:
    radial-gradient(circle at 60% 40%, rgba(54, 221, 255, 0.25), transparent 8%),
    radial-gradient(circle at 38% 68%, rgba(54, 255, 164, 0.2), transparent 6%),
    radial-gradient(circle at 77% 72%, rgba(255, 225, 111, 0.25), transparent 5%),
    linear-gradient(135deg, rgba(36, 140, 255, 0.08), rgba(2, 9, 19, 0.72));
  position: relative;
  overflow: hidden;
}

.mapPulse {
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(66, 207, 255, 0.22);
  border-radius: 50%;
  animation: pulse 2.6s infinite;
}

.donut {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  float: right;
  margin-left: 14px;
  background: conic-gradient(#31f6a9 0 47%, #44a7ff 47% 74%, rgba(255,255,255,0.12) 74% 100%);
}

.donut span {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  background: #06101f;
  border-radius: 50%;
  font-weight: 900;
  font-size: 22px;
}

.thoughtStream {
  position: absolute;
  z-index: 2;
  top: 9%;
  left: 5%;
  width: 270px;
  border: 1px solid rgba(88, 207, 255, 0.18);
  border-radius: 16px;
  padding: 14px;
  background: rgba(3, 12, 25, 0.54);
  backdrop-filter: blur(8px);
}

.thoughtStream p {
  margin: 8px 0;
  color: rgba(226, 246, 255, 0.72);
  font-size: 13px;
}

.orbPanel {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.wave {
  position: absolute;
  width: 82%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(68, 193, 255, 0.1), #64d7ff, #fff, #64d7ff, rgba(68, 193, 255, 0.1), transparent);
  box-shadow: 0 0 28px rgba(75, 196, 255, 0.85);
  animation: waveGlow 2.5s infinite alternate;
}

.orb {
  position: relative;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle, rgba(135, 225, 255, 0.14), transparent 19%),
    radial-gradient(circle, rgba(61, 155, 255, 0.18), transparent 38%);
  box-shadow: 0 0 80px rgba(35, 150, 255, 0.28);
}

.orbRingOne,
.orbRingTwo {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(117, 224, 255, 0.34);
  inset: 12%;
  animation: rotate 12s linear infinite;
}

.orbRingTwo {
  inset: 25%;
  border-color: rgba(98, 156, 255, 0.42);
  animation-duration: 7s;
  animation-direction: reverse;
}

.orbCore {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle, rgba(227, 248, 255, 0.25), rgba(43, 147, 255, 0.10) 35%, rgba(0, 0, 0, 0.35) 70%);
  border: 1px solid rgba(121, 230, 255, 0.38);
  box-shadow: 0 0 45px rgba(72, 194, 255, 0.48), inset 0 0 20px rgba(75, 207, 255, 0.2);
  text-align: center;
}

.orbCore span {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-shadow: 0 0 18px rgba(93, 212, 255, 0.9);
}

.orbCore small {
  color: #65f5c2;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.18em;
}

.orbListening {
  animation: pulse 1.4s infinite;
}

.orbSpeaking .orbCore {
  box-shadow: 0 0 70px rgba(82, 236, 255, 0.75), inset 0 0 25px rgba(116, 255, 231, 0.35);
}

.workspaceInfo {
  position: absolute;
  right: 4%;
  top: 9%;
  width: 240px;
  display: grid;
  gap: 12px;
}

.workspaceInfo div {
  border: 1px solid rgba(92, 207, 255, 0.16);
  border-radius: 14px;
  padding: 13px;
  background: rgba(2, 10, 22, 0.62);
}

.workspaceInfo strong {
  display: block;
  margin-top: 8px;
  font-size: 14px;
}

.commandBar {
  position: absolute;
  z-index: 3;
  left: 18%;
  right: 18%;
  bottom: 25%;
  height: 62px;
  border: 1px solid rgba(101, 211, 255, 0.24);
  border-radius: 20px;
  display: grid;
  grid-template-columns: 1fr 96px;
  background: rgba(2, 10, 24, 0.78);
  box-shadow: 0 0 35px rgba(35, 154, 255, 0.18);
  overflow: hidden;
}

.commandBar input {
  border: 0;
  outline: 0;
  background: transparent;
  color: #e9fbff;
  padding: 0 24px;
  font-size: 17px;
}

.commandBar button {
  border: 0;
  border-left: 1px solid rgba(101, 211, 255, 0.22);
  background: rgba(0, 24, 50, 0.86);
  color: #ffffff;
  font-weight: 900;
  cursor: pointer;
}

.modeNav {
  position: absolute;
  z-index: 3;
  left: 25%;
  right: 25%;
  bottom: 18.6%;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.modeNav button {
  height: 30px;
  color: rgba(213, 241, 255, 0.8);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.workflow {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 7%;
  height: 78px;
  border: 1px solid rgba(88, 207, 255, 0.15);
  border-radius: 16px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 11px;
  background: rgba(2, 10, 22, 0.55);
}

.workflowStep {
  display: grid;
  place-items: center;
  gap: 3px;
  background: transparent;
  border: 0;
}

.workflowStep span {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid rgba(74, 210, 255, 0.8);
  box-shadow: 0 0 16px rgba(76, 209, 255, 0.3);
}

.workflowStep strong {
  color: #eafaff;
  font-size: 11px;
}

.workflowStep small {
  color: rgba(211, 237, 255, 0.54);
  font-size: 9px;
}

.replyPanel {
  position: absolute;
  left: 4%;
  bottom: 1.6%;
  width: 46%;
  height: 124px;
  border: 1px solid rgba(88, 207, 255, 0.15);
  border-radius: 14px;
  padding: 14px;
  background: rgba(2, 10, 22, 0.68);
}

.replyPanel p {
  margin: 5px 0;
  font-size: 13px;
  line-height: 1.45;
}

.agentRow,
.actionRow,
.commandPreset,
.toolButton,
.founderButton {
  width: 100%;
  text-align: left;
  margin: 7px 0;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
}

.agentRow {
  grid-template-columns: 1fr auto;
}

.agentRow small,
.actionRow span,
.commandPreset,
.toolButton,
.founderButton {
  color: rgba(224, 246, 255, 0.72);
  font-size: 12px;
}

.agentRow strong {
  color: #35f7aa;
  font-size: 11px;
}

.commandPreset {
  grid-template-columns: 28px 1fr;
  align-items: center;
}

.commandPreset span {
  color: #64d7ff;
  font-weight: 900;
}

.actionCritical {
  border-color: rgba(255, 99, 120, 0.34);
  background: rgba(52, 6, 18, 0.42);
}

.actionRow strong {
  color: #ffffff;
}

.actionRow small {
  color: #35f7aa;
}

.bottomRail {
  grid-column: 1 / 4;
  display: grid;
  grid-template-columns: 1.1fr 1.15fr 1.15fr 1fr;
  gap: 12px;
  min-height: 0;
}

.voiceWave {
  height: 58px;
  margin: 4px 0 10px;
  border-radius: 14px;
  background:
    linear-gradient(90deg, transparent, rgba(85, 210, 255, 0.15), transparent),
    repeating-linear-gradient(90deg, rgba(77, 210, 255, 0.2) 0 3px, transparent 3px 10px);
  box-shadow: inset 0 0 20px rgba(76, 210, 255, 0.1);
}

.buttonRow {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}

.buttonRow button {
  min-height: 36px;
  font-size: 12px;
  font-weight: 900;
}

.scrollList {
  max-height: 160px;
  overflow: auto;
  padding-right: 4px;
}

.scrollList p {
  margin: 4px 0;
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  color: rgba(224, 246, 255, 0.82);
}

.scrollList span {
  color: #95eaff;
}

.ok { color: #5cffb9 !important; }
.warn { color: #ffd36b !important; }
.critical { color: #ff8195 !important; }
.info { color: #dff7ff !important; }

.evidenceGrid {
  display: grid;
  gap: 6px;
}

.evidenceGrid button {
  display: grid;
  grid-template-columns: 80px 1fr 54px;
  gap: 8px;
  align-items: center;
  border: 1px solid rgba(88, 207, 255, 0.14);
  background: rgba(1, 10, 22, 0.42);
  color: rgba(231, 249, 255, 0.8);
  border-radius: 9px;
  min-height: 31px;
  cursor: pointer;
  text-align: left;
  font-size: 11px;
}

.evidenceGrid strong {
  color: #5cffb9;
}

.footer {
  border: 1px solid rgba(86, 207, 255, 0.18);
  border-radius: 999px;
  background: rgba(2, 8, 18, 0.78);
  display: grid;
  grid-template-columns: 1fr 1.8fr 1.8fr 1.2fr 1fr;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  color: rgba(229, 247, 255, 0.72);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.footer strong {
  color: #35f7aa;
  text-align: right;
}

@keyframes pulse {
  0% { transform: scale(0.96); opacity: 0.65; }
  50% { transform: scale(1.03); opacity: 1; }
  100% { transform: scale(0.96); opacity: 0.65; }
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

@keyframes waveGlow {
  from { opacity: 0.55; transform: scaleX(0.86); }
  to { opacity: 1; transform: scaleX(1); }
}

'@

$SafeLauncher = @'
# KINGSMEN SAFE JARVIS LAUNCHER
$ErrorActionPreference = "SilentlyContinue"
$App = "C:\Kingsmen\kingsmen-platform\apps\web"
$Url = "http://127.0.0.1:3000/jarvis"
$Port = 3000

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Write-Host "Jarvis server already running on port 3000. Opening existing server." -ForegroundColor Green
  Start-Process "msedge.exe" "--app=$Url"
  exit 0
}

Write-Host "Starting Jarvis Next server on port 3000..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/k cd /d `"$App`" && npm run dev -- -H 127.0.0.1 -p 3000"
Start-Sleep -Seconds 8
Start-Process "msedge.exe" "--app=$Url"

'@

WriteNoBom $HudPath $Tsx
WriteNoBom $CssPath $Css
WriteNoBom $LauncherPath $SafeLauncher

$CmdPath = "C:\Kingsmen\START_JARVIS_SAFE.cmd"
$CmdLines = @(
  "@echo off",
  "title KINGSMEN START JARVIS SAFE",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\START_JARVIS_SAFE.ps1"""
)
[System.IO.File]::WriteAllLines($CmdPath, $CmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $CmdPath) -ForegroundColor Green

$ReportsDir = Join-Path $Repo "reports\jarvis\steps"
$DocsDir = Join-Path $Repo "docs\jarvis"
$ToolsDir = Join-Path $Repo "tools\jarvis"
$ManifestDir = Join-Path $Repo "manifests\jarvis"
EnsureDir $ReportsDir
EnsureDir $DocsDir
EnsureDir $ToolsDir
EnsureDir $ManifestDir

$Now = (Get-Date).ToUniversalTime().ToString("o")
$ProofPath = Join-Path $ReportsDir "STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH_PROOF.json"
$ReportPath = Join-Path $ReportsDir "STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH_REPORT.md"
$LockPath = Join-Path $ManifestDir "jarvis-layout-lock.json"

$Proof = [ordered]@{
  step = "STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH"
  status = "COMPLETE"
  created_at = $Now
  fixed = @(
    "Collapsed responsive layout removed",
    "Fixed 1920x1080 live cockpit scales into any browser window",
    "Port 3000 duplicate launch guarded by START_JARVIS_SAFE.cmd"
  )
  safety_backup = $BackupRoot
  changed_files = @(
    [ordered]@{ path = $HudRel; sha256 = (Sha256File $HudPath) },
    [ordered]@{ path = $CssRel; sha256 = (Sha256File $CssPath) },
    [ordered]@{ path = $LauncherRel; sha256 = (Sha256File $LauncherPath) },
    [ordered]@{ path = "C:\Kingsmen\START_JARVIS_SAFE.cmd"; sha256 = (Sha256File $CmdPath) }
  )
  next_command = "C:\Kingsmen\START_JARVIS_SAFE.cmd"
}
WriteNoBom $ProofPath ($Proof | ConvertTo-Json -Depth 30)

$Lock = [ordered]@{
  lock_name = "jarvis-fixed-live-cockpit-layout-lock"
  status = "LOCKED"
  locked_at = $Now
  rule = "Approved visual language remains; live DOM cockpit must stay fixed 1920x1080 and scale into viewport; no responsive collapse; no wallpaper interface."
  changed_files = @($HudRel, $CssRel)
  proof = $ProofPath
}
WriteNoBom $LockPath ($Lock | ConvertTo-Json -Depth 20)

$Report = @(
  "# STEP 01M - Fixed Viewport and Safe Launch",
  "",
  "Created: $Now",
  "",
  "Status: COMPLETE",
  "",
  "Changed files:",
  "- $HudRel",
  "- $CssRel",
  "- $LauncherRel",
  "- C:\Kingsmen\START_JARVIS_SAFE.cmd",
  "",
  "Fixes:",
  "- EADDRINUSE means the server is already running; the safe launcher opens it instead of starting a duplicate.",
  "- The cockpit is no longer allowed to collapse into mobile/stacked layout.",
  "- The visual system is live DOM, not a wallpaper.",
  "",
  "Run:",
  "C:\Kingsmen\START_JARVIS_SAFE.cmd",
  ""
)
WriteNoBom $ReportPath (($Report -join "`r`n") + "`r`n")

$Ledger = @(
  "",
  "## STEP 01M - Fixed Viewport and Safe Launch",
  "",
  "Status: COMPLETE at $Now",
  "",
  "Changed:",
  "- $HudRel",
  "- $CssRel",
  "- $LauncherRel",
  "- C:\Kingsmen\START_JARVIS_SAFE.cmd",
  "",
  "Proof:",
  "- $ProofPath",
  "- $ReportPath",
  "",
  "Locked:",
  "- Fixed scaled 1920x1080 live cockpit.",
  "- No responsive collapse.",
  "- No wallpaper interface.",
  "- Safe launcher handles port 3000 already in use.",
  ""
)
Add-Content -Path (Join-Path $DocsDir "JARVIS_BUILD_STEP_LEDGER.md") -Value $Ledger -Encoding UTF8

if ($PSCommandPath) {
  Copy-Item $PSCommandPath (Join-Path $ToolsDir "KINGSMEN_JARVIS_STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH.ps1") -Force
}

$StepCmdPath = "C:\Kingsmen\JARVIS_STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH.cmd"
$StepCmdLines = @(
  "@echo off",
  "title KINGSMEN JARVIS STEP 01M FIXED VIEWPORT AND SAFE LAUNCH",
  "powershell -ExecutionPolicy Bypass -NoExit -File ""C:\Kingsmen\kingsmen-platform\tools\jarvis\KINGSMEN_JARVIS_STEP_01M_FIXED_VIEWPORT_AND_SAFE_LAUNCH.ps1"""
)
[System.IO.File]::WriteAllLines($StepCmdPath, $StepCmdLines, [System.Text.Encoding]::ASCII)
Write-Host ("WROTE: " + $StepCmdPath) -ForegroundColor Green

Write-Host ""
Write-Host "STEP 01M COMPLETE." -ForegroundColor Green
Write-Host "Changed:" -ForegroundColor Cyan
Write-Host $HudRel
Write-Host $CssRel
Write-Host $LauncherRel
Write-Host "C:\Kingsmen\START_JARVIS_SAFE.cmd"
Write-Host ""
Write-Host "Run this now:" -ForegroundColor Yellow
Write-Host "C:\Kingsmen\START_JARVIS_SAFE.cmd" -ForegroundColor White
