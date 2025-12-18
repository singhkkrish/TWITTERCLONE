/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        twitter: '#1DA1F2',
        twitterDark: '#1A91DA',
        dark: '#15202B',
        darkHover: '#1C2938',
      }
    },
  },
  plugins: [],
}