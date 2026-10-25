import Link from "next/link";

const destinations = [
  { title: "Candidate website", tag: "PUBLIC PORTAL", body: "Explore education, training, funding and employment pathways from one starting point.", href: "/kingsmen", action: "Open public portal" },
  { title: "Founder Control Plane", tag: "OPERATIONS", body: "A dedicated founder workspace for release evidence, incidents, queues and operational decisions.", href: "/control-plane", action: "Open Control Plane" },
  { title: "Jarvis", tag: "COMMAND INTELLIGENCE", body: "Open the Jarvis command interface. Actions remain subject to the system's policy and approval gates.", href: "/jarvis", action: "Open Jarvis" },
];

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#070b14", color: "#f4f7fb", fontFamily: "Arial, Helvetica, sans-serif", padding: "clamp(20px, 5vw, 64px)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderBottom: "1px solid #263144", paddingBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#d7b56d,#8e6c35)", color: "#111827", display: "grid", placeItems: "center", fontWeight: 900, letterSpacing: 1 }}>K</div>
            <div><div style={{ fontSize: 12, letterSpacing: 3, color: "#d7b56d" }}>KINGSMEN</div><div style={{ fontSize: 13, color: "#9aa9bd", marginTop: 4 }}>South African opportunity platform</div></div>
          </div>
          <div style={{ fontSize: 12, border: "1px solid #39465b", borderRadius: 999, padding: "9px 13px", color: "#b9c5d6" }}>PORTAL ENTRY</div>
        </header>
        <section style={{ padding: "clamp(48px, 9vw, 100px) 0 54px", maxWidth: 850 }}>
          <p style={{ color: "#d7b56d", fontSize: 12, letterSpacing: 3, fontWeight: 700 }}>ONE DESTINATION. MORE POSSIBLE PATHS.</p>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 1.03, letterSpacing: -2, margin: "18px 0 22px" }}>Your next chapter<br/><span style={{ color: "#d7b56d" }}>starts here.</span></h1>
          <p style={{ color: "#aebbd0", fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.8, maxWidth: 720 }}>Kingsmen is being built to help candidates navigate higher education, TVET, learnerships, internships, apprenticeships, employment and funding through a more connected journey.</p>
        </section>
        <section aria-label="Kingsmen destinations" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 18 }}>
          {destinations.map((item) => (
            <article key={item.href} style={{ background: "#101827", border: "1px solid #29364a", borderRadius: 20, padding: 26, display: "flex", flexDirection: "column", minHeight: 250 }}>
              <div style={{ color: "#d7b56d", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{item.tag}</div>
              <h2 style={{ fontSize: 25, margin: "18px 0 12px" }}>{item.title}</h2>
              <p style={{ color: "#aebbd0", lineHeight: 1.7, margin: "0 0 24px", flexGrow: 1 }}>{item.body}</p>
              <Link href={item.href} style={{ display: "inline-flex", alignSelf: "flex-start", textDecoration: "none", background: "#d7b56d", color: "#101827", fontWeight: 700, borderRadius: 10, padding: "12px 15px" }}>{item.action} ↗</Link>
            </article>
          ))}
        </section>
        <footer style={{ marginTop: 54, borderTop: "1px solid #263144", paddingTop: 20, color: "#738198", fontSize: 12, lineHeight: 1.7 }}>
          Kingsmen Portal · South Africa<br/>Operational data and candidate outcomes must be verified from authoritative sources; this entry page does not claim that downstream services are live.
        </footer>
      </div>
    </main>
  );
}
