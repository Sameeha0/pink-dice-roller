import React, { useEffect, useState } from 'react'
import { subscribeRolls, clearRolls, clearMyRollsByNameEmoji, clearDeviceRolls, getRollsOnce } from '../firebase/firebaseConfig.js'

function formatTime(ts) {
  if (!ts) return ''
  if (typeof ts === 'number') return new Date(ts).toLocaleString()
  if (ts?.toDate) return ts.toDate().toLocaleString()
  return ''
}

export default function History({ onCleared }) {
  const [rolls, setRolls] = useState([])
  const [clearing, setClearing] = useState(false)
  const [myName, setMyName] = useState('')
  const [myEmoji, setMyEmoji] = useState('')

  useEffect(() => {
    const unsub = subscribeRolls(setRolls)
    return () => unsub && unsub()
  }, [])

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="section-title">History</h2>
          <p className="section-desc">Every roll in this party, newest first.</p>
        </div>
        <button
          className="btn-danger"
          onClick={async () => {
            setClearing(true)
            await clearRolls()
            setRolls([])
            setClearing(false)
            onCleared && onCleared()
          }}
          disabled={clearing || !rolls.length}
        >
          {clearing ? 'Clearing…' : 'Clear history'}
        </button>
      </div>

      {!rolls.length ? (
        <div className="panel text-center py-10 px-4">
          <div className="text-4xl mb-2" aria-hidden="true">🎲</div>
          <p className="font-bold">No rolls yet</p>
          <p className="section-desc">Rolls will appear here as soon as someone plays.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rolls.map((r) => (
            <li
              key={r.id || r.createdAt}
              className="flex items-center gap-3 p-3 rounded-2xl bg-rose/50 dark:bg-night/50"
            >
              <span className="h-11 w-11 shrink-0 rounded-full grid place-items-center text-lg font-extrabold tabular-nums text-white"
                style={{ backgroundImage: 'var(--barbie-gradient)' }}>
                {r.total}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold truncate">{r.playerName}</div>
                <div className="text-xs text-inkSoft dark:text-rose/60">{formatTime(r.createdAt)}</div>
              </div>
              <div className="flex gap-1 shrink-0" aria-label={`Dice values ${r.diceValues?.join(', ')}`}>
                {(r.diceValues || []).map((v, i) => (
                  <span key={i} className="h-7 w-7 rounded-lg grid place-items-center text-xs font-extrabold bg-white dark:bg-nightLine border border-babyPink dark:border-nightLine">
                    {v}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-5 group">
        <summary className="cursor-pointer list-none text-sm font-bold text-inkSoft dark:text-rose/60 hover:text-deepPink dark:hover:text-rose select-none">
          <span className="inline-block transition-transform duration-150 group-open:rotate-90 mr-1">›</span>
          Remove only your rolls
        </summary>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <input
            type="text"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            className="field !w-40"
          />
          <input
            type="text"
            value={myEmoji}
            onChange={(e) => setMyEmoji(e.target.value)}
            placeholder="Emoji (optional)"
            aria-label="Your emoji"
            className="field !w-40"
          />
          <button
            className="btn-secondary"
            onClick={async () => {
              if (!myName.trim()) {
                alert('Enter your name to clear')
                return
              }
              setClearing(true)
              await clearMyRollsByNameEmoji(myName.trim(), myEmoji.trim())
              setClearing(false)
              setMyName('')
              setMyEmoji('')
              const refreshed = await getRollsOnce()
              setRolls(refreshed)
              alert('Clear attempt finished')
            }}
            disabled={clearing}
          >
            Clear my rolls
          </button>
          <button
            className="btn-ghost"
            onClick={async () => {
              setClearing(true)
              await clearDeviceRolls()
              setClearing(false)
              const refreshed = await getRollsOnce()
              setRolls(refreshed)
              alert('Device rolls clear attempt finished')
            }}
            disabled={clearing}
          >
            Clear this device&apos;s rolls
          </button>
        </div>
      </details>
    </section>
  )
}
