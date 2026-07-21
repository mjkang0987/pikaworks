import { chromium } from 'playwright';
const b = await chromium.launch();

// desktop full page
const d = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await d.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await d.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await d.waitForTimeout(1200);
await d.evaluate(() => window.scrollTo(0, 0));
await d.waitForTimeout(400);
await d.screenshot({ path: '/tmp/verify-desktop.png', fullPage: true });

// mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await m.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await m.waitForTimeout(1200);
await m.screenshot({ path: '/tmp/verify-mobile.png', fullPage: true });

await b.close();
console.log('done');
