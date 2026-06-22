import { describe, it, expect } from 'vitest';
import {
  organizationNode,
  websiteNode,
  buildGraph,
  ORG_ID,
  WEBSITE_ID,
  SAME_AS,
  mobileAppNode,
  APP_ID,
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

describe('mobileAppNode', () => {
  it('is a free MobileApplication published by the org, pointing at pilgrimapp.org', () => {
    const app = mobileAppNode();
    expect(app['@type']).toBe('MobileApplication');
    expect(app['@id']).toBe(APP_ID);
    expect(app.url).toBe('https://pilgrimapp.org');
    expect(app.publisher).toEqual({ '@id': ORG_ID });
    expect(app.offers).toMatchObject({ price: '0', priceCurrency: 'USD' });
  });

  it('includes both store URLs in sameAs', () => {
    const app = mobileAppNode();
    expect(app.sameAs as string[]).toEqual(expect.arrayContaining([
      'https://apps.apple.com/app/pilgrim-mindful-walking/id6760921056',
      'https://play.google.com/store/apps/details?id=org.walktalkmeditate.pilgrim',
    ]));
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

  it('includes a WebPage node', () => {
    const graph = buildGraph({
      type: 'howto',
      url: 'https://walktalkmeditate.org/guide/getting-started/',
      title: 'Getting Started',
      description: 'Your on-ramp to a pilgrimage.',
      howToSteps: ['Choose a route'],
    }) as { '@graph': Array<Record<string, unknown>> };
    const types = graph['@graph'].map((n) => n['@type']);
    expect(types).toContain('WebPage');
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

  it('includes a BreadcrumbList node when breadcrumbs are provided', () => {
    const graph = buildGraph({
      type: 'questionList',
      url: 'https://walktalkmeditate.org/questions/morning/',
      title: 'Morning Seeds',
      description: 'Prompts for morning meditation.',
      items: ['What is alive in you?'],
      breadcrumbs: [
        { name: 'Home', url: 'https://walktalkmeditate.org/' },
        { name: 'Questions', url: 'https://walktalkmeditate.org/questions/' },
      ],
    }) as { '@graph': Array<Record<string, unknown>> };
    expect(graph['@graph'].some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
  });
});
