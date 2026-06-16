"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./JarvisHud.module.css";

type JarvisEvent = {
  ts?: string;
  type?: string;
  input?: string;
  command?: string;
  reply?: string;
  text?: string;
  intent?: string;
  source?: string;
  confidence?: number | string | null;
};

type JarvisStatus = {
  ok?: boolean;
  jarvis?: string;
  doctrineSha256?: string;
  generatedAt?: string;
  cards?: Array<{ key: string; title: string; state: string; detail: string; ok: boolean }>;
  commands?: Array<{ id: string; title: string; description: string; category: string; risk: string }>;
  doctrine?: string[];
  state?: {
    turns?: number;
    lastCommand?: string;
    lastIntent?: string;
    lastReplyHash?: string;
    bridgeStatus?: string;
  };
  events?: JarvisEvent[];
};

type CommandPayload = {
  ok?: boolean;
  reply?: string;
  message?: string;
  stdout?: string;
  stderr?: string;
  commandId?: string;
  intent?: string;
  evidencePath?: string;
};

const STANDARD_WAKE =
  "Welcome to Kingsmen Command, Commander. Jarvis is online. The command house is awake, your desk is prepared, and I stand ready to brief, inspect, report, search, repair, research, organise, or execute under Kingsmen doctrine.";

const doctrineCards = [
  ["Public chatbot", "BLOCKED"],
  ["Address law", "Commander / Sir"],
  ["Wake greeting", "FULL KINGSMEN"],
  ["Low English", "BLOCKED"],
  ["Same line loop", "BLOCKED"]
];

const voiceCards = [
  ["Browser mic button", "NOT REQUIRED"],
  ["Native Windows bridge", "REPO TOOL"],
  ["Windows speech output", "ACTIVE"],
  ["Startup welcome", "MANDATORY"]
];

const behaviourCards = [
  ["Greeting", "Kingsmen Command"],
  ["Conversation", "90s after wake"],
  ["Reports", "Evidence / Risk / Command"],
  ["Tools", "Proof required"],
  ["Current facts", "Verify live"]
];

function eventLine(event: JarvisEvent, index: number) {
  const time = event.ts ? new Date(event.ts).toLocaleTimeString([], { hour12: false }) : "--:--:--";
  const body = event.reply || event.input || event.command || event.text || event.intent || event.source || event.type || `event-${index}`;
  return `${time}  ${event.type ?? "event"}  ${body}`;
}

function normalizeCommand(value: string) {
  return value.trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase();
}

function replyFromPayload(payload: CommandPayload) {
  const merged = [payload.reply, payload.message, payload.stdout, payload.stderr ? `STDERR:\n${payload.stderr}` : ""]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  return merged || "Command received, Commander. No detailed reply returned yet, Sir.";
}

