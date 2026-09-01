/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        driver: {
          bg: '#0F172A',
          card: '#1E293B',
          accent: '#22C55E',
          danger: '#EF4444',
        },
        parent: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          accent: '#3B82F6',
        },
      },
    },
  },
  plugins: [],
};
