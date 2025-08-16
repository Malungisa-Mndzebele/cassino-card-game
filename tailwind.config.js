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
        'casino-green-light': 'var(--casino-green-light)',
        'casino-green-dark': 'var(--casino-green-dark)',
        'casino-gold': 'var(--casino-gold)',
        'casino-gold-light': 'var(--casino-gold-light)',
        'casino-gold-dark': 'var(--casino-gold-dark)',
        'casino-red': 'var(--casino-red)',
        'casino-red-light': 'var(--casino-red-light)',
        'casino-red-dark': 'var(--casino-red-dark)',
        'casino-felt': 'var(--casino-felt)',
        'casino-felt-light': 'var(--casino-felt-light)',
        'casino-felt-dark': 'var(--casino-felt-dark)',
        'casino-purple': 'var(--casino-purple)',
        'casino-purple-light': 'var(--casino-purple-light)',
        'casino-purple-dark': 'var(--casino-purple-dark)',
        'casino-blue': 'var(--casino-blue)',
        'casino-blue-light': 'var(--casino-blue-light)',
        'casino-blue-dark': 'var(--casino-blue-dark)',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      animation: {
        'card-flip': 'flip 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        'card-shuffle': 'shuffle 0.8s ease-in-out',
        'card-deal': 'deal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'card-capture': 'capture 0.6s ease-out',
        'floating': 'floating 3s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'float-particles': 'float-particles 6s ease-in-out infinite',
      },
      boxShadow: {
        'casino': '0 20px 50px -12px rgba(26, 91, 74, 0.3), 0 32px 64px -12px rgba(26, 91, 74, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'casino-lg': '0 25px 60px -12px rgba(26, 91, 74, 0.4), 0 40px 80px -12px rgba(26, 91, 74, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'gold': '0 20px 50px -12px rgba(251, 191, 36, 0.3), 0 32px 64px -12px rgba(251, 191, 36, 0.15)',
        'glow-gold': '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3), 0 0 80px rgba(251, 191, 36, 0.1)',
        'glow-casino': '0 0 20px rgba(26, 91, 74, 0.5), 0 0 40px rgba(26, 91, 74, 0.3), 0 0 80px rgba(26, 91, 74, 0.1)',
      },
      backdropFilter: {
        'casino': 'blur(16px) saturate(150%)',
      },
    },
  },
  plugins: [],
};
