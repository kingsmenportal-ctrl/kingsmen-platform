-- Additional N17 report-surface hardening.
-- Founder reports and sections are operationally private and accessed only through
-- server-side authenticated founder API paths.
revoke all on table public.founder_reports from public, anon, authenticated;
revoke all on table public.founder_report_sections from public, anon, authenticated;
grant all on table public.founder_reports to service_role;
grant all on table public.founder_report_sections to service_role;
drop policy if exists founder_reports_all on public.founder_reports;
drop policy if exists founder_report_sections_all on public.founder_report_sections;
