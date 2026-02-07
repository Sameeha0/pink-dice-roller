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
    <div className="barbie-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">History</h2>
        <button
          className="tab-button"
          onClick={async () => {
            setClearing(true)
            await clearRolls()
            setRolls([])
            setClearing(false)
            onCleared && onCleared()
          }}
          disabled={clearing || !rolls.length}
        >
          {clearing ? 'Clearing…' : 'Clear History'}
        </button>
      </div>
      <div className="barbie-card p-3 mb-3">
        <div className="text-sm font-semibold mb-2">Clear by device or your name</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="Your name"
            className="w-40 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
          />
          <input
            type="text"
            value={myEmoji}
            onChange={(e) => setMyEmoji(e.target.value)}
            placeholder="Your emoji (optional)"
            className="w-40 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
          />
          <button
            className="tab-button"
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
            Clear My Rolls
          </button>
          <button
            className="tab-button"
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
            Clear Device Rolls
          </button>
        </div>
      </div>
      {!rolls.length ? (
        <div className="text-center py-6">
          <p className="text-sm opacity-80">No rolls yet 💕 Let’s roll!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rolls.map((r) => (
            <li
              key={r.id || r.createdAt}
              className="flex items-center justify-between p-3 rounded-xl bg-babyPink/50 dark:bg-barbieBlack/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🎀</span>
                <div>
                  <div className="font-semibold">
                    {r.playerName} · {r.diceCount} dice · Total {r.total}
                  </div>
                  <div className="text-xs opacity-80">
                    Values: {r.diceValues?.join(', ')} · {formatTime(r.createdAt)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
