# Desert Night Dark Mode — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "desert night" dark mode with inverted warm palette, layered starry sky particles, and a campfire/stars theme toggle.

**Architecture:** CSS custom properties on `:root` / `[data-theme="dark"]` drive all colors. Tailwind's `darkMode: ['selector', '[data-theme="dark"]']` enables `dark:` utilities. An inline `<head>` script prevents flash. Particles.astro branches behavior based on theme.

**Tech Stack:** Astro 5, Tailwind CSS 3, vanilla JS (no new dependencies)

---

### Task 1: Tailwind Config — Enable Dark Mode Selector

**Files:**
- Modify: `tailwind.config.mjs`

**Step 1: Add darkMode and dusk palette**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FAFAF7',
          100: '#F5F5F0',
          200: '#E8E6DF',
          300: '#D4D1C7',
          400: '#B5B1A4',
          500: '#918C7E',
          600: '#6E6A5E',
          700: '#4A4740',
          800: '#2D2B28',
          900: '#1A1917',
        },
        dusk: {
          100: '#EEECE7',
          200: '#D4D1C7',
          300: '#B5B1A4',
          400: '#8A8578',
          500: '#6E6A5E',
          600: '#4A4740',
          700: '#3D3A35',
          800: '#2B2926',
          900: '#1C1A17',
          950: '#141311',
        },
        sage: {
          DEFAULT: '#7C9070',
          light: '#8FA382',
        },
      },
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '38rem',
        wide: '48rem',
      },
      letterSpacing: {
        display: '-0.02em',
      },
    },
  },
  plugins: [],
};
```

Note: `sage` changes from a plain string to an object with `DEFAULT` and `light`. All existing `text-sage`, `bg-sage` references continue to work because of `DEFAULT`.

**Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build completes with no errors.

**Step 3: Commit**

```bash
git add tailwind.config.mjs
git commit -m "feat: add dark mode selector and dusk palette to Tailwind config"
```

---

### Task 2: Global CSS — Dark Mode Base Styles and Particle Keyframes

**Files:**
- Modify: `src/styles/global.css`

**Step 1: Add dark base styles and star/shooting-star keyframes**

After the existing `@layer base` block (line 19), and within the existing animation sections, apply these changes:

1. Update the `@layer base` block to include dark overrides:

```css
@layer base {
  html {
    @apply bg-sand-50 text-sand-800;
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
  }

  [data-theme="dark"] {
    @apply bg-dusk-950 text-dusk-200;
  }

  body {
    @apply font-body text-lg leading-relaxed;
  }

  ::selection {
    @apply bg-sage/20;
  }

  [data-theme="dark"] ::selection {
    @apply bg-sage-light/20;
  }
}
```

2. Add dark-mode variants for existing particle styles. After the `.firefly` block (after line 50), add:

```css
[data-theme="dark"] .firefly {
  display: none;
}
```

3. After the `.ripple` block (after line 79), add dark ripple override:

```css
[data-theme="dark"] .ripple {
  border-color: rgba(212, 209, 199, 0.15);
}
```

4. After the breathing-dot styles (after line 122), add dark override:

```css
[data-theme="dark"] .breathing-dot {
  background: theme('colors.dusk.400');
}
```

5. Add new star keyframes after the ripple-expand keyframes (after line 79, before scroll reveal):

```css
/* ---- Stars (dark mode) ---- */

.star {
  position: absolute;
  border-radius: 50%;
  background: #EEECE7;
  animation: twinkle ease-in-out infinite;
}

.star--amber {
  background: #D4C5A0;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

/* ---- Shooting stars (dark mode) ---- */

.shooting-star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #EEECE7;
  border-radius: 50%;
  box-shadow: 0 0 4px 1px rgba(212, 197, 160, 0.6);
  animation: shoot linear forwards;
  opacity: 0;
}

@keyframes shoot {
  0% {
    opacity: 0;
    transform: translate(0, 0);
  }
  5% {
    opacity: 1;
  }
  70% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: translate(var(--shoot-x), var(--shoot-y));
  }
}
```

6. Update prose-content dark mode overrides. After the existing `.prose-content` styles (after line 239), add:

```css
/* ---- Prose dark mode ---- */

[data-theme="dark"] .prose-content p {
  @apply text-dusk-200;
}

[data-theme="dark"] .prose-content h2,
[data-theme="dark"] .prose-content h3,
[data-theme="dark"] .prose-content h4 {
  @apply text-dusk-100;
}

[data-theme="dark"] .prose-content ul,
[data-theme="dark"] .prose-content ol {
  @apply text-dusk-200;
}

[data-theme="dark"] .prose-content ul > li::marker {
  @apply text-dusk-700;
}

[data-theme="dark"] .prose-content ol > li::marker {
  @apply text-dusk-400;
}

