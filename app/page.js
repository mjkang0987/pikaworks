import Reveal from './components/Reveal';
import ProductCard from './components/ProductCard';

const PRODUCTS = [
  {
    name: 'clipnote',
    tagline: '붙여넣기 한 번, 클릭을 부르는 공유 카드',
    desc: '밋밋한 링크 대신 제목·대표 이미지가 담긴 카드와 짧은 링크로 공유합니다.',
    href: 'https://clipnote.co.kr',
    shot: '/shots/clipnote.png',
    monogram: 'c',
    accent: '#6526d9',
  },
  {
    name: 'takeaseat',
    tagline: '예약·고객 관리 서비스',
    desc: '예약 캘린더부터 고객·담당자·매출까지, 매장 운영에 필요한 기능을 한 곳에서.',
    href: 'https://takeaseat.co.kr',
    shot: '/shots/takeaseat.png',
    monogram: 'T',
    accent: '#ec4899',
  },
  {
    name: 'blog',
    tagline: '경제·부동산·IT 인사이트',
    desc: '매일의 흐름을 읽고 정리한 글을 기록합니다.',
    href: 'https://blog.pikaworks.kr',
    shot: '/shots/blog.png',
    monogram: 'B',
    accent: '#0ea5e9',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── header ─────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <a href="#top" className="flex items-center">
            <img
              src="/logo.svg"
              alt="PIKAWORKS"
              className="h-5 w-auto transition-opacity hover:opacity-80"
            />
          </a>
          <nav className="flex items-center gap-5 text-sm font-medium text-white/70">
            <a className="transition-colors hover:text-white" href="#products">
              제품
            </a>
            <a
              className="transition-colors hover:text-white"
              href="https://blog.pikaworks.kr"
              target="_blank"
              rel="noopener noreferrer"
            >
              블로그
            </a>
          </nav>
        </div>
        <span className="block h-0.5 w-full bg-gradient-to-r from-brand via-brand-strong to-brand" />
      </header>

      {/* ── hero ───────────────────────────────── */}
      <section
        id="top"
        className="relative overflow-hidden bg-ink px-5 py-24 sm:py-32"
      >
        {/* ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob-1 absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/30 blur-3xl" />
          <div className="animate-blob-2 absolute -right-16 top-24 h-72 w-72 rounded-full bg-[#9a6bff]/25 blur-3xl" />
          <div className="animate-blob-1 absolute bottom-[-6rem] left-1/3 h-64 w-64 rounded-full bg-brand-strong/25 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal
            as="span"
            className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/70"
          >
            PIKAWORKS STUDIO
          </Reveal>
          <Reveal
            as="h1"
            delay={80}
            className="mt-6 text-4xl font-black leading-[1.15] tracking-tight text-white sm:text-6xl"
          >
            일상을 정리하는
            <br />
            <span className="text-gradient">작은 도구들</span>
          </Reveal>
          <Reveal
            as="p"
            delay={160}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg"
          >
            흩어진 링크, 예약, 기록을 가볍고 단정하게 —<br className="hidden sm:block" />
            PIKAWORKS가 만드는 세 가지 제품을 소개합니다.
          </Reveal>
          <Reveal delay={240} className="mt-9">
            <a
              href="#products"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-[transform,background] duration-300 hover:-translate-y-0.5 hover:bg-brand-strong"
            >
              제품 둘러보기
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="transition-transform duration-300 group-hover:translate-y-0.5"
              >
                <path
                  d="M12 5v14M6 13l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── products ───────────────────────────── */}
      <section id="products" className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
        <Reveal className="mb-12 text-center">
          <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            제품
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            작지만 쓸모 있게, 하나의 문제를 정확히 해결합니다.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.name} delay={i * 110}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── footer ─────────────────────────────── */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <img src="/logo-dark.svg" alt="PIKAWORKS" className="h-5 w-auto" />

          <div className="flex flex-col items-center gap-1 sm:items-end">
            <a
              href="mailto:pikaworks.help@gmail.com"
              className="text-sm font-medium text-muted transition-colors hover:text-brand"
            >
              pikaworks.help@gmail.com
            </a>
            <span className="text-xs text-muted/80">
              © {new Date().getFullYear()} PIKAWORKS. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
