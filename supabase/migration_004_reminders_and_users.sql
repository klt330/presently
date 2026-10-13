-- Run this in your Supabase project's SQL Editor. Safe to run more than once.
-- Adds: user profiles (with reminder settings), daily activity, per-friend
-- reminder timing, a reminder send log, and an admin list for the dashboard.

-- ---------------------------------------------------------------------------
-- Profiles: one row per user, created automatically at sign-up.
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  default_lead_days int not null default 14,
  day_of_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

alter table profiles drop constraint if exists profiles_default_lead_days_check;
alter table profiles add constraint profiles_default_lead_days_check
  check (default_lead_days in (30, 14, 7, 3, 1));

alter table profiles enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = user_id);

-- Users may change only their reminder settings, never email or timestamps.
revoke insert, update, delete on profiles from anon, authenticated;
grant select on profiles to authenticated;
grant update (default_lead_days, day_of_enabled) on profiles to authenticated;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (user_id, email, created_at)
  values (new.id, new.email, coalesce(new.created_at, now()))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill everyone who signed up before this migration.
insert into profiles (user_id, email, created_at, last_seen_at)
select id, email, created_at, last_sign_in_at from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Daily activity: one row per user per day they open Presently.
-- ---------------------------------------------------------------------------
create table if not exists user_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

alter table user_activity enable row level security;
-- No policies: only record_activity() and the service role touch this table.

create or replace function record_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into profiles (user_id, email)
  values (auth.uid(), auth.jwt() ->> 'email')
  on conflict (user_id) do nothing;

  insert into user_activity (user_id, day)
  values (auth.uid(), current_date)
  on conflict do nothing;

  update profiles
  set last_seen_at = now()
  where user_id = auth.uid()
    and (last_seen_at is null or last_seen_at < now() - interval '10 minutes');
end;
$$;

revoke all on function record_activity() from public, anon;
grant execute on function record_activity() to authenticated;

-- ---------------------------------------------------------------------------
-- Per-friend reminder timing (null = use the profile default).
-- ---------------------------------------------------------------------------
alter table friends add column if not exists lead_days int;

alter table friends drop constraint if exists friends_lead_days_check;
alter table friends add constraint friends_lead_days_check
  check (lead_days is null or lead_days in (30, 14, 7, 3, 1));

-- ---------------------------------------------------------------------------
-- Reminder send log: prevents duplicates and lets missed days catch up.
-- ---------------------------------------------------------------------------
create table if not exists reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references friends(id) on delete cascade,
  occasion_date date not null,
  kind text not null check (kind in ('early', 'day_of')),
  status text not null check (status in ('sent', 'failed')),
  attempts int not null default 1,
  error text,
  sent_at timestamptz not null default now(),
  unique (friend_id, occasion_date, kind)
);

create index if not exists reminder_log_sent_at_idx on reminder_log(sent_at);

alter table reminder_log enable row level security;

drop policy if exists "reminder_log_select_own" on reminder_log;
create policy "reminder_log_select_own" on reminder_log
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Admins: who can open /admin. No policies, so only the server can read it.
-- Add yourself separately (not in this file, which is public):
--   insert into admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
-- ---------------------------------------------------------------------------
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table admins enable row level security;
