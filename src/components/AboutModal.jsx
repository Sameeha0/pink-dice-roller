import React, { useEffect, useState } from 'react'

const steps = [
  {
    icon: '👥',
    title: 'Players',
    text: 'Start here. Add your name and an emoji.',
    points: [
      ['Online', 'Press Generate to get a code and share it with friends.'],
      ['Join', 'Friends enter your code and press Join.'],
      ['Local', 'Just add players to play on one device.']
    ]
  },
  {
    icon: '🎲',
    title: 'Dice',
    text: 'The main game. Wait for your turn, then roll.',
    points: [
      ['Roll', 'Press Roll dice when it is your turn.'],
      ['Sync', 'Scores and turns update for everyone automatically.']
    ]
  },
  {
    icon: '📜',
    title: 'History',
    text: 'See past rolls or fix mistakes.',
    points: [['Clear', 'Remove just your own rolls if you need to.']]
  }
]

const features = [
  'Turn-based rounds with auto-advance and a winner popup',
  'Glossy dice with animation, sound and confetti',
  'Light and dark themes in Barbie pink',
  'Players with emoji, unlimited per device',
  'Party codes to play together on several devices',
  'Only your device can roll for the players it added',
  'History with clear-all, clear-mine and clear-device options',
  'Serverless peer-to-peer sync (WebRTC via Trystero)'
]

export default function AboutModal({ onClose }) {
  const [page, setPage] = useState(0)

  // Close with the Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-ink/40 dark:bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="dialog-panel card w-full max-w-xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
          <div>
            <p className="label">{page === 0 ? 'Guide' : 'About'}</p>
            <h2 id="about-title" className="text-2xl font-extrabold text-hotPink dark:text-neonPink">
              {page === 0 ? 'How to play' : 'Features'}
            </h2>
          </div>
          <button className="btn-ghost !px-3" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          {page === 0 ? (
            <ol className="flex flex-col gap-3">
              {steps.map((s, i) => (
                <li key={s.title} className="panel p-4 flex gap-4">
                  <span className="h-10 w-10 shrink-0 rounded-xl grid place-items-center text-lg bg-white dark:bg-nightLine">
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold">{i + 1}. {s.title}</h3>
                    <p className="text-sm text-inkSoft dark:text-rose/70">{s.text}</p>
                    <ul className="mt-2 flex flex-col gap-1 text-sm">
                      {s.points.map(([k, v]) => (
                        <li key={k}><span className="font-bold">{k}:</span> <span className="text-inkSoft dark:text-rose/70">{v}</span></li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div>
              <ul className="flex flex-col gap-2">
                {features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <span className="text-hotPink dark:text-neonPink font-extrabold" aria-hidden="true">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-center font-bold text-hotPink dark:text-neonPink">Made by Sameeha 🎀</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 mt-4 border-t border-babyPink/60 dark:border-nightLine">
          <div className="flex gap-2" aria-hidden="true">
            <span className={`h-2 rounded-full transition-[width,background-color] duration-200 ${page === 0 ? 'w-6 bg-hotPink' : 'w-2 bg-babyPink dark:bg-nightLine'}`} />
            <span className={`h-2 rounded-full transition-[width,background-color] duration-200 ${page === 1 ? 'w-6 bg-hotPink' : 'w-2 bg-babyPink dark:bg-nightLine'}`} />
          </div>
          {page === 0 ? (
            <button className="btn-primary" onClick={() => setPage(1)}>Next →</button>
          ) : (
            <button className="btn-secondary" onClick={() => setPage(0)}>← Back</button>
          )}
        </div>
      </div>
    </div>
  )
}
