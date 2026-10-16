const gold = "#d8b66a";
const ink = "#080b14";
const card = "rgba(255,255,255,.055)";
const linkStyle = { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "13px 18px", borderRadius: 12, fontWeight: 800, textDecoration: "none" as const };

export default function HomePage() {
  return <main style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 80% 0%, rgba(216,182,106,.16), transparent 38%), ${ink}`, color: "#f7f4ec", fontFamily: "Inter, system-ui, sans-serif" }}>
    <header style={{ maxWidth: 1120, margin: "0 auto", padding: "26px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <a href="/" style={{ color: gold, textDecoration: "none", fontWeight: 950, letterSpacing: ".2em" }}>KINGSMEN</a>
      <nav aria-label="Main navigation" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <a href="/free-destiny-map" style={{ color: "#e8e4d9" }}>Free Destiny Map</a><a href="/auth/login" style={{ color: "#e8e4d9" }}>Sign in</a><a href="/auth/register" style={{ color: "#e8e4d9" }}>Create account</a>
      </nav>
    </header>
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "74px 24px 56px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,390px),1fr))", gap: 42, alignItems: "center" }}>
      <div>
        <p style={{ color: gold, fontWeight: 850, letterSpacing: ".18em", textTransform: "uppercase", fontSize: 12 }}>Your next chapter, with a plan</p>
        <h1 style={{ fontSize: "clamp(42px,7vw,76px)", lineHeight: 1.02, letterSpacing: "-.045em", margin: "18px 0" }}>Turn your next step into a <span style={{ color: gold }}>clear route.</span></h1>
        <p style={{ color: "#c6cbd6", fontSize: 18, lineHeight: 1.75, maxWidth: 620 }}>Explore study, skills, work and funding pathways. Start with a free Destiny Map, understand your next actions, and keep your preparation organised in one place.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
          <a href="/free-destiny-map" style={{ ...linkStyle, background: gold, color: ink }}>Start Free Destiny Map →</a>
          <a href="/auth/register" style={{ ...linkStyle, border: "1px solid #575767", color: "#f7f4ec" }}>Create candidate account</a>
        </div>
        <p style={{ color: "#9299a9", fontSize: 13, marginTop: 16 }}>Free to start · No payment required for the map · You stay in control</p>
      </div>
      <aside style={{ border: "1px solid rgba(216,182,106,.28)", background: card, borderRadius: 24, padding: 26, boxShadow: "0 24px 90px rgba(0,0,0,.25)" }}>
        <p style={{ color: gold, fontWeight: 850, fontSize: 12, letterSpacing: ".15em" }}>YOUR ROUTE STARTS HERE</p>
        <h2 style={{ fontSize: 28, margin: "10px 0 18px" }}>One practical next step at a time.</h2>
        {["Understand your starting point", "Explore suitable route categories", "See what information you may need", "Keep your next actions visible"].map((x,i)=><div key={x} style={{ display: "flex", gap: 13, alignItems: "center", padding: "13px 0", borderTop: "1px solid rgba(255,255,255,.09)" }}><span style={{ color: gold, fontWeight: 900 }}>0{i+1}</span><span style={{ color: "#d9dce4" }}>{x}</span></div>)}
        <p style={{ fontSize: 12, lineHeight: 1.6, color: "#969eae", marginBottom: 0 }}>Route suggestions are guidance, not admission, funding, employment or placement guarantees.</p>
      </aside>
    </section>
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 24px 70px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
      {[["Study & training","Explore education and skills pathways."],["Work & opportunities","Organise your search and preparation."],["Funding readiness","Understand common preparation steps."],["Documents & next actions","Build a clear checklist before applying."]].map(([title,desc])=><article key={title} style={{ padding: 20, borderRadius: 18, background: card, border: "1px solid rgba(255,255,255,.08)" }}><h3 style={{ color: gold, marginTop: 0 }}>{title}</h3><p style={{ color: "#c2c7d2", lineHeight: 1.6, marginBottom: 0 }}>{desc}</p></article>)}
    </section>
    <footer style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "22px 24px", textAlign: "center", color: "#8e95a4", fontSize: 12 }}>Kingsmen Portal · Built for clear, informed next steps.</footer>
  </main>;
}
