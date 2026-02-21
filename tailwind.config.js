/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Markenfarben (CSS-Variablen: --red, --red-dark in index.css) */
        brand: {
          DEFAULT: '#C8102E',
          dark: '#9B0022',
        },
        cream: '#FAF7F2',
        dark: '#1A0A0E',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        btn: '8px',
      },
    },
  },
  plugins: [],
};
