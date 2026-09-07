/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cc: {
          navy: '#0a192f',
          darknavy: '#050c1a',
          blue: '#003366',
          ocean: '#0284c7',
          sky: '#38bdf8',
          teal: '#0d9488',
          darkteal: '#115e59',
          amber: '#f59e0b',
          warmorange: '#f97316',
          slate: '#0f172a',
          surface: '#f8fafc',
          border: '#e2e8f0',
        },
      },
      boxShadow: {
        'card-hover': '0 12px 28px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'hero-card': '0 20px 35px -10px rgba(10, 25, 47, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(10,25,47,0.94) 0%, rgba(13,148,136,0.85) 50%, rgba(2,132,199,0.92) 100%)',
        'stats-gradient': 'linear-gradient(90deg, #0a192f 0%, #115e59 50%, #003366 100%)',
      }
    },
  },
  plugins: [],
}
