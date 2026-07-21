import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const logo = readFileSync('public/logo.svg', 'utf8');
const html = `<!doctype html><html><head><meta charset="utf8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; overflow:hidden;
    font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;
    background:#1c1c1e; position:relative; }
  .blob{position:absolute;border-radius:50%;filter:blur(80px);}
  .b1{width:420px;height:420px;background:rgba(101,38,217,.45);top:-120px;left:-80px;}
  .b2{width:360px;height:360px;background:rgba(154,107,255,.35);bottom:-120px;right:-60px;}
  .wrap{position:relative;height:100%;display:flex;flex-direction:column;
    justify-content:center;padding:0 96px;gap:32px;}
  .logo{height:56px;width:auto;}
  .logo svg{height:56px;width:auto;}
  .tagline{font-size:64px;font-weight:900;line-height:1.15;color:#fff;letter-spacing:-.02em;}
  .accent{background:linear-gradient(100deg,#9a6bff,#6526d9);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .sub{font-size:28px;color:rgba(255,255,255,.6);font-weight:500;}
  .dot{color:#9a6bff;}
</style></head><body>
  <div class="blob b1"></div><div class="blob b2"></div>
  <div class="wrap">
    <div class="logo">${logo}</div>
    <div class="tagline">일상을 정리하는<br><span class="accent">작은 도구들</span></div>
    <div class="sub">clipnote <span class="dot">·</span> takeaseat <span class="dot">·</span> blog</div>
  </div>
</body></html>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.setContent(html, { waitUntil: 'networkidle' });
await p.waitForTimeout(300);
await p.screenshot({ path: 'public/og.png' });
await b.close();
console.log('og.png generated');
