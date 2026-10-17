import OpportunityDirectory from "../../components/opportunity-directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schools, Colleges & Universities" };

export default function SchoolsPage() {
  return <OpportunityDirectory
    initialSector="UNIVERSITY"
    title="Schools, colleges & universities"
    intro="Explore verified university, TVET and private-college routes. Use the category filter to compare education pathways. Listings appear only when the provider and source meet Kingsmen’s publication rules."
  />;
}
