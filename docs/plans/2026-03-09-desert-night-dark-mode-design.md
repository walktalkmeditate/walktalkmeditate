# Desert Night Dark Mode

## Overview

A dark mode for walk·talk·meditate that transforms the site into a desert night experience. The warm sand palette inverts to dark earth tones, firefly particles become a layered starry sky, and a campfire/stars toggle gives users control.

## Color System

CSS custom properties on `:root` and `[data-theme="dark"]`. The sand scale reverses and shifts warmer/darker.

| Role | Light | Dark |
|------|-------|------|
| Background | sand-50 #FAFAF7 | dusk-950 ~#141311 |
| Surface | sand-100 #F5F5F0 | dusk-900 ~#1C1A17 |
| Border | sand-200 #E8E6DF | dusk-800 ~#2B2926 |
| Muted | sand-300 #D4D1C7 | dusk-700 ~#3D3A35 |
| Secondary text | sand-500 #918C7E | dusk-400 ~#8A8578 |
| Body text | sand-700 #4A4740 | dusk-200 ~#D4D1C7 |
| Headings | sand-800 #2D2B28 | dusk-100 ~#EEECE7 |
| Accent | sage #7C9070 | sage-light #8FA382 |

## Particle System

### Light Mode (unchanged)

Fireflies (wandering glowing dots) and expanding ripples. No changes from current behavior.

### Dark Mode: Layered Night Sky

**Fixed twinkling stars:**
- 30-40 small dots (1-3px), randomly positioned, fixed in place
- Opacity pulse 0.3 → 1.0 → 0.3 at varying speeds (2-6s cycles)
- Mix of warm white (#EEECE7) and faint amber (#D4C5A0)

**Shooting stars:**
- Thin streak with soft glow tail
- Slow diagonal arc across partial viewport
- One every 15-30s (rare, special)
- Amber-white, fades out at end of arc

**Ripples:**
- Shift to softer moonlit silver tone
- Slightly more transparent than light mode

## Toggle Component

**Placement:** Header, right side near nav links.

**Icons:**
- Light mode active: campfire SVG (flame shapes above crossed logs)
- Dark mode active: star cluster SVG (3-4 small stars)

**Behavior:**
- Fade/scale transition (~200ms) on click
- Persists in localStorage
- First visit defaults to `prefers-color-scheme`
- No flash of wrong theme (inline script in `<head>` before render)

## Technical Approach

- `<html data-theme="dark">` attribute for theme state
- Tailwind `darkMode: ['selector', '[data-theme="dark"]']`
- CSS custom properties for all color tokens
- Inline `<script>` in BaseLayout `<head>` for flash prevention
- Particles.astro branches: light → fireflies, dark → stars + shooting stars
- ThemeToggle component in Header

## What Stays the Same

- Typography (fonts, sizes, spacing)
- Layout and structure
- All content and navigation patterns
- Breathing dots (color shifts to light sand)
- Reading progress bar (shifts to sage-dark)
