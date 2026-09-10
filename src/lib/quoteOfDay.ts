import { supabase } from './supabaseClient'
import { todayISO } from './date'

/**
 * Fired on `window` whenever the Quote of the Day is picked, replaced, or
 * removed, so the banner can refresh without a page reload.
 */
export const QUOTE_OF_DAY_CHANGED_EVENT = 'ehsas:quote-of-day-changed'

export function notifyQuoteOfDayChanged() {
  window.dispatchEvent(new Event(QUOTE_OF_DAY_CHANGED_EVENT))
}

/**
 * Feature a poem as today's Quote of the Day. `date` is the table's primary
 * key, so this upsert replaces whatever poem was set for today — the previous
 * pick is dropped automatically and the new one takes its place.
 * Requires an admin session (enforced by RLS).
 */
export async function setQuoteOfDay(poemId: string, adminUserId: string) {
  const { error } = await supabase
    .from('quote_of_day')
    .upsert({ date: todayISO(), poem_id: poemId, set_by: adminUserId }, { onConflict: 'date' })
  if (!error) notifyQuoteOfDayChanged()
  return { error: error?.message ?? null }
}

export async function clearQuoteOfDay() {
  const { error } = await supabase.from('quote_of_day').delete().eq('date', todayISO())
  if (!error) notifyQuoteOfDayChanged()
  return { error: error?.message ?? null }
}
