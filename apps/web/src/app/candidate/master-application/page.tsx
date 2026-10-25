"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

const PATHWAYS = [
  ["HIGHER_EDUCATION", "Higher education / universities / UoTs"],
  ["TVET", "TVET / NC(V) / NATED / Report 191"],
  ["SETA_LEARNERSHIP", "SETA / learnerships"],
  ["INTERNSHIP", "Internships"],
  ["APPRENTICESHIP", "Apprenticeships"],
  ["EMPLOYMENT", "Employment"],
  ["FUNDING", "Bursaries / NSFAS / funding"],
  ["ACCOMMODATION", "Accommodation / transport support"],
  ["WIL", "Work-integrated learning (WIL)"]
] as const;

type Target = {
  targetKey: string;
  pathwayType: string;
  providerName: string;
  programmeOrRole: string;
  providerApplicationUrl: string;
  sourceReference: string;
};

const emptyTarget = (): Target => ({
  targetKey: crypto.randomUUID(),
  pathwayType: "HIGHER_EDUCATION",
  providerName: "",
  programmeOrRole: "",
  providerApplicationUrl: "",
  sourceReference: ""
});

function accessToken(): string | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return null;
    const ref = new URL(url).hostname.split(".")[0];
    const stored = window.localStorage.getItem(`sb-${ref}-auth-token`);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}

const fieldClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-semibold text-slate-800";

