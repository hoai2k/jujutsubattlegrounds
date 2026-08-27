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
  await page.waitForTimeout(500);
  check('a choice answers and moves on', (await page.textContent('.vb-dockq b') ||
    await page.textContent('.vb-title')) === 'Pelvis centre');

  // THE COMPLAINT THIS SECTION EXISTS FOR: on a phone the viewer must be the
  // page. A pointing question leaves the sheet shut, and what is left of the
  // view after the dock has to be most of the screen.
  const box = await page.evaluate(() => {
    const r = document.querySelector('.vb-view canvas').getBoundingClientRect();
    const covers = e => {
      if (!e || !e.getBoundingClientRect().height || getComputedStyle(e).display === 'none') return r.bottom;
      const c = e.getBoundingClientRect();
      return c.left < r.right - 1 && c.right > r.left + 1 ? Math.min(r.bottom, c.top) : r.bottom;
    };
    const bottom = Math.min(covers(document.querySelector('.vb-card.open')),
      covers(document.querySelector('.vb-dock')));
    return { x: r.x, y: r.y, w: r.width, h: bottom - r.y, view: r.height };
  });
  check('a pointing question leaves the viewer the screen', box.h > box.view * 0.7,
    `${Math.round(box.h)}px of ${Math.round(box.view)}px clear`);
  let read = '';
  for (const [fx, fy] of [[0.5, 0.5], [0.5, 0.35], [0.45, 0.65]]) {
    await page.mouse.click(box.x + box.w * fx, box.y + box.h * fy);
    await page.waitForTimeout(160);
    read = await page.textContent('.vb-read');
    if (/mark/.test(read) && /cm/.test(read)) break;
  }
  check('a tap in the framed band lands on the body', /\d+ cm/.test(read),
    read.replace(/\s+/g, ' ').slice(0, 64));

  if (isMobile) {
    const shown = sel => page.evaluate(s => {
      const e = document.querySelector(s);
      return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
    }, sel);
    check('the sheet is shut while pointing', !(await shown('.vb-card.open')));
    check('the dock says which question this is',
      (await page.textContent('.vb-dockq b')) === 'Pelvis centre');

    // THE BUG THIS FILE WAS WRITTEN FOR: leave the question by the dock, not
    // the Next button, and the mark must still be in the export.
    await page.click('.vb-docknav .vb-go');
    await page.waitForTimeout(300);
    check('the dock advances the queue', (await page.textContent('.vb-dockq b')) === 'Waist');

    // panels open one at a time, over the viewer, and give it back
    for (const [icon, sel] of [['Queue', '.vb-list'], ['View', '.vb-toolgrid'], ['Setup', '.mb-input']]) {
      await page.click(`.vb-dockbtns .vb-tool:has-text("${icon}")`);
      await page.waitForTimeout(250);
      check(`the ${icon} panel opens over the viewer`, await shown(sel) && !(await shown('.vb-dock')));
      await page.click('.vb-close');
      await page.waitForTimeout(250);
      check(`closing ${icon} gives the viewer back`, !(await shown('.vb-card.open')) && await shown('.vb-dock'));
    }
    // and the queue list can jump straight back
    await page.click('.vb-dockbtns .vb-tool:has-text("Queue")');
    await page.waitForTimeout(250);
    await page.click('.vb-listrow >> nth=1');
    await page.waitForTimeout(300);
    check('the queue jumps to a question', (await page.textContent('.vb-dockq b')) === 'Pelvis centre');
  }

  // Walk to the end the way a person would: whichever Next is actually on
  // screen — the sheet's when it is open, the dock's when it is not.
  for (let i = 0; i < 30; i++) {
    const nextSel = await page.evaluate(() => {
      const vis = e => e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
      const card = document.querySelector('.vb-card.open .vb-nav .vb-go');
      if (vis(card)) return card.textContent.includes('Export') ? 'export' : '.vb-card .vb-nav .vb-go';
      return vis(document.querySelector('.vb-dock')) ? '.vb-docknav .vb-go' : null;
    });
    if (!nextSel || nextSel === 'export') break;
    await page.click(nextSel);
    await page.waitForTimeout(110);
  }
  const dl = page.waitForEvent('download', { timeout: 8000 });
  await page.click('.vb-card .vb-nav .vb-go');
  const json = JSON.parse(fs.readFileSync(await (await dl).path(), 'utf8'));
  const point = json.answers.find(a => a.kind === 'point');
  check('the export carries the mark, however the question was left',
    !!point && point.samples > 0, point ? `${point.bone} @ ${point.distCm} cm` : 'no point answer');
  check('the export carries a pasteable joints patch', Object.keys(json.joints || {}).length > 0);
  check('the export carries the choice', json.answers[0]?.value === 'rest');
  check('every question is accounted for', json.answers.length === 19, json.answers.length + ' answers');

  // PICKING, MEASURED RATHER THAN EYEBALLED. A tap is a ray, and turning it
  // into a point inside the body leaves an error along the line of sight —
  // which is the one direction a person looking at the screen cannot judge, so
  // it can only be caught here. Two rays from different angles intersect and
  // the error goes away; this asserts that it does.
  const tri = await page.evaluate(() => {
    const P = Math.PI, out = [];
    for (const bone of ['Hips', 'ThighL', 'Chest']) {
      out.push({ bone,
        one: window.__vb.triangulate(bone, 'hips', [0.45]),
        same: window.__vb.triangulate(bone, 'hips', [0.45, 0.55]),
        cross: window.__vb.triangulate(bone, 'hips', [0.45, 0.45 + P / 2]),
        opposite: window.__vb.triangulate(bone, 'hips', [0.45, 0.45 + P]) });
    }
    return out;
  });
  for (const t of tri) {
    const ok = t.cross.errorCm != null && t.cross.errorCm < 1.0 &&
      t.opposite.errorCm != null && t.opposite.errorCm < 1.0;
    check(`two angles pin ${t.bone} that one angle cannot`, ok,
      `one ${t.one.errorCm} cm, same view ${t.same.errorCm} cm, ` +
      `90° apart ${t.cross.errorCm} cm, opposite ${t.opposite.errorCm} cm`);
  }

  // layout, on the viewport it actually has
  const layout = await page.evaluate(() => ({
    h: document.documentElement.scrollWidth - window.innerWidth,
    v: document.documentElement.scrollHeight - window.innerHeight,
    navIn: document.querySelector('.vb-nav').getBoundingClientRect().bottom <= window.innerHeight + 1,
    small: [...document.querySelectorAll('.vb-tool, .vb-go, .vb-ghost, .vb-opt, .vb-tab, .vb-listrow')]
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
