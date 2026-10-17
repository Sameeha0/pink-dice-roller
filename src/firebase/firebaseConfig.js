import { joinRoom } from 'trystero/torrent'

// --- LocalStorage Keys ---
const LS_PLAYERS = 'bd_players'
const LS_ROLLS = 'bd_rolls'
const LS_PARTY = 'bd_party_code'
const LS_DEVICE = 'bd_device_id'
// Deletions are remembered ("tombstones") so a peer that still has the old data
// cannot bring it back when devices sync
const LS_CLEARED = 'bd_cleared_at'      // time the roll history was last cleared
const LS_REMOVED_PLAYERS = 'bd_removed_players'
const LS_REMOVED_ROLLS = 'bd_removed_rolls'
const EVENT_STORAGE_UPDATE = 'bd-storage-update'

// --- P2P Configuration ---
const APP_ID = 'barbie-dice-roller-v1'
let currentRoom = null
let sendAction = null
let currentPartyCode = null

// --- State Management (In-Memory Cache) ---
// We keep a set of listeners to notify when data changes (either from P2P or LocalStorage)
const playerListeners = new Set()
const rollListeners = new Set()

// --- Helpers ---

export function getDeviceId() {
  try {
    let id = localStorage.getItem(LS_DEVICE)
    if (!id) {
      id = safeUUID()
      localStorage.setItem(LS_DEVICE, id)
    }
    return id
  } catch {
    return 'unknown-device'
  }
}

export function safeUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getPartyCode() {
  try {
    return localStorage.getItem(LS_PARTY) || ''
  } catch {
    return ''
  }
}

export function setPartyCode(code) {
  try {
    const newCode = code || ''
    const oldCode = getPartyCode()
    if (newCode !== oldCode) {
      localStorage.setItem(LS_PARTY, newCode)
      // Re-initialize P2P room when party code changes
      initP2P(newCode)
    }
  } catch {}
}

function nsPlayersKey(code) {
  const c = code !== undefined ? code : (getPartyCode() || 'local')
  return `${LS_PLAYERS}:${c}`
}

function nsRollsKey(code) {
  const c = code !== undefined ? code : (getPartyCode() || 'local')
  return `${LS_ROLLS}:${c}`
}

function nsKey(base, code) {
  return `${base}:${code}`
}

function getClearedAt(code) {
  return readLS(nsKey(LS_CLEARED, code), 0)
}

function getRemoved(base, code) {
  return new Set(readLS(nsKey(base, code), []))
}

function addRemoved(base, code, ids) {
  const set = getRemoved(base, code)
  ids.forEach(id => set.add(id))
  writeLS(nsKey(base, code), [...set])
}

function broadcast(code, message) {
  if (sendAction && code !== 'local') sendAction.update(message)
}

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    // Notify local tabs
    window.dispatchEvent(new CustomEvent(EVENT_STORAGE_UPDATE, { detail: { key, value } }))
  } catch {}
}

// --- P2P Logic ---

function initP2P(code) {
  if (currentPartyCode === code && currentRoom) return // Already joined

  // Leave previous room if exists
  if (currentRoom) {
    try {
      currentRoom.leave()
    } catch (e) { console.warn(e) }
  }

  currentPartyCode = code
  if (!code || code === 'local') {
    currentRoom = null
    return
  }

  try {
    // Join P2P Room
    currentRoom = joinRoom({ appId: APP_ID }, code)

    // Create Actions
    // Action format: [send, get]
    const [sendSync, getSync] = currentRoom.makeAction('sync')
    const [sendUpdate, getUpdate] = currentRoom.makeAction('update')

    sendAction = { sync: sendSync, update: sendUpdate }

    // Handlers
    getSync((data, peerId) => {
      // Received a sync request or response
      if (data.type === 'REQUEST') {
        // Send back my full state, including what has been deleted
        sendSync({
          type: 'RESPONSE',
          players: readLS(nsPlayersKey(code), []),
          rolls: readLS(nsRollsKey(code), []),
          clearedAt: getClearedAt(code),
          removedPlayers: [...getRemoved(LS_REMOVED_PLAYERS, code)],
          removedRolls: [...getRemoved(LS_REMOVED_ROLLS, code)]
        }, peerId)
      } else if (data.type === 'RESPONSE') {
        // Apply the peer's deletions first, then merge their data
        applyDeletions(code, data)
        mergeData(code, data.players, data.rolls)
      }
    })

    getUpdate((data) => {
      // Received a delta update
      if (data.type === 'PLAYERS') {
        mergePlayers(code, data.payload)
      } else if (data.type === 'ROLLS') {
        mergeRolls(code, data.payload)
      } else if (data.type === 'DELETE') {
        applyDeletions(code, data)
      }
    })

    // On Join: Broadcast Request for Sync
    currentRoom.onPeerJoin((peerId) => {
      console.log('Peer joined:', peerId)
      sendSync({ type: 'REQUEST' }, peerId)
    })

    // Also broadcast request to anyone already there
    setTimeout(() => {
        if(sendAction) sendAction.sync({ type: 'REQUEST' })
    }, 1000)

  } catch (err) {
    console.error('P2P Init Error:', err)
  }
}

