---
name: IOB Industrial System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
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
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  h1:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: 0.04em
  h2:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.03em
  h3:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.02em
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
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
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
  unit: 8px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  xxl: 64px
  grid-margin: 24px
  grid-gutter: 16px
---

## Brand & Style

The design system is engineered for the "Industrial Operating Brain," a high-stakes enterprise environment requiring absolute clarity, auditability, and technical precision. The brand personality is clinical, authoritative, and robust, reflecting the heavy-duty nature of industrial automation and data synthesis.

The design style is **Modern Industrial Minimalism**. It eschews decorative trends like glassmorphism or gradients in favor of a strict, structured interface that feels like a professional diagnostic instrument. Every UI element exists to serve a functional purpose within an engineering-grade framework. The aesthetic response should be one of "controlled complexity"—massive amounts of data rendered with legibility and reliability.

## Colors

The palette is strictly dark-mode centric to reduce eye strain in monitoring environments and to provide high contrast for technical data. 

- **Foundations**: Use `--bg-base` for the main application background. Tiered surfaces (`surface-1` through `surface-3`) should be used to establish visual hierarchy and depth.
- **Accents**: The Indigo accent (`#818CF8`) is reserved for primary actions, active states, and critical paths. It should be used sparingly to maintain the technical, "non-playful" atmosphere.
- **Borders**: Borders are the primary method of separation. Use `border-subtle` for grid lines and `border-strong` for interactive component boundaries.

## Typography

This design system utilizes a high-contrast typographic pairing:

- **Headlines**: `Bebas Neue` provides a technical, industrial look. It must always be used in uppercase with slight tracking (letter-spacing) to ensure a "stamped" or "engraved" architectural feel.
- **Body & Interface**: `Manrope` is used for all functional text, data readouts, and documentation. Its geometric but highly legible forms ensure clarity in dense tables and dashboards.
- **Data Entry**: For strictly numerical or code-based values, a monospaced font (JetBrains Mono) is recommended to ensure tabular alignment.

## Layout & Spacing

The layout is governed by a **Strict Engineering Grid**. Every element must align to an 8px square increment. 

- **Grid System**: Use a 12-column fluid grid for main content areas, but reinforce the structure with visible `border-subtle` lines between major sections (e.g., sidebars, header, main panels).
- **Responsive Behavior**: 
  - **Desktop**: Full 12-column spread with fixed sidebars.
  - **Tablet**: 8-column layout; sidebars collapse into icons.
  - **Mobile**: 4-column layout; strict vertical stacking.
- **Margins**: Use a consistent 24px margin for outer containers to allow the "Operating Brain" to breathe despite high data density.

## Elevation & Depth

Depth in this design system is communicated through **Tonal Layering and Borders** rather than shadows. 

- **Layering**: Higher elevation is represented by lighter surface colors (e.g., a modal sits on `surface-3` while the background is `bg-base`).
- **Outlines**: Every container must have a visible border. Interaction is signaled by changing the border color (e.g., from `border` to `accent`) rather than adding a shadow.
- **Flatness**: Avoid any use of blurring or drop shadows. The UI should feel like a single physical sheet of glass with etched sections.

## Shapes

The shape language is disciplined and geometric. 

- **Standard Radius**: Most interactive elements (buttons, inputs) use a **8px (0.5rem)** radius to balance the harshness of the dark palette with modern accessibility.
- **Large Containers**: Use **12px (0.75rem)** for cards and primary layout sections to create a clear container-child relationship.
- **Square Elements**: Icons and small status indicators may remain square (0px) if they are part of a dense data grid.

## Components

- **Buttons**: Square-ish (8px radius). Primary buttons use a solid `accent` background with dark text. Secondary buttons are outlined with `border-strong` and white text. No gradients.
- **Inputs**: Use `surface-1` background with a `border` stroke. On focus, the stroke changes to `accent` with a 1px solid weight.
- **Cards**: Background `surface-1` with `border-subtle`. Headers within cards should be separated by a horizontal line of `border-subtle`.
- **Lists/Tables**: High-density rows (32px or 40px height). Every row is separated by a 1px `border-subtle`. Hover states use `surface-2`.
- **Status Indicators**: Use outlined icons with a 2px stroke. Status colors (Success, Warning, Critical) should use desaturated versions of Green, Yellow, and Red to maintain the professional palette.
- **Chips/Badges**: Rectangular with 4px radius. Use `surface-3` with `text-secondary` for neutral tags; use `accent-bg` with `accent` text for active filters.
- **Icons**: Strictly outlined (Lucide-style). Stroke width should be 1.5px or 2px to ensure visibility against dark backgrounds.