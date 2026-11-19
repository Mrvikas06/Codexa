import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          bg: "#0B0D10",
          sidebar: "#0E1014",
          surface: "#14171C",
          "surface-secondary": "#191D23",
          hover: "#1D2229",
          border: "#262B33",
          "border-strong": "#343B45",
          text: "#F1F3F5",
          "text-secondary": "#A0A7B2",
          "text-muted": "#69717D",
          accent: "#6C8CFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
