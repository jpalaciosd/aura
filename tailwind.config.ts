import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta dashboard/admin (mantener para compatibilidad)
        cream:   { 50: "#fefdfb", 100: "#fdf9f0", 200: "#f9f1df", 300: "#f5e8cc", 400: "#f0dcb3", 500: "#e8cc8f" },
        emerald: { 50: "#eef7f2", 100: "#d5ece0", 200: "#aedac4", 300: "#7ac4a2", 400: "#4daa7f", 500: "#2d7d5a", 600: "#1f5f43", 700: "#174a34", 800: "#103626", 900: "#0b2519" },
        gold:    { 50: "#fdf8ef", 100: "#f9edcf", 200: "#f2d89b", 300: "#e8be5e", 400: "#daa635", 500: "#c4901a", 600: "#a07214", 700: "#7b5610", 800: "#5a3f0c", 900: "#3d2a08" },
        warm:    { 50: "#fef7f0", 100: "#fdebd4", 200: "#fbd5a8", 300: "#f7b97a", 400: "#f39a4f", 500: "#e87c2e" },

        // Paleta editorial dark (landing)
        surface: "#131313",
        "surface-container-lowest": "#0e0e0e",
        "surface-container-low": "#1c1b1b",
        "surface-container": "#201f1f",
        "surface-container-high": "#2a2a2a",
        "surface-container-highest": "#353534",
        "surface-bright": "#3a3939",
        "on-surface": "#e5e2e1",
        "on-surface-variant": "#c4c7c7",
        "outline-variant": "#444748",
        "primary-amber": "#efbd8a",
        "on-primary-amber": "#472a03",
        "primary-amber-dim": "#9c7346",
        "secondary-rose": "#ffb1c5",
      },
      fontFamily: {
        sans:     ["Manrope", "system-ui", "sans-serif"],
        display:  ["Playfair Display", "Georgia", "serif"],
        headline: ["Newsreader", "Georgia", "serif"],
        body:     ["Space Grotesk", "Manrope", "system-ui", "sans-serif"],
        label:    ["DM Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        "hyper": "0.3em",
        "widest-plus": "0.5em",
      },
    },
  },
  plugins: [],
};
export default config;