// Merge Helpers
function mergeData(code, remotePlayers, remoteRolls) {
  if (remotePlayers) mergePlayers(code, remotePlayers)
  if (remoteRolls) mergeRolls(code, remoteRolls)
}

/**
 * Apply deletions received from a peer: a cleared history, removed players, removed rolls
 */
function applyDeletions(code, data) {
  const clearedAt = data.clearedAt || 0
  if (clearedAt > getClearedAt(code)) {
    writeLS(nsKey(LS_CLEARED, code), clearedAt)
  }
  if (data.removedPlayers && data.removedPlayers.length) addRemoved(LS_REMOVED_PLAYERS, code, data.removedPlayers)
  if (data.removedRolls && data.removedRolls.length) addRemoved(LS_REMOVED_ROLLS, code, data.removedRolls)

  // Drop anything that is now deleted from local storage
  const removedPlayers = getRemoved(LS_REMOVED_PLAYERS, code)
  const players = readLS(nsPlayersKey(code), [])
  const keptPlayers = players.filter(p => !removedPlayers.has(p.id))
  if (keptPlayers.length !== players.length) {
    writeLS(nsPlayersKey(code), keptPlayers)
    notifyPlayers(keptPlayers)
  }

  const removedRolls = getRemoved(LS_REMOVED_ROLLS, code)
  const cutoff = getClearedAt(code)
  const rolls = readLS(nsRollsKey(code), [])
  const keptRolls = rolls.filter(r => !removedRolls.has(r.id) && r.createdAt > cutoff)
  if (keptRolls.length !== rolls.length) {
    writeLS(nsRollsKey(code), keptRolls)
    notifyRolls(keptRolls)
  }
}

function mergePlayers(code, remoteList) {
  const key = nsPlayersKey(code)
  const local = readLS(key, [])
  const localMap = new Map(local.map(p => [p.id, p]))
  const removed = getRemoved(LS_REMOVED_PLAYERS, code)

  let changed = false
  remoteList.forEach(p => {
    if (removed.has(p.id)) return // deleted on some device
    const existing = localMap.get(p.id)
    if (!existing || JSON.stringify(existing) !== JSON.stringify(p)) {
      // Simple strategy: Last Write Wins based on content?
      // Actually, since we don't have timestamps on everything, just overwrite/add
      localMap.set(p.id, p)
      changed = true
    }
  })

  if (changed) {
    const merged = Array.from(localMap.values())
    writeLS(key, merged)
    notifyPlayers(merged)
  }
}

function mergeRolls(code, remoteList) {
  const key = nsRollsKey(code)
  const local = readLS(key, [])
  const localIds = new Set(local.map(r => r.id))
  const removed = getRemoved(LS_REMOVED_ROLLS, code)
  const clearedAt = getClearedAt(code)

  let changed = false
  const newRolls = [...local]

  remoteList.forEach(r => {
    // skip rolls that were made before the last "clear history" or deleted later
    if (removed.has(r.id) || r.createdAt <= clearedAt) return
    if (!localIds.has(r.id)) {
      newRolls.push(r)
      localIds.add(r.id)
      changed = true
    }
  })

  if (changed) {
    // Sort by created
    newRolls.sort((a, b) => b.createdAt - a.createdAt)
    writeLS(key, newRolls)
    notifyRolls(newRolls)
  }
}

// --- Public API (Firebase Compatible) ---

// (no explicit online flag; P2P initializes when a party code is set)

