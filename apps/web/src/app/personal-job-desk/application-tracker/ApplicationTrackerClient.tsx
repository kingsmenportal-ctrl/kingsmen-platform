"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./application-tracker.module.css";

const PATHWAYS: Record<string, string> = {
  HIGHER_EDUCATION: "Higher Education",
  TVET: "TVET",
  SETA_LEARNERSHIP: "SETA programmes & learnerships",
  SETA_LEARNERSHIPS: "SETA programmes & learnerships",
  INTERNSHIP: "Internships",
  INTERNSHIPS: "Internships",
  APPRENTICESHIP: "Apprenticeships",
  APPRENTICESHIPS: "Apprenticeships",
  EMPLOYMENT: "Employment"
};

type SavedOpportunity = {
  id?: string;
  title?: string;
  organisation?: string;
  official_url?: string;
  pathway?: string;
  closing_date?: string | null;
};
type Tracker = {
  id: string;
  status?: string;
  candidate_note?: string;
  evidence_reference?: string;
  created_at?: string;
  updated_at?: string;
  saved_opportunity_id?: string;
  candidate_workspace_saved_opportunities?: SavedOpportunity | SavedOpportunity[] | null;
};
type ApplicationTarget = {
  id?: string;
  target_key?: string;
  pathway_type?: string;
  provider_name?: string;
  programme_or_role?: string;
  provider_application_url?: string;
  source_reference?: string;
  planning_status?: string;
  application_id?: string | null;
  created_at?: string;
  updated_at?: string;
};
type ParentApplication = {
  id: string;
  application_ref?: string;
  pathway_type?: string;
  status?: string;
  readiness_status?: string;
  created_at?: string;
  updated_at?: string;
};
type AuditEvent = {
  id?: string;
  application_id?: string | null;
  master_target_id?: string | null;
  event_type?: string;
  from_status?: string | null;
  to_status?: string | null;
  reason_code?: string | null;
  evidence_reference?: string | null;
  evidence_ref?: string | null;
  details?: unknown;
  created_at?: string;
};
type TrackerFeed = {
  ready?: boolean;
  tracker?: Tracker;
  status?: string;
  message?: string;
  error?: string;
  code?: string;
  trackers?: Tracker[];
  masterTargets?: ApplicationTarget[];
  parentApplications?: ParentApplication[];
  masterEvents?: AuditEvent[];
  applicationEvents?: AuditEvent[];
};

function getAccessToken(): string | null {
  try {
    const raw = window.localStorage.getItem("sb-euhubhhnumtibbyufghm-auth-token");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}

function labelFor(value?: string | null) {
  if (!value) return "Not recorded";
  return PATHWAYS[value.toUpperCase()] || value.replaceAll("_", " ");
}
function statusFor(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "Not reported";
}
function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}
function opportunityFor(tracker: Tracker) {
  const value = tracker.candidate_workspace_saved_opportunities;
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
function detailsFor(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return "Details available"; }
}

