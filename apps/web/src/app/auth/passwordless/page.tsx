"use client";

import { useState } from "react";

export default function AccountRecoveryPage() {
  const [message, setMessage] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Recovery request UI validated. Email delivery and identity verification are not connected, so no recovery email was sent.");
  }
  return <main style={{ minHeight:"100vh", background:"#080b14", color:"#f7f4ec", padding:"36px 20px", fontFamily:"Inter,system-ui,sans-serif" }}>
    <div style={{ maxWidth:520, margin:"0 auto" }}><a href="/auth/login" style={{ color:"#d8b66a", textDecoration:"none", fontWeight:900 }}>← Back to sign in</a>
      <section style={{ marginTop:30, padding:28, border:"1px solid rgba(216,182,106,.25)", borderRadius:22, background:"rgba(255,255,255,.04)" }}>
        <h1 style={{ fontSize:34, marginTop:0 }}>Account recovery</h1><p style={{ color:"#c2c7d2", lineHeight:1.65 }}>Enter the email address associated with your account. Secure recovery will be available after authentication and email delivery are integrated.</p>
        <form onSubmit={submit} style={{ display:"grid", gap:14 }}><label style={{ display:"grid", gap:7 }}>Email address<input name="email" type="email" autoComplete="email" required style={fieldStyle}/></label><button type="submit" style={{ padding:14, border:0, borderRadius:12, background:"#d8b66a", color:"#080b14", fontWeight:900 }}>Request recovery</button></form>
        {message && <p role="status" style={{ color:"#f1d99a", lineHeight:1.6 }}>{message}</p>}
      </section>
    </div>
  </main>;
}
const fieldStyle = { width:"100%", boxSizing:"border-box" as const, padding:13, borderRadius:10, border:"1px solid #414757", background:"#101522", color:"#f7f4ec" };
