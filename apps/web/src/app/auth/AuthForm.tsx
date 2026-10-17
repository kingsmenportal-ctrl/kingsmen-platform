"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { linkCandidateAccount, storeKingsmenSession, supabaseAuth, type KingsmenSession } from "../../lib/supabase-browser-auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");\n  const [candidateReference, setCandidateReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice(""); setError("");
    try {
      const data = await supabaseAuth(registering ? "signup" : "token?grant_type=password", registering
        ? { email: email.trim().toLowerCase(), password, data: { display_name: displayName.trim(), portal: "kingsmen" } }
        : { email: email.trim().toLowerCase(), password });
      const session = data as unknown as KingsmenSession;
      if (session.access_token && session.user?.id) {
        storeKingsmenSession(session);
        try {
          const linked = await linkCandidateAccount(candidateReference);
          if (linked.linked) {
            setNotice("Signed in. Your candidate account is linked securely.");
            window.location.assign("/candidate/dashboard");
            return;
          }
          setNotice(linked.message || "Your sign-in is active. Candidate identity linking is pending authorised review; no candidate record was claimed.");
          return;
        } catch (linkError) {
          setNotice(linkError instanceof Error ? linkError.message : "Signed in, but candidate account linking needs attention.");
          return;
        }
      }
      setNotice("Registration received. Check your email for the confirmation link, then return here to sign in. A candidate record is never created or claimed solely from a registration form.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main style={{ maxWidth: 520, margin: "7vh auto", padding: 24, color: "#f4f6ff", fontFamily: "system-ui, sans-serif" }}>
    <p style={{ color: "#a5b4fc", fontWeight: 700, letterSpacing: 2 }}>KINGSMEN PORTAL</p>
    <h1>{registering ? "Create your account" : "Welcome back"}</h1>
    <p style={{ color: "#b8c0d9", lineHeight: 1.6 }}>{registering ? "Create a secure sign-in. Existing candidate records are linked only after authorised identity review and a verified identity link." : "Sign in with your verified portal credentials to continue your candidate journey."}</p>
    <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 24 }}>
      {registering && <label style={{ display: "grid", gap: 6 }}>Full name<input required autoComplete="name" value={displayName} onChange={e => setDisplayName(e.target.value)} style={fieldStyle} /></label>}\n      <label style={{ display: "grid", gap: 6 }}>Existing candidate reference (optional)<input maxLength={100} autoComplete="off" value={candidateReference} onChange={e => setCandidateReference(e.target.value)} style={fieldStyle} /><small style={{ color: "#b8c0d9" }}>This is only a review hint. It does not prove ownership or link your candidate record.</small></label>
      <label style={{ display: "grid", gap: 6 }}>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={fieldStyle} /></label>
      <label style={{ display: "grid", gap: 6 }}>Password<input required type="password" minLength={8} autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} style={fieldStyle} /></label>
      <button disabled={busy} type="submit" style={{ padding: 13, border: 0, borderRadius: 10, background: busy ? "#526078" : "#a5b4fc", color: "#111827", fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>{busy ? "Working…" : registering ? "Create secure account" : "Sign in"}</button>
    </form>
    {error && <p role="alert" style={{ background: "#451a1a", padding: 12, borderRadius: 8 }}>{error}</p>}
    {notice && <p role="status" style={{ background: "#172554", padding: 12, borderRadius: 8, lineHeight: 1.5 }}>{notice}</p>}
    <p style={{ marginTop: 22, color: "#b8c0d9" }}>{registering ? "Already registered?" : "New to Kingsmen?"} <Link style={{ color: "#c7d2fe" }} href={registering ? "/auth/login" : "/auth/register"}>{registering ? "Sign in" : "Create an account"}</Link></p>
    <p><Link style={{ color: "#a5b4fc" }} href="/">Back to portal</Link></p>
  </main>;
}

const fieldStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8, border: "1px solid #39445e", background: "#0f172a", color: "#fff" };