export default function ApplicationTrackerClient() {
  const [feed, setFeed] = useState<TrackerFeed | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editStatus, setEditStatus] = useState("SAVED");
  const [editNote, setEditNote] = useState("");
  const [editEvidence, setEditEvidence] = useState("");
  const [saving, setSaving] = useState(false);

  const trackers = useMemo(() => feed?.trackers ?? [], [feed]);
  const targets = useMemo(() => feed?.masterTargets ?? [], [feed]);
  const applications = useMemo(() => feed?.parentApplications ?? [], [feed]);
  const applicationEvents = useMemo(() => feed?.applicationEvents ?? [], [feed]);
  const masterEvents = useMemo(() => feed?.masterEvents ?? [], [feed]);
  const statuses = useMemo(() => Array.from(new Set(trackers.map(item => item.status).filter((item): item is string => Boolean(item)))).sort(), [trackers]);

  const filtered = useMemo(() => filter === "ALL" ? trackers : trackers.filter(item => item.status === filter), [trackers, filter]);
  const selected = useMemo(
    () => filtered.find(item => item.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );
  const selectedOpportunity = selected ? opportunityFor(selected) : null;
  const selectedTarget = useMemo(() => {
    if (!selected) return null;
    if (selectedOpportunity?.official_url) {
      const exact = targets.find(target => target.provider_application_url === selectedOpportunity.official_url);
      if (exact) return exact;
    }
    return targets.find(target => target.target_key && selected.evidence_reference?.includes(target.target_key)) ?? null;
  }, [selected, selectedOpportunity?.official_url, selected?.evidence_reference, targets]);
  const selectedApplication = useMemo(() => {
    const id = selectedTarget?.application_id;
    return id ? applications.find(application => application.id === id) ?? null : null;
  }, [selectedTarget?.application_id, applications]);

  const relatedApplicationEvents = useMemo(() => {
    if (!selectedApplication?.id) return [];
    return applicationEvents
      .filter(event => event.application_id === selectedApplication.id)
      .sort((a, b) => (Date.parse(b.created_at ?? "") || 0) - (Date.parse(a.created_at ?? "") || 0));
  }, [applicationEvents, selectedApplication?.id]);
  const recentMasterEvents = useMemo(() =>
    masterEvents
      .filter(event => !selectedTarget?.id || !event.master_target_id || event.master_target_id === selectedTarget.id)
      .sort((a, b) => (Date.parse(b.created_at ?? "") || 0) - (Date.parse(a.created_at ?? "") || 0))
      .slice(0, 8),
  [masterEvents, selectedTarget?.id]);

  const loadTracker = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const token = getAccessToken();
      if (!url || !anonKey) throw new Error("The authenticated application tracker is not configured for this deployment.");
      if (!token) throw new Error("Sign in first. Your authenticated session was not found in this browser.");
      const response = await fetch(url.replace(/\/$/, "") + "/functions/v1/candidate-application-preparation", {
        method: "POST",
        headers: { apikey: anonKey, Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load" }),
        cache: "no-store"
      });
      const result = await response.json() as TrackerFeed;
      if (!response.ok || result.ready !== true) {
        throw new Error(result.error || result.message || result.code || ("Application tracker request failed (" + response.status + ")."));
      }
      setFeed(result);
      setSelectedId(current => current && result.trackers?.some(item => item.id === current) ? current : result.trackers?.[0]?.id ?? "");
      setMessage(result.message || "Authenticated application records loaded from Kingsmen.");
    } catch (e) {
      setFeed(null);
      setError(e instanceof Error ? e.message : "Could not load application records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTracker(); }, [loadTracker]);

  useEffect(() => {
    setEditStatus(selected?.status || "SAVED");
    setEditNote(selected?.candidate_note || "");
    setEditEvidence(selected?.evidence_reference || "");
  }, [selected?.id, selected?.status, selected?.candidate_note, selected?.evidence_reference]);

  async function saveTrackerUpdate() {
    if (!selected) return;
    setError("");
    setMessage("");
    if (editStatus === "SUBMITTED_CANDIDATE_REPORTED" && !editEvidence.trim()) {
      setError("Add a reference to your own submission evidence before recording candidate-reported submission.");
      return;
    }
    if (editNote.length > 1200 || editEvidence.length > 500) {
      setError("The note must be 1,200 characters or fewer and the evidence reference must be 500 characters or fewer.");
      return;
    }
    setSaving(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const token = getAccessToken();
      if (!url || !anonKey) throw new Error("The application tracker is not configured for this deployment.");
      if (!token) throw new Error("Sign in first. Your authenticated session was not found in this browser.");
      const response = await fetch(url.replace(/\/$/, "") + "/functions/v1/candidate-application-preparation", {
        method: "POST",
        headers: { apikey: anonKey, Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_tracker",
          tracker_id: selected.id,
          status: editStatus,
          candidate_note: editNote,
          evidence_reference: editEvidence
        }),
        cache: "no-store"
      });
      const result = await response.json() as TrackerFeed;
      if (!response.ok || result.ready !== true) {
        throw new Error(result.error || result.message || result.code || ("Tracker update failed (" + response.status + ")."));
      }
      await loadTracker();
      setMessage(result.message || "Candidate-reported tracker changes were saved by Kingsmen.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The candidate tracker update was not confirmed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Application tracker navigation">
          <a className={styles.brand} href="/" aria-label="Kingsmen Portal home">
            <span className={styles.mark} aria-hidden="true">K</span>
            <span><strong>KINGSMEN</strong><small>APPLICATION TRACKER</small></span>
          </a>
          <div className={styles.navLinks}>
            <a href="/candidate/dashboard">Dashboard</a>
            <a href="/candidate/profile">Profile & consent</a>
            <a href="/candidate/opportunity-matches">Verified matches</a>
            <a href="/candidate/workbench">Application workbench</a>
          </div>
        </nav>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Candidate workspace · Evidence-aware progress</p>
          <h1>Application tracker.</h1>
          <p className={styles.lead}>
            Review the application and preparation records linked to your signed-in candidate account. Tracker states, parent applications and audit events come from the authenticated Kingsmen service. A candidate-reported status is not treated as provider-confirmed receipt or a provider decision.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => void loadTracker()} disabled={loading}>
              {loading ? "Refreshing records…" : "Refresh application records"}
            </button>
            <a href="/candidate/workbench" className={styles.secondary}>Open application workbench ↗</a>
          </div>
        </header>

        {message && !error && <section className={styles.status} role="status">{message}</section>}
        {error && (
          <section className={styles.error} role="alert">
            {error}
            {error.toLowerCase().includes("identity") || error.includes("IDENTITY_NOT_VERIFIED")
              ? " Candidate identity review must be completed by an authorised reviewer before protected application records can be accessed." : ""}
            <div className={styles.actions}><a href="/candidate/profile" className={styles.secondary}>Review profile and consent ↗</a></div>
          </section>
        )}

        {feed && !error && (
          <>
            <section className={styles.stats} aria-label="Application tracker summary">
              <div className={styles.stat}><strong>{trackers.length}</strong><span>Saved opportunity tracker(s)</span></div>
              <div className={styles.stat}><strong>{applications.length}</strong><span>Parent application(s) returned by the service</span></div>
              <div className={styles.stat}><strong>{applicationEvents.length + masterEvents.length}</strong><span>Application / target audit events</span></div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div><h2>Tracked opportunities</h2><p className={styles.muted}>Select a record to view its current server state, linked parent application, reference details and available audit history.</p></div>
                <label className={styles.muted}>Status filter{" "}
                  <select className={styles.select} value={filter} onChange={event => setFilter(event.target.value)}>
                    <option value="ALL">All statuses</option>
                    {statuses.map(status => <option key={status} value={status}>{statusFor(status)}</option>)}
                  </select>
                </label>
              </div>

              <div className={styles.layout}>
                <aside className={styles.panel} aria-label="Tracked opportunity list">
                  <h3 className={styles.sectionTitle}>My records</h3>
                  {filtered.length === 0 ? (
                    <div className={styles.empty}>
                      <h3>No tracked records in this view.</h3>
                      <p>Open verified matches and save an eligible opportunity to the application workbench. Candidate identity review and active consent may be required.</p>
                      <div className={styles.actions}><a href="/candidate/opportunity-matches" className={styles.secondary}>Find verified matches ↗</a></div>
                    </div>
                  ) : (
                    <div className={styles.list}>
                      {filtered.map((item, index) => {
                        const opportunity = opportunityFor(item);
                        return (
                          <button key={item.id || index} type="button" className={styles.listItem}
                            aria-current={(selected?.id === item.id) ? "true" : undefined}
                            onClick={() => setSelectedId(item.id)}>
                            <strong>{opportunity?.title || "Application preparation record"}</strong>
                            <span>{opportunity?.organisation || "Provider not recorded"}</span>
                            <span>{labelFor(opportunity?.pathway)} · {statusFor(item.status)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </aside>

                <section className={styles.panel} aria-label="Selected application record">
                  {!selected ? (
                    <div className={styles.empty}><h3>No record selected.</h3><p>There are no tracker records in the selected view.</p></div>
                  ) : (
                    <>
                      <div className={styles.tagRow}>
                        <span className={styles.tag}>{statusFor(selected.status)}</span>
                        <span className={styles.tag}>{labelFor(selectedOpportunity?.pathway || selectedTarget?.pathway_type)}</span>
                        {selectedApplication && <span className={styles.tag}>Parent application linked</span>}
                      </div>
                      <h2 className={styles.panelTitle}>{selectedOpportunity?.title || selectedTarget?.programme_or_role || "Application preparation record"}</h2>
                      <p className={styles.provider}>{selectedOpportunity?.organisation || selectedTarget?.provider_name || "Provider not recorded"}</p>

                      <dl className={styles.facts}>
                        <div className={styles.fact}><dt>Record status</dt><dd>{statusFor(selected.status)}</dd></div>
                        <div className={styles.fact}><dt>Parent application</dt><dd>{selectedApplication?.application_ref || (selectedApplication ? selectedApplication.id : "Not linked / not returned")}</dd></div>
                        <div className={styles.fact}><dt>Application status</dt><dd>{statusFor(selectedApplication?.status)}</dd></div>
                        <div className={styles.fact}><dt>Readiness</dt><dd>{statusFor(selectedApplication?.readiness_status)}</dd></div>
                        <div className={styles.fact}><dt>Closing date</dt><dd>{selectedOpportunity?.closing_date || "Not established in this tracker record; recheck the official source."}</dd></div>
                        <div className={styles.fact}><dt>Last updated</dt><dd>{formatDate(selected.updated_at || selected.created_at)}</dd></div>
                        <div className={styles.fact}><dt>Evidence reference</dt><dd>{selected.evidence_reference || selectedTarget?.source_reference || "No reference recorded"}</dd></div>
                      </dl>

                      <h3 className={styles.sectionTitle}>Update your tracker</h3>
                      <p className={styles.muted}>These changes are recorded as candidate-reported tracker data. Kingsmen cannot set provider receipt or provider outcome from this control.</p>
                      <div className={styles.editor}>
                        <label className={styles.editorField}>
                          Candidate-reported status
                          <select className={styles.select} value={editStatus} onChange={event => setEditStatus(event.target.value)} disabled={saving}>
                            <option value="SAVED">Saved</option>
                            <option value="PREPARING">Preparing</option>
                            <option value="READY_TO_APPLY">Ready to apply</option>
                            <option value="SUBMITTED_CANDIDATE_REPORTED">I report that I submitted</option>
                          </select>
                        </label>
                        <label className={styles.editorField}>
                          Candidate note
                          <textarea className={styles.textarea} value={editNote} onChange={event => setEditNote(event.target.value)} maxLength={1200} placeholder="Add a note or a question for your Kingsmen support record." disabled={saving} />
                          <span className={styles.hint}>{editNote.length}/1,200 characters</span>
                        </label>
                        <label className={styles.editorField}>
                          Submission evidence reference
                          <input className={styles.textInput} value={editEvidence} onChange={event => setEditEvidence(event.target.value)} maxLength={500} placeholder="Reference to your own confirmation or submission evidence" disabled={saving} />
                          <span className={styles.hint}>Required when you select “I report that I submitted”. It is still candidate-reported until independently verified.</span>
                        </label>
                        <button type="button" className={styles.primary} onClick={() => void saveTrackerUpdate()} disabled={saving || loading}>
                          {saving ? "Saving tracker update…" : "Save candidate tracker update"}
                        </button>
                      </div>

                      <h3 className={styles.sectionTitle}>Application events</h3>
                      {relatedApplicationEvents.length === 0 ? (
                        <p className={styles.muted}>No application events are returned for this parent application. This does not imply submission or provider receipt.</p>
                      ) : (
                        <div className={styles.timeline}>
                          {relatedApplicationEvents.map((event, index) => (
                            <article className={styles.event} key={event.id || event.created_at || index}>
                              <strong>{statusFor(event.event_type || "Application event")}</strong>
                              <p>{formatDate(event.created_at)}{event.from_status || event.to_status ? " · " + statusFor(event.from_status) + " → " + statusFor(event.to_status) : ""}</p>
                              {event.reason_code && <p>Reason: {event.reason_code}</p>}
                              {(event.evidence_reference || event.evidence_ref) && <p>Evidence reference: {event.evidence_reference || event.evidence_ref}</p>}
                              {event.details != null && <p>{detailsFor(event.details)}</p>}
                            </article>
                          ))}
                        </div>
                      )}

                      <h3 className={styles.sectionTitle}>Target history</h3>
                      {recentMasterEvents.length === 0 ? (
                        <p className={styles.muted}>No target events are returned for this record.</p>
                      ) : (
                        <div className={styles.timeline}>
                          {recentMasterEvents.map((event, index) => (
                            <article className={styles.event} key={event.id || event.created_at || index}>
                              <strong>{statusFor(event.event_type || "Target event")}</strong>
                              <p>{formatDate(event.created_at)}{event.from_status || event.to_status ? " · " + statusFor(event.from_status) + " → " + statusFor(event.to_status) : ""}</p>
                              {event.reason_code && <p>Reason: {event.reason_code}</p>}
                              {(event.evidence_reference || event.evidence_ref) && <p>Evidence reference: {event.evidence_reference || event.evidence_ref}</p>}
                              {event.details != null && <p>{detailsFor(event.details)}</p>}
                            </article>
                          ))}
                        </div>
                      )}

                      {selectedOpportunity?.official_url?.startsWith("https://") && (
                        <div className={styles.actions}><a href={selectedOpportunity.official_url} className={styles.routeLink} target="_blank" rel="noopener noreferrer">Open official provider page ↗</a></div>
                      )}
                    </>
                  )}
                </section>
              </div>
            </section>

            <section className={styles.notice}>
              Candidate-reported status and notes are written only through the authenticated, candidate-scoped update_tracker action. The screen does not use the legacy local-file note writer. Candidate-reported submission, provider-confirmed receipt and provider-issued outcome remain separate events. No admission, funding, placement, employment or success is guaranteed.
            </section>
          </>
        )}

        <footer className={styles.footer}>
          Kingsmen Portal · One candidate account · One application workbench · Provider receipt and outcomes require provider-origin evidence.
        </footer>
      </div>
    </main>
  );
}
