import { persistFreeDestinyMapIntakeShell } from "../services/free-destiny-map-persistence.service";

type RouteLikeApp = {
  post: (
    path: string,
    handler: (
      request: { body?: unknown },
      reply: { code: (status: number) => { send: (payload: unknown) => unknown } }
    ) => unknown | Promise<unknown>
  ) => unknown;
};

export async function registerFreeDestinyMapPersistenceRoutes(app: RouteLikeApp) {
  app.post("/api/public/free-destiny-map/intake/local", async (request, reply) => {
    const result = await persistFreeDestinyMapIntakeShell(request.body, {
      enableLocalWrite: process.env.KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE === "true"
    });

    return reply.code(result.accepted ? 202 : 400).send({
      ...result,
      officialApplicationSubmitted: false,
      paymentInstructionSent: false,
      documentUploadAccepted: false,
      emailSent: false,
      productionReady: false
    });
  });
}
