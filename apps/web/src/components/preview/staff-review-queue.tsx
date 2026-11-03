"use client";

import { useMemo, useState } from "react";

type DemoStatus = "pending" | "approved" | "rejected";
type DemoRow = { id: string; document: string; candidate: string; submitted: string; status: DemoStatus };

const initialRows: DemoRow[] = [
  { id: "KM-DEMO-1042", document: "Identity document", candidate: "Example candidate A", submitted: "Today · 09:20", status: "pending" },
  { id: "KM-DEMO-1039", document: "Qualification record", candidate: "Example candidate B", submitted: "Yesterday · 14:05", status: "pending" },
  { id: "KM-DEMO-1034", document: "Proof of residence", candidate: "Example candidate C", submitted: "Yesterday · 11:18", status: "approved" },
];

export default function StaffReviewQueueDemo() {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<"all" | DemoStatus>("all");
  const [message, setMessage] = useState("");
  const visibleRows = useMemo(() => filter === "all" ? rows : rows.filter((row) => row.status === filter), [filter, rows]);

  function markDemo(id: string, status: Exclude<DemoStatus, "pending">) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row));
    setMessage("Sample row updated in this browser only. No real candidate record, document decision or audit event was changed.");
  }

  return (
    <section className="review-demo-panel" aria-labelledby="review-queue-heading">
      <div className="review-demo-toolbar">
        <div><h2 id="review-queue-heading">Documents awaiting review</h2><p>Actions update only the sample rows in this browser session.</p></div>
        <label className="review-demo-filter">Filter status
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            <option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved demo</option><option value="rejected">Rejected demo</option>
          </select>
        </label>
      </div>
      <div className="review-demo-table-wrap">
        <table className="review-demo-table">
          <thead><tr><th>Candidate ref</th><th>Document</th><th>Submitted</th><th>Status</th><th>Demo action</th></tr></thead>
          <tbody>{visibleRows.map((row) => <tr key={row.id}>
            <td><strong>{row.id}</strong><small>{row.candidate}</small></td><td>{row.document}</td><td>{row.submitted}</td>
            <td><span className={"review-demo-status status-" + row.status}>{row.status === "approved" ? "Approved demo" : row.status === "rejected" ? "Rejected demo" : "Pending"}</span></td>
            <td>{row.status === "pending" ? <div className="review-demo-actions"><button type="button" onClick={() => markDemo(row.id, "approved")}>Approve demo</button><button type="button" onClick={() => markDemo(row.id, "rejected")}>Reject demo</button></div> : <span className="review-demo-muted">Demo state only</span>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="review-demo-message" role="status" aria-live="polite">{message || "No real review action is available from this prototype."}</p>
    </section>
  );
}
