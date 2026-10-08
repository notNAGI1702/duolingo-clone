import type { Config } from "tailwindcss";

/** Duolingo's palette, named after their own design-system colour names. */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        feather: "#58CC02", // primary green
        "feather-dark": "#58A700", // green button lip / correct text
        "mask-green": "#89E219",
        macaw: "#1CB0F6", // blue
        "macaw-dark": "#1899D6",
        cardinal: "#FF4B4B", // red / hearts
        "cardinal-dark": "#EA2B2B",
        fox: "#FF9600", // orange
        bee: "#FFC800", // gold / crowns
        beetle: "#CE82FF", // purple
        humpback: "#2B70C9",
        eel: "#4B4B4B", // body text
        wolf: "#777777",
        hare: "#AFAFAF", // disabled text
        swan: "#E5E5E5", // borders
        polar: "#F7F7F7", // page background
        snow: "#FFFFFF",
        // dark-mode surfaces
        "night-bg": "#131F24",
        "night-card": "#1A2A32",
        "night-border": "#37464F",
      },
      fontFamily: {
        din: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // the signature "3D lip" on buttons and path nodes
        lip: "0 4px 0 0 var(--tw-shadow-color)",
        "lip-lg": "0 8px 0 0 var(--tw-shadow-color)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "70%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        bounce2: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
        confetti: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        pop: "pop 0.3s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        bounce2: "bounce2 1.2s ease-in-out infinite",
        shake: "shake 0.3s ease-in-out",
        confetti: "confetti 3s linear forwards",
      },
    },
  },
  plugins: [],
};
export default config;
