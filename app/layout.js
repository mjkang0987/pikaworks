import './globals.css';

const SITE_URL = 'https://pikaworks.kr';
const DESCRIPTION =
  'PIKAWORKS는 일상을 정리하는 작은 도구들을 만듭니다. 링크 북마크 clipnote, 예약·고객 관리 takeaseat, 경제·부동산·IT 블로그.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PIKAWORKS — 일상을 정리하는 작은 도구들',
    template: '%s | PIKAWORKS',
  },
  description: DESCRIPTION,
  keywords: [
    'PIKAWORKS',
    '피카웍스',
    'clipnote',
    '클립노트',
    'takeaseat',
    '예약 관리',
    '북마크',
    '링크 공유',
    'pikaworks blog',
  ],
  authors: [{ name: 'PIKAWORKS' }],
  creator: 'PIKAWORKS',
  publisher: 'PIKAWORKS',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'PIKAWORKS — 일상을 정리하는 작은 도구들',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'PIKAWORKS',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'PIKAWORKS — 일상을 정리하는 작은 도구들',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PIKAWORKS — 일상을 정리하는 작은 도구들',
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export const viewport = {
  themeColor: '#1c1c1e',
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'PIKAWORKS',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-dark.svg`,
      email: 'pikaworks.help@gmail.com',
      slogan: '일상을 정리하는 작은 도구들',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'PIKAWORKS',
      description: DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'ko-KR',
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </body>
    </html>
  );
}
