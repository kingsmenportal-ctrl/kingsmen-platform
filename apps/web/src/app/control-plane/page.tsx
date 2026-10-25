"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Health = {
  ok?: boolean;
  productionReady?: boolean;
  boundary?: string;
  mobileControlPlaneBuilt?: boolean;
  actionPacketsBuilt?: boolean;
  queueHealthBuilt?: boolean;
  providerHealthSummaryBuilt?: boolean;
  stopSellingSurfaceBuilt?: boolean;
  serviceRoleVisibleToBrowser?: boolean;
};

const workspaces = [
  { id: "command", code: "N08.01", name: "Command Center", detail: "Founder decisions, action packets and approval boundaries.", state: "FOUNDATION" },
  { id: "candidate", code: "N04 / N06", name: "Candidate Queue", detail: "Identity-link review and candidate-owned request visibility.", state: "LIVE DATA NOT CONNECTED" },
  { id: "application", code: "N06", name: "Application Queue", detail: "Preparation, submission evidence and candidate/provider status distinction.", state: "LIVE DATA NOT CONNECTED" },
  { id: "documents", code: "N05", name: "Document Queue", detail: "Private uploads, extraction, verification and retention proof.", state: "LIVE DATA NOT CONNECTED" },
  { id: "routes", code: "N06 / N15", name: "Route & Opportunity Queue", detail: "Source freshness, eligibility evidence and opportunity ingestion exceptions.", state: "LIVE DATA NOT CONNECTED" },
  { id: "approvals", code: "N08 / N12", name: "Approval Queue", detail: "Human approval requests, policy gates and auditable decisions.", state: "BACKEND AUTHORITY REQUIRED" },
  { id: "capacity", code: "N01 / N16", name: "Capacity Guard", detail: "Candidate caps, dispatch limits, concurrency and stop-selling signals.", state: "LIVE DATA NOT CONNECTED" },
  { id: "workers", code: "N13 / N16", name: "Worker Health", detail: "Heartbeats, retries, dead-letter recovery and execution status.", state: "LIVE DATA NOT CONNECTED" },
  { id: "fallback", code: "N06 / N16", name: "Manual Fallback Center", detail: "MAP and Phoenix fallback when automation is blocked.", state: "LIVE DATA NOT CONNECTED" },
  { id: "kill", code: "N08", name: "Kill Switches", detail: "Audited stop controls for unsafe or degraded workflows.", state: "BACKEND AUTHORITY REQUIRED" },
  { id: "reports", code: "N13", name: "Reports & Evidence", detail: "Release gates, evidence references, incident records and timestamps.", state: "EVIDENCE REGISTRY REQUIRED" },
  { id: "providers", code: "N14", name: "Provider Health", detail: "Integration health, freshness, failures and safe degradation.", state: "LIVE DATA NOT CONNECTED" },
];

const nav = [
  ["Overview", "overview"], ["Action packets", "command"], ["Candidate queue", "candidate"],
  ["Applications", "application"], ["Documents", "documents"], ["Routes & sources", "routes"],
  ["Approvals", "approvals"], ["Capacity guard", "capacity"], ["Worker health", "workers"],
  ["Fallback & recovery", "fallback"], ["Kill switches", "kill"], ["Reports & evidence", "reports"], ["Providers", "providers"]
];

