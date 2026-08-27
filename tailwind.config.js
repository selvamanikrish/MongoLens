/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d14',
        card: '#0f172a',
        'card-hover': '#141e33',
        surface: '#1e293b',
        'surface-hover': '#24334a',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-light': 'rgba(255, 255, 255, 0.14)',
        'border-focus': 'rgba(0, 237, 100, 0.4)',
        brand: {
          50: '#e6fcf0',
          100: '#c2f8dc',
          200: '#8cf3be',
          300: '#4eed9b',
          400: '#1ee37f',
          500: '#00ed64', // MongoDB bright green
          600: '#00c753',
          700: '#009b40',
          800: '#00684a', // MongoDB forest green
          900: '#023430',
          950: '#011c1a',
        },
        severity: {
          error: '#ef4444',
          warning: '#f59e0b',
          slow: '#f97316',
          info: '#38bdf8',
          success: '#10b981',
          aggregate: '#a855f7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 24px -4px rgba(0, 237, 100, 0.25)',
        'glow-error': '0 0 24px -4px rgba(239, 68, 68, 0.25)',
        'glow-slow': '0 0 24px -4px rgba(249, 115, 22, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}
