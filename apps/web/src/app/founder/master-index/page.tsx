export default function FounderMasterIndexPage() {
  const layers = [
    ["N04", "Candidate Core & Portal", "validated + pushed closeout"],
    ["N05", "Document Vault", "validated + pushed closeout"],
    ["N06", "Route Universe", "validated + pushed closeout"],
    ["N07", "Airtable Mirror / Provider Health", "validated + pushed closeout"],
    ["N08", "Founder Control", "01-03 validated + pushed; closeout pending exact proof"],
    ["MASTER-INDEX-01", "Layer Index / Provider Gates / Proof Matrix", "built pending validation"],
    ["BATCH 21C", "GitHub Actions Docker Runtime Proof", "next runtime gate"]
  ];

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Kingsmen Master Index</h1>
      <p>This page is a founder-facing read model for layer status, proof boundaries, and next action.</p>
      <table>
        <thead>
          <tr><th>Layer</th><th>Name</th><th>Status</th></tr>
        </thead>
        <tbody>
          {layers.map(([id, name, status]) => (
            <tr key={id}><td>{id}</td><td>{name}</td><td>{status}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
