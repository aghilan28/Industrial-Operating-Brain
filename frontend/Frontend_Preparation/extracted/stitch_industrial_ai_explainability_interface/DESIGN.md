---
name: Industrial Logic System
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
  secondary: '#c8c5ca'
  on-secondary: '#303033'
  secondary-container: '#47464a'
  on-secondary-container: '#b6b4b8'
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
  secondary-fixed: '#e4e1e6'
  secondary-fixed-dim: '#c8c5ca'
  on-secondary-fixed: '#1b1b1e'
  on-secondary-fixed-variant: '#47464a'
  tertiary-fixed: '#ffdea3'
  tertiary-fixed-dim: '#f7bd3e'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#121319'
  on-background: '#e4e1eb'
  surface-variant: '#34343b'
typography:
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.02em
  headline-sm:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.02em
  title-lg:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  grid-margin: 24px
  grid-gutter: 16px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 48px
---

## Brand & Style
The design system is engineered for the **Industrial Operating Brain (IOB)**, an enterprise environment where explainable AI (XAI) meets heavy industry. The brand personality is one of **Scientific Precision**, **Absolute Transparency**, and **Unwavering Trust**. It avoids the decorative trends of consumer software, focusing instead on data density and logical clarity.

The aesthetic follows a **High-Contrast Professional** movement. It utilizes a deep monochromatic base to minimize visual fatigue in control room environments, using high-contrast typography to ensure critical alerts are processed instantly. The style is strictly functional: no gradients, no blurs, and no skeuomorphic elements. Every visual mark must serve a diagnostic purpose, conveying a sense of "Engineering Integrity."

## Colors
The palette is optimized for low-light industrial environments. It utilizes a "Dark Logic" approach where depth is communicated through subtle hex shifts rather than shadows. 

- **Functional Monochromes:** The background and surface tiers create a rigid hierarchy for data containers. 
- **The Accent Rule:** #818CF8 (Accent) is the sole indicator of "Active State," "Selection," or "Positive Intelligence."
- **Data Neutrality:** Forfeiting the traditional Red/Green/Yellow paradigm prevents "alert fatigue." Use the Accent color for all positive/active data and Surface-3 for inactive/negative space in charts and gauges.
- **Borders:** Use `border-subtle` for structural engineering grids and `border-strong` for interactive component boundaries.

## Typography
The typography system balances the raw industrial impact of **Bebas Neue** with the scientific readability of **Manrope**.

- **Headings:** Bebas Neue is used for primary module titles and high-level KPIs. It should always be used in uppercase to maintain a "blueprint" aesthetic.
- **Body & Data:** Manrope is the workhorse for explainable AI narratives and technical specifications. Its geometric construction ensures legibility in data-dense tables.
- **Numerical Data:** For telemetry and sensor readouts, use a monospaced font (JetBrains Mono) to ensure tabular alignment of shifting values.

## Layout & Spacing
This design system adheres to a **Strict 8px Grid**. All dimensions, padding, and margins must be multiples of 8.

- **The Engineering Grid:** A background grid composed of 1px lines using `border-subtle` should be visible at 32px or 64px intervals to reinforce the sense of a technical workspace.
- **Layout Model:** Use a 12-column fluid grid for desktop views. Content is contained within "Modules" (Surface 1) separated by 16px gutters.
- **Data Density:** In diagnostic views, vertical rhythm can be tightened to 4px (stack-xs) to maximize information on a single screen without scrolling.

## Elevation & Depth
Depth in the design system is communicated through **Structural Layering** rather than shadows. 

- **Tier 0 (Background Base):** The canvas.
- **Tier 1 (Surface 1):** Primary layout containers.
- **Tier 2 (Surface 2):** Nested components like cards, input fields, or sidebar nav items.
- **Tier 3 (Surface 3):** Hover states, toggle tracks, and negative space in data visualizations.

**Borders as Dividers:** Use `border-default` for all component perimeters. `border-strong` is reserved for focused elements or primary action buttons. No shadows are permitted; the UI should feel like a single-plane instrument panel.

## Shapes
The shape language is disciplined and geometric. 

- **Standard Modules:** Use 8px (rounded-md) for most containers and cards.
- **Secondary UI:** Use 12px (rounded-lg) for larger dashboard widgets to soften the technical density slightly.
- **Functional Elements:** Use "Full" (Pill-shaped) exclusively for status badges, tags, and toggle switches to distinguish them from structural blocks.
- **Strictness:** Internal elements should never have a larger radius than their parent container.

## Components
Consistent styling across technical components ensures the system remains predictable for operators.

- **Buttons:** 
  - *Primary:* Background: Accent, Text: Background-Base, Weight: Bold, Radius: 8px.
  - *Secondary:* Background: Transparent, Border: Border-Strong, Text: Text-Primary.
- **Input Fields:** Use Surface-2 as the background with a 1px `border-default`. Upon focus, the border changes to Accent.
- **Outlined Icons:** Use only 2px stroke weight outlined icons. Avoid filled icons unless used as a status indicator.
- **Explainability Cards:** Use Surface-1 with a vertical accent bar (2px) on the left side to denote AI-generated insights.
- **Charts & Gauges:** 
  - All active data: #818CF8.
  - All background/empty tracks: #27272A (Surface 3).
  - Do not use color to indicate "danger" or "success"—use iconography (e.g., a warning triangle) and clear text labels to avoid accessibility issues and color-coding confusion.
- **Engineering Grid:** Apply a persistent background pattern of 1px `border-subtle` lines across the Background-Base to serve as a visual anchor for all modules.