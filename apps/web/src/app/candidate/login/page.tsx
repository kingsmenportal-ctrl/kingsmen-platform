"use client";

import { FormEvent, useState } from "react";

export default function CandidateLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recovering, setRecovering] = useState(false);
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
      if (!base || !key) throw new Error("Candidate sign-in is not configured for this deployment.");
      if (recovering) {
        const response = await fetch(`${base}/auth/v1/recover`, {
          method: "POST",
          headers: { apikey: key, "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() })
        });
        if (!response.ok) throw new Error("Password recovery could not be started. Check the email address or contact support.");
        setMessage("If this email belongs to an account, Supabase Auth will send the configured password-recovery message.");
        return;
      }
      const response = await fetch(`${base}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const session = await response.json();
      if (!response.ok || typeof session.access_token !== "string" || typeof session.refresh_token !== "string") {
        throw new Error(session.msg || session.message || session.error_description || "Sign-in failed. Check your details and try again.");
      }
      const ref = new URL(base).hostname.split(".")[0];
      const expiresAt = typeof session.expires_at === "number"
        ? session.expires_at
        : Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600);
      window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({ ...session, expires_at: expiresAt }));
      const requested = new URLSearchParams(window.location.search).get("next") || "/candidate/workbench";
      const next = requested.startsWith("/candidate/") && !requested.startsWith("//") ? requested : "/candidate/workbench";
      window.location.assign(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.22em] text-amber-700">Kingsmen Candidate Portal</p>
        <h1 className="mt-3 text-3xl font-black">{recovering ? "Recover your account" : "Sign in securely"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use your existing Kingsmen/Supabase Auth account. Identity linking is a separate authorised review; signing in does not automatically link your account to a candidate record.
        </p>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
        {message && <p role="status" className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">Email address
            <input className={inputClass} type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} />
          </label>
          {!recovering && <label className="block text-sm font-semibold">Password
            <input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} />
          </label>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white disabled:opacity-50">
            {busy ? "Please wait…" : recovering ? "Send recovery instructions" : "Sign in to Kingsmen"}
          </button>
        </form>
        <button type="button" onClick={()=>{setRecovering(v=>!v);setError("");setMessage("");}} className="mt-4 text-sm font-semibold text-amber-800 underline underline-offset-4">
          {recovering ? "Return to sign in" : "Forgot your password?"}
        </button>
        <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
          Session tokens are stored using the existing Supabase Auth browser-session key so the authenticated candidate APIs can use them. Never share your password or access token. If your identity is not approved, the portal must keep candidate data locked until authorised review is complete.
        </p>
      </section>
    </main>
  );
}
