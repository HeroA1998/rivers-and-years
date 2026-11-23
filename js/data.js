/* 江湖歲月錄 — 資料：地點、門派、武功、物品、人物 */
'use strict';

const VERSION = 'v6.21.0';
// 人物立繪：LinXueLian（linxuelian.itch.io）手繪素材，CC BY-SA 4.0，經合成與裁切
const FACES = ['su', 'hua', 'li', 'gu', 'shen', 'qin', 'elder', 'boss', 'kid', 'pei', 'guojing', 'huangrong', 'yangkang', 'munianci', 'zhoubotong'];
const SQFACES = ['guojing', 'huangrong', 'yangkang', 'munianci', 'zhoubotong'];   // 方形頭像（其餘為 3:4 立繪）

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
const TYPE_N = { nei: '內功', sword: '劍法', blade: '刀法', fist: '拳掌', staff: '棒法', spear: '槍法', whip: '鞭法', dart: '暗器', qing: '輕功' };
const ATTR_N = { yang: '陽剛', yin: '陰柔', he: '中和' };
const TIER_N = ['', '入門', '上乘', '絕學'];
const FX_N = { bleed: '流血', poison: '中毒', stun: '震暈', weak: '破勢', drain: '吸血', pierce: '破防' };

const SKILLS = {
  basic_fist: { n: '燕青拳', type: 'fist', tier: 1, attr: 'he', d: '江湖上流傳最廣的拳法之一，巧打連綿，身法輕快。', moves: [['懷中抱月', 1, 0, 8], ['二郎擔山', 4, 4, 15]] },
  tuna:       { n: '吐納功夫', type: 'nei', tier: 1, attr: 'he', hp: 6, mp: 5, d: '調勻呼吸、積蓄內息的入門法門。' },

  // 全真教
  qz_sword: { n: '全真劍法', type: 'sword', tier: 1, attr: 'he', sect: 'quanzhen', d: '全真入門劍法，中正平和，守多攻少。', moves: [['定陽針', 1, 3, 14], ['浪跡天涯', 4, 8, 23], ['分花拂柳', 7, 14, 33, 'weak']] },
  qz_nei:   { n: '全真內功', type: 'nei', tier: 2, attr: 'he', sect: 'quanzhen', hp: 9, mp: 12, d: '玄門正宗的內功，進境不快，根基極穩。' },
  qz_qing:  { n: '金雁功', type: 'qing', tier: 2, attr: 'he', sect: 'quanzhen', dodge: 2.2, d: '全真教的輕功，練到深處可以一口氣上山。' },
  qz_palm:  { n: '天罡北斗陣', type: 'sword', tier: 2, attr: 'he', sect: 'quanzhen', d: '全真教的陣法，按北斗七星方位站位，首尾相應。單人使來，是陣中一個方位的劍招。', moves: [['天樞', 1, 8, 25], ['天璇', 4, 14, 37, 'weak'], ['北斗七星', 7, 24, 55]] },

  // 丐幫
  gb_fist:  { n: '逍遙遊', type: 'fist', tier: 1, attr: 'yang', sect: 'gaibang', d: '丐幫弟子常練的拳法，身法飄忽，出拳隨意。', moves: [['沿門托缽', 1, 2, 13], ['見人伸手', 4, 8, 23], ['四海遨遊', 7, 13, 32, 'weak']] },
  gb_nei:   { n: '丐幫吐納法', type: 'nei', tier: 2, attr: 'yang', sect: 'gaibang', hp: 13, mp: 8, d: '風餐露宿練出來的內功，挨得起凍，也挨得起打。' },
  gb_qing:  { n: '草上飛', type: 'qing', tier: 2, attr: 'yang', sect: 'gaibang', dodge: 2.0, d: '叫化子逃命的本事，在人堆裡鑽來鑽去最是好用。' },
  gb_palm:  { n: '蓮花掌', type: 'fist', tier: 2, attr: 'yang', sect: 'gaibang', d: '掌勢如蓮瓣層層綻開，是丐幫中層弟子的看家功夫。', moves: [['一瓣', 1, 7, 24], ['重瓣', 4, 14, 36, 'stun'], ['千葉蓮開', 7, 24, 56]] },

  // 少林寺
  sl_fist:  { n: '羅漢拳', type: 'fist', tier: 1, attr: 'yang', sect: 'shaolin', d: '少林入門拳法，一招一式紮實剛猛。', moves: [['黑虎偷心', 1, 2, 13], ['苦海回頭', 4, 8, 23], ['伏虎式', 7, 13, 32, 'stun']] },
  sl_nei:   { n: '少林心法', type: 'nei', tier: 2, attr: 'yang', sect: 'shaolin', hp: 14, mp: 7, d: '佛門正宗內功，築基深厚，氣血綿長。' },
  sl_qing:  { n: '一葦渡江', type: 'qing', tier: 2, attr: 'yang', sect: 'shaolin', dodge: 1.9, d: '相傳達摩祖師折蘆渡江，少林輕功由此得名。' },
  sl_palm:  { n: '韋陀掌', type: 'fist', tier: 2, attr: 'yang', sect: 'shaolin', d: '少林七十二絕技之一的入門功夫，掌力雄渾。', moves: [['靈山禮佛', 1, 8, 26], ['山門護法', 4, 15, 38, 'stun'], ['恆河入海', 7, 26, 58]] },

  // 鐵掌幫
  tz_palm:  { n: '通臂六合掌', type: 'fist', tier: 1, attr: 'yang', sect: 'tiezhang', d: '從通臂五行掌變化而來的掌法，招數不奇，貴在功力。鐵掌幫主早年也在這路掌法上下過數十年苦功。', moves: [['孤雁出群', 1, 3, 15], ['通臂', 4, 8, 24, 'bleed'], ['六合', 7, 14, 35]] },
  tz_nei:   { n: '歸元吐納', type: 'nei', tier: 2, attr: 'yang', sect: 'tiezhang', hp: 12, mp: 12, evil: 1, d: '鐵掌幫的內功，進境快，練得越深，下手越重。' },
  tz_qing:  { n: '鐵掌水上飄', type: 'qing', tier: 2, attr: 'he', sect: 'tiezhang', dodge: 2.3, d: '鐵掌幫的輕功絕技，踏水而行，幫主以此聞名天下。' },
  tz_iron:  { n: '鐵掌', type: 'fist', tier: 2, attr: 'yang', sect: 'tiezhang', d: '鐵掌幫的鎮幫掌法，外門弟子只學得到前幾路。', moves: [['推窗望月', 1, 8, 27, 'bleed'], ['掌劈華嶽', 4, 15, 38, 'stun'], ['鐵掌橫江', 7, 26, 60]] },

  // 武當派
  wd_fist:  { n: '武當長拳', type: 'fist', tier: 1, attr: 'he', sect: 'wudang', d: '武當入門拳法，舒展大方，講究勁由腰發。', moves: [['雁翅式', 1, 2, 13], ['一條鞭', 4, 8, 22, 'weak'], ['長拳十段', 7, 13, 32]] },
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

  // 鎮派絕學：升到長老、功勞夠大，由掌門親傳
  qz_ult:     { n: '同歸劍法', type: 'sword', tier: 3, attr: 'he', sect: 'quanzhen', d: '全真教以命相搏時才用的劍法，招招不留退路。', moves: [['玉石俱焚', 1, 14, 40], ['天罡同歸', 4, 22, 58, 'bleed'], ['同歸劍', 8, 40, 94, 'pierce']] },
  gb_ult:     { n: '降龍十八掌', type: 'fist', tier: 3, attr: 'yang', sect: 'gaibang', d: '丐幫至剛至猛的掌法，掌力留有餘地，後勁才是殺著。', moves: [['見龍在田', 1, 14, 42], ['飛龍在天', 4, 22, 60, 'stun'], ['亢龍有悔', 8, 40, 98, 'pierce']] },
  sl_ult:     { n: '易筋經', type: 'nei', tier: 3, attr: 'yang', sect: 'shaolin', hp: 18, mp: 15, d: '達摩祖師所傳，少林寺的根本內功。練成之後，筋骨脫胎換骨。' },
  tz_ult:     { n: '鐵掌神功', type: 'fist', tier: 3, attr: 'yang', sect: 'tiezhang', d: '鐵掌幫歷代幫主相傳的掌法，掌力所及，金石為開。', moves: [['鐵掌開山', 1, 14, 42, 'bleed'], ['掌心化鐵', 4, 22, 58, 'stun'], ['鐵掌橫空', 8, 40, 96]] },
  wd_taiji:   { n: '太極拳', type: 'fist', tier: 3, attr: 'he', sect: 'wudang', d: '張三丰晚年所創，以靜制動、以柔克剛、後發制人。', moves: [['攬雀尾', 1, 13, 38, 'weak'], ['單鞭', 4, 21, 56, 'weak'], ['以柔克剛', 8, 38, 90, 'pierce']] },
  wd_zhenwu:  { n: '神門十三劍', type: 'sword', tier: 3, attr: 'he', sect: 'wudang', d: '張三丰創制的劍法，共十三記招數，每記都刺向對手手腕的神門穴。', moves: [['神門', 1, 14, 40], ['斷腕', 4, 22, 56, 'weak'], ['十三劍', 8, 40, 92, 'pierce']] },
  em_ult:     { n: '四象掌', type: 'fist', tier: 3, attr: 'yin', sect: 'emei', d: '峨嵋派的上乘掌法，太陰少陰、太陽少陽，四象流轉。', moves: [['太陰', 1, 13, 40, 'weak'], ['少陽', 4, 21, 56], ['四象歸一', 8, 38, 92, 'pierce']] },
  gb_dog:     { n: '打狗棒法', type: 'staff', tier: 3, attr: 'yin', sect: 'gaibang', d: '丐幫歷代幫主相傳的棒法，以絆、劈、纏、戳、挑、引、封、轉八字訣變化，輕靈巧妙。', moves: [['惡狗攔路', 1, 13, 38, 'weak'], ['獒口奪棒', 4, 21, 56, 'stun'], ['天下無狗', 8, 40, 94, 'pierce']] },
  mj_qk:      { n: '乾坤大挪移', type: 'fist', tier: 3, attr: 'he', sect: 'mingjiao', d: '明教鎮教神功，挪移敵人的勁力為己用。練到第七層，世間少有人能及。', moves: [['挪移乾坤', 1, 14, 40, 'weak'], ['借力打力', 4, 22, 58, 'drain'], ['第七層', 8, 42, 98, 'pierce']] },
  wd_taijian: { n: '太極劍', type: 'sword', tier: 3, attr: 'he', sect: 'wudang', d: '張三丰與太極拳同時創出的劍法，劍招連綿成圈，不求形似但求意到。', moves: [['三環套月', 1, 13, 38, 'weak'], ['大魁星', 4, 21, 56], ['燕子抄水', 8, 38, 92, 'pierce']] },
  mj_ult:     { n: '聖火令武功', type: 'fist', tier: 3, attr: 'he', sect: 'mingjiao', d: '刻在聖火令上、從波斯傳來的古怪武功，招式匪夷所思。', moves: [['聖火', 1, 14, 42, 'stun'], ['無影', 4, 22, 58, 'weak'], ['焚我殘軀', 8, 40, 96, 'drain']] },

  // 書中武功：各地奇遇才學得到
  y_spear:    { n: '楊家槍法', type: 'spear', tier: 2, attr: 'yang', d: '北宋楊家將傳下的槍法，一桿槍使得如蛟龍出海。', moves: [['回馬槍', 1, 8, 26], ['鳳點頭', 4, 14, 37, 'pierce'], ['七十二路', 7, 24, 56]] },
  th_palm:    { n: '桃華落英掌', type: 'fist', tier: 3, attr: 'yin', d: '桃花島主所創，掌影如落英繽紛，虛實難辨。', moves: [['落英繽紛', 1, 13, 40, 'weak'], ['桃花紛飛', 4, 21, 56], ['桃華落英', 8, 38, 92, 'pierce']] },
  mg_bow:     { n: '射鵰箭法', type: 'dart', tier: 2, attr: 'yang', d: '草原神箭手的箭術，一箭能射落天上的大鵰。', moves: [['連珠箭', 1, 7, 24], ['穿楊', 4, 14, 36, 'pierce'], ['射鵰', 7, 24, 56, 'stun']] },
  mg_wrestle: { n: '蒙古摔跤', type: 'fist', tier: 1, attr: 'yang', d: '草原上的漢子人人會的摔跤術，近身纏抱，力大者勝。', moves: [['斷山絞', 1, 2, 13, 'stun'], ['駱駝扳', 4, 8, 22, 'weak'], ['過背摔', 7, 13, 32, 'stun']] },
  jy_claw:    { n: '九陰白骨爪', type: 'fist', tier: 3, attr: 'yin', evil: 1, d: '從《九陰真經》殘篇中練出的邪門爪功，五指插入敵人頭頂。練得越深，心腸越冷。', moves: [['白骨爪', 1, 13, 42, 'bleed'], ['摧心', 4, 21, 58, 'bleed'], ['九陰白骨', 8, 40, 96, 'pierce']] },
  sl_finger:  { n: '拈花指', type: 'fist', tier: 3, attr: 'he', d: '少林七十二絕技之一，出指時面帶微笑，如佛祖拈花。', moves: [['拈花', 1, 13, 38, 'weak'], ['微笑', 4, 21, 56, 'stun'], ['拈花一笑', 8, 38, 90, 'pierce']] },
  sl_dragon:  { n: '龍爪手', type: 'fist', tier: 3, attr: 'yang', d: '少林七十二絕技之一，共三十六式，專拿敵人要害。', moves: [['捕風式', 1, 13, 40], ['捉影式', 4, 21, 56, 'weak'], ['抱殘式', 8, 38, 92, 'pierce']] },
  ty_claw:    { n: '鷹爪擒拿手', type: 'fist', tier: 2, attr: 'yang', d: '天鷹教的看家功夫，抓、拿、扣、鎖，招招不離關節。', moves: [['鷹爪', 1, 7, 24, 'bleed'], ['擒拿', 4, 14, 36, 'stun'], ['蒼鷹搏兔', 7, 24, 56]] },

  // 五絕與名家
  yy_finger:  { n: '一陽指', type: 'fist', tier: 3, attr: 'yang', d: '南帝段氏的家傳絕學，指力純陽，點穴療傷皆可。', moves: [['點穴', 1, 13, 40, 'stun'], ['一陽化生', 4, 21, 56, 'weak'], ['一陽指', 8, 38, 92, 'pierce']] },
  hm_toad:    { n: '蛤蟆功', type: 'fist', tier: 3, attr: 'yang', d: '西毒歐陽鋒的獨門功夫，蹲身蓄勁，一發如山崩。', moves: [['蓄勁', 1, 14, 44, 'stun'], ['蛤蟆跳', 4, 22, 60], ['蛤蟆功', 8, 42, 100, 'stun']] },
  th_flick:   { n: '彈指神通', type: 'dart', tier: 3, attr: 'he', d: '東邪黃藥師的指上功夫，一枚石子、一片花瓣，彈出去都能傷人。', moves: [['彈指', 1, 12, 38, 'pierce'], ['指上生風', 4, 20, 54, 'pierce'], ['彈指神通', 8, 38, 92, 'stun']] },
  kong_fist:  { n: '空明拳', type: 'fist', tier: 3, attr: 'he', d: '老頑童周伯通自創的七十二路拳法，以空為本、以柔克剛。', moves: [['空碗盛飯', 1, 12, 36, 'weak'], ['空屋住人', 4, 20, 52, 'weak'], ['以空而明', 8, 36, 88, 'pierce']] },

  // 古墓派（不收徒，只能憑奇遇得窺一二）
  gm_net:     { n: '天羅地網勢', type: 'fist', tier: 2, attr: 'yin', d: '古墓派入門功夫，雙掌圍堵，八十一隻麻雀也飛不出掌心。', moves: [['天羅', 1, 7, 22, 'weak'], ['地網', 4, 14, 34, 'weak'], ['八十一雀', 7, 24, 52, 'stun']] },
  gm_needle:  { n: '冰魄銀針', type: 'dart', tier: 3, attr: 'yin', d: '古墓派的暗器，針上餵有劇毒。赤練仙子李莫愁用它殺人無數。', moves: [['冰魄', 1, 12, 38, 'poison'], ['銀針', 4, 20, 52, 'poison'], ['冰魄銀針', 8, 36, 90, 'poison']] },
  gm_sword:   { n: '玉女劍法', type: 'sword', tier: 3, attr: 'yin', d: '古墓派祖師林朝英所創，招招克制全真劍法。若與全真劍法同使，便是玉女素心劍法。', moves: [['撫琴按蕭', 1, 13, 38, 'weak'], ['掃雪烹茶', 4, 21, 56], ['松下對弈', 8, 38, 90, 'pierce']] },
  gm_nei:     { n: '玉女心經', type: 'nei', tier: 3, attr: 'yin', hp: 10, mp: 18, d: '刻在古墓石室頂上的內功，練功須心如止水。' },

  // ===== 射鵰：桃花島、九陰、白駝山、江南七怪、其他名家 =====
  th_xiao: { n: '玉簫劍法', type: 'sword', tier: 3, attr: 'he', d: '黃藥師以簫代劍的劍法，劍招中藏著簫譜的節拍。', moves: [['蕭史乘龍', 1, 13, 40], ['玉漏催銀箭', 4, 21, 56, 'weak'], ['玉簫劍法', 8, 38, 92, 'pierce']] },
  th_lan: { n: '蘭花拂穴手', type: 'fist', tier: 3, attr: 'yin', d: '桃花島的點穴手法，出手如拂蘭花，優雅而準。', moves: [['拂葉', 1, 13, 40, 'stun'], ['點蕊', 4, 21, 56, 'weak'], ['蘭花拂穴', 8, 38, 92, 'stun']] },
  th_leg: { n: '旋風掃葉腿', type: 'fist', tier: 2, attr: 'yang', d: '桃花島的腿法，連環掃出，如秋風掃落葉。', moves: [['掃葉', 1, 8, 25], ['旋風', 4, 14, 36, 'weak'], ['秋風落葉', 7, 24, 55, 'stun']] },
  th_sea: { n: '碧海潮生曲', type: 'dart', tier: 3, attr: 'yin', d: '以簫聲傷人的內功曲子，聽者心神隨潮起伏，不能自主。', moves: [['潮起', 1, 13, 40, 'weak'], ['潮湧', 4, 21, 56, 'stun'], ['碧海潮生', 8, 38, 92, 'stun']] },
  jy_heart: { n: '摧心掌', type: 'fist', tier: 3, attr: 'yin', evil: 1, d: '《九陰真經》下卷的掌法，掌力不傷皮肉，專碎心脈。', moves: [['摧心', 1, 13, 40, 'bleed'], ['裂肺', 4, 21, 56, 'bleed'], ['摧心掌', 8, 38, 92, 'pierce']] },
  jy_soul: { n: '移魂大法', type: 'dart', tier: 2, attr: 'yin', d: '《九陰真經》中的攝心術，以眼神言語亂人心神。', moves: [['攝心', 1, 8, 25, 'weak'], ['移魂', 4, 14, 36, 'stun'], ['反照', 7, 24, 55, 'weak']] },
  jy_whip: { n: '白蟒鞭', type: 'whip', tier: 3, attr: 'yin', d: '梅超風的長鞭功夫，鞭長數丈，揮動時如白蟒翻騰。', moves: [['白蟒吐信', 1, 13, 40, 'bleed'], ['翻江', 4, 21, 56, 'stun'], ['白蟒纏身', 8, 38, 92, 'bleed']] },
  ws_snake: { n: '靈蛇拳', type: 'fist', tier: 3, attr: 'yin', d: '西毒歐陽鋒的拳法，手臂如蛇一般彎轉，從意想不到之處打來。', moves: [['靈蛇出洞', 1, 13, 40, 'weak'], ['蛇纏', 4, 21, 56, 'pierce'], ['靈蛇拳', 8, 38, 92, 'pierce']] },
  ws_camel: { n: '神駝雪山掌', type: 'fist', tier: 2, attr: 'yang', d: '白駝山的掌法，掌風剛猛，帶著西域雪山的寒氣。', moves: [['神駝', 1, 8, 25], ['雪山', 4, 14, 36, 'stun'], ['神駝雪山', 7, 24, 55]] },
  jn_zhu: { n: '分筋錯骨手', type: 'fist', tier: 2, attr: 'he', d: '江南七怪朱聰的擒拿手，專拆對方關節筋骨。', moves: [['分筋', 1, 8, 25, 'weak'], ['錯骨', 4, 14, 36, 'stun'], ['分筋錯骨', 7, 24, 55, 'bleed']] },
  jn_whip: { n: '金龍鞭法', type: 'whip', tier: 2, attr: 'yang', d: '江南七怪韓寶駒的鞭法，金龍鞭揮出時呼呼生風。', moves: [['斷脛盤打', 1, 8, 25], ['騰空', 4, 14, 36, 'stun'], ['金龍鞭', 7, 24, 55, 'bleed']] },
  jn_ling: { n: '鐵菱', type: 'dart', tier: 2, attr: 'yang', d: '江南七怪柯鎮惡的暗器，鐵菱四角尖銳，餵有劇毒。', moves: [['飛菱', 1, 8, 25, 'poison'], ['連珠菱', 4, 14, 36, 'poison'], ['毒菱', 7, 24, 55, 'pierce']] },
  qz_xt: { n: '先天功', type: 'nei', tier: 3, attr: 'he', hp: 15, mp: 18, sect: 'quanzhen', d: '重陽真人的絕學，玄門內功的至高境界。' },
  qz_gold: { n: '金關玉鎖二十四訣', type: 'nei', tier: 2, attr: 'he', hp: 10, mp: 12, sect: 'quanzhen', d: '全真派正宗內功的口訣，講究呼吸吐納、心意相合。' },
  yg_eel: { n: '泥鰍功', type: 'qing', tier: 2, attr: 'he', dodge: 2.8, d: '瑛姑在黑沼中練成的身法，滑溜如泥鰍，抓也抓不住。' },
  zm_hand: { n: '大手印', type: 'fist', tier: 2, attr: 'yang', d: '藏地密宗的掌功，一掌拍下，青磚上留下整整齊齊的掌印。', moves: [['大手印', 1, 8, 25], ['金剛手', 4, 14, 36, 'stun'], ['密宗大手印', 7, 24, 55]] },
  // ===== 神鵰：楊過、古墓派、李莫愁、絕情谷、金輪、其他 =====
  yg_sad: { n: '黯然銷魂掌', type: 'fist', tier: 3, attr: 'he', d: '楊過在相思中自創的掌法，十七招，心中無情者使不出來。', moves: [['心驚肉跳', 1, 13, 40, 'weak'], ['魂不守舍', 4, 21, 56, 'stun'], ['黯然銷魂', 8, 38, 92, 'pierce']] },
  yg_iron: { n: '玄鐵劍法', type: 'sword', tier: 3, attr: 'yang', d: '獨孤求敗中年所用的劍法：重劍無鋒，大巧不工。', moves: [['重劍無鋒', 1, 13, 40, 'stun'], ['大巧不工', 4, 21, 56, 'pierce'], ['玄鐵劍', 8, 38, 92, 'stun']] },
  gm_fist: { n: '美女拳法', type: 'fist', tier: 2, attr: 'yin', d: '古墓派的拳法，每一招都取自一位古代美人的姿態。', moves: [['木蘭彎弓', 1, 8, 25, 'weak'], ['紅玉擊鼓', 4, 14, 36], ['文姬歸漢', 7, 24, 55, 'pierce']] },
  gm_bee: { n: '玉蜂針', type: 'dart', tier: 2, attr: 'yin', d: '古墓派的暗器，細如蜂尾，針上帶著玉蜂的毒。', moves: [['玉蜂', 1, 8, 25, 'poison'], ['蜂群', 4, 14, 36, 'poison'], ['玉蜂針', 7, 24, 55, 'poison']] },
  lm_poison: { n: '赤練神掌', type: 'fist', tier: 3, attr: 'yin', evil: 1, d: '赤練仙子李莫愁的掌法，中掌者肌膚現出赤紅掌印。', moves: [['赤練', 1, 13, 40, 'poison'], ['五毒', 4, 21, 56, 'poison'], ['赤練神掌', 8, 38, 92, 'pierce']] },
  lm_whip: { n: '三無三不手', type: 'whip', tier: 2, attr: 'yin', d: '李莫愁以拂塵使出的狠辣招式：無孔不入、無所不至、無所不為。', moves: [['無孔不入', 1, 8, 25, 'bleed'], ['無所不至', 4, 14, 36, 'pierce'], ['無所不為', 7, 24, 55, 'bleed']] },
  jl_dragon: { n: '龍象般若功', type: 'nei', tier: 3, attr: 'yang', hp: 18, mp: 12, d: '金輪法王所練的密宗神功，共十三層，每練成一層，就有一龍一象之力。' },
  gs_blade: { n: '陰陽倒亂刃法', type: 'blade', tier: 3, attr: 'he', d: '絕情谷主公孫止的刀劍功夫，刀法使劍、劍法使刀，陰陽顛倒。', moves: [['陰陽倒亂', 1, 13, 40, 'weak'], ['刀劍互換', 4, 21, 56, 'pierce'], ['黑劍金刀', 8, 38, 92, 'bleed']] },
  qc_nail: { n: '棗核釘', type: 'dart', tier: 2, attr: 'yang', d: '裘千尺口中吐出的棗核，力道之大，可以釘入樹幹。', moves: [['棗核', 1, 8, 25], ['連珠', 4, 14, 36, 'pierce'], ['口吐棗核', 7, 24, 55, 'stun']] },
  zz_finger: { n: '一陽書指', type: 'fist', tier: 3, attr: 'yang', d: '朱子柳把一陽指化入書法，筆意即指意，草書狂放、楷書端嚴。', moves: [['房玄齡碑', 1, 13, 40, 'stun'], ['自言帖', 4, 21, 56, 'weak'], ['爾乃蠻夷', 8, 38, 92, 'pierce']] },
  kl_sword: { n: '崑崙劍法', type: 'sword', tier: 2, attr: 'he', d: '崑崙三聖何足道一脈的劍法，劍招清奇，帶著琴音般的節奏。', moves: [['崑崙雪', 1, 8, 25], ['琴劍', 4, 14, 36, 'weak'], ['三聖劍', 7, 24, 55, 'pierce']] },
  // ===== 倚天：九陽神功、武當、峨嵋、少林、明教、其他門派 =====
  jy_god: { n: '九陽神功', type: 'nei', tier: 3, attr: 'yang', hp: 22, mp: 20, d: '少林、武當、峨嵋三家九陽功出自同源。三家合一，便是九陽神功。' },
  wd_palm: { n: '綿掌', type: 'fist', tier: 2, attr: 'yin', sect: 'wudang', d: '武當派的掌法，掌力綿綿不絕，看似無力，後勁極強。', moves: [['綿掌', 1, 8, 25, 'weak'], ['柔雲', 4, 14, 36], ['綿綿不絕', 7, 24, 55, 'weak']] },
  wd_tiger: { n: '虎爪絕戶手', type: 'fist', tier: 2, attr: 'yang', sect: 'wudang', d: '武當派最狠的擒拿手，傷人下陰，張真人規定非到萬不得已不許用。', moves: [['虎爪', 1, 8, 25, 'bleed'], ['撲擊', 4, 14, 36, 'stun'], ['絕戶', 7, 24, 55, 'bleed']] },
  wd_ytt: { n: '倚天屠龍功', type: 'fist', tier: 3, attr: 'he', sect: 'wudang', d: '張三丰為弟子受難所創，把「武林至尊，寶刀屠龍」等二十四字化成一套武功。', moves: [['武林至尊', 1, 13, 40, 'weak'], ['寶刀屠龍', 4, 21, 56, 'stun'], ['倚天不出', 8, 38, 92, 'pierce']] },
  wd_hook: { n: '銀鉤鐵劃', type: 'sword', tier: 2, attr: 'he', sect: 'wudang', d: '張翠山以書法入武，爛銀虎頭鉤和判官筆使出的招式，如筆走龍蛇。', moves: [['銀鉤', 1, 8, 25], ['鐵劃', 4, 14, 36, 'pierce'], ['喪亂帖', 7, 24, 55, 'bleed']] },
  em_mj: { n: '滅劍絕劍', type: 'sword', tier: 3, attr: 'yin', sect: 'emei', d: '滅絕師太的兩門絕招，滅劍一出、絕劍隨之，殺氣逼人。', moves: [['滅劍', 1, 13, 40, 'bleed'], ['絕劍', 4, 21, 56, 'pierce'], ['滅絕', 8, 38, 92, 'pierce']] },
  em_jie: { n: '截手九式', type: 'fist', tier: 2, attr: 'yin', sect: 'emei', d: '峨嵋派的截手功夫，專截對方來勢，以快打快。', moves: [['截手', 1, 8, 25, 'weak'], ['截脈', 4, 14, 36, 'stun'], ['九式連環', 7, 24, 55]] },
  sl_vajra: { n: '大力金剛指', type: 'fist', tier: 2, attr: 'yang', sect: 'shaolin', d: '少林七十二絕技之一，指力能捏碎骨頭。武當三俠就是被這門指力所傷。', moves: [['金剛指', 1, 8, 25, 'stun'], ['捏骨', 4, 14, 36, 'bleed'], ['大力金剛', 7, 24, 55, 'pierce']] },
  sl_jy: { n: '少林九陽功', type: 'nei', tier: 2, attr: 'yang', hp: 14, mp: 10, sect: 'shaolin', d: '覺遠大師傳下的九陽真經，在少林的一支。' },
  sl_circle: { n: '金剛伏魔圈', type: 'whip', tier: 3, attr: 'yang', sect: 'shaolin', d: '渡厄、渡劫、渡難三僧以黑索佈下的圈子，圈內任你神功蓋世也難以脫身。', moves: [['伏魔', 1, 13, 40, 'weak'], ['金剛索', 4, 21, 56, 'stun'], ['金剛伏魔圈', 8, 38, 92, 'pierce']] },
  sl_body: { n: '金剛不壞體神功', type: 'nei', tier: 3, attr: 'yang', hp: 26, mp: 10, sect: 'shaolin', d: '少林護體神功，練成之後，刀槍難入。' },
  mj_ice: { n: '寒冰綿掌', type: 'fist', tier: 3, attr: 'yin', sect: 'mingjiao', d: '青翼蝠王韋一笑的掌法，寒毒入體，中者全身發抖。', moves: [['寒冰', 1, 13, 40, 'poison'], ['綿掌', 4, 21, 56, 'weak'], ['寒冰綿掌', 8, 38, 92, 'poison']] },
  mj_bat: { n: '蝠王身法', type: 'qing', tier: 3, attr: 'he', sect: 'mingjiao', dodge: 3.6, d: '青翼蝠王韋一笑的輕功，天下第一，來去如鬼魅。' },
  xs_roar: { n: '獅子吼', type: 'dart', tier: 3, attr: 'yang', d: '以內力發出的長嘯，功力淺的人聽了會發瘋。金毛獅王謝遜的成名絕技。', moves: [['長嘯', 1, 13, 40, 'stun'], ['雷音', 4, 21, 56, 'stun'], ['獅子吼', 8, 38, 92, 'pierce']] },
  kt_seven: { n: '七傷拳', type: 'fist', tier: 3, attr: 'yang', d: '崆峒派的拳法，一拳之中有七股勁力。練不得法，先傷自己。', moves: [['七傷', 1, 13, 40, 'bleed'], ['損陰', 4, 21, 56, 'pierce'], ['傷陽', 8, 38, 92, 'pierce']] },
  kl_liangyi: { n: '兩儀劍法', type: 'sword', tier: 2, attr: 'he', d: '崑崙派的劍法，與華山派的反兩儀刀法相生相剋。', moves: [['太陽', 1, 8, 25], ['少陰', 4, 14, 36, 'weak'], ['兩儀生四象', 7, 24, 55, 'pierce']] },
  hs_eagle: { n: '鷹蛇生死搏', type: 'fist', tier: 2, attr: 'he', d: '華山派兩位前輩合創的拳法，一人如鷹，一人如蛇。', moves: [['蒼鷹', 1, 8, 25], ['靈蛇', 4, 14, 36, 'weak'], ['鷹蛇生死搏', 7, 24, 55, 'bleed']] },
  xm_palm: { n: '玄冥神掌', type: 'fist', tier: 3, attr: 'yin', evil: 1, d: '玄冥二老的陰毒掌力，寒毒深入骨髓，中者生不如死。', moves: [['玄冥', 1, 13, 40, 'poison'], ['陰寒', 4, 21, 56, 'poison'], ['玄冥神掌', 8, 38, 92, 'pierce']] },
  ck_finger: { n: '幻陰指', type: 'fist', tier: 3, attr: 'yin', evil: 1, d: '成崑的陰毒指法，指力陰寒，專點要穴。', moves: [['幻陰', 1, 13, 40, 'poison'], ['陰指', 4, 21, 56, 'stun'], ['幻陰指', 8, 38, 92, 'pierce']] },
  ck_thunder: { n: '混元霹靂手', type: 'fist', tier: 3, attr: 'yang', d: '成崑的掌法，一掌拍出，如霹靂驟響。', moves: [['混元', 1, 13, 40, 'stun'], ['霹靂', 4, 21, 56], ['混元霹靂手', 8, 38, 92, 'stun']] },

  // 江湖雜學
  m_blade: { n: '斷魂刀法', type: 'blade', tier: 1, attr: 'yang', d: '江湖上的刀法，出手狠辣，招招斷人生路。', moves: [['力劈', 1, 3, 15], ['橫掃千軍', 4, 8, 24], ['破風', 7, 14, 34, 'pierce']] },
  m_fist:  { n: '太祖長拳', type: 'fist', tier: 1, attr: 'yang', d: '宋太祖傳下的拳法，大開大合，天下拳師幾乎人人會打幾趟。', moves: [['沖天炮', 1, 3, 15], ['鴛鴦腿', 4, 8, 24], ['翻身砸', 7, 14, 34, 'stun']] },
  m_sword: { n: '青城劍法', type: 'sword', tier: 1, attr: 'he', d: '蜀中青城派的入門劍法，輕快靈動，市面上有抄本流傳。', moves: [['松風', 1, 3, 14], ['流雲', 4, 8, 23], ['青城飛渡', 7, 14, 33, 'weak']] },
  m_staff: { n: '齊眉棍法', type: 'staff', tier: 1, attr: 'yang', d: '鄉間武館最常教的棍法，一根齊眉棍使得潑水不進。', moves: [['橫掃', 1, 3, 14], ['舉火燒天', 4, 8, 23], ['棍掃千軍', 7, 14, 33, 'stun']] },
  m_spear: { n: '長槍十八扎', type: 'spear', tier: 1, attr: 'yang', d: '軍中流傳的槍法，只有扎、攔、拿三樣，勝在簡單狠。', moves: [['直扎', 1, 3, 15], ['攔拿', 4, 8, 24], ['回馬槍', 7, 14, 34, 'pierce']] },
  m_whip:  { n: '九節鞭法', type: 'whip', tier: 1, attr: 'he', d: '江湖賣藝人常耍的軟兵器功夫，九節鋼鞭可長可短。', moves: [['盤龍', 1, 3, 14], ['抽梁', 4, 8, 23], ['九節連環', 7, 14, 33, 'bleed']] },
  m_qing:  { n: '燕子三抄水', type: 'qing', tier: 1, attr: 'he', dodge: 1.8, d: '入門的輕身提縱術，據說練到深處能踏水而過。' },
  m_dart:  { n: '袖箭', type: 'dart', tier: 1, attr: 'he', d: '袖底藏機，出其不意。', moves: [['袖箭', 1, 2, 12], ['連珠', 4, 8, 22], ['回馬箭', 7, 13, 32, 'pierce']] },

  // 奇遇・傳承絕學
  q_thunder: { n: '九陽真經', type: 'nei', tier: 3, attr: 'yang', hp: 17, mp: 14, d: '當年覺遠大師臨終背誦的經文，至陽至剛，內力生生不息。' },
  q_ice:     { n: '九陰真經', type: 'nei', tier: 3, attr: 'he', hp: 13, mp: 19, d: '北宋黃裳所著，天下武學總綱。上卷內功陰陽互濟，練之百病不侵。' },
  q_swan:    { n: '越女劍法', type: 'sword', tier: 3, attr: 'yin', d: '相傳春秋時越國少女阿青傳下的劍法，輕靈迅捷。江南七怪的韓小瑩使的就是這一路。', moves: [['越女採蓮', 1, 13, 40], ['枝擊白猿', 4, 21, 56, 'bleed'], ['越女劍', 8, 38, 92, 'pierce']] },
  q_king:    { n: '反兩儀刀法', type: 'blade', tier: 3, attr: 'yin', d: '華山派的刀法，與崑崙派的正兩儀劍法相生相剋，兩人合使威力倍增。', moves: [['混沌一破', 1, 13, 42], ['太陰刀', 4, 21, 58, 'bleed'], ['顛倒乾坤', 8, 38, 96, 'pierce']] },
  q_shadow:  { n: '蛇行狸翻', type: 'qing', tier: 3, attr: 'he', dodge: 3.4, d: '《九陰真經》中的身法，形如蛇行、勢如狸翻，趕路也快了三成。' },
};

