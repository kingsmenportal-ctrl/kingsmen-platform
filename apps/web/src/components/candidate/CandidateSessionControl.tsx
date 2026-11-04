"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function sessionConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let storageKey = "sb-euhubhhnumtibbyufghm-auth-token";
  try {
    if (url) {
      const ref = new URL(url).hostname.split(".")[0];
      if (ref) storageKey = `sb-${ref}-auth-token`;
    }
  } catch {}
  return { url, anonKey, storageKey };
}

export function CandidateSessionControl() {
  const router = useRouter();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const config = sessionConfig();
      const raw = window.localStorage.getItem(config.storageKey);
      const session = raw ? JSON.parse(raw) as { access_token?: string; expires_at?: number; user?: { email?: string } } : null;
      if (session?.access_token && typeof session.expires_at === "number" && session.expires_at > Math.floor(Date.now() / 1000)) {
        setAccountEmail(session.user?.email || "Candidate session");
      } else {
        setAccountEmail(null);
      }
    } catch {
      setAccountEmail(null);
    }
  }, []);

  async function signOut() {
    setBusy(true);
    const config = sessionConfig();
    try {
      const raw = window.localStorage.getItem(config.storageKey);
      const session = raw ? JSON.parse(raw) as { access_token?: string } : null;
      if (config.url && config.anonKey && session?.access_token) {
        await fetch(`${config.url}/auth/v1/logout?scope=local`, {
          method: "POST",
          headers: { apikey: config.anonKey, Authorization: `Bearer ${session.access_token}` },
          cache: "no-store"
        });
      }
    } catch {
      // Local sign-out must still clear this browser session when the network is unavailable.
    } finally {
      window.localStorage.removeItem(config.storageKey);
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
