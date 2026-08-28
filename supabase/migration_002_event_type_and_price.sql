-- Run this in your Supabase project's SQL Editor. Safe to run even if some
-- of these already exist — each statement is a no-op in that case.

alter table friends
  add column if not exists event_type text not null default 'Birthday';

alter table friends
  drop constraint if exists friends_event_type_check;

alter table friends
  add constraint friends_event_type_check
  check (event_type in ('Birthday', 'Wedding anniversary', 'Celebration', 'Child''s birthday'));

alter table gifts
  add column if not exists price text;
