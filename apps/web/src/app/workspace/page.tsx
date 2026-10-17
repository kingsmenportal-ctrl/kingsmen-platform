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
    purpose: "Move from account access to a documented next step.",
    steps: [
      ["Open candidate dashboard", "/candidate/dashboard"],
      ["Complete or review profile", "/candidate/profile"],
      ["Explore route options", "/candidate/routes"],
      ["Review saved opportunities", "/candidate/saved-opportunities"],
      ["Track applications and outcomes", "/candidate/outcomes"],
      ["Manage documents", "/candidate/documents"],
      ["Review payments and invoices", "/candidate/finance"],
      ["Get help or contact support", "/candidate/support"]
    ]
  },
  {
    role: "Founder",
    purpose: "Run the daily control loop: inspect, decide, approve, record, and follow up.",
    steps: [
      ["Open control plane", "/founder/control-plane"],
      ["Review pending commands", "/founder/commands"],
      ["Review proof and evidence", "/founder/proof-centre"],
      ["Inspect operational analytics", "/founder/analytics"],
      ["Review communications", "/founder/comms"],
      ["Review build and runtime proof", "/founder/build-proof"]
    ]
  },
  {
    role: "Partner / organisation",
    purpose: "Prepare the organisation, submit opportunities, and wait for verification before publication.",
    steps: [
      ["Open partner area", "/partner"],
      ["Sign in", "/auth/login"],
      ["Read public marketplace", "/marketplace"]
    ]
  }
];

function hrefFor(path: string): string {
  return path.endsWith("/") ? path : path;
}

export default async function KingsmenWorkspacePage() {
  const healthResult = await getKingsmenApiHealth<HealthPayload>();
  const health = healthResult.data;
  const connected = healthResult.ok && health?.ok === true;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 18px 56px", color: "#f5f5f5" }}>
      <header style={{ borderBottom: "1px solid #353535", paddingBottom: 22, marginBottom: 24 }}>
        <p style={{ color: "#d6b25e", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Kingsmen daily operations</p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.08, margin: "8px 0 12px" }}>One workspace. Every daily journey.</h1>
        <p style={{ maxWidth: 760, color: "#c6c6c6", lineHeight: 1.65 }}>
          Start here each day. Choose your role, follow the steps in order, and return to this workspace when you need another operation.
          Sensitive actions must still pass the relevant identity, permission, evidence, and approval checks.
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
            <p style={{ color: "#c6c6c6", minHeight: 52, lineHeight: 1.5 }}>{journey.purpose}</p>
            <ol style={{ paddingLeft: 22, lineHeight: 1.9 }}>
              {journey.steps.map(([label, path]) => (
                <li key={path}><Link href={hrefFor(path)} style={{ color: "#f0d58a", textUnderlineOffset: 4 }}>{label}</Link></li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section style={{ marginTop: 26, borderRadius: 16, background: "#202020", padding: 18 }}>
        <h2 style={{ marginTop: 0 }}>Daily operating rule</h2>
        <p style={{ color: "#d0d0d0", lineHeight: 1.65, marginBottom: 0 }}>
          A page link is not proof that a workflow is complete. Listings must remain unpublished until the organisation and source are verified;
          application outcomes must come from official evidence; payments become settled only through verified provider callbacks and ledger records;
          and candidate records must be scoped to the signed-in candidate. Do not bypass these controls to make a queue appear complete.
        </p>
      </section>
    </main>
  );
}
