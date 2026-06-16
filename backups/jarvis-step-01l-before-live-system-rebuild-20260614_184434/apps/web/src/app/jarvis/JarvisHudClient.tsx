"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./JarvisHud.module.css";

type EvidenceRow = {
  time: string;
  event: string;
  source: string;
};

type VoiceEvent = {
  text?: string;
  command?: string;
  transcript?: string;
  reply?: string;
  source?: string;
  ts?: string;
  type?: string;
};

const WAKE_GREETING =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine.";

function stamp(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normaliseVoiceEvent(payload: unknown): VoiceEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const event: VoiceEvent = {};
  for (const key of ["text", "command", "transcript", "reply", "source", "ts", "type"]) {
    const value = obj[key];
    if (typeof value === "string") (event as Record<string, string>)[key] = value;
  }
  return event;
}

export default function JarvisHudClient() {
  const [serverOnline, setServerOnline] = useState(false);
  const [voiceWaiting, setVoiceWaiting] = useState(true);
  const [voiceLine, setVoiceLine] = useState("Say â€œJarvisâ€. Awaiting professional wake command.");
  const [jarvisReply, setJarvisReply] = useState("Awaiting command, Commander.");
  const [statusLine, setStatusLine] = useState("JARVIS ACTIVE\nListening â€¢ Reasoning â€¢ Orchestrating");
  const [command, setCommand] = useState("Jarvis status");
  const [evidence, setEvidence] = useState<EvidenceRow[]>([
    { time: stamp(), event: "Exact locked reference layout active", source: "hud" },
    { time: stamp(), event: "Commander-only doctrine loaded", source: "doctrine" },
    { time: stamp(), event: "Native voice bridge waiting", source: "voice" },
  ]);
  const [clock, setClock] = useState(stamp());
  const lastVoiceRef = useRef("");

  const systemPill = useMemo(() => (serverOnline ? "SYSTEM ONLINE" : "SERVER WAITING"), [serverOnline]);
  const voicePill = useMemo(() => (voiceWaiting ? "VOICE WAITING" : "VOICE ACTIVE"), [voiceWaiting]);

  function pushEvidence(event: string, source: string) {
    setEvidence((rows) => [{ time: stamp(), event, source }, ...rows].slice(0, 9));
  }

  async function sendCommand(text?: string) {
    const payload = (text || command || "Jarvis status").trim();
    if (!payload) return;

    pushEvidence(`command sent: ${payload}`, "typing");
    setVoiceLine(payload);

    try {
      const res = await fetch("/api/jarvis/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          command: payload,
          text: payload,
          source: "locked-reference-hud",
          commander_only: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const reply =
        typeof data.reply === "string"
          ? data.reply
          : typeof data.message === "string"
          ? data.message
          : typeof data.output === "string"
          ? data.output
          : WAKE_GREETING;

      setJarvisReply(reply);
      pushEvidence("reply received", "api");
    } catch {
      setJarvisReply(WAKE_GREETING);
      pushEvidence("api fallback reply used", "hud");
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => setClock(stamp()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;

    async function checkStatus() {
      try {
        const res = await fetch("/api/jarvis/status", { cache: "no-store" });
        if (!alive) return;
        setServerOnline(res.ok);
        pushEvidence(res.ok ? "status-check ok" : "status-check failed", "api");
      } catch {
        if (!alive) return;
        setServerOnline(false);
        pushEvidence("status-check offline", "api");
      }
    }

    checkStatus();
    const timer = window.setInterval(checkStatus, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;

    async function pollVoice() {
      try {
        const res = await fetch("/api/jarvis/voice/events", { cache: "no-store" });
        if (!alive || !res.ok) return;

        const data = await res.json().catch(() => null);
        const raw = Array.isArray(data?.events) ? data.events[0] : data?.event || data;
        const event = normaliseVoiceEvent(raw);
        if (!event) return;

        const text = event.text || event.command || event.transcript || "";
        const reply = event.reply || "";
        const marker = `${event.ts || ""}|${event.type || ""}|${text}|${reply}`;
        if (!text && !reply) return;
        if (marker === lastVoiceRef.current) return;

        lastVoiceRef.current = marker;
        setVoiceWaiting(false);

        if (text) {
          setVoiceLine(text);
          pushEvidence(`voice heard: ${text}`, event.source || "voice");
        }

        if (reply) {
          setJarvisReply(reply);
          pushEvidence("voice reply received", "voice");
        } else if (text.toLowerCase().includes("jarvis")) {
          setJarvisReply(WAKE_GREETING);
          pushEvidence("wake route active", "voice");
        }

        setStatusLine("JARVIS ACTIVE\nVoice linked â€¢ Command channel live");
      } catch {
        // Keep the cockpit clean. Status evidence already handles API health.
      }
    }

    pollVoice();
    const timer = window.setInterval(pollVoice, 2500);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.stage} aria-label="Kingsmen Jarvis exact locked command interface">
      <section className={styles.frame}>
        <img
          className={styles.reference}
          src="/jarvis/locked-reference.png"
          alt="Kingsmen Jarvis locked command interface"
          draggable={false}
        />

        <div className={`${styles.liveText} ${styles.systemPill}`}>{systemPill}</div>
        <div className={`${styles.liveText} ${styles.environmentPill}`}>ENVIRONMENT SECURE</div>
        <div className={`${styles.liveText} ${styles.clock}`}>{clock}</div>

        <div className={`${styles.liveText} ${styles.orbState}`}>{statusLine}</div>

        <div className={`${styles.liveText} ${styles.voiceText}`}>
          {voiceLine}
          <br />
          Voice confidence pending live proof.
        </div>

        <div className={`${styles.liveText} ${styles.timeline}`}>
          {evidence.slice(0, 6).map((row) => (
            <div key={`${row.time}-${row.event}`}>{row.time} Â· {row.event}</div>
          ))}
        </div>

        <div className={`${styles.liveText} ${styles.evidence}`}>
          {evidence.slice(0, 5).map((row) => (
            <div key={`${row.time}-${row.event}-${row.source}`}>
              {row.source}: {row.event}
            </div>
          ))}
        </div>

        <div className={`${styles.liveText} ${styles.agents}`}>
          Vision Agent&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;READY
          <br />
          Brain Agent&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ACTIVE
          <br />
          Command Agent&nbsp;&nbsp;&nbsp;&nbsp;ACTIVE
          <br />
          Memory Agent&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LOCKED
          <br />
          Voice Bridge&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{voicePill}
        </div>

        <div className={`${styles.liveText} ${styles.openclaw}`}>
          Professional Greeting ACTIVE
          <br />
          Evidence Report READY
          <br />
          Secure Comms READY
          <br />
          Commander Boundary LOCKED
        </div>

        <div className={`${styles.liveText} ${styles.queue}`}>
          Verify command&nbsp;&nbsp;READY
          <br />
          Voice wake&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;WAITING
          <br />
          Evidence report&nbsp;READY
          <br />
          Kingsmen status&nbsp;READY
        </div>

        <div className={`${styles.liveText} ${styles.reply}`}>
          Jarvis: {jarvisReply}
        </div>

        <form
          className={styles.commandForm}
          onSubmit={(event) => {
            event.preventDefault();
            sendCommand();
          }}
        >
          <input
            className={styles.commandInput}
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            aria-label="Jarvis command"
            autoComplete="off"
          />
          <button className={styles.commandSend} type="submit" aria-label="Send Jarvis command">
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
