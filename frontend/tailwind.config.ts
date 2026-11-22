import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        codexa: {
          // Primary Brand Palette (Violet / Indigo)
          primary: "#6C5CE7",
          "primary-hover": "#5A4AD1",
          indigo: "#5141C9",
          "violet-soft": "#A78BFA",
          "violet-light": "#EDE9FE",
          "violet-surface": "#F5F3FF",
          "violet-muted": "rgba(108, 92, 231, 0.08)",

          // Accent Colors (Cyan / Blue)
          cyan: "#0EA5E9",
          "cyan-light": "#E0F2FE",
          blue: "#3B82F6",
          "blue-light": "#EFF6FF",

          // Neutral Palette
          bg: "#F7F8FC",
          "bg-secondary": "#F1F3F8",
          surface: "#FFFFFF",
          "surface-hover": "#F9FAFB",
          text: "#171A2B",
          "text-secondary": "#667085",
          "text-muted": "#98A2B3",
          border: "#E5E7EB",
          "border-strong": "#D0D5DD",

          // Semantic Colors
          success: "#16A34A",
          "success-bg": "#ECFDF3",
          warning: "#F59E0B",
          "warning-bg": "#FFFAEB",
          error: "#EF4444",
          "error-bg": "#FEF2F2",
          info: "#0EA5E9",
          "info-bg": "#F0F9FF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(16, 24, 40, 0.04)",
        card: "0 1px 3px 0 rgba(16, 24, 40, 0.05), 0 1px 2px 0 rgba(16, 24, 40, 0.03)",
        medium: "0 4px 12px 0 rgba(16, 24, 40, 0.05)",
        elevated: "0 12px 32px 0 rgba(16, 24, 40, 0.08)",
        modal: "0 20px 48px -4px rgba(16, 24, 40, 0.12), 0 8px 16px -2px rgba(16, 24, 40, 0.06)",
        glow: "0 0 32px 0 rgba(108, 92, 231, 0.18)",
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
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
