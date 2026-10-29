-- 0093: bind the six currently listed Department of Employment and Labour vacancies
-- to their official closing-date evidence. Researched against the Department's public
-- vacancy list and the four direct detail pages on 2026-10-29.
-- This is a narrow, guarded source refresh; it does not assert candidate eligibility.
begin;

do $guard$
declare
  v_count integer;
begin
  if (now() at time zone 'Africa/Johannesburg')::date > date '2026-10-30' then
    raise exception 'Refusing to seed expired 2026-10-30 vacancies; reacquire current official evidence first';
  end if;

  select count(*) into v_count
  from public.route_programmes
  where programme_key in (
    'labour_hr4_26_10_02ho_2026',
    'labour_hr4_4_8_190_2026',
    'labour_hr4_4_8_192_2026',
    'labour_hr4_4_8_193_2026',
    'labour_hr4_4_8_194_2026',
    'labour_hr4_4_9_29_2026'
  )
  and route_type = 'EMPLOYER'
  and route_status = 'VERIFIED'
  and availability_status = 'OPEN'
  and source_confidence_band = 'A'
  and metadata->>'closing_date' = '2026-10-30';

  if v_count <> 6 then
    raise exception 'Expected exactly six audited open Department of Employment and Labour vacancies with the 2026-10-30 closing date; found %', v_count;
  end if;
end
$guard$;

with verified_vacancies(programme_key, reference_no, official_url, closing_text, detail_confirmed) as (
  values
    ('labour_hr4_26_10_02ho_2026','HR4/26/10/02HO',
      'https://www.labour.gov.za/senior-state-accountant-financial-reporting-%283%29',
      'Official detail page confirms closing date 30 October 2026: walk-in by 16:00 SAST; online by 23:59 SAST. Confirm the role requirements and application instructions on the official advert.',
      true),
    ('labour_hr4_4_8_190_2026','HR 4/4/8/190',
      'https://www.labour.gov.za/bcea-inspector-%28x4-posts%29-%284%29',
      'Official detail page confirms closing date 30 October 2026: walk-in by 16:00 SAST; online by 23:59 SAST. This advert covers four posts; confirm the appropriate post/location and instructions on the official advert.',
      true),
    ('labour_hr4_4_8_192_2026','HR4/4/8/192',
      'https://www.labour.gov.za/bcea-inspector-%2813%29',
      'Official detail page confirms closing date 30 October 2026: walk-in by 16:00 SAST; online by 23:59 SAST. Confirm the role requirements and application instructions on the official advert.',
      true),
    ('labour_hr4_4_9_29_2026','HR4/4/9/29',
      'https://www.labour.gov.za/administration-officer-employer-service',
      'Official detail page confirms closing date 30 October 2026: walk-in by 16:00 SAST; online by 23:59 SAST. Confirm the role requirements and application instructions on the official advert.',
      true),
    ('labour_hr4_4_8_194_2026','HR4/4/8/194',
      'https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx',
      'Official Department vacancy list shows this named post and reference as Open with closing date 30 October 2026. The list page does not establish channel-specific cut-off times; open the advert for full requirements and instructions.',
      false),
    ('labour_hr4_4_8_193_2026','HR4/4/8/193',
      'https://www.labour.gov.za/Vacancies/Pages/Vacancies-List.aspx',
      'Official Department vacancy list shows this named post and reference as Open with closing date 30 October 2026. The list page does not establish channel-specific cut-off times; open the advert for full requirements and instructions.',
      false)
),
updated_programmes as (
  update public.route_programmes p
  set source_url = v.official_url,
      metadata = p.metadata || jsonb_build_object(
        'source_url', v.official_url,
        'closing_date', '2026-10-30',
        'reference_no', v.reference_no,
        'source_authority', 'South African Department of Employment and Labour',
        'source_evidence', case when v.detail_confirmed
          then 'Official vacancy detail page checked 2026-10-29; closing date verified from the detail page.'
          else 'Official Department vacancy list checked 2026-10-29; title, reference, open status and closing date verified from the list; application cut-off time not inferred.'
        end,
        'verification_scope', 'Official title/reference/status/closing-date evidence only; candidate eligibility, location, required qualifications and application instructions must be checked in the official advert.',
        'last_source_checked_at', '2026-10-29T18:00:00Z',
        'deadline_evidence_method', case when v.detail_confirmed then 'OFFICIAL_DETAIL_PAGE' else 'OFFICIAL_LISTING_ONLY' end
      ),
      updated_at = now()
  from verified_vacancies v
  where p.programme_key = v.programme_key
    and p.programme_name is not null
    and p.metadata->>'closing_date' = '2026-10-30'
  returning p.id, p.programme_key
)
insert into public.route_deadlines (
  programme_id, deadline_key, deadline_type, deadline_date, deadline_text,
  source_url, source_confidence_band, verification_status, created_at, updated_at
)
select p.id,
       'official_closing_20261030',
       'CLOSING',
       date '2026-10-30',
       v.closing_text,
       v.official_url,
       'A',
       'VERIFIED',
       now(),
       now()
from updated_programmes p
join verified_vacancies v using (programme_key)
on conflict (programme_id, deadline_key) do update
set deadline_type = excluded.deadline_type,
    deadline_date = excluded.deadline_date,
    deadline_text = excluded.deadline_text,
    source_url = excluded.source_url,
    source_confidence_band = excluded.source_confidence_band,
    verification_status = excluded.verification_status,
    updated_at = now();

-- Assert all six current routes have a matching, official-source closing deadline.
do $verify$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.route_programmes p
  join public.route_deadlines d on d.programme_id = p.id
  where p.programme_key in (
    'labour_hr4_26_10_02ho_2026',
    'labour_hr4_4_8_190_2026',
    'labour_hr4_4_8_192_2026',
    'labour_hr4_4_8_193_2026',
    'labour_hr4_4_8_194_2026',
    'labour_hr4_4_9_29_2026'
  )
  and d.deadline_key = 'official_closing_20261030'
  and d.deadline_type = 'CLOSING'
  and d.deadline_date = date '2026-10-30'
  and d.verification_status = 'VERIFIED'
  and d.source_confidence_band = 'A';

  if v_count <> 6 then
    raise exception 'Closing-date evidence verification failed: expected six matching rows, got %', v_count;
  end if;
end
$verify$;

commit;
