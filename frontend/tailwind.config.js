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
        gym: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          50: '#f8fafc',
          primary: '#10b981', // Emerald gym green
          dark: '#0f172a',
          surface: '#1e293b',
          card: '#1e293b',
          accent: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
