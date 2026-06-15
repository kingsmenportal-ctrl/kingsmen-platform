import type { JarvisHudReadModel } from '../../contracts/src/jarvis/patch-plan';

export interface JarvisHudApiRoute {
  readonly routeRef: 'jarvis-hud-read-route';
  readonly method: 'GET';
  readonly path: '/api/jarvis/hud/read';
  readonly returns: 'JarvisHudReadModel';
  readonly readOnly: true;
}

export function jarvisCreateHudApiRoute(): JarvisHudApiRoute {
  return {
    routeRef: 'jarvis-hud-read-route',
    method: 'GET',
    path: '/api/jarvis/hud/read',
    returns: 'JarvisHudReadModel',
    readOnly: true,
  };
}

export function jarvisHudRouteAcceptsModel(model: JarvisHudReadModel): boolean {
  return model.commandRef.length > 0 && model.visibleSummary.length > 0;
}
