'use strict';
/* v9.3：參考 Life in Adventure 的三個設計
   1. 結局矩陣：名聲（無名／小有名氣／名動一方）× 俠義（惡／中／善），歸隱與戰死各 9 種結局和一段墓誌。
   2. 能力有用處、有門檻：能力里程碑（12、15 點）、命與氣的上限、魅力折價（在 index.html）、能力夠高才開得出來的選項。
   3. 覺醒事件：特質不再升級自動覺醒，要在適合它的考驗事件裡通過才會進階。 */

/* ================================================================
   2. 能力里程碑
   ================================================================ */
const MILESTONES = [
  { k: 'str', tiers: [{ at: 12, n: '力大無窮', fx: { crit: 3 }, d: '暴擊率 +3%' }, { at: 15, n: '勢不可擋', fx: { crit: 3 }, d: '暴擊率再 +3%' }] },
  { k: 'con', tiers: [{ at: 12, n: '銅皮鐵骨', fx: { dmgRed: 0.04 }, d: '受傷 -4%' }, { at: 15, n: '百病不侵', fx: { regen: 0.02 }, d: '戰鬥中每兩步回 2% 氣血' }] },
  { k: 'int', tiers: [{ at: 12, n: '洞若觀火', fx: { eye: 1, chk: { int: 1 } }, d: '戰力 +3%、悟性檢定 +1' }, { at: 15, n: '料敵機先', fx: { eye: 1, foeWeak: 0.03 }, d: '戰力再 +3%、對手攻擊 -3%' }] },
  { k: 'agi', tiers: [{ at: 12, n: '身輕如燕', fx: { dodge: 3 }, d: '閃避 +3' }, { at: 15, n: '來去如風', fx: { dodge: 3, crit: 2 }, d: '閃避再 +3、暴擊率 +2%' }] },
  { k: 'luck', tiers: [{ at: 12, n: '福星高照', fx: { crit: 2, chk: { luck: 1 } }, d: '暴擊率 +2%、福緣檢定 +1' }, { at: 15, n: '吉人天相', fx: { crit: 2, dmgRed: 0.02 }, d: '暴擊率再 +2%、受傷 -2%' }] },
  { k: 'cha', tiers: [{ at: 12, n: '一呼百應', fx: { chk: { cha: 1 } }, d: '魅力檢定 +1' }, { at: 15, n: '望之儼然', fx: { foeWeak: 0.03, chk: { cha: 1 } }, d: '對手攻擊 -3%、魅力檢定再 +1' }] },
];
{
  const _traitFx = traitFx;
  traitFx = function () {
    const o = _traitFx();
    if (!S || !S.stats) return o;
    for (const m of MILESTONES) for (const t of m.tiers) {
      if (S.stats[m.k] < t.at) continue;
      for (const k in t.fx) {
        if (k === 'chk') { for (const s in t.fx.chk) o.chk[s] = (o.chk[s] || 0) + t.fx.chk[s]; }
        else o[k] = (o[k] || 0) + t.fx[k];
      }
    }
    return o;
  };
}
const milestoneHtml = () => {
  if (!S || !S.stats) return '';
  const got = [], next = [];
  for (const m of MILESTONES) {
    let nxt = null;
    for (const t of m.tiers) { if (S.stats[m.k] >= t.at) got.push(`<b>${t.n}</b>（${STAT_N[m.k]} ${t.at}：${t.d}）`); else if (!nxt) nxt = t; }
    if (nxt && nxt.at - S.stats[m.k] <= 3) next.push(`再 ${nxt.at - S.stats[m.k]} 點${STAT_N[m.k]}可得「${nxt.n}」（${nxt.d}）`);
  }
  return (got.length ? `<br>能力里程碑：${got.join('、')}` : '') + (next.length ? `<br><small>${next.join('；')}</small>` : '') + (typeof comboHtml === 'function' ? comboHtml() : '');
};

