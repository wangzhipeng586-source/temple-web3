import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f3efe4",
        ink: "#1c1915",
        cinnabar: "#8f3d36",
        gold: "#8d6b3a",
        pine: "#1f3330",
        card: "#fffdf8",
        line: "#e4d9c6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Source Han Sans SC", "Noto Sans SC", "sans-serif"],
        serif: ["var(--font-serif)", "Source Han Serif SC", "Noto Serif SC", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
