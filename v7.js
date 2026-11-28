'use strict';
/* ---------- 職業與兵器技藝（v7）----------
   武功、內功、門派全部廢除。主角開局選一種職業（之後不能更換），職業只決定開局帶的兵器與起手技藝；能力與被動由特質提供（v8.2）。
   「技藝」綁在兵器類別上：裝備了某類兵器，只有那一類的技藝會出招；兵器用得越久越熟練，熟練到了自動悟出更高明的技藝。
   舊事件裡學到的武功，會化成職業對應兵器的同階技藝。 */
const T1 = (a, b, c, fx) => [[a, 1, 0, 9], [b, 4, 0, 17], [c, 7, 0, 30, fx]];
const T2 = (a, b, c, fx) => [[a, 1, 0, 24], [b, 4, 0, 36, fx], [c, 7, 0, 54]];
const T3 = (a, b, c, fx) => [[a, 1, 0, 40], [b, 4, 0, 58, fx], [c, 7, 0, 80]];
const SKILLS = {
  sword1:  { n: '基礎劍術', type: 'sword', tier: 1, d: '握劍、出劍、收劍。每個劍士都從這裡開始。', moves: T1('直刺', '撩劍', '流星趕月', 'weak') },
  sword2:  { n: '游龍劍法', type: 'sword', tier: 2, d: '劍走游龍，一劍快過一劍，專刺破綻。', moves: T2('游龍出海', '白虹貫日', '驚鴻一瞥', 'pierce') },
  sword3:  { n: '天外飛仙', type: 'sword', tier: 3, d: '傳說中只出一劍的劍法。出劍時，連劍光都看不見。', moves: T3('飛仙', '斷雲', '天外一劍', 'bleed') },
  blade1:  { n: '劈山刀法', type: 'blade', tier: 1, d: '大開大合，一刀下去先求勢重。', moves: T1('力劈', '橫掃', '裂石', 'bleed') },
  blade2:  { n: '狂風刀法', type: 'blade', tier: 2, d: '刀刀連環，如狂風捲地，不給對手喘息。', moves: T2('狂風', '捲地', '摧城', 'stun') },
  blade3:  { n: '斬月刀', type: 'blade', tier: 3, d: '刀光一閃如殘月，據說能把落葉一分為二。', moves: T3('斬鐵', '殘月', '斬月', 'bleed') },
  spear1:  { n: '長槍十三式', type: 'spear', tier: 1, d: '軍中操練用的槍法，扎、挑、掃，簡單管用。', moves: T1('突刺', '回馬', '挑天', 'weak') },
  spear2:  { n: '梨花槍', type: 'spear', tier: 2, d: '槍尖亂點如梨花，看不清哪一點是真的。', moves: T2('梨花', '亂點', '暴雨', 'pierce') },
  spear3:  { n: '霸王槍', type: 'spear', tier: 3, d: '一槍橫掃千軍，萬人陣中也能殺出一條路。', moves: T3('破陣', '橫掃千軍', '霸王卸甲', 'stun') },
  bow1:    { n: '連射', type: 'bow', tier: 1, d: '搭箭、拉弓、放箭，練到不用瞄也能中。', moves: T1('單射', '雙箭', '穿楊', 'pierce') },
  bow2:    { n: '追星箭', type: 'bow', tier: 2, d: '箭追著箭，一箭封退路，一箭取要害。', moves: T2('追星', '裂羽', '連珠', 'bleed') },
  bow3:    { n: '落日弓法', type: 'bow', tier: 3, d: '傳說有人一箭射落了天上的太陽。你至少能射落對手的膽子。', moves: T3('貫日', '穿雲', '落日', 'pierce') },
  dart1:   { n: '飛石手法', type: 'dart', tier: 1, d: '石子、銅錢、鐵蓮子，抓到什麼丟什麼。', moves: T1('飛石', '連珠', '打穴', 'stun') },
  dart2:   { n: '袖裡乾坤', type: 'dart', tier: 2, d: '袖口一抖，針、釘、鏢同時出手。', moves: T2('袖箭', '毒針', '滿天星', 'poison') },
  dart3:   { n: '暴雨梨花', type: 'dart', tier: 3, d: '機括一響，數十枚細針如暴雨般撒出。', moves: T3('蜂鳴', '附骨', '暴雨梨花', 'poison') },
  fan1:    { n: '羽扇功', type: 'fan', tier: 1, d: '扇子能擋、能點、能撥。軍師近身時靠它保命。', moves: T1('輕搖', '撥扇', '點穴', 'stun') },
  fan2:    { n: '八陣扇', type: 'fan', tier: 2, d: '以扇布陣，一開一合之間，對手的攻勢就亂了。', moves: T2('八門', '亂陣', '鎖陣', 'weak') },
  fan3:    { n: '火燒連營', type: 'fan', tier: 3, d: '借風、借勢、借對手的錯。扇子一揮，滿盤皆輸的是別人。', moves: T3('借東風', '火計', '火燒連營', 'bleed') },
  staff1:  { n: '齊眉棍', type: 'staff', tier: 1, d: '棍與眉齊，掃、砸、戳，一寸長一寸強。', moves: T1('掃腿', '當頭', '震', 'stun') },
  staff2:  { n: '鐵錘功', type: 'staff', tier: 2, d: '重錘砸下，盾碎甲裂。', moves: T2('砸', '崩山', '碎岩', 'stun') },
  staff3:  { n: '破天錘', type: 'staff', tier: 3, d: '一錘下去，地都要震三震。', moves: T3('撼地', '雷鳴', '破天', 'stun') },
  axe1:    { n: '開山斧', type: 'axe', tier: 1, d: '樵夫砍柴的力氣，用在人身上就是開山的力氣。', moves: T1('劈砍', '迴旋', '裂骨', 'bleed') },
  axe2:    { n: '旋風斧', type: 'axe', tier: 2, d: '斧隨身轉，越轉越快，越轉越狠。', moves: T2('旋風', '斷筋', '碎盾', 'weak') },
  axe3:    { n: '盤古開天', type: 'axe', tier: 3, d: '傳說盤古一斧劈開天地。你這一斧，至少能劈開眼前的路。', moves: T3('開天', '裂地', '盤古', 'bleed') },
  fist1:   { n: '野拳', type: 'fist', tier: 1, d: '沒師父教過，打架打出來的拳。', moves: T1('直拳', '肘擊', '摔', 'stun') },
  fist2:   { n: '鐵拳', type: 'fist', tier: 2, d: '拳頭練得比石頭還硬。', moves: T2('鐵拳', '崩拳', '連環', 'stun') },
  fist3:   { n: '霸王拳', type: 'fist', tier: 3, d: '一拳出去，牛都要倒退三步。', moves: T3('撼山', '碎石', '霸王', 'pierce') },
  dagger1: { n: '短刃術', type: 'dagger', tier: 1, d: '刀短，所以要貼得近、下手要快。', moves: T1('割喉', '反手', '挑筋', 'bleed') },
  dagger2: { n: '暗影刺', type: 'dagger', tier: 2, d: '從影子裡出刀，對手轉身前就已經中了。', moves: T2('背刺', '淬毒', '影殺', 'poison') },
  dagger3: { n: '無聲殺', type: 'dagger', tier: 3, d: '沒有聲音，沒有影子，只有倒下的人。', moves: T3('無影', '封喉', '無聲', 'bleed') },
  whip1:   { n: '軟鞭術', type: 'whip', tier: 1, d: '鞭長，打得遠，也纏得住。', moves: T1('抽', '纏', '捲', 'weak') },
  whip2:   { n: '蛇鞭', type: 'whip', tier: 2, d: '鞭如毒蛇吐信，忽左忽右。', moves: T2('毒蛇', '纏絲', '捲浪', 'weak') },
  whip3:   { n: '千蛇亂舞', type: 'whip', tier: 3, d: '一條鞭舞出千條影子。', moves: T3('千蛇', '鎖魂', '亂舞', 'stun') },
  // 戰技：不出招，只給戰鬥效果（各職業的看家本事）
  guard1:  { n: '守勢', type: 'art', tier: 1, d: '劍士的第一課：先學會不被打中。' },
  guard2:  { n: '劍膽', type: 'art', tier: 2, d: '對手越強，劍越穩。挨打時順勢把力道送回去。' },
  hawk1:   { n: '鷹眼', type: 'art', tier: 1, d: '弓箭手看得遠，也看得準。' },
  hawk2:   { n: '百步穿楊', type: 'art', tier: 2, d: '開戰前先找好位置，第一箭就要見血。' },
  tac1:    { n: '兵法', type: 'art', tier: 1, d: '知己知彼，百戰不殆。看穿對手，比打中對手更重要。' },
  tac2:    { n: '奇謀', type: 'art', tier: 2, d: '一句話、一個假動作，就讓對手亂了陣腳。' },
  rage1:   { n: '狂血', type: 'art', tier: 1, d: '越打越熱，傷口好像也沒那麼痛了。' },
  rage2:   { n: '狂暴', type: 'art', tier: 2, d: '紅了眼的野蠻人，誰也攔不住。' },
  shade1:  { n: '潛影', type: 'art', tier: 1, d: '盜賊不正面打，專找背後和要害。' },
  shade2:  { n: '鬼影', type: 'art', tier: 2, d: '一閃就不見了，再出現已經在你身後。' },
};
// 職業：只決定開局的初始裝備（一把兵器＋兩門起手技藝）。能用的兵器、能力值、被動全部不受職業影響；
// wt、sup 只留給「舊武功化成技藝」時挑同類技藝用。能力與被動改由「特質」提供。
const CLASSES = {
  swordsman:  { n: '劍士', wt: ['sword', 'blade', 'spear'], item: 'w_sword1', st: {}, start: ['sword1', 'guard1'], sup: ['guard1', 'guard2'], fx: {}, up: {},
    d: '開局帶著一把劍，會基礎劍術與守勢。', pas: '' },
  archer:     { n: '弓箭手', wt: ['bow', 'dart'], item: 'w_bow1', st: {}, start: ['bow1', 'hawk1'], sup: ['hawk1', 'hawk2'], fx: {}, up: {},
    d: '開局帶著一把獵弓，會連射與鷹眼。', pas: '' },
  strategist: { n: '軍師', wt: ['fan', 'staff'], item: 'w_fan1', st: {}, start: ['fan1', 'tac1'], sup: ['tac1', 'tac2'], fx: {}, up: {},
    d: '開局帶著一把羽扇，會羽扇功與兵法。', pas: '' },
  barbarian:  { n: '野蠻人', wt: ['axe', 'staff', 'fist'], item: 'w_axe1', st: {}, start: ['axe1', 'rage1'], sup: ['rage1', 'rage2'], fx: {}, up: {},
    d: '開局帶著一把手斧，會開山斧與狂血。', pas: '' },
  rogue:      { n: '盜賊', wt: ['dagger', 'dart', 'whip'], item: 'w_dag1', st: {}, start: ['dagger1', 'shade1'], sup: ['shade1', 'shade2'], fx: {}, up: {},
    d: '開局帶著一把匕首，會短刃術與潛影。', pas: '' },
};
const CLS_ORDER = ['swordsman', 'archer', 'strategist', 'barbarian', 'rogue'];
const clsOf = () => CLASSES[(S && S.cls) || 'swordsman'];
const clsName = () => clsOf().n;
const clsFx = () => traitFx();   // 被動不再來自職業，改由特質提供（gearFx / gearChk / 氣血上限都經過這裡）
const ALL_WT = ['sword', 'blade', 'spear', 'bow', 'dart', 'fan', 'staff', 'axe', 'fist', 'dagger', 'whip'];
const clsWt = () => ALL_WT;   // 兵器不再受職業限制
const clsUp = () => 0;
const canWield = () => true;

