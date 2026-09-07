-- Run this once in the Supabase SQL Editor to allow removing
-- today's Quote of the Day pick (the "Remove" button in the app).

drop policy if exists "Signed-in users can remove the quote of the day" on public.quote_of_day;
create policy "Signed-in users can remove the quote of the day" on public.quote_of_day
  for delete using (auth.uid() is not null);
