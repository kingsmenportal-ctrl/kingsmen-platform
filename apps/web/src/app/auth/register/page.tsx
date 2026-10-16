"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmPassword") || "");
    if (!email || password.length < 12 || password !== confirmation || form.get("consent") !== "on") {
      setMessage(password !== confirmation
        ? "The passwords do not match. Check both fields and try again."
        : "Use a valid email, a password of at least 12 characters, and accept the privacy notice.");
      return;
    }
    // Do not persist or transmit credentials. Auth provider integration is not yet verified.
    setMessage("Your form is valid, but registration is not connected to an identity provider. No account was created and no information was sent.");
  }
  return <main style={{ minHeight:"100vh", background:"#080b14", color:"#f7f4ec", padding:"36px 20px", fontFamily:"Inter,system-ui,sans-serif" }}>
    <div style={{ maxWidth:540, margin:"0 auto" }}>
      <a href="/" style={{ color:"#d8b66a", textDecoration:"none", fontWeight:900 }}>← KINGSMEN</a>
      <section style={{ marginTop:30, padding:28, border:"1px solid rgba(216,182,106,.25)", borderRadius:22, background:"rgba(255,255,255,.04)" }}>
        <p style={{ color:"#d8b66a", textTransform:"uppercase", letterSpacing:".15em", fontSize:12, fontWeight:800 }}>Candidate account</p>
        <h1 style={{ fontSize:36, margin:"8px 0" }}>Create your account</h1>
        <p style={{ color:"#c2c7d2", lineHeight:1.65 }}>An account is intended to keep your profile and next actions together. You can use the <a href="/free-destiny-map" style={{ color:"#d8b66a" }}>Free Destiny Map</a> without registering.</p>
        <form onSubmit={submit} style={{ display:"grid", gap:15 }}>
          <label style={{ display:"grid", gap:7 }}>Email address<input name="email" type="email" autoComplete="email" required style={fieldStyle}/></label>
          <label style={{ display:"grid", gap:7 }}>Password (12+ characters)<input name="password" type="password" autoComplete="new-password" minLength={12} required style={fieldStyle}/></label>
          <label style={{ display:"grid", gap:7 }}>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required style={fieldStyle}/></label>
          <label style={{ display:"flex", gap:10, alignItems:"flex-start", color:"#c2c7d2", fontSize:13, lineHeight:1.6 }}><input name="consent" type="checkbox" required style={{ marginTop:4 }}/>I understand that this is a registration interface prototype. Secure account creation is not yet connected, and this form will not send or store my details.</label>
          <button type="submit" style={{ padding:14, border:0, borderRadius:12, background:"#d8b66a", color:"#080b14", fontWeight:900, cursor:"pointer" }}>Validate registration details</button>
        </form>
        {message && <p role="status" aria-live="polite" style={{ marginTop:16, padding:12, borderRadius:10, background:"rgba(216,182,106,.1)", color:"#f1d99a", lineHeight:1.6 }}>{message}</p>}
        <p style={{ color:"#9aa2b1", fontSize:13, marginBottom:0 }}>Already registered? <a href="/auth/login" style={{ color:"#d8b66a" }}>Sign in</a></p>
      </section>
      <p style={{ color:"#8e95a4", fontSize:12, lineHeight:1.6 }}>Do not enter a password you use elsewhere. This page does not create an account, send email, establish a session, or store credentials.</p>
    </div>
  </main>;
}
const fieldStyle = { width:"100%", boxSizing:"border-box" as const, padding:13, borderRadius:10, border:"1px solid #414757", background:"#101522", color:"#f7f4ec" };
