-- Run this once in the Supabase SQL Editor to add the "pick any
-- published poem as today's Quote of the Day" feature.

create table if not exists public.quote_of_day (
  date date primary key,
  poem_id uuid not null references public.poems(id) on delete cascade,
  set_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.quote_of_day enable row level security;

drop policy if exists "Quote of the day is viewable by everyone" on public.quote_of_day;
create policy "Quote of the day is viewable by everyone" on public.quote_of_day
  for select using (true);

drop policy if exists "Signed-in users can set the quote of the day" on public.quote_of_day;
create policy "Signed-in users can set the quote of the day" on public.quote_of_day
  for insert with check (auth.uid() = set_by);

drop policy if exists "Signed-in users can change the quote of the day" on public.quote_of_day;
create policy "Signed-in users can change the quote of the day" on public.quote_of_day
  for update using (auth.uid() is not null) with check (auth.uid() = set_by);
