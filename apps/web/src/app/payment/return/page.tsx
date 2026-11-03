import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Payment return | Kingsmen Portal",
  robots: { index: false, follow: false }
};

export default function PaymentReturnPage() {
  return (
    <main className="public-site">
      <div className="public-notice"><span aria-hidden="true" /> PAYFAST SANDBOX · RETURN IS NOT SETTLEMENT PROOF</div>
      <div className="public-container py-12 sm:py-20">
        <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">PayFast return received</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Your payment status is being verified.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">This browser return is not proof of payment. Kingsmen records a paid order only after the PayFast Instant Transaction Notification passes the server-side merchant, signature, amount, reference, payment-status and idempotency checks.</p>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">No plan entitlement is activated by this page. Do not submit another payment solely because this message appears.</div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/candidate/finance/" className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Return to plans & finance</Link>
            <Link href="/candidate/dashboard/" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900">Candidate dashboard</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
