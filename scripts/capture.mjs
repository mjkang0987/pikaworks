import { chromium } from 'playwright';

const shots = [
  { name: 'takeaseat', url: 'https://takeaseat.co.kr' },
  { name: 'blog', url: 'https://blog.pikaworks.kr' },
];
// extra URLs passed as CLI args: name=url
for (const a of process.argv.slice(2)) {
  const [name, ...rest] = a.split('=');
  shots.push({ name, url: rest.join('=') });
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});
for (const s of shots) {
  try {
    await page.goto(s.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `public/shots/${s.name}.png` });
    console.log('OK', s.name, s.url);
  } catch (e) {
    console.log('FAIL', s.name, s.url, e.message);
  }
}
await browser.close();
