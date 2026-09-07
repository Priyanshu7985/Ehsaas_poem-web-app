import { Link } from 'react-router-dom'
import type { AudioPoem } from '../types'

export default function AudioPoemCard({ audioPoem }: { audioPoem: AudioPoem }) {
  const authorName = audioPoem.author?.display_name || audioPoem.author?.username || 'Unknown poet'

  return (
    <article className="glow-card rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-sm text-ink-950 shadow-[0_0_16px_rgba(198,149,47,0.4)]">
          🎙
        </span>
        <div>
          <h3 className="font-display text-base text-paper-50">{audioPoem.title}</h3>
          <Link to={`/poet/${audioPoem.author_id}`} className="text-xs text-paper-100/60 hover:text-gold-400">
            {authorName}
          </Link>
        </div>
      </div>
      <audio controls preload="none" className="mt-4 w-full" style={{ colorScheme: 'dark' }} src={audioPoem.audio_url}>
        Your browser does not support the audio element.
      </audio>
    </article>
  )
}
