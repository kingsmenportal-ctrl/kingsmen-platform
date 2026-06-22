"use client";

import { FormEvent, useMemo, useState } from "react";

type JarvisRuntimeResponse = {
  ok?: boolean;
  commandRef?: string;
  correlationId?: string;
  finalDecision?: string;
  risk?: string;
  reasonCode?: string;
  safeReason?: string;
  approvalRequired?: boolean;
  evidenceRequired?: boolean;
  executable?: boolean;
  nextStep?: string;
  launchGateChecked?: boolean;
  launchGateOpen?: boolean;
  blockedBy?: string[];
  toolRef?: string | null;
  ledger?: { eventRef: string; eventType: string; safeSummary: string; createdAtIso: string }[];
  evidenceWrite?: { attempted?: boolean; accepted?: boolean; status?: number; commandId?: string | null; error?: string | null };
  evidenceStorage?: { attempted?: boolean; accepted?: boolean; storageMode?: string; commandId?: string | null; replay?: boolean };
  backendStatus?: number;
  backendBoundary?: { configured?: boolean; mode?: string; noLocalShell?: boolean; noLocalFileWrites?: boolean; noDirectDatabaseAccessFromWeb?: boolean };
  webProxy?: boolean;
  localShellExecuted?: boolean;
  localFileWritten?: boolean;
  directDatabaseAccessFromWeb?: boolean;
};

const defaultCommand = {
  command: {
    commandRef: "jarvis_live_probe",
    tenantRef: "kingsmen_default_tenant",
    channel: "hud",
    mode: "controlled_command_mode",
    actor: {
      actorType: "founder",
      actorRef: "founder_control_plane"
    },
    commandTextSafe: "Check Jarvis runtime status and explain whether live activation is allowed.",
    intendedAction: "jarvis_runtime_status_check",
    targetRefs: ["jarvis.runtime"],
    requestedAuthorityLevel: "LEVEL_3_TEST_VALIDATE",
    evidenceRefs: []
  },
  toolRef: "jarvis.validator.runner",
  launchEvidence: {
    publicLaunchStatus: "blocked",
    productionReady: false,
    publicLaunchAllowed: false,
    blockers: [
      {
        code: "payfast_sandbox_evidence",
        title: "PayFast sandbox ITN evidence is still required"
      }
    ],
    reports: []
  },
  dryRun: true
};