/* ---------- 武功即裝備：最多裝備五門 ----------
   性質：攻擊（提供招式與攻擊力）、內功（氣血內力、內力屬性）、身法（閃避）、輔助（不出招，只給戰鬥效果）
   每門裝備中的武功依類別加能力值（入門 +1、上乘 +2、絕學 +3），部分武功另有特殊效果 */
const EQ_MAX = 5;
// 裝備欄位：主手、副手、護甲、飾品、奇物（雙手兵器佔主手與副手）
const GEAR_SLOTS = [['weapon', '主手'], ['off', '副手'], ['armor', '護甲'], ['acc', '飾品'], ['relic', '奇物']];
const GEAR_KIND = { weapon: 'weapon', off: 'off', armor: 'armor', acc: 'acc', relic: 'relic' };
// 攻擊類型：刀鞭主斬、劍槍暗器主刺、棒主鈍、拳掌主內勁
const ATK_T = { blade: 'slash', whip: 'slash', sword: 'pierce', spear: 'pierce', dart: 'pierce', staff: 'blunt', fist: 'inner' };
const ATK_TN = { slash: '斬', pierce: '刺', blunt: '鈍', inner: '內勁' };
// 敵人對各類攻擊的承受倍率（>1 怕、<1 抗）：機關人刀劍難入卻怕重擊、野獸皮糙怕刺、高手內勁深厚
const FOE_RES = {
  puppet: { slash: 0.7, pierce: 0.75, blunt: 1.35, inner: 1.15 },
  beast:  { pierce: 1.2, slash: 1.1, blunt: 0.85 },
  master: { inner: 0.8, blunt: 0.9, pierce: 1.1 },
  demon:  { pierce: 1.15, inner: 0.9 },
  blade:  { blunt: 1.1 },
  sword:  { slash: 1.1 },
};
// 反刺只對拳掌類（徒手）對手生效
const BARE_FOE = ['thug', 'master', 'beast'];
const ART_ST = { fist: 'str', blade: 'str', spear: 'str', sword: 'agi', whip: 'agi', staff: 'agi', dart: 'luck', nei: 'con', qing: 'agi' };
const ROLE_N = { atk: '攻擊', nei: '內功', qing: '身法', sup: '輔助' };
// eye 每點戰力 +3%・regen 每兩步回血比例・mpr 每兩步回內力・guard 每點減傷 15%・dmgRed 減傷・reflect 反震・foeWeak 削弱對手攻擊・crit 暴擊率・opener 開戰先發暗器・stunOpen 開戰震暈
const ART_FX = {
  jy_soul:   { pure: 1, eye: 3, foeWeak: 0.08, d: '以眼神亂人心神：戰力 +9%，對手攻擊 -8%' },
  th_sea:    { pure: 1, foeWeak: 0.18, eye: 1, d: '簫聲擾亂心神：對手攻擊 -18%，戰力 +3%' },
  gm_net:    { pure: 1, eye: 2, guard: 0.3, d: '雙掌圍攏如網：戰力 +6%，受傷 -4%' },
  mj_qk:     { pure: 1, dmgRed: 0.12, reflect: 0.3, d: '挪移敵勁：受傷 -12%，把三成傷害反震回去' },
  yy_finger: { regen: 0.04, d: '一陽指能療傷：每回合回復 4% 氣血' },
  wd_taiji:  { guard: 0.7, dmgRed: 0.05, d: '以柔克剛：受傷 -10%，受傷 -5%' },
  kong_fist: { dmgRed: 0.1, d: '以空為本：受傷 -10%' },
  qz_palm:   { guard: 0.35, d: '北斗陣守望相助：受傷 -5%' },
  hm_toad:   { guard: 0.4, d: '蛤蟆功蓄勁反撲：受傷 -6%' },
  sl_body:   { dmgRed: 0.2, d: '刀槍難入：受傷 -20%' },
  jy_god:    { regen: 0.04, mpr: 4, d: '生生不息：每回合回復 4% 氣血、4 點內力' },
  q_thunder: { regen: 0.03, mpr: 3, d: '至陽至剛：每回合回復 3% 氣血、3 點內力' },
  sl_ult:    { regen: 0.03, eye: 1, d: '易筋洗髓：每回合回復 3% 氣血，戰力 +3%' },
  q_ice:     { eye: 1, mpr: 4, d: '天下武學總綱：戰力 +3%，每回合回復 4 點內力' },
  gm_nei:    { eye: 1, crit: 5, d: '心如止水：戰力 +3%，暴擊率 +5%' },
  em_nei:    { regen: 0.03, d: '療傷之效尤佳：戰鬥中每兩步回復 3% 氣血' },
  xs_roar:   { stunOpen: 1, d: '開戰長嘯：對手第一步使不出來' },
  th_flick:  { opener: 1, crit: 6, d: '開戰先彈一指，暴擊率 +6%' },
  mg_bow:    { opener: 1.3, d: '開戰先射一箭，威力加三成' },
  jy_claw:   { crit: 8, d: '專抓要害：暴擊率 +8%' },
  yg_sad:    { crit: 10, d: '黯然銷魂：暴擊率 +10%' },
  q_shadow:  { eye: 1, d: '身法：閃避大增，戰力 +3%' },
  mj_bat:    { crit: 4, d: '身法：閃避大增，暴擊率 +4%' },
};
function artRole(id) { const k = SKILLS[id]; return k.type === 'nei' ? 'nei' : k.type === 'qing' ? 'qing' : (ART_FX[id] || {}).pure ? 'sup' : 'atk'; }
function artSt(id) { const k = SKILLS[id], r = artRole(id); return { [r === 'sup' ? 'int' : ART_ST[k.type]]: k.tier }; }
// 暗器類（非輔助）一律開戰先發
const artFx = id => { const f = Object.assign({}, ART_FX[id] || {}); if (SKILLS[id].type === 'dart' && !f.pure && !f.stunOpen && !f.opener) f.opener = 1; return f; };
function artFxText(id) {
  const f = artFx(id), k = SKILLS[id];
  if (ART_FX[id] && ART_FX[id].d) return ART_FX[id].d + (f.opener && !ART_FX[id].opener ? '；開戰先發暗器' : '');
  if (f.opener) return '開戰先發：開打前先射出一發暗器';
  if (k.type === 'nei') return '內功：氣血與內力上限，與招式屬性相合時威力大增';
  if (k.type === 'qing') return '身法：閃避與脫身';
  return '';
}

