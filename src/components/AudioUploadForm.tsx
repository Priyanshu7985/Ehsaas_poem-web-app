import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'

export default function AudioUploadForm({ onUploaded }: { onUploaded: () => void }) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFocus = () => {
    if (!user) openAuthModal('signup', 'Sign up to upload your poetry recitations.')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      openAuthModal('signup', 'Sign up to upload your poetry recitations.')
      return
    }
    if (!file || !title.trim()) {
      setError('Add a title and choose an audio file.')
      return
    }

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('audio-poems').upload(path, file)
    if (uploadError) {
      setUploading(false)
      setError(uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('audio-poems').getPublicUrl(path)

    const { error: insertError } = await supabase.from('audio_poems').insert({
      author_id: user.id,
      title: title.trim(),
      audio_url: publicUrlData.publicUrl,
    })

    setUploading(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    setTitle('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onUploaded()
  }

  return (
    <form onSubmit={handleSubmit} className="glow-card rounded-2xl p-5 space-y-3">
      <h3 className="font-display text-lg text-paper-50">Share a recitation</h3>
      <input
        type="text"
        placeholder="Title of your recitation"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={handleFocus}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-paper-50 placeholder:text-paper-100/30 focus:outline-none focus:ring-2 focus:ring-gold-500"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onFocus={handleFocus}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-sm text-paper-100/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-paper-50 file:text-sm hover:file:bg-white/15"
      />
      {error && <p className="text-sm text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={uploading}
        className="rounded-full bg-gradient-to-r from-maroon-600 to-maroon-700 px-4 py-2 text-sm font-medium text-paper-50 shadow-[0_0_18px_rgba(138,31,45,0.5)] hover:from-maroon-500 hover:to-maroon-600 disabled:opacity-60"
      >
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  )
}
