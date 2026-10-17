-- Cover the saved-route programme foreign key for delete/update and joins.
create index if not exists candidate_saved_routes_programme_idx on public.candidate_saved_routes(route_programme_id);