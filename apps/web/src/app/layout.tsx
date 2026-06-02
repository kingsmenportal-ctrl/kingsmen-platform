import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kingsmen Portal",
  description: "Kingsmen Free Destiny Map local runtime shell"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, background: "#050816" }}>{children}</body>
    </html>
  );
}
