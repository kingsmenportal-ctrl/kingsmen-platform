"use client";

import { getCandidateAccessToken } from "../../../../lib/candidate-session";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

type AdditionalAnswer = { question_key: string; answer: string };
type AnswerData = {
  motivation_statement: string;
  relevant_experience: string;
  qualifications_summary: string;
  availability_date: string;
  preferred_campus: string;
  additional_answers: AdditionalAnswer[];
};
type Application = {
  id: string;
  application_ref: string;
  pathway_type: string;
  status: string;
  readiness_status: string;
  readiness_snapshot: Record<string, unknown>;
  title: string;
  provider_name: string;
  source_url: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
};
type ApiResponse = {
  ready?: boolean;
  ok?: boolean;
  code?: string;
  error?: string;
  message?: string;
  application?: Application;
  draft?: Partial<AnswerData>;
  draft_version?: number;
  draft_updated_at?: string | null;
  shared_profile_available?: boolean;
  shared_profile_updated_at?: string | null;
  is_editable?: boolean;
  updated_at?: string;
  reused?: boolean;
  current_version?: number;
  readiness_recheck_required?: boolean;
  provider_submission_sent?: boolean;
};

const EMPTY_ANSWERS: AnswerData = {
  motivation_statement: "",
  relevant_experience: "",
  qualifications_summary: "",
  availability_date: "",
  preferred_campus: "",
  additional_answers: []
};
const PATHWAYS: Record<string, string> = {
  HIGHER_EDUCATION: "Higher education",
  TVET: "TVET",
  SETA_LEARNERSHIP: "SETA programmes & learnerships",
  INTERNSHIP: "Internship",
  APPRENTICESHIP: "Apprenticeship",
  EMPLOYMENT: "Employment"
};

function message(body: ApiResponse) {
  return [body.code, body.error ?? body.message].filter(Boolean).join(": ")
    || "The application draft request could not be completed.";
}
function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded"
    : date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}
function normalizeAnswers(input: Partial<AnswerData> | undefined): AnswerData {
  return {
    motivation_statement: typeof input?.motivation_statement === "string" ? input.motivation_statement : "",
    relevant_experience: typeof input?.relevant_experience === "string" ? input.relevant_experience : "",
    qualifications_summary: typeof input?.qualifications_summary === "string" ? input.qualifications_summary : "",
    availability_date: typeof input?.availability_date === "string" ? input.availability_date : "",
    preferred_campus: typeof input?.preferred_campus === "string" ? input.preferred_campus : "",
    additional_answers: Array.isArray(input?.additional_answers)
      ? input.additional_answers.filter(item => item && typeof item.question_key === "string" && typeof item.answer === "string")
      : []
  };
}

