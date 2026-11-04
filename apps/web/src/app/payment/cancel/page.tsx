import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Checkout cancelled | Kingsmen Portal",
  robots: { index: false, follow: false }
};

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950 sm:py-20">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Checkout cancelled</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">No payment success is recorded here.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">The checkout flow was cancelled or returned to Kingsmen. This page does not change an order, mark payment as failed or paid, or activate entitlements. Any final status must come from the verified backend payment record.</p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">Sandbox transactions only. No production payment is enabled by this frontend.</div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/packages/" className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">Review packages</Link>
          <Link href="/candidate/dashboard/" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900">Candidate dashboard</Link>
        </div>
      </section>
    </main>
  );
}
