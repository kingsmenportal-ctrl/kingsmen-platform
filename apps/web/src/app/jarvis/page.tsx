import JarvisHudClient from "./JarvisHudClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kingsmen Jarvis Real Surface",
  description: "Real wired Jarvis founder surface using backend API boundary"
};

export default function JarvisPage() {
  return <JarvisHudClient surface="JARVIS" />;
}
