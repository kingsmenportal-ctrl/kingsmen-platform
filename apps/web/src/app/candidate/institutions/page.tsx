"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import directorySeed from "../../../../../../manifests/institutions/seed/public-universities-and-tvet-2026-10-31.json";

type Institution = (typeof directorySeed.records)[number];
type ProviderFilter = "ALL" | "PUBLIC_UNIVERSITY" | "TVET_COLLEGE";

const providerLabels: Record<string, string> = {
  PUBLIC_UNIVERSITY: "Public university",
  TVET_COLLEGE: "TVET college"
};

function officialSiteLabel(institution: Institution): string {
  if (!institution.official_website_url) return "Website link requires review";
  return institution.official_website_status === "PUBLISHED_BY_DHET_NEEDS_CURRENT_LIVE_CHECK"
    ? "Website listed by DHET · live check pending"
    : "Website source requires review";
}

export default function CandidateInstitutionDirectoryPage() {
  const [query, setQuery] = useState("");
  const [providerType, setProviderType] = useState<ProviderFilter>("ALL");
  const [province, setProvince] = useState("ALL");

  const provinces = useMemo(() => Array.from(new Set(
    directorySeed.records.map(record => record.province).filter((value): value is string => Boolean(value))
  )).sort((a, b) => a.localeCompare(b)), []);

  const visibleInstitutions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return directorySeed.records
      .filter(record => providerType === "ALL" || record.provider_type === providerType)
      .filter(record => province === "ALL" || record.province === province)
      .filter(record => !needle || [
        record.canonical_name,
        record.province ?? "",
        providerLabels[record.provider_type] ?? record.provider_type
      ].some(value => value.toLocaleLowerCase().includes(needle)))
      .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
  }, [query, providerType, province]);

  const universityCount = directorySeed.records.filter(record => record.provider_type === "PUBLIC_UNIVERSITY").length;
  const tvetCount = directorySeed.records.filter(record => record.provider_type === "TVET_COLLEGE").length;

  return (
    <main className="min-h-screen bg-[#071426] px-4 py-8 text-[#f4f0e6] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-amber-300/25 bg-[#0b1d33] p-6 sm:p-8">
          <nav aria-label="Candidate navigation" className="mb-6 flex flex-wrap gap-3 text-sm">
            <Link href="/candidate" className="text-amber-200 hover:text-amber-100">Candidate portal</Link>
            <Link href="/candidate/dashboard" className="text-amber-200 hover:text-amber-100">Dashboard</Link>
            <Link href="/candidate/applications" className="text-amber-200 hover:text-amber-100">My applications</Link>
          </nav>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-300">Kingsmen One · National directory</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Find an institution through Kingsmen</h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300 sm:text-base">
            Search the first official-source directory batch of South African public universities and TVET colleges.
            Your Kingsmen account and profile remain the same across all six pathways; each institution still has its
            own application rules and submission route.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/candidate/opportunity-matches" className="rounded-xl bg-amber-300 px-4 py-3 text-sm font-extrabold text-[#101b2a]">
              Browse verified open opportunities
            </Link>
            <Link href="/candidate/applications" className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-bold text-white">
              Open my application workbench
            </Link>
          </div>
        </header>

        <section aria-label="Current directory coverage" className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Initial public directory batch</p>
            <p className="mt-2 text-3xl font-black text-white">{directorySeed.counts.total}</p>
            <p className="mt-1 text-sm text-slate-400">Source-listed records · snapshot {directorySeed.researched_at}</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Public universities</p>
            <p className="mt-2 text-3xl font-black text-white">{universityCount}</p>
            <p className="mt-1 text-sm text-slate-400">Directory entry only; programmes and admissions routes are not yet verified.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">TVET colleges</p>
            <p className="mt-2 text-3xl font-black text-white">{tvetCount}</p>
            <p className="mt-1 text-sm text-slate-400">Directory entry only; each programme and intake requires separate evidence.</p>
          </article>
        </section>

        <section role="note" aria-label="Directory evidence limitation" className="rounded-2xl border border-yellow-500/40 bg-yellow-950/30 p-5">
          <h2 className="font-bold text-yellow-100">Important: a directory listing is not an open intake</h2>
          <p className="mt-2 text-sm leading-6 text-yellow-50/90">
            The records below preserve evidence that an institution appeared in a DHET directory snapshot. Kingsmen has
            not yet independently rechecked every institution website, programme, closing date, eligibility rule or
            application route. No listing here means a partnership, live integration, application submission or admission.
          </p>
        </section>

        <section aria-label="Institution search and filters" className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="block text-sm font-bold text-white">
              Search institution
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Type an institution name"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-bold text-white">
              Institution type
              <select
                value={providerType}
                onChange={event => setProviderType(event.target.value as ProviderFilter)}
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white focus:border-amber-300 focus:outline-none"
              >
                <option value="ALL">All in this batch</option>
                <option value="PUBLIC_UNIVERSITY">Public universities</option>
                <option value="TVET_COLLEGE">TVET colleges</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-white">
              Province
              <select
                value={province}
                onChange={event => setProvince(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 font-normal text-white focus:border-amber-300 focus:outline-none"
              >
                <option value="ALL">All provinces / not recorded</option>
                {provinces.map(value => <option value={value} key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <p aria-live="polite" className="mt-4 text-sm text-slate-400">
            Showing <span className="font-bold text-white">{visibleInstitutions.length}</span> of {directorySeed.records.length} initial directory records.
          </p>
        </section>

        <section aria-label="Institution results" className="grid gap-4 lg:grid-cols-2">
          {visibleInstitutions.map(institution => (
            <article key={institution.institution_ref} className="flex h-full flex-col rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    {providerLabels[institution.provider_type] ?? institution.provider_type}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-white">{institution.canonical_name}</h2>
                  <p className="mt-2 text-xs text-slate-400">
                    {institution.province ?? "Province not confirmed in this record"} · source snapshot {institution.source_snapshot_date}
                  </p>
                </div>
                <span className="rounded-full border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300">
                  Directory only
                </span>
              </div>

              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-slate-950/70 p-3">
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Programme availability</dt>
                  <dd className="mt-1 font-semibold text-slate-200">Not verified</dd>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-3">
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Closing date / eligibility</dt>
                  <dd className="mt-1 font-semibold text-slate-200">Unknown</dd>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-3 sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Application route</dt>
                  <dd className="mt-1 font-semibold text-slate-200">Not verified by Kingsmen</dd>
                </div>
              </dl>

              <div className="mt-auto pt-5">
                {institution.official_website_url ? (
                  <a
                    href={institution.official_website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-xl border border-amber-300/40 px-4 py-3 text-sm font-bold text-amber-100 hover:border-amber-300"
                  >
                    Open website listed by DHET ↗
                  </a>
                ) : (
                  <p className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 px-4 py-3 text-sm font-semibold text-yellow-100">
                    {officialSiteLabel(institution)} — Kingsmen will not guess the link.
                  </p>
                )}
                {institution.official_website_url && (
                  <p className="mt-2 text-xs text-slate-500">{officialSiteLabel(institution)}</p>
                )}
              </div>
            </article>
          ))}
        </section>

        {visibleInstitutions.length === 0 && (
          <div className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-8 text-center">
            <h2 className="text-lg font-bold text-white">No institution matches those filters</h2>
            <p className="mt-2 text-sm text-slate-400">Try another name, institution type or province.</p>
            <button
              type="button"
              onClick={() => { setQuery(""); setProviderType("ALL"); setProvince("ALL"); }}
              className="mt-4 rounded-xl bg-amber-300 px-4 py-3 text-sm font-extrabold text-[#101b2a]"
            >
              Clear filters
            </button>
          </div>
        )}

        <section aria-label="Remaining national coverage" className="rounded-2xl border border-slate-700 bg-[#0b1d33] p-5 sm:p-6">
          <h2 className="text-xl font-bold text-white">Remaining national register batches</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The current seed is only the public-university and TVET directory slice. DHET's cited 2026/27 baseline separately
            lists {directorySeed.counts.cet_colleges_to_import_from_registry} CET colleges, {directorySeed.counts.private_higher_education_institutions_to_import_from_registry}
            {" "}private higher-education institutions and {directorySeed.counts.other_private_colleges_to_import_from_registry} other private colleges. Those records, individual SETAs, QCTO/SAQA qualification-provider relationships, training providers and employer adverts need separate source-controlled batches.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            For current opportunities, use <Link href="/candidate/opportunity-matches" className="font-bold text-amber-200 underline">verified opportunity discovery</Link>.
            Kingsmen will show a programme as open only after the source, intake and deadline checks support that claim.
          </p>
        </section>

        <footer className="border-t border-slate-700 pt-5 text-xs leading-5 text-slate-500">
          Directory data is part of the public DHET listing snapshot dated {directorySeed.researched_at}. This page is a discovery aid, not an admissions decision or a provider-authorized submission channel. Candidate profile and saved application records remain in the authenticated Kingsmen workbench.
        </footer>
      </div>
    </main>
  );
}
