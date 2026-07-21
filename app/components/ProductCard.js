'use client';

import { useRef } from 'react';

export default function ProductCard({ product }) {
  const { name, tagline, desc, href, shot, accent, monogram, status } = product;
  const cardRef = useRef(null);

  function onMove(e) {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(px * 6).toFixed(2)}deg`);
  }
  function onLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  const live = Boolean(href);
  const Wrap = live ? 'a' : 'div';
  const wrapProps = live
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Wrap
      {...wrapProps}
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-white shadow-[0_1px_2px_rgba(28,28,30,0.04)] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(101,38,217,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      style={{
        transform:
          'perspective(1000px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))',
      }}
    >
      {/* screenshot / preview */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-bg-soft">
        {shot ? (
          <img
            src={shot}
            alt={`${name} 미리보기`}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${accent}22, ${accent}0d 60%, #ffffff)`,
            }}
          >
            <span
              className="animate-bob text-6xl font-black tracking-tight"
              style={{ color: accent }}
            >
              {monogram}
            </span>
          </div>
        )}
        {/* shimmer sweep on hover */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent group-hover:[animation:shimmer_1.1s_ease-in-out]" />
        </span>
        {status && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {status}
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: accent }}
          />
          <h3 className="text-lg font-bold tracking-tight text-ink">{name}</h3>
        </div>
        <p className="text-sm font-medium text-ink/80">{tagline}</p>
        <p className="text-sm leading-relaxed text-muted">{desc}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          {live ? '바로가기' : '곧 공개'}
          {live && (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </div>
    </Wrap>
  );
}
