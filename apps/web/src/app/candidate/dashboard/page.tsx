import { CandidateSessionControl } from "@/components/candidate/CandidateSessionControl";
import Link from "next/link";

const pathways = [
  { code: "higher_education", label: "Higher Education", detail: "Universities, universities of technology and degree programmes." },
  { code: "tvet", label: "TVET", detail: "Technical and vocational college routes." },
  { code: "seta_learnership", label: "SETA programmes & learnerships", detail: "Skills programmes and structured workplace learning." },
  { code: "internship", label: "Internships", detail: "Workplace exposure and early career experience." },
  { code: "apprenticeship", label: "Apprenticeships", detail: "Trade training and artisan pathways." },
  { code: "employment", label: "Employment", detail: "Job discovery and employer application preparation." },
] as const;

const workspaceLinks = [
  { href: "/candidate/profile/", title: "Candidate profile", description: "Save one reusable profile and six-pathway preferences. Identity linkage may require authorised review.", action: "Edit profile" },
  { href: "/candidate/workbench", title: "Application workbench", description: "Review pathway readiness and prepare your application journey.", action: "Open workbench" },
  { href: "/candidate/opportunity-matches", title: "Opportunity matches", description: "Explore matching routes. An item is not open until source, deadline and eligibility evidence are current.", action: "View matches" },
  { href: "/candidate/saved-opportunities", title: "Saved opportunities", description: "Review backend-saved opportunities after your candidate identity has been verified.", action: "View saved" },
  { href: "/candidate/documents", title: "Document vault", description: "Review requirements and the private-document handling boundary.", action: "Open documents" },
  { href: "/personal-job-desk/application-tracker", title: "Application tracker", description: "Review candidate-reported progress and any available receipt evidence.", action: "Track applications" },
  { href: "/candidate/finance/", title: "Plans & finance", description: "Compare canonical products, allowances and payment-evidence rules.", action: "View plans" },
] as const;

export default function CandidateDashboardPage() {
  return (
    <main className="public-site candidate-page">
      <div className="public-notice"><span aria-hidden="true" /> CANDIDATE SPACE · Guidance and navigation</div>
      <header className="public-header"><div className="public-container public-header-inner">
        <Link className="public-brand" href="/" aria-label="Kingsmen Portal home"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link>
        <nav className="public-nav" aria-label="Candidate navigation"><Link href="/">Home</Link><Link href="/packages/">Packages</Link><Link href="/candidate/profile/">Profile</Link><Link href="/candidate/documents/">Documents</Link><Link className="public-nav-portal" href="/free-destiny-map/">Destiny Map ↗</Link><CandidateSessionControl /></nav>
      </div></header>
      <div className="public-container candidate-page-body">
        <header className="candidate-page-heading"><div><div className="public-eyebrow"><span /> CANDIDATE OVERVIEW</div><h1>Your opportunity <em>command centre.</em></h1><p>One place to explore the six pathways, prepare requirements and navigate the next step.</p></div><span className="candidate-preview-chip">READINESS VIEW</span></header>
        <section className="candidate-hero-panel"><div><span className="candidate-panel-kicker">YOUR NEXT MOVE</span><h2>Keep your progress organised.</h2><p>This view provides navigation and guidance. It does not claim that a profile has been saved or an application has been submitted.</p></div><Link className="public-button public-button-gold" href="/candidate/workbench/">Open application workbench →</Link></section>
        <section className="candidate-pathways-section" aria-labelledby="candidate-pathways-title"><div className="candidate-subheading"><h2 id="candidate-pathways-title">All six pathways</h2><p>Pathway discovery is universal. Current openings and eligibility still require evidence-based verification.</p></div>
          <div className="candidate-pathway-grid">{pathways.map((pathway) => <article key={pathway.code} data-gate={pathway.code} className="candidate-pathway-card"><span className="candidate-pathway-mark" aria-hidden="true" /><h3>{pathway.label}</h3><p>{pathway.detail}</p><Link href="/candidate/opportunity-matches/">Explore matches <span aria-hidden="true">→</span></Link></article>)}</div>
        </section>
        <section className="candidate-workspace-section" aria-labelledby="workspace-heading"><div className="candidate-subheading"><h2 id="workspace-heading">Your workspace</h2><p>Choose the task you need to work on next.</p></div>
          <div className="candidate-workspace-grid">{workspaceLinks.map((item) => <article key={item.href} className="candidate-workspace-card"><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href}>{item.action} <span aria-hidden="true">→</span></Link></article>)}</div>
        </section>
        <aside className="candidate-status-boundary" aria-labelledby="status-boundary-heading"><span aria-hidden="true">!</span><div><h2 id="status-boundary-heading">Application status and safety</h2><p>This dashboard does not claim an opportunity is open, a provider has received an application, or a payment has settled. Provider receipt and outcomes require provider-origin evidence. No admission, funding, placement, employment, or success is guaranteed.</p></div></aside>
      </div>
      <footer className="public-footer public-container"><Link className="public-brand public-brand-footer" href="/"><span className="public-crest" aria-hidden="true">K</span><span className="public-wordmark"><strong>KINGSMEN</strong><small>PORTAL</small></span></Link><span>Candidate dashboard guidance · No guaranteed outcomes</span></footer>
    </main>
  );
}
