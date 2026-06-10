export function ManualHandoffPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manual Handoff</p>
      <h2 className="text-2xl font-bold text-slate-950">MAP and Phoenix fallback</h2>
      <p className="mt-2 text-sm text-slate-600">
        CAPTCHA, OTP, blocked portals, portal downtime, manual-only routes, and hard blockers create visible handoffs instead of fake automation success.
      </p>
    </section>
  );
}