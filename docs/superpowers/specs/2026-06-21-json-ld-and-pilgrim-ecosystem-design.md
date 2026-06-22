# JSON-LD, Site Polish & Pilgrim Ecosystem — Design

**Date:** 2026-06-21
**Status:** Draft (awaiting review)
**Site:** walktalkmeditate.org (Astro + Tailwind, GitHub Pages)

## Context

walktalkmeditate.org is the *framework / philosophy* — three pillars (walk · talk ·
meditate), a pilgrimage guide, an ethos section, and 65 curated questions. Pilgrim
(pilgrimapp.org, `../pilgrim-landing`) is the *app* — a privacy-first walking
companion. Both ship under the same `walktalkmeditate` GitHub org. Pilgrim's site
already declares the shared `Organization` ("Walk Talk Meditate", `url:
https://walktalkmeditate.org`) in its JSON-LD. walktalkmeditate has **no structured
data yet** and has not claimed its own canonical Organization node.

The guiding narrative for the ecosystem: **walktalkmeditate is the *why / how*;
Pilgrim is the *tool on the path*.**

## Goals

1. Add a coherent JSON-LD `@graph` to every page, following the graph + shared-`@id`
   model from [Hawksley's JSON-LD guide](https://hawksley.dev/blog/json-ld-explained-for-personal-websites/).
2. Improve discoverability (AI citation + search) with `llms.txt`, `robots.txt`, and
   meta hygiene.
3. Add on-theme contemplative craft (question-of-the-day, printable guide).
4. Tie Pilgrim into the family as a first-class companion, **walktalkmeditate-side only**.

## Non-Goals

- **No edits to `../pilgrim-landing`.** All Pilgrim linking is one-directional
  (walktalkmeditate → pilgrimapp.org). Pilgrim already names walktalkmeditate.org as
  the org URL, so the identity link exists one way; we will not change Pilgrim's graph.
- No named-individual identity. Publisher is the **Organization** ("Walk Talk Meditate").
- No blog / RSS now (no evolving content stream exists — YAGNI).
- No new interactive "almanac" instruments (sunpath/daylight-style). Question-of-the-day
  is the one small interactive element, justified as contemplative craft.
- No re-selling the app on walktalkmeditate; `/pilgrim/` is a bridge, not a clone.

---

## Part 1 — JSON-LD

### Architecture

A single `src/components/StructuredData.astro` component builds a schema.org `@graph`
and emits **one** `<script type="application/ld+json" is:inline>`. It is rendered from
`BaseLayout.astro` so every page is covered. Driven by props:

```ts
interface Props {
  type: 'home' | 'webpage' | 'collection' | 'howto' | 'questionList' | 'app';
  title: string;
  description: string;
  breadcrumbs?: { name: string; url: string }[]; // omitted on home
  items?: string[];        // for questionList: the question texts
  howToSteps?: string[];   // for howto: ordered step text
}
```

Rejected alternative: inline JSON-LD per page (duplication + drift — the exact problem
visible in pilgrim-landing's hand-maintained blocks).

### Persistent nodes (emitted on every page)

- **`Organization`** — `@id: https://walktalkmeditate.org/#organization`
  - `name: "Walk Talk Meditate"`, `url`, `logo` (logo-128.png), `description`
  - `sameAs`: `https://pilgrimapp.org`, GitHub org, App Store, Play Store, Mastodon
    (`@pilgrimage`), Bluesky (`pilgrima.ge`), Threads (`@pilgrima.ge`) — the array
    Pilgrim already uses, **plus pilgrimapp.org**. This fuses both sites into one
    identity for crawlers.
- **`WebSite`** — `@id: https://walktalkmeditate.org/#website`
  - `name: "walk · talk · meditate"`, `url`, `description`, `inLanguage: "en"`,
    `publisher` → `#organization`.

### Per-page nodes

| Page(s) | Page node | Extra node |
|---|---|---|
| `/` (home) | `WebPage` (`mainEntity` → `#organization`) | `MobileApplication` (Pilgrim bridge) |
| `/pilgrim/` | `WebPage` (`mainEntity` → the app) | `MobileApplication` (Pilgrim) + `BreadcrumbList` |
| `/guide/getting-started/` | `WebPage` | `HowTo` + `BreadcrumbList` |
| `/guide/*` (others) | `WebPage` | `BreadcrumbList` |
| `/ethos/*` | `WebPage` | `BreadcrumbList` |
| `/questions/` | `CollectionPage` | `BreadcrumbList` |
| `/questions/{walking,evening,solo,morning}/` | `CollectionPage` | `ItemList` (questions) + `BreadcrumbList` |

- Every non-home page carries a **`BreadcrumbList`** (`@id: {url}#breadcrumb`), e.g.
  *Home › Guide › Getting Started* — per the blog post's recommendation.
- Every page node uses `@id: {url}#webpage`, `isPartOf` → `#website`, `breadcrumb` →
  `#breadcrumb`, `inLanguage: "en"`, `primaryImageOfPage` → og.png.
- **`HowTo`** (`getting-started`) models the literal numbered "Minimum Viable
  Pilgrimage" steps → eligible for how-to rich results.
- **`ItemList`** lists each page's question texts (`itemListElement` of `ListItem`).
- **`MobileApplication`** (Pilgrim bridge): `name: "Pilgrim"`, `url:
  https://pilgrimapp.org`, `operatingSystem`, `applicationCategory:
  "HealthApplication"`, `offers` { price 0, USD, InStock }, `isAccessibleForFree:
  true`, `publisher` → `#organization`, `sameAs` store URLs. Declares from
  walktalkmeditate's own graph that this org makes this app.

### Example — home page graph (abridged)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://walktalkmeditate.org/#organization",
      "name": "Walk Talk Meditate", "url": "https://walktalkmeditate.org",
      "logo": "https://walktalkmeditate.org/logo-128.png",
      "sameAs": ["https://pilgrimapp.org", "https://github.com/walktalkmeditate", "..."] },
    { "@type": "WebSite", "@id": "https://walktalkmeditate.org/#website",
      "url": "https://walktalkmeditate.org", "name": "walk · talk · meditate",
      "inLanguage": "en", "publisher": { "@id": "https://walktalkmeditate.org/#organization" } },
    { "@type": "WebPage", "@id": "https://walktalkmeditate.org/#webpage",
      "url": "https://walktalkmeditate.org", "isPartOf": { "@id": "https://walktalkmeditate.org/#website" },
      "mainEntity": { "@id": "https://walktalkmeditate.org/#organization" } },
    { "@type": "MobileApplication", "name": "Pilgrim", "url": "https://pilgrimapp.org",
      "operatingSystem": "iOS, Android", "applicationCategory": "HealthApplication",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "publisher": { "@id": "https://walktalkmeditate.org/#organization" } }
  ]
}
```

### Validation

- Build passes (`npm run build`, `astro check`).
- Each page type validated in Google Rich Results Test + schema.org validator.
- View-transition safe: emitted in `<head>` via `is:inline` so it persists across
  Astro client routing.

---

## Part 2 — Site polish

### Discoverability
- **`public/llms.txt`** — framework overview (pillars, guide, questions) + Pilgrim as
  companion app, modeled on pilgrim-landing's llms.txt.
- **`public/robots.txt`** — allow all, point to `sitemap-index.xml`.
- Audit every page's `description` meta for quality/uniqueness.

### Contemplative craft
- **Question of the day** — a date-deterministic draw from the 65 questions, surfaced
  on the home page (and/or `/questions/`). Deterministic by date so "today's question"
  is shareable and stable. Pure build-time or tiny inline JS; no dependency.
- **Printable guide** — a print stylesheet so the guide prints as a clean booklet to
  carry. On-brand with "no gear required."

### Community & growth
- A **"Contribute / adapt this"** surface (page or section) making the README's
  fork-it invitation visible: contribute questions, routes, run your own pilgrimage.
- Strengthen the home "organize a walk / join the community" CTA.

---

## Part 3 — Pilgrim integration (walktalkmeditate-side only)

1. **Structured-data identity** — Organization `sameAs` includes pilgrimapp.org (Part 1).
2. **`/pilgrim/` bridge page** — one screen: a bridge paragraph mapping pillars →
   app capabilities (walk → GPS + voice notes; talk → reflection prompts + the 65
   questions; meditate → breathing circle), one privacy/open-source line, App Store +
   Play buttons, "full details → pilgrimapp.org". Carries `MobileApplication` JSON-LD.
   **Not** a clone of pilgrimapp.org.
3. **Home teaser** — a short section inviting people to the companion app, linking to
   `/pilgrim/`.
4. **Contextual deep links in the guide** — at the moments the app helps: getting-started
   step 4 ("voice-record or journal") → `/pilgrim/`; meditation mentions → Pilgrim's
   walking-meditation mode; questions → Pilgrim's reflection prompts. Natural, sparse.
5. **Family footer strip** — add Pilgrim + open-pilgrimages + GitHub org to the footer
   so either entry point reveals the whole family.

---

## Priority tiers

- **Now:** Part 1 (all JSON-LD), `llms.txt`, `robots.txt`, `/pilgrim/` page + home
  teaser, family footer, Organization `sameAs` unification.
- **Next:** Question of the day, contextual guide deep links, contribute surface,
  description-meta audit.
- **Later:** printable guide stylesheet, shareable per-question cards, per-section OG
  images.

## Acceptance criteria

- [ ] Every page emits exactly one valid JSON-LD `@graph`; passes Rich Results Test.
- [ ] Organization + WebSite nodes share stable `@id`s across all pages.
- [ ] Non-home pages carry a correct BreadcrumbList; getting-started carries a HowTo;
      question pages carry an ItemList.
- [ ] `llms.txt` and `robots.txt` served at site root.
- [ ] `/pilgrim/` page exists, links to stores + pilgrimapp.org, carries
      MobileApplication JSON-LD; home teaser links to it.
- [ ] Footer shows the family (Pilgrim, open-pilgrimages, GitHub org).
- [ ] `npm run build` + `astro check` clean; JSON-LD survives view transitions.
- [ ] No files in `../pilgrim-landing` changed.

## Open questions

- Newsletter / "now" page — defer? (Pilgrim has one; not required for this work.)
- `/pilgrim/` URL slug: `/pilgrim/` vs `/app/` — recommend `/pilgrim/`.
