"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type Profile = {
  fullName?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  location?: string;
  highestEducation?: string;
  workExperience?: string;
  skills?: string;
  notes?: string;
};

type FollowUpTask = {
  taskId: string;
  title: string;
  dueDate: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  status: "OPEN" | "DONE";
  opportunityId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type ContactLogEntry = {
  entryId: string;
  opportunityId?: string;
  contactName: string;
  organisation: string;
  channel: "EMAIL" | "PHONE" | "PORTAL" | "IN_PERSON" | "OTHER";
  direction: "OUTBOUND" | "INBOUND";
  summary: string;
  followUpDate?: string;
  createdAt: string;
};

type FinanceLedgerEntry = { entryId: string; type: "FEE" | "PAYMENT" | "REFUND" | "ADJUSTMENT"; direction: "IN" | "OUT"; status: "RECORDED" | "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED"; amountCents: number; currency: "ZAR"; description: string; reference?: string; evidenceNote?: string; opportunityId?: string; occurredOn: string; createdAt: string;
};

type Store = {
  profile: Profile;
  documents: any[];
  opportunities: any[];
  applicationPacks: any[];
  proofLog: any[];
  smartExtraction: any[];
  tasks: FollowUpTask[];
  contactLog: ContactLogEntry[];
  financeLedger: FinanceLedgerEntry[];
  readiness?: number;
};

const emptyStore: Store = {
  profile: { location: "Johannesburg" },
  documents: [],
  opportunities: [],
  applicationPacks: [],
  proofLog: [],
  smartExtraction: [],
  tasks: [],
  contactLog: [],
  financeLedger: [],
  readiness: 0
};

export default function ApplyNowClient() {
  const [store, setStore] = useState<Store>(emptyStore);
  const [profile, setProfile] = useState<Profile>(emptyStore.profile);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("Ready.");
  const [selectedOpportunity, setSelectedOpportunity] = useState("");
  const [proof, setProof] = useState("");
  const [manualExport, setManualExport] = useState<any>(null);
  const [overwriteExtractionExisting, setOverwriteExtractionExisting] = useState(false);
  const [taskDraft, setTaskDraft] = useState({ title: "", dueDate: "", priority: "NORMAL", opportunityId: "", notes: "" });
  const [financeDraft, setFinanceDraft] = useState({ type: "FEE", direction: "OUT", status: "RECORDED", amount: "", description: "", reference: "", evidenceNote: "", opportunityId: "", occurredOn: new Date().toISOString().slice(0, 10) });
  const [contactDraft, setContactDraft] = useState({ contactName: "", organisation: "", channel: "EMAIL", direction: "OUTBOUND", opportunityId: "", summary: "", followUpDate: "" });
  const [opportunity, setOpportunity] = useState({
    title: "",
    organisation: "",
    category: "JOB",
    applicationMethod: "PORTAL",
    emailTo: "",
    closingDate: "",
    sourceUrl: "",
    notes: ""
  });

  async function api(payload?: any) {
    const response = await fetch("/api/personal-jobs/apply-now", {
      method: payload ? "POST" : "GET",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || "Request failed.");
    }

    return json;
  }

  async function refresh() {
    try {
      const json = await api();
      setStore(json);
      setProfile(json.profile || {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Refresh failed.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const latestPack = store.applicationPacks?.[0];

  const readinessText = useMemo(() => {
    const score = store.readiness || 0;
    if (score >= 80) return "Application-ready";
    if (score >= 50) return "Needs a few items";
    if (score >= 20) return "Profile started";
    return "Not ready yet";
  }, [store.readiness]);

  function setField(key: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile() {
    setBusy("profile");
    try {
      const json = await api({ action: "saveProfile", profile });
      setStore(json.store);
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setBusy("");
    }
  }

  async function uploadDocument(type: string, file: File | null) {
    if (!file) return;

    setBusy(`upload-${type}`);
    setMessage(`Reading ${file.name}...`);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("File read failed."));
        reader.readAsDataURL(file);
      });

      const json = await api({
        action: "uploadDocument",
        documentType: type,
        fileName: file.name,
        dataUrl
      });

      setStore(json.store);
      setProfile(json.store.profile || {});
      setMessage(`${type} uploaded. Smart fields extracted where possible.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy("");
    }
  }

  async function deleteDocument(documentId: string) {
    if (!window.confirm("Permanently delete this uploaded document and its stored file?")) return;
    setBusy(`document-delete-${documentId}`);
    try {
      const json = await api({ action: "deleteDocument", documentId });
      setStore(json.store);
      setMessage("Document and its stored file deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete document.");
    } finally {
      setBusy("");
    }
  }

  async function addOpportunity() {
    setBusy("opportunity");

    try {
      const json = await api({
        action: "addOpportunity",
        opportunity
      });

      setStore(json.store);
      setSelectedOpportunity(json.opportunity.opportunityId);
      setOpportunity({
        title: "",
        organisation: "",
        category: "JOB",
        applicationMethod: "PORTAL",
        emailTo: "",
        closingDate: "",
        sourceUrl: "",
        notes: ""
      });
      setMessage("Opportunity added to queue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add opportunity.");
    } finally {
      setBusy("");
    }
  }

  async function updateOpportunityStatus(opportunityId: string, status: string) {
    setBusy(`status-${opportunityId}`);
    try {
      const json = await api({ action: "updateOpportunityStatus", opportunityId, status });
      setStore(json.store);
      setMessage("Application status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update application status.");
    } finally {
      setBusy("");
    }
  }

  async function generatePack(opportunityId: string) {
    setBusy(`pack-${opportunityId}`);

    try {
      const json = await api({
        action: "generatePack",
        opportunityId
      });

      setStore(json.store);
      setSelectedOpportunity(opportunityId);
      setMessage("Application pack generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not generate pack.");
    } finally {
      setBusy("");
    }
  }

  async function markApplied(opportunityId: string) {
    setBusy(`proof-${opportunityId}`);

    try {
      const json = await api({
        action: "markApplied",
        opportunityId,
        proof
      });

      setStore(json.store);
      setProof("");
      setMessage("Proof captured.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not capture proof.");
    } finally {
      setBusy("");
    }
  }

  async function addFinanceEntry() {
    const amount = Number(financeDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) { setMessage("Enter a positive amount with no more than two decimal places."); return; }
    setBusy("finance-create");
    try { const json = await api({ action: "addFinanceEntry", ...financeDraft, amountCents: Math.round(amount * 100) }); setStore(json.store); setFinanceDraft({ type: "FEE", direction: "OUT", status: "RECORDED", amount: "", description: "", reference: "", evidenceNote: "", opportunityId: "", occurredOn: new Date().toISOString().slice(0, 10) }); setMessage("Finance ledger entry saved. This does not process or verify a payment."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save ledger entry."); } finally { setBusy(""); }
  }

  async function updateFinanceEntry(entryId: string, status: string) {
    const entry = (store.financeLedger || []).find((item) => item.entryId === entryId);
    if (!entry) return;
    let reference = entry.reference || "";
    let evidenceNote = entry.evidenceNote || "";
    if (status === "CONFIRMED" && !reference && !evidenceNote) {
      reference = window.prompt("Enter a payment/receipt reference (or leave blank to provide an evidence note):", "") || "";
      if (!reference.trim()) evidenceNote = window.prompt("Describe the evidence supporting this user-entered status:", "") || "";
      if (!reference.trim() && !evidenceNote.trim()) { setMessage("Confirmation needs a reference or evidence note."); return; }
    }
    setBusy(`finance-status-${entryId}`);
    try {
      const json = await api({ action: "updateFinanceEntry", entryId, status, reference, evidenceNote });
      setStore(json.store);
      setMessage("Ledger status updated. This does not independently verify settlement.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update ledger status.");
    } finally { setBusy(""); }
  }

  async function deleteFinanceEntry(entryId: string) {
    if (!window.confirm("Remove this ledger record? This only removes the portal record, not a bank/payment transaction.")) return;
    setBusy(`finance-delete-${entryId}`); try { const json = await api({ action: "deleteFinanceEntry", entryId }); setStore(json.store); setMessage("Ledger record removed."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not remove ledger record."); } finally { setBusy(""); }
  }

  async function addContactLog() {
    setBusy("contact-create");
    try {
      const json = await api({ action: "addContactLog", ...contactDraft });
      setStore(json.store);
      setContactDraft({ contactName: "", organisation: "", channel: "EMAIL", direction: "OUTBOUND", opportunityId: "", summary: "", followUpDate: "" });
      setMessage("Employer contact saved to your private workspace.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save contact.");
    } finally {
      setBusy("");
    }
  }

  async function deleteContactLog(entryId: string) {
    setBusy(`contact-delete-${entryId}`);
    try {
      const json = await api({ action: "deleteContactLog", entryId });
      setStore(json.store);
      setMessage("Contact log entry removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove contact entry.");
    } finally {
      setBusy("");
    }
  }

  async function addTask() {
    setBusy("task-create");
    try {
      const json = await api({ action: "addTask", ...taskDraft });
      setStore(json.store);
      setTaskDraft({ title: "", dueDate: "", priority: "NORMAL", opportunityId: "", notes: "" });
      setMessage("Follow-up task saved to your workspace.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save task.");
    } finally {
      setBusy("");
    }
  }

  async function updateTask(taskId: string, status: "OPEN" | "DONE") {
    setBusy(`task-${taskId}`);
    try {
      const json = await api({ action: "updateTask", taskId, status });
      setStore(json.store);
      setMessage(status === "DONE" ? "Task marked complete." : "Task reopened.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update task.");
    } finally {
      setBusy("");
    }
  }

  async function deleteTask(taskId: string) {
    setBusy(`task-${taskId}`);
    try {
      const json = await api({ action: "deleteTask", taskId });
      setStore(json.store);
      setMessage("Task removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove task.");
    } finally {
      setBusy("");
    }
  }

  async function deleteOpportunity(opportunityId: string) {
    setBusy(`delete-${opportunityId}`);

    try {
      const json = await api({
        action: "deleteOpportunity",
        opportunityId
      });

      setStore(json.store);
      setMessage("Opportunity removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove opportunity.");
    } finally {
      setBusy("");
    }
  }

  async function confirmExtractedField(extractionId: string, key: string, value: string) {
    setBusy(`extraction-${extractionId}-${key}`);
    try {
      const json = await api({ action: "confirmSmartExtraction", extractionId, fields: { [key]: value }, overwriteExisting: overwriteExtractionExisting });
      setStore(json.store);
      setProfile(json.store.profile || {});
      const applied = (json.appliedFields || []).length;
      const skipped = (json.skippedExistingFields || []).length;
      setMessage(applied ? `Confirmed ${key}. Profile updated.` : skipped ? `${key} was not changed because a profile value already exists. Enable overwrite only if you intend to replace it.` : "No fields were changed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not confirm extracted value.");
    } finally {
      setBusy("");
    }
  }

  async function prepareManualExport(opportunityId: string) {
    setBusy(`export-${opportunityId}`);
    setManualExport(null);
    try {
      const json = await api({ action: "prepareManualExport", opportunityId });
      setManualExport(json.bundle);
      setSelectedOpportunity(opportunityId);
      setMessage("Manual export checklist prepared. Review every item before sharing documents.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not prepare export checklist.");
    } finally {
      setBusy("");
    }
  }

  async function copyManualExport() {
    if (!manualExport) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(manualExport, null, 2));
      setMessage("Manual export checklist copied. Review it before sharing anything.");
    } catch {
      setMessage("Clipboard unavailable. Review the checklist shown below.");
    }
  }

  function copyPack() {
    if (!latestPack?.body) return;
    navigator.clipboard.writeText(latestPack.body);
    setMessage("Application pack copied.");
  }

  return (
    <main style={page}>
      <section style={hero}>
        <div>
          <p style={eyebrow}>SMART APPLY WORKBENCH</p>
          <h1 style={title}>Upload CV once. Apply many times.</h1>
          <p style={lead}>
            Kingsmen reads your CV where possible, prepares your application profile, stores documents,
            builds application packs, opens official sources, and captures proof.
          </p>
        </div>

        <aside style={readinessCard}>
          <div style={circle}>{store.readiness || 0}%</div>
          <strong>{readinessText}</strong>
          <small>Profile + CV + ID + opportunity + pack + proof</small>
        </aside>
      </section>

      <section style={statusBar}>
        <span>{message}</span>
        <button onClick={refresh} style={smallButton}>Refresh</button>
      </section>

      <section style={metrics}>
        <Metric value={store.documents.length} label="Documents" />
        <Metric value={store.opportunities.length} label="Opportunities" />
        <Metric value={store.applicationPacks.length} label="Packs" />
        <Metric value={store.proofLog.length} label="Proof logs" />
      </section>

      <section style={grid}>
        <section style={panel}>
          <div style={sectionHead}>
            <div>
              <p style={eyebrow}>01 / SMART INTAKE</p>
              <h2 style={sectionTitle}>Upload documents</h2>
            </div>
            <span style={pill}>CV autofill</span>
          </div>

          <div style={uploadGrid}>
            <UploadTile
              title="CV"
              text="Best source for smart profile fill."
              busy={busy === "upload-CV"}
              onFile={(file) => uploadDocument("CV", file)}
            />
            <UploadTile
              title="ID"
              text="Required for many South African routes."
              busy={busy === "upload-ID"}
              onFile={(file) => uploadDocument("ID", file)}
            />
            <UploadTile
              title="Certificate"
              text="Matric, diploma, short course, licence."
              busy={busy === "upload-CERTIFICATE"}
              onFile={(file) => uploadDocument("CERTIFICATE", file)}
            />
          </div>

          <div style={documentList}>
            {store.documents.length ? store.documents.slice(0, 5).map((doc) => (
              <div key={doc.documentId} style={documentRow}>
                <span style={docType}>{doc.type}</span>
                <div>
                  <strong>{doc.fileName}</strong>
                  <small>{doc.smartFields?.email || doc.smartFields?.phone || (doc.storagePath ? "Private storage" : "Local development storage")}</small>
                  <a href={`/api/personal-jobs/apply-now/documents/${encodeURIComponent(String(doc.documentId))}`} style={smallButton} rel="noreferrer">Download</a>
                  <button type="button" onClick={() => deleteDocument(String(doc.documentId))} disabled={busy === `document-delete-${doc.documentId}`} style={{ ...smallButton, marginLeft: 6, borderColor: "#87534d", color: "#ffc1b8", cursor: "pointer" }}>{busy === `document-delete-${doc.documentId}` ? "Deleting…" : "Delete"}</button>
                </div>
              </div>
            )) : (
              <div style={emptyState}>No documents uploaded yet. Upload your CV first.</div>
            )}
          </div>
        </section>

        <section style={panel}>
          <div style={sectionHead}>
            <div>
              <p style={eyebrow}>CV INTAKE / CONFIRM EXTRACTED VALUES</p>
              <h2 style={sectionTitle}>Review CV suggestions</h2>
              <p style={{ color: "#aab5c7", fontSize: 13, lineHeight: 1.6 }}>CV parsing produces suggestions only. Confirm each value before it updates your profile. Existing values are protected unless you explicitly allow overwrite.</p>
            </div>
            <label style={{ ...field, display: "flex", alignItems: "center", gap: 8, maxWidth: 220 }}>
              <input type="checkbox" checked={overwriteExtractionExisting} onChange={(event) => setOverwriteExtractionExisting(event.target.checked)} />
              Allow replacing existing values
            </label>
          </div>
          {(store.smartExtraction || []).filter((item: any) => ["NEEDS_CANDIDATE_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(String(item.status))).length ? (
            <div style={queue}>
              {(store.smartExtraction || []).filter((item: any) => ["NEEDS_CANDIDATE_CONFIRMATION", "PARTIALLY_CONFIRMED"].includes(String(item.status))).slice(0, 5).map((item: any) => {
                const extracted = item.extracted && typeof item.extracted === "object" ? item.extracted : {};
                const keys = ["fullName", "email", "phone", "idNumber", "location", "highestEducation", "workExperience", "skills"];
                const labels: Record<string, string> = { fullName: "Full name", email: "Email", phone: "Phone", idNumber: "ID / passport", location: "Location", highestEducation: "Highest education", workExperience: "Work experience", skills: "Skills" };
                const available = keys.filter((key) => typeof extracted[key] === "string" && extracted[key].trim() && !(item.confirmedFields || []).includes(key));
                return <article key={item.extractionId} style={oppCard}>
                  <div style={oppHeader}><div><strong>{item.fileName || "Uploaded document"}</strong><p style={oppMeta}>{item.status.replaceAll("_", " ")} · {available.length} unconfirmed suggestion(s)</p></div><span style={routeBadge}>{item.type || "CV"}</span></div>
                  {available.length ? available.map((key) => (
                    <div key={key} style={{ ...documentRow, gridTemplateColumns: "minmax(0,1fr) auto" }}>
                      <div><strong>{labels[key]}</strong><p style={{ margin: "5px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#cfc2a4", fontSize: 13 }}>{extracted[key]}</p></div>
                      <button type="button" style={primaryButton} disabled={busy === `extraction-${item.extractionId}-${key}`} onClick={() => confirmExtractedField(String(item.extractionId), key, String(extracted[key]))}>{busy === `extraction-${item.extractionId}-${key}` ? "Saving…" : "Confirm value"}</button>
                    </div>
                  )) : <p style={oppMeta}>No unconfirmed fields remain in this extraction.</p>}
                </article>;
              })}
            </div>
          ) : <div style={emptyState}>No extracted values awaiting confirmation. Upload a CV or supported document to create suggestions.</div>}
        </section>

        <section style={panel}>
          <div style={sectionHead}>
            <div>
              <p style={eyebrow}>02 / CANDIDATE PROFILE</p>
              <h2 style={sectionTitle}>Smart-filled profile</h2>
            </div>
            <button onClick={saveProfile} style={primaryButton} disabled={busy === "profile"}>
              {busy === "profile" ? "Saving..." : "Save"}
            </button>
          </div>

          <div style={formGrid}>
            <Field label="Full name" value={profile.fullName || ""} onChange={(value) => setField("fullName", value)} />
            <Field label="ID / Passport" value={profile.idNumber || ""} onChange={(value) => setField("idNumber", value)} />
            <Field label="Phone" value={profile.phone || ""} onChange={(value) => setField("phone", value)} />
            <Field label="Email" value={profile.email || ""} onChange={(value) => setField("email", value)} />
            <Field label="Location" value={profile.location || ""} onChange={(value) => setField("location", value)} />
            <Field label="Highest education" value={profile.highestEducation || ""} onChange={(value) => setField("highestEducation", value)} />
          </div>

          <Field
            label="Skills"
            value={profile.skills || ""}
            onChange={(value) => setField("skills", value)}
            multiline
          />

          <Field
            label="Work experience"
            value={profile.workExperience || ""}
            onChange={(value) => setField("workExperience", value)}
            multiline
          />

          <Field
            label="Notes / restrictions / preferred jobs"
            value={profile.notes || ""}
            onChange={(value) => setField("notes", value)}
            multiline
          />
        </section>
      </section>

      <section style={wideGrid}>
        <section style={panel}>
          <div style={sectionHead}>
            <div>
              <p style={eyebrow}>03 / IMPORT OPPORTUNITY</p>
              <h2 style={sectionTitle}>Add real job, learnership or funding route</h2>
            </div>
            <a href="/personal-job-desk/opportunity-scout" style={secondaryButton}>Open scout</a>
          </div>

          <div style={opportunityGrid}>
            <Field label="Title" value={opportunity.title} onChange={(value) => setOpportunity((x) => ({ ...x, title: value }))} />
            <Field label="Organisation" value={opportunity.organisation} onChange={(value) => setOpportunity((x) => ({ ...x, organisation: value }))} />
            <Select label="Category" value={opportunity.category} onChange={(value) => setOpportunity((x) => ({ ...x, category: value }))} options={["JOB", "LEARNERSHIP", "INTERNSHIP", "FUNDING"]} />
            <Select label="Method" value={opportunity.applicationMethod} onChange={(value) => setOpportunity((x) => ({ ...x, applicationMethod: value }))} options={["PORTAL", "EMAIL", "WALK_IN", "WHATSAPP_LISTED", "OTHER"]} />
            <Field label="Email to apply, if listed" value={opportunity.emailTo} onChange={(value) => setOpportunity((x) => ({ ...x, emailTo: value }))} />
            <Field label="Closing date" value={opportunity.closingDate} onChange={(value) => setOpportunity((x) => ({ ...x, closingDate: value }))} />
          </div>

          <Field label="Official/source link" value={opportunity.sourceUrl} onChange={(value) => setOpportunity((x) => ({ ...x, sourceUrl: value }))} />
          <Field label="Requirements copied from source" value={opportunity.notes} onChange={(value) => setOpportunity((x) => ({ ...x, notes: value }))} multiline />

          <button onClick={addOpportunity} style={primaryButton} disabled={busy === "opportunity"}>
            {busy === "opportunity" ? "Adding..." : "Add to application queue"}
          </button>
        </section>

        <section style={panel}>
          <div style={sectionHead}>
            <div>
              <p style={eyebrow}>04 / APPLICATION QUEUE</p>
              <h2 style={sectionTitle}>Active opportunities</h2>
            </div>
          </div>

          <div style={queue}>
            {store.opportunities.length ? store.opportunities.map((item) => (
              <article key={item.opportunityId} style={oppCard}>
                <div style={oppHeader}>
                  <span style={routeBadge}>{item.category}</span>
                  <select aria-label={`Application status for ${item.title}`} style={{ ...input, width: "auto", maxWidth: "100%", minWidth: 145, padding: "6px 8px", fontSize: 11 }} value={item.status} disabled={busy === `status-${item.opportunityId}`} onChange={(event) => updateOpportunityStatus(item.opportunityId, event.target.value)}>
                    {["READY_TO_PREPARE", "PREPARING", "PACK_READY", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN", ...(item.status === "APPLIED_PROOF_CAPTURED" ? ["APPLIED_PROOF_CAPTURED"] : [])].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                </div>

                <h3 style={oppTitle}>{item.title}</h3>
                <p style={oppMeta}>{item.organisation}</p>

                <div style={cardActions}>
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer" style={secondaryButton}>Open source</a>
                  <button onClick={() => generatePack(item.opportunityId)} style={primaryButton}>
                    {busy === `pack-${item.opportunityId}` ? "Building..." : "Build pack"}
                  </button>
                  <button onClick={() => prepareManualExport(item.opportunityId)} style={ghostButton} disabled={busy === `export-${item.opportunityId}`}>
                    {busy === `export-${item.opportunityId}` ? "Preparing…" : "Export checklist"}
                  </button>
                  <button onClick={() => setSelectedOpportunity(item.opportunityId)} style={ghostButton}>Proof</button>
                  <button onClick={() => deleteOpportunity(item.opportunityId)} style={dangerButton}>Remove</button>
                </div>

                {selectedOpportunity === item.opportunityId ? (
                  <div style={proofBox}>
                    <textarea
                      style={textarea}
                      value={proof}
                      onChange={(event) => setProof(event.target.value)}
                      placeholder="Paste application reference, email sent proof, portal confirmation, screenshot note, or employer response."
                    />
                    <button onClick={() => markApplied(item.opportunityId)} style={primaryButton}>
                      {busy === `proof-${item.opportunityId}` ? "Saving..." : "Capture proof"}
                    </button>
                  </div>
                ) : null}
              </article>
            )) : (
              <div style={emptyState}>No opportunities yet. Use Scout, then import a real source.</div>
            )}
          </div>
        </section>
      </section>

      {manualExport ? (
        <section style={panel} aria-live="polite">
          <div style={sectionHead}>
            <div>
              <p style={eyebrow}>MANUAL EXPORT / CANDIDATE REVIEW</p>
              <h2 style={sectionTitle}>{manualExport.opportunity?.title || "Application checklist"}</h2>
              <p style={{ color: "#cfc2a4", fontSize: 13, lineHeight: 1.6 }}>Prepared for review only. Nothing has been submitted or sent.</p>
            </div>
            <button type="button" style={secondaryButton} onClick={copyManualExport}>Copy checklist</button>
          </div>
          <div style={queue}>
            {(manualExport.checklist || []).map((item: any, index: number) => (
              <div key={`${item.item}-${index}`} style={documentRow}>
                <span style={docType}>{index + 1}</span>
                <div>
                  <strong>{item.item} — {item.status.replaceAll("_", " ")}</strong>
                  <p style={{ margin: "5px 0 0", color: "#aab5c7", fontSize: 12 }}>{item.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: "#f4c968", fontSize: 13, lineHeight: 1.6 }}>{manualExport.notice}</p>
          <div style={cardActions}>
            <button type="button" style={ghostButton} onClick={() => setManualExport(null)}>Close checklist</button>
          </div>
        </section>
      ) : null}

      <section style={panel}>
        <div style={sectionHead}>
          <div>
            <p style={eyebrow}>05 / FOLLOW-UPS & DEADLINES</p>
            <h2 style={sectionTitle}>My tasks</h2>
            <p style={{ color: "#aab5c7", fontSize: 13, lineHeight: 1.6, margin: "6px 0 0" }}>Keep application deadlines, document requests, interview preparation and employer follow-ups in one private list.</p>
          </div>
          <span style={pill}>{(store.tasks || []).filter((task) => task.status === "OPEN").length} open</span>
        </div>

        <div style={{ ...formGrid, marginBottom: 12 }}>
          <Field label="Task" value={taskDraft.title} onChange={(value) => setTaskDraft((current) => ({ ...current, title: value }))} />
          <Field label="Due date" value={taskDraft.dueDate} onChange={(value) => setTaskDraft((current) => ({ ...current, dueDate: value }))} />
          <Select label="Priority" value={taskDraft.priority} onChange={(value) => setTaskDraft((current) => ({ ...current, priority: value }))} options={["LOW", "NORMAL", "HIGH"]} />
          <Select label="Related opportunity (optional)" value={taskDraft.opportunityId} onChange={(value) => setTaskDraft((current) => ({ ...current, opportunityId: value }))} options={["", ...store.opportunities.map((item) => item.opportunityId)]} labels={["Not linked", ...store.opportunities.map((item) => `${item.title} — ${item.organisation}`)]} />
        </div>
        <Field label="Notes (optional)" value={taskDraft.notes} onChange={(value) => setTaskDraft((current) => ({ ...current, notes: value }))} multiline />
        <button onClick={addTask} style={primaryButton} disabled={busy === "task-create" || taskDraft.title.trim().length < 2}>
          {busy === "task-create" ? "Saving task…" : "Add follow-up task"}
        </button>

        <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
          {(store.tasks || []).length ? [...store.tasks].sort((a, b) => (a.status === b.status ? (a.dueDate || "9999").localeCompare(b.dueDate || "9999") : a.status === "OPEN" ? -1 : 1)).map((task) => {
            const linked = store.opportunities.find((item) => item.opportunityId === task.opportunityId);
            const overdue = task.status === "OPEN" && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
            return <article key={task.taskId} style={{ border: "1px solid #2b374c", borderRadius: 12, padding: 14, background: task.status === "DONE" ? "rgba(28,48,43,.28)" : "rgba(8,14,26,.45)", opacity: task.status === "DONE" ? .75 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ textDecoration: task.status === "DONE" ? "line-through" : "none" }}>{task.title}</strong>
                    <span style={statusBadge}>{task.status}</span>
                    <span style={{ ...routeBadge, color: task.priority === "HIGH" ? "#ffc1b8" : undefined }}>{task.priority}</span>
                    {overdue ? <span style={{ ...statusBadge, color: "#ffc1b8", borderColor: "#87534d" }}>OVERDUE</span> : null}
                  </div>
                  <p style={{ ...oppMeta, margin: "7px 0 0" }}>Due: {task.dueDate || "No due date"}{linked ? ` · ${linked.title} — ${linked.organisation}` : ""}</p>
                  {task.notes ? <p style={{ color: "#9eabc0", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{task.notes}</p> : null}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => updateTask(task.taskId, task.status === "DONE" ? "OPEN" : "DONE")} style={task.status === "DONE" ? ghostButton : primaryButton} disabled={busy === `task-${task.taskId}`}>{task.status === "DONE" ? "Reopen" : "Complete"}</button>
                  <button onClick={() => deleteTask(task.taskId)} style={dangerButton} disabled={busy === `task-${task.taskId}`}>Remove</button>
                </div>
              </div>
            </article>;
          }) : <div style={emptyState}>No follow-up tasks yet. Add a deadline or next action above to start your task list.</div>}
        </div>
      </section>

      <section style={panel}>
        <div style={sectionHead}>
          <div>
            <p style={eyebrow}>06 / EMPLOYER COMMUNICATIONS</p>
            <h2 style={sectionTitle}>Contact log</h2>
            <p style={{ color: "#aab5c7", fontSize: 13, lineHeight: 1.6, margin: "6px 0 0" }}>Keep a private record of employer calls, emails, portal messages and follow-up dates. Nothing is sent automatically.</p>
          </div>
          <span style={pill}>{(store.contactLog || []).length} recorded</span>
        </div>
        <div style={formGrid}>
          <Field label="Contact / person" value={contactDraft.contactName} onChange={(value) => setContactDraft((current) => ({ ...current, contactName: value }))} />
          <Field label="Organisation" value={contactDraft.organisation} onChange={(value) => setContactDraft((current) => ({ ...current, organisation: value }))} />
          <Select label="Channel" value={contactDraft.channel} onChange={(value) => setContactDraft((current) => ({ ...current, channel: value }))} options={["EMAIL", "PHONE", "PORTAL", "IN_PERSON", "OTHER"]} />
          <Select label="Direction" value={contactDraft.direction} onChange={(value) => setContactDraft((current) => ({ ...current, direction: value }))} options={["OUTBOUND", "INBOUND"]} />
          <Select label="Linked opportunity (optional)" value={contactDraft.opportunityId} onChange={(value) => setContactDraft((current) => ({ ...current, opportunityId: value }))} options={["", ...store.opportunities.map((item) => item.opportunityId)]} labels={["No linked opportunity", ...store.opportunities.map((item) => item.title)]} />
          <Field label="Follow-up date (optional)" type="date" value={contactDraft.followUpDate} onChange={(value) => setContactDraft((current) => ({ ...current, followUpDate: value }))} />
          <div style={{ gridColumn: "1 / -1" }}><Field label="Summary / outcome" value={contactDraft.summary} onChange={(value) => setContactDraft((current) => ({ ...current, summary: value }))} /></div>
        </div>
        <div style={{ ...cardActions, marginTop: 12 }}><button type="button" style={primaryButton} disabled={busy === "contact-create"} onClick={addContactLog}>{busy === "contact-create" ? "Saving…" : "Save contact record"}</button></div>
        <div style={{ ...queue, marginTop: 16 }}>
          {(store.contactLog || []).length === 0 ? <div style={emptyState}>No employer contacts recorded yet. Log the outcome of your next call or email here.</div> : [...store.contactLog].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((entry) => {
            const linked = store.opportunities.find((item) => item.opportunityId === entry.opportunityId);
            return <article key={entry.entryId} style={oppCard}>
              <div style={oppHeader}><div><h3 style={oppTitle}>{entry.contactName}</h3><p style={oppMeta}>{entry.organisation || "Organisation not recorded"} · {entry.channel.replaceAll("_", " ")} · {entry.direction.toLowerCase()}</p></div><span style={statusBadge}>{new Date(entry.createdAt).toLocaleDateString("en-ZA")}</span></div>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{entry.summary}</p>
              <p style={{ ...oppMeta, fontSize: 12 }}>{linked ? `Opportunity: ${linked.title} · ` : ""}{entry.followUpDate ? `Follow up by ${entry.followUpDate}` : "No follow-up date set"}</p>
              <div style={cardActions}><button type="button" style={dangerButton} disabled={busy === `contact-delete-${entry.entryId}`} onClick={() => deleteContactLog(entry.entryId)}>Remove record</button></div>
            </article>;
          })}
        </div>
      </section>

      <section style={panel}>
        <div style={sectionHead}><div><p style={eyebrow}>07 / FINANCE TRACKING</p><h2 style={sectionTitle}>Fees & payment ledger</h2><p style={{ color: "#aab5c7", fontSize: 13, lineHeight: 1.6, margin: "6px 0 0" }}>Tracking and reconciliation only. This ledger does not charge money, connect to a bank, or independently verify transactions. CONFIRMED is a user-entered status supported by the reference or evidence note you supply. Never enter card PINs, passwords, or banking credentials.</p></div><span style={pill}>{(store.financeLedger || []).length} entries</span></div>
        <div style={formGrid}>
          <Select label="Entry type" value={financeDraft.type} onChange={(value) => setFinanceDraft((current) => ({ ...current, type: value }))} options={["FEE", "PAYMENT", "REFUND", "ADJUSTMENT"]} />
          <Select label="Money direction" value={financeDraft.direction} onChange={(value) => setFinanceDraft((current) => ({ ...current, direction: value }))} options={["OUT", "IN"]} labels={["Money out", "Money in"]} />
          <Field label="Amount (ZAR)" value={financeDraft.amount} onChange={(value) => setFinanceDraft((current) => ({ ...current, amount: value }))} />
          <Select label="Status" value={financeDraft.status} onChange={(value) => setFinanceDraft((current) => ({ ...current, status: value }))} options={["RECORDED", "PENDING", "CONFIRMED", "FAILED", "CANCELLED"]} />
          <Field label="Transaction date" value={financeDraft.occurredOn} onChange={(value) => setFinanceDraft((current) => ({ ...current, occurredOn: value }))} />
          <Select label="Related opportunity (optional)" value={financeDraft.opportunityId} onChange={(value) => setFinanceDraft((current) => ({ ...current, opportunityId: value }))} options={["", ...store.opportunities.map((item) => item.opportunityId)]} labels={["Not linked", ...store.opportunities.map((item) => item.title)]} />
          <Field label="Description" value={financeDraft.description} onChange={(value) => setFinanceDraft((current) => ({ ...current, description: value }))} />
          <Field label="Payment / receipt reference (optional)" value={financeDraft.reference} onChange={(value) => setFinanceDraft((current) => ({ ...current, reference: value }))} />
          <div style={{ gridColumn: "1 / -1" }}><Field label="Evidence note (optional; required with reference for CONFIRMED)" value={financeDraft.evidenceNote} onChange={(value) => setFinanceDraft((current) => ({ ...current, evidenceNote: value }))} multiline /></div>
        </div>
        <button type="button" style={primaryButton} disabled={busy === "finance-create"} onClick={addFinanceEntry}>{busy === "finance-create" ? "Saving…" : "Record ledger entry"}</button>
        <div style={queue}>
          {(store.financeLedger || []).length === 0 ? <div style={emptyState}>No finance entries yet. Record fees, payment references, refunds or adjustments for your own reconciliation.</div> : [...store.financeLedger].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((entry) => <article key={entry.entryId} style={oppCard}>
            <div style={oppHeader}><div><h3 style={oppTitle}>{entry.description}</h3><p style={oppMeta}>{entry.type} · {entry.direction === "IN" ? "Money in" : "Money out"} · {entry.occurredOn}</p></div><span style={statusBadge}>{entry.status}</span></div>
            <strong style={{ fontSize: 22, color: entry.direction === "IN" ? "#9de0b1" : "#ffc1b8" }}>{entry.direction === "IN" ? "+" : "−"}R {(entry.amountCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            {entry.reference ? <p style={oppMeta}>Reference: {entry.reference}</p> : null}{entry.evidenceNote ? <p style={{ ...oppMeta, whiteSpace: "pre-wrap" }}>Evidence note: {entry.evidenceNote}</p> : null}
            <div style={cardActions}><Select label="Update status" value={entry.status} onChange={(value) => updateFinanceEntry(entry.entryId, value)} options={["RECORDED", "PENDING", "CONFIRMED", "FAILED", "CANCELLED"]} /><button type="button" style={dangerButton} disabled={busy === `finance-delete-${entry.entryId}`} onClick={() => deleteFinanceEntry(entry.entryId)}>Remove ledger record</button></div>
          </article>)}
        </div>
      </section>

      <section style={panel}>
        <div style={sectionHead}>
          <div>
            <p style={eyebrow}>06 / APPLICATION PACK</p>
            <h2 style={sectionTitle}>Latest prepared pack</h2>
          </div>
          <button onClick={copyPack} style={primaryButton} disabled={!latestPack}>Copy pack</button>
        </div>

        {latestPack ? (
          <pre style={packBox}>{latestPack.body}</pre>
        ) : (
          <div style={emptyState}>Select an opportunity and build a pack.</div>
        )}
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div style={metricCard}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label style={field}>
      <span>{label}</span>
      {multiline ? (
        <textarea style={textarea} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input style={input} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: string[];
}) {
  return (
    <label style={field}>
      <span>{label}</span>
      <select style={input} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option, index) => (
          <option key={option || "none"} value={option}>{labels?.[index] ?? (option || "Not linked")}</option>
        ))}
      </select>
    </label>
  );
}

function UploadTile({
  title,
  text,
  busy,
  onFile
}: {
  title: string;
  text: string;
  busy: boolean;
  onFile: (file: File | null) => void;
}) {
  return (
    <label style={uploadTile}>
      <strong>{title}</strong>
      <small>{text}</small>
      <input
        type="file"
        style={{ display: "none" }}
        onChange={(event) => onFile(event.target.files?.[0] || null)}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
      />
      <span style={uploadButton}>{busy ? "Reading..." : "Upload"}</span>
    </label>
  );
}

const page: CSSProperties = {
  padding: 24,
  display: "grid",
  gap: 18,
  background: "radial-gradient(circle at top left,rgba(229,184,87,.16),transparent 32%),#070705"
};

const hero: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) 280px",
  gap: 18
};

const heroSectionBase: CSSProperties = {
  border: "1px solid rgba(229,184,87,.16)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 30
};

const heroCopy: CSSProperties = {
  ...heroSectionBase,
  padding: 30
};

const eyebrow: CSSProperties = {
  margin: 0,
  color: "#d8a83e",
  fontSize: 12,
  letterSpacing: ".16em",
  fontWeight: 1000,
  textTransform: "uppercase"
};

const title: CSSProperties = {
  margin: "10px 0 12px",
  fontSize: 54,
  lineHeight: .95,
  letterSpacing: "-.05em"
};

const lead: CSSProperties = {
  color: "#cfc2a4",
  maxWidth: 760,
  fontSize: 17,
  lineHeight: 1.65
};

const readinessCard: CSSProperties = {
  ...heroSectionBase,
  padding: 24,
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  gap: 10
};

const circle: CSSProperties = {
  width: 116,
  height: 116,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg,#e5b857,#7b5a1d)",
  color: "#111",
  fontSize: 32,
  fontWeight: 1000
};

const statusBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  borderRadius: 18,
  padding: 14,
  background: "rgba(0,0,0,.28)",
  border: "1px solid rgba(229,184,87,.12)",
  color: "#cfc2a4"
};

const smallButton: CSSProperties = {
  border: "1px solid rgba(229,184,87,.24)",
  background: "rgba(255,255,255,.04)",
  color: "#f4c968",
  borderRadius: 999,
  padding: "9px 12px",
  fontWeight: 900,
  cursor: "pointer"
};

const metrics: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 12
};

const metricCard: CSSProperties = {
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(229,184,87,.12)",
  display: "grid",
  gap: 5
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px,.78fr) minmax(0,1.22fr)",
  gap: 18
};

const wideGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(380px,.9fr)",
  gap: 18
};

const panel: CSSProperties = {
  borderRadius: 28,
  padding: 22,
  background: "rgba(255,255,255,.045)",
  border: "1px solid rgba(229,184,87,.14)",
  display: "grid",
  gap: 14
};

const sectionHead: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12
};

const sectionTitle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 26,
  letterSpacing: "-.03em"
};

const pill: CSSProperties = {
  borderRadius: 999,
  padding: "8px 10px",
  background: "rgba(229,184,87,.12)",
  color: "#f4c968",
  border: "1px solid rgba(229,184,87,.18)",
  fontSize: 12,
  fontWeight: 1000
};

const uploadGrid: CSSProperties = {
  display: "grid",
  gap: 12
};

const uploadTile: CSSProperties = {
  borderRadius: 20,
  padding: 16,
  border: "1px solid rgba(229,184,87,.14)",
  background: "rgba(0,0,0,.24)",
  display: "grid",
  gap: 8,
  cursor: "pointer"
};

const uploadButton: CSSProperties = {
  width: "fit-content",
  borderRadius: 999,
  padding: "9px 12px",
  background: "#e5b857",
  color: "#111",
  fontWeight: 1000
};

const documentList: CSSProperties = {
  display: "grid",
  gap: 10
};

const documentRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "64px 1fr",
  gap: 10,
  alignItems: "center",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.035)",
  border: "1px solid rgba(229,184,87,.10)"
};

const docType: CSSProperties = {
  borderRadius: 12,
  padding: "8px 10px",
  background: "rgba(229,184,87,.12)",
  color: "#f4c968",
  textAlign: "center",
  fontWeight: 1000,
  fontSize: 12
};

const formGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12
};

const opportunityGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12
};

const field: CSSProperties = {
  display: "grid",
  gap: 7,
  color: "#cfc2a4",
  fontSize: 13,
  fontWeight: 800
};

const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(229,184,87,.16)",
  borderRadius: 14,
  background: "rgba(0,0,0,.24)",
  color: "#f6efe0",
  padding: "12px 13px",
  outline: "none"
};

const textarea: CSSProperties = {
  ...input,
  minHeight: 104,
  resize: "vertical",
  fontFamily: "inherit"
};

const primaryButton: CSSProperties = {
  border: 0,
  borderRadius: 999,
  padding: "11px 15px",
  background: "#e5b857",
  color: "#111",
  fontWeight: 1000,
  cursor: "pointer",
  textDecoration: "none"
};

const secondaryButton: CSSProperties = {
  border: "1px solid rgba(229,184,87,.28)",
  borderRadius: 999,
  padding: "11px 15px",
  background: "rgba(255,255,255,.04)",
  color: "#f4c968",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none"
};

const ghostButton: CSSProperties = {
  ...secondaryButton,
  color: "#f6efe0"
};

const dangerButton: CSSProperties = {
  border: "1px solid rgba(255,96,96,.32)",
  borderRadius: 999,
  padding: "11px 15px",
  background: "rgba(255,96,96,.08)",
  color: "#ffb1b1",
  fontWeight: 900,
  cursor: "pointer"
};

const queue: CSSProperties = {
  display: "grid",
  gap: 12
};

const oppCard: CSSProperties = {
  borderRadius: 22,
  padding: 16,
  background: "rgba(0,0,0,.24)",
  border: "1px solid rgba(229,184,87,.12)",
  display: "grid",
  gap: 10
};

const oppHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10
};

const routeBadge: CSSProperties = {
  borderRadius: 999,
  padding: "7px 10px",
  background: "rgba(229,184,87,.12)",
  color: "#f4c968",
  fontSize: 12,
  fontWeight: 1000
};

const statusBadge: CSSProperties = {
  borderRadius: 999,
  padding: "7px 10px",
  background: "rgba(255,255,255,.06)",
  color: "#cfc2a4",
  fontSize: 12,
  fontWeight: 800
};

const oppTitle: CSSProperties = {
  margin: 0,
  fontSize: 20
};

const oppMeta: CSSProperties = {
  margin: 0,
  color: "#cfc2a4"
};

const cardActions: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8
};

const proofBox: CSSProperties = {
  display: "grid",
  gap: 10
};

const emptyState: CSSProperties = {
  borderRadius: 18,
  padding: 16,
  background: "rgba(0,0,0,.22)",
  border: "1px dashed rgba(229,184,87,.18)",
  color: "#cfc2a4"
};

const packBox: CSSProperties = {
  whiteSpace: "pre-wrap",
  borderRadius: 22,
  padding: 18,
  background: "#050504",
  border: "1px solid rgba(229,184,87,.14)",
  color: "#f6efe0",
  maxHeight: 520,
  overflow: "auto",
  lineHeight: 1.55
};