// 特質的覺醒說明：改成事件提示
Object.assign(TRAITS.strong, { needT: '在考驗臂力的事件中顯露實力' });
Object.assign(TRAITS.nimble, { needT: '在需要身法的追逐中立功' });
Object.assign(TRAITS.clever, { needT: '在辯難、解謎的場合勝出' });
Object.assign(TRAITS.vigor, { needT: '在艱苦的跋涉中撐下來' });
Object.assign(TRAITS.charming, { needT: '在需要口才的場合說服眾人' });
Object.assign(TRAITS.lucky, { needT: '在賭運氣的事件中連連中彩' });
Object.assign(TRAITS.good, { needT: '以俠義之舉救助許多人' });
Object.assign(TRAITS.evil, { needT: '在血腥的事件裡徹底墮入惡道' });
traitAwaken = function () { return ''; };   // 不再升級自動覺醒
const awakeNow = base => {
  const i = (S.traits || []).indexOf(base);
  if (i < 0) return '';
  const nx = TRAITS[base].to;
  S.traits[i] = nx; traitOnce(TRAITS[nx]); recalc();
  return `\n\n〔特質覺醒：${TRAITS[base].n} → ${TRAITS[nx].n}〕`;
};
const hasT = id => traitList().includes(id);

/* ================================================================
   3. 覺醒事件
   ================================================================ */
