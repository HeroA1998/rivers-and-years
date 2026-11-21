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
  const year = c.year || 1222, pool = originsFor(year);
  const o = typeof c.origin === 'number' ? pool[c.origin % pool.length] : pick(pool);   // 投胎由天
  const base = Object.assign({}, c.stats);
  for (const k in o.st) base[k] += o.st[k];
  S = {
    v: 4, name: c.name || '無名', gender: c.gender, origin: o.base, birth: o.n, gen: legacy ? legacy.gen + 1 : 1, age0: 0,
    y0: year, date: { y: 1, m: 1, d: 1 }, loc: o.loc, base, stats: Object.assign({}, base), bonus: {},
    lv: 1, exp: 0, pts: 0,
    hp: 1, mp: 1, bonusHp: 0, bonusMp: 0, silver: 120 + (o.silver || 0), fame: 0, moral: 0,
    sect: null, rank: 0, contrib: 0, contribTotal: 0,
    skills: { basic_fist: { lv: 1, exp: 0 }, tuna: { lv: 1, exp: 0 } }, nei: 'tuna', eq: ['basic_fist', 'tuna'],
    weapon: null, armor: null, acc: null, inv: { jinchuang: 2 },
    npcs: {}, spouse: null, child: null, disciple: null, rival: 0,
    done: {}, flags: {}, log: [], journal: [], seen: {}, hist: null, chain: {}, wins: 0, losses: 0, legacyFrom: null,
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
  S.hp = maxHp(); S.mp = maxMp();
  Q = [];
  histInit();
  // 開局先讓玩家知道下一件大事，免得頭幾個月無所適從
  const nx = histRumors(1000, true)[0];
  if (nx) S.flags.heardOf = { [nx.h.id]: 1 };
  const era = [...ERAS].reverse().find(x => x.y <= S.y0);
  log(`${reign(S.y0)}（${S.y0}年）。${S.name}，${o.n}，年方十六，${legacy ? `身上帶著${legacy.from}留下的遺澤，` : ''}在${LOCS[o.loc].n}踏上了江湖路。`);
  Q.push({ type: '身世', title: o.n, art: LOCS[o.loc].art, pages: () => o.open(S), choices: o.choices });
  if (era) log(era.d);
  UI = { screen: 'game', tab: 'world', ov: null };
  pump();
  window.scrollTo(0, 0);
}
// 舊存檔（v3 以前）轉成新制：能力值分成本身與加成，內功、身法也放進五格武功
function migrate(s) {
  if (s.v >= 4) return s;
  s.v = 4; s.base = Object.assign({}, s.stats); s.bonus = {}; s.lv = s.lv || 1; s.exp = s.exp || 0; s.pts = s.pts || 0; s.acc = s.acc || null;
  const eq = [s.nei, ...(s.eq || [])];
  const q = Object.keys(s.skills).filter(id => SKILLS[id].type === 'qing').sort((a, b) => s.skills[b].lv * SKILLS[b].dodge - s.skills[a].lv * SKILLS[a].dodge)[0];
  if (q) eq.push(q);
  s.eq = [...new Set(eq.filter(Boolean))].slice(0, EQ_MAX);
  return s;
}

