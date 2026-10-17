"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmPassword") || "");
    if (!email || password.length < 12 || password !== confirmation || form.get("consent") !== "on") {
      setMessage(password !== confirmation ? "The passwords do not match. Check both fields and try again." : "Use a valid email, a password of at least 12 characters, and accept the privacy notice."); return;
    }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "Registration is unavailable."); return; }
      setMessage(result.confirmationRequired ? result.message : "Account created. You can now sign in.");
    } catch { setMessage("Could not reach the authentication service. Try again later."); }
    finally { setBusy(false); }
  }
  return <main style={{ minHeight:"100vh", background:"#080b14", color:"#f7f4ec", padding:"36px 20px", fontFamily:"Inter,system-ui,sans-serif" }}>
    <div style={{ maxWidth:540, margin:"0 auto" }}>
      <a href="/" style={{ color:"#d8b66a", textDecoration:"none", fontWeight:900 }}>← KINGSMEN</a>
      <section style={{ marginTop:30, padding:28, border:"1px solid rgba(216,182,106,.25)", borderRadius:22, background:"rgba(255,255,255,.04)" }}>
        <p style={{ color:"#d8b66a", textTransform:"uppercase", letterSpacing:".15em", fontSize:12, fontWeight:800 }}>Candidate account</p>
        <h1 style={{ fontSize:36, margin:"8px 0" }}>Create your account</h1>
        <p style={{ color:"#c2c7d2", lineHeight:1.65 }}>Registration uses the configured server-side Supabase Auth project. Candidate data features remain restricted until owner-scoped access is verified.</p>
        <form onSubmit={submit} style={{ display:"grid", gap:15 }}>
          <label style={{ display:"grid", gap:7 }}>Email address<input name="email" type="email" autoComplete="email" required style={fieldStyle}/></label>
          <label style={{ display:"grid", gap:7 }}>Password (12+ characters)<input name="password" type="password" autoComplete="new-password" minLength={12} required style={fieldStyle}/></label>
          <label style={{ display:"grid", gap:7 }}>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required style={fieldStyle}/></label>
          <label style={{ display:"flex", alignItems:"flex-start", gap:10, color:"#c2c7d2", fontSize:13, lineHeight:1.5 }}><input name="consent" type="checkbox" required style={{ marginTop:3 }}/>I have read the privacy notice and understand that account creation does not verify my identity or guarantee any outcome.</label>
          <button disabled={busy} type="submit" style={{ padding:14, border:0, borderRadius:12, background:"#d8b66a", color:"#080b14", fontWeight:900 }}>{busy ? "Creating account…" : "Create account"}</button>
        </form>
        {message && <p role="status" aria-live="polite" style={{ marginTop:16, color:"#f1d99a", lineHeight:1.6 }}>{message}</p>}
        <p style={{ marginTop:18, fontSize:13 }}>Already registered? <a href="/auth/login" style={{ color:"#d8b66a" }}>Sign in</a></p>
      </section>
    </div>
  </main>;
}
const fieldStyle = { width:"100%", boxSizing:"border-box" as const, padding:13, borderRadius:10, border:"1px solid #414757", background:"#101522", color:"#f7f4ec" };
