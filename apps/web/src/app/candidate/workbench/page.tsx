"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./workbench.module.css";

const PATHWAYS = [
  ["HIGHER_EDUCATION", "Higher Education"],
  ["TVET", "TVET"],
  ["SETA_LEARNERSHIP", "SETA programmes & learnerships"],
  ["INTERNSHIP", "Internships"],
  ["APPRENTICESHIP", "Apprenticeships"],
  ["EMPLOYMENT", "Employment"]
] as const;

type ApplicationTarget = {
  id?: string;
  target_key?: string;
  pathway_type?: string;
  provider_name?: string;
  programme_or_role?: string;
  provider_application_url?: string;
  source_reference?: string;
  source_confidence?: string;
  planning_status?: string;
  application_id?: string | null;
  created_at?: string;
  updated_at?: string;
};
type ParentApplication = {
  id?: string;
  application_ref?: string;
  pathway_type?: string;
  status?: string;
  readiness_status?: string;
  readiness_snapshot?: unknown;
  created_at?: string;
  updated_at?: string;
};
type PreparationItem = {
  id?: string;
  tracker_id?: string;
  item_type?: string;
  title?: string;
  candidate_note?: string;
  official_source_url?: string;
  evidence_reference?: string;
  status?: string;
  required_by_candidate?: boolean;
  due_date?: string | null;
  updated_at?: string;
};
type SavedOpportunity = { id?: string; title?: string; organisation?: string; official_url?: string; pathway?: string; closing_date?: string | null };
type Tracker = {
  id?: string; candidate_id?: string; saved_opportunity_id?: string; status?: string;
  candidate_note?: string; evidence_reference?: string; created_at?: string; updated_at?: string;
  candidate_workspace_saved_opportunities?: SavedOpportunity | SavedOpportunity[] | null;
};
type Feed = {
  ready?: boolean; error?: string; code?: string; message?: string;
  trackers?: Tracker[]; items?: PreparationItem[]; masterTargets?: ApplicationTarget[];
  parentApplications?: ParentApplication[]; masterEvents?: Array<Record<string, unknown>>;
  applicationEvents?: Array<Record<string, unknown>>;
};
type OperationResponse = Feed & { application?: unknown; target_key?: string; targetKey?: string; saved?: boolean };

