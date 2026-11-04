"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

type AuthResult = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  user?: { id?: string; email?: string; user_metadata?: Record<string, unknown> };
  msg?: string;
  message?: string;
  error?: string;
  error_description?: string;
};

function getAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  let storageKey = "sb-euhubhhnumtibbyufghm-auth-token";
  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    if (projectRef) storageKey = `sb-${projectRef}-auth-token`;
  } catch {
    // The request below will surface an invalid URL configuration.
  }
  return { url, anonKey, storageKey };
}

export function CandidateAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const config = getAuthConfig();
    if (!config) {
      setError("Authentication is not configured for this deployment. Set the public Supabase URL and anon key for the staging site.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();

    if (!email || !password) {
      setError("Enter your email address and password.");
      return;
    }
    if (isRegister && password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const endpoint = isRegister
        ? `${config.url}/auth/v1/signup?redirect_to=${encodeURIComponent(window.location.origin + "/auth/callback")}`
        : `${config.url}/auth/v1/token?grant_type=password`;
      const payload = isRegister
        ? { email, password, data: fullName ? { full_name: fullName } : {} }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      let body: AuthResult = {};
      try { body = await response.json() as AuthResult; } catch { body = {}; }

      if (!response.ok) {
        throw new Error(body.error_description || body.msg || body.message || body.error || "Authentication could not be completed.");
      }

      if (body.access_token && body.refresh_token) {
        const expiresIn = typeof body.expires_in === "number" ? body.expires_in : 3600;
        const expiresAt = typeof body.expires_at === "number"
          ? body.expires_at
          : Math.floor(Date.now() / 1000) + expiresIn;
        window.localStorage.setItem(config.storageKey, JSON.stringify({
          access_token: body.access_token,
          refresh_token: body.refresh_token,
          token_type: body.token_type || "bearer",
          expires_in: expiresIn,
          expires_at: expiresAt,
          user: body.user ?? null
        }));
        router.replace("/candidate/dashboard");
        router.refresh();
        return;
      }

      if (isRegister && body.user) {
        setNotice("Your account request was received. Check your inbox and use the confirmation link to return to Kingsmen. If confirmation is enabled, the configured callback redirect must be allowed in Supabase Auth. A candidate profile is not created until you complete profile setup.");
        return;
      }

      throw new Error("The authentication service returned no active session. Check the response and your email-confirmation settings.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3 rounded focus:outline-none focus:ring-2 focus:ring-amber-300">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-slate-950">K</span>
            <span><strong className="block text-sm tracking-[0.18em]">KINGSMEN</strong><span className="mt-1 block text-xs text-slate-300">CANDIDATE ACCESS</span></span>
          </a>
          <a href="/free-destiny-map/" className="text-sm font-semibold text-slate-200 hover:text-amber-200">Explore before signing in</a>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-16">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-700">One profile · Six pathways</p>
          <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{isRegister ? "Create your Kingsmen account." : "Continue your Kingsmen journey."}</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">Use one account for your candidate workspace. Discover higher education, TVET, SETA programmes and learnerships, internships, apprenticeships and employment routes.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4"><strong className="block text-sm">Access without narrowing your future</strong><p className="mt-2 text-sm leading-6 text-slate-600">A service plan affects managed capacity, not pathway discovery.</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-4"><strong className="block text-sm">Evidence before status</strong><p className="mt-2 text-sm leading-6 text-slate-600">The UI cannot claim an application was received or a payment settled without evidence.</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_65px_rgba(8,17,33,0.1)] sm:p-8">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <a href="/candidate/login" aria-current={!isRegister ? "page" : undefined} className={`flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-bold ${!isRegister ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>Sign in</a>
            <a href="/auth/register" aria-current={isRegister ? "page" : undefined} className={`flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-bold ${isRegister ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>Create account</a>
          </div>
          <h2 className="mt-6 text-2xl font-extrabold">{isRegister ? "Create account" : "Welcome back"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{isRegister ? "Register with your email. Use an email address you can access." : "Sign in to continue to your candidate dashboard."}</p>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            {isRegister ? <label className="text-sm font-semibold text-slate-800">Full name (optional)<input name="fullName" autoComplete="name" maxLength={100} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" /></label> : null}
            <label className="text-sm font-semibold text-slate-800">Email address<input name="email" type="email" required autoComplete="email" maxLength={254} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" /></label>
            <label className="text-sm font-semibold text-slate-800">Password<input name="password" type="password" required minLength={isRegister ? 8 : undefined} autoComplete={isRegister ? "new-password" : "current-password"} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" /></label>
            {isRegister ? <p className="text-xs leading-5 text-slate-500">Use a unique password. Kingsmen does not need your banking or identity-document details to create an account.</p> : null}
            {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900">{error}</p> : null}
            {notice ? <p role="status" aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-slate-800">{notice}</p> : null}
            <button disabled={busy} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"} <span aria-hidden="true" className="ml-2">→</span></button>
          </form>
          <p className="mt-5 text-xs leading-5 text-slate-500">Authentication is sent directly to the configured Supabase Auth endpoint using the public anon key. Candidate data access still depends on backend authorisation and row-level security. This UI does not guarantee that profile, documents or application data are persisted.</p>
        </section>
      </div>
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-500">© Kingsmen Portal · South Africa</footer>
    </main>
  );
}
