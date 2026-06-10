import React from "react";

export type CandidatePortalCardStatus = "OK" | "ACTION_REQUIRED" | "WAITING" | "BLOCKED";

export interface CandidatePortalCard {
  key: string;
  title: string;
  status: CandidatePortalCardStatus;
  message: string;
}

export interface CandidatePortalShellProps {
  candidateName: string;
  currentState: string;
  cards: CandidatePortalCard[];
}

export function CandidatePortalShell(props: CandidatePortalShellProps) {
  return (
    <main aria-label="Kingsmen candidate portal" className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-4 py-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm uppercase tracking-wide text-slate-400">Kingsmen Candidate Portal</p>
          <h1 className="mt-2 text-2xl font-semibold">Welcome, {props.candidateName}</h1>
          <p className="mt-2 text-slate-300">Current state: {props.currentState}</p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {props.cards.map((card) => (
            <article key={card.key} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">{card.title}</h2>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  {card.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{card.message}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}