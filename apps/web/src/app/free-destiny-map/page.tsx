import { FreeDestinyMapApiForm } from "../../components/kingsmen/FreeDestinyMapApiForm";

export default function FreeDestinyMapPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 28, background: "#050816" }}>
      <section style={{ maxWidth: 920, margin: "0 auto" }}>
        <FreeDestinyMapApiForm />
      </section>
    </main>
  );
}
