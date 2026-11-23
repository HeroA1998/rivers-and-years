/* 江湖歲月錄 — 引擎：狀態、時間、戰鬥、行動 */
'use strict';

let S = null;                 // 存檔狀態
let UI = { screen: 'title', tab: 'world', ov: null, create: null };
let Q = [];                   // 待觸發事件佇列
let H = [];                   // 當前畫面的按鈕處理器
const SAVE_KEY = 'jianghu_jinyong_v1';

/* ---------- 小工具 ---------- */
const R = n => Math.floor(Math.random() * n);
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => a + R(b - a + 1);
const pick = a => a[R(a.length)];
const chance = p => Math.random() * 100 < p;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const me = () => S.name;

const CN = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function cnNum(n) {
  if (n <= 10) return CN[n];
  if (n < 20) return '十' + CN[n - 10];
  if (n < 100) return CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : '');
  return String(n);
}
function cnDay(d) {
  if (d <= 10) return '初' + CN[d];
  if (d < 20) return '十' + CN[d - 10];
  if (d === 20) return '二十';
  if (d < 30) return '廿' + CN[d - 20];
  return '三十';
}
const MONTH_N = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '臘月'];
const dateStr = (d = S.date) => `${reign((S.y0 || 1222) + d.y - 1)} ${MONTH_N[d.m]}${cnDay(d.d)}`;
const season = () => '春春春夏夏夏秋秋秋冬冬冬'[S.date.m - 1];
const age = () => 15 + S.date.y + (S.age0 || 0);

