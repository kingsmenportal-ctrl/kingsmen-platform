export const dynamic = "force-dynamic";

type SequencePayload = {
  sourceExecutionSequenceReady: boolean;
  liveEvidenceAccepted: boolean;
  jarvisRuntimeLive: boolean;
  productionReady: boolean;
  publicLaunchAllowed: boolean;
  launchBlocked: boolean;
  sequenceRunner: string;
  sequenceReportPath: string;
  sequenceValidator: string;
  executionSteps: Array<{
    id: string;
    order: number;
    title: string;
    state: string;
    runner: string;
    reportPath: string;
    gateRoute: string;
    launchCritical: boolean;
    detail: string;
  }>;
};

async function loadSequence(): Promise<SequencePayload | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/jarvis/live-evidence-execution-sequence`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as SequencePayload;
  } catch {
    return null;
  }
}

const shell = {
  minHeight: "100vh",
  padding: 28,
  color: "#ecfbff",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  background: "radial-gradient(circle at 12% 10%, rgba(0,224,255,0.22), transparent 28%), linear-gradient(145deg, #040813, #071323 46%, #02040a)"
};

const card = {
  border: "1px solid rgba(139,231,255,0.22)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(8,22,39,0.86)",
  boxShadow: "inset 0 0 24px rgba(105,235,255,0.04)"
};

const label = {
  margin: 0,
  color: "rgba(139,231,255,0.76)",
  fontSize: "0.72rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontWeight: 900
};

const p = { margin: 0, color: "rgba(236,251,255,0.72)", lineHeight: 1.55 };
const code = { display: "block", marginTop: 8, padding: 10, borderRadius: 10, background: "rgba(0,0,0,0.26)", color: "#9dffcb", overflowWrap: "anywhere" as const };

export default async function JarvisLiveEvidenceExecutionSequencePage() {
  const data = await loadSequence();

  return (
    <main style={shell}>
      <section style={{ maxWidth: 1420, margin: "0 auto", display: "grid", gap: 18 }}>
        <section style={card}>
          <p style={label}>Kingsmen · Jarvis live evidence execution sequence</p>
          <h1 style={{ margin: "10px 0", fontSize: "clamp(2.4rem, 6vw, 5.4rem)", lineHeight: 0.9 }}>Evidence execution, not fake launch</h1>
          <p style={{ ...p, maxWidth: 980 }}>
            This page gives the ordered evidence capture sequence for moving Jarvis from source-closeout to final live evidence acceptance. It does not run shell from the browser and it does not expose secret values.
          </p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <article style={card}><p style={label}>Sequence ready</p><strong>{String(data?.sourceExecutionSequenceReady ?? false)}</strong></article>
          <article style={card}><p style={label}>Runtime live</p><strong>{String(data?.jarvisRuntimeLive ?? false)}</strong></article>
          <article style={card}><p style={label}>Production</p><strong>{String(data?.productionReady ?? false)}</strong></article>
          <article style={card}><p style={label}>Public launch</p><strong>{String(data?.publicLaunchAllowed ?? false)}</strong></article>
          <article style={card}><p style={label}>Launch blocked</p><strong>{String(data?.launchBlocked ?? true)}</strong></article>
        </section>

        <section style={card}>
          <p style={label}>Single sequence runner</p>
          <code style={code}>node {data?.sequenceRunner ?? "scripts/proof/run-jarvis-live-evidence-capture-sequence.mjs"}</code>
          <p style={{ ...p, marginTop: 10 }}>Report: {data?.sequenceReportPath ?? "reports/jarvis/jarvis-live-evidence-execution-sequence-latest.json"}</p>
          <p style={p}>Validator: {data?.sequenceValidator ?? "scripts/validators/validate-jarvis-live-evidence-execution-sequence.mjs"}</p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {(data?.executionSteps ?? []).map((step) => (
            <article key={step.id} style={card}>
              <p style={label}>Step {step.order} · {step.state}</p>
              <h2 style={{ margin: "8px 0", fontSize: "1.1rem" }}>{step.title}</h2>
              <p style={p}>{step.detail}</p>
              <code style={code}>node {step.runner}</code>
              <p style={{ ...p, marginTop: 8 }}>Gate: {step.gateRoute}</p>
              <p style={p}>Report: {step.reportPath}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