const AWAKE_EV = [
  { id: 'aw_strong', type: '奇遇', title: '舉鼎', ctx: ['city'], w: 12, art: 'city', cond: s => hasT('strong') && s.lv >= 2,
    text: '縣城祠廟前立著一口三百斤的銅鼎。鄉人傳說，誰能把它舉離地面，誰就是真正的力士。幾個少年試了好幾回，連鼎耳都沒搬動，只換來滿場鬨笑。',
    choices: () => [
      OPT('n', '雙手抓住鼎耳，一口氣舉起' + ODDS('str', 13), () => { const r = ROLLT('str', 13); return r.line + (r.ok ? '你腰背一挺，銅鼎離地三尺。圍觀的人倒吸一口冷氣，隨後爆出一片喝采。老人們說，上一個舉起它的人，是三十年前的亭長。' + gain({ fame: 5, qi: 1 }) + awakeNow('strong') : '鼎紋絲不動，你的腰倒先閃了一下。' + gain({ fame: -1 }) + qiLoss(1)); }),
      OPT('n', '先花兩天練腰力，下回再來', () => { advance(2); return '你在祠後的空地上扛石頭、拉牛車，練了兩天。鼎還在原地，你覺得自己離它近了一點。' + (battleXp(80) || '') + gain({ qi: 1 }); }),
      OPT('e', '趁夜割下鼎上的銅環去賣', () => '銅環在銅匠舖換了六十錢。第二天，祠廟的老廟祝坐在鼎前罵了一整天。' + gain({ silver: 60, moral: -4 })),
      OPT('n', '看看就走', () => '你搖搖頭走開了。')] },

  { id: 'aw_nimble', type: '奇遇', title: '屋頂上的賊', ctx: ['city'], w: 12, art: 'night', cond: s => hasT('nimble') && s.lv >= 2,
    text: '一個賊從首飾舖裡衝出來，懷裡抱著一個錦盒，翻上屋頂就跑。屋瓦嘩啦啦地響，街上的人只會喊：「抓賊！」',
    choices: () => [
      OPT('g', '翻上屋頂追他' + ODDS('agi', 13), () => { const r = ROLLT('agi', 13); return r.line + (r.ok ? '你踩著屋脊追了三條街，在一座鐘樓邊把他堵住。他腳下一滑，錦盒掉了下來——被你一把接住。你還給舖主時，舖主的手都在抖。' + gain({ fame: 6, moral: 3, silver: 30, qi: 1 }) + awakeNow('nimble') : '你剛踩上屋簷，瓦片就碎了，整個人摔了下來。賊早已不見蹤影。' + hurt(1) + qiLoss(1)); }),
      OPT('n', '在街口堵他', () => '你在巷口等了半天，賊從另一條巷子溜走了。街上的人看你的眼神有點失望。' + gain({ fame: -1 })),
      OPT('e', '追上他：「錦盒分我一半。」' + ODDS('agi', 12), () => { const r = ROLLT('agi', 12); return r.line + (r.ok ? '賊嚇得腿軟，乖乖分了你一半。' + gain({ silver: 80, moral: -5 }) : '你沒追上。'); }),
      OPT('n', '不管閒事', () => '你看著那個身影越過一個又一個屋頂，直到看不見。')] },

  { id: 'aw_clever', type: '奇遇', title: '太學門前的辯難', ctx: ['city'], w: 12, art: 'city', cond: s => hasT('clever') && s.lv >= 2,
    text: '書院門口，兩個書生為「天道有常，還是人事可為」吵得面紅耳赤，圍觀的人越聚越多。一個老儒生捋著鬍子看向你：「這位後生，你怎麼看？」',
    choices: () => [
      OPT('n', '引《荀子》「天行有常」，駁倒兩邊' + ODDS('int', 13), () => { const r = ROLLT('int', 13); return r.line + (r.ok ? '你先肯定了兩人的長處，再一句一句剖開他們的漏洞。吵嚷的人群漸漸靜下來，老儒生撫掌大笑：「後生可畏！」他送了你一卷自己的筆記。' + gain({ fame: 5, qi: 1 }) + addItem('xinde') + awakeNow('clever') : '你張嘴說了幾句，被其中一個書生引《春秋》駁得啞口無言，場面一陣哄笑。' + gain({ fame: -1 }) + qiLoss(1)); }),
      OPT('n', '「兩位都有道理。」和稀泥', () => '兩個書生互相瞪了一眼，各自拂袖而去。老儒生搖頭：「圓滑有餘，鋒芒不足。」' + gain({ qi: 1 })),
      OPT('e', '偷偷把他們的辯詞抄下來，賣給別的書生', () => '一份辯詞賣了三十錢。你賺得很快，也走得很快。' + gain({ silver: 30, moral: -2 })),
      OPT('n', '擠出人群走開', () => '你在人群外聽了半刻鐘，覺得兩個人都沒說到點子上。')] },

  { id: 'aw_vigor', type: '奇遇', title: '漲水的河', ctx: ['travel', 'wild'], w: 12, art: 'river', cond: s => hasT('vigor') && s.lv >= 2,
    text: '春汛剛過，河水暴漲，渡船早被沖走了。對岸的村子有人急病，等著一包救命的藥材，可河面渾黃一片，連漁夫都不敢下水。',
    choices: () => [
      OPT('g', '把藥簍綁在頭頂，泅水過河' + ODDS('con', 13), () => { const r = ROLLT('con', 13); return r.line + (r.ok ? '你在激流裡撐了一刻鐘，爬上對岸時渾身凍得發紫。藥材送到了，病人在天黑前退了燒。村裡人給你煮了一鍋薑湯。' + gain({ moral: 6, fame: 5, qi: 1 }) + awakeNow('vigor') : '浪頭打來，你嗆了好幾口水，被沖下了幾十丈才爬上岸。藥簍丟了。' + hurt(1) + qiLoss(1)); }),
      OPT('n', '繞到上游的橋，多走兩天', () => { advance(2); return '你繞了兩天的路。藥送到時，病人已經沒氣了。' + gain({ qi: -1 }); }),
      OPT('e', '把藥材賣給岸邊出高價的商人', () => '商人給了你一百錢，把藥材塞進了自己的貨箱。你說不清自己是什麼滋味。' + gain({ silver: 100, moral: -7 }) + qiLoss(1)),
      OPT('n', '等水退', () => '你在岸邊坐了一夜。第二天水退了，可有人已經等不及了。' + gain({ qi: -1 }))] },

  { id: 'aw_charming', type: '奇遇', title: '席上調停', ctx: ['city'], w: 12, art: 'love', cond: s => hasT('charming') && s.lv >= 2,
    text: '兩家人為了一樁婚事在酒席上吵了起來，案几都翻了。新娘縮在角落裡哭，兩家的長輩互相指著鼻子罵。主人一眼看見你，眼睛一亮：「這位客人，能不能幫忙說句話？」',
    choices: () => [
      OPT('g', '走到中間，把兩邊的話一句一句說開' + ODDS('cha', 13), () => { const r = ROLLT('cha', 13); return r.line + (r.ok ? '你先給兩邊的長輩各遞了一碗酒，再慢慢把話題引到了孩子們身上。吵嚷的聲音一點點小下去，新娘擦乾了眼淚。兩家人臨走硬是塞給你一包喜餅和謝禮。' + gain({ fame: 5, silver: 30, qi: 1 }) + awakeNow('charming') : '你一開口，兩邊的長輩同時轉向你：「你是誰家的人，也來插嘴？」你被轟出了門外。' + gain({ fame: -1 }) + qiLoss(1)); }),
      OPT('n', '陪新娘說幾句話，讓她別哭', () => '你搬了張凳子坐在她身旁，什麼也沒說，只是陪著。她哭完了，輕輕說了聲謝謝。' + gain({ qi: 1, moral: 1 })),
      OPT('e', '趁亂摸走案上的賀禮', () => '亂成一團的席面上，沒人看你的手。' + gain({ silver: 45, moral: -4 })),
      OPT('n', '「與我無關。」走開', () => '你在門口聽見裡面又吵了起來。')] },

  { id: 'aw_lucky', type: '奇遇', title: '投壺', ctx: ['city'], w: 12, art: 'city', cond: s => hasT('lucky') && s.lv >= 2,
    text: '客舍裡的客人在玩投壺，壺口細得像針眼，一支矢要投得又輕又準。莊家把二十錢拍在案上：「連中三矢者，賠十倍！」旁邊圍著看熱鬧的人，沒有一個敢上來。',
    choices: s => [
      OPT('n', '押二十錢，投三矢' + ODDS('luck', 12), () => { const r = ROLLT('luck', 12); return r.line + (r.ok ? '第一矢進了壺口，第二矢蹭著壺耳彈進去，第三矢——在空中打了個旋，穩穩地落進壺裡。滿堂叫好，莊家的臉色綠了。' + gain({ silver: 180, fame: 4, qi: 1 }) + awakeNow('lucky') : '第一矢就偏了。你輸了二十錢。' + gain({ silver: -20 }) + qiLoss(1)); }, { req: money(20), reqT: '需 20 錢' }),
      OPT('e', '偷偷把壺口蠟高一點' + ODDS('agi', 12), () => { const r = ROLLT('agi', 12); return r.line + (r.ok ? '你的矢三矢全中。莊家看了看壺口，什麼也沒說，付了錢。' + gain({ silver: 120, moral: -3 }) : '莊家一把抓住你的手腕：「蠟是你抹的？」你被轟了出去。' + gain({ fame: -3 })); }),
      OPT('n', '在一旁看', () => '你看了半天，沒見誰投中過三矢。')] },

  { id: 'aw_good', type: '奇遇', title: '饑村', ctx: ['travel', 'city'], w: 12, art: 'road', cond: s => hasT('good') && s.moral >= 30 && s.lv >= 2,
    text: '村口躺著三十幾個流民，一個婦人把最後一點糠粥分給孩子，自己舔著空碗。你身上的錢不多，可這會兒，只有你能幫他們。',
    choices: () => [
      OPT('g', '花 100 錢買糧，連夜熬粥', () => '你敲開糧店的門，把錢拍在櫃上。那一夜，三口大鍋在村口冒著熱氣，流民們一碗一碗地接著，沒有一個人說話。天亮時，那個婦人跪下來，你把她扶了起來。' + gain({ silver: -100, moral: 10, fame: 8, qi: 2 }) + awakeNow('good'), { req: money(100), reqT: '需 100 錢' }),
      OPT('g', '把草藥和乾糧全分出去（草藥 3 株）', () => { addItem('herb', -3); return '你把行囊裡能吃的、能入藥的都倒了出來。婦人捧著一株草藥，不知道該說什麼，只是一直點頭。' + gain({ moral: 8, fame: 5, qi: 1 }) + awakeNow('good'); }, { req: s => (s.inv.herb || 0) >= 3, reqT: '需草藥 3 株' }),
      OPT('e', '趁他們餓得沒力氣，搜走幾個人身上僅有的東西', () => '你搜走了十幾枚錢。一個孩子睜著大眼睛看你，你轉開了視線。' + gain({ silver: 15, moral: -8 }) + qiLoss(2)),
      OPT('n', '繞開走，裝作沒看見', () => '你加快腳步，把一片微弱的呻吟聲甩在身後。' + gain({ moral: -3 }) + qiLoss(1))] },

  { id: 'aw_evil', type: '奇遇', title: '血夜', ctx: ['travel', 'wild'], w: 12, art: 'night', cond: s => hasT('evil') && s.moral <= -30 && s.lv >= 2,
    text: '夜路上遇見一夥押送災民的差役，火把照得四下通紅。他們正把不肯交錢的百姓往河裡推，岸邊的哭聲連成一片。領頭的差役回頭，看見了你的兵刃：「走開，不關你的事。」',
    choices: () => [
      OPT('e', '殺了差役，搶走他們押送的錢', () => win(foe('押送差役', 3, 0.6, 'blade'), () => '你踩著差役的屍體，把押送的錢袋一個個割了下來。河裡的百姓有人爬上了岸，卻沒人敢看你一眼。火光裡，你覺得自己的影子比平時長了一些。' + gain({ silver: 120, moral: -8, fame: 5 }) + awakeNow('evil'), () => '你被差役們打倒在地，扔進了河邊的蘆葦叢。血順著水流飄遠了。' + qiLoss(1), { noFlee: true })),
      OPT('g', '出手制止差役', () => win(foe('押送差役', 3, 0.6, 'blade'), () => '差役們被你打退，百姓一個個爬上了岸。一個老人拉著你的衣襬，不停地磕頭。你有點不習慣這種被人感謝的感覺。' + gain({ moral: 10, fame: 8 }), () => '你寡不敵眾，被打得滿身是傷。差役們押著人走了。' + qiLoss(1), { noFlee: true })),
      OPT('n', '袖手旁觀，看他們走遠', () => '火把一點一點消失在夜裡。你站了很久，才發現自己的手一直攥著刀柄。')] },
];
EVENTS.push(...AWAKE_EV);

