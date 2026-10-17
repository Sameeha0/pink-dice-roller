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
    <div className="flex flex-col gap-5">
      {/* Party: play together on several devices */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div>
            <h2 className="section-title">Party</h2>
            <p className="section-desc">Create a code and share it, or join a friend&apos;s party.</p>
          </div>
          <span className="chip">
            Code <span className="font-mono tracking-wider">{partyCode || 'local'}</span>
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="panel p-3 flex flex-col gap-2">
            <span className="label">Host a party</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={createdCode}
                readOnly
                placeholder="CODE"
                aria-label="Your party code"
                className="field font-mono tracking-wider"
              />
              <button
                className="btn-primary shrink-0"
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
            </div>
          </div>
          <div className="panel p-3 flex flex-col gap-2">
            <span className="label">Join a party</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                aria-label="Party code to join"
                className="field font-mono tracking-wider"
              />
              <button
                className="btn-secondary shrink-0"
                disabled={busy || !joinInput.trim()}
                onClick={() => {
                  onSetParty && onSetParty(joinInput.trim())
                  onResetGame && onResetGame()
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Players */}
      <section className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h2 className="section-title">Players</h2>
            <p className="section-desc">Players you add here can roll from this device.</p>
          </div>
          {players.length ? <span className="chip">{players.length} {players.length === 1 ? 'player' : 'players'}</span> : null}
        </div>

        <form
          className="flex flex-col sm:flex-row gap-2 mb-5"
          onSubmit={(e) => {
            e.preventDefault()
            onAdd()
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a player name"
            aria-label="Player name"
            className="field sm:flex-1 min-w-0"
          />
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="Emoji"
            aria-label="Player emoji"
            className="field sm:!w-24 text-center"
          />
          <button type="submit" className="btn-primary shrink-0" disabled={!name.trim()}>Add player</button>
        </form>

        {!players.length ? (
          <div className="panel text-center py-10 px-4">
            <div className="text-4xl mb-2" aria-hidden="true">🎀</div>
            <p className="font-bold">No players yet</p>
            <p className="section-desc">Add your first player to start rolling.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {players.map((p) => {
              const isLeader = leader && leader.id === p.id && leader.highestTotal > 0
              const isActive = currentPlayerId && currentPlayerId === p.id
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors duration-150 ${
                    isActive
                      ? 'bg-white dark:bg-nightCard border-hotPink/60 dark:border-neonPink/60 shadow-card'
                      : 'bg-rose/50 dark:bg-night/50 border-transparent'
                  }`}
                >
                  <span className="h-11 w-11 shrink-0 rounded-full grid place-items-center text-xl bg-white dark:bg-nightLine border border-babyPink dark:border-nightLine">
                    {isLeader ? '👑' : (p.emoji || '😊')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold truncate">{p.name}</div>
                    <div className="text-xs text-inkSoft dark:text-rose/60 tabular-nums">
                      Best roll {p.highestTotal || 0}
                      {p.highestTotal ? ` (${p.highestDiceValues?.join(' + ')})` : ''}
                    </div>
                  </div>
                  {isActive ? <span className="chip !bg-hotPink !text-white !border-hotPink shrink-0">Their turn</span> : null}
                  {!isActive && isLeader ? <span className="chip shrink-0">Leader</span> : null}
                </li>
              )
            })}
          </ul>
        )}

        <details className="mt-5 group">
          <summary className="cursor-pointer list-none text-sm font-bold text-inkSoft dark:text-rose/60 hover:text-deepPink dark:hover:text-rose select-none">
            <span className="inline-block transition-transform duration-150 group-open:rotate-90 mr-1">›</span>
            Remove yourself from the party
          </summary>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              type="text"
              value={clearName}
              onChange={(e) => setClearName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              className="field !w-40"
            />
            <input
              type="text"
              value={clearEmoji}
              onChange={(e) => setClearEmoji(e.target.value)}
              placeholder="Emoji (optional)"
              aria-label="Your emoji"
              className="field !w-40"
            />
            <button
              className="btn-danger"
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
              Remove me
            </button>
          </div>
        </details>
      </section>
    </div>
  )
}
