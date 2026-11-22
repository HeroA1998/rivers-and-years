import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { chromium } from 'playwright';

const out = process.env.TEST_OUTPUT || 'artifacts/ui-regression';
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:8765';
const viewports = [[320, 700], [390, 844], [430, 932], [700, 320]]
  .filter(([width]) => !process.env.TEST_WIDTH || width === Number(process.env.TEST_WIDTH));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const report = { version: 'v14-one-screen-reader', screens: [], checks: [], errors: [] };
const prose = '.event-reader > .story-prose:not(.reader-measure)';
const options = '.event-reader .story-options';
const visibleLines = prose + ' .reader-visible';

function check(name, test) {
  report.checks.push({ name, pass: Boolean(test) });
  assert.ok(test, name);
}

async function screenshot(page, name) {
  await page.screenshot({ path: join(out, name + '.png'), animations: 'disabled' });
  report.screens.push(name + '.png');
}

async function reveal(page) {
  const skip = page.locator('[data-story-skip]');
  if (await skip.isVisible()) await skip.tap();
}

async function fit(page, label) {
  const dimensions = await page.evaluate(() => {
    const main = document.querySelector('#main-content');
    const story = document.querySelector('.event-reader > .story-prose');
    const nav = document.querySelector('#app > nav');
    const hud = document.querySelector('#app > .bhud');
    const controls = [...document.querySelectorAll('.event-reader .story-options button')];
    main.scrollTop = 500;
    return {
      scroll: window.scrollY || main.scrollTop,
      mainOverflow: main.scrollHeight - main.clientHeight,
      documentOverflow: document.documentElement.scrollWidth - innerWidth,
      navVisible: nav.getBoundingClientRect().bottom <= innerHeight + 1,
      hudVisible: hud.getBoundingClientRect().top >= -1,
      textFits: !story || [...story.children].every(line =>
        line.getBoundingClientRect().bottom <= story.getBoundingClientRect().bottom + 1),
      boxes: [main, hud, nav, story?.parentElement, story, ...controls].map(el => {
        const rect = el?.getBoundingClientRect();
        return rect && [el.className, Math.round(rect.top), Math.round(rect.height), Math.round(rect.bottom)];
      }),
      controlsFit: controls.every(button =>
        button.getBoundingClientRect().bottom <= main.getBoundingClientRect().bottom + 1),
    };
  });
  if (!(dimensions.textFits && dimensions.controlsFit)) {
    await screenshot(page, 'failure-' + label.replace(/[^a-z0-9]+/gi, '-'));
    throw new Error(label + ' ' + JSON.stringify(dimensions));
  }
  check(label + ' no scrolling, clipping or hidden HUD',
    dimensions.scroll === 0 && dimensions.mainOverflow <= 2 &&
    dimensions.documentOverflow <= 1 && dimensions.navVisible && dimensions.hudVisible);
}

function storyText(length) {
  const verse = Array.from('  山雨初歇，江湖故人仍循著燈火前行。\n\n書生道：「且慢！」🐎　此路可通嘉興。\n');
  return Array.from({ length }, (_, i) => verse[i % verse.length]).join('');
}

async function readPages(page, label, capture) {
  let text = '';
  let pages = 0;
  for (;;) {
    await reveal(page);
    await fit(page, label + ' page ' + (pages + 1));
    text += (await page.locator(visibleLines).allTextContents()).join('');
    pages++;
    if (capture && pages === 1) await screenshot(page, capture);
    const next = page.locator(options + ' .reader-next');
    if (!await next.count()) break;
    check(label + ' only reading button before final page',
      await page.locator(options + ' button').count() === 1);
    assert.ok(pages < 180, label + ' paging stalled');
    await next.tap();
  }
  return { text, pages };
}

async function showFixture(page, text, extra = {}) {
  await page.evaluate(({ text, extra }) => {
    const options = extra.long
      ? ['上前細查。'.repeat(95), '向旁人打聽。'.repeat(18), '暫且觀望。'.repeat(18)]
      : ['上前協助', '索取酬金', '暫且觀望'];
    showEvent({
      type: '奇遇', title: '山寺夜話', art: 'mountain', text,
      ...extra,
      choices: extra.noChoices ? [] : options.map((t, i) => ({
        t, s: ['g', 'e', 'n'][i], go: () => extra.result || '你向旅人問好。',
      })),
    });
    if (extra.noChoices) { UI.ov.choices = []; render(); }
  }, { text, extra });
}