/* ---------- 特質（v8.2）----------
   取代職業的被動與能力加成。開局選一個基礎特質；之後升級時，條件達成就會「覺醒」進階成更強的特質。
   st：能力值加成　fx：戰鬥 / 檢定效果（欄位與裝備詞條相同）　once：取得當下只結算一次（俠義、屬性點數）
   to：覺醒後的特質　need：覺醒條件　needT：條件說明 */
const TRAITS = {
  strong:   { n: '壯碩', tag: '臂力', d: '臂力 +2。天生一身力氣。', st: { str: 2 }, to: 'mighty', needT: '等級 4 且本身臂力 ≥ 9', need: s => s.lv >= 4 && s.base.str >= 9 },
  mighty:   { n: '力士', tag: '覺醒', d: '臂力 +3，暴擊率 +3%。一身蠻力不可怕，可怕的是懂得運用自如。', st: { str: 3 }, fx: { crit: 3 } },
  nimble:   { n: '迅疾', tag: '身法', d: '身法 +2。腳下生風，動作比人快一拍。', st: { agi: 2 }, to: 'ghost', needT: '等級 4 且本身身法 ≥ 9', need: s => s.lv >= 4 && s.base.agi >= 9 },
  ghost:    { n: '鬼魅', tag: '覺醒', d: '身法 +3，閃避 +3。來去無蹤，對手只看到殘影。', st: { agi: 3 }, fx: { dodge: 3 } },
  clever:   { n: '聰慧', tag: '悟性', d: '悟性 +2。一點就通，一學就會。', st: { int: 2 }, to: 'scholar', needT: '等級 4 且本身悟性 ≥ 9', need: s => s.lv >= 4 && s.base.int >= 9 },
  scholar:  { n: '學者', tag: '覺醒', d: '悟性 +3，戰力 +3%，事件中的悟性檢定 +1。善於分析，看破對手的破綻。', st: { int: 3 }, fx: { eye: 1, chk: { int: 1 } } },
  vigor:    { n: '活力', tag: '根骨', d: '根骨 +2。精力旺盛，打一天也不喊累。', st: { con: 2 }, to: 'ironman', needT: '等級 4 且本身根骨 ≥ 9', need: s => s.lv >= 4 && s.base.con >= 9 },
  ironman:  { n: '鐵人', tag: '覺醒', d: '根骨 +3，受傷 -4%。鋼鐵一般的意志與身軀。', st: { con: 3 }, fx: { dmgRed: 0.04 } },
  charming: { n: '迷人', tag: '魅力', d: '魅力 +2。往那兒一站就有人想搭話。', st: { cha: 2 }, to: 'alluring', needT: '等級 4 且本身魅力 ≥ 9', need: s => s.lv >= 4 && s.base.cha >= 9 },
  alluring: { n: '風流', tag: '覺醒', d: '魅力 +3，事件中的魅力檢定 +1。舉手投足都是故事。', st: { cha: 3 }, fx: { chk: { cha: 1 } } },
  lucky:    { n: '福星', tag: '福緣', d: '福緣 +2。運氣向來比別人好一點。', st: { luck: 2 }, to: 'fated', needT: '等級 4 且本身福緣 ≥ 9', need: s => s.lv >= 4 && s.base.luck >= 9 },
  fated:    { n: '天眷', tag: '覺醒', d: '福緣 +3，暴擊率 +2%，事件中的福緣檢定 +1。老天爺偏愛你。', st: { luck: 3 }, fx: { crit: 2, chk: { luck: 1 } } },
  good:     { n: '天生善良', tag: '俠義', d: '開局俠義 +20，每兩步回 1% 氣血。心地柔軟，看不得人受苦。', once: { moral: 20 }, fx: { regen: 0.01 }, to: 'savior', needT: '等級 5 且俠義 ≥ 40', need: s => s.lv >= 5 && s.moral >= 40 },
  savior:   { n: '救世主', tag: '覺醒', d: '俠義再 +20，每兩步回 2% 氣血。好人與弱者的希望燈塔。', once: { moral: 20 }, fx: { regen: 0.02 } },
  evil:     { n: '天生邪惡', tag: '俠義', d: '開局俠義 -20，對手攻擊 -3%。無法掩蓋的邪氣，讓人先怯了三分。', once: { moral: -20 }, fx: { foeWeak: 0.03 }, to: 'butcher', needT: '等級 5 且俠義 ≤ -40', need: s => s.lv >= 5 && s.moral <= -40 },
  butcher:  { n: '屠夫', tag: '覺醒', d: '俠義再 -20，對手攻擊 -6%。見過太多血，對手一看你的眼神就腿軟。', once: { moral: -20 }, fx: { foeWeak: 0.06 } },
  early:    { n: '早成者', tag: '天資', d: '開局多得 6 點屬性點數，可自行配點。早熟的天才。', once: { pts: 6 } },
};
const TRAIT_ORDER = ['strong', 'nimble', 'clever', 'vigor', 'charming', 'lucky', 'good', 'evil', 'early'];
const traitList = () => (S && S.traits) || [];
function traitFx() {
  const o = { chk: {} };
  for (const id of traitList()) {
    const f = (TRAITS[id] || {}).fx || {};
    for (const k in f) {
      if (k === 'chk') { for (const s in f.chk) o.chk[s] = (o.chk[s] || 0) + f.chk[s]; }
      else if (typeof f[k] === 'number') o[k] = (o[k] || 0) + f[k];
    }
  }
  return o;
}
function traitOnce(t) {
  if (!t.once) return;
  if (t.once.moral) S.moral = (S.moral || 0) + t.once.moral;
  if (t.once.pts) S.pts = (S.pts || 0) + t.once.pts;
}
function traitGive(id) {
  if (!TRAITS[id]) return;
  S.traits = S.traits || [];
  if (S.traits.includes(id)) return;
  S.traits.push(id);
  traitOnce(TRAITS[id]);
}
// 升級時檢查覺醒：條件達成就把基礎特質換成進階特質
function traitAwaken() {
  let out = '';
  const list = traitList();
  for (let i = 0; i < list.length; i++) {
    const t = TRAITS[list[i]];
    if (!t || !t.to || !TRAITS[t.to] || !t.need || !t.need(S)) continue;
    const nx = t.to;
    list[i] = nx;
    traitOnce(TRAITS[nx]);
    out += `〔特質覺醒：${t.n} → ${TRAITS[nx].n}〕`;
  }
  if (out) recalc();
  return out;
}
const traitHtml = () => (typeof milestoneHtml === 'function' ? '' : '') + traitHtml0() + (typeof milestoneHtml === 'function' ? milestoneHtml() : '');
const traitHtml0 = () => {
  const l = traitList();
  if (!l.length) return '特質：無';
  return l.map(id => {
    const t = TRAITS[id];
    return `特質：<b>${esc(t.n)}</b>　${esc(t.d)}${t.to ? `<br><small>覺醒條件：${esc(t.needT)}（覺醒為「${esc(TRAITS[t.to].n)}」）</small>` : ''}`;
  }).join('<br>');
};
const curWt = () => S.weapon && ITEMS[S.weapon] ? ITEMS[S.weapon].wt : 'fist';
// 熟練：每種兵器分開算。熟練 30 悟出入門技藝、120 悟出上乘技藝、400（且等級 8）悟出絕學
const PROF_TH = [30, 120, 400];
const profOf = wt => ((S.prof || {})[wt]) || 0;
const profLv = wt => Math.min(10, Math.floor(profOf(wt) / 60));
// 舊武功 → 新技藝：同類兵器職業能用就取同類，否則化入職業的主兵器；內功、身法與輔助化成職業戰技
function techOf(id) {
  if (SKILLS[id]) return id;
  const o = OLD_SKILLS[id];
  if (!o) return null;
  const c = clsOf(), tier = Math.min(3, o.tier || 1);
  if (o.type === 'nei' || o.type === 'qing' || (ART_FX[id] && ART_FX[id].pure)) return c.sup[tier >= 2 ? 1 : 0];
  return (c.wt.includes(o.type) ? o.type : c.wt[0]) + tier;
}
const techName = id => { const t = techOf(id); return t ? SKILLS[t].n : ''; };
function profGain(n) {
  const wt = curWt();
  S.prof = S.prof || {};
  S.prof[wt] = profOf(wt) + Math.round(n);
  let out = '';
  if (canWield(wt)) {
    for (let t = 1; t <= 3; t++) {
      const id = wt + t;
      if (SKILLS[id] && !S.skills[id] && profOf(wt) >= PROF_TH[t - 1] && (t < 3 || S.lv >= 8)) { out += `〔${TYPE_N[wt]}用熟了，悟出新的技藝〕` + learn(id); break; }
    }
  }
  return out;
}

