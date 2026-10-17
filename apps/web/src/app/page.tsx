const gold = "#d8b66a";
const ink = "#080b14";
const card = "rgba(255,255,255,.055)";
const action = { display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"13px 18px", borderRadius:12, fontWeight:850, textDecoration:"none" as const, minHeight:46 };

const pathways = [
  { title:"Study & training", text:"Explore university, TVET, skills and training routes.", href:"/free-destiny-map", tag:"Explore routes" },
  { title:"Work & experience", text:"Organise your job search, CV preparation and next steps.", href:"/free-destiny-map", tag:"Plan next steps" },
  { title:"Funding readiness", text:"Understand common preparation steps and what to verify with funders.", href:"/free-destiny-map", tag:"Check readiness" },
  { title:"Documents & deadlines", text:"Identify what you may need to prepare before applying.", href:"/free-destiny-map", tag:"Build a checklist" },
];

export default function HomePage() {
  return <main style={{ minHeight:"100vh", background:`radial-gradient(ellipse at 82% 0%, rgba(216,182,106,.17), transparent 38%), ${ink}`, color:"#f7f4ec", fontFamily:"Inter,system-ui,sans-serif" }}>
    <header style={{ maxWidth:1160, margin:"0 auto", padding:"24px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:18, flexWrap:"wrap" }}>
      <a href="/" aria-label="Kingsmen home" style={{ color:gold, textDecoration:"none", fontWeight:950, letterSpacing:".2em" }}>KINGSMEN</a>
      <nav aria-label="Main navigation" style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap", fontSize:14 }}>
        <a href="/free-destiny-map" style={{ color:"#e8e4d9" }}>Free Destiny Map</a>
        <a href="/pricing" style={{ color:"#e8e4d9" }}>Packages</a>
        <a href="/auth/login" style={{ color:"#e8e4d9" }}>Sign in</a>
        <a href="/auth/register" style={{ ...action, minHeight:38, padding:"9px 13px", border:"1px solid rgba(216,182,106,.55)", color:gold }}>Create account</a>
      </nav>
    </header>
    <section style={{ maxWidth:1160, margin:"0 auto", padding:"68px 24px 56px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,390px),1fr))", gap:42, alignItems:"center" }}>
      <div>
        <p style={{ color:gold, fontWeight:850, letterSpacing:".18em", textTransform:"uppercase", fontSize:12 }}>Direction before decisions</p>
        <h1 style={{ fontSize:"clamp(42px,7vw,76px)", lineHeight:1.02, letterSpacing:"-.045em", margin:"18px 0" }}>Make your next move with a <span style={{ color:gold }}>clearer plan.</span></h1>
        <p style={{ color:"#c6cbd6", fontSize:18, lineHeight:1.75, maxWidth:650 }}>Explore study, training, work and funding-readiness pathways. Start with a free Destiny Map, get practical next steps, and decide what support you need—without having to create an account first.</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginTop:28 }}>
          <a href="/free-destiny-map" style={{ ...action, background:gold, color:ink }}>Start Free Destiny Map <span aria-hidden="true" style={{ marginLeft:8 }}>→</span></a>
          <a href="/auth/register" style={{ ...action, border:"1px solid #575767", color:"#f7f4ec" }}>Create candidate account</a>
        </div>
        <p style={{ color:"#9299a9", fontSize:13, marginTop:16 }}>Free to start · No payment for the map · No contact details required</p>
      </div>
      <aside style={{ border:"1px solid rgba(216,182,106,.28)", background:card, borderRadius:24, padding:26, boxShadow:"0 24px 90px rgba(0,0,0,.25)" }}>
        <p style={{ color:gold, fontWeight:850, fontSize:12, letterSpacing:".15em" }}>A PRACTICAL STARTING POINT</p>
        <h2 style={{ fontSize:28, margin:"10px 0 18px" }}>Clarity first. Verified decisions next.</h2>
        {["Choose the stage you are at", "Explore route categories that interest you", "Identify documents, requirements and deadlines to verify", "Keep a backup route in view"].map((x,i)=><div key={x} style={{ display:"flex", gap:13, alignItems:"flex-start", padding:"13px 0", borderTop:"1px solid rgba(255,255,255,.09)" }}><span style={{ color:gold, fontWeight:900 }}>{String(i+1).padStart(2,"0")}</span><span style={{ color:"#d9dce4", lineHeight:1.55 }}>{x}</span></div>)}
        <p style={{ fontSize:12, lineHeight:1.7, color:"#aab1bf", marginBottom:0 }}>The free map provides general guidance only. It does not check live availability, submit applications, or guarantee admission, funding, placement or employment.</p>
      </aside>
    </section>
    <section aria-labelledby="pathways-heading" style={{ maxWidth:1160, margin:"0 auto", padding:"20px 24px 70px" }}>
      <div style={{ maxWidth:720, marginBottom:22 }}><p style={{ color:gold, fontWeight:850, letterSpacing:".15em", textTransform:"uppercase", fontSize:12 }}>Choose a starting point</p><h2 id="pathways-heading" style={{ fontSize:"clamp(28px,4vw,42px)", margin:"8px 0 10px" }}>Different routes. One practical next step.</h2><p style={{ color:"#bfc5d0", lineHeight:1.7 }}>Not sure which route fits? Choose “I am not sure yet” inside the map. You do not need to know the answer before you begin.</p></div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}>
        {pathways.map(item=><article key={item.title} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", padding:22, borderRadius:18, background:card, border:"1px solid rgba(255,255,255,.09)" }}><h3 style={{ color:gold, marginTop:0, marginBottom:8 }}>{item.title}</h3><p style={{ color:"#c2c7d2", lineHeight:1.65, marginTop:0, flex:1 }}>{item.text}</p><a href={item.href} style={{ color:"#f0d38b", fontWeight:800, fontSize:14 }}>{item.tag} →</a></article>)}
      </div>
    </section>
    <section style={{ maxWidth:1112, margin:"0 auto 54px", padding:"24px", borderTop:"1px solid rgba(255,255,255,.08)", borderBottom:"1px solid rgba(255,255,255,.08)", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:24 }}>
      <div><h2 style={{ marginTop:0, fontSize:22 }}>Free guidance</h2><p style={{ color:"#bfc5d0", lineHeight:1.7 }}>A browser-based readiness preview with practical actions. No account, payment or personal contact details required.</p></div>
      <div><h2 style={{ marginTop:0, fontSize:22 }}>Managed support</h2><p style={{ color:"#bfc5d0", lineHeight:1.7 }}>Separate services may offer deeper planning or execution support. Scope and availability must be confirmed before any service is purchased.</p><a href="/pricing" style={{ color:"#f0d38b", fontWeight:800 }}>Review packages →</a></div>
    </section>
    <section aria-labelledby="workspace-heading" style={{ maxWidth:1112, margin:"0 auto 54px", padding:"0 24px", width:"calc(100% - 48px)" }}>
      <div style={{ borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:28 }}>
        <p style={{ color:gold, fontWeight:850, letterSpacing:".15em", textTransform:"uppercase", fontSize:12 }}>Continue in the portal</p>
        <h2 id="workspace-heading" style={{ fontSize:"clamp(26px,4vw,38px)", margin:"8px 0 18px" }}>Move from planning to organised action.</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
          <article style={{ padding:22, borderRadius:18, background:card, border:"1px solid rgba(216,182,106,.25)" }}>
            <h3 style={{ marginTop:0, color:gold }}>Candidate Portal</h3>
            <p style={{ color:"#c2c7d2", lineHeight:1.7 }}>Continue onboarding, review your account connection and open candidate profile, document and application areas. Private records remain gated by server-side verification.</p>
            <a href="/candidate/dashboard" style={{ color:"#f0d38b", fontWeight:850 }}>Open candidate dashboard →</a>
          </article>
          <article style={{ padding:22, borderRadius:18, background:card, border:"1px solid rgba(216,182,106,.25)" }}>
            <h3 style={{ marginTop:0, color:gold }}>Personal Job Desk</h3>
            <p style={{ color:"#c2c7d2", lineHeight:1.7 }}>Open the job-search workspace for opportunity scouting, application preparation, document readiness and submission-proof tracking.</p>
            <a href="/personal-job-desk" style={{ color:"#f0d38b", fontWeight:850 }}>Open Personal Job Desk →</a>
          </article>
        </div>
      </div>
    </section>
    <footer style={{ padding:"22px 24px 32px", textAlign:"center", color:"#8e95a4", fontSize:12, lineHeight:1.8 }}>
      Kingsmen Portal · Make informed decisions and verify official requirements directly.<br/>
      Kingsmen guidance is not an official decision-maker and does not guarantee outcomes.
      <nav aria-label="Footer navigation" style={{ display:"flex", justifyContent:"center", flexWrap:"wrap", gap:18, marginTop:14 }}>
        <a href="/pricing" style={{ color:"#f0d38b" }}>Packages</a>
        <a href="/privacy" style={{ color:"#f0d38b" }}>Privacy notice</a>
        <a href="/auth/login" style={{ color:"#f0d38b" }}>Sign in</a>
        <a href="/auth/register" style={{ color:"#f0d38b" }}>Create account</a>
      </nav>
    </footer>
  </main>;
}
