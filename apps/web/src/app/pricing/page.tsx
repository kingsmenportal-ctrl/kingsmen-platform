const gold = "#d8b66a";
const ink = "#080b14";
const muted = "#c2c7d2";
const card = { border: "1px solid rgba(216,182,106,.25)", borderRadius: 20, padding: 24, background: "rgba(255,255,255,.045)" } as const;

const offerings = [
  { name: "Free Destiny Map", price: "Free", summary: "A private, browser-based starting point for exploring possible study, training, work and funding-readiness routes.", features: ["No account required", "Practical next-step checklist", "No personal details sent from the map"], href: "/free-destiny-map", cta: "Start free map", featured: true },
  { name: "Candidate Portal", price: "Account access", summary: "A workspace for managing your profile, onboarding, document readiness and application status where those services are available.", features: ["Candidate dashboard", "Profile and document areas", "Application tracking where connected"], href: "/auth/register", cta: "Create an account", featured: false },
  { name: "Managed support", price: "Scope to be confirmed", summary: "Additional support may be offered for planning or application preparation. Availability and deliverables must be agreed before purchase.", features: ["Written scope before payment", "Clear deliverables and exclusions", "No guaranteed admission, funding or employment"], href: "/auth/register", cta: "Create an account", featured: false }
];

export default function PricingPage() {
  return <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 82% 0%, rgba(216,182,106,.15), transparent 38%), ${ink}`, color: "#f7f4ec", fontFamily: "Inter,system-ui,sans-serif" }}>
    <header style={{ maxWidth: 1120, margin: "0 auto", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <a href="/" style={{ color: gold, textDecoration: "none", fontWeight: 950, letterSpacing: ".2em" }}>KINGSMEN</a>
      <nav aria-label="Packages navigation" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <a href="/free-destiny-map" style={{ color: "#e8e4d9" }}>Free Destiny Map</a>
        <a href="/auth/login" style={{ color: "#e8e4d9" }}>Sign in</a>
      </nav>
    </header>
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 72px" }}>
      <p style={{ color: gold, fontSize: 12, fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase" }}>Packages & support</p>
      <h1 style={{ maxWidth: 760, fontSize: "clamp(38px,6vw,64px)", lineHeight: 1.03, letterSpacing: "-.04em", margin: "14px 0" }}>Start free. Choose support only when the scope is clear.</h1>
      <p style={{ maxWidth: 760, color: muted, fontSize: 17, lineHeight: 1.75 }}>Compare the available starting points. We do not publish invented prices or accept payment from this page. Any paid service must have confirmed availability, written scope, total price and terms before you commit.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 16, marginTop: 30 }}>
        {offerings.map(item => <article key={item.name} style={{ ...card, display: "flex", flexDirection: "column", borderColor: item.featured ? "rgba(216,182,106,.65)" : card.border }}>
          {item.featured && <p style={{ color: gold, fontSize: 11, letterSpacing: ".12em", fontWeight: 900, margin: "0 0 10px" }}>RECOMMENDED START</p>}
          <h2 style={{ margin: "4px 0 8px", fontSize: 24 }}>{item.name}</h2>
          <p style={{ color: gold, fontWeight: 900, fontSize: 20, margin: "4px 0 12px" }}>{item.price}</p>
          <p style={{ color: muted, lineHeight: 1.7, flex: 1 }}>{item.summary}</p>
          <ul style={{ paddingLeft: 20, color: "#e0e2e8", lineHeight: 1.9 }}>{item.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
          <a href={item.href} style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 46, marginTop: 10, padding: "10px 16px", borderRadius: 12, background: item.featured ? gold : "transparent", border: "1px solid rgba(216,182,106,.5)", color: item.featured ? ink : "#f1d99a", textDecoration: "none", fontWeight: 900 }}>{item.cta} →</a>
        </article>)}
      </div>
      <section style={{ ...card, marginTop: 22 }}>
        <h2 style={{ marginTop: 0 }}>Important before you pay</h2>
        <p style={{ color: muted, lineHeight: 1.8, marginBottom: 0 }}>No service can guarantee admission, funding, a job, a placement or an official decision. Always verify deadlines and requirements with the institution, employer or funder. This page is informational: it does not create a contract, reserve a service, or process a payment.</p>
      </section>
      <footer style={{ marginTop: 28, color: "#9da4b2", fontSize: 13, display: "flex", gap: 18, flexWrap: "wrap" }}><a href="/" style={{ color: "#f1d99a" }}>Home</a><a href="/privacy" style={{ color: "#f1d99a" }}>Privacy notice</a><a href="/auth/register" style={{ color: "#f1d99a" }}>Create account</a></footer>
    </section>
  </main>;
}
