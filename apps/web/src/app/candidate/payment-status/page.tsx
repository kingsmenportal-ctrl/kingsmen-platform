import { CandidatePaymentStatusPanel } from "../../../finance/CandidatePaymentStatusPanel";
import { fetchCandidatePaymentStatus } from "../../../finance/payment-status-api";

export default async function CandidatePaymentStatusPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawReference = params?.merchantReference ?? params?.m_payment_id ?? params?.ref;
  const merchantReference = Array.isArray(rawReference) ? rawReference[0] : rawReference;
  const paymentStatus = await fetchCandidatePaymentStatus({ merchantReference });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate portal</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Payment and package access</h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          This page shows whether a Kingsmen package is pending, paid, active, or blocked. Package access is not opened from PayFast browser return; it is opened only after verified provider evidence reaches the backend finance ledger.
        </p>
      </div>

      <CandidatePaymentStatusPanel
        status={paymentStatus.status}
        candidateRef={paymentStatus.candidateRef}
        merchantReference={paymentStatus.merchantReference}
        packageName={paymentStatus.packageName}
        entitlementRef={paymentStatus.entitlementRef}
        evidenceRef={paymentStatus.evidenceRef}
      />

      {paymentStatus.error ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {paymentStatus.error}
        </p>
      ) : null}
    </main>
  );
}