export default function MasterApplicationPage() {
  const [profile, setProfile] = useState({
    fullName: "", email: "", phone: "", province: "", city: "",
    highestEducation: "", qualifications: "", skills: "", workHistory: "",
    cvSummary: "", preferredLocations: "", fundingNeeds: "", accommodationNeeds: "",
    additionalNotes: ""
  });
  const [pathways, setPathways] = useState<string[]>([]);
  const [targets, setTargets] = useState<Target[]>([emptyTarget()]);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");

  const [token, setToken] = useState<string | null>(null);\n\n  useEffect(() => { setToken(accessToken()); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("plan") !== "1") return;
    const matchRef = params.get("match_ref") || "";
    const providerName = params.get("provider") || "";
    const programmeOrRole = params.get("programme") || "";
    const pathwayType = params.get("pathway") || "EMPLOYMENT";
    const providerApplicationUrl = params.get("url") || "";
    if (!matchRef || !providerName || !programmeOrRole || !PATHWAYS.some(([value]) => value === pathwayType)) return;
    const targetKey = `verified:${matchRef}`;
    setTargets(current => {
      const planned = current.filter(target => target.providerName.trim() || target.programmeOrRole.trim());
      if (planned.some(target => target.targetKey === targetKey)) return current;
      return [...planned, {
        targetKey, pathwayType, providerName, programmeOrRole,
        providerApplicationUrl, sourceReference: `N15 match reference: ${matchRef}`
      }];
    });
    setPathways(current => current.includes(pathwayType) ? current : [...current, pathwayType]);
    setMessage("Selected opportunity copied from your N15 match. Review the details and save to your master application; this action does not submit to the provider.");
  }, []);

  useEffect(() => {
    async function load() {
      if (!token) return;
      setLoading(true);
      try {
        const response = await fetch("/api/candidate/master-application", {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error === "AUTHENTICATION_REQUIRED" ? "Your sign-in has expired. Sign in again, then reopen this form." : "Could not load your saved master application.");
        if (body.profile?.profile_data) {
          const data = body.profile.profile_data;
          setProfile(current => ({ ...current, ...data }));
          setPathways(Array.isArray(body.profile.pathway_preferences) ? body.profile.pathway_preferences : []);
          setSavedAt(body.profile.updated_at || "");
        }
        if (Array.isArray(body.targets) && body.targets.length) {
          const savedTargets = body.targets.map((item: any) => ({
            targetKey: item.target_key, pathwayType: item.pathway_type,
            providerName: item.provider_name, programmeOrRole: item.programme_or_role,
            providerApplicationUrl: item.provider_application_url || "",
            sourceReference: item.source_reference || ""
          }));
          setTargets(current => {
            const fromMatchFeed = current.filter(target => target.targetKey.startsWith("verified:"));
            const merged = [...savedTargets];
            for (const target of fromMatchFeed) {
              if (!merged.some(saved => saved.targetKey === target.targetKey)) merged.push(target);
            }
            return merged.length ? merged : [emptyTarget()];
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load saved information.");
      } finally { setLoading(false); }
    }
    void load();
  }, [token]);

  function updateProfile(field: keyof typeof profile, value: string) {
    setProfile(current => ({ ...current, [field]: value }));
  }
  function togglePathway(value: string) {
    setPathways(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  }
  function updateTarget(index: number, field: keyof Target, value: string) {
    setTargets(current => current.map((target, i) => i === index ? { ...target, [field]: value } : target));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    if (!token) { setError("Please sign in first. Kingsmen will not save candidate information without your authenticated session."); return; }
    if (!consent) { setError("Please confirm consent before saving your reusable application profile."); return; }
    setSaving(true);
    try {
      const cleanTargets = targets.filter(t => t.providerName.trim() || t.programmeOrRole.trim()).map(t => ({
        ...t,
        providerName: t.providerName.trim(),
        programmeOrRole: t.programmeOrRole.trim(),
        providerApplicationUrl: t.providerApplicationUrl.trim(),
        sourceReference: t.sourceReference.trim()
      }));
      const response = await fetch("/api/candidate/master-application", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          profileData: profile,
          pathwayPreferences: pathways,
          targets: cleanTargets,
          consent,
          idempotencyKey: crypto.randomUUID()
        })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.detail?.message || body.error || "The master application could not be saved.");
      setSavedAt(new Date().toISOString());
      setMessage(`Saved securely. ${body.result?.new_targets_saved ?? 0} new target record(s) created or updated. No provider application was submitted.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.22em] text-amber-300">Kingsmen · N04 + N06</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">One master application</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            Enter your information once. Kingsmen keeps one reusable candidate profile and lets you plan multiple applications across education, training, funding and work pathways without retyping your details for every target.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4"><p className="text-xs text-amber-200">01 · ONE PROFILE</p><p className="mt-1 font-bold">Your information, reusable</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4"><p className="text-xs text-amber-200">02 · MANY TARGETS</p><p className="mt-1 font-bold">Plan several applications</p></div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4"><p className="text-xs text-amber-200">03 · PROOF FIRST</p><p className="mt-1 font-bold">Track each provider separately</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-300">
            Important: saving this form does not submit to universities, CAO, NSFAS, SETAs, employers or other providers. Each provider has its own requirements and submission protocol. Kingsmen must only report a submission after evidence from the relevant route is recorded.
          </p>
        </header>

        {!token && <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">Sign in through your existing Kingsmen/Supabase Auth session to load or save your private profile. No information is stored in this browser-only form. <a className="font-bold underline" href="/candidate/login">Sign in here</a>.</section>}
        {loading && <p role="status" className="rounded-xl bg-white p-4 text-sm">Loading your saved master application…</p>}
        {error && <section role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{error}</section>}
        {message && <section role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</section>}

        <form onSubmit={save} className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-black">1. Your candidate profile</h2>
            <p className="mt-1 text-sm text-slate-600">Information is reused for your selected pathways. Do not enter your full South African ID number here.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Full name<input className={fieldClass} autoComplete="name" value={profile.fullName} onChange={e=>updateProfile("fullName",e.target.value)} maxLength={180} required /></label>
              <label className={labelClass}>Email address<input className={fieldClass} type="email" autoComplete="email" value={profile.email} onChange={e=>updateProfile("email",e.target.value)} maxLength={254} /></label>
              <label className={labelClass}>Mobile number<input className={fieldClass} type="tel" autoComplete="tel" value={profile.phone} onChange={e=>updateProfile("phone",e.target.value)} maxLength={40} /></label>
              <label className={labelClass}>Province<select className={fieldClass} value={profile.province} onChange={e=>updateProfile("province",e.target.value)}><option value="">Choose province</option>{["Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo","Mpumalanga","Northern Cape","North West","Western Cape"].map(p=><option key={p}>{p}</option>)}</select></label>
              <label className={labelClass}>City / town<input className={fieldClass} value={profile.city} onChange={e=>updateProfile("city",e.target.value)} maxLength={120} /></label>
              <label className={labelClass}>Highest education completed<input className={fieldClass} value={profile.highestEducation} onChange={e=>updateProfile("highestEducation",e.target.value)} maxLength={180} placeholder="e.g. Matric, N6, diploma, degree" /></label>
              <label className={labelClass+" sm:col-span-2"}>Qualifications and subjects<textarea className={fieldClass} rows={3} value={profile.qualifications} onChange={e=>updateProfile("qualifications",e.target.value)} maxLength={6000} placeholder="Qualifications, institution, year, subjects and results where relevant" /></label>
              <label className={labelClass+" sm:col-span-2"}>Skills and licences<textarea className={fieldClass} rows={3} value={profile.skills} onChange={e=>updateProfile("skills",e.target.value)} maxLength={6000} placeholder="Skills, certificates, licences, languages and competencies" /></label>
              <label className={labelClass+" sm:col-span-2"}>Work and experience history<textarea className={fieldClass} rows={4} value={profile.workHistory} onChange={e=>updateProfile("workHistory",e.target.value)} maxLength={10000} placeholder="Employers, roles, dates, duties, achievements, volunteering or practical experience" /></label>
              <label className={labelClass+" sm:col-span-2"}>CV / personal statement summary<textarea className={fieldClass} rows={4} value={profile.cvSummary} onChange={e=>updateProfile("cvSummary",e.target.value)} maxLength={10000} placeholder="Paste a summary for reuse. Private CV and certificate files belong in the document vault." /></label>
              <label className={labelClass+" sm:col-span-2"}>Preferred locations<input className={fieldClass} value={profile.preferredLocations} onChange={e=>updateProfile("preferredLocations",e.target.value)} maxLength={500} placeholder="e.g. Gauteng, national, willing to relocate" /></label>
              <label className={labelClass+" sm:col-span-2"}>Funding needs<textarea className={fieldClass} rows={2} value={profile.fundingNeeds} onChange={e=>updateProfile("fundingNeeds",e.target.value)} maxLength={3000} placeholder="Bursaries, NSFAS guidance, sponsors or other funding needs" /></label>
              <label className={labelClass+" sm:col-span-2"}>Accommodation / transport needs<textarea className={fieldClass} rows={2} value={profile.accommodationNeeds} onChange={e=>updateProfile("accommodationNeeds",e.target.value)} maxLength={3000} /></label>
              <label className={labelClass+" sm:col-span-2"}>Other information relevant to your applications<textarea className={fieldClass} rows={3} value={profile.additionalNotes} onChange={e=>updateProfile("additionalNotes",e.target.value)} maxLength={5000} /></label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-black">2. Select every pathway you want Kingsmen to consider</h2>
            <p className="mt-1 text-sm text-slate-600">All pathways remain available at the 500-candidate initial operating cap; the cap limits volume, not route coverage.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PATHWAYS.map(([value,label])=><label key={value} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:border-amber-400"><input type="checkbox" className="mt-1 h-4 w-4 accent-amber-600" checked={pathways.includes(value)} onChange={()=>togglePathway(value)} /><span className="text-sm font-semibold">{label}</span></label>)}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-black">3. Your application targets</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Add multiple institutions, programmes, learnerships or jobs in this same form. These records are saved as plans, not submitted applications. Candidate-entered sources remain unverified until checked against official evidence.</p></div>
              <button type="button" onClick={()=>setTargets(current=>[...current,emptyTarget()])} disabled={targets.length>=25} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40">+ Add target</button>
            </div>
            <div className="mt-5 space-y-4">
              {targets.map((target,index)=><article key={target.targetKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3"><h3 className="font-bold">Target {index+1}</h3><button type="button" onClick={()=>setTargets(current=>current.filter((_,i)=>i!==index))} className="text-xs font-semibold text-rose-700">Remove</button></div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>Pathway<select className={fieldClass} value={target.pathwayType} onChange={e=>updateTarget(index,"pathwayType",e.target.value)}>{PATHWAYS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                  <label className={labelClass}>Institution / provider / employer<input className={fieldClass} value={target.providerName} onChange={e=>updateTarget(index,"providerName",e.target.value)} maxLength={180} placeholder="e.g. institution or employer name" /></label>
                  <label className={labelClass+" sm:col-span-2"}>Programme / job / opportunity<input className={fieldClass} value={target.programmeOrRole} onChange={e=>updateTarget(index,"programmeOrRole",e.target.value)} maxLength={240} placeholder="Specific programme, qualification, role or opportunity" /></label>
                  <label className={labelClass+" sm:col-span-2"}>Official application page (optional)<input className={fieldClass} type="url" value={target.providerApplicationUrl} onChange={e=>updateTarget(index,"providerApplicationUrl",e.target.value)} placeholder="https://…" /></label>
                  <label className={labelClass+" sm:col-span-2"}>Source reference / notes (optional)<input className={fieldClass} value={target.sourceReference} onChange={e=>updateTarget(index,"sourceReference",e.target.value)} maxLength={500} placeholder="Where you found this opportunity; do not treat as verified proof" /></label>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">Status: planning · source confidence: unverified · provider submission: not sent.</p>
              </article>)}
            </div>
          </section>

          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-7">
            <h2 className="text-lg font-black">4. Consent and save</h2>
            <label className="mt-3 flex items-start gap-3 text-sm leading-6 text-amber-950"><input type="checkbox" className="mt-1 h-4 w-4 accent-amber-700" checked={consent} onChange={e=>setConsent(e.target.checked)} /><span>I consent to Kingsmen storing this profile and the targets I choose so my information can be reused to prepare relevant applications. I understand I can request correction, that sensitive documents use the private document vault, and that saving this form is not a provider submission or a guarantee of eligibility, funding, admission, placement or employment.</span></label>
            {savedAt && <p className="mt-3 text-xs text-slate-600">Last saved: {new Date(savedAt).toLocaleString()}</p>}
            <button type="submit" disabled={saving || loading} className="mt-5 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving securely…" : "Save my one master application"}</button>
          </section>
        </form>

        <footer className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600">
          Privacy boundary: the API verifies your Supabase Auth session and database row-level security determines the linked candidate record. No service-role key is sent to the browser. Each real submission, provider receipt and outcome must later be recorded separately with route-specific evidence; CAO programme choices remain child items under one CAO application.
        </footer>
      </div>
    </main>
  );
}
