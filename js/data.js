/* 江湖歲月錄 — 資料：地點、門派、武功、物品、人物 */
'use strict';

const VERSION = 'v0.4.0';
// 人物立繪：LinXueLian（linxuelian.itch.io）手繪素材，CC BY-SA 4.0，經合成與裁切
const FACES = ['su', 'hua', 'li', 'gu', 'shen', 'qin', 'elder', 'boss', 'kid'];
const ERA = '天啟';

/* ---------- 地點 ---------- */
const LOCS = {
  luoyang:  { n: '洛陽城',   kind: 'city', art: 'city',     x: 50, y: 45, d: '天下之中，九月英雄會在此舉行。街市繁華，三教九流匯聚。' },
  linan:    { n: '臨安城',   kind: 'city', art: 'river',    x: 80, y: 70, d: '煙雨江南，畫舫如織。富商巨賈與風流劍客都愛在此流連。' },
  cangmang: { n: '蒼莽山',   kind: 'wild', art: 'mountain', x: 38, y: 42, danger: 0.7, d: '古木參天，山賊與猛獸出沒，卻也藏著前人遺跡。' },
  hanhai:   { n: '瀚海大漠', kind: 'wild', art: 'desert',   x: 10, y: 15, danger: 1.25, d: '黃沙萬里，馬賊橫行。傳說沙下埋著古國寶藏。' },
  tianlan:  { n: '天嵐山',   kind: 'sect', art: 'peak',     x: 25, y: 35, sect: 'tianlan', d: '雲海之上的劍宗山門，石階三千級。' },
  bore:     { n: '嵩嶽般若寺', kind: 'sect', art: 'temple', x: 60, y: 38, sect: 'bore', d: '千年古剎，晨鐘暮鼓，武僧在院中練拳。' },
  xuanzhen: { n: '紫霄峰玄真觀', kind: 'sect', art: 'taoist', x: 40, y: 60, sect: 'xuanzhen', d: '道觀隱於松風之間，觀中道人講究以靜制動。' },
  baihua:   { n: '百花谷',   kind: 'sect', art: 'valley',   x: 68, y: 82, sect: 'baihua', d: '四季花開不敗的幽谷，谷主醫毒雙絕。' },
  xuesha:   { n: '血煞崖',   kind: 'sect', art: 'cliff',    x: 15, y: 70, sect: 'xuesha', d: '赤色絕壁上的魔教總壇，正道中人聞之色變。' },
  fengchen: { n: '老君渡',   kind: 'sect', art: 'dock',     x: 58, y: 52, sect: 'fengchen', d: '黃河渡口，風塵幫總舵所在。船伕、腳伕、乞兒皆是幫眾耳目。' },
};

/* ---------- 武功 ----------
   type: nei 內功 / sword 劍法 / blade 刀法 / fist 拳掌 / dart 暗器 / qing 輕功
   attr: yang 陽剛 / yin 陰柔 / he 中和
   moves: [名稱, 解鎖層數, 耗內力, 威力, 特效]  特效: bleed 流血 poison 中毒 stun 震暈 weak 破勢 drain 吸血 pierce 破防 */
const TYPE_N = { nei: '內功', sword: '劍法', blade: '刀法', fist: '拳掌', dart: '暗器', qing: '輕功' };
const ATTR_N = { yang: '陽剛', yin: '陰柔', he: '中和' };
const TIER_N = ['', '入門', '上乘', '絕學'];
const FX_N = { bleed: '流血', poison: '中毒', stun: '震暈', weak: '破勢', drain: '吸血', pierce: '破防' };

