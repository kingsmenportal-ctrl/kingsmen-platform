import type { Metadata } from "next";
import ProductHeader from "../components/shell/ProductHeader";
import "./globals.css";
export const metadata: Metadata = {
  title: "Kingsmen | One connected opportunity journey",
  description: "One South African opportunity journey across education, skills, internships, apprenticeships and employment."
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-ZA"><body><a className="km-skip-link" href="#page-content">Skip to main content</a><ProductHeader /><div id="page-content" tabIndex={-1}>{children}</div></body></html>;
}
