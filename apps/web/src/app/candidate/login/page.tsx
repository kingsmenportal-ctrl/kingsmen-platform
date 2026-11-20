"use client";

import { useState, type FormEvent } from "react";
import { saveSupabaseSession } from "@/lib/candidate-session";

type Mode = "signin" | "signup" | "recover";

type AuthUser = {
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: AuthUser;
  msg?: string;
  message?: string;
  error_description?: string;
  [key: string]: unknown;
};

function authConfig(): { url: string; anonKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return null;
    return { url: url.origin, anonKey };
  } catch {
    return null;
  }
}

async function authRequest(path: string, payload: Record<string, unknown>): Promise<AuthResponse> {
  const config = authConfig();
  if (!config) throw new Error("Kingsmen sign-in is not configured for this deployment.");
  const response = await fetch(`${config.url}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: config.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  const body = await response.json().catch(() => ({})) as AuthResponse;
  if (!response.ok) {
    const message = body.msg ?? body.message ?? body.error_description;
    throw new Error(typeof message === "string" ? message : "Authentication failed. Check your details and try again.");
  }
  return body;
}

function isEmailConfirmed(user?: AuthUser): boolean {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

export default function CandidateLoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
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
      const normalisedEmail = email.trim().toLowerCase();
      if (!normalisedEmail) throw new Error("Enter your email address.");

      if (mode === "recover") {
        await authRequest(`recover?redirect_to=${encodeURIComponent(window.location.origin + "/candidate/login")}`, { email: normalisedEmail });
        setMessage("If an account uses that address, password-recovery instructions will be sent to it.");
        return;
      }

      if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
      const body = mode === "signin"
        ? await authRequest("token?grant_type=password", { email: normalisedEmail, password })
        : await authRequest("signup", { email: normalisedEmail, password });

      if (!body.access_token) {
        setMessage(mode === "signup"
          ? "Registration was received. Check your email for any required confirmation link, then sign in. Your Kingsmen profile is created separately after sign-in and consent."
          : "No active session was returned. Confirm your email if required, then sign in again.");
        return;
      }
      if (!isEmailConfirmed(body.user)) {
        setMessage("Your email must be confirmed before Kingsmen can create a candidate profile. Check the confirmation email, then return here to sign in.");
        return;
      }
      if (!saveSupabaseSession(body)) throw new Error("Your session could not be saved in this browser. Check browser storage settings and retry.");
      window.location.assign("/candidate/profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const heading = mode === "signin" ? "Sign in to Kingsmen" : mode === "signup" ? "Create your Kingsmen account" : "Recover your account";

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-[0.85fr_1.15fr]">
        <aside className="bg-slate-950 p-7 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">KINGSMEN PORTAL</p>
          <h1 className="mt-6 text-3xl font-black leading-tight">One account.<br />Six pathways.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">Create your reusable profile once, explore verified opportunities and manage your applications inside Kingsmen.</p>
          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <p>Higher Education</p><p>TVET</p><p>SETA programmes &amp; learnerships</p><p>Internships</p><p>Apprenticeships</p><p>Employment</p>
          </div>
        </aside>

        <section className="p-6 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-950">{heading}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your account authenticates through Kingsmen&apos;s connected Supabase Auth project. Creating an account does not automatically link it to an older candidate record.
          </p>

          <div className="mt-6 flex flex-wrap gap-2" aria-label="Authentication options">
            <button type="button" onClick={() => { setMode("signin"); setError(""); setMessage(""); }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "signin" ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}>
              Sign in
            </button>
            <button type="button" onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "signup" ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}>
              Create account
            </button>
            <button type="button" onClick={() => { setMode("recover"); setError(""); setMessage(""); }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "recover" ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`}>
              Forgot password
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-800">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}
                value={email} onChange={e => setEmail(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </div>

            {mode !== "recover" ? (
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-800">Password</label>
              <input id="password" name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
            </div>
            ) : null}

            {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
            {message ? <p role="status" aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-slate-800">{message}</p> : null}

            <button type="submit" disabled={busy}
              className="min-h-12 w-full rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send recovery instructions"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            After sign-in, continue to <a className="font-semibold text-slate-900 underline" href="/candidate/profile">My Profile</a>. Kingsmen never links an account to an existing candidate solely because the email addresses match.
          </p>
        </section>
      </div>
    </main>
  );
}
