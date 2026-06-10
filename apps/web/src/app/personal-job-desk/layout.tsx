import PersonalJobDeskShell from "./PersonalJobDeskShell";

export default function PersonalJobDeskLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <PersonalJobDeskShell>{children}</PersonalJobDeskShell>;
}