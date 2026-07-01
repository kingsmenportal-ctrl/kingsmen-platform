export const metadata = {
  title: "Kingsmen Jarvis Command Mesh",
  description: "Jarvis agents, robots, tools, apps and provider command mesh"
};
export default function JarvisPage() {
  return (
    <main style={{ margin: 0, minHeight: "100vh", background: "#020617" }}>
      <iframe
        title="Kingsmen Jarvis Command Mesh"
        src="/jarvis-os/jarvis-os.html"
        style={{ width: "100%", height: "100vh", border: 0, display: "block" }}
      />
    </main>
  );
}