export default function ControlPlanePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState("");
  const [checkedAt, setCheckedAt] = useState("");

  async function refreshHealth() {
    try {
      setHealthError("");
      const res = await fetch("/api/founder/control-plane/health", { cache: "no-store" });
      if (!res.ok) throw new Error("Control Plane health endpoint returned HTTP " + res.status);
      setHealth(await res.json());
      setCheckedAt(new Date().toLocaleString());
    } catch (e) {
      setHealth(null);
      setHealthError(e instanceof Error ? e.message : "Health request failed");
      setCheckedAt(new Date().toLocaleString());
    }
  }

  useEffect(() => { void refreshHealth(); }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#080d16", color: "#edf2fb", fontFamily: "Inter, ui-sans-serif, system-ui, Arial, sans-serif" }}>
      <style>{`
        *{box-sizing:border-box}a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer}
        .cp-layout{display:grid;grid-template-columns:245px minmax(0,1fr);min-height:100vh}
        .cp-side{background:#0b111d;border-right:1px solid #263146;padding:24px 15px;position:sticky;top:0;height:100vh;overflow:auto}
        .cp-logo{display:flex;align-items:center;gap:10px;padding:0 10px 24px;border-bottom:1px solid #263146}
        .cp-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#f0d28b,#b88b3f);color:#111827;font-weight:950}
        .cp-side nav{display:grid;gap:4px;margin-top:20px}.cp-side nav a{padding:10px;border-radius:8px;font-size:12px;color:#9cabc0}.cp-side nav a:hover{background:#182236;color:#f1d18a}
        .cp-main{padding:28px;min-width:0;max-width:1600px;width:100%;margin:0 auto}
        .cp-top{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;border-bottom:1px solid #29354a;padding-bottom:23px}
        .cp-kicker{font-size:10px;letter-spacing:2px;color:#e3bf70;font-weight:900}.cp-title{font-size:clamp(29px,4vw,42px);letter-spacing:-1.3px;margin:9px 0}.cp-sub{font-size:13px;line-height:1.7;color:#9fadc1;max-width:760px}
        .cp-actions{display:flex;gap:9px;flex-wrap:wrap}.cp-btn{border:1px solid #3a4962;background:#111a29;border-radius:8px;padding:10px 12px;color:#e9edf5;font-size:11px;font-weight:800}.cp-btn-gold{background:#e3bf70;border-color:#e3bf70;color:#151a22}
        .cp-alert{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap;border:1px solid #735e35;background:#211c12;border-radius:12px;padding:16px 18px;margin:22px 0}
        .cp-alert strong{font-size:13px;color:#f0d38c}.cp-alert p{font-size:12px;line-height:1.65;color:#c6bba1;margin:6px 0 0;max-width:900px}
        .cp-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0 28px}
        .cp-stat{border:1px solid #2b374c;background:#101827;border-radius:12px;padding:17px;min-height:105px}.cp-stat span{display:block;font-size:10px;color:#96a5ba;letter-spacing:1px;text-transform:uppercase}.cp-stat strong{display:block;font-size:19px;margin-top:14px}.cp-stat small{display:block;color:#78889f;font-size:10px;margin-top:6px}
        .cp-section-head{display:flex;justify-content:space-between;align-items:end;gap:14px;flex-wrap:wrap;margin:30px 0 14px}.cp-section-head h2{font-size:19px;margin:0}.cp-section-head p{font-size:11px;color:#8796ac;margin:6px 0 0}
        .cp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .cp-card{display:block;border:1px solid #2b374c;background:linear-gradient(145deg,#121c2c,#0e1521);border-radius:12px;padding:17px;min-height:170px;transition:border-color .18s,transform .18s}
        .cp-card:hover{border-color:#a98b4e;transform:translateY(-2px)}.cp-card-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.cp-code{font-size:10px;color:#e3bf70;letter-spacing:1px;font-weight:900}.cp-state{font-size:8px;letter-spacing:.7px;color:#e0c582;border:1px solid #65532f;padding:5px 6px;border-radius:5px;text-align:right}
        .cp-card h3{font-size:15px;margin:15px 0 8px}.cp-card p{font-size:11px;line-height:1.65;color:#9eacc0;margin:0}
        .cp-bottom{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin-top:22px}.cp-panel{border:1px solid #2b374c;background:#101827;border-radius:12px;padding:18px}.cp-panel h3{font-size:14px;margin:0 0 12px}.cp-panel p,.cp-panel li{font-size:11px;line-height:1.75;color:#9eacc0}.cp-panel ul{padding-left:18px;margin-bottom:0}
        .cp-foot{font-size:10px;color:#718198;margin-top:24px;padding-top:16px;border-top:1px solid #263146;line-height:1.7}
        @media(max-width:1050px){.cp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cp-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){.cp-layout{grid-template-columns:1fr}.cp-side{position:relative;height:auto;padding:14px}.cp-logo{padding-bottom:13px}.cp-side nav{display:flex;overflow:auto;white-space:nowrap;margin-top:12px}.cp-side nav a{flex:0 0 auto}.cp-main{padding:17px}.cp-grid{grid-template-columns:1fr}.cp-bottom{grid-template-columns:1fr}}
      `}</style>
      <div className="cp-layout">
        <aside className="cp-side">
          <div className="cp-logo"><span className="cp-mark">K</span><div><strong style={{display:"block",fontSize:12,letterSpacing:1.4}}>KINGSMEN</strong><span style={{display:"block",fontSize:10,color:"#8796ac",marginTop:4}}>FOUNDER COMMAND</span></div></div>
          <nav aria-label="Control Plane sections">{nav.map(([label,id])=><a key={id} href={id==="overview"?"#overview":"#"+id}>{label}</a>)}</nav>
          <div style={{margin:"25px 9px 0",padding:"13px 0",borderTop:"1px solid #263146",fontSize:10,color:"#718198",lineHeight:1.8}}>N08 CONTROL PLANE<br/>N13 OBSERVABILITY<br/>N16 ORCHESTRATION</div>
        </aside>
        <div className="cp-main">
          <header id="overview" className="cp-top">
            <div><div className="cp-kicker">N08 / FOUNDER OPERATIONS</div><h1 className="cp-title">Founder Control Plane</h1><p className="cp-sub">Your operational command surface for exceptions, approvals, queue health, provider status, capacity and recovery. This interface does not mutate candidate truth directly; commands must pass through the audited backend.</p></div>
            <div className="cp-actions"><button className="cp-btn" onClick={()=>void refreshHealth()}>↻ Refresh health</button><Link className="cp-btn" href="/admin">Open admin console ↗</Link><Link className="cp-btn cp-btn-gold" href="/jarvis">Open Jarvis ↗</Link></div>
          </header>
          <section className="cp-alert"><div><strong>{health?.productionReady ? "Production readiness reported by health boundary" : "Release gate: NOT PRODUCTION READY"}</strong><p>{healthError ? "Health check failed: "+healthError : health?.boundary ? health.boundary+". The endpoint confirms interface boundaries only; it does not provide persisted queue metrics or prove production readiness." : "Checking the Control Plane health boundary. Operational values remain suppressed until a secured, persisted read model is connected."}</p></div><div style={{fontSize:10,color:"#d8c28d",whiteSpace:"nowrap"}}>{checkedAt ? "CHECKED "+checkedAt : "CHECKING…"}</div></section>
          <section className="cp-stats" aria-label="Operational summary">
            {[["Active candidates","Not connected","No invented count"],["Action packets","Not connected","Persisted read model required"],["Open incidents","Not connected","Incident feed required"],["Production readiness",health?.productionReady ? "Reported ready" : "BLOCKED","Health boundary: "+(health?.ok ? "responded" : healthError ? "error" : "pending")]].map(x=><article className="cp-stat" key={x[0]}><span>{x[0]}</span><strong style={{fontSize:x[0]==="Production readiness"?16:18,color:x[0]==="Production readiness"?"#e6c579":"#e9edf5"}}>{x[1]}</strong><small>{x[2]}</small></article>)}
          </section>
          <div className="cp-section-head"><div><h2>Operations workspaces</h2><p>Select a control surface to inspect its scope and current integration gate.</p></div><span className="cp-kicker">12 REGISTERED SURFACES</span></div>
          <section className="cp-grid">{workspaces.map(w=><a className="cp-card" href={"#"+w.id} key={w.id}><div className="cp-card-top"><span className="cp-code">{w.code}</span><span className="cp-state">{w.state}</span></div><h3>{w.name} ↗</h3><p>{w.detail}</p></a>)}</section>
          <section className="cp-bottom">
            <article className="cp-panel"><h3>Non-negotiable control boundaries</h3><ul><li>PostgreSQL is the source of truth; Airtable is a mirror only.</li><li>No direct candidate status or document decision changes from this UI.</li><li>Dangerous actions require explicit human approval and an audit record.</li><li>Missing or stale evidence must remain visible and fail closed.</li><li>AI may advise; it cannot decide money, refunds, official outcomes, fraud or privacy.</li></ul></article>
            <article className="cp-panel"><h3>Runtime boundary</h3><p>Health endpoint: <code>/api/founder/control-plane/health</code></p><p>Endpoint response: <strong style={{color:health?.ok?"#8bd8ae":"#e3bf70"}}>{healthError ? "ERROR" : health ? "RESPONDED" : "CHECKING"}</strong></p><p>Service role exposed to browser: <strong style={{color:health?.serviceRoleVisibleToBrowser?"#ff9c8d":"#9ba9bc"}}>{health?.serviceRoleVisibleToBrowser === false ? "NO (reported)" : "NOT VERIFIED"}</strong></p><p>Queue counts, candidate records and action execution are intentionally not fabricated.</p></article>
          </section>
          {workspaces.map(w=><section id={w.id} key={w.id} style={{scrollMarginTop:20,marginTop:14,border:"1px solid #29354a",borderRadius:12,padding:18,background:"#0e1623"}}><div className="cp-card-top"><span className="cp-code">{w.code}</span><span className="cp-state">{w.state}</span></div><h2 style={{fontSize:17,margin:"12px 0 7px"}}>{w.name}</h2><p style={{fontSize:12,color:"#9eacc0",lineHeight:1.7,margin:0}}>{w.detail}</p><p style={{fontSize:10,color:"#78889f",marginBottom:0}}>Integration gate: connect authenticated, timestamped backend read model before showing operational records or enabling actions.</p></section>)}
          <footer className="cp-foot">KINGSMEN FOUNDER CONTROL PLANE · UI AND HEALTH BOUNDARY ONLY · PRODUCTION READINESS IS NOT CLAIMED · Last health check: {checkedAt || "not yet completed"}.</footer>
        </div>
      </div>
    </main>
  );
}
