/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        amboss: {
          bg: "#1B262C",
          section: "#0F4C75",
          accent: "#3282B8",
          light: "#BBE1FA",
        }
      }
    }
  },
  plugins: [],
};
