/* 江湖歲月錄 — 資料：地點、門派、武功、物品、人物 */
'use strict';

const VERSION = 'v1.0.0';
// 人物立繪：LinXueLian（linxuelian.itch.io）手繪素材，CC BY-SA 4.0，經合成與裁切
const FACES = ['su', 'hua', 'li', 'gu', 'shen', 'qin', 'elder', 'boss', 'kid', 'pei'];

/* ---------- 地點（金庸世界；座標約略對應中國地圖，x 由西向東、y 由北向南） ---------- */
const LOCS = {
  linan:    { n: '臨安城',     kind: 'city', art: 'river',    x: 78, y: 62, d: '錢塘江畔的繁華都會，西湖邊畫舫笙歌不斷。茶樓酒肆裡，什麼消息都聽得到。' },
  jiaxing:  { n: '嘉興',       kind: 'city', art: 'dock',     x: 82, y: 56, d: '江南水鄉，南湖煙雨樓下舟楫往來。城外有座香火冷落的王鐵槍廟。' },
  yanjing:  { n: '燕京',       kind: 'city', art: 'city',     x: 63, y: 15, d: '北地第一大城。金國的中都、蒙古的大都，都是這座城。王府高牆深，街市魚龍混雜。' },
  xiangyang:{ n: '襄陽',       kind: 'city', art: 'fight',    x: 48, y: 48, d: '漢水南岸的堅城，南宋北面的屏障。城頭的守軍，常年望著北方。' },
  tianmu:   { n: '天目山',     kind: 'wild', art: 'mountain', x: 72, y: 60, danger: 0.6, d: '臨安西面的深山，古木參天，山賊與猛獸出沒，也藏著前人遺跡。' },
  huashan:  { n: '華山',       kind: 'wild', art: 'snow',     x: 40, y: 37, danger: 1.0, d: '五嶽之中最險的一座。絕頂終年積雪，據說天下第一的名號，就是在那裡論出來的。' },
  mobei:    { n: '漠北草原',   kind: 'wild', art: 'desert',   x: 35, y: 4,  danger: 1.2, d: '一望無際的草原與沙磧，蒙古各部的氈帳逐水草而居。' },
  taohua:   { n: '桃花島',     kind: 'wild', art: 'valley',   x: 92, y: 64, danger: 0.8, d: '東海孤島，桃花滿山。島上布滿奇門陣法，外人上得去，未必下得來。' },
  zhongnan: { n: '終南山',     kind: 'sect', art: 'taoist',   x: 34, y: 40, sect: 'quanzhen', d: '重陽宮所在，天下玄門正宗。後山林深處有座活死人墓，觀中弟子從不靠近。' },
  junshan:  { n: '洞庭君山',   kind: 'sect', art: 'river',    x: 52, y: 63, sect: 'gaibang', d: '八百里洞庭中的小島，丐幫總舵所在。島上破廟裡，常常聚著數百個叫化子。' },
  shaolin:  { n: '嵩山少林寺', kind: 'sect', art: 'temple',   x: 51, y: 37, sect: 'shaolin', d: '天下武功出少林。千年古剎，晨鐘暮鼓，武僧在院中練拳。' },
  tiezhang: { n: '鐵掌峰',     kind: 'sect', art: 'cliff',    x: 44, y: 68, sect: 'tiezhang', d: '湘西群山中五指並立的奇峰，鐵掌幫總舵。幫眾橫行一方，官府也不敢過問。' },
  wudang:   { n: '武當山',     kind: 'sect', art: 'taoist',   x: 42, y: 50, sect: 'wudang', d: '七十二峰朝大頂。山上的道觀，據說是一個在少林寺當過小廝的人開創的。' },
  emei:     { n: '峨嵋山',     kind: 'sect', art: 'peak',     x: 22, y: 60, sect: 'emei', d: '雲海佛光，金頂入雲。山上的門派只收女弟子為入室，俗家男弟子只能在外門。' },
  kunlun:   { n: '崑崙光明頂', kind: 'sect', art: 'snow',     x: 6,  y: 36, sect: 'mingjiao', d: '西域雪山之巔，明教總壇。教眾遍布天下，朝廷視為反賊，名門正派視為魔教。' },
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

  // 全真教
  qz_sword: { n: '全真劍法', type: 'sword', tier: 1, attr: 'he', sect: 'quanzhen', d: '全真入門劍法，中正平和，守多攻少。', moves: [['定陽針', 1, 3, 14], ['浪跡天涯', 4, 8, 23], ['分花拂柳', 7, 14, 33, 'weak']] },
  qz_nei:   { n: '全真心法', type: 'nei', tier: 2, attr: 'he', sect: 'quanzhen', hp: 9, mp: 12, d: '玄門正宗的內功，進境不快，根基極穩。' },
  qz_qing:  { n: '金雁功', type: 'qing', tier: 2, attr: 'he', sect: 'quanzhen', dodge: 2.2, d: '全真教的輕功，練到深處可以一口氣上山。' },
  qz_palm:  { n: '三花聚頂掌', type: 'fist', tier: 2, attr: 'yang', sect: 'quanzhen', d: '掌力匯聚頂門，一掌重過一掌。', moves: [['精聚', 1, 8, 25], ['氣聚', 4, 14, 37, 'stun'], ['神聚', 7, 24, 55]] },

  // 丐幫
  gb_fist:  { n: '逍遙遊', type: 'fist', tier: 1, attr: 'yang', sect: 'gaibang', d: '丐幫弟子常練的拳法，身法飄忽，出拳隨意。', moves: [['乞兒討飯', 1, 2, 13], ['醉臥長街', 4, 8, 23], ['逍遙遊', 7, 13, 32, 'weak']] },
  gb_nei:   { n: '丐幫吐納法', type: 'nei', tier: 2, attr: 'yang', sect: 'gaibang', hp: 13, mp: 8, d: '風餐露宿練出來的內功，挨得起凍，也挨得起打。' },
  gb_qing:  { n: '草上飛', type: 'qing', tier: 2, attr: 'yang', sect: 'gaibang', dodge: 2.0, d: '叫化子逃命的本事，在人堆裡鑽來鑽去最是好用。' },
  gb_palm:  { n: '蓮花掌', type: 'fist', tier: 2, attr: 'yang', sect: 'gaibang', d: '掌勢如蓮瓣層層綻開，是丐幫中層弟子的看家功夫。', moves: [['一瓣', 1, 7, 24], ['重瓣', 4, 14, 36, 'stun'], ['千葉蓮開', 7, 24, 56]] },

  // 少林寺
  sl_fist:  { n: '羅漢拳', type: 'fist', tier: 1, attr: 'yang', sect: 'shaolin', d: '少林入門拳法，一招一式紮實剛猛。', moves: [['羅漢撞鐘', 1, 2, 13], ['降龍式', 4, 8, 23], ['伏虎式', 7, 13, 32, 'stun']] },
  sl_nei:   { n: '少林心法', type: 'nei', tier: 2, attr: 'yang', sect: 'shaolin', hp: 14, mp: 7, d: '佛門正宗內功，築基深厚，氣血綿長。' },
  sl_qing:  { n: '一葦渡江', type: 'qing', tier: 2, attr: 'yang', sect: 'shaolin', dodge: 1.9, d: '相傳達摩祖師折蘆渡江，少林輕功由此得名。' },
  sl_palm:  { n: '韋陀掌', type: 'fist', tier: 2, attr: 'yang', sect: 'shaolin', d: '少林七十二絕技之一的入門功夫，掌力雄渾。', moves: [['韋陀獻杵', 1, 8, 26], ['橫擔降魔杵', 4, 15, 38, 'stun'], ['韋陀伏魔', 7, 26, 58]] },

  // 鐵掌幫
  tz_palm:  { n: '鐵砂掌', type: 'fist', tier: 1, attr: 'yang', sect: 'tiezhang', d: '雙掌插鐵砂練成，出手不留情。', moves: [['開碑', 1, 3, 15], ['碎石', 4, 8, 24, 'bleed'], ['斷金', 7, 14, 35]] },
  tz_nei:   { n: '歸元吐納', type: 'nei', tier: 2, attr: 'yang', sect: 'tiezhang', hp: 12, mp: 12, evil: 1, d: '鐵掌幫的內功，進境快，練得越深，下手越重。' },
  tz_qing:  { n: '水上漂', type: 'qing', tier: 2, attr: 'he', sect: 'tiezhang', dodge: 2.3, d: '鐵掌幫的輕功絕技，踏水而行，幫主以此聞名天下。' },
  tz_iron:  { n: '鐵掌', type: 'fist', tier: 2, attr: 'yang', sect: 'tiezhang', d: '鐵掌幫的鎮幫掌法，外門弟子只學得到前幾路。', moves: [['推窗', 1, 8, 27, 'bleed'], ['掌劈華嶽', 4, 15, 38, 'stun'], ['鐵掌橫江', 7, 26, 60]] },

  // 武當派
  wd_fist:  { n: '武當長拳', type: 'fist', tier: 1, attr: 'he', sect: 'wudang', d: '武當入門拳法，舒展大方，講究勁由腰發。', moves: [['攬雀尾', 1, 2, 13], ['雲手', 4, 8, 22, 'weak'], ['高探馬', 7, 13, 32]] },
  wd_nei:   { n: '武當九陽功', type: 'nei', tier: 2, attr: 'he', sect: 'wudang', hp: 10, mp: 12, d: '張真人從一部殘經中悟出的內功，綿綿不絕。' },
  wd_qing:  { n: '梯雲縱', type: 'qing', tier: 2, attr: 'he', sect: 'wudang', dodge: 2.4, d: '左腳踏右腳，凌空連縱，武當輕功之最。' },
  wd_sword: { n: '繞指柔劍', type: 'sword', tier: 2, attr: 'yin', sect: 'wudang', d: '劍走弧形，以柔克剛，令人防不勝防。', moves: [['繞指', 1, 8, 25, 'weak'], ['柔絲', 4, 14, 36], ['百轉千迴', 7, 24, 55, 'pierce']] },

  // 峨嵋派
  em_sword: { n: '峨嵋劍法', type: 'sword', tier: 1, attr: 'yin', sect: 'emei', d: '劍招輕靈，出自峨嵋開山祖師。', moves: [['金頂佛光', 1, 3, 14], ['清音', 4, 8, 22], ['雲海', 7, 14, 33, 'bleed']] },
  em_nei:   { n: '峨嵋九陽功', type: 'nei', tier: 2, attr: 'yin', sect: 'emei', hp: 9, mp: 11, heal: 1, d: '峨嵋一脈傳下的內功，療傷之效尤佳。' },
  em_palm:  { n: '金頂綿掌', type: 'fist', tier: 2, attr: 'yin', sect: 'emei', d: '掌勢綿密，外柔內剛。', moves: [['綿裡藏針', 1, 7, 24, 'weak'], ['佛光普照', 4, 14, 36], ['金頂萬佛', 7, 24, 54]] },

  // 明教
  mj_blade: { n: '烈火刀法', type: 'blade', tier: 1, attr: 'yang', sect: 'mingjiao', d: '明教五行旗下教眾常練的刀法，刀勢如火。', moves: [['燎原', 1, 3, 15], ['焚天', 4, 8, 24, 'bleed'], ['聖火', 7, 14, 35]] },
  mj_nei:   { n: '明教心法', type: 'nei', tier: 2, attr: 'yang', sect: 'mingjiao', hp: 12, mp: 11, d: '源自波斯的內功，練功時心中默念「焚我殘軀，熊熊聖火」。' },
  mj_dart:  { n: '五行旗火器', type: 'dart', tier: 2, attr: 'yang', sect: 'mingjiao', d: '銳金、烈火兩旗合製的暗器手法。', moves: [['火鴉', 1, 8, 24, 'bleed'], ['金梭', 4, 14, 35, 'pierce'], ['五行齊發', 7, 25, 55, 'bleed']] },

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

/* ---------- 門派 ----------
   from/to：門派存在的年份。旁觀者只能做到長老，掌門之位屬於歷史上的人物 */
const RANKS = ['外門弟子', '內門弟子', '真傳弟子', '長老', '掌門'];
const RANK_NEED = [0, 100, 300, 700];
const SECTS = {
  quanzhen: { n: '全真教', loc: 'zhongnan', align: 1, from: 1170, to: 1400, master: '清虛道長', style: '劍法・內功・玄門正宗',
    tasks: ['下山採買糧米香燭', '在重陽宮前接待上山的香客', '抄寫道藏經卷', '清掃終南山的石階'],
    d: '重陽真人所創，天下玄門正宗。門規森嚴，弟子眾多。', req: s => s.stats.int >= 6, reqT: '悟性須達 6',
    teach: [['qz_sword', 0, 0], ['qz_nei', 1, 60], ['qz_qing', 1, 80], ['qz_palm', 2, 160]], ult: null },
  gaibang: { n: '丐幫', loc: 'junshan', align: 1, from: 1050, to: 1400, master: '錢八袋', style: '拳掌・市井實戰',
    tasks: ['沿街打探各路消息回報總舵', '在渡口替幫中兄弟排解糾紛', '押送一船糧米過洞庭', '照看幫裡收留的孤兒'],
    d: '天下第一大幫，弟子遍布各地，販夫走卒、乞兒流民都是兄弟。', req: () => true, reqT: '無',
    teach: [['gb_fist', 0, 0], ['gb_nei', 1, 50], ['gb_qing', 1, 70], ['gb_palm', 2, 150]], ult: null },
  shaolin: { n: '少林寺', loc: 'shaolin', align: 1, from: 500, to: 1400, master: '慧明禪師', style: '拳掌・剛猛厚重',
    tasks: ['下山化緣、施粥濟貧', '護送香客過嵩山山道', '在藏經閣外打掃', '在羅漢堂陪練新入門的沙彌'],
    d: '武林泰山北斗，收俗家弟子，重根基，戒殺生。', req: s => s.moral >= 0 && s.stats.con >= 6, reqT: '根骨須達 6，且非奸邪之徒',
    teach: [['sl_fist', 0, 0], ['sl_nei', 1, 60], ['sl_qing', 1, 80], ['sl_palm', 2, 160]], ult: null },
  tiezhang: { n: '鐵掌幫', loc: 'tiezhang', align: -1, from: 1150, to: 1240, master: '沙香主', style: '掌法・狠辣霸道',
    tasks: ['押送一批來路不明的貨物', '替幫中收取各寨的供奉', '看守峰下的地牢'],
    d: '湘西一霸，幫主武功蓋世，暗中與金國往來。入幫者為俠義道所不齒。', req: s => s.moral <= 20, reqT: '俠義之名太盛者不收',
    teach: [['tz_palm', 0, 0], ['tz_nei', 1, 50], ['tz_qing', 1, 80], ['tz_iron', 2, 150]], ult: null },
  wudang: { n: '武當派', loc: 'wudang', align: 1, from: 1300, to: 1400, master: '清風道長', style: '拳劍・以柔克剛',
    tasks: ['下山替百姓排解糾紛', '在紫霄宮前接待訪客', '抄寫經卷', '巡山'],
    d: '張三丰真人所創，門下七俠名動天下。', req: s => s.stats.int >= 6 && s.moral >= 0, reqT: '悟性須達 6，且非奸邪之徒',
    teach: [['wd_fist', 0, 0], ['wd_nei', 1, 60], ['wd_qing', 1, 80], ['wd_sword', 2, 160]], ult: null },
  emei: { n: '峨嵋派', loc: 'emei', align: 1, from: 1285, to: 1400, master: '靜塵師太', style: '劍掌・輕靈綿密',
    tasks: ['替山下村民義診', '採集山中藥草', '巡守金頂', '抄寫經卷'],
    d: '郭襄女俠所創，門規極嚴，對魔教深惡痛絕。', req: s => s.moral >= 10 || s.stats.cha >= 7, reqT: '心存俠義（俠義 10 以上）或魅力達 7',
    teach: [['em_sword', 0, 0], ['em_nei', 1, 60], ['em_palm', 2, 160]], ult: null },
  mingjiao: { n: '明教', loc: 'kunlun', align: 0, from: 1250, to: 1400, master: '林副使', style: '刀法・火器',
    tasks: ['替教中兄弟運送糧草', '在山下接應投奔的流民', '巡守光明頂', '探聽元軍動靜'],
    d: '源自波斯，教眾多是貧苦百姓。朝廷說他們是反賊，正派說他們是魔教。', req: s => s.moral <= 60, reqT: '名門正派出身、俠名太盛者不收',
    teach: [['mj_blade', 0, 0], ['mj_nei', 1, 50], ['mj_dart', 2, 150]], ult: null },
};
const sectOpen = id => { const k = SECTS[id], y = typeof ad === 'function' && S ? ad() : 1222; return y >= k.from && y <= k.to; };

/* ---------- 物品 ---------- */
const ITEMS = {
  jinchuang: { n: '金創藥', kind: 'med', price: 30, hp: 70, d: '回復 70 氣血' },
  huiqi:     { n: '回氣散', kind: 'med', price: 40, mp: 45, d: '回復 45 內力' },
  dahuan:    { n: '大還丹', kind: 'med', price: 320, hp: 9999, mp: 9999, d: '氣血內力全滿' },
  herb:      { n: '草藥', kind: 'misc', price: 16, d: '可賣錢，三株可在城中藥舖煉成金創藥' },
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
  yanjing: ['jinchuang', 'huiqi', 'dahuan', 'w_sword1', 'w_sword2', 'w_blade1', 'w_blade2', 'w_fist1', 'w_fist2', 'a_cloth', 'wine', 'book', 'bk_blade'],
  linan:   ['jinchuang', 'huiqi', 'dahuan', 'w_dart1', 'w_dart2', 'w_sword1', 'a_cloth', 'a_gold', 'rouge', 'hairpin', 'qin', 'wine', 'bk_dart'],
  jiaxing: ['jinchuang', 'huiqi', 'w_sword1', 'w_blade1', 'a_cloth', 'rouge', 'wine', 'book'],
  xiangyang: ['jinchuang', 'huiqi', 'dahuan', 'w_sword1', 'w_sword2', 'w_blade1', 'w_blade2', 'a_cloth', 'a_gold', 'wine', 'book', 'bk_blade'],
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
  su: { n: '蘇晚晴', ta: '她', loc: 'zhongnan', title: '全真教女弟子', like: 'qin', bonus: ['agi', 2],
    d: '白衣如雪，話少劍快。觀中上下都怕她，卻沒人說得出她哪裡不好。',
    meet: '山道上晨霧未散，一名白衣女子正在崖邊練劍，劍光斂處，一片落葉被齊齊削成四瓣。她收劍回頭，淡淡看了你一眼：「看夠了？這條路外人不該來。」',
    chat: ['你陪她在崖邊看了半日雲海，她只說了三句話，你卻覺得不算少。', '她指點了你握劍的手勢，指尖一觸即收。', '你講山下的趣事，她嘴角動了動，別過頭去看雲。'],
    stage: [
      { t: '蘇晚晴難得主動找你：「後山寒潭邊的雪蓮開了。……你若沒事，可以去看。」說完便走，走了幾步又停下等你。', a: ['並肩同去，一路無話也自在', 8], b: ['推說要練功，改日再去', -4] },
      { t: '她練功岔了氣，卻不肯讓同門知道，只來敲了你的門。燈下她臉色蒼白：「幫我護法一夜。此事不許說出去。」', a: ['守到天明，隻字不問', 10], b: ['勸她稟明師長，不可逞強', 2] },
      { t: '月下，她把佩劍的劍穗解下來遞給你：「全真的規矩，劍穗只贈一人。」她看著遠處，耳根卻紅了，「你若不要，就還我。」', a: ['收下劍穗，握住她的手', 15], b: ['沉默良久，把劍穗還給她', -30] },
    ] },
  hua: { n: '花弄影', ta: '她', loc: 'jiaxing', title: '回春堂醫女', like: 'rouge', bonus: ['con', 2],
    d: '嘉興回春堂老郎中的獨女，愛笑，愛捉弄人，藥箱裡一半是救人的藥，一半是整人的藥。',
    meet: '你在回春堂等著抓藥，順手喝了櫃上一碗涼茶，頓時頭暈眼花。一個背著藥簍的少女蹲在你面前，笑得眉眼彎彎：「那是給病人試的藥。張嘴，解藥有點苦——騙你的，是很苦。」',
    chat: ['她拉你去試新配的藥茶，你的舌頭麻了半個時辰，她笑了半個時辰。', '你幫她曬了一下午藥材，她往你懷裡塞了一包蜜餞。', '她教你辨認了七種毒草，考你時你只記得三種，被敲了額頭。'],
    stage: [
      { t: '花弄影要上山採一味只在夜裡開花的藥，她爹不准她獨行。她扯著你的袖子：「你陪我去嘛，我分你一半——一半功勞。」', a: ['提燈陪她走一夜山路', 8], b: ['說夜路太險，勸她別去', -3] },
      { t: '醫館送來一個中了奇毒的孩子，她三天三夜沒闔眼，終究沒能救回來。你找到她時，她一個人坐在藥圃裡，沒有哭，也沒有笑。', a: ['不說話，坐在她身邊陪著', 10], b: ['告訴她這不是她的錯', 5] },
      { t: '她塞給你一個香囊，裡頭是她親手配的百花香。「我配了十七次才配成這個味道，」她難得不笑，認真地看著你，「以後你走到哪裡，聞到它就得想起我。」', a: ['把香囊貼身收好：「不用聞也想。」', 15], b: ['打趣她：「裡面沒下毒吧？」然後還給她', -30] },
    ] },
  li: { n: '厲紅綃', ta: '她', loc: 'yanjing', title: '綠林總瓢把子的獨女', like: 'wine', bonus: ['str', 2],
    d: '紅衣烈烈，北方綠林總瓢把子的獨女。她在燕京夜市裡喝酒時，沒人敢坐她鄰桌。',
    meet: '燕京夜市，一名紅衣女子獨佔一桌，腳邊倒著三個想搭訕的潑皮。她把一碗酒推到桌子對面，抬眼看你：「你，看起來不怕我。坐下，喝。」',
    chat: ['你陪她喝到三更，她的酒量好得不像話。', '她問你名門正派的人是不是都很無趣，你想了想，沒有反駁。', '她在城牆上看了很久的燈火，說山寨裡看不到這些。'],
    stage: [
      { t: '幾名名門弟子認出了厲紅綃，拔劍將她圍住。她冷笑著按住刀柄，卻先看了你一眼——像是想知道你會站在哪一邊。', a: ['擋在中間：「今日她是我的客人。」', 9], b: ['退開一步，不插手', -6] },
      { t: '她喝醉了，第一次說起自己：「我爹教我的第一件事，是不要信任何人。」她把頭靠在你肩上，「你說，他是不是教錯了？」', a: ['「信我一個就夠了。」', 10], b: ['「你爹是為你好。」', 1] },
      { t: '她把一柄短刀拍在你面前：「綠林的規矩，刀給了誰，命就給了誰。」她盯著你，眼裡有一點從沒見過的緊張，「黑白兩道不相容，你想清楚再接。」', a: ['接過短刀：「我接的是你，不是綠林。」', 15], b: ['把刀推回去：「你我終究不是一路人。」', -30] },
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
  shen: { n: '沈墨言', ta: '他', loc: 'xiangyang', title: '襄陽書肆主人', like: 'book', bonus: ['int', 2],
    d: '溫文爾雅的書肆主人，全真教俗家弟子。看似手無縛雞之力，實則內功深不可測。',
    meet: '你在襄陽書肆避雨，一卷書從高架上滑落，被一隻修長的手穩穩接住。青衣男子把書遞給你，溫聲道：「這本講的是劍理，卻沒有一招劍法。閣下若看得進去，雨停之前不妨讀完。」',
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
