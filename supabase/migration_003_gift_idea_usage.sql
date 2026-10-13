-- Run this in your Supabase project's SQL Editor. Safe to run more than once.
-- Caps Claude-powered Magic ideas at 15 per user per day (UTC).

create table if not exists gift_idea_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);

alter table gift_idea_usage enable row level security;

-- Users can read their own count but never write it directly; only the
-- function below changes it, so the limit can't be reset from the browser.
drop policy if exists "gift_idea_usage_select_own" on gift_idea_usage;
create policy "gift_idea_usage_select_own" on gift_idea_usage
  for select using (auth.uid() = user_id);

-- Atomically uses one credit. Returns today's new count, or null when the
-- user has already hit the limit. The limit is fixed here (not a parameter)
-- so callers can't raise it.
create or replace function claim_gift_idea_credit()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  insert into gift_idea_usage (user_id, day, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update
    set count = gift_idea_usage.count + 1
    where gift_idea_usage.count < 15
  returning count into used;

  return used;
end;
$$;

revoke all on function claim_gift_idea_credit() from public, anon;
grant execute on function claim_gift_idea_credit() to authenticated;
