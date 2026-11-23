/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Nunito"', "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        cream: {
          50: "#FDFBF7",
          100: "#F8F4EC",
          200: "#EFE8DB",
        },
        lavender: {
          50: "#F7F4FE",
          100: "#EDE6FD",
          200: "#DCD0FB",
          400: "#A78EF0",
          500: "#8B6FE3",
          600: "#7255CF",
        },
        mint: {
          50: "#EFFAF4",
          100: "#DCF4E7",
          200: "#BDE9D1",
          400: "#68C19A",
          500: "#4BA880",
          600: "#378A67",
        },
        skysoft: {
          50: "#EFF7FE",
          100: "#DCEEFD",
          200: "#BBE0FB",
          400: "#6BAEE8",
          500: "#4A92D4",
        },
        peach: {
          50: "#FFF5EE",
          100: "#FFE6D5",
          200: "#FFD0B3",
          400: "#F2A072",
          500: "#DF8251",
        },
        plum: {
          700: "#544C6E",
          800: "#3D3654",
          900: "#2B253E",
        },
      },
      boxShadow: {
        cozy: "0 10px 30px -10px rgba(108, 92, 165, 0.14)",
        "cozy-lg": "0 18px 42px -12px rgba(108, 92, 165, 0.2)",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-7px)" },
        },
        breatheSlow: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        happyBounce: {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "45%": { transform: "translateY(-10px) scale(1.03)" },
        },
        wiggleSoft: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-4deg)" },
          "75%": { transform: "rotate(4deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.96)" },
          "50%": { opacity: "0.95", transform: "scale(1.05)" },
        },
      },
      animation: {
        "float-slow": "floatSlow 4.2s ease-in-out infinite",
        "breathe-slow": "breatheSlow 4.8s ease-in-out infinite",
        "happy-bounce": "happyBounce 1.8s ease-in-out infinite",
        "wiggle-soft": "wiggleSoft 0.6s ease-in-out",
        "pulse-glow": "pulseGlow 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

