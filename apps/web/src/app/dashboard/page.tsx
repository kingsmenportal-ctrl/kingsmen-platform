"use client";

import { useEffect, useMemo, useState } from "react";

type Opportunity = {
  opportunityId: string;
  title: string;
  organisation: string;
  status?: string;
  closingDate?: string;
  updatedAt?: string;
  createdAt?: string;
};

type DocumentRecord = {
  documentId: string;
  type?: string;
  fileName?: string;
  createdAt?: string;
};

type Pack = {
  packId: string;
  title?: string;
  opportunityId?: string;
  createdAt?: string;
};

type PortalStore = {
  profile?: { fullName?: string; email?: string };
  opportunities?: Opportunity[];
  documents?: DocumentRecord[];
  applicationPacks?: Pack[];
  proofLog?: Array<{ proofId: string; createdAt?: string; opportunityId?: string }>;
  readiness?: number;
};

const panel: React.CSSProperties = {
  border: "1px solid #243149",
  borderRadius: 16,
  background: "linear-gradient(145deg, #121d30, #0d1524)",
  padding: 22
};

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(218,188,116,.5)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "#f0d796",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700
};

function formatDate(value?: string) {
  if (!value) return "No date set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function statusLabel(value?: string) {
  return (value || "IN PROGRESS").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DashboardPage() {
  const [data, setData] = useState<PortalStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/personal-jobs/apply-now", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Your workspace could not be loaded.");
        return body as PortalStore;
      })
      .then((body) => { if (active) setData(body); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Your workspace could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const opportunities = data?.opportunities ?? [];
  const documents = data?.documents ?? [];
  const packs = data?.applicationPacks ?? [];
  const proofLog = data?.proofLog ?? [];
  const outstanding = useMemo(
    () => opportunities.filter((item) => !["APPLIED_PROOF_CAPTURED", "CLOSED", "WITHDRAWN"].includes(item.status || "")),
    [opportunities]
  );
  const recentOpportunities = useMemo(
    () => [...opportunities].sort((a, b) => Date.parse(b.updatedAt || b.createdAt || "") - Date.parse(a.updatedAt || a.createdAt || "")).slice(0, 5),
    [opportunities]
  );
  const readiness = Math.max(0, Math.min(100, data?.readiness ?? 0));
  const name = data?.profile?.fullName?.trim().split(/\s+/)[0];

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 85% 0%, rgba(35,84,112,.22), transparent 35%), #080d19", color: "#f4f6fb", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #080d19; }
        a:focus-visible, button:focus-visible { outline: 2px solid #e6c77f; outline-offset: 3px; }
        .dash-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
        .dash-layout { display:grid; grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr); gap:16px; }
        .dash-stat { color:#8f9bb0; font-size:12px; }
        .dash-number { margin-top:10px; font-size:32px; letter-spacing:-.04em; font-weight:750; }
        .dash-muted { color:#9eabc0; font-size:13px; line-height:1.65; }
        .dash-row { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:15px 0; border-bottom:1px solid rgba(255,255,255,.07); }
        .dash-row:last-child { border-bottom:0; padding-bottom:0; }
        .dash-pill { display:inline-flex; align-items:center; border:1px solid #344258; background:#172236; color:#c2ccdc; border-radius:999px; padding:5px 9px; font-size:10px; white-space:nowrap; }
        @media(max-width:850px) { .dash-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .dash-layout { grid-template-columns:1fr; } }
        @media(max-width:480px) { .dash-grid { grid-template-columns:1fr 1fr; gap:9px; } .dash-stat-card { padding:15px !important; } .dash-number { font-size:27px; } .dash-main { padding:28px 16px 50px !important; } }
      `}</style>

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "18px clamp(18px,5vw,64px)", borderBottom: "1px solid rgba(255,255,255,.09)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, color: "#f4f6fb", textDecoration: "none", fontWeight: 800, letterSpacing: ".06em" }}>
          <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, border: "1px solid #d4b66e", borderRadius: 11, color: "#e8ca83", fontFamily: "Georgia,serif", fontSize: 21 }}>K</span>
          <span>KINGSMEN<small style={{ display: "block", marginTop: 2, color: "#8f9bb0", fontSize: 9, letterSpacing: ".22em" }}>PORTAL</small></span>
        </a>
        <nav aria-label="Dashboard navigation" style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          <a href="/personal-job-desk/apply-now" style={linkStyle}>Open Job Desk ↗</a>
          <a href="/candidate" style={{ ...linkStyle, borderColor: "#344258", color: "#c2ccdc" }}>Candidate Portal</a>
        </nav>
      </header>

      <div className="dash-main" style={{ maxWidth: 1240, margin: "0 auto", padding: "42px 24px 76px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
          <div>
            <p style={{ margin: "0 0 12px", color: "#e5c77d", fontSize: 11, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase" }}>Your command centre</p>
            <h1 style={{ margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 500, fontSize: "clamp(36px,5vw,58px)", letterSpacing: "-.035em" }}>{name ? `Welcome back, ${name}.` : "Your portal dashboard."}</h1>
            <p style={{ margin: "12px 0 0", color: "#aab5c7", maxWidth: 650, lineHeight: 1.7 }}>A live overview of your candidate workspace, application pipeline and supporting documents.</p>
          </div>
          <div style={{ color: "#8997ad", fontSize: 12 }}>{loading ? "Syncing your workspace…" : error ? "Workspace needs attention" : "Workspace data loaded"}</div>
        </div>

        {error && <section role="alert" style={{ ...panel, marginBottom: 18, borderColor: "#87534d", background: "#281a20" }}>
          <strong style={{ color: "#ffc1b8" }}>Could not load your saved workspace</strong>
          <p style={{ margin: "8px 0 14px", color: "#e7b8b2", fontSize: 13 }}>{error}</p>
          <button onClick={() => { setLoading(true); setError(""); fetch("/api/personal-jobs/apply-now", { cache: "no-store" }).then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error || "Workspace request failed."); return body; }).then(setData).catch((e: unknown) => setError(e instanceof Error ? e.message : "Workspace request failed.")).finally(() => setLoading(false)); }} style={{ ...linkStyle, background: "transparent", cursor: "pointer" }}>Retry connection</button>
        </section>}

        <section className="dash-grid" aria-label="Workspace summary" style={{ marginBottom: 18 }}>
          {[
            { label: "Tracked opportunities", value: opportunities.length, note: "Jobs and opportunities saved" },
            { label: "In progress", value: outstanding.length, note: "Still need a next step" },
            { label: "Documents", value: documents.length, note: "CVs and supporting files" },
            { label: "Application packs", value: packs.length, note: "Prepared application content" }
          ].map((item) => <article key={item.label} className="dash-stat-card" style={panel}>
            <div className="dash-stat">{item.label}</div>
            <div className="dash-number">{loading ? "—" : item.value}</div>
            <div style={{ marginTop: 8, color: "#8795aa", fontSize: 11 }}>{item.note}</div>
          </article>)}
        </section>

        <section className="dash-layout">
          <div style={panel}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontFamily: "Georgia,serif", fontSize: 25, fontWeight: 500 }}>Application pipeline</h2>
              <a href="/personal-job-desk/apply-now" style={{ color: "#e5c77d", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Manage →</a>
            </div>
            <p className="dash-muted" style={{ margin: "8px 0 10px" }}>Your most recently updated opportunities and their current recorded status.</p>
            {loading ? <p className="dash-muted">Loading opportunities…</p> : recentOpportunities.length === 0 ? <div style={{ padding: "24px 0 6px" }}>
              <p style={{ margin: "0 0 7px", fontWeight: 700 }}>Your pipeline is ready for its first opportunity.</p>
              <p className="dash-muted" style={{ margin: "0 0 16px" }}>Add a role or opportunity in the Job Desk to begin tracking preparation and application progress.</p>
              <a href="/personal-job-desk/apply-now" style={linkStyle}>Add an opportunity ↗</a>
            </div> : recentOpportunities.map((item) => <div className="dash-row" key={item.opportunityId}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}>{item.title}</div>
                <div style={{ marginTop: 5, color: "#8f9bb0", fontSize: 12 }}>{item.organisation} · Updated {formatDate(item.updatedAt || item.createdAt)}</div>
              </div>
              <span className="dash-pill">{statusLabel(item.status)}</span>
            </div>)}
          </div>

          <div style={{ display: "grid", alignContent: "start", gap: 16 }}>
            <section style={panel}>
              <h2 style={{ margin: "0 0 8px", fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 500 }}>Profile readiness</h2>
              <p className="dash-muted" style={{ margin: "0 0 16px" }}>A quick view of how complete your application workspace is.</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><strong style={{ fontSize: 34 }}>{loading ? "—" : readiness}%</strong><span style={{ color: "#9eabc0", fontSize: 12 }}>readiness score</span></div>
              <div role="progressbar" aria-label="Profile readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness} style={{ height: 7, marginTop: 12, borderRadius: 99, background: "#263248", overflow: "hidden" }}>
                <div style={{ width: `${readiness}%`, height: "100%", borderRadius: 99, background: "#d4b66e", transition: "width .25s" }} />
              </div>
              <p className="dash-muted" style={{ margin: "12px 0 16px" }}>{readiness >= 80 ? "Your workspace is in good shape. Keep your details and documents current." : "Add accurate profile details, a CV and supporting documents to improve readiness."}</p>
              <a href="/personal-job-desk/apply-now" style={linkStyle}>Complete my profile ↗</a>
            </section>

            <section style={panel}>
              <h2 style={{ margin: "0 0 8px", fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 500 }}>Recent activity</h2>
              <p className="dash-muted" style={{ margin: "0 0 8px" }}>Recorded activity from your saved workspace.</p>
              {loading ? <p className="dash-muted">Loading activity…</p> : proofLog.length === 0 ? <p className="dash-muted" style={{ marginBottom: 0 }}>No application proof has been recorded yet. When you submit an application outside the portal, save a reference or note in Job Desk to keep a record here.</p> : <div>
                <div style={{ fontSize: 28, fontWeight: 750 }}>{proofLog.length}</div>
                <p className="dash-muted" style={{ margin: "4px 0 0" }}>application proof record{proofLog.length === 1 ? "" : "s"} captured</p>
                <div style={{ marginTop: 10, color: "#8f9bb0", fontSize: 12 }}>Latest record: {formatDate([...proofLog].sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""))[0]?.createdAt)}</div>
              </div>}
            </section>

            <section style={panel}>
              <h2 style={{ margin: "0 0 12px", fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 500 }}>Quick actions</h2>
              <div style={{ display: "grid", gap: 9 }}>
                <a href="/personal-job-desk/apply-now" style={{ ...linkStyle, justifyContent: "space-between" }}>Manage applications <span>→</span></a>
                <a href="/candidate" style={{ ...linkStyle, justifyContent: "space-between", borderColor: "#344258", color: "#c2ccdc" }}>Candidate portal <span>→</span></a>
                <a href="/cv-revamp" style={{ ...linkStyle, justifyContent: "space-between", borderColor: "#344258", color: "#c2ccdc" }}>Improve my CV <span>→</span></a>
              </div>
            </section>
          </div>
        </section>

        <footer style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.08)", color: "#77849a", fontSize: 11, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }}>
          <span>KINGSMEN PORTAL · Candidate workspace</span>
          <span>Counts reflect records returned by your workspace API. No application is submitted automatically.</span>
        </footer>
      </div>
    </main>
  );
}
