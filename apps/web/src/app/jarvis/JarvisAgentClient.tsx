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

const wakeGreeting =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready.";

const commandCards: CommandCard[] = [
  { label: "System status", tool: "SYSTEM_STATUS", message: "system status", risk: "safe", surface: "System Health" },
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
  { title: "Local Runtime", value: "CMD-SAFE", note: "No wrong shell syntax" },
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

export default function JarvisAgentClient() {
  const [input, setInput] = useState("system status");
  const [running, setRunning] = useState(false);
  const [voiceState, setVoiceState] = useState("voice ready");
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

  async function runAgent(message: string, tool?: string) {
    const clean = message.trim();
    if (!clean || running) return;

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
