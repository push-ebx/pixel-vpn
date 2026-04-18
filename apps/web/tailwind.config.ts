import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        card: "#141414",
        "card-hover": "#1a1a1a",
        accent: "#5674d6",
        "accent-hover": "#6a86e4",
        text: {
          primary: "#f5f5f5",
          secondary: "#8a8a8a",
        },
        success: "#5674d6",
        error: "#ef4444",
        border: "#2a2a2a",
      },
      fontFamily: {
        sans: ["SF Mono", "JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      borderRadius: {
        lg: "6px",
        md: "4px",
        sm: "3px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
