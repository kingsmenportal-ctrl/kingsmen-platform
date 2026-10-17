import Link from "next/link";

const gates = [
  ["higher_education", "Higher Education", "University and higher-education pathways."],
  ["tvet", "TVET", "Technical and vocational training pathways."],
  ["seta_learnership", "SETA / Learnership", "Skills and learnership pathways."],
  ["internship", "Internship", "Structured work-experience pathways."],
  ["apprenticeship", "Apprenticeship", "Practical trade-training pathways."],
  ["employment", "Employment", "Employment pathways."]
] as const;

const dailyActions = [
  ["Saved opportunities", "/candidate/saved-opportunities", "Return to opportunities saved to your account."],
  ["Applications and outcomes", "/candidate/outcomes", "Review application tracking and recorded outcomes."],
  ["Documents", "/candidate/documents", "Review your document checklist and status."],
  ["Finance", "/candidate/finance", "Review invoices and payment information."],
  ["Messages", "/candidate/messages", "Check portal communications."]
] as const;

export default function CandidateDashboardPage() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 18px 48px" }}>
      <p><Link href="/workspace">← Daily operations workspace</Link></p>
      <h1>Kingsmen Candidate Dashboard</h1>
      <p>Use the current candidate surfaces below to continue your journey. All six opportunity gates are part of the Kingsmen model; the route-discovery and profile-editing screens still need their connected implementation.</p>

      <section aria-label="Six Gate View" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {gates.map(([code, label, description]) => (
          <article key={code} data-gate={code} style={{ border: "1px solid #454545", borderRadius: 12, padding: 16 }}>
            <h2>{label}</h2>
            <p>{description}</p>
            <p style={{ fontSize: 13, color: "#a8a8a8" }}>Route discovery: implementation required</p>
          </article>
        ))}
      </section>

      <section aria-label="Daily Candidate Actions" style={{ marginTop: 28 }}>
        <h2>Available candidate actions</h2>
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
