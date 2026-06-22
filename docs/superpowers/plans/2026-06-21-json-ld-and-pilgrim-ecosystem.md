# JSON-LD, Site Polish & Pilgrim Ecosystem — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a coherent JSON-LD `@graph` to every page of walktalkmeditate.org, plus `llms.txt`/`robots.txt`, a `/pilgrim/` companion-app bridge page, a home teaser, and a family footer — fusing walktalkmeditate and Pilgrim into one discoverable ecosystem.

**Architecture:** A pure TypeScript module (`src/lib/structuredData.ts`) builds the schema.org graph from typed input; it is unit-tested with Vitest. A thin `StructuredData.astro` component serializes the graph into a `<script type="application/ld+json">` and is rendered from `BaseLayout.astro`, so every page is covered. Page-specific data (page type, breadcrumbs, question lists, how-to steps) flows in via props/frontmatter.

**Tech Stack:** Astro 5, Tailwind, TypeScript, Vitest (new — for the pure graph module).

## Global Constraints

- Site: `https://walktalkmeditate.org` (Astro `site`, base URL is `/`).
- Publisher identity: schema.org **Organization** named `"Walk Talk Meditate"`. No named individual.
- **No edits to `../pilgrim-landing`.** All Pilgrim links are one-directional → `https://pilgrimapp.org`.
- Organization `sameAs` (verbatim): `https://pilgrimapp.org`, `https://github.com/walktalkmeditate`, `https://apps.apple.com/app/pilgrim-mindful-walking/id6760921056`, `https://play.google.com/store/apps/details?id=org.walktalkmeditate.pilgrim`, `https://mastodon.social/@pilgrimage`, `https://bsky.app/profile/pilgrima.ge`, `https://www.threads.com/@pilgrima.ge`.
- JSON-LD must survive Astro view transitions → emit with `is:inline` in `<head>`.
- One `<script type="application/ld+json">` per page.
- Stable `@id`s: `…/#organization`, `…/#website`, `{pageURL}#webpage`, `{pageURL}#breadcrumb`, `https://walktalkmeditate.org/pilgrim/#app`.
- Existing conventions: `import.meta.env.BASE_URL` for internal links; no comments that restate code; kebab-case filenames; named exports; explicit return types on exported functions.

## File Structure

- `src/lib/structuredData.ts` — **new.** Pure graph builder + node functions + constants. No Astro imports.
- `src/lib/structuredData.test.ts` — **new.** Vitest unit tests.
- `vitest.config.ts` — **new.** Minimal test config.
- `package.json` — **modify.** Add `vitest` devDep + `test` scripts.
- `src/components/StructuredData.astro` — **new.** Serializes graph to script tag.
- `src/layouts/BaseLayout.astro` — **modify.** Accept `structuredData` prop, render component.
- `src/layouts/ContentLayout.astro` — **modify.** Derive breadcrumbs + page type, forward to BaseLayout.
- `src/pages/index.astro` — **modify.** `type: 'home'` + home teaser section.
- `src/pages/questions/index.astro` — **modify.** `type: 'collection'`.
- `src/pages/questions/{morning,evening,solo,walking}.astro` — **modify.** `type: 'questionList'` + items.
- `src/pages/guide/getting-started.mdx` — **modify.** Frontmatter `pageType: howto` + `howToSteps`.
- `src/pages/pilgrim.astro` — **new.** Companion-app bridge page (`type: 'app'`).
- `src/components/Footer.astro` — **modify.** Family links.
- `public/llms.txt` — **new.**
- `public/robots.txt` — **new.**

---

### Task 1: Vitest setup + Organization & WebSite nodes

**Files:**
- Create: `src/lib/structuredData.ts`
- Create: `src/lib/structuredData.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `SITE_URL`, `ORG_ID`, `WEBSITE_ID`, `SAME_AS: string[]`, `organizationNode(): Record<string, unknown>`, `websiteNode(): Record<string, unknown>`, `buildGraph(input: StructuredDataInput): Record<string, unknown>` (persistent nodes only at this stage), and the exported types `PageType`, `Breadcrumb`, `StructuredDataInput`.

- [ ] **Step 1: Add Vitest to the project**

Run:
```bash
npm install -D vitest@^3
```

- [ ] **Step 2: Add test scripts to `package.json`**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `src/lib/structuredData.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  organizationNode,
  websiteNode,
  buildGraph,
  ORG_ID,
  WEBSITE_ID,
  SAME_AS,
} from './structuredData';

describe('organizationNode', () => {
  it('is an Organization named Walk Talk Meditate with the shared @id', () => {
    const node = organizationNode();
    expect(node['@type']).toBe('Organization');
    expect(node['@id']).toBe(ORG_ID);
    expect(node.name).toBe('Walk Talk Meditate');
  });

  it('includes pilgrimapp.org in sameAs to fuse the ecosystem', () => {
    expect(SAME_AS).toContain('https://pilgrimapp.org');
    expect(organizationNode().sameAs).toEqual(SAME_AS);
  });
});