/* ---------- 存檔 ---------- */
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 無法存檔時照常遊玩 */ } }
function loadSave() { try { const t = localStorage.getItem(SAVE_KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 忽略 */ } }

/* ---------- 建立角色 ---------- */
function rollStats() {
  const st = { str: 5, con: 5, int: 5, agi: 5, luck: 5, cha: 5 };
  const ks = Object.keys(st);
  for (let i = 0; i < 6; i++) st[pick(ks)]++;
  return st;
}
function newGame(c, legacy) {
  const year = c.year || 1222, all = originsFor(year);
  // 射鵰篇可選出身之地：選了就在那片土地上投胎（哪一戶人家仍由天定），並走對應的故事線
  const land = year <= SEAL_YEAR && c.land ? c.land : null, pool = land ? all.filter(x => x.land === land) : all;
  const o = land ? pick(pool) : typeof c.origin === 'number' ? pool[c.origin % pool.length] : pick(pool);   // 投胎由天
  const base = Object.assign({}, c.stats);
  for (const k in o.st) base[k] += o.st[k];
  S = {
    v: 4, name: c.name || '無名', gender: c.gender, origin: o.base, birth: o.n, gen: legacy ? legacy.gen + 1 : 1, age0: 0,
    y0: year, date: { y: 1, m: 1, d: 1 }, loc: o.loc, base, stats: Object.assign({}, base), bonus: {},
    lv: 1, exp: 0, pts: 0,
    life: 3, qi: 3, bonusLife: 0,
    hp: 1, mp: 1, bonusHp: 0, bonusMp: 0, silver: 120 + (o.silver || 0), fame: 0, moral: 0,
    sect: null, rank: 0, contrib: 0, contribTotal: 0,
    skills: { basic_fist: { lv: 1, exp: 0 }, tuna: { lv: 1, exp: 0 } }, nei: 'tuna', eq: ['basic_fist', 'tuna'],
    weapon: null, armor: null, acc: null, inv: { jinchuang: 2 },
    npcs: {}, spouse: null, child: null, disciple: null, rival: 0,
    done: {}, flags: {}, log: [], journal: [], seen: {}, hist: null, chain: {}, wins: 0, losses: 0, legacyFrom: null,
    line: land ? (land === '蒙古' ? 'guojing' : 'yangkang') : null, lineDone: {},
  };
  if (o.item) { S.inv[o.item] = 1; S.weapon = o.item; }
  if (o.herb) S.inv.herb = o.herb;
  if (legacy) {
    S.legacyFrom = legacy.from;
    S.silver += legacy.silver;
    if (legacy.skill) { S.skills[legacy.skill.id] = { lv: legacy.skill.lv, exp: 0 }; autoEquip(legacy.skill.id); }
    if (legacy.weapon) { S.inv[legacy.weapon] = 1; S.weapon = legacy.weapon; }
    if (legacy.blood) { S.base.int++; S.base.con++; }
  }
  recalc();
  S.life = lifeMax(); S.qi = qiMax(); S.hp = maxHp(); S.mp = maxMp();
  Q = [];
  histInit();
  // 開局先讓玩家知道下一件大事，免得頭幾個月無所適從
  const nx = histRumors(1000, true)[0];
  if (nx) S.flags.heardOf = { [nx.h.id]: 1 };
  const era = [...ERAS].reverse().find(x => x.y <= S.y0);
  log(`${reign(S.y0)}（${S.y0}年）。${S.name}，${o.n}，年方十六，${legacy ? `身上帶著${legacy.from}留下的遺澤，` : ''}在${LOCS[o.loc].n}踏上了江湖路。`);
  Q.push({ type: '身世', title: o.n, art: LOCS[o.loc].art, pages: () => lineOpen(o.open(S)), choices: o.choices });
  if (era) log(era.d);
  UI = { screen: 'game', tab: 'world', ov: null };
  pump();
  window.scrollTo(0, 0);
}
// 舊存檔（v3 以前）轉成新制：能力值分成本身與加成，內功、身法也放進五格武功
function migrate(s) {
  if (s.v >= 5) return s;
  if (!(s.v >= 4)) migrate4(s);
  s.v = 5; s.bonusLife = s.bonusLife || 0;
  if (s.flags && s.flags.lover && !loveOK(s, s.flags.lover)) { s.flags.lover = null; if (s.spouse && !loveOK(s, s.spouse)) s.spouse = null; }
  s.life = 3 + Math.floor(((s.lv || 1) - 1) / 5) + s.bonusLife; s.qi = 3;
  return s;
}
function migrate4(s) {
  s.v = 4; s.base = Object.assign({}, s.stats); s.bonus = {}; s.lv = s.lv || 1; s.exp = s.exp || 0; s.pts = s.pts || 0; s.acc = s.acc || null;
  const eq = [s.nei, ...(s.eq || [])];
  const q = Object.keys(s.skills).filter(id => SKILLS[id].type === 'qing').sort((a, b) => s.skills[b].lv * SKILLS[b].dodge - s.skills[a].lv * SKILLS[a].dodge)[0];
  if (q) eq.push(q);
  s.eq = [...new Set(eq.filter(Boolean))].slice(0, EQ_MAX);
}

/* ---------- 能力值：本身（初始天資、升級配點、故事）＋裝備加成（兵刃、護甲、飾品、武功） ---------- */
function equipBonus() {
  const b = {};
  const add = o => { for (const x in o || {}) b[x] = (b[x] || 0) + o[x]; };
  for (const id of S.eq) add(artSt(id));
  for (const [sl] of GEAR_SLOTS) if (S[sl] && ITEMS[S[sl]]) add(ITEMS[S[sl]].st);
  return b;
}
function recalc() {
  S.bonus = equipBonus();
  for (const k in STAT_N) S.stats[k] = Math.max(1, (S.base[k] || 1) + (S.bonus[k] || 0));
  // 主修內功：裝備中最強的一門
  let best = null;
  for (const id of S.eq) if (SKILLS[id].type === 'nei' && (!best || SKILLS[id].tier * 20 + S.skills[id].lv > SKILLS[best].tier * 20 + S.skills[best].lv)) best = id;
  S.nei = best;
  S.hp = Math.min(S.hp, maxHp()); S.mp = Math.min(S.mp, maxMp());
  S.life = Math.min(S.life, lifeMax()); S.qi = Math.min(S.qi, qiMax());
}
const fxSum = key => S.eq.reduce((t, id) => t + (artFx(id)[key] || 0), 0) + gearFx(key);

/* ---------- 裝備系統 v2 ----------
   兵刃綁一項能力值（刀拳看臂力、劍鞭看身法、暗器看福緣，少數名器可改看別項），威力隨能力放大；
   雙手兵器佔用副手；重兵重甲有能力門檻；詞條（fx）與武功效果共用同一套計算。 */
const gearList = () => GEAR_SLOTS.map(x => S[x[0]]).filter(id => id && ITEMS[id]);
const gearFx = key => gearList().reduce((t, id) => { const f = ITEMS[id].fx; return t + (f && typeof f[key] === 'number' ? f[key] : 0); }, 0);
const gearChk = st => gearList().reduce((t, id) => t + ((((ITEMS[id].fx || {}).chk) || {})[st] || 0), 0);
const gearAttrUp = a => gearList().reduce((t, id) => t + ((((ITEMS[id].fx || {}).attrUp) || {})[a] || 0), 0);
const wStat = it => { const st = it.stat || ART_ST[it.wt] || 'str'; return it.alt && S.stats[it.alt] > S.stats[st] ? it.alt : st; };
// 兵刃威力：綁定能力為 5 時是原值，每多一點 +6%
function weaponAtk(type) { const it = S.weapon && ITEMS[S.weapon]; return it && it.wt === type ? it.atk * (0.7 + 0.06 * S.stats[wStat(it)]) : 0; }
const reqOk = it => Object.keys(it.req || {}).every(k => S.stats[k] >= it.req[k]);
const reqText = it => Object.keys(it.req || {}).map(k => `需${STAT_N[k]} ${it.req[k]}`).join('、');
const resOf = (e, type) => ((FOE_RES[e.style] || {})[ATK_T[type]]) || 1;
function gearInfo(it) {
  const p = [];
  if (it.kind === 'weapon') p.push(`${ATK_TN[ATK_T[it.wt]]}擊・看${STAT_N[it.stat || ART_ST[it.wt]]}${it.alt ? `（悟性高時改看${STAT_N[it.alt]}）` : ''}`);
  if (it.hand === 2) p.push('雙手');
  if (it.req) p.push(reqText(it));
  if (it.fx && it.fx.d) p.push(it.fx.d);
  return p.join('・');
}
// 穿戴或卸下：雙手兵器會卸下副手；副手不能和雙手兵器同時拿；能力不足用不動
function equipGear(id) {
  const it = ITEMS[id], sl = GEAR_KIND[it.kind];
  if (!sl) return '';
  if (S[sl] === id) { S[sl] = null; recalc(); return `卸下${it.n}`; }
  if (!reqOk(it)) return `${reqText(it)}，現在還用不動${it.n}`;
  if (sl === 'off' && S.weapon && ITEMS[S.weapon].hand === 2) return `${ITEMS[S.weapon].n}是雙手兵器，騰不出手拿${it.n}`;
  let note = `裝備${it.n}`;
  if (sl === 'weapon' && it.hand === 2 && S.off) { note = `雙手持${it.n}，卸下了${ITEMS[S.off].n}`; S.off = null; }
  S[sl] = id; recalc();
  return note;
}

/* ---------- 命（氣血）與氣團（內力） ----------
   氣血是「命」：起始 3 顆愛心，打輸一場、事件失敗各扣一顆，歸零就是命喪江湖。
   內力是「氣團」：事件中的運功、動手會消耗，戰鬥中的絕招也用它；每過二十天回一顆。
   戰鬥內部仍用數值血條（S.hp、S.mp 只在戰鬥中有意義），每場開打時由命與氣團換算。 */
const lifeMax = () => 3 + Math.floor(((S.lv || 1) - 1) / 5) + (S.bonusLife || 0);
const qiMax = () => clamp(Math.round(maxMp() / 22), 3, 9);
let PEND = [];                                   // 先記下、等事件結果顯示時再附上的提示
const takePend = () => { const t = PEND.join(''); PEND = []; return t; };
function hurt(n = 1) {
  if (S.life <= 0) return '';
  const d = Math.min(n, S.life); S.life -= d;
  return `〔氣血-${d}${S.life <= 0 ? '・氣血耗盡' : ''}〕`;
}
function heal(n = 1) { const d = Math.min(n, lifeMax() - S.life); S.life += d; return d ? `〔氣血+${d}〕` : ''; }
function gainQi(n) { const d = clamp(n, -S.qi, qiMax() - S.qi); S.qi += d; return d ? `〔內力${d > 0 ? '+' : ''}${d}〕` : ''; }
const QI_KEY = /運功|施展|迎雷|逼毒|催逼/;
const autoQi = c => QI_KEY.test(c.t || '') ? 1 : 0;
const hurtQ = () => { PEND.push(hurt(1)); }, healQ = () => { PEND.push(heal(1)); };

/* ---------- 衍生數值 ---------- */
function neiSum(key) {
  let t = 0;
  for (const id of S.eq) {
    const k = SKILLS[id];
    if (k.type === 'nei') t += S.skills[id].lv * k[key] * (id === S.nei ? 1 : 0.5);
  }
  return Math.round(t);
}
const maxHp = () => 80 + S.stats.con * 12 + neiSum('hp') + S.bonusHp + ((S.lv || 1) - 1) * 6;
const maxMp = () => 30 + S.stats.int * 2 + S.stats.con * 3 + neiSum('mp') + S.bonusMp + ((S.lv || 1) - 1) * 3;
const neiLv = () => S.nei && S.skills[S.nei] ? S.skills[S.nei].lv : 0;
const neiFactor = () => S.nei ? 1 + neiLv() * 0.035 * SKILLS[S.nei].tier : 1;
function qingBonus() {
  let b = 0;
  for (const id of S.eq) if (SKILLS[id].type === 'qing') b = Math.max(b, S.skills[id].lv * SKILLS[id].dodge);
  return b;
}
const pDodge = () => S.stats.agi * 1.2 + qingBonus();
const pDef = () => S.stats.con * 0.8 + (S.armor ? ITEMS[S.armor].def : 0) + neiLv() * 0.5;
// 戰力只算裝備中的武功
function power() {
  let s = 0;
  for (const id of S.eq) s += S.skills[id].lv * SKILLS[id].tier;
  return s / 3 + (S.stats.str + S.stats.con + S.stats.agi) / 6 + ((S.weapon ? ITEMS[S.weapon].atk : 0) + (S.armor ? ITEMS[S.armor].def : 0)) / 6 + ((S.lv || 1) - 1) * 0.3;
}
const artAtk = id => { const k = SKILLS[id]; return k.moves && artRole(id) === 'atk' ? Math.round(k.moves[0][3] * (1 + 0.15 * (S.skills[id].lv - 1))) : 0; };
function fameTitle() {
  const f = S.fame, evil = S.moral <= -40;
  if (f < 50) return '無名小卒';
  if (f < 150) return '初出茅廬';
  if (f < 400) return '小有名氣';
  if (f < 800) return evil ? '一方凶人' : '名動一方';
  if (f < 1500) return evil ? '蓋世魔頭' : '一代大俠';
  return evil ? '萬魔之主' : '武林神話';
}
const moralName = () => S.moral >= 60 ? '俠肝義膽' : S.moral >= 20 ? '心存俠義' : S.moral > -20 ? '亦正亦邪' : S.moral > -60 ? '心狠手辣' : '惡貫滿盈';

/* ---------- 增減與學習 ---------- */
function log(s) { S.log.push({ t: dateStr(), s }); if (S.log.length > 40) S.log.shift(); }
const GAIN_N = { silver: '銀兩', fame: '聲望', moral: '俠義', hp: '氣血', mp: '內力', contrib: '門派貢獻', bonusHp: '鬥氣上限', bonusMp: '內力上限', bonusLife: '氣血上限' };
function gain(o) {
  const out = [];
  let st = false;
  for (const k in o) {
    let v = o[k];
    if (!v) continue;
    if (k in STAT_N) { S.base[k] = clamp(S.base[k] + v, 1, 30); st = true; out.push(`${STAT_N[k]}${v > 0 ? '+' : ''}${v}`); continue; }
    // 氣血、內力的變化只有三種：扣或回一顆、999 為全滿（只用於明確的療傷或睡足）
    if (k === 'hp') { const t = v <= -1 ? hurt(-v >= 999 ? 99 : 1) : v >= 999 ? heal(99) : v > 0 ? heal(1) : ''; if (t) out.push(t.replace(/^〔|〕$/g, '')); continue; }
    if (k === 'mp') { const t = v >= 999 ? gainQi(99) : v > 0 ? gainQi(1) : v < 0 ? gainQi(-1) : ''; if (t) out.push(t.replace(/^〔|〕$/g, '')); continue; }
    if (k === 'contrib') { S.contrib = Math.max(0, S.contrib + v); if (v > 0) S.contribTotal += v; }
    else if (k === 'silver') { v = Math.max(v, -S.silver); S.silver += v; }
    else if (k === 'moral') S.moral = clamp(S.moral + v, -100, 100);
    else S[k] += v;
    if (k === 'fame') S.fame = Math.max(0, S.fame);
    if (v && Math.abs(v) < 900) out.push(`${GAIN_N[k]}${v > 0 ? '+' : ''}${Math.round(v)}`);
  }
  if (st || o.bonusLife || o.bonusMp) recalc();
  S.life = Math.min(S.life, lifeMax()); S.qi = Math.min(S.qi, qiMax());
  return out.length ? `〔${out.join('　')}〕` : '';
}
function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) { delete S.inv[id]; for (const sl of ['weapon', 'armor', 'acc']) if (S[sl] === id) { S[sl] = null; recalc(); } } return n > 0 ? `〔獲得 ${ITEMS[id].n}${n > 1 ? '×' + n : ''}〕` : ''; }
const has = id => (S.inv[id] || 0) > 0;
const knows = id => !!S.skills[id];
const xpNeed = (lv, tier) => Math.round(40 * Math.pow(lv, 1.6) * [1, 1.5, 2.2][tier - 1]);
// 等級：閱歷來自事件與戰鬥；升一級得三點屬性點數
const expNeed = lv => 50 + 30 * lv + 6 * lv * lv;
function gainExp(n) {
  n = Math.round(n);
  if (n <= 0) return '';
  S.exp += n;
  let up = 0;
  while (S.exp >= expNeed(S.lv)) { S.exp -= expNeed(S.lv); S.lv++; S.pts += 3; up++; }
  if (up) { S.life = Math.min(lifeMax(), S.life + 1); S.qi = qiMax(); }
  return `〔閱歷+${n}〕` + (up ? `〔等級提升至 ${S.lv}！屬性點數+${3 * up}〕` : '');
}
function autoEquip(id) {
  if (S.eq.includes(id)) return true;
  if (S.eq.length < EQ_MAX) { S.eq.push(id); recalc(); return true; }
  const r = artRole(id), same = S.eq.filter(x => artRole(x) === r).sort((a, b) => SKILLS[a].tier - SKILLS[b].tier || S.skills[a].lv - S.skills[b].lv);
  if (same.length && SKILLS[same[0]].tier < SKILLS[id].tier) { S.eq[S.eq.indexOf(same[0])] = id; recalc(); return true; }
  return false;
}
function equipArt(id) {
  if (S.eq.includes(id)) return;
  if (S.eq.length >= EQ_MAX) return toastRender('最多裝備五門武功，先卸下一門');
  S.eq.push(id); recalc(); save(); render();
}
function unequipArt(id) { S.eq = S.eq.filter(x => x !== id); recalc(); save(); render(); }
function learn(id, lv = 1) {
  if (knows(id)) return xp(id, 200) || `〔${SKILLS[id].n} 的領悟加深了〕`;
  S.skills[id] = { lv, exp: 0 };
  const on = autoEquip(id);
  return `〔習得${TIER_N[SKILLS[id].tier]}${TYPE_N[SKILLS[id].type]}：${SKILLS[id].n}${on ? '・已裝備' : '・可在人物頁裝備'}〕`;
}
function xp(id, n) {
  const sk = id && S.skills[id], k = SKILLS[id];
  if (!sk || sk.lv >= 10) return '';
  sk.exp += Math.round(n);
  let up = 0;
  while (sk.lv < 10 && sk.exp >= xpNeed(sk.lv, k.tier)) { sk.exp -= xpNeed(sk.lv, k.tier); sk.lv++; up++; if (k.evil) S.moral = clamp(S.moral - 3, -100, 100); }
  if (sk.lv >= 10) sk.exp = 0;
  if (up && S.eq.includes(id)) recalc();
  return up ? `〔${k.n} 突破至第${cnNum(sk.lv)}層〕` : '';
}
// 只有裝備中的武功會在實戰中長進
function battleXp(n) {
  const out = [];
  for (const id of S.eq) { const t = xp(id, SKILLS[id].type === 'nei' ? n * 0.6 : n); if (t) out.push(t); }
  return out.join('');
}

