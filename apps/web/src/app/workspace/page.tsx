import Link from "next/link";
import { getKingsmenApiHealth } from "../../lib/kingsmen-backend-client";

type HealthPayload = {
  ok?: boolean;
  service?: string;
  status?: string;
  storageMode?: string;
  truthVault?: { enabled?: boolean; status?: string; [key: string]: unknown };
  routes?: string[];
};

const journeys = [
  {
    role: "Candidate / learner",
    purpose: "Use connected candidate account, profile correction, verified discovery, saved opportunity, application tracker, document, finance, outcome and message surfaces.",
    steps: [
      ["Candidate dashboard", "/candidate/dashboard"],
      ["Profile", "/candidate/profile"],
      ["Discover opportunities", "/candidate/discover"],
      ["Saved opportunities", "/candidate/saved-opportunities"],
      ["Application tracker", "/candidate/applications"],
      ["Outcomes", "/candidate/outcomes"],
      ["Documents", "/candidate/documents"],
      ["Finance", "/candidate/finance"],
      ["Messages", "/candidate/messages"]
    ]
  },
  {
    role: "Founder",
    purpose: "Review marketplace submissions with evidence-backed, database-authorised decisions, and inspect operational/build proof.",
    steps: [
      ["Identity-link review queue", "/founder/identity-link-queue"],
      ["Marketplace review queue", "/founder/marketplace-review"],
      ["Founder control plane", "/founder/control-plane"],
      ["Proof centre", "/founder/proof-centre"],
      ["Build proof", "/founder/build-proof"]
    ]
  },
  {
    role: "Partner organisation",
    purpose: "Submit organisation claims and listings for verification; publication remains reviewer-controlled.",
    steps: [["Partner operations", "/partner"], ["Sign in / register", "/auth/login"]]
  }
];

export default async function KingsmenWorkspacePage() {
  const healthResult = await getKingsmenApiHealth<HealthPayload>();
  const health = healthResult.data;
  const connected = healthResult.ok && health?.ok === true;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 18px 56px", color: "#f5f5f5" }}>
      <header style={{ borderBottom: "1px solid #353535", paddingBottom: 22, marginBottom: 24 }}>
        <p style={{ color: "#d6b25e", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Kingsmen daily operations</p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.08, margin: "8px 0 12px" }}>Daily operations workspace</h1>
        <p style={{ maxWidth: 760, color: "#c6c6c6", lineHeight: 1.65 }}>
          Use this as the entry point for the currently implemented daily-use surfaces. Only routes that exist in the repository are linked below;
          missing journeys must be implemented rather than treated as complete.
        </p>
      </header>

      <section aria-labelledby="runtime-heading" style={{ border: "1px solid #393939", borderRadius: 16, padding: 18, marginBottom: 28 }}>
        <h2 id="runtime-heading" style={{ marginTop: 0 }}>Live API connection</h2>
        <p role="status" style={{ fontWeight: 800, color: connected ? "#8ee0a1" : "#ffbf83" }}>
          {connected ? "API responded successfully" : "API connection not confirmed"}
        </p>
        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 10 }}>
          <div><dt style={{ color: "#aaa" }}>Service</dt><dd>{health?.service ?? "Unavailable"}</dd></div>
          <div><dt style={{ color: "#aaa" }}>Runtime status</dt><dd>{health?.status ?? "No response"}</dd></div>
          <div><dt style={{ color: "#aaa" }}>Storage mode</dt><dd>{health?.storageMode ?? "Unknown"}</dd></div>
          <div><dt style={{ color: "#aaa" }}>Durable storage</dt><dd>{health?.truthVault?.enabled === true ? "Enabled" : health?.truthVault?.enabled === false ? "Disabled — runtime data may not persist" : "Not confirmed"}</dd></div>
        </dl>
        {!connected && <p style={{ color: "#ffbf83" }}>The workspace is still available, but live backend health could not be confirmed. Check KINGSMEN_BACKEND_BASE_URL and the API deployment before relying on writes.</p>}
        <p style={{ color: "#aaa", fontSize: 13 }}>This health check proves API reachability only; it does not certify every workflow or database permission.</p>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
        {journeys.map((journey) => (
          <section key={journey.role} style={{ border: "1px solid #393939", borderRadius: 16, padding: 18 }}>
            <h2 style={{ marginTop: 0 }}>{journey.role}</h2>
            <p style={{ color: "#c6c6c6", lineHeight: 1.5 }}>{journey.purpose}</p>
            <ol style={{ paddingLeft: 22, lineHeight: 1.9 }}>
              {journey.steps.map(([label, path]) => (
                <li key={path}><Link href={path} style={{ color: "#f0d58a", textUnderlineOffset: 4 }}>{label}</Link></li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section style={{ marginTop: 26, borderRadius: 16, background: "#202020", padding: 18 }}>
        <h2 style={{ marginTop: 0 }}>Deployment gates still open</h2>
        <ul style={{ color: "#d0d0d0", lineHeight: 1.75 }}>
          <li>Migration 0059 (manual identity-link request queue) and migration 0060 (atomic marketplace review plus audit) are committed in the code branch but have not been applied to Supabase staging.</li>
          <li>The web candidate APIs require the server-only SUPABASE_SERVICE_ROLE_KEY at runtime; it is not configured on the inspected Netlify staging site. Never place it in a NEXT_PUBLIC variable.</li>
          <li>GitHub Actions returned no workflow runs for this PR head; build, tests, browser journeys, and connected staging behaviour remain unverified.</li>
          <li>Netlify staging is SSO-restricted for non-production access; no new deploy was triggered by this batch.</li>
          <li>Payment provider callback/signature and ledger logic exists in the API codebase but still needs reproducible CI and PayFast sandbox end-to-end evidence before any live payment workflow is claimed ready.</li>
        </ul>
        <p style={{ color: "#d0d0d0", lineHeight: 1.65, marginBottom: 0 }}>
          Identity links and marketplace publication remain reviewer-controlled; candidate-reported submissions never become provider-confirmed outcomes, and browser return URLs never settle payments.
        </p>
      </section>
    </main>
  );
}
