/* 江湖歲月錄 — 引擎：狀態、時間、戰鬥、行動 */
'use strict';

let S = null;                 // 存檔狀態
let UI = { screen: 'title', tab: 'world', ov: null, create: null };
let Q = [];                   // 待觸發事件佇列
let H = [];                   // 當前畫面的按鈕處理器
const SAVE_KEY = 'jianghu_suiyue_v1';

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
const dateStr = (d = S.date) => `${ERA}${d.y === 1 ? '元' : cnNum(d.y)}年 ${MONTH_N[d.m]}${cnDay(d.d)}`;
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
  const o = ORIGINS[c.origin];
  const st = Object.assign({}, c.stats);
  for (const k in o.st) st[k] += o.st[k];
  S = {
    name: c.name || '無名', gender: c.gender, origin: o.n, gen: legacy ? legacy.gen + 1 : 1, age0: 0,
    date: { y: 1, m: 1, d: 1 }, loc: 'luoyang', stats: st, drill: {},
    hp: 1, mp: 1, bonusHp: 0, bonusMp: 0, silver: 120 + (o.silver || 0), fame: 0, moral: 0,
    sect: null, rank: 0, contrib: 0, contribTotal: 0,
    skills: { basic_fist: { lv: 1, exp: 0 }, tuna: { lv: 1, exp: 0 } }, nei: 'tuna', eq: ['basic_fist'],
    weapon: null, armor: null, inv: { jinchuang: 2 },
    npcs: {}, spouse: null, child: null, disciple: null, rival: 0,
    done: {}, flags: {}, log: [], wins: 0, losses: 0, legacyFrom: null,
  };
  if (o.item) { S.inv[o.item] = 1; S.weapon = o.item; }
  if (o.herb) S.inv.herb = o.herb;
  if (legacy) {
    S.legacyFrom = legacy.from;
    S.silver += legacy.silver;
    if (legacy.skill) { S.skills[legacy.skill.id] = { lv: legacy.skill.lv, exp: 0 }; autoEquip(legacy.skill.id); }
    if (legacy.weapon) { S.inv[legacy.weapon] = 1; S.weapon = legacy.weapon; }
    if (legacy.blood) { S.stats.int++; S.stats.con++; }
  }
  S.hp = maxHp(); S.mp = maxMp();
  Q = [];
  log(legacy
    ? `${S.name}帶著${legacy.from}的遺澤踏入洛陽城。上一代的故事已成傳說，這一代的才剛開始。`
    : `${S.name}，${o.n}，年方十六，${S.silver >= 50 ? `懷揣${S.silver}兩盤纏` : '身上只有幾個銅板，一路討著飯'}來到洛陽城，決心闖出一番名堂。`);
  UI = { screen: 'game', tab: 'world', ov: null };
  save(); render();
  window.scrollTo(0, 0);
}