/* ---------- 時間推進 ---------- */
function advance(days) {
  for (let i = 0; i < days; i++) {
    const d = S.date;
    d.d++;
    if (d.d > 30) { d.d = 1; d.m++; if (d.m > 12) { d.m = 1; d.y++; onYear(); } onMonth(); }
    // 節慶記下當天的日子；若主角當時在路上或閉關，事後不再補演
    if (d.m === 1 && d.d === 15) Q.push(Object.assign({ due: today() }, FIXED.lantern));
    if (d.m === 7 && d.d === 7) Q.push(Object.assign({ due: today() }, FIXED.qixi));
    if (d.m === 9 && d.d === 1) Q.push(Object.assign({ due: today() }, FIXED.tourney));
    histTick();
  }
}
function onMonth() {
  const { y, m } = S.date;
  if (S.spouse && !S.child && S.flags.wedY && y > S.flags.wedY && m === 4 && chance(60)) Q.push(FIXED.child);
  if (S.disciple && !S.disciple.done && y >= S.disciple.y + 4 && m === 8) Q.push(FIXED.discipleDone);
}
function onYear() {
  log(`爆竹聲中又是一年。${S.name}今年${cnNum(age())}歲了。`);
  if (age() >= 60 && chance((age() - 58) * 6)) Q.push(FIXED.oldAge);
}

