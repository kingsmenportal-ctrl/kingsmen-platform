export function FounderLaunchBriefPanel() {
  const actions = [
    "Apply migrations to the intended database",
    "Wire secrets outside git",
    "Run secret scan",
    "Run PayFast sandbox tests",
    "Run email provider tests",
    "Run backup and restore drill",
    "Run RLS/security review",
    "Connect deployment routing"
  ];

  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-white">
      <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">Founder brief</p>
      <h2 className="mt-2 text-2xl font-black">Repo locked; live launch still requires evidence</h2>
      <ol className="mt-5 space-y-2 text-sm">
        {actions.map((action, index) => (
          <li key={action} className="rounded-xl bg-slate-950/40 p-3">
            {index + 1}. {action}
          </li>
        ))}
      </ol>
    </section>
  );
}