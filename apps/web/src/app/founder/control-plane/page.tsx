import { FounderControlPlane } from "../../../founder/FounderControlPlane";
import { fetchFounderControlPlane } from "../../../founder/founder-control-plane-client";

export default async function FounderControlPlanePage() {
  const model = await fetchFounderControlPlane();

  return <FounderControlPlane model={model} />;
}
