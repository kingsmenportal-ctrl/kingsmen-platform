"use client";

import { useState } from "react";

type Intake = { stage: string; province: string; route: string; blocker: string; goal: string; confirmed: boolean };
const field = { width:"100%", boxSizing:"border-box" as const, padding:12, borderRadius:12, border:"1px solid rgba(214,178,94,.3)", background:"#101522", color:"#f8f3e7", font:"inherit" };
const labelStyle = { display:"grid", gap:7, color:"#fff7d6", fontWeight:800 as const };

export default function FreeDestinyMapPage() {
  const [intake, setIntake] = useState<Intake>({stage:"",province:"",route:"",blocker:"",goal:"",confirmed:false});
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  function update(key: keyof Intake, value: string | boolean) { setIntake(old => ({...old,[key]:value})); setError(""); }
  function preview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intake.stage || !intake.province || !intake.route || !intake.blocker || !intake.confirmed) {
      setError("Complete the four selections and confirm the boundary to see your local preview."); return;
    }
    setShowPreview(true);
  }
  const nextSteps = [
    intake.blocker.includes("documents") ? "Make a checklist of the documents you already have and those still missing." : "Write down your current qualifications and the information you can verify.",
    intake.route.includes("funding") || intake.blocker.includes("funding") ? "Prepare a funding-readiness checklist; verify every funder and deadline directly." : "Compare the entry requirements for two realistic options in your chosen route.",
    "Keep a backup option and record the next deadline you need to verify."
  ];
  return <main style={{ minHeight:"100vh", padding:"28px 20px 56px", background:"radial-gradient(circle at top left, rgba(214,178,94,.2), transparent 34%), #080a12", color:"#f8f3e7", fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif" }}>
    <section style={{ maxWidth:980, margin:"0 auto", display:"grid", gap:18 }}>
      <a href="/" style={{ color:"#d6b25e", textDecoration:"none", fontWeight:850 }}>← KINGSMEN</a>
      <p style={{ margin:"8px 0 0", color:"#d6b25e", fontSize:13, letterSpacing:".16em", textTransform:"uppercase", fontWeight:900 }}>Free Destiny Map</p>
      <h1 style={{ margin:0, fontSize:"clamp(36px,6vw,54px)", lineHeight:1.05, color:"#fff7d6" }}>Start your route discovery.</h1>
      <p style={{ maxWidth:760, color:"#d5d9e2", fontSize:16, lineHeight:1.7 }}>Describe your current stage and what is getting in the way. You will get a practical, on-page readiness preview—without a payment or an account.</p>
      <form onSubmit={preview} style={{ display:"grid", gap:16, padding:22, borderRadius:24, border:"1px solid rgba(214,178,94,.28)", background:"rgba(255,255,255,.045)", boxShadow:"0 22px 70px rgba(0,0,0,.28)" }}>
        <label style={labelStyle}>Current stage<select required value={intake.stage} onChange={e=>update("stage",e.target.value)} style={field}><option value="">Choose your current stage</option>{["Grade 9–11","Grade 12 / Matric","Matric completed","TVET / college student","Unemployed and seeking opportunity","Working and seeking upgrade"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label style={labelStyle}>Province<select required value={intake.province} onChange={e=>update("province",e.target.value)} style={field}><option value="">Choose province</option>{["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label style={labelStyle}>Route interest<select required value={intake.route} onChange={e=>update("route",e.target.value)} style={field}><option value="">Choose route</option>{["University","TVET college","SETA / learnership","Internship / apprenticeship","Employment / CV path","Bursary / funding support","I am not sure yet"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label style={labelStyle}>Biggest blocker<select required value={intake.blocker} onChange={e=>update("blocker",e.target.value)} style={field}><option value="">Choose blocker</option>{["I do not know what to apply for","I am missing documents","I need funding guidance","I need a better CV","I am worried about deadlines","I need backup options"].map(v=><option key={v}>{v}</option>)}</select></label>
        <label style={labelStyle}>Readiness goal <textarea value={intake.goal} onChange={e=>update("goal",e.target.value)} placeholder="Optional: what would you most like to understand next?" rows={3} maxLength={500} style={{...field,resize:"vertical"}} /></label>
        <label style={{display:"flex",gap:10,alignItems:"flex-start",color:"#d5d9e2",fontSize:13,lineHeight:1.6,fontWeight:400}}><input type="checkbox" checked={intake.confirmed} onChange={e=>update("confirmed",e.target.checked)} style={{marginTop:4}}/>I understand this is an on-page guidance preview only. It does not submit my information, create an account or application, or guarantee acceptance, funding, placement or employment.</label>
        {error && <p role="alert" style={{margin:0,color:"#ffc7b7"}}>{error}</p>}
        <button type="submit" style={{width:"fit-content",padding:"13px 18px",borderRadius:999,border:"1px solid rgba(214,178,94,.62)",background:"linear-gradient(135deg,rgba(214,178,94,.28),rgba(214,178,94,.08))",color:"#f8d77a",fontWeight:900,cursor:"pointer"}}>Preview my readiness path →</button>
      </form>
      {showPreview && <section aria-live="polite" style={{padding:24,borderRadius:22,border:"1px solid rgba(214,178,94,.4)",background:"rgba(214,178,94,.07)"}}>
        <p style={{marginTop:0,color:"#d6b25e",fontSize:12,fontWeight:900,letterSpacing:".14em"}}>YOUR LOCAL READINESS PREVIEW</p>
        <h2 style={{marginTop:0,fontSize:28}}>Start with clarity, then verify.</h2>
        <p style={{color:"#d5d9e2",lineHeight:1.7}}>For a {intake.stage.toLowerCase()} in {intake.province} exploring {intake.route.toLowerCase()}, your first priority is: <strong>{intake.blocker.toLowerCase()}</strong>.</p>
        <ol style={{paddingLeft:22,color:"#e3e5eb",lineHeight:1.8}}>{nextSteps.map(step=><li key={step}>{step}</li>)}</ol>
        {intake.goal.trim() && <p style={{color:"#c2c7d2"}}><strong>Your goal:</strong> {intake.goal.trim()}</p>}
        <p style={{fontSize:12,color:"#aeb7c5",lineHeight:1.6}}>This preview is generated in your browser from the selections above. It is not saved or sent to Kingsmen and does not check live vacancies, institutions, funding, eligibility or deadlines.</p>
        <button type="button" onClick={()=>{setShowPreview(false);setIntake({stage:"",province:"",route:"",blocker:"",goal:"",confirmed:false});}} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #5c6474",background:"transparent",color:"#f8f3e7",cursor:"pointer"}}>Start again</button>
      </section>}
      <p style={{color:"#aeb7c5",fontSize:13,lineHeight:1.6}}>Privacy boundary: this public preview collects no contact details, official identifiers, documents or payment information. No database or external service is called.</p>
      <p style={{color:"#8f97a6",fontSize:12}}>Ready for an account? <a href="/auth/register" style={{color:"#d6b25e"}}>Create candidate account</a> · Already have one? <a href="/auth/login" style={{color:"#d6b25e"}}>Sign in</a></p>
    </section>
  </main>;
}
