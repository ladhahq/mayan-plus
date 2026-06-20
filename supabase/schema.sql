-- Mayan Plus — Database Schema
-- Run this in the Supabase SQL Editor

-- ── Profiles (extends auth.users) ──────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default 'Player',
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Player'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Scores (leaderboard — one entry per user, best score wins) ──
create table public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  score      int not null check (score > 0 and score <= 999999),
  combo      int not null default 0 check (combo >= 0 and combo <= 9999),
  coins      int not null default 0 check (coins >= 0),
  skin       text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One entry per user
  unique (user_id)
);

-- Leaderboard: top 50 by score desc
create index idx_scores_score on public.scores (score desc);

-- ── Coins (server-side coin balance) ───────────────────────
create table public.coins (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  balance    int not null default 3 check (balance >= 0 and balance <= 9999),
  updated_at timestamptz not null default now()
);

-- ── RLS Policies ───────────────────────────────────────────

-- Scores: anyone can read (for leaderboard display)
alter table public.scores enable row level security;
create policy "scores_read" on public.scores
  for select using (true);

-- Scores: only authenticated user can upsert their own score
-- (Edge Function will insert/update with HMAC validation)
create policy "scores_insert_own" on public.scores
  for insert with check (auth.uid() = user_id);
create policy "scores_update_own" on public.scores
  for update using (auth.uid() = user_id);

-- Coins: user can only read their own balance
alter table public.coins enable row level security;
create policy "coins_read_own" on public.coins
  for select using (auth.uid() = user_id);

-- Profiles: public read, self-update, self-insert
alter table public.profiles enable row level security;
create policy "profiles_read" on public.profiles
  for select using (true);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ── Functions ──────────────────────────────────────────────

-- Submit a score (upsert: keeps best score per user)
create function public.submit_score(p_score int, p_combo int, p_coins int default 0, p_skin text default 'default')
returns json as $$
declare
  v_best int;
begin
  -- Check existing best
  select score into v_best from public.scores
  where user_id = auth.uid();

  -- Only update if new score is higher (or no existing score)
  if v_best is null or p_score > v_best then
    insert into public.scores (user_id, score, combo, coins, skin, updated_at)
    values (auth.uid(), p_score, p_combo, p_coins, p_skin, now())
    on conflict (user_id) do update
    set score = p_score, combo = p_combo, coins = p_coins, skin = p_skin, updated_at = now();

    return json_build_object('accepted', true, 'rank', (
      select count(*) + 1 from public.scores where score > p_score
    ));
  else
    return json_build_object('accepted', false, 'best', v_best);
  end if;
end;
$$ language plpgsql security definer;
