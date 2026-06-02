import {
  FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT,
  type FreeDestinyMapClientResponse,
  type FreeDestinyMapClientSubmission
} from "../../../../../packages/contracts/src/free-destiny-map-api-wiring";

export function buildFreeDestinyMapClientPayload(formData: FormData): FreeDestinyMapClientSubmission {
  const routeInterests = formData
    .getAll("routeInterests")
    .map((item) => String(item))
    .filter(Boolean);

  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    province: String(formData.get("province") ?? "").trim(),
    currentSituation: String(formData.get("currentSituation") ?? "").trim(),
    knownRoute: String(formData.get("knownRoute") ?? "").trim(),
    routeInterests,
    needsAccommodation: formData.get("needsAccommodation") === "on",
    accommodationArea: String(formData.get("accommodationArea") ?? "").trim(),
    needsFundingHelp: formData.get("needsFundingHelp") === "on",
    needsCvHelp: formData.get("needsCvHelp") === "on",
    hasDocumentsReady: formData.get("hasDocumentsReady") === "on",
    randomSourceName: String(formData.get("randomSourceName") ?? "").trim(),
    consentToBeContacted: formData.get("consentToBeContacted") === "on",
    consentToProcessBasicInfo: formData.get("consentToProcessBasicInfo") === "on"
  };
}

export async function submitFreeDestinyMapClientPayload(
  payload: FreeDestinyMapClientSubmission
): Promise<FreeDestinyMapClientResponse> {
  const response = await fetch(FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json()) as FreeDestinyMapClientResponse;

  return data;
}
