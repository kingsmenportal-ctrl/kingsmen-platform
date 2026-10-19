import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kingsmen Portal",
  description: "Your connected workspace for career progress, personal direction and Kingsmen tools.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, background: "#050816" }}>{children}</body>
    </html>
  );
}
