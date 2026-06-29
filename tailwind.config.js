/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        'deep-teal': '#00BCD4',
        'deep-teal-light': '#00B4D8',
        'deep-teal-dark': '#0d7377',
        'gold-accent': '#FFC107',
        'gold-light': '#FFD54F',
        'gold-dark': '#FFA000',
        'cream': '#f0f9ff',
        'warm-ivory': '#FFFFFF',
        'dark-slate': '#1A1A2E',
        'midnight': '#12121A',
        'success-mint': '#4CAF50',
        'warning-amber': '#F59E0B',
        'danger-rose': '#EF4444',
        'info-cyan': '#00BCD4',
        'lavender-soft': '#9C27B0',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px rgba(0,0,0,0.06)",
        md: "0 4px 12px rgba(0,0,0,0.08)",
        lg: "0 8px 24px rgba(0,0,0,0.12)",
        xl: "0 16px 48px rgba(0,0,0,0.16)",
        'glow-amber': '0 0 20px rgba(255,193,7,0.3)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.25)',
        'glow-rose': '0 0 16px rgba(239,68,68,0.2)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "mist-float": {
          "0%": { transform: "translateY(100vh) translateX(0)", opacity: "0" },
          "10%": { opacity: "var(--particle-opacity, 0.15)" },
          "90%": { opacity: "var(--particle-opacity, 0.15)" },
          "100%": { transform: "translateY(-10vh) translateX(var(--drift, 20px))", opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "loading-dot": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(0,188,212,0.2)" },
          "50%": { boxShadow: "0 0 24px rgba(0,188,212,0.5)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%": { transform: "translateX(-8px)" },
          "20%, 40%": { transform: "translateX(8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "mist-float": "mist-float var(--float-duration, 12s) linear infinite",
        "float": "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "loading-dot": "loading-dot 1s ease-in-out infinite",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "shake": "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
