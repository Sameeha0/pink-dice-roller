import React, { useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { saveRoll, updatePlayerHighest, getDeviceId } from '../firebase/firebaseConfig.js'

function DiceFace({ value, animate }) {
  const dot = <span className="dice-dot" />
  const grids = {
    1: [[0,0,0],[0,1,0],[0,0,0]],
    2: [[1,0,0],[0,0,0],[0,0,1]],
    3: [[1,0,0],[0,1,0],[0,0,1]],
    4: [[1,0,1],[0,0,0],[1,0,1]],
    5: [[1,0,1],[0,1,0],[1,0,1]],
    6: [[1,0,1],[1,0,1],[1,0,1]]
  }
  const grid = grids[value] || grids[1]
  return (
    <div className={`dice ${animate ? 'animate-roll' : ''}`} role="img" aria-label={`Die showing ${value}`}>
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
        {grid.flat().map((v, i) => (
          <div key={i} className="flex items-center justify-center">
            {v ? dot : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dice({
  currentPlayer,
  currentRound,
  rounds,
  index,
  totalPlayers,
  winnerId,
  winnerName,
  onSetRounds,
  onResetGame,
  onRolled,
  sessionId
}) {
  const [count, setCount] = useState(2)
  const [values, setValues] = useState([])
  const [total, setTotal] = useState(0)
  const [rolling, setRolling] = useState(false)
  const audioRef = useRef(null)

  function initAudio() {
    if (!audioRef.current) {
      const base = (import.meta.env && import.meta.env.BASE_URL) || '/'
      const src = (base.endsWith('/') ? base : base + '/') + 'sounds/roll-click.mp3'
      const a = new Audio(src)
      a.preload = 'none'
      audioRef.current = a
    }
  }

  function playAudio() {
    initAudio()
    audioRef.current?.currentTime && (audioRef.current.currentTime = 0)
    audioRef.current?.play().catch(() => {})
  }

  function fireConfetti(sum, diceCount) {
    const should =
      (diceCount === 1 && sum === 6) ||
      (diceCount === 2 && sum >= 11) ||
      (diceCount === 3 && sum >= 16)
    if (!should) return
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#ff1493', '#ffc0cb', '#ff8fa3']
    })
  }

  async function roll() {
    setRolling(true)
    playAudio()
    const arr = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1)
    setValues(arr)
    const sum = arr.reduce((a, b) => a + b, 0)
    setTotal(sum)
    fireConfetti(sum, count)
    const entry = {
      playerId: currentPlayer?.id || null,
      playerName: currentPlayer?.name || 'Guest',
      diceCount: count,
      diceValues: arr,
      total: sum,
      sessionId: sessionId,
      roundNumber: currentRound
    }
    await saveRoll(entry)
    if (currentPlayer && (currentPlayer.highestTotal || 0) < sum) {
      await updatePlayerHighest(currentPlayer.id, sum, arr)
    }
    onRolled && onRolled({ total: sum })
    setTimeout(() => setRolling(false), 650)
  }

  const disabled = useMemo(() => rolling || !currentPlayer || !!winnerId, [rolling, currentPlayer, winnerId])
  const authorized = useMemo(() => {
    if (!currentPlayer) return false
    const did = getDeviceId()
    return (currentPlayer.ownerDeviceId || '') === did
  }, [currentPlayer])
  const rollDisabled = useMemo(() => disabled || !authorized, [disabled, authorized])

  useEffect(() => {
    if (!winnerId) return
    const bursts = []
    const fire = (count, spread) =>
      confetti({
        particleCount: count,
        spread,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#ff1493', '#ffc0cb', '#ff8fa3', '#ff2e97']
      })
    bursts.push(setTimeout(() => fire(150, 90), 0))
    bursts.push(setTimeout(() => fire(120, 70), 300))
    bursts.push(setTimeout(() => fire(100, 60), 600))
    return () => bursts.forEach((t) => clearTimeout(t))
  }, [winnerId])

  const progress = totalPlayers ? Math.min(100, (((currentRound - 1) * totalPlayers + index) / (rounds * totalPlayers)) * 100) : 0

  return (
    <div className="card p-5 sm:p-7">
      {/* Turn and round status */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label">Now rolling</p>
          {currentPlayer ? (
            <p className="text-2xl font-extrabold text-hotPink dark:text-neonPink mt-1">
              {currentPlayer.emoji ? <span className="mr-1">{currentPlayer.emoji}</span> : null}
              {currentPlayer.name}
            </p>
          ) : (
            <p className="text-lg font-bold text-inkSoft dark:text-rose/60 mt-1">Add players to start</p>
          )}
        </div>
        <div className="text-right">
          <p className="label">Round</p>
          <p className="text-2xl font-extrabold tabular-nums mt-1">
            {currentRound}<span className="text-base text-inkSoft dark:text-rose/50"> / {rounds}</span>
          </p>
          <p className="text-xs text-inkSoft dark:text-rose/50 tabular-nums">
            Player {Math.min(index + 1, totalPlayers)} of {totalPlayers}
          </p>
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-rose dark:bg-nightLine overflow-hidden" aria-hidden="true">
        <div
          className="h-full w-full rounded-full origin-left transition-transform duration-500 ease-smooth"
          style={{ backgroundImage: 'var(--barbie-gradient)', transform: `scaleX(${progress / 100})` }}
        />
      </div>

      {/* Dice stage */}
      <div className="panel mt-6 py-10 px-4 flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <DiceFace key={i} value={values[i] || 1} animate={rolling} />
          ))}
        </div>
        <div className="text-center">
          <p className="label">Total</p>
          <p className="text-5xl font-extrabold tabular-nums text-hotPink dark:text-neonPink leading-tight" aria-live="polite">{total}</p>
          <p className="text-sm text-inkSoft dark:text-rose/60">
            {values.length ? `Rolled ${values.join(' + ')}` : 'Roll to see your values'}
          </p>
        </div>
      </div>

      {/* Roll button */}
      <div className="mt-6">
        {winnerId ? (
          <div className="dialog-backdrop fixed inset-0 flex items-center justify-center bg-ink/40 dark:bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="dialog-panel card p-8 text-center w-full max-w-sm" role="dialog" aria-modal="true" aria-labelledby="winner-title">
              <div className="text-5xl mb-3" aria-hidden="true">👑</div>
              <p className="label">Winner</p>
              <h2 id="winner-title" className="text-3xl font-extrabold text-hotPink dark:text-neonPink mt-1">
                {winnerName || '—'}
              </h2>
              <p className="section-desc mt-2 mb-6">Congratulations! That was a great game.</p>
              <button className="btn-primary btn-lg w-full" onClick={onResetGame}>Play again</button>
            </div>
          </div>
        ) : (
          <>
            {!authorized && currentPlayer ? (
              <p className="text-center text-sm text-inkSoft dark:text-rose/60 mb-3">
                Only the device that added {currentPlayer.name} can roll for them
              </p>
            ) : null}
            <button className="btn-primary btn-lg w-full" onClick={roll} disabled={rollDisabled}>
              {rolling ? 'Rolling…' : '🎲 Roll dice'}
            </button>
          </>
        )}
      </div>

      {/* Game settings */}
      <div className="mt-6 pt-6 border-t border-babyPink/60 dark:border-nightLine grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="label">Dice</span>
          <div className="segmented self-start" role="group" aria-label="Number of dice">
            {[1,2,3].map((n) => (
              <button
                key={n}
                className="segment"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                disabled={rollDisabled}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="label">Rounds</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="segmented" role="group" aria-label="Number of rounds">
              {[1,3,5,7].map((n) => (
                <button
                  key={n}
                  className="segment"
                  aria-pressed={rounds === n}
                  onClick={() => onSetRounds && onSetRounds(n)}
                  disabled={rolling}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="20"
              value={rounds}
              aria-label="Custom number of rounds"
              onChange={(e) => onSetRounds && onSetRounds(e.target.value)}
              className="field !w-20 text-center"
            />
            <button className="btn-ghost" onClick={onResetGame} disabled={rolling}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  )
}
