'use strict';
/* v9.6：技藝移除＋裝備取捨（參考 Life in Adventure 的 Item Attributes 與 Stats）
   一、技藝系統整個拿掉：不再學招、不再裝備技藝；戰力只看能力、兵器、護甲與熟練。
       兵器自帶的招式、兵器熟練（用越久出手越重）、兵器配合照舊。
   二、負面詞條：重甲耐打但難潛行、輕袍靈活但怕刀、兇器嚇人但招人嫌。裝備不再只升不降。
   三、主屬性與副屬性：每種兵器看一項主屬性、一項副屬性，威力隨之放大；主屬性太低（≤3）會被拖累。
   四、雙屬性組合：兩項能力同時夠高，觸發額外加成；任何一項能力 ≤3 則有懲罰。 */

/* ---------- 一、移除技藝 ---------- */
learn = () => '';                   // 沒有技藝可學
{
  const _recalc = recalc;
  recalc = function () {
    if (S) { S.skills = {}; S.eq = []; S.nei = null; S.learned = S.learned || {}; }   // 舊存檔裡的技藝一併清空
    return _recalc();
  };
}
profGain = function (n) {
  const wt = curWt(), before = profLv(wt);
  S.prof = S.prof || {};
  S.prof[wt] = profOf(wt) + Math.round(n);
  const now = profLv(wt);
  return now > before ? `〔${TYPE_N[wt]}熟練提升到第 ${now} 級〕` : '';
};
battleXp = function (n) { return profGain(Math.max(1, Math.round(n / 4))); };
power = function () {
  const w = S.weapon ? ITEMS[S.weapon] : null;
  return (S.stats.str + S.stats.con + S.stats.agi) / 6 + ((w ? w.atk : 0) + gearDef()) / 6
    + ((S.lv || 1) - 1) * 0.3 + profLv(curWt()) * 0.3 + gearFx('eye') * 0.5;
};
basicMove = function () {
  const it = S.weapon && ITEMS[S.weapon];
  if (!it) return { id: null, k: BARE, lv: 1, pow: 6, pw: 6, n: '空手拳腳' };
  const pow = 9 + it.atk * 1.0 + profLv(it.wt) * 2 + (S.lv || 1) * 0.8;
  return { id: null, k: { n: it.n, type: it.wt, tier: 1 }, lv: 1, pow, pw: pow, n: '揮動' + it.n };
};
// 職業簡介不再提技藝
for (const k in CLASSES) CLASSES[k].d = CLASSES[k].d.replace(/，會[^。]*。/, '，擅長的兵器隨你喜歡。').replace(/會基礎[^。]*。/, '');
// 圖譜、秘笈不再賣
for (const k in SHOPS) SHOPS[k] = SHOPS[k].filter(id => !(ITEMS[id] && ITEMS[id].kind === 'manual'));
{
  const _ts = townStock;
  townStock = function (s) { return _ts(s).filter(e => !(ITEMS[e.id] && ITEMS[e.id].kind === 'manual')); };
}

/* ---------- 三、主屬性與副屬性 ---------- */
// 每種兵器：[主屬性, 副屬性]。兵器自己寫了 stat / sec 就用自己的。
const WT_STATS = {
  fist: ['str', 'con'], blade: ['str', 'agi'], spear: ['str', 'agi'], axe: ['str', 'con'], sword: ['agi', 'str'],
  whip: ['agi', 'int'], staff: ['con', 'str'], bow: ['agi', 'str'], dagger: ['agi', 'luck'], dart: ['luck', 'agi'], fan: ['int', 'cha'],
};
const wSec = it => it.sec || (WT_STATS[it.wt] || ['str', 'str'])[1];
// 威力 ＝ 原值 × (0.7 + 0.06×主屬性 + 0.03×(副屬性−5))；主屬性 ≤3 再打八五折
function weaponMul(it) {
  const m = wStat(it), main = S.stats[m], sec = S.stats[wSec(it)];
  return (0.7 + 0.06 * main + 0.03 * (sec - 5)) * (main <= 3 ? 0.85 : 1);
}
weaponAtk = function (type) { const it = S.weapon && ITEMS[S.weapon]; return it && it.wt === type ? it.atk * weaponMul(it) : 0; };
gearInfo = function (it) {
  const p = [];
  if (it.kind === 'weapon') {
    const m = it.stat || ART_ST[it.wt] || 'str', sc = S && S.stats ? `（現 ${S.stats[m]}／${S.stats[wSec(it)]}）` : '';
    p.push(`${ATK_TN[ATK_T[it.wt]]}擊・主：${STAT_N[m]}${it.alt ? `／${STAT_N[it.alt]}` : ''}・副：${STAT_N[wSec(it)]}${sc}`);
  }
  if (it.hand === 2) p.push('雙手');
  if (it.req) p.push(reqText(it));
  if (it.fx && it.fx.d) p.push(it.fx.d);
  const gt = gearTagList(it); if (gt.length) p.push(gt.join(''));
  return p.join('・');
};

