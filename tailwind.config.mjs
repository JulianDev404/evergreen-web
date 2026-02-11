// apps/web/tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      colors: {
        evergreen: {
          50: "#F0FDF4",
          100: "#C8F08F",
          200: "#B4E051",
          300: "#8CD211",
          400: "#8CD211",
          primary: "#0FA623",
          500: "#0FA623",
          600: "#2D660A",
          700: "#144D14",
          800: "#0A3C02",
          900: "#0C2808",
          950: "#021705",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#E6E6E6",
          200: "#CCCCCC",
          300: "#B3B3B3",
          400: "#999999",
          500: "#808080",
          secondary: "#000000",
          600: "#666666",
          700: "#4D4D4D",
          800: "#333333",
          900: "#1A1A1A",
          950: "#0D0D0D",
        },
      },
      fontFamily: {
        gramatika: ["Gramatika", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
