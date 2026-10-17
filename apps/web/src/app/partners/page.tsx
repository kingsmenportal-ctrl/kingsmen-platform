import PartnerOnboardingForm from "../../components/partner-onboarding-form";

const gold = "#d8b66a";
const card = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "rgba(255,255,255,.045)", padding: 24 };
const pathways = [
  ["Education providers", "Publish verified programmes, course routes, entry requirements and application guidance."],
  ["Employers & recruiters", "Share vacancies, internships, learnerships and hiring requirements with eligible candidates."],
  ["Accommodation providers", "Present residence options, location, cost details and transparent application steps."],
  ["Funders & training partners", "Make funding and training routes discoverable with clear eligibility and official-source evidence."]
];
export default function PartnersPage() {
 return <main style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 80% 0%,rgba(216,182,106,.13),transparent 40%),#080b14", color:"#f7f4ec", fontFamily:"Inter,system-ui,sans-serif" }}>
  <header style={{ maxWidth:1120, margin:"0 auto", padding:24, display:"flex", justifyContent:"space-between", alignItems:"center", gap:14, flexWrap:"wrap" }}><a href="/" style={{ color:gold, textDecoration:"none", fontWeight:950, letterSpacing:".18em" }}>KINGSMEN</a><nav style={{ display:"flex", gap:16 }}><a href="/opportunities" style={{ color:"#e5e1d8" }}>Opportunities</a><a href="/employers" style={{ color:"#e5e1d8" }}>Employer portal</a><a href="/auth/login" style={{ color:"#e5e1d8" }}>Sign in</a></nav></header>
  <section style={{ maxWidth:1120, margin:"0 auto", padding:"45px 24px 80px" }}>
   <p style={{ color:gold, fontWeight:850, letterSpacing:".16em", fontSize:12 }}>KINGSMEN PARTNER NETWORK</p>
   <h1 style={{ fontSize:"clamp(38px,6vw,64px)", lineHeight:1.05, maxWidth:850, margin:"12px 0" }}>Bring real opportunities closer to the people who need them.</h1>
   <p style={{ color:"#c4c9d4", fontSize:18, lineHeight:1.75, maxWidth:820 }}>Kingsmen connects candidates with education, employment, training, funding and accommodation pathways. Partner listings must be reviewed and supported by source evidence before they appear as verified opportunities.</p>
   <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))", gap:14, marginTop:30 }}>{pathways.map(([title,desc])=><article key={title} style={card}><h2 style={{ color:gold, fontSize:20, marginTop:0 }}>{title}</h2><p style={{ color:"#c4c9d4", lineHeight:1.7 }}>{desc}</p></article>)}</div>
   <section style={{ ...card, marginTop:20 }}><h2 style={{ marginTop:0 }}>Partner onboarding</h2><p style={{ color:"#c4c9d4", lineHeight:1.7 }}>Organisation verification and listing publication are separate steps. A submitted organisation profile is not considered verified, and a submitted listing is not visible to candidates until authorised review confirms its source and status.</p><ol style={{ color:"#c4c9d4", lineHeight:1.9 }}><li>Create or sign in to an authorised account.</li><li>Provide organisation identity and official website details.</li><li>Submit each listing with the official source and application URL.</li><li>Wait for source and organisation review before public publication.</li></ol><PartnerOnboardingForm /></section>
  </section>
 </main>;
}
