import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./Frontend_Preparation/**/*.{html,js}", 
  ],
  theme: {
    extend: {
      // Moving colors INSIDE extend restores all default Tailwind colors!
      colors: {
        background: "#070707", 
        surface: {
          1: "#101012",
          2: "#18181B",
          3: "#27272A",
        },
        accent: {
          DEFAULT: "#818CF8", 
          hover: "#6366F1",
          bg: "rgba(129, 140, 248, 0.1)",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          DEFAULT: "rgba(255, 255, 255, 0.1)",
          strong: "rgba(255, 255, 255, 0.2)",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          critical: "#EF4444",
        },
      },
      fontFamily: {
        display: ["var(--font-bebas-neue)", "sans-serif"],
        body: ["var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        none: 'none', 
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
export default config;
