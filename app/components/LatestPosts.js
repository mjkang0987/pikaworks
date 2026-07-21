'use client';

import { useEffect, useState } from 'react';

const FEED_URL = 'https://blog.pikaworks.kr/feed.xml';
const BLOG_URL = 'https://blog.pikaworks.kr';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function LatestPosts() {
  // 'loading' | 'ok' | 'error'
  const [state, setState] = useState('loading');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(FEED_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`feed ${res.status}`);
        const xml = await res.text();
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        if (doc.querySelector('parsererror')) throw new Error('parse error');

        const entries = Array.from(doc.querySelectorAll('entry'))
          .slice(0, 3)
          .map((e) => {
            const linkEl =
              e.querySelector('link[rel="alternate"]') || e.querySelector('link');
            return {
              title: e.querySelector('title')?.textContent?.trim() ?? '',
              url: linkEl?.getAttribute('href') ?? BLOG_URL,
              date:
                e.querySelector('published')?.textContent ??
                e.querySelector('updated')?.textContent ??
                '',
            };
          })
          .filter((p) => p.title);

        if (!alive) return;
        if (!entries.length) throw new Error('empty');
        setPosts(entries);
        setState('ok');
      } catch {
        if (alive) setState('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // fetch 실패 → 섹션 대신 블로그 바로가기만
  if (state === 'error') {
    return (
      <a
        href={BLOG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
      >
        블로그에서 최신 글 보기
        <span aria-hidden>↗</span>
      </a>
    );
  }

  if (state === 'loading') {
    return (
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-[92px] animate-pulse rounded-[var(--radius-card)] border border-border bg-white"
          />
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {posts.map((p) => (
        <li key={p.url}>
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-white p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(101,38,217,0.3)]"
          >
            <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-brand">
              {p.title}
            </span>
            <span className="text-xs font-medium text-muted">{formatDate(p.date)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
