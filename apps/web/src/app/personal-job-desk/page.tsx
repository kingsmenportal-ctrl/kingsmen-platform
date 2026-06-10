import type { CSSProperties } from "react";

const tasks = [
  { title: "Upload or refresh your CV", meta: "Smart profile uses your document first", href: "/personal-job-desk/apply-now" },
  { title: "Run opportunity scout", meta: "Find jobs, learnerships and funding sources", href: "/personal-job-desk/opportunity-scout" },
  { title: "Prepare application pack", meta: "Reuse profile and documents", href: "/personal-job-desk/apply-now" },
  { title: "Capture proof", meta: "Reference, screenshot, email proof or portal confirmation", href: "/personal-job-desk/apply-now" }
];

const categories = [
  { name: "Jobs", count: "Scout", text: "Retail, admin, general worker, call centre, security, office support" },
  { name: "Learnerships", count: "Scout", text: "SETA, employer and youth programme routes" },
  { name: "Internships", count: "Scout", text: "Graduate, TVET and workplace experience routes" },
  { name: "Funding", count: "Scout", text: "Bursaries, youth support, training and grant routes" }
];

const pipeline = [
  ["Profile", "Smart CV intake"],
  ["Documents", "CV / ID / certificates"],
  ["Scout", "Find verified source"],
  ["Pack", "Prepare application"],
  ["Apply", "Official source"],
  ["Proof", "Track outcome"]
];

