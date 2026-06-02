import { BuildProofStatusCard } from "./BuildProofStatusCard";

type ProofReport = {
  module: string;
  status: string;
  passed: boolean;
  reportPath: string;
  oracleLiteImpact?: string;
  controlPlaneImpact?: string;
  nextAction?: string;
};

type Model = {
  title: string;
  productionReady: false;
  reports: ProofReport[];
  rules: string[];
};

export function BuildProofCentreShell({ model }: { model: Model }) {
  const passed = model.reports.filter((report) => report.passed).length;

  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050816", color: "#f8fafc" }}>
      <section style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ color: "#d4af37", letterSpacing: "0.12em" }}>FOUNDER CONTROL PLANE</p>
        <h1>Build Proof Centre</h1>
        <p>Kingsmen does not trust chat claims. It reads proof reports, failed checks, warnings and next actions.</p>
        <p><strong>{passed}</strong> of <strong>{model.reports.length}</strong> reports are passing. productionReady: false</p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {model.reports.map((report) => (
            <BuildProofStatusCard key={report.reportPath} report={report} />
          ))}
        </section>

        <h2>Proof laws</h2>
        <ul>
          {model.rules.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
      </section>
    </main>
  );
}
