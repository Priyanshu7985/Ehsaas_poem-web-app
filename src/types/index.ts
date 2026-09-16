export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export type PoemCategory = 'love' | 'sad' | 'joyful' | 'nazm' | 'dosti' | 'ghazal' | 'sher' | 'kavita'

export interface Poem {
  id: string
  author_id: string
  title: string
  content: string
  category: PoemCategory
  created_at: string
  pen_name?: string | null
  source_submission_id?: string | null
  author?: Profile
  like_count?: number
  comment_count?: number
  liked_by_me?: boolean
  bookmarked_by_me?: boolean
}

// Submission "type" now uses the same categories shown on the home page
// (love/sad/joyful/nazm/dosti/ghazal/sher/kavita). `string` covers the
// handful of older submissions saved before this change (shayari/poem/
// quote/story/other) — the DB still accepts them, they just no longer
// appear as choices on the Write page.
export type SubmissionCategory = PoemCategory | string

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface Submission {
  id: string
  user_id: string
  title: string | null
  content: string
  author_name: string
  category: SubmissionCategory
  status: SubmissionStatus
  admin_note: string | null
  reviewed_by: string | null
  published_poem_id: string | null
  created_at: string
  reviewed_at: string | null
  approved_at: string | null
}

export interface Comment {
  id: string
  poem_id: string
  user_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface AudioPoem {
  id: string
  author_id: string
  title: string
  audio_url: string
  created_at: string
  author?: Profile
}

export interface Quote {
  id: string
  text: string
  author: string
}

export interface QuoteOfDay {
  date: string
  poem_id: string
  poem: Poem
}
