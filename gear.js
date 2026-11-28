'use strict';
/* ---------- 裝備五格：套裝、標籤、兵器配合（v8.1）----------
   五格不分種類，什麼都能放（雙手兵器佔兩格）。裝備可以帶：
   set：套裝。同套裝湊到 2 件、4 件各有效果，可以疊加。
   tags：標籤。同標籤湊夠件數就啟動，只取達到的最高一檔。
   效果欄位與兵器詞條相同：crit 暴擊、block 格擋、bleed 流血、dodge 閃避、dmgRed 減傷、opener 先發、
   eye 戰力、foeWeak 削弱對手、regen 回血、reflect 反震、def 防禦、st 能力值、chk 事件檢定。
   新增裝備只要在下面加一行；有標價的會自動出現在商人的貨架上。 */
Object.assign(GEAR_SETS, {
  hj:      { n: '黃巾', b: { 2: { st: { luck: 1 }, d: '黃天庇佑：福緣 +1' }, 4: { foeWeak: 0.06, regen: 0.02, d: '符水護身：對手攻擊 -6%，每兩步回 2% 氣血' } } },
  han:     { n: '漢軍', b: { 2: { def: 3, block: 3, d: '軍陣操練：防禦 +3，格擋 +3%' }, 4: { dmgRed: 0.06, eye: 1, d: '號令嚴明：受傷 -6%，戰力 +3%' } } },
  youxia:  { n: '遊俠', b: { 2: { dodge: 3, d: '輕身快步：閃避 +3' }, 4: { crit: 6, opener: 0.5, d: '十步殺一人：暴擊率 +6%，開戰搶先一擊' } } },
  mingshi: { n: '名士', b: { 2: { eye: 1, chk: { int: 1 }, d: '羽扇綸巾：戰力 +3%，悟性檢定 +1' }, 4: { foeWeak: 0.08, eye: 1, d: '運籌帷幄：對手攻擊 -8%，戰力再 +3%' } } },
  hunter:  { n: '獵戶', b: { 2: { opener: 0.4, d: '埋伏：開戰先射一箭' }, 4: { crit: 6, bleed: 8, d: '獵殺：暴擊率 +6%，8% 機率令對手流血' } } },
  man:     { n: '南蠻', b: { 2: { st: { str: 1 }, d: '蠻力：臂力 +1' }, 4: { crit: 5, regen: 0.03, d: '蠻勇：暴擊率 +5%，每兩步回 3% 氣血' } } },
  thief:   { n: '鼠竊', b: { 2: { dodge: 3, chk: { agi: 1 }, d: '來去無蹤：閃避 +3，身法檢定 +1' }, 4: { bleed: 10, crit: 5, d: '下手狠辣：10% 機率令對手流血，暴擊率 +5%' } } },
});
Object.assign(GEAR_TAGS, {
  '輕': { b: { 2: { dodge: 3, d: '閃避 +3' }, 4: { dodge: 6, crit: 3, d: '閃避 +6，暴擊率 +3%' } } },
  '重': { b: { 2: { def: 3, d: '防禦 +3' }, 4: { def: 6, dmgRed: 0.06, d: '防禦 +6，受傷 -6%' } } },
  '守': { b: { 2: { block: 4, d: '格擋 +4%' }, 3: { block: 7, reflect: 0.1, d: '格擋 +7%，反震一成傷害' } } },
  '血': { b: { 2: { bleed: 6, d: '6% 機率令對手流血' }, 3: { bleed: 12, crit: 3, d: '12% 機率令對手流血，暴擊率 +3%' } } },
  '謀': { b: { 2: { eye: 1, chk: { int: 1 }, d: '戰力 +3%，悟性檢定 +1' }, 3: { eye: 2, foeWeak: 0.05, chk: { int: 2 }, d: '戰力 +6%，對手攻擊 -5%，悟性檢定 +2' } } },
  '疾': { b: { 2: { opener: 0.4, d: '開戰先出手' }, 3: { opener: 0.8, crit: 3, d: '開戰搶先一擊，暴擊率 +3%' } } },
});

