-- ============================================================
-- Ehsas — Write page "Type" now uses the same categories as the
-- home page (Love, Sad, Joyful, Nazm, Dosti, Ghazal, Sher, Kavita)
-- instead of the old generic Shayari / Poem / Quote / Story / Other.
-- ------------------------------------------------------------
-- Run this ONCE in the Supabase SQL Editor, AFTER
-- supabase/add-submissions.sql.
--
-- SAFETY: only widens the CHECK constraint on submissions.category.
-- Existing submissions keep whatever category they already have —
-- the old values stay valid, nothing is renamed or re-validated
-- away. The app only offers the new 8 categories going forward.
-- Idempotent — safe to re-run.
-- ============================================================

alter table public.submissions
  drop constraint if exists submissions_category_check;

alter table public.submissions
  add constraint submissions_category_check
  check (category in (
    -- current site categories (Write page offers these from now on)
    'love', 'sad', 'joyful', 'nazm', 'dosti', 'ghazal', 'sher', 'kavita',
    -- legacy values from before this change — kept valid so existing
    -- pending/approved/rejected submissions are never invalidated
    'shayari', 'poem', 'quote', 'story', 'other'
  ));

alter table public.submissions
  alter column category set default 'love';
