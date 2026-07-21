# Phase 1 — Foundation Audit

## 1. Template Audit Summary

| Section | Classification | Notes |
|---|---|---|
| Body background / noise / grid / top-glow | **Keep / Reusable** | Extracted as `<BackgroundLayers />` + global CSS. |
| Custom scrollbar | **Keep** | Global CSS. |
| Lenis + GSAP ScrollTrigger wiring | **Keep** | `src/lib/lenis.ts`, `src/lib/animations.ts`, `useLenis` hook. |
| Header (Vectorline branding + marketing nav) | **Replace** | Replaced with application-ready `AppHeader` (logo, breadcrumb, search placeholder, notifications, avatar, theme-toggle placeholder, connection-status placeholder). |
| Hero frame (indigo brackets + inner dots) | **Reusable** | `PanelFrame` variant `hero`, bracket="indigo", bracketSize="lg", withDots. Marketing copy removed; placeholders left. |
| Hero canvas / three.js wireframe | **Remove from foundation** | Three.js is kept as a dependency for Phase 2; no demo canvas rendered in placeholder page. Helpers remain available. |
| Label pills (Sync mesh / Route memory / Canvas load) | **Reusable** | `WidgetContainer` + `GlassCard` pill variant. |
| Session operators card | **Remove marketing** | Pattern preserved as `Avatar` + `AvatarStack`; demo avatars removed. |
| Core Architecture section (4 cards w/ three.js previews) | **Reusable pattern** | `Card`/`CardMedia`/`CardBody`, hover-accent top bar, grid overlay. Marketing copy removed. |
| Metric cards | **Reusable** | `Card` with metric treatment (uppercase labels, Bebas numerals). Dummy values removed. |
| Asset cards / gallery | **Reusable pattern** | Grayscale->color hover retained. Demo images removed. |
| Protocol rows (numbered steps) | **Reusable** | Step-number badge via `GlassCard` variant="step". Marketing copy removed. |
| Deployment section (sync diagram) | **Remove marketing** | Pattern reusable; content removed. |
| CTA footer panel (Vectorline + marketing columns) | **Replace** | Replaced by minimal `AppFooter` with application name/version/environment/copyright placeholders. |
| Bottom bar (Privacy / Terms) | **Replace** | Enterprise footer bar only. |
| Google Analytics (`G-2M6V79H761`) | **Remove** | Removed. |
| Iconify | **Keep** | Swapped CDN `<script>` for `@iconify/react` (tree-shakable). |
| Three.js CDN | **Replace** | Packaged dependency `three`. |
| GSAP CDN | **Replace** | Packaged dependency `gsap`. |
| Lenis CDN | **Replace** | Packaged dependency `lenis`. |
| Tailwind CDN | **Replace** | Proper Tailwind build pipeline. |

## 2. Marketing Content Removed

- Vectorline / Aura branding references (replaced with IOB placeholder identity).
- Marketing headlines and body copy.
- "Session operators" avatars.
- Pricing, About, Careers, Changelog, Contact footer links.
- Marketing CTAs ("Start mapping", "Inspect assets", "Open console", "Initialize sync", "Log in").
- Dummy metrics (86 Collaborators, 1,248 Decision routes, 34h Time recovered; 41.8k Route memory; Sync mesh 98%; Canvas load bars; Grid 128×72; Vectors 7,504; Assets 319; Revision R-27C; Build 08.42).
- Demo asset images (5 Supabase-hosted thumbnails).
- Hero operator headshots.
- Google Analytics snippet.
- Unused CDN script tags (Tailwind, GSAP, Three, Lenis, Iconify) — all packaged via npm.

## 3. Design Tokens (src/tokens/index.ts)

Colors, typography, spacing, radius, shadows, gradients, animation, transition, zIndex, layout, breakpoints all captured from the template. All components consume the tokens; no hardcoded visual values in components.

## 4. Reusable Components

