import { processFreeDestinyMapIntakeShell } from "../services/free-destiny-map-intake.service";

type RouteLikeApp = {
  post: (path: string, handler: (request: { body?: unknown }, reply: { code: (status: number) => { send: (payload: unknown) => unknown } }) => unknown) => unknown;
};

export async function registerFreeDestinyMapIntakeRoutes(app: RouteLikeApp) {
  app.post("/api/public/free-destiny-map/intake", (request, reply) => {
    const result = processFreeDestinyMapIntakeShell(request.body);

    return reply.code(result.accepted ? 202 : 400).send({
      ...result,
      officialApplicationSubmitted: false,
      paymentInstructionSent: false,
      documentUploadAccepted: false,
      productionReady: false
    });
  });
}
