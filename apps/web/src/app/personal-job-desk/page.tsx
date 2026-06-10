import type { CSSProperties } from "react";

const modules = [
  {
    title: "Apply Now",
    href: "/personal-job-desk/apply-now",
    badge: "APPLY",
    description: "Smart CV intake, profile, documents, application packs and proof tracking.",
    action: "Continue applying"
  },
  {
    title: "Opportunity Scout",
    href: "/personal-job-desk/opportunity-scout",
    badge: "SCOUT",
    description: "Run connected search/scout tools and import real opportunities into the queue.",
    action: "Find opportunities"
  },
  {
    title: "Document Pack",
    href: "/personal-job-desk/document-pack-index",
    badge: "DOCS",
    description: "Check CV, ID, certificates, proof and route-specific document readiness.",
    action: "Review documents"
  }
];

const workflow = [
  "Upload CV/documents",
  "Smart profile fills itself",
  "Scout real opportunities",
  "Import selected lead",
  "Build application pack",
  "Open official source",
  "Apply safely",
  "Capture proof"
];

export default function PersonalJobDeskHome() {
  return (
    <main style={main}>
      <section style={hero}>
        <div>
          <p style={eyebrow}>KINGSMEN PERSONAL JOB DESK</p>
          <h1 style={title}>Real application command centre</h1>
          <p style={lead}>
            This is the connected home for your job side: smart CV intake, opportunity scout,
            document readiness, application packs, source opening and proof tracking.
          </p>

          <div style={heroActions}>
            <a href="/personal-job-desk/apply-now" style={primaryButton}>Start / continue application</a>
            <a href="/personal-job-desk/opportunity-scout" style={secondaryButton}>Run opportunity scout</a>
            <a href="/personal-job-desk/document-pack-index" style={secondaryButton}>Open document pack</a>
          </div>
        </div>

        <div style={statusCard}>
          <span style={statusNumber}>8</span>
          <strong>Core steps</strong>
          <small>Find → Prepare → Apply → Track proof</small>
        </div>
      </section>

      <section style={grid}>
        {modules.map((module) => (
          <a key={module.href} href={module.href} style={moduleCard}>
            <span style={badge}>{module.badge}</span>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            <strong style={cardAction}>{module.action} →</strong>
          </a>
        ))}
      </section>

      <section style={panel}>
        <p style={eyebrow}>CONNECTED WORKFLOW</p>
        <h2 style={{ marginTop: 0 }}>How the user journey should work</h2>

        <div style={steps}>
          {workflow.map((step, index) => (
            <div key={step} style={stepCard}>
              <span style={stepNumber}>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section style={panel}>
        <p style={eyebrow}>PLATFORM CONTROLS</p>
        <h2 style={{ marginTop: 0 }}>What was missing and is now added</h2>
        <div style={controlGrid}>
          <div style={controlCard}>Back button</div>
          <div style={controlCard}>Forward button</div>
          <div style={controlCard}>Home button</div>
          <div style={controlCard}>Refresh button</div>
          <div style={controlCard}>Persistent side menu</div>
          <div style={controlCard}>Top current-page bar</div>
          <div style={controlCard}>Module menu drawer</div>
          <div style={controlCard}>Quick action buttons</div>
        </div>
      </section>
    </main>
  );
}

const main: CSSProperties = {
  padding: 24,
  display: "grid",
  gap: 18
};

const hero: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr minmax(220px,320px)",
  gap: 18,
  border: "1px solid rgba(255,215,122,.28)",
  borderRadius: 32,
  background: "linear-gradient(135deg,rgba(215,173,73,.18),rgba(0,0,0,.32))",
  padding: 28
};

const eyebrow: CSSProperties = {
  color: "#d7ad49",
  textTransform: "uppercase",
  letterSpacing: ".16em",
  fontSize: 12,
  fontWeight: 900
};

const title: CSSProperties = {
  fontSize: 52,
  lineHeight: 1,
  margin: "8px 0 14px"
};

const lead: CSSProperties = {
  color: "#d8caa8",
  lineHeight: 1.7,
  maxWidth: 760,
  fontSize: 17
};

const heroActions: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 20
};

const primaryButton: CSSProperties = {
  border: 0,
  borderRadius: 999,
  padding: "13px 18px",
  background: "#d7ad49",
  color: "#111",
  fontWeight: 1000,
  textDecoration: "none"
};

const secondaryButton: CSSProperties = {
  border: "1px solid rgba(255,215,122,.38)",
  borderRadius: 999,
  padding: "13px 18px",
  color: "#ffd77a",
  fontWeight: 900,
  textDecoration: "none",
  background: "rgba(0,0,0,.18)"
};

const statusCard: CSSProperties = {
  border: "1px solid rgba(255,215,122,.24)",
  borderRadius: 28,
  background: "rgba(0,0,0,.26)",
  display: "grid",
  placeContent: "center",
  gap: 8,
  textAlign: "center",
  color: "#ffd77a"
};

const statusNumber: CSSProperties = {
  fontSize: 66,
  fontWeight: 1000
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 16
};

const moduleCard: CSSProperties = {
  border: "1px solid rgba(255,215,122,.20)",
  borderRadius: 26,
  padding: 22,
  background: "rgba(255,255,255,.055)",
  color: "#f8f0db",
  textDecoration: "none",
  display: "grid",
  gap: 10,
  minHeight: 210
};

const badge: CSSProperties = {
  width: "fit-content",
  borderRadius: 999,
  padding: "8px 10px",
  border: "1px solid rgba(255,215,122,.24)",
  background: "rgba(215,173,73,.14)",
  color: "#ffd77a",
  fontSize: 12,
  fontWeight: 900
};

const cardAction: CSSProperties = {
  color: "#ffd77a",
  marginTop: "auto"
};

const panel: CSSProperties = {
  border: "1px solid rgba(255,215,122,.20)",
  borderRadius: 26,
  padding: 22,
  background: "rgba(0,0,0,.22)"
};

const steps: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 12
};

const stepCard: CSSProperties = {
  border: "1px solid rgba(255,215,122,.16)",
  borderRadius: 18,
  padding: 15,
  background: "rgba(255,255,255,.045)",
  display: "grid",
  gap: 8
};

const stepNumber: CSSProperties = {
  color: "#d7ad49",
  fontWeight: 1000
};

const controlGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 10
};

const controlCard: CSSProperties = {
  border: "1px solid rgba(255,215,122,.16)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(215,173,73,.08)",
  color: "#ffd77a",
  fontWeight: 900
};