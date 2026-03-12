/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        navy: '#0F1C3F',
        royal: '#1A3A8F',
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        'blue-100': '0 4px 24px rgba(37, 99, 235, 0.1)',
      },
    },
  },
  plugins: [],
}
