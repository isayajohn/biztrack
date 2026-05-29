/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        leaf: "#0f766e",
        mint: "#ecfdf5",
        sun: "#f59e0b",
        clay: "#b45309",
        cloud: "#f8fafc",
        slateMuted: "#64748b",
      },
      fontFamily: {
        sans: ['"Open Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        card: "0 10px 28px rgba(15, 23, 42, 0.07)",
      },
    },
  },
  plugins: [],
};
