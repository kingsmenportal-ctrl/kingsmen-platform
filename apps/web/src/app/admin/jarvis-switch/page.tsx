"use client";

import { FormEvent, useState } from "react";

type SwitchResponse = {
  ok: boolean;
  status: string;
  switchAuthorized: boolean;
  switchExecuted: boolean;
  dryRun: boolean;
  requestedBy: string;
  founderApprovalRef: string | null;
  readinessStatus: string;
  blockers: string[];
  safeReason: string;
  generatedAtIso: string;
};

export default function JarvisSwitchPage() {
  const [founderApprovalRef, setFounderApprovalRef] = useState("");
  const [requestedBy, setRequestedBy] = useState("founder_control_plane");
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<SwitchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/jarvis/switch-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ founderApprovalRef, requestedBy, dryRun })
      });
      const json = (await response.json()) as SwitchResponse;
      setResult(json);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit switch request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Kingsmen Jarvis</p>
        <h1>Controlled Switch Request</h1>
        <p>This page checks readiness and records intent. It does not directly flip production.</p>
      </section>

      <form className="panel" onSubmit={submit}>
        <label>
          Founder approval reference
          <input value={founderApprovalRef} onChange={(event) => setFounderApprovalRef(event.target.value)} placeholder="approval-ref-after-all-gates-pass" />
        </label>
        <label>
          Requested by
          <input value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
          Dry run only
        </label>
        <button type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit switch request"}</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <section className="panel result">
          <div className="statusRow">
            <h2>{result.status}</h2>
            <span className={result.switchAuthorized ? "badge ready" : "badge blocked"}>{result.switchAuthorized ? "authorized" : "blocked"}</span>
          </div>
          <p>{result.safeReason}</p>
          <div className="grid">
            <div><span>Executed</span><strong>{String(result.switchExecuted)}</strong></div>
            <div><span>Dry run</span><strong>{String(result.dryRun)}</strong></div>
            <div><span>Readiness</span><strong>{result.readinessStatus}</strong></div>
            <div><span>Approval</span><strong>{result.founderApprovalRef ?? "missing"}</strong></div>
          </div>
          <h3>Blockers</h3>
          {result.blockers.length ? <ul>{result.blockers.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No blockers returned.</p>}
        </section>
      ) : null}

      <style jsx>{`
        .shell { min-height: 100vh; padding: 36px; background: #08111f; color: #eef5ff; font-family: Arial, sans-serif; }
        .hero, .panel { max-width: 980px; margin-left: auto; margin-right: auto; }
        .hero { margin-bottom: 24px; }
        .eyebrow { color: #8bb8ff; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; }
        h1 { font-size: 40px; margin: 8px 0; }
        .panel { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.13); border-radius: 20px; padding: 22px; margin-bottom: 18px; }
        label { display: grid; gap: 8px; color: #c8d5ea; margin-bottom: 14px; }
        .check { grid-template-columns: auto 1fr; align-items: center; }
        input { border-radius: 12px; border: 1px solid rgba(255,255,255,0.18); background: #050b14; color: #dfeaff; padding: 12px; }
        .check input { padding: 0; }
        button { border: 0; border-radius: 12px; padding: 11px 16px; background: #5d8cff; color: white; font-weight: 700; cursor: pointer; }
        .statusRow { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .badge { padding: 8px 12px; border-radius: 999px; font-weight: 800; text-transform: uppercase; font-size: 12px; }
        .ready { background: #0f6b3d; }
        .blocked { background: #8a1f2d; }
        .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
        .grid div { background: rgba(255,255,255,0.07); border-radius: 14px; padding: 14px; }
        .grid span { display: block; color: #9fb5d4; font-size: 12px; margin-bottom: 6px; }
        li, p { color: #c8d5ea; line-height: 1.5; }
        .error { max-width: 980px; margin: 0 auto 18px; color: #ff9dab; }
        @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } .shell { padding: 20px; } }
      `}</style>
    </main>
  );
}
