/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: "#9CB0A3",
          50: "#F4F8F5",
          100: "#E6EEE8",
          300: "#B3C7BA",
          400: "#9CB0A3",
          500: "#859A8D",
          600: "#6F8579",
          700: "#5A6E63",
        },
        cream: "#F5F5DC",
        coral: "#E6AAC4",
        mist: "#F8F4EA",
        clay: "#4F6158",
      },
      fontFamily: {
        body: ["Nunito", "sans-serif"],
        heading: ["Quicksand", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 40px -24px rgba(96, 113, 104, 0.45)",
      },
      borderRadius: {
        mega: "2.25rem",
      },
    },
  },
  plugins: [],
};
