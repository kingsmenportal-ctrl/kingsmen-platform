"use client";

import { FormEvent, useState } from "react";

type Readiness = {
  ok: boolean;
  status: string;
  finalBundleComplete: boolean;
  launchAuditClear: boolean;
  founderApprovalPresent: boolean;
  gateCount: number;
  passedGateCount: number;
  blockedGateCount: number;
  blockers: string[];
  generatedAtIso: string;
  nextAction: string;
};

export default function JarvisReadinessPage() {
  const [founderApprovalRef, setFounderApprovalRef] = useState("");
  const [data, setData] = useState<Readiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const query = founderApprovalRef.trim() ? `?founderApprovalRef=${encodeURIComponent(founderApprovalRef.trim())}` : "";
      const response = await fetch(`/api/jarvis/live-readiness${query}`, { cache: "no-store" });
      const json = (await response.json()) as Readiness;
      setData(json);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to check readiness.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Kingsmen Jarvis</p>
        <h1>Live Readiness</h1>
        <p>Final guard before any controlled switch review. This page cannot approve launch by itself.</p>
      </section>

      <form className="panel" onSubmit={check}>
        <label>
          Founder approval reference
          <input value={founderApprovalRef} onChange={(event) => setFounderApprovalRef(event.target.value)} placeholder="approval-ref-after-all-gates-pass" />
        </label>
        <button type="submit" disabled={loading}>{loading ? "Checking…" : "Check readiness"}</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {data ? (
        <section className="panel result">
          <div className="statusRow">
            <h2>{data.status}</h2>
            <span className={data.ok ? "badge ready" : "badge blocked"}>{data.ok ? "ready" : "blocked"}</span>
          </div>
          <div className="grid">
            <div><span>Gates passed</span><strong>{data.passedGateCount}/{data.gateCount}</strong></div>
            <div><span>Final bundle</span><strong>{String(data.finalBundleComplete)}</strong></div>
            <div><span>Launch audit</span><strong>{String(data.launchAuditClear)}</strong></div>
            <div><span>Founder approval</span><strong>{String(data.founderApprovalPresent)}</strong></div>
          </div>
          <h3>Blockers</h3>
          {data.blockers.length > 0 ? <ul>{data.blockers.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No blockers returned.</p>}
          <h3>Next action</h3>
          <p>{data.nextAction}</p>
          <code>npm run jarvis:live:readiness -- --founder-approval-ref=&lt;approval-ref&gt;</code>
        </section>
      ) : null}

      <style jsx>{`
        .shell { min-height: 100vh; padding: 36px; background: #08111f; color: #eef5ff; font-family: Arial, sans-serif; }
        .hero, .panel { max-width: 980px; margin-left: auto; margin-right: auto; }
        .hero { margin-bottom: 24px; }
        .eyebrow { color: #8bb8ff; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; }
        h1 { font-size: 40px; margin: 8px 0; }
        .panel { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.13); border-radius: 20px; padding: 22px; margin-bottom: 18px; }
        label { display: grid; gap: 8px; color: #c8d5ea; }
        input { border-radius: 12px; border: 1px solid rgba(255,255,255,0.18); background: #050b14; color: #dfeaff; padding: 12px; }
        button { margin-top: 14px; border: 0; border-radius: 12px; padding: 11px 16px; background: #5d8cff; color: white; font-weight: 700; cursor: pointer; }
        .statusRow { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .badge { padding: 8px 12px; border-radius: 999px; font-weight: 800; text-transform: uppercase; font-size: 12px; }
        .ready { background: #0f6b3d; }
        .blocked { background: #8a1f2d; }
        .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
        .grid div { background: rgba(255,255,255,0.07); border-radius: 14px; padding: 14px; }
        .grid span { display: block; color: #9fb5d4; font-size: 12px; margin-bottom: 6px; }
        li, p { color: #c8d5ea; line-height: 1.5; }
        code { display: block; background: #050b14; color: #dfeaff; padding: 12px; border-radius: 12px; overflow-x: auto; }
        .error { max-width: 980px; margin: 0 auto 18px; color: #ff9dab; }
        @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } .shell { padding: 20px; } }
      `}</style>
    </main>
  );
}
