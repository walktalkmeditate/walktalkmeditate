import { describe, it, expect } from 'vitest';
import {
  organizationNode,
  websiteNode,
  buildGraph,
  ORG_ID,
  WEBSITE_ID,
  SAME_AS,
} from './structuredData';
import { breadcrumbNode } from './structuredData';

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