// 新裝備
Object.assign(ITEMS, {
  // 黃巾
  hj_staff:    { n: '九節杖', kind: 'weapon', wt: 'staff', atk: 9, price: 200, st: { int: 1 }, set: 'hj', tags: ['謀'], d: '太平道的法杖，杖身九節，敲在身上也疼。', mv: ['九節杖擊', 17, 'stun'] },
  hj_band:     { n: '黃巾', kind: 'acc', price: 50, st: { luck: 1 }, set: 'hj', tags: ['疾'], d: '頭上一抹黃，走到哪裡都有人讓路。' },
  hj_robe:     { n: '太平道袍', kind: 'armor', def: 3, price: 140, st: { int: 1 }, set: 'hj', tags: ['謀'], d: '寫滿符文的道袍。' },
  hj_talisman: { n: '太平符', kind: 'relic', price: 160, set: 'hj', tags: ['謀'], fx: { foeWeak: 0.04, d: '貼身符咒：對手攻擊 -4%' } },
  hj_knife:    { n: '黃巾短刀', kind: 'off', price: 80, set: 'hj', tags: ['血'], fx: { bleed: 6, d: '粗鐵短刀：6% 機率令對手流血' } },
  // 漢軍
  han_blade:   { n: '環首刀', kind: 'weapon', wt: 'blade', atk: 13, price: 320, st: { str: 1 }, set: 'han', tags: ['重'], d: '漢軍制式長刀，刀柄末端一個鐵環。', mv: ['環首劈', 23, 'bleed'] },
  han_armor:   { n: '漢軍札甲', kind: 'armor', def: 9, price: 360, st: { con: 1 }, set: 'han', tags: ['重'], d: '鐵札片用皮繩串成，沉，但擋得住刀。' },
  han_helm:    { n: '鐵兜鍪', kind: 'acc', price: 150, st: { con: 1 }, set: 'han', tags: ['守'], d: '軍中制式鐵盔。' },
  han_tally:   { n: '虎符', kind: 'relic', price: 320, st: { cha: 1 }, set: 'han', tags: ['謀'], fx: { eye: 1, d: '半枚調兵虎符：戰力 +3%' } },
  // 遊俠
  yx_sword:    { n: '遊俠劍', kind: 'weapon', wt: 'sword', atk: 10, price: 260, st: { agi: 1 }, set: 'youxia', tags: ['輕'], d: '劍鞘磨得發亮，劍主走過很多路。', mv: ['遊俠一劍', 18] },
  yx_gourd:    { n: '酒葫蘆', kind: 'relic', price: 110, st: { cha: 1 }, set: 'youxia', fx: { regen: 0.02, d: '邊打邊喝：每兩步回 2% 氣血' } },
  // 名士
  ms_cloak:    { n: '鶴氅', kind: 'armor', def: 2, price: 220, st: { int: 1, cha: 1 }, set: 'mingshi', tags: ['謀', '輕'], d: '鶴羽織的外氅，穿上就像個名士。' },
  ms_kerchief: { n: '綸巾', kind: 'acc', price: 120, st: { int: 1 }, set: 'mingshi', tags: ['謀'], d: '青絲帶的頭巾，讀書人的打扮。' },
  // 獵戶
  ht_fur:      { n: '獸皮襖', kind: 'armor', def: 5, price: 130, st: { con: 1 }, set: 'hunter', tags: ['輕'], d: '山裡打來的獸皮，暖又耐磨。' },
  ht_fang:     { n: '狼牙項鍊', kind: 'acc', price: 130, st: { agi: 1 }, set: 'hunter', tags: ['血'], fx: { crit: 2, d: '暴擊率 +2%' } },
  // 南蠻
  mn_rattan:   { n: '藤甲', kind: 'armor', def: 9, price: 360, st: { con: 1 }, set: 'man', tags: ['守', '輕'], fx: { dmgRed: 0.04, d: '油浸藤甲，刀箭難入：受傷 -4%' } },
  mn_bone:     { n: '骨刃', kind: 'off', price: 100, set: 'man', tags: ['血'], fx: { bleed: 8, d: '獸骨磨的短刃：8% 機率令對手流血' } },
  // 鼠竊
  tf_claw:     { n: '飛爪', kind: 'relic', price: 150, set: 'thief', tags: ['疾'], fx: { chk: { agi: 1 }, d: '翻牆越戶：身法檢定 +1' } },
  tf_mask:     { n: '黑紗面巾', kind: 'acc', price: 80, st: { agi: 1 }, set: 'thief', tags: ['輕'], d: '遮住半張臉，誰也認不出你。' },
  // 不屬套裝
  r_horse:     { n: '青驄馬', kind: 'relic', price: 520, tags: ['疾'], fx: { opener: 0.5, dodge: 2, d: '有馬代步：開戰搶先一擊，閃避 +2' } },
  a_chain:     { n: '鎖子甲', kind: 'armor', def: 13, price: 520, st: { con: 1, agi: -1 }, tags: ['重'], d: '鐵環一個扣一個，刀砍不進，就是重。' },
  off_tassel:  { n: '劍穗', kind: 'off', price: 70, st: { agi: 1 }, tags: ['輕'], d: '繫在劍柄上的流蘇，舞劍時很好看。' },
  acc_pearl:   { n: '夜明珠', kind: 'acc', price: 420, st: { luck: 1, cha: 1 }, tags: ['謀'], d: '夜裡會發光的珠子，識貨的人見了眼睛都直了。' },
});