/* ---------- 門派 ----------
   from/to：門派存在的年份。旁觀者只能做到長老，掌門之位屬於歷史上的人物 */
const RANKS = ['外門弟子', '內門弟子', '真傳弟子', '長老', '掌門'];
const RANK_NEED = [0, 100, 300, 700];
const SECTS = {
  quanzhen: { n: '全真教', loc: 'zhongnan', align: 1, from: 1170, to: 1400, master: '清虛道長', style: '劍法・內功・玄門正宗',
    tasks: ['下山採買糧米香燭', '在重陽宮前接待上山的香客', '抄寫道藏經卷', '清掃終南山的石階'],
    d: '重陽真人所創，天下玄門正宗。門規森嚴，弟子眾多。', req: s => s.stats.int >= 6, reqT: '悟性須達 6',
    teach: [['qz_sword', 0, 0], ['qz_nei', 1, 60], ['qz_qing', 1, 80], ['qz_palm', 2, 160], ['qz_gold', 2, 200]], ults: [['qz_ult'], ['qz_xt']], head: '掌教' },
  gaibang: { n: '丐幫', loc: 'junshan', align: 1, from: 1050, to: 1400, master: '錢八袋', style: '拳掌・市井實戰',
    tasks: ['沿街打探各路消息回報總舵', '在渡口替幫中兄弟排解糾紛', '押送一船糧米過洞庭', '照看幫裡收留的孤兒'],
    d: '天下第一大幫，弟子遍布各地，販夫走卒、乞兒流民都是兄弟。', req: () => true, reqT: '無',
    teach: [['gb_fist', 0, 0], ['gb_nei', 1, 50], ['gb_qing', 1, 70], ['gb_palm', 2, 150]], ults: [['gb_ult'], ['gb_dog']], head: '幫主' },
  shaolin: { n: '少林寺', loc: 'shaolin', align: 1, from: 500, to: 1400, master: '慧明禪師', style: '拳掌・剛猛厚重',
    tasks: ['下山化緣、施粥濟貧', '護送香客過嵩山山道', '在藏經閣外打掃', '在羅漢堂陪練新入門的沙彌'],
    d: '武林泰山北斗，收俗家弟子，重根基，戒殺生。', req: s => s.moral >= 0 && s.stats.con >= 6, reqT: '根骨須達 6，且非奸邪之徒',
    teach: [['sl_fist', 0, 0], ['sl_nei', 1, 60], ['sl_qing', 1, 80], ['sl_palm', 2, 160], ['sl_vajra', 2, 200], ['sl_jy', 2, 240, 1262]], ults: [['sl_ult'], ['sl_circle', 1300], ['sl_body', 1300]], head: '方丈' },
  tiezhang: { n: '鐵掌幫', loc: 'tiezhang', align: -1, from: 1150, to: 1240, master: '沙香主', style: '掌法・狠辣霸道',
    tasks: ['押送一批來路不明的貨物', '替幫中收取各寨的供奉', '看守峰下的地牢'],
    d: '湘西一霸，幫主武功蓋世，暗中與金國往來。入幫者為俠義道所不齒。', req: s => s.moral <= 20, reqT: '俠義之名太盛者不收',
    teach: [['tz_palm', 0, 0], ['tz_nei', 1, 50], ['tz_qing', 1, 80], ['tz_iron', 2, 150]], ults: [['tz_ult']], head: '幫主' },
  wudang: { n: '武當派', loc: 'wudang', align: 1, from: 1300, to: 1400, master: '清風道長', style: '拳劍・以柔克剛',
    tasks: ['下山替百姓排解糾紛', '在紫霄宮前接待訪客', '抄寫經卷', '巡山'],
    d: '張三丰真人所創，門下七俠名動天下。', req: s => s.stats.int >= 6 && s.moral >= 0, reqT: '悟性須達 6，且非奸邪之徒',
    teach: [['wd_fist', 0, 0], ['wd_nei', 1, 60], ['wd_qing', 1, 80], ['wd_sword', 2, 160], ['wd_palm', 1, 90], ['wd_tiger', 2, 200], ['wd_hook', 2, 220, 1336]], ults: [['wd_zhenwu'], ['wd_ytt', 1336], ['wd_taiji', 1357], ['wd_taijian', 1357]], head: '張真人' },
  emei: { n: '峨嵋派', loc: 'emei', align: 1, from: 1285, to: 1400, master: '靜塵師太', style: '劍掌・輕靈綿密',
    tasks: ['替山下村民義診', '採集山中藥草', '巡守金頂', '抄寫經卷'],
    d: '郭襄女俠所創，門規極嚴，對魔教深惡痛絕。', req: s => s.moral >= 10 || s.stats.cha >= 7, reqT: '心存俠義（俠義 10 以上）或魅力達 7',
    teach: [['em_sword', 0, 0], ['em_nei', 1, 60], ['em_palm', 2, 160], ['em_jie', 2, 200]], ults: [['em_ult'], ['em_mj']], head: '掌門師太' },
  mingjiao: { n: '明教', loc: 'kunlun', align: 0, from: 1250, to: 1400, master: '林副使', style: '刀法・火器',
    tasks: ['替教中兄弟運送糧草', '在山下接應投奔的流民', '巡守光明頂', '探聽元軍動靜'],
    d: '源自波斯，教眾多是貧苦百姓。朝廷說他們是反賊，正派說他們是魔教。', req: s => s.moral <= 60, reqT: '名門正派出身、俠名太盛者不收',
    teach: [['mj_blade', 0, 0], ['mj_nei', 1, 50], ['mj_dart', 2, 150]], ults: [['mj_ult'], ['mj_qk']], head: '教主' },
};
// 鎮派絕學可以不只一門，依序傳授；[id, 最早年份]。武當太極拳、太極劍要到至正十七年（1357）張真人創出之後才有
// 每多學一門，門檻再提高：貢獻 1000／1600／2200、聲望 300／500／700
const ultsOf = id => (SECTS[id] && SECTS[id].ults) || [];
const sectUlt = id => { const y = typeof ad === 'function' && S ? ad() : 1222; const u = ultsOf(id).find(x => !(S && S.skills && S.skills[x[0]]) && (!x[1] || y >= x[1])); return u ? u[0] : null; };
const ultNeed = id => { const n = ultsOf(id).filter(x => S && S.skills && S.skills[x[0]]).length; return { contrib: 1000 + 600 * n, fame: 300 + 200 * n }; };
const sectOpen = id => { const k = SECTS[id], y = typeof ad === 'function' && S ? ad() : 1222; return y >= k.from && y <= k.to; };

