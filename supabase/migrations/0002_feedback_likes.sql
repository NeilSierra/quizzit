-- App-wide Like Counter & User Feedback
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- 1. App Likes (anonymous or authenticated, one row per like_id)
create table if not exists public.app_likes (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.app_likes enable row level security;

-- Anyone can read the like count
create policy "Anyone can count app_likes"
  on public.app_likes for select
  using (true);

-- Anyone can add or remove their own like by id
create policy "Anyone can insert app_likes"
  on public.app_likes for insert
  with check (true);

create policy "Anyone can delete own app_likes"
  on public.app_likes for delete
  using (true);

-- 2. User Feedback (write-only for visitors, private from other users)
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null default 'idea',
  rating integer not null default 5 check (rating >= 1 and rating <= 5),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.user_feedback enable row level security;

create policy "Anyone can submit feedback"
  on public.user_feedback for insert
  with check (true);