/* ---------- 事件流程 ---------- */
function rollEvent(ctx) {
  const L = LOCS[S.loc];
  const pool = EVENTS.filter(e =>
    (!e.ctx || e.ctx.includes(ctx)) && (!e.loc || e.loc === S.loc) &&
    !(e.once && S.done[e.id]) && e.id !== S.flags.lastEv && !(S.flags.evLast && S.flags.evLast[e.id] != null && today() - S.flags.evLast[e.id] < (e.type === '戀愛' ? 360 : 150)) && (!e.cond || e.cond(S, L)));
  pool.push(...chainCandidates(ctx));
  let tot = 0;
  const ws = pool.map(e => { const w = (e.w || 10) * (e.type === '奇遇' || e.type === '傳承' ? 1 + S.stats.luck / 15 : 1); tot += w; return w; });
  let r = Math.random() * tot;
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i].chain ? chainStep(pool[i].chain) : pool[i]; }
  return null;
}
function pump(autoContinue = false) {
  if (S.life <= 0 && UI.screen === 'game' && !(UI.ov && UI.ov.k === 'battle')) { UI.ov = null; return retire('戰死'); }
  if (UI.ov && UI.ov.k !== 'menu') { render(); return; }
  if (Q.length) { UI.ov = null; showEvent(Q.shift()); return; }
  const h = lineDue() || histDue();
  if (h) { UI.ov = null; save(); showEvent(h); return; }
  if (S.pts > 0) { UI.ov = { k: 'lvup', add: {} }; save(); render(); return; }
  save();
  if (autoContinue && UI.screen === 'game') {
    // 封印後不再無限推進月份，改以傳承事件完結這一世。
    if (ad() > SEAL_YEAR) {
      UI.ov = null;
      return showEvent({
        type: '傳承', title: '江湖歲月終章',
        text: '這段江湖歲月已到了終章。許多英雄往事留在紙上，你也可以將自己的故事交予後人。',
        choices: [{ plain: true, s: 'n', t: '封劍歸隱，將故事傳給後人',
          go: () => ({ end: '歸隱' }) }]
      });
    }
    // 不返回舊首頁，也不顯示額外的三個遊歷方向選項。
    return adventureMonth();
  }
  render();
}
function continueStory() {
  if (!S || UI.screen !== 'game') return;
  UI.tab = 'world';
  UI.ov = null;
  return pump(true);
}
/* 每個事件固定三個選項：正派行動、反派行動、無視或拒絕 */
const SIDE_LABEL = { g: '正派', e: '反派', n: '無視' };
function sides(list) {
  if (list.some(x => x.plain)) return list;          // 不分正邪的選項（如回城）全部保留
  const out = [];
  for (const k of ['g', 'e', 'n']) {
    const c = list.find(x => x.s === k);
    if (c) out.push(c);
    else if (k === 'n') out.push({ s: 'n', t: '不予理會', go: () => '你沒有理會，這件事就此揭過。' });
  }
  return out;
}
/* ---------- 同一事件的逐段閱讀紀錄（僅存在 UI 暫存，不更動存檔格式） ---------- */
function storyBegin(text) {
  UI.story = { lines: [], revealed: 0, chars: 0 };
  storyAppend('prose', text);
}
function storyAppend(kind, text) {
  if (!UI.story) UI.story = { lines: [], revealed: 0, chars: 0 };
  if (text == null || text === '') return;
  UI.story.lines.push({ kind, text: String(text) });
  UI.story.chars = 0;
}
function showEvent(ev) {
  if (ev.due != null && today() - ev.due > 5) return pump(true);
  if (ev.cond && ev.fixed && !ev.cond(S)) return pump(true);
  UI.tab = 'world';
  if (ev.id) { S.done[ev.id] = (S.done[ev.id] || 0) + 1; S.flags.lastEv = ev.id; (S.flags.evLast = S.flags.evLast || {})[ev.id] = today(); }
  const pages = ev.pages ? (typeof ev.pages === 'function' ? ev.pages(S) : ev.pages) : null;
  const text = pages ? pages[0] : typeof ev.text === 'function' ? ev.text(S) : ev.text;
  const raw = typeof ev.choices === 'function' ? ev.choices(S) : ev.choices || [];
  const choices = sides(raw).map(c => { const qi = c.qi != null ? c.qi : autoQi(c); return Object.assign({}, c, { qi, t: c.t + (qi ? `〔耗內力${qi}〕` : ''), dis: !!((c.req && !c.req(S)) || (c.cond && !c.cond(S)) || (qi && S.qi < qi)), reqT: c.reqT || (qi && S.qi < qi ? '內力不足' : '') }); });
  if (choices.length && choices.every(c => c.dis)) { const k = choices.find(c => c.s === 'n') || choices[choices.length - 1]; k.dis = false; k.qi = 0; k.t = k.t.replace(/〔耗內力\d+〕/, ''); }
  UI.ov = { k: 'event', type: ev.type, title: ev.title, art: ev.art, text, choices, pages, pi: 0, result: null, who: typeof ev.who === 'function' ? ev.who(S) : ev.who, big: ['歷史', '傳承', '奇遇', '奇緣'].includes(ev.type) };
  storyBegin(text);
  log(`【${ev.type}】${ev.title}`);
  render();
  window.scrollTo(0, 0);
}
function choose(i) {
  const o = UI.ov, c = o.choices[i];
  if (!c || c.dis) return;
  if (c.qi) S.qi = Math.max(0, S.qi - c.qi);
  S.moral = clamp(S.moral + (c.s === 'g' ? 1 : c.s === 'e' ? -2 : 0), -100, 100);
  // 將玩家的選擇留在故事裡；結果會接在這一行之後。
  storyAppend('choice', c.t);
  const r = c.go ? c.go(S) : '';
  o.side = c.s;
  if (r && typeof r === 'object') return handleResult(r);
  handleResult((r || '') + gainExp((c.s === 'n' ? 4 : 10) * (o.big ? 1.6 : 1)));
}
function handleResult(r) {
  if (r && typeof r === 'object' && r.shop) return openShop();
  if (r && typeof r === 'object' && r.battle) return startBattle(r);
  if (r && typeof r === 'object' && r.end) return retire(r.end);
  const ov = UI.ov && UI.ov.k === 'event' ? UI.ov : (UI.ov = { k: 'event', type: '江湖', title: '', text: '' });
  ov.result = (r || '此事就此揭過。') + takePend();
  ov.choices = [];
  storyAppend('result', ov.result);
  render();
  // 不回捲到故事開頭，保留閱讀脈絡，將新結果移到可見範圍。
}
function closeEvent() { UI.ov = null; pump(true); }
/* 升級配點 */
function lvAdd(k) { const o = UI.ov, used = Object.values(o.add).reduce((a, b) => a + b, 0); if (used >= S.pts || S.base[k] + (o.add[k] || 0) >= 30) return; o.add[k] = (o.add[k] || 0) + 1; render(); }
function lvReset() { UI.ov.add = {}; render(); }
function lvOk() {
  const o = UI.ov;
  for (const k in o.add) { S.base[k] += o.add[k]; S.pts -= o.add[k]; }
  recalc();
  UI.ov = null; pump(true);
}