const SKILLS = {
  basic_fist: { n: '基本拳腳', type: 'fist', tier: 1, attr: 'he', d: '行走江湖的粗淺功夫。', moves: [['直拳', 1, 0, 8], ['連環腿', 4, 4, 15]] },
  tuna:       { n: '吐納術', type: 'nei', tier: 1, attr: 'he', hp: 6, mp: 5, d: '調勻呼吸、積蓄內息的入門法門。' },

  // 天嵐劍宗
  tl_sword: { n: '天嵐劍法', type: 'sword', tier: 1, attr: 'he', sect: 'tianlan', d: '劍勢如山嵐流轉，輕靈迅捷。', moves: [['嵐起', 1, 3, 14], ['風捲殘雲', 4, 8, 23], ['嵐霧千重', 7, 14, 33, 'weak']] },
  tl_cloud: { n: '流雲十三劍', type: 'sword', tier: 2, attr: 'he', sect: 'tianlan', d: '十三式連綿不絕，一劍快過一劍。', moves: [['流雲出岫', 1, 8, 25], ['雲海無涯', 4, 14, 37, 'bleed'], ['十三劍齊出', 7, 24, 56]] },
  tl_nei:   { n: '清風訣', type: 'nei', tier: 2, attr: 'he', sect: 'tianlan', hp: 9, mp: 10, d: '內息如清風徐來，綿長不絕。' },
  tl_qing:  { n: '踏雲步', type: 'qing', tier: 2, attr: 'he', sect: 'tianlan', dodge: 2.2, d: '足踏雲氣，進退如意。' },
  tl_ult:   { n: '天嵐一劍', type: 'sword', tier: 3, attr: 'he', sect: 'tianlan', d: '劍宗不傳之秘，千招歸於一劍。', moves: [['一劍西來', 1, 14, 40, 'pierce'], ['雲開見日', 4, 22, 58], ['天嵐一劍', 8, 40, 92, 'pierce']] },

  // 般若寺
  br_fist: { n: '羅漢拳', type: 'fist', tier: 1, attr: 'yang', sect: 'bore', d: '般若寺入門拳法，一招一式紮實剛猛。', moves: [['羅漢撞鐘', 1, 2, 13], ['降龍式', 4, 8, 23], ['伏虎式', 7, 13, 32, 'stun']] },
  br_palm: { n: '金剛伏魔掌', type: 'fist', tier: 2, attr: 'yang', sect: 'bore', d: '掌力雄渾，專破邪魔外道。', moves: [['金剛怒目', 1, 8, 26], ['伏魔印', 4, 15, 38, 'stun'], ['萬佛朝宗', 7, 26, 58]] },
  br_nei:  { n: '般若心經', type: 'nei', tier: 2, attr: 'yang', sect: 'bore', hp: 14, mp: 7, d: '佛門正宗內功，築基深厚，氣血綿長。' },
  br_ult:  { n: '大悲千葉手', type: 'fist', tier: 3, attr: 'yang', sect: 'bore', d: '掌影如千葉紛飛，寺中百年無人練成。', moves: [['千葉初綻', 1, 14, 40], ['慈航普渡', 4, 22, 54, 'stun'], ['大悲無量', 8, 40, 94]] },

  // 玄真觀
  xz_sword: { n: '兩儀劍法', type: 'sword', tier: 1, attr: 'he', sect: 'xuanzhen', d: '一陰一陽，攻守相生。', moves: [['陰陽分曉', 1, 3, 13], ['兩儀交泰', 4, 8, 22, 'weak'], ['混沌初開', 7, 14, 33]] },
  xz_palm:  { n: '綿雲掌', type: 'fist', tier: 2, attr: 'yin', sect: 'xuanzhen', d: '以柔克剛，掌力綿綿如雲。', moves: [['雲手', 1, 7, 23, 'weak'], ['四兩撥千斤', 4, 14, 36], ['雲捲雲舒', 7, 24, 54, 'weak']] },
  xz_nei:   { n: '玄真一炁功', type: 'nei', tier: 2, attr: 'he', sect: 'xuanzhen', hp: 8, mp: 13, d: '道家玄門正宗，內力精純，後勁無窮。' },
  xz_qing:  { n: '凌虛步', type: 'qing', tier: 2, attr: 'he', sect: 'xuanzhen', dodge: 2.0, d: '步踏七星，身如飄絮。' },
  xz_ult:   { n: '太虛劍意', type: 'sword', tier: 3, attr: 'he', sect: 'xuanzhen', d: '無招無式，劍意所至，萬物皆可為劍。', moves: [['無極', 1, 14, 38, 'weak'], ['太虛引', 4, 22, 56, 'pierce'], ['萬象歸虛', 8, 40, 90, 'pierce']] },

  // 百花谷
  bh_dart: { n: '飛花針', type: 'dart', tier: 1, attr: 'yin', sect: 'baihua', d: '細針藏於花間，中者不覺。', moves: [['飛針', 1, 2, 11, 'poison'], ['梨花帶雨', 4, 8, 20, 'poison'], ['花落無聲', 7, 13, 31, 'pierce']] },
  bh_star: { n: '萬蕊飛星', type: 'dart', tier: 2, attr: 'yin', sect: 'baihua', d: '一手撒出，如萬點花蕊、漫天星雨。', moves: [['星雨', 1, 8, 23, 'poison'], ['亂蕊迷眼', 4, 14, 34, 'weak'], ['萬蕊飛星', 7, 25, 55, 'poison']] },
  bh_nei:  { n: '百花凝露功', type: 'nei', tier: 2, attr: 'yin', sect: 'baihua', hp: 8, mp: 10, heal: 1, d: '取百花精露之意，療傷之效倍增。' },
  bh_qing: { n: '穿花步', type: 'qing', tier: 2, attr: 'yin', sect: 'baihua', dodge: 2.4, d: '穿花拂柳，片葉不沾。' },
  bh_ult:  { n: '天羅千機手', type: 'dart', tier: 3, attr: 'yin', sect: 'baihua', d: '十指連發，暗器布成天羅地網。', moves: [['千機引', 1, 14, 38, 'poison'], ['天羅', 4, 22, 54, 'weak'], ['千機盡出', 8, 40, 90, 'pierce']] },

  // 血煞教
  xs_blade: { n: '血煞刀法', type: 'blade', tier: 1, attr: 'yin', sect: 'xuesha', d: '刀刀見血，狠辣無情。', moves: [['血刃', 1, 3, 15, 'bleed'], ['斷筋', 4, 8, 24, 'bleed'], ['血濺五步', 7, 14, 35]] },
  xs_shura: { n: '修羅斷魂刀', type: 'blade', tier: 2, attr: 'yin', sect: 'xuesha', d: '以殺養刀，刀下亡魂越多，刀勢越凶。', moves: [['修羅顯相', 1, 8, 27, 'bleed'], ['噬魂', 4, 15, 38, 'drain'], ['斷魂一刀', 7, 26, 60]] },
  xs_nei:   { n: '血煞魔功', type: 'nei', tier: 2, attr: 'yin', sect: 'xuesha', hp: 12, mp: 12, evil: 1, d: '進境奇快的魔功，練得越深，心性越冷。' },
  xs_ult:   { n: '血河滔天', type: 'blade', tier: 3, attr: 'yin', sect: 'xuesha', d: '教主絕學，刀氣化作血河，席捲八方。', moves: [['血河初湧', 1, 14, 42, 'bleed'], ['萬魂噬心', 4, 22, 56, 'drain'], ['血河滔天', 8, 40, 96, 'bleed']] },

  // 風塵幫
  fc_palm:  { n: '風塵掌', type: 'fist', tier: 1, attr: 'yang', sect: 'fengchen', d: '市井中打磨出的實戰掌法，不好看但管用。', moves: [['劈柴', 1, 2, 13], ['推山', 4, 8, 24], ['風塵三疊', 7, 13, 33]] },
  fc_drunk: { n: '醉八仙拳', type: 'fist', tier: 2, attr: 'yang', sect: 'fengchen', d: '形醉意不醉，東倒西歪間暗藏殺招。', moves: [['醉步撞肩', 1, 7, 24], ['仙人敬酒', 4, 14, 36, 'stun'], ['八仙過海', 7, 24, 56]] },
  fc_nei:   { n: '混元勁', type: 'nei', tier: 2, attr: 'yang', sect: 'fengchen', hp: 12, mp: 8, d: '苦力漢子練出的渾厚勁力，挨得起打。' },
  fc_qing:  { n: '遊龍步', type: 'qing', tier: 2, attr: 'yang', sect: 'fengchen', dodge: 2.0, d: '人群中穿梭如遊龍。' },

  // 江湖雜學
  m_blade: { n: '破風刀法', type: 'blade', tier: 1, attr: 'yang', d: '鏢行常見的刀法，大開大闔。', moves: [['力劈', 1, 3, 15], ['橫掃千軍', 4, 8, 24], ['破風', 7, 14, 34, 'pierce']] },
  m_dart:  { n: '袖箭術', type: 'dart', tier: 1, attr: 'he', d: '袖底藏機，出其不意。', moves: [['袖箭', 1, 2, 12], ['連珠', 4, 8, 22], ['回馬箭', 7, 13, 32, 'pierce']] },

  // 奇遇・傳承絕學
  q_thunder: { n: '九霄雷音訣', type: 'nei', tier: 3, attr: 'yang', hp: 17, mp: 14, d: '至陽至剛，運功時隱有風雷之聲。' },
  q_ice:     { n: '寒魄冰心訣', type: 'nei', tier: 3, attr: 'yin', hp: 12, mp: 19, d: '至陰至柔，心如冰鏡，萬念不起。' },
  q_swan:    { n: '孤鴻劍法', type: 'sword', tier: 3, attr: 'yin', d: '劍如孤鴻掠影，來去無蹤。', moves: [['孤鴻掠影', 1, 13, 40], ['寒塘渡鶴', 4, 21, 56, 'bleed'], ['一鴻驚天', 8, 38, 92, 'pierce']] },
  q_king:    { n: '霸王刀', type: 'blade', tier: 3, attr: 'yang', d: '力拔山兮氣蓋世，一刀既出，有進無退。', moves: [['破釜', 1, 13, 42], ['沉舟', 4, 21, 58, 'stun'], ['霸王卸甲', 8, 38, 96, 'pierce']] },
  q_shadow:  { n: '驚鴻照影', type: 'qing', tier: 3, attr: 'he', dodge: 3.4, d: '身法之極致，敵人只見殘影。' },
};