async function advanceChoices(page, label) {
  let count = 0;
  for (let i = 0; i < 10; i++) {
    count += await page.locator(options + ' .event-choice').count();
    const more = page.locator(options).getByRole('button', { name: '下一頁選項' });
    if (!await more.count()) return count;
    await more.tap();
    await fit(page, label + ' choice group ' + (i + 2));
  }
  assert.fail(label + ' choice paging stalled');
}

async function pressContinue(page) {
  await page.locator(options + ' button').filter({ hasText: /^繼續$/ }).tap();
}

async function verifyHud(page, width, height) {
  const hud = await page.locator('#app > .bhud').evaluate(root => {
    const portrait = root.querySelector('.hport');
    const name = root.querySelector('.hname');
    const core = root.querySelector('.hud-core').getBoundingClientRect();
    const image = portrait.querySelector('img');
    return {
      size: [portrait.offsetWidth, portrait.offsetHeight],
      image: image.complete && image.naturalWidth > 0 && image.src.includes('hero_female.webp'),
      name: name.textContent,
      nameFits: name.scrollWidth <= name.clientWidth + 1 && name.scrollHeight <= name.clientHeight + 1,
      cells: [...root.querySelectorAll('.hport,.hud-identity,.mini-stat,.hgear,.hud-life svg')]
        .every(el => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.left >= core.left - 1 && r.right <= core.right + 1;
        }),
      stats: root.querySelectorAll('.mini-stat').length,
      statArt: [...root.querySelectorAll('.mini-stat-mark')]
        .every(mark => getComputedStyle(mark).backgroundImage.includes('/v12/stat_')),
    };
  });
  const doubleDigitsFit = await page.evaluate(() => {
    const original = { ...S.stats };
    for (const key of Object.keys(S.stats)) S.stats[key] = 18;
    render();
    const fits = [...document.querySelectorAll('#app > .bhud .mini-stat')].every(cell => {
      const frame = cell.getBoundingClientRect();
      const icon = cell.querySelector('.mini-stat-mark').getBoundingClientRect();
      const value = cell.querySelector('b').getBoundingClientRect();
      return icon.left >= frame.left && value.right <= frame.right && icon.right <= value.left;
    });
    S.stats = original;
    render();
    return fits;
  });
  check(width + ' two-digit stats fit without touching the adjacent badge', doubleDigitsFit);
  const expected = width <= 355 ? [60, 82] : width <= 410 ? [64, 86] : [72, 96];
  if (height <= 520) expected[1] = 64;
  check(width + ' portrait frame size', hud.size.join() === expected.join());
  check(width + ' original portrait, long name, vital icons and six stats fit',
    hud.image && hud.name === '歐陽司徒孤雁' && hud.nameFits && hud.cells && hud.stats === 6 && hud.statArt);
}

