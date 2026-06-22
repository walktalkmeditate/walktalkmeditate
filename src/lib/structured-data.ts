export const SITE_URL = 'https://walktalkmeditate.org';
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const LOGO_URL = `${SITE_URL}/logo-128.png`;
const OG_IMAGE = `${SITE_URL}/og.png`;
export const TAGLINE = 'An open-source pilgrimage framework for walking, talking, and meditating.';

export const IOS_STORE_URL = 'https://apps.apple.com/app/pilgrim-mindful-walking/id6760921056';
export const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=org.walktalkmeditate.pilgrim';
export const APP_STORE_URLS: string[] = [IOS_STORE_URL, ANDROID_STORE_URL];

export const SAME_AS: string[] = [
  'https://pilgrimapp.org',
  'https://github.com/walktalkmeditate',
  ...APP_STORE_URLS,
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
    logo: { '@type': 'ImageObject', url: LOGO_URL },
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

function webPageNode(input: StructuredDataInput, schemaType: 'WebPage' | 'CollectionPage', mainEntityId?: string): Node {
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

export const APP_ID = `${SITE_URL}/pilgrim/#app`;

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
    '@id': `${input.url}#howto`,
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
    '@id': `${input.url}#items`,
    name: input.title,
    numberOfItems: items.length,
    itemListElement: items.map((text, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: text,
    })),
  };
}

export interface SchemaGraph {
  '@context': string;
  '@graph': Record<string, unknown>[];
}

export function buildGraph(input: StructuredDataInput): SchemaGraph {
  const graph: Node[] = [organizationNode(), websiteNode()];
  const crumbs = input.breadcrumbs ?? [];
  const pushBreadcrumb = () => {
    if (crumbs.length > 0) graph.push(breadcrumbNode(input.url, crumbs));
  };

  switch (input.type) {
    case 'home':
      graph.push(webPageNode(input, 'WebPage', ORG_ID), mobileAppNode());
      break;
    case 'app':
      graph.push(webPageNode(input, 'WebPage', APP_ID), mobileAppNode());
      pushBreadcrumb();
      break;
    case 'howto':
      graph.push(webPageNode(input, 'WebPage', `${input.url}#howto`), howToNode(input));
      pushBreadcrumb();
      break;
    case 'questionList':
      graph.push(webPageNode(input, 'CollectionPage', `${input.url}#items`), itemListNode(input));
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

  return { '@context': 'https://schema.org', '@graph': graph };
}
