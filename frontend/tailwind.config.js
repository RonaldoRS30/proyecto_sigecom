/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      /* =========================
         BORDER RADIUS (UNIFICADO)
      ========================= */
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem", // cards, tabs, modals
      },

      /* =========================
         COLORS (CORPORATIVO)
      ========================= */
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* Branding */
        brand: {
          DEFAULT: "#279B9A", // VC Corporate Teal
          light: "#389E9D",
          dark: "#1E7D7C",
        },

        /* OVERRIDING INDIGO TO BE VC TEAL 
           This instantly re-themes the entire app because components use 'indigo' */
        indigo: {
          50: '#f1fafa',
          100: '#def4f3',
          200: '#bce7e6',
          300: '#8dd4d2',
          400: '#5ab9b8',
          500: '#389e9d',
          600: '#279b9a', /* The core VC logo color */
          700: '#237a79',
          800: '#206261',
          900: '#1e5151',
          950: '#0f3030',
        },

        /* OVERRIDING GRAY TO BE CORPORATE SLATE
           Matches the charcoal text in the logo */
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#333333', /* Logo dark color for text */
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },

        /* VIBRANT SECONDARY ACCENT (Replaces default blue) 
           A deep, ocean navy that provides an elegant, cool contrast to the Teal */
        blue: {
          50: '#f4f7fb',
          100: '#e5edf7',
          200: '#cddceb',
          300: '#a8c3de',
          400: '#7fa3cd',
          500: '#5c84bc', 
          600: '#466aa5',
          700: '#3a5587',
          800: '#32476f',
          900: '#2d3e5e',
          950: '#1d273e',
        },

        /* WARM HIGHLIGHTS (Replaces default amber) 
           A golden-coral tone to inject vibrant life without clashing with the cool base */
        amber: {
          50: '#fff9f0',
          100: '#ffefd6',
          200: '#ffdaab',
          300: '#ffc17a',
          400: '#ffa14d',
          500: '#ff8626', 
          600: '#f06b14',
          700: '#c85112',
          800: '#9f3f15',
          900: '#803514',
          950: '#451808',
        },

        /* SUCCESS STATE (Replaces default emerald) 
           A fresh, spring mint green that harmonizes seamlessly with the corporate Teal */
        emerald: {
          50: '#f1fcf8',
          100: '#ddf9ef',
          200: '#bdf1df',
          300: '#8ee4ca',
          400: '#58d0b0',
          500: '#33b695', 
          600: '#229377',
          700: '#1e7661',
          800: '#1b5e4f',
          900: '#174d42',
          950: '#0d2b26',
        },

        /* DANGER STATE (Replaces default red) 
           A professional rose/crimson that alerts elegantly without being purely aggressive */
        red: {
          50: '#fff0f2',
          100: '#ffdee3',
          200: '#ffc2cc',
          300: '#ff97a9',
          400: '#ff627e',
          500: '#fc365b', 
          600: '#e71641',
          700: '#c30c31',
          800: '#a30e2c',
          900: '#8b1029',
          950: '#4e0312',
        },

        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },

        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      },

      /* =========================
         TYPOGRAPHY SYSTEM
      ========================= */
      fontFamily: {
        sans: [
          "Outfit",
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },

      fontSize: {
        xs: ["11px", { lineHeight: "1.4" }],      // tablas
        sm: ["12px", { lineHeight: "1.5" }],      // botones / labels
        base: ["14px", { lineHeight: "1.6" }],    // contenido
        lg: ["16px", { lineHeight: "1.6" }],      // subtítulos
        xl: ["18px", { lineHeight: "1.6" }],      // títulos
        kpi: ["20px", { lineHeight: "1.4" }],     // métricas
      },

      letterSpacing: {
        tightest: "-0.02em",
        wide: "0.04em",
        widest: "0.12em",
      },

      /* =========================
         SHADOWS (PRO)
      ========================= */
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04)",
        card: "0 4px 12px rgba(0,0,0,0.06)",
        elevated: "0 12px 32px rgba(0,0,0,0.12)",
      },

      /* =========================
         ANIMATIONS (SOBRIAS)
      ========================= */
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
