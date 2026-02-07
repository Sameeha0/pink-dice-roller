import React, { useEffect, useMemo, useState } from 'react'
import {
  addPlayer,
  subscribePlayers,
  removePlayerByName,
  removePlayerByNameEmoji
} from '../firebase/firebaseConfig.js'

export default function Players({ externalPlayers, currentPlayerId, partyCode, onSetParty, onResetGame, onPlayersChanged }) {
  const [players, setPlayers] = useState(externalPlayers || [])
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [createdCode, setCreatedCode] = useState(partyCode || '')
  const [joinInput, setJoinInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [clearName, setClearName] = useState('')
  const [clearEmoji, setClearEmoji] = useState('')

  useEffect(() => {
    if (externalPlayers) {
      setPlayers(externalPlayers)
      return
    }
    const unsub = subscribePlayers(setPlayers)
    return () => unsub && unsub()
  }, [externalPlayers])

  useEffect(() => {
    if (externalPlayers) setPlayers(externalPlayers)
  }, [externalPlayers])

  const leader = useMemo(() => {
    if (!players.length) return null
    return players.reduce((a, b) => (a.highestTotal >= b.highestTotal ? a : b))
  }, [players])

  function sanitizeEmoji(e) {
    if (!e) return ''
    if (e.includes('👑')) return '🎀'
    return e
  }

  async function onAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    const em = sanitizeEmoji(emoji.trim())
    await addPlayer(trimmed, em)
    setName('')
    setEmoji('')
    onPlayersChanged && onPlayersChanged()
  }

  return (
    <div className="barbie-card p-4">
      <h2 className="text-lg font-semibold mb-3">Players</h2>
      <div className="barbie-card p-3 mb-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm opacity-80 flex flex-wrap items-center gap-2">
            <span>Party Code: <span className="font-semibold">{partyCode || 'local'}</span></span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="tab-button"
              disabled={busy}
              onClick={() => {
                const code = Math.random().toString(36).slice(2, 8).toUpperCase()
                setCreatedCode(code)
                onSetParty && onSetParty(code)
                onResetGame && onResetGame()
              }}
            >
              Generate
            </button>
            <input
              type="text"
              value={createdCode}
              readOnly
              placeholder="CODE"
              className="w-32 sm:w-40 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
            />
            <button
              className="tab-button"
              disabled={busy || !joinInput.trim()}
              onClick={() => {
                onSetParty && onSetParty(joinInput.trim())
                onResetGame && onResetGame()
              }}
            >
              Join
            </button>
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="w-32 sm:w-40 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a player name"
          className="w-full sm:flex-1 min-w-0 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
        />
        <input
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="Emoji"
          className="w-full sm:w-24 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
        />
        <button className="barbie-button w-full sm:w-auto shrink-0" onClick={onAdd}>Add</button>
      </div>

      {!players.length ? (
        <div className="text-center py-6">
          <p className="text-sm opacity-80">No players yet 💕 Add your first!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => {
            const isLeader = leader && leader.id === p.id && leader.highestTotal > 0
            const isActive = currentPlayerId && currentPlayerId === p.id
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl bg-babyPink/50 dark:bg-barbieBlack/30 ${isLeader ? 'ring-2 ring-hotPink shadow-barbie' : ''} ${isActive ? 'ring-2 ring-neonPink' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{isLeader ? '👑' : (p.emoji || '😊')}</span>
                  <div>
                    <div className="font-semibold">
                      {p.name} {isActive ? <span className="ml-2 text-neonPink">· turn</span> : null}
                    </div>
                    <div className="text-xs opacity-80">
                      Highest: {p.highestTotal || 0}
                      {p.highestTotal ? ` ( ${p.highestDiceValues?.join(', ')} )` : ''}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={clearName}
            onChange={(e) => setClearName(e.target.value)}
            placeholder="Your name"
            className="w-40 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
          />
          <input
            type="text"
            value={clearEmoji}
            onChange={(e) => setClearEmoji(e.target.value)}
            placeholder="Your emoji (optional)"
            className="w-40 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
          />
          <button
            className="tab-button"
            onClick={async () => {
              const target = clearName.trim()
              if (!target) {
                window.alert('Enter your name to clear')
                return
              }
              setBusy(true)
              const removed = await removePlayerByNameEmoji(target, clearEmoji.trim())
              setBusy(false)
              onPlayersChanged && onPlayersChanged()
              setClearName('')
              setClearEmoji('')
              if (!removed) {
                window.alert('No matching name found in this party')
              } else {
                window.alert('Removed')
              }
            }}
            disabled={busy}
          >
            Clear Your Name
          </button>
        </div>
      </div>
    </div>
  )
}
