import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AudioPoemCard from './AudioPoemCard'
import AudioUploadForm from './AudioUploadForm'
import EmptyState from './EmptyState'
import type { AudioPoem } from '../types'

export default function AudioPoemsSection() {
  const [audioPoems, setAudioPoems] = useState<AudioPoem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('audio_poems')
        .select('*, author:profiles(*)')
        .order('created_at', { ascending: false })
      setAudioPoems((data as AudioPoem[]) ?? [])
    } catch {
      setAudioPoems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-5">
      <AudioUploadForm onUploaded={load} />

      {loading ? (
        <p className="py-6 text-center text-sm text-paper-100/50">Loading audio poems…</p>
      ) : audioPoems.length === 0 ? (
        <EmptyState
          icon="🎧"
          title="No recitations yet"
          description="Recorded poetry recitations from the community will play here once shared."
        />
      ) : (
        <div className="space-y-4">
          {audioPoems.map((a) => (
            <AudioPoemCard key={a.id} audioPoem={a} />
          ))}
        </div>
      )}
    </div>
  )
}
