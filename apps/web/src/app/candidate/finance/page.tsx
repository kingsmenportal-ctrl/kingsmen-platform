import { CandidateFinanceCheckout } from "./CandidateFinanceCheckout";

export const dynamic = "force-dynamic";

export default function CandidateFinancePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kingsmen Candidate Finance</p>
        <h1 className="text-3xl font-black text-slate-950">Packages, checkout and payment status</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Sign in using your existing Kingsmen account email. Checkout uses the canonical server-side price.
          Only a verified PayFast sandbox ITN can mark an order paid or unlock the stored package entitlement.
          Return and cancel redirects are not proof of payment.
        </p>
      </header>
      <CandidateFinanceCheckout />
    </main>
  );
}
