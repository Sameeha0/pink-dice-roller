import React, { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Players from './components/Players.jsx'
import Dice from './components/Dice.jsx'
import History from './components/History.jsx'
import AboutModal from './components/AboutModal.jsx'
import { subscribePlayers, subscribeRolls, clearRolls, getPartyCode, setPartyCode, getPlayersOnce, safeUUID } from './firebase/firebaseConfig.js'

export default function App() {
  const [tab, setTab] = useState('players')
  const [players, setPlayers] = useState([])
  const [rolls, setRolls] = useState([])
  const [rounds, setRounds] = useState(3)
  const [currentRound, setCurrentRound] = useState(1)
  const [index, setIndex] = useState(0)
  const [totals, setTotals] = useState({})
  // Everyone with the top total; more than one id means a tie
  const [winnerIds, setWinnerIds] = useState([])
  // safeUUID also works on plain-http addresses, where crypto.randomUUID is missing
  const [sessionId, setSessionId] = useState(() => safeUUID())
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
      setWinnerIds([])
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
      setWinnerIds([])
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
        // Game Over - everyone who shares the highest total wins (a tie is possible)
        const entries = Object.entries(newTotals)
        const best = Math.max(...entries.map(([, sum]) => sum))
        setWinnerIds(entries.filter(([, sum]) => sum === best).map(([pid]) => pid))
        setCurrentRound(rounds) // Cap at max
      } else {
        setCurrentRound(nextRound)
        setWinnerIds([])
      }
    }
  }, [players, rolls, rounds])

  const currentPlayer = useMemo(() => players[index] || null, [players, index])
  const totalPlayers = players.length
  const winnerId = winnerIds[0] || null
  const isTie = winnerIds.length > 1
  const winnerName = useMemo(() => {
    const names = winnerIds.map((id) => players.find((p) => p.id === id)?.name).filter(Boolean)
    return names.length ? names.join(' & ') : null
  }, [players, winnerIds])

  function setRoundsClamped(n) {
    const v = Math.max(1, Math.min(20, Number(n) || 1))
    setRounds(v)
  }

  async function resetGame() {
    await clearRolls()
    setIndex(0)
    setCurrentRound(1)
    setTotals({})
    setWinnerIds([])
    setSessionId(safeUUID())
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
    <div className="min-h-full bg-[radial-gradient(900px_420px_at_50%_-120px,rgba(255,20,147,0.16),transparent_70%)] dark:bg-[radial-gradient(900px_420px_at_50%_-120px,rgba(255,46,151,0.18),transparent_70%)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <Navbar
          tab={tab}
          setTab={setTab}
          onOpenAbout={() => setAboutOpen(true)}
          partyCode={partyCode}
        />
        <main className="mt-6 sm:mt-8">
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
              isTie={isTie}
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
