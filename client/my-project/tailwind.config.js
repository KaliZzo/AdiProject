/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-blue': '#0066CC',
        'apple-gray': '#86868b',
        'apple-light': '#f5f5f7',
        'apple-dark': '#1d1d1f'
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
      }
    },
  },
  plugins: [],
}