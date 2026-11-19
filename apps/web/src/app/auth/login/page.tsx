"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getKingsmenSupabaseBrowserConfig, requestKingsmenPasswordReset, signInKingsmenWithPassword } from "../../../lib/kingsmen/supabase-session";

export default function KingsmenLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!getKingsmenSupabaseBrowserConfig()) throw new Error("Kingsmen authentication is not configured for this deployment.");
      if (mode === "reset") {
        if (!email.trim()) throw new Error("Enter the email address for your Kingsmen account.");
        await requestKingsmenPasswordReset(email);
        setMessage("If this email belongs to an eligible account, a password-reset email has been requested. Check your inbox and spam folder.");
      } else {
        await signInKingsmenWithPassword(email, password);
        setPassword("");
        router.replace("/candidate/profile");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900 sm:py-16">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="bg-slate-950 p-7 text-white sm:p-10">
          <a href="/" className="text-xs font-black tracking-[0.24em] text-amber-300">KINGSMEN PORTAL</a>
          <h1 className="mt-8 text-3xl font-bold sm:text-4xl">{mode === "login" ? "Return to your plan." : "Recover your access."}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">One candidate profile and one application workbench across Higher Education, TVET, SETA programmes, internships, apprenticeships and employment.</p>
          <p className="mt-7 text-xs leading-6 text-slate-400">Your password is sent only to the configured Supabase Auth endpoint over HTTPS. Kingsmen does not store it in the candidate profile.</p>
        </aside>
        <div className="p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">{mode === "login" ? "Candidate sign in" : "Password reset"}</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">{mode === "login" ? "Sign in to Kingsmen" : "Request a reset email"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{mode === "login" ? "Use the email and password for your Kingsmen account." : "We'll request a reset email through Supabase Auth if the account is eligible."}</p>
          {error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" role="alert">{error}</p>}
          {message && <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{message}</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-800">Email address
              <input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" required maxLength={320} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </label>
            {mode === "login" && <label className="block text-sm font-semibold text-slate-800">Password
              <input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password" required minLength={8} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </label>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Send reset email"}</button>
          </form>
          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
            {mode === "login"
              ? <button type="button" onClick={()=>{setMode("reset");setError("");setMessage("");}} className="font-semibold text-slate-700 underline underline-offset-4">Forgot password?</button>
              : <button type="button" onClick={()=>{setMode("login");setError("");setMessage("");}} className="font-semibold text-slate-700 underline underline-offset-4">Back to sign in</button>}
            <a href="/auth/register" className="font-semibold text-amber-800 underline underline-offset-4">Create an account</a>
          </div>
          <a href="/" className="mt-8 inline-block text-sm text-slate-500 hover:text-slate-900">← Return to Kingsmen Portal</a>
        </div>
      </section>
    </main>
  );
}
