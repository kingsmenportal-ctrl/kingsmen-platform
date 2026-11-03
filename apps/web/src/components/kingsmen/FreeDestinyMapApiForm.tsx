"use client";

import { useState, type FormEvent } from "react";
import {
  buildFreeDestinyMapClientPayload,
  submitFreeDestinyMapClientPayload
} from "../../lib/kingsmen/free-destiny-map-client";
import {
  FREE_DESTINY_MAP_API_WIRING_NOTICE,
  type FreeDestinyMapClientResponse
} from "../../../../../packages/contracts/src/free-destiny-map-api-wiring";

const routeOptions = [
  ["higher_education", "Higher Education"],
  ["tvet", "TVET"],
  ["seta_learnership", "SETA programmes & learnerships"],
  ["internship", "Internships"],
  ["apprenticeship", "Apprenticeships"],
  ["employment", "Employment"],
  ["nsfas_bursary", "NSFAS / bursary support"],
  ["accommodation", "Accommodation support"],
  ["cv_revamp", "CV Revamp"],
  ["documents", "Document readiness"],
  ["source_check", "Check an institution or opportunity"],
  ["confused_full_map", "I need help choosing a route"]
] as const;

const provinces = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape"
];

const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "block text-sm font-semibold text-slate-800";

export function FreeDestinyMapApiForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FreeDestinyMapClientResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const payload = buildFreeDestinyMapClientPayload(new FormData(event.currentTarget));
    const hasRouteIntent = Boolean(
      payload.routeInterests?.length ||
      payload.currentSituation?.trim() ||
      payload.knownRoute?.trim() ||
      payload.randomSourceName?.trim()
    );

    if (!payload.consentToProcessBasicInfo || !payload.consentToBeContacted) {
      setError("Please select both consent options before submitting this intake request.");
      return;
    }
    if (!hasRouteIntent) {
      setError("Choose at least one route interest or describe the route you want help with.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitFreeDestinyMapClientPayload(payload);
      setResult(response);
    } catch {
      setError("The intake API could not be reached. Your request has not been confirmed. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="intake" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_75px_rgba(8,17,33,0.12)]">
      <div className="bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Free first map</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Tell us where you want to go.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Select your pathways and support needs. Do not enter an ID number, passport number, password, banking details or attach documents in this public form.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 p-5 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Name (optional)
            <input name="fullName" autoComplete="name" maxLength={100} className={fieldClass} placeholder="How should we address you?" />
          </label>
          <label className={labelClass}>
            Province
            <select name="province" defaultValue="" className={fieldClass}>
              <option value="">Choose province</option>
              {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
            </select>
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Current situation
            <select name="currentSituation" defaultValue="" className={fieldClass}>
              <option value="">Choose your current stage</option>
              <option value="grade_9_11">Grade 9–11</option>
              <option value="grade_12_matric">Grade 12 / Matric</option>
              <option value="matric_completed">Matric completed</option>
              <option value="tvet_college_student">TVET / college student</option>
              <option value="unemployed_seeking_opportunity">Unemployed and seeking opportunity</option>
              <option value="working_seeking_upgrade">Working and seeking an upgrade</option>
              <option value="other_or_unsure">Other / not sure yet</option>
            </select>
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Known route, institution or goal (optional)
            <input name="knownRoute" maxLength={200} className={fieldClass} placeholder="Example: a university, a TVET qualification, a learnership or a job" />
          </label>
        </div>

        <fieldset className="rounded-2xl border border-slate-200 p-4 sm:p-5">
          <legend className="px-2 text-sm font-bold text-slate-900">What would you like help with?</legend>
          <p className="mb-4 text-sm leading-6 text-slate-600">Select every relevant route. Discovery across the six core pathways is available regardless of service plan.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {routeOptions.map(([value, label]) => (
              <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm leading-5 text-slate-700 transition hover:border-amber-400 hover:bg-amber-50">
                <input name="routeInterests" value={value} type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
            <input name="needsAccommodation" type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" />
            <span><strong className="block text-slate-900">Accommodation support</strong>I may need accommodation information near a campus, workplace or training location.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
            <input name="needsFundingHelp" type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" />
            <span><strong className="block text-slate-900">Funding readiness</strong>I may need NSFAS, bursary or funding preparation guidance.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
            <input name="needsCvHelp" type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" />
            <span><strong className="block text-slate-900">CV support</strong>I may need help preparing or improving a CV.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
            <input name="hasDocumentsReady" type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" />
            <span><strong className="block text-slate-900">Documents ready</strong>I have some application documents ready (do not upload them here).</span>
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Area of interest for accommodation (optional)
            <input name="accommodationArea" maxLength={120} className={fieldClass} placeholder="City, campus or work area" />
          </label>
          <label className={labelClass}>
            Opportunity or provider to check (optional)
            <input name="randomSourceName" maxLength={200} className={fieldClass} placeholder="Organisation name or public website link" />
          </label>
        </div>

        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <p className="text-sm font-bold text-slate-900">Consent and privacy</p>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
            <input name="consentToProcessBasicInfo" type="checkbox" required className="mt-1 h-4 w-4 accent-amber-600" />
            <span>I consent to Kingsmen processing the basic route-mapping information I submit for this request.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
            <input name="consentToBeContacted" type="checkbox" required className="mt-1 h-4 w-4 accent-amber-600" />
            <span>I agree Kingsmen may contact me about this request if contact details are provided through an appropriate Kingsmen channel later.</span>
          </label>
          <p className="text-xs leading-5 text-slate-600">This form does not collect contact details or official identifiers. Consent does not mean a message will be sent, and the request is not an application submission.</p>
        </div>

        <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-fit">
          {isSubmitting ? "Sending intake request…" : "Submit Free Destiny Map request"} <span aria-hidden="true" className="ml-2">→</span>
        </button>
      </form>

      <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Current integration status</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{FREE_DESTINY_MAP_API_WIRING_NOTICE}</p>
        {error ? (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{error}</div>
        ) : null}
        {result ? (
          <div role={result.accepted ? "status" : "alert"} aria-live="polite" className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${result.accepted ? "border-amber-200 bg-amber-50 text-slate-900" : "border-red-200 bg-red-50 text-red-900"}`}>
            <p className="font-bold">{result.accepted ? "Intake boundary response received" : "Intake was not accepted"}</p>
            <p className="mt-2"><strong>Reference:</strong> {result.reference}</p>
            <p><strong>Backend accepted:</strong> {result.accepted ? "Yes" : "No"}</p>
            <p><strong>Production storage:</strong> Not confirmed / not enabled by this form.</p>
            <p className="mt-2">{result.safeNotice}</p>
            <p className="mt-2"><strong>Next step:</strong> {result.nextAction}</p>
            {result.issues.length > 0 ? <ul className="mt-3 list-disc space-y-1 pl-5">{result.issues.map((issue) => <li key={`${issue.field}-${issue.code}`}>{issue.message}</li>)}</ul> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