[data-theme="dark"] .prose-content blockquote {
  @apply text-dusk-400 border-dusk-700;
}

[data-theme="dark"] .prose-content blockquote p {
  @apply text-dusk-400;
}

[data-theme="dark"] .prose-content a {
  @apply text-dusk-100 decoration-dusk-700 hover:decoration-sage-light;
}

[data-theme="dark"] .prose-content strong {
  @apply text-dusk-100;
}

[data-theme="dark"] .prose-content hr {
  @apply border-dusk-800;
}

[data-theme="dark"] .prose-content thead {
  @apply border-dusk-800;
}

[data-theme="dark"] .prose-content th {
  @apply text-dusk-400;
}

[data-theme="dark"] .prose-content td {
  @apply text-dusk-200 border-dusk-900;
}
```

**Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build completes with no errors.

**Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add dark mode base styles, star keyframes, and prose overrides"
```

---

### Task 3: Flash Prevention Script + Theme Data Attribute in BaseLayout

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Step 1: Add inline theme-init script in `<head>` and data-theme to `<html>`**

The `<html>` tag on line 16 changes to:

```html
<html lang="en" data-theme="">
```

Add this inline script immediately after the `<title>` tag (line 44), before `</head>`:

```html
<script is:inline>
  (function() {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

`is:inline` is critical — it tells Astro not to bundle/defer this script, so it runs before paint.

**Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build completes. The `<html>` tag in output has `data-theme=""` and the inline script appears in `<head>`.

**Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: add theme flash prevention script in head"
```

---

### Task 4: ThemeToggle Component

**Files:**
- Create: `src/components/ThemeToggle.astro`

**Step 1: Create the ThemeToggle component**

```astro
---
---

<button
  id="theme-toggle"
  class="p-2 text-sand-400 hover:text-sand-600 dark:text-dusk-400 dark:hover:text-dusk-200 transition-colors"
  aria-label="Toggle theme"
>
  <svg id="icon-campfire" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3c-1 4-4 6-4 10a4 4 0 0 0 8 0c0-4-3-6-4-10z" />
    <path d="M8 21h8" />
    <path d="M6 21l2-4" />
    <path d="M18 21l-2-4" />
  </svg>
  <svg id="icon-stars" class="w-5 h-5 hidden" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <circle cx="6" cy="6" r="1.5" />
    <circle cx="18" cy="4" r="1" />
    <circle cx="14" cy="10" r="1.5" />
    <circle cx="4" cy="14" r="1" />
    <circle cx="20" cy="16" r="1.5" />
    <circle cx="10" cy="18" r="1" />
  </svg>
</button>

<script>
  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    const iconCampfire = document.getElementById('icon-campfire');
    const iconStars = document.getElementById('icon-stars');
    if (!btn || !iconCampfire || !iconStars) return;

    function updateIcons() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      iconCampfire.classList.toggle('hidden', isDark);
      iconStars.classList.toggle('hidden', !isDark);
    }

    updateIcons();

    btn.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateIcons();
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: next } }));
    });
  }

  initThemeToggle();
  document.addEventListener('astro:after-swap', initThemeToggle);
</script>

<style>
  #theme-toggle {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  #theme-toggle:active {
    transform: scale(0.9);
  }
</style>
```

The toggle dispatches a `theme-changed` custom event so Particles.astro can react.

**Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build completes with no errors.

**Step 3: Commit**

```bash
git add src/components/ThemeToggle.astro
git commit -m "feat: add ThemeToggle component with campfire/stars icons"
```

---

### Task 5: Add ThemeToggle to Header

**Files:**
- Modify: `src/components/Header.astro`

**Step 1: Import and place ThemeToggle**

Add import at top of frontmatter (after line 1):

```astro
import ThemeToggle from './ThemeToggle.astro';
```

In the desktop nav `<ul>` (line 34), add the toggle after the last `{navItems.map(...)}`:

```html
<ul class="hidden md:flex items-center gap-8 font-ui text-[13px] tracking-wide">
  {navItems.map(item => (
    <li>
      <a href={item.href} class="nav-link text-sand-400 hover:text-sand-700 dark:text-dusk-400 dark:hover:text-dusk-200 transition-colors">
        {item.label}
      </a>
    </li>
  ))}
  <li><ThemeToggle /></li>
</ul>
```

For mobile, add ThemeToggle before the hamburger button. Place it in a flex container with the hamburger (line 23-32):

```html
<div class="flex items-center gap-2 md:hidden">
  <ThemeToggle />
  <button
    id="menu-toggle"
    class="p-2 text-sand-400 hover:text-sand-600 dark:text-dusk-400 dark:hover:text-dusk-200"
    aria-label="Toggle menu"
    aria-expanded="false"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
</div>
```

