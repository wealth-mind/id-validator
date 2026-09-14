/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        sidebar: '#0f0e1a',
      },
      keyframes: {
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateX(120%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-down': 'slideDown 0.2s ease both',
        'fade-in':    'fadeIn 0.2s ease both',
        'toast-in':   'toastIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'spin-slow':  'spin 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};
