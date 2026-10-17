"use client";
import { useState } from "react";
export default function SaveOpportunityButton({routeProgrammeId}:{routeProgrammeId:string}) {
 const [state,setState]=useState<"idle"|"saving"|"saved"|"error"|"signedout">("idle");
 const [message,setMessage]=useState("");
 async function save() {
  setState("saving");setMessage("");
  try {
   const response=await fetch("/api/candidate/saved-listings",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({routeProgrammeId})});
   const body=await response.json().catch(()=>({}));
   if(response.status===401){setState("signedout");setMessage("Sign in to save this opportunity.");return;}
   if(!response.ok||body.ok!==true){setState("error");setMessage("Could not save this opportunity. It may no longer be available.");return;}
   setState("saved");setMessage("Saved to your account.");
  } catch {setState("error");setMessage("Saved status could not be confirmed.");}
 }
 return <div style={{display:"grid",gap:5}}>
  <button type="button" onClick={save} disabled={state==="saving"||state==="saved"} style={{background:"transparent",color:"#d8b66a",border:"1px solid #77704f",borderRadius:10,padding:"11px 13px",minHeight:44,fontWeight:800,cursor:state==="saving"?"wait":"pointer"}}>{state==="saving"?"Saving…":state==="saved"?"Saved ✓":"Save opportunity ☆"}</button>
  {message&&<span role="status" style={{fontSize:12,color:state==="error"?"#f0a4a4":"#c4c9d4"}}>{message} {state==="signedout"&&<a href="/auth/login" style={{color:"#d8b66a"}}>Sign in →</a>}</span>}
  {state==="saved"&&<a href="/candidate/saved-opportunities" style={{fontSize:12,color:"#d8b66a"}}>View saved opportunities →</a>}
 </div>;
}