**Step 2: Add dark: classes to all Header color references**

Update these existing classes throughout the file:
- `text-sand-800` → add `dark:text-dusk-100`
- `text-sand-400` → add `dark:text-dusk-400`
- `text-sand-700` → add `dark:text-dusk-200`
- `text-sand-600` → add `dark:text-dusk-300`

**Step 3: Verify build succeeds**

Run: `npm run build`
Expected: Build completes with no errors.

**Step 4: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: add theme toggle to header with dark mode colors"
```

---

### Task 6: Dark Mode Particles — Stars and Shooting Stars

**Files:**
- Modify: `src/components/Particles.astro`

**Step 1: Rewrite Particles.astro to branch on theme**

Replace the entire `<script>` content with:

```astro
---
---

<script>
  function spawnEffects() {
    var container = document.getElementById('particles');
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      spawnStars(container);
      scheduleShootingStar(container);
    } else {
      spawnFireflies(container);
    }

    spawnRipples(container);
  }

  function spawnFireflies(container) {
    var count = Math.min(10, Math.floor(window.innerWidth / 140));
    for (var i = 0; i < count; i++) {
      var f = document.createElement('div');
      f.className = 'firefly';
      f.style.left = (5 + Math.random() * 90) + '%';
      f.style.top = (10 + Math.random() * 80) + '%';
      f.style.animationDuration = (4 + Math.random() * 6) + 's';
      f.style.animationDelay = (Math.random() * 8) + 's';
      f.style.setProperty('--wander-x', (-30 + Math.random() * 60) + 'px');
      f.style.setProperty('--wander-y', (-20 + Math.random() * 40) + 'px');
      container.appendChild(f);
    }
  }

  function spawnStars(container) {
    var count = 30 + Math.floor(Math.random() * 11);
    for (var i = 0; i < count; i++) {
      var s = document.createElement('div');
      var isAmber = Math.random() > 0.65;
      s.className = 'star' + (isAmber ? ' star--amber' : '');
      var size = 1 + Math.random() * 2;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 100) + '%';
      s.style.animationDuration = (2 + Math.random() * 4) + 's';
      s.style.animationDelay = (Math.random() * 5) + 's';
      container.appendChild(s);
    }
  }

  function scheduleShootingStar(container) {
    if (!document.getElementById('particles')) return;
    if (document.documentElement.getAttribute('data-theme') !== 'dark') return;

    setTimeout(function() {
      if (document.documentElement.getAttribute('data-theme') !== 'dark') return;

      var star = document.createElement('div');
      star.className = 'shooting-star';
      star.style.left = (10 + Math.random() * 60) + '%';
      star.style.top = (5 + Math.random() * 40) + '%';

      var dx = 80 + Math.random() * 120;
      var dy = 40 + Math.random() * 80;
      star.style.setProperty('--shoot-x', dx + 'px');
      star.style.setProperty('--shoot-y', dy + 'px');
      star.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';

      container.appendChild(star);
      star.addEventListener('animationend', function() { star.remove(); });

      scheduleShootingStar(container);
    }, 15000 + Math.random() * 15000);
  }

  function spawnRipples(container) {
    function spawn() {
      if (!document.getElementById('particles')) return;
      var r = document.createElement('div');
      r.className = 'ripple';
      r.style.left = (10 + Math.random() * 80) + '%';
      r.style.top = (10 + Math.random() * 80) + '%';
      container.appendChild(r);
      r.addEventListener('animationend', function() { r.remove(); });
      setTimeout(spawn, 3000 + Math.random() * 5000);
    }
    setTimeout(spawn, 1000 + Math.random() * 2000);
  }

  window.addEventListener('theme-changed', function() {
    spawnEffects();
  });

  spawnEffects();
  document.addEventListener('astro:after-swap', spawnEffects);
</script>
```

**Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build completes with no errors.

**Step 3: Commit**

```bash
git add src/components/Particles.astro
git commit -m "feat: add starry sky and shooting stars for dark mode particles"
```

---

### Task 7: Dark Mode Colors for All Remaining Components

**Files:**
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/components/Navigation.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/components/PillarCard.astro`
- Modify: `src/components/QuestionCard.astro`
- Modify: `src/components/SilenceTag.astro`
- Modify: `src/pages/index.astro`

**Step 1: ContentLayout.astro**

Line 30 — the `<h1>` in the article wrapper:
- `text-sand-800` → add `dark:text-dusk-100`

**Step 2: Navigation.astro**

- Line 46, section title: `text-sand-300` → add `dark:text-dusk-700`
- Line 58, active link: `text-sand-800` → add `dark:text-dusk-100`
- Line 59, inactive link: `text-sand-400 hover:text-sand-600` → add `dark:text-dusk-400 dark:hover:text-dusk-200`

