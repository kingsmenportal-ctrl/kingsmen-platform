"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./JarvisProductionCommand.module.css";

type JarvisAction = {
  id: string;
  title: string;
  description: string;
};

type JarvisMessage = {
  id: string;
  role: "founder" | "jarvis" | "system";
  text: string;
  at: string;
  ok?: boolean;
};

type ConversationResponse = {
  ok?: boolean;
  reply?: string;
  actions?: JarvisAction[];
  providerConfigured?: boolean;
};

type StatusPayload = {
  backendHealthStatus?: number;
  backendHealth?: { storageMode?: string } | null;
  generatedAt?: string;
};

type LiveIndexPayload = {
  runtimeBlocker?: string | null;
  productionReady?: boolean;
  publicLaunchAllowed?: boolean;
  backendHealthStatus?: number;
  backendStorageMode?: string;
  generatedAt?: string;
};

const CORE_ACTIONS: JarvisAction[] = [
  { id: "SYSTEM_VALIDATE_N20", title: "System lock", description: "Validate the Kingsmen N20 lock and source-safe posture." },
  { id: "COMMAND_PERSISTENCE_PROOF", title: "Truth Vault", description: "Send one backend-safe envelope and check command evidence." },
  { id: "AI_PROVIDER_ROUTER_CHECK", title: "AI router", description: "Inspect AI provider readiness without exposing keys." },
  { id: "EMAIL_PRIMARY_CHANNEL_CHECK", title: "Email channel", description: "Inspect the email-first communication boundary." },
  { id: "PAYFAST_STAGING_EVIDENCE", title: "PayFast", description: "Review PayFast staging and accepted ITN evidence posture." },
  { id: "N8N_THIN_RELAY_CHECK", title: "n8n relay", description: "Confirm relay-only automation boundary." },
  { id: "GITHUB_TOOL_CONNECTOR_CHECK", title: "GitHub", description: "Review repo connector evidence and metadata boundary." },
  { id: "EVIDENCE_BUNDLE_REVIEW", title: "Evidence", description: "Review launch evidence bundle and founder approval posture." }
];

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function displayTime(value?: string) {
  if (!value) return "not synced";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "not synced" : date.toLocaleTimeString();
}

