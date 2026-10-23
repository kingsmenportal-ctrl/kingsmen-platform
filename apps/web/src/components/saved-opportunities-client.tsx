"use client";

export default function SavedOpportunitiesClient() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kingsmen Candidate Workspace</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Saved opportunities</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Saved-item persistence is not yet connected to the verified N15 opportunity feed. To avoid showing stale or unverified records as saved opportunities, open your current verified matches instead.
        </p>
        <a href="/candidate/opportunity-matches" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
          View my verified opportunity matches
        </a>
      </section>
    </main>
  );
}
