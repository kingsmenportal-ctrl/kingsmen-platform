"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getKingsmenSupabaseBrowserConfig, registerKingsmenWithPassword } from "../../../lib/kingsmen/supabase-session";

export default function KingsmenRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!getKingsmenSupabaseBrowserConfig()) throw new Error("Kingsmen registration is not configured for this deployment.");
      if (password.length < 8) throw new Error("Use a password of at least eight characters.");
      if (password !== confirm) throw new Error("The two password entries do not match.");
      const result = await registerKingsmenWithPassword(email, password);
      setPassword("");
      setConfirm("");
      if (result.sessionCreated) {
        router.replace("/candidate/profile");
      } else {
        setMessage("Your sign-up request was accepted. Check your email for a confirmation link, then return here to sign in. Your Kingsmen candidate profile is created only after you complete the profile form.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Registration could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900 sm:py-16">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="bg-slate-950 p-7 text-white sm:p-10">
          <a href="/" className="text-xs font-black tracking-[0.24em] text-amber-300">KINGSMEN PORTAL</a>
          <h1 className="mt-8 text-3xl font-bold sm:text-4xl">Start with one account.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">Create a reusable Kingsmen identity for the full set of six pathways. You can then complete your profile, consent and verification steps inside the portal.</p>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-300">
            <li>One profile across study, skills and work.</li>
            <li>One application workbench and internal status history.</li>
            <li>Verification before access to identity-gated application planning.</li>
          </ul>
        </aside>
        <div className="p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Candidate registration</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Create your Kingsmen account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your password is processed by Supabase Auth. It is not written into your Kingsmen candidate profile.</p>
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
          {message && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-800">Email address
              <input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" required maxLength={320} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </label>
            <label className="block text-sm font-semibold text-slate-800">Password
              <input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password" required minLength={8} maxLength={128} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </label>
            <label className="block text-sm font-semibold text-slate-800">Confirm password
              <input type="password" value={confirm} onChange={event=>setConfirm(event.target.value)} autoComplete="new-password" required minLength={8} maxLength={128} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-50">{busy ? "Creating account…" : "Create account"}</button>
          </form>
          <p className="mt-5 text-sm text-slate-600">Already have an account? <a href="/auth/login" className="font-semibold text-amber-800 underline underline-offset-4">Sign in</a>.</p>
          <a href="/" className="mt-6 inline-block text-sm text-slate-500 hover:text-slate-900">← Return to Kingsmen Portal</a>
        </div>
      </section>
    </main>
  );
}
