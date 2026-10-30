"use client";

import { FormEvent, useEffect, useState } from "react";

type Mode = "signin" | "register" | "recover";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function responseError(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const message = value.msg ?? value.message ?? value.error_description ?? value.error;
    if (typeof message === "string" && message.trim()) return message.slice(0, 240);
  }
  return "The authentication request could not be completed.";
}

function saveSession(session: Record<string, unknown>) {
  if (!SUPABASE_URL) throw new Error("NOT_CONFIGURED");
  const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
  if (!ref) throw new Error("NOT_CONFIGURED");
  window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
}

function candidateRedirect(fallback = "/candidate/dashboard"): string {
  const requested = new URLSearchParams(window.location.search).get("next") ?? fallback;
  return requested.startsWith("/candidate/") && !requested.startsWith("//")
    ? requested
    : fallback;
}

export default function CandidateLoginPage() {
  // Supabase email-confirmation links in the current REST signup flow return a
  // short-lived session in the URL fragment. Consume it once, validate the access
  // token against Auth, store the session, and remove tokens from browser history.
  useEffect(() => {
    const fragment = window.location.hash.startsWith("#")
      ? new URLSearchParams(window.location.hash.slice(1))
      : new URLSearchParams();
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    const callbackError = fragment.get("error_description") ?? fragment.get("error");
    const callbackType = fragment.get("type");
    const clearFragment = () => window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );

    if (callbackError) {
      clearFragment();
      setNotice("Email confirmation could not be completed. Sign in again or request a new confirmation email.");
      return;
    }
    if (!accessToken && !refreshToken) {
      if (new URLSearchParams(window.location.search).has("code")) {
        setNotice("The confirmation link returned a code-based session this page cannot exchange. Please sign in to continue; your candidate record will not be linked automatically.");
      }
      return;
    }
    if (callbackType === "recovery") {
      clearFragment();
      setNotice("This is a password-recovery link. Use the recovery process to restore access; it does not complete candidate identity verification.");
      return;
    }
    if (!accessToken || !refreshToken || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      clearFragment();
      setNotice("Email confirmation returned an incomplete session. Please sign in again.");
      return;
    }

    let active = true;
    const finishConfirmation = async () => {
      try {
        const response = await fetch(new URL("/auth/v1/user", SUPABASE_URL).toString(), {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
          redirect: "error"
        });
        const user = await response.json().catch(() => null);
        if (!response.ok || !user || typeof user.id !== "string") {
          clearFragment();
          if (active) setNotice("Email confirmation could not establish a valid session. Please sign in again.");
          return;
        }
        const expiresInValue = Number(fragment.get("expires_in") ?? 3600);
        const expiresIn = Number.isFinite(expiresInValue) && expiresInValue > 0 ? expiresInValue : 3600;
        const expiresAtValue = Number(fragment.get("expires_at"));
        const expiresAt = Number.isFinite(expiresAtValue) && expiresAtValue > 0
          ? expiresAtValue
          : Math.floor(Date.now() / 1000) + expiresIn;
        const next = candidateRedirect("/candidate/profile");
        saveSession({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn,
          expires_at: expiresAt,
          token_type: fragment.get("token_type") ?? "bearer",
          user
        });
        clearFragment();
        if (active) window.location.assign(next);
      } catch {
        clearFragment();
        if (active) setNotice("Email confirmation is temporarily unavailable. Please sign in again.");
      }
    };
    void finishConfirmation();
    return () => { active = false; };
  }, []);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setNotice("Authentication is not configured for this deployment.");
      return;
    }
    if (!email.trim()) {
      setNotice("Enter your email address.");
      return;
    }
    if (mode !== "recover" && password.length < 8) {
      setNotice("Use a password of at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const base = SUPABASE_URL.replace(/\/+$/, "");
      const registrationReturn = `${window.location.origin}/candidate/login?next=%2Fcandidate%2Fprofile`;
      const endpoint = mode === "signin"
        ? `${base}/auth/v1/token?grant_type=password`
        : mode === "register"
          ? `${base}/auth/v1/signup?redirect_to=${encodeURIComponent(registrationReturn)}`
          : `${base}/auth/v1/recover?redirect_to=${encodeURIComponent(`${window.location.origin}/candidate/login`)}`;
      const payload: Record<string, unknown> = { email: email.trim() };
      if (mode !== "recover") payload.password = password;
      const result = await fetch(endpoint, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        redirect: "error"
      });
      let data: unknown = {};
      try { data = await result.json(); } catch { /* handled below using status */ }
      if (!result.ok) {
        setNotice(responseError(data));
        return;
      }
      if (mode === "recover") {
        setNotice("If the address is registered, password-recovery instructions will be sent by email.");
        return;
      }
      if (mode === "register") {
        const candidate = data as Record<string, unknown>;
        const session = (candidate.session && typeof candidate.session === "object")
          ? candidate.session as Record<string, unknown>
          : (candidate.access_token ? candidate : null);
        if (session && typeof session.access_token === "string") {
          saveSession(session);
          setNotice("Account created. Kingsmen identity linking still requires an authorised identity review; registration does not automatically link you to a candidate record.");
          window.location.assign(candidateRedirect("/candidate/profile"));
          return;
        }
        setNotice("Registration received. Check your email to complete authentication. Your account does not automatically link you to a candidate record; that requires authorised identity review.");
        setMode("signin");
        return;
      }
      const session = data as Record<string, unknown>;
      if (typeof session.access_token !== "string") {
        setNotice("Authentication returned no usable session.");
        return;
      }
      saveSession(session);
      window.location.assign(candidateRedirect());
    } catch {
      setNotice("Authentication is temporarily unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Sign in to Kingsmen"
    : mode === "register" ? "Create your Kingsmen account" : "Recover access";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <section className="mx-auto w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Kingsmen Portal</p>
        <h1 className="mt-3 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Your account gives you access to the unified Kingsmen portal. Sensitive candidate records are available only after an authorised identity link is verified.
        </p>

        <form className="mt-7 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-200">
            Email address
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              autoComplete="email"
              inputMode="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {mode !== "recover" && (
            <label className="block text-sm font-medium text-slate-200">
              Password
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          )}
          <button
            className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={busy}
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Send recovery email"}
          </button>
        </form>

        {notice && <p role="status" className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-200">{notice}</p>}

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-cyan-300">
          {mode !== "signin" && <button type="button" onClick={() => { setNotice(""); setMode("signin"); }}>Sign in</button>}
          {mode !== "register" && <button type="button" onClick={() => { setNotice(""); setMode("register"); }}>Create account</button>}
          {mode !== "recover" && <button type="button" onClick={() => { setNotice(""); setMode("recover"); }}>Forgot password?</button>}
        </div>

        <p className="mt-7 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-400">
          Kingsmen does not infer candidate identity from email equality. Personalised records remain restricted until the verified identity-review workflow links your authenticated user to a candidate record.
        </p>
      </section>
    </main>
  );
}
