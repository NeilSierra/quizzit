-- Quizzit Private Per-User Schema (No Shared Library)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- 1. Private Quiz Sets
create table if not exists public.quiz_sets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_sets_user_id_idx on public.quiz_sets(user_id);

-- 2. Private Quiz Attempts
create table if not exists public.quiz_attempts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_set_id text not null,
  quiz_title text not null,
  settings jsonb not null,
  answers jsonb not null default '[]'::jsonb,
  started_at bigint not null,
  finished_at bigint not null,
  total_score double precision not null,
  accuracy integer not null,
  longest_streak integer not null default 0
);

create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);

-- 3. Private User Stats (Unlocked Badges)
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unlocked_badges text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Enable Row-Level Security on ALL tables
alter table public.quiz_sets enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.user_stats enable row level security;

-- Strict private policies: users can ONLY access their own rows
create policy "Users manage own quiz_sets"
  on public.quiz_sets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own quiz_attempts"
  on public.quiz_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own user_stats"
  on public.user_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
