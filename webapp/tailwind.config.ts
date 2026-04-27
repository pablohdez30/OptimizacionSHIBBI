import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080808",
        surface: {
          1: "#141414",
          2: "#1F1F1F",
        },
        border: "#3A3A3A",
        gold: {
          DEFAULT: "#FAC51C",
          light: "#FFE38A",
          dark: "#C18F00",
        },
        text: {
          DEFAULT: "#F5F5F5",
          muted: "#B5B5B5",
        },
        state: {
          success: "#2D6A4F",
          danger: "#E74C3C",
          info: "#3498DB",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;
