export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://pikaworks.kr/sitemap.xml',
    host: 'https://pikaworks.kr',
  };
}
