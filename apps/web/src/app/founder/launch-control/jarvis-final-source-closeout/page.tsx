export const dynamic = "force-dynamic";

const cards = [
  ["Final HUD", "/jarvis/final", "Single command room for Jarvis source, proof, and blocker control."],
  ["Closeout API", "/api/jarvis/final-source-closeout-seal", "Final source/design closeout decision."],
  ["Live Queue", "/founder/launch-control/jarvis-live-proof-queue", "Remaining proof queue before live."],
  ["Runbook", "/founder/launch-control/jarvis-live-proof-runbook", "Ordered live proof sequence."],
  ["Evidence Ledger", "/founder/proof-centre/jarvis-live-proof-evidence-ledger", "Evidence missing, blocked, rejected, and accepted."],
  ["Acceptance Gate", "/founder/launch-control/jarvis-live-proof-acceptance-gate", "What evidence can be accepted before launch."],
  ["Proof Pack", "/api/jarvis/proof-pack-index", "Validators, manifests, routes, reports, and blockers."]
];

const remaining = [
  "Docker/API/Truth Vault runtime proof",
  "AI + Email provider live proof",
  "PayFast sandbox accepted ITN proof",
  "n8n + Airtable + GitHub runtime proof",
  "Branch protection + final launch audit"
];

export default function JarvisFinalSourceCloseoutPage() {
  return (
    <main style={{
      minHeight: "100vh",
      padding: 28,
      color: "#ecfbff",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      background: "radial-gradient(circle at 12% 12%, rgba(0,224,255,0.22), transparent 28%), radial-gradient(circle at 80% 20%, rgba(149,76,255,0.18), transparent 30%), linear-gradient(145deg, #040813, #071323 46%, #02040a)"
    }}>
      <section style={{ maxWidth: 1380, margin: "0 auto", display: "grid", gap: 18 }}>
        <section style={{ border: "1px solid rgba(139,231,255,0.24)", borderRadius: 28, padding: 26, background: "rgba(8,22,39,0.86)" }}>
          <p style={label}>Kingsmen · Jarvis final source closeout</p>
          <h1 style={{ margin: "10px 0", fontSize: "clamp(2.4rem, 6vw, 6rem)", lineHeight: 0.9, letterSpacing: "-0.06em" }}>SOURCE CLOSED OUT</h1>
          <p style={p}>Jarvis source/design/control surfaces are complete enough to stop adding UI layers. Runtime, provider, security, and final audit proof still block live production readiness.</p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
          <Stat label="Source/design" value="CLOSED OUT" />
          <Stat label="Runtime live" value="FALSE" />
          <Stat label="Production" value="FALSE" />
          <Stat label="Public launch" value="FALSE" />
          <Stat label="Remaining live batches" value="5" />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
          <article style={panel}>
            <p style={label}>Sealed source surfaces</p>
            <div style={{ display: "grid", gap: 10 }}>
              {cards.map(([title, href, detail]) => (
                <a key={href} href={href} target="_blank" rel="noreferrer" style={linkCard}>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                  <code>{href}</code>
                </a>
              ))}
            </div>
          </article>

          <article style={panelDanger}>
            <p style={label}>Still blocks live</p>
            {remaining.map((item) => (
              <p key={item} style={{ ...p, marginBottom: 12 }}>• {item}</p>
            ))}
            <p style={{ ...p, marginTop: 18, color: "#ffe3a3" }}>No live claim is allowed until these five proof batches pass with redacted evidence.</p>
          </article>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article style={panel}>
      <p style={labelStyle}>{label}</p>
      <strong style={{ display: "block", marginTop: 8, fontSize: "1.35rem" }}>{value}</strong>
    </article>
  );
}

const label = { margin: 0, color: "rgba(139,231,255,0.82)", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, fontWeight: 900 };
const labelStyle = { margin: 0, color: "rgba(194,231,244,0.68)", fontSize: "0.72rem", textTransform: "uppercase" as const, letterSpacing: "0.12em" };
const p = { margin: 0, color: "rgba(236,251,255,0.72)", lineHeight: 1.65 };
const panel = { border: "1px solid rgba(139,231,255,0.22)", borderRadius: 24, padding: 18, background: "rgba(8,22,39,0.86)" };
const panelDanger = { ...panel, border: "1px solid rgba(255,117,117,0.34)", background: "rgba(86,24,24,0.34)" };
const linkCard = { display: "grid", gap: 6, border: "1px solid rgba(139,231,255,0.16)", borderRadius: 16, padding: 14, color: "#ecfbff", textDecoration: "none", background: "rgba(2,9,20,0.42)" };
