-- Support route-programme joins and delete/update planning for candidate saved routes.
create index if not exists candidate_saved_routes_programme_idx
  on public.candidate_saved_routes(route_programme_id);