// 原有裝備：補上套裝與標籤
const GEAR_MARK = {
  w_sword1: ['輕'], w_sword2: ['輕'], w_sword3: ['輕', '謀'], w_heavy: ['重'], w_scholar: ['謀', '輕'],
  w_blade1: ['血'], w_blade2: ['血'], w_blade3: ['血', '重'], w_cleaver: ['重'],
  w_fist1: ['守'], w_fist2: ['守'], w_dart1: ['疾'], w_dart2: ['疾', '血'], w_staff1: ['輕'], w_staff2: ['重'],
  w_spear1: ['疾'], w_spear2: ['重'], w_whip1: ['輕'], w_whip2: ['輕'],
  w_bow1: ['疾', 'hunter'], w_bow2: ['疾', '重'], w_bow3: ['疾'], w_fan1: ['謀', 'mingshi'], w_fan2: ['謀', '守'],
  w_axe1: ['血', 'man'], w_axe2: ['重', '血'], w_hammer: ['重'], w_dag1: ['血', '輕', 'thief'], w_dag2: ['血'],
  chu_sword: ['輕'], luo_sword: ['守'], muqiang: ['守'],
  a_cloth: ['守'], a_gold: ['輕', '守'], a_thorn: ['守'], a_night: ['輕', 'youxia'], a_iron: ['重'],
  acc_jade: ['謀'], acc_amulet: ['守'], acc_bead: ['謀'], acc_belt: ['重', 'man'], acc_ring: ['謀'], acc_boots: ['輕', '疾', 'youxia'],
  acc_sachet: ['輕'], acc_coldjade: ['謀'], acc_sunstone: ['血'], baiyu: ['疾'],
  off_arm: ['守'], off_sleeve: ['疾', 'youxia'], off_stone: ['疾'], off_dagger: ['血', 'thief'], off_shield: ['守', '重', 'han'],
  off_quiver: ['疾', 'hunter'], off_scroll: ['謀', 'mingshi'], anda: ['血', '守'],
  r_fistbook: ['守'], r_flute: ['謀'], r_map: ['疾'],
};
for (const id in GEAR_MARK) {
  const it = ITEMS[id]; if (!it) continue;
  it.tags = GEAR_MARK[id].filter(t => GEAR_TAGS[t]);
  const set = GEAR_MARK[id].find(t => GEAR_SETS[t]);
  if (set) it.set = set;
}

