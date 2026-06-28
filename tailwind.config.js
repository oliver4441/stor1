/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a5632',
          hover: '#14472a',
          50: '#f0faf4',
          100: '#dbf5e5',
          200: '#b9eacb',
          500: '#1a5632',
          600: '#14472a',
          700: '#103820',
          900: '#0a2415',
        },
        accent: {
          DEFAULT: '#d4a017',
          hover: '#b8890f',
          50: '#fef9ed',
          100: '#fcf0c8',
          500: '#d4a017',
          600: '#b8890f',
        },
        danger: '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
