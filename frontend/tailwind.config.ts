import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        honda: {
          red: "#e60012",
          slate: "#1f2933",
        },
      },
      backgroundImage: {
        "grid-light":
          "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)",
        spotlight:
          "radial-gradient(circle at 20% 20%, rgba(230, 0, 18, 0.18), transparent 55%), radial-gradient(circle at 80% 0%, rgba(37, 99, 235, 0.22), transparent 60%)",
      },
      boxShadow: {
        glow: "0 30px 60px -30px rgba(230, 0, 18, 0.55)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -8px, 0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 12s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        pulseSoft: "pulseSoft 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