function getRecognitionConstructor() {
  const browser = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return browser.SpeechRecognition || browser.webkitSpeechRecognition;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-ZA";
  utterance.rate = 0.9;
  utterance.pitch = 0.72;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export default function JarvisProductionCommandClient() {
  const [messages, setMessages] = useState<JarvisMessage[]>([
    {
      id: uid("boot"),
      role: "jarvis",
      text: "Hello sir, welcome to Kingsmen. I am Jarvis. Say Jarvis, then tell me what you need.",
      at: now(),
      ok: true
    }
  ]);
  const [input, setInput] = useState("");
  const [voiceState, setVoiceState] = useState<"standby" | "listening" | "thinking" | "speaking" | "unsupported" | "blocked">("standby");
  const [thinking, setThinking] = useState(false);
  const [actions, setActions] = useState<JarvisAction[]>(CORE_ACTIONS.slice(0, 4));
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [liveIndex, setLiveIndex] = useState<LiveIndexPayload | null>(null);
  const [visualOn, setVisualOn] = useState(false);
  const [visualError, setVisualError] = useState("");
  const recognitionRef = useRef<any>(null);
  const voiceEnabledRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const backendOnline = status?.backendHealthStatus === 200 || liveIndex?.backendHealthStatus === 200;
  const truthVaultOnline = status?.backendHealth?.storageMode === "postgres_truth_vault" || liveIndex?.backendStorageMode === "postgres_truth_vault";
  const productionReady = Boolean(liveIndex?.productionReady);
  const publicLaunchAllowed = Boolean(liveIndex?.publicLaunchAllowed);
  const liveLine = backendOnline
    ? truthVaultOnline
      ? "Truth Vault spine connected. Jarvis can route backend-safe actions."
      : "Backend reached. Truth Vault evidence still needs confirmation."
    : "Backend not connected. Conversation still opens, but command execution needs the API runtime.";

  function pushMessage(role: JarvisMessage["role"], text: string, ok = true) {
    setMessages((items) => [...items, { id: uid(role), role, text, at: now(), ok }]);
  }

  async function syncRuntime() {
    const [statusResult, liveResult] = await Promise.allSettled([
      fetch("/api/jarvis/status", { cache: "no-store" }).then((response) => response.json() as Promise<StatusPayload>),
      fetch("/api/jarvis/live-index", { cache: "no-store" }).then((response) => response.json() as Promise<LiveIndexPayload>)
    ]);
    if (statusResult.status === "fulfilled") setStatus(statusResult.value);
    if (liveResult.status === "fulfilled") setLiveIndex(liveResult.value);
  }

  async function askJarvis(text: string) {
    const question = text.trim();
    if (!question || thinking) return;
    setInput("");
    setThinking(true);
    setVoiceState("thinking");
    pushMessage("founder", question, true);

    try {
      const response = await fetch("/api/jarvis/conversation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: question, surface: "kingsmen_jarvis_voice_companion" })
      });
      const payload = (await response.json()) as ConversationResponse;
      const reply = payload.reply || "Sir, I heard you, but Jarvis returned no spoken answer.";
      setActions(payload.actions?.length ? payload.actions : CORE_ACTIONS.slice(0, 4));
      pushMessage("jarvis", reply, response.ok && payload.ok !== false);
      setVoiceState("speaking");
      speak(reply);
      window.setTimeout(() => setVoiceState(voiceEnabledRef.current ? "listening" : "standby"), 1200);
    } catch {
      const reply = "Sir, Jarvis conversation route is unavailable. I cannot fake a brain response. Check the web route and backend provider configuration.";
      pushMessage("jarvis", reply, false);
      speak(reply);
      setVoiceState(voiceEnabledRef.current ? "listening" : "standby");
    } finally {
      setThinking(false);
      await syncRuntime();
    }
  }

  async function executeAction(action: JarvisAction) {
    pushMessage("founder", `Run Kingsmen action: ${action.title}.`, true);
    setThinking(true);
    setVoiceState("thinking");
    try {
      const response = await fetch("/api/jarvis/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          commandId: action.id,
          clientRequestId: uid("jarvis_action"),
          surface: "kingsmen_jarvis_voice_companion",
          localShellRequested: false,
          directDatabaseAccessRequested: false
        })
      });
      const payload = await response.json().catch(() => ({}));
      const reply = response.ok
        ? `${action.title} was handed to the Kingsmen backend boundary. I will keep launch and payment authority locked until real evidence clears.`
        : payload?.message || `${action.title} was not accepted by the backend boundary.`;
      pushMessage("jarvis", reply, response.ok);
      speak(reply);
    } catch {
      const reply = `${action.title} could not reach the backend boundary. Start the API runtime, then ask me again.`;
      pushMessage("jarvis", reply, false);
      speak(reply);
    } finally {
      setThinking(false);
      setVoiceState(voiceEnabledRef.current ? "listening" : "standby");
      await syncRuntime();
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askJarvis(input);
  }

  async function enableVoice() {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setVoiceState("unsupported");
      speak("Voice recognition is not supported in this browser. Use Microsoft Edge or Chrome.");
      return;
    }

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach((track) => track.stop());
    } catch {
      setVoiceState("blocked");
      speak("Microphone permission is blocked. Allow microphone access for Jarvis.");
      return;
    }

    voiceEnabledRef.current = true;
    const recognition = new Recognition();
    recognition.lang = "en-ZA";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceState("listening");
    recognition.onresult = (event: any) => {
      const result = event.results?.[event.results.length - 1]?.[0]?.transcript ?? "";
      const heard = String(result).trim();
      if (!heard) return;
      const lower = heard.toLowerCase();
      if (lower.includes("jarvis")) {
        const cleaned = heard.replace(/jarvis/ig, "").trim();
        askJarvis(cleaned || "Hello Jarvis. Start the Kingsmen operating conversation.");
      }
    };
    recognition.onerror = () => setVoiceState("standby");
    recognition.onend = () => {
      if (voiceEnabledRef.current) {
        window.setTimeout(() => recognition.start(), 600);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    const greeting = "Hello sir, welcome to Kingsmen. Jarvis voice is active. Say Jarvis, then speak naturally.";
    pushMessage("jarvis", greeting, true);
    speak(greeting);
  }

  function stopVoice() {
    voiceEnabledRef.current = false;
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setVoiceState("standby");
  }

  async function toggleVisual() {
    if (visualOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setVisualOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setVisualOn(true);
      setVisualError("");
    } catch {
      setVisualError("Camera permission blocked.");
    }
  }

  useEffect(() => {
    syncRuntime();
    const timer = window.setInterval(syncRuntime, 15000);
    return () => {
      window.clearInterval(timer);
      voiceEnabledRef.current = false;
      recognitionRef.current?.stop?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <main className={styles.shell}>
      <div className={styles.glow} />
      <section className={styles.stage}>
        <header className={styles.header}>
          <div>
            <span className={styles.kicker}>KINGSMEN · VOICE OPERATING COMPANION</span>
            <h1>JARVIS</h1>
            <p>I am listening for Kingsmen. Speak to me naturally. Say <b>Jarvis</b>, then ask me to think, research, inspect, plan or run a backend-safe Kingsmen action.</p>
          </div>
          <aside className={styles.statusOrb}>
            <div className={`${styles.orb} ${voiceState === "listening" ? styles.orbLive : ""}`}><span>J</span></div>
            <strong>{voiceState}</strong>
            <small>{liveLine}</small>
          </aside>
        </header>

        <section className={styles.controlBar}>
          <button onClick={enableVoice}>Start Jarvis voice</button>
          <button onClick={stopVoice}>Stop voice</button>
          <button onClick={() => askJarvis("Hello Jarvis. Greet me and brief me on Kingsmen.")}>Speak with Jarvis</button>
          <button onClick={toggleVisual}>{visualOn ? "Stop visual context" : "Start visual context"}</button>
          <button onClick={syncRuntime}>Sync runtime</button>
        </section>

        <section className={styles.metrics}>
          <article><span>Backend</span><strong>{backendOnline ? "online" : "offline"}</strong></article>
          <article><span>Truth Vault</span><strong>{truthVaultOnline ? "connected" : "pending"}</strong></article>
          <article><span>Production</span><strong>{productionReady ? "ready" : "locked"}</strong></article>
          <article><span>Public launch</span><strong>{publicLaunchAllowed ? "open" : "locked"}</strong></article>
          <article><span>Last sync</span><strong>{displayTime(liveIndex?.generatedAt ?? status?.generatedAt)}</strong></article>
        </section>

        <section className={styles.mainGrid}>
          <section className={styles.dialoguePanel}>
            <div className={styles.panelHead}>
              <span>Constructive dialogue</span>
              <strong>{thinking ? "thinking" : "ready"}</strong>
            </div>
            <div className={styles.messages}>
              {messages.slice(-14).map((message) => (
                <article key={message.id} className={message.role === "founder" ? styles.founderMessage : styles.jarvisMessage}>
                  <span>{message.role === "founder" ? "FOUNDER" : "JARVIS"} · {new Date(message.at).toLocaleTimeString()}</span>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>
            <form onSubmit={submit} className={styles.askBar}>
              <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Jarvis anything about Kingsmen, strategy, operations, research, build steps, providers, payments, candidates or launch..." />
              <button disabled={thinking || !input.trim()}>{thinking ? "Jarvis thinking" : "Ask Jarvis"}</button>
            </form>
          </section>

          <aside className={styles.actionPanel}>
            <div className={styles.panelHead}>
              <span>Kingsmen actions</span>
              <strong>backend-safe</strong>
            </div>
            <div className={styles.actions}>
              {(actions.length ? actions : CORE_ACTIONS).map((action) => (
                <button key={action.id} onClick={() => executeAction(action)} disabled={thinking}>
                  <span>{action.title}</span>
                  <small>{action.description}</small>
                </button>
              ))}
            </div>
            <div className={styles.visualBox}>
              <video ref={videoRef} autoPlay muted playsInline className={visualOn ? styles.videoLive : styles.videoHidden} />
              {!visualOn ? <p>{visualError || "Visual context standby"}</p> : null}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
