"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthUser = { id?: string; email?: string; user_metadata?: Record<string, unknown> };

function authConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let storageKey = "sb-euhubhhnumtibbyufghm-auth-token";
  try {
    if (url) {
      const projectRef = new URL(url).hostname.split(".")[0];
      if (projectRef) storageKey = `sb-${projectRef}-auth-token`;
    }
  } catch {}
  return { url, anonKey, storageKey };
}

export default function AuthCallbackClient() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("Confirming your Kingsmen sign-in…");

  useEffect(() => {
    let cancelled = false;
    async function complete() {
      const config = authConfig();
      if (!config.url || !config.anonKey) {
        setState("error");
        setMessage("Authentication is not configured for this deployment.");
        return;
      }

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);
      const providerError = hash.get("error_description") || query.get("error_description") || query.get("error");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const tokenType = hash.get("token_type") || "bearer";
      const expiresInValue = Number(hash.get("expires_in") || "3600");
      const expiresIn = Number.isFinite(expiresInValue) && expiresInValue > 0 ? expiresInValue : 3600;
      const expiresAtValue = Number(hash.get("expires_at") || "");
      const expiresAt = Number.isFinite(expiresAtValue) && expiresAtValue > 0
        ? expiresAtValue
        : Math.floor(Date.now() / 1000) + expiresIn;

      // Remove tokens and error details from the visible address immediately; do not log them.
      window.history.replaceState(null, "", window.location.pathname);
      if (providerError) {
        setState("error");
        setMessage("The email-confirmation link could not be completed. It may have expired, or the redirect URL may not be allowed by the Supabase project.");
        return;
      }
      if (!accessToken || !refreshToken) {
        setState("error");
        setMessage("No confirmation session was returned. Confirm the link opens the configured Kingsmen callback URL, then sign in or request a new confirmation email.");
        return;
      }

      try {
        const userResponse = await fetch(`${config.url}/auth/v1/user`, {
          method: "GET",
          headers: { apikey: config.anonKey, Authorization: `Bearer ${accessToken}` },
          cache: "no-store"
        });
        if (!userResponse.ok) throw new Error("The returned session could not be verified.");
        const user = await userResponse.json() as AuthUser;
        if (cancelled) return;

        window.localStorage.setItem(config.storageKey, JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: tokenType,
          expires_in: expiresIn,
          expires_at: expiresAt,
          user
        }));
        setState("success");
        setMessage("Email confirmation completed. Continue to your reusable candidate profile.");
        router.replace("/candidate/profile/");
        router.refresh();
      } catch (caught) {
        if (cancelled) return;
        setState("error");
        setMessage(caught instanceof Error ? caught.message : "The authentication session could not be verified.");
      }
    }
    void complete();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="public-site candidate-page">
      <div className="public-notice"><span aria-hidden="true" /> KINGSMEN CANDIDATE ACCESS</div>
      <div className="public-container candidate-page-body">
        <section className={`candidate-doc-panel max-w-2xl mx-auto ${state === "error" ? "border-amber-300" : ""}`}>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">{state === "checking" ? "Checking session" : state === "success" ? "Session verified" : "Confirmation needs attention"}</p>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-950">{state === "checking" ? "Confirming your account." : state === "success" ? "Account confirmed." : "We could not finish confirmation."}</h1>
          <p role={state === "error" ? "alert" : "status"} aria-live="polite" className="mt-3 text-sm leading-6 text-slate-700">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3"><a className="public-button public-button-gold" href="/candidate/login/">Sign in</a><a className="public-button public-button-outline" href="/candidate/profile/">Candidate profile</a></div>
        </section>
      </div>
    </main>
  );
}
