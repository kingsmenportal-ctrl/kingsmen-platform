-- Enforce secure public URLs at the database boundary as well as in web handlers.
-- The current staging marketplace has no source records, so these constraints do not
-- rewrite or silently discard existing provider data.
alter table public.organisations
  add constraint organisations_website_https_public
  check (
    official_website is null or (
      char_length(official_website) <= 2048
      and official_website ~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
      and lower(substring(official_website from '^https://([^/:?#]+)')) <> 'localhost'
      and lower(substring(official_website from '^https://([^/:?#]+)')) not like '%.localhost'
      and lower(substring(official_website from '^https://([^/:?#]+)')) not like '%.local'
      and lower(substring(official_website from '^https://([^/:?#]+)')) not like '%.internal'
    )
  );

alter table public.organisation_listings
  add constraint organisation_listings_source_https_public
  check (
    char_length(official_source_url) <= 2048
    and official_source_url ~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
    and lower(substring(official_source_url from '^https://([^/:?#]+)')) <> 'localhost'
    and lower(substring(official_source_url from '^https://([^/:?#]+)')) not like '%.localhost'
    and lower(substring(official_source_url from '^https://([^/:?#]+)')) not like '%.local'
    and lower(substring(official_source_url from '^https://([^/:?#]+)')) not like '%.internal'
  ),
  add constraint organisation_listings_application_https_public
  check (
    application_url is null or (
      char_length(application_url) <= 2048
      and application_url ~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
      and lower(substring(application_url from '^https://([^/:?#]+)')) <> 'localhost'
      and lower(substring(application_url from '^https://([^/:?#]+)')) not like '%.localhost'
      and lower(substring(application_url from '^https://([^/:?#]+)')) not like '%.local'
      and lower(substring(application_url from '^https://([^/:?#]+)')) not like '%.internal'
    )
  );

alter table public.route_providers
  add constraint route_providers_base_url_https_public
  check (
    base_url is null or (
      char_length(base_url) <= 2048
      and base_url ~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
      and lower(substring(base_url from '^https://([^/:?#]+)')) <> 'localhost'
      and lower(substring(base_url from '^https://([^/:?#]+)')) not like '%.localhost'
      and lower(substring(base_url from '^https://([^/:?#]+)')) not like '%.local'
      and lower(substring(base_url from '^https://([^/:?#]+)')) not like '%.internal'
    )
  );

alter table public.route_programmes
  add constraint route_programmes_source_url_https_public
  check (
    source_url is null or (
      char_length(source_url) <= 2048
      and source_url ~* '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
      and lower(substring(source_url from '^https://([^/:?#]+)')) <> 'localhost'
      and lower(substring(source_url from '^https://([^/:?#]+)')) not like '%.localhost'
      and lower(substring(source_url from '^https://([^/:?#]+)')) not like '%.local'
      and lower(substring(source_url from '^https://([^/:?#]+)')) not like '%.internal'
    )
  );