/* ---------- 物品 ---------- */
const ITEMS = {
  jinchuang: { n: '金創藥', kind: 'med', price: 30, life: 1, d: '回復 1 點氣血' },
  shangjin:  { n: '上品金創藥', kind: 'med', price: 90, life: 2, d: '回復 2 點氣血' },
  juqi:      { n: '聚氣丹', kind: 'med', price: 110, qi: 4, d: '回復 4 點內力' },
  huichun:   { n: '回春散', kind: 'med', price: 140, life: 2, qi: 2, d: '回復 2 點氣血與 2 點內力' },
  huoxue:    { n: '活血丸', kind: 'buff', price: 80, buff: { atk: 0.15 }, d: '備戰：下一場戰鬥傷害 +15%（開打時自動生效）' },
  tiegu:     { n: '鐵骨散', kind: 'buff', price: 80, buff: { red: 0.15 }, d: '備戰：下一場戰鬥受傷 −15%（開打時自動生效）' },
  menghan:   { n: '蒙汗藥', kind: 'buff', price: 70, act: 'stun', d: '備戰：下一場開打時，七成機率令對手第一手使不出來' },
  duyan:     { n: '毒餌', kind: 'buff', price: 70, act: 'poison', d: '備戰：下一場開打時，對手中毒三手' },
  huiqi:     { n: '回氣散', kind: 'med', price: 40, qi: 2, d: '回復 2 點內力' },
  dahuan:    { n: '大還丹', kind: 'med', price: 320, life: 99, qi: 99, d: '氣血與內力全滿' },
  herb:      { n: '草藥', kind: 'misc', price: 16, d: '藥舖收購；三株可請藥舖煉成金創藥' },
  lingzhi:   { n: '千年靈芝', kind: 'tonic', price: 500, gain: { con: 1, bonusLife: 1 }, d: '服下後根骨+1、氣血上限+1（多一顆命）' },
  renshen:   { n: '百年人參', kind: 'tonic', price: 420, gain: { str: 1, bonusHp: 20 }, d: '服下後臂力+1、鬥氣上限+20' },
  shouwu:    { n: '何首烏', kind: 'tonic', price: 420, gain: { int: 1, bonusMp: 20 }, d: '服下後悟性+1、內力上限+20' },
  xuelian:   { n: '天山雪蓮', kind: 'tonic', price: 560, gain: { agi: 1, luck: 1 }, d: '服下後身法+1、福緣+1' },
  xinde:     { n: '武學心得', kind: 'page', price: 160, d: '研讀後，裝備中的武功各得 150 經驗（內功六成）' },
  neijing:   { n: '內功心法殘頁', kind: 'page', price: 180, d: '研讀後，主修內功得 400 經驗' },
  wine:      { n: '陳年花雕', kind: 'gift', price: 60, d: '贈禮：江湖兒女多愛此物。送給人，好感+6；正合對方心意，好感+14' },
  rouge:     { n: '蘇州胭脂', kind: 'gift', price: 60, d: '贈禮：女兒家的心頭好。送給人，好感+6；正合對方心意，好感+14' },
  hairpin:   { n: '白玉簪', kind: 'gift', price: 150, d: '贈禮：貴重的信物。送給人，好感+6；正合對方心意，好感+14' },
  book:      { n: '前朝孤本', kind: 'gift', price: 120, d: '贈禮：讀書人的珍藏。送給人，好感+6；正合對方心意，好感+14' },
  qin:       { n: '古琴譜', kind: 'gift', price: 120, d: '贈禮：知音難求。送給人，好感+6；正合對方心意，好感+14' },
  w_sword1:  { n: '鐵劍', kind: 'weapon', wt: 'sword', atk: 6, price: 80, st: { agi: 1 } },
  w_sword2:  { n: '青鋼劍', kind: 'weapon', wt: 'sword', atk: 14, price: 420, st: { agi: 2 } },
  w_sword3:  { n: '寒玉劍', kind: 'weapon', wt: 'sword', atk: 26, price: 0, st: { agi: 2, int: 1 } },
  w_blade1:  { n: '鬼頭刀', kind: 'weapon', wt: 'blade', atk: 7, price: 90, st: { str: 1 } },
  w_blade2:  { n: '百煉刀', kind: 'weapon', wt: 'blade', atk: 15, price: 440, st: { str: 2 } },
  w_blade3:  { n: '隕鐵刀', kind: 'weapon', wt: 'blade', atk: 27, price: 0, st: { str: 3 }, req: { str: 9 } },
  w_fist1:   { n: '鐵指套', kind: 'weapon', wt: 'fist', atk: 5, price: 70, st: { str: 1 } },
  w_fist2:   { n: '精鋼護手', kind: 'weapon', wt: 'fist', atk: 12, price: 400, st: { str: 2, con: 1 } },
  w_dart1:   { n: '柳葉鏢', kind: 'weapon', wt: 'dart', atk: 6, price: 80, st: { luck: 1 } },
  w_dart2:   { n: '透骨釘', kind: 'weapon', wt: 'dart', atk: 14, price: 420, st: { luck: 2 } },
  w_staff1:  { n: '竹棒', kind: 'weapon', wt: 'staff', atk: 5, price: 30, st: { cha: 1 } },
  w_staff2:  { n: '鑌鐵棍', kind: 'weapon', wt: 'staff', atk: 16, price: 400, st: { con: 2 }, hand: 2 },
  w_spear1:  { n: '白蠟桿槍', kind: 'weapon', wt: 'spear', atk: 9, price: 90, st: { str: 1 }, hand: 2 },
  w_spear2:  { n: '點鋼槍', kind: 'weapon', wt: 'spear', atk: 18, price: 440, st: { str: 1, con: 1 }, hand: 2, req: { str: 7 } },
  w_whip1:   { n: '長鞭', kind: 'weapon', wt: 'whip', atk: 6, price: 80, st: { agi: 1 } },
  w_whip2:   { n: '金龍鞭', kind: 'weapon', wt: 'whip', atk: 14, price: 420, st: { agi: 2 } },
  a_cloth:   { n: '牛皮護甲', kind: 'armor', def: 4, price: 70, st: { con: 1 } },
  a_gold:    { n: '金絲軟甲', kind: 'armor', def: 11, price: 520, st: { con: 2, agi: 1 }, fx: { dmgRed: 0.05, d: '輕軟貼身：受傷 -5%' } },
  acc_jade:   { n: '羊脂玉佩', kind: 'acc', price: 200, st: { cha: 2 } },
  acc_amulet: { n: '開光護身符', kind: 'acc', price: 150, st: { luck: 2 } },
  acc_bead:   { n: '菩提佛珠', kind: 'acc', price: 180, st: { int: 2 } },
  acc_belt:   { n: '虎皮腰帶', kind: 'acc', price: 180, st: { str: 1, con: 1 } },
  acc_ring:   { n: '翡翠扳指', kind: 'acc', price: 220, st: { int: 1, cha: 1 } },
  acc_boots:  { n: '千層底快靴', kind: 'acc', price: 160, st: { agi: 2 } },
  acc_sachet: { n: '百花香囊', kind: 'acc', price: 120, st: { cha: 1, luck: 1 } },
  // ---- 裝備系統 v2：雙手兵器、能力門檻、副手、奇物、詞條（參考 Life in Adventure 的裝備設計，取材原著） ----
  w_heavy:   { n: '精鐵重劍', kind: 'weapon', wt: 'sword', atk: 24, price: 720, st: { str: 2 }, hand: 2, stat: 'str', req: { str: 9 }, fx: { pierce: 1, d: '重劍無鋒，大巧不工：以臂力出劍，無視對手三成防禦' } },
  w_scholar: { n: '文士劍', kind: 'weapon', wt: 'sword', atk: 11, price: 360, st: { int: 1 }, alt: 'int', fx: { d: '劍走輕靈，悟性高者可改以悟性御劍' } },
  w_cleaver: { n: '開山斧', kind: 'weapon', wt: 'blade', atk: 20, price: 520, st: { str: 2 }, hand: 2, req: { str: 8 }, fx: { crit: 4, d: '勢大力沉：暴擊率 +4%' } },
  off_arm:   { n: '鑌鐵護臂', kind: 'off', price: 160, st: { con: 1 }, fx: { block: 12, d: '格擋：12% 機率擋下一擊' } },
  off_sleeve:{ n: '袖箭', kind: 'off', price: 180, st: { luck: 1 }, fx: { opener: 0.9, d: '開戰先發：袖中一箭，先傷對手' } },
  off_stone: { n: '飛蝗石', kind: 'off', price: 60, fx: { opener: 0.5, d: '開戰先發：擲石擾敵' } },
  off_dagger:{ n: '短匕', kind: 'off', price: 140, st: { agi: 1 }, fx: { bleed: 15, d: '短刃補刀：15% 機率令對手流血' } },
  a_thorn:   { n: '刺藤甲', kind: 'armor', def: 7, price: 380, st: { con: 1 }, fx: { thorns: 0.25, d: '反刺：拳掌類對手打你，反傷兩成五（仿桃花島軟蝟甲之意）' } },
  a_night:   { n: '夜行衣', kind: 'armor', def: 3, price: 220, st: { agi: 1 }, fx: { chk: { agi: 2 }, d: '事件中的身法檢定 +2' } },
  a_iron:    { n: '鐵葉重甲', kind: 'armor', def: 18, price: 600, st: { con: 2, agi: -1 }, req: { str: 7 }, fx: { dmgRed: 0.05, d: '厚重：受傷 -5%，身法 -1' } },
  acc_coldjade:{ n: '寒玉佩', kind: 'acc', price: 340, st: { int: 1 }, fx: { attrUp: { yin: 0.15 }, d: '寒氣入脈：陰柔武功威力 +15%' } },
  acc_sunstone:{ n: '赤陽石', kind: 'acc', price: 340, st: { str: 1 }, fx: { attrUp: { yang: 0.15 }, d: '熱力透體：陽剛武功威力 +15%' } },
  r_fistbook:{ n: '拳經殘卷', kind: 'relic', price: 300, fx: { bare: 0.25, d: '空手入白刃：不拿兵刃時，拳掌武功威力 +25%' } },
  r_flute:   { n: '玉簫', kind: 'relic', price: 420, fx: { foeWeak: 0.08, d: '簫音擾敵：對手攻擊 -8%' } },
  r_page:    { n: '真經殘頁', kind: 'relic', price: 0, fx: { regen: 0.02, eye: 1, d: '殘頁心法：每兩步回 2% 氣血，戰力 +3%' } },
  wumu:      { n: '武穆遺書', kind: 'relic', price: 0, fx: { eye: 2, chk: { int: 1 }, d: '岳家兵法：戰力 +6%，事件中的悟性檢定 +1' } },
  jiuyin:    { n: '九陰真經殘卷', kind: 'relic', price: 0, fx: { attrUp: { yin: 0.15 }, d: '陰柔心法：陰柔武功威力 +15%' } },
  jianglong: { n: '降龍譜殘頁', kind: 'relic', price: 0, fx: { attrUp: { yang: 0.15 }, d: '陽剛掌力：陽剛武功威力 +15%' } },
  junpai:    { n: '軍中腰牌', kind: 'quest', price: 0, d: '雁門的軍中腰牌，憑它可以到雁門找當年的老兵。（任務物，不能賣）' },
  chu_sword: { n: '草繩纏柄的劍', kind: 'weapon', wt: 'sword', atk: 13, price: 0, st: { agi: 1 }, d: '楚狂的佩劍，草繩纏著劍柄，磨得發亮。（不能賣）' },
  yaoxiang:  { n: '郎中的藥箱', kind: 'quest', price: 0, d: '郎中託付的藥箱，要送到城南破屋。（任務物，不能賣）' },
  luo_letter:{ n: '駱寒的信', kind: 'quest', price: 0, d: '劍客駱寒託付的信，要親手交給他女兒阿蘅。（任務物，不能賣）' },
  luo_sword: { n: '駱寒的劍', kind: 'weapon', wt: 'sword', atk: 12, price: 0, st: { agi: 1 }, d: '劍客駱寒的佩劍，劍身上還留著舊痕。（任務物，不能賣）' },
  yaopai:    { n: '王府腰牌', kind: 'relic', price: 0, fx: { chk: { cha: 2 }, d: '趙王府的腰牌，燕京城裡沒人敢攔：事件中的魅力檢定 +2' } },
  mudao:     { n: '兒時的木刀', kind: 'relic', price: 0, fx: { crit: 3, chk: { luck: 1 }, d: '村口柳樹下挖出的舊木刀：暴擊率 +3%，事件中的福緣檢定 +1' } },
  rongxiao:  { n: '黃蓉的玉簫', kind: 'relic', price: 0, fx: { foeWeak: 0.06, chk: { cha: 1 }, d: '簫音擾敵：對手攻擊 −6%，事件中的魅力檢定 +1' } },
  ztbook:    { n: '老頑童的小冊', kind: 'relic', price: 0, fx: { chk: { int: 1, luck: 1 }, d: '胡亂寫的玩意兒，翻著翻著運氣也好起來：悟性、福緣檢定各 +1' } },
  anda:      { n: '安答匕首', kind: 'off', price: 0, st: { con: 1 }, fx: { bleed: 18, block: 8, d: '蒙古安答的信物：18% 機率令對手流血，8% 機率擋下一擊' } },
  baiyu:     { n: '白駝山扳指', kind: 'acc', price: 0, st: { agi: 1 }, fx: { crit: 3, d: '白駝山少主的信物：暴擊率 +3%' } },
  muqiang:   { n: '穆家舊槍', kind: 'weapon', wt: 'spear', atk: 14, price: 0, st: { str: 1, agi: 1 }, hand: 2, fx: { block: 6, d: '穆家用了十八年的舊槍：槍路穩，6% 機率擋下一擊' } },
  r_map:     { n: '江湖路引', kind: 'relic', price: 160, fx: { chk: { int: 1, cha: 1 }, d: '通曉人情地理：事件中的悟性、魅力檢定 +1' } },
  bk_fist:   { n: '《太祖長拳譜》', kind: 'manual', skill: 'm_fist', price: 120 },
  bk_sword:  { n: '《青城劍訣》', kind: 'manual', skill: 'm_sword', price: 140 },
  bk_staff:  { n: '《齊眉棍法》', kind: 'manual', skill: 'm_staff', price: 120 },
  bk_spear:  { n: '《長槍十八扎》', kind: 'manual', skill: 'm_spear', price: 140 },
  bk_whip:   { n: '《九節鞭法》', kind: 'manual', skill: 'm_whip', price: 140 },
  bk_qing:   { n: '《燕子三抄水》', kind: 'manual', skill: 'm_qing', price: 160 },
  bk_blade:  { n: '《斷魂刀譜》', kind: 'manual', skill: 'm_blade', price: 150 },
  bk_dart:   { n: '《袖箭圖解》', kind: 'manual', skill: 'm_dart', price: 150 },
};
const SHOPS = {
  yanjing: ['w_whip1', 'w_whip2', 'w_spear1', 'w_spear2', 'jinchuang', 'huiqi', 'dahuan', 'huoxue', 'tiegu', 'w_sword1', 'w_sword2', 'w_blade1', 'w_blade2', 'w_fist1', 'w_fist2', 'a_cloth', 'wine', 'book', 'bk_blade'],
  linan:   ['w_staff1', 'jinchuang', 'huichun', 'huiqi', 'dahuan', 'renshen', 'shouwu', 'w_dart1', 'w_dart2', 'w_sword1', 'a_cloth', 'a_gold', 'rouge', 'hairpin', 'qin', 'wine', 'bk_dart'],
  jiaxing: ['w_whip1', 'w_staff1', 'w_spear1', 'jinchuang', 'huiqi', 'menghan', 'duyan', 'xuelian', 'w_sword1', 'w_blade1', 'a_cloth', 'rouge', 'wine', 'book'],
  xiangyang: ['w_spear1', 'w_spear2', 'w_staff2', 'jinchuang', 'shangjin', 'juqi', 'huiqi', 'dahuan', 'tiegu', 'neijing', 'w_sword1', 'w_sword2', 'w_blade1', 'w_blade2', 'a_cloth', 'a_gold', 'wine', 'book', 'bk_blade'],
};

