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

type LocalReadinessPreview = {
  title: string;
  summary: string;
  region: string;
  steps: string[];
};

const localReadinessGuidance: Record<string, { title: string; summary: string; steps: string[] }> = {
  higher_education: {
    title: "Higher education",
    summary: "Prepare a route through university, university of technology or CAO programme choices.",
    steps: [
      "Use the institution's official admissions page and confirm the current application cycle.",
      "Check the programme's subject, qualification and selection requirements.",
      "Make a private checklist of the documents the institution currently requests."
    ]
  },
  tvet: {
    title: "TVET",
    summary: "Identify a relevant vocational or technical programme and confirm the intake with the college.",
    steps: [
      "Find the official college, campus, programme and latest prospectus.",
      "Verify intake dates, entry requirements, fees and any available funding directly with the college.",
      "Prepare only the supporting records required by that programme."
    ]
  },
  seta_learnership: {
    title: "SETA programmes and learnerships",
    summary: "Verify the employer or training provider and eligibility before relying on an opportunity advert.",
    steps: [
      "Identify the official SETA, employer or accredited training provider.",
      "Confirm eligibility, the application channel, the closing date and whether any fee is legitimate.",
      "Prepare a truthful CV and only the records the provider requests."
    ]
  },
  internship: {
    title: "Internships",
    summary: "Match your current qualifications and experience to a verifiable internship route.",
    steps: [
      "Locate the opportunity on the employer's or programme provider's official page.",
      "Check qualification requirements, location, duration and closing date.",
      "Prepare a truthful CV and record the official source and date checked."
    ]
  },
  apprenticeship: {
    title: "Apprenticeships",
    summary: "Compare trade and occupational-training routes against entry requirements and location.",
    steps: [
      "Identify the employer, college or training provider responsible for the apprenticeship.",
      "Verify trade requirements, workplace or campus location, intake and deadline.",
      "Prepare the certificates and supporting records specifically requested."
    ]
  },
  employment: {
    title: "Employment",
    summary: "Build a job-search route around verified vacancies and an accurate application.",
    steps: [
      "Find vacancies on the employer's own careers page or another verifiable source.",
      "Compare the role requirements with your actual qualifications and experience.",
      "Tailor your CV truthfully and record the official source and closing date."
    ]
  },
  nsfas_bursary: {
    title: "NSFAS and bursary support",
    summary: "Check funding fit, eligibility and dates with the official funder before applying.",
    steps: [
      "Identify the official funder and the study or training routes it supports.",
      "Verify eligibility, covered costs, required records and the current closing date.",
      "Make a private checklist and identify an alternative funding route where practical."
    ]
  },
  accommodation: {
    title: "Accommodation support",
    summary: "Plan accommodation research around a real campus, workplace or training location.",
    steps: [
      "Confirm the institution or work location before narrowing the search area.",
      "Compare location, transport, safety, affordability and the published rental terms.",
      "Verify the landlord or provider independently; do not pay based only on an unverified listing."
    ]
  },
  cv_revamp: {
    title: "CV Revamp",
    summary: "Prepare a truthful CV that reflects your real qualifications and experience.",
    steps: [
      "Collect accurate education, skills, experience and contact details privately.",
      "Choose the target role or pathway so the CV can be tailored to relevant requirements.",
      "Check that every claim is accurate and that the final CV has been reviewed before use."
    ]
  },
  documents: {
    title: "Document readiness",
    summary: "Prepare a private checklist before using any official application portal.",
    steps: [
      "Use the provider's current document list rather than a generic checklist alone.",
      "Check that files are legible, current and match the applicant's official records.",
      "Upload documents only through the verified provider or Kingsmen's approved private document flow."
    ]
  },
  source_check: {
    title: "Opportunity and source check",
    summary: "A named organisation or advert must be checked before its status is treated as current.",
    steps: [
      "Find the original official provider page or announcement.",
      "Check eligibility, source authority, application channel and closing date.",
      "Record when the source was checked; treat missing or stale evidence as unverified."
    ]
  },
  confused_full_map: {
    title: "Full route discovery",
    summary: "Keep all six core pathways open while you narrow down a realistic first step.",
    steps: [
      "Compare higher education, TVET, SETA/learnerships, internships, apprenticeships and employment.",
      "Consider your qualifications, province, affordability and the type of outcome you are pursuing.",
      "Choose a first-choice path and at least one practical alternative to verify."
    ]
  }
};

