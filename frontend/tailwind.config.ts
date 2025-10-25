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
    },
  },
  plugins: [],
} satisfies Config;
