import DocumentReviewConsole from "@/components/operator/DocumentReviewConsole";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Document review | Kingsmen Portal",
  robots: { index: false, follow: false }
};

export default function OperatorDocumentsPage() {
  return <DocumentReviewConsole />;
}
