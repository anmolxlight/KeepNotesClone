/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Google Keep color scheme
        keep: {
          bg: '#202124',
          surface: '#303134',
          card: '#202124',
          text: '#e8eaed',
          'text-secondary': '#9aa0a6',
          primary: '#8ab4f8',
          accent: '#fdd663',
          border: '#3c4043',
        },
        notes: {
          default: '#ffffff',
          red: '#f28b82',
          orange: '#fbbc04',
          yellow: '#fff475',
          green: '#ccff90',
          teal: '#a7ffeb',
          blue: '#cbf0f8',
          'dark-blue': '#aecbfa',
          purple: '#d7aefb',
          pink: '#fdcfe8',
          brown: '#e6c9a8',
          gray: '#e8eaed',
        }
      },
      fontFamily: {
        sans: ['Google Sans', 'Roboto', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}