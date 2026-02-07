import React, { useState } from 'react'

export default function AboutModal({ onClose }) {
  const [page, setPage] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
      <div className="rounded-2xl p-6 w-full max-w-xl bg-barbieWhite dark:bg-barbieBlack shadow-barbie relative flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-2xl font-extrabold text-hotPink dark:text-neonPink">
            {page === 0 ? 'How to Play 🎀' : 'About ✨'}
          </h2>
          <button className="tab-button" onClick={onClose}>Close</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {page === 0 ? (
            <div className="space-y-4 text-sm sm:text-base">
              <p className="font-semibold text-lg text-hotPink dark:text-neonPink">Welcome! Follow these steps:</p>
              
              <div className="bg-babyPink/30 dark:bg-barbieBlack/40 p-3 rounded-xl">
                <h3 className="font-bold mb-1">1. Players Tab 👥</h3>
                <p>Start here! Enter your name and an emoji.</p>
                <ul className="list-disc ml-5 mt-1 opacity-80 text-xs sm:text-sm">
                  <li><strong>Online:</strong> Click <span className="font-mono bg-white/50 px-1 rounded">Generate</span> to get a code. Share it with friends!</li>
                  <li><strong>Join:</strong> Friends click <span className="font-mono bg-white/50 px-1 rounded">Join</span> and enter your code.</li>
                  <li><strong>Local:</strong> Just add players to play on one device.</li>
                </ul>
              </div>

              <div className="bg-babyPink/30 dark:bg-barbieBlack/40 p-3 rounded-xl">
                <h3 className="font-bold mb-1">2. Dice Tab 🎲</h3>
                <p>The main game zone. Wait for your turn (highlighted).</p>
                <ul className="list-disc ml-5 mt-1 opacity-80 text-xs sm:text-sm">
                  <li><strong>Roll:</strong> Click the button when it's your turn.</li>
                  <li><strong>Sync:</strong> Scores & turns update automatically for everyone.</li>
                </ul>
              </div>

              <div className="bg-babyPink/30 dark:bg-barbieBlack/40 p-3 rounded-xl">
                <h3 className="font-bold mb-1">3. History Tab 📜</h3>
                <p>Check past rolls or fix mistakes.</p>
                <ul className="list-disc ml-5 mt-1 opacity-80 text-xs sm:text-sm">
                  <li><strong>Clear:</strong> You can remove just your own rolls if needed.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-semibold">Features & Credits</p>
              <ul className="list-disc ml-5 space-y-2 text-sm sm:text-base opacity-90">
                <li>Turn-based rounds with auto-advance and winner popup</li>
                <li>Glossy dice with animation, sound, confetti</li>
                <li>Light/Dark themes with deep pink styling</li>
                <li>Players with emoji, unlimited per device</li>
                <li>Party code: Generate → CODE → Join → Enter code</li>
                <li>Per-device roll authorization (your device’s players can roll)</li>
                <li>History: Clear All, Clear My Rolls (name+emoji), Clear Device Rolls</li>
                <li>Active party code badge in header</li>
                <li>Responsive UI for small screens</li>
                <li>Serverless P2P sync (WebRTC via Trystero)</li>
              </ul>
              <div className="pt-4 text-center font-bold text-hotPink dark:text-neonPink">
                Made by Sameeha 🎀
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-babyPink/50 dark:border-hotPink/30 shrink-0">
          <div className="flex gap-2">
            <span className={`h-2 w-2 rounded-full ${page === 0 ? 'bg-hotPink' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span className={`h-2 w-2 rounded-full ${page === 1 ? 'bg-hotPink' : 'bg-gray-300 dark:bg-gray-600'}`} />
          </div>
          
          {page === 0 ? (
            <button 
              className="barbie-button flex items-center gap-2 px-6"
              onClick={() => setPage(1)}
            >
              Next <span className="text-xl">➜</span>
            </button>
          ) : (
            <button 
              className="tab-button flex items-center gap-2 px-6"
              onClick={() => setPage(0)}
            >
              <span className="text-xl">⬅</span> Back
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
