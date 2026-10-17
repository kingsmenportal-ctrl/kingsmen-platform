import OpportunityDirectory from "../../components/opportunity-directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Student accommodation" };

export default function CategoryPage() {
  return <OpportunityDirectory initialSector="ACCOMMODATION" title="Student accommodation" intro="Explore accommodation providers and routes. Availability, pricing, deposits and tenancy terms must be confirmed directly with the verified provider." />;
}
