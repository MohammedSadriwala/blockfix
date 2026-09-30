/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F5F7',
        surface: '#FFFFFF',
        'surface-hover': '#F8F9FA',
        'surface-border': '#E5E7EB',
        primary: {
          DEFAULT: '#F84464', // BookMyShow Red
          hover: '#E03352',
          light: '#FF6B84',
          dark: '#C81E3D',
        },
        cinema: {
          dark: '#1F2533',
          heading: '#1A1D24',
          subtext: '#666666',
          border: '#E2E8F0',
          red: '#F84464',
          'red-hover': '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Roboto', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 4px 14px 0 rgba(248, 68, 100, 0.35)',
        'card': '0 2px 10px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'card-hover': '0 12px 28px -6px rgba(0, 0, 0, 0.12)',
        'nav': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

