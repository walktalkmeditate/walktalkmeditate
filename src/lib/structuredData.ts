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
