/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Cormorant Garamond", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#4A5D4E",
        accent: "#D4A373",
        paper: "#FDFBF7",
        ink: "#3E4A3D",
        "border-beige": "#E8E4D9",
        "sale-bg": "#E9EED9",
      },
    },
  },
  plugins: [],
};
