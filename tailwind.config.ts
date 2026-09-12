import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FEFBF0",
          100: "#FDF6E3",
          200: "#F8EFD0",
          300: "#F0E4B8",
          400: "#E5D5A0",
        },
        apricot: {
          light: "#FFF0D9",
          DEFAULT: "#FAD6A5",
          dark: "#E8BC7A",
        },
        ink: {
          50: "#E8EAF0",
          100: "#C5CAD8",
          200: "#8B93A8",
          300: "#5A6480",
          400: "#3D4670",
          500: "#2B3A67",
          600: "#222E52",
          700: "#1A2440",
          800: "#131A30",
          900: "#0D1224",
        },
        neon: {
          orange: "#FF6B35",
          orangeLight: "#FF8C5A",
          green: "#4ECDC4",
          greenLight: "#6DDDD5",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        body: ['"幼圆"', '"YouYuan"', '"Noto Sans SC"', '"LXGW WenKai Screen"', "sans-serif"],
        hand: ['"幼圆"', '"YouYuan"', '"Patrick Hand"', '"Kalam"', '"LXGW WenKai Screen"', "cursive"],
        sketch: ['"幼圆"', '"YouYuan"', '"Amatic SC"', '"Gochi Hand"', '"LXGW WenKai Screen"', "cursive"],
        handwritten: ['"幼圆"', '"YouYuan"', '"Caveat"', '"Shadows Into Light"', '"LXGW WenKai Screen"', "cursive"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "gradient": "gradient 8s linear infinite",
        "pixel-bounce": "pixelBounce 0.3s ease-out",
        "dog-snore": "dogSnore 2s ease-in-out infinite",
        "spotlight": "spotlight 3s ease-in-out infinite",
        "print-out": "printOut 0.4s ease-out",
        "pen-write": "penWrite 1.5s ease-in-out infinite",
        "star-twinkle": "starTwinkle 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(30px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        pixelBounce: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.15) translateY(-2px)" },
          "60%": { transform: "scale(0.95) translateY(1px)" },
          "100%": { transform: "scale(1)" },
        },
        dogSnore: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-2px) rotate(2deg)" },
        },
        spotlight: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        printOut: {
          "0%": { transform: "translateY(10px) scale(0.8)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        penWrite: {
          "0%": { transform: "translateX(0) rotate(0deg)" },
          "25%": { transform: "translateX(3px) rotate(5deg)" },
          "50%": { transform: "translateX(0) rotate(0deg)" },
          "75%": { transform: "translateX(-3px) rotate(-5deg)" },
          "100%": { transform: "translateX(0) rotate(0deg)" },
        },
        starTwinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
