import React from "react";

export interface SmartIntakeField {
  fieldName: string;
  proposedValue?: string;
  sourceType: string;
  confidenceBand: string;
  operatorReviewRequired: boolean;
}

export interface SmartIntakeReviewProps {
  fields: SmartIntakeField[];
  missingFields: string[];
}

export function SmartIntakeReview(props: SmartIntakeReviewProps) {
  return (
    <section aria-label="Smart intake review" className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
      <p className="text-sm uppercase tracking-wide text-slate-400">Smart Intake</p>
      <h2 className="mt-2 text-xl font-semibold">Confirm details found in your documents</h2>
      <p className="mt-2 text-sm text-slate-300">
        Kingsmen only asks for details that are missing, unclear, or need confirmation.
      </p>

      <div className="mt-5 space-y-3">
        {props.fields.map((field) => (
          <div key={field.fieldName} className="rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between gap-3">
              <strong>{field.fieldName}</strong>
              <span className="text-xs text-slate-400">{field.confidenceBand}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{field.proposedValue || "No value found"}</p>
            <p className="mt-1 text-xs text-slate-500">Source: {field.sourceType}</p>
            {field.operatorReviewRequired ? (
              <p className="mt-2 text-xs text-amber-300">Operator review required before this field is trusted.</p>
            ) : null}
          </div>
        ))}
      </div>

      {props.missingFields.length > 0 ? (
        <div className="mt-5 rounded-xl border border-amber-700 bg-amber-950/40 p-4">
          <h3 className="font-semibold">Missing details</h3>
          <p className="mt-2 text-sm text-amber-100">{props.missingFields.join(", ")}</p>
        </div>
      ) : null}
    </section>
  );
}