/* ---------- 能力值：本身（初始天資、升級配點、故事）＋裝備加成（兵刃、護甲、飾品、武功） ---------- */
function equipBonus() {
  const b = {};
  const add = o => { for (const x in o || {}) b[x] = (b[x] || 0) + o[x]; };
  for (const id of S.eq) add(artSt(id));
  for (const sl of ['weapon', 'armor', 'acc']) if (S[sl] && ITEMS[S[sl]]) add(ITEMS[S[sl]].st);
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
}
const fxSum = key => S.eq.reduce((t, id) => t + (artFx(id)[key] || 0), 0);

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
const GAIN_N = { silver: '銀兩', fame: '聲望', moral: '俠義', hp: '氣血', mp: '內力', contrib: '門派貢獻', bonusHp: '氣血上限', bonusMp: '內力上限' };
function gain(o) {
  const out = [];
  let st = false;
  for (const k in o) {
    let v = o[k];
    if (!v) continue;
    if (k in STAT_N) { S.base[k] = clamp(S.base[k] + v, 1, 30); st = true; out.push(`${STAT_N[k]}${v > 0 ? '+' : ''}${v}`); continue; }
    if (k === 'contrib') { S.contrib = Math.max(0, S.contrib + v); if (v > 0) S.contribTotal += v; }
    else if (k === 'silver') { v = Math.max(v, -S.silver); S.silver += v; }
    else if (k === 'hp') S.hp = clamp(S.hp + v, 1, maxHp());
    else if (k === 'mp') S.mp = clamp(S.mp + v, 0, maxMp());
    else if (k === 'moral') S.moral = clamp(S.moral + v, -100, 100);
    else S[k] += v;
    if (k === 'fame') S.fame = Math.max(0, S.fame);
    if (v && Math.abs(v) < 900) out.push(`${GAIN_N[k]}${v > 0 ? '+' : ''}${Math.round(v)}`);
  }
  if (st) recalc();
  S.hp = Math.min(S.hp, maxHp()); S.mp = Math.min(S.mp, maxMp());
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
  if (up) { S.hp = maxHp(); S.mp = maxMp(); }
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
  S.hp = Math.min(maxHp(), Math.round(S.hp + days * maxHp() * 0.02));
  S.mp = Math.min(maxMp(), Math.round(S.mp + days * maxMp() * 0.06));
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
function pump() {
  if (UI.ov && UI.ov.k !== 'menu') { render(); return; }
  if (Q.length) { UI.ov = null; showEvent(Q.shift()); return; }
  const h = histDue();
  if (h) { UI.ov = null; save(); showEvent(h); return; }
  if (S.pts > 0) { UI.ov = { k: 'lvup', add: {} }; save(); render(); return; }
  save(); render();
}
/* 每個事件固定三個選項：正派行動、反派行動、無視或拒絕 */
const SIDE_LABEL = { g: '正派', e: '反派', n: '無視' };
function sides(list) {
  const out = [];
  for (const k of ['g', 'e', 'n']) {
    const c = list.find(x => x.s === k);
    if (c) out.push(c);
    else if (k === 'n') out.push({ s: 'n', t: '不予理會', go: () => '你沒有理會，這件事就此揭過。' });
  }
  return out;
}
function showEvent(ev) {
  if (ev.due != null && today() - ev.due > 5) return pump();
  if (ev.cond && ev.fixed && !ev.cond(S)) return pump();
  if (ev.id) { S.done[ev.id] = (S.done[ev.id] || 0) + 1; S.flags.lastEv = ev.id; (S.flags.evLast = S.flags.evLast || {})[ev.id] = today(); }
  const pages = ev.pages ? (typeof ev.pages === 'function' ? ev.pages(S) : ev.pages) : null;
  const text = pages ? pages[0] : typeof ev.text === 'function' ? ev.text(S) : ev.text;
  const raw = typeof ev.choices === 'function' ? ev.choices(S) : ev.choices || [];
  const choices = sides(raw).map(c => Object.assign({}, c, { dis: !!((c.req && !c.req(S)) || (c.cond && !c.cond(S))) }));
  UI.ov = { k: 'event', type: ev.type, title: ev.title, art: ev.art, text, choices, pages, pi: 0, result: null, who: typeof ev.who === 'function' ? ev.who(S) : ev.who, big: ['歷史', '傳承', '奇遇', '奇緣'].includes(ev.type) };
  log(`【${ev.type}】${ev.title}`);
  render();
}
function choose(i) {
  const o = UI.ov, c = o.choices[i];
  if (!c || c.dis) return;
  S.moral = clamp(S.moral + (c.s === 'g' ? 1 : c.s === 'e' ? -2 : 0), -100, 100);
  const r = c.go ? c.go(S) : '';
  o.side = c.s;
  if (r && typeof r === 'object') return handleResult(r);
  handleResult((r || '') + gainExp((c.s === 'n' ? 4 : 10) * (o.big ? 1.6 : 1)));
}
function handleResult(r) {
  if (r && typeof r === 'object' && r.battle) return startBattle(r);
  if (r && typeof r === 'object' && r.end) return retire(r.end);
  const ov = UI.ov && UI.ov.k === 'event' ? UI.ov : (UI.ov = { k: 'event', type: '江湖', title: '', text: '' });
  ov.result = r || '此事就此揭過。';
  ov.choices = [];
  render();
}
function closeEvent() { UI.ov = null; pump(); }
/* 升級配點 */
function lvAdd(k) { const o = UI.ov, used = Object.values(o.add).reduce((a, b) => a + b, 0); if (used >= S.pts || S.base[k] + (o.add[k] || 0) >= 30) return; o.add[k] = (o.add[k] || 0) + 1; render(); }
function lvReset() { UI.ov.add = {}; render(); }
function lvOk() {
  const o = UI.ov;
  for (const k in o.add) { S.base[k] += o.add[k]; S.pts -= o.add[k]; }
  recalc(); S.hp = maxHp(); S.mp = maxMp();
  UI.ov = null; pump();
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
const BEATS = { A: 'B', B: 'G', G: 'A' };
const DMG_K = 0.5;
const FOE_PATTERNS = {
  thug:   ['AABAAB', 'ABAABA', 'AAABAG', 'BAAAAB'],
  blade:  ['BABBAG', 'BBABAB', 'ABBGBA', 'BGBABX'],
  sword:  ['AGAABA', 'AAGABG', 'GAABAX', 'AGABAA'],
  beast:  ['AAABAA', 'ABAAAB', 'AABABA'],
  master: ['GABGAX', 'AGBXGA', 'BGAGBX', 'GBAAGB'],
  demon:  ['BBAXBA', 'ABXBAG', 'XBABBA', 'BABGXB'],
  puppet: ['ABGABG', 'BGABGA', 'GABGAB'],
};
// 看破：每回合擲 d20，加悟性調整與交手經驗；擲得越高，越能看穿對手的攻擊牌
function insightRoll(e, fixed) {
  const roll = fixed || ri(1, 20), mod = Math.floor((S.stats.int - 5) / 2) + Math.min(3, (S.seen || {})[e.n] || 0) + fxSum('eye'), total = roll + mod;
  // 擲 1 什麼都看不穿，擲 20 全部看穿；2～19 約每 3 點升一張，擲 10 看一半（3 張）
  // 擲 1 什麼都看不穿，擲 20 全部看穿；2～19 約每 3 點升一張，擲 10 看一半（3 張）
  // 擲 1 什麼都看不穿，擲 20 全部看穿；2～4 看 1 張，5～7 看 2 張，8～10 看 3 張（擲 10 看一半），11～14 看 4 張，15～19 看 5 張
  const reveal = roll === 1 ? 0 : roll === 20 ? 6 : total < 5 ? 1 : total < 8 ? 2 : total < 11 ? 3 : total < 15 ? 4 : 5;
  return { roll, mod, total, reveal };
}
function newRound(b) {
  let p = pick(FOE_PATTERNS[b.e.style] || FOE_PATTERNS.thug).split('');
  if (b.e.style !== 'puppet') p = p.map(c => c !== 'X' && chance(14) ? pick(['A', 'B', 'G']) : c);
  b.foe = p;
  b.ins = null; b.shown = p.map(() => false);
  b.plan = []; b.sub = null;
}
// 擲骰看破：玩家親手擲；跳過則以 10 計
function rollInsight(skip) {
  const b = UI.ov;
  if (!b || b.ins) return;
  b.ins = insightRoll(b.e, skip ? 10 : 0);
  b.ins.skip = !!skip;
  b.fresh = !skip;
  const idx = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, b.ins.reveal);
  b.shown = b.foe.map((_, i) => idx.includes(i));
  render();
}
// 勝算：一局六手打完，比較雙方損失氣血的比例，估算雙方各自預期損失多少
function advPct(b) {
  const e = b.e, bm = basicMove();
  const my = Math.max(1, ((S.stats.str * 1.2 + bm.pw + (S.weapon && ITEMS[S.weapon].wt === bm.k.type ? ITEMS[S.weapon].atk : 0)) * neiFactor() * DMG_K - e.def * 0.25) * (1 + S.stats.luck * 0.006));
  const op = Math.max(1, (e.atk * 1.2 * DMG_K * (1 - fxSum('foeWeak')) - pDef() * 0.25) * (1 - Math.min(0.5, fxSum('dmgRed'))));
  const pe = my / Math.max(1, e.hp), pp = op / Math.max(1, S.hp);
  return clamp(Math.round(pe / (pe + pp) * 1000) / 10, 1, 99);
}
function startBattle(r) {
  const prev = UI.ov || {};
  S.flags.sinceFight = 0;
  UI.ov = {
    k: 'battle', type: '戰鬥', who: prev.who, title: r.title || prev.title || '狹路相逢', e: r.battle, win: r.win, lose: r.lose, noFlee: r.noFlee,
    log: [r.intro || `${r.battle.n}擺開架勢，殺氣逼人。`], fx: { bleed: 0, bleedV: 0, poison: 0, poisonV: 0, stun: 0, weak: 0 }, round: 1, over: null, sub: null,
  };
  newRound(UI.ov);
  battleOpen(UI.ov);
  render();
}
// 開戰效果：暗器先發、獅子吼震暈
function battleOpen(b) {
  for (const id of S.eq) {
    const f = artFx(id), k = SKILLS[id];
    if (f.opener && k.moves) b.log.push('【先發】' + hitFoe(b, k.moves[0][0], k, S.skills[id].lv, k.moves[0][3], 0.6 * f.opener));
    if (f.stunOpen) { b.fx.stun = 1; b.log.push(`【${k.n}】你一聲長嘯，${b.e.n}心神大亂，第一手使不出來。`); }
  }
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
const planMp = b => b.plan.reduce((t, p) => t + (p.t === 'S' ? p.mv.mp : p.t === 'H' ? 12 : 0), 0);
function planAdd(p) {
  const b = UI.ov;
  if (b.over || b.plan.length >= 6) return;
  if (!b.ins) return toastRender('先擲骰子看破對手');
  const cost = p.t === 'S' ? p.mv.mp : p.t === 'H' ? 12 : 0;
  if (planMp(b) + cost > S.mp) return toastRender('內力不夠排這一手');
  if (p.t === 'I' && b.plan.filter(x => x.t === 'I' && x.item === p.item).length >= (S.inv[p.item] || 0)) return toastRender('這種丹藥不夠了');
  b.plan.push(p); b.sub = null; render();
}
function planUndo() { const b = UI.ov; b.plan.pop(); render(); }
function planFill() { const b = UI.ov; if (!b.ins) return toastRender('先擲骰子看破對手'); while (b.plan.length < 6) b.plan.push({ t: b.plan.length && b.plan[b.plan.length - 1].t.match(/[ABG]/) ? b.plan[b.plan.length - 1].t : 'A' }); render(); }

// 我方命中：回傳描述
function hitFoe(b, label, k, lv, pow, mul, fx) {
  const e = b.e;
  if (chance(clamp((e.agi - S.stats.agi) * 1.5, 0, 20))) return `你的「${label}」被${e.n}閃開。`;
  const w = S.weapon && ITEMS[S.weapon].wt === k.type ? ITEMS[S.weapon].atk : 0;
  let dmg = (S.stats.str * 1.2 + pow * (1 + 0.15 * (lv - 1)) + w) * neiFactor() * attrMul(k.attr) * rnd(0.9, 1.1) * mul * DMG_K * (activeCombo() ? activeCombo().mul : 1);
  const crit = chance(S.stats.luck * 1.3 + fxSum('crit'));
  if (crit) dmg *= 1.6;
  dmg = Math.max(1, Math.round(dmg - (fx === 'pierce' ? 0 : e.def * 0.25)));
  e.hp -= dmg;
  let s = `你的「${label}」${crit ? '正中要害，' : ''}造成 ${dmg} 點傷害。`;
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
  const red = (1 - Math.min(0.5, fxSum('dmgRed'))) * (1 - fxSum('foeWeak'));
  const dmg = Math.max(1, Math.round((e.atk * mult * (b.fx.weak ? 0.75 : 1) * rnd(0.88, 1.12) * DMG_K - pDef() * 0.25) * mul * red));
  S.hp -= dmg;
  const rf = fxSum('reflect');
  if (rf) { const r = Math.max(1, Math.round(dmg * rf)); e.hp -= r; return `${e.n}的「${label}」打中你，受到 ${dmg} 點傷害；你挪移卸勁，反震 ${r} 點。`; }
  return `${e.n}的「${label}」打中你，受到 ${dmg} 點傷害。`;
}
function commitRound() {
  const b = UI.ov, e = b.e;
  if (b.over || b.plan.length < 6) return;
  const m0 = e.moves[0], m1 = e.moves[1] || [m0[0], m0[1] * 1.3], mx = e.moves[e.moves.length - 1];
  const bm = basicMove();
  const pN = { A: `${bm.n}`, B: `重手・${bm.n}`, G: '守勢反擊' };
  const marks = [];
  let pc = 0, ec = 0;
  const slots = [], tail = [], start = { hp: S.hp, eh: e.hp, mp: S.mp };
  const tl = x => { tail.push(x); bLog('　' + x); };
  bLog(`—— 第${cnNum(b.round)}回合 ——`);
  for (let i = 0; i < 6 && !b.over; i++) {
    const p = b.plan[i], hp0 = S.hp, eh0 = e.hp, L = [];
    let f = b.foe[i], res, s;
    if (b.fx.stun) { b.fx.stun = 0; f = '-'; }
    const fHit = (mul = 1) => f === 'A' ? hitMe(b, m0[0], m0[1], mul) : f === 'B' ? hitMe(b, m1[0], m1[1], mul) : f === 'X' ? hitMe(b, mx[0], mx[1] * 1.25, mul) : '';
    if (p.t === 'S') {
      S.mp -= p.mv.mp;
      s = '【絕招】' + hitFoe(b, p.mv.n, p.mv.k, p.mv.lv, p.mv.pow, f === 'G' ? 0.7 : 1, p.mv.fx) + (f === 'G' ? '（被守勢卸去三成）' : '');
      if (f === 'X') s += fHit();
      res = f === 'X' ? 't' : 'w';
    } else if (p.t === 'I' || p.t === 'H') {
      if (p.t === 'I') { useMed(p.item); s = `你服下${ITEMS[p.item].n}。`; }
      else { S.mp -= 12; const hl = Math.round((maxHp() * 0.14 + neiLv() * 4) * (1 + fxSum('heal'))); S.hp = Math.min(maxHp(), S.hp + hl); s = `你運功調息，回復 ${hl} 點氣血。`; }
      s += fHit(); res = f === 'G' || f === '-' ? 't' : 'l';
    } else if (f === '-') {
      s = `${e.n}還在暈眩。` + (p.t === 'G' ? '你穩住了呼吸。' : hitFoe(b, pN[p.t], bm.k, bm.lv, bm.pow, p.t === 'A' ? 0.8 : 1.1));
      res = p.t === 'G' ? 't' : 'w';
    } else if (f === 'X') {
      s = '【敵方絕招】' + fHit(p.t === 'G' ? 0.5 : 1) + (p.t === 'G' ? '（守勢擋下一半）' : ''); res = 'l';
    } else if (p.t === f) {
      s = p.t === 'G' ? '雙方都採守勢，互相試探。' : `${ST[f]}對${ST[f]}，硬碰硬！` + hitFoe(b, pN[p.t], bm.k, bm.lv, bm.pow, (p.t === 'A' ? 0.8 : 1.1) * 0.5) + fHit(0.5);
      res = 't';
    } else if (BEATS[p.t] === f) {
      if (p.t === 'G') { S.mp = Math.min(maxMp(), S.mp + 4); s = `你架開${e.n}的「${m0[0]}」，順勢反擊！` + hitFoe(b, pN.G, bm.k, bm.lv, bm.pow, 0.55 * (1 + fxSum('guard'))); }
      else s = (p.t === 'A' ? `你搶在對方重手之前出招。` : `你一記重手破開對方守勢。`) + hitFoe(b, pN[p.t], bm.k, bm.lv, bm.pow, p.t === 'A' ? 0.8 : 1.1);
      res = 'w';
    } else {
      s = f === 'G' ? `${e.n}架開你的攻勢，反手一擊。` + hitMe(b, '反擊', m0[1] * 0.55) : (f === 'A' ? '你的重手還沒使老，已被搶了先機。' : '你的守勢被重手硬生生砸開。') + fHit();
      res = 'l';
    }
    L.push(s);
    marks.push(res === 'w' ? '○' : res === 'l' ? '×' : '△');
    if (res === 'w') { pc++; ec = 0; } else if (res === 'l') { ec++; pc = 0; } else { pc = 0; ec = 0; }
    if (pc === 3 && e.hp > 0) { pc = 0; L.push('連勝三手，追擊！' + hitFoe(b, `追擊・${bm.n}`, bm.k, bm.lv, bm.pow, 1.5)); }
    if (ec === 3 && S.hp > 0) { ec = 0; L.push('連失三手，被對方追擊！' + hitMe(b, m0[0], m0[1] * 1.5)); }
    if (e.hp <= 0) { e.hp = 0; b.over = 'win'; } else if (S.hp <= 0) { S.hp = 0; b.over = 'lose'; }
    slots.push({ res, f, lines: L, dE: eh0 - e.hp, dP: hp0 - S.hp, hpP: S.hp, hpE: e.hp, mpP: S.mp });
    L.forEach((x, n) => bLog((n ? '　' : '①②③④⑤⑥'[i] + ' ') + x));
  }
  bLog(`　敵方出招：${b.foe.map(c => ST[c]).join(' ')}　勝負：${marks.join(' ')}`);
  if (!b.over && b.fx.bleed) { b.fx.bleed--; e.hp -= b.fx.bleedV; tl(`${e.n}失血，損失 ${b.fx.bleedV} 點氣血。`); }
  if (!b.over && b.fx.poison) { b.fx.poison--; e.hp -= b.fx.poisonV; tl(`${e.n}毒發，損失 ${b.fx.poisonV} 點氣血。`); }
  if (!b.over && e.hp <= 0) { e.hp = 0; b.over = 'win'; }
  if (b.fx.weak) b.fx.weak--;
  const rg = fxSum('regen'), mr = fxSum('mpr');
  if (!b.over && S.hp > 0 && (rg || mr)) { const hv = Math.round(maxHp() * rg); S.hp = Math.min(maxHp(), S.hp + hv); S.mp = Math.min(maxMp(), S.mp + mr); tl(`你運轉內功，${hv ? `回復 ${hv} 點氣血` : ''}${hv && mr ? '、' : ''}${mr ? `${mr} 點內力` : ''}。`); }
  // 一局定勝負：六手打完還沒分出生死，就比誰剩下的氣血比例高；同樣多則看誰贏的手數多
  if (!b.over) {
    const pp = S.hp / maxHp(), ep = Math.max(0, e.hp) / e.mhp, wins = marks.filter(m => m === '○').length, loses = marks.filter(m => m === '×').length;
    const mine = Math.round(pp * 100), theirs = Math.round(ep * 100);
    b.over = pp > ep || (pp === ep && wins >= loses) ? 'win' : 'lose';
    if (b.over === 'win') tl(`六手已盡，雙方都還站著。你剩 ${mine}% 氣血，${e.n}只剩 ${theirs}%。這一局，你勝了。`);
    else { b.judged = true; tl(`六手已盡，雙方都還站著。你只剩 ${mine}% 氣血，${e.n}還有 ${theirs}%。這一局，你輸了。`); }
  } else
  if (b.over === 'win') tl(`${e.n}倒下了。你贏了。`);
  else if (b.over === 'lose') tl('你眼前一黑，栽倒在地……');
  // 進入揭牌：逐手亮出雙方的牌與勝負
  b.rv = { slots, tail, plan: b.plan.slice(), shown: b.shown.slice(), step: 0, start };
  render();
  clearTimeout(revealTimer); revealTimer = setTimeout(revealTick, 450);
}
let revealTimer = 0;
function revealTick() {
  const b = UI.ov;
  if (!b || b.k !== 'battle' || !b.rv || b.rv.step >= b.rv.slots.length) return;
  b.rv.step++; render();
  if (b.rv.step < b.rv.slots.length) revealTimer = setTimeout(revealTick, 950);
}
function revealSkip() { const b = UI.ov; clearTimeout(revealTimer); b.rv.step = b.rv.slots.length; b.rv.skipped = true; render(); }
function nextRound() {
  const b = UI.ov; clearTimeout(revealTimer); b.rv = null;
  if (!b.over) { S.mp = Math.min(maxMp(), S.mp + 3); b.round++; newRound(b); }
  render();
}
function pFlee() {
  const b = UI.ov, e = b.e; if (b.over) return;
  if (chance(clamp(50 + (S.stats.agi + qingBonus() / 2 - e.agi) * 4, 20, 92))) { b.over = 'flee'; bLog('你虛晃一招，抽身而退。'); return render(); }
  bLog('你想脫身，卻被對方纏住！');
  for (let i = 0; i < 2; i++) { const f = b.foe[i], m = f === 'A' ? e.moves[0] : f === 'B' ? (e.moves[1] || e.moves[0]) : null; if (m) bLog('　' + hitMe(b, m[0], m[1])); }
  if (S.hp <= 0) { S.hp = 0; b.over = 'lose'; bLog('你眼前一黑，栽倒在地……'); } else { b.round++; newRound(b); }
  render();
}
// 投降：當場認輸，不再挨打
function pSurrender() {
  const b = UI.ov; if (b.over) return;
  b.over = 'lose'; b.surr = true; S.hp = Math.max(1, S.hp);
  bLog('你收招後退，拱手認輸。');
  render();
}
function defeat() {
  const lost = Math.round(S.silver * 0.2);
  S.silver -= lost; S.hp = Math.round(maxHp() * 0.3);
  advance(15);
  return `你身受重傷，被好心人抬去醫治，躺了半個月才能下床。〔銀兩-${lost}　耗時十五日〕`;
}
function endBattle() {
  const b = UI.ov;
  S.seen = S.seen || {}; S.seen[b.e.n] = (S.seen[b.e.n] || 0) + 1;
  let r;
  if (b.over === 'win') {
    S.wins++;
    const x = battleXp(20 + b.e.P * 6) + gainExp(12 + b.e.P * 3);
    r = b.win ? b.win(S) : `你擊敗了${b.e.n}。`;
    if (r && typeof r === 'object') { if (r.battle && !r.title) r.title = b.title; return handleResult(r); }
    r += x;
  } else if (b.over === 'lose') {
    S.losses++; if (!b.surr && !b.judged) S.hp = 1;
    r = b.lose ? b.lose(S) : defeat();
    if (r && typeof r === 'object') return handleResult(r);
    r = (b.surr ? '你認輸了。' : b.judged ? '六手過後，你略處下風，只得收招認輸。' : '') + r + gainExp(6 + b.e.P);
  } else r = '你且戰且退，總算甩開了對手。';
  UI.ov = { k: 'event', type: '戰鬥', title: b.title, text: '', choices: [], result: r, who: b.who };
  render();
}

/* ---------- 物品 ---------- */
const healer = () => fxSum('heal') > 0;
function useMed(id) {
  const it = ITEMS[id];
  addItem(id, -1);
  if (it.hp) S.hp = Math.min(maxHp(), S.hp + Math.round(it.hp * (healer() && it.hp < 999 ? 1.5 : 1)));
  if (it.mp) S.mp = Math.min(maxMp(), S.mp + it.mp);
}
function useItem(id) {
  const it = ITEMS[id];
  if (it.kind === 'med') { useMed(id); toast(`服下${it.n}`); }
  else if (it.kind === 'tonic') { addItem(id, -1); toast(`服下${it.n}` + gain({ con: 1, bonusHp: 30 })); }
  else if (it.kind === 'acc') { S.acc = S.acc === id ? null : id; recalc(); }
  else if (it.kind === 'manual') {
    if (knows(it.skill)) return toast('這門功夫你已經會了');
    addItem(id, -1); toast(learn(it.skill));
  } else if (it.kind === 'weapon') { S.weapon = S.weapon === id ? null : id; recalc(); }
  else if (it.kind === 'armor') { S.armor = S.armor === id ? null : id; recalc(); }
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

/* ---------- 下一步：唯一的主行動是「歷練」，其餘一切都在事件裡發生 ---------- */
function nextGoal() {
  const t = today();
  const known = histRumors(720, false).find(r => { const h = r.h, need = S.loc === h.loc ? 0 : travelDays(h.loc); return t + need < hEnd(h); });
  const unknown = histRumors(720, true).filter(x => !x.now && !(S.flags.heardOf || {})[x.h.id]);
  const nx = HIST.filter(h => h.loc && h.scene && !S.hist[h.id] && hStart(h) > t).sort((a, b) => hStart(a) - hStart(b))[0];
  if (!known && !unknown.length && (!nx || age() + (nx.y - ad()) > 66)) {
    return { title: nx ? '下一件大事，你等不到了' : '這個時代的大事都過去了', desc: nx ? `下一件大事要到${reign(nx.y)}，那時你已經太老了。` : '你親眼見過的、聽人說過的，都已成了往事。',
      note: '可以繼續歷練，過自己的日子；或者歸隱，把武功傳給下一代，讓後人去看下一個時代。',
      acts: [['繼續歷練', adventureMonth], ['歸隱，傳給下一代', () => confirmBox('封劍歸隱？', '這一世的故事將就此結算，你可以選一門武功傳給後人，開啟下一代。', () => retire('歸隱'))]] };
  }
  const acts = [['歷練一個月', adventureMonth]];
  return known
    ? { title: '歷練', desc: `風聞：${known.h.rumor}（${known.when}，${known.where}）`, note: '按一次過約一個月。拜師、買賣、情緣、奇遇都在路上的事件裡。日子近了，會有劇情帶你趕到現場。', acts }
    : { title: '歷練', desc: '江湖上暫時沒有大事的風聲。出門走走，遇人、遇事、遇機緣；在城裡的酒樓和茶樓，更容易聽到消息。', note: '按一次過約一個月。每件事都有三條路：正派、反派、或不予理會。', acts };
}

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
  if (sn >= 8) end = ['江湖見證者', `你這一生親眼看過${cnNum(sn)}件後來被寫進傳說的事。晚年你常坐在茶樓角落，聽說書人講那些故事，偶爾小聲糾正一兩句：「不對，那天下著雪。」`];
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
    gen: S.gen, from: S.name, blood: !!S.child, year: ad() + 1,
    skill: { id: e.pick, lv: Math.max(1, Math.ceil(S.skills[e.pick].lv * (heir ? 0.5 : 0.3))) },
    silver: Math.round(S.silver * (heir ? 0.3 : 0.1)), weapon: heir ? S.weapon : null,
  };
  UI = { screen: 'create', ov: null, create: { name: '', gender: '男', origin: 0, stats: rollStats(), legacy, year: legacy.year } };
  render();
}
