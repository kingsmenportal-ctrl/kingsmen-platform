import type { Metadata } from "next";
import AuthCallbackClient from "@/components/candidate/AuthCallbackClient";

export const metadata: Metadata = {
  title: "Confirm account",
  description: "Verify a Kingsmen candidate authentication session."
};

export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
