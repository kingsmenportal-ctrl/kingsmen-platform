export type SyncOutboxRow = {
  idempotencyKey: string;
  target: string;
  operation: string;
  status: string;
  attempts: number;
};

export function SyncOutboxPanel({ rows = [] as SyncOutboxRow[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Airtable Outbox</p>
        <h2 className="text-2xl font-bold text-slate-950">Mirror Job Queue</h2>
        <p className="mt-2 text-sm text-slate-600">
          Every mirror write uses idempotency. Failed syncs move through retry and dead-letter handling without
          changing candidate application state.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No visible outbox rows supplied to this panel yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Idempotency</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Operation</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.idempotencyKey} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-mono text-xs">{row.idempotencyKey}</td>
                  <td className="px-3 py-2">{row.target}</td>
                  <td className="px-3 py-2">{row.operation}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}