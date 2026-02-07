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
        deepPink: '#c2185b'
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        barbie: '0 10px 25px rgba(255, 20, 147, 0.25)'
      },
      borderRadius: {
        xl: '1rem'
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      keyframes: {
        roll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' }
        },
        pop: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        roll: 'roll 600ms smooth',
        pop: 'pop 250ms ease-out'
      }
    }
  },
  plugins: []
}