/* ---------- 門派 ---------- */
const RANKS = ['外門弟子', '內門弟子', '真傳弟子', '長老', '掌門'];
const RANK_NEED = [0, 100, 300, 700];   // 晉升所需累計貢獻
const SECTS = {
  tianlan: { tasks: ['下山採買劍胚與磨石', '護送宗門信使過山', '在洗劍池打磨同門佩劍', '指點新入門的師弟師妹練劍'], n: '天嵐劍宗', loc: 'tianlan', align: 1, master: '凌虛子', style: '劍法・輕靈迅捷',
    d: '正道劍宗之首，門規森嚴，只收悟性上佳者。', req: s => s.stats.int >= 6, reqT: '悟性須達 6',
    teach: [['tl_sword', 0, 0], ['tl_nei', 1, 60], ['tl_qing', 1, 80], ['tl_cloud', 2, 160]], ult: 'tl_ult' },
  bore: { tasks: ['下山化緣、施粥濟貧', '護送香客過嵩嶽山道', '抄錄整理藏經閣典籍', '在羅漢堂陪練新入門的沙彌'], n: '般若寺', loc: 'bore', align: 1, master: '了塵方丈', style: '拳掌・剛猛厚重',
    d: '佛門武學淵源最深，重根基，戒殺生。', req: s => s.moral >= 0 && s.stats.con >= 6, reqT: '根骨須達 6，且非奸邪之徒',
    teach: [['br_fist', 0, 0], ['br_nei', 1, 60], ['br_palm', 2, 160]], ult: 'br_ult' },
  xuanzhen: { tasks: ['上山採集煉丹藥材', '為山下村民作法事祈福', '抄寫道藏經卷', '清掃紫霄峰三千石階'], n: '玄真觀', loc: 'xuanzhen', align: 1, master: '松鶴真人', style: '內功・以柔克剛',
    d: '道家玄門，內功冠絕天下，講究清靜無為。', req: s => s.stats.int >= 7, reqT: '悟性須達 7',
    teach: [['xz_sword', 0, 0], ['xz_nei', 1, 60], ['xz_qing', 1, 80], ['xz_palm', 2, 160]], ult: 'xz_ult' },
  baihua: { tasks: ['出谷為村民義診', '照料藥圃裡的奇花異草', '護送一批藥材去臨安藥行', '替谷主試新配的藥方'], n: '百花谷', loc: 'baihua', align: 0, master: '花谷主', style: '暗器・醫毒雙修',
    d: '不問正邪，只問緣分。谷中弟子精於醫術與暗器。', req: s => s.stats.cha >= 6 || s.stats.luck >= 7, reqT: '魅力須達 6，或福緣須達 7',
    teach: [['bh_dart', 0, 0], ['bh_nei', 1, 60], ['bh_qing', 1, 80], ['bh_star', 2, 160]], ult: 'bh_ult' },
  xuesha: { tasks: ['押送一批來路不明的貨物', '替教中收取各地分舵的供奉', '看守崖下地牢'], n: '血煞教', loc: 'xuesha', align: -1, master: '厲無咎', style: '刀法・狠辣詭譎',
    d: '邪道第一大教，強者為尊。入教者將為正道所不容。', req: s => s.moral <= 20, reqT: '俠義之名太盛者不收',
    teach: [['xs_blade', 0, 0], ['xs_nei', 1, 50], ['xs_shura', 2, 150]], ult: 'xs_ult' },
  fengchen: { tasks: ['在渡口替幫中兄弟排解糾紛', '沿街打探各路消息回報總舵', '押送一船糧米過黃河', '照看幫裡收留的孤兒'], n: '風塵幫', loc: 'fengchen', align: 0, master: '洪七爺', style: '拳掌・市井實戰',
    d: '天下第一大幫，販夫走卒皆兄弟，來者不拒。', req: () => true, reqT: '無',
    teach: [['fc_palm', 0, 0], ['fc_nei', 1, 50], ['fc_qing', 1, 70], ['fc_drunk', 2, 150]] , ult: null },
};

