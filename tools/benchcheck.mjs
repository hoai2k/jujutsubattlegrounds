// BENCHCHECK — drives the VERIFICATION bench (/workbench/?edit=verification)
// in a real browser, on a desktop viewport and a phone one, and asserts that
// the loop a person is asked to walk actually closes.
//
// This exists because the bench is the one tool here whose entire output is a
// human's answer, and there is no way to unit-test "can you point at a
// shoulder". What CAN be checked is everything around the pointing: that a
// manifest model loads, that a tap in the view lands on the body and becomes
// a mark, that the mark survives every way of leaving the question, that the
// export carries it, and — the part no desktop test would ever notice — that
// the question sheet is not sitting on top of the thing it is asking about.
//
// It has already earned its keep twice. The fold bar advanced the queue
// WITHOUT recording the answer, so a phone session exported one mark short of
// what was plainly on the screen; and the sheet covered the lower half of the
// viewer, which is where four of the seventeen landmarks are.
//
//     npm i -D playwright --no-save
//     node tools/benchcheck.mjs             # both viewports
//     node tools/benchcheck.mjs maki        # against a different manifest entry
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';

const MODEL = process.argv.find(a => !a.startsWith('-') && !/node|benchcheck/.test(a)) || 'megumi';
const PORT = 5199;
let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const server = await createServer({ server: { port: PORT, strictPort: true } });
await server.listen();
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
});

async function run(label, viewport, isMobile) {
  console.log(`\n=== ${label} ${viewport.width}x${viewport.height} ===`);
  const ctx = await browser.newContext({ viewport, hasTouch: isMobile, isMobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${PORT}/workbench/?edit=verification`, { waitUntil: 'networkidle' });

  await page.waitForSelector('.mb-chip');
  await page.click(`.mb-chip:has-text("${MODEL}")`);
  await page.waitForFunction(() => document.querySelector('.mb-status')?.textContent.includes('tris'),
    null, { timeout: 30000 });
  await page.click('.vb-go');                                   // Start
  await page.waitForTimeout(600);
  check('the queue starts on the first question',
    /pose is this model/.test(await page.textContent('.vb-title')));

  await page.click('.vb-opt >> nth=0');                         // a choice answers and advances
  await page.waitForTimeout(450);
  check('a choice answers and moves on', (await page.textContent('.vb-title')) === 'Pelvis centre');

  // Tap only where the sheet is NOT: on a phone that is the top of the view,
  // and it is exactly the band the framing is supposed to aim into.
  const box = await page.evaluate(() => {
    const r = document.querySelector('.vb-view canvas').getBoundingClientRect();
    const c = document.querySelector('.vb-card').getBoundingClientRect();
    const bottom = c.left < r.right - 1 && c.right > r.left + 1 ? Math.min(r.bottom, c.top) : r.bottom;
    return { x: r.x, y: r.y, w: r.width, h: bottom - r.y };
  });
  check('the sheet leaves the viewer usable', box.h > 220, `${Math.round(box.h)}px of view uncovered`);
  let read = '';
  for (const [fx, fy] of [[0.5, 0.5], [0.5, 0.35], [0.45, 0.65]]) {
    await page.mouse.click(box.x + box.w * fx, box.y + box.h * fy);
    await page.waitForTimeout(160);
    read = await page.textContent('.vb-read');
    if (/mark/.test(read) && /cm/.test(read)) break;
  }
  check('a tap in the framed band lands on the body', /\d+ cm/.test(read),
    read.replace(/\s+/g, ' ').slice(0, 64));

  // THE BUG THIS FILE WAS WRITTEN FOR: leave the question by the folded bar,
  // not the Next button, and the mark must still be in the export.
  if (isMobile) {
    const top = () => page.$eval('.vb-card', c => c.getBoundingClientRect().top);
    const before = await top();
    await page.click('.vb-handle');
    await page.waitForTimeout(400);
    const after = await top();
    check('the sheet folds away', after > before + 200, `${Math.round(before)} -> ${Math.round(after)}`);
    check('a folded sheet still says what the question is',
      (await page.textContent('.vb-handle b')) === 'Pelvis centre');
    await page.click('.vb-mininext');
    await page.waitForTimeout(300);
    check('a folded sheet still advances', (await page.textContent('.vb-handle b')) === 'Waist');
    await page.click('.vb-handle');                             // unfold for the rest
    await page.waitForTimeout(300);
  }

  for (let i = 0; i < 25; i++) {
    const t = await page.$eval('.vb-go', b => b.textContent);
    if (/Export/.test(t)) break;
    await page.click('.vb-go');
    await page.waitForTimeout(80);
  }
  const dl = page.waitForEvent('download', { timeout: 8000 });
  await page.click('.vb-go');
  const json = JSON.parse(fs.readFileSync(await (await dl).path(), 'utf8'));
  const point = json.answers.find(a => a.kind === 'point');
  check('the export carries the mark, however the question was left',
    !!point && point.samples > 0, point ? `${point.bone} @ ${point.distCm} cm` : 'no point answer');
  check('the export carries a pasteable joints patch', Object.keys(json.joints || {}).length > 0);
  check('the export carries the choice', json.answers[0]?.value === 'rest');
  check('every question is accounted for', json.answers.length === 19, json.answers.length + ' answers');

  // layout, on the viewport it actually has
  const layout = await page.evaluate(() => ({
    h: document.documentElement.scrollWidth - window.innerWidth,
    v: document.documentElement.scrollHeight - window.innerHeight,
    navIn: document.querySelector('.vb-nav').getBoundingClientRect().bottom <= window.innerHeight + 1,
    small: [...document.querySelectorAll('.vb-tool, .vb-go, .vb-ghost, .vb-opt')]
      .filter(e => e.offsetParent !== null)
      .filter(e => e.getBoundingClientRect().height < 40 || e.getBoundingClientRect().width < 40).length
  }));
  check('nothing overflows the page', layout.h === 0 && layout.v === 0, `${layout.h}px / ${layout.v}px`);
  check('the controls are on screen', layout.navIn);
  check('every control is finger-sized', layout.small === 0, layout.small + ' under 40px');
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await ctx.close();
}

await run('desktop', { width: 1440, height: 860 }, false);
await run('phone', { width: 390, height: 844 }, true);
await browser.close();
await server.close();
console.log(failures ? `\n${failures} failed` : '\nthe verification bench works on both');
process.exit(failures ? 1 : 0);
