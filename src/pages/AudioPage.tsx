import AudioPoemsSection from '../components/AudioPoemsSection'

export default function AudioPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div>
        <h2 className="font-display text-xl text-paper-50 mb-1">Audio Poems</h2>
        <p className="text-sm text-paper-100/60 mb-4">Listen to poetry recitations recorded by the community.</p>
        <AudioPoemsSection />
      </div>
    </div>
  )
}
