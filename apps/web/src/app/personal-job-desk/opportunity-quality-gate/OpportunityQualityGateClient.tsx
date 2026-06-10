"use client";

import { useMemo, useState } from "react";

type GateOutput = {
  status?: string;
  total?: number;
  readyForApplyPackCount?: number;
  blockedFromApplyPackCount?: number;
  stateCounts?: Record<string, number>;
  gateTypeCounts?: Record<string, number>;
  leads?: any[];
  readyForApplyPack?: any[];
  reviewableSourcePages?: any[];
  governmentSourceDocuments?: any[];
  manualSourceReview?: any[];
  lowPriorityRejects?: any[];
};

export default function OpportunityQualityGateClient() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [data, setData] = useState<GateOutput | null>(null);

  const ready = useMemo(() => data?.readyForApplyPack ?? [], [data]);
  const blocked = useMemo(() => {
    return [
      ...(data?.reviewableSourcePages ?? []),
      ...(data?.governmentSourceDocuments ?? []),
      ...(data?.manualSourceReview ?? []),
      ...(data?.lowPriorityRejects ?? [])
    ].slice(0, 80);
  }, [data]);

  async function runGate() {
    setRunning(true);
    setMessage("");

    try {
      const response = await fetch("/api/personal-jobs/opportunity-quality-gate/build", {
        method: "POST"
      });

      const json = await response.json();

      if (!response.ok) throw new Error(json.error || json.stderr || "PJ20B failed.");

      setData(json);
      setMessage(`PJ20B complete: ${json.readyForApplyPackCount} ready, ${json.blockedFromApplyPackCount} blocked.`);
      localStorage.setItem("kingsmen.personalJobs20b.qualityGate.v1", JSON.stringify(json));
      localStorage.setItem("kingsmen.personalJobs04.applyPackCandidates.v1", JSON.stringify(json.readyForApplyPack ?? []));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PJ20B failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#050505,#151108,#241805)",
      color: "#f8f0db",
      padding: 28,
      fontFamily: "Arial, sans-serif"
    }}>
      <section style={panel}>
        <p style={eyebrow}>PERSONAL-JOBS-20B</p>
        <h1 style={{ fontSize: 42, margin: "8px 0" }}>Opportunity Quality Gate</h1>
        <p style={{ color: "#d8caa8", maxWidth: 920, lineHeight: 1.65 }}>
          Filters PJ20 so search pages, DPSA forms, circulars, login/register pages, weak sources,
          and low-fit international jobs cannot become apply-pack jobs.
        </p>
        <button onClick={runGate} disabled={running} style={button}>
          {running ? "Running quality gate..." : "Run quality gate"}
        </button>
        {message ? <p style={{ color: "#ffd77a" }}>{message}</p> : null}
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: 14,
        marginBottom: 18
      }}>
        <Stat label="Total" value={data?.total ?? 0} />
        <Stat label="Ready" value={data?.readyForApplyPackCount ?? 0} />
        <Stat label="Blocked" value={data?.blockedFromApplyPackCount ?? 0} />
        <Stat label="Search pages" value={data?.gateTypeCounts?.SEARCH_LANDING_PAGE ?? 0} />
        <Stat label="Gov docs" value={data?.gateTypeCounts?.GOV_SOURCE_DOCUMENT ?? 0} />
        <Stat label="Manual review" value={data?.stateCounts?.MANUAL_SOURCE_REVIEW ?? 0} />
      </section>

      <section style={panel}>
        <h2>Ready for apply pack</h2>
        <div style={grid}>
          {ready.slice(0, 40).map((lead: any, index: number) => <LeadCard key={index} lead={lead} />)}
        </div>
      </section>

      <section style={panel}>
        <h2>Blocked / review first</h2>
        <div style={grid}>
          {blocked.map((lead: any, index: number) => <LeadCard key={index} lead={lead} />)}
        </div>
      </section>

      <section style={panel}>
        <h2>Safety boundary</h2>
        <p style={{ color: "#d8caa8" }}>
          No auto-apply. No employer contact. No email. No WhatsApp. No payment touching.
          No login, OTP, CAPTCHA, or portal-control bypass.
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article style={card}>
      <strong style={{ fontSize: 30, color: "#ffd77a" }}>{value}</strong>
      <span style={{ display: "block", color: "#b9ad92" }}>{label}</span>
    </article>
  );
}

function LeadCard({ lead }: { lead: any }) {
  return (
    <article style={card}>
      <div style={{ color: "#ffd77a", fontSize: 12 }}>{lead.state}</div>
      <h3>{lead.title}</h3>
      <p style={{ color: "#d8caa8" }}>{lead.company} — {lead.location}</p>
      <p style={{ color: "#b9ad92", fontSize: 13 }}>
        {lead.pj20b?.gateType} · {lead.pj20b?.qualityScore}/100
      </p>
      {lead.sourceUrl ? (
        <a href={lead.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#ffd77a" }}>
          Review source
        </a>
      ) : null}
    </article>
  );
}

const panel = {
  border: "1px solid rgba(255,215,122,.25)",
  borderRadius: 24,
  background: "rgba(255,255,255,.055)",
  padding: 24,
  marginBottom: 22
};

const card = {
  border: "1px solid rgba(255,215,122,.2)",
  borderRadius: 18,
  background: "rgba(0,0,0,.2)",
  padding: 16
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: 14
};

const eyebrow = {
  color: "#d7ad49",
  textTransform: "uppercase" as const,
  letterSpacing: ".18em",
  fontSize: 12
};

const button = {
  border: 0,
  borderRadius: 999,
  background: "#d7ad49",
  color: "#111",
  padding: "13px 18px",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 16
};