/* ================================================================
   2. 能力夠高才開得出來的選項（12 點以上）
   ================================================================ */
{
  const addOpt = (id, opt) => { const e = EVENTS.find(x => x.id === id); if (!e) return; if (Array.isArray(e.choices)) e.choices.push(opt); else if (typeof e.choices === 'function') { const orig = e.choices; e.choices = s => [...orig(s), opt]; } };
  const addCardOpt = (id, opt) => { const c = CARDS.find(x => x.id === id); if (c && c.opts) c.opts.push(opt); };
  addOpt('hn_tax', OPT('g', '以口才說服亭長寬限（魅力 12）', () => '你引《漢律》，一條一條說給亭長聽，說到最後，連旁邊的亭卒都在點頭。亭長咳了一聲，勉強答應寬限到秋收。老農拉著你的手，說不出話。' + gain({ moral: 4, fame: 4, qi: 1 }), { req: s => s.stats.cha >= 12, reqT: '需魅力 12' }));
  addOpt('hn_mart', OPT('g', '一眼看出馬是偷來的，報給市吏（悟性 12）', () => '你繞著馬走了一圈，指出馬蹄上的鐵掌是北邊部落才打的樣式，漢商卻咬定是自己養大的。市吏一查，馬真是偷來的。你因此得了五十錢的賞。' + gain({ silver: 50, fame: 5, moral: 2 }), { req: s => s.stats.int >= 12, reqT: '需悟性 12' }));
  addOpt('j_bully', OPT('g', '正色斥責，讓家奴自己退下（魅力 12）', () => '你上前一步，聲音不高，可句句像釘子：「光天化日，逼良為賤，你家主人是想讓縣令來問話？」家奴們你看我、我看你，悻悻地走了。老人拉著孫女，向你深深一揖。' + gain({ moral: 5, fame: 6, qi: 1 }), { req: s => s.stats.cha >= 12, reqT: '需魅力 12' }));
  addOpt('b_bandit', OPT('g', '單手把攔路的樹幹推回去（臂力 12）', () => '你走上前，單手抓住那根碗口粗的樹幹，往旁邊一推。山賊們看呆了，領頭的乾笑一聲，帶著人讓開了路。' + gain({ fame: 4 }) + (battleXp(40) || ''), { req: s => s.stats.str >= 12, reqT: '需臂力 12' }));
  addOpt('hx_toll', OPT('g', '單手搬開樹幹，凜然而過（臂力 12）', () => '你把那根樹幹拎起來扔在路邊。流民們面面相覷，其中一個小聲說：「這位是好漢。」他們什麼也沒要，還給你讓出了一條道。' + gain({ fame: 3, qi: 1 }), { req: s => s.stats.str >= 12, reqT: '需臂力 12' }));
  addOpt('hx_scholar', OPT('g', '陪他對弈一局（悟性 12）', () => '他醉眼惺忪地擺開棋子，你們你來我往殺了三十手。他忽然清醒過來，拍著大腿：「好棋！」他把一卷自己抄的兵書塞給了你。' + gain({ int: 1, qi: 1 }) + addItem('xinde'), { req: s => s.stats.int >= 12, reqT: '需悟性 12' }));
  addCardOpt('a_river', Object.assign($g(P('下水拉纖，幫船夫把船推過淺灘（臂力 12）', ['你和船夫一起把船推過了淺灘。船夫笑得見牙不見眼，不但不收你的錢，還送了你一條熏魚。', { moral: 3, fame: 2, hp: 0 }, XPN(60)])), { plain: true, req: s => s.stats.str >= 12, reqT: '需臂力 12' }));
  addCardOpt('c_guard', Object.assign($g(P('報上姓名來意，亭卒肅然放行（魅力 12）', ['亭卒聽完你的來歷，肅然行了個禮，還替你指了最近的客舍。'])), { plain: true, req: s => s.stats.cha >= 12, reqT: '需魅力 12' }));
}

