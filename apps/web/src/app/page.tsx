const pathways = [
  { n: "01", title: "Higher education", detail: "Universities, Universities of Technology, CAO programme choices and application preparation.", tags: "UNIVERSITIES · UoTs · CAO" },
  { n: "02", title: "TVET & college routes", detail: "TVET colleges, NC(V), NATED / Report 191 and accredited private-college pathways.", tags: "TVET · NC(V) · NATED" },
  { n: "03", title: "Learnerships & SETAs", detail: "Skills programmes, learnerships and training opportunities with source and deadline checks.", tags: "SETA · QCTO · SKILLS" },
  { n: "04", title: "Internships & apprenticeships", detail: "Work exposure, workplace learning, apprenticeships and WIL opportunities.", tags: "WIL · EXPERIENCE" },
  { n: "05", title: "Employment", detail: "Vacancy discovery and application preparation for entry-level and experienced candidates.", tags: "CAREERS · VACANCIES" },
  { n: "06", title: "Funding & support", detail: "Bursaries, sponsorships, NSFAS guidance and related accommodation or transport needs.", tags: "NSFAS · BURSARIES · SUPPORT" },
];

const steps = [
  ["01", "Build your profile", "Create your candidate profile and identify your goals, qualifications and practical constraints."],
  ["02", "Map your options", "Review relevant pathways and source-backed opportunities. An institution directory alone is not proof that a programme is open."],
  ["03", "Prepare with care", "Organise requirements, documents and deadlines before moving to an application."],
  ["04", "Track the journey", "Keep your submission evidence and status together. Candidate-reported submissions remain distinct from provider-confirmed outcomes."],
];

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080d16", color: "#f4f1e8", fontFamily: "Inter, ui-sans-serif, system-ui, Arial, sans-serif" }}>
      <style>{`
        *{box-sizing:border-box} html{scroll-behavior:smooth} a{color:inherit}
        .km-wrap{width:min(1180px,calc(100% - 40px));margin:auto}
        .km-nav{height:82px;display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid #253043}
        .km-brand{display:flex;align-items:center;gap:12px;text-decoration:none}
        .km-mark{width:42px;height:42px;display:grid;place-items:center;background:linear-gradient(140deg,#f2d48a,#b58a3b);color:#111827;border-radius:12px;font-weight:950;font-size:21px}
        .km-navlinks{display:flex;align-items:center;gap:25px;font-size:13px;color:#c1cada}
        .km-navlinks a{text-decoration:none}.km-navlinks a:hover{color:#f2d48a}
        .km-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:13px 18px;border-radius:9px;text-decoration:none;font-size:13px;font-weight:800;transition:transform .18s ease,border-color .18s ease}
        .km-btn:hover{transform:translateY(-2px)}
        .km-primary{background:linear-gradient(135deg,#f2d48a,#c49a4a);color:#111827;border:1px solid #f2d48a}
        .km-secondary{border:1px solid #536078;color:#f4f1e8;background:#101827}
        .km-eyebrow{font-size:11px;font-weight:800;letter-spacing:2.6px;color:#e3bf70;text-transform:uppercase}
        .km-hero{position:relative;padding:92px 0 78px;overflow:hidden}
        .km-hero:after{content:"";position:absolute;width:500px;height:500px;border-radius:50%;right:-130px;top:-170px;border:1px solid #cba45b24;box-shadow:0 0 0 55px #cba45b08,0 0 0 110px #cba45b05;pointer-events:none}
        .km-hero-grid{display:grid;grid-template-columns:1.12fr .88fr;gap:55px;align-items:center;position:relative;z-index:1}
        .km-hero h1{font-size:clamp(43px,6.2vw,76px);line-height:1.03;letter-spacing:-3.2px;margin:19px 0 22px;max-width:760px}
        .km-gold{color:#e4c171}.km-lead{max-width:650px;color:#b7c1d1;font-size:17px;line-height:1.85}
        .km-cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}
        .km-note{font-size:11px;color:#8996aa;margin-top:18px;line-height:1.7}
        .km-feature{border:1px solid #344158;border-radius:22px;background:linear-gradient(150deg,#151f30,#0c1320);padding:25px;box-shadow:0 25px 90px #0005}
        .km-feature-top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #303b4f;padding-bottom:17px}
        .km-mini-label{font-size:10px;letter-spacing:1.8px;color:#93a2b8;font-weight:800}
        .km-status{font-size:10px;border:1px solid #7e6739;color:#e4c171;padding:7px 9px;border-radius:99px}
        .km-route{display:flex;align-items:flex-start;gap:14px;padding:17px 0;border-bottom:1px solid #263144}
        .km-route:last-child{border:0;padding-bottom:0}.km-route-num{font-size:11px;color:#e4c171;font-weight:900;padding-top:3px}
        .km-route strong{display:block;font-size:14px}.km-route p{margin:6px 0 0;color:#9eacc0;font-size:12px;line-height:1.6}
        .km-section{padding:76px 0;border-top:1px solid #202b3d}
        .km-section-head{display:flex;justify-content:space-between;align-items:end;gap:25px;margin-bottom:28px}
        .km-section h2{font-size:clamp(29px,4vw,43px);letter-spacing:-1.3px;margin:12px 0}
        .km-muted{color:#a6b2c4;line-height:1.75;max-width:640px;font-size:14px}
        .km-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
        .km-card{border:1px solid #2b374b;border-radius:15px;padding:23px;background:linear-gradient(150deg,#111a29,#0c121d);min-height:225px}
        .km-card .km-num{color:#d9b568;font-size:11px;font-weight:900;letter-spacing:1px}
        .km-card h3{font-size:19px;margin:16px 0 10px}.km-card p{font-size:13px;color:#a8b5c7;line-height:1.75;min-height:68px}
        .km-tags{font-size:9px;letter-spacing:1.4px;color:#d9b568;font-weight:800}
        .km-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}
        .km-step{padding:20px 0;border-top:1px solid #8e7547}
        .km-step b{font-size:12px;color:#d9b568}.km-step h3{font-size:17px;margin:15px 0 9px}.km-step p{font-size:12px;line-height:1.8;color:#a8b5c7}
        .km-trust{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
        .km-trust article{border:1px solid #2b374b;background:#0d1522;border-radius:14px;padding:21px}
        .km-trust strong{display:block;font-size:14px;margin-bottom:8px}.km-trust p{font-size:12px;color:#a8b5c7;line-height:1.75;margin:0}
        .km-footer{padding:30px 0 42px;border-top:1px solid #253043;color:#8290a5;font-size:11px;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
        @media(max-width:850px){.km-hero-grid{grid-template-columns:1fr;gap:30px}.km-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.km-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.km-navlinks{gap:12px}.km-hero{padding-top:60px}}
        @media(max-width:560px){.km-wrap{width:min(100% - 28px,1180px)}.km-nav{height:auto;min-height:74px;flex-wrap:wrap;padding:14px 0}.km-navlinks{width:100%;justify-content:space-between;font-size:11px;padding-bottom:4px}.km-navlinks .km-nav-cta{display:none}.km-hero h1{letter-spacing:-1.8px}.km-cards,.km-steps,.km-trust{grid-template-columns:1fr}.km-section{padding:52px 0}.km-section-head{display:block}}
      `}</style>
      <div className="km-wrap">
        <nav className="km-nav" aria-label="Main navigation">
          <a className="km-brand" href="#top"><span className="km-mark">K</span><span><strong style={{display:"block",fontSize:13,letterSpacing:2.5}}>KINGSMEN</strong><small style={{display:"block",color:"#98a5b8",fontSize:10,marginTop:4}}>YOUR OPPORTUNITY, CONNECTED</small></span></a>
          <div className="km-navlinks"><a href="#pathways">Pathways</a><a href="#how-it-works">How it works</a><a href="#principles">Our principles</a><a className="km-nav-cta km-btn km-primary" href="/free-destiny-map/">Start your journey ↗</a></div>
        </nav>
        <section id="top" className="km-hero">
          <div className="km-hero-grid">
            <div><div className="km-eyebrow">South Africa · Education · Skills · Work</div><h1>Your future is bigger than <span className="km-gold">one application.</span></h1><p className="km-lead">One connected starting point for exploring study, skills development, work and funding pathways—with preparation and evidence at the centre of every step.</p><div className="km-cta"><a className="km-btn km-primary" href="/free-destiny-map/">Explore my pathways <span aria-hidden="true">↗</span></a><a className="km-btn km-secondary" href="#pathways">Discover the possibilities</a></div><p className="km-note">Built for the South African journey. Opportunity information must be checked against authoritative sources; no application outcome is promised.</p></div>
            <aside className="km-feature" aria-label="Opportunity pathways overview"><div className="km-feature-top"><div><div className="km-mini-label">THE KINGSMEN ROUTE MAP</div><strong style={{display:"block",fontSize:20,marginTop:8}}>Six pathways. One journey.</strong></div><span className="km-status">CANDIDATE FIRST</span></div>{pathways.map(p=><div className="km-route" key={p.n}><span className="km-route-num">{p.n}</span><div><strong>{p.title}</strong><p>{p.tags}</p></div></div>)}</aside>
          </div>
        </section>
        <section id="pathways" className="km-section"><div className="km-section-head"><div><div className="km-eyebrow">Find your direction</div><h2>More than a list of opportunities.</h2></div><p className="km-muted">Your route can cross education, training, funding and work. Kingsmen is designed to help bring the steps together—not leave you to manage every portal alone.</p></div><div className="km-cards">{pathways.map(p=><article className="km-card" key={p.n}><div className="km-num">{p.n} / PATHWAY</div><h3>{p.title}</h3><p>{p.detail}</p><div className="km-tags">{p.tags}</div></article>)}</div></section>
        <section id="how-it-works" className="km-section"><div className="km-eyebrow">From intention to evidence</div><h2>A clearer journey, step by step.</h2><p className="km-muted" style={{marginBottom:32}}>The goal is not simply to find a link. It is to help you understand what comes next, prepare properly and keep a reliable record of your journey.</p><div className="km-steps">{steps.map(s=><article className="km-step" key={s[0]}><b>{s[0]} — THE JOURNEY</b><h3>{s[1]}</h3><p>{s[2]}</p></article>)}</div><div style={{marginTop:32}}><a className="km-btn km-primary" href="/free-destiny-map/">Start with the Free Destiny Map ↗</a></div></section>
        <section id="principles" className="km-section"><div className="km-eyebrow">Trust is part of the product</div><h2>Clear evidence. Protected information. Honest status.</h2><div className="km-trust" style={{marginTop:25}}><article><strong>Verified sources matter</strong><p>A source directory does not prove that a programme is open, that a deadline is current, or that a candidate is eligible.</p></article><article><strong>Your documents are private</strong><p>Personal information and supporting documents belong behind appropriate access controls—not in public pages or shared links.</p></article><article><strong>Status must mean something</strong><p>A candidate-reported submission is not presented as a provider-confirmed submission or final outcome.</p></article></div></section>
        <section className="km-section" style={{textAlign:"center"}}><div className="km-eyebrow">Take the first step</div><h2>Build a route that fits your future.</h2><p className="km-muted" style={{margin:"0 auto 25px"}}>Start by exploring the pathways available to you. You can plan before committing to an application.</p><a className="km-btn km-primary" href="/free-destiny-map/">Open the Free Destiny Map ↗</a></section>
        <footer className="km-footer"><span>© Kingsmen Portal · South Africa</span><span>Opportunity guidance is not a guarantee of admission, funding, employment or an outcome.</span></footer>
      </div>
    </main>
  );
}
