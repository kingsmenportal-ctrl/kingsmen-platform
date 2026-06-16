"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { jarvisRealBuildLock } from "@/lib/jarvis/real-build-lock";
import styles from "./JarvisAgent.module.css";

type Message = {
  role: "founder" | "jarvis";
  text: string;
  output?: string;
  error?: string;
  tool?: string;
  ok?: boolean;
  evidencePath?: string;
};

type AgentResponse = {
  ok: boolean;
  tool: string;
  reply: string;
  stdout: string;
  stderr: string;
  evidencePath: string;
  createdPath?: string;
};

type CommandCard = {
  label: string;
  tool: string;
  message: string;
  risk: "safe" | "review" | "approval";
  surface: string;
};

type PublicIntegrationHudItem = {
  id: string;
  name: string;
  nStep: string;
  adapterId: string;
  repository: string;
  liveRoute: string;
  validator: string;
  readiness: string;
  safetyBoundary: string;
  localRuntimeNote: string;
};

type PublicIntegrationHud = {
  ok: boolean;
  summary: {
    total: number;
    liveRoutes: number;
    contractReady: number;
    localRuntimeRequired: number;
  };
  items: PublicIntegrationHudItem[];
};

type PublicGatewayHealthItem = {
  id: string;
  name: string;
  status: "green" | "yellow" | "red";
  httpStatus: number | null;
  latencyMs: number | null;
  reason: string;
};

type PublicGatewayHealth = {
  ok: boolean;
  summary: {
    total: number;
    green: number;
    yellow: number;
    red: number;
    checkedAt: string;
  };
  items: PublicGatewayHealthItem[];
};

type LocalInstallationItem = {
  id: string;
  name: string;
  nStep: string;
  repository: string;
  category: string;
  status: "installed" | "missing" | "unknown";
  command: string;
  version: string | null;
  reason: string;
};

type LocalInstallationReadiness = {
  ok: boolean;
  summary: {
    total: number;
    installed: number;
    missing: number;
    unknown: number;
    checkedAt: string;
  };
  items: LocalInstallationItem[];
};

const wakeGreeting =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready.";

const commandCards: CommandCard[] = [
  { label: "System status", tool: "SYSTEM_STATUS", message: "system status", risk: "safe", surface: "System Health" },
  { label: "Integration HUD", tool: "PUBLIC_INTEGRATION_HUD", message: "show public integration HUD", risk: "safe", surface: "N21 Gates" },
  { label: "Health Probe", tool: "PUBLIC_GATEWAY_HEALTH", message: "run public gateway health probe", risk: "safe", surface: "N21 Gates" },
  { label: "Install Readiness", tool: "LOCAL_INSTALL_READINESS", message: "check local installation readiness", risk: "safe", surface: "N21 Runtime" },
  { label: "Validate N20", tool: "VALIDATE_N20", message: "validate N20", risk: "approval", surface: "Validation" },
  { label: "Run build", tool: "RUN_WEB_BUILD", message: "run web build", risk: "approval", surface: "Build" },
  { label: "Database scan", tool: "DATABASE_SCAN", message: "database scan", risk: "review", surface: "Read Model" },
  { label: "Probe routes", tool: "ROUTE_PROBE", message: "probe routes", risk: "approval", surface: "Route Scout" },
  { label: "Git status", tool: "GIT_STATUS", message: "git status", risk: "safe", surface: "Repo" },
  { label: "Real build lock", tool: "HELP", message: "show Jarvis real build lock", risk: "safe", surface: "Commander Lock" },
  { label: "Help", tool: "HELP", message: "what can you do", risk: "safe", surface: "Dialogue" }
];

const missionPanels = [
  { title: "Real Build", value: "LOCKED", note: "Issue #36 active" },
  { title: "Visual Law", value: "SYSTEM", note: "Not wallpaper" },
  { title: "Local Runtime", value: "CHECKED", note: "N21.9 install readiness" },
  { title: "N21 Gates", value: "HUD", note: "Public integration board" },
  { title: "Proof", value: "REQUIRED", note: "Repo and build evidence" }
];

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-ZA";
  utterance.rate = 0.95;
  utterance.pitch = 0.9;
  window.speechSynthesis.speak(utterance);
}

