/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./main.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{css}"
  ],
  theme: {
    extend: {
      colors: {
        'casino-green': 'var(--casino-green)',
        'casino-gold': 'var(--casino-gold)',
        'casino-red': 'var(--casino-red)',
        'casino-felt': 'var(--casino-felt)',
      }
    },
  },
  plugins: [],
};
