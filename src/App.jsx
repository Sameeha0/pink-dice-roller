import React, { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Players from './components/Players.jsx'
import Dice from './components/Dice.jsx'
import History from './components/History.jsx'
import AboutModal from './components/AboutModal.jsx'
import { subscribePlayers, subscribeRolls, clearRolls, getPartyCode, setPartyCode, getPlayersOnce } from './firebase/firebaseConfig.js'

export default function App() {
  const [tab, setTab] = useState('players')
  const [players, setPlayers] = useState([])
  const [rolls, setRolls] = useState([])
  const [rounds, setRounds] = useState(3)
  const [currentRound, setCurrentRound] = useState(1)
  const [index, setIndex] = useState(0)
  const [totals, setTotals] = useState({})
  const [winnerId, setWinnerId] = useState(null)
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const [partyCode, setParty] = useState(getPartyCode() || 'local')
  const [aboutOpen, setAboutOpen] = useState(false)

  // Explicitly pass partyCode to subscriptions to ensure sync
  useEffect(() => {
    const unsub = subscribePlayers(setPlayers, partyCode)
    return () => unsub && unsub()
  }, [partyCode])

  useEffect(() => {
    const unsub = subscribeRolls(setRolls, partyCode)
    return () => unsub && unsub()
  }, [partyCode])

  useEffect(() => {
    if (!players.length) {
      setIndex(0)
      setCurrentRound(1)
      setTotals({})
      setWinnerId(null)
      return
    }

    // Derive game state from rolls (rolls are DESC, so reverse for replay)
    const sortedRolls = [...rolls].reverse()
    const newTotals = {}
    let lastPid = null

    sortedRolls.forEach((r) => {
      newTotals[r.playerId] = (newTotals[r.playerId] || 0) + r.total
      lastPid = r.playerId
    })
    setTotals(newTotals)

    // Determine turn and round
    if (!sortedRolls.length) {
      setIndex(0)
      setCurrentRound(1)
      setWinnerId(null)
    } else {
      const lastIdx = players.findIndex((p) => p.id === lastPid)
      if (lastIdx === -1) {
        setIndex(0) // Last roller gone, reset to start
      } else {
        const nextIdx = (lastIdx + 1) % players.length
        setIndex(nextIdx)
      }
      
      const finishedRounds = Math.floor(sortedRolls.length / players.length)
      const nextRound = finishedRounds + 1
      
      if (finishedRounds >= rounds) {
        // Game Over - Calculate Winner
        const entries = Object.entries(newTotals)
        const winner = entries.reduce((acc, [pid, sum]) => {
          if (!acc || sum > acc.sum) return { pid, sum }
          return acc
        }, null)
        setWinnerId(winner?.pid || null)
        setCurrentRound(rounds) // Cap at max
      } else {
        setCurrentRound(nextRound)
        setWinnerId(null)
      }
    }
  }, [players, rolls, rounds])

  const currentPlayer = useMemo(() => players[index] || null, [players, index])
  const totalPlayers = players.length
  const winnerName = useMemo(
    () => players.find((p) => p.id === winnerId)?.name || null,
    [players, winnerId]
  )

  function setRoundsClamped(n) {
    const v = Math.max(1, Math.min(20, Number(n) || 1))
    setRounds(v)
  }

  async function resetGame() {
    await clearRolls()
    setIndex(0)
    setCurrentRound(1)
    setTotals({})
    setWinnerId(null)
    setSessionId(crypto.randomUUID())
  }

  async function refreshPlayers() {
    // Pass current partyCode explicitly
    const list = await getPlayersOnce(partyCode)
    setPlayers(list)
  }
  function onRolled({ total }) {
    // State is now derived from rolls subscription, no local update needed
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-babyPink/40 to-blush/20 dark:from-barbieBlack dark:to-barbieBlack">
      <div className="max-w-3xl mx-auto p-4">
        <Navbar 
          tab={tab} 
          setTab={setTab} 
          onOpenAbout={() => setAboutOpen(true)} 
          partyCode={partyCode} 
        />
        <main className="mt-6">
          {tab === 'players' && (
            <Players
              externalPlayers={players}
              currentPlayerId={currentPlayer?.id || null}
              partyCode={partyCode}
              onSetParty={(code) => {
                setParty(code || 'local')
                setPartyCode(code || 'local')
              }}
              onResetGame={resetGame}
              onPlayersChanged={refreshPlayers}
            />
          )}
          {tab === 'dice' && (
            <Dice
              currentPlayer={currentPlayer}
              currentRound={currentRound}
              rounds={rounds}
              index={index}
              totalPlayers={totalPlayers}
              winnerId={winnerId}
              winnerName={winnerName}
              onSetRounds={setRoundsClamped}
              onResetGame={resetGame}
              onRolled={onRolled}
              sessionId={sessionId}
            />
          )}
          {tab === 'history' && <History onCleared={resetGame} />}
        </main>
        <Footer />
        {aboutOpen ? <AboutModal onClose={() => setAboutOpen(false)} /> : null}
      </div>
    </div>
  )
}
