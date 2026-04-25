import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111F",
        mist: "#EDF4FF",
        mint: "#44D7B6",
        gold: "#F6C453",
        rose: "#F17D7D",
      },
      boxShadow: {
        panel: "0 24px 80px rgba(7, 17, 31, 0.18)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.92)" },
        },
      },
      animation: {
        "pulse-soft": "pulseSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
