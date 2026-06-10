const modules = [
  {
    title: "Apply Now",
    href: "/personal-job-desk/apply-now",
    type: "Candidate Action",
    description: "Profile, documents, real opportunity import, application pack and proof capture.",
    status: "Use today"
  },
  {
    title: "Document Pack Index",
    href: "/personal-job-desk/document-pack-index",
    type: "Document Readiness",
    description: "Checks CV, ID, certificates, evidence attachments and export readiness.",
    status: "Connected if PJ33 exists"
  },
  {
    title: "Status Timeline",
    href: "/personal-job-desk/status-timeline",
    type: "Candidate Progress",
    description: "Evidence-readable timeline for applications and status movement.",
    status: "Connected"
  },
  {
    title: "Public Snapshot",
    href: "/personal-job-desk/public-snapshot",
    type: "Candidate Report",
    description: "Candidate-safe progress report with sensitive proof redacted.",
    status: "Connected"
  },
  {
    title: "Proof Review Board",
    href: "/personal-job-desk/proof-review-board",
    type: "Proof Control",
    description: "Operator/founder proof review before any status advancement.",
    status: "Internal"
  },
  {
    title: "Status Advancement",
    href: "/personal-job-desk/status-advancement",
    type: "Audit Mirror",
    description: "Records proof-backed advancement decisions without unsafe auto-mutation.",
    status: "Internal"
  },
  {
    title: "Daily Worklist",
    href: "/personal-job-desk/daily-worklist",
    type: "Founder Work",
    description: "Daily operator/founder action packets and workload.",
    status: "Internal"
  },
  {
    title: "Readiness Queue",
    href: "/personal-job-desk/readiness-queue",
    type: "Priority Queue",
    description: "Manual application readiness and priority scoring.",
    status: "Internal"
  }
];

const realSources = [
  ["SA Youth", "Jobs, youth programmes and skilling opportunities", "https://sayouth.mobi/"],
  ["ESSA", "Government work seeker CV and employer matching", "https://essa.labour.gov.za/EssaOnline/WebBeans/"],
  ["NYDA", "Youth grants, skills, vouchers and support", "https://www.nyda.gov.za/"],
  ["Indeed", "Live job search", "https://za.indeed.com/"],
  ["LinkedIn Jobs", "Company and internship listings", "https://www.linkedin.com/jobs/"],
  ["Careers24", "South African jobs", "https://www.careers24.com/"],
  ["PNet", "South African jobs and learnerships", "https://www.pnet.co.za/"]
];

export const dynamic = "force-dynamic";