**Step 3: Footer.astro**

- Line 7, border + text: `border-sand-200` → add `dark:border-dusk-800`; `text-sand-400` → add `dark:text-dusk-400`
- Line 10, 17, 22, link hover: `hover:text-sand-600` → add `dark:hover:text-dusk-200`

**Step 4: PillarCard.astro**

- Line 12, title: `text-sand-800` → add `dark:text-dusk-100`; `group-hover:text-sage` → add `dark:group-hover:text-sage-light`
- Line 15, description: `text-sand-500` → add `dark:text-dusk-400`

**Step 5: QuestionCard.astro**

- Line 10, border: `border-sand-100` → add `dark:border-dusk-900`
- Line 11, text: `text-sand-700` → add `dark:text-dusk-200`
- Line 12, stage label: `text-sand-300` → add `dark:text-dusk-700`

**Step 6: SilenceTag.astro**

- Line 4, borders: `border-sand-200` → add `dark:border-dusk-800`
- Line 5, title: `text-sand-800` → add `dark:text-dusk-100`
- Line 6, description: `text-sand-500` → add `dark:text-dusk-400`

**Step 7: index.astro (homepage)**

- Line 15, h1: `text-sand-800` → add `dark:text-dusk-100`
- Line 18, subtitle: `text-sand-400` → add `dark:text-dusk-400`
- Line 23, 41, 63, 78 — dividers: `border-sand-200` → add `dark:border-dusk-800`
- Line 27, body text: `text-sand-600` → add `dark:text-dusk-300`
- Line 35, emphasis: `text-sand-800` → add `dark:text-dusk-100`
- Lines 68, 83 — CTA links: `text-sand-800` → add `dark:text-dusk-100`; `hover:text-sage` → add `dark:hover:text-sage-light`
- Lines 71, 86 — CTA arrows: `text-sand-300` → add `dark:text-dusk-700`; `group-hover:text-sage` → add `dark:group-hover:text-sage-light`
- Lines 73, 88 — CTA subtext: `text-sand-400` → add `dark:text-dusk-400`

**Step 8: Also update body background in BaseLayout.astro**

- Line 46, body: `min-h-screen` → add `dark:bg-dusk-950`
- Line 47, reading progress bar: `bg-sage/40` → add `dark:bg-sage-light/40`

**Step 9: Verify build succeeds**

Run: `npm run build`
Expected: Build completes with no errors.

**Step 10: Commit**

```bash
git add src/layouts/ContentLayout.astro src/components/Navigation.astro src/components/Footer.astro src/components/PillarCard.astro src/components/QuestionCard.astro src/components/SilenceTag.astro src/pages/index.astro src/layouts/BaseLayout.astro
git commit -m "feat: add dark mode colors to all components and pages"
```

---

### Task 8: Visual Verification

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Verify light mode is unchanged**

Open browser. The site should look exactly the same as before — no visual regressions.

**Step 3: Toggle to dark mode**

Click the campfire icon. Verify:
- Background shifts to deep warm dark (#141311)
- Text shifts to light sand tones
- Stars twinkle in the background
- A shooting star appears within 15-30 seconds
- Ripples shift to moonlit silver
- Campfire icon swaps to stars icon
- Navigation, footer, prose content all use dark palette

**Step 4: Verify persistence**

Refresh the page. Dark mode should persist (no flash of light mode).

**Step 5: Verify system preference fallback**

Clear localStorage. Set OS to dark mode. Reload — site should be dark. Set OS to light — site should be light.

**Step 6: Check all pages**

Navigate through: homepage, a pillar page (Walk), a guide page, questions page, an ethos page. All should display correctly in both modes.

**Step 7: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: dark mode visual polish and adjustments"
```

---

### Summary of All Files Touched

| File | Action |
|------|--------|
| `tailwind.config.mjs` | Modify — add darkMode, dusk palette, sage object |
| `src/styles/global.css` | Modify — dark base, star keyframes, prose overrides |
| `src/layouts/BaseLayout.astro` | Modify — data-theme attr, flash script, dark body |
| `src/components/ThemeToggle.astro` | Create — campfire/stars toggle |
| `src/components/Header.astro` | Modify — import toggle, dark colors |
| `src/components/Particles.astro` | Modify — star/shooting-star spawning |
| `src/layouts/ContentLayout.astro` | Modify — dark heading color |
| `src/components/Navigation.astro` | Modify — dark nav colors |
| `src/components/Footer.astro` | Modify — dark footer colors |
| `src/components/PillarCard.astro` | Modify — dark card colors |
| `src/components/QuestionCard.astro` | Modify — dark card colors |
| `src/components/SilenceTag.astro` | Modify — dark aside colors |
| `src/pages/index.astro` | Modify — dark homepage colors |
