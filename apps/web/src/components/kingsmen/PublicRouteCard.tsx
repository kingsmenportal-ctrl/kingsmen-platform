type PublicRouteCardProps = {
  title: string;
  shortFact: string;
  userNeed: string;
  kingsmenHelp: string;
};

export function PublicRouteCard({ title, shortFact, userNeed, kingsmenHelp }: PublicRouteCardProps) {
  return (
    <article style={{ border: "1px solid rgba(212,175,55,0.35)", borderRadius: 18, padding: 18, background: "#08111f", color: "#f8fafc" }}>
      <p style={{ margin: 0, color: "#d4af37", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>Route</p>
      <h3 style={{ margin: "8px 0", fontSize: 20 }}>{title}</h3>
      <p style={{ color: "#e2e8f0", lineHeight: 1.6 }}>{shortFact}</p>
      <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}><strong>User need:</strong> {userNeed}</p>
      <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}><strong>Kingsmen helps:</strong> {kingsmenHelp}</p>
    </article>
  );
}
