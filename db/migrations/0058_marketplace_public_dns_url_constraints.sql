-- Keep public marketplace source URLs on public DNS names, not raw IP literals.
-- IPv6 literals are already excluded by the hostname constraint shape in 0057.
alter table public.organisations
  add constraint organisations_website_not_ip_literal
  check (
    official_website is null or
    substring(official_website from '^https://([^/:?#]+)') !~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'
  );

alter table public.organisation_listings
  add constraint organisation_listings_source_not_ip_literal
  check (
    substring(official_source_url from '^https://([^/:?#]+)') !~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'
  ),
  add constraint organisation_listings_application_not_ip_literal
  check (
    application_url is null or
    substring(application_url from '^https://([^/:?#]+)') !~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'
  );

alter table public.route_providers
  add constraint route_providers_base_url_not_ip_literal
  check (
    base_url is null or
    substring(base_url from '^https://([^/:?#]+)') !~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'
  );

alter table public.route_programmes
  add constraint route_programmes_source_url_not_ip_literal
  check (
    source_url is null or
    substring(source_url from '^https://([^/:?#]+)') !~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'
  );