export default function PersonalJobDeskHome() {
  return (
    <main style={main}>
      <section style={hero}>
        <div>
          <p style={eyebrow}>KINGSMEN PERSONAL JOB DESK</p>
          <h1 style={title}>Your connected application workspace</h1>
          <p style={muted}>
            This is the real entry point. Apply Now is the candidate workspace. The other modules are the proof,
            document, status, report and founder/operator systems behind it.
          </p>
          <div style={buttonRow}>
            <a href="/personal-job-desk/apply-now" style={primaryButton}>Start applying</a>
            <a href="/personal-job-desk/document-pack-index" style={secondaryButton}>Check documents</a>
            <a href="/personal-job-desk/status-timeline" style={secondaryButton}>View timeline</a>
          </div>
        </div>

        <div style={commandCard}>
          <strong style={{ fontSize: 44 }}>LIVE</strong>
          <span>Local command hub</span>
          <small>Use this while building Kingsmen into the full product.</small>
        </div>
      </section>

      <section style={flow}>
        <Step number="1" title="Profile" text="Save real personal details once." />
        <Step number="2" title="Documents" text="Upload CV, ID and certificates." />
        <Step number="3" title="Find" text="Search real sources and import opportunities." />
        <Step number="4" title="Apply" text="Build packs and apply through the real source." />
        <Step number="5" title="Proof" text="Capture reference, screenshot or email proof." />
        <Step number="6" title="Track" text="Use timeline, reports and review boards." />
      </section>

      <section style={grid}>
        {modules.map((module) => (
          <a key={module.href} href={module.href} style={moduleCard}>
            <p style={eyebrow}>{module.type}</p>
            <h2>{module.title}</h2>
            <p style={muted}>{module.description}</p>
            <span style={pill}>{module.status}</span>
          </a>
        ))}
      </section>

      <section style={panel}>
        <p style={eyebrow}>REAL SOURCE LAYER</p>
        <h2>Real opportunity sources Kingsmen must use today</h2>
        <p style={muted}>
          Kingsmen does not invent jobs. These links are the current live source layer until a verified ingestion/search agent is built.
        </p>

        <div style={sourceGrid}>
          {realSources.map(([name, desc, href]) => (
            <a href={href} target="_blank" rel="noreferrer" key={name} style={sourceCard}>
              <strong>{name}</strong>
              <span>{desc}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article style={stepCard}>
      <strong>{number}</strong>
      <span>{title}</span>
      <small>{text}</small>
    </article>
  );
}

const main = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left,rgba(215,173,73,.23),transparent 30%),linear-gradient(135deg,#030303,#100b05,#251807)",
  color: "#f8f0db",
  padding: 28,
  fontFamily: "Arial, sans-serif"
};

const hero = {
  display: "grid",
  gridTemplateColumns: "1fr minmax(220px,320px)",
  gap: 18,
  alignItems: "stretch",
  border: "1px solid rgba(255,215,122,.30)",
  borderRadius: 32,
  background: "linear-gradient(135deg,rgba(215,173,73,.19),rgba(0,0,0,.36))",
  padding: 26,
  marginBottom: 18
};

const title = {
  fontSize: 52,
  lineHeight: 1,
  margin: "8px 0 12px"
};

const commandCard = {
  border: "1px solid rgba(255,215,122,.30)",
  borderRadius: 26,
  background: "rgba(0,0,0,.30)",
  padding: 22,
  display: "grid",
  placeContent: "center",
  textAlign: "center" as const,
  color: "#ffd77a"
};

const flow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
  gap: 12,
  marginBottom: 18
};

const stepCard = {
  border: "1px solid rgba(255,215,122,.18)",
  borderRadius: 20,
  background: "rgba(0,0,0,.24)",
  padding: 16,
  display: "grid",
  gap: 6
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 14,
  marginBottom: 18
};

const moduleCard = {
  border: "1px solid rgba(255,215,122,.22)",
  borderRadius: 24,
  background: "rgba(255,255,255,.055)",
  padding: 20,
  color: "#f8f0db",
  textDecoration: "none",
  display: "grid",
  gap: 8
};

const panel = {
  border: "1px solid rgba(255,215,122,.22)",
  borderRadius: 24,
  background: "rgba(255,255,255,.055)",
  padding: 22
};

const sourceGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
  gap: 12,
  marginTop: 14
};

const sourceCard = {
  border: "1px solid rgba(255,215,122,.20)",
  borderRadius: 18,
  background: "rgba(0,0,0,.26)",
  color: "#ffd77a",
  textDecoration: "none",
  padding: 14,
  display: "grid",
  gap: 5
};

const buttonRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
  marginTop: 18
};

const primaryButton = {
  background: "#d7ad49",
  color: "#111",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none"
};

const secondaryButton = {
  border: "1px solid rgba(255,215,122,.45)",
  color: "#ffd77a",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none"
};

const pill = {
  width: "fit-content",
  border: "1px solid rgba(255,215,122,.28)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#ffd77a",
  background: "rgba(0,0,0,.26)",
  fontSize: 12
};

const eyebrow = {
  color: "#d7ad49",
  textTransform: "uppercase" as const,
  letterSpacing: ".16em",
  fontSize: 12
};

const muted = {
  color: "#d8caa8",
  lineHeight: 1.6
};