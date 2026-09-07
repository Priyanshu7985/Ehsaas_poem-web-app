-- Run this once in the Supabase SQL Editor to add shayari categories
-- (Love, Sad, Joyful, Nazm, Dosti, Ghazal, Sher, Kavita) to existing poems.
-- Safe to re-run even if you ran an earlier version of this file.

alter table public.poems
  add column if not exists category text not null default 'love';

alter table public.poems
  drop constraint if exists poems_category_check;

alter table public.poems
  add constraint poems_category_check
  check (category in ('love', 'sad', 'joyful', 'nazm', 'dosti', 'ghazal', 'sher', 'kavita'));
