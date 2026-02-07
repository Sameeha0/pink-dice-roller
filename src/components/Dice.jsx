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
    <div className={`dice ${animate ? 'animate-roll' : ''}`}>
      <div className="grid grid-cols-3 grid-rows-3 gap-2">
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

  return (
    <div className="barbie-card p-4">
      <h2 className="text-lg font-semibold mb-3">Dice</h2>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm">
          {currentPlayer ? (
            <span>Turn: <span className="font-semibold text-hotPink dark:text-neonPink">{currentPlayer.name}</span></span>
          ) : (
            <span className="opacity-80">Add players to start</span>
          )}
        </div>
        <div className="text-sm">
          <span>Round {currentRound}/{rounds} · Player {Math.min(index + 1, totalPlayers)}/{totalPlayers}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <label className="opacity-80">Rounds</label>
        <div className="flex flex-wrap items-center gap-2">
          {[1,3,5,7].map((n) => (
            <button
              key={n}
              className={`tab-button ${rounds === n ? 'ring-2 ring-hotPink' : ''}`}
              onClick={() => onSetRounds && onSetRounds(n)}
              disabled={rolling}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min="1"
            max="20"
            value={rounds}
            onChange={(e) => onSetRounds && onSetRounds(e.target.value)}
            className="w-24 sm:w-20 shrink-0 rounded-xl px-3 py-2 bg-babyPink/60 dark:bg-barbieBlack/40 focus:outline-none"
          />
          <button className="tab-button" onClick={onResetGame} disabled={rolling}>Reset</button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <label className="opacity-80">Dice count</label>
        <div className="flex gap-2">
          {[1,2,3].map((n) => (
            <button
              key={n}
              className={`tab-button ${count === n ? 'ring-2 ring-hotPink' : ''}`}
              onClick={() => setCount(n)}
              disabled={rollDisabled}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 mb-4">
        {Array.from({ length: count }).map((_, i) => (
          <DiceFace key={i} value={values[i] || 1} animate={rolling} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-80">
          {values.length ? `Values: ${values.join(', ')}` : 'Roll to see values'}
        </div>
        <div className="text-lg font-semibold">
          Total: <span className="text-hotPink dark:text-neonPink">{total}</span>
        </div>
      </div>
      <div className="mt-4">
        {winnerId ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 z-50">
            <div className="rounded-2xl p-6 text-center bg-barbieWhite dark:bg-barbieBlack shadow-barbie animate-pop">
              <div className="text-2xl md:text-3xl font-extrabold text-hotPink dark:text-neonPink mb-2">
                👑 Winner: {winnerName || '—'}
              </div>
              <p className="text-sm opacity-80 mb-4">Congratulations!!!</p>
              <div className="flex gap-2">
                <button className="barbie-button flex-1" onClick={onResetGame}>Play Again</button>
              </div>
            </div>
          </div>
        ) : (
          <>
          {!authorized && currentPlayer ? (
            <div className="text-center text-sm opacity-80 mb-2">Only this device’s registered player can roll</div>
          ) : null}
          <button className="barbie-button w-full" onClick={roll} disabled={rollDisabled}>
            {rolling ? 'Rolling…' : 'Roll Dice'}
          </button>
          </>
        )}
      </div>
    </div>
  )
}
