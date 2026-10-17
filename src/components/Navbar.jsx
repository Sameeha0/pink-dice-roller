import React from 'react'
import ThemeToggle from './ThemeToggle.jsx'

const tabs = [
  { key: 'players', label: 'Players', icon: '👥' },
  { key: 'dice', label: 'Dice', icon: '🎲' },
  { key: 'history', label: 'History', icon: '📜' }
]

export default function Navbar({ tab, setTab, onOpenAbout, partyCode }) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="dice !w-11 !h-11 !p-2 !rounded-xl shrink-0" aria-hidden="true">
            <div className="grid grid-cols-2 gap-1.5">
              <span className="dice-dot !w-2 !h-2" />
              <span className="dice-dot !w-2 !h-2 opacity-0" />
              <span className="dice-dot !w-2 !h-2 opacity-0" />
              <span className="dice-dot !w-2 !h-2" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-hotPink dark:text-neonPink leading-none">
              Pink Dice Roller
            </h1>
            <p className="text-sm text-inkSoft dark:text-rose/60 mt-1">Roll together, live, on any device</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-ghost hidden sm:inline-flex" onClick={onOpenAbout}>Guide</button>
          <button className="btn-ghost sm:hidden !px-3" onClick={onOpenAbout} aria-label="Open guide">?</button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="segmented w-full sm:w-auto" role="tablist" aria-label="Sections">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className="segment flex-1 sm:flex-none"
              onClick={() => setTab(t.key)}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <span className="chip self-start sm:self-auto">
          <span className={`h-2 w-2 rounded-full ${partyCode && partyCode !== 'local' ? 'bg-emerald-400' : 'bg-inkSoft/40 dark:bg-rose/30'}`} />
          {partyCode && partyCode !== 'local' ? (
            <>Party <span className="font-mono tracking-wider">{partyCode}</span></>
          ) : (
            'Playing locally'
          )}
        </span>
      </div>
    </header>
  )
}
