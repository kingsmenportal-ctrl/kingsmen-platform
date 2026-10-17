import OpportunityDirectory from "../../components/opportunity-directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jobs, internships & careers" };

export default function CategoryPage() {
  return <OpportunityDirectory initialSector="EMPLOYER" title="Jobs, internships & careers" intro="Explore current employment, internship and career pathways. Kingsmen does not claim an application has been submitted when you open an employer’s official portal." />;
}
