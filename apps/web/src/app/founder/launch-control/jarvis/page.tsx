const gates = [
  ["SOURCE_PASSED", "Jarvis Final Command HUD", "Final source HUD is built and shows command, completion, evidence, launch, provider, and proof-pack surfaces."],
  ["SOURCE_PASSED", "Completion Board", "Docker-independent source completion board is built and keeps launch blocked honestly."],
  ["SOURCE_PASSED", "Provider Checklist", "Credential names are listed without exposing secret values."],
  ["SOURCE_PASSED", "Evidence Collector", "Captured, pending, and blocked proof items are separated."],
  ["SOURCE_PASSED", "Proof Pack Index", "Validators, manifests, reports, routes, and blockers are indexed."],
  ["BLOCKED_BY_LOCAL_DOCKER", "Backend / Truth Vault Runtime", "Docker/API instability blocks runtime proof only."],
  ["PENDING_CREDENTIALS", "AI Provider Live Proof", "Needs real provider credentials outside Git and redacted live-call evidence."],
  ["PENDING_CREDENTIALS", "Email Provider Proof", "Needs send, receive, bounce, opt-out, redaction, and evidence ledger proof."],
  ["PENDING_CREDENTIALS", "PayFast ITN Proof", "Needs sandbox checkout and accepted ITN proof before paid state can be trusted."],
  ["PENDING_RUNTIME_PROOF", "n8n / Airtable / GitHub", "Needs live connector proofs with redacted evidence."],
  ["PENDING_SECURITY_PROOF", "Branch Protection / Launch Audit", "Needs branch protection, staging evidence, and launch audit proof."]
];

const links = [
  ["Final HUD", "/jarvis/final"],
  ["Command Surface", "/jarvis"],
  ["Provider Checklist", "/founder/providers/jarvis-credentials"],
  ["Proof Centre", "/founder/proof-centre/jarvis"],
  ["Launch Control JSON", "/api/jarvis/final-launch-control"],
  ["Proof Pack JSON", "/api/jarvis/proof-pack-index"]
];

export const dynamic = "force-dynamic";

export default function JarvisLaunchControlPage() {
  const blocked = gates.filter(([state]) => !["SOURCE_PASSED", "RUNTIME_PASSED"].includes(state)).length;

  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "radial-gradient(circle at 15% 10%, rgba(0,224,255,0.2), transparent 28%), #050914", color: "#ecfbff", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: 1440, margin: "0 auto" }}>
        <p style={kicker}>Kingsmen · Jarvis Final Launch Control</p>
        <h1 style={{ margin: "8px 0 12px", fontSize: "clamp(2.8rem, 8vw, 6.8rem)", lineHeight: 0.88, letterSpacing: "-0.07em" }}>LIVE GATE</h1>
        <p style={muted}>This is the founder launch-control board for Jarvis. It shows what is source-complete and what still blocks production. It does not fake readiness, execute shell commands, call providers, or expose secrets.</p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, margin: "24px 0" }}>
          <Card label="Source design" value="complete" />
          <Card label="Production ready" value="false" />
          <Card label="Public launch" value="false" />
          <Card label="Blocking gates" value={String(blocked)} />
        </section>

        <section style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
          {links.map(([label, href]) => <a key={href} href={href} style={buttonStyle}>{label}</a>)}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 }}>
          {gates.map(([state, title, detail]) => (
            <article key={title} style={cardStyle}>
              <span style={{ ...pillStyle, color: state === "SOURCE_PASSED" ? "#9dffcb" : state.includes("BLOCKED") ? "#ffc9c9" : "#ffe3a3" }}>{state}</span>
              <h2 style={{ margin: "12px 0", fontSize: "1.1rem" }}>{title}</h2>
              <p style={muted}>{detail}</p>
            </article>
          ))}
        </section>

        <section style={{ ...cardStyle, marginTop: 18 }}>
          <p style={kicker}>No fake launch rule</p>
          <p style={muted}>Jarvis can be considered source/design complete, but not live production until backend runtime, provider credentials, live proofs, branch protection, staging evidence, and final launch audit pass.</p>
        </section>
      </section>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <article style={cardStyle}><span style={kicker}>{label}</span><strong style={{ display: "block", marginTop: 8, fontSize: "1.4rem" }}>{value}</strong></article>;
}

const cardStyle = {
  border: "1px solid rgba(139,231,255,0.22)",
  borderRadius: 24,
  padding: 18,
  background: "rgba(8,22,39,0.86)",
  boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)"
};

const kicker = {
  margin: 0,
  color: "#70f7ff",
  fontSize: "0.72rem",
  fontWeight: 900,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const
};

const muted = {
  maxWidth: 980,
  color: "rgba(236,251,255,0.74)",
  lineHeight: 1.65
};

const pillStyle = {
  display: "inline-block",
  padding: "6px 8px",
  border: "1px solid rgba(139,231,255,0.24)",
  borderRadius: 999,
  fontSize: "0.68rem",
  fontWeight: 900,
  letterSpacing: "0.08em"
};

const buttonStyle = {
  color: "#04121f",
  background: "linear-gradient(135deg, #70f7ff, #9dffcb)",
  padding: "12px 16px",
  borderRadius: 999,
  fontWeight: 900,
  textDecoration: "none"
};
