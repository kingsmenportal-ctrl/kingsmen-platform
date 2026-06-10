import { buildApplicationWorkbenchItem, type BuildWorkbenchInput } from "./application-workbench";
import { buildManualApplicationPackage, type ManualApplicationPackageInput } from "./map-fallback";
import { createNsfasSupportCase, type NsfasSupportCaseInput } from "./nsfas-support";

export interface RouteUniverseWriteResult {
  ok: boolean;
  ref: string;
  message: string;
}

export class RouteUniverseRepository {
  prepareWorkbenchItem(input: BuildWorkbenchInput): RouteUniverseWriteResult {
    const item = buildApplicationWorkbenchItem(input);

    return {
      ok: true,
      ref: item.workbenchRef,
      message: "Application workbench item prepared for PostgreSQL persistence."
    };
  }

  prepareManualPackage(input: ManualApplicationPackageInput): RouteUniverseWriteResult {
    const map = buildManualApplicationPackage(input);

    return {
      ok: true,
      ref: map.mapRef,
      message: "Manual Application Package prepared for fallback execution."
    };
  }

  prepareNsfasSupport(input: NsfasSupportCaseInput): RouteUniverseWriteResult {
    const support = createNsfasSupportCase(input);

    return {
      ok: true,
      ref: support.nsfasCaseRef,
      message: "NSFAS support case prepared; no approval guarantee implied."
    };
  }
}