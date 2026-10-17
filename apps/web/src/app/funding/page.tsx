import OpportunityDirectory from "../../components/opportunity-directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funding, bursaries & financial support" };

export default function CategoryPage() {
  return <OpportunityDirectory initialSector="BURSARY" title="Funding, bursaries & financial support" intro="Explore bursaries, funding and student-support routes. Kingsmen only displays opportunities that meet its source-verification rules; confirm current eligibility and requirements with the funder." />;
}
