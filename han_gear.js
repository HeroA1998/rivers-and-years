'use strict';
/* v9.5：道具當鑰匙、裝備詞條（參考 Life in Adventure 的 Item Attributes 與雜物用法）
   ‧ 新道具：麻繩、火把、乾糧、鐵鎬、銅鏡。雜物在繞過戰鬥、特定事件裡是鑰匙：有就多一條路，不必檢定或大幅提高成功率。
   ‧ 四個裝備詞條：
       威嚇（intim）：遇到攔路敵人的機會變少；嚇退的成功率提高。
       隱匿（stealth）：潛行繞過的成功率提高。
       識謊（lie）：識破騙局，部分事件不必檢定。
       辟邪（ward）：不被詭異的事嚇到（見 shock）。 */

/* ---------- 新道具 ---------- */
Object.assign(ITEMS, {
  rope:    { n: '麻繩', kind: 'misc', price: 20, d: '一捆結實的麻繩。能絆馬、攀崖、縛人，繞過不少麻煩。（不會用掉）' },
  torch:   { n: '火把', kind: 'misc', price: 5, d: '浸了松脂的火把。野獸怕火，暗處也用得上。（用一次就燒完）' },
  ration:  { n: '乾糧', kind: 'misc', price: 8, d: '曬乾的麥餅。餓了能吃，也能拿來引開野獸。（用一次就沒了）' },
  pickaxe: { n: '鐵鎬', kind: 'misc', price: 45, d: '鐵匠打的鎬頭。能撬機關、鑿石門、挖開塌方。（不會用掉）' },
  mirror:  { n: '銅鏡', kind: 'relic', price: 120, tags: ['謀'], fx: { lie: 1, ward: 1, d: '識謊、辟邪：看得出人話裡的破綻，邪祟也近不了身' } },
});

/* ---------- 裝備詞條 ---------- */
const addFx = (id, fx, d) => {
  const it = ITEMS[id]; if (!it) return;
  it.fx = it.fx || {}; Object.assign(it.fx, fx);
  if (d) it.fx.d = it.fx.d ? it.fx.d + '；' + d : d;
};
const D_INTIM = '威嚇：攔路的敵人會少遇到一些，嚇退成功率提高';
const D_STEALTH = '隱匿：潛行繞過的成功率提高';
const D_WARD = '辟邪：詭異的事嚇不倒你';
for (const id of ['acc_belt', 'han_helm', 'han_blade', 'w_cleaver', 'ht_fang', 'mn_bone', 'mn_rattan']) addFx(id, { intim: 1 }, D_INTIM);
addFx('a_night', { stealth: 2 }, D_STEALTH);
for (const id of ['tf_mask', 'tf_claw', 'acc_boots']) addFx(id, { stealth: 1 }, D_STEALTH);
for (const id of ['acc_amulet', 'acc_bead', 'hj_talisman', 'r_page', 'hj_robe']) addFx(id, { ward: 1 }, D_WARD);

// 特質也帶詞條
{
  const tf = (id, fx, d) => { const t = TRAITS[id]; t.fx = Object.assign(t.fx || {}, fx); t.d += ' ' + d; };
  tf('evil', { intim: 1 }, '威嚇 +1。');
  tf('butcher', { intim: 2 }, '威嚇 +2。');
  tf('mighty', { intim: 1 }, '威嚇 +1。');
  tf('nimble', { stealth: 1 }, '隱匿 +1。');
  tf('ghost', { stealth: 2 }, '隱匿 +2。');
}

/* ---------- 雜貨上架 ---------- */
{
  const _ts = townStock;
  townStock = function (s) {
    const base = _ts(s);
    const tools = [{ id: 'torch', qty: 2 }, { id: 'ration', qty: 2 }];
    if (!has('rope')) tools.push({ id: 'rope', qty: 1 });
    if (!has('pickaxe') && chance(60)) tools.push({ id: 'pickaxe', qty: 1 });
    base.splice(2, 0, ...tools.map(t => ({ id: t.id, sold: false, qty: t.qty })));
    return base;
  };
}

