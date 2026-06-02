import { PublicRouteCard } from "./PublicRouteCard";
import { FreeDestinyMapFormShell } from "./FreeDestinyMapFormShell";

const routeCards = [
  {
    title: "University routes",
    shortFact: "A study route includes documents, funding, accommodation, proof and backup options.",
    userNeed: "For users applying or exploring higher education.",
    kingsmenHelp: "Kingsmen maps route readiness, documents, source confidence and next actions."
  },
  {
    title: "TVET routes",
    shortFact: "TVET can be a practical post-school route, not an insult or last resort.",
    userNeed: "For users looking at colleges, campuses and work-facing study routes.",
    kingsmenHelp: "Kingsmen maps TVET, funding, accommodation, documents and fallback routes."
  },
  {
    title: "SETA / learnership routes",
    shortFact: "Learnership routes often depend on CV, documents, source confidence, location and attendance.",
    userNeed: "For users searching for learnerships, skills programmes and training routes.",
    kingsmenHelp: "Kingsmen checks the route and prepares the user before they move blindly."
  },
  {
    title: "Work / internship / apprenticeship",
    shortFact: "A job route is stronger when the CV, documents, location and opportunity source are ready.",
    userNeed: "For users who want employment, internships or apprenticeships.",
    kingsmenHelp: "Kingsmen links CV readiness to real movement planning."
  },
  {
    title: "NSFAS / bursary readiness",
    shortFact: "Funding and admission are separate problems. Both need documents and proof.",
    userNeed: "For users needing funding direction or bursary source checks.",
    kingsmenHelp: "Kingsmen maps documents, source confidence and backup funding routes."
  },
  {
    title: "Accommodation",
    shortFact: "A room only helps when it matches campus, workplace, training site, budget and source safety.",
    userNeed: "For users who may need a credible place near study, work, learnership, internship, apprenticeship or training.",
    kingsmenHelp: "Kingsmen captures accommodation need as part of the full route."
  }
];

export function PublicWebsiteShell() {
  return (
    <main style={{ minHeight: "100vh", background: "#050816", color: "#f8fafc" }}>
      <section style={{ padding: "44px 24px", maxWidth: 1180, margin: "0 auto" }}>
        <p style={{ color: "#d4af37", letterSpacing: "0.16em", textTransform: "uppercase" }}>Kingsmen Portal</p>
        <h1 style={{ fontSize: 44, lineHeight: 1.08, margin: "10px 0" }}>Map your study, work, funding, accommodation and fallback route.</h1>
        <p style={{ maxWidth: 820, color: "#cbd5e1", lineHeight: 1.8 }}>
          Kingsmen helps South African users move with a map, not panic. Start with a Free Destiny Map across university, TVET,
          SETA, learnerships, internships, apprenticeships, employment, NSFAS, bursaries, accommodation, CV and documents.
        </p>
        <p style={{ maxWidth: 820, color: "#fde68a", lineHeight: 1.7 }}>
          Kingsmen does not guarantee acceptance, funding, jobs, accommodation or official outcomes. It helps you check readiness,
          source confidence, documents, proof and next actions.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 28 }}>
          {routeCards.map((card) => (
            <PublicRouteCard key={card.title} {...card} />
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <FreeDestinyMapFormShell />
        </div>
      </section>
    </main>
  );
}