/* ---------- v7：職業兵器、副手與兵器招式 ---------- */
Object.assign(ART_FX, {
  guard1: { pure: 1, guard: 0.5, d: '守勢：受傷 -7.5%' },
  guard2: { pure: 1, dmgRed: 0.08, reflect: 0.15, d: '劍膽：受傷 -8%，反震一成五傷害' },
  hawk1:  { pure: 1, crit: 8, d: '鷹眼：暴擊率 +8%' },
  hawk2:  { pure: 1, eye: 2, opener: 0.8, d: '百步穿楊：戰力 +6%，開戰再射一箭' },
  tac1:   { pure: 1, eye: 3, foeWeak: 0.06, d: '兵法：戰力 +9%，對手攻擊 -6%' },
  tac2:   { pure: 1, stunOpen: 1, foeWeak: 0.08, d: '奇謀：對手第一手使不出來，對手攻擊 -8%' },
  rage1:  { pure: 1, regen: 0.03, crit: 3, d: '狂血：每兩步回 3% 氣血，暴擊率 +3%' },
  rage2:  { pure: 1, crit: 8, eye: 1, d: '狂暴：暴擊率 +8%，戰力 +3%' },
  shade1: { pure: 1, crit: 5, dodge: 3, d: '潛影：暴擊率 +5%，閃避 +3' },
  shade2: { pure: 1, dodge: 6, opener: 0.6, d: '鬼影：閃避 +6，開戰先偷襲一下' },
});
Object.assign(ITEMS, {
  w_bow1:   { n: '獵弓', kind: 'weapon', wt: 'bow', atk: 7, price: 80, st: { agi: 1 } },
  w_bow2:   { n: '鐵胎弓', kind: 'weapon', wt: 'bow', atk: 15, price: 430, st: { agi: 1, str: 1 }, req: { str: 6 } },
  w_bow3:   { n: '落日長弓', kind: 'weapon', wt: 'bow', atk: 27, price: 0, st: { agi: 2, luck: 1 }, fx: { crit: 5, d: '弓身刻著一輪落日：暴擊率 +5%' } },
  w_fan1:   { n: '羽扇', kind: 'weapon', wt: 'fan', atk: 5, price: 60, st: { int: 1 } },
  w_fan2:   { n: '鐵骨扇', kind: 'weapon', wt: 'fan', atk: 13, price: 400, st: { int: 2 }, fx: { block: 6, d: '扇骨是精鋼打的：6% 機率擋下一擊' } },
  w_axe1:   { n: '手斧', kind: 'weapon', wt: 'axe', atk: 8, price: 80, st: { str: 1 } },
  w_axe2:   { n: '雙刃大斧', kind: 'weapon', wt: 'axe', atk: 21, price: 480, st: { str: 2 }, hand: 2, req: { str: 8 }, fx: { crit: 3, d: '兩面開刃：暴擊率 +3%' } },
  w_hammer: { n: '鐵錘', kind: 'weapon', wt: 'staff', atk: 14, price: 380, st: { str: 1, con: 1 }, stat: 'str', hand: 2 },
  w_dag1:   { n: '匕首', kind: 'weapon', wt: 'dagger', atk: 6, price: 60, st: { agi: 1 } },
  w_dag2:   { n: '魚腸短劍', kind: 'weapon', wt: 'dagger', atk: 14, price: 420, st: { agi: 1, luck: 1 }, fx: { bleed: 10, d: '劍身細如魚腸：10% 機率令對手流血' } },
  off_shield: { n: '圓盾', kind: 'off', price: 180, st: { con: 1 }, fx: { block: 15, d: '格擋：15% 機率擋下一擊' } },
  off_quiver: { n: '箭囊', kind: 'off', price: 150, fx: { opener: 0.5, crit: 3, d: '開戰先發一箭，暴擊率 +3%' } },
  off_scroll: { n: '兵書', kind: 'off', price: 200, st: { int: 1 }, fx: { eye: 1, chk: { int: 1 }, d: '隨身兵書：戰力 +3%，事件中的悟性檢定 +1' } },
  bk_bow:    { n: '《百步弓譜》', kind: 'manual', skill: 'bow1', price: 140 },
  bk_fan:    { n: '《隆中扇譜》', kind: 'manual', skill: 'fan1', price: 140 },
  bk_axe:    { n: '《樵夫斧譜》', kind: 'manual', skill: 'axe1', price: 140 },
  bk_dagger: { n: '《鼠竊錄》', kind: 'manual', skill: 'dagger1', price: 140 },
});
Object.assign(ITEMS.w_cleaver, { wt: 'axe' });
// 內力廢除：回氣類藥改成戰前藥
Object.assign(ITEMS.huiqi, { kind: 'buff', buff: { atk: 0.08 }, qi: 0, d: '備戰：下一場戰鬥傷害 +8%（開打時自動生效）' });
Object.assign(ITEMS.juqi, { kind: 'buff', buff: { atk: 0.12 }, qi: 0, d: '備戰：下一場戰鬥傷害 +12%（開打時自動生效）' });
Object.assign(ITEMS.huichun, { qi: 0, d: '回復 2 點氣血' });
Object.assign(ITEMS.dahuan, { qi: 0, d: '氣血全滿' });
Object.assign(ITEMS.shouwu, { gain: { int: 1 }, d: '服下後悟性+1' });
Object.assign(ITEMS.xinde, { d: '研讀後，裝備中的技藝各得 150 經驗' });
Object.assign(ITEMS.neijing, { n: '兵器圖譜殘頁', d: '研讀後，手上兵器的熟練 +120' });
for (const [id, a] of [['acc_coldjade', '寒氣入脈'], ['acc_sunstone', '熱力透體'], ['jiuyin', '殘卷心得'], ['jianglong', '掌力心得']]) ITEMS[id].fx.d = `${a}：招式威力 +15%`;
// 兵器自帶的招式：拿在手上就能使，與技藝一起輪流出手
const WEAPON_MV = {
  w_sword1: ['迴風劍', 14], w_sword2: ['青鋒三疊', 24, 'weak'], w_sword3: ['寒玉凝霜', 40, 'stun'], w_heavy: ['重劍壓頂', 36, 'stun'], w_scholar: ['文士一點', 20, 'pierce'],
  w_blade1: ['鬼頭斬', 15, 'bleed'], w_blade2: ['百煉一刀', 26], w_blade3: ['隕鐵裂空', 42, 'bleed'], w_cleaver: ['開山一擊', 32, 'stun'],
  w_fist1: ['鐵指戳', 12], w_fist2: ['護手崩拳', 22, 'stun'], w_dart1: ['柳葉連發', 14], w_dart2: ['透骨一釘', 24, 'pierce'],
  w_staff1: ['竹棒挑', 12], w_staff2: ['鑌鐵橫掃', 26, 'stun'], w_spear1: ['白蠟回馬', 16], w_spear2: ['點鋼破甲', 28, 'pierce'],
  w_whip1: ['長鞭捲', 14, 'weak'], w_whip2: ['金龍纏身', 24, 'weak'],
  w_bow1: ['獵弓急射', 15], w_bow2: ['鐵胎貫甲', 27, 'pierce'], w_bow3: ['落日一箭', 44, 'bleed'],
  w_fan1: ['羽扇輕撥', 12, 'weak'], w_fan2: ['鐵骨封喉', 24, 'stun'], w_axe1: ['手斧飛擲', 16, 'bleed'], w_axe2: ['雙刃迴旋', 34, 'bleed'],
  w_hammer: ['鐵錘砸頂', 28, 'stun'], w_dag1: ['匕首偷刺', 14, 'bleed'], w_dag2: ['魚腸刺心', 26, 'bleed'],
  chu_sword: ['草繩劍意', 24], luo_sword: ['駱家舊劍', 22], muqiang: ['穆家回馬槍', 26, 'weak'],
};
for (const id in WEAPON_MV) if (ITEMS[id]) ITEMS[id].mv = WEAPON_MV[id];
SHOPS.yanjing.push('w_axe1', 'w_axe2', 'w_bow1', 'off_shield');
SHOPS.linan.push('w_fan1', 'w_fan2', 'off_scroll', 'w_dag1');
SHOPS.jiaxing.push('w_dag1', 'w_dag2', 'w_bow1', 'off_quiver');
SHOPS.xiangyang.push('w_bow2', 'w_hammer', 'off_shield', 'off_quiver');
for (const k in SHOPS) SHOPS[k] = SHOPS[k].filter(id => id !== 'huiqi' && id !== 'juqi');
const wtOf = s => s.weapon && ITEMS[s.weapon] ? ITEMS[s.weapon].wt : 'fist';