async function verifyScenery(page, width) {
  const visual = await page.evaluate(async () => {
    const stage = document.querySelector('.event-reader');
    const main = document.querySelector('#main-content');
    const folio = getComputedStyle(stage.querySelector('.reader-folio'));
    const stageAfter = getComputedStyle(stage, '::after');
    const header = getComputedStyle(main, '::before').backgroundImage;
    const border = getComputedStyle(main).borderImageSource;
    const urls = [header,border];
    const fetched = await Promise.all(urls.map(async url => {
      const match=url.match(/url\(["']?(.*?)["']?\)/);
      if(!match)return false;
      const response=await fetch(match[1]);
      return response.ok;
    }));
    return {
      noTopScenery:stage.querySelectorAll('.reader-scenery,.reader-landscape').length===0,
      noBottomScenery:(stageAfter.content==='none'||stageAfter.content==='normal') &&
        stageAfter.backgroundImage==='none' &&
        folio.paddingTop==='0px' && folio.backgroundImage==='none',
      framePreserved:fetched.every(Boolean) &&
        header.includes('story-header.webp') && border.includes('story-border.webp')
    };
  });
  check(width + ' both scenery images gone; ornate plaque and border preserved',
    Object.values(visual).every(Boolean),visual);
  await showFixture(page, '未收錄的場景亦不應在正文中生成圖片。', { art: 'ink-fallback', noChoices: true });
  check(width + ' no fallback landscape canvas in story',
    await page.locator('.reader-scenery canvas,.reader-landscape canvas').count()===0);
  await showFixture(page, '故人現身。', { who: 'su', noChoices: true });
  check(width + ' character portrait is preserved without scenery',
    await page.locator('.reader-character img').count()===1 &&
    await page.locator('.reader-scenery').count()===0);
  await fit(page,width+' foreground portrait');
}

async function verifyReflow(page) {
  const text = '⟠  ' + storyText(900);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await showFixture(page, text, { noChoices: true });
  check('typewriter starts with the current page only', await page.locator('#app.story-typing').count() === 1);
  await reveal(page);
  const first = (await page.locator(visibleLines).allTextContents()).join('');
  check('skip fills only one page', first.length < text.length && text.startsWith(first));
  await page.locator(options + ' .reader-next').tap();
  check('next page keeps its own typewriter', await page.locator('#app.story-typing').count() === 1);

  const require = createRequire(import.meta.url);
  const core = require.resolve('playwright-core/package.json');
  const trace = join(core, '..', 'lib', 'vite', 'traceViewer');
  const font = readdirSync(trace).find(file => /^codicon.*\.ttf$/.test(file));
  assert.ok(font, 'Playwright supplies a test font');
  let release;
  const delayed = new Promise(resolve => { release = resolve; });
  await page.route('**/v14-delayed-font.ttf', async route => {
    await delayed;
    await route.fulfill({ path: join(trace, font), contentType: 'font/ttf' });
  });
  const oldPages = await page.evaluate(() => readerPager.totalPages);
  const style = await page.addStyleTag({ content: `
    @font-face {font-family: SmokeDelayed; src:url('/v14-delayed-font.ttf'); unicode-range:U+EA60}
    #app[data-page="world"] .story-prose :is(.reader-line,.reader-visible) {
      font-family:SmokeDelayed,'Noto Serif TC',serif;
      font-size:23px;
    }` });
  await page.evaluate(() => { window.smokeFont = document.fonts.load('23px SmokeDelayed', ''); });
  await page.waitForFunction(() => document.fonts.status === 'loading' && readerPager.totalPages !== 0);
  release();
  await page.evaluate(() => window.smokeFont);
  await page.waitForFunction(previous => readerPager.totalPages !== previous, oldPages);
  check('delayed webfont loaded and larger type repaginates',
    await page.evaluate(() => document.fonts.check('23px SmokeDelayed', '')));
  await fit(page, 'larger type with delayed font');
  await style.evaluate(element => element.remove());
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const tab of ['人物', '行囊', '江湖']) {
    await page.locator('#app > nav').getByRole('button', { name: tab, exact: true }).tap();
  }
  await page.setViewportSize({ width: 700, height: 320 });
  await page.waitForFunction(() =>
    readerPager.stage.clientWidth > 500 &&
    readerPager.layoutKey.startsWith(readerPager.stage.clientWidth + '/' + readerPager.stage.clientHeight + '/'));
  const rest = await readPages(page, 'rotated mid-story');
  check('font, tabs and rotation preserve the exact unread boundary', first + rest.text === text);
  await page.setViewportSize({ width: 390, height: 844 });
}

async function verifyLongOptions(page, width, height) {
  const body = '山寺退路只有三條。';
  await showFixture(page, body, { long: true });
  const ordinary = await readPages(page, 'landscape long choice preface');
  check('long choices follow complete prose', ordinary.text === body);
  const labels = [];
  const previews = [];
  let detail = '';
  for (let i = 0; i < 20; i++) {
    await fit(page, 'landscape option page ' + (i + 1));
    detail += (await page.locator(prose + ' .reader-option-detail').allTextContents()).join('');
    const group = await page.locator(options + ' .event-choice').evaluateAll(buttons =>
      buttons.map(button => button.dataset.label));
    labels.push(...group);
    if (group.length && detail) {
      previews.push([detail, group[0]]);
      detail = '';
    }
    const more = page.locator(options).getByRole('button', { name: '下一頁選項' });
    if (!await more.count()) break;
    if (i === 0) await screenshot(page, 'long_choices_' + width + 'x' + height);
    await more.tap();
  }
  assert.deepEqual(previews.map(([preview]) => preview), previews.map(([, label]) => label));
  check('all long choices are reachable and original option text is complete',
    labels.length === 3 && labels[0].length > 450 && previews.length > 0);
  await page.locator(options).getByRole('button', { name: '上一頁選項' }).tap();
  check('previous long choice page can be reopened',
    await page.locator(options).getByRole('button', { name: '下一頁選項' }).count() === 1);
}

async function touchThrow(ctx, page, tray) {
  await tray.scrollIntoViewIfNeeded();
  const { x, y, width, height } = await tray.boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const start = { x: x + width / 2, y: y + height / 2, id: 1 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
  for (let step = 1; step <= 5; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
      ...start, x: start.x + 60 * step / 5, y: start.y - 46 * step / 5,
    }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

async function verifyBattle(ctx, page, width, height) {
  const start = async easy => {
    await page.evaluate(easy => showEvent({
      type: '江湖', title: '山路試招', text: '山賊攔路。', choices: [
        { s: 'g', t: '應戰', go: () => {
          const e = foe('山賊', 1, 0.1, 'thug');
          e.hp = e.mhp = easy ? 1 : 9999;
          return { title: '山路對決', battle: e };
        } },
      ],
    }), easy);
    await reveal(page);
    await page.locator(options + ' .side-g').tap();
    return page.getByRole('dialog', { name: '江湖戰鬥' });
  };
  const battle = await start(false);
  const tray = battle.locator('.tray.live3d');
  await tray.waitFor();
  check(width + ' restored battle and both fighters',
    await battle.locator('.arena .fgt.p, .arena .fgt.e').count() === 2 &&
    await battle.locator('.srow .sl, .srow .sr').count() === 2 &&
    await tray.evaluate(el => {
      const canvas = document.querySelector('body > canvas[data-engine^="three.js"]');
      return getComputedStyle(el).touchAction === 'none' &&
        !!(canvas?.getContext('webgl2') || canvas?.getContext('webgl'));
    }));
  const box = await battle.boundingBox();
  check(width + ' full battle dialog fits the viewport',
    box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1);
  await screenshot(page, 'battle_' + width + 'x' + height);
  await touchThrow(ctx, page, tray);
  await page.waitForFunction(() => UI.ov?.phase === 'fight' && UI.ov.tick > 0, null, { timeout: 9000 });
  check(width + ' WebGL touch drag rolls a d20 and advances battle',
    await page.evaluate(() => Number.isInteger(UI.ov.roll) && UI.ov.roll >= 1 &&
      UI.ov.roll <= 20 && UI.ov.seq > 0 && !!DIE3));
  await battle.locator('.spd').tap();
  check(width + ' battle speed toggles', await page.evaluate(() => UI.ov.speed === 2));
  await battle.locator('.bdock .surr button').tap();
  check(width + ' surrender settles', await page.evaluate(() => UI.ov.over === 'lose'));
  await battle.locator('.bdock .side button').filter({ hasText: '繼續' }).tap();
  await reveal(page);
  check(width + ' surrender returns to the result page', await page.locator(prose + ' .reader-result').count() > 0);

  if (width === 390) {
    const victory = await start(true);
    await victory.getByRole('button', { name: /跳過投擲/ }).tap();
    check('skip rolls 10', await page.evaluate(() => UI.ov.roll === 10));
    await page.waitForFunction(() => UI.ov?.over === 'win', null, { timeout: 9000 });
    await screenshot(page, 'battle_victory_390x844');
    await victory.locator('.bdock .side button').filter({ hasText: '收招' }).tap();
    await reveal(page);
    check('victory returns to the result page', await page.locator(prose + ' .reader-result').count() > 0);
  }
}

try {
  for (const [width, height] of viewports) {
    const ctx = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
      reducedMotion: 'reduce',
    });
    try {
      const page = await ctx.newPage();
      page.on('pageerror', error => report.errors.push(width + ' JS: ' + error.message));
      await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /初入江湖/ }).tap();
      await page.locator('#nm').fill('歐陽司徒孤雁');
      await page.getByRole('button', { name: '女', exact: true }).tap();
      await page.getByRole('button', { name: /踏入江湖/ }).tap();
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#app > .bhud .hero-portrait').evaluate(img => img.decode());
      await verifyHud(page, width, height);
      await fit(page, width + ' actual opening event');
      if (width === 390) {
        await page.evaluate(() => { S.gender = '男'; render(); });
        await page.locator('#app > .bhud .hero-portrait').evaluate(img => img.decode());
        check('390 male protagonist source retained',
          await page.locator('#app > .bhud .hero-portrait[src*="hero_male.webp"]').count() === 1);
        await page.evaluate(() => { S.gender = '女'; render(); });
        await showFixture(page, '書生問道：「前面的山路是否通往嘉興？」');
        check('390 dialogue line styling retained', await page.locator(prose + ' .reader-dialogue').count() === 1);
      }

      for (const length of [100, 300, 1000]) {
        const text = storyText(length);
        if (length === 300) {
          await showFixture(page, text, { noChoices: true });
          await verifyScenery(page, width);
        }
        await showFixture(page, text, { noChoices: length !== 1000 });
        const read = await readPages(page, width + ' ' + length + ' chars',
          length === 1000 ? 'reader_' + width + 'x' + height : null);
        assert.equal(read.text, text, width + ' ' + length + ' exact visible text');
        check(width + ' ' + length + ' exact visible text', true);
        if (length === 1000) check(width + ' long story uses multiple pages', read.pages > 1);
        check(width + ' terminal controls for ' + length,
          await advanceChoices(page, width + ' terminal') === (length === 1000 ? 3 : 0));
        if (length === 1000) {
          check(width + ' gilt choice design retained', await page.locator(options + ' .event-choice')
            .first().evaluate(button => getComputedStyle(button).backgroundImage.includes('story-button.webp')));
          await screenshot(page, 'choices_' + width + 'x' + height);
        }
      }

      const result = storyText(700);
      const chapters = [storyText(300), storyText(450)];
      await showFixture(page, '', { pages: chapters, result });
      const day = await page.evaluate(() => today());
      check(width + ' first author chapter exact', (await readPages(page, width + ' chapter one')).text === chapters[0]);
      check(width + ' original chapter advances only by its own action', await page.evaluate(() => UI.ov.pi === 0));
      await pressContinue(page);
      check(width + ' second author chapter exact', (await readPages(page, width + ' chapter two')).text === chapters[1]);
      check(width + ' author chapter order retained', await page.evaluate(() => UI.ov.pi === 1));
      await advanceChoices(page, width + ' final chapter');
      await page.locator(options + ' .side-n').tap();
      const appended = await page.evaluate(() => UI.story.lines.slice(2).map(line => line.text).join(''));
      const readResult = await readPages(page, width + ' choice and result');
      check(width + ' starts on appended choice and includes full result',
        readResult.text === appended && readResult.text.includes(result));
      check(width + ' result waits for explicit continuation', await page.evaluate(d => today() === d, day));
      await pressContinue(page);
      check(width + ' next real event starts seamlessly', await page.locator('.event-reader').count() === 1);

      if (width === 390) await verifyReflow(page);
      if (width > 430) await verifyLongOptions(page, width, height);
      if (width <= 430) {
        for (const tab of ['人物', '武功', '人脈', '行囊']) {
          await page.locator('#app > nav').getByRole('button', { name: tab, exact: true }).tap();
          check(width + ' navigates to ' + tab, await page.locator('#app[data-page="me"], #app[data-page="bag"]').count() === 1);
          check(width + ' ' + tab + ' preserves app width',
            await page.locator('#app').evaluate(el => Math.abs(el.getBoundingClientRect().width - innerWidth) <= 1));
        }
        const item = await page.evaluate(() => {
          const id = 'w_sword1';
          addItem(id);
          if (S.weapon === id) S.weapon = null;
          render();
          return ITEMS[id].n;
        });
        await page.locator('.bk-grid').getByRole('button', { name: item, exact: true }).tap();
        await page.locator('.bk-card').getByRole('button', { name: '裝備', exact: true }).tap();
        check(width + ' inventory equips an item', await page.evaluate(() => S.weapon === 'w_sword1'));
        await page.getByRole('button', { name: '江湖', exact: true }).tap();
        await page.locator('#app > .bhud .hgear').tap();
        await page.locator('.sheet-h button').filter({ hasText: '關閉' }).tap();
        check(width + ' settings preserves active event', await page.locator('.event-reader').count() === 1);
        await page.evaluate(() => { S.v = 4; save(); });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: /繼續前緣/ }).tap();
        check(width + ' reloads an existing v4 save',
          await page.evaluate(() => S.name === '歐陽司徒孤雁' && S.v >= 5 && S.weapon === 'w_sword1' &&
            !Object.hasOwn(JSON.parse(localStorage.getItem(SAVE_KEY)), 'readerPager')));
        await verifyBattle(ctx, page, width, height);
      }
    } finally {
      await ctx.close();
    }
  }
} catch (error) {
  report.errors.push(error.stack || String(error));
} finally {
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.errors.length) {
  console.error(report.errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ passed: report.checks.length, screenshots: report.screens.length }));
}
