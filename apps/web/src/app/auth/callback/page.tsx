"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { acceptKingsmenSupabaseAuthCallback, updateKingsmenPassword } from "../../../lib/kingsmen/supabase-session";

export default function KingsmenAuthCallbackPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"checking" | "recovery" | "complete" | "error">("checking");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      const result = acceptKingsmenSupabaseAuthCallback(window.location.hash);
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
      if (result.error || !result.hasSession) {
        if (active) {
          setError(result.error || "The sign-in link was not valid. Request a fresh link and try again.");
          setMode("error");
        }
        return;
      }
      if (result.type === "recovery") {
        if (active) setMode("recovery");
        return;
      }
      if (active) setMode("complete");
      router.replace("/candidate/profile");
    } catch (cause) {
      if (active) {
        setError(cause instanceof Error ? cause.message : "The sign-in link could not be completed.");
        setMode("error");
      }
    }
    return () => { active = false; };
  }, [router]);

  async function submitNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) { setError("Use a password of at least eight characters."); return; }
    if (password !== confirm) { setError("The two password entries do not match."); return; }
    setBusy(true);
    try {
      await updateKingsmenPassword(password);
      setPassword("");
      setConfirm("");
      setMode("complete");
      router.replace("/candidate/profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The password could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900 sm:py-16">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-white p-7 shadow-2xl sm:p-10">
        <a href="/" className="text-xs font-black tracking-[0.24em] text-amber-700">KINGSMEN PORTAL</a>
        {mode === "checking" && <p role="status" className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Verifying your email link…</p>}
        {mode === "complete" && <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Your link has been accepted. Opening your Kingsmen profile…</p>}
        {mode === "error" && <>
          <h1 className="mt-6 text-2xl font-bold text-slate-950">This link could not be used</h1>
          <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-4 text-sm leading-6 text-rose-900">{error}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm"><a className="font-semibold text-amber-800 underline" href="/auth/login">Sign in or request a new reset</a><a className="font-semibold text-slate-700 underline" href="/auth/register">Create account</a></div>
        </>}
        {mode === "recovery" && <>
          <h1 className="mt-6 text-2xl font-bold text-slate-950">Choose a new password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">The recovery link created a short-lived session. Choose a new password to finish resetting access.</p>
          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">{error}</p>}
          <form onSubmit={submitNewPassword} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-800">New password
              <input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password" required minLength={8} maxLength={128} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </label>
            <label className="block text-sm font-semibold text-slate-800">Confirm new password
              <input type="password" value={confirm} onChange={event=>setConfirm(event.target.value)} autoComplete="new-password" required minLength={8} maxLength={128} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </label>
            <button type="submit" disabled={busy} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Updating password…" : "Set new password"}</button>
          </form>
        </>}
      </section>
    </main>
  );
}
