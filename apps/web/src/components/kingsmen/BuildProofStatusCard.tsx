type ProofReport = {
  module: string;
  status: string;
  passed: boolean;
  reportPath: string;
  oracleLiteImpact?: string;
  controlPlaneImpact?: string;
  nextAction?: string;
};

export function BuildProofStatusCard({ report }: { report: ProofReport }) {
  return (
    <article style={{ border: "1px solid #d4af37", borderRadius: 16, padding: 16, background: "#07111f", color: "#f8fafc" }}>
      <p style={{ margin: 0, color: "#d4af37", fontSize: 12 }}>{report.status}</p>
      <h3>{report.module}</h3>
      <p><strong>Status:</strong> {report.passed ? "PASSED" : "NEEDS WORK"}</p>
      <p><strong>Report:</strong> {report.reportPath}</p>
      {report.oracleLiteImpact ? <p><strong>Oracle Lite:</strong> {report.oracleLiteImpact}</p> : null}
      {report.controlPlaneImpact ? <p><strong>Control Plane:</strong> {report.controlPlaneImpact}</p> : null}
      {report.nextAction ? <p><strong>Next:</strong> {report.nextAction}</p> : null}
    </article>
  );
}
