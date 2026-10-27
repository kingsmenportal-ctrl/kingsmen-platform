"use client";

import { FormEvent, useState } from "react";

const PROJECT_REF = "euhubhhnumtibbyufghm";
const AUTH_URL = `https://${PROJECT_REF}.supabase.co/auth/v1`;
const SESSION_KEY = `sb-${PROJECT_REF}-auth-token`;

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: { id?: string; email?: string };
  msg?: string;
  message?: string;
  error_description?: string;
};

function publicAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export default function CandidateLoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "verify">("email");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const key = publicAnonKey();
    if (!key) {
      setError("Candidate sign-in is not configured on this deployment. No request was sent.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(`${AUTH_URL}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key },
        body: JSON.stringify({ email: email.trim(), create_user: true })
      });
      const body = (await response.json().catch(() => ({}))) as AuthResponse;
      if (!response.ok) {
        setError(body.msg ?? body.message ?? body.error_description ?? "A sign-in code could not be sent.");
        return;
      }
      setStage("verify");
      setNotice("If this address is eligible, a sign-in code has been sent. Check your email and spam folder.");
    } catch {
      setError("Kingsmen could not reach the sign-in service. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const key = publicAnonKey();
    if (!key) {
      setError("Candidate sign-in is not configured on this deployment. No verification was attempted.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(`${AUTH_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key },
        body: JSON.stringify({ email: email.trim(), token: otp.trim(), type: "email" })
      });
      const body = (await response.json().catch(() => ({}))) as AuthResponse;
      if (!response.ok || !body.access_token || !body.refresh_token || !body.user?.id) {
        setError(body.msg ?? body.message ?? body.error_description ?? "The code was invalid or expired. No session was created.");
        return;
      }
      const expiresIn = Number(body.expires_in ?? 3600);
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          access_token: body.access_token,
          refresh_token: body.refresh_token,
          token_type: body.token_type ?? "bearer",
          expires_in: expiresIn,
          expires_at: Math.floor(Date.now() / 1000) + expiresIn,
          user: body.user
        })
      );
      window.location.assign("/candidate/identity-review");
    } catch {
      setError("Kingsmen could not complete sign-in. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Kingsmen Candidate Portal
        </p>
        <h1 className="mt-3 text-3xl font-bold">Secure sign-in</h1>
        <p className="mt-3 leading-7 text-slate-300">
          Use your email to receive a one-time code. You will need access to that
          mailbox to complete sign-in. Never share the code with another person.
        </p>

        {stage === "email" ? (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
            <label htmlFor="email" className="block font-semibold">Email address</label>
            <input
              id="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
            <button disabled={busy} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-60">
              {busy ? "Sending…" : "Email me a sign-in code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            <p className="text-sm text-slate-300">Code requested for <strong>{email}</strong></p>
            <label htmlFor="otp" className="block font-semibold">One-time email code</label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              minLength={4}
              maxLength={12}
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
            />
            <button disabled={busy} className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-60">
              {busy ? "Verifying…" : "Verify code and continue"}
            </button>
            <button type="button" disabled={busy} onClick={() => { setStage("email"); setOtp(""); setError(""); }} className="w-full rounded-xl border border-slate-700 px-4 py-3">
              Use a different email
            </button>
          </form>
        )}

        {notice ? <p role="status" className="mt-5 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-emerald-200">{notice}</p> : null}
        {error ? <p role="alert" className="mt-5 rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-rose-200">{error}</p> : null}
        <p className="mt-5 text-xs leading-5 text-slate-500">
          Email delivery and account creation depend on the configured Supabase Auth
          settings. A successful code verification is required before a candidate
          review request can be submitted.
        </p>
      </section>
    </main>
  );
}
