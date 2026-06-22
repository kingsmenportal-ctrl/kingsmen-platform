const proofRoutes = [
  {
    title: "Evidence Collector",
    href: "/api/jarvis/evidence-collector",
    detail: "Source, validator, runtime, provider, launch, and blocker evidence map."
  },
  {
    title: "Source Launch Gate",
    href: "/api/jarvis/source-launch-gate",
    detail: "Final source gate showing why production and public launch remain false."
  },
  {
    title: "Proof Pack Index",
    href: "/api/jarvis/proof-pack-index",
    detail: "Index of validators, reports, manifests, routes, and runtime blockers."
  },
  {
    title: "Final Jarvis HUD",
    href: "/jarvis/final",
    detail: "Founder command HUD for source-complete Jarvis readiness and launch blockers."
  }
];

export const dynamic = "force-dynamic";

export default function JarvisProofCentrePage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050914", color: "#ecfbff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1320, margin: "0 auto" }}>
        <p style={{ margin: 0, color: "#6ff7ff", fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>Kingsmen Jarvis · Proof Centre</p>
        <h1 style={{ margin: "10px 0 12px", fontSize: "clamp(2.6rem, 7vw, 5.4rem)", lineHeight: 0.92 }}>Evidence, launch gates, and proof pack</h1>
        <p style={{ maxWidth: 980, color: "rgba(236,251,255,0.74)", lineHeight: 1.65 }}>
          This source-safe proof centre keeps Jarvis moving while local Docker/API runtime is blocked. It does not mark production-ready and does not expose secret values.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginTop: 24 }}>
          {proofRoutes.map((route) => (
            <a key={route.href} href={route.href} target="_blank" rel="noreferrer" style={cardStyle}>
              <span style={labelStyle}>SOURCE READY</span>
              <h2 style={{ margin: "10px 0", fontSize: "1.15rem", color: "#ecfbff" }}>{route.title}</h2>
              <p style={{ color: "rgba(236,251,255,0.72)", lineHeight: 1.55 }}>{route.detail}</p>
              <code style={{ color: "#9dffcb" }}>{route.href}</code>
            </a>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 24 }}>
          <article style={cardOnly}><span style={labelStyle}>Production ready</span><strong>false</strong></article>
          <article style={cardOnly}><span style={labelStyle}>Public launch</span><strong>false</strong></article>
          <article style={cardOnly}><span style={labelStyle}>Docker independent</span><strong>true</strong></article>
          <article style={cardOnly}><span style={labelStyle}>Secret values returned</span><strong>false</strong></article>
        </section>
      </section>
    </main>
  );
}

const cardOnly = {
  border: "1px solid rgba(139,231,255,0.2)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(8,22,39,0.86)",
  boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)"
};

const cardStyle = {
  ...cardOnly,
  display: "block",
  textDecoration: "none"
};

const labelStyle = {
  display: "block",
  color: "rgba(139,231,255,0.74)",
  fontSize: "0.72rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
  fontWeight: 900
};
