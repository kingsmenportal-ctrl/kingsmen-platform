import Link from "next/link";

const packages = [
  { slug: "foundational-accord", planCode: "foundational_accord", name: "Foundational Accord", tier: "All six pathways", priceCents: 16999, applications: 5, capacity: 4, accommodation: "8 accommodation routes included", description: "A practical starting point for managed application support.", featured: false },
  { slug: "collegiate-ordinance", planCode: "collegiate_ordinance", name: "Collegiate Ordinance", tier: "Education support", priceCents: 29999, applications: 10, capacity: 8, accommodation: "Accommodation support included", description: "More priority applications and managed-route capacity.", featured: false },
  { slug: "chancellors-writ", planCode: "chancellors_writ", name: "Chancellor’s Writ", tier: "Education support", priceCents: 39999, applications: 15, capacity: 10, accommodation: "Accommodation support included", description: "Expanded support capacity for an ambitious application plan.", featured: true },
  { slug: "regency-mandate", planCode: "regency_mandate", name: "Regency Mandate", tier: "Premium support", priceCents: 46999, applications: 15, capacity: 12, accommodation: "Accommodation support included", description: "High managed-route capacity for a broad application plan.", featured: false },
  { slug: "artisan-charter", planCode: "artisan_charter", name: "Artisan Charter", tier: "Skills & trades", priceCents: 14999, applications: 5, capacity: 3, accommodation: "Accommodation support included", description: "Focused support for technical, vocational and trade routes.", featured: false },
  { slug: "guildmasters-charter", planCode: "guildmasters_charter", name: "Guildmasters Charter", tier: "Skills & career", priceCents: 19999, applications: 8, capacity: 5, accommodation: "Accommodation support included", description: "Additional priority volume for skills and career routes.", featured: false },
  { slug: "cv-revamp", planCode: "cv_revamp", name: "CV Revamp", tier: "Standalone service", priceCents: 4999, applications: 0, capacity: 0, accommodation: "Accommodation support available; routes verified separately", description: "A CV and motivation-letter preparation service.", featured: false, cv: true },
  { slug: "free-destiny-map", name: "Free Destiny Map", tier: "Free starting point", priceCents: 0, applications: 0, capacity: 0, accommodation: "Explore a route before buying support", description: "Describe your goals and start planning your next move.", featured: false, free: true },
] as const;

function money(priceCents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(priceCents / 100);
}

export default function PackagesPage() {
  return (
    <main className="public-site">
      <div className="public-notice"><span aria-hidden="true" /> Kingsmen Portal · Package reference</div>
      <header className="public-header"><div className="public-container public-header-inner">
        <Link className="public-brand" href="/" aria-label="Kingsmen Portal home"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link>
        <nav className="public-nav" aria-label="Main navigation"><Link href="/">Home</Link><Link href="/#pathways">Pathways</Link><Link href="/candidate/dashboard/">Candidate portal</Link><Link href="/candidate/login/">Sign in</Link><Link className="public-nav-portal" href="/free-destiny-map/">Destiny Map ↗</Link></nav>
      </div></header>
      <div className="public-container">
        <section className="packages-hero"><div className="public-eyebrow"><span /> Transparent support options</div><h1>Choose your level<br /><em>of support.</em></h1><p>Every pathway remains discoverable. These packages define priority application volume and managed-route capacity, not access to the opportunity catalogue. Review the terms before selecting a service.</p></section>
        <section className="public-package-grid" aria-label="Kingsmen packages">
          {packages.map((item) => {
            const features = "cv" in item && item.cv
              ? ["15 CV versions + 15 motivation letters", "Target turnaround: 3 business days", "Standalone capacity: 0 managed routes", "Accommodation support available; routes verified separately", "+2 route bonus only after verified ownership and eligible upgrade"]
              : "free" in item && item.free
                ? ["Explore all six pathways", "No paid plan required to start planning", "No live application or payment implied"]
                : [item.applications + " priority applications", item.capacity + " concurrent managed routes / 30-day capacity", item.accommodation];
            return <article className={"public-package-card" + (item.featured ? " featured" : "")} data-price-cents={item.priceCents} key={item.slug}>
              {item.featured && <span className="public-package-badge">FEATURED PACKAGE</span>}
              <span className="public-package-tier">{item.tier}</span><h2>{item.name}</h2>
              <div className="public-package-price">{money(item.priceCents)}{item.priceCents > 0 && !("cv" in item && item.cv) && <small> / package</small>}</div>
              <p className="public-package-description">{item.description}</p>
              <ul className="public-package-features">{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <Link className={"public-button " + (item.featured ? "public-button-gold" : "public-button-outline")} href={"free" in item && item.free ? "/free-destiny-map/" : "/candidate/workbench/?plan=" + item.planCode}>{ "free" in item && item.free ? "Start free route map" : "Review plan in workbench" } <span aria-hidden="true">→</span></Link>
            </article>;
          })}
        </section>
        <p className="public-packages-disclaimer">Reference information only. Checkout and PayFast settlement are not connected to this page. Package entitlement must never be granted until payment and order records are verified. Prices are shown in South African rand; confirm the current terms at the live checkout before paying.</p>
      </div>
      <footer className="public-footer public-container"><Link className="public-brand public-brand-footer" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link><span>© {new Date().getFullYear()} Kingsmen Portal</span><span>Support is not a guarantee of provider outcomes.</span></footer>
    </main>
  );
}
