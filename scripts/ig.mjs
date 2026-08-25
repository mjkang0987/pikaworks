// 인스타그램 이미지 렌더러 — 파이프라인 3단계(sns-designer)의 실행부.
//
//   node scripts/ig.mjs pipeline/ideas/<id>.json      상태 파일의 design 을 렌더
//   node scripts/ig.mjs <spec>.json --out preview.png  스펙 파일만 렌더 (시안 확인용)
//
// 상태 파일을 넘기면 PNG 를 public/ig/<id>.png 로 쓰고, image_path / image_url 을
// 채운 뒤 status 를 design_done 으로 올린다. image_ok 는 사람만 쓸 수 있으므로
// 이 스크립트는 절대 그 값을 쓰지 않는다.
//
// 폰트는 assets/fonts 에 넣어 뒀다. 시스템 폰트에 의존하지 않으므로 맥·리눅스·CI
// 어디서 돌려도 같은 픽셀이 나온다.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename } from 'path';

const SIZE = 1080;          // CSS px. deviceScaleFactor 2 → 2160×2160 (기존 6장과 동일)
const SITE = 'https://pikaworks.kr';

// 기존 인스타 6장에서 뽑은 팔레트. 사이트 브랜드(#6526d9)와 다르니 섞지 말 것.
const C = {
  bg: '#ffffff',
  ink: '#18181b',
  accent: '#7c5cfc',
  accentSoft: '#efebff',
  border: '#e4e4e7',
  muted: '#71717a',
};

const BRAND = {
  clipnote: {
    name: 'ClipNote',
    domain: 'clipnote.co.kr',
    // 북마크 글리프
    mark: '<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/>',
  },
  takeaseat: {
    name: 'Take a Seat',
    domain: 'takeaseat.co.kr',
    // 의자 글리프
    mark: '<path d="M7 4h10v7H7z"/><path d="M6 12h12v2H6z"/><path d="M8 14h1.6v6H8zM14.4 14H16v6h-1.6z"/>',
  },
};

