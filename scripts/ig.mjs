// 인스타그램 캐러셀 렌더러 — 파이프라인 3단계(sns-designer)의 실행부.
//
//   node scripts/ig.mjs pipeline/ideas/<id>.json        상태 파일의 design 을 렌더
//   node scripts/ig.mjs <spec>.json --out-dir /tmp/x    스펙만 렌더 (시안 확인용)
//
// 한 건이 여러 장(캐러셀)이다. 순서는 항상 커버 → 내용 1~N → 마감 이다.
// public/ig/<id>-1.png … <id>-N.png 로 쓰고 image_urls 를 채운 뒤
// status 를 design_done 으로 올린다. image_ok 는 사람만 쓴다.
//
// 일관성은 전부 이 파일이 강제한다. 타입 스케일·여백·푸터가 고정이라
// 카피만 바꿔 넣으면 앞뒤 게시물이 저절로 같은 톤으로 나온다.
// 새 생김새가 필요하면 인라인 스타일로 우회하지 말고 여기에 템플릿을 추가한다.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { basename, join } from 'path';

const SIZE = 1080;
const COVER_TITLE_PX = 178;
// 커버 마지막 줄(강조 줄)을 어떻게 강조할지.
//   text    글자색만 바꾼다
//   block   키컬러 면을 깔고 글자는 흰색
//   marker  키컬러 형광펜 바 + 흰 글자
// 색 하나로 강조와 가독성을 동시에 만족시킬 수 없어서 나눠 둔 선택지다.
// 밝게 하면 강조가 죽고 진하게 하면 안 읽힌다. block·marker 는 강조를
// 면으로 옮겨 글자를 흰색으로 유지한다.
// COVER_ACCENT 환경변수로 갈아끼워 비교할 수 있다.
const COVER_ACCENT_OVERRIDE = process.env.COVER_ACCENT;   // 비교용
const SITE = 'https://pikaworks.kr';
const MAX_SLIDES = 10;      // 인스타 캐러셀 상한

// 색은 각 서비스 저장소에서 가져온다. 여기 값을 바꾸려면 먼저 저장소를 확인할 것.
//   ClipNote   clipnote  app/globals.css
//   Take a Seat  tas  client/styles/globalStyle.ts
// 마감 슬라이드 하단의 pikaworks 서명. 파비콘(검정 타일)이 아니라 정식 가로형
// 로고를 쓴다. 글자까지 로고에 포함돼 있어 따로 텍스트를 붙이지 않는다.
// 배경에 따라 글자색이 다른 두 파일이 이미 준비돼 있다.
const PIKA_LOGO = {
  dark: 'public/logo.svg',        // 글자 흰색 — Take a Seat
  light: 'public/logo-dark.svg',  // 글자 #1c1c1e — ClipNote
};

const THEME = {
  // 흰 배경 + 보라 키컬러. globals.css 의 라이트 테마 그대로다.
  clipnote: {
    name: 'ClipNote',
    domain: 'clipnote.co.kr',
    tagline: '밋밋한 링크를 카드 한 장으로',
    bg: '#ffffff',          // --bg
    fg: '#18181b',          // --fg
    muted: '#71717a',       // --fg-muted
    border: '#e4e4e7',      // --border
    accent: '#7c5cfc',      // --brand
    accentInk: '#7c5cfc',   // 밝은 배경이라 글자에도 그대로 쓴다
    soft: '#efebff',        // --brand-soft
    softInk: '#5b3fe0',     // --brand-strong
    chipInk: '#5b3fe0',
    chipBorder: '#ddd2fa',
    strong: '#5b3fe0',      // --brand-strong
    coverAccent: 'text',    // 흰 배경이라 보라 글자가 그대로 잘 읽힌다
    badgeStyle: 'soft',
    onAccent: '#ffffff',
    logo: 'assets/logos/clipnote.png',
    pikaLogo: 'light',
    appStore: true,   // products.js 의 ios 링크(앱 ID 6792600343)로 출시 확인
  },
  // 블랙 배경 + 흰색/보라. --aside-bg 가 TAS 가 실제로 쓰는 다크 면이다.
  // --brand-color(#6526d9)는 어두워서 다크 위 글자로는 안 읽힌다. 면에만 쓰고,
  // 글자 강조는 #9a6bff 를 쓴다 — pikaworks OG 이미지(scripts/og.mjs)가
  // 같은 #1c1c1e 배경에서 이미 쓰고 있는 밝은 보라다.
  takeaseat: {
    name: 'Take a Seat',
    domain: 'takeaseat.co.kr',
    tagline: '예약부터 단골 관리까지',
    bg: '#1c1c1e',                        // --aside-bg
    fg: '#f5f5f7',                        // --aside-text
    muted: 'rgba(245,245,247,.58)',
    border: 'rgba(255,255,255,.12)',      // --aside-divider
    accent: '#6526d9',                    // --brand-color
    accentInk: '#ba9dee',   // #6526d9 + 흰색 55%. #1c1c1e 위 7.41:1 (AAA)
    soft: 'rgba(255,255,255,.07)',        // --aside-hover 계열
    softInk: '#c9b4ff',
    chipInk: '#f5f5f7',
    chipBorder: 'rgba(255,255,255,.14)',
    strong: '#6526d9',      // --brand-color 원본. 흰 글자 7.41:1
    coverAccent: 'marker',  // 다크에선 글자색만으로 강조와 가독성을 동시에 못 잡는다
    badgeStyle: 'solid',
    onAccent: '#ffffff',
    logo: 'assets/logos/takeaseat.png',
    pikaLogo: 'dark',
    appStore: false,   // 웹 전용. App Store 문구를 쓰면 안 된다
    icons: 'assets/icons/takeaseat.json',   // 서비스 사이드바가 실제로 쓰는 글리프
  },
};