// Initialize P2P immediately if code exists
const initialCode = getPartyCode()
if (initialCode && initialCode !== 'local') {
  initP2P(initialCode)
}

function notifyPlayers(list) {
  playerListeners.forEach(cb => cb(list))
}
function notifyRolls(list) {
  rollListeners.forEach(cb => cb(list))
}

export function subscribePlayers(cb, codeOverride) {
  const code = codeOverride !== undefined ? codeOverride : (getPartyCode() || 'local')

  // Update P2P room if needed (only if no override or override matches current)
  if (code === getPartyCode()) {
    initP2P(code)
  }

  // Initial callback
  const list = readLS(nsPlayersKey(code), [])
  cb(list)

  // Wrapper to filter by code
  const handler = (newList) => {
    // This listener is global, so we rely on the fact that we only update the CURRENT code's LS
    // But if we switch codes, we read from new key.
    // Ideally we re-read LS to be safe
    const current = readLS(nsPlayersKey(code), [])
    cb(current)
  }

  playerListeners.add(handler)

  // Listen for local storage events (same-tab or cross-tab local)
  const storageHandler = (e) => {
    const key = nsPlayersKey(code)
    if ((e.type === 'storage' || e.type === EVENT_STORAGE_UPDATE) && (e.key === key || e.detail?.key === key)) {
      const list = readLS(key, [])
      cb(list)
    }
  }
  window.addEventListener('storage', storageHandler)
  window.addEventListener(EVENT_STORAGE_UPDATE, storageHandler)

  return () => {
    playerListeners.delete(handler)
    window.removeEventListener('storage', storageHandler)
    window.removeEventListener(EVENT_STORAGE_UPDATE, storageHandler)
  }
}

export function subscribeRolls(cb, codeOverride) {
  const code = codeOverride !== undefined ? codeOverride : (getPartyCode() || 'local')

  if (code === getPartyCode()) {
    initP2P(code)
  }

  const list = readLS(nsRollsKey(code), [])
  cb(list)

  const handler = () => {
    const current = readLS(nsRollsKey(code), [])
    cb(current)
  }
  rollListeners.add(handler)

  const storageHandler = (e) => {
    const key = nsRollsKey(code)
    if ((e.type === 'storage' || e.type === EVENT_STORAGE_UPDATE) && (e.key === key || e.detail?.key === key)) {
      const list = readLS(key, [])
      cb(list)
    }
  }
  window.addEventListener('storage', storageHandler)
  window.addEventListener(EVENT_STORAGE_UPDATE, storageHandler)

  return () => {
    rollListeners.delete(handler)
    window.removeEventListener('storage', storageHandler)
    window.removeEventListener(EVENT_STORAGE_UPDATE, storageHandler)
  }
}

export async function addPlayer(name, emoji) {
  const code = getPartyCode() || 'local'
  const key = nsPlayersKey(code)
  const players = readLS(key, [])

  const player = {
    id: safeUUID(),
    name,
    emoji: emoji || '',
    highestTotal: 0,
    highestDiceValues: [],
    createdAt: Date.now(),
    ownerDeviceId: getDeviceId(),
    partyCode: code
  }

  const next = [...players, player]
  writeLS(key, next)

  // P2P Broadcast
  if (sendAction && code !== 'local') {
    sendAction.update({ type: 'PLAYERS', payload: [player] })
  }

  return player
}

export async function saveRoll(entry) {
  const code = getPartyCode() || 'local'
  const key = nsRollsKey(code)
  const rolls = readLS(key, [])

  const roll = {
    id: safeUUID(),
    ...entry,
    createdAt: Date.now(),
    partyCode: code
  }

  const next = [roll, ...rolls] // Newest first
  writeLS(key, next)

  // P2P Broadcast
  if (sendAction && code !== 'local') {
    sendAction.update({ type: 'ROLLS', payload: [roll] })
  }
}

export async function updatePlayerHighest(id, total, diceValues) {
  const code = getPartyCode() || 'local'
  const key = nsPlayersKey(code)
  const players = readLS(key, [])

  let updatedPlayer = null
  const next = players.map((p) => {
    if (p.id === id) {
      updatedPlayer = { ...p, highestTotal: total, highestDiceValues: diceValues }
      return updatedPlayer
    }
    return p
  })

  writeLS(key, next)

  if (sendAction && code !== 'local' && updatedPlayer) {
    sendAction.update({ type: 'PLAYERS', payload: [updatedPlayer] })
  }
}

