import Reveal from './components/Reveal';
import ProductCard from './components/ProductCard';
import LatestPosts from './components/LatestPosts';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { PRODUCTS } from './data/products';

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

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
            <Reveal key={p.slug} delay={i * 110}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── latest blog posts ──────────────────── */}
      <section className="border-t border-border bg-bg-soft">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <Reveal className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                블로그 최신 글
              </h2>
              <p className="mt-2 text-sm text-muted">경제·부동산·IT 인사이트</p>
            </div>
            <a
              href="https://blog.pikaworks.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-strong sm:inline-flex"
            >
              전체 보기
              <span aria-hidden>↗</span>
            </a>
          </Reveal>
          <Reveal delay={80}>
            <LatestPosts />
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
