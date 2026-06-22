"use client";

import { useEffect, useState } from "react";

type Gate = {
  gateRef: string;
  title: string;
  status: string;
  exists: boolean;
  passed: boolean;
  reviewed: boolean;
  redacted: boolean;
  nextAction: string;
};

type GateResponse = {
  ok: boolean;
  status: string;
  gateCount: number;
  passedGateCount: number;
  blockedGateCount: number;
  gates: Gate[];
  blockedGates: Pick<Gate, "gateRef" | "title" | "status" | "nextAction">[];
  generatedAtIso: string;
};

const commandMap: Record<string, string> = {
  payfast_sandbox_itn_evidence: "npm run payfast:staging -- <real sandbox proof flags>",
  communications_provider_evidence: "npm run communications:staging -- <real provider proof flags>",
  branch_protection_account_review: "npm run repo:branch-review -- <review flags>",
  final_assembly_founder_review: "npm run final:founder-review -- <final review flags>"
};

export default function JarvisGatesPage() {
  const [data, setData] = useState<GateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/jarvis/gates", { cache: "no-store" })
      .then((response) => response.json())
      .then((json: GateResponse) => {
        if (!cancelled) setData(json);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to load gates.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const gates = data?.gates ?? [];

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Kingsmen Jarvis</p>
        <h1>Launch Gates</h1>
        <p>These gates are intentionally strict. Jarvis may track and explain them, but it must not mark them ready without real evidence.</p>
      </section>

      <section className="summary">
        <div><span>Status</span><strong>{data?.status ?? "LOADING"}</strong></div>
        <div><span>Passed</span><strong>{data ? `${data.passedGateCount}/${data.gateCount}` : "—"}</strong></div>
        <div><span>Blocked</span><strong>{data?.blockedGateCount ?? "—"}</strong></div>
        <div><span>Generated</span><strong>{data?.generatedAtIso ?? "—"}</strong></div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="cards">
        {gates.map((gate) => (
          <article className="card" key={gate.gateRef}>
            <span className={gate.passed && gate.reviewed ? "state stateReady" : "state stateBlocked"}>{gate.passed && gate.reviewed ? "ready" : "blocked"}</span>
            <h2>{gate.title}</h2>
            <p><strong>Status:</strong> {gate.status}</p>
            <p>{gate.nextAction}</p>
            <code>{commandMap[gate.gateRef] ?? "npm run jarvis:gates:evaluate"}</code>
          </article>
        ))}
      </section>

      <section className="footerBox">
        <h2>Gate evaluation</h2>
        <code>npm run jarvis:gates:evaluate</code>
        <code>npm run jarvis:live:readiness -- --founder-approval-ref=&lt;approval-ref&gt;</code>
        <p>The live readiness command remains blocked until all gates, final bundle, launch audit, and founder approval are complete.</p>
      </section>

      <style jsx>{`
        .shell { min-height: 100vh; padding: 36px; background: #08111f; color: #eef5ff; font-family: Arial, sans-serif; }
        .hero, .summary, .cards, .footerBox { max-width: 1100px; margin-left: auto; margin-right: auto; }
        .hero { margin-bottom: 28px; }
        .eyebrow { color: #8bb8ff; text-transform: uppercase; letter-spacing: 0.16em; font-size: 12px; }
        h1 { font-size: 40px; margin: 8px 0; }
        .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
        .summary div, .card, .footerBox { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.13); border-radius: 20px; padding: 22px; }
        .summary span { display: block; color: #9fb5d4; font-size: 12px; margin-bottom: 6px; }
        .summary strong { word-break: break-word; }
        .cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .state { display: inline-block; font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 10px; border-radius: 999px; }
        .stateReady { background: #0f6b3d; }
        .stateBlocked { background: #8a1f2d; }
        .card p, .footerBox p { color: #c8d5ea; line-height: 1.5; }
        code { display: block; background: #050b14; color: #dfeaff; padding: 12px; border-radius: 12px; overflow-x: auto; margin-top: 8px; }
        .footerBox { margin-top: 18px; }
        .error { max-width: 1100px; margin: 0 auto 18px; color: #ff9dab; }
        @media (max-width: 860px) { .cards, .summary { grid-template-columns: 1fr; } .shell { padding: 20px; } }
      `}</style>
    </main>
  );
}
