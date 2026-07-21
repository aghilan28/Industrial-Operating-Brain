---
name: Industrial Operating Brain
colors:
  surface: '#121319'
  surface-dim: '#121319'
  surface-bright: '#393840'
  surface-container-lowest: '#0d0e14'
  surface-container-low: '#1b1b22'
  surface-container: '#1f1f26'
  surface-container-high: '#292930'
  surface-container-highest: '#34343b'
  on-surface: '#e4e1eb'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e4e1eb'
  inverse-on-surface: '#303037'
  outline: '#908f9e'
  outline-variant: '#454653'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#131e8c'
  primary-container: '#818cf8'
  on-primary-container: '#101b8a'
  inverse-primary: '#4953bc'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#f7bd3e'
  on-tertiary: '#402d00'
  tertiary-container: '#c08d00'
  on-tertiary-container: '#3e2b00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000767'
  on-primary-fixed-variant: '#2f3aa3'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdea3'
  tertiary-fixed-dim: '#f7bd3e'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#121319'
  on-background: '#e4e1eb'
  surface-variant: '#34343b'
typography:
  headline-xl:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.02em
  headline-sm:
    fontFamily: Bebas Neue
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.04em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
  headline-xl-mobile:
    fontFamily: Bebas Neue
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  grid-unit: 8px
  gutter: 16px
  margin-sm: 16px
  margin-md: 24px
  margin-lg: 48px
---

## Brand & Style

This design system is engineered for mission-critical industrial environments where clarity, speed of cognition, and reliability are paramount. It follows a **Minimal Industrial** aesthetic, drawing inspiration from high-precision engineering interfaces and aerospace telemetry systems. 

The personality is utilitarian, authoritative, and focused. It avoids decorative trends like glassmorphism or vibrant neon glows in favor of structural integrity and high-contrast legibility. The UI acts as a silent, powerful infrastructure for complex asset management and Industry 5.0 automation.

Key principles:
- **Functional Precision:** Every line and pixel serves a purpose.
- **Structural Rigidity:** Clear boundaries and a visible engineering grid reinforce a sense of order.
- **Mission Criticality:** High-contrast text and a deep background ensure data populates with immediate visual priority.

## Colors

The color palette is anchored in a true-black environment to minimize eye strain in control-room settings and maximize the perceived contrast of data points.

- **Foundational Neutrals:** A series of stepped grays (`surface-1` through `surface-3`) creates depth without the need for shadows. 
- **Borders:** Three levels of border opacity define the structural hierarchy, with `border-subtle` used exclusively for the pervasive background engineering grid.
- **Accent:** A technical indigo (`#818CF8`) serves as the primary action color, used sparingly to highlight active states, progress, or critical paths.
- **Typography:** Pure white (`#FAFAFA`) is reserved for primary data, while secondary and tertiary grays manage information density.

## Typography

The typographic system utilizes a "Display vs. Data" strategy.

- **Bebas Neue:** Used for high-level headings, KPIs, and module titles. Its condensed, vertical nature evokes industrial labeling and high-impact signage. 
- **Manrope:** Used for all functional UI elements, body text, and data readouts. It provides the modern, geometric clarity required for complex technical information.
- **Formatting:** Use uppercase for labels (`label-md`, `label-sm`) to distinguish metadata from content. Maintain tight line-heights on headings to emphasize the "blocky," industrial feel.

## Layout & Spacing

This design system is built on a strict **8px increment grid**. 

- **Engineering Grid:** The background must feature a persistent grid pattern using `border-subtle` at 32px or 64px intervals to ground the interface in an "operating brain" environment.
- **Fluidity:** Containers use a fluid 12-column system on desktop, but margins and internal padding must always snap to the 8px baseline.
- **Breakpoints:**
  - **Mobile (<768px):** 16px side margins, single-column reflow for cards.
  - **Tablet (768px - 1280px):** 24px side margins, 2-column card layouts.
  - **Desktop (>1280px):** Max-width 1440px or full-width fluid depending on the density of the asset telemetry.

## Elevation & Depth

In this industrial context, depth is achieved through **Tonal Layering** and **Outline Definition** rather than shadows.

- **Flat Hierarchy:** Elements do not "float"; they are "housed" or "embedded." 
- **Surfacing:** 
  - Level 0: `bg-base` (The main application canvas).
  - Level 1: `surface-1` + `border` (Primary containers and dashboard cards).
  - Level 2: `surface-2` + `border-strong` (Interactive fields, inputs, and flyouts).
- **No Shadows:** Shadows are strictly prohibited to maintain the "mission critical" flat-panel aesthetic. Use `border-strong` to provide visual separation between overlapping layers (e.g., modals).

## Shapes

The shape language is "Soft-Industrial"—relying on geometric precision with slight rounding to ensure the UI feels modern and accessible rather than archaic.

- **Standard (8px):** Used for buttons, inputs, and small modules.
- **Large (12px):** Used for primary content cards and containers.
- **Full (Pill):** Reserved exclusively for status indicators (chips) and toggle switches.
- **Square (0px):** Use only for technical data tables and specialized header sections that span the full viewport width.

## Components

### Buttons
- **Height:** 40px fixed.
- **Primary:** `bg: text-primary`, `text: #000000`, 8px radius. Bold, high-contrast.
- **Secondary:** `bg: transparent`, `border: border-strong`, `text: text-primary`.
- **Tertiary/Ghost:** `bg: transparent`, `text: text-secondary`. Use `accent` only for destructive or high-priority calls to action.

### Input Fields & Dropdowns
- **Height:** 40px.
- **Surface:** `surface-2`.
- **Border:** `border` (default), `accent` (focus).
- **Text:** `text-primary` for input, `text-tertiary` for placeholders.

### Cards
- **Background:** `surface-1`.
- **Border:** `border`.
- **Corner Radius:** 12px.
- **Header:** Should often include a `border-bottom` using `border-subtle` and a `label-md` category title.

### Chips/Status Indicators
- **Shape:** Full pill.
- **Colors:** Use `accent-bg` with `accent` text for active states. Use `surface-3` for inactive or neutral states.

### Icons
- **Style:** Outlined (2px stroke weight).
- **Scale:** 20px within a 24px bounding box.
- **Library:** Lucide or Heroicons.

### Engineering Grid
- All major layout sections must sit atop a `border-subtle` grid background. This grid should remain fixed during scroll for a "viewport" effect.