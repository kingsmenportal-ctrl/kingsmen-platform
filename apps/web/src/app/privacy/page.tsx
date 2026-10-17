const gold = "#d8b66a";
const muted = "#c2c7d2";

const sections = [
  { title: "What the free Destiny Map does", body: "The public Destiny Map creates a guidance preview in your browser from the selections you make. The preview is not submitted to Kingsmen, does not query an external provider, and is not saved by the page. Avoid entering identity numbers, banking details, passwords or sensitive personal information into optional text fields." },
  { title: "Account information", body: "If you create an account, the registration and sign-in flows send your email address and authentication credentials to the configured server-side authentication service. The application must not expose service-role credentials to the browser. Account creation alone does not establish a verified candidate record or grant access to private documents or application data." },
  { title: "Candidate profile and documents", body: "Candidate profile, document and application features may process personal information only when the corresponding service is configured and access controls are operating. Do not upload sensitive records unless the relevant feature clearly explains its purpose and confirms that secure storage is available. A page or interface being visible does not mean a document has been stored or verified." },
  { title: "Purpose and sharing", body: "Information should be used only to provide the requested portal functionality, protect accounts, support candidate workflows and meet applicable legal obligations. Do not assume that an application has been sent to an institution, employer or funder unless the system provides clear, verifiable submission evidence." },
  { title: "Retention, rights and contact", body: "The final retention periods, responsible legal entity, privacy contact, operator address, request process and applicable legal basis must be completed and approved by the service operator before public launch. This notice is a transparent product disclosure, not a substitute for a reviewed privacy policy or legal advice. Do not use the portal for urgent or legally time-sensitive submissions without independently verifying the official channel." }
];

export default function PrivacyPage() {
  return <main style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 80% 0%,rgba(216,182,106,.12),transparent 38%),#080b14", color: "#f7f4ec", fontFamily: "Inter,system-ui,sans-serif", padding: "28px 20px 64px" }}>
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <a href="/" style={{ color: gold, textDecoration: "none", fontWeight: 900 }}>← KINGSMEN</a>
      <p style={{ marginTop: 34, color: gold, fontSize: 12, fontWeight: 900, letterSpacing: ".16em", textTransform: "uppercase" }}>Privacy & data use</p>
      <h1 style={{ fontSize: "clamp(36px,6vw,54px)", lineHeight: 1.05, margin: "12px 0" }}>Your information should be handled with care.</h1>
      <p style={{ color: muted, fontSize: 16, lineHeight: 1.8 }}>This page describes important boundaries of the current Kingsmen Portal experience. It is not a claim that every backend storage, retention or deletion workflow has already been verified.</p>
      <div style={{ display: "grid", gap: 14, marginTop: 28 }}>
        {sections.map(section => <section key={section.title} style={{ padding: 22, border: "1px solid rgba(216,182,106,.22)", borderRadius: 18, background: "rgba(255,255,255,.035)" }}>
          <h2 style={{ marginTop: 0, fontSize: 21 }}>{section.title}</h2>
          <p style={{ marginBottom: 0, color: muted, lineHeight: 1.8 }}>{section.body}</p>
        </section>)}
      </div>
      <p style={{ marginTop: 24, padding: 16, borderLeft: "3px solid #d8b66a", background: "rgba(216,182,106,.06)", color: "#e0d8c7", lineHeight: 1.7 }}>Launch requirement: the service operator must replace the outstanding legal-identity, contact, retention and data-subject-rights placeholders with reviewed, accurate information before collecting live candidate data at scale.</p>
      <nav aria-label="Privacy page navigation" style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 22 }}><a href="/auth/register" style={{ color: gold }}>Create account</a><a href="/auth/login" style={{ color: gold }}>Sign in</a><a href="/pricing" style={{ color: gold }}>Packages</a></nav>
    </div>
  </main>;
}