/* ---------- 戰鬥 ---------- */
// 敵人戰力：fix 是敵人本身的底子，mult 是隨主角成長的比例。氣血與攻擊隨戰力加速成長，免得主角後期一路碾壓
const FOE_K = { pm: 1.12, hp: 26, hpE: 1.18, atk: 2.1, atkE: 1.08, fixK: 0.8 };
function foe(n, fix, mult, style, extra) {
  const P = Math.max(1, fix * FOE_K.fixK + power() * mult * FOE_K.pm);
  const hp = Math.round(30 + FOE_K.hp * Math.pow(P, FOE_K.hpE));
  return Object.assign({ n, P, hp, mhp: hp, atk: 5 + FOE_K.atk * Math.pow(P, FOE_K.atkE), def: P * 0.6, agi: 3 + P * 0.6, moves: FOE_MOVES[style], style }, extra || {});
}
/* 猜拳式對決：每回合雙方各排六手。攻克破、破克守、守克攻；同招各傷一半；絕招無視克制。
   敵人各有慣用套路，交手越多、悟性越高，能預先看穿的手數越多。 */
const ST = { A: '攻', B: '破', G: '守', X: '絕' };
const DMG_K = 0.7;
// 開戰效果：暗器先發、獅子吼震暈
function battleOpen(b) {
  for (const id of S.eq) {
    const f = artFx(id), k = SKILLS[id];
    if (f.opener && k.moves) b.log.push('【先發】' + hitFoe(b, k.moves[0][0], k, S.skills[id].lv, k.moves[0][3], 0.6 * f.opener));
    if (f.stunOpen) { b.fx.stun = 1; b.log.push(`【${k.n}】你一聲長嘯，${b.e.n}心神大亂，第一手使不出來。`); }
  }
  const go = gearFx('opener');
  if (go && S.off) b.log.push('【先發】' + hitFoe(b, ITEMS[S.off].n, { type: 'dart', attr: 'he', tier: 1 }, 1, 12, 0.6 * go));
  if (b.e.hp <= 0) { b.e.hp = 1; }
}
const BARE = { n: '空手', type: 'fist', tier: 1, attr: 'he', moves: [['空手拳腳', 1, 0, 6]] };
const atkArts = () => S.eq.filter(id => artRole(id) === 'atk' && SKILLS[id].moves);
function basicMove() {
  let best = null;
  for (const id of atkArts()) {
    const k = SKILLS[id], lv = S.skills[id].lv, m = k.moves[0], pw = m[3] * (1 + 0.15 * (lv - 1));
    if (!best || pw > best.pw) best = { id, k, lv, pow: m[3], pw, n: m[0] };
  }
  return best || { id: null, k: BARE, lv: 1, pow: 6, pw: 6, n: '空手拳腳' };
}
function pMoves() {   // 絕招：備戰外功中第一式以外、已解鎖的招式
  const out = [];
  for (const id of atkArts()) {
    const k = SKILLS[id], lv = S.skills[id].lv;
    k.moves.forEach((m, i) => { if (i > 0 && lv >= m[1]) out.push({ id, n: m[0], mp: m[2], pow: m[3], fx: m[4], k, lv }); });
  }
  return out;
}
function attrMul(a) {
  if (!S.nei) return 1;
  const na = SKILLS[S.nei].attr;
  if (na === 'he') return 1.1;
  if (a === 'he') return 1.05;
  return na === a ? 1.22 : 0.9;
}
function bLog(s) { const b = UI.ov; b.log.push(s); if (b.log.length > 80) b.log.shift(); }
// 我方命中：回傳描述
function hitFoe(b, label, k, lv, pow, mul, fx) {
  const e = b.e;
  if (chance(clamp((e.agi - S.stats.agi) * 1.5, 0, 20))) return `你的「${label}」被${e.n}閃開。`;
  const w = weaponAtk(k.type), res = resOf(e, k.type), wi = S.weapon && ITEMS[S.weapon];
  const bare = !S.weapon && k.type === 'fist' ? 1 + gearFx('bare') : 1;
  let dmg = (S.stats.str * 1.2 + pow * (1 + 0.15 * (lv - 1)) + w) * neiFactor() * attrMul(k.attr) * (1 + gearAttrUp(k.attr)) * bare * res * rnd(0.9, 1.1) * mul * DMG_K * (activeCombo() ? activeCombo().mul : 1) * (b.esc || 1) * (1 + ((b.buff && b.buff.atk) || 0));
  const crit = chance(S.stats.luck * 1.3 + fxSum('crit'));
  if (crit) dmg *= 1.6;
  const heavy = wi && wi.wt === k.type && wi.fx && wi.fx.pierce ? 0.7 : 1;
  dmg = Math.max(1, Math.round(dmg - (fx === 'pierce' ? 0 : e.def * 0.25 * heavy)));
  e.hp -= dmg;
  let s = `你的「${label}」${crit ? '正中要害，' : ''}${res > 1 ? '正克其短，' : res < 1 ? '被對方所抗，' : ''}造成 ${dmg} 點傷害。`;
  if (!fx && gearFx('bleed') && chance(gearFx('bleed'))) fx = 'bleed';
  if (fx === 'bleed') { b.fx.bleed = 2; b.fx.bleedV = Math.max(2, Math.round(dmg * 0.4)); s += '對方血流不止。'; }
  if (fx === 'poison') { b.fx.poison = 3; b.fx.poisonV = 6 + lv * 2 + k.tier * 4; s += '毒性滲入經脈。'; }
  if (fx === 'stun' && chance(45)) { b.fx.stun = 1; s += '對方被震得頭暈目眩，下一手使不出來。'; }
  if (fx === 'weak') { b.fx.weak = 2; s += '對方攻勢被你帶偏。'; }
  if (fx === 'drain') { const hl = Math.round(dmg * 0.35); S.hp = Math.min(maxHp(), S.hp + hl); s += `你吸取了 ${hl} 點氣血。`; }
  return s;
}
function hitMe(b, label, mult, mul = 1) {
  const e = b.e;
  if (chance(clamp((pDodge() - e.agi) * 1.2 + 4, 0, 30))) return `${e.n}的「${label}」被你閃身避過。`;
  if (gearFx('block') && chance(gearFx('block'))) return `你舉臂格擋，${e.n}的「${label}」沒能打中你。`;
  const red = (1 - Math.min(0.5, fxSum('dmgRed') + fxSum('guard') * 0.15 + ((b.buff && b.buff.red) || 0))) * (1 - fxSum('foeWeak'));
  const dmg = Math.max(1, Math.round((e.atk * mult * (b.fx.weak ? 0.75 : 1) * rnd(0.88, 1.12) * DMG_K - pDef() * 0.25) * mul * red * (b.esc || 1)));
  S.hp -= dmg;
  const th = gearFx('thorns');
  if (th && BARE_FOE.includes(e.style)) { const r = Math.max(1, Math.round(dmg * th)); e.hp -= r; return `${e.n}的「${label}」打中你，受到 ${dmg} 點傷害；甲上倒刺反傷對方 ${r} 點。`; }
  const rf = fxSum('reflect');
  if (rf) { const r = Math.max(1, Math.round(dmg * rf)); e.hp -= r; return `${e.n}的「${label}」打中你，受到 ${dmg} 點傷害；你挪移卸勁，反震 ${r} 點。`; }
  return `${e.n}的「${label}」打中你，受到 ${dmg} 點傷害。`;
}
/* ---------- 全自動戰鬥 ----------
   開打前先擲 d20 決定這一戰的戰力：10 點＝100% 戰力，點數每升降 1 點，戰力就升降 10%（戰力＝點數÷10）；擲出 20 無敵，對手傷不了你。
   之後雙方自動對打，主角會偶爾使出絕招（耗內力），一直打到一方血量歸零。 */
