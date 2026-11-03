import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kingsmen Portal | Your opportunity, connected",
  description: "Explore South African higher education, TVET, SETA programmes, learnerships, internships, apprenticeships and employment pathways with Kingsmen."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, background: "#050816" }}>{children}</body>
    </html>
  );
}
