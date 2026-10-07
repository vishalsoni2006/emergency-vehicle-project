/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          darkest: '#05070f',
          bg: '#070a13',
          card: '#0c1322',
          surface: '#121b30',
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.14)',
        },
        signal: {
          red: '#ff1744',
          'red-glow': 'rgba(255, 23, 68, 0.5)',
          yellow: '#ffb300',
          'yellow-glow': 'rgba(255, 179, 0, 0.5)',
          green: '#00e676',
          'green-glow': 'rgba(0, 230, 118, 0.5)',
        },
        emergency: {
          DEFAULT: '#ff0055',
          glow: 'rgba(255, 0, 85, 0.6)',
          light: '#ff3377',
        },
        cyan: {
          neon: '#00e5ff',
          glow: 'rgba(0, 229, 255, 0.4)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'emergency-glow': 'emergencyGlow 1.2s ease-in-out infinite alternate',
        'signal-glow': 'signalGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        emergencyGlow: {
          '0%': { boxShadow: '0 0 10px rgba(255, 0, 85, 0.4), inset 0 0 10px rgba(255, 0, 85, 0.2)' },
          '100%': { boxShadow: '0 0 35px rgba(255, 0, 85, 0.9), inset 0 0 20px rgba(255, 0, 85, 0.5)' },
        },
        signalGlow: {
          '0%': { opacity: '0.85' },
          '100%': { opacity: '1', filter: 'brightness(1.2)' },
        }
      }
    },
  },
  plugins: [],
}