/* ---------- 威嚇：遇到攔路敵人的機會變少 ---------- */
{
  const intimPct = () => Math.min(60, (S ? gearFx('intim') : 0) * 20);
  const _roll = rollEvent;
  rollEvent = function (ctx) {
    let e = _roll(ctx);
    for (let i = 0; i < 2 && e && e.type === '戰鬥' && chance(intimPct()); i++) { const e2 = _roll(ctx); if (e2) e = e2; }
    return e;
  };
  const _draw = drawCard;
  drawCard = function (forceAny) {
    let c = _draw(forceAny);
    for (let i = 0; i < 2 && c && chance(intimPct()); i++) {
      const last = (S.flags.cardHist || []).slice(-1)[0], card = CARDS.find(x => x.id === last);
      if (!(card && card.opts && card.opts.some(o => o.fight))) break;
      const c2 = _draw(forceAny); if (c2) c = c2;
    }
    return c;
  };
}

/* ---------- 事件裡的鑰匙選項 ---------- */
const forceOk = fn => {
  const orig = check;
  check = (st, dc) => ({ ok: true, roll: 20, mod: 0, stat: st, dc, crit: false, fumble: false });
  try { return fn(); } finally { check = orig; }
};
{
  const wrap = (id, f) => { const e = EVENTS.find(x => x.id === id); if (!e) return; const arr = e.choices, orig = typeof arr === 'function' ? arr : () => arr; e.choices = s => f(orig(s).slice(), s); };
  const has_ = id => s => (s.inv[id] || 0) > 0;
  // 古井：繩子拴好，穩穩下井，不必檢定
  wrap('hx_well', (c) => { c.push(OPT('n', '拴上麻繩，穩穩當當下井（麻繩）', () => forceOk(() => c[0].go(S)), { req: has_('rope'), reqT: '需要麻繩' })); return c; });
  // 岔路：有繩子，山徑也走得穩
  wrap('hx_fork', (c) => { c.push(OPT('n', '走山徑，用麻繩溜下陡坡（麻繩）', () => '你在崖邊拴好麻繩，一段一段溜了下去。比預計早到了一天，連手都沒磨破。' + (battleXp(40) || ''), { req: has_('rope'), reqT: '需要麻繩' })); return c; });
  // 蝗災：火把燒蝗
  wrap('hn_locust', (c) => { c.push(OPT('g', '點起火把，沿田埂放火驅蝗（用掉火把）', () => { addItem('torch', -1); return '你沿著田埂點起一道火牆，蝗蟲見火就散。村民跟著你把火線一路拉過去，最後幾畝地保住了。村長端來一碗稀粥，說這是全村今天唯一的一碗。' + gain({ moral: 4, fame: 5, qi: 1 }); }, { req: has_('torch'), reqT: '需要火把' })); return c; });
  // 古墓：鐵鎬撬開兵器架，不驚動銅人
  wrap('a_tomb', (c) => { c.push(OPT('n', '用鐵鎬撬下兵器架上的寶物，避開銅人（鐵鎬）' + ODDS('agi', 12), () => { const r = ROLLT('agi', 12); if (!r.ok) return win(foe('守墓銅人', 8, 0.55, 'puppet'), () => { const id = atkArts().some(a => SKILLS[a].type === 'blade') ? 'w_blade3' : 'w_sword3'; return '銅人轟然倒地。你握住兵器，一股涼意直透掌心。' + addItem(id) + autoGear(id); }, null, { intro: r.line + '鐵鎬磕在石架上，「噹」的一聲！銅人的眼窩亮了起來。' }); const id = atkArts().some(a => SKILLS[a].type === 'blade') ? 'w_blade3' : 'w_sword3'; return r.line + '你貼著牆根摸到兵器架，鐵鎬卡進榫縫，一點一點把寶物撬了下來。銅人的紅光始終沒有亮起。' + addItem(id) + autoGear(id); }, { req: has_('pickaxe'), reqT: '需要鐵鎬' })); return c; });
  // 三碗猜珠：識謊，一眼看穿
  wrap('hx_shells', (c) => { c.push(OPT('n', '你一眼看穿他的把戲（識謊）', () => forceOk(() => c[1].go(S)), { req: s => gearFx('lie') >= 1, reqT: '需要「識謊」（裝備銅鏡）' })); return c; });
}
{
  // 賭坊卡：識謊的人直接揭穿莊家
  const c = CARDS.find(x => x.id === 'c_gamble');
  if (c) c.opts.push(Object.assign({}, c.opts[0], { t: '一眼看穿莊家的手法，當眾揭穿（識謊）', stat: undefined, dc: undefined, no: undefined, plain: true, s: 'g', req: s => gearFx('lie') >= 1, reqT: '需要「識謊」（裝備銅鏡）' }));
}
