import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        "cream-deep": "var(--cream-deep)",
        rubies: {
          red: "var(--red)",
          "red-deep": "var(--red-deep)",
          blue: "var(--blue)",
          "blue-soft": "var(--blue-soft)",
        },
        ink: "var(--ink)",
        muted: "var(--muted)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        soft: "var(--radius-sm)",
        card: "var(--radius-md)",
        sheet: "var(--radius-lg)",
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(26, 26, 26, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
