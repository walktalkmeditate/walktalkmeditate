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
