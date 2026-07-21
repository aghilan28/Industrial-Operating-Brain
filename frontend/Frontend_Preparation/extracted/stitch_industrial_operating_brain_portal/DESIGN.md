---
name: Industrial Operating Brain
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
  display-xl:
    fontFamily: Bebas Neue
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: 0.04em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0.04em
  headline-sm:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.04em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: 0px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  mono-data:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.02em
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
  container-margin: 40px
  gutter: 16px
---

## Brand & Style
The design system is engineered for mission-critical industrial infrastructure. It communicates **Industrial Intelligence** through a high-density, technical aesthetic that prioritizes data integrity and system reliability.

The style is **Precision Minimalism**: a dark, high-contrast environment that removes all decorative flourishes in favor of structural clarity. The interface utilizes a digital "monolith" approach—deep blacks, subtle obsidian layering, and sharp indigo accents—to evoke the feeling of a sophisticated command center. A permanent engineering grid background (1px lines at 32px intervals) provides a subconscious sense of alignment and structural stability.

## Colors
The palette is built on a "True Dark" foundation to reduce eye strain in low-light industrial environments and maximize the luminance of data points. 

- **Foundations:** The background is absolute black (#070707). Layering is achieved through increasing values of cool greys rather than shadows.
- **Accents:** A singular Indigo hue (#818CF8) is used exclusively for interactive states and primary focus points. 
- **Borders:** Interaction and structure are defined by semi-transparent white strokes. This creates a "blueprint" feel where lines are as important as surfaces.

## Typography
The typographic system utilizes a high-contrast pairing to distinguish between "Status" and "Information."

- **Headers:** Bebas Neue provides an authoritative, industrial scale. It must always be used with wide tracking (4-5%) and in uppercase for headlines to mimic architectural signage and heavy machinery labeling.
- **Body:** Manrope is the workhorse for all data-heavy contexts. Its modern, geometric construction maintains legibility at small scales in complex dashboards.
- **Data Display:** For numerical values, sensor readings, and timestamps, use a monospaced variant to ensure tabular alignment and rapid scanning.

## Layout & Spacing
The design system operates on a **Strict 8px Grid**. Every element—from icon sizing to component height—must be a multiple of 8.

- **Grid:** A 12-column fluid grid is used for desktop dashboards.
- **Engineering Underlay:** A subtle 32px background grid helps developers align large-scale modules and cards.
- **Density:** High information density is preferred. Padding should be efficient (16px standard for card internals) to allow more data visibility on a single screen.
- **Mobile:** On mobile devices, margins shrink to 16px, and columns collapse to a single stack, while maintaining the 8px vertical rhythm.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** and **Strokes** rather than shadows. Shadows are strictly prohibited to maintain the "flat-technical" aesthetic.

- **Level 0 (Base):** #070707 - Used for the main canvas and background grid.
- **Level 1 (Surface):** #101012 - Used for primary layout sections (sidebars, top nav).
- **Level 2 (Modules):** #18181B - Used for cards and secondary containers.
- **Level 3 (Interactive):** #27272A - Used for hover states on list items and inputs.

Every elevation change must be accompanied by a 1px border (`border-default`) to clearly define the geometry of the interface.

## Shapes
Shapes are disciplined and functional. We use a "Soft Industrial" radius that avoids the aggression of sharp corners while maintaining a professional, non-consumerist feel.

- **Components:** Buttons, inputs, and tags use an 8px radius.
- **Containers:** Large modules and cards use a 12px radius to create a clear visual distinction between the "frame" and the "content."
- **Icons:** Use a 1.5pt stroke weight with slightly rounded caps to match the font geometry of Manrope.

## Components
- **Buttons:** Primary buttons are solid `accent-default` with black text. Secondary buttons use a `border-default` with `text-primary`. State changes are immediate: no easing, just a direct switch to `accent-hover`.
- **Cards:** Cards use `surface-2` with a `border-default`. Header areas within cards should be separated by a `border-subtle` horizontal line.
- **Inputs:** Backgrounds use `surface-1` with a `border-default`. On focus, the border changes to `accent-default` and a subtle 2px outer ring of `accent-bg` is applied.
- **Data Chips:** Small, rectangular indicators with `accent-bg` backgrounds and `accent-default` text. These are used for status codes and machine states.
- **Lists:** High-density rows with `border-subtle` bottom separators. Hovering a row triggers a `surface-3` background fill.
- **Status Indicators:** Use a 8px solid circle. Green (#10B981) for Operational, Amber (#F59E0B) for Warning, and Red (#EF4444) for Critical. These are the only colors allowed outside the core palette.