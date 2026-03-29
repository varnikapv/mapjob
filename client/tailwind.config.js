/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f0e0c',
        paper: '#f5f0e8',
        cream: '#ede8dc',
        accent: '#c8441a',
        accent2: '#2a5f4f',
        gold: '#d4a843',
        muted: '#7a7268',
        card: '#faf7f2',
        border: '#d4cfc4',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
