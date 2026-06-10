export function SystemLockPanel() {
  const laws = [
    "POSTGRES_TRUTH",
    "AIRTABLE_MIRROR_ONLY",
    "BACKEND_CONTROLS_STATE",
    "N8N_STATELESS_THIN_WORKERS",
    "EMAIL_PRIMARY",
    "WHATSAPP_URGENT_ONLY",
    "PAYFAST_PROVIDER_BOUNDARY",
    "NO_FAKE_STATUS",
    "FOUNDER_FINAL_AUTHORITY"
  ];

  return (
    <section className="rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-5 text-white">
      <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">System lock</p>
      <h2 className="mt-2 text-2xl font-black">Locked doctrine for Oracle Lite founder release</h2>
      <div className="mt-5 grid gap-2 md:grid-cols-3">
        {laws.map((law) => (
          <div key={law} className="rounded-xl bg-slate-950/50 px-3 py-2 text-sm font-semibold">
            {law}
          </div>
        ))}
      </div>
    </section>
  );
}