const ICONS = {
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.9"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 9l3.5 4 3.5-4M9.5 13h5M9.5 15.5h5M12 13v3"/>',
  chart: '<path d="M3 21h18"/><path d="M6 17v-5M11 17V7M16 17v-8M21 17v-3"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18.5h2"/>',
  ticket: '<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 6 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-6z"/><path d="M12 7v10"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
};

// App Store 배지는 애플 공식 에셋을 그대로 쓴다 (assets/logos/SOURCE.md).
// 애플은 배지를 재현하거나 변형하는 것을 금지하고 공식 파일 사용을 요구한다.
const APP_STORE_BADGE = 'assets/logos/app-store-badge.svg';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 서비스 저장소에서 가져온 아이콘이 있으면 그걸 먼저 쓴다 (assets/logos/SOURCE.md).
// 직접 그린 공용 세트는 대응하는 실제 아이콘이 없을 때만 쓴다.
function icon(name, t, size = 36, width = 2) {
  const path = (t && t.iconSet && t.iconSet[name]) || ICONS[name];
  if (!path) {
    const own = t && t.iconSet ? Object.keys(t.iconSet) : [];
    throw new Error(
      `알 수 없는 아이콘: ${name}\n  ${t ? t.name : ''} 실제 아이콘: ${own.join(', ')}` +
      `\n  공용: ${Object.keys(ICONS).join(', ')}`);
  }
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
    stroke="currentColor" stroke-width="${width}" stroke-linecap="round"
    stroke-linejoin="round">${path}</svg>`;
}

// ── 길이 검사 ─────────────────────────────────────────────────────
// 넘친 글자는 잘리지 않고 레이아웃을 밀어낸다. 렌더 전에 막는다.

// 실측값 (Pretendard 800, 공백 없는 빽빽한 한글 기준):
//   제목 178px → 줄당 6자, 3줄까지. 4줄은 세로가 안 나온다
//   kicker 29px → 23자, features 31px → 30자
// 아래는 거기서 여유를 둔 값이다. 넘치면 렌더가 실패하므로 카피 단계에서 걸린다.
const LIMITS = {
  'cover.title': 6,
  'cover.kicker': 12,
  'cover.features': 10,
  'slide.title': 14,
  'slide.subtitle': 32,
  'item.title': 12,
  'item.text': 30,
  'outro.headline': 16,
  'outro.sub': 30,
  'chat.tag': 10,
  'chat.title': 22,
  'chat.desc': 34,
  chip: 8,
};

// 공백은 한글 글자 폭의 절반도 안 되므로 세지 않는다. 세면 "카드 한 장으로"(8자)
// 처럼 실제로는 들어가는 카피가 반려된다. 아래 상한은 전부 공백 제외 기준이다.
const countable = (v) => String(v).replace(/\s/g, '').length;

function check(kind, value, where) {
  const max = LIMITS[kind];
  const n = value ? countable(value) : 0;
  if (n > max) {
    throw new Error(
      `${where}: "${value}" 가 공백 제외 ${n}자입니다. ${kind} 는 ${max}자까지.`);
  }
  return value;
}

// ── 슬라이드 ──────────────────────────────────────────────────────

function slideCover(d, t) {
  const title = (Array.isArray(d.title) ? d.title : [d.title]).slice(0, 3);
  title.forEach((l, i) => check('cover.title', l, `커버 title[${i}]`));
  check('cover.kicker', d.kicker, '커버 kicker');

  const heading = title.map((line, i) => {
    const last = i === title.length - 1;
    if (!last) return `<div class="cv-h">${esc(line)}</div>`;
    // 마지막 줄이 강조 줄이다. 색으로만 강조하면 밝게 할수록 강조가 약해지고
    // 진하게 할수록 안 읽힌다. 면으로 옮기면 두 역할이 분리된다.
    const mode = COVER_ACCENT_OVERRIDE || t.coverAccent;
    if (mode === 'text') return `<div class="cv-h accent">${esc(line)}</div>`;
    return `<div class="cv-h"><span class="hl ${mode}">${esc(line)}</span></div>`;
  }).join('');

  const feats = (d.features || []).slice(0, 3).map((f, i) => {
    check('cover.features', f, `커버 features[${i}]`);
    return `<div class="cv-f">${esc(f)}</div>`;
  }).join('');

  return `<section class="s cover">
    <div class="cv-top">
      <div class="cv-brand">
        ${markSvg(t, 74)}
        <span>${esc(t.name)}</span>
      </div>
      ${d.kicker ? `<div class="cv-k ${t.badgeStyle}">${esc(d.kicker)}</div>` : ''}
    </div>
    <div class="cv-mid">
      <div class="cv-hs">${heading}</div>
      ${feats ? `<div class="cv-fs">${feats}</div>` : ''}
    </div>
    <div class="cv-foot">
      <img class="cv-pika" src="${t.pikaUrl}" alt="pikaworks">
      <div class="cv-swipe">밀어서 보기 <span>→</span></div>
    </div>
  </section>`;
}

function slideOutro(t) {
  // 건마다 다르지 않고 앱당 한 장 고정이다.
  // 인스타는 캡션의 URL 이 클릭되지 않는다. 유일하게 눌리는 곳이 프로필 링크라
  // 거기로 보내는 문장을 CTA 로 쓴다. 도메인은 보조로만 적는다.
  return `<section class="s outro">
    <div class="ot-app">
      <div class="ot-mark">${markSvg(t, 150)}</div>
      <div class="ot-name">${esc(t.name)}</div>
      <div class="ot-tag">${esc(t.tagline)}</div>
      <div class="ot-cta">프로필 링크를 확인해주세요</div>
      <div class="ot-dom">https://${esc(t.domain)}</div>
      ${t.appStore ? `<img class="ot-app-store" src="${APP_STORE_URL}" alt="Download on the App Store">` : ''}
    </div>
    <img class="ot-by" src="${t.pikaUrl}" alt="pikaworks">
  </section>`;
}

function slideBody(d, t, index) {
  const title = (Array.isArray(d.title) ? d.title : [d.title]).slice(0, 2);
  title.forEach((l, i) => check('slide.title', l, `슬라이드 ${index} title[${i}]`));
  check('slide.subtitle', d.subtitle, `슬라이드 ${index} subtitle`);

  // 강조는 커버와 같은 방식을 쓴다. 다섯 장이 같은 규칙으로 강조해야
  // 한 묶음으로 읽힌다 — 커버만 형광펜이고 내용은 글자색이면 따로 논다.
  const heading = title.map((line, i) => {
    const last = i === title.length - 1 && title.length > 1;
    if (!last) return `<div class="h1">${esc(line)}</div>`;
    const mode = COVER_ACCENT_OVERRIDE || t.coverAccent;
    if (mode === 'text') return `<div class="h1 accent">${esc(line)}</div>`;
    return `<div class="h1"><span class="hl ${mode}">${esc(line)}</span></div>`;
  }).join('');

  let body;
  let overlay = '';
  if (d.template === 'list') {
    const rows = (d.items || []).slice(0, 4).map((it, i) => {
      check('item.title', it.title, `슬라이드 ${index} items[${i}].title`);
      check('item.text', it.text, `슬라이드 ${index} items[${i}].text`);
      return `<div class="card">
        <div class="ic">${icon(it.icon || 'check', t)}</div>
        <div class="ct">
          ${it.title ? `<div class="ct-t">${esc(it.title)}</div>` : ''}
          <div class="ct-d">${esc(it.text)}</div>
        </div>
      </div>`;
    }).join('');
    body = `<div class="cards">${rows}</div>`;
  } else if (d.template === 'shot') {
    // 실제 서비스 화면을 그대로 보여준다. 흐리게 깔지 않는 이유는
    // 흐리면 화면이 정보가 아니라 배경 질감이 되어 넣는 뜻이 사라지기 때문이다.
    // PC 창을 크게 놓고 폰을 오른쪽 아래에 겹친다.
    // pc 가 없으면 모바일 한 장만 크게 놓는다. ClipNote 처럼 모바일에서만
    // 쓰는 화면을 PC 창틀에 끼우면 실제와 다른 인상을 준다.
    body = d.pc
      ? `<div class="shot">
          <div class="sh-pc">
            <div class="sh-bar"><i></i><i></i><i></i></div>
            <img src="${shotUrl(d.pc, index, 'pc')}" alt="">
          </div>
          <div class="sh-mo"><img src="${shotUrl(d.mobile, index, 'mobile')}" alt=""></div>
        </div>`
      : '';
    if (!d.pc && d.wide) {
      // 가로로 넓은 화면 조각. shot-stand 는 height 고정이라 세로로 긴 폰
      // 화면만 맞는다 — 가로 조각을 넣으면 폭이 튀어 컨테이너를 뚫는다.
      // 흘려보내지 않고 본문 안에 카드로 앉힌다.
      body = `<div class="shot-wide"><div class="sw-frame">`
        + `<img src="${shotUrl(d.mobile, index, 'mobile')}" alt="">`
        + `<div class="shot-fade"></div></div></div>`;
    } else if (!d.pc) {
      const shots = Array.isArray(d.mobile) ? d.mobile.slice(0, 2) : [d.mobile];
      overlay = `<div class="shot-stand${shots.length > 1 ? ' pair' : ''}">${
        shots.map((m, i) => `<img src="${shotUrl(m, index, `mobile[${i}]`)}" alt="">`).join('')
      }<div class="shot-fade"></div></div>`;
    }
  } else if (d.template === 'chat') {
    // 실제 카톡은 미리보기가 말풍선 "아래" 별도 카드로 붙고, 카드는
    // 이미지가 위·글이 아래인 세로 구조다. 카카오톡 UI(노란 말풍선·다크 배경)를
    // 베끼지는 않되 이 구조는 맞춘다 — 안 맞추면 실제와 다른 걸 보여주게 된다.
    const b = d.before || {}, a = d.after || {};
    check('chat.tag', b.tag, `슬라이드 ${index} before.tag`);
    check('chat.tag', a.tag, `슬라이드 ${index} after.tag`);
    check('chat.title', a.title, `슬라이드 ${index} after.title`);
    if (a.desc) check('chat.desc', a.desc, `슬라이드 ${index} after.desc`);
    // before 를 안 주면 결과만 크게 보여준다. 제목이 이미 문제를 말하고
    // 있으면 빈 칸을 그려 대비를 만들 필요가 없다.
    const beforeCol = !d.before ? '' : `
      <div class="ch-row">
        <div class="ch-tag">${esc(b.tag)}</div>
        <div class="ch-bub">${esc(b.url || '')}</div>
        <div class="ch-none"><span>${esc(b.note || '')}</span></div>
      </div>`;
    body = `<div class="chat${d.before ? '' : ' solo'}">
      ${beforeCol}
      <div class="ch-row">
        <div class="ch-tag on">${esc(a.tag)}</div>
        <div class="ch-bub on">${esc(a.url || '')}</div>
        <div class="ch-card">
          <div class="ch-thumb">${a.image
            ? `<img src="${shotUrl(a.image, index, 'after.image')}" alt="">` : ''}</div>
          <div class="ch-meta">
            <div class="ch-t">${esc(a.title)}</div>
            ${a.desc ? `<div class="ch-s">${esc(a.desc)}</div>` : ''}
            <div class="ch-d">${esc(a.domain || t.domain)}</div>
          </div>
        </div>
      </div>
    </div>`;
  } else if (d.template === 'panel') {
    body = `<div class="panel">${d.html || ''}</div>`;
  } else if (d.template === 'statement') {
    body = `<div class="panel stmt">${esc(d.statement || '')}</div>`;
  } else {
    throw new Error(
      `슬라이드 ${index}: 알 수 없는 template "${d.template}" (list | panel | statement)`);
  }

  const chips = (d.chips || []).slice(0, 4).map((c, i) => {
    check('chip', c, `슬라이드 ${index} chips[${i}]`);
    return `<span class="chip">${esc(c)}</span>`;
  }).join('');

  return `<section class="s body${overlay && !Array.isArray(d.mobile) ? ' split' : ''}">
    <div class="head">${heading}</div>
    ${d.subtitle ? `<div class="sub">${esc(d.subtitle)}</div>` : ''}
    <div class="main">
      ${body}
      ${chips ? `<div class="chips">${chips}</div>` : ''}
    </div>
    ${overlay}
    <div class="foot">
      <img class="ft-pika" src="${t.pikaUrl}" alt="pikaworks">
      <div class="ft-app">
        ${markSvg(t, 34)}
        <div class="brand">${esc(t.name)}</div>
      </div>
    </div>
  </section>`;
}

// 스크린샷은 파일 경로로 받아 data URI 로 박는다. 외부 참조가 남으면
// 렌더 시점 네트워크에 의존하게 되고, 그러면 재현이 깨진다.
// 촬영 절차와 개인정보 근거는 assets/shots/SOURCE.md 를 본다.
function shotUrl(path, index, which) {
  if (!path) {
    throw new Error(`슬라이드 ${index}: shot 템플릿에 ${which} 경로가 없습니다.`);
  }
  if (!existsSync(path)) {
    throw new Error(`슬라이드 ${index}: ${path} 가 없습니다. assets/shots/SOURCE.md 참고.`);
  }
  return `data:image/png;base64,${readFileSync(path).toString('base64')}`;
}

// 서비스 저장소에서 가져온 앱 아이콘을 그대로 쓴다 (assets/logos/SOURCE.md).
// 자체 라운드 컨테이너가 이미 있으므로 배경을 덧대지 않는다.
const markSvg = (t, size) =>
  `<img class="logo" src="${t.logoUrl}" width="${size}" height="${size}" alt="">`;

// ── 페이지 ────────────────────────────────────────────────────────

function css(t, fontUrl) {
  return `
  @font-face {
    font-family: 'Pretendard';
    src: url('${fontUrl}') format('woff2-variations');
    font-weight: 100 900; font-display: block;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${SIZE}px; height:${SIZE}px; overflow:hidden;
    background:${t.bg}; color:${t.fg};
    font-family:'Pretendard', sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .s {
    /* 슬라이드 밖으로 흘려보낸 요소는 여기서 잘린다. 이게 없으면 문서 높이가
       늘어나 넘침 검사가 의도한 연출을 사고로 잡는다. */
    position:relative; overflow:hidden;
    width:${SIZE}px; height:${SIZE}px;
    display:flex; flex-direction:column;
    padding:74px 64px 64px;
  }

  /* ── 커버 ── 타이틀과 기능을 크게. 피드에서 이 한 장이 승부다 */
  .cover { background:${t.bg}; color:${t.fg}; }
  .cv-top { display:flex; align-items:center; gap:20px; }
  .cv-brand { flex:none; display:flex; align-items:center; gap:18px; font-size:38px; font-weight:800; letter-spacing:-.03em; }
  .logo { display:block; border-radius:22%; }
  .cv-k {
    flex:none; margin-left:auto; font-size:29px; letter-spacing:-.02em;
    border-radius:999px; white-space:nowrap;
  }
  /* 다크에선 흰 면이 17:1 로 튄다. 라이트에선 흰 면이 안 보이니 연보라를 쓴다 */
  /* 흰 면은 17.01:1 로 제목(15.63:1)보다 밝아 후킹에서 시선을 뺏었다.
     키컬러 면은 2.29:1 로 가라앉으면서 흰 글자를 7.41:1 로 받고,
     형광펜 바와 같은 색이라 보라가 한 덩어리로 읽힌다. */
  .cv-k.solid { background:${t.strong}; color:#fff; font-weight:800; padding:16px 30px; }
  .cv-k.soft {
    background:${t.soft}; color:${t.accentInk};
    border:2px solid ${t.chipBorder}; font-weight:700; padding:14px 28px;
  }
  .cv-mid { flex:1; display:flex; flex-direction:column; justify-content:center; gap:44px; }
  .cv-hs { display:flex; flex-direction:column; }
  .cv-h { font-size:${COVER_TITLE_PX}px; font-weight:800; line-height:1.16; letter-spacing:-.05em; white-space:nowrap; }
  .cv-h.accent { color:${t.accentInk}; }
  .hl { display:inline-block; }
  .hl.block {
    background:${t.strong}; color:#fff;
    padding:.04em .16em .1em; margin-left:-.16em; border-radius:.1em;
  }
  .hl.marker {
    background:linear-gradient(transparent 58%, ${t.strong} 58%, ${t.strong} 96%, transparent 96%);
    padding:0 .06em; margin-left:-.06em;
  }
  .cv-fs { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
  .cv-f {
    background:${t.soft}; color:${t.chipInk};
    border:2px solid ${t.chipBorder};
    font-size:31px; font-weight:700; letter-spacing:-.03em;
    padding:13px 22px; border-radius:999px;
  }
  .cv-foot { display:flex; align-items:center; gap:20px; }
  .cv-pika { display:block; width:210px; height:auto; opacity:.9; }
  .cv-swipe {
    margin-left:auto;
    font-size:30px; font-weight:600; color:${t.muted};
    letter-spacing:-.02em; display:flex; align-items:center; gap:12px;
  }
  .cv-swipe span { font-size:31px; }

  /* ── 내용 ── 모든 내용 슬라이드가 같은 골격을 쓴다 */
  .head { min-height:186px; }
  .h1 { font-size:64px; font-weight:800; line-height:1.26; letter-spacing:-.04em; }
  .accent { color:${t.accentInk}; }
  .sub {
    margin-top:22px; font-size:30px; font-weight:500;
    color:${t.muted}; letter-spacing:-.02em; line-height:1.45;
  }
  .main { flex:1; display:flex; flex-direction:column; justify-content:center; min-height:0; padding:30px 0; }

  .cards { display:flex; flex-direction:column; gap:20px; }
  .card {
    background:${t.soft}; border-radius:26px;
    padding:32px 34px; display:flex; align-items:center; gap:28px;
  }
  .ic {
    flex:none; width:74px; height:74px; border-radius:20px;
    background:${t.accent}; color:${t.onAccent};
    display:flex; align-items:center; justify-content:center;
  }
  .ct-t { font-size:36px; font-weight:800; letter-spacing:-.03em; line-height:1.3; }
  .ct-d { margin-top:8px; font-size:27px; font-weight:600; color:${t.softInk}; opacity:.82; letter-spacing:-.02em; line-height:1.35; }
  .ct-d:only-child { margin-top:0; font-size:33px; font-weight:700; opacity:.92; }

  /* ── 서비스 화면 ── PC 창을 주인공으로 두고 폰을 오른쪽 아래에 겹친다.
     프레임은 얇게. 목업 장식이 화면보다 눈에 띄면 안 된다. */
  .shot { position:relative; width:100%; height:100%; }
  .sh-pc {
    position:absolute; left:0; top:0; width:812px;
    border:2px solid ${t.border}; border-radius:18px; overflow:hidden;
    background:${t.soft}; box-shadow:0 26px 60px rgba(0,0,0,.28);
  }
  .sh-bar {
    height:34px; display:flex; align-items:center; gap:9px; padding:0 16px;
    background:${t.soft}; border-bottom:2px solid ${t.border};
  }
  .sh-bar i { width:11px; height:11px; border-radius:50%; background:${t.border}; }
  .sh-pc img { display:block; width:100%; height:auto; }
  .sh-mo {
    position:absolute; right:0; bottom:0; width:212px;
    border:9px solid ${t.fg}; border-radius:34px; overflow:hidden;
    background:${t.fg}; box-shadow:0 22px 46px rgba(0,0,0,.36);
  }
  .sh-mo img { display:block; width:100%; height:auto; border-radius:26px; }
  /* 화면 일부를 잘라 온 것이라 기기 베젤을 두르지 않는다 —
     전체 화면이 아닌데 폰처럼 보이면 실제와 다른 인상을 준다. */
  /* 화면을 오른쪽에 크게 세운다. 칸 안에 맞추면 세로가 긴 폰 화면이
     너무 작아져서, 아래로 흘려보내고 슬라이드 밖에서 잘리게 둔다. */
  /* 화면을 오른쪽에 세우면 글이 왼쪽 절반만 쓴다. 제목을 그 안에서
     세로 가운데로 내리고, 오른쪽 푸터는 뺀다 — 폰과 겹친다. */
  .s.split .head, .s.split .sub { max-width:560px; }
  .s.split .head { margin-top:auto; }
  .s.split .sub { margin-bottom:auto; }
  .s.split .main { display:none; }
  .s.split .ft-app { display:none; }

  /* 화면은 슬라이드 아래로 흘려보낸다. 세로가 긴 폰을 칸에 맞추면 너무 작다. */
  /* top 은 위치, height 는 보이는 길이. 둘을 따로 둔다 — 예전엔 슬라이드
     바닥에서 잘려서 위로 올리면 길이가 같이 늘어났다. */
  .shot-stand {
    position:absolute; left:64px; right:64px; top:400px;
    height:560px; overflow:hidden;
    display:flex; gap:40px;
  }
  .shot-stand img {
    height:800px; width:auto; display:block;
    border:2px solid ${t.border}; border-radius:26px;
    box-shadow:0 26px 60px rgba(0,0,0,.18);
  }
  /* 아래를 단면으로 자르면 잘린 티가 난다. 배경색으로 서서히 사라지게 한다. */
  .shot-fade {
    position:absolute; left:0; right:0; bottom:0; height:200px; z-index:1;
    background:linear-gradient(to bottom, transparent, ${t.bg} 70%);
  }
  .shot-stand:not(.pair) { left:auto; justify-content:flex-end; }
  .shot-stand.pair { justify-content:center; }
  .shot-stand.pair img { height:760px; }

  /* ── 카톡 전후 ── 말풍선 아래에 미리보기 카드가 붙는 실제 구조를 따른다.
     위는 카드가 안 붙는 경우, 아래는 붙는 경우. 색으로 판정이 읽히게 한다. */
  .chat { display:flex; gap:32px; align-items:flex-start; }
  .chat.solo { justify-content:center; }
  .chat.solo .ch-tag { display:none; }
  .chat.solo .ch-row { flex:none; width:520px; gap:18px; }
  .chat.solo .ch-thumb { height:273px; }
  .ch-row { flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }
  .ch-tag { font-size:25px; font-weight:700; color:${t.muted}; letter-spacing:-.02em; }
  .ch-tag.on { color:${t.accentInk}; }
  .ch-none {
    flex:1; min-height:238px;
    border:3px dashed ${t.border}; border-radius:20px;
    display:flex; align-items:center; justify-content:center;
    font-size:26px; font-weight:600; color:${t.muted};
  }
  .ch-bub {
    align-self:flex-start; max-width:100%; overflow:hidden;
    text-overflow:ellipsis; white-space:nowrap;
    background:#f4f4f5; border:2px solid ${t.border};
    border-radius:20px 20px 20px 6px; padding:16px 24px;
    font-size:26px; font-weight:600; color:${t.muted}; letter-spacing:-.01em;
  }
  .ch-bub.on { background:${t.soft}; border-color:${t.chipBorder}; color:${t.softInk}; }
  .ch-card {
    width:100%; background:${t.bg}; border:2px solid ${t.chipBorder};
    border-radius:20px; overflow:hidden;
    box-shadow:0 14px 34px rgba(0,0,0,.10);
  }
  .ch-thumb {
    height:238px; overflow:hidden;
    background:linear-gradient(135deg, ${t.accent}, #e879f9);
  }
  .ch-thumb img { display:block; width:100%; height:100%; object-fit:cover; }
  .ch-meta { padding:38px 38px 40px; display:flex; flex-direction:column; gap:16px; }
  .ch-t { font-size:31px; font-weight:800; letter-spacing:-.03em; line-height:1.25;  word-break:keep-all; }
  .ch-s { font-size:25px; font-weight:600; color:${t.muted}; line-height:1.35; word-break:keep-all; }
  .ch-d { font-size:23px; font-weight:600; color:${t.accentInk}; }

  .panel { background:${t.soft}; border-radius:30px; padding:42px; }
  /* 가로로 넓은 화면 조각. 세로로 긴 폰 화면(.shot-stand)과 달리 흘려보내지
     않고 본문 안에 통째로 앉힌다. 잘리면 무슨 화면인지 못 알아본다. */
  .shot-wide { display:flex; justify-content:center; align-items:center; min-height:0; }
  /* 테두리로 가두지 않는다. 잘라 온 화면 조각이라 네모를 두르면 "여기서
     끝난 화면" 으로 읽힌다. 아래를 배경색으로 흘려보내면 화면이 이어지는
     것으로 읽히고, 세로로 긴 화면(.shot-stand)과도 같은 마감이 된다. */
  .sw-frame { position:relative; max-width:100%; max-height:100%; display:flex; }
  .sw-frame img {
    max-width:100%; max-height:100%; width:auto; height:auto; display:block;
    border-radius:26px 26px 0 0;
  }
  /* 잘린 글줄만 지우는 정도로 짧게. 길면 화면 안 내용(공유 카드 같은
     주인공)까지 흐려져 오히려 잘린 것처럼 보인다. */
  .sw-frame .shot-fade { height:80px; }
  .stmt {
    font-size:50px; font-weight:800; line-height:1.42; letter-spacing:-.03em;
    color:${t.softInk}; padding:62px 52px; text-align:center;
  }
  .grid5, .grid4 { display:grid; gap:16px; margin-bottom:16px; }
  .grid5 { grid-template-columns:repeat(5,1fr); }
  .grid4 { grid-template-columns:repeat(4,1fr); }
  .cell {
    background:${t.bg}; border-radius:16px; padding:24px 8px; text-align:center;
    font-size:31px; font-weight:800; letter-spacing:-.02em;
  }
  .cell small { display:block; font-size:22px; font-weight:600; color:${t.muted}; margin-bottom:7px; }
  .cell-on { background:${t.accent}; color:#fff; }
  .cell-on small { color:rgba(255,255,255,.75); }
  .cell-off { background:transparent; border:2px dashed ${t.border}; color:${t.muted}; }

  .chips { margin-top:26px; display:flex; gap:14px; justify-content:center; }
  .chip {
    background:${t.soft}; color:${t.accentInk};
    font-size:24px; font-weight:700; padding:13px 24px; border-radius:999px;
  }

  /* 커버·마감의 서명과 같은 자리·같은 크기로 둔다. 다섯 장을 넘길 때
     왼쪽 아래가 흔들리지 않아야 한 묶음으로 읽힌다. */
  .foot { position:relative; z-index:2; display:flex; align-items:center; gap:20px; }
  .ft-pika { display:block; width:210px; height:auto; opacity:.9; }
  /* pikaworks 서명은 210px 폭 = 29.5px 높이(viewBox 698.3×98)로 렌더된다.
     오른쪽 서비스 쪽을 거기에 맞춘다 — 아이콘 62px 은 두 배가 넘어서
     좌우가 따로 놀았다. */
  .ft-app { margin-left:auto; display:flex; align-items:center; gap:14px; }

  .brand { font-size:30px; font-weight:800; letter-spacing:-.03em; }

  /* ── 마감 ── 앱당 한 장 고정. 서비스가 주인공이고 pikaworks 는 서명이다 */
  .outro { background:${t.bg}; color:${t.fg}; text-align:center; }
  .ot-app {
    flex:1; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
  }
  .ot-mark { margin-bottom:40px; }
  .ot-name { font-size:78px; font-weight:800; letter-spacing:-.04em; }
  .ot-tag { margin-top:20px; font-size:40px; font-weight:500; color:${t.muted}; letter-spacing:-.03em; }
  .ot-cta {
    margin-top:56px; background:${t.accent}; color:${t.onAccent};
    font-size:38px; font-weight:800; letter-spacing:-.03em;
    padding:28px 56px; border-radius:999px;
  }
  .ot-dom { margin-top:24px; font-size:32px; font-weight:600; color:${t.muted}; letter-spacing:-.02em; }
  /* 애플 공식 배지. 비율을 바꾸거나 다시 그리지 않는다 */
  .ot-app-store { margin-top:32px; display:block; width:300px; height:auto; }
  /* pikaworks 서명. 흐린 색이면 서명이 아니라 잔여물처럼 보여서 본문색을 쓴다.
     라이트 테마에선 흰색이 안 되므로 각 테마의 전경색(fg)을 따른다. */
  /* 커버 하단의 서명과 같은 위치·크기로 맞춘다 (.cv-pika 와 동일) */
  .ot-by { display:block; width:210px; height:auto; opacity:.9; }
`;
}

function buildSlides(design, service) {
  const t = THEME[service];
  if (!t) throw new Error(`알 수 없는 service: ${service} (clipnote | takeaseat)`);
  if (!design.cover) throw new Error('design.cover 가 필요합니다 (캐러셀 첫 장)');

  const middles = design.slides || [];
  if (!middles.length) throw new Error('design.slides 가 비어 있습니다 (내용 슬라이드 최소 1장)');

  const html = [
    slideCover(design.cover, t),
    ...middles.map((s, i) => slideBody(s, t, i + 1)),
    slideOutro(t, service === 'clipnote' ? 'Take a Seat' : 'ClipNote'),
  ];
  if (html.length > MAX_SLIDES) {
    throw new Error(`슬라이드가 ${html.length}장입니다. 인스타 캐러셀은 ${MAX_SLIDES}장까지.`);
  }
  return { t, html };
}

// ── 실행 ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const inputPath = args.find((a) => !a.startsWith('--'));
const outDirFlag = args.indexOf('--out-dir');
if (!inputPath) {
  console.error('사용법: node scripts/ig.mjs pipeline/ideas/<id>.json [--out-dir <디렉터리>]');
  process.exit(2);
}

const input = JSON.parse(readFileSync(inputPath, 'utf8'));
const isIdea = Boolean(input.service && Object.prototype.hasOwnProperty.call(input, 'status'));
const design = isIdea ? input.design : input;
if (!design) {
  console.error(`${inputPath} 에 design 이 없습니다. sns-designer 가 먼저 채워야 합니다.`);
  process.exit(2);
}

const id = isIdea ? input.id : basename(inputPath, '.json');
const outDir = outDirFlag >= 0 ? args[outDirFlag + 1] : 'public/ig';
mkdirSync(outDir, { recursive: true });

const fontPath = 'assets/fonts/PretendardVariable.woff2';
if (!existsSync(fontPath)) {
  console.error(`${fontPath} 가 없습니다. 이 파일 없이는 한글이 두부로 렌더됩니다.`);
  process.exit(2);
}
const fontUrl = `data:font/woff2;base64,${readFileSync(fontPath).toString('base64')}`;

for (const th of Object.values(THEME)) {
  if (!existsSync(th.logo)) {
    console.error(`${th.logo} 가 없습니다. assets/logos/SOURCE.md 참고.`);
    process.exit(2);
  }
  th.logoUrl = `data:image/png;base64,${readFileSync(th.logo).toString('base64')}`;
  th.iconSet = th.icons && existsSync(th.icons)
    ? JSON.parse(readFileSync(th.icons, 'utf8')) : null;
  th.pikaUrl = `data:image/svg+xml;base64,${
    Buffer.from(readFileSync(PIKA_LOGO[th.pikaLogo], 'utf8')).toString('base64')}`;
}

const APP_STORE_URL = `data:image/svg+xml;base64,${
  Buffer.from(readFileSync(APP_STORE_BADGE, 'utf8')).toString('base64')}`;

const { t, html: slides } = buildSlides(design, input.service);

// CHROMIUM_PATH 는 playwright 가 받아둔 브라우저를 못 찾는 환경(컨테이너 등)용 탈출구다.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({
  viewport: { width: SIZE, height: SIZE },
  deviceScaleFactor: 2,
});

const written = [];
for (let i = 0; i < slides.length; i += 1) {
  const file = join(outDir, `${id}-${i + 1}.png`);
  await page.setContent(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8">
     <style>${css(t, fontUrl)}</style></head><body>${slides[i]}</body></html>`,
    { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // 넘친 글자는 잘리지 않고 레이아웃을 밀어낸다. 글자수 상한만으로는
  // 폰트 크기를 바꿀 때마다 어긋나므로 실제 렌더 폭을 잰다.
  const overflow = await page.evaluate(() => {
    const bad = [];
    // 글자 자체가 넘치는 경우
    for (const el of document.querySelectorAll('.cv-h, .h1, .ct-t, .ct-d, .cv-f, .cv-k, .ot-name, .ot-h, .ch-t')) {
      if (el.scrollWidth > el.clientWidth + 1) {
        bad.push(`${el.className}: "${el.textContent.trim()}" (${el.scrollWidth} > ${el.clientWidth})`);
      }
    }
    // 배지처럼 내용에 맞춰 커지는 요소는 자기 자신은 절대 안 넘친다.
    // 넘침이 부모 행에서 일어나므로 컨테이너도 같이 재야 한다.
    for (const el of document.querySelectorAll('.cv-top, .cv-fs, .cv-hs, .chips, .foot, .ft-app, .cards')) {
      if (el.scrollWidth > el.clientWidth + 1) {
        bad.push(`${el.className} 가로 넘침 (${el.scrollWidth} > ${el.clientWidth})`);
      }
    }
    // flex:1 로 늘어나는 칸은 안에서 찌그러질 뿐 body 를 늘리지 않는다
    for (const el of document.querySelectorAll('.cv-mid, .main, .ot-app, .shot, .chat')) {
      if (el.scrollHeight > el.clientHeight + 1) {
        bad.push(`${el.className} 세로 눌림 (${el.scrollHeight} > ${el.clientHeight})`);
      }
    }
    if (document.body.scrollHeight > document.body.clientHeight + 1) {
      bad.push(`세로 넘침 (${document.body.scrollHeight} > ${document.body.clientHeight})`);
    }
    return bad;
  });
  if (overflow.length) {
    await browser.close();
    console.error(`슬라이드 ${i + 1} 에서 글자가 넘칩니다:\n  ${overflow.join('\n  ')}`);
    process.exit(1);
  }

  await page.screenshot({ path: file });
  written.push(file);
}
await browser.close();

console.log(`렌더 완료 — ${written.length}장 (${SIZE * 2}×${SIZE * 2})`);
written.forEach((f) => console.log(`  ${f}`));

if (isIdea && outDirFlag < 0) {
  input.image_path = written;
  input.image_urls = written.map((_, i) => `${SITE}/ig/${id}-${i + 1}.png`);
  input.image_url = input.image_urls[0];   // 단일 발행 경로와의 호환용
  // design_done 까지만 **올린다**. 내리지는 않는다.
  // image_ok·scheduled 를 design_done 으로 되돌리면 사람이 한 검수가 지워진다.
  // 실제로 검수 직후 재렌더 한 번에 image_ok 가 날아갔다.
  if (['proposed', 'approved', 'design_done'].includes(input.status)) {
    input.status = 'design_done';
  }
  writeFileSync(inputPath, `${JSON.stringify(input, null, 2)}\n`, 'utf8');
  console.log(`${inputPath} 갱신 — status=${input.status}, ${input.image_urls.length}장`);
}