let battleTimer = 0;
function startBattle(r) {
  const prev = UI.ov || {};
  clearTimeout(battleTimer);
  S.flags.sinceFight = 0; PEND = [];
  UI.ov = {
    k: 'battle', type: '戰鬥', who: prev.who, art: prev.art, title: r.title || prev.title || '狹路相逢', e: r.battle, win: r.win, lose: r.lose, noFlee: r.noFlee,
    log: [r.intro || `${r.battle.n}擺開架勢，殺氣逼人。`], fx: { bleed: 0, bleedV: 0, poison: 0, poisonV: 0, stun: 0, weak: 0 },
    tick: 0, over: null, phase: 'roll', roll: null, mult: 1, take: 1, god: false, speed: 1, esc: 1, pop: null,
  };
  const K = maxMp() / Math.max(1, qiMax());           // 一顆氣團＝K 點戰鬥內力
  UI.ov.K = K; S.hp = maxHp(); S.mp = Math.round(S.qi * K);   // 每場新戰鬥開始都是滿血，不受上一戰影響
  battleOpen(UI.ov);
  render();
}
let ROLL_SEQ = 0;
// 擲骰：玩家親手擲，或跳過以 10 計（100% 戰力）
function rollBattle(skip) {
  const b = UI.ov;
  if (!b || b.k !== 'battle' || b.phase !== 'roll') return;
  const roll = skip ? 10 : ri(1, 20);
  b.roll = roll; b.god = roll === 20;
  b.seq = ++ROLL_SEQ;                                         // 每次擲骰的序號，讓 3D 骰子知道要重新投擲
  b.mult = roll / 10 * (1 + 0.03 * fxSum('eye'));            // 10 點＝100% 戰力
  b.take = b.god ? 0 : clamp(2 - roll / 10, 0.2, 1.9);        // 點數低時，挨打也更重
  bLog(b.god ? `擲出 20！氣勢如虹，無敵！` : `擲出 ${roll}，戰力 ${Math.round(b.mult * 100)}%。`);
  b.phase = skip ? 'fight' : 'rolling';
  render();
  clearTimeout(battleTimer);
  battleTimer = setTimeout(() => { if (UI.ov === b && b.phase === 'rolling') { b.phase = 'fight'; render(); battleTimer = setTimeout(battleTick, 600 / b.speed); } else if (UI.ov === b && b.phase === 'fight') battleTick(); }, skip ? 350 : 1100);
}
function battleSpeed() { const b = UI.ov; if (!b || b.k !== 'battle') return; b.speed = b.speed === 1 ? 2 : 1; render(); }
// 勝算：雙方各自預期損失的血量比例
function advPct(b) {
  if (b.god) return 99.9;
  const e = b.e, bm = basicMove(), dm = b.roll ? b.mult : 1, tk = b.roll ? b.take : 1;
  const my = Math.max(1, ((S.stats.str * 1.2 + bm.pw + weaponAtk(bm.k.type)) * neiFactor() * resOf(e, bm.k.type) * DMG_K - e.def * 0.25) * (1 + S.stats.luck * 0.006) * (1 + ((b.buff && b.buff.atk) || 0)));
  const op = Math.max(1, (e.atk * 1.15 * DMG_K * (1 - fxSum('foeWeak')) - pDef() * 0.25) * (1 - Math.min(0.5, fxSum('dmgRed') + fxSum('guard') * 0.15 + ((b.buff && b.buff.red) || 0))));
  const pe = my * dm / Math.max(1, e.hp), pp = op * tk / Math.max(1, S.hp);
  return clamp(Math.round(pe / (pe + pp) * 1000) / 10, 0.1, 99.9);
}
// 一步：雙方各出一招
function battleStep(b) {
  const e = b.e;
  b.tick++;
  b.esc = b.tick > 16 ? 1 + 0.15 * (b.tick - 16) : 1;      // 拖太久，傷害逐步加重，一定分出生死
  const eh0 = e.hp, hp0 = S.hp, bm = basicMove();
  let line = '';
  const sp = pMoves().filter(m => m.mp <= S.mp);
  if (sp.length && b.tick % 3 === 0) { const m = pick(sp); S.mp -= m.mp; line += '【絕招】' + hitFoe(b, m.n, m.k, m.lv, m.pow, b.mult, m.fx); }
  else line += hitFoe(b, bm.n, bm.k, bm.lv, bm.pow, b.mult);
  if (e.hp > 0) {
    if (b.fx.stun > 0) { b.fx.stun--; line += `${e.n}被震得頭暈目眩，這一手使不出來。`; }
    else {
      const mv = chance(14) ? e.moves[e.moves.length - 1] : (e.moves.length > 1 && chance(45) ? e.moves[1] : e.moves[0]);
      line += b.god ? `${e.n}的「${mv[0]}」被你的氣勁擋下，傷不了你分毫。` : hitMe(b, mv[0], mv[1], b.take);
    }
  }
  if (e.hp > 0 && b.fx.bleed > 0) { b.fx.bleed--; e.hp -= b.fx.bleedV; line += `${e.n}失血 ${b.fx.bleedV}。`; }
  if (e.hp > 0 && b.fx.poison > 0) { b.fx.poison--; e.hp -= b.fx.poisonV; line += `${e.n}毒發 ${b.fx.poisonV}。`; }
  if (b.fx.weak > 0) b.fx.weak--;
  const rg = fxSum('regen'), mr = fxSum('mpr');
  if (b.tick % 2 === 0 && S.hp > 0 && (rg || mr)) { const hv = Math.round(maxHp() * rg); S.hp = Math.min(maxHp(), S.hp + hv); S.mp = Math.min(maxMp(), S.mp + mr); line += `你運轉內功${hv ? `，回復 ${hv} 氣血` : ''}。`; }
  b.pop = { toE: Math.max(0, eh0 - e.hp), toP: Math.max(0, hp0 - S.hp) };
  bLog(line);
  if (e.hp <= 0) { e.hp = 0; b.over = 'win'; bLog(`${e.n}倒下了。你贏了。`); }
  else if (S.hp <= 0) { S.hp = 0; b.over = 'lose'; bLog('你眼前一黑，栽倒在地……'); }
  else if (b.tick >= 70) { b.over = e.hp / e.mhp > S.hp / maxHp() ? 'win' : 'lose'; }   // 保險：理論上不會走到這裡
  if (b.over) b.phase = 'done';
}
function battleTick() {
  const b = UI.ov;
  if (!b || b.k !== 'battle' || b.over || b.phase !== 'fight') return;
  battleStep(b);
  render();
  if (!b.over) battleTimer = setTimeout(battleTick, 850 / b.speed);
}
// 投降：當場認輸，不再挨打
function pSurrender() {
  const b = UI.ov; if (b.over) return;
  clearTimeout(battleTimer); b.phase = 'done';
  b.over = 'lose'; b.surr = true; S.hp = Math.max(1, S.hp);
  bLog('你收招後退，拱手認輸。');
  render();
}
function defeat() {
  const lost = Math.round(S.silver * 0.2);
  S.silver -= lost;
  advance(15);
  return `你身受重傷，被好心人抬去醫治，躺了半個月才能下床。〔銀兩-${lost}　耗時十五日〕`;
}
function endBattle() {
  const b = UI.ov; clearTimeout(battleTimer);
  S.qi = clamp(Math.ceil(S.mp / (b.K || 1) - 1e-6), 0, qiMax());
  S.seen = S.seen || {}; S.seen[b.e.n] = (S.seen[b.e.n] || 0) + 1;
  let r;
  if (b.over === 'win') {
    S.wins++;
    const x = battleXp(20 + b.e.P * 6) + gainExp(12 + b.e.P * 3);
    r = b.win ? b.win(S) : `你擊敗了${b.e.n}。`;
    if (r && typeof r === 'object') { if (r.battle && !r.title) r.title = b.title; return handleResult(r); }
    r += x;
    if (chance(14)) { const d = pick(['jinchuang', 'huiqi', 'huoxue', 'tiegu', 'menghan', 'duyan']); r += `\n\n你在${b.e.n}身上摸出一份${ITEMS[d].n}。` + addItem(d); }
  } else if (b.over === 'lose') {
    S.losses++; hurtQ();
    r = b.lose ? b.lose(S) : defeat();
    if (r && typeof r === 'object') return handleResult(r);
    r = (b.surr ? '你認輸了。' : '') + r + gainExp(6 + b.e.P);
  } else r = '你且戰且退，總算甩開了對手。';
  const outcome = r + takePend();
  storyAppend('result', outcome);
  UI.ov = { k: 'event', type: '戰鬥', title: b.title, text: '', choices: [], result: outcome, who: b.who };
  render();
}