describe('websiteNode', () => {
  it('is a WebSite published by the organization', () => {
    const node = websiteNode();
    expect(node['@type']).toBe('WebSite');
    expect(node['@id']).toBe(WEBSITE_ID);
    expect(node.publisher).toEqual({ '@id': ORG_ID });
  });
});

describe('buildGraph', () => {
  it('always includes the organization and website nodes', () => {
    const graph = buildGraph({
      type: 'webpage',
      url: 'https://walktalkmeditate.org/walk/',
      title: 'Walk',
      description: 'Walking as practice.',
    }) as { '@context': string; '@graph': Array<Record<string, unknown>> };
    expect(graph['@context']).toBe('https://schema.org');
    const types = graph['@graph'].map((n) => n['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./structuredData"` / module not found.

- [ ] **Step 6: Create `src/lib/structuredData.ts` with constants + persistent nodes**

```ts
export const SITE_URL = 'https://walktalkmeditate.org';
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const LOGO_URL = `${SITE_URL}/logo-128.png`;
const OG_IMAGE = `${SITE_URL}/og.png`;
const TAGLINE = 'An open-source pilgrimage framework for walking, talking, and meditating.';

export const SAME_AS: string[] = [
  'https://pilgrimapp.org',
  'https://github.com/walktalkmeditate',
  'https://apps.apple.com/app/pilgrim-mindful-walking/id6760921056',
  'https://play.google.com/store/apps/details?id=org.walktalkmeditate.pilgrim',
  'https://mastodon.social/@pilgrimage',
  'https://bsky.app/profile/pilgrima.ge',
  'https://www.threads.com/@pilgrima.ge',
];

export type PageType = 'home' | 'webpage' | 'collection' | 'howto' | 'questionList' | 'app';

export interface Breadcrumb {
  name: string;
  url: string;
}

export interface StructuredDataInput {
  type: PageType;
  url: string;
  title: string;
  description: string;
  breadcrumbs?: Breadcrumb[];
  items?: string[];
  howToSteps?: string[];
}

type Node = Record<string, unknown>;

export function organizationNode(): Node {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Walk Talk Meditate',
    url: SITE_URL,
    logo: LOGO_URL,
    description: TAGLINE,
    sameAs: SAME_AS,
  };
}

export function websiteNode(): Node {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: 'walk · talk · meditate',
    description: TAGLINE,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  };
}

export function buildGraph(input: StructuredDataInput): Record<string, unknown> {
  const graph: Node[] = [organizationNode(), websiteNode()];
  return { '@context': 'https://schema.org', '@graph': graph };
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (all tests in `structuredData.test.ts`).

- [ ] **Step 8: Verify the build is still green**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/structuredData.ts src/lib/structuredData.test.ts
git commit -m "feat(seo): add structured-data module with Organization + WebSite nodes"
```

---

### Task 2: WebPage + BreadcrumbList nodes (webpage & collection types)

**Files:**
- Modify: `src/lib/structuredData.ts`
- Test: `src/lib/structuredData.test.ts`

**Interfaces:**
- Consumes: everything from Task 1.
- Produces: `breadcrumbNode(url: string, crumbs: Breadcrumb[]): Record<string, unknown>`; `buildGraph` now handles `'webpage'` (→ `WebPage`) and `'collection'` (→ `CollectionPage`), each appending a `BreadcrumbList` when `breadcrumbs` is non-empty.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/structuredData.test.ts`:
```ts
import { breadcrumbNode } from './structuredData';

describe('webpage graph', () => {
  const input = {
    type: 'webpage' as const,
    url: 'https://walktalkmeditate.org/guide/planning/',
    title: 'Planning',
    description: 'Logistics for solo and group pilgrimages.',
    breadcrumbs: [
      { name: 'Home', url: 'https://walktalkmeditate.org/' },
      { name: 'Guide', url: 'https://walktalkmeditate.org/guide/getting-started/' },
      { name: 'Planning', url: 'https://walktalkmeditate.org/guide/planning/' },
    ],
  };

  it('adds a WebPage that is part of the website and references its breadcrumb', () => {
    const graph = buildGraph(input) as { '@graph': Array<Record<string, unknown>> };
    const page = graph['@graph'].find((n) => n['@type'] === 'WebPage')!;
    expect(page['@id']).toBe('https://walktalkmeditate.org/guide/planning/#webpage');
    expect(page.isPartOf).toEqual({ '@id': WEBSITE_ID });
    expect(page.breadcrumb).toEqual({ '@id': 'https://walktalkmeditate.org/guide/planning/#breadcrumb' });
  });

  it('adds a BreadcrumbList with positioned items', () => {
    const graph = buildGraph(input) as { '@graph': Array<Record<string, unknown>> };
    const crumb = graph['@graph'].find((n) => n['@type'] === 'BreadcrumbList')! as {
      itemListElement: Array<{ position: number; name: string; item: string }>;
    };
    expect(crumb.itemListElement).toHaveLength(3);
    expect(crumb.itemListElement[0]).toMatchObject({ position: 1, name: 'Home' });
    expect(crumb.itemListElement[2]).toMatchObject({ position: 3, name: 'Planning' });
  });
});

describe('collection graph', () => {
  it('uses CollectionPage as the page type', () => {
    const graph = buildGraph({
      type: 'collection',
      url: 'https://walktalkmeditate.org/questions/',
      title: 'Questions',
      description: 'Curated questions for the journey.',
    }) as { '@graph': Array<Record<string, unknown>> };
    const types = graph['@graph'].map((n) => n['@type']);
    expect(types).toContain('CollectionPage');
    expect(types).not.toContain('WebPage');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `breadcrumbNode` is not exported / no `WebPage` node in graph.

- [ ] **Step 3: Add the WebPage + breadcrumb builders**

In `src/lib/structuredData.ts`, add after `websiteNode()`:
```ts
function webPageNode(input: StructuredDataInput, schemaType: string, mainEntityId?: string): Node {
  const node: Node = {
    '@type': schemaType,
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.title,
    description: input.description,
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: 'en',
    primaryImageOfPage: OG_IMAGE,
  };
  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    node.breadcrumb = { '@id': `${input.url}#breadcrumb` };
  }
  if (mainEntityId) {
    node.mainEntity = { '@id': mainEntityId };
  }
  return node;
}

export function breadcrumbNode(url: string, crumbs: Breadcrumb[]): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}
```

- [ ] **Step 4: Extend `buildGraph` to handle webpage & collection**

Replace the body of `buildGraph` with:
```ts
export function buildGraph(input: StructuredDataInput): Record<string, unknown> {
  const graph: Node[] = [organizationNode(), websiteNode()];
  const crumbs = input.breadcrumbs ?? [];
  const pushBreadcrumb = () => {
    if (crumbs.length > 0) graph.push(breadcrumbNode(input.url, crumbs));
  };

  switch (input.type) {
    case 'collection':
      graph.push(webPageNode(input, 'CollectionPage'));
      pushBreadcrumb();
      break;
    case 'webpage':
    default:
      graph.push(webPageNode(input, 'WebPage'));
      pushBreadcrumb();
      break;
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/structuredData.ts src/lib/structuredData.test.ts
git commit -m "feat(seo): add WebPage, CollectionPage, and BreadcrumbList nodes"
```

---

### Task 3: HowTo, ItemList, MobileApplication + home/app/howto/questionList types

**Files:**
- Modify: `src/lib/structuredData.ts`
- Test: `src/lib/structuredData.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–2.
- Produces: `mobileAppNode(): Record<string, unknown>` (exported), `APP_ID` (exported), and `buildGraph` handling `'home'` (WebPage mainEntity=Org + MobileApplication), `'app'` (WebPage mainEntity=App + MobileApplication + breadcrumb), `'howto'` (WebPage + HowTo + breadcrumb), `'questionList'` (CollectionPage + ItemList + breadcrumb).

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/structuredData.test.ts`:
```ts
import { mobileAppNode, APP_ID } from './structuredData';

describe('mobileAppNode', () => {
  it('is a free MobileApplication published by the org, pointing at pilgrimapp.org', () => {
    const app = mobileAppNode();
    expect(app['@type']).toBe('MobileApplication');
    expect(app['@id']).toBe(APP_ID);
    expect(app.url).toBe('https://pilgrimapp.org');
    expect(app.publisher).toEqual({ '@id': ORG_ID });
    expect(app.offers).toMatchObject({ price: '0', priceCurrency: 'USD' });
  });
});

describe('home graph', () => {
  it('has a WebPage whose mainEntity is the org, plus the Pilgrim app', () => {
    const graph = buildGraph({
      type: 'home',
      url: 'https://walktalkmeditate.org/',
      title: 'walk · talk · meditate',
      description: 'An open-source pilgrimage framework.',
    }) as { '@graph': Array<Record<string, unknown>> };
    const page = graph['@graph'].find((n) => n['@type'] === 'WebPage')!;
    expect(page.mainEntity).toEqual({ '@id': ORG_ID });
    expect(graph['@graph'].some((n) => n['@type'] === 'MobileApplication')).toBe(true);
  });
});

describe('app graph', () => {
  it("has a WebPage whose mainEntity is the app's @id", () => {
    const graph = buildGraph({
      type: 'app',
      url: 'https://walktalkmeditate.org/pilgrim/',
      title: 'Pilgrim',
      description: 'The app for the practice.',
      breadcrumbs: [
        { name: 'Home', url: 'https://walktalkmeditate.org/' },
        { name: 'Pilgrim', url: 'https://walktalkmeditate.org/pilgrim/' },
      ],
    }) as { '@graph': Array<Record<string, unknown>> };
    const page = graph['@graph'].find((n) => n['@type'] === 'WebPage')!;
    expect(page.mainEntity).toEqual({ '@id': APP_ID });
    expect(graph['@graph'].some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
  });
});

describe('howto graph', () => {
  it('adds a HowTo with positioned steps', () => {
    const graph = buildGraph({
      type: 'howto',
      url: 'https://walktalkmeditate.org/guide/getting-started/',
      title: 'Getting Started',
      description: 'Your on-ramp to a pilgrimage.',
      howToSteps: ['Choose a route', 'Pick a question', 'Walk'],
      breadcrumbs: [{ name: 'Home', url: 'https://walktalkmeditate.org/' }],
    }) as { '@graph': Array<Record<string, unknown>> };
    const howto = graph['@graph'].find((n) => n['@type'] === 'HowTo')! as {
      step: Array<{ position: number; text: string }>;
    };
    expect(howto.step).toHaveLength(3);
    expect(howto.step[0]).toMatchObject({ position: 1, text: 'Choose a route' });
  });
});

describe('questionList graph', () => {
  it('adds an ItemList of the question texts on a CollectionPage', () => {
    const graph = buildGraph({
      type: 'questionList',
      url: 'https://walktalkmeditate.org/questions/morning/',
      title: 'Morning Seeds',
      description: 'Prompts for morning meditation.',
      items: ['What is alive in you?', 'What will you let go of?'],
    }) as { '@graph': Array<Record<string, unknown>> };
    const types = graph['@graph'].map((n) => n['@type']);
    expect(types).toContain('CollectionPage');
    const list = graph['@graph'].find((n) => n['@type'] === 'ItemList')! as {
      numberOfItems: number;
      itemListElement: unknown[];
    };
    expect(list.numberOfItems).toBe(2);
    expect(list.itemListElement).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `mobileAppNode`/`APP_ID` not exported; no HowTo/ItemList/MobileApplication nodes.

- [ ] **Step 3: Add the new node builders**

In `src/lib/structuredData.ts`, add after `breadcrumbNode`:
```ts
export const APP_ID = `${SITE_URL}/pilgrim/#app`;

const APP_STORE_URLS: string[] = [
  'https://apps.apple.com/app/pilgrim-mindful-walking/id6760921056',
  'https://play.google.com/store/apps/details?id=org.walktalkmeditate.pilgrim',
];

export function mobileAppNode(): Node {
  return {
    '@type': 'MobileApplication',
    '@id': APP_ID,
    name: 'Pilgrim',
    url: 'https://pilgrimapp.org',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'HealthApplication',
    description: 'A privacy-first walking and meditation companion — the app for the walk · talk · meditate practice.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    isAccessibleForFree: true,
    publisher: { '@id': ORG_ID },
    sameAs: APP_STORE_URLS,
  };
}

function howToNode(input: StructuredDataInput): Node {
  return {
    '@type': 'HowTo',
    name: input.title,
    description: input.description,
    step: (input.howToSteps ?? []).map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: s,
    })),
  };
}

function itemListNode(input: StructuredDataInput): Node {
  const items = input.items ?? [];
  return {
    '@type': 'ItemList',
    name: input.title,
    numberOfItems: items.length,
    itemListElement: items.map((text, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: text,
    })),
  };
}
```

- [ ] **Step 4: Extend `buildGraph` to handle home/app/howto/questionList**

Replace the `switch` in `buildGraph` with:
```ts
  switch (input.type) {
    case 'home':
      graph.push(webPageNode(input, 'WebPage', ORG_ID), mobileAppNode());
      break;
    case 'app':
      graph.push(webPageNode(input, 'WebPage', APP_ID), mobileAppNode());
      pushBreadcrumb();
      break;
    case 'howto':
      graph.push(webPageNode(input, 'WebPage'), howToNode(input));
      pushBreadcrumb();
      break;
    case 'questionList':
      graph.push(webPageNode(input, 'CollectionPage'), itemListNode(input));
      pushBreadcrumb();
      break;
    case 'collection':
      graph.push(webPageNode(input, 'CollectionPage'));
      pushBreadcrumb();
      break;
    case 'webpage':
    default:
      graph.push(webPageNode(input, 'WebPage'));
      pushBreadcrumb();
      break;
  }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS (all suites).

- [ ] **Step 6: Commit**

```bash
git add src/lib/structuredData.ts src/lib/structuredData.test.ts
git commit -m "feat(seo): add HowTo, ItemList, and MobileApplication graph types"
```

---

### Task 4: StructuredData component wired into BaseLayout

**Files:**
- Create: `src/components/StructuredData.astro`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: `buildGraph`, `StructuredDataInput` from `src/lib/structuredData.ts`.
- Produces: BaseLayout now accepts `structuredData?: Partial<StructuredDataInput>` and renders one `<script type="application/ld+json">` in `<head>`. Default page type is `'webpage'` using the canonical URL, page title, and description.

- [ ] **Step 1: Create the component**

`src/components/StructuredData.astro`:
```astro
---
import { buildGraph, type StructuredDataInput } from '../lib/structuredData';

const graph = buildGraph(Astro.props as StructuredDataInput);
const json = JSON.stringify(graph).replace(/</g, '\\u003c');
---

<script type="application/ld+json" is:inline set:html={json} />
```

- [ ] **Step 2: Import the component and type in BaseLayout**

In `src/layouts/BaseLayout.astro`, add to the frontmatter imports (after the existing imports):
```astro
import StructuredData from '../components/StructuredData.astro';
import type { StructuredDataInput } from '../lib/structuredData';
```

- [ ] **Step 3: Extend BaseLayout Props and compute the structured-data input**

In `src/layouts/BaseLayout.astro`, change the `Props` interface and add the computed value:
```astro
interface Props {
  title: string;
  description?: string;
  structuredData?: Partial<StructuredDataInput>;
}

const { title, description = 'An open-source pilgrimage framework for walking, talking, and meditating.', structuredData } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);

const structuredDataInput: StructuredDataInput = {
  type: 'webpage',
  url: canonicalURL.href,
  title,
  description,
  ...structuredData,
};
```

- [ ] **Step 4: Render the component in `<head>`**

In `src/layouts/BaseLayout.astro`, add immediately before `<ClientRouter />`:
```astro
    <StructuredData {...structuredDataInput} />
```

- [ ] **Step 5: Build and verify JSON-LD is emitted**

Run:
```bash
npm run build && grep -l 'application/ld+json' dist/index.html
```
Expected: `dist/index.html` listed; build succeeds.

- [ ] **Step 6: Verify the JSON parses and has a graph**

Run:
```bash
node -e "const h=require('fs').readFileSync('dist/index.html','utf8');const m=h.match(/<script type=\"application\/ld\+json\"[^>]*>([\s\S]*?)<\/script>/);const j=JSON.parse(m[1].replace(/\\\\u003c/g,'<'));console.log(j['@graph'].map(n=>n['@type']).join(','));"
```
Expected: prints `Organization,WebSite,WebPage` (home still defaults to `webpage` until Task 5).

- [ ] **Step 7: Run unit tests (regression check)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/StructuredData.astro src/layouts/BaseLayout.astro
git commit -m "feat(seo): emit JSON-LD on every page via BaseLayout"
```

---

### Task 5: Page-specific structured data (home, ContentLayout breadcrumbs, questions, how-to)

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/ContentLayout.astro`
- Modify: `src/pages/questions/index.astro`
- Modify: `src/pages/questions/morning.astro`
- Modify: `src/pages/questions/evening.astro`
- Modify: `src/pages/questions/solo.astro`
- Modify: `src/pages/questions/walking.astro`
- Modify: `src/pages/guide/getting-started.mdx`

**Interfaces:**
- Consumes: BaseLayout's `structuredData` prop (Task 4).
- Produces: each page emits its correct graph type. ContentLayout auto-builds breadcrumbs from `section` + `title` and forwards `structuredData` (including frontmatter `pageType`/`howToSteps` for MDX pages).

- [ ] **Step 1: Set the home page type**

In `src/pages/index.astro`, change the opening tag:
```astro
<BaseLayout title="walk · talk · meditate" structuredData={{ type: 'home', description: 'An open-source pilgrimage framework for walking, talking, and meditating — solo or group, local or abroad.' }}>
```

- [ ] **Step 2: Teach ContentLayout to build breadcrumbs + forward structured data**

In `src/layouts/ContentLayout.astro`, replace the frontmatter with:
```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import Navigation from '../components/Navigation.astro';
import { SITE_URL, type StructuredDataInput, type PageType, type Breadcrumb } from '../lib/structuredData';

interface Props {
  title?: string;
  description?: string;
  section?: 'guide' | 'ethos' | 'questions';
  structuredData?: Partial<StructuredDataInput>;
  frontmatter?: {
    title?: string;
    description?: string;
    section?: 'guide' | 'ethos' | 'questions';
    pageType?: PageType;
    howToSteps?: string[];
  };
}

const fm = Astro.props.frontmatter;
const title = Astro.props.title ?? fm?.title ?? '';
const description = Astro.props.description ?? fm?.description;
const section = Astro.props.section ?? fm?.section;

const sectionMeta: Record<string, Breadcrumb> = {
  guide: { name: 'Guide', url: `${SITE_URL}/guide/getting-started/` },
  ethos: { name: 'Ethos', url: `${SITE_URL}/ethos/open-source/` },
  questions: { name: 'Questions', url: `${SITE_URL}/questions/` },
};

const currentUrl = new URL(Astro.url.pathname, Astro.site).href;
const breadcrumbs: Breadcrumb[] = [{ name: 'Home', url: `${SITE_URL}/` }];
if (section && sectionMeta[section]) {
  breadcrumbs.push(sectionMeta[section]);
  if (sectionMeta[section].url !== currentUrl) {
    breadcrumbs.push({ name: title, url: currentUrl });
  }
}

const structuredData: Partial<StructuredDataInput> = {
  type: fm?.pageType ?? 'webpage',
  title,
  description,
  breadcrumbs,
  ...(fm?.howToSteps ? { howToSteps: fm.howToSteps } : {}),
  ...Astro.props.structuredData,
};
---
```

- [ ] **Step 3: Pass structured data from ContentLayout to BaseLayout**

In `src/layouts/ContentLayout.astro`, change the `<BaseLayout …>` opening tag:
```astro
<BaseLayout title={`${title} — walk · talk · meditate`} description={description} structuredData={structuredData}>
```

- [ ] **Step 4: Set the questions index to a collection**

In `src/pages/questions/index.astro`, change the `<ContentLayout …>` opening tag:
```astro
<ContentLayout title="Questions" section="questions" description="Curated questions for walking, talking, and reflecting on pilgrimage." structuredData={{ type: 'collection' }}>
```

- [ ] **Step 5: Add ItemList to each question sub-page**

In `src/pages/questions/morning.astro`, change the `<ContentLayout …>` opening tag to pass the question texts:
```astro
<ContentLayout title="Morning Seeds" section="questions" description="One-sentence contemplative prompts for morning meditation." structuredData={{ type: 'questionList', items: questions.map((q) => q.text) }}>
```

Repeat the identical pattern (only `title`, `description`, and the existing `questions` variable are reused) for the other three, keeping their current titles/descriptions:
- `src/pages/questions/evening.astro`
- `src/pages/questions/solo.astro`
- `src/pages/questions/walking.astro`

Each already loads `const { description, questions } = entry!.data;`, so add `structuredData={{ type: 'questionList', items: questions.map((q) => q.text) }}` to its `<ContentLayout>` tag.

- [ ] **Step 6: Make getting-started a HowTo**

In `src/pages/guide/getting-started.mdx`, replace the frontmatter block with:
```yaml
---
layout: ../../layouts/ContentLayout.astro
title: Getting Started
description: Your on-ramp to a pilgrimage — solo or group, local or abroad.
section: guide
pageType: howto
howToSteps:
  - Choose a route — 2–3 hours of walking, ideally on paths rather than roads
  - Pick a question — choose one from the morning seeds to carry with you
  - Walk — at a comfortable pace, present with each step
  - Reflect — voice-record or journal after your walk
  - Sit — close with 10–30 minutes of meditation
---
```

- [ ] **Step 7: Build and verify each page type**

Run:
```bash
npm run build
node -e "const fs=require('fs');const grab=p=>{const h=fs.readFileSync(p,'utf8');const m=h.match(/<script type=\"application\/ld\+json\"[^>]*>([\s\S]*?)<\/script>/);return JSON.parse(m[1].replace(/\\\\u003c/g,'<'))['@graph'].map(n=>n['@type']).join(',');};console.log('home:',grab('dist/index.html'));console.log('getting-started:',grab('dist/guide/getting-started/index.html'));console.log('questions/morning:',grab('dist/questions/morning/index.html'));console.log('questions index:',grab('dist/questions/index.html'));console.log('ethos:',grab('dist/ethos/open-source/index.html'));"
```
Expected:
- `home: Organization,WebSite,WebPage,MobileApplication`
- `getting-started: Organization,WebSite,WebPage,HowTo,BreadcrumbList`
- `questions/morning: Organization,WebSite,CollectionPage,ItemList,BreadcrumbList`
- `questions index: Organization,WebSite,CollectionPage,BreadcrumbList`
- `ethos: Organization,WebSite,WebPage,BreadcrumbList`

- [ ] **Step 8: Run unit tests + astro check**

Run: `npm test && npx astro check`
Expected: tests PASS; astro check reports no errors.

- [ ] **Step 9: Commit**

```bash
git add src/pages/index.astro src/layouts/ContentLayout.astro src/pages/questions/ src/pages/guide/getting-started.mdx
git commit -m "feat(seo): wire per-page JSON-LD types (home, how-to, question lists, breadcrumbs)"
```

---

### Task 6: `/pilgrim/` bridge page + home teaser + family footer

**Files:**
- Create: `src/pages/pilgrim.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Consumes: ContentLayout `structuredData` passthrough (Task 5); `type: 'app'`.
- Produces: `/pilgrim/` page carrying `MobileApplication` JSON-LD; a home teaser linking to it; footer family links.

- [ ] **Step 1: Create the bridge page**

`src/pages/pilgrim.astro`:
```astro
---
import ContentLayout from '../layouts/ContentLayout.astro';
import { SITE_URL } from '../lib/structuredData';

const breadcrumbs = [
  { name: 'Home', url: `${SITE_URL}/` },
  { name: 'Pilgrim', url: `${SITE_URL}/pilgrim/` },
];
---

<ContentLayout
  title="Pilgrim"
  description="The companion app for the walk · talk · meditate practice — privacy-first, open source, free forever."
  structuredData={{ type: 'app', breadcrumbs }}
>
  <p>
    walk · talk · meditate is the practice. <strong>Pilgrim</strong> is the tool you
    carry on the path — a quiet, privacy-first companion for iPhone and Android. No
    accounts, no analytics, no cloud. Open source, free forever.
  </p>

  <h2>The three pillars, in your pocket</h2>
  <ul>
    <li><strong>Walk</strong> — GPS route tracking and voice notes transcribed on-device, so a thought mid-walk is never lost.</li>
    <li><strong>Talk</strong> — reflection prompts generated from your own voice notes and photos, alongside the curated <a href="/questions/">65 questions</a>.</li>
    <li><strong>Meditate</strong> — a walking-meditation breathing circle with ambient soundscapes and seven voice guides.</li>
  </ul>

  <p>
    Everything stays on your phone. Voice transcription runs entirely on-device. The
    full source is on <a href="https://github.com/walktalkmeditate/pilgrim-ios">GitHub</a>.
  </p>

  <div class="mt-10 flex flex-wrap gap-4 not-prose">
    <a
      href="https://apps.apple.com/app/pilgrim-mindful-walking/id6760921056"
      class="inline-flex items-center font-ui text-sm px-5 py-3 rounded-lg bg-sand-800 text-sand-50 dark:bg-dusk-100 dark:text-dusk-900 hover:opacity-80 transition-opacity"
    >
      Download for iOS
    </a>
    <a
      href="https://play.google.com/store/apps/details?id=org.walktalkmeditate.pilgrim"
      class="inline-flex items-center font-ui text-sm px-5 py-3 rounded-lg border border-sand-300 text-sand-700 dark:border-dusk-700 dark:text-dusk-200 hover:border-sand-500 transition-colors"
    >
      Download for Android
    </a>
  </div>

  <p class="mt-8 font-ui text-sm text-sand-400 dark:text-dusk-300 not-prose">
    Full details and the contemplative-instrument almanac live at
    <a href="https://pilgrimapp.org" class="underline hover:text-sand-600 dark:hover:text-dusk-200">pilgrimapp.org</a>.
  </p>
</ContentLayout>
```

- [ ] **Step 2: Add the home teaser section**

In `src/pages/index.astro`, add this section immediately before the closing `</main>` (after the "Join the community" section and its divider — add a divider first):
```astro
    <div class="border-t border-sand-200 dark:border-dusk-800" />

    <section class="py-20 md:py-28 reveal">
      <a
        href={`${base}pilgrim/`}
        class="group inline-flex items-center gap-3 font-heading text-2xl md:text-3xl font-light text-sand-800 dark:text-dusk-100 hover:text-sage dark:hover:text-sage-light transition-colors tracking-display"
      >
        Carry the practice with Pilgrim
        <span class="text-sand-300 dark:text-dusk-700 group-hover:text-sage dark:group-hover:text-sage-light group-hover:translate-x-1 transition-all">→</span>
      </a>
      <p class="mt-4 text-sand-400 dark:text-dusk-300 font-ui text-sm">
        The companion app. Privacy-first, open source, free forever.
      </p>
    </section>
```

- [ ] **Step 3: Add family links to the footer**

In `src/components/Footer.astro`, replace the `<span>walk · talk · meditate</span>` line with a family link group:
```astro
      <div class="flex flex-wrap gap-x-5 gap-y-1 items-center">
        <span>walk · talk · meditate</span>
        <a href="https://pilgrimapp.org" class="hover:text-sand-600 dark:hover:text-dusk-200 transition-colors">Pilgrim</a>
        <a href="https://github.com/walktalkmeditate/open-pilgrimages" class="hover:text-sand-600 dark:hover:text-dusk-200 transition-colors">open-pilgrimages</a>
      </div>
```

- [ ] **Step 4: Build and verify the /pilgrim/ graph**

Run:
```bash
npm run build
node -e "const fs=require('fs');const h=fs.readFileSync('dist/pilgrim/index.html','utf8');const m=h.match(/<script type=\"application\/ld\+json\"[^>]*>([\s\S]*?)<\/script>/);const g=JSON.parse(m[1].replace(/\\\\u003c/g,'<'))['@graph'];console.log(g.map(n=>n['@type']).join(','));const app=g.find(n=>n['@type']==='MobileApplication');console.log('app.mainEntity-linked:',g.find(n=>n['@type']==='WebPage').mainEntity['@id']===app['@id']);"
```
Expected: `Organization,WebSite,WebPage,MobileApplication,BreadcrumbList` and `app.mainEntity-linked: true`.

- [ ] **Step 5: Confirm the home teaser link and footer family render**

Run:
```bash
grep -c 'pilgrim/' dist/index.html && grep -c 'pilgrimapp.org' dist/index.html
```
Expected: both ≥ 1.

- [ ] **Step 6: Run unit tests + astro check**

Run: `npm test && npx astro check`
Expected: tests PASS; astro check no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/pilgrim.astro src/pages/index.astro src/components/Footer.astro
git commit -m "feat: add Pilgrim companion-app bridge page, home teaser, and family footer"
```

---

### Task 7: `llms.txt` and `robots.txt`

**Files:**
- Create: `public/llms.txt`
- Create: `public/robots.txt`

**Interfaces:**
- None (static files copied to site root by Astro).

- [ ] **Step 1: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://walktalkmeditate.org/sitemap-index.xml
```

- [ ] **Step 2: Create `public/llms.txt`**

```
# walk · talk · meditate — An open-source pilgrimage framework

> walk · talk · meditate is an open-source framework for pilgrimage as
> practice. Three equal pillars — walking as practice (not transit), deep
> conversation (not small talk), and meditation — turn any walk, solo or
> group, local or abroad, into a pilgrimage. No gear required. Start
> tomorrow in your own town.

## What it is

A philosophy and a practical guide, not a product. Inspired by the
walk-and-talk tradition, with meditation added as an equal third pillar.
The motto: slow and chill. The practice: relax and release. The way:
peace and harmony.

## The three pillars

- Walk — walking as practice, side by side, step by step.
- Talk — deep reflection and connection; 65 curated questions for the journey.
- Meditate — seeking the peace and calmness within.

## Sections

- Guide — getting started, planning, preparing, on the journey, coming home:
  https://walktalkmeditate.org/guide/getting-started/
- Questions — 65 curated prompts by context (walking, evening, solo, morning):
  https://walktalkmeditate.org/questions/
- Ethos — open source, the golden rule, radical presence:
  https://walktalkmeditate.org/ethos/open-source/

## Companion app

Pilgrim is the app for this practice — a privacy-first walking and
meditation companion for iOS and Android. No accounts, no analytics, no
cloud; voice notes transcribed on-device; open source (GPLv3), free forever.

- App + bridge page: https://walktalkmeditate.org/pilgrim/
- Full app site: https://pilgrimapp.org

## Related

- GitHub org: https://github.com/walktalkmeditate
- Open pilgrimage routes dataset: https://github.com/walktalkmeditate/open-pilgrimages
- Community discussions: https://github.com/orgs/walktalkmeditate/discussions

## License

Content and code: open source. See the repository for details.
```

- [ ] **Step 3: Build and verify both files reach the site root**

Run:
```bash
npm run build && ls dist/llms.txt dist/robots.txt
```
Expected: both files listed under `dist/`.

- [ ] **Step 4: Confirm the sitemap target exists**

Run: `ls dist/sitemap-index.xml`
Expected: file exists (so `robots.txt`'s `Sitemap:` line is valid).

- [ ] **Step 5: Commit**

```bash
git add public/llms.txt public/robots.txt
git commit -m "feat(seo): add llms.txt and robots.txt"
```

---

## Final verification

- [ ] `npm test` — all structured-data unit tests pass.
- [ ] `npm run build && npx astro check` — clean build, no type errors.
- [ ] Spot-check one page's JSON-LD in [Google Rich Results Test](https://search.google.com/test/rich-results) (paste the rendered HTML) — Organization, WebSite, BreadcrumbList, HowTo all recognized.
- [ ] `git status` shows **no** changes under `../pilgrim-landing`.

## Self-review notes (author)

- **Spec coverage:** Part 1 JSON-LD → Tasks 1–6; `llms.txt`/`robots.txt` → Task 7; `/pilgrim/` + home teaser → Task 6; family footer → Task 6; Organization `sameAs` unification → Task 1. All "Now" tier items covered. "Next"/"Later" tier items (question-of-the-day, contextual guide deep links, contribute surface, printable guide, per-section OG, shareable cards) are intentionally **out of scope** for this plan.
- **Type consistency:** `buildGraph`, `StructuredDataInput`, `breadcrumbNode`, `mobileAppNode`, `APP_ID`, `ORG_ID`, `WEBSITE_ID`, `SITE_URL` names are used identically across tasks.
- **No placeholders:** every code step shows complete code; every run step shows the expected output.
