import Link from "next/link";

const pathways = [
  { n: "01", title: "Higher Education", detail: "Universities, universities of technology, programme choices and admission routes.", tag: "UNIVERSITIES · UoTs · CAO" },
  { n: "02", title: "TVET", detail: "TVET Colleges and accredited vocational or occupational learning routes for practical skills.", tag: "TVET · NC(V) · NATED" },
  { n: "03", title: "SETA programmes & learnerships", detail: "SETA programmes, SETAs & Learnerships, skills programmes and workplace-linked training opportunities.", tag: "SETA · QCTO · SKILLS" },
  { n: "04", title: "Internships", detail: "Build workplace experience and strengthen your next career step.", tag: "EXPERIENCE · WIL" },
  { n: "05", title: "Apprenticeships", detail: "Explore trade training and practical pathways towards artisan careers.", tag: "TRADES · ARTISAN" },
  { n: "06", title: "Employment", detail: "Organise job discovery, application preparation and career readiness.", tag: "JOBS · CAREERS" },
] as const;

const steps = [
  { n: "01", title: "Map your direction", detail: "Describe your goals, qualifications and practical constraints to find a sensible starting point." },
  { n: "02", title: "Check the opportunity", detail: "A directory listing is not proof that a programme is open. Current source, deadline and eligibility evidence matter." },
  { n: "03", title: "Prepare the application", detail: "Bring requirements and documents together before moving to the provider’s application route." },
  { n: "04", title: "Track each step", detail: "Keep candidate-reported progress distinct from provider-confirmed receipt and final decisions." },
] as const;