export default function PersonalJobDeskHome() {
  return (
    <main style={page}>
      <section style={hero}>
        <div style={heroCopy}>
          <p style={eyebrow}>KINGSMEN WORKBENCH</p>
          <h1 style={title}>Find. Prepare. Apply. Track.</h1>
          <p style={subtitle}>
            A smart application desk for jobs, learnerships, internships and funding. Upload your CV once,
            scout real opportunities, prepare clean application packs and keep proof of every move.
          </p>

          <div style={searchBar}>
            <input style={searchInput} placeholder="Search role, company, learnership, bursary..." />
            <input style={whereInput} placeholder="Johannesburg" />
            <a href="/personal-job-desk/opportunity-scout" style={searchButton}>Find opportunities</a>
          </div>
        </div>

        <aside style={profileCard}>
          <div style={profileTop}>
            <span style={avatar}>K</span>
            <div>
              <strong>Your application profile</strong>
              <small>CV-powered smart intake</small>
            </div>
          </div>

          <div style={meterTrack}>
            <span style={meterFill} />
          </div>

          <div style={profileStats}>
            <span><strong>0</strong><small>Applications</small></span>
            <span><strong>0</strong><small>Proofs</small></span>
            <span><strong>0</strong><small>Packs</small></span>
          </div>

          <a href="/personal-job-desk/apply-now" style={primaryFull}>Complete profile</a>
        </aside>
      </section>

      <section style={quickGrid}>
        <a href="/personal-job-desk/apply-now" style={quickCard}>
          <span style={quickIcon}>✦</span>
          <strong>Smart apply desk</strong>
          <small>CV autofill, documents, packs and proof.</small>
        </a>

        <a href="/personal-job-desk/opportunity-scout" style={quickCard}>
          <span style={quickIcon}>◎</span>
          <strong>Opportunity scout</strong>
          <small>Search and import real leads.</small>
        </a>

        <a href="/personal-job-desk/document-pack-index" style={quickCard}>
          <span style={quickIcon}>▣</span>
          <strong>Document vault</strong>
          <small>Check what is ready or missing.</small>
        </a>
      </section>

      <section style={mainGrid}>
        <section style={panel}>
          <div style={sectionHead}>
            <div>
              <p style={eyebrow}>TODAY</p>
              <h2 style={sectionTitle}>Next actions</h2>
            </div>
            <a href="/personal-job-desk/apply-now" style={textButton}>Open apply desk</a>
          </div>

          <div style={taskList}>
            {tasks.map((task, index) => (
              <a key={task.title} href={task.href} style={taskRow}>
                <span style={taskNumber}>{index + 1}</span>
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.meta}</small>
                </span>
                <b>→</b>
              </a>
            ))}
          </div>
        </section>

        <section style={panel}>
          <div style={sectionHead}>
            <div>
              <p style={eyebrow}>PIPELINE</p>
              <h2 style={sectionTitle}>Application status</h2>
            </div>
          </div>

          <div style={pipelineGrid}>
            {pipeline.map(([name, desc]) => (
              <div key={name} style={pipelineCard}>
                <strong>{name}</strong>
                <small>{desc}</small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section style={panel}>
        <div style={sectionHead}>
          <div>
            <p style={eyebrow}>ROUTES</p>
            <h2 style={sectionTitle}>What Kingsmen can help you chase</h2>
          </div>
          <a href="/personal-job-desk/opportunity-scout" style={textButton}>Scout now</a>
        </div>

        <div style={categoryGrid}>
          {categories.map((item) => (
            <article key={item.name} style={categoryCard}>
              <span style={routeBadge}>{item.count}</span>
              <h3>{item.name}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={bottomGrid}>
        <section style={panel}>
          <p style={eyebrow}>DOCUMENT READINESS</p>
          <h2 style={sectionTitle}>Your document pack</h2>
          <div style={docRows}>
            <div style={docRow}><span>CV</span><b>Upload / refresh</b></div>
            <div style={docRow}><span>ID copy</span><b>Required for many routes</b></div>
            <div style={docRow}><span>Certificates</span><b>Add when available</b></div>
            <div style={docRow}><span>Proof files</span><b>Attach after applying</b></div>
          </div>
          <a href="/personal-job-desk/document-pack-index" style={secondaryFull}>Review documents</a>
        </section>

        <section style={panel}>
          <p style={eyebrow}>ASSISTED APPLICATION</p>
          <h2 style={sectionTitle}>How Kingsmen should reduce your work</h2>
          <div style={assistantList}>
            <span>Read CV and fill profile</span>
            <span>Scout sources and import leads</span>
            <span>Reuse details across applications</span>
            <span>Prepare pack before official apply</span>
            <span>Stop at login, OTP, CAPTCHA or unsafe pages</span>
            <span>Capture proof after submission</span>
          </div>
        </section>
      </section>
    </main>
  );
}

const page: CSSProperties = {
  padding: 24,
  display: "grid",
  gap: 18,
  background: "radial-gradient(circle at 12% 0%,rgba(229,184,87,.18),transparent 32%),#070705"
};

const hero: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) 340px",
  gap: 18
};

const heroCopy: CSSProperties = {
  minHeight: 330,
  borderRadius: 32,
  padding: 32,
  background: "linear-gradient(135deg,rgba(229,184,87,.16),rgba(255,255,255,.045))",
  border: "1px solid rgba(229,184,87,.18)",
  display: "grid",
  alignContent: "center"
};

const eyebrow: CSSProperties = {
  margin: 0,
  color: "#d8a83e",
  fontSize: 12,
  letterSpacing: ".16em",
  fontWeight: 1000,
  textTransform: "uppercase"
};

const title: CSSProperties = {
  margin: "10px 0 12px",
  fontSize: 64,
  lineHeight: .92,
  letterSpacing: "-.06em"
};

const subtitle: CSSProperties = {
  color: "#cfc2a4",
  maxWidth: 760,
  fontSize: 17,
  lineHeight: 1.65
};

const searchBar: CSSProperties = {
  marginTop: 22,
  display: "grid",
  gridTemplateColumns: "minmax(0,1.4fr) minmax(180px,.6fr) auto",
  gap: 10,
  padding: 8,
  borderRadius: 999,
  background: "rgba(0,0,0,.32)",
  border: "1px solid rgba(229,184,87,.20)"
};

const searchInput: CSSProperties = {
  border: 0,
  outline: 0,
  background: "transparent",
  color: "#f6efe0",
  padding: "14px 16px",
  fontSize: 15
};

const whereInput: CSSProperties = {
  ...searchInput,
  borderLeft: "1px solid rgba(229,184,87,.16)"
};

const searchButton: CSSProperties = {
  borderRadius: 999,
  background: "#e5b857",
  color: "#111",
  textDecoration: "none",
  padding: "14px 18px",
  fontWeight: 1000,
  whiteSpace: "nowrap"
};

const profileCard: CSSProperties = {
  borderRadius: 32,
  padding: 24,
  background: "linear-gradient(180deg,#181209,#0b0905)",
  border: "1px solid rgba(229,184,87,.20)",
  display: "grid",
  alignContent: "space-between",
  gap: 18
};

const profileTop: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12
};

const avatar: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 20,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg,#f4c968,#8f6826)",
  color: "#111",
  fontWeight: 1000,
  fontSize: 28
};

const meterTrack: CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: "rgba(255,255,255,.10)",
  overflow: "hidden"
};