/* ---------- 兵器配合：主兵器、副手與技藝搭得巧，威力加成 ---------- */
const COMBOS = [
  { n: '劍盾相濟', d: '劍在手、盾護身，攻守一體', has: s => wtOf(s) === 'sword' && ['off_shield', 'off_arm'].includes(s.off), mul: 1.15 },
  { n: '弓囊連珠', d: '弓配箭囊，搭箭如飛', has: s => wtOf(s) === 'bow' && s.off === 'off_quiver', mul: 1.2 },
  { n: '羽扇綸巾', d: '扇不離手、書不離身，運籌帷幄', has: s => wtOf(s) === 'fan' && s.off === 'off_scroll', mul: 1.2 },
  { n: '雙刃見血', d: '匕首配短匕，一刀明、一刀暗', has: s => wtOf(s) === 'dagger' && ['off_dagger', 'anda'].includes(s.off), mul: 1.2 },
  { n: '破甲重擊', d: '重斧配狂暴心法，一下比一下狠', has: s => wtOf(s) === 'axe' && s.eq.some(x => x === 'rage1' || x === 'rage2'), mul: 1.18 },
  { n: '三才貫通', d: '同一種兵器的三套技藝同時備好，招招相連', has: s => s.eq.filter(x => SKILLS[x] && SKILLS[x].type === wtOf(s)).length >= 3, mul: 1.15 },
  { n: '左右互搏', d: '一心二用，左拳右拳各打各的', has: s => s.flags && s.flags.huibo && wtOf(s) === 'fist', mul: 1.2 },
];
