"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request could not be completed.");
      if (mode === "register") {
        setMessage(result.message || "Account request completed. Check your email.");
      } else {
        setMessage("Signed in. Opening your portal…");
        router.replace("/candidate");
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#050816", color: "#f5f7ff", fontFamily: "system-ui, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 440, padding: 32, border: "1px solid #28314a", borderRadius: 20, background: "#0b1021", boxSizing: "border-box" }}>
        <a href="/" style={{ color: "#9caed4", textDecoration: "none", fontSize: 14 }}>← Kingsmen Portal</a>
        <p style={{ color: "#8da7ff", fontSize: 12, fontWeight: 700, letterSpacing: 2, marginTop: 28 }}>K I N G S M E N</p>
        <h1 style={{ fontSize: 30, margin: "8px 0" }}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p style={{ color: "#aeb8d1", lineHeight: 1.5, marginBottom: 24 }}>
          {mode === "login" ? "Sign in to continue to your candidate workspace." : "Create a secure account to begin your candidate journey."}
        </p>
        <form onSubmit={submit}>
          <label htmlFor="email" style={{ display: "block", fontSize: 13, marginBottom: 8 }}>Email address</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <label htmlFor="password" style={{ display: "block", fontSize: 13, margin: "18px 0 8px" }}>Password</label>
          <input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 8 : 12} maxLength={1024} required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          {mode === "register" && <p style={{ color: "#8f9ab5", fontSize: 12 }}>Use at least 12 characters. Email verification may be required.</p>}
          <button type="submit" disabled={busy} style={buttonStyle}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        {message && <p role="status" style={{ color: "#c4d0ee", fontSize: 14, lineHeight: 1.5, overflowWrap: "anywhere" }}>{message}</p>}
        <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }} style={{ marginTop: 16, width: "100%", background: "transparent", color: "#aebeff", border: 0, cursor: "pointer", padding: 10 }}>
          {mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}
        </button>
        <p style={{ color: "#7885a4", fontSize: 11, lineHeight: 1.5, marginTop: 20 }}>
          Candidate profiles and existing records are not linked automatically by email. Verified identity provisioning is required before private candidate data is available.
        </p>
      </section>
    </main>
  );
}

const inputStyle = {
  boxSizing: "border-box" as const,
  width: "100%",
  border: "1px solid #34405e",
  borderRadius: 10,
  padding: "13px 14px",
  background: "#070b17",
  color: "#f5f7ff",
  fontSize: 15,
  outline: "none"
};

const buttonStyle = {
  width: "100%",
  marginTop: 24,
  border: 0,
  borderRadius: 10,
  padding: "14px 16px",
  background: "#8da7ff",
  color: "#071025",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer"
};
