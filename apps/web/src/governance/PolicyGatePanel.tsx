export function PolicyGatePanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policy Gates</p>
      <h2 className="text-2xl font-bold text-slate-950">Allow, warn, review, or block</h2>
      <p className="mt-2 text-sm text-slate-600">
        Every risky action is evaluated against a policy gate before execution. Blocked and review-required decisions carry reasons, evidence references, and audit trails.
      </p>
    </section>
  );
}