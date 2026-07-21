---
name: Industrial Intelligence Framework
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
  display-lg:
    fontFamily: Bebas Neue
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.03em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.03em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  headline-lg-mobile:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  xxl: 64px
  grid_max_width: 1280px
  gutter: 24px
---

## Brand & Style

The design system is engineered for mission-critical industrial operations. It prioritizes data density, mechanical precision, and immediate legibility over decorative trends. The aesthetic is "Industrial Dark," evoking the high-contrast environments of modern control rooms and automated factories. 

The personality is authoritative, cold, and efficient. It uses a **Corporate / Modern** approach fused with **Brutalism**'s structural honesty. High-fidelity layouts rely on a rigid engineering grid and a high-contrast monochromatic base to ensure that data visualizations and system alerts remain the primary focus. 

Visual signatures include:
- A structural engineering grid backdrop.
- Sharp, defined borders and mathematical spacing.
- A restrained use of indigo accents for interactive states and primary actions.
- Absence of soft shadows, blurs, or skeuomorphic depth.

## Colors

This design system utilizes a deep-space monochromatic palette designed to reduce eye strain in 24/7 operating environments. The color hierarchy is strictly functional:

- **Base Layers:** The `#070707` background provides the ultimate contrast for readability. Surface tiers (1-3) are used to create structural depth and grouping.
- **Accents:** Indigo (`#818CF8`) is reserved for primary interaction points and active system states. It should never be used for non-interactive elements.
- **Borders:** Three levels of transparency define the geometry of the interface. `border-subtle` is used for background grids and non-essential separators, while `border-strong` defines interactive components like inputs and buttons.
- **Status (Semantic):** Use standard industrial colors (Red/Yellow/Green) only for system health and alerts, ensuring they are not diluted by brand colors.

## Typography

The typographic system balances high-impact information hierarchy with technical readability. 

- **Headlines (Bebas Neue):** Used for primary page titles, large KPI values, and section headers. Its condensed, bold nature allows for high-impact labels that feel industrial and authoritative.
- **Body & Interface (Manrope):** All functional text, data tables, and descriptions use Manrope. Its geometric yet open letterforms ensure legibility in dense data environments.
- **Data Display:** For numerical values within charts or tables, prioritize `body-md` with tabular lining figures if available to ensure columns align perfectly.
- **Case Usage:** Use `label-caps` for table headers and small metadata tags to distinguish them from actionable body content.

## Layout & Spacing

This design system employs a rigid 8px linear grid system. All dimensions, padding, and margins must be multiples of 8.

- **Grid Model:** A 12-column fixed grid with a maximum width of 1280px. On smaller screens, the grid becomes fluid with 24px side margins.
- **The Engineering Grid:** A background pattern of `border-subtle` lines spaced at 32px intervals should be visible in the base layer to provide a sense of scale and alignment.
- **Responsibility:** On mobile devices, complex data tables should horizontal scroll rather than stack, maintaining the integrity of the data columns. Sidebars collapse into a 64px icon rail to maximize work area.
- **Transitions:** All state changes (hover, focus, active) use a 150ms linear fade. Avoid any "spring" or "bounce" physics that feel unprofessional or distracting.

## Elevation & Depth

In this design system, depth is communicated through **Tonal Layers** and **Borders**, not shadows. 

- **Z-Index 0 (Background):** `--bg-base` (#070707). Contains the engineering grid.
- **Z-Index 1 (Cards/Containers):** `--surface-1` (#101012). Used for primary content containers and KPI cards. Must have a `--border` to define its limits.
- **Z-Index 2 (Overlays/Modals):** `--surface-2` (#18181B). These elements use a slightly lighter surface to appear closer to the user.
- **Interaction:** Hover states on cards should not lift (no Y-axis movement). Instead, the border should transition to `--border-strong` or the background to `--surface-2`.
- **Outlines:** Use `--border-strong` for all interactive input fields to ensure they are clearly identifiable against the dark background.

## Shapes

The shape language is "Soft-Technical." While the system is rigorous, subtle rounding prevents the UI from feeling dangerously sharp or dated.

- **Containers:** KPI cards, charts, and main content areas use a **12px (rounded-lg)** radius.
- **Interactive Elements:** Buttons, inputs, and chips use an **8px (standard)** radius for a more compact, tool-like appearance.
- **Status Elements:** Status dots and utility tags use **Full (pill)** rounding to distinguish them from functional buttons.
- **Icons:** Use 24px bounding boxes with a 1.5pt or 2pt stroke weight. Icons must be outlined only; filled icons are reserved for active toggle states.

## Components

### Buttons
- **Primary:** Background `--accent`, text `#070707` (high contrast). No gradient.
- **Secondary:** Background transparent, border `--border-strong`, text `--text-primary`.
- **Tertiary/Ghost:** Background transparent, text `--text-secondary`, icon-only or text-only.

### KPI Cards
- **Structure:** Surface-1, 12px radius, 24px internal padding.
- **Content:** Title in `label-caps` (top left), large value in `headline-lg` (center/bottom left), and a trend indicator or status dot (top right).

### Input Fields
- **Default:** `--surface-2` background, `--border` stroke, 8px radius.
- **Focus:** Border transitions to `--accent`, no outer glow.
- **Typography:** `body-md` for user input, `label-caps` for field labels placed above the input.

### Status Indicators
- **Minimalist Dots:** 8px circles without backgrounds. 
- **Colors:** Success (#22C55E), Warning (#F59E0B), Critical (#EF4444).
- **Placement:** Always placed to the left of the associated label.

### Lists & Tables
- **Rows:** 48px minimum height for touch/click safety.
- **Dividers:** Use `border-subtle` between rows.
- **Header:** Background `--surface-2`, `label-caps` text, persistent on scroll.

### Critical Alerts
- High-priority alerts use a thick 4px left-border of the semantic color (e.g., Red) on a `--surface-2` card. Avoid full-color backgrounds for alerts to maintain dark-mode integrity.