### `src/components/ui/`
- `PanelFrame` (corner brackets, dots, hero/default/dark/darker/footer gradients)
- `Card`, `CardMedia`, `CardBody`
- `GlassCard` (pill/subcard/step variants)
- `Button`, `IconButton` (primary/secondary/ghost/nav, sm/md/lg)
- `Badge`, `StatusBadge`, `Chip` (with dot + pulse)
- `Avatar`, `AvatarStack`
- `ScrollArea` (Lenis-prevented)
- `Tooltip` (CSS-driven)
- `Dropdown`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Modal`, `Drawer` (portals)
- `Notification`
- `TableContainer`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`

### `src/components/forms/`
- `Input`, `SearchInput`, `TextArea`
- `Checkbox`, `Switch`

### `src/components/feedback/`
- `Spinner`, `Skeleton`, `Toast`

### `src/components/layout/`
- `PageContainer`, `SectionContainer`, `ContentContainer`, `WidgetContainer`, `GridContainer`, `FlexContainer`, `Divider`
- `DashboardLayout`, `AuthLayout`, `PageLayout`, `SplitLayout`, `CenteredLayout`
- `AppFooter`

### `src/components/navigation/`
- `AppHeader`, `Sidebar`

### `src/components/animation/`
- `Reveal` (scroll-triggered generic wrapper)

### `src/components/providers/`, `src/components/shared/`
- `RootProviders`, `BackgroundLayers`

## 5. Layouts

- `DashboardLayout` — header + collapsible, scrollable, keyboard-accessible sidebar (with nested menus, active/hover states) + content + footer. Mobile drawer included.
- `AuthLayout` — split layout placeholder for Phase 3 Login.
- `PageLayout`, `SplitLayout`, `CenteredLayout` — structural primitives.

## 6. Animation System

`src/lib/animations.ts` exports `revealFrame`, `revealBlockChildren`, `revealStagger`, `drawConnectors`, `splitHeadingReveal`, `fadeSlideIn`, `parallaxImage`, `refreshScroll`. Lenis is wired via `useLenis` in `RootProviders`.

## 7. Accessibility

- Semantic `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>`, `<article>`.
- ARIA labels on all icon-only buttons and landmarks.
- Visible focus states via `.focus-ring` utility.
- `prefers-reduced-motion` disables animations.
- Keyboard accessible sidebar (button toggles, aria-expanded/aria-current, Escape to close).

## 8. Performance

- All libraries (GSAP, Lenis, Three, Iconify) are now packaged imports — no render-blocking CDN scripts.
- Tailwind is purged to used classes.
- "use client" only applied to interactive components; root layout and tokens remain server-compatible.

## 9. Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts, providers, background layers
│   └── page.tsx            # Phase 1 placeholder page
├── components/
│   ├── ui/                 # Reusable primitive components
│   ├── layout/             # Layout shells and containers
│   ├── navigation/         # AppHeader, Sidebar
│   ├── feedback/           # Spinner, Skeleton, Toast
│   ├── forms/              # Input, SearchInput, TextArea, Checkbox, Switch
│   ├── animation/          # Reveal
│   ├── providers/          # RootProviders
│   └── shared/             # BackgroundLayers
├── hooks/                  # useLenis, useReducedMotion, useMediaQuery
├── lib/                    # animations, lenis
├── styles/                 # globals.css
├── tokens/                 # design tokens
├── constants/              # navigation, app config
├── types/                  # shared TS types
└── utils/                  # cn (clsx + tailwind-merge)
```

## 10. Quality Gate Checklist

- [x] Application builds (`next build` succeeds).
- [x] TypeScript strict mode passes.
- [x] Visual language preserved — corner brackets, shadows, gradients, glass cards, buttons, panels, scrollbar, typography, Bebas Neue display, Manrope body.
- [x] Marketing content removed (Vectorline/Aura branding, CTAs, demo metrics/avatars/images, footer links, GA).
- [x] Reusable, typed, generic components (no page-specific logic).
- [x] Header / Sidebar / Footer shells ready for Phase 2 wiring.
- [x] Accessibility + reduced-motion support.
- [x] Phase 2 (routing) and Phase 3 (Login) can layer on without refactor.
