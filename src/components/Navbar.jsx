import React from 'react'
import ThemeToggle from './ThemeToggle.jsx'

const tabs = [
  { key: 'players', label: 'Players' },
  { key: 'dice', label: 'Dice' },
  { key: 'history', label: 'History' }
]

export default function Navbar({ tab, setTab, onOpenAbout, partyCode }) {
  return (
    <nav className="flex flex-col items-center gap-3 px-4 py-3 bg-babyPink/40 dark:bg-barbieBlack/60 backdrop-blur rounded-xl">
      <h1 className="text-2xl md:text-3xl font-bold text-hotPink dark:text-neonPink text-center">
        Pink Dice Roller
      </h1>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="rounded-xl px-3 py-1 text-xs bg-babyPink/60 dark:bg-barbieBlack/40 font-mono">
          Code: {partyCode || 'local'}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-button ${tab === t.key ? 'ring-2 ring-hotPink' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <ThemeToggle />
        <button className="tab-button" onClick={onOpenAbout}>Guide</button>
      </div>
    </nav>
  )
}
