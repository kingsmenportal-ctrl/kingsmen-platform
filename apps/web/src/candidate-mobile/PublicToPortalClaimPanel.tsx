export function PublicToPortalClaimPanel() {
  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-white">
      <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">Public-to-portal handoff</p>
      <h2 className="mt-2 text-2xl font-black">Lead becomes a secure candidate session</h2>
      <p className="mt-3 text-sm text-emerald-50/90">
        A public lead never becomes an uncontrolled profile. Kingsmen sends an expiring claim link,
        then the candidate confirms identity and continues inside the governed portal.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li>â€¢ Expiring claim token hash, not raw token storage.</li>
        <li>â€¢ Email primary; SMS only as backup.</li>
        <li>â€¢ Device trust required for sensitive actions.</li>
      </ul>
    </section>
  );
}