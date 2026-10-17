import OpportunityDirectory from "../../components/opportunity-directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Training, SETA & learnerships" };

export default function CategoryPage() {
  return <OpportunityDirectory initialSector="SETA" title="Training, SETA & learnerships" intro="Explore training, SETA, learnership and apprenticeship pathways. Use official source records to confirm the provider, requirements, deadlines and application method." />;
}