/* ---------- 物品 ---------- */
const healer = () => fxSum('heal') > 0;
function useMed(id) {
  const it = ITEMS[id];
  addItem(id, -1);
  if (!(UI.ov && UI.ov.k === 'battle')) {            // 平時：回復的是命與氣團
    const t = (it.life ? heal(it.life) : '') + (it.qi ? gainQi(it.qi) : '');
    return t;
  }
  if (it.hp) S.hp = Math.min(maxHp(), S.hp + Math.round(it.hp * (healer() && it.hp < 999 ? 1.5 : 1)));
  if (it.mp) S.mp = Math.min(maxMp(), S.mp + it.mp);
}
// 戰鬥中用藥：在戰鬥的畫面上直接服用，回復的是本場的鬥氣與內力；戰前藥只管這一場
const BATTLE_ITEM = id => ITEMS[id] && (ITEMS[id].kind === 'med' || ITEMS[id].kind === 'buff');
// 目前這件道具在這場戰鬥裡派不派得上用場（滿血、已生效的都不必再用）
function battleUsable(b, id) {
  const it = ITEMS[id];
  if (!b || b.over || b.phase !== 'fight' || !has(id)) return false;
  if (it.kind === 'med') return !((!it.hp || S.hp >= maxHp()) && (!it.mp || S.mp >= maxMp()));
  if (it.buff) return !Object.keys(it.buff).some(k => b.buff && b.buff[k]);
  if (it.act === 'stun') return !(b.fx.stun > 0);
  if (it.act === 'poison') return !(b.fx.poison > 0);
  return false;
}
function battleUse(id) {
  const b = UI.ov;
  if (!b || b.k !== 'battle' || !BATTLE_ITEM(id) || !battleUsable(b, id)) return;
  const it = ITEMS[id];
  let msg;
  if (it.kind === 'med') {
    const hp0 = S.hp, mp0 = S.mp;
    useMed(id);
    msg = `你趁空檔服下${it.n}。` + [it.hp ? `氣血+${Math.max(0, S.hp - hp0)}` : '', it.mp ? `內力+${Math.max(0, S.mp - mp0)}` : ''].filter(Boolean).join('　');
  } else if (it.buff) {
    addItem(id, -1); b.buff = Object.assign(b.buff || {}, it.buff);
    msg = `你服下${it.n}。${it.use}`;
  } else if (it.act === 'stun') {
    addItem(id, -1);
    if (chance(70)) { b.fx.stun = 1; msg = `你彈出一撮${it.n}，${b.e.n}吸入少許，腳下一軟，下一手使不出來。`; }
    else msg = `你彈出一撮${it.n}，可${b.e.n}屏住了氣，沒中招。`;
  } else {
    addItem(id, -1); b.fx.poison = 3; b.fx.poisonV = Math.max(6, Math.round(b.e.mhp * 0.04));
    msg = `你把${it.n}彈進${b.e.n}的口中，毒性隨即發作。`;
  }
  bLog(msg);
  save(); render();
}
function useItem(id) {
  const it = ITEMS[id];
  if (it.kind === 'med') {
    if (!(S.life < lifeMax() && it.life) && !(S.qi < qiMax() && it.qi)) return toast('氣血與內力都是滿的，用不著');
    toast(`服下${it.n}` + useMed(id));
  }
  else if (it.kind === 'tonic') { addItem(id, -1); toast(`服下${it.n}` + gain(it.gain || { con: 1, bonusLife: 1 })); }
  else if (it.kind === 'page') {
    if (id === 'neijing' && !S.nei) return toast('你還沒有內功可以研讀');
    addItem(id, -1);
    toast(`你把${it.n}反覆研讀了幾遍。` + (id === 'neijing' ? xp(S.nei, 400) : battleXp(150)) + '〔武學領悟加深〕');
  }
  else if (GEAR_KIND[it.kind]) { toast(equipGear(id)); }
  else if (it.kind === 'manual') {
    if (knows(it.skill)) return toast('這門功夫你已經會了');
    addItem(id, -1); toast(learn(it.skill));
  }
  save(); render();
}
let toastMsg = '';
function toast(s) { toastMsg = s; }