function buildLocalReadinessPreview(form: HTMLFormElement): LocalReadinessPreview | null {
  const values = new FormData(form);
  const selectedRoutes = values.getAll("routeInterests").map(String).filter((value) =>
    Object.prototype.hasOwnProperty.call(localReadinessGuidance, value)
  );
  const needsFunding = values.get("needsFundingHelp") === "on";
  const needsCv = values.get("needsCvHelp") === "on";
  const needsAccommodation = values.get("needsAccommodation") === "on";
  const hasIntent = selectedRoutes.length > 0 || needsFunding || needsCv || needsAccommodation;
  if (!hasIntent) return null;

  const selected = selectedRoutes.length > 0
    ? selectedRoutes
    : [
        ...(needsFunding ? ["nsfas_bursary"] : []),
        ...(needsCv ? ["cv_revamp"] : []),
        ...(needsAccommodation ? ["accommodation"] : [])
      ];
  const guidance = selected.map((route) => localReadinessGuidance[route]);
  const priorities = [
    ...(needsFunding && !selected.includes("nsfas_bursary") ? [localReadinessGuidance.nsfas_bursary.steps[0]] : []),
    ...(needsCv && !selected.includes("cv_revamp") ? [localReadinessGuidance.cv_revamp.steps[0]] : []),
    ...(needsAccommodation && !selected.includes("accommodation") ? [localReadinessGuidance.accommodation.steps[0]] : [])
  ];
  const steps = [...priorities, ...guidance.flatMap((item) => item.steps)]
    .filter((step, index, all) => all.indexOf(step) === index)
    .slice(0, 6);
  const first = guidance[0];
  return {
    title: selected.length > 1 ? "Your combined readiness path" : first.title,
    summary: selected.length > 1
      ? "Use these route-specific checks as a starting point. Verify each opportunity with its official provider."
      : first.summary,
    region: String(values.get("province") ?? "").trim(),
    steps
  };
}

const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const labelClass = "block text-sm font-semibold text-slate-800";

export function FreeDestinyMapApiForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FreeDestinyMapClientResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LocalReadinessPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  function previewReadinessPath(form: HTMLFormElement | null) {
    setPreviewError(null);
    setPreview(null);
    if (!form) {
      setPreviewError("The readiness form is not available. Please refresh and try again.");
      return;
    }
    const nextPreview = buildLocalReadinessPreview(form);
    if (!nextPreview) {
      setPreviewError("Select at least one route interest or support need to build a preview.");
      return;
    }
    setPreview(nextPreview);
  }

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

        <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
          <button
            type="button"
            data-kingsmen-readiness-preview-button="true"
            onClick={(event) => previewReadinessPath(event.currentTarget.form)}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-amber-500 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:w-fit"
          >
            Preview my readiness path
          </button>
          <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-fit">
            {isSubmitting ? "Sending intake request…" : "Submit Free Destiny Map request"} <span aria-hidden="true" className="ml-2">→</span>
          </button>
        </div>
        {previewError ? (
          <div data-kingsmen-readiness-preview-error="true" role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
            {previewError}
          </div>
        ) : null}
        {preview ? (
          <section data-kingsmen-readiness-preview="ready" aria-live="polite" aria-labelledby="kingsmen-readiness-preview-title" className="grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800">Local preview · not a verified live match</p>
              <h3 id="kingsmen-readiness-preview-title" className="mt-2 text-xl font-extrabold text-slate-950">{preview.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{preview.summary}</p>
              {preview.region ? <p className="mt-2 text-xs font-semibold text-slate-600">Province selected: {preview.region}</p> : null}
            </div>
            <ol data-kingsmen-readiness-preview-steps="true" className="grid list-decimal gap-2.5 pl-5 text-sm leading-6 text-slate-800">
              {preview.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p className="text-xs leading-5 text-slate-600">Planning guidance only. This preview does not check live openings, eligibility, deadlines or outcomes; does not submit this form; and does not save or send the selections used to create the preview. Verify every opportunity with its official provider.</p>
          </section>
        ) : null}
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
