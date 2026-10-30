import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restricted identity-review workspace | Kingsmen",
  robots: { index: false, follow: false }
};

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return <div className="km-workspace km-workspace--reviewer">{children}</div>;
}
