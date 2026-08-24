import type { Config } from "tailwindcss";

// Palette: a cool sage-white background (not the cream-and-terracotta combo every
// AI-generated page reaches for) with three functional accents — tomato for
// "selected/active", mustard for substitution chips, sage for confirm/lock-in actions.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "kitchen-bg": "#F2F5EF",
        "kitchen-ink": "#233229",
        "kitchen-tomato": "#D1462F",
        "kitchen-mustard": "#E0A526",
        "kitchen-sage": "#5C7A5C",
      },
      fontFamily: {
        display: ["var(--font-baloo)", "sans-serif"],
        body: ["var(--font-worksans)", "sans-serif"],
      },
      borderRadius: {
        card: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