// 城裡的商人也進一些新貨
if (typeof SHOPS !== 'undefined') {
  const add = (k, ids) => { if (SHOPS[k]) SHOPS[k].push(...ids.filter(id => ITEMS[id])); };
  add('yanjing', ['han_blade', 'han_armor', 'han_helm', 'r_horse', 'hj_band']);
  add('linan', ['ms_cloak', 'ms_kerchief', 'acc_pearl', 'hj_robe']);
  add('jiaxing', ['yx_sword', 'yx_gourd', 'tf_mask', 'tf_claw', 'off_tassel']);
  add('xiangyang', ['a_chain', 'han_tally', 'ht_fur', 'ht_fang', 'mn_rattan', 'mn_bone']);
}

// 兵器配合：改成看五格裡有沒有，並加入新的組合（同時符合好幾個時，取威力最高的一個）
if (typeof COMBOS !== 'undefined' && typeof wtOf === 'function') {
  const hasG = (s, ...ids) => GEAR_SLOTS.some(x => ids.includes(s[x[0]]));
  const gearOf = s => GEAR_SLOTS.map(x => s[x[0]] && ITEMS[s[x[0]]]).filter(Boolean);
  const nW = s => gearOf(s).filter(it => it.kind === 'weapon').length;
  const fix = (n, has) => { const c = COMBOS.find(x => x.n === n); if (c) c.has = has; };
  fix('劍盾相濟', s => wtOf(s) === 'sword' && hasG(s, 'off_shield', 'off_arm'));
  fix('弓囊連珠', s => wtOf(s) === 'bow' && hasG(s, 'off_quiver'));
  fix('羽扇綸巾', s => wtOf(s) === 'fan' && hasG(s, 'off_scroll', 'ms_kerchief'));
  fix('雙刃見血', s => wtOf(s) === 'dagger' && (hasG(s, 'off_dagger', 'anda', 'mn_bone', 'hj_knife') || gearOf(s).filter(it => it.wt === 'dagger').length >= 2));
  COMBOS.push(
    { n: '雙兵並舉', d: '身上帶著兩件兵器，一主一副，換手不停', has: s => nW(s) >= 2, mul: 1.08 },
    { n: '重甲重兵', d: '穿著重甲掄重兵，一下比一下沉', has: s => ['axe', 'staff', 'blade'].includes(wtOf(s)) && gearOf(s).some(it => (it.def || 0) >= 9), mul: 1.12 },
    { n: '夜行刺客', d: '一身夜行打扮，短刀專找要害', has: s => wtOf(s) === 'dagger' && hasG(s, 'a_night', 'tf_mask'), mul: 1.15 },
    { n: '躍馬挺槍', d: '騎在馬上挺槍衝鋒，借了馬的力', has: s => wtOf(s) === 'spear' && hasG(s, 'r_horse'), mul: 1.2 },
    { n: '弓馬嫻熟', d: '馬上開弓，邊走邊射', has: s => wtOf(s) === 'bow' && hasG(s, 'r_horse'), mul: 1.15 },
    { n: '符杖作法', d: '杖頭貼著太平符，一杖下去對手心裡發毛', has: s => wtOf(s) === 'staff' && hasG(s, 'hj_talisman'), mul: 1.12 },
    { n: '劍穗翻飛', d: '劍穗跟著劍走，晃得對手眼花', has: s => wtOf(s) === 'sword' && hasG(s, 'off_tassel'), mul: 1.1 },
  );
}

// 行囊頁的搭配效果區塊
try {
  const css = document.createElement('style');
  css.textContent = '.bk-bonus{margin:8px 0;padding:8px 10px;background:#20202C;border:2px solid #3A4058;border-radius:3px;font:14px/1.6 var(--f-ui,sans-serif);color:#EADFC8}' +
    '.bk-bonus b{display:block;font-weight:600;color:#F2D27A;margin-bottom:2px}.bk-bonus ul{margin:0;padding:0;list-style:none}' +
    '.bk-bonus li.on{color:#BFE3B0}.bk-bonus li.next{color:#B3A890;font-size:13px}.bk-cell.bk-hand{box-shadow:inset 0 0 0 2px #E0884A}';
  document.head.appendChild(css);
} catch (e) { /* 沒有 document 時略過 */ }
if (typeof S !== 'undefined' && S && S.inv) { try { recalc(); render(); } catch (e) { /* 標題畫面 */ } }
