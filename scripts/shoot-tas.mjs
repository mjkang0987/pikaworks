// Take a Seat 실제 화면 촬영기. 절차와 함정은 assets/shots/SOURCE.md 를 본다.
//   전제 — tas 를 /tmp/repo 에 클론, postgres 기동, seed 주입, 세션 토큰을
//   /tmp/session-token.txt 에 발급, next dev 가 :3000 에 떠 있을 것.
//   playwright 는 이 저장소에만 있으므로 여기서 실행한다.
//   실행: CHROMIUM_PATH 불필요, node scripts/shoot-tas.mjs

import {chromium} from 'playwright';
import fs from 'node:fs';

const TOKEN = fs.readFileSync('/tmp/session-token.txt', 'utf8').trim();
const OUT = process.env.SHOT_OUT ?? '/tmp/shots';
fs.mkdirSync(OUT, {recursive: true});

const FORBIDDEN = ['SNS 계정으로 로그인', 'example.com', 'localhost:3000'];

async function guard(page, name, required) {
  const text = await page.locator('body').innerText();
  for (const bad of FORBIDDEN) {
    if (text.includes(bad)) throw new Error(`${name}: 금지 문구 "${bad}" 가 화면에 있습니다`);
  }
  for (const need of required) {
    if (!text.includes(need)) throw new Error(`${name}: 필수 문구 "${need}" 가 없습니다`);
  }
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  // 에이전트 프록시가 localhost 까지 가로채 ERR_TUNNEL_CONNECTION_FAILED 를 낸다
  proxy: {server: 'direct://'},
  args: ['--no-proxy-server'],
});

async function session(viewport, aside) {
  const ctx = await browser.newContext({viewport, deviceScaleFactor: 2, locale: 'ko-KR'});
  await ctx.addCookies([{
    name: 'authjs.session-token', value: TOKEN,
    domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
  }]);
  await ctx.addInitScript((visible) => {
    // 온보딩 투어와 사이드바 상태를 첫 렌더 전에 심는다
    localStorage.setItem('tas-tour-main-v1', 'done');
    localStorage.setItem('aside-visible', visible ? 'true' : 'false');
  }, aside);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('  [console]', m.text().slice(0, 120)); });
  return {ctx, page};
}

async function killAds(page) {
  // dev 전용 AD 플레이스홀더 제거 (styled-components 해시 클래스라 선택자로 못 잡는다)
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll('span'))) {
      if (el.textContent?.trim() === 'AD') el.parentElement?.remove();
    }
  });
}

for (const [label, viewport, aside] of [
  ['pc', {width: 1440, height: 900}, true],
  ['mobile', {width: 390, height: 844}, false],
]) {
  const {ctx, page} = await session(viewport, aside);
  await page.goto('http://localhost:3000/', {waitUntil: 'networkidle', timeout: 60000});
  await page.waitForTimeout(2500);
  await killAds(page);
  console.log(`  [${label} 홈 텍스트]`, (await page.locator('body').innerText()).slice(0,200).replace(/\n/g,' | '));
  await guard(page, `${label} 홈`, ['2026']);

  // ── 1. 고객 검색 레이어
  await page.getByLabel('고객검색').first().click();
  await page.waitForTimeout(600);
  await page.getByPlaceholder('고객명 또는 연락처 검색').fill('5555');
  await page.waitForTimeout(600);
  await guard(page, `${label} 검색`, ['이철수']);
  await page.screenshot({path: `${OUT}/tas-${label}-search.png`});
  console.log('OK', `${label}-search`);

  // ── 2. 고객정보 상세
  // 결과 항목은 오버레이 안에서 눌러야 한다 — 바깥의 같은 이름이 잡히면 오버레이가 클릭을 가로챈다
  await page.getByRole('dialog', {name: '고객 검색'}).getByText('이철수', {exact: true}).first().click();
  await page.waitForTimeout(1500);
  await killAds(page);
  await guard(page, `${label} 고객정보`, ['적립금', '이철수']);
  await page.screenshot({path: `${OUT}/tas-${label}-customer.png`});
  console.log('OK', `${label}-customer`);

  await ctx.close();
}
await browser.close();
console.log('완료');
