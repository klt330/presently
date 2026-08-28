-- Run this once in your Supabase project's SQL Editor (Supabase Dashboard -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birthday date not null,
  birth_year_known boolean not null default true,
  timezone text not null default 'America/New_York',
  city text,
  address text,
  bio text,
  color text not null default '#FF5D8F',
  last_reminded_year int,
  created_at timestamptz not null default now()
);

create table if not exists gifts (
  id uuid primary key default gen_random_uuid(),
  friend_id uuid not null references friends(id) on delete cascade,
  title text not null,
  url text,
  image_url text,
  status text not null default 'idea' check (status in ('idea', 'purchased', 'sent')),
  source text not null default 'manual' check (source in ('manual', 'auto')),
  created_at timestamptz not null default now()
);

create index if not exists friends_user_id_idx on friends(user_id);
create index if not exists gifts_friend_id_idx on gifts(friend_id);

alter table friends enable row level security;
alter table gifts enable row level security;

-- Each signed-in user can only see and manage their own friends.
create policy "friends_select_own" on friends
  for select using (auth.uid() = user_id);
create policy "friends_insert_own" on friends
  for insert with check (auth.uid() = user_id);
create policy "friends_update_own" on friends
  for update using (auth.uid() = user_id);
create policy "friends_delete_own" on friends
  for delete using (auth.uid() = user_id);

-- Gifts are only reachable through a friend the user owns.
create policy "gifts_select_own" on gifts
  for select using (
    exists (select 1 from friends where friends.id = gifts.friend_id and friends.user_id = auth.uid())
  );
create policy "gifts_insert_own" on gifts
  for insert with check (
    exists (select 1 from friends where friends.id = gifts.friend_id and friends.user_id = auth.uid())
  );
create policy "gifts_update_own" on gifts
  for update using (
    exists (select 1 from friends where friends.id = gifts.friend_id and friends.user_id = auth.uid())
  );
create policy "gifts_delete_own" on gifts
  for delete using (
    exists (select 1 from friends where friends.id = gifts.friend_id and friends.user_id = auth.uid())
  );
