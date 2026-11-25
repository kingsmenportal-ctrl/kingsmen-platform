"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCandidateSessionState, getCandidateSupabaseConfig } from "@/lib/candidate-session";

export function CandidateSessionControl() {
  const router = useRouter();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = getCandidateSessionState();
    setAccountEmail(session.status === "ready" ? session.email || "Candidate session" : null);
  }, []);

  async function signOut() {
    setBusy(true);
    const config = getCandidateSupabaseConfig();
    const session = getCandidateSessionState();
    try {
      if (config && session.status === "ready") {
        await fetch(`${config.url}/auth/v1/logout?scope=local`, {
          method: "POST",
          headers: { apikey: config.anonKey, Authorization: `Bearer ${session.token}` },
          cache: "no-store"
        });
      }
    } catch {
      // Local sign-out must still clear this configured browser session when the network is unavailable.
    } finally {
      try {
        if (config) window.localStorage.removeItem(config.storageKey);
      } catch {
        // Continue navigation even when browser storage is unavailable.
      }
      setAccountEmail(null);
      setBusy(false);
      router.replace("/candidate/login");
      router.refresh();
    }
  }

  if (!accountEmail) {
    return <a href="/candidate/login" className="inline-flex min-h-10 items-center rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-white hover:border-amber-300 hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300">Sign in</a>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="max-w-[180px] truncate text-xs text-slate-300" title={accountEmail}>{accountEmail}</span>
      <button type="button" onClick={signOut} disabled={busy} className="inline-flex min-h-10 items-center rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-white hover:border-amber-300 hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50">{busy ? "Signing out…" : "Sign out"}</button>
    </div>
  );
}
