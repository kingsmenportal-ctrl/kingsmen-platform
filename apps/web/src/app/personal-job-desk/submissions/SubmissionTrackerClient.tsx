"use client";

import { useEffect, useMemo, useState } from "react";

const PERSONAL_JOBS_05_NO_SEND_BOUNDARY =
  "PERSONAL_JOBS_05_NO_SEND_BOUNDARY: manual evidence tracker only; no applications, emails, WhatsApps, payment actions, portal submissions, employer contact, or automated sending are performed.";

const PERSONAL_JOBS_04_APPLY_PACK_KEY =
  "kingsmen.personalJobs04.applyPacks.v1";

const PERSONAL_JOBS_05_SUBMISSION_LEDGER_KEY =
  "kingsmen.personalJobs05.submissions.v1";

const PERSONAL_JOBS_05_STATUS_PROOF = [
  "DRAFT_PACK_READY",
  "MANUALLY_SUBMITTED",
  "PROOF_CAPTURED",
  "FOLLOW_UP_DUE",
  "RESPONSE_RECEIVED",
  "INTERVIEW_STAGE",
  "UNSUCCESSFUL",
  "OFFER_RECEIVED",
  "CLOSED"
];

type SafeLocalCandidate = {
  candidateLabel: string;
  location: string;
  routeMode: string;
};

type ApplyPack = {
  id?: string;
  packId?: string;
  opportunityId?: string;
  employer?: string;
  company?: string;
  role?: string;
  title?: string;
  sourceUrl?: string;
  template?: string;
  cvDraft?: string;
  motivationDraft?: string;
  createdAt?: string;
};

type SubmissionRecord = {
  id: string;
  applyPackId: string;
  employer: string;
  role: string;
  sourceUrl: string;
  applicationMethod: string;
  status: string;
  submittedAt: string;
  deadline: string;
  followUpDate: string;
  proofReference: string;
  proofNote: string;
  nextAction: string;
  riskFlag: string;
  createdAt: string;
  updatedAt: string;
};

const applicationMethods = [
  "Company career portal",
  "Email application manually sent",
  "Indeed / job board redirect",
  "LinkedIn / external platform",
  "Walk-in / branch hand delivery",
  "Recruiter / agency instruction",
  "Other verified manual route"
];

const statusOptions = [
  "DRAFT_PACK_READY",
  "MANUALLY_SUBMITTED",
  "PROOF_CAPTURED",
  "FOLLOW_UP_DUE",
  "RESPONSE_RECEIVED",
  "INTERVIEW_STAGE",
  "UNSUCCESSFUL",
  "OFFER_RECEIVED",
  "CLOSED"
];

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getPackId(pack: ApplyPack, index: number) {
  return pack.id || pack.packId || pack.opportunityId || `apply-pack-${index + 1}`;
}

function recordManualSubmission(pack: ApplyPack, index: number): SubmissionRecord {
  const now = new Date().toISOString();
  const employer = pack.employer || pack.company || "Unspecified employer";
  const role = pack.role || pack.title || "Unspecified role";

  return {
    id: `submission-${Date.now()}-${index}`,
    applyPackId: getPackId(pack, index),
    employer,
    role,
    sourceUrl: pack.sourceUrl || "",
    applicationMethod: "Company career portal",
    status: "DRAFT_PACK_READY",
    submittedAt: "",
    deadline: "",
    followUpDate: "",
    proofReference: "",
    proofNote: "",
    nextAction: "Review draft pack, submit manually, then capture proof.",
    riskFlag: "Proof not captured yet",
    createdAt: now,
    updatedAt: now
  };
}