function getAccessToken(): string | null {
  try {
    const stored = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch { return null; }
}

async function applicationRequest(payload: Record<string, unknown>): Promise<OperationResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = getAccessToken();
  if (!url || !anonKey) throw new Error("The application workbench is not configured for this deployment.");
  if (!token) throw new Error("Sign in first. Your authenticated session was not found in this browser.");
  const response = await fetch(url.replace(/\/$/, "") + "/functions/v1/candidate-application-preparation", {
    method: "POST",
    headers: { apikey: anonKey, Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  const result = await response.json() as OperationResponse;
  if (!response.ok || (payload.action === "load" && result.ready !== true)) {
    throw new Error(result.error || result.message || result.code || ("Workbench request failed (" + response.status + ")."));
  }
  return result;
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function pathwayLabel(value?: string) {
  if (!value) return "Pathway not recorded";
  const match = PATHWAYS.find(([key]) => key === value.toUpperCase());
  return match?.[1] || value.replaceAll("_", " ");
}
function recordStatus(value?: string) {
  return (value || "UNKNOWN").replaceAll("_", " ");
}

export default function CandidateWorkbenchPage() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preparing, setPreparing] = useState<string | null>(null);
  const [prepareMessages, setPrepareMessages] = useState<Record<string, string>>({});
  const [prepareErrors, setPrepareErrors] = useState<Record<string, string>>({});

  const loadWorkbench = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await applicationRequest({ action: "load" });
      setFeed(result);
      setMessage(result.message || "Application preparation records loaded.");
    } catch (e) {
      setFeed(null);
      setError(e instanceof Error ? e.message : "Could not load application workbench.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadWorkbench(); }, [loadWorkbench]);

  const targets = useMemo(() => {
    const all = feed?.masterTargets ?? [];
    return filter === "ALL" ? all : all.filter(t => (t.pathway_type || "").toUpperCase() === filter);
  }, [feed, filter]);

  const targetToApplication = useMemo(() => {
    const byId = new Map<string, ParentApplication>();
    for (const application of feed?.parentApplications ?? []) if (application.id) byId.set(application.id, application);
    return byId;
  }, [feed]);

  const targetTrackers = useMemo(() => {
    const bySavedId = new Map<string, Tracker>();
    for (const tracker of feed?.trackers ?? []) if (tracker.saved_opportunity_id) bySavedId.set(tracker.saved_opportunity_id, tracker);
    return bySavedId;
  }, [feed]);

  async function prepareTarget(target: ApplicationTarget) {
    const targetKey = target.target_key || "";
    if (!targetKey) {
      setPrepareErrors(current => ({ ...current, [target.id || "unknown"]: "This target has no supported parent-application key; nothing was sent." }));
      return;
    }
    const key = target.id || targetKey;
    setPreparing(key);
    setPrepareErrors(current => ({ ...current, [key]: "" }));
    setPrepareMessages(current => ({ ...current, [key]: "" }));
    try {
      const result = await applicationRequest({ action: "prepare_master_application", target_key: targetKey });
      setPrepareMessages(current => ({ ...current, [key]: result.message || "The application service returned a preparation response." }));
      await loadWorkbench();
    } catch (e) {
      setPrepareErrors(current => ({ ...current, [key]: e instanceof Error ? e.message : "Parent application preparation was not confirmed." }));
    } finally {
      setPreparing(null);
    }
  }

  const trackers = feed?.trackers ?? [];
  const items = feed?.items ?? [];
  const parents = feed?.parentApplications ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Application workbench navigation">
          <a className={styles.brand} href="/" aria-label="Kingsmen Portal home">
            <span className={styles.mark} aria-hidden="true">K</span>
            <span><strong>KINGSMEN</strong><small>APPLICATION WORKBENCH</small></span>
          </a>
          <div className={styles.navLinks}>
            <a href="/candidate/dashboard">Dashboard</a>
            <a href="/candidate/profile">Profile & consent</a>
            <a href="/candidate/opportunity-matches">Verified matches</a>
            <a href="/candidate/saved-opportunities">Saved opportunities</a>
            <a href="/personal-job-desk/application-tracker">Application tracker</a>
          </div>
        </nav>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Candidate workspace · Application preparation</p>
          <h1>One workbench. Six pathways.</h1>
          <p className={styles.lead}>
            This workbench loads saved targets and parent-application preparation records from Kingsmen’s authenticated service.
            A saved target is not a provider submission. The service may require verified candidate identity, active consent, and fresh official-source evidence before it allows a preparation action.
          </p>
          <div className={styles.actions}>
            <button className={styles.primary} type="button" onClick={() => void loadWorkbench()} disabled={loading || preparing !== null}>
              {loading ? "Refreshing workbench…" : "Reload saved application records"}
            </button>
            <a className={styles.secondary} href="/candidate/opportunity-matches">Find verified opportunities ↗</a>
          </div>
        </header>

        {error && (
          <section className={styles.error} role="alert">
            {error}
            {error.toLowerCase().includes("identity") || error.includes("IDENTITY_NOT_VERIFIED")
              ? " An authorised reviewer must verify the candidate identity link before application records can be accessed." : ""}
            <div className={styles.actions}><a href="/candidate/profile" className={styles.secondary}>Open candidate profile</a></div>
          </section>
        )}
        {message && !error && <section className={styles.status} role="status">{message}</section>}

        {feed && !error && (
          <>
            <section className={styles.stats} aria-label="Application workspace summary">
              <div className={styles.stat}><strong>{targets.length}</strong><span>Saved application target(s) in selected pathway scope</span></div>
              <div className={styles.stat}><strong>{parents.length}</strong><span>Parent application(s) returned by the service</span></div>
              <div className={styles.stat}><strong>{trackers.length}</strong><span>Preparation tracker(s) loaded</span></div>
            </section>

            <section className={styles.section} aria-labelledby="pathways-heading">
              <div className={styles.sectionHeader}>
                <div><h2 id="pathways-heading">Six pathway gates</h2><p className={styles.muted}>Your package controls priority volume and service capacity, not pathway visibility.</p></div>
              </div>
              <div className={styles.pathways}>
                {PATHWAYS.map(([code, label]) => (
                  <article className={styles.pathway} key={code} data-gate={code.toLowerCase()}>
                    <h3>{label}</h3>
                    <p>Explore eligible opportunities when the official source, deadline, provider route and candidate access pass their checks.</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} aria-labelledby="targets-heading">
              <div className={styles.sectionHeader}>
                <div><h2 id="targets-heading">Saved application targets</h2><p className={styles.muted}>Retry parent-application preparation only where the existing service permits it. The operation does not submit to a provider.</p></div>
                <label className={styles.muted}>Filter by pathway{" "}
                  <select className={styles.select} value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="ALL">All pathways</option>
                    {PATHWAYS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                </label>
              </div>
              {targets.length === 0 ? (
                <div className={styles.empty}>
                  <h3>No saved targets in this view.</h3>
                  <p>Open verified matches, select an eligible opportunity and use “Save to application workbench”. Saving rechecks source and identity gates; stale or unreviewed listings are not substituted to fill this view.</p>
                  <div className={styles.actions}><a href="/candidate/opportunity-matches" className={styles.secondary}>Open verified matches</a></div>
                </div>
              ) : (
                <div className={styles.targetGrid}>
                  {targets.map((target, index) => {
                    const key = target.id || target.target_key || String(index);
                    const parent = target.application_id ? targetToApplication.get(target.application_id) : undefined;
                    const tracker = target.saved_opportunity_id ? targetTrackers.get(target.saved_opportunity_id) : undefined;
                    return (
                      <article className={styles.card} key={key}>
                        <div className={styles.tags}>
                          <span className={styles.tag}>{pathwayLabel(target.pathway_type)}</span>
                          <span className={styles.tag}>{recordStatus(target.planning_status)}</span>
                        </div>
                        <h3>{target.programme_or_role || "Application target"}</h3>
                        <p className={styles.provider}>{target.provider_name || "Provider not recorded"}</p>
                        <dl className={styles.facts}>
                          <div className={styles.fact}><dt>Parent application</dt><dd>{parent?.application_ref || (target.application_id ? "Linked application ID" : "Not yet linked")}</dd></div>
                          <div className={styles.fact}><dt>Application status</dt><dd>{recordStatus(parent?.status || target.planning_status)}</dd></div>
                          <div className={styles.fact}><dt>Readiness</dt><dd>{recordStatus(parent?.readiness_status || "NOT_REPORTED")}</dd></div>
                          <div className={styles.fact}><dt>Tracker</dt><dd>{recordStatus(tracker?.status || "NOT_CREATED")}</dd></div>
                          <div className={styles.fact}><dt>Target reference</dt><dd>{target.target_key || "Not available"}</dd></div>
                          <div className={styles.fact}><dt>Updated</dt><dd>{formatDate(target.updated_at || target.created_at)}</dd></div>
                        </dl>
                        <div className={styles.actions}>
                          {target.provider_application_url?.startsWith("https://") && <a className={styles.secondary} href={target.provider_application_url} target="_blank" rel="noopener noreferrer">Official provider page ↗</a>}
                          <button className={styles.primary} type="button" disabled={preparing !== null || Boolean(target.application_id)} onClick={() => void prepareTarget(target)}>
                            {preparing === key ? "Preparing…" : target.application_id ? "Parent application linked" : "Prepare parent application"}
                          </button>
                        </div>
                        {prepareMessages[key] && <div className={styles.status} role="status">{prepareMessages[key]}</div>}
                        {prepareErrors[key] && <div className={styles.error} role="alert">{prepareErrors[key]}</div>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={styles.section} aria-labelledby="parents-heading">
              <div className={styles.sectionHeader}><div><h2 id="parents-heading">Parent applications</h2><p className={styles.muted}>The parent application is the Kingsmen application unit. Child programme choices do not each become separate parent applications.</p></div></div>
              {parents.length === 0 ? (
                <div className={styles.empty}><h3>No parent application records were returned.</h3><p>Save a currently verified opportunity first, or reload after identity review and application preparation have completed.</p></div>
              ) : (
                <div className={styles.parentList}>
                  {parents.map((application, index) => (
                    <article className={styles.parent} key={application.id || application.application_ref || index}>
                      <h3>{application.application_ref || "Parent application"}</h3>
                      <p><strong>Pathway:</strong> {pathwayLabel(application.pathway_type)} · <strong>Status:</strong> {recordStatus(application.status)} · <strong>Readiness:</strong> {recordStatus(application.readiness_status)}</p>
                      <p><strong>Last updated:</strong> {formatDate(application.updated_at || application.created_at)}</p>
                      <p>Provider submission is not inferred from a prepared parent application. Only a provider-origin receipt or response can confirm receipt or an outcome.</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.section} aria-labelledby="checklist-heading">
              <div className={styles.sectionHeader}><div><h2 id="checklist-heading">Preparation checklist</h2><p className={styles.muted}>These are the existing items returned by the backend; no browser-only checklist state is presented as saved.</p></div></div>
              {items.length === 0 ? (
                <div className={styles.empty}><h3>No checklist items returned.</h3><p>Checklist items are created only when the backend creates or repairs a pathway-specific tracker.</p></div>
              ) : (
                <div className={styles.itemList}>
                  {items.map((item, index) => (
                    <article className={styles.item} key={item.id || index}>
                      <strong>{item.title || "Preparation item"} <span className={styles.tag}>{recordStatus(item.status)}</span></strong>
                      <p>{item.item_type || "ITEM"}{item.required_by_candidate ? " · Candidate action" : ""}{item.due_date ? " · Due " + item.due_date : ""}</p>
                      {item.candidate_note && <p>{item.candidate_note}</p>}
                      {item.official_source_url?.startsWith("https://") && <p><a href={item.official_source_url} target="_blank" rel="noopener noreferrer">Official source ↗</a></p>}
                      {item.evidence_reference && <p>Evidence reference: {item.evidence_reference}</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.warning} aria-label="Application status safety boundary">
              Candidate-reported progress remains candidate-reported. “Prepared” or “ready” does not mean submitted, received by the provider, accepted, funded or hired. Provider-confirmed receipt and provider-issued outcomes require provider-origin evidence. No admission, funding, placement, employment or success is guaranteed.
            </section>
          </>
        )}

        <footer className={styles.footer}>
          Kingsmen Portal · One candidate account · Reusable profile · One parent application per Kingsmen application unit · Six pathways.
        </footer>
      </div>
    </main>
  );
}
