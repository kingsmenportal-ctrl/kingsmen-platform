"use client";

import { FormEvent, useState } from "react";

const input: React.CSSProperties = { width:"100%",boxSizing:"border-box",background:"#0d1120",color:"#f7f4ec",border:"1px solid #424657",borderRadius:10,padding:"12px 13px",font:"inherit",minHeight:46 };
const label: React.CSSProperties = { display:"grid",gap:7,color:"#c4c9d4",fontSize:13 };
const gold="#d8b66a";
const orgTypes = [
 ["EMPLOYER","Employer"],["RECRUITER","Recruiter"],["UNIVERSITY","University"],["TVET","TVET college"],["PRIVATE_COLLEGE","Private college"],
 ["TRAINING_PROVIDER","Training provider"],["SETA","SETA"],["FUNDER","Funder / bursary provider"],["ACCOMMODATION_PROVIDER","Accommodation provider"],["COMMUNITY_PARTNER","Community partner"],["OTHER","Other"]
];
const provinces=["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"];

export default function PartnerOnboardingForm() {
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState(false);
 const [record,setRecord]=useState<{id:string;display_name:string;verification_status:string}|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault(); const formElement = event.currentTarget; setBusy(true); setMessage(""); setError(false); setRecord(null);
  const formData=new FormData(event.currentTarget);
  const body={
   displayName:String(formData.get("displayName")||"").trim(),
   organisationType:String(formData.get("organisationType")||""),
   officialWebsite:String(formData.get("officialWebsite")||"").trim(),
   contactEmail:String(formData.get("contactEmail")||"").trim(),
   province:String(formData.get("province")||"")
  };
  try {
   const response=await fetch("/api/partners/organisations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),credentials:"same-origin"});
   const payload=await response.json().catch(()=>({}));
   if(!response.ok||payload.ok!==true) {
    setError(true);
    setMessage(response.status===401?"Sign in first, then submit the organisation profile.":payload.message||"The profile could not be submitted. Please check the details and try again.");
    return;
   }
   setRecord(payload.organisation);
   setMessage(payload.message||"Your organisation profile is submitted for review.");
   formElement.reset();
  } catch { setError(true);setMessage("The partner service is currently unavailable. Your details have not been confirmed as saved."); }
  finally { setBusy(false); }
 }
 return <div>
  <form onSubmit={submit} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))",gap:16}}>
   <label style={label}>Organisation / trading name<input name="displayName" required minLength={2} maxLength={180} style={input} autoComplete="organization" /></label>
   <label style={label}>Organisation type<select name="organisationType" required defaultValue="" style={input}><option value="" disabled>Select type</option>{orgTypes.map(([value,title])=><option key={value} value={value}>{title}</option>)}</select></label>
   <label style={label}>Official website (optional)<input name="officialWebsite" type="url" maxLength={2048} placeholder="https://example.org.za" style={input} autoComplete="url" /></label>
   <label style={label}>Organisation contact email<input name="contactEmail" type="email" required maxLength={320} style={input} autoComplete="email" /></label>
   <label style={label}>Province (optional)<select name="province" defaultValue="" style={input}><option value="">Select province</option>{provinces.map(p=><option key={p}>{p}</option>)}</select></label>
   <div style={{display:"flex",alignItems:"end"}}><button disabled={busy} type="submit" style={{background:gold,color:"#080b14",border:0,borderRadius:10,padding:"13px 18px",fontWeight:850,minHeight:46,cursor:busy?"wait":"pointer",width:"100%"}}>{busy?"Submitting…":"Submit organisation for review →"}</button></div>
  </form>
  {message&&<div role="status" style={{marginTop:18,padding:16,borderRadius:12,border:"1px solid "+(error?"#b65d5d":"#547a61"),background:"rgba(255,255,255,.04)"}}>
   <strong>{error?"Submission not confirmed":record?"Submitted for review":"Partner onboarding"}</strong>
   <p style={{marginBottom:0,lineHeight:1.65,color:"#c4c9d4"}}>{message}</p>
   {record&&<p style={{fontSize:12,color:"#a5adbb",marginBottom:0}}>Reference: {record.id} · Status: {record.verification_status}</p>}
  </div>}
  <p style={{fontSize:12,color:"#9299a9",lineHeight:1.6,marginBottom:0}}>You must be signed in. Submission creates a pending-review profile only; it does not verify the organisation, publish listings or grant employer access.</p>
 </div>;
}
