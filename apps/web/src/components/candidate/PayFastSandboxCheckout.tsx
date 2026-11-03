"use client";

import { useState } from "react";

type CheckoutIntent = {
  paymentUrl?: string;
  fields?: Record<string, string>;
  signature?: string;
  intentRef?: string;
  merchantReference?: string;
};
type CheckoutResponse = {
  intent?: CheckoutIntent;
  error?: string;
  note?: string;
  orderStatus?: string;
  paymentStatus?: string;
  reused?: boolean;
};

const ALLOWED_PLAN_CODES = new Set([
  "ARTISAN_CHARTER_R149_99",
  "FOUNDATIONAL_ACCORD_R169_99",
  "GUILDMASTERS_CHARTER_R199_99",
  "COLLEGIATE_ORDINANCE_R299_99",
  "CHANCELLORS_WRIT_R399_99",
  "REGENCY_MANDATE_R469_99",
  "CV_REVAMP_R49_99"
]);

function getAuthContext(): { url: string; anonKey: string; token: string } | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    const projectRef = new URL(url).hostname.split(".")[0];
    const storageKey = projectRef ? "sb-" + projectRef + "-auth-token" : "sb-euhubhhnumtibbyufghm-auth-token";
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const session = JSON.parse(raw) as { access_token?: string; expires_at?: number };
    if (typeof session.access_token !== "string") return null;
    if (typeof session.expires_at === "number" && session.expires_at <= Math.floor(Date.now() / 1000)) return null;
    return { url, anonKey, token: session.access_token };
  } catch {
    return null;
  }
}

function getIdempotencyKey(planCode: string) {
  const storageKey = "kingsmen-payfast-sandbox-idem:" + planCode;
  let key = window.sessionStorage.getItem(storageKey);
  if (!key) {
    key = "km-" + planCode + "-" + crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, key);
  }
  return key;
}

async function readJson(response: Response): Promise<CheckoutResponse> {
  try {
    return await response.json() as CheckoutResponse;
  } catch {
    return {};
  }
}

export default function PayFastSandboxCheckout({ planCode }: { planCode: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    const origin = window.location.origin;
    const approvedStagingOrigin = origin === "https://kingsmen-portal-staging.netlify.app";
    const approvedPreviewOrigin = /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
    if (!approvedStagingOrigin && !approvedPreviewOrigin) {
      setError("PayFast sandbox checkout is restricted to the Kingsmen staging origin and its Netlify preview hosts. This origin is not approved; no order was created.");
      return;
    }
    if (!ALLOWED_PLAN_CODES.has(planCode)) {
      setError("This product is not enabled for PayFast sandbox checkout.");
      return;
    }
    const auth = getAuthContext();
    if (!auth) {
      setError("Sign in before starting a checkout. Your email and Kingsmen candidate identity must also be verified.");
      return;
    }

    setBusy(true);
    try {
      const idempotencyKey = getIdempotencyKey(planCode);
      const response = await fetch(auth.url + "/functions/v1/payfast-sandbox", {
        method: "POST",
        headers: {
          apikey: auth.anonKey,
          Authorization: "Bearer " + auth.token,
          "Content-Type": "application/json",
          "idempotency-key": idempotencyKey
        },
        body: JSON.stringify({ planCode, idempotencyKey }),
        cache: "no-store"
      });
      const body = await readJson(response);
      const intent = body.intent;
      if (!response.ok || !intent?.paymentUrl || !intent.fields || !intent.signature) {
        throw new Error(body.error || "The sandbox checkout could not be created. Verify your account and candidate identity, then retry.");
      }

      const paymentUrl = new URL(intent.paymentUrl);
      if (paymentUrl.protocol !== "https:" || paymentUrl.hostname !== "sandbox.payfast.co.za" || paymentUrl.pathname !== "/eng/process") {
        throw new Error("The backend returned a payment destination outside the approved PayFast sandbox. Checkout was stopped.");
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl.toString();
      form.acceptCharset = "UTF-8";
      form.style.display = "none";

      const fields = { ...intent.fields, signature: intent.signature };
      for (const [name, value] of Object.entries(fields)) {
        if (typeof value !== "string" || !value) continue;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sandbox checkout could not be started.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={() => void startCheckout()} disabled={busy}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
        {busy ? "Preparing secure sandbox…" : "Continue to PayFast sandbox"}
      </button>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">Sandbox only · no live charge. Entitlements remain inactive until a verified PayFast ITN is accepted.</p>
      {error ? <p role="alert" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">{error}</p> : null}
    </div>
  );
}
