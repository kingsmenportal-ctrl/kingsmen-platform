export async function GET() {
  return Response.json({
    schema: "kingsmen.public-kernel-health.v1",
    ok: true,
    productionReady: false,
    publicSafe: true,
    secretsIncluded: false,
    service: "kingsmen-kernel",
    checkedAt: new Date().toISOString()
  });
}