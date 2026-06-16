"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./JarvisHud.module.css";

type EvidenceRow = {
  id: string;
  time: string;
  event: string;
  source: string;
  level: "info" | "ok" | "warn" | "critical";
};

type AgentState = {
  name: string;
  status: "ACTIVE" | "READY" | "LOCKED" | "IDLE" | "WAITING";
  detail: string;
};

type ActionItem = {
  id: string;
  title: string;
  detail: string;
  severity: "Critical" | "Review" | "Info";
  status: "Open" | "Queued" | "Done";
};

type WorkflowItem = {
  id: string;
  label: string;
  status: "Ready" | "Running" | "Queued" | "Done";
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence?: number };
  }>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const WAKE_GREETING =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine.";

const commandPresets = [
  "Jarvis, give me Kingsmen system status.",
  "Jarvis, inspect voice readiness.",
  "Jarvis, prepare founder morning report.",
  "Jarvis, check pending risks.",
  "Jarvis, summarize the command queue.",
];

function timeStamp(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function JarvisHudClient() {
  const [serverOnline, setServerOnline] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [command, setCommand] = useState("Jarvis, why are you not speaking?");
  const [lastHeard, setLastHeard] = useState("No confirmed live voice command yet.");
  const [reply, setReply] = useState("Awaiting command, Commander.");
  const [mode, setMode] = useState<"voice" | "brain" | "agents" | "tools">("voice");
  const [focus, setFocus] = useState("High priority candidate screening and payment risk review");
  const [evidence, setEvidence] = useState<EvidenceRow[]>([
    { id: makeId("ev"), time: timeStamp(), event: "Live DOM Jarvis cockpit loaded", source: "hud", level: "ok" },
    { id: makeId("ev"), time: timeStamp(), event: "Wallpaper mode removed", source: "layout", level: "ok" },
    { id: makeId("ev"), time: timeStamp(), event: "Commander-only doctrine locked", source: "doctrine", level: "ok" },
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
    { id: "act-2", title: "Route Deviation Alert", detail: "Unusual node behavior in candidate route graph.", severity: "Review", status: "Queued" },
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
  const serverTimerRef = useRef<number | null>(null);

  const readiness = useMemo(() => {
    let score = 70;
    if (serverOnline) score += 12;
    if (listening) score += 8;
    if (autoSpeak) score += 5;
    if (agents.every((agent) => agent.status !== "IDLE")) score += 5;
    return Math.min(score, 100);
  }, [serverOnline, listening, autoSpeak, agents]);

  function pushEvidence(event: string, source: string, level: EvidenceRow["level"] = "info") {
    setEvidence((rows) => [
      { id: makeId("ev"), time: timeStamp(), event, source, level },
      ...rows,
    ].slice(0, 14));
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

    setLastHeard(clean);
    setCommand(clean);
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
        body: JSON.stringify({
          command: clean,
          text: clean,
          source,
          commander_only: true,
          ui_mode: "live-dom-system",
        }),
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
      const fallback = `Certainly, Commander. I heard the command: ${clean}. The local command channel is active, but the API response path needs inspection.`;
      setReply(fallback);
      pushEvidence("api command failed; local fallback used", "api", "warn");
      speak(fallback);
    }
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      pushEvidence("browser speech recognition unavailable", "voice", "warn");
      setReply("Commander, this browser does not expose speech recognition. Use Microsoft Edge or the native voice bridge.");
      speak("Commander, this browser does not expose speech recognition. Use Microsoft Edge or the native voice bridge.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
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
      try {
        recognitionRef.current.stop();
      } catch {}
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
    checkServer();
    serverTimerRef.current = window.setInterval(checkServer, 20000);
    return () => {
      if (serverTimerRef.current) window.clearInterval(serverTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText = serverOnline ? "SYSTEM ONLINE" : "SERVER WAITING";
  const voiceText = listening ? "LISTENING" : "VOICE READY";

  return (
    <main className={styles.stage}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <section className={styles.brandBlock}>
            <div className={styles.crest}>â™”</div>
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
            <button className={styles.statusPill} onClick={() => setAutoSpeak((value) => !value)}>
              {autoSpeak ? "SPEECH ON" : "SPEECH OFF"}
            </button>
            <button className={styles.iconButton} onClick={() => speak("Jarvis voice output is active, Commander.")}>â—‰</button>
            <button className={styles.iconButton} onClick={() => setMode("tools")}>âš™</button>
          </section>
        </header>

        <section className={styles.grid}>
          <aside className={styles.leftRail}>
            <section className={styles.card}>
              <div className={styles.cardTitle}>SYSTEM READINESS</div>
              <div className={styles.readinessWrap}>
                <div className={styles.readinessRing}>
                  <span>{readiness}%</span>
                </div>
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
              <div className={styles.signalMap}>
                <div className={styles.mapPulse}></div>
              </div>
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
              <input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="Speak or type command to JARVIS..."
                aria-label="Jarvis command"
              />
              <button type="submit">Send</button>
            </form>

            <nav className={styles.modeNav}>
              {(["voice", "brain", "agents", "tools"] as const).map((item) => (
                <button
                  key={item}
                  className={mode === item ? styles.modeActive : ""}
                  onClick={() => setMode(item)}
                >
                  {item.toUpperCase()}
                </button>
              ))}
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
                  <span></span>
                  <strong>{step.label}</strong>
                  <small>{step.status}</small>
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
                <button
                  key={agent.name}
                  className={styles.agentRow}
                  onClick={() => {
                    setAgents((items) => items.map((item) => item.name === agent.name ? { ...item, status: item.status === "ACTIVE" ? "READY" : "ACTIVE" } : item));
                    pushEvidence(`${agent.name} inspected`, "agent", "info");
                  }}
                >
                  <span>{agent.name}</span>
                  <strong>{agent.status}</strong>
                  <small>{agent.detail}</small>
                </button>
              ))}
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>COMMAND QUEUE</div>
              {commandPresets.map((preset, index) => (
                <button key={preset} className={styles.commandPreset} onClick={() => sendToJarvis(preset, "preset")}>
                  <span>0{index + 1}</span>
                  {preset}
                </button>
              ))}
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>PRIORITY ACTIONS</div>
              {actions.map((action) => (
                <button
                  key={action.id}
                  className={`${styles.actionRow} ${action.severity === "Critical" ? styles.actionCritical : ""}`}
                  onClick={() => {
                    setFocus(action.detail);
                    pushEvidence(`priority opened: ${action.title}`, "priority", action.severity === "Critical" ? "critical" : "warn");
                  }}
                >
                  <strong>{action.title}</strong>
                  <span>{action.detail}</span>
                  <small>{action.status}</small>
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
              <div className={styles.scrollList}>
                {evidence.map((row) => (
                  <p key={row.id} className={styles[row.level]}>
                    <span>{row.time}</span> {row.event}
                  </p>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardTitle}>EVIDENCE FEED</div>
              <div className={styles.evidenceGrid}>
                {evidence.slice(0, 6).map((row) => (
                  <button key={row.id} onClick={() => setReply(`${row.source}: ${row.event}`)}>
                    <strong>{row.source}</strong>
                    <span>{row.event}</span>
                    <small>{row.time}</small>
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
