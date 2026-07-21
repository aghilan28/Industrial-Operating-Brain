---
name: Industrial Operating Brain
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a31'
  surface-container-highest: '#33343c'
  on-surface: '#e2e1eb'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e2e1eb'
  inverse-on-surface: '#2f3037'
  outline: '#908f9e'
  outline-variant: '#454653'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#131e8c'
  primary-container: '#818cf8'
  on-primary-container: '#101b8a'
  inverse-primary: '#4953bc'
  secondary: '#c9c6c5'
  on-secondary: '#313030'
  secondary-container: '#474646'
  on-secondary-container: '#b7b4b4'
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
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c9c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#ffdea3'
  tertiary-fixed-dim: '#f7bd3e'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#12131a'
  on-background: '#e2e1eb'
  surface-variant: '#33343c'
typography:
  display-xl:
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
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for mission-critical industrial intelligence. It prioritizes high-density information architecture, immediate legibility, and a high-performance aesthetic. The personality is disciplined, technical, and authoritative—built for operators who manage complex systems where clarity is paramount.

The design style is **Industrial Minimalism**. It rejects decorative flourishes, gradients, and blurs in favor of structural integrity. Depth is communicated through tonal layering and precise linework. A subtle 8px engineering grid overlay is applied to the base background to reinforce the sense of a precision-machined interface.

## Colors

The palette is strictly functional and optimized for low-light control room environments. It utilizes a deep monochromatic base with varying surface steps to create visual hierarchy without excessive contrast. 

The **Accent** color is used sparingly for primary actions, focus states, and critical data points. **Borders** act as the primary structural element; their opacity variations indicate the level of containment and importance. No solid background fills should be used for status or severity; instead, rely on the established text colors and subtle accent backgrounds.

## Typography

This design system employs a dual-typeface strategy. **Bebas Neue** is used for all high-level headers and data-heavy "readouts." Its condensed, impactful nature mimics industrial signage and technical displays. **Manrope** is used for all body text, metadata, and interface labels to ensure maximum readability in dense layouts.

Labels and small metadata should often use `textTransform: uppercase` with increased letter spacing to distinguish between interactive labels and static content. For mobile views, `display-xl` should scale down to `32px` to prevent text wrapping on narrow viewports.

## Layout & Spacing

The system is built on a strict **8px grid**. All margins, paddings, and component heights must be multiples of 8. 

- **Layout Model:** A 12-column fluid grid is used for desktop (breakpoints at 1440px+), transitioning to an 8-column grid for tablets (768px-1024px), and a 4-column grid for mobile (below 768px).
- **Density:** Elements should maintain a "Compact" density. Use 16px (md) for container gaps and 8px (sm) for internal element spacing.
- **Engineering Grid:** A global background overlay consisting of 1px lines at 32px intervals with 10% opacity should be visible on the `Base Background` level to assist with alignment perception.

## Elevation & Depth

Depth is achieved through **Tonal Layers** and **Strong Outlines**. Shadows are strictly prohibited to maintain the flat, industrial aesthetic.

1.  **Level 0 (Background):** Base layer (#070707) with the grid overlay.
2.  **Level 1 (Sub-surface):** Used for sidebar and navigation areas (#101012).
3.  **Level 2 (Surface):** Primary cards and content containers (#18181B). These must have a `Border Subtle` or `Border` stroke.
4.  **Level 3 (Overlay):** Modals and dropdowns (#27272A). These require a `Border Strong` to clearly separate them from the content beneath.

Visual separation is always reinforced by a 1px solid border.

## Shapes

The shape language is controlled and geometric. 

- **8px (md):** Standard for buttons, input fields, and small cards.
- **12px (lg):** Standard for primary content containers and modals.
- **Full:** Reserved strictly for status indicators, pill-style badges, and toggle switches.

All containers must use 1px strokes; do not use inner shadows or bevels.

## Components

### Buttons
- **Primary:** Background `Accent`, Text `Secondary` (Dark), 8px radius.
- **Secondary:** Outlined with `Border Strong`, Text `Primary`, 8px radius.
- **Ghost:** No border or background, Text `Accent`.

### Badges & Status
- **Severity Badges:** Small outlined containers with 11px uppercase Manrope text. Include a 4px circular dot to the left of the text. 
    - *Critical:* Red dot.
    - *High:* Orange dot.
    - *Medium:* Yellow dot.
    - *Low:* Green dot.
    - *Informational:* Blue dot.
- **Status Badges:** Minimal outlined pills (Full radius) with `Text Secondary`.

### Inputs
- **Text Fields:** Surface 2 background, `Border Default` stroke. On focus, the stroke changes to `Accent` and the background to Surface 3.
- **Checkboxes/Radios:** Square (4px radius) for checkboxes, circular for radios. Always outlined.

### Data Display
- **Cards:** Surface 2 background, 12px radius, `Border Default` stroke. Headers inside cards should use `Headline-sm`.
- **Icons:** Use 20px or 24px outlined icons from the Lucide or Solar sets. Stroke weight should be consistent (1.5px or 2px).
- **Lists:** Rows separated by `Border Subtle`. Interactive rows should have a hover state of Surface 3.