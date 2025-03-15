/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0091ff",
        secondary: "#022c1a",
        light: {
          100: "#c6dbff",
          200: "#a8c6db",
          300: "#9ca4ab",
        },
        dark: {
          100: "#221f3d",
          200: "#0f0d23",
        },
        accent: "#ab8bff",
      }
    },
  },
  plugins: [],
}