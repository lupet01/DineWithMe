import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFF5F2",
          100: "#FFE8E1",
          200: "#FFD1C3",
          300: "#FFB4A0",
          400: "#FF8F75",
          500: "#FF6B4A", // Main coral/orange
          600: "#E85535",
          700: "#C73F24",
          800: "#A3321B",
          900: "#7D2514",
        },
        cream: {
          50: "#FEFEFE",
          100: "#FAF9F7", // Main background
          200: "#F5F3F0",
          300: "#EDEAE5",
          400: "#E5E1DA",
          500: "#DDD8CF",
        },
      },
      borderRadius: {
        "2xl": "20px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.06)",
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
