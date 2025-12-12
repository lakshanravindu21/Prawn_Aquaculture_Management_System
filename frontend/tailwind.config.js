/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',   // Ocean Blue
        secondary: '#10b981', // Algae Green
        dark: '#0f172a',      // Deep Sea
        card: '#1e293b'       // Card Background
      }
    },
  },
  plugins: [],
}