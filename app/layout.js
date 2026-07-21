import './globals.css';

export const metadata = {
  metadataBase: new URL('https://pikaworks.kr'),
  title: 'PIKAWORKS — 일상을 정리하는 작은 도구들',
  description:
    'PIKAWORKS는 일상을 정리하는 작은 도구들을 만듭니다. clipnote · takeaseat · blog.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'PIKAWORKS',
    description: '일상을 정리하는 작은 도구들',
    url: 'https://pikaworks.kr',
    siteName: 'PIKAWORKS',
    locale: 'ko_KR',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#1c1c1e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