/* ---------- 物品 ---------- */
const ITEMS = {
  jinchuang: { n: '金創藥', kind: 'med', price: 30, hp: 70, d: '回復 70 氣血' },
  huiqi:     { n: '回氣散', kind: 'med', price: 40, mp: 45, d: '回復 45 內力' },
  dahuan:    { n: '大還丹', kind: 'med', price: 320, hp: 9999, mp: 9999, d: '氣血內力全滿' },
  herb:      { n: '草藥', kind: 'misc', price: 16, d: '可賣錢，百花谷弟子可煉成金創藥' },
  lingzhi:   { n: '千年靈芝', kind: 'tonic', price: 500, d: '服下後根骨+1、氣血上限+30' },
  wine:      { n: '陳年花雕', kind: 'gift', price: 60, d: '贈禮' },
  rouge:     { n: '蘇州胭脂', kind: 'gift', price: 60, d: '贈禮' },
  hairpin:   { n: '白玉簪', kind: 'gift', price: 150, d: '贈禮' },
  book:      { n: '前朝孤本', kind: 'gift', price: 120, d: '贈禮' },
  qin:       { n: '古琴譜', kind: 'gift', price: 120, d: '贈禮' },
  w_sword1:  { n: '鐵劍', kind: 'weapon', wt: 'sword', atk: 6, price: 80 },
  w_sword2:  { n: '青鋼劍', kind: 'weapon', wt: 'sword', atk: 14, price: 420 },
  w_sword3:  { n: '寒玉劍', kind: 'weapon', wt: 'sword', atk: 26, price: 0 },
  w_blade1:  { n: '鬼頭刀', kind: 'weapon', wt: 'blade', atk: 7, price: 90 },
  w_blade2:  { n: '百煉刀', kind: 'weapon', wt: 'blade', atk: 15, price: 440 },
  w_blade3:  { n: '隕鐵刀', kind: 'weapon', wt: 'blade', atk: 27, price: 0 },
  w_fist1:   { n: '鐵指套', kind: 'weapon', wt: 'fist', atk: 5, price: 70 },
  w_fist2:   { n: '精鋼護手', kind: 'weapon', wt: 'fist', atk: 12, price: 400 },
  w_dart1:   { n: '柳葉鏢', kind: 'weapon', wt: 'dart', atk: 6, price: 80 },
  w_dart2:   { n: '透骨釘', kind: 'weapon', wt: 'dart', atk: 14, price: 420 },
  a_cloth:   { n: '牛皮護甲', kind: 'armor', def: 4, price: 70 },
  a_gold:    { n: '金絲軟甲', kind: 'armor', def: 11, price: 520 },
  bk_blade:  { n: '《破風刀譜》', kind: 'manual', skill: 'm_blade', price: 150 },
  bk_dart:   { n: '《袖箭圖解》', kind: 'manual', skill: 'm_dart', price: 150 },
};
const SHOPS = {
  luoyang: ['jinchuang', 'huiqi', 'dahuan', 'w_sword1', 'w_sword2', 'w_blade1', 'w_blade2', 'w_fist1', 'w_fist2', 'a_cloth', 'wine', 'book', 'bk_blade'],
  linan:   ['jinchuang', 'huiqi', 'dahuan', 'w_dart1', 'w_dart2', 'w_sword1', 'a_cloth', 'a_gold', 'rouge', 'hairpin', 'qin', 'wine', 'bk_dart'],
};

