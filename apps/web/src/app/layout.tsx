import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Kingsmen | Your Next Step, Clearly",
    template: "%s | Kingsmen"
  },
  description: "Explore study, training, work and funding-readiness pathways with the free Kingsmen Destiny Map. Practical guidance, no outcome guarantees."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, background: "#050816" }}>{children}</body>
    </html>
  );
}