/* ---------- 出身：開局隨機投胎，依年代不同 ----------
   base：沿用的出身類型（決定能遇到哪些出身事件）　loc：出生地　open：開場身世
   land：射鵰篇創角時可選的出身之地（中原走楊康線、蒙古走郭靖線）；沒有 land 的出身不在這兩個選項裡 */
const isBirth = (s, k) => (s.birth || s.origin).includes(k);
const yr = s => (s.y0 || 1222);
/* ---------- 武功組合：兩門外功同時備戰時的加成 ---------- */
const COMBOS = [
  { n: '玉女素心劍法', d: '全真劍法與玉女劍法同使，一陽一陰，雙劍合璧', has: s => s.eq.some(x => ['qz_sword', 'qz_ult'].includes(x)) && s.eq.includes('gm_sword'), mul: 1.3 },
  { n: '丐幫雙絕', d: '降龍十八掌與打狗棒法，一剛一柔', has: s => s.eq.includes('gb_ult') && s.eq.includes('gb_dog'), mul: 1.25 },
  { n: '太極拳劍', d: '太極拳與太極劍，圓轉如意', has: s => s.eq.includes('wd_taiji') && s.eq.includes('wd_taijian'), mul: 1.25 },
  { n: '桃花島絕藝', d: '桃華落英掌與彈指神通，掌指並施', has: s => s.eq.includes('th_palm') && s.eq.includes('th_flick'), mul: 1.2 },
  { n: '左右互搏', d: '一心二用，左手一門拳、右手一門掌', has: s => s.flags && s.flags.huibo && s.eq.filter(x => SKILLS[x].type === 'fist' && artRole(x) === 'atk').length >= 2, mul: 1.25 },
  { n: '同門相濟', d: '三門武功出自同一門派，路數相通', has: s => { const c = {}; s.eq.forEach(x => { const k = SKILLS[x].sect; if (k) c[k] = (c[k] || 0) + 1; }); return Object.values(c).some(v => v >= 3); }, mul: 1.1 },
];
const LEGEND_ARMS = [
  { n: '軟蝟甲', d: '桃花島至寶，甲上倒刺，拳腳打上去反傷自己。', hist: 'h_1224a' },
  { n: '打狗棒', d: '丐幫幫主信物，碧綠如玉。', hist: 'h_1224b' },
  { n: '玄鐵重劍', d: '獨孤求敗的重劍，重八八六十四斤，劍鈍無鋒。', hist: 'h_1259b' },
  { n: '屠龍刀', d: '「武林至尊，寶刀屠龍。號令天下，莫敢不從。」', hist: 'h_1336a' },
  { n: '倚天劍', d: '「倚天不出，誰與爭鋒。」峨嵋派掌門的佩劍。', hist: 'h_1346' },
];
const activeCombo = () => S && S.eq ? COMBOS.find(c => c.has(S)) || null : null;

