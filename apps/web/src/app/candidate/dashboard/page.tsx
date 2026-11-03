import type { Metadata } from "next";
import styles from "./candidate-dashboard.module.css";

export const metadata: Metadata = {
  title: "Candidate dashboard | Kingsmen Portal",
  description: "Your Kingsmen workspace across six South African education, skills and employment pathways."
};

const pathways = [
  ["higher_education", "Higher Education", "Universities, universities of technology, CAO programme choices and application preparation."],
  ["tvet", "TVET", "Technical and vocational college routes, including NC(V) and NATED programmes."],
  ["seta_learnership", "SETA programmes & learnerships", "Skills programmes and learnerships checked against official source, eligibility and deadline evidence."],
  ["internship", "Internships", "Work-integrated learning and workplace experience opportunities."],
  ["apprenticeship", "Apprenticeships", "Trade training and artisan pathways with provider-specific requirements."],
  ["employment", "Employment", "Vacancy discovery and preparation for employer application routes."]
] as const;

const workspaceLinks = [
  {
    href: "/candidate/workbench",
    title: "Application workbench",
    description: "Review readiness and organise your application journey across all six pathways.",
    action: "Open workbench"
  },
  {
    href: "/candidate/opportunity-matches",
    title: "Verified opportunity matches",
    description: "Load matches that pass current source and publication gates. Unverified or stale listings are withheld.",
    action: "Explore matches"
  },
  {
    href: "/candidate/saved-opportunities",
    title: "Saved opportunities",
    description: "Return to opportunities you have saved in the candidate workspace.",
    action: "View saved"
  },
  {
    href: "/candidate/documents",
    title: "Document vault",
    description: "Open the document area. Review status and document verification remain controlled by evidence and review rules.",
    action: "Open documents"
  },
  {
    href: "/personal-job-desk/application-tracker",
    title: "Application tracker",
    description: "Review reported application progress. Provider-confirmed receipt and outcomes require provider-origin evidence.",
    action: "Track applications"
  },
  {
    href: "/packages/",
    title: "Packages and service capacity",
    description: "Compare service packages. Package selection does not expand pathway access or itself prove that payment has settled.",
    action: "View packages"
  }
] as const;

export default function CandidateDashboardPage() {
  return (
    <main className={styles.page} id="candidate-main">
      <a className={styles.skipLink} href="#dashboard-content">Skip to candidate dashboard content</a>
      <div className={styles.shell}>
        <nav className={styles.topNav} aria-label="Candidate portal navigation">
          <a className={styles.brand} href="/" aria-label="Kingsmen Portal home">
            <span className={styles.brandMark} aria-hidden="true">K</span>
            <span>
              <strong className={styles.brandTitle}>KINGSMEN</strong>
              <small className={styles.brandSub}>YOUR OPPORTUNITY, CONNECTED</small>
            </span>
          </a>
          <div className={styles.navLinks}>
            <a href="/">Home</a>
            <a href="/packages/">Packages</a>
            <a href="/free-destiny-map/">Free Destiny Map</a>
          </div>
        </nav>

        <section className={styles.hero} id="dashboard-content" aria-labelledby="dashboard-heading">
          <p className={styles.eyebrow}>Candidate workspace · South Africa</p>
          <h1 id="dashboard-heading">Your opportunity <span className={styles.gold}>command centre.</span></h1>
          <p className={styles.lead}>
            One candidate journey across education, skills development, internships, apprenticeships and employment.
            Your package affects priority application volume and managed-route service capacity—not which pathways you can explore.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryButton} href="/candidate/workbench">Open application workbench <span aria-hidden="true">↗</span></a>
            <a className={styles.secondaryButton} href="/candidate/opportunity-matches">Explore opportunity matches <span aria-hidden="true">↗</span></a>
          </div>
          <p className={styles.disclosure}>
            This is the candidate navigation and guidance surface. A page visit does not create a profile, save changes,
            submit an application or activate a paid package.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="pathways-heading">
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>One profile · Six pathways</p>
            <h2 id="pathways-heading">Explore every route.</h2>
            <p className={styles.sectionIntro}>
              Pathway access is universal. Individual opportunities still require current source, deadline, eligibility
              and provider-route checks before Kingsmen presents them as open.
            </p>
          </div>
          <div className={styles.pathwayGrid}>
            {pathways.map(([code, label, description], index) => (
              <article className={styles.pathwayCard} key={code} data-gate={code}>
                <div className={styles.cardTop}>
                  <span className={styles.pathwayNumber}>{String(index + 1).padStart(2, "0")} / PATHWAY</span>
                  <span className={styles.available}>Discovery</span>
                </div>
                <h3>{label}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="workspace-heading">
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Your workspace</p>
            <h2 id="workspace-heading">Pick up where you need to.</h2>
          </div>
          <div className={styles.workspaceGrid}>
            {workspaceLinks.map((item) => (
              <article className={styles.workspaceCard} key={item.href}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <a className={styles.workspaceAction} href={item.href}>
                  {item.action} <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <aside className={styles.notice} aria-labelledby="status-boundary-heading">
          <h2 id="status-boundary-heading">Application status and safety</h2>
          <p>
            This dashboard is navigation and guidance; it does not claim that a profile has been saved, an opportunity is currently open,
            a provider has received an application, or a payment has settled. Provider receipt and outcomes require provider-origin evidence.
            Candidate-reported submission, provider-confirmed receipt and provider-issued outcomes remain separate events.
            No admission, funding, placement, employment, or success is guaranteed.
          </p>
        </aside>

        <footer className={styles.footer}>
          <span>© Kingsmen Portal · South Africa</span>
          <span>Private information belongs behind authenticated access controls. Source freshness and provider evidence determine what Kingsmen can state.</span>
        </footer>
      </div>
    </main>
  );
}
