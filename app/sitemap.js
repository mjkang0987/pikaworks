import { PRODUCTS } from './data/products';

export const dynamic = 'force-static';

const SITE_URL = 'https://pikaworks.kr';

export default function sitemap() {
  return [
    {
      url: SITE_URL,
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...PRODUCTS.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ];
}
