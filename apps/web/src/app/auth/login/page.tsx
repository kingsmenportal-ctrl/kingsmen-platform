"use client";

import { useState } from "react";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Sign-in UI is ready, but secure authentication is not connected. No credentials were sent or stored.");
  }
  return <main style={{ minHeight:"100vh", background:"#080b14", color:"#f7f4ec", padding:"36px 20px", fontFamily:"Inter,system-ui,sans-serif" }}>
    <div style={{ maxWidth:520, margin:"0 auto" }}><a href="/" style={{ color:"#d8b66a", textDecoration:"none", fontWeight:900 }}>← KINGSMEN</a>
      <section style={{ marginTop:30, padding:28, border:"1px solid rgba(216,182,106,.25)", borderRadius:22, background:"rgba(255,255,255,.04)" }}>
        <p style={{ color:"#d8b66a", textTransform:"uppercase", letterSpacing:".15em", fontSize:12, fontWeight:800 }}>Candidate account</p><h1 style={{ fontSize:36, margin:"8px 0" }}>Welcome back</h1><p style={{ color:"#c2c7d2", lineHeight:1.65 }}>Sign-in will be enabled when the secure server-side identity provider is integrated.</p>
        <form onSubmit={submit} style={{ display:"grid", gap:15 }}>
          <label style={{ display:"grid", gap:7 }}>Email address<input name="email" type="email" autoComplete="email" required style={fieldStyle}/></label>
          <label style={{ display:"grid", gap:7 }}>Password<input name="password" type="password" autoComplete="current-password" required style={fieldStyle}/></label>
          <button type="submit" style={{ padding:14, border:0, borderRadius:12, background:"#d8b66a", color:"#080b14", fontWeight:900, cursor:"pointer" }}>Sign in</button>
        </form>
        {message && <p role="status" style={{ marginTop:16, padding:12, borderRadius:10, background:"rgba(216,182,106,.1)", color:"#f1d99a", lineHeight:1.6 }}>{message}</p>}
        <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginTop:18, fontSize:13 }}><a href="/auth/register" style={{ color:"#d8b66a" }}>Create an account</a><a href="/auth/passwordless" style={{ color:"#d8b66a" }}>Account recovery</a></div>
      </section>
      <p style={{ color:"#8e95a4", fontSize:12, lineHeight:1.6 }}>Prototype notice: the form does not authenticate or transmit credentials.</p>
    </div>
  </main>;
}
const fieldStyle = { width:"100%", boxSizing:"border-box" as const, padding:13, borderRadius:10, border:"1px solid #414757", background:"#101522", color:"#f7f4ec" };
