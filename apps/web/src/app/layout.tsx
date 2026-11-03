import type { Metadata } from "next";
import "./public-home.css";

export const metadata: Metadata = {
  title: {
    default: "Kingsmen Portal | Your next move, made clearer",
    template: "%s | Kingsmen Portal",
  },
  description: "Explore South African education, skills development and work pathways with clearer next steps and evidence-aware guidance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, background: "#ffffff" }}>{children}</body>
    </html>
  );
}