// list 템플릿용 아이콘. stroke 기반 24×24, currentColor 를 따른다.
const ICONS = {
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.9"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4"/>',
  chart: '<path d="M3 21h18"/><path d="M6 17v-5M11 17V7M16 17v-8M21 17v-3"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18.5h2"/>',
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function icon(name, size = 30, width = 2.1) {
  const path = ICONS[name];
  if (!path) throw new Error(`알 수 없는 아이콘: ${name} (가능: ${Object.keys(ICONS).join(', ')})`);
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
    stroke="currentColor" stroke-width="${width}" stroke-linecap="round"
    stroke-linejoin="round">${path}</svg>`;
}

// ── 템플릿 본문 ────────────────────────────────────────────────────

function bodyList(d) {
  const rows = (d.items || []).map((it) => `
    <div class="row">
      <div class="ic">${icon(it.icon || 'check')}</div>
      <div class="rt">${esc(it.text)}</div>
    </div>`).join('');
  return `<div class="list">${rows}</div>`;
}

function bodyStatement(d) {
  return `<div class="panel stmt">${esc(d.statement || '')}</div>`;
}

function bodyPanel(d) {
  // 캘린더 그리드처럼 건별로 생김새가 다른 목업은 여기에 HTML 조각으로 넣는다.
  // 아래 유틸 클래스를 쓸 수 있다: .grid5 .grid4 .cell .cell-on .cell-off
  return `<div class="panel">${d.html || ''}</div>`;
}

const BODIES = { list: bodyList, statement: bodyStatement, panel: bodyPanel };

// ── 페이지 ────────────────────────────────────────────────────────

function render(design, service, fontDataUrl) {
  const brand = BRAND[service];
  if (!brand) throw new Error(`알 수 없는 service: ${service} (clipnote | takeaseat)`);

  const build = BODIES[design.template];
  if (!build) throw new Error(`알 수 없는 template: ${design.template} (${Object.keys(BODIES).join(' | ')})`);

  const title = Array.isArray(design.title) ? design.title : [design.title];
  if (title.length > 2) throw new Error('title 은 최대 2줄이다 (1줄 먹색 / 2줄 보라색)');

  const heading = title.map((line, i) =>
    `<div class="${i === 0 && title.length > 1 ? 'h1' : 'h1 accent'}">${esc(line)}</div>`).join('');

  const chips = (design.chips || []).map((c) => `<span class="chip">${esc(c)}</span>`).join('');

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
  @font-face {
    font-family: 'Pretendard';
    src: url('${fontDataUrl}') format('woff2-variations');
    font-weight: 100 900;
    font-display: block;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${SIZE}px; height:${SIZE}px; overflow:hidden;
    background:${C.bg}; color:${C.ink};
    font-family:'Pretendard', sans-serif;
    -webkit-font-smoothing:antialiased;
    display:flex; flex-direction:column;
    padding:88px 84px 74px;
  }

  /* 헤더 */
  .head { display:flex; align-items:flex-start; gap:24px; }
  .h1 { font-size:66px; font-weight:800; line-height:1.24; letter-spacing:-.035em; }
  .accent { color:${C.accent}; }
  .badge {
    margin-left:auto; flex:none;
    background:${C.accentSoft}; color:${C.accent};
    font-size:26px; font-weight:700; letter-spacing:-.02em;
    padding:18px 30px; border-radius:999px; white-space:nowrap;
  }
  .sub {
    margin-top:26px; font-size:31px; font-weight:500;
    color:${C.muted}; letter-spacing:-.02em; line-height:1.45;
  }

  /* 본문 — 헤더와 푸터 사이 남는 공간을 채우고 세로 중앙에 놓인다 */
  .body { flex:1; display:flex; flex-direction:column; justify-content:center; min-height:0; padding:38px 0; }

  .list { display:flex; flex-direction:column; }
  .row { display:flex; align-items:center; gap:34px; padding:36px 4px; }
  .row + .row { border-top:1.5px solid ${C.border}; }
  .ic {
    flex:none; width:78px; height:78px; border-radius:20px;
    background:${C.accentSoft}; color:${C.accent};
    display:flex; align-items:center; justify-content:center;
  }
  .rt { font-size:35px; font-weight:700; letter-spacing:-.025em; line-height:1.35; }

  .panel { background:${C.accentSoft}; border-radius:34px; padding:44px; }
  .stmt {
    font-size:52px; font-weight:800; line-height:1.4; letter-spacing:-.03em;
    color:${C.ink}; padding:64px 54px; text-align:center;
  }

  /* panel 안에서 쓰는 유틸 */
  .grid5, .grid4 { display:grid; gap:18px; margin-bottom:18px; }
  .grid5 { grid-template-columns:repeat(5,1fr); }
  .grid4 { grid-template-columns:repeat(4,1fr); }
  .cell {
    background:#fff; border-radius:18px; padding:26px 10px; text-align:center;
    font-size:32px; font-weight:800; letter-spacing:-.02em;
  }
  .cell small { display:block; font-size:23px; font-weight:600; color:${C.muted}; margin-bottom:8px; }
  .cell-on { background:${C.accent}; color:#fff; }
  .cell-on small { color:rgba(255,255,255,.75); }
  .cell-off { background:transparent; border:2px dashed ${C.border}; color:#c9c9d1; }

  .note { margin-top:34px; text-align:center; font-size:29px; font-weight:600; color:${C.muted}; letter-spacing:-.02em; }
  .chips { margin-top:26px; display:flex; gap:16px; justify-content:center; }
  .chip {
    background:${C.accentSoft}; color:${C.accent};
    font-size:24px; font-weight:700; padding:14px 26px; border-radius:999px;
  }

  /* 푸터 */
  .foot { display:flex; align-items:center; gap:22px; }
  .mark {
    width:70px; height:70px; border-radius:20px; background:${C.accent};
    display:flex; align-items:center; justify-content:center;
  }
  .brand { font-size:38px; font-weight:800; letter-spacing:-.03em; }
  .domain { margin-left:auto; font-size:31px; font-weight:500; color:#a1a1aa; letter-spacing:-.02em; }
</style></head><body>
  <div class="head">
    <div>${heading}</div>
    ${design.badge ? `<div class="badge">${esc(design.badge)}</div>` : ''}
  </div>
  ${design.subtitle ? `<div class="sub">${esc(design.subtitle)}</div>` : ''}
  <div class="body">
    ${build(design)}
    ${design.footerNote ? `<div class="note">${esc(design.footerNote)}</div>` : ''}
    ${chips ? `<div class="chips">${chips}</div>` : ''}
  </div>
  <div class="foot">
    <div class="mark"><svg viewBox="0 0 24 24" width="38" height="38" fill="#fff">${brand.mark}</svg></div>
    <div class="brand">${esc(brand.name)}</div>
    <div class="domain">${esc(brand.domain)}</div>
  </div>
</body></html>`;
}

// ── 실행 ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const inputPath = args.find((a) => !a.startsWith('--'));
const outFlag = args.indexOf('--out');
if (!inputPath) {
  console.error('사용법: node scripts/ig.mjs pipeline/ideas/<id>.json [--out <path>.png]');
  process.exit(2);
}

const input = JSON.parse(readFileSync(inputPath, 'utf8'));
const isIdea = Boolean(input.service && Object.prototype.hasOwnProperty.call(input, 'status'));
const design = isIdea ? input.design : input;
const service = isIdea ? input.service : input.service;

if (!design) {
  console.error(`${inputPath} 에 design 이 없습니다. sns-designer 가 먼저 채워야 합니다.`);
  process.exit(2);
}

const id = isIdea ? input.id : basename(inputPath, '.json');
const outPath = outFlag >= 0 ? args[outFlag + 1] : `public/ig/${id}.png`;

const fontPath = 'assets/fonts/PretendardVariable.woff2';
if (!existsSync(fontPath)) {
  console.error(`${fontPath} 가 없습니다. 이 파일 없이는 한글이 두부로 렌더됩니다.`);
  process.exit(2);
}
const fontDataUrl =
  `data:font/woff2;base64,${readFileSync(fontPath).toString('base64')}`;

const html = render(design, service, fontDataUrl);

// CHROMIUM_PATH 는 playwright 가 받아둔 브라우저를 못 찾는 환경(컨테이너 등)용 탈출구다.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({
  viewport: { width: SIZE, height: SIZE },
  deviceScaleFactor: 2,
});
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: outPath });
await browser.close();

console.log(`렌더 완료 → ${outPath} (${SIZE * 2}×${SIZE * 2})`);

if (isIdea && outFlag < 0) {
  input.image_path = outPath;
  input.image_url = `${SITE}/ig/${id}.png`;
  // design_done 까지만 올린다. image_ok 는 사람이 눈으로 보고 직접 쓴다.
  if (input.status === 'proposed' || input.status === 'approved' || input.status === 'design_done') {
    input.status = 'design_done';
  }
  writeFileSync(inputPath, `${JSON.stringify(input, null, 2)}\n`, 'utf8');
  console.log(`${inputPath} 갱신 — status=${input.status}, image_url=${input.image_url}`);
}
