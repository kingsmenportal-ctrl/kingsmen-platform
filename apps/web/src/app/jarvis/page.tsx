export const metadata = {
  title: "Kingsmen Jarvis Command",
  description: "Inventory-backed Commander-only Jarvis command surface"
};

export default function JarvisPage() {
  return (
    <main style={{ margin: 0, minHeight: "100vh", background: "#030713" }}>
      <iframe
        title="Kingsmen Jarvis Command"
        src="/jarvis-os/jarvis-os.html"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}
