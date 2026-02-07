# Pink Dice Roller — React + Vite + Tailwind + Firebase

Production-quality, mobile-responsive, pink-themed dice roller using React + Vite, Tailwind, and optional Firebase Firestore.

## Features
- **Serverless Online Play**: Uses Peer-to-Peer (WebRTC) technology. No servers, no API keys, no login. Just share the code!
- Turn-based rounds with auto-advance and winner popup
- Glossy dice with rolling animation, sound, confetti
- Light/Dark themes with deep pink styling
- Players with emoji, unlimited per device
- Party code to create/join shared games (scopes players and history)
- Per-device roll authorization (only your device’s players can roll)
- History tab with:
  - Clear History (full wipe + game reset)
  - Clear My Rolls (by your name + optional emoji, this device only)
  - Clear Device Rolls (all players registered on this device)
- Responsive UI for small screens
- Data persists in localStorage + Syncs via P2P

## Scripts
- `npm run dev` — start local dev server
- `npm run build` — build production assets
- `npm run preview` — preview production build

## Quick Start
- Open Players, press Generate to create a party code (share it)
- Add your name and emoji; your device owns that player
- Switch to Dice, roll — only owned players can roll from this device
- Use History to clear by your name/emoji or device if needed

## About and Branding
- Header shows the active party code badge for quick sharing
- Footer: “made by Sameeha 🎀”
- About modal lists features and usage in bullets

## GitHub Pages
Build and publish `dist/`. If your repo name is `pink-dice-roller`, set:
```
VITE_BASE=/pink-dice-roller/
```
in your environment for correct asset paths.
