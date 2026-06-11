"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./JarvisAgent.module.css";

type Message = {
  role: "founder" | "jarvis";
  text: string;
  output?: string;
  error?: string;
  tool?: string;
  ok?: boolean;
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

const quickTools = [
  { label: "System status", tool: "SYSTEM_STATUS", message: "system status" },
  { label: "Validate N20", tool: "VALIDATE_N20", message: "validate N20" },
  { label: "Run build", tool: "RUN_WEB_BUILD", message: "run web build" },
  { label: "Database scan", tool: "DATABASE_SCAN", message: "database scan" },
  { label: "Probe routes", tool: "ROUTE_PROBE", message: "probe routes" },
  { label: "Git status", tool: "GIT_STATUS", message: "git status" },
  { label: "Create file", tool: "CREATE_FILE", message: "create a file saying Jarvis is connected and writing real files" },
  { label: "Help", tool: "HELP", message: "what can you do" }
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

export default function JarvisAgentClient() {
  const [input, setInput] = useState("system status");
  const [running, setRunning] = useState(false);
  const [voiceState, setVoiceState] = useState("voice ready");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "jarvis",
      text: "Real Jarvis agent runtime online. I can run Kingsmen checks, scan PostgreSQL, probe routes, create safe files, run build, validate N20, and speak responses."
    }
  ]);
  const [visualActive, setVisualActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lastOutput = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "jarvis" && message.output);
  }, [messages]);

  async function runAgent(message: string, tool?: string) {
    const clean = message.trim();
    if (!clean || running) return;

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
          ok: payload.ok
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
      speak("Listening.");
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
      setVoiceState((current) => current === "listening" ? "voice ready" : current);
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
            <p className={styles.kicker}>KINGSMEN REAL JARVIS AGENT RUNTIME</p>
            <h1>JARVIS</h1>
            <p className={styles.subtitle}>
              Connected local operator with tools, voice, speech response, route probes, DB scans, build, N20 validation, file creation, and evidence logging.
            </p>
          </div>
          <div className={styles.status}>
            <span className={running ? styles.pulseWarn : styles.pulseOk} />
            <strong>{running ? "EXECUTING" : "ONLINE"}</strong>
            <small>{voiceState}</small>
          </div>
        </header>

        <section className={styles.layout}>
          <aside className={styles.left}>
            <div className={styles.orb}>
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

            <div className={styles.tools}>
              {quickTools.map((item) => (
                <button
                  key={item.tool}
                  onClick={() => {
                    setInput(item.message);
                    runAgent(item.message, item.tool);
                  }}
                  disabled={running}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          <section className={styles.chat}>
            <div className={styles.messages}>
              {messages.map((message, index) => (
                <article key={index} className={message.role === "founder" ? styles.founderMsg : styles.jarvisMsg}>
                  <strong>{message.role === "founder" ? "FOUNDER" : `JARVIS${message.tool ? ` · ${message.tool}` : ""}`}</strong>
                  <p>{message.text}</p>
                  {message.output ? <pre>{message.output}</pre> : null}
                  {message.error ? <pre className={styles.error}>{message.error}</pre> : null}
                </article>
              ))}
            </div>

            <form className={styles.form} onSubmit={submit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Tell Jarvis what to do..."
              />
              <button disabled={running}>{running ? "RUNNING" : "SEND"}</button>
            </form>
          </section>

          <aside className={styles.right}>
            <h2>Live output</h2>
            {lastOutput?.output ? <pre>{lastOutput.output}</pre> : <p>No command output yet.</p>}
            <h2>Real tools</h2>
            <ul>
              <li>System status</li>
              <li>N20 validation</li>
              <li>Web build</li>
              <li>PostgreSQL DB scan</li>
              <li>Route/API probe</li>
              <li>Git status</li>
              <li>Safe file creation</li>
              <li>Evidence logging</li>
            </ul>
          </aside>
        </section>
      </section>
    </main>
  );
}