/* ---------- 二、負面詞條（代價） ---------- */
{
  const cost = (id, fx, d) => {
    const it = ITEMS[id]; if (!it) return;
    it.fx = it.fx || {};
    for (const k in fx) {
      if (k === 'chk') it.fx.chk = Object.assign({}, it.fx.chk, { cha: ((it.fx.chk || {}).cha || 0) + fx.chk.cha });
      else it.fx[k] = (it.fx[k] || 0) + fx[k];
    }
    it.fx.d = (it.fx.d ? it.fx.d + '；' : '') + '代價：' + d;
  };
  // 重甲：耐打，但笨重
  cost('han_armor', { stealth: -1, dodge: -2 }, '笨重，隱匿 -1、閃避 -2');
  cost('a_chain', { stealth: -1, dodge: -2 }, '叮噹作響，隱匿 -1、閃避 -2');
  cost('a_iron', { stealth: -2, dodge: -3 }, '沉得走不快，隱匿 -2、閃避 -3');
  cost('off_shield', { dodge: -2 }, '笨重，閃避 -2');
  // 重兵器：雙手揮舞，藏不住
  for (const id of ['w_heavy', 'w_cleaver', 'w_axe2', 'w_hammer', 'w_staff2', 'w_spear2']) cost(id, { stealth: -1 }, '扛在肩上太顯眼，隱匿 -1');
  // 兇器兇相：嚇得住人，也招人嫌
  for (const id of ['w_cleaver', 'han_blade', 'mn_bone', 'ht_fang', 'mn_rattan']) cost(id, { chk: { cha: -1 } }, '一臉兇相，魅力檢定 -1');
  // 輕袍：靈活，但擋不住刀
  for (const id of ['hj_robe', 'ms_cloak']) cost(id, { dmgRed: -0.03 }, '衣薄，受傷 +3%');
  cost('a_night', { intim: -1, dmgRed: -0.03 }, '鬼鬼祟祟，威嚇 -1，衣薄受傷 +3%');
  cost('tf_mask', { intim: -1 }, '蒙面示人，威嚇 -1');
}

/* ---------- 四、雙屬性組合與能力下限 ---------- */
const STAT_COMBOS = [
  { n: '兵器熟練', a: 'str', b: 'agi', tiers: [{ at: 10, fx: { eye: 1 }, d: '戰力 +3%' }, { at: 13, fx: { eye: 1, crit: 3 }, d: '戰力再 +3%、暴擊率 +3%' }] },
  { n: '強韌', a: 'str', b: 'con', tiers: [{ at: 10, fx: { dmgRed: 0.03 }, d: '受傷 -3%' }, { at: 13, fx: { dmgRed: 0.03, regen: 0.01 }, d: '受傷再 -3%、戰鬥中每兩步回 1% 氣血' }] },
  { n: '穩固', a: 'con', b: 'int', tiers: [{ at: 10, fx: { ward: 1 }, d: '辟邪 +1：詭異的事嚇不倒' }, { at: 13, fx: { regen: 0.02 }, d: '戰鬥中每兩步回 2% 氣血' }] },
  { n: '求生', a: 'agi', b: 'int', tiers: [{ at: 10, fx: { stealth: 1 }, d: '隱匿 +1' }, { at: 13, fx: { dodge: 3 }, d: '閃避 +3' }] },
  { n: '鎮場', a: 'cha', b: 'int', tiers: [{ at: 10, fx: { intim: 1 }, d: '威嚇 +1' }, { at: 13, fx: { foeWeak: 0.04 }, d: '對手攻擊 -4%' }] },
];
const STAT_FLOORS = [
  { k: 'str', fx: { crit: -3 }, d: '暴擊率 -3%' },
  { k: 'con', fx: { dmgRed: -0.04 }, d: '受傷 +4%' },
  { k: 'agi', fx: { dodge: -3 }, d: '閃避 -3' },
  { k: 'int', fx: { chk: { int: -1 } }, d: '悟性檢定 -1' },
  { k: 'cha', fx: { chk: { cha: -1 } }, d: '魅力檢定 -1' },
  { k: 'luck', fx: { chk: { luck: -1 } }, d: '福緣檢定 -1' },
];
{
  const add = (o, fx) => { for (const k in fx) { if (k === 'chk') { for (const s in fx.chk) o.chk[s] = (o.chk[s] || 0) + fx.chk[s]; } else o[k] = (o[k] || 0) + fx[k]; } };
  const _traitFx = traitFx;
  traitFx = function () {
    const o = _traitFx();
    if (!S || !S.stats) return o;
    for (const c of STAT_COMBOS) for (const t of c.tiers) if (Math.min(S.stats[c.a], S.stats[c.b]) >= t.at) add(o, t.fx);
    for (const f of STAT_FLOORS) if (S.stats[f.k] <= 3) add(o, f.fx);
    return o;
  };
}
const comboHtml = () => {
  if (!S || !S.stats) return '';
  const got = [], next = [];
  for (const c of STAT_COMBOS) {
    const lo = Math.min(S.stats[c.a], S.stats[c.b]);
    let nxt = null;
    const have = [];
    for (const t of c.tiers) { if (lo >= t.at) have.push(t); else if (!nxt) nxt = t; }
    if (have.length) got.push(`<b>${c.n}</b>（${STAT_N[c.a]}＋${STAT_N[c.b]} 皆 ${have[have.length - 1].at}：${have.map(t => t.d).join('；')}）`);
    if (nxt && nxt.at - lo <= 3) next.push(`${STAT_N[c.a]}、${STAT_N[c.b]}都到 ${nxt.at} 可得「${c.n}」（${nxt.d}）`);
  }
  const bad = STAT_FLOORS.filter(f => S.stats[f.k] <= 3).map(f => `${STAT_N[f.k]}過低：${f.d}`);
  return (got.length ? `<br>雙屬性組合：${got.join('、')}` : '') + (next.length ? `<br><small>${next.join('；')}</small>` : '') + (bad.length ? `<br><small style="color:#A44233">${bad.join('；')}</small>` : '');
};
