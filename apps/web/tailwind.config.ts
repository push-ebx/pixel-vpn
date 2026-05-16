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
        background: "var(--background)",
        card: "var(--card)",
        "card-hover": "var(--card-hover)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        success: "var(--success)",
        error: "var(--error)",
        border: "var(--border)",
      },
      fontFamily: {
        sans: ["var(--font-family)"],
      },
      borderRadius: {
        lg: "var(--border-radius)",
        md: "calc(var(--border-radius) * 0.7)",
        sm: "calc(var(--border-radius) * 0.5)",
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
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