function getSpeechRecognition() {
  const api = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return api.SpeechRecognition || api.webkitSpeechRecognition;
}

function confidenceFor(message?: Message) {
  if (!message) return "standby";
  if (message.ok === false) return "needs review";
  if (message.evidencePath) return "evidence linked";
  if (message.output) return "tool output";
  return "dialogue";
}

function healthClass(status: PublicGatewayHealthItem["status"]) {
  if (status === "green") return styles.healthGreen;
  if (status === "yellow") return styles.healthYellow;
  return styles.healthRed;
}

function installClass(status: LocalInstallationItem["status"]) {
  if (status === "installed") return styles.installInstalled;
  if (status === "missing") return styles.installMissing;
  return styles.installUnknown;
}

export default function JarvisAgentClient() {
  const [input, setInput] = useState("system status");
  const [running, setRunning] = useState(false);
  const [voiceState, setVoiceState] = useState("voice ready");
  const [integrationHud, setIntegrationHud] = useState<PublicIntegrationHud | null>(null);
  const [integrationHudError, setIntegrationHudError] = useState<string | null>(null);
  const [gatewayHealth, setGatewayHealth] = useState<PublicGatewayHealth | null>(null);
  const [gatewayHealthError, setGatewayHealthError] = useState<string | null>(null);
  const [localReadiness, setLocalReadiness] = useState<LocalInstallationReadiness | null>(null);
  const [localReadinessError, setLocalReadinessError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "jarvis",
      text: `${wakeGreeting} ${jarvisRealBuildLock.decision}`,
      ok: true
    }
  ]);
  const [visualActive, setVisualActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lastJarvis = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "jarvis");
  }, [messages]);

  const lastOutput = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "jarvis" && message.output);
  }, [messages]);

  const evidenceItems = useMemo(() => {
    return messages.filter((message) => message.role === "jarvis" && (message.evidencePath || message.tool || message.error));
  }, [messages]);

  function healthFor(id: string) {
    return gatewayHealth?.items.find((item) => item.id === id) ?? null;
  }

  function installFor(id: string) {
    const aliases: Record<string, string[]> = {
      "docling-smart-intake": ["docling-runtime"],
      "playwright-scout-gateway": ["playwright-browser-runtime"],
      "jarvis-voice-gateway": ["openwakeword-runtime", "whisper-cpp-runtime", "piper-runtime"],
      "jarvis-security-scan-gate": ["gitleaks-runtime", "trivy-runtime", "semgrep-runtime"]
    };
    const ids = aliases[id] ?? [];
    return localReadiness?.items.filter((item) => ids.includes(item.id)) ?? [];
  }

  async function refreshIntegrationHud() {
    try {
      const response = await fetch("/api/jarvis/public-repos/hud", { cache: "no-store" });
      const payload = (await response.json()) as PublicIntegrationHud;
      if (!response.ok || !payload.ok) {
        setIntegrationHudError("public integration HUD unavailable");
        return;
      }
      setIntegrationHud(payload);
      setIntegrationHudError(null);
    } catch (error) {
      setIntegrationHudError(error instanceof Error ? error.message : "public integration HUD request failed");
    }
  }

  async function refreshGatewayHealth() {
    try {
      const response = await fetch("/api/jarvis/public-repos/health", { cache: "no-store" });
      const payload = (await response.json()) as PublicGatewayHealth;
      if (!response.ok || !payload.ok) {
        setGatewayHealthError("public gateway health unavailable");
        return;
      }
      setGatewayHealth(payload);
      setGatewayHealthError(null);
    } catch (error) {
      setGatewayHealthError(error instanceof Error ? error.message : "public gateway health request failed");
    }
  }

  async function refreshLocalReadiness() {
    try {
      const response = await fetch("/api/jarvis/public-repos/local-readiness", { cache: "no-store" });
      const payload = (await response.json()) as LocalInstallationReadiness;
      if (!response.ok || !payload.ok) {
        setLocalReadinessError("local installation readiness unavailable");
        return;
      }
      setLocalReadiness(payload);
      setLocalReadinessError(null);
    } catch (error) {
      setLocalReadinessError(error instanceof Error ? error.message : "local installation readiness request failed");
    }
  }

  async function runAgent(message: string, tool?: string) {
    const clean = message.trim();
    if (!clean || running) return;

    if (tool === "LOCAL_INSTALL_READINESS" || clean.toLowerCase().includes("local installation") || clean.toLowerCase().includes("install readiness")) {
      await refreshLocalReadiness();
      setMessages((items) => [
        ...items,
        { role: "founder", text: clean },
        {
          role: "jarvis",
          text: "Commander, local installation readiness is refreshed. It checks allowlisted local packages and binaries only, with no install, mutation, secret output, or deployment block.",
          ok: true,
          tool: "LOCAL_INSTALL_READINESS"
        }
      ]);
      speak("Commander, local installation readiness is refreshed.");
      return;
    }

    if (tool === "PUBLIC_GATEWAY_HEALTH" || clean.toLowerCase().includes("gateway health") || clean.toLowerCase().includes("health probe")) {
      await refreshGatewayHealth();
      setMessages((items) => [
        ...items,
        { role: "founder", text: clean },
        {
          role: "jarvis",
          text: "Commander, the public gateway health probe is refreshed. It checks local GET routes only and reports green, yellow, or red without executing POST actions or tools.",
          ok: true,
          tool: "PUBLIC_GATEWAY_HEALTH"
        }
      ]);
      speak("Commander, the public gateway health probe is refreshed.");
      return;
    }

    if (clean.toLowerCase().includes("public integration hud")) {
      await refreshIntegrationHud();
      await refreshGatewayHealth();
      await refreshLocalReadiness();
      setMessages((items) => [
        ...items,
        { role: "founder", text: clean },
        {
          role: "jarvis",
          text: "Commander, the public integration HUD is refreshed. It shows Docling, Playwright, Voice, Trace Evidence, and Security Scan gates with their live routes, safety boundaries, local route health, and installation readiness.",
          ok: true,
          tool: "PUBLIC_INTEGRATION_HUD"
        }
      ]);
      speak("Commander, the public integration HUD is refreshed.");
      return;
    }

    if (clean.toLowerCase().includes("real build lock")) {
      const lockText = [
        jarvisRealBuildLock.decision,
        jarvisRealBuildLock.visualLaw,
        jarvisRealBuildLock.localLaw,
        jarvisRealBuildLock.proofLaw,
        `Next build: ${jarvisRealBuildLock.nextBuild.join(" | ")}`
      ].join("\n");
      setMessages((items) => [
        ...items,
        { role: "founder", text: clean },
        { role: "jarvis", text: lockText, ok: true, tool: "REAL_BUILD_LOCK" }
      ]);
      speak("Commander, the real build lock is active. Jarvis will not treat the visual system as wallpaper or continue planning instead of building.");
      return;
    }

    setRunning(true);
    setMessages((items) => [...items, { role: "founder", text: clean }]);

    try {
      const response = await fetch("/api/jarvis/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: clean, tool })
      });

      const payload = (await response.json()) as AgentResponse;
      const finalText = payload.createdPath
        ? `${payload.reply} File: ${payload.createdPath}`
        : payload.reply;

      setMessages((items) => [
        ...items,
        {
          role: "jarvis",
          text: finalText,
          output: payload.stdout,
          error: payload.stderr,
          tool: payload.tool,
          ok: payload.ok,
          evidencePath: payload.evidencePath
        }
      ]);

      speak(payload.ok ? finalText : `Command failed. ${payload.reply}`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Jarvis agent failed.";
      setMessages((items) => [...items, { role: "jarvis", text: "Agent request failed.", error: text, ok: false }]);
      speak("Agent request failed.");
    } finally {
      setRunning(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runAgent(input);
  }

  async function startVoice() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceState("voice unsupported in this browser; use Chrome or Edge");
      speak("Voice is unsupported in this browser. Use Chrome or Edge.");
      return;
    }

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((track) => track.stop());
    } catch {
      setVoiceState("microphone blocked; allow microphone on 127.0.0.1");
      speak("Microphone blocked. Allow microphone access in the browser.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-ZA";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState("listening");
      speak("Listening, Commander.");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setInput(transcript);
      setVoiceState(`heard: ${transcript}`);
      runAgent(transcript);
    };

    recognition.onerror = (event: any) => {
      setVoiceState(`voice error: ${event?.error ?? "unknown"}`);
    };

    recognition.onend = () => {
      setVoiceState((current) => (current === "listening" ? "voice ready" : current));
    };

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
    refreshIntegrationHud();
    refreshGatewayHealth();
    refreshLocalReadiness();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <main className={styles.shell}>
      <div className={styles.grid} />
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>KINGSMEN COMMAND HOUSE · REAL JARVIS BUILD LOCK ACTIVE</p>
            <h1>JARVIS</h1>
            <p className={styles.subtitle}>{wakeGreeting}</p>
            <p className={styles.subtitle}>{jarvisRealBuildLock.visualLaw}</p>
          </div>
          <div className={styles.statusStack}>
            <div className={styles.status}>
              <span className={running ? styles.pulseWarn : styles.pulseOk} />
              <strong>{running ? "EXECUTING" : "REAL BUILD"}</strong>
              <small>{voiceState}</small>
            </div>
            <div className={styles.confidenceChip}>{confidenceFor(lastJarvis)}</div>
          </div>
        </header>

        <section className={styles.missionBoard}>
          {missionPanels.map((panel) => (
            <article key={panel.title} className={styles.missionCard}>
              <span>{panel.title}</span>
              <strong>{panel.value}</strong>
              <small>{panel.note}</small>
            </article>
          ))}
        </section>

        <section className={styles.integrationHud}>
          <div className={styles.integrationHudHeader}>
            <div>
              <span>N21 PUBLIC INTEGRATION HUD</span>
              <strong>{integrationHud ? `${integrationHud.summary.liveRoutes}/${integrationHud.summary.total} live routes` : "loading"}</strong>
              <small>{gatewayHealth ? `${gatewayHealth.summary.green} green · ${gatewayHealth.summary.yellow} yellow · ${gatewayHealth.summary.red} red` : "health probe loading"}</small>
              <small>{localReadiness ? `${localReadiness.summary.installed} installed · ${localReadiness.summary.missing} missing · ${localReadiness.summary.unknown} unknown` : "install readiness loading"}</small>
            </div>
            <div className={styles.integrationActions}>
              <button type="button" onClick={refreshIntegrationHud}>Refresh HUD</button>
              <button type="button" onClick={refreshGatewayHealth}>Probe Health</button>
              <button type="button" onClick={refreshLocalReadiness}>Check Installs</button>
            </div>
          </div>
          {integrationHudError ? <p className={styles.integrationError}>{integrationHudError}</p> : null}
          {gatewayHealthError ? <p className={styles.integrationError}>{gatewayHealthError}</p> : null}
          {localReadinessError ? <p className={styles.integrationError}>{localReadinessError}</p> : null}
          <div className={styles.integrationGrid}>
            {(integrationHud?.items ?? []).map((item) => {
              const health = healthFor(item.id);
              const installs = installFor(item.id);
              return (
                <article key={item.id} className={styles.integrationCard}>
                  <div className={styles.integrationMeta}>
                    <span>{item.nStep}</span>
                    <strong>{item.name}</strong>
                  </div>
                  <p>{item.safetyBoundary}</p>
                  <code>{item.liveRoute}</code>
                  {health ? (
                    <span className={`${styles.healthPill} ${healthClass(health.status)}`}>
                      {health.status} · {health.httpStatus ?? "no status"} · {health.latencyMs ?? "?"}ms
                    </span>
                  ) : null}
                  {installs.length ? (
                    <div className={styles.installStack}>
                      {installs.map((install) => (
                        <span key={install.id} className={`${styles.installPill} ${installClass(install.status)}`} title={install.reason}>
                          {install.name}: {install.status}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <small>{item.readiness} · {item.adapterId}</small>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.layout}>
          <aside className={styles.left}>
            <div className={running ? styles.orbActive : styles.orb} aria-label="Jarvis voice orb">
              <div className={styles.r1} />
              <div className={styles.r2} />
              <div className={styles.core}>J</div>
            </div>

            <button className={styles.voiceButton} onClick={startVoice} disabled={running}>
              VOICE COMMAND
            </button>
            <button className={styles.voiceButton} onClick={toggleVisual}>
              {visualActive ? "STOP VISUAL FEED" : "START VISUAL FEED"}
            </button>

            <div className={styles.camera}>
              <video ref={videoRef} autoPlay muted playsInline />
              {!visualActive ? <span>visual feed standby</span> : null}
            </div>

            <section className={styles.approvalBox}>
              <strong>Commander Lock</strong>
              <p>{jarvisRealBuildLock.localLaw}</p>
            </section>
          </aside>

          <section className={styles.chat}>
            <div className={styles.commandDeck}>
              {commandCards.map((item) => (
                <button
                  key={item.tool + item.label}
                  className={styles.commandCard}
                  onClick={() => {
                    setInput(item.message);
                    runAgent(item.message, item.tool);
                  }}
                  disabled={running}
                >
                  <span>{item.surface}</span>
                  <strong>{item.label}</strong>
                  <small>{item.risk}</small>
                </button>
              ))}
            </div>

            <div className={styles.messages}>
              {messages.map((message, index) => (
                <article key={index} className={message.role === "founder" ? styles.founderMsg : styles.jarvisMsg}>
                  <div className={styles.messageMeta}>
                    <strong>{message.role === "founder" ? "COMMANDER" : `JARVIS${message.tool ? ` · ${message.tool}` : ""}`}</strong>
                    <span>{message.ok === false ? "needs review" : message.evidencePath ? "evidence" : "live"}</span>
                  </div>
                  <p>{message.text}</p>
                  {message.evidencePath ? <code className={styles.evidenceLine}>Evidence: {message.evidencePath}</code> : null}
                  {message.output ? <pre>{message.output}</pre> : null}
                  {message.error ? <pre className={styles.error}>{message.error}</pre> : null}
                </article>
              ))}
            </div>

            <form className={styles.form} onSubmit={submit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Command Jarvis from Kingsmen Command..."
              />
              <button disabled={running}>{running ? "RUNNING" : "SEND"}</button>
            </form>
          </section>

          <aside className={styles.right}>
            <section className={styles.panel}>
              <h2>Real build lock</h2>
              <p>{jarvisRealBuildLock.decision}</p>
              <ul>
                {jarvisRealBuildLock.nextBuild.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className={styles.panel}>
              <h2>Public integration status</h2>
              {integrationHud ? (
                <ul className={styles.evidenceList}>
                  {integrationHud.items.map((item) => {
                    const health = healthFor(item.id);
                    return (
                      <li key={item.id}>
                        <strong>{item.nStep} · {item.name}</strong>
                        <span>{item.readiness} · {item.liveRoute}</span>
                        {health ? <span>{health.status} · HTTP {health.httpStatus ?? "none"} · {health.reason}</span> : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Public integration HUD loading.</p>
              )}
            </section>

            <section className={styles.panel}>
              <h2>Local installation readiness</h2>
              {localReadiness ? (
                <ul className={styles.evidenceList}>
                  {localReadiness.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.nStep} · {item.name}</strong>
                      <span>{item.status} · {item.version ?? "no version"}</span>
                      <span>{item.reason}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Local installation readiness loading.</p>
              )}
            </section>

            <section className={styles.panel}>
              <h2>Live output</h2>
              {lastOutput?.output ? <pre>{lastOutput.output}</pre> : <p>No command output yet.</p>}
            </section>

            <section className={styles.panel}>
              <h2>Evidence drawer</h2>
              {evidenceItems.length ? (
                <ul className={styles.evidenceList}>
                  {evidenceItems.slice(-8).reverse().map((item, index) => (
                    <li key={`${item.tool ?? "dialogue"}-${index}`}>
                      <strong>{item.tool ?? "JARVIS"}</strong>
                      <span>{item.evidencePath ?? item.error ?? "tool output captured"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No evidence captured yet.</p>
              )}
            </section>

            <section className={styles.panel}>
              <h2>HUD surfaces</h2>
              <ul>
                <li>Real build lock</li>
                <li>Mission board</li>
                <li>N21 public integration HUD</li>
                <li>N21 public gateway health probe</li>
                <li>N21 local installation readiness</li>
                <li>Command deck</li>
                <li>Voice orb</li>
                <li>Commander lock</li>
                <li>Evidence drawer</li>
                <li>Source confidence chip</li>
              </ul>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
