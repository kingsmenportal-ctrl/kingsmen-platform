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
  evidencePath: string;
  message: string;
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

function normalizeCommand(value: string) {
  return value.trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase();
}

function safeOutput(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "No output returned.";
}

export default function JarvisHudClient({ surface }: { surface: string }) {
  const [status, setStatus] = useState<JarvisStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("SYSTEM_VALIDATE_N20");
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<JarvisResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "unsupported">("idle");
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
        evidencePath: "reports/jarvis/jarvis-command-evidence.jsonl",
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

  useEffect(() => {
    loadStatus();
    const timer = window.setInterval(loadStatus, 15000);
    return () => {
      window.clearInterval(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
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

  return (
    <main className={styles.shell}>
      <div className={styles.gridGlow} />
      <section className={styles.hud}>
        <header className={styles.header}>
          <div>
            <div className={styles.kicker}>KINGSMEN {surface} INTERFACE</div>
            <h1>JARVIS</h1>
            <p>
              Founder command cockpit. Live system truth, safe command execution, OpenClaw grip checks,
              evidence output, and policy boundaries. This is not a fake chatbot and it does not replace
              the backend state machine.
            </p>
          </div>
          <div className={styles.topStatus}>
            <span className={status?.ok ? styles.dotOk : styles.dotWarn} />
            <strong>{status?.ok ? "SYSTEM GRIP STABLE" : "SYSTEM NEEDS REVIEW"}</strong>
            <small>{status ? `${okCount}/${totalCount} surfaces confirmed` : "loading truth..."}</small>
          </div>
        </header>

        <section className={styles.coreLayout}>
          <aside className={styles.leftRail}>
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
          </aside>

          <section className={styles.centerCore}>
            <div className={styles.orbWrap}>
              <div className={styles.ringOne} />
              <div className={styles.ringTwo} />
              <div className={styles.ringThree} />
              <div className={styles.orb}>
                <span>J</span>
              </div>
              <div className={styles.orbCaption}>
                <strong>{running ? `EXECUTING ${running}` : "AWAITING FOUNDER COMMAND"}</strong>
                <small>{status?.generatedAt ? `Truth refreshed ${new Date(status.generatedAt).toLocaleTimeString()}` : "loading..."}</small>
              </div>
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
                {voiceState === "listening" ? "LISTENING" : voiceState === "unsupported" ? "NO VOICE" : "VOICE"}
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
                  <small>Evidence: {result.evidencePath}</small>
                  <pre>{safeOutput(result.stdout + (result.stderr ? `\n\nSTDERR:\n${result.stderr}` : ""))}</pre>
                </>
              ) : (
                <p className={styles.muted}>
                  Execute a command. Jarvis will return live output here and record an evidence line.
                </p>
              )}
            </section>
          </section>

          <aside className={styles.rightRail}>
            <div className={styles.panelTitle}>OpenClaw / Visual Feed</div>
            <div className={styles.cameraPanel}>
              <video ref={videoRef} autoPlay muted playsInline className={styles.video} />
              {!cameraActive ? (
                <div className={styles.cameraPlaceholder}>
                  <strong>VISUAL FEED STANDBY</strong>
                  <span>Enable camera when founder visual mode is needed.</span>
                </div>
              ) : null}
            </div>
            <button className={styles.fullButton} type="button" onClick={toggleCamera}>
              {cameraActive ? "STOP VISUAL FEED" : "START VISUAL FEED"}
            </button>
            <button className={styles.fullButton} type="button" onClick={() => runCommand("OPENCLAW_GRIP_CHECK")} disabled={running !== null}>
              RUN OPENCLAW GRIP CHECK
            </button>

            <div className={styles.doctrine}>
              <div className={styles.panelTitle}>Jarvis Doctrine</div>
              {(status?.doctrine ?? [
                "Backend state machine remains authority.",
                "Jarvis surfaces truth and safe actions.",
                "Risky actions require policy and evidence gates."
              ]).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

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
