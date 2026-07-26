/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0f6ff', 100: '#e0edff', 500: '#3b82f6', 600: '#2563eb', 900: '#1e3a8a' },
      }
    },
  },
  plugins: [],
}