/* ================================================================
   1. 結局矩陣：名聲 × 俠義
   ================================================================ */
const END_DEATH = {
  '惡-低': ['野地裡的白骨', '你倒在了荒野上，沒有人收殮。亂世裡死人太多，烏鴉和野狗不挑食，過了一個冬天，你的骨頭就和路邊的石頭分不清了。'],
  '惡-中': ['人人唾棄的惡徒', '你死在了一條沒人記得名字的路上。縣寺裡有人翻了翻通緝的木牘，把你的名字劃掉了——倒也算了結了一樁案子。'],
  '惡-高': ['被歡慶的死訊', '你的死訊傳開那天，酒肆裡不少人多喝了一碗。\n「聽說那個惡人終於死了？」「死了好，死了好。」他們一邊乾杯，一邊你一句我一句地猜你是怎麼死的，每個人說的都不一樣。'],
  '中-低': ['路邊的土堆', '你的墳是路邊一個小土堆，插著一根削尖的木棍。過路的人看見了，也許會想：又死了一個。然後走過去。'],
  '中-中': ['一個普通的遊俠', '你不是英雄，也不是惡人，只是亂世裡一個普通的遊俠。有人為你燒了一刀紙，也有人在酒肆裡提起你時，說了句：「可惜了，是個好手。」'],
  '中-高': ['聞名郡縣的壯士', '你的名字在郡縣間傳了很多年。有人在你倒下的地方立了一塊石碑，刻著：「某某，壯士也。」雖然他們對你的生平知道得並不多。'],
  '善-低': ['一朵白花', '你沒能做成什麼大事，可你幫過的人都記得你。他們湊錢給你買了一口薄棺，墳前放了一朵田野裡摘來的白花。'],
  '善-中': ['鄉里的好鄰居', '你死的消息傳回來，被你幫助過的鄉里人都來了。他們把你葬在村口的老槐樹下，墓碑上刻：「好鄰居長眠於此。」'],
  '善-高': ['碑上的名字', '亂世裡死的人太多，可你不一樣。百姓在你倒下的地方立了祠，每年秋天都有人去燒香。老人給孩子講你的故事，講到一半，總要擦擦眼睛。'],
};
const END_RETIRE = {
  '惡-低': ['孤老終身', '你隱居在一間漏雨的茅屋裡，沒有朋友，也沒有仇人上門——年輕時結下的仇家，大概都比你先死了。'],
  '惡-中': ['惡名遠揚的隱者', '你隱居山中，可山下的人只要一提起你的名字，就把孩子拉到身後。你偶爾會想，若當年多做幾件好事，現在的日子會不會不一樣。'],
  '惡-高': ['一代梟雄', '你的名字讓一方百姓聞風喪膽，也讓一方豪強不敢小看。晚年你在高牆大院裡閉門不出，院門外每天都有人排隊，不是來拜訪，是來求你放過。'],
  '中-低': ['江湖過客', '你在亂世裡走了一遭，沒留下什麼名字。可那些年的風雨和酒，你自己記得。'],
  '中-中': ['郡縣名宿', '你算不上天下第一，但走到哪裡，總有人願意敬你一杯酒。晚年你常坐在酒肆角落，聽人講你當年的故事，偶爾小聲糾正一兩句。'],
  '中-高': ['亂世遊俠', '你在那個英雄輩出的年代裡走過一遭，自己也闖出了一點名堂。後人讀史，讀到那幾個大名字的時候，旁邊的小字注裡，也許有你的一筆。'],
  '善-低': ['耕讀終老', '你在村外買了幾畝薄田，白天種地，晚上讀書。鄰居都知道你曾經是個遊俠，可沒人見過你拔劍。'],
  '善-中': ['鄉里敬重的長者', '你成了村裡最受敬重的老人。鄉鄰有事都來找你評理，孩子們纏著你講當年的故事，你講的總是幫過誰，而不是殺過誰。'],
  '善-高': ['一代大俠', '你的事蹟被講古的人編成了段子，在市井酒肆裡一講就是幾十年。有人說你是大俠，你擺擺手：「我只是沒走歪。」'],
};
const END_BREAK = {
  '惡-低': ['瘋在荒野', '你在一條沒人的路上忽然笑了起來，笑著笑著就哭了。後來有人說，在荒野裡見過一個自言自語的瘋子，對著空氣說對不起。再後來，就沒人見過了。'],
  '惡-高': ['被自己的惡名壓垮', '你的名字讓許多人睡不著，最先睡不著的卻是你自己。夜裡，那些被你傷害過的人一個個回來看你。你最後一次睜開眼睛的時候，窗外的天是亮的。'],
  '中-低': ['失魂落魄的人', '一路上的事太多，你的心先於你的身體停了。有人在客舍的角落裡發現了你，你坐在那裡，眼睛睜著，卻什麼也看不見。'],
  '中-高': ['心力交瘁的名士', '你的名聲不小，可誰也不知道你這些年是怎麼撐過來的。有一天你放下兵刃，說自己累了，從此再也沒有站起來。鄉里人說，你是力盡而終。'],
  '善-低': ['倒在慈悲裡', '你總想幫每一個人，可世道太大，你的心太小。最後那個冬天，你替一個陌生孩子蓋上了自己的衣服，自己卻沒有再醒來。'],
  '善-高': ['憂世而終', '你看過太多不該看的，也幫過太多不該你幫的。有人說你是想救天下，所以把自己耗乾了。你的墳前常有人放一束野花，沒有人說得出，這是為誰放的。'],
};
const endKeyBreak = () => (S.moral <= -30 ? '惡' : S.moral >= 30 ? '善' : '中') + '-' + (S.fame < 200 ? '低' : '高');
const endKey = () => {
  const f = S.fame, m = S.moral;
  return (m <= -30 ? '惡' : m >= 30 ? '善' : '中') + '-' + (f < 100 ? '低' : f < 400 ? '中' : '高');
};
{
  const _retire = retire;
  retire = function (reason) {
    _retire(reason);
    if (!UI.end || !S) return;
    const brk = reason === '崩潰', table = reason === '戰死' ? END_DEATH : brk ? END_BREAK : END_RETIRE, k = brk ? endKeyBreak() : endKey(), e = table[k];
    let text = e[1];
    const sn = typeof histCount === 'function' ? histCount('seen') : 0;
    if (S.spouse && NPCS[S.spouse]) text += reason === '戰死' ? `\n\n${NPCS[S.spouse].n}守著你留下的那柄舊劍，一等就是很多年。` : `\n\n${NPCS[S.spouse].n}陪你走完了最後一程，家裡總有人等你回來。`;
    if (S.child) text += `\n\n「${S.child}」長大後，常聽人講起你的故事。`;
    if (sn >= 4) text += `\n\n這一生裡，你親眼看過${cnNum(sn)}件後來寫進史書的大事。`;
    if (S.npcs && S.npcs.liubei && S.npcs.liubei.fav >= 40) text += '\n\n許多年後，聽說有位自稱中山靖王之後的人，在蜀地稱了帝。你想起樓桑村那個賣草鞋的人，笑了笑，什麼也沒說。';
    UI.end.title = e[0]; UI.end.text = text; UI.end.key = k;
    render();
  };
}
