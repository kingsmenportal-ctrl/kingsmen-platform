type PaymentStatus = "pending" | "paid" | "active" | "blocked";

export interface CandidatePaymentStatusPanelProps {
  candidateRef?: string;
  merchantReference?: string;
  packageName?: string;
  status?: PaymentStatus;
  entitlementRef?: string;
  evidenceRef?: string;
}

const STATUS_COPY: Record<PaymentStatus, { title: string; detail: string; badge: string }> = {
  pending: {
    title: "Payment verification pending",
    detail: "Kingsmen is waiting for verified provider evidence before opening the paid package.",
    badge: "Pending ITN"
  },
  paid: {
    title: "Payment verified",
    detail: "PayFast evidence has been accepted. Kingsmen is preparing the service entitlement.",
    badge: "Paid"
  },
  active: {
    title: "Package active",
    detail: "The Kingsmen service package is active because verified payment evidence opened an entitlement.",
    badge: "Active"
  },
  blocked: {
    title: "Payment blocked",
    detail: "Kingsmen could not verify the payment evidence. No package access has been opened.",
    badge: "Blocked"
  }
};

export function CandidatePaymentStatusPanel(props: CandidatePaymentStatusPanelProps) {
  const status = props.status ?? "pending";
  const copy = STATUS_COPY[status];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kingsmen payment status</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">{copy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{copy.detail}</p>
        </div>
        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {copy.badge}
        </span>
      </div>

      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="font-semibold text-slate-900">Candidate</dt>
          <dd className="mt-1 text-slate-600">{props.candidateRef ?? "Shown after portal login"}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="font-semibold text-slate-900">Package</dt>
          <dd className="mt-1 text-slate-600">{props.packageName ?? "Pending verified payment"}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="font-semibold text-slate-900">Merchant reference</dt>
          <dd className="mt-1 break-all text-slate-600">{props.merchantReference ?? "Not available yet"}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="font-semibold text-slate-900">Entitlement</dt>
          <dd className="mt-1 break-all text-slate-600">{props.entitlementRef ?? "Opens only after accepted ITN"}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Safety rule</p>
        <p className="mt-2">
          Browser return and cancel pages cannot activate a Kingsmen package. The package opens only after accepted PayFast ITN evidence is written to finance truth and linked to an entitlement.
        </p>
      </div>

      {props.evidenceRef ? (
        <p className="mt-4 text-xs text-slate-500">Evidence reference: {props.evidenceRef}</p>
      ) : null}
    </section>
  );
}
