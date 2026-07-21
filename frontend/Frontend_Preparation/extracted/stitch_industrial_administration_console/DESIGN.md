---
name: IOB Admin Console
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383941'
  surface-container-lowest: '#0d0e15'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#292931'
  surface-container-highest: '#33343c'
  on-surface: '#e3e1ec'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e3e1ec'
  inverse-on-surface: '#2f3038'
  outline: '#908f9e'
  outline-variant: '#454653'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#131e8c'
  primary-container: '#818cf8'
  on-primary-container: '#101b8a'
  inverse-primary: '#4953bc'
  secondary: '#c8c6c8'
  on-secondary: '#303032'
  secondary-container: '#474649'
  on-secondary-container: '#b7b4b7'
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
  secondary-fixed: '#e5e1e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#ffdea3'
  tertiary-fixed-dim: '#f7bd3e'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#12131a'
  on-background: '#e3e1ec'
  surface-variant: '#33343c'
typography:
  display:
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
  headline-lg-mobile:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 24px
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.04em
  title-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
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
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: monospace
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
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
  2xl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for the Industrial Operating Brain (IOB) Administration Console, a high-stakes environment where precision, security, and clarity are paramount. The brand personality is **authoritative, technical, and hyper-functional**, reflecting an infrastructure-first mindset.

The visual style is **Industrial Minimalism**. It draws inspiration from heavy-industry control panels and modern cloud infrastructure platforms like Azure and AWS. This is achieved through a high-contrast dark interface, a strict structural grid, and a total absence of decorative flourishes like gradients or blurs. Every visual element must serve a functional purpose, facilitating rapid data scanning and confident system administration.

## Colors

The palette is strictly dark-mode, designed to reduce eye strain during long monitoring sessions and to provide high-contrast legibility. 

- **Foundation:** The system uses a tiered grayscale approach (`Surface 1` through `Surface 3`) to define information hierarchy and structural depth without relying on shadows.
- **Accents:** A single Indigo accent (`#818CF8`) is used sparingly to indicate primary actions, focus states, and active navigation nodes.
- **Borders:** Translucent white borders are the primary tool for element separation. Their varying opacities (`0.06`, `0.10`, `0.16`) denote the "strength" of the container or the density of the content.

## Typography

This system employs a high-contrast typographic pairing:

1.  **Headings (Bebas Neue):** Used for main page headers and section titles. Its condensed, all-caps nature evokes industrial signage and provides a strong vertical rhythm.
2.  **Body & UI (Manrope):** A clean, modern sans-serif used for all functional text, data readouts, and controls. It ensures maximum readability for complex industrial parameters.

**Rules:**
- All `Bebas Neue` headings should be treated with `uppercase` transform.
- Use `Text Secondary` for body copy to maintain a comfortable reading contrast against the dark background, reserving `Text Primary` for titles and active inputs.
- Technical data and IDs should use the `code-sm` monospaced style.

## Layout & Spacing

The design system is built on a **strict 8px grid**. All dimensions, paddings, and margins must be multiples of 8 (with the exception of 4px for extremely tight micro-adjustments).

**Grid Model:**
- **Desktop:** A 12-column fluid grid for the main content area with a fixed 240px left-hand navigation rail.
- **Gutters:** 16px fixed gutters between columns.
- **Margins:** 32px outer margins on desktop; 16px on mobile.
- **Alignment:** Content should lean toward the top-left (industrial standard) rather than being centered, maximizing the "dashboard" feel.

## Elevation & Depth

This design system rejects the use of shadows to convey depth. Instead, it utilizes **Tonal Layering** and **Border Definition**:

1.  **Level 0 (Base):** `#070707` — Used for the application background.
2.  **Level 1 (Navigation/Sidebar):** `#101012` — Slightly lifted.
3.  **Level 2 (Cards/Main Content):** `#18181B` — The primary surface for data.
4.  **Level 3 (Modals/Popovers):** `#27272A` — The highest tier, used for temporary overlays.

Depth is further reinforced by **Subtle Borders**. Every container must have a 1px solid border using `Border Subtle` or `Border Default` to define its perimeter against the dark canvas.

## Shapes

The shape language is controlled and geometric. 

- **Standard Elements:** Use `8px` (`rounded-md`) for buttons, input fields, and standard cards.
- **Large Containers:** Use `12px` (`rounded-lg`) for major dashboard widgets or modal windows.
- **Functional Elements:** Use `Full` (Pill) only for status indicators (Badges/Chips) and toggle switches.

Sharp corners are avoided to prevent a "raw" brutalist look, maintaining a level of enterprise-grade refinement.

## Components

### Buttons
- **Primary:** Solid `#818CF8` background, `#070707` text. No shadow. 8px radius.
- **Secondary:** Transparent background, `Border Strong` outline, `#FAFAFA` text.
- **States:** Hover state for Primary shifts to `#6366F1`.

### Input Fields
- **Background:** `Surface 1`.
- **Border:** `Border Default`. On focus, border changes to `Accent`.
- **Label:** `Label-md` style, using `Text Secondary`.

### Cards & Widgets
- **Background:** `Surface 2`.
- **Border:** `Border Default`.
- **Header:** Include a 1px bottom border using `Border Subtle` to separate the widget title from its content.

### Status Chips
- Small, uppercase `Label-md` text.
- Backgrounds use low-opacity versions of semantic colors (Success: Green, Warning: Amber, Error: Red).
- Always pill-shaped (Full radius).

### Data Tables
- Header background: `Surface 1`.
- Row background: Transparent, with a 1px bottom border (`Border Subtle`).
- High-density spacing: 8px vertical padding per row.