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
          elevated: "#222730",
          border: "#262B33",
          "border-strong": "#343B45",
          text: "#F1F3F5",
          "text-secondary": "#A0A7B2",
          "text-muted": "#69717D",
          accent: "#6C8CFF",
          "accent-hover": "#85A1FF",
          "accent-subtle": "rgba(108, 140, 255, 0.12)",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "10px",
        xl: "12px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        elevated: "0 4px 16px -2px rgba(0, 0, 0, 0.6), 0 2px 4px -2px rgba(0, 0, 0, 0.4)",
        modal: "0 20px 40px -4px rgba(0, 0, 0, 0.8), 0 4px 12px -2px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "fade-in": "fadeIn 160ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 160ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
