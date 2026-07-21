/**
 * IOB Design Tokens
 * Extracted 1:1 from the approved HTML template.
 * DO NOT reinterpret values without design approval.
 */

export const tokens = {
  colors: {
    // Base background layers
    bg: "#070707",
    surface: "#18181b", // zinc-900
    "surface-2": "#0a0a0a",
    panel: "#27272a", // zinc-800
    ink: "#ffffff",
    muted: "#a1a1aa", // zinc-400
    dim: "#71717a", // zinc-500
    faint: "#52525b", // zinc-600
    subtle: "#3f3f46", // zinc-700

    // Borders
    border: "rgba(255,255,255,0.10)",
    "border-strong": "rgba(255,255,255,0.20)",
    "border-hairline": "rgba(255,255,255,0.05)",

    // Accent (indigo system from template)
    accent: "#818cf8", // indigo-400
    "accent-soft": "#c7d2fe", // indigo-200
    "accent-deep": "#6366f1", // indigo-500
    "accent-faint": "rgba(129,140,248,0.10)",
    "accent-border": "rgba(129,140,248,0.20)",
    "accent-bracket": "rgba(129,140,248,0.40)",

    // Primary CTA gradient endpoints (light chrome buttons)
    ctaLight: "#f8fafc",
    ctaDark: "#a1a1aa",
    ctaLightSoft: "#fafafa",
    ctaDarkSoft: "#a3a3a3",

    // Selection
    selectionBg: "#e8c382",
    selectionFg: "#351e10",

    // Grid / Noise
    grid: "rgba(255,255,255,0.06)",
    gridFaint: "rgba(255,255,255,0.045)",
    topGlow: "rgba(255,255,255,0.08)",

    // Status palette
    gold: "#e8c382",
    success: "#4ade80",
    warning: "#fbbf24",
    danger: "#f87171",
    info: "#60a5fa",

    // Zinc neutral shorthand
    zinc50: "#fafafa",
    zinc100: "#f4f4f5",
    zinc200: "#e4e4e7",
    zinc300: "#d4d4d8",
    zinc400: "#a1a1aa",
    zinc500: "#71717a",
    zinc600: "#52525b",
    zinc700: "#3f3f46",
    zinc800: "#27272a",
    zinc900: "#18181b",
    zinc950: "#09090b",
  },

  spacing: {
    "frame-x": "1rem", // px-4 base
    "frame-x-sm": "1.5rem", // sm:px-6
    "frame-x-lg": "2rem", // lg:px-8
    "section-gap": "1.5rem", // mt-6 between sections
    "panel-pad": "1.25rem", // p-5
    "panel-pad-sm": "2rem", // sm:p-8
  },

  radius: {
    DEFAULT: "0.25rem",
    sm: "0.375rem",
    md: "0.5rem", // lg in template = 0.5rem
    lg: "0.75rem", // rounded-xl
    xl: "1rem", // rounded-2xl
    full: "9999px",
  },

  typography: {
    bodyFont: "Manrope",
    displayFont: "Gloock", // Note: template uses font-bebas-neue class but loads Gloock/Manrope; Bebas Neue is not loaded. We preserve both with Manrope sans fallback matching template.
    bodyStack: [
      "Inter",
      "ui-sans-serif",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "'Segoe UI'",
      "sans-serif",
    ],
    displayStack: ["'Gloock'", "serif"],
    sizes: {
      xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.1em" }], // uppercase tracking-widest
      sm: ["0.875rem", { lineHeight: "1.25rem" }],
      base: ["1rem", { lineHeight: "1.5rem" }],
      lg: ["1.125rem", { lineHeight: "1.75rem" }],
      // display sizes (Bebas Neue in template, tight tracking)
      "display-sm": ["1.875rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }], // text-3xl
      "display-md": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }], // sm:text-4xl
      "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }], // text-5xl
      "display-xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }], // sm:text-6xl
      "display-2xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }], // lg:text-7xl
      "metric": ["1.875rem", { lineHeight: "1", letterSpacing: "-0.02em" }], // 3xl tracking-tight for metrics
      "metric-lg": ["2.25rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
    },
    tracking: {
      label: "0.2em", // tracking-widest uppercase labels
      "label-xl": "0.32em", // extra-wide section eyebrows
      tight: "-0.03em",
      tighter: "-0.04em",
    },
    weight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },

  shadows: {
    panel:
      "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.95), 0 2rem 5rem rgba(0,0,0,0.45)",
    panelSoft:
      "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.8)",
    chip:
      "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.7)",
    button:
      "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.85)",
    buttonPrimary:
      "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1rem 2.5rem rgba(255,255,255,0.08)",
    logoBadge:
      "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.9), 0 1rem 2rem rgba(0,0,0,0.35)",
    card: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.9)",
    input: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.9)",
    labelPill:
      "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.9), 0 1.5rem 3rem rgba(0,0,0,0.35)",
    iconGlow: "0 0 20px rgba(129,140,248,0.15)",
    dotGlow: "0 0 1rem rgba(129,140,248,0.65)",
    textShadowLogo: "0 1px 0 rgba(0,0,0,0.8)",
  },

  gradients: {
    bodyBg:
      "linear-gradient(135deg, rgba(255,255,255,0.035) 1px, transparent 1px), radial-gradient(circle at 20% 10%, rgba(255,255,255,0.07), transparent 28%), radial-gradient(circle at 80% 0%, rgba(120,120,120,0.12), transparent 30%)",
    panel: "linear-gradient(180deg, rgba(39,39,42,0.72), rgba(10,10,10,0.88))",
    panelMuted: "linear-gradient(180deg, rgba(24,24,27,0.86), rgba(10,10,10,0.92))",
    panelDark: "linear-gradient(180deg, rgba(24,24,27,0.82), rgba(10,10,10,0.94))",
    panelDarker: "linear-gradient(180deg, rgba(24,24,27,0.84), rgba(10,10,10,0.96))",
    panelFooter: "linear-gradient(180deg, rgba(24,24,27,0.4), rgba(10,10,10,0.6))",
    panelBar: "linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0.18))",
    chip: "linear-gradient(to bottom, rgba(255,255,255,0.09), rgba(255,255,255,0.025))",
    buttonSecondary:
      "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
    buttonTertiary:
      "linear-gradient(to bottom, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
    buttonPrimary: "linear-gradient(to bottom, #f8fafc, #a1a1aa)",
    buttonPrimaryAlt: "linear-gradient(to bottom, #fafafa, #a3a3a3)",
    logoBadge:
      "linear-gradient(to bottom, rgba(255,255,255,0.16), rgba(255,255,255,0.045))",
    subCard: "linear-gradient(to bottom, rgba(255,255,255,0.075), rgba(0,0,0,0.2))",
    labelPill:
      "linear-gradient(to bottom, rgba(24,24,27,0.92), rgba(0,0,0,0.68))",
    iconTile: "linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.035))",
    stepBadge:
      "linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.035))",
    accentText: "linear-gradient(to right, #818cf8, #c7d2fe)",
    topGlow: "linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)",
    headerBg: "linear-gradient(to bottom, rgba(24,24,27,0.8), transparent)",
    cardBg: "black/20",
    iconBtnBg:
      "linear-gradient(to bottom, rgba(255,255,255,0.11), rgba(255,255,255,0.035))",
    iconSquare: "linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.035))",
  },

  animation: {
    lenisDuration: 1.2,
    revealDuration: 1.4,
    cardDuration: 0.65,
    frameDuration: 0.9,
    staggerDefault: 0.08,
    staggerTight: 0.06,
    easeOut: "power3.out",
    easeOutStrong: "power4.out",
    easeOutQuart: "power2.out",
  },

  transition: {
    fast: "150ms ease",
    base: "200ms ease",
    slow: "300ms ease",
    hover: "500ms ease", // grayscale->color hover
  },

  zIndex: {
    base: "0",
    raised: "10",
    dropdown: "50",
    sticky: "100",
    overlay: "500",
    modal: "600",
    popover: "700",
    toast: "800",
    tooltip: "900",
    noise: "50",
  },

  layout: {
    maxWidth: "80rem", // max-w-7xl
    headerHeight: "5rem", // min-h-20
    sidebarWidth: "16rem",
    sidebarCollapsedWidth: "4.5rem",
  },

  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;

export type Tokens = typeof tokens;