/* ---------- 出身 ---------- */
const ORIGINS = [
  { n: '鏢師之後', d: '自幼隨父走鏢，筋骨結實。臂力+2 根骨+1，帶著家傳鐵指套。', st: { str: 2, con: 1 }, item: 'w_fist1' },
  { n: '書香門第', d: '飽讀詩書，一點就透。悟性+3，盤纏多 80 兩。', st: { int: 3 }, silver: 80 },
  { n: '山中獵戶', d: '攀岩逐鹿，身手矯健。身法+2 根骨+1，帶著幾株草藥。', st: { agi: 2, con: 1 }, herb: 4 },
  { n: '富商子弟', d: '錦衣玉食，談吐不俗。魅力+2 福緣+1，盤纏多 300 兩。', st: { cha: 2, luck: 1 }, silver: 300 },
  { n: '破廟孤兒', d: '吃百家飯長大，命硬。福緣+3 根骨+1，身上只有十幾文討來的銅錢。', st: { luck: 3, con: 1 }, silver: -108 },
];
const STAT_N = { str: '臂力', con: '根骨', int: '悟性', agi: '身法', luck: '福緣', cha: '魅力' };
const STAT_D = { str: '外功傷害', con: '氣血與防禦', int: '修煉速度', agi: '命中與閃避', luck: '奇遇與暴擊', cha: '人緣與情緣' };

