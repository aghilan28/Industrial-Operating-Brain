---
name: IOB Core
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c6c5d5'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
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
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-lg:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: 0.04em
  display-lg-mobile:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.04em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '600'
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
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
  3xl: 48px
  4xl: 64px
  container-margin: 32px
  gutter: 16px
---

## Brand & Style
The design system is engineered for the Industrial Operating Brain (IOB), emphasizing precision, high-density information display, and mission-critical reliability. The brand personality is rooted in Industry 5.0 principles—harmonizing human intuition with machine intelligence.

The visual style is **Engineering-grade Minimalism**. It rejects decorative flourishes in favor of structural clarity and functional aesthetics. The UI utilizes a "Dark Lab" environment, reducing eye strain for operators in control room settings while ensuring that data visualizations remain the focal point. Expect a rigid, high-contrast interface where depth is communicated through subtle tonal stacking rather than shadows or blurs.

## Colors
The palette is strictly monochromatic with a singular functional accent. 

- **Foundation:** The system uses a tiered dark-mode hierarchy starting from `#070707` to maintain deep contrast levels.
- **Accents:** `#818CF8` (Indigo) is the exclusive color for interactivity and primary state indication.
- **Borders:** Borders are the primary method of separation. Use `border-subtle` for decorative dividers and `border-strong` for interactive component boundaries.
- **Strict Constraint:** Gradients and neon effects are prohibited. All colors must be flat and solid to ensure legibility across industrial-grade monitors.

## Typography
Typography is split between high-impact identifiers and high-readability data.

- **Headings:** Bebas Neue provides an authoritative, industrial look. Use it for page titles, KPI values, and section headers. Its condensed nature allows for larger sizes without consuming excessive horizontal space.
- **Body & Data:** Manrope is used for all functional text. It offers a balanced, modern grotesque feel that remains legible at small sizes.
- **Formatting:** Use `label-sm` in uppercase for table headers and category labels. For telemetry and numerical values, ensure a medium or semi-bold weight to maintain prominence against the dark background.

## Layout & Spacing
This design system utilizes a **Strict 8px Grid**. All dimensions, padding, and margins must be increments of 8.

- **Grid Model:** A 12-column fluid grid is used for desktop, shifting to a 4-column layout for mobile.
- **Density:** To accommodate "Operating Brain" requirements, the default density is high. Use `md` (16px) for standard internal padding and `sm` (8px) for tightly coupled elements.
- **Breakpoints:**
  - Desktop: 1280px+ (12 columns)
  - Tablet: 768px - 1279px (8 columns)
  - Mobile: < 768px (4 columns)

## Elevation & Depth
Elevation in this system is achieved through **Tonal Layering** and **Strong Borders**. 

- **Surface Stacking:**
  - Level 0: `--bg-base` (#070707) - The application canvas.
  - Level 1: `--surface-1` (#101012) - Main navigation sidebars or background card containers.
  - Level 2: `--surface-2` (#18181B) - Individual widgets or table rows.
  - Level 3: `--surface-3` (#27272A) - Overlays, dropdowns, and tooltips.
- **Outlines:** Never use ambient shadows. Use `--border` to define the shape of elements and `--border-strong` to indicate focus or active states.

## Shapes
Shapes are geometric and controlled, reflecting an industrial machine-part aesthetic.

- **Standard:** Use 8px (`rounded-md`) for cards, buttons, and input fields.
- **Large:** Use 12px (`rounded-lg`) for large layout containers or primary modal windows.
- **Interactive:** Use "Full" (Pill) only for status badges and specific toggle switches.
- **Strict Constraint:** Do not use overly rounded or "bubbly" shapes. Sharp edges are preferred over soft curves to maintain a professional, engineering-focused atmosphere.

## Components
Consistent implementation of core industrial components:

### KPI Cards
- **Background:** `--surface-1`.
- **Border:** 1px solid `--border`.
- **Value:** Use `display-lg` in `text-primary`.
- **Trend:** Small indicator in `text-secondary` with a simple chevron icon.

### Enterprise Tables
- **Header:** Background `--surface-2`, Text `label-sm` (`text-tertiary`).
- **Rows:** Border-bottom 1px `--border-subtle`. 
- **Hover State:** Background `--surface-3`.
- **Data:** Use `mono-data` for numerical columns to ensure alignment.

### Status Badges
- **Shape:** Pill-shaped (Full).
- **Styling:** Neutral background `--surface-3` with a small dot using the `--accent` color to indicate "Online" or "Active" status. No bright color fills.

### Buttons & Inputs
- **Primary Button:** Background `--accent`, Text `#070707` (high contrast black), `rounded-md`.
- **Secondary Button:** Background transparent, Border `--border-strong`, Text `text-primary`.
- **Input Fields:** Background `--bg-base`, Border `--border`, placeholder in `text-tertiary`. On focus, border changes to `--accent`.

### Machine Pickers & Charts
- **Charts:** Use thin 1px lines. No area fills under lines unless using `--accent-bg` at 10% opacity. 
- **Pickers:** Use a list-based selection with `--surface-2` as the selected state background.