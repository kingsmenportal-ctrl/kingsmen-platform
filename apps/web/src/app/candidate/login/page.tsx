"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type Mode = "login" | "register" | "recover";

function storeSession(base: string, session: Record<string, unknown>) {
  if (typeof session.access_token !== "string" || typeof session.refresh_token !== "string") return false;
  const ref = new URL(base).hostname.split(".")[0];
  const expiresAt = typeof session.expires_at === "number"
    ? session.expires_at
    : Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
  window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({ ...session, expires_at: expiresAt }));
  return true;
}

function safeNextPath() {
  const requested = new URLSearchParams(window.location.search).get("next") || "/candidate/workbench";
  return requested.startsWith("/candidate/") && !requested.startsWith("//")
    ? requested
    : "/candidate/workbench";
}

export default function CandidateLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!base || !key) throw new Error("Candidate authentication is not configured for this deployment.");

      if (mode === "recover") {
        const response = await fetch(`${base}/auth/v1/recover`, {
          method: "POST",
          headers: { apikey: key, "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() })
        });
        if (!response.ok) throw new Error("Password recovery could not be started. Check the details or contact support.");
        setMessage("If this email belongs to an account, the configured recovery message will be sent.");
        return;
      }

      if (mode === "register") {
        if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
        const response = await fetch(`${base}/auth/v1/signup`, {
          method: "POST",
          headers: { apikey: key, "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.msg || result.message || result.error_description || "Account registration could not be completed. Check the details or contact support.");
        }
        if (storeSession(base, result)) {
          window.location.assign(safeNextPath());
          return;
        }
        setMessage("Registration was received. Check your email for any required confirmation, then return here to sign in. If you already have a Kingsmen account, use that account rather than creating a duplicate.");
        setMode("login");
        setPassword("");
        return;
      }

      const response = await fetch(`${base}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const session = await response.json();
      if (!response.ok || !storeSession(base, session)) {
        throw new Error(session.msg || session.message || session.error_description || "Sign-in failed. Check your details and try again.");
      }
      window.location.assign(safeNextPath());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to complete the authentication request.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
  const title = mode === "recover" ? "Recover your account" : mode === "register" ? "Create your account" : "Sign in securely";

  return (
    <main className="min-h-screen bg-[#071426] px-4 py-10 text-[#f4f0e6]">
      <section className="mx-auto max-w-lg rounded-3xl border border-amber-300/20 bg-white p-6 text-slate-900 shadow-xl sm:p-8">
        <a href="/candidate" className="text-xs font-black uppercase tracking-[.22em] text-amber-800">Kingsmen One · Candidate Portal</a>
        <h1 className="mt-3 text-3xl font-black">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use your existing Kingsmen/Supabase Auth account where possible. Account sign-in does not automatically link you to a candidate record; linking requires a separate authorised identity review.
        </p>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">Email address
            <input className={inputClass} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} maxLength={254} />
          </label>
          {mode !== "recover" && <label className="block text-sm font-semibold">Password
            <input className={inputClass} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} />
          </label>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white disabled:opacity-50">
            {busy ? "Please wait…" : mode === "recover" ? "Send recovery instructions" : mode === "register" ? "Create candidate account" : "Sign in to Kingsmen"}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-amber-800">
          {mode !== "login" && <button type="button" onClick={() => { setMode("login"); setError(""); setMessage(""); setPassword(""); }}>Return to sign in</button>}
          {mode === "login" && <button type="button" onClick={() => { setMode("recover"); setError(""); setMessage(""); }}>Forgot your password?</button>}
          {mode === "login" && <button type="button" onClick={() => { setMode("register"); setError(""); setMessage(""); }}>Create an account</button>}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">Need to connect this sign-in to an existing Kingsmen candidate record? <a className="font-bold text-amber-800 underline" href="/candidate/identity-review">Submit an identity-review request</a>. Approval requires authorised evidence review. Do not create a duplicate account to bypass this process.</p>
        <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
          Session tokens are stored using the existing Supabase Auth browser-session key for compatibility with candidate APIs. Never share your password or access token. Candidate data must remain locked until authorised identity resolution succeeds.
        </p>
      </section>
    </main>
  );
}
