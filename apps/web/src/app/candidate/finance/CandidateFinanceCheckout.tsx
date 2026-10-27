"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { PUBLIC_PACKAGE_CARDS } from "../../../../../api/src/public-website/package-boundaries";

const PLAN_CODES: Record<string, string> = {
  FOUNDATIONAL_ACCORD: "FOUNDATIONAL_ACCORD_R169_99",
  COLLEGIATE_ORDINANCE: "COLLEGIATE_ORDINANCE_R299_99",
  CHANCELLORS_WRIT: "CHANCELLORS_WRIT_R399_99",
  REGENCY_MANDATE: "REGENCY_MANDATE_R469_99",
  ARTISAN_CHARTER: "ARTISAN_CHARTER_R149_99",
  GUILDMASTERS_CHARTER: "GUILDMASTERS_CHARTER_R199_99",
  CV_REVAMP: "CV_REVAMP_R49_99",
  ACCOMMODATION_SUPPORT: "ACCOMMODATION_SUPPORT_R179"
};

type OrderStatus = {
  orderRef: string;
  planCode: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  paymentVerified: boolean;
  entitlement: Record<string, unknown> | null;
};

export function CandidateFinanceCheckout() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<OrderStatus[]>([]);
  const [providerReady, setProviderReady] = useState(false);
  const idempotencyKeys = useRef<Record<string, string>>({});

  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get("payment");
    if (payment === "return") setMessage("PayFast returned you to Kingsmen. Return navigation is not payment confirmation; sign in and refresh order status.");
    if (payment === "cancel") setMessage("Checkout was cancelled or left. No package is activated unless a verified PayFast ITN confirms payment.");
    fetch("/api/finance/provider-health", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setProviderReady(data.configuration === "configured" && data.environment === "sandbox"))
      .catch(() => setProviderReady(false));
  }, []);

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/finance/auth", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "send_code", email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Email sign-in is unavailable.");
      setCodeSent(true);
      setMessage(data.message ?? "Check your email for a sign-in code.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email sign-in failed.");
    } finally { setBusy(false); }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/finance/auth", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "verify_code", email, code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Email code verification failed.");
      setSignedIn(true);
      setMessage("Signed in. Loading your own orders and verified entitlements.");
      await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email code verification failed.");
    } finally { setBusy(false); }
  }

  async function refreshStatus() {
    setError("");
    const response = await fetch("/api/finance/status", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{}"
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) { setSignedIn(false); setOrders([]); }
      throw new Error(data.error ?? "Your finance status is unavailable.");
    }
    setOrders(Array.isArray(data.orders) ? data.orders as OrderStatus[] : []);
  }

  async function startCheckout(packageKey: string) {
    const planCode = PLAN_CODES[packageKey];
    if (!planCode) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const idempotencyKey = idempotencyKeys.current[planCode] ?? ("checkout_" + crypto.randomUUID());
      idempotencyKeys.current[planCode] = idempotencyKey;
      const response = await fetch("/api/finance/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify({ planCode, idempotencyKey })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Checkout could not be created.");
      const intent = data.intent;
      if (!intent?.paymentUrl || !intent?.fields || !intent?.signature) throw new Error("The payment provider did not return a valid checkout form.");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = intent.paymentUrl;
      form.style.display = "none";
      const fields = { ...intent.fields, signature: intent.signature };
      for (const [name, value] of Object.entries(fields)) {
        if (value === null || value === undefined || value === "") continue;
        const input = document.createElement("input");
        input.type = "hidden"; input.name = name; input.value = String(value);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally { setBusy(false); }
  }

  async function signOut() {
    await fetch("/api/finance/auth", { method: "DELETE" });
    setSignedIn(false); setOrders([]); setCode(""); setCodeSent(false);
    setMessage("Signed out."); setError("");
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-950">
      <p role="status" className={providerReady ? "rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900" : "rounded-lg bg-amber-50 p-3 text-sm text-amber-900"}>
        {providerReady ? "PayFast sandbox configuration is present; no real sandbox transaction has yet been proven." : "PayFast sandbox checkout is not currently verified as configured. Package selection and payment activation remain gated until configuration and a real sandbox ITN are proven."}
      </p>
      <div>
        <h2 className="text-xl font-bold">Candidate sign-in and checkout</h2>
        <p className="mt-1 text-sm text-slate-600">Email code sign-in only. Order prices are selected server-side; a browser return never activates a package.</p>
      </div>
      {!signedIn ? (
        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={sendCode} className="space-y-3">
            <label className="block text-sm font-medium">Email address
              <input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
            </label>
            <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : "Send sign-in code"}</button>
          </form>
          {codeSent && <form onSubmit={verifyCode} className="space-y-3">
            <label className="block text-sm font-medium">Email verification code
              <input inputMode="numeric" pattern="[0-9]{6,8}" required maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
            </label>
            <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Verifying…" : "Verify and sign in"}</button>
          </form>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => { setBusy(true); refreshStatus().then(() => setMessage("Order status refreshed.")).catch((e) => setError(e.message)).finally(() => setBusy(false)); }} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Refresh my orders</button>
          <button onClick={signOut} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Sign out</button>
        </div>
      )}
      {message && <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {signedIn && <div className="space-y-3">
        <h3 className="font-semibold">Your orders</h3>
        {orders.length === 0 ? <p className="text-sm text-slate-600">No finance orders were returned for this candidate account.</p> : orders.map((order) => (
          <article key={order.orderRef} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="font-semibold">{order.planCode}</p><p className="text-xs text-slate-500">{order.orderRef}</p></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{order.status}</span>
            </div>
            <p className="mt-2 text-sm">{(order.amountCents / 100).toLocaleString("en-ZA", { style: "currency", currency: "ZAR" })}</p>
            <p className="mt-1 text-xs text-slate-600">{order.paymentVerified ? "Payment evidence verified; package entitlement returned." : "Payment not yet verified; package entitlements remain locked."}</p>
            {order.paymentVerified && order.entitlement && <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 text-xs">{JSON.stringify(order.entitlement, null, 2)}</pre>}
          </article>
        ))}
      </div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PUBLIC_PACKAGE_CARDS.filter((item) => item.packageKey !== "FREE_DESTINY_MAP").map((item) => (
          <article key={item.packageKey} className="flex flex-col rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold">{item.packageName}</h3>
            <p className="mt-1 text-xl font-black">{item.priceLabel}</p>
            <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
            <p className="mt-2 text-xs text-slate-600">{item.managedApplicationCount} managed applications · {item.includedAccommodationRoutes} accommodation routes where relevant</p>
            <button onClick={() => startCheckout(item.packageKey)} disabled={!signedIn || busy || !providerReady} className="mt-auto rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
              {!signedIn ? "Sign in to continue" : !providerReady ? "Sandbox checkout unavailable" : busy ? "Please wait…" : "Continue to secure sandbox checkout"}
            </button>
            <p className="mt-2 text-xs text-slate-500">{item.boundary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