/* ---------- 可結緣之人 ---------- */
const NPCS = {
  su: { n: '蘇晚晴', ta: '她', loc: 'tianlan', title: '天嵐劍宗師姐', like: 'qin', bonus: ['agi', 2],
    d: '白衣如雪，話少劍快。宗門上下都怕她，卻沒人說得出她哪裡不好。',
    meet: '山道上晨霧未散，一名白衣女子正在崖邊練劍，劍光斂處，一片落葉被齊齊削成四瓣。她收劍回頭，淡淡看了你一眼：「看夠了？這條路外人不該來。」',
    chat: ['你陪她在崖邊看了半日雲海，她只說了三句話，你卻覺得不算少。', '她指點了你握劍的手勢，指尖一觸即收。', '你講山下的趣事，她嘴角動了動，別過頭去看雲。'],
    stage: [
      { t: '蘇晚晴難得主動找你：「後山寒潭邊的雪蓮開了。……你若沒事，可以去看。」說完便走，走了幾步又停下等你。', a: ['並肩同去，一路無話也自在', 8], b: ['推說要練功，改日再去', -4] },
      { t: '她練功岔了氣，卻不肯讓同門知道，只來敲了你的門。燈下她臉色蒼白：「幫我護法一夜。此事不許說出去。」', a: ['守到天明，隻字不問', 10], b: ['勸她稟明師長，不可逞強', 2] },
      { t: '月下，她把佩劍的劍穗解下來遞給你：「劍宗的規矩，劍穗只贈一人。」她看著遠處，耳根卻紅了，「你若不要，就還我。」', a: ['收下劍穗，握住她的手', 15], b: ['沉默良久，把劍穗還給她', -30] },
    ] },
  hua: { n: '花弄影', ta: '她', loc: 'baihua', title: '百花谷醫女', like: 'rouge', bonus: ['con', 2],
    d: '谷主的關門弟子，愛笑，愛捉弄人，藥箱裡一半是救人的藥，一半是整人的藥。',
    meet: '你在谷口誤觸了花粉迷陣，頭暈眼花間，一個背著藥簍的少女蹲在你面前，笑得眉眼彎彎：「又一個不看告示的。張嘴，解藥有點苦——騙你的，是很苦。」',
    chat: ['她拉你去試新配的藥茶，你的舌頭麻了半個時辰，她笑了半個時辰。', '你幫她曬了一下午藥材，她往你懷裡塞了一包蜜餞。', '她教你辨認了七種毒草，考你時你只記得三種，被敲了額頭。'],
    stage: [
      { t: '花弄影要上山採一味只在夜裡開花的藥，谷主不准她獨行。她扯著你的袖子：「你陪我去嘛，我分你一半——一半功勞。」', a: ['提燈陪她走一夜山路', 8], b: ['說夜路太險，勸她別去', -3] },
      { t: '谷外送來一個中了奇毒的孩子，她三天三夜沒闔眼，終究沒能救回來。你找到她時，她一個人坐在藥圃裡，沒有哭，也沒有笑。', a: ['不說話，坐在她身邊陪著', 10], b: ['告訴她這不是她的錯', 5] },
      { t: '她塞給你一個香囊，裡頭是她親手配的百花香。「我配了十七次才配成這個味道，」她難得不笑，認真地看著你，「以後你走到哪裡，聞到它就得想起我。」', a: ['把香囊貼身收好：「不用聞也想。」', 15], b: ['打趣她：「裡面沒下毒吧？」然後還給她', -30] },
    ] },
  li: { n: '厲紅綃', ta: '她', loc: 'luoyang', title: '血煞教聖女', like: 'wine', bonus: ['str', 2],
    d: '紅衣烈烈，是教主的獨女。她在洛陽夜市裡喝酒時，沒人敢坐她鄰桌。',
    meet: '洛陽夜市，一名紅衣女子獨佔一桌，腳邊倒著三個想搭訕的潑皮。她把一碗酒推到桌子對面，抬眼看你：「你，看起來不怕我。坐下，喝。」',
    chat: ['你陪她喝到三更，她的酒量好得不像話。', '她問你正道的人是不是都很無趣，你想了想，沒有反駁。', '她在城牆上看了很久的燈火，說崖上看不到這些。'],
    stage: [
      { t: '幾名正道弟子認出了厲紅綃，拔劍將她圍住。她冷笑著按住刀柄，卻先看了你一眼——像是想知道你會站在哪一邊。', a: ['擋在中間：「今日她是我的客人。」', 9], b: ['退開一步，不插手', -6] },
      { t: '她喝醉了，第一次說起自己：「我爹教我的第一件事，是不要信任何人。」她把頭靠在你肩上，「你說，他是不是教錯了？」', a: ['「信我一個就夠了。」', 10], b: ['「你爹是為你好。」', 1] },
      { t: '她把一柄短刀拍在你面前：「血煞教的規矩，刀給了誰，命就給了誰。」她盯著你，眼裡有一點從沒見過的緊張，「正邪不兩立，你想清楚再接。」', a: ['接過短刀：「我接的是你，不是血煞教。」', 15], b: ['把刀推回去：「你我終究不是一路人。」', -30] },
    ] },
  gu: { n: '顧長風', ta: '他', loc: 'linan', title: '江南浪子劍客', like: 'wine', bonus: ['luck', 2],
    d: '一人一劍一壺酒，欠遍臨安酒樓的帳，卻沒有掌櫃真的討厭他。',
    meet: '臨安酒樓上，一個青衫男子正被掌櫃追著討酒錢。他翻身躍上欄杆，衝你一笑：「這位朋友面善得很，借我二兩銀子，改日請你看西湖最好的月色。」',
    chat: ['他帶你上屋頂喝酒，說這裡的月亮不收錢。', '他舞了一套劍，問你好不好看，你說好看，他說那是剛編的。', '你們在湖邊坐到天亮，他難得一句俏皮話都沒說。'],
    stage: [
      { t: '顧長風雇了一葉小舟，說要還你那二兩銀子的情。船到湖心他才承認銀子又花光了，只剩一壺酒、一輪月。「月色抵債，行不行？」', a: ['接過酒壺：「行，但要你唱一曲。」', 8], b: ['板起臉向他討債', -3] },
      { t: '有仇家找上門來，他把你推進暗巷，自己引開了追兵。再見時他左臂帶傷，仍笑著說沒事。你這才知道，他的浪蕩有一半是裝給人看的。', a: ['替他包紮，問他究竟在躲什麼', 10], b: ['責怪他把自己也拖下水', -5] },
      { t: '他把那柄從不離身的劍橫放在你膝上。「我這半生沒有家，劍在哪裡，我就在哪裡。」他少見地沒有笑，「現在我想把它放在你這裡。」', a: ['握住劍，也握住他的手', 15], b: ['把劍還他：「浪子就該浪跡天涯。」', -30] },
    ] },
  shen: { n: '沈墨言', ta: '他', loc: 'luoyang', title: '洛陽書肆主人', like: 'book', bonus: ['int', 2],
    d: '溫文爾雅的書肆主人，玄真觀俗家弟子。看似手無縛雞之力，實則內功深不可測。',
    meet: '你在洛陽書肆避雨，一卷書從高架上滑落，被一隻修長的手穩穩接住。青衣男子把書遞給你，溫聲道：「這本講的是劍理，卻沒有一招劍法。閣下若看得進去，雨停之前不妨讀完。」',
    chat: ['他為你煮了一壺茶，講了一段前朝武林舊事。', '你們對弈一局，他讓了你三子，你還是輸了。', '他替你批註了一頁心法，字跡清雋。'],
    stage: [
      { t: '沈墨言邀你去城外看一方古碑。碑文殘缺，他一字一句補全了念給你聽，末了笑道：「這些話我對著石頭說了十年，今日總算有人聽。」', a: ['請他再念一遍，你想記下來', 8], b: ['說自己對這些不感興趣', -4] },
      { t: '有人上書肆尋釁，他被推倒在地，始終沒有還手。夜裡你才得知，他曾因失手傷人立誓不再動武。他問你：「這樣的人，在江湖上算不算懦夫？」', a: ['「守得住誓言的人，比誰都強。」', 10], b: ['「江湖上，拳頭才是道理。」', -5] },
      { t: '他送你一方親手刻的印，印文只有兩個字——是你的名字。「我這人笨拙，不會說話，」他垂著眼，耳尖泛紅，「只會把想說的刻在石頭裡。」', a: ['取過印泥，把印蓋在他掌心', 15], b: ['讚他刻工好，把印收進行囊便告辭', -30] },
    ] },
};

/* ---------- 敵人招式池 ---------- */
const FOE_MOVES = {
  thug:   [['亂拳', 1.0], ['飛踢', 1.2]],
  blade:  [['劈砍', 1.0], ['攔腰一刀', 1.3], ['拖刀計', 1.6]],
  sword:  [['直刺', 1.0], ['連環三劍', 1.3], ['回風落雁', 1.6]],
  beast:  [['撲咬', 1.1], ['利爪', 1.3]],
  master: [['掌心雷', 1.1], ['隔空一指', 1.4], ['畢生絕學', 1.9]],
  demon:  [['血刃', 1.2], ['噬魂', 1.5], ['血河滔天', 2.1]],
  puppet: [['鐵臂橫掃', 1.2], ['機括連弩', 1.5]],
};