export default function CandidateApplicationDraftPage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = typeof params.applicationId === "string" ? params.applicationId : "";
  const [application, setApplication] = useState<Application | null>(null);
  const [answers, setAnswers] = useState<AnswerData>(EMPTY_ANSWERS);
  const [version, setVersion] = useState(0);
  const [profileAvailable, setProfileAvailable] = useState(false);
  const [profileUpdatedAt, setProfileUpdatedAt] = useState<string | null>(null);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveIdempotencyKey, setSaveIdempotencyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!applicationId) {
      setError("A valid application reference is required.");
      setLoading(false);
      return;
    }
    const token = getCandidateAccessToken();
    if (!token) {
      setError("AUTHENTICATION_REQUIRED: Sign in to resume this application draft.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/candidate/application-draft?application_id=" + encodeURIComponent(applicationId), {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store"
      });
      const body = await response.json() as ApiResponse;
      if (!response.ok || body.ready !== true || body.ok !== true || !body.application) {
        throw new Error(message(body));
      }
      setApplication(body.application);
      setAnswers(normalizeAnswers(body.draft));
      setVersion(Number.isInteger(body.draft_version) ? body.draft_version as number : 0);
      setProfileAvailable(body.shared_profile_available === true);
      setProfileUpdatedAt(body.shared_profile_updated_at ?? null);
      setDraftUpdatedAt(body.draft_updated_at ?? null);
      setSaveIdempotencyKey("");
      setNotice("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reload the application draft.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { void load(); }, [load]);

  function update<K extends keyof AnswerData>(key: K, value: AnswerData[K]) {
    setAnswers(old => ({ ...old, [key]: value }));
    setNotice("");
  }

  function updateAdditional(index: number, key: keyof AdditionalAnswer, value: string) {
    setAnswers(old => ({
      ...old,
      additional_answers: old.additional_answers.map((item, i) => i === index ? { ...item, [key]: value } : item)
    }));
    setNotice("");
  }

  function addAdditional() {
    if (answers.additional_answers.length >= 20) return;
    update("additional_answers", [...answers.additional_answers, { question_key: "", answer: "" }]);
  }

  function removeAdditional(index: number) {
    update("additional_answers", answers.additional_answers.filter((_, i) => i !== index));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!application || !applicationId || !application.status || !application) return;
    if (application.status === "SUBMISSION_PENDING" || application.status === "SUBMITTED_CONFIRMED"
      || application.status === "PROVIDER_REVIEW" || application.status === "SHORTLISTED"
      || application.status === "INTERVIEW" || application.status === "OFFERED"
      || application.status === "ACCEPTED" || application.status === "REJECTED"
      || application.status === "WITHDRAWN" || application.status === "CANCELLED"
      || application.status === "MANUAL_ACTION_REQUIRED" || application.status === "EXPIRED") {
      setError("This application has moved beyond draft preparation and can no longer be edited here.");
      return;
    }

    const cleanedAnswers = {
      ...answers,
      additional_answers: answers.additional_answers
        .filter(item => item.question_key.trim() || item.answer.trim())
        .map(item => ({ question_key: item.question_key.trim(), answer: item.answer }))
    };
    if (cleanedAnswers.additional_answers.some(item => !/^[A-Za-z0-9._:-]{1,80}$/.test(item.question_key))) {
      setError("Each additional provider question needs a question key using letters, numbers, dot, underscore, colon or hyphen.");
      return;
    }

    const token = getCandidateAccessToken();
    if (!token) {
      setError("AUTHENTICATION_REQUIRED: Sign in again before saving.");
      return;
    }

    const requestKey = saveIdempotencyKey || "application-draft-" + crypto.randomUUID();
    setSaveIdempotencyKey(requestKey);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/candidate/application-draft", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          answer_data: cleanedAnswers,
          expected_version: version,
          idempotency_key: requestKey
        }),
        cache: "no-store"
      });
      const body = await response.json() as ApiResponse;
      if (!response.ok || body.ready !== true || body.ok !== true) {
        if (body.code === "APPLICATION_DRAFT_VERSION_CONFLICT") {
          setError("This draft was changed in another session. Reload the latest saved version before applying your changes.");
        } else {
          throw new Error(message(body));
        }
        return;
      }
      setAnswers(cleanedAnswers);
      setVersion(Number.isInteger(body.draft_version) ? body.draft_version as number : version + 1);
      setDraftUpdatedAt(body.updated_at ?? new Date().toISOString());
      setSaveIdempotencyKey("");
      setApplication(old => old ? {
        ...old,
        status: "DRAFT",
        readiness_status: "NOT_CHECKED",
        updated_at: body.updated_at ?? new Date().toISOString()
      } : old);
      setNotice(body.message ?? "Application draft saved. It has not been submitted to the provider.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the application draft.");
    } finally {
      setSaving(false);
    }
  }

  const isEditable = application?.status
    ? ["DRAFT", "READINESS_BLOCKED", "READY_FOR_REVIEW", "READY_TO_SUBMIT"].includes(application.status)
    : false;

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Kingsmen Candidate Portal · Unified Application Engine</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Application draft</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Save, resume and edit your answers under one Kingsmen parent application. Your reusable candidate profile remains the shared source for identity and contact details; this draft stores only application-specific responses.
        </p>
        <nav className="mt-5 flex flex-wrap gap-3 text-sm">
          <a href="/candidate/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Dashboard</a>
          <a href="/candidate/profile" className="rounded-xl border border-slate-700 px-4 py-2">Reusable profile</a>
          <a href="/candidate/applications" className="rounded-xl border border-slate-700 px-4 py-2">My applications</a>
          <button type="button" disabled={loading || saving} onClick={() => void load()} className="rounded-xl bg-cyan-300 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">{loading ? "Reloading…" : "Reload saved draft"}</button>
        </nav>
      </header>

      {error && <section role="alert" className="rounded-2xl border border-amber-700 bg-amber-950/50 p-4 text-sm leading-6 text-amber-100">
        {error}{error.includes("AUTHENTICATION_REQUIRED") && <p className="mt-2"><a className="text-cyan-300 underline" href="/candidate/login">Sign in / create account</a></p>}
      </section>}
      {notice && <section role="status" className="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm leading-6 text-emerald-100">{notice}</section>}

      {loading ? <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">Loading your application and most recent saved answers…</section>
      : application && <>
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300">Parent application · {application.application_ref}</p>
              <h2 className="mt-2 text-2xl font-bold">{application.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{application.provider_name} · {PATHWAYS[application.pathway_type] ?? application.pathway_type}</p>
              <p className="mt-2 text-xs text-slate-400">Recorded provider closing date: {formatDate(application.closes_at)}</p>
            </div>
            <div className="rounded-xl border border-slate-700 px-3 py-2 text-sm">
              <p className="text-xs text-slate-400">Application status</p>
              <p className="mt-1 font-semibold">{application.status.replaceAll("_", " ")}</p>
              <p className="mt-1 text-xs text-slate-400">Draft version {version}</p>
            </div>
          </div>
          {application.pathway_type === "HIGHER_EDUCATION" && <section className="mt-5 rounded-2xl border border-cyan-900 bg-slate-950 p-4">
            <h3 className="font-semibold">CAO programme choices</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">Keep up to six ordered programme choices as child records beneath this Kingsmen parent application. They remain draft preparation until separately authorised and confirmed.</p>
            <a href={"/candidate/cao-choices?application_id=" + encodeURIComponent(applicationId)} className="mt-3 inline-flex rounded-xl border border-cyan-800 px-4 py-2 text-sm font-semibold text-cyan-200">Manage choices for this parent application</a>
          </section>}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-semibold">Reusable candidate profile</p>
              <p className="mt-2 text-sm text-slate-300">{profileAvailable ? "Your saved reusable profile is available and remains separate from this answer form." : "No saved reusable profile was found. Complete your profile before relying on shared candidate details."}</p>
              {profileUpdatedAt && <p className="mt-2 text-xs text-slate-500">Profile last saved: {formatDate(profileUpdatedAt)}</p>}
              <a href="/candidate/profile" className="mt-3 inline-flex text-sm text-cyan-300 underline">Review reusable profile</a>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-semibold">Draft persistence</p>
              <p className="mt-2 text-sm text-slate-300">Latest saved version: {version}. Last saved: {formatDate(draftUpdatedAt)}.</p>
              <p className="mt-2 text-xs text-slate-500">Saving updates the draft version and requires readiness checks to be refreshed. It does not submit to a provider.</p>
            </div>
          </div>
          {!isEditable && <p className="mt-5 rounded-xl border border-amber-800 bg-amber-950/40 p-4 text-sm text-amber-100">This application has moved beyond the editable draft states. The answer form is read-only.</p>}
        </section>

        <form onSubmit={event => void save(event)} className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div>
            <h2 className="text-xl font-bold">Application-specific responses</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">These are reusable response fields for the Kingsmen application workbench. Provider-specific questions should be recorded with the source question key; required fields and evidence rules must still be checked against the official provider form.</p>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block text-sm font-semibold">Motivation statement
              <textarea maxLength={5000} value={answers.motivation_statement} onChange={e => update("motivation_statement", e.target.value)} disabled={!isEditable || saving} rows={6} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-normal disabled:opacity-50" placeholder="Explain why you are applying and how the opportunity aligns with your goals." />
              <span className="mt-1 block text-xs font-normal text-slate-500">{answers.motivation_statement.length} / 5,000 characters</span>
            </label>

            <label className="block text-sm font-semibold">Relevant experience
              <textarea maxLength={4000} value={answers.relevant_experience} onChange={e => update("relevant_experience", e.target.value)} disabled={!isEditable || saving} rows={5} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-normal disabled:opacity-50" placeholder="Summarise relevant employment, practical training, projects or volunteering." />
              <span className="mt-1 block text-xs font-normal text-slate-500">{answers.relevant_experience.length} / 4,000 characters</span>
            </label>

            <label className="block text-sm font-semibold">Qualifications summary
              <textarea maxLength={3000} value={answers.qualifications_summary} onChange={e => update("qualifications_summary", e.target.value)} disabled={!isEditable || saving} rows={4} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-normal disabled:opacity-50" placeholder="Summarise qualifications and results relevant to this opportunity. The provider's official evidence rules still apply." />
              <span className="mt-1 block text-xs font-normal text-slate-500">{answers.qualifications_summary.length} / 3,000 characters</span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold">Availability date
                <input type="date" value={answers.availability_date} onChange={e => update("availability_date", e.target.value)} disabled={!isEditable || saving} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-normal disabled:opacity-50" />
              </label>
              <label className="block text-sm font-semibold">Preferred campus / location
                <input maxLength={180} value={answers.preferred_campus} onChange={e => update("preferred_campus", e.target.value)} disabled={!isEditable || saving} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-normal disabled:opacity-50" placeholder="Only where relevant to the official provider route" />
              </label>
            </div>

            <section className="rounded-2xl border border-slate-800 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Additional provider questions</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Record answers with an application question key. This does not establish that a provider requires or accepts these fields.</p>
                </div>
                <button type="button" disabled={!isEditable || saving || answers.additional_answers.length >= 20} onClick={addAdditional} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold disabled:opacity-40">Add answer</button>
              </div>
              {answers.additional_answers.length === 0 ? <p className="mt-3 text-sm text-slate-500">No additional responses saved.</p> : <div className="mt-4 space-y-4">
                {answers.additional_answers.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-800 p-3 md:grid-cols-[0.6fr_1.4fr_auto]">
                  <label className="text-xs font-semibold">Question key
                    <input maxLength={80} value={item.question_key} onChange={e => updateAdditional(index, "question_key", e.target.value)} disabled={!isEditable || saving} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm font-normal disabled:opacity-50" placeholder="e.g. qualification_code" />
                  </label>
                  <label className="text-xs font-semibold">Answer
                    <textarea maxLength={2000} value={item.answer} onChange={e => updateAdditional(index, "answer", e.target.value)} disabled={!isEditable || saving} rows={2} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm font-normal disabled:opacity-50" />
                  </label>
                  <button type="button" disabled={!isEditable || saving} onClick={() => removeAdditional(index)} className="self-end rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:opacity-40">Remove</button>
                </div>)}
              </div>}
            </section>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-5">
            <button type="submit" disabled={!isEditable || !profileAvailable || saving || loading} className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Saving draft…" : "Save application draft"}</button>
            <span className="text-xs text-slate-500">Optimistic version control prevents a newer saved draft being silently overwritten.</span>
          </div>
        </form>
      </>}
      <footer className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-500">
        A saved application draft is not an external provider submission. CAO programme choices remain child records under one Kingsmen parent application. Candidate-reported submission, provider-confirmed receipt and provider decision remain separate evidence-backed states.
      </footer>
    </div>
  </main>;
}
