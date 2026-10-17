import Link from "next/link";

const gates = [
  ["higher_education", "Higher Education", "Find and compare university routes."],
  ["tvet", "TVET", "Review technical and vocational training routes."],
  ["seta_learnership", "SETA / Learnership", "Review learnership and skills pathways."],
  ["internship", "Internship", "Find structured work-experience opportunities."],
  ["apprenticeship", "Apprenticeship", "Review practical trade-training routes."],
  ["employment", "Employment", "Explore employment opportunities."]
] as const;

const dailyActions = [
  ["My profile", "/candidate/profile", "Keep your personal and education details current."],
  ["Explore routes", "/candidate/routes", "Compare possible next steps across the six gates."],
  ["Saved opportunities", "/candidate/saved-opportunities", "Return to opportunities you saved."],
  ["Applications and outcomes", "/candidate/outcomes", "Track application progress and record verified outcomes."],
  ["Documents", "/candidate/documents", "Review required documents and their review status."],
  ["Finance", "/candidate/finance", "Review invoices and payment information."],
  ["Messages", "/candidate/messages", "Check portal communications."],
  ["Support", "/candidate/support", "Ask for help when a route is blocked."]
] as const;

export default function CandidateDashboardPage() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 18px 48px" }}>
      <p><Link href="/workspace">← Daily operations workspace</Link></p>
      <h1>Kingsmen Candidate Dashboard</h1>
      <p>Start with your profile, compare routes, save suitable opportunities, track applications, and keep documents and payments in order. Your package changes service intensity, not access to the six gates.</p>

      <section aria-label="Six Gate View" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {gates.map(([code, label, description]) => (
          <article key={code} data-gate={code} style={{ border: "1px solid #454545", borderRadius: 12, padding: 16 }}>
            <h2>{label}</h2>
            <p>{description}</p>
            <Link href="/candidate/routes">Explore this gate →</Link>
          </article>
        ))}
      </section>

      <section aria-label="Daily Candidate Actions" style={{ marginTop: 28 }}>
        <h2>Your daily actions — follow in order</h2>
        <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, paddingLeft: 24 }}>
          {dailyActions.map(([label, href, description]) => (
            <li key={href} style={{ padding: 8 }}>
              <h3 style={{ marginBottom: 6 }}><Link href={href}>{label}</Link></h3>
              <p style={{ marginTop: 0 }}>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <p data-boundary="browser-safe">
        Candidate views must use the authenticated candidate's own records. The browser cannot grant itself verification, alter official outcomes, publish partner listings, or mark a payment settled.
      </p>
    </main>
  );
}
