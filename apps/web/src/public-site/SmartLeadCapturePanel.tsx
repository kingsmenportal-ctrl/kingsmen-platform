export function SmartLeadCapturePanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Smart Intake</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Do not type what your documents already say.</h2>
      <p className="mt-4 text-sm text-slate-600">
        Public lead capture hands off to the candidate core and document vault. CVs and uploaded documents can prefill fields, but candidates must confirm extracted information and consent to POPIA processing.
      </p>
      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
        Email remains the primary evidence channel. WhatsApp is urgent-only.
      </p>
    </section>
  );
}