export default function HomePage() {
  return (
    <main className="public-site">
      <div className="public-notice"><span aria-hidden="true" /> PREVIEW BUILD · Candidate account creation, real uploads, provider submissions and checkout are not enabled end-to-end; sign-in UI exists, but profile linkage remains unverified</div>
      <header className="public-header">
        <div className="public-container public-header-inner">
          <Link className="public-brand" href="/" aria-label="Kingsmen Portal home">
            <span className="public-crest" aria-hidden="true"><svg viewBox="0 0 40 44"><path d="M20 2 36 8v13c0 10-7 17-16 21C11 38 4 31 4 21V8z" fill="none" stroke="currentColor" strokeWidth="2.4"/><path d="M12 14v16m0-8 12-8m-7 13 9 3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></span>
            <span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span>
          </Link>
          <nav className="public-nav" aria-label="Main navigation">
            <Link href="#pathways">Pathways</Link>
            <Link href="/packages/">Packages</Link>
            <Link href="#how-it-works">How it works</Link>
            <Link href="/candidate/login/">Sign in</Link>
            <Link className="public-nav-portal" href="/candidate/dashboard/">Candidate portal ↗</Link>
          </nav>
        </div>
      </header>
      <div className="public-container">
        <section className="public-hero" aria-labelledby="hero-title">
          <div className="public-hero-copy">
            <div className="public-eyebrow"><span /> A clearer route forward</div>
            <h1 id="hero-title">Your next move.<br /><em>Made clearer.</em></h1>
            <p className="public-lead">One place to explore South African education, skills development and work pathways — with a more organised way to understand requirements and prepare your next step.</p>
            <div className="public-actions">
              <Link className="public-button public-button-gold" href="/free-destiny-map/">Build my Destiny Map <span aria-hidden="true">→</span></Link>
              <Link className="public-button public-button-outline" href="#pathways">Explore pathways</Link>
            </div>
            <p className="public-note">Opportunity status depends on evidence from an authoritative source. Admission, funding, employment and provider outcomes are never guaranteed.</p>
            <div className="public-proof-row"><span>✓ South African context</span><span>✓ Human-reviewed support</span><span>✓ Clear status language</span></div>
          </div>
          <aside className="public-route-visual" aria-label="Kingsmen pathway overview">
            <div className="route-visual-top"><span>YOUR ROUTE, IN FOCUS</span><span className="public-preview-pill">GUIDED START</span></div>
            <div className="route-orbit route-orbit-outer" /><div className="route-orbit route-orbit-inner" />
            <div className="route-center"><span className="route-center-mark">K</span><strong>YOUR POTENTIAL</strong><small>Start with your goals</small></div>
            <div className="route-node route-node-a"><span>01</span><b>Learn</b><small>Study & skills</small></div>
            <div className="route-node route-node-b"><span>02</span><b>Build</b><small>Experience</small></div>
            <div className="route-node route-node-c"><span>03</span><b>Work</b><small>Career options</small></div>
            <div className="route-visual-bottom"><span /> Six pathways. One starting point.</div>
          </aside>
          <div className="public-stat-row"><div><strong>06</strong><span>Core pathways</span></div><div><strong>01</strong><span>Reusable starting profile goal</span></div><div><strong>SA</strong><span>Designed for South Africa</span></div></div>
        </section>

        <section id="pathways" className="public-section">
          <div className="public-section-heading"><div><div className="public-eyebrow"><span /> Find your direction</div><h2>Six pathways.<br /><em>One place to start.</em></h2></div><p>Explore the route that best fits your goals. Funding, accommodation and support needs can cut across more than one pathway.</p></div>
          <div className="public-pathway-grid">
            {pathways.map((pathway) => <article className="public-pathway-card" key={pathway.n}>
              <span className="public-path-icon" aria-hidden="true">{pathway.n === "01" ? "↗" : pathway.n === "02" ? "⌂" : pathway.n === "03" ? "✳" : pathway.n === "04" ? "◎" : pathway.n === "05" ? "⚒" : "↗"}</span>
              <span className="public-path-number">{pathway.n} / PATHWAY</span>
              <h3>{pathway.title}</h3><p>{pathway.detail}</p><span className="public-path-tag">{pathway.tag}</span>
            </article>)}
          </div>
        </section>

        <section id="how-it-works" className="public-process-section">
          <div className="public-container-inner">
            <div className="public-section-heading public-heading-dark"><div><div className="public-eyebrow"><span /> From intention to evidence</div><h2>Clarity at every<br /><em>step of the journey.</em></h2></div><p>Finding a link is only the beginning. The aim is to understand what comes next and prepare with accurate information.</p></div>
            <div className="public-steps-grid">{steps.map((step) => <article className="public-step-card" key={step.n}><strong>{step.n}</strong><div className="public-step-rule" /><h3>{step.title}</h3><p>{step.detail}</p></article>)}</div>
            <div className="public-human-note"><span aria-hidden="true">✦</span><p><strong>Human oversight stays in control.</strong> Jarvis may assist with organisation and evidence review, but it does not auto-approve documents or make provider decisions.</p></div>
          </div>
        </section>

        <section className="public-section public-trust-section">
          <div className="public-section-heading"><div><div className="public-eyebrow"><span /> Trust is part of the product</div><h2>Clear evidence.<br /><em>Honest status.</em></h2></div><p>Important milestones should mean what they say — for candidates, reviewers and provider routes.</p></div>
          <div className="public-trust-grid"><article><strong>Verified sources matter</strong><p>A directory or institution record does not itself prove a programme is currently open or that someone is eligible.</p></article><article><strong>Your documents are private</strong><p>Identity documents and supporting files require authenticated access and private storage, not public links.</p></article><article><strong>Receipt is not outcome</strong><p>A candidate-reported submission, provider-confirmed receipt and final decision are different states.</p></article></div>
          <div className="public-destiny-banner"><div><div className="public-eyebrow"><span /> Take the first step</div><h2>Build a route that fits your future.</h2><p>Start with your goals and explore the options before committing to a provider application.</p></div><Link className="public-button public-button-gold" href="/free-destiny-map/">Start your Destiny Map ↗</Link></div>
        </section>
        <footer className="public-footer"><Link className="public-brand public-brand-footer" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link><span>© {new Date().getFullYear()} Kingsmen Portal · South Africa</span><span>Opportunity guidance is not an outcome guarantee.</span></footer>
      </div>
    </main>
  );
}
