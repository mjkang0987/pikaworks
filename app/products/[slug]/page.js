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
    title: `${product.name} — ${product.tagline}`,
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

  const { name, tagline, summary, features, href, ctaLabel, shot, accent } = product;
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
          <Reveal
            as="p"
            delay={80}
            className="mt-4 text-lg font-semibold"
            style={{ color: accent }}
          >
            {tagline}
          </Reveal>
          <Reveal
            as="p"
            delay={160}
            className="mx-auto mt-5 max-w-xl break-keep text-base leading-relaxed text-white/65"
          >
            {summary}
          </Reveal>
          <Reveal delay={240} className="mt-8">
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
          </Reveal>
        </div>
      </section>

      {/* ── screenshot ─────────────────────────── */}
      {shot && (
        <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
          <Reveal>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-[var(--radius-card)] border border-border bg-white shadow-[0_24px_60px_-30px_rgba(28,28,30,0.4)] transition-transform duration-500 hover:-translate-y-1"
            >
              <img
                src={shot}
                alt={`${name} 화면`}
                className="w-full"
              />
            </a>
          </Reveal>
        </section>
      )}

      {/* ── features ───────────────────────────── */}
      <section className="border-t border-border bg-bg-soft">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <Reveal className="mb-10 text-center">
            <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
              무엇을 할 수 있나요
            </h2>
          </Reveal>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal as="li" key={f.title} delay={i * 90}>
                <div className="h-full rounded-[var(--radius-card)] border border-border bg-white p-6">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: accent }}
                    />
                    <h3 className="text-base font-bold tracking-tight text-ink">
                      {f.title}
                    </h3>
                  </div>
                  <p className="mt-2 break-keep text-sm leading-relaxed text-muted">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── blog feed (blog 페이지에서만) ───────── */}
      {slug === 'blog' && (
        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
            <Reveal className="mb-8">
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                최신 글
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <LatestPosts />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── other products ─────────────────────── */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <Reveal className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
              다른 제품
            </h2>
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
                  <span className="text-sm leading-relaxed text-muted">{p.tagline}</span>
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
