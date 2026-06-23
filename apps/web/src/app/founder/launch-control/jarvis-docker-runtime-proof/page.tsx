export const dynamic = "force-dynamic";

const checks = [
  ["Docker Engine Reachable", "BLOCKED_BY_LOCAL_DOCKER", "Docker must run without pipe errors before runtime proof can pass."],
  ["API Health HTTP 200", "WAITING_FOR_RUNTIME", "The backend health endpoint must return 200 with postgres_truth_vault storage mode."],
  ["Truth Vault Authority", "WAITING_FOR_RUNTIME", "PostgreSQL must remain authority. Airtable is mirror-only. n8n is relay-only."],
  ["Jarvis Command Audit Write", "WAITING_FOR_RUNTIME", "Jarvis command must write command_log and audit_events through backend only."],
  ["Runtime Redaction Lock", "SOURCE_READY", "Runtime proof must not expose raw secrets or secret values."]
];

export default function JarvisDockerRuntimeProofPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050914", color: "#ecfbff", fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}>
        <article style={hero}>
          <p style={kicker}>Kingsmen · Jarvis Live Proof Batch 1</p>
          <h1 style={{ margin: "10px 0", fontSize: "clamp(2.6rem, 7vw, 6rem)", letterSpacing: "-0.07em" }}>Docker / API / Truth Vault Proof</h1>
          <p style={muted}>This is the first live proof batch. It does not claim Jarvis is live. It defines the runtime evidence needed before production readiness can move.</p>
          <div style={strip}>
            <Status label="Runtime live" value="FALSE" />
            <Status label="Production" value="FALSE" />
            <Status label="Launch" value="FALSE" />
            <Status label="Batch" value="1 / 5" />
          </div>
        </article>

        <article style={panel}>
          <h2 style={h2}>Proof checks</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {checks.map(([title, state, detail]) => (
              <section key={title} style={card}>
                <span style={pill(state)}>{state}</span>
                <h3 style={{ margin: "10px 0 8px" }}>{title}</h3>
                <p style={muted}>{detail}</p>
              </section>
            ))}
          </div>
        </article>

        <article style={panel}>
          <h2 style={h2}>Accepted evidence required</h2>
          <p style={muted}>API health HTTP 200, postgres_truth_vault storage mode, command_log write proof, audit_events write proof, redacted output, no browser shell, no direct database access from web, and no provider secret exposure.</p>
          <p style={muted}>Open JSON gate: <a href="/api/jarvis/docker-truth-vault-runtime-proof" style={link}>/api/jarvis/docker-truth-vault-runtime-proof</a></p>
        </article>
      </section>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return <section style={mini}><span style={small}>{label}</span><strong>{value}</strong></section>;
}

function pill(state: string) {
  return {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: 999,
    border: "1px solid rgba(112,247,255,0.28)",
    color: state.includes("BLOCK") ? "#ffc9c9" : state.includes("SOURCE") ? "#9dffcb" : "#ffe3a3",
    fontSize: "0.7rem",
    fontWeight: 900,
    letterSpacing: "0.08em"
  };
}

const hero = { border: "1px solid rgba(139,231,255,0.24)", borderRadius: 28, padding: 28, background: "linear-gradient(135deg, rgba(0,174,255,0.17), rgba(105,56,255,0.1)), rgba(8,22,39,0.86)" };
const panel = { border: "1px solid rgba(139,231,255,0.18)", borderRadius: 24, padding: 22, background: "rgba(8,22,39,0.82)" };
const card = { border: "1px solid rgba(139,231,255,0.16)", borderRadius: 18, padding: 16, background: "rgba(2,9,20,0.46)" };
const strip = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 };
const mini = { border: "1px solid rgba(139,231,255,0.18)", borderRadius: 18, padding: 14, background: "rgba(2,9,20,0.38)" };
const kicker = { margin: 0, color: "#70f7ff", letterSpacing: "0.18em", textTransform: "uppercase" as const, fontWeight: 900 };
const muted = { color: "rgba(236,251,255,0.72)", lineHeight: 1.6 };
const small = { display: "block", color: "rgba(194,231,244,0.68)", fontSize: "0.72rem", textTransform: "uppercase" as const, letterSpacing: "0.12em" };
const h2 = { margin: "0 0 14px" };
const link = { color: "#9dffcb" };
