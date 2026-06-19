export default function PayFastReturnPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">PayFast return</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Verification pending</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Kingsmen received the browser return, but this page does not activate a package. Activation waits for verified provider confirmation in the backend.
        </p>
        <div className="mt-5 rounded-xl border border-amber-300 bg-white p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Next step</p>
          <p className="mt-2">The backend checks provider confirmation, amount, status, source, signature, and duplicate protection before changing service status.</p>
        </div>
      </section>
    </main>
  );
}
