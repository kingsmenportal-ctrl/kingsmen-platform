export type AirtableSyncPanelProps = {
  status?: "ready" | "not_configured" | "degraded";
};

const bases = [
  "Kingsman Nexus-7",
  "Kingsman Nexus (MSB)",
  "Applications Hub",
  "AI Engine",
  "AI Decision & Orchestration Engine",
  "System Operations",
  "Automation Control",
  "Communications Center",
  "Programs & Intelligence",
  "Kingsmen Financial Operations",
  "Partner Ecosystem Directory",
  "Document Vault"
];

export function AirtableSyncPanel({ status = "not_configured" }: AirtableSyncPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N07 Airtable Sync</p>
        <h2 className="text-2xl font-bold text-slate-950">Operational Mirror Control</h2>
        <p className="mt-2 text-sm text-slate-600">
          PostgreSQL remains the truth vault. Airtable mirrors operational visibility, approvals, notes, and queue
          surfaces without taking control of Kingsmen state.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Runtime Status</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{status}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Truth Source</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">PostgreSQL</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Airtable Role</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">Mirror Only</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">12 Airtable Bases</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {bases.map((base) => (
            <div key={base} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {base}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}