// C：事件選項（s：g 正派、e 反派、n 無視或拒絕）
const C = (s, t, go, x) => Object.assign({ s, t, go }, x || {});
const ORIGINS = [
  { n: '牛家村農家子', land: '中原', base: '山中獵戶', from: 1200, to: 1235, loc: 'linan', st: { con: 2, agi: 1 }, herb: 2,
    d: '臨安城外牛家村的佃農之子。', open: s => [
      `你生在臨安城外的牛家村，一個種田打魚的小村子。\n\n你出生那年，村裡出過一件大事：一個雪夜，一隊官兵闖進村子，殺了兩戶人家的男人，兩個懷著身孕的女人下落不明。村裡的老人說，那兩家姓郭、姓楊，男人都是好漢。`,
      '你爹是個老實的佃農，一輩子沒出過臨安府。他常說：「好漢都死得早。」\n\n你十六歲這年春天，村口的酒店來了一個跛腳的老頭，喝醉了就說北邊在打仗、江湖上要出大人物了。你聽了一整夜，第二天收拾了一個小包袱。'],
    choices: [C('g', '跪別爹娘，進城去', () => '娘往你包袱裡塞了兩株曬乾的草藥：「頭疼腦熱的時候煎了喝。」' + addItem('herb', 2) + gain({ moral: 3 })),
      C('e', '夜裡偷了地主家兩隻雞，換盤纏上路', () => '雞賣了三十文錢。地主家的狗追了你兩里地。' + gain({ silver: 30, moral: -4 })),
      C('n', '天沒亮就悄悄走了', () => '你在村口回頭看了一眼。屋頂的炊煙還沒起來。' + gain({ agi: 1 }))] },
  { n: '蒙古牧民之子', land: '蒙古', base: '山中獵戶', from: 1200, to: 1265, loc: 'mobei', st: { agi: 2, con: 1 }, silver: -60,
    d: '漠北草原上逐水草而居的牧民之子。', open: s => [
      yr(s) < 1235
        ? '你生在漠北的草原上，會騎馬比會走路還早。\n\n小時候你常去看一個漢人少年練武。教他的是七個怪人：一個瞎子、一個矮胖子、一個樵夫、一個書生……他們罵他笨，罵得很兇，那少年卻從不還嘴，一練就是一整天。'
        : '你生在漠北的草原上，會騎馬比會走路還早。\n\n你爹跟著大軍南征，回來時帶了一匹好馬、一身傷，和一肚子的故事。他說南邊有一座叫襄陽的城，守城的漢人將軍是大汗當年的金刀駙馬，怎麼也打不下來。',
      '你十六歲那年，部落裡來了漢人商隊。你看著他們從南邊帶來的絲綢和瓷器，忽然很想知道，那片沒有草原的土地是什麼樣子。\n\n你跟著商隊南下了。身上除了一張弓、一把刀，什麼都沒有。'],
    choices: [C('g', '把最好的那匹馬留給阿媽', () => '阿媽摸著馬鬃，什麼也沒說，只把一袋奶乾塞進你懷裡。' + gain({ moral: 3, con: 1 })),
      C('e', '臨走前順走商隊一馱貨', () => '貨裡是兩匹絲綢，你在半路就賣了。商隊的頭領後來一直在打聽你。' + gain({ silver: 50, moral: -4 })),
      C('n', '策馬追上商隊，不回頭', () => '商隊的頭領拍拍你的肩：「草原的孩子，到了南邊可別被人騙了。」' + gain({ luck: 1 }))] },
  { n: '燕京王府的小廝', base: '破廟孤兒', from: 1200, to: 1235, loc: 'yanjing', st: { luck: 2, agi: 1, int: 1 }, silver: -60,
    d: '金國趙王府裡打雜的小廝。', open: s => [
      '你五歲被賣進燕京的趙王府，在馬廄裡長大。\n\n王府裡最尊貴的是小王爺。他比你大不了幾歲，長得俊，武功也好，教他武功的是一個從終南山來的道士，和一個你看一眼就渾身發冷的瞎眼女人。',
      '王妃待下人很好。她住在王府最偏的一間小屋裡，屋前種著一片江南的花，屋裡擺著一桿生了鏽的鐵槍，誰都不許碰。\n\n你十六歲那年，管家說你手腳不乾淨，把你攆了出來。其實你只是在王妃的屋外多站了一會兒，聽她一個人在哭。'],
    choices: [C('g', '對著王府磕個頭再走', () => '你不知道自己在謝誰。也許是那個哭的王妃。' + gain({ moral: 2, cha: 1 })),
      C('e', '揣上順來的半吊錢就走', () => '你在馬廄的草堆裡藏了半吊錢，誰也不知道。' + gain({ silver: 40, moral: -3 })),
      C('n', '什麼也不帶，空手出城', () => '城門口的金兵看你兩手空空，連問都懶得問。' + gain({ agi: 1 }))] },
  { n: '嘉興漁家子', land: '中原', base: '破廟孤兒', from: 1200, to: 1370, loc: 'jiaxing', st: { con: 2, luck: 1 }, silver: -40,
    d: '嘉興南湖上打魚為生的漁家孩子。', open: s => [
      '你生在嘉興南湖的一條漁船上，在水上長大。\n\n南湖邊有座煙雨樓，常有江湖人在樓上喝酒、比劍、吵架。你小時候最愛把船划到樓下，躲在蘆葦叢裡偷看，看到精彩處，連魚咬了鉤都不知道。',
      `你爹說，江湖人都是瘋子，好好的日子不過，偏要拿命去爭一口氣。\n\n可你十六歲這年，${yr(s) < 1300 ? '湖上來了一群道士，說要在煙雨樓等什麼人。' : '湖上來了一群帶刀的人，說要找一個金頭髮的瘋子。'}你看著他們，心裡那口氣，也燒起來了。`],
    choices: [C('g', '把漁船留給爹，上岸去', () => '你爹沒說話，只是往你手裡塞了一串銅錢。' + gain({ silver: 20, moral: 2 })),
      C('e', '把鄰船晾著的魚簍一起賣了', () => '魚簍換了三十五文。鄰家的老漁夫在岸邊罵了半天，罵的是誰你心裡清楚。' + gain({ silver: 35, moral: -3 })),
      C('n', '跟著那群人走', () => '你跟了他們半天，被一個人發現，笑著趕了回來。可你已經上了岸，就不想再回去了。' + gain({ agi: 1 }))] },
  { n: '臨安書香門第', land: '中原', base: '書香門第', from: 1200, to: 1370, loc: 'linan', st: { int: 3 }, silver: 80,
    d: '臨安城裡一戶讀書人家的子弟。', open: s => [
      `你生在臨安的一戶讀書人家，祖父中過進士，父親考了三次都沒考上。\n\n家裡的書房有一面牆的書，你最愛看的卻是壓在最底下那幾本：${yr(s) < 1280 ? '前朝的野史、江湖的傳奇，還有一本講華山論劍的手抄本，不知道是誰寫的。' : '宋朝的舊史、江湖的傳奇。祖父說，天下換了主人，讀書人的書，也就沒人要了。'}`,
      `十六歲這年，父親要你繼續考功名。${yr(s) >= 1280 ? '可是元朝的科舉時開時停，漢人南人更是難上加難。' : ''}你看著窗外，想起書裡那些仗劍走天下的人。\n\n你在桌上留了一封信，帶走了半箱盤纏和一本手抄本。`],
    choices: [C('g', '在信裡寫：「三年後回來。」', () => '你不知道自己會不會回來。但這句話讓你心裡好受一些。' + gain({ moral: 2, int: 1 })),
      C('e', '順手帶走祖父的端硯去變賣', () => '端硯在當鋪換了八十兩。你一路上都不敢想父親發現時的臉色。' + gain({ silver: 80, moral: -3 })),
      C('n', '只寫了四個字：「兒去也。」', () => '寫完你自己都覺得太瀟灑了。' + gain({ cha: 1 }))] },
  { n: '鏢局之後', base: '鏢師之後', from: 1200, to: 1370, loc: 'yanjing', item: 'w_fist1', st: { str: 2, con: 1 },
    d: '燕京一家小鏢局的鏢師之子。', open: s => [
      `你爹是燕京「平安鏢局」的鏢頭，走了二十年鏢，跑遍了大江南北。\n\n你從小在鏢局的院子裡長大，看著鏢師們練拳、喝酒、吹牛。他們說得最多的是${yr(s) < 1240 ? '江南七怪、全真七子，還有一個叫「北丐」的老叫化，一頓飯能吃掉一頭羊。' : yr(s) < 1300 ? '襄陽城的郭大俠，和一個獨臂的神鵰大俠。' : '武當七俠，和一把叫屠龍的刀。'}`,
      '你十六歲這年，你爹押一趟鏢去南方，就再沒有回來。鏢局的人說，鏢被劫了，人也沒了，只找回了一副鐵指套。\n\n鏢局散了。你戴上那副鐵指套，決定自己去南方看看。'],
    choices: [C('g', '去鏢局的老師傅那裡辭行', () => '老師傅把你爹當年的拳譜塞給你：「你爹的功夫不怎麼樣，可他教人教得好。」' + (battleXp(80) || '') + gain({ moral: 2 })),
      C('e', '把鏢局剩下的家當拿去當了', () => '刀架、鏢車、兩副鞍子，換了六十兩。老鏢師們看著空蕩蕩的院子，沒人說話。' + gain({ silver: 60, moral: -3 })),
      C('n', '把你爹的鏢旗收進包袱', () => '你總覺得，有一天會在某個地方，再見到這面旗。' + gain({ str: 1 }))] },
  { n: '襄陽守軍之子', base: '鏢師之後', from: 1240, to: 1273, loc: 'xiangyang', st: { str: 2, con: 1 }, item: 'w_blade1',
    d: '襄陽城頭一個老兵的兒子。', open: s => [
      '你爹是襄陽城裡的一個老兵，守了一輩子城牆。\n\n你從小在城頭上長大，聽慣了號角和戰鼓。每年蒙古兵打過來，城裡的百姓就扛著石頭上城。你七歲那年，第一次往城下扔了一塊磚。',
      '城裡最受敬重的是郭大俠和郭夫人。郭大俠每天都在城頭巡視，見了你這樣的孩子，會停下來摸摸你的頭。\n\n你十六歲這年，你爹說：「出去看看吧。襄陽不是天下，天下也不只有打仗。」他把自己那把鬼頭刀解了下來。'],
    choices: [C('g', '「我會回來守城的。」', () => '你爹笑了，笑得像城頭的老槐樹。' + gain({ moral: 4 })),
      C('e', '臨走前摸進軍需庫，拿了一包碎銀', () => '守庫的老兵是你爹的熟人，他看見了，別過頭去沒有作聲。' + gain({ silver: 60, moral: -5 })),
      C('n', '接過刀，什麼也沒說', () => '刀很沉。你這才知道，你爹這些年扛的是什麼。' + gain({ con: 1 }))] },
  { n: '江南鹽商之子', land: '中原', base: '富商子弟', from: 1200, to: 1370, loc: 'linan', st: { cha: 2, luck: 1 }, silver: 300,
    d: '臨安鹽商的少爺，錦衣玉食。', open: s => [
      `你家是臨安數一數二的鹽商，三進的大宅，十幾個丫鬟。${yr(s) >= 1280 ? '改朝換代的時候，你爹第一個把大元的旗子掛上了門樓。' : ''}\n\n你從小什麼都不缺，只缺一件事：你爹不准你學武。他說，有錢人家的孩子學武，是給自己找麻煩。`,
      '你偏偏學了。你偷偷拜了府裡的護院教頭當師父，練了五年，被你爹發現了。\n\n你們大吵了一架。第二天，你帶著三百兩銀票，從後門走了。'],
    choices: [C('g', '給娘留一封信', () => '你知道娘會哭。但你也知道，她會偷偷給你寄錢。' + gain({ silver: 100, moral: 2 })),
      C('e', '撬開爹的錢櫃，再拿三百兩', () => '銀票厚厚一疊。走出後門時，你聽見帳房先生在屋裡喊抓賊。' + gain({ silver: 300, moral: -6 })),
      C('n', '頭也不回地走了', () => '你走得很快，快到來不及後悔。' + gain({ luck: 1 }))] },
  { n: '丐幫收養的孤兒', land: '中原', base: '破廟孤兒', from: 1200, to: 1370, loc: 'junshan', st: { luck: 2, con: 2 }, silver: -100,
    d: '被丐幫叫化子撿來養大的孤兒。', open: s => [
      '你是在洞庭湖邊被一個老叫化撿到的，那年你才三歲，餓得只剩一口氣。\n\n你在君山的破廟裡長大，跟著叫化子們討飯、聽他們吵架、看他們打架。他們教你的第一件事是：「討飯不丟人，偷搶才丟人。」',
      `你十六歲這年，撿你的老叫化死了。臨死前他說：「你不算丐幫的人，我沒讓你入幫。江湖這麼大，你自己去看看。看夠了，${yr(s) < 1225 ? '再回來。' : '想回來，君山的門永遠開著。'}」\n\n你給他磕了三個頭，拿了他的破碗和竹棒，下了君山。`],
    choices: [C('g', '把竹棒插在老叫化的墳頭', () => '叫化子們說，這是丐幫的規矩。你雖不是丐幫的人，他們還是替你守了一夜。' + gain({ moral: 3, cha: 1 })),
      C('e', '把破廟裡大家討來的錢揣走', () => '錢不多，三十來文。你下山時，背後一個叫化子都沒有。' + gain({ silver: 30, moral: -5 })),
      C('n', '帶著竹棒上路', () => '那根竹棒很輕，可你走到哪裡，叫化子們看見了都會對你點點頭。' + gain({ luck: 1 }))] },
  { n: '武當山下的樵戶', base: '山中獵戶', from: 1300, to: 1370, loc: 'wudang', st: { con: 2, str: 1 }, herb: 3,
    d: '武當山腳砍柴為生的樵戶之子。', open: s => [
      '你家住在武當山腳下，祖祖輩輩都是砍柴的。\n\n你小時候常背著柴上山，賣給紫霄宮的道士們。有一回你在山道上摔了，柴撒了一地，一個鬚髮全白的老道士幫你一根根撿起來，還教你怎麼背柴才不累腰。後來你才知道，他就是張真人。',
      '你照著老道士教的法子背了十年柴，腰沒壞，力氣倒大了不少。\n\n十六歲這年，你想上山拜師，道士們說你年紀太大了。你在山門口站了一天，最後決定先下山去看看。'],
    choices: [C('g', '把最後一擔柴送上山', () => '收柴的小道士多給了你十文錢：「張真人說，下回見到你，叫你再試試。」' + gain({ con: 1, moral: 2 })),
      C('e', '把濕柴混進乾柴，高價賣給山下客店', () => '客店掌櫃點不著火，罵了你三天。那時你已經走遠了。' + gain({ silver: 30, moral: -2 })),
      C('n', '轉身下山，不回頭', () => '山風很大。你想，總有一天你會回來的。' + gain({ agi: 1 }))] },
  { n: '明教信徒之子', base: '破廟孤兒', from: 1300, to: 1370, loc: 'xiangyang', st: { con: 1, str: 1, luck: 1 }, silver: -60,
    d: '淮漢一帶明教信徒的孩子。', open: s => [
      '你生在襄陽城外的一個村子，村裡十戶有八戶信明教。\n\n每年冬天最冷的時候，村裡的人會聚在祠堂裡，點起火，一起念：「焚我殘軀，熊熊聖火。生亦何歡，死亦何苦。」你小時候不懂，只覺得那火很暖。',
      '你十五歲那年，官兵來了，說村裡藏著反賊。你爹被抓走了，再也沒有回來。\n\n你在山裡躲了一年。十六歲這年，你決定出去，看看這個要抓你爹的天下，到底是什麼樣子。'],
    choices: [C('g', '對著火堆念一遍那幾句話', () => '念完了，你心裡的火也點起來了。' + gain({ str: 1, moral: 2 })),
      C('e', '去官府告發藏在山裡的教眾，換賞錢', () => '賞錢八十兩。那天夜裡，山裡的火光燒了很久。' + gain({ silver: 80, moral: -12 })),
      C('n', '把信教的事藏在心裡', () => '你決定先活下去。活下去，才能看清楚。' + gain({ int: 1 }))] },
  { n: '大都色目商人之子', base: '富商子弟', from: 1280, to: 1368, loc: 'yanjing', st: { cha: 2, int: 1 }, silver: 250,
    d: '大都一個色目商人的混血兒子。', open: s => [
      '你爹是從西域來的色目商人，在大都開了一間香料鋪。你娘是個江南女子，被賣到大都，你爹替她贖了身。\n\n你長得不像漢人，也不像色目人。大都的孩子叫你「雜種」，你學會的第一件事是打架。',
      '你十六歲這年，你爹的鋪子被一個蒙古王爺看上了，連鋪帶貨都被收走。你爹說：「這就是大都。走吧，去南邊，去你娘的老家看看。」\n\n他給了你一袋銀子，和一句你記了一輩子的話：「別信那些說你是什麼人的人。你自己決定你是什麼人。」'],
    choices: [C('g', '「我是你的兒子。」', () => '你爹抱了你很久。' + gain({ moral: 3, cha: 1 })),
      C('e', '夜裡潛回鋪子，偷回一箱香料', () => '王府的家丁睡得很死。一箱香料在南下的路上換了八十兩。' + gain({ silver: 80, moral: -3 })),
      C('n', '「我會把鋪子拿回來的。」', () => '你爹搖搖頭，卻笑了。' + gain({ str: 1 }))] },
  { n: '峨嵋山下的採藥人', base: '山中獵戶', from: 1285, to: 1370, loc: 'emei', st: { agi: 2, int: 1 }, herb: 4,
    d: '峨嵋山腳採藥為生的人家。', open: s => [
      '你家在峨嵋山腳採藥，賣給山上的尼姑庵和山下的藥舖。\n\n你小時候常在山裡迷路，有一回被一個穿青衫的女尼撿到，她背著你走了二十里山路，一路上一句話都沒說，只在把你交給你娘時說了一句：「山裡有蛇。」',
      '你十六歲這年，聽說峨嵋派的女尼們要下山去打魔教。山上的庵堂空了一半。\n\n你想跟去看看，卻被擋在山門外：「峨嵋不收男弟子入室。」你揹起藥簍，自己下了山。'],
    choices: [C('g', '採一株最好的藥，留在山門口', () => '你不知道誰會撿到它。也許是那個青衫的女尼。' + gain({ moral: 3, luck: 1 })),
      C('e', '翻牆偷挖庵堂後院的藥圃', () => '庵堂的藥比山裡的好得多。你背著鼓鼓的藥簍下山，沒敢回頭。' + addItem('herb', 6) + gain({ moral: -3 })),
      C('n', '把藥簍裡的藥全帶上', () => '這些藥在路上能換不少銀子。' + addItem('herb', 3))] },
];
const originsFor = y => ORIGINS.filter(o => y >= o.from && y <= o.to);

const STAT_N = { str: '臂力', con: '根骨', int: '悟性', agi: '身法', luck: '福緣', cha: '魅力' };
const STAT_D = { str: '外功傷害', con: '氣血與防禦', int: '修煉速度', agi: '命中與閃避', luck: '奇遇與暴擊', cha: '人緣與情緣' };

/* ---------- 可結緣之人 ---------- */
// 戀愛只限異性：男主角的有緣人須為「她」，女主角須為「他」
const loveOK = (s, id) => !!NPCS[id] && (s.gender === '男' ? NPCS[id].ta === '她' : NPCS[id].ta === '他');
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