/* ---------- 衍生數值 ---------- */
function neiSum(key) {
  let t = 0;
  for (const id in S.skills) {
    const k = SKILLS[id];
    if (k.type === 'nei') t += S.skills[id].lv * k[key] * (id === S.nei ? 1 : 0.5);
  }
  return Math.round(t);
}
const maxHp = () => 80 + S.stats.con * 12 + neiSum('hp') + S.bonusHp;
const maxMp = () => 30 + S.stats.int * 2 + S.stats.con * 3 + neiSum('mp') + S.bonusMp;
const neiLv = () => S.skills[S.nei] ? S.skills[S.nei].lv : 0;
const neiFactor = () => 1 + neiLv() * 0.035 * SKILLS[S.nei].tier;
function qingBonus() {
  let b = 0;
  for (const id in S.skills) if (SKILLS[id].type === 'qing') b = Math.max(b, S.skills[id].lv * SKILLS[id].dodge);
  return b;
}
const pDodge = () => S.stats.agi * 1.2 + qingBonus();
const pDef = () => S.stats.con * 0.8 + (S.armor ? ITEMS[S.armor].def : 0) + neiLv() * 0.5;
function power() {
  let s = 0;
  for (const id in S.skills) s += S.skills[id].lv * SKILLS[id].tier;
  return s / 3 + (S.stats.str + S.stats.con + S.stats.agi) / 6 + ((S.weapon ? ITEMS[S.weapon].atk : 0) + (S.armor ? ITEMS[S.armor].def : 0)) / 6;
}
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
  for (const k in o) {
    let v = o[k];
    if (!v) continue;
    if (k in STAT_N) { S.stats[k] = clamp(S.stats[k] + v, 1, 20); out.push(`${STAT_N[k]}${v > 0 ? '+' : ''}${v}`); continue; }
    if (k === 'contrib') { S.contrib = Math.max(0, S.contrib + v); if (v > 0) S.contribTotal += v; }
    else if (k === 'silver') { v = Math.max(v, -S.silver); S.silver += v; }
    else if (k === 'hp') S.hp = clamp(S.hp + v, 1, maxHp());
    else if (k === 'mp') S.mp = clamp(S.mp + v, 0, maxMp());
    else if (k === 'moral') S.moral = clamp(S.moral + v, -100, 100);
    else S[k] += v;
    if (k === 'fame') S.fame = Math.max(0, S.fame);
    if (v) out.push(`${GAIN_N[k]}${v > 0 ? '+' : ''}${Math.round(v)}`);
  }
  S.hp = Math.min(S.hp, maxHp()); S.mp = Math.min(S.mp, maxMp());
  return out.length ? `〔${out.join('　')}〕` : '';
}
function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; return `〔獲得 ${ITEMS[id].n}${n > 1 ? '×' + n : ''}〕`; }
const has = id => (S.inv[id] || 0) > 0;
const knows = id => !!S.skills[id];
const xpNeed = (lv, tier) => Math.round(40 * Math.pow(lv, 1.6) * [1, 1.5, 2.2][tier - 1]);
function autoEquip(id) {
  const k = SKILLS[id];
  if (k.type === 'nei') { if (!S.skills[S.nei] || k.tier > SKILLS[S.nei].tier) S.nei = id; }
  else if (k.type !== 'qing' && !S.eq.includes(id)) {
    if (S.eq.length < 2) S.eq.push(id);
    else { const weak = S.eq.findIndex(e => SKILLS[e].tier < k.tier); if (weak >= 0) S.eq[weak] = id; }
  }
}
function learn(id, lv = 1) {
  if (knows(id)) return xp(id, 200) || `〔${SKILLS[id].n} 的領悟加深了〕`;
  S.skills[id] = { lv, exp: 0 };
  autoEquip(id);
  return `〔習得${TIER_N[SKILLS[id].tier]}${TYPE_N[SKILLS[id].type]}：${SKILLS[id].n}〕`;
}
function xp(id, n) {
  const sk = S.skills[id], k = SKILLS[id];
  if (!sk || sk.lv >= 10) return '';
  sk.exp += Math.round(n);
  let up = 0;
  while (sk.lv < 10 && sk.exp >= xpNeed(sk.lv, k.tier)) { sk.exp -= xpNeed(sk.lv, k.tier); sk.lv++; up++; if (k.evil) S.moral = clamp(S.moral - 3, -100, 100); }
  if (sk.lv >= 10) sk.exp = 0;
  return up ? `〔${k.n} 突破至第${cnNum(sk.lv)}層〕` : '';
}
function battleXp(n) {
  const out = [];
  for (const id of S.eq) { const t = xp(id, n); if (t) out.push(t); }
  const t = xp(S.nei, n * 0.6); if (t) out.push(t);
  return out.join('');
}