function exportEvidenceLedger(records: SubmissionRecord[]) {
  const payload = {
    schema: "kingsmen.personal-jobs-05-submission-ledger-export.v1",
    exportedAt: new Date().toISOString(),
    boundary: PERSONAL_JOBS_05_NO_SEND_BOUNDARY,
    readsLocalStorageKey: PERSONAL_JOBS_04_APPLY_PACK_KEY,
    writesLocalStorageKey: PERSONAL_JOBS_05_SUBMISSION_LEDGER_KEY,
    records
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kingsmen-personal-jobs-submission-ledger.json";
  link.click();
  URL.revokeObjectURL(url);
}

export default function SubmissionTrackerClient({
  candidate
}: {
  candidate: SafeLocalCandidate;
}) {
  const [applyPacks, setApplyPacks] = useState<ApplyPack[]>([]);
  const [records, setRecords] = useState<SubmissionRecord[]>([]);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);

  useEffect(() => {
    const loadedPacks = safeJsonParse<ApplyPack[]>(
      window.localStorage.getItem(PERSONAL_JOBS_04_APPLY_PACK_KEY),
      []
    );

    const loadedRecords = safeJsonParse<SubmissionRecord[]>(
      window.localStorage.getItem(PERSONAL_JOBS_05_SUBMISSION_LEDGER_KEY),
      []
    );

    setApplyPacks(Array.isArray(loadedPacks) ? loadedPacks : []);
    setRecords(Array.isArray(loadedRecords) ? loadedRecords : []);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      PERSONAL_JOBS_05_SUBMISSION_LEDGER_KEY,
      JSON.stringify(records, null, 2)
    );
  }, [records]);

  const selectedPack = applyPacks[selectedPackIndex];

  const summary = useMemo(() => {
    const submitted = records.filter((record) =>
      ["MANUALLY_SUBMITTED", "PROOF_CAPTURED", "RESPONSE_RECEIVED", "INTERVIEW_STAGE", "OFFER_RECEIVED"].includes(record.status)
    ).length;

    const proofCaptured = records.filter(
      (record) => record.status === "PROOF_CAPTURED" || record.proofReference.trim().length > 0
    ).length;

    const followUps = records.filter(
      (record) => record.status === "FOLLOW_UP_DUE" || record.followUpDate.trim().length > 0
    ).length;

    return {
      total: records.length,
      submitted,
      proofCaptured,
      followUps
    };
  }, [records]);

  function addRecordFromPack() {
    if (!selectedPack) return;
    setRecords((current) => [
      recordManualSubmission(selectedPack, selectedPackIndex),
      ...current
    ]);
  }

  function updateRecord(id: string, patch: Partial<SubmissionRecord>) {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? { ...record, ...patch, updatedAt: new Date().toISOString() }
          : record
      )
    );
  }

  function removeRecord(id: string) {
    setRecords((current) => current.filter((record) => record.id !== id));
  }

  return (
    <section
      data-kingsmen-personal-jobs-05-client="true"
      style={{ display: "grid", gap: "18px" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px"
        }}
      >
        {[
          ["Candidate", candidate.candidateLabel],
          ["Locality", candidate.location],
          ["Submission records", String(summary.total)],
          ["Proof captured", String(summary.proofCaptured)],
          ["Manual submissions", String(summary.submitted)],
          ["Follow-up signals", String(summary.followUps)]
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              border: "1px solid rgba(214,178,94,0.22)",
              borderRadius: "20px",
              padding: "18px",
              background: "rgba(255,255,255,0.045)"
            }}
          >
            <p
              style={{
                margin: "0 0 7px",
                color: "rgba(247,234,209,0.58)",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 800
              }}
            >
              {label}
            </p>
            <strong style={{ fontSize: "19px", color: "#f8d77a" }}>
              {value}
            </strong>
          </div>
        ))}
      </div>

      <div
        style={{
          border: "1px solid rgba(214,178,94,0.28)",
          borderRadius: "24px",
          padding: "22px",
          background: "rgba(18,15,9,0.78)",
          display: "grid",
          gap: "16px"
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "24px" }}>
            Add an application from your apply packs
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              color: "rgba(247,234,209,0.68)",
              lineHeight: 1.6
            }}
          >
            Select a prepared CV and motivation pack from PERSONAL-JOBS-04, then record
            the manual submission and evidence trail.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "12px",
            alignItems: "end"
          }}
        >
          <label style={{ display: "grid", gap: "8px" }}>
            <span style={{ color: "#d6b25e", fontWeight: 800 }}>
              Apply pack
            </span>
            <select
              value={selectedPackIndex}
              onChange={(event) => setSelectedPackIndex(Number(event.target.value))}
              style={{
                padding: "13px 14px",
                borderRadius: "14px",
                border: "1px solid rgba(214,178,94,0.34)",
                background: "#0c0a07",
                color: "#f7ead1"
              }}
            >
              {applyPacks.length === 0 ? (
                <option>No apply packs found yet</option>
              ) : (
                applyPacks.map((pack, index) => (
                  <option key={getPackId(pack, index)} value={index}>
                    {(pack.employer || pack.company || "Employer")} —{" "}
                    {(pack.role || pack.title || "Role")}
                  </option>
                ))
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={addRecordFromPack}
            disabled={!selectedPack}
            style={{
              padding: "14px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(214,178,94,0.62)",
              background:
                "linear-gradient(135deg, rgba(214,178,94,0.28), rgba(214,178,94,0.10))",
              color: "#f8d77a",
              fontWeight: 900,
              cursor: selectedPack ? "pointer" : "not-allowed"
            }}
          >
            Create Evidence Row
          </button>
        </div>

        <p
          style={{
            margin: 0,
            color: "rgba(247,234,209,0.58)",
            fontSize: "13px"
          }}
        >
          Boundary: {PERSONAL_JOBS_05_NO_SEND_BOUNDARY}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "14px"
        }}
      >
        {records.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(214,178,94,0.34)",
              borderRadius: "22px",
              padding: "22px",
              color: "rgba(247,234,209,0.68)"
            }}
          >
            No manual submissions captured yet. Build an apply pack first, then create
            an evidence row here.
          </div>
        ) : (
          records.map((record) => (
            <article
              key={record.id}
              style={{
                border: "1px solid rgba(214,178,94,0.24)",
                borderRadius: "24px",
                padding: "20px",
                background: "rgba(255,255,255,0.045)",
                display: "grid",
                gap: "14px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap"
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "22px" }}>
                    {record.role}
                  </h3>
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "rgba(247,234,209,0.68)"
                    }}
                  >
                    {record.employer}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeRecord(record.id)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(247,234,209,0.78)",
                    padding: "10px 12px",
                    cursor: "pointer"
                  }}
                >
                  Remove
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px"
                }}
              >
                <label style={{ display: "grid", gap: "6px" }}>
                  <span>Status</span>
                  <select
                    value={record.status}
                    onChange={(event) =>
                      updateRecord(record.id, { status: event.target.value })
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>Application method</span>
                  <select
                    value={record.applicationMethod}
                    onChange={(event) =>
                      updateRecord(record.id, {
                        applicationMethod: event.target.value
                      })
                    }
                  >
                    {applicationMethods.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>Submitted date</span>
                  <input
                    type="date"
                    value={record.submittedAt}
                    onChange={(event) =>
                      updateRecord(record.id, { submittedAt: event.target.value })
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>Follow-up date</span>
                  <input
                    type="date"
                    value={record.followUpDate}
                    onChange={(event) =>
                      updateRecord(record.id, { followUpDate: event.target.value })
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>Deadline</span>
                  <input
                    type="date"
                    value={record.deadline}
                    onChange={(event) =>
                      updateRecord(record.id, { deadline: event.target.value })
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>Source URL</span>
                  <input
                    value={record.sourceUrl}
                    onChange={(event) =>
                      updateRecord(record.id, { sourceUrl: event.target.value })
                    }
                    placeholder="Paste official job source or portal link"
                  />
                </label>
              </div>

              <label style={{ display: "grid", gap: "6px" }}>
                <span>Proof reference</span>
                <input
                  value={record.proofReference}
                  onChange={(event) =>
                    updateRecord(record.id, { proofReference: event.target.value })
                  }
                  placeholder="Example: screenshot filename, confirmation number, sent email subject, portal reference"
                />
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span>Proof note</span>
                <textarea
                  value={record.proofNote}
                  onChange={(event) =>
                    updateRecord(record.id, { proofNote: event.target.value })
                  }
                  rows={3}
                  placeholder="What happened, what proof exists, what is still missing?"
                />
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span>Next action</span>
                <textarea
                  value={record.nextAction}
                  onChange={(event) =>
                    updateRecord(record.id, { nextAction: event.target.value })
                  }
                  rows={2}
                />
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span>Risk flag</span>
                <input
                  value={record.riskFlag}
                  onChange={(event) =>
                    updateRecord(record.id, { riskFlag: event.target.value })
                  }
                />
              </label>
            </article>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => exportEvidenceLedger(records)}
        style={{
          padding: "15px 20px",
          borderRadius: "999px",
          border: "1px solid rgba(214,178,94,0.62)",
          background: "rgba(214,178,94,0.12)",
          color: "#f8d77a",
          fontWeight: 900,
          justifySelf: "start",
          cursor: "pointer"
        }}
      >
        Export Evidence Ledger JSON
      </button>

      <style jsx>{`
        input,
        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 13px;
          border-radius: 14px;
          border: 1px solid rgba(214, 178, 94, 0.26);
          background: rgba(5, 5, 5, 0.62);
          color: #f7ead1;
          font: inherit;
        }

        span {
          color: #d6b25e;
          font-size: 13px;
          font-weight: 800;
        }
      `}</style>

      <span hidden>{PERSONAL_JOBS_05_STATUS_PROOF.join("|")}</span>
    </section>
  );
}