/* ---------- 移動 ---------- */
function travelDays(to) {
  const a = LOCS[S.loc] || LOCS.linan, b = LOCS[to];
  const d = Math.hypot(a.x - b.x, a.y - b.y) / 4;
  return Math.max(2, Math.round(d * (S.eq.includes('q_shadow') ? 0.7 : 1)));
}
function toastRender(s) { toast(s); render(); }

/* 故事推進由 continueStory() / closeEvent() 自動接入下一個事件。 */

/* ---------- 門派（由事件觸發） ---------- */
function joinSectNow(id) {
  const k = SECTS[id];
  S.sect = id; S.rank = 0; S.contrib = 0; S.contribTotal = 0;
  let t = `你在${k.master}面前三跪九叩，正式拜入${k.n}，成為外門弟子。`;
  if (k.align < 0) t += gain({ moral: -25 }) + '俠義道中人從此看不起你。';
  return t + learn(k.teach[0][0]);
}
const leaveSilently = () => { S.sect = null; S.rank = 0; S.contrib = 0; S.contribTotal = 0; };
function leaveSect() {
  const k = SECTS[S.sect];
  UI.ov = null;
  log(`你留書一封，叛出${k.n}。從此江湖路遠，師門不再是歸處。` + gain({ fame: -40 }));
  S.sect = null; S.rank = 0; S.contrib = 0; S.contribTotal = 0;
  save(); render();
}
// 下一門可學的本門武功
const sectNext = () => S.sect ? SECTS[S.sect].teach.find(t => !knows(t[0]) && S.rank >= t[1] && !(t[3] && ad() < t[3])) : null;
const canPromote = () => S.sect && S.rank < 3 && S.contribTotal >= RANK_NEED[S.rank + 1];

/* ---------- 情緣（由事件觸發） ---------- */
function npc(id) { return S.npcs[id] || (S.npcs[id] = { met: false, fav: 0, stage: 0 }); }
const STAGE_TH = [20, 50, 80];
const stageReady = id => { const n = npc(id); return n.stage < 3 && n.fav >= STAGE_TH[n.stage] && !(n.stage === 2 && S.flags.lover && S.flags.lover !== id); };
function favUp(id, v) { const n = npc(id); n.fav = clamp(n.fav + v, 0, 100); return `〔${NPCS[id].n} 好感${v >= 0 ? '+' : ''}${v}〕`; }

/* ---------- 歸隱與傳承 ---------- */
function retire(reason) {
  const best = Object.keys(S.skills).sort((a, b) => S.skills[b].lv * SKILLS[b].tier - S.skills[a].lv * SKILLS[a].tier);
  const sn = histCount('seen');
  let score = S.fame + S.wins * 3 + power() * 8 + (S.spouse ? 80 : 0) + sn * 60;
  let end;
  if (reason === '戰死') end = ['客死江湖', `你倒在了江湖路上，${S.fame >= 300 ? '身後留下的名字，說書人還會講上一陣子。' : '沒有人記得是誰。只有路邊一座小小的土堆。'}`];
  else if (sn >= 8) end = ['江湖見證者', `你這一生親眼看過${cnNum(sn)}件後來被寫進傳說的事。晚年你常坐在茶樓角落，聽說書人講那些故事，偶爾小聲糾正一兩句：「不對，那天下著雪。」`];
  else if (sn >= 4 && S.fame >= 300) end = ['亂世遊俠', `你在那個英雄輩出的年代裡走過一遭，親眼見過${cnNum(sn)}次風雲際會，自己也闖出了一點名堂。`];
  else if (S.fame >= 800) end = [S.moral <= -40 ? '一代梟雄' : '一代大俠', '你的事蹟被說書人編成了段子，在酒樓茶肆裡一講就是幾十年。'];
  else if (S.spouse && S.fame < 300) end = ['神仙眷侶', `你與${NPCS[S.spouse].n}歸隱山林，種花釀酒。江湖上沒有你們的傳說，你們也不在乎。`];
  else if (S.fame >= 300) end = ['江湖名宿', '你算不上天下第一，但走到哪裡，總有人願意敬你一杯酒。'];
  else end = ['江湖過客', '你在江湖裡走了一遭，沒留下什麼名字。可那些年的風雨和酒，你自己記得。'];
  UI = { screen: 'end', ov: null, end: { reason, title: end[0], text: end[1], score: Math.round(score), best: best.filter(id => SKILLS[id].tier >= 1).slice(0, 6), pick: best[0] } };
  wipeSave(); render();
}
function inherit() {
  const e = UI.end;
  const heir = S.child ? `${S.name}之子女` : S.disciple ? `${S.name}的弟子${S.disciple.n}` : null;
  const legacy = {
    gen: S.gen, from: S.name, blood: !!S.child, year: ad() + 1 > SEAL_YEAR ? ERAS[0].y : ad() + 1, reset: ad() + 1 > SEAL_YEAR,
    skill: e.pick && S.skills[e.pick] ? { id: e.pick, lv: Math.max(1, Math.ceil(S.skills[e.pick].lv * (heir ? 0.5 : 0.3))) } : null,
    silver: Math.round(S.silver * (heir ? 0.3 : 0.1)), weapon: heir ? S.weapon : null,
  };
  UI = { screen: 'create', ov: null, create: { name: '', gender: '男', origin: 0, stats: rollStats(), legacy, year: legacy.year } };
  render();
}