export default function JarvisHudClient({ surface = "COMMAND" }: { surface?: string }) {
  const [status, setStatus] = useState<JarvisStatus | null>(null);
  const [events, setEvents] = useState<JarvisEvent[]>([]);
  const [typed, setTyped] = useState("");
  const [reply, setReply] = useState("Awaiting command, Commander.");
  const [voiceState, setVoiceState] = useState("VOICE WAITING");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setError(null);

      const statusResponse = await fetch("/api/jarvis/status", { cache: "no-store" });
      const statusData = (await statusResponse.json()) as JarvisStatus;
      setStatus(statusData);

      const statusEvents = statusData.events ?? [];
      let liveEvents = statusEvents;

      try {
        const eventsResponse = await fetch("/api/jarvis/voice/events", { cache: "no-store" });
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          liveEvents = eventsData.events ?? statusEvents;
        }
      } catch {
        liveEvents = statusEvents;
      }

      setEvents(liveEvents.slice(-60));

      const lastReply = [...liveEvents].reverse().find((event) => event.type === "reply")?.reply;
      if (lastReply) setReply(lastReply);

      const lastVoice = [...liveEvents].reverse().find((event) => event.type === "voice-heard" || event.type === "recognized" || event.type === "wake-route");
      setVoiceState(lastVoice ? "VOICE HEARD" : "VOICE WAITING");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Jarvis status failed.");
      setVoiceState("STATUS ERROR");
    }
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, []);

  async function send(text: string, source = "hud-typing-backup") {
    const command = text.trim();
    if (!command) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/jarvis/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: command,
          command: command,
          commandId: normalizeCommand(command),
          source
        })
      });

      const payload = (await response.json()) as CommandPayload;
      setReply(replyFromPayload(payload));
      setTyped("");
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Command failed.";
      setError(msg);
      setReply(`Commander, Jarvis command routing failed.\n\nRisk:\n${msg}\n\nStanding by, Sir.`);
    } finally {
      setBusy(false);
    }
  }

  const displayedEvents = useMemo(() => events.slice(-12).reverse(), [events]);
  const voiceEvents = useMemo(
    () => displayedEvents.filter((event) => ["voice-heard", "recognized", "wake-route", "command"].includes(String(event.type))),
    [displayedEvents]
  );

  return (
    <main className={styles.shell}>
      <div className={styles.gridGlow} />
      <section className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.brandBlock}>
            <div className={styles.wordmark}>KINGSMEN</div>
            <div className={styles.kicker}>PRIVATE ROUTE COMMAND HOUSE / COMMANDER-ONLY JARVIS</div>
          </div>

          <div className={styles.jarvisTitle}>
            <h1>JARVIS</h1>
            <span>FULL REPO COMMAND VOICE</span>
          </div>

          <div className={styles.statusPills}>
            <span>SERVER ONLINE</span>
            <span>{voiceState}</span>
            <span>V5 LOCKED</span>
          </div>
        </header>

        <section className={styles.mainGrid}>
          <aside className={styles.leftRail}>
            <Panel title="Commander-Only Doctrine">
              {doctrineCards.map(([label, value]) => <Metric key={label} label={label} value={value} danger={value === "BLOCKED"} />)}
            </Panel>

            <Panel title="Voice Bridge">
              {voiceCards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
            </Panel>

            <Panel title="Exact Doctrine Lock">
              <p>The uploaded Jarvis V5 master command script is stored unchanged in the repository and used by the Jarvis API.</p>
              <div className={styles.hash}>SHA: {status?.doctrineSha256 ?? "loading"}</div>
            </Panel>
          </aside>

          <section className={styles.centerCore}>
            <div className={styles.orbField}>
              <div className={styles.ringOuter} />
              <div className={styles.ringMiddle} />
              <div className={styles.ringInner} />
              <div className={styles.orb}>
                <div>JARVIS</div>
                <span>KINGSMEN COMMAND</span>
              </div>
              <div className={styles.orbHint}>Native voice channel monitored</div>
            </div>

            <div className={styles.capabilityDeck}>
              <Mini title="WAKE" text="Welcome to Kingsmen Command, Commander." />
              <Mini title="VOICE" text="Calm, refined, professional, respectful." />
              <Mini title="INTELLIGENCE" text="Brief, inspect, report, research, organise, repair." />
              <Mini title="SAFETY" text="Evidence-led. No fake status. No public Jarvis." />
            </div>
          </section>

          <aside className={styles.rightRail}>
            <Panel title="Command Behaviour">
              {behaviourCards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
            </Panel>

            <Panel title="Use It Now">
              <p>Keep the Jarvis native voice bridge window open. You must hear the Kingsmen welcome. Then say:</p>
              <div className={styles.sayBox}>Jarvis</div>
            </Panel>

            <Panel title="Typing Backup">
              <form
                className={styles.typingForm}
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  send(typed);
                }}
              >
                <input
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder="Backup only. Main control is voice."
                />
                <button type="submit" disabled={busy}>{busy ? "Processing..." : "Send backup"}</button>
              </form>
            </Panel>
          </aside>
        </section>

        <section className={styles.bottomGrid}>
          <Panel title="Voice Feed">
            <pre>{voiceEvents.map(eventLine).join("\n") || "Waiting for native voice bridge..."}</pre>
          </Panel>

          <Panel title="Jarvis Reply">
            <pre>{reply}</pre>
          </Panel>

          <Panel title="Evidence / Errors">
            <pre>{error ? `ERROR: ${error}` : displayedEvents.map(eventLine).join("\n") || "No hidden failure. Every bridge event is logged."}</pre>
          </Panel>
        </section>

        <footer className={styles.footer}>
          <span>KINGSMEN PROTOCOL</span>
          <span>V5 SCRIPT LOCKED</span>
          <span>NATIVE VOICE</span>
          <span>COMMANDER ONLY</span>
          <span>FULL REPO BUILD</span>
        </footer>
      </section>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.panel}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong className={danger ? styles.danger : styles.safe}>{value}</strong>
    </div>
  );
}

function Mini({ title, text }: { title: string; text: string }) {
  return (
    <article className={styles.mini}>
      <strong>{title}</strong>
      <span>{text}</span>
    </article>
  );
}