export default function JarvisLivePage() {
  const [payload, setPayload] = useState(JSON.stringify(defaultCommand, null, 2));
  const [result, setResult] = useState<JarvisRuntimeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const decision = result?.finalDecision ?? "WAITING";
  const decisionClass = useMemo(() => {
    if (decision === "ALLOW") return "decision decisionAllow";
    if (decision === "DRY_RUN_ONLY") return "decision decisionDry";
    if (decision === "APPROVAL_REQUIRED") return "decision decisionApproval";
    if (decision === "BLOCK") return "decision decisionBlock";
    return "decision";
  }, [decision]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsed = JSON.parse(payload);
      const response = await fetch("/api/jarvis/runtime-control", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const json = (await response.json()) as JarvisRuntimeResponse;
      setResult(json);
      if (!response.ok && !json.safeReason) {
        setError(`Jarvis runtime returned HTTP ${response.status}.`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown Jarvis runtime error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Kingsmen Jarvis</p>
        <h1>Jarvis Live Runtime Control</h1>
        <p>
          This surface sends a command envelope through the web boundary into the backend Jarvis runtime authority.
          It returns the final decision, exact reason, approval requirement, evidence blockers, and ledger events.
        </p>
      </section>

      <section className="grid">
        <form className="panel" onSubmit={submit}>
          <div className="panelHeader">
            <h2>Command envelope</h2>
            <button type="submit" disabled={loading}>{loading ? "Checking…" : "Run Jarvis"}</button>
          </div>
          <textarea value={payload} onChange={(event) => setPayload(event.target.value)} spellCheck={false} />
        </form>

        <section className="panel">
          <div className="panelHeader">
            <h2>Runtime decision</h2>
            <span className={decisionClass}>{decision}</span>
          </div>

          {error ? <p className="error">{error}</p> : null}

          {result ? (
            <div className="resultStack">
              <div className="metricGrid">
                <div><span>Reason</span><strong>{result.reasonCode ?? "—"}</strong></div>
                <div><span>Next step</span><strong>{result.nextStep ?? "—"}</strong></div>
                <div><span>Executable</span><strong>{String(result.executable)}</strong></div>
                <div><span>Launch gate</span><strong>{result.launchGateOpen ? "open" : result.launchGateChecked ? "blocked" : "not checked"}</strong></div>
              </div>

              <article className="reasonBox">
                <h3>Backend authority</h3>
                <p>webProxy: {String(result.webProxy)} · backendStatus: {result.backendStatus ?? "—"} · configured: {String(result.backendBoundary?.configured)}</p>
                <p>mode: {result.backendBoundary?.mode ?? "—"}</p>
              </article>

              <article className="reasonBox">
                <h3>Exact safe reason</h3>
                <p>{result.safeReason ?? "No reason returned yet."}</p>
              </article>

              <article className="reasonBox">
                <h3>Blocked by</h3>
                {result.blockedBy && result.blockedBy.length > 0 ? (
                  <ul>{result.blockedBy.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : <p>No runtime blockers returned.</p>}
              </article>

              <article className="reasonBox">
                <h3>Evidence storage</h3>
                <p>
                  attempted: {String(result.evidenceStorage?.attempted ?? result.evidenceWrite?.attempted)} · accepted: {String(result.evidenceStorage?.accepted ?? result.evidenceWrite?.accepted)} · storage: {result.evidenceStorage?.storageMode ?? "—"}
                </p>
              </article>

              <article className="reasonBox">
                <h3>Ledger events</h3>
                <ol>
                  {(result.ledger ?? []).map((event) => (
                    <li key={event.eventRef}>
                      <strong>{event.eventType}</strong>: {event.safeSummary}
                    </li>
                  ))}
                </ol>
              </article>

              <article className="safetyBox">
                <h3>Boundary</h3>
                <p>web route proxies to backend authority. Browser does not submit directly to storage or runtime internals.</p>
              </article>
            </div>
          ) : (
            <p className="muted">Run Jarvis to see the live runtime decision.</p>
          )}
        </section>
      </section>

      <style jsx>{`
        .shell { min-height: 100vh; padding: 32px; background: #08111f; color: #eef5ff; font-family: Arial, sans-serif; }
        .hero { max-width: 980px; margin: 0 auto 24px; }
        .eyebrow { color: #8bb8ff; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; }
        h1 { font-size: 38px; margin: 8px 0; }
        h2, h3 { margin: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1280px; margin: 0 auto; }
        .panel { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.13); border-radius: 20px; padding: 18px; box-shadow: 0 24px 80px rgba(0,0,0,0.28); }
        .panelHeader { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; }
        button { border: 0; border-radius: 12px; padding: 11px 16px; background: #5d8cff; color: white; font-weight: 700; cursor: pointer; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        textarea { width: 100%; min-height: 590px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.18); background: #050b14; color: #dfeaff; padding: 16px; font-family: Consolas, monospace; font-size: 13px; }
        .decision { padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.12); font-weight: 800; font-size: 12px; }
        .decisionAllow { background: #0f6b3d; }
        .decisionDry { background: #315c9f; }
        .decisionApproval { background: #8a5b10; }
        .decisionBlock { background: #8a1f2d; }
        .resultStack { display: grid; gap: 14px; }
        .metricGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .metricGrid div, .reasonBox, .safetyBox { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px; }
        .metricGrid span { display: block; color: #9fb5d4; font-size: 12px; margin-bottom: 6px; }
        .metricGrid strong { word-break: break-word; }
        .reasonBox p, .safetyBox p, li { color: #c8d5ea; line-height: 1.45; }
        .error { color: #ff9dab; }
        .muted { color: #9fb5d4; }
        @media (max-width: 920px) { .grid { grid-template-columns: 1fr; } .shell { padding: 18px; } }
      `}</style>
    </main>
  );
}
