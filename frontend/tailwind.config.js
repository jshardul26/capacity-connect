/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        imd: {
          blue: '#003366',
          darkblue: '#002244',
          lightblue: '#0066cc',
          teal: '#008080',
          accent: '#ff9933',
        },
      },
    },
  },
  plugins: [],
}