export async function getPlayersOnce(codeOverride) {
  const code = codeOverride !== undefined ? codeOverride : (getPartyCode() || 'local')
  return readLS(nsPlayersKey(code), [])
}

 export async function getRollsOnce(codeOverride) {
   const code = codeOverride !== undefined ? codeOverride : (getPartyCode() || 'local')
   return readLS(nsRollsKey(code), [])
 }

export async function clearRolls() {
  const code = getPartyCode() || 'local'
  const clearedAt = Date.now()
  writeLS(nsRollsKey(code), [])
  writeLS(nsKey(LS_CLEARED, code), clearedAt)
  // Tell the other devices, so the old rolls are cleared everywhere and cannot sync back
  broadcast(code, { type: 'DELETE', clearedAt })
}

/**
 * Remove players by id on this device and on every peer
 */
function removePlayers(code, ids) {
  if (!ids.length) return
  addRemoved(LS_REMOVED_PLAYERS, code, ids)
  const key = nsPlayersKey(code)
  writeLS(key, readLS(key, []).filter(p => !ids.includes(p.id)))
  broadcast(code, { type: 'DELETE', removedPlayers: ids })
}

/**
 * Remove rolls by id on this device and on every peer
 */
function removeRolls(code, ids) {
  if (!ids.length) return
  addRemoved(LS_REMOVED_ROLLS, code, ids)
  const key = nsRollsKey(code)
  writeLS(key, readLS(key, []).filter(r => !ids.includes(r.id)))
  broadcast(code, { type: 'DELETE', removedRolls: ids })
}

export async function removePlayer(id) {
  removePlayers(getPartyCode() || 'local', [id])
}

export async function clearPlayers() {
  const code = getPartyCode() || 'local'
  removePlayers(code, readLS(nsPlayersKey(code), []).map(p => p.id))
}

export async function removePlayerByName(name) {
  const code = getPartyCode() || 'local'
  const target = (name || '').trim().toLowerCase()
  const ids = readLS(nsPlayersKey(code), [])
    .filter(p => (p.name || '').trim().toLowerCase() === target)
    .map(p => p.id)
  removePlayers(code, ids)
}

export async function removePlayerByNameEmoji(name, emoji) {
  const code = getPartyCode() || 'local'
  const players = readLS(nsPlayersKey(code), [])
  const n = (name || '').trim().toLowerCase()
  const e = (emoji || '').trim()

  const ids = players.filter((p) => {
    const pn = (p.name || '').trim().toLowerCase()
    const pe = (p.emoji || '').trim()
    const ownerOk = (p.ownerDeviceId || '') === getDeviceId()
    return pn === n && ownerOk && (!e || pe === e)
  }).map(p => p.id)

  removePlayers(code, ids)
  return ids.length
}

export async function clearMyRollsByNameEmoji(name, emoji) {
  // Local only for safety
  const code = getPartyCode() || 'local'
  const players = await getPlayersOnce(code)
  const did = getDeviceId()
  const n = (name || '').trim().toLowerCase()
  const e = (emoji || '').trim()

  const myPlayerIds = players.filter(p => {
    const pn = (p.name || '').trim().toLowerCase()
    const pe = (p.emoji || '').trim()
    const ownerOk = (p.ownerDeviceId || '') === did
    if (e) return pn === n && pe === e && ownerOk
    return pn === n && ownerOk
  }).map(p => p.id)

  if (!myPlayerIds.length) return 0

  const ids = readLS(nsRollsKey(code), []).filter(r => myPlayerIds.includes(r.playerId)).map(r => r.id)
  removeRolls(code, ids)
  return ids.length
}

export async function clearDeviceRolls() {
  const code = getPartyCode() || 'local'
  const players = await getPlayersOnce(code)
  const did = getDeviceId()
  const myPlayerIds = players.filter(p => (p.ownerDeviceId || '') === did).map(p => p.id)

  if (!myPlayerIds.length) return 0

  const ids = readLS(nsRollsKey(code), []).filter(r => myPlayerIds.includes(r.playerId)).map(r => r.id)
  removeRolls(code, ids)
  return ids.length
}
