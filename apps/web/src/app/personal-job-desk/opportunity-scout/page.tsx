import OpportunityDirectory from "../../../components/opportunity-directory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connected Opportunity Scout" };

export default function OpportunityScoutPage() {
  return <OpportunityDirectory
    title="Connected opportunity scout"
    intro="Search current opportunity records held in Kingsmen’s verified database. Only records with a verified provider, a trusted source, high source confidence and a recent review window are displayed. No local shell or browser automation is run from this public web route."
  />;
}
