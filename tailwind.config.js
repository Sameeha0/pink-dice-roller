/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        hotPink: '#ff1493',
        babyPink: '#ffc0cb',
        blush: '#ff8fa3',
        barbieWhite: '#ffffff',
        barbieBlack: '#0b0b0b',
        neonPink: '#ff2e97',
        deepPink: '#c2185b',
        // text and surface tones used by the redesign
        ink: '#4a0d2e',
        inkSoft: '#8a4a6b',
        petal: '#fff5f8',
        rose: '#ffe4ec',
        night: '#140a12',
        nightCard: '#1f1019',
        nightLine: '#3a1c2e'
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        barbie: '0 10px 25px rgba(255, 20, 147, 0.25)',
        card: '0 1px 2px rgba(194, 24, 91, 0.06), 0 12px 32px -12px rgba(194, 24, 91, 0.25)',
        glow: '0 10px 30px -8px rgba(255, 20, 147, 0.55)'
      },
      borderRadius: {
        xl: '1rem'
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.23, 1, 0.32, 1)'
      },
      keyframes: {
        roll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.06)' },
          '100%': { transform: 'rotate(360deg) scale(1)' }
        },
        pop: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        roll: 'roll 520ms cubic-bezier(0.23, 1, 0.32, 1)',
        pop: 'pop 240ms cubic-bezier(0.23, 1, 0.32, 1)'
      }
    }
  },
  plugins: []
}