/* ---------- 時間推進 ---------- */
function advance(days) {
  for (let i = 0; i < days; i++) {
    const d = S.date;
    d.d++;
    if (d.d > 30) { d.d = 1; d.m++; if (d.m > 12) { d.m = 1; d.y++; onYear(); } onMonth(); }
    if (d.m === 1 && d.d === 15) Q.push(FIXED.lantern);
    if (d.m === 7 && d.d === 7) Q.push(FIXED.qixi);
    if (d.m === 9 && d.d === 1) Q.push(FIXED.tourney);
  }
  S.hp = Math.min(maxHp(), Math.round(S.hp + days * maxHp() * 0.02));
  S.mp = Math.min(maxMp(), Math.round(S.mp + days * maxMp() * 0.06));
}
function onMonth() {
  const { y, m } = S.date;
  if (y === 3 && m === 6) Q.push(FIXED.arc1);
  if (y === 5 && m === 6) Q.push(FIXED.arc2);
  if (y === 7 && m === 3) Q.push(FIXED.arc3);
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
    !(e.once && S.done[e.id]) && e.id !== S.flags.lastEv && (!e.cond || e.cond(S, L)));
  let tot = 0;
  const ws = pool.map(e => { const w = (e.w || 10) * (e.type === '奇遇' || e.type === '傳承' ? 1 + S.stats.luck / 15 : 1); tot += w; return w; });
  let r = Math.random() * tot;
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
  return null;
}
function act(days, text, ctx, evChance = 38) {
  if (text) log(text);
  advance(days);
  if (ctx && chance(evChance)) { const e = rollEvent(ctx); if (e) Q.push(e); }
  pump();
}
function pump() {
  if (UI.ov && UI.ov.k !== 'menu') { render(); return; }
  if (Q.length) { UI.ov = null; showEvent(Q.shift()); return; }
  save(); render();
}
function showEvent(ev) {
  if (ev.cond && ev.fixed && !ev.cond(S)) return pump();
  if (ev.id) { S.done[ev.id] = (S.done[ev.id] || 0) + 1; S.flags.lastEv = ev.id; }
  const text = typeof ev.text === 'function' ? ev.text(S) : ev.text;
  const choices = (typeof ev.choices === 'function' ? ev.choices(S) : ev.choices || []).filter(c => !c.cond || c.cond(S));
  UI.ov = { k: 'event', type: ev.type, title: ev.title, art: ev.art, text, choices, result: null, who: typeof ev.who === 'function' ? ev.who(S) : ev.who };
  log(`【${ev.type}】${ev.title}`);
  render();
}
function choose(i) {
  const c = UI.ov.choices[i];
  handleResult(c.go ? c.go(S) : '');
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

/* ---------- 戰鬥 ---------- */
function foe(n, fix, mult, style, extra) {
  const P = Math.max(1, fix + power() * mult);
  return Object.assign({ n, P, hp: Math.round(30 + P * 16), mhp: Math.round(30 + P * 16), atk: 5 + P * 2, def: P * 0.6, agi: 3 + P * 0.6, moves: FOE_MOVES[style] }, extra || {});
}
function startBattle(r) {
  const prev = UI.ov || {};
  UI.ov = {
    k: 'battle', type: '戰鬥', who: prev.who, title: r.title || prev.title || '狹路相逢', e: r.battle, win: r.win, lose: r.lose, noFlee: r.noFlee,
    log: [r.intro || `${r.battle.n}擺開架勢，殺氣逼人。`], fx: { bleed: 0, bleedV: 0, poison: 0, poisonV: 0, stun: 0, weak: 0 }, guard: false, round: 1, over: null, sub: null,
  };
  if (r.battle.agi > S.stats.agi + qingBonus() / 2 + 3) { UI.ov.log.push(`${r.battle.n}身法更快，搶先出手！`); foeTurn(); }
  render();
}
function pMoves() {
  const out = [];
  for (const id of S.eq) {
    const k = SKILLS[id], lv = S.skills[id].lv;
    for (const m of k.moves) if (lv >= m[1]) out.push({ id, n: m[0], mp: m[2], pow: m[3], fx: m[4], k, lv });
  }
  return out;
}
function attrMul(a) {
  const na = SKILLS[S.nei].attr;
  if (na === 'he') return 1.1;
  if (a === 'he') return 1.05;
  return na === a ? 1.22 : 0.9;
}
function bLog(s) { const b = UI.ov; b.log.push(s); if (b.log.length > 60) b.log.shift(); }
function pAttack(mv) {
  const b = UI.ov, e = b.e;
  if (b.over) return;
  if (S.mp < mv.mp) return;
  S.mp -= mv.mp; b.guard = false;
  const hit = clamp(90 + (S.stats.agi - e.agi) * 1.5, 55, 98);
  if (!chance(hit)) bLog(`你使出「${mv.n}」，被${e.n}閃身避過。`);
  else {
    const w = S.weapon && ITEMS[S.weapon].wt === mv.k.type ? ITEMS[S.weapon].atk : 0;
    let dmg = (S.stats.str * 1.2 + mv.pow * (1 + 0.15 * (mv.lv - 1)) + w) * neiFactor() * attrMul(mv.k.attr) * rnd(0.88, 1.12);
    const crit = chance(S.stats.luck * 1.3);
    if (crit) dmg *= 1.6;
    dmg = Math.max(1, Math.round(dmg - (mv.fx === 'pierce' ? 0 : e.def * 0.5)));
    e.hp -= dmg;
    let s = `你使出「${mv.n}」，${crit ? '正中要害，' : ''}${e.n}受到 ${dmg} 點傷害。`;
    if (mv.fx === 'bleed') { b.fx.bleed = 3; b.fx.bleedV = Math.max(2, Math.round(dmg * 0.22)); s += '傷口血流不止。'; }
    if (mv.fx === 'poison') { b.fx.poison = 4; b.fx.poisonV = 4 + mv.lv * 2 + mv.k.tier * 3; s += '毒性滲入經脈。'; }
    if (mv.fx === 'stun' && chance(38)) { b.fx.stun = 1; s += '對方被震得頭暈目眩。'; }
    if (mv.fx === 'weak') { b.fx.weak = 3; s += '對方攻勢被你帶偏。'; }
    if (mv.fx === 'drain') { const hl = Math.round(dmg * 0.35); S.hp = Math.min(maxHp(), S.hp + hl); s += `你吸取了 ${hl} 點氣血。`; }
    bLog(s);
  }
  endRound();
}
function pGuard() {
  const b = UI.ov; if (b.over) return;
  b.guard = true;
  const m = 6 + neiLv() * 2; S.mp = Math.min(maxMp(), S.mp + m);
  bLog(`你凝神守勢，回復 ${m} 點內力。`);
  endRound();
}
function pHeal() {
  const b = UI.ov; if (b.over || S.mp < 12) return;
  S.mp -= 12; b.guard = false;
  const hl = Math.round((maxHp() * 0.12 + neiLv() * 4) * (knows('bh_nei') ? 1.6 : 1));
  S.hp = Math.min(maxHp(), S.hp + hl);
  bLog(`你運功調息，回復 ${hl} 點氣血。`);
  endRound();
}
function pUse(id) {
  const b = UI.ov; if (b.over || !has(id)) return;
  useMed(id); b.sub = null; b.guard = false;
  bLog(`你服下${ITEMS[id].n}。`);
  endRound();
}
function pFlee() {
  const b = UI.ov; if (b.over) return;
  if (chance(clamp(50 + (S.stats.agi + qingBonus() / 2 - b.e.agi) * 4, 20, 92))) {
    b.over = 'flee'; bLog('你虛晃一招，抽身而退。');
    render();
  } else { bLog('你想脫身，卻被對方纏住！'); b.guard = false; endRound(); }
}
function foeTurn() {
  const b = UI.ov, e = b.e;
  if (b.fx.stun) { b.fx.stun = 0; bLog(`${e.n}還在暈眩之中，無法出手。`); return; }
  const r = Math.random();
  const mv = e.moves[r < 0.5 ? 0 : r < 0.82 ? Math.min(1, e.moves.length - 1) : e.moves.length - 1];
  const hit = clamp(92 - (pDodge() - e.agi) * 1.2, 30, 95);
  if (!chance(hit)) { bLog(`${e.n}使出「${mv[0]}」，你側身閃過。`); return; }
  let dmg = e.atk * mv[1] * (b.fx.weak ? 0.75 : 1) * rnd(0.85, 1.15) - pDef() * 0.5;
  if (b.guard) dmg *= 0.4;
  dmg = Math.max(1, Math.round(dmg));
  S.hp -= dmg;
  bLog(`${e.n}使出「${mv[0]}」，你${b.guard ? '架住大半勁力，仍' : ''}受到 ${dmg} 點傷害。`);
}
function endRound() {
  const b = UI.ov, e = b.e;
  if (e.hp > 0) foeTurn();
  if (e.hp > 0 && b.fx.bleed) { b.fx.bleed--; e.hp -= b.fx.bleedV; bLog(`${e.n}失血，損失 ${b.fx.bleedV} 點氣血。`); }
  if (e.hp > 0 && b.fx.poison) { b.fx.poison--; e.hp -= b.fx.poisonV; bLog(`${e.n}毒發，損失 ${b.fx.poisonV} 點氣血。`); }
  if (b.fx.weak) b.fx.weak--;
  S.mp = Math.min(maxMp(), S.mp + 2);
  b.round++;
  if (e.hp <= 0) { e.hp = 0; b.over = 'win'; bLog(`${e.n}倒下了。你贏了。`); }
  else if (S.hp <= 0) { S.hp = 0; b.over = 'lose'; bLog('你眼前一黑，栽倒在地……'); }
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
  let r;
  if (b.over === 'win') {
    S.wins++;
    const x = battleXp(20 + b.e.P * 6);
    r = b.win ? b.win(S) : `你擊敗了${b.e.n}。`;
    if (r && typeof r === 'object') { if (r.battle && !r.title) r.title = b.title; return handleResult(r); }
    r += x;
  } else if (b.over === 'lose') {
    S.losses++; S.hp = 1;
    r = b.lose ? b.lose(S) : defeat();
    if (r && typeof r === 'object') return handleResult(r);
  } else r = '你且戰且退，總算甩開了對手。';
  UI.ov = { k: 'event', type: '戰鬥', title: b.title, text: '', choices: [], result: r, who: b.who };
  render();
}

/* ---------- 物品 ---------- */
function useMed(id) {
  const it = ITEMS[id];
  addItem(id, -1);
  if (it.hp) S.hp = Math.min(maxHp(), S.hp + Math.round(it.hp * (knows('bh_nei') && it.hp < 999 ? 1.5 : 1)));
  if (it.mp) S.mp = Math.min(maxMp(), S.mp + it.mp);
}
function useItem(id) {
  const it = ITEMS[id];
  if (it.kind === 'med') { useMed(id); toast(`服下${it.n}`); }
  else if (it.kind === 'tonic') { addItem(id, -1); toast(`服下${it.n}` + gain({ con: 1, bonusHp: 30 })); }
  else if (it.kind === 'manual') {
    if (knows(it.skill)) return toast('這門功夫你已經會了');
    addItem(id, -1); toast(learn(it.skill));
  } else if (it.kind === 'weapon') { S.weapon = S.weapon === id ? null : id; }
  else if (it.kind === 'armor') { S.armor = S.armor === id ? null : id; }
  save(); render();
}
let toastMsg = '';
function toast(s) { toastMsg = s; }

/* ---------- 行動 ---------- */
function travelDays(to) {
  const a = LOCS[S.loc], b = LOCS[to];
  const d = Math.hypot(a.x - b.x, a.y - b.y) / 4;
  return Math.max(2, Math.round(d * (knows('q_shadow') ? 0.7 : 1)));
}
function travel(to) {
  const d = travelDays(to);
  UI.ov = null;
  const from = LOCS[S.loc].n;
  S.loc = to;
  act(d, `自${from}啟程，行了${cnNum(d)}日，抵達${LOCS[to].n}。`, 'travel', 55);
}
function train(id) {
  UI.ov = null;
  const k = SKILLS[id];
  let g = 40 + S.stats.int * 5;
  const home = S.sect && k.sect === S.sect && LOCS[S.loc].sect === S.sect;
  if (home) g *= 1.3;
  if (k.type !== 'nei') g *= 1 + neiLv() * 0.01;
  const up = xp(id, g);
  act(10, `${S.origin === '破廟孤兒' && !S.sect ? '在城外荒地上' : '閉門'}苦練${k.n}十日${home ? '，有同門指點，事半功倍' : ''}。${up}`, LOCS[S.loc].kind, 25);
}
function drill(st) {
  UI.ov = null;
  const txt = { str: '舉石鎖、劈木樁，打熬筋骨', con: '冷水沖身、負重登山，錘鍊體魄', agi: '走梅花樁、穿林逐鳥，苦練身法', int: '研讀經史與武學典籍' }[st];
  S.drill[st] = (S.drill[st] || 0) + 50;
  let up = '';
  if (S.stats[st] >= 20) up = '〔已臻極限〕';
  else if (S.drill[st] >= S.stats[st] * 25) { S.drill[st] = 0; up = gain({ [st]: 1 }); }
  act(10, `${txt}十日。${up}`, LOCS[S.loc].kind, 25);
}
function rest(days, cost, text) {
  if (S.silver < cost) return toastRender('銀兩不足');
  S.silver -= cost; S.hp = maxHp(); S.mp = maxMp();
  act(days, text, null);
}
function roughSleep() {
  S.hp = Math.max(S.hp, Math.round(maxHp() * 0.6)); S.mp = Math.max(S.mp, Math.round(maxMp() * 0.6));
  act(3, S.origin === '破廟孤兒' ? '在城隍廟的屋簷下蜷了三夜。這種日子你從小過慣了，倒也睡得著。' : '囊中羞澀，在城隍廟的屋簷下湊合了三夜，沒怎麼睡好。', 'city', 30);
}
function toastRender(s) { toast(s); render(); }
function work() {
  const pay = Math.round((30 + S.stats.str * 3) * (S.sect === 'fengchen' ? 1.5 : 1));
  S.silver += pay;
  act(10, `在碼頭扛了十日貨${S.sect === 'fengchen' ? '，幫中兄弟多有照應' : ''}。〔銀兩+${pay}〕`, 'city', 30);
}
function gossip() {
  if (S.silver < 5) return toastRender('銀兩不足');
  S.silver -= 5;
  act(1, `在酒樓要了一壺酒，聽鄰桌閒談：「${pick(RUMORS)}」`, 'city', 70);
}
function arena() {
  const e = foe(pick(['擂主「鐵塔」趙橫', '擂主「快劍」柳七', '擂主「雙刀」賀三娘']), 2, 0.6, pick(['thug', 'sword', 'blade']));
  advance(2);
  Q.unshift({ type: '戰鬥', title: '擂台比武', art: 'fight', text: `擂台下人頭攢動。${e.n}抱臂立在台上：「還有哪位好漢上來賜教？」你撥開人群，縱身上台。`,
    choices: [{ t: '抱拳，出手', go: () => ({ battle: e, noFlee: true, win: () => { const s = Math.round(30 + e.P * 6); return '台下采聲雷動，擂主拱手認輸。' + gain({ silver: s, fame: 6 }); }, lose: () => { S.hp = Math.round(maxHp() * 0.25); return '你被打下擂台，灰頭土臉。' + gain({ fame: -2 }); } }) }] });
  pump();
}
function explore() {
  const L = LOCS[S.loc];
  advance(5);
  if (chance(65)) {
    const beast = chance(35);
    const e = beast ? foe(pick(L.art === 'desert' ? ['沙狼', '巨蠍'] : ['斑斕猛虎', '黑熊', '野豬王']), 1, 0.5 * L.danger, 'beast')
      : foe(pick(L.art === 'desert' ? ['馬賊', '沙匪頭目'] : ['剪徑山賊', '綠林嘍囉', '山寨二當家']), 1, 0.55 * L.danger, pick(['thug', 'blade']));
    Q.unshift({ type: '戰鬥', title: `${L.n}歷練`, art: 'fight', text: beast ? `林深處腥風撲面，一頭${e.n}擋住了去路，低吼著伏下身子。` : `你深入${L.n}，迎面撞上一夥${e.n}。為首的獰笑：「把銀子留下，饒你不死。」`,
      choices: [
        { t: '迎戰', go: () => ({ battle: e, win: () => { if (beast) return `你剝下獸皮、取了獸骨，下山可換些銀兩。` + gain({ silver: Math.round(15 + e.P * 5) }) + (chance(40) ? addItem('herb', 2) : ''); return '賊人抱頭鼠竄，留下搶來的財物。' + gain({ silver: Math.round(20 + e.P * 7), fame: 3, moral: 2 }); } }) },
        { t: '繞路避開', go: () => '你屏住氣息，從側面的獸徑繞了過去，一無所獲。' },
      ] });
  } else {
    const r = R(3);
    if (r === 0) log(`在${L.n}轉了五日，採得幾株草藥。` + addItem('herb', ri(2, 4)));
    else if (r === 1) log(`在${L.n}的山洞裡靜坐五日，對內息運行有所體悟。` + xp(S.nei, 60 + S.stats.int * 4));
    else log(`在${L.n}撿到一個前人遺落的包袱。` + gain({ silver: ri(20, 60) }));
    if (chance(45)) { const ev = rollEvent('wild'); if (ev) Q.push(ev); }
  }
  pump();
}
function gather() {
  const n = ri(3, 5) + (S.sect === 'baihua' ? 2 : 0);
  act(5, `在${LOCS[S.loc].n}採藥五日。` + addItem('herb', n), 'wild', 35);
}
function brew() {
  if ((S.inv.herb || 0) < 3) return toastRender('需要 3 株草藥');
  addItem('herb', -3); addItem('jinchuang', 1);
  toastRender('煉成金創藥一份');
}

/* 門派 */
function joinSect(id) {
  const k = SECTS[id];
  if (!k.req(S)) return toastRender(`${k.master}搖了搖頭：「${k.reqT}，你還不夠格。」`);
  S.sect = id; S.rank = 0; S.contrib = 0; S.contribTotal = 0;
  let t = `你在${k.master}面前三跪九叩，正式拜入${k.n}，成為外門弟子。`;
  if (k.align < 0) t += gain({ moral: -25 }) + '正道中人從此視你為敵。';
  t += learn(k.teach[0][0]);
  act(1, t, null);
}
function leaveSect() {
  const k = SECTS[S.sect];
  UI.ov = null;
  log(`你留書一封，叛出${k.n}。從此江湖路遠，師門不再是歸處。` + gain({ fame: -40 }));
  S.sect = null; S.rank = 0; S.contrib = 0; S.contribTotal = 0;
  save(); render();
}
function sectTask() {
  const k = SECTS[S.sect];
  advance(10);
  const c = ri(24, 38) + S.rank * 4;
  const tasks = k.tasks;
  if (chance(30)) {
    const e = k.align < 0 ? foe('正道遊俠', 1, 0.55, 'sword') : foe(pick(['血煞教探子', '盜經賊', '尋仇的惡客']), 1, 0.55, pick(['blade', 'thug']));
    Q.unshift({ type: '戰鬥', title: '門派任務', art: 'fight', text: `你奉命${pick(tasks)}，途中遇上${e.n}發難。`,
      choices: [{ t: '為師門而戰', go: () => ({ battle: e, noFlee: true, win: () => '你漂亮地完成了任務，回山覆命。' + gain({ contrib: c + 20, fame: 4, moral: k.align * 2 }), lose: () => { S.hp = Math.round(maxHp() * 0.3); return '任務失敗，你帶傷回山，受了一頓訓斥。' + gain({ contrib: 5 }); } }) }] });
  } else log(`奉師門之命${pick(tasks)}，十日後回山覆命。` + gain({ contrib: c, silver: ri(5, 15) }));
  if (chance(25)) { const ev = rollEvent('sect'); if (ev) Q.push(ev); }
  pump();
}
function spar() {
  const k = SECTS[S.sect];
  const e = foe(pick(['同門師兄', '同門師姐', '同輩翹楚']), 1 + S.rank * 2, 0.5 + S.rank * 0.08, k.align < 0 ? 'blade' : 'sword');
  advance(2);
  Q.unshift({ type: '戰鬥', title: '同門切磋', art: 'fight', text: `演武場上，${e.n}應了你的邀約：「點到為止，請。」`,
    choices: [{ t: '請賜教', go: () => ({ battle: e, noFlee: true, win: () => '你勝了半招，對方心悅誠服。這一戰讓你獲益良多。' + gain({ contrib: 10 }) + battleXp(40 + S.stats.int * 3), lose: () => { S.hp = Math.round(maxHp() * 0.4); return '你敗下陣來，卻也看清了自己的破綻。' + battleXp(30); } }) }] });
  pump();
}
function promote() {
  const k = SECTS[S.sect];
  const e = foe(['執事師兄', '傳功長老座下首徒', '護法長老'][S.rank], 3 + S.rank * 6, 0.55, k.align < 0 ? 'blade' : 'master');
  advance(1);
  Q.unshift({ who: 'elder', type: '傳承', title: '晉升考核', art: 'legacy', text: `${k.master}端坐堂上：「你入門以來的功勞，為師都看在眼裡。接下${e.n}三十招，便許你晉為${RANKS[S.rank + 1]}。」`,
    choices: [{ t: '弟子領命', go: () => ({ battle: e, noFlee: true, win: () => { S.rank++; return `你通過了考核，晉升為${k.n}${RANKS[S.rank]}！` + gain({ fame: 15 * S.rank }); }, lose: () => { S.hp = Math.round(maxHp() * 0.4); return '你未能撐過考核。師父道：「回去再練，來日方長。」'; } }) }] });
  pump();
}
function learnSect(id, cost) {
  if (S.contrib < cost) return toastRender('門派貢獻不足');
  S.contrib -= cost;
  toast(learn(id));
  save(); render();
}

/* 情緣 */
function npc(id) { return S.npcs[id] || (S.npcs[id] = { met: false, fav: 0, stage: 0 }); }
function visit(id) {
  const k = NPCS[id], n = npc(id);
  const th = [20, 50, 80];
  if (n.stage < 3 && n.fav >= th[n.stage] && !(n.stage === 2 && S.flags.lover && S.flags.lover !== id)) {
    const st = k.stage[n.stage];
    advance(1);
    Q.unshift({ who: id, type: '戀愛', title: `${k.n}・${['初識', '相知', '定情'][n.stage]}`, art: 'love', text: st.t,
      choices: [st.a, st.b].map((c, i) => ({ t: c[0], go: () => {
        n.fav = clamp(n.fav + c[1], 0, 100);
        if (c[1] > 0) { n.stage++; if (n.stage === 3) { S.flags.lover = id; return `${k.n}與你兩心相許，從此江湖路上不再孤身一人。〔好感+${c[1]}　已定情〕`; } return `${k.n}看你的眼神，和從前有些不同了。〔好感+${c[1]}〕`; }
        return `${k.n}沉默片刻，轉身離去。有些話一旦說出口，就收不回來了。〔好感${c[1]}〕`;
      } })) });
    return pump();
  }
  const g = ri(2, 4) + Math.floor(S.stats.cha / 4);
  n.fav = clamp(n.fav + g, 0, 100);
  act(2, `${pick(k.chat)}〔${k.n} 好感+${g}〕`, null);
}
function gift(id, item) {
  const k = NPCS[id], n = npc(id);
  addItem(item, -1);
  const g = item === k.like ? 14 : 6;
  n.fav = clamp(n.fav + g, 0, 100);
  UI.ov = null;
  act(1, `你把${ITEMS[item].n}送給${k.n}。${item === k.like ? k.ta + '眼睛一亮，顯然十分喜歡。' : k.ta + '道了聲謝，收下了。'}〔好感+${g}〕`, null);
}
function propose(id) {
  const k = NPCS[id];
  if (S.silver < 500) return toastRender('成親需備 500 兩');
  S.silver -= 500; S.spouse = id; S.flags.wedY = S.date.y;
  advance(3);
  Q.unshift({ who: id, type: '戀愛', title: '洞房花燭', art: 'love', text: `紅燭高照，賓客盈門。你與${k.n}拜過天地，江湖上的朋友來了大半，連幾個舊日對頭也送了賀禮。${k.n}握著你的手，輕聲道：「往後的路，一起走。」`,
    choices: [{ t: '執子之手', go: () => `你與${k.n}結為連理。` + gain({ [k.bonus[0]]: k.bonus[1], fame: 20 }) }] });
  pump();
}

/* ---------- 歸隱與傳承 ---------- */
function retire(reason) {
  const best = Object.keys(S.skills).sort((a, b) => S.skills[b].lv * SKILLS[b].tier - S.skills[a].lv * SKILLS[a].tier);
  let score = S.fame + S.wins * 3 + power() * 8 + (S.spouse ? 80 : 0) + (S.rank === 4 ? 200 : 0) + (S.flags.savedWulin ? 300 : 0);
  let end;
  if (S.flags.savedWulin && S.moral >= 20) end = ['武林盟主', '你力挽狂瀾，平定魔教之亂。此後數十年，江湖上提起你的名字，仍要抱拳說一聲「大俠」。'];
  else if (S.flags.demonLord) end = ['魔道至尊', '你踏著正道群雄的屍骨登上血煞崖頂。天下無人敢直呼你的名字，也無人敢與你同桌飲酒。'];
  else if (S.rank === 4) end = ['一派宗師', `你執掌${SECTS[S.sect].n}多年，門下弟子遍天下。山門前的石碑上，刻著你定下的門規。`];
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
    gen: S.gen, from: S.name, blood: !!S.child,
    skill: { id: e.pick, lv: Math.max(1, Math.ceil(S.skills[e.pick].lv * (heir ? 0.5 : 0.3))) },
    silver: Math.round(S.silver * (heir ? 0.3 : 0.1)), weapon: heir ? S.weapon : null,
  };
  UI = { screen: 'create', ov: null, create: { name: '', gender: '男', origin: 0, stats: rollStats(), legacy } };
  render();
}
