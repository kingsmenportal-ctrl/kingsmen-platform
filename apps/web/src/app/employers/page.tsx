import OpportunityDirectory from "../../components/opportunity-directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Employers & Recruiters" };

export default function EmployersPage() {
 return <main style={{ minHeight:"100vh", background:"#080b14", color:"#f7f4ec", fontFamily:"Inter,system-ui,sans-serif" }}>
  <section style={{ maxWidth:1120, margin:"0 auto", padding:"28px 24px 60px" }}>
   <a href="/" style={{ color:"#d8b66a", textDecoration:"none", fontWeight:950, letterSpacing:".18em" }}>KINGSMEN</a>
   <p style={{ color:"#d8b66a", fontWeight:850, letterSpacing:".16em", fontSize:12, marginTop:42 }}>EMPLOYER & RECRUITER NETWORK</p>
   <h1 style={{ fontSize:"clamp(38px,6vw,62px)", lineHeight:1.05, maxWidth:850 }}>Reach candidates through a verified opportunity network.</h1>
   <p style={{ color:"#c4c9d4", fontSize:18, lineHeight:1.75, maxWidth:820 }}>Explore published roles, internships and learnerships. Employer accounts, candidate access, screening and applicant management require verified organisation permissions and are not granted by this public page.</p>
   <div style={{ display:"flex", gap:12, flexWrap:"wrap", margin:"22px 0 34px" }}><a href="/partners" style={{ background:"#d8b66a", color:"#080b14", borderRadius:10, padding:"13px 17px", textDecoration:"none", fontWeight:850 }}>Partner onboarding →</a><a href="/auth/login" style={{ border:"1px solid #525467", color:"#f7f4ec", borderRadius:10, padding:"13px 17px", textDecoration:"none", fontWeight:850 }}>Sign in →</a></div>
   <div style={{ borderTop:"1px solid #2a2e3c", paddingTop:22 }}><OpportunityDirectory initialSector="EMPLOYER" title="Published jobs & employment routes" intro="Only current listings with verified providers and source records appear here. Opening an official source is not the same as submitting an application."/></div>
  </section>
 </main>;
}
