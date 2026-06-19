export default function PayFastCancelPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">PayFast cancelled</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">No package was activated</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Kingsmen does not change your service status from a cancel page. You can safely return to your Kingsmen dashboard and choose another route when ready.
        </p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Important</p>
          <p className="mt-2">Cancellation is a browser navigation event only. The backend still relies on provider evidence for all finance decisions.</p>
        </div>
      </section>
    </main>
  );
}
