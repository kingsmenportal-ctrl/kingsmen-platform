export default function FounderProvidersPage() {
  const providers = [
    ["GitHub", "repo proof", "callable verified"],
    ["Google Drive", "docs/reports", "callable verified"],
    ["Gmail", "email-first", "callable verified; runtime gate pending"],
    ["Airtable", "mirror only", "ping verified"],
    ["Oracle Lite", "runtime host", "access proof pending"],
    ["OpenClaw/Jarvis", "founder command inspiration", "sandbox/research only"]
  ];

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Kingsmen Provider Gates</h1>
      <p>Connected providers are not production safe until proof and founder approval pass.</p>
      <table>
        <thead>
          <tr><th>Provider</th><th>Role</th><th>Status</th></tr>
        </thead>
        <tbody>
          {providers.map(([provider, role, status]) => (
            <tr key={provider}><td>{provider}</td><td>{role}</td><td>{status}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
