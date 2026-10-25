import Link from "next/link";

const panels = [
  { code: "N08", title: "Control Plane", text: "Founder-facing operational command boundary", state: "THIS WORKSPACE" },
  { code: "N13", title: "Health & evidence", text: "Release gates, source freshness, incident and proof visibility", state: "EVIDENCE REQUIRED" },
  { code: "N16", title: "Execution & recovery", text: "Workflow orchestration, retries and recovery visibility", state: "LIVE STATE NOT VERIFIED" },
];

export default function ControlPlanePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#070b14", color: "#f4f7fb", fontFamily: "Arial, Helvetica, sans-serif", padding: "clamp(18px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, paddingBottom: 22, borderBottom: "1px solid #29364a" }}>
          <div><div style={{ color: "#d7b56d", fontSize: 11, letterSpacing: 3, fontWeight: 700 }}>KINGSMEN / FOUNDER</div><h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", margin: "10px 0 0" }}>Control Plane</h1></div>
          <Link href="/" style={{ color: "#d7b56d", textDecoration: "none", border: "1px solid #45516a", padding: "10px 14px", borderRadius: 10 }}>← Portal home</Link>
        </header>
        <section style={{ margin: "28px 0", padding: "22px 24px", borderRadius: 16, background: "#111b2a", border: "1px solid #344258" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 10, height: 10, marginTop: 6, flex: "0 0 auto", borderRadius: "50%", background: "#d7b56d" }} />
            <div><h2 style={{ margin: 0, fontSize: 18 }}>Interface available · live operational state not yet verified</h2><p style={{ color: "#aebbd0", lineHeight: 1.7, marginBottom: 0 }}>This workspace deliberately does not invent queue counts, incidents, candidate outcomes or deployment health. Those indicators should only be shown when retrieved through an authenticated, persisted operational read path with timestamps and evidence references.</p></div>
          </div>
        </section>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 16 }}>
          {panels.map(p => <article key={p.code} style={{ background: "#101827", border: "1px solid #29364a", borderRadius: 16, padding: 22 }}>
            <div style={{ color: "#d7b56d", letterSpacing: 2, fontSize: 12, fontWeight: 700 }}>{p.code}</div><h2 style={{ fontSize: 22, margin: "12px 0" }}>{p.title}</h2><p style={{ color: "#aebbd0", lineHeight: 1.65, minHeight: 50 }}>{p.text}</p><div style={{ fontSize: 10, letterSpacing: 1.2, color: "#f0cb7d", borderTop: "1px solid #29364a", paddingTop: 14 }}>{p.state}</div>
          </article>)}
        </section>
        <h2 style={{ marginTop: 34, fontSize: 20 }}>Open a workspace</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="/jarvis" style={{ background: "#d7b56d", color: "#101827", padding: "13px 17px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>Launch Jarvis ↗</Link>
          <Link href="/command" style={{ border: "1px solid #53617a", color: "#f4f7fb", padding: "13px 17px", borderRadius: 10, textDecoration: "none" }}>Command interface ↗</Link>
          <Link href="/admin" style={{ border: "1px solid #53617a", color: "#f4f7fb", padding: "13px 17px", borderRadius: 10, textDecoration: "none" }}>Admin ↗</Link>
          <Link href="/kingsmen" style={{ border: "1px solid #53617a", color: "#f4f7fb", padding: "13px 17px", borderRadius: 10, textDecoration: "none" }}>Public website ↗</Link>
        </div>
        <footer style={{ color: "#738198", fontSize: 12, marginTop: 44, borderTop: "1px solid #29364a", paddingTop: 18 }}>Founder access controls, authorization, durable data and evidence gates must be enforced by backend services—not by hiding UI elements.</footer>
      </div>
    </main>
  );
}
