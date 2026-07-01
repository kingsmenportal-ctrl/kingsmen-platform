export const metadata = {
  title: "Kingsmen Jarvis Premium Command Centre",
  description: "Premium blue and gold Jarvis command centre"
};
export default function JarvisPage() {
  return (
    <main style={{ margin: 0, minHeight: "100vh", background: "#020713" }}>
      <iframe
        title="Kingsmen Jarvis Premium Command Centre"
        src="/jarvis-os/jarvis-os.html"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}
