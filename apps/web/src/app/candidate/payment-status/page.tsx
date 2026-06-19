import { CandidatePaymentStatusPanel } from "../../../finance/CandidatePaymentStatusPanel";

export default function CandidatePaymentStatusPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate portal</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Payment and package access</h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          This page shows whether a Kingsmen package is pending, paid, or active. Package access is not opened from PayFast browser return; it is opened only after verified provider evidence reaches the backend finance ledger.
        </p>
      </div>

      <CandidatePaymentStatusPanel />
    </main>
  );
}