const meterFill: CSSProperties = {
  display: "block",
  width: "18%",
  height: "100%",
  background: "#e5b857",
  borderRadius: 999
};

const profileStats: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 10
};

const primaryFull: CSSProperties = {
  display: "block",
  textAlign: "center",
  borderRadius: 999,
  padding: "13px 16px",
  background: "#e5b857",
  color: "#111",
  textDecoration: "none",
  fontWeight: 1000
};

const secondaryFull: CSSProperties = {
  display: "block",
  textAlign: "center",
  borderRadius: 999,
  padding: "13px 16px",
  border: "1px solid rgba(229,184,87,.32)",
  color: "#f4c968",
  textDecoration: "none",
  fontWeight: 1000,
  marginTop: 16
};

const quickGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: 14
};

const quickCard: CSSProperties = {
  padding: 18,
  borderRadius: 24,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(229,184,87,.14)",
  color: "#f6efe0",
  textDecoration: "none",
  display: "grid",
  gap: 8
};

const quickIcon: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  color: "#f4c968",
  background: "rgba(229,184,87,.12)"
};

const mainGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(340px,.9fr)",
  gap: 18
};

const bottomGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px,.8fr) minmax(0,1fr)",
  gap: 18
};

const panel: CSSProperties = {
  borderRadius: 28,
  padding: 22,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(229,184,87,.14)"
};

const sectionHead: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  marginBottom: 16
};

const sectionTitle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 26,
  letterSpacing: "-.03em"
};

const textButton: CSSProperties = {
  color: "#f4c968",
  textDecoration: "none",
  fontWeight: 1000,
  whiteSpace: "nowrap"
};

const taskList: CSSProperties = {
  display: "grid",
  gap: 10
};

const taskRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px 1fr auto",
  gap: 12,
  alignItems: "center",
  padding: 14,
  borderRadius: 18,
  background: "rgba(0,0,0,.22)",
  border: "1px solid rgba(229,184,87,.10)",
  color: "#f6efe0",
  textDecoration: "none"
};

const taskNumber: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(229,184,87,.12)",
  color: "#f4c968",
  fontWeight: 1000
};

const pipelineGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 10
};

const pipelineCard: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "rgba(0,0,0,.22)",
  border: "1px solid rgba(229,184,87,.10)",
  display: "grid",
  gap: 5
};

const categoryGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 14
};

const categoryCard: CSSProperties = {
  padding: 18,
  minHeight: 170,
  borderRadius: 24,
  background: "linear-gradient(180deg,rgba(229,184,87,.10),rgba(0,0,0,.18))",
  border: "1px solid rgba(229,184,87,.14)"
};

const routeBadge: CSSProperties = {
  display: "inline-block",
  borderRadius: 999,
  padding: "7px 10px",
  background: "rgba(229,184,87,.12)",
  color: "#f4c968",
  fontSize: 12,
  fontWeight: 1000
};

const docRows: CSSProperties = {
  display: "grid",
  gap: 10
};

const docRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  padding: 13,
  borderRadius: 16,
  background: "rgba(0,0,0,.22)",
  border: "1px solid rgba(229,184,87,.10)"
};

const assistantList: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 10
};