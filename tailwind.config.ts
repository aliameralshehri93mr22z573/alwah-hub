import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          dark: "#0F172A",
        },
        brand: {
          DEFAULT: "#2563EB",
          interactive: "#2563EB",
        },
        accent: {
          DEFAULT: "#38BDF8",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
