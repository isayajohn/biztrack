/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10231e",
        leaf: "#18bd97",
        mint: "#e7faf5",
        sun: "#f59e0b",
        clay: "#b45309",
        cloud: "#f7faf9",
        slateMuted: "#60756e",
      },
      fontFamily: {
        sans: ['"Open Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(11, 146, 121, 0.11)",
        card: "0 10px 28px rgba(11, 146, 121, 0.09)",
      },
    },
  },
  plugins: [],
};
