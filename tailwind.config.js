/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#d95a2b', /* exact orange from design */
          dark: '#3e4a28',   /* exact dark green from design */
          bg: '#f3eedf',     /* exact beige background from design */
          footer: '#242021'
        }
      },
      fontFamily: {
        script: ['"Dancing Script"', 'cursive'],
        heading: ['Oswald', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
