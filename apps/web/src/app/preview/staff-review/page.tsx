import Link from "next/link";
import StaffReviewQueueDemo from "@/components/preview/staff-review-queue";

export default function StaffReviewPreviewPage() {
  return (
    <main className="public-site">
      <div className="public-notice"><span aria-hidden="true" /> STAFF UI PREVIEW · Synthetic examples only</div>
      <div className="public-container staff-preview-page">
        <header className="staff-preview-heading">
          <div><div className="public-eyebrow"><span /> OPERATIONS / DOCUMENT REVIEW</div><h1>Review queue <em>overview.</em></h1><p>Illustrative interface for design review. Rows, counts and actions are synthetic and do not affect real candidate data.</p></div>
          <span className="staff-preview-chip">DEMO QUEUE</span>
        </header>
        <div className="staff-preview-metrics">
          <article><span>Pending review</span><strong>08</strong><small>Illustrative count</small></article><article><span>Approved today</span><strong>12</strong><small>Illustrative count</small></article><article><span>Average response</span><strong>1.8d</strong><small>Example metric only</small></article><article><span>Within SLA</span><strong>94%</strong><small>Example metric only</small></article>
        </div>
        <StaffReviewQueueDemo />
        <p className="staff-preview-warning">Production review requires authenticated staff permissions, per-candidate access controls, evidence capture and immutable audit events. Jarvis may assist but never auto-approves or auto-rejects.</p>
        <p className="staff-preview-back"><Link href="/">← Back to Kingsmen Portal</Link></p>
      </div>
    </main>
  );
}
