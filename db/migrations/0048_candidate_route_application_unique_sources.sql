-- One candidate tracker per opportunity source.
create unique index if not exists candidate_route_applications_user_route_unique on public.candidate_route_applications(user_id,route_programme_id) where route_programme_id is not null;
create unique index if not exists candidate_route_applications_user_listing_unique on public.candidate_route_applications(user_id,organisation_listing_id) where organisation_listing_id is not null;
