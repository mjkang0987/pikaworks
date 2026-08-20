import Link from 'next/link';
import { notFound } from 'next/navigation';
import Reveal from '../../components/Reveal';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import LatestPosts from '../../components/LatestPosts';
import { PRODUCTS, getProduct } from '../../data/products';

export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};

  const title = `${product.name} — ${product.tagline}`;
  return {
    title,
    description: product.summary,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description: product.summary,
      url: `/products/${product.slug}`,
      type: 'website',
      images: [{ url: product.shot, alt: `${product.name} 미리보기` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: product.summary,
      images: [product.shot],
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const {
    name, tagline, summary, benefits, features, gallery, steps, faq,
    href, ctaLabel, ios, price, shot, accent,
  } = product;
  const others = PRODUCTS.filter((p) => p.slug !== slug);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* ── hero ───────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink px-5 py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="animate-blob-1 absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl"
            style={{ background: `${accent}4d` }}
          />
          <div className="animate-blob-2 absolute -right-16 top-16 h-72 w-72 rounded-full bg-[#9a6bff]/25 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal as="p" className="mb-6">
            <Link
              href="/#products"
              className="inline-flex items-center gap-1 text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              <span aria-hidden>←</span> 제품 목록
            </Link>
          </Reveal>
          <Reveal
            as="h1"
            className="text-4xl font-black leading-[1.15] tracking-tight text-white sm:text-5xl"
          >
            {name}
          </Reveal>
          <Reveal as="p" delay={80} className="mt-4 text-lg font-semibold" style={{ color: accent }}>
            {tagline}
          </Reveal>
          {(price || ios) && (
            <Reveal delay={120} className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {price && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/80">
                  {price}
                </span>
              )}
              {ios && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/80">
                  iOS 앱 제공
                </span>
              )}
            </Reveal>
          )}
          <Reveal
            as="p"
            delay={180}
            className="mx-auto mt-5 max-w-xl break-keep text-base leading-relaxed text-white/65"
          >
            {summary}
          </Reveal>
          <Reveal delay={240} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-[transform,background] duration-300 hover:-translate-y-0.5 hover:bg-brand-strong"
            >
              {ctaLabel}
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
                ↗
              </span>
            </a>
            {ios && (
              <a
                href={ios}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 transition-[transform,background,color] duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                App Store
              </a>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── 대표 화면 ──────────────────────────── */}
      {shot && (
        <section className="mx-auto max-w-5xl px-5 py-14 sm:py-16">
          <Reveal>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-[var(--radius-card)] border border-border bg-white shadow-[0_24px_60px_-30px_rgba(28,28,30,0.4)] transition-transform duration-500 hover:-translate-y-1"
            >
              <img src={shot} alt={`${name} 화면`} className="w-full" />
            </a>
          </Reveal>
        </section>
      )}

      {/* ── 왜 쓰나요 ──────────────────────────── */}
      {benefits?.length > 0 && (
        <section className="border-t border-border bg-ink">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <Reveal className="mb-10 text-center">
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                왜 쓰나요
              </h2>
            </Reveal>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {benefits.map((b, i) => (
                <Reveal as="li" key={b.title} delay={i * 90}>
                  <div className="h-full rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-6">
                    <h3
                      className="text-base font-bold tracking-tight"
                      style={{ color: accent }}
                    >
                      {b.title}
                    </h3>
                    <p className="mt-2 break-keep text-sm leading-relaxed text-white/70">
                      {b.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── 화면 미리보기 ──────────────────────── */}
      {gallery?.length > 0 && (
        <section className="border-t border-border bg-bg-soft">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <Reveal className="mb-10 text-center">
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                화면 미리보기
              </h2>
              <p className="mt-3 text-sm text-muted">실제 서비스 화면입니다.</p>
            </Reveal>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {gallery.map((g, i) => (
                <Reveal as="li" key={g.src} delay={(i % 2) * 90}>
                  <figure className="h-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-white shadow-[0_1px_2px_rgba(28,28,30,0.04)]">
                    <img
                      src={g.src}
                      alt={g.caption}
                      loading="lazy"
                      className="w-full border-b border-border"
                    />
                    <figcaption className="break-keep px-5 py-4 text-sm leading-relaxed text-muted">
                      {g.caption}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── 기능 ───────────────────────────────── */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <Reveal className="mb-10 text-center">
            <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
              무엇을 할 수 있나요
            </h2>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 2) * 90}>
                <div className="h-full rounded-[var(--radius-card)] border border-border bg-bg-soft p-6">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: accent }}
                    />
                    <h3 className="text-base font-bold tracking-tight text-ink">{f.title}</h3>
                  </div>
                  <p className="mt-2 break-keep text-sm leading-relaxed text-muted">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 시작하는 법 ────────────────────────── */}
      {steps?.length > 0 && (
        <section className="border-t border-border bg-bg-soft">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <Reveal className="mb-10 text-center">
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                이렇게 시작해요
              </h2>
            </Reveal>
            <ol className="mx-auto grid max-w-3xl grid-cols-1 gap-4">
              {steps.map((s, i) => (
                <Reveal as="li" key={s} delay={i * 70}>
                  <div className="flex items-start gap-4 rounded-[var(--radius-card)] border border-border bg-white p-5">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: accent }}
                    >
                      {i + 1}
                    </span>
                    <p className="break-keep text-sm leading-relaxed text-ink/80">{s}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── blog feed (blog 페이지에서만) ───────── */}
      {slug === 'blog' && (
        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <Reveal className="mb-8">
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">최신 글</h2>
            </Reveal>
            <Reveal delay={80}>
              <LatestPosts />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── FAQ ────────────────────────────────── */}
      {faq?.length > 0 && (
        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <Reveal className="mb-10 text-center">
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                자주 묻는 질문
              </h2>
            </Reveal>
            <ul className="mx-auto max-w-3xl">
              {faq.map((item, i) => (
                <Reveal as="li" key={item.q} delay={i * 60} className="border-b border-border">
                  {/* details/summary — 스크립트 없이도 열립니다 */}
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-ink transition-colors hover:text-brand">
                      {item.q}
                      <span
                        aria-hidden
                        className="shrink-0 text-lg font-normal text-muted transition-transform duration-300 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="break-keep pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────── */}
      <section className="border-t border-border bg-bg-soft">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:py-20">
          <Reveal>
            <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
              지금 바로 써보세요
            </h2>
            {price && (
              <p className="mt-3 text-sm text-muted">{price}로 시작할 수 있습니다.</p>
            )}
          </Reveal>
          <Reveal delay={90} className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-[transform,background] duration-300 hover:-translate-y-0.5 hover:bg-brand-strong"
            >
              {ctaLabel}
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
                ↗
              </span>
            </a>
            {ios && (
              <a
                href={ios}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-ink transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(28,28,30,0.4)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                App Store
              </a>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── 다른 제품 ──────────────────────────── */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <Reveal className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">다른 제품</h2>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {others.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 90}>
                <Link
                  href={`/products/${p.slug}`}
                  className="group flex h-full flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-bg-soft p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(101,38,217,0.45)]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: p.accent }}
                    />
                    <span className="text-base font-bold tracking-tight text-ink transition-colors group-hover:text-brand">
                      {p.name}
                    </span>
                  </div>
                  <span className="break-keep text-sm leading-relaxed text-muted">{p.tagline}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
