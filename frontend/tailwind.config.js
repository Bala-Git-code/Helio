/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2fcf8',
          100: '#d8f7eb',
          500: '#14b88f',
          600: '#0f8f72',
          700: '#0d7458',
        },
        accent: {
          teal: '#0ea5a3',
          sky: '#0ea5e9',
          indigo: '#6366f1',
          rose: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 18px 40px -24px rgba(15, 118, 110, 0.28)',
        glow: '0 30px 80px -20px rgba(20, 184, 143, 0.35)',
      },
      animation: {
        'float-soft': 'floatSoft 6s ease-in-out infinite',
      },
      keyframes: {
        floatSoft: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

