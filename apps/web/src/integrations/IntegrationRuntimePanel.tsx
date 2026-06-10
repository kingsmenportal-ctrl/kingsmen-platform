export function IntegrationRuntimePanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">N14 Integrations</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950">Connector runtime without integration chaos</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-600">Backend controls all flow. n8n is thin worker only. Airtable is mirror only. Playwright is scout/probe only. PayFast is payment evidence only.</p>
    </section>
  );
}