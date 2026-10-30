import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kingsmen One | Kingsmen Portal",
  description: "One Kingsmen account for verified education, training, internship, apprenticeship and employment pathways across South Africa."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, background: "#050816" }}>{children}</body>
    </html>
  );
}
