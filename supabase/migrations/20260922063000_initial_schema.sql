create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  public_code text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (char_length(trim(display_name)) between 2 and 12)
);

create table if not exists public.game_runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score >= 0),
  distance_m integer not null check (distance_m >= 0),
  fish_count integer not null check (fish_count >= 0),
  duration_ms integer not null check (duration_ms between 1000 and 1800000),
  client_version text not null default '0.0.0',
  created_at timestamptz not null default now()
);

create table if not exists public.player_best_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  best_score integer not null check (best_score >= 0),
  best_distance_m integer not null check (best_distance_m >= 0),
  best_fish_count integer not null check (best_fish_count >= 0),
  best_duration_ms integer not null check (best_duration_ms between 1000 and 1800000),
  achieved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists player_best_scores_rank_idx
  on public.player_best_scores (best_score desc, achieved_at asc);

create index if not exists game_runs_user_created_idx
  on public.game_runs (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.game_runs enable row level security;
alter table public.player_best_scores enable row level security;

revoke all on public.profiles from anon;
revoke all on public.game_runs from anon;
revoke all on public.player_best_scores from anon;

grant select, insert, update on public.profiles to authenticated;
grant select on public.player_best_scores to authenticated;

create policy "authenticated users can read profiles"
on public.profiles for select
to authenticated
using (true);

create policy "users can insert own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "authenticated users can read best scores"
on public.player_best_scores for select
to authenticated
using (true);

create or replace function public.submit_game_run(
  p_score integer,
  p_distance_m integer,
  p_fish_count integer,
  p_duration_ms integer,
  p_client_version text default '0.0.0'
)
returns table (
  accepted boolean,
  is_new_best boolean,
  best_score integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_expected_score integer;
  v_previous_best integer;
  v_max_distance integer;
  v_max_fish integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_score is null
     or p_distance_m is null
     or p_fish_count is null
     or p_duration_ms is null then
    raise exception 'Missing run data';
  end if;

  if p_score < 0
     or p_distance_m < 0
     or p_fish_count < 0
     or p_duration_ms < 1000
     or p_duration_ms > 1800000 then
    raise exception 'Invalid run range';
  end if;

  v_expected_score := p_distance_m + p_fish_count * 10;

  if p_score <> v_expected_score then
    raise exception 'Invalid score formula';
  end if;

  -- 寬鬆的 MVP 合理性檢查，不能視為完整反作弊。
  v_max_distance := ceil((p_duration_ms / 1000.0) * 35.0)::integer + 100;
  v_max_fish := ceil(p_duration_ms / 250.0)::integer + 10;

  if p_distance_m > v_max_distance or p_fish_count > v_max_fish then
    raise exception 'Run exceeds allowed limits';
  end if;

  select pbs.best_score
    into v_previous_best
  from public.player_best_scores as pbs
  where pbs.user_id = v_user_id;

  insert into public.game_runs (
    user_id,
    score,
    distance_m,
    fish_count,
    duration_ms,
    client_version
  ) values (
    v_user_id,
    p_score,
    p_distance_m,
    p_fish_count,
    p_duration_ms,
    left(coalesce(p_client_version, '0.0.0'), 32)
  );

  insert into public.player_best_scores (
    user_id,
    best_score,
    best_distance_m,
    best_fish_count,
    best_duration_ms,
    achieved_at,
    updated_at
  ) values (
    v_user_id,
    p_score,
    p_distance_m,
    p_fish_count,
    p_duration_ms,
    now(),
    now()
  )
  on conflict (user_id) do update
  set best_score = excluded.best_score,
      best_distance_m = excluded.best_distance_m,
      best_fish_count = excluded.best_fish_count,
      best_duration_ms = excluded.best_duration_ms,
      achieved_at = excluded.achieved_at,
      updated_at = now()
  where excluded.best_score > public.player_best_scores.best_score;

  return query
  select
    true,
    v_previous_best is null or p_score > v_previous_best,
    greatest(coalesce(v_previous_best, 0), p_score);
end;
$$;

create or replace function public.get_leaderboard(p_limit integer default 100)
returns table (
  rank bigint,
  display_name text,
  public_code text,
  best_score integer,
  achieved_at timestamptz,
  is_current_user boolean
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    ranked.rank,
    ranked.display_name,
    ranked.public_code,
    ranked.best_score,
    ranked.achieved_at,
    ranked.user_id = auth.uid() as is_current_user
  from (
    select
      dense_rank() over (
        order by scores.best_score desc, scores.achieved_at asc
      ) as rank,
      profiles.id as user_id,
      profiles.display_name,
      profiles.public_code,
      scores.best_score,
      scores.achieved_at
    from public.player_best_scores as scores
    join public.profiles as profiles on profiles.id = scores.user_id
  ) as ranked
  order by ranked.rank asc
  limit least(greatest(coalesce(p_limit, 100), 1), 100);
$$;

create or replace function public.get_my_rank()
returns table (
  rank bigint,
  display_name text,
  public_code text,
  best_score integer,
  achieved_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    ranked.rank,
    ranked.display_name,
    ranked.public_code,
    ranked.best_score,
    ranked.achieved_at
  from (
    select
      dense_rank() over (
        order by scores.best_score desc, scores.achieved_at asc
      ) as rank,
      profiles.id as user_id,
      profiles.display_name,
      profiles.public_code,
      scores.best_score,
      scores.achieved_at
    from public.player_best_scores as scores
    join public.profiles as profiles on profiles.id = scores.user_id
  ) as ranked
  where ranked.user_id = auth.uid();
$$;

revoke all on function public.submit_game_run(integer, integer, integer, integer, text)
  from public, anon;
revoke all on function public.get_leaderboard(integer)
  from public, anon;
revoke all on function public.get_my_rank()
  from public, anon;

grant execute on function public.submit_game_run(integer, integer, integer, integer, text)
  to authenticated;
grant execute on function public.get_leaderboard(integer)
  to authenticated;
grant execute on function public.get_my_rank()
  to authenticated;
