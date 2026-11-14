/* 江湖歲月錄 — 主線故事：每局隨機生成（爭奪之物、真相、幕後黑手、內奸、三位守護者的所在），由玩家行動推進 */
'use strict';

const P_ITEM = {
  jade:   { piece: '半塊玉佩', whole: '天機圖', each: '玉佩', mw: '塊', hide: '你把它縫進了衣襟的夾層。', desc: '玉佩只有半個巴掌大，斷口參差，正面刻著半幅山水，背面三個小字只剩兩個半：「天機」，和一個看不全的字。' },
  sword:  { piece: '一截斷劍', whole: '名劍「斷水」', each: '斷劍', mw: '截', hide: '你用破布把它纏好，貼身綁在背上。', desc: '那是一柄劍的前三分之一，斷口平滑如鏡，劍脊上刻著半個「水」字。握在手裡，隱隱透著涼意。' },
  scroll: { piece: '一卷殘經', whole: '《山河經》', each: '殘卷', mw: '卷', hide: '你把它塞進了貼身的竹筒。', desc: '經卷只有巴掌寬，絹面發黃，上頭的字一個也不成句，像是每隔幾個字就被抽掉了幾個。卷首題著：「山河經・卷上」。' },
};
const P_TRUTH = {
  lock:   { short: '不是武功，是一把鎖', real: w => `「是，也不是。獨孤絕晚年練成了一門邪功，叫『血河』，練到深處要靠殺人續命。他廢不掉它，就把全本封進了一座石室。${w}，就是開那扇門的鑰匙。」` },
  ledger: { short: '不是武功，是一本帳', real: w => `「那是一本帳。三十年前，七大門派聯手滅了一個不肯低頭的小門派，瓜分了它的藏經閣。獨孤絕把每一家拿了什麼、殺了誰，一筆一筆全記了下來，藏在一座石室裡。${w}，就是開那扇門的鑰匙。誰拿到那本帳，誰就能讓半個武林跪下。」` },
  army:   { short: '不是武功，是一支軍隊', real: w => `「那是前朝的藏兵圖。嵩嶽深處埋著夠三萬人用的甲冑刀槍，還有養得起他們十年的金銀。獨孤絕是前朝最後一個將軍，到死都沒等到用它的那一天。${w}，就是開那扇門的鑰匙。」` },
};
const P_VILL = {
  li:  { n: '血煞教主厲無咎', short: '厲無咎', minion: '血煞教探子', cap: '血煞教壇主', who: 'boss', style: 'demon', mark: '腰裡繫著紅牌子，上頭刻著個「煞」字。血煞教的人', call: '教主' },
  yue: { n: '武林盟主嶽鎮山', short: '嶽鎮山', minion: '蒙面劍手', cap: '蒙面首領', who: 'elder', style: 'master', mark: '腰裡繫著血煞教的紅牌子——可那牌子新得發亮，像是剛刻的', call: '主人' },
  cao: { n: '東廠督公曹無傷', short: '曹無傷', minion: '東廠番子', cap: '東廠檔頭', who: 'boss', style: 'sword', mark: '腳上穿的是官靴，說話帶著京城口音', call: '督公' },
};
const P_C1 = {
  fengchen: { job: '擺渡的陳伯', ask: '「擺渡的陳伯？老君渡啊，出東門沿黃河走一天半就到。那老頭擺了三十年渡，脾氣怪得很。」', where: '老君渡', art: 'dock', scene: '你趕到老君渡時，天剛擦黑。渡口沒有船，只有一間茅屋在燒。', prop: '半截船槳' },
  linan:    { job: '說書的陳伯', ask: '「說書的陳伯？那得去臨安。西湖邊的茶樓裡說了三十年書，只說前朝舊事，別的一概不說。」', where: '臨安城', art: 'river', scene: '你趕到臨安時已是深夜。茶樓早打烊了，後院的柴房卻亮著火光。', prop: '一塊醒木' },
  bore:     { job: '賣茶的陳伯', ask: '「賣茶的陳伯？嵩嶽山門外有個茶棚，一文錢一碗茶，賣了三十年。老頭話少，茶倒是真好。」', where: '嵩嶽般若寺', art: 'temple', scene: '你趕到嵩嶽山腳時，天剛擦黑。山道旁的茶棚塌了半邊，爐火引著了草簾。', prop: '一把銅茶壺' },
};
const P_G2 = {
  cangmang: { where: '蒼莽山腳的青石鎮', n: '柳承風', art: 'fight', p1: '你還沒進鎮，就聞到了煙味。青石鎮口火光沖天，一夥人正在挨家挨戶地搜。祠堂前，一位重傷的白髮劍客護著十幾個孩子，劍尖在抖，人卻沒有退。' },
  linan:    { where: '臨安西湖', n: '柳承風', art: 'river', p1: '西湖上最大的那艘畫舫正在下沉。船頭站著一位白髮琴師，膝上橫著一張斷了弦的琴，四周的小舟上全是持刀的人。船艙裡傳出歌女們的哭聲。' },
  baihua:   { where: '百花谷', n: '柳承風', art: 'valley', p1: '百花谷外的藥廬被圍了。藥架倒了一地，一位白髮郎中擋在病榻前，手裡只有一桿藥秤。榻上躺著的，是幾個發著高燒的孩子。' },
};
const P_G3 = {
  hanhai:  { where: '瀚海大漠', n: '沙老頭', art: 'desert', p1: '你在大漠裡走了七天，水囊見底的時候，看見了一縷炊煙。流沙邊有間土屋，屋前拴著二十幾匹馬，一夥馬賊正把一個乾瘦的老頭按在沙地上。', foe: '馬賊王「沙裡飛」', out: '風果然起了，黃沙遮天蔽日，剩下的人一哄而散。' },
  tianlan: { where: '天嵐山', n: '守洞老人', art: 'snow', p1: '天嵐山後有條無人走的雪徑，盡頭是個冰洞。洞口的雪地上躺著幾個採藥人打扮的漢子——可採藥人不會帶淬毒的弩。一個披著熊皮的老人被逼到了崖邊。', foe: '弩手頭目', out: '雪崩的悶響從山頂滾下來，剩下的人丟了弩就逃。' },
  xuanzhen: { where: '紫霄峰玄真觀', n: '燒火道人', art: 'temple', p1: '玄真觀的後廚裡，燒了三十年火的啞道人正被五個香客打扮的人按在灶台上。灶膛裡的火映著他們袖中的短刃。觀裡的鐘聲還在響，沒有人知道這裡出了事。', foe: '假香客頭目', out: '前殿傳來腳步聲，剩下的人翻窗逃了。' },
};
const P_TRAITOR = {
  pei:    { who: 'pei', n: '「小孟嘗」裴照', fix: 12 },
  xiaoer: { who: 'kid', n: '酒樓的店小二', fix: 10 },
  biao:   { who: 'gu', n: '威遠鏢局的少鏢頭', fix: 11 },
};
function rollPlot() {
  const c1 = pick(Object.keys(P_C1));
  return { item: pick(Object.keys(P_ITEM)), truth: pick(Object.keys(P_TRUTH)), villain: pick(Object.keys(P_VILL)), traitor: pick(Object.keys(P_TRAITOR)),
    c1, g2: pick(Object.keys(P_G2).filter(x => x !== c1)), g3: pick(Object.keys(P_G3)) };
}
const DEFAULT_PLOT = { item: 'jade', truth: 'lock', villain: 'li', traitor: 'pei', c1: 'fengchen', g2: 'cangmang', g3: 'hanhai' };
const PL = s => { const p = s.plot || DEFAULT_PLOT; return { p, I: P_ITEM[p.item], T: P_TRUTH[p.truth], V: P_VILL[p.villain], R: P_TRAITOR[p.traitor], C: P_C1[p.c1], G2: P_G2[p.g2], G3: P_G3[p.g3] }; };
const keys = s => 1 + (s.flags.key2 ? 1 : 0) + (s.flags.key3 ? 1 : 0) - (s.flags.keyLost ? 1 : 0);

const ORIGIN_OPEN = {
  '鏢師之後': (I, C) => `你爹走了一輩子鏢，最後一趟沒能回來。抬回來的只有一口氣和${I.piece}。他攥著你的手，把東西按進你掌心：「去洛陽……打聽一個${C.job}。別問為什麼，也別讓任何人看見這東西。」`,
  '書香門第': (I, C) => `祖父下葬那夜，你在他書匣的夾層裡摸到${I.piece}，底下壓著一張字條，墨跡已經發黃：「吾孫親啟。此物干係重大，祖父守了它三十年，今後由你來守。持此去洛陽，尋一個${C.job}。切記，莫示於人。」`,
  '山中獵戶': (I, C) => `養父是個沉默的老獵戶，直到嚥氣前你才知道，他那一身翻山越嶺的本事不是打獵練出來的。他從貼身的皮囊裡摸出${I.piece}：「我躲了三十年，躲不動了。你下山去洛陽，打聽一個${C.job}。這東西……別讓人看見。」`,
  '富商子弟': (I, C) => `母親病重時把你叫到床前，從陪嫁的妝匣暗格裡取出${I.piece}。「你外祖父不是商人，」她說，「他是江湖人。這是他留下的，也是他的仇家一直在找的。娘護不住它了。去洛陽，打聽一個${C.job}——別告訴你爹。」`,
  '破廟孤兒': (I, C) => `你不知道爹娘是誰。破廟的老乞丐說，撿到你的時候，襁褓裡除了你，只有${I.piece}。老乞丐臨死前把它還給你：「有人拿這個來問過三次，我都說沒見過。娃娃，你命裡有事。去洛陽，打聽一個${C.job}，他認得這東西。」`,
};

const STORY = [
  { ch: '序章　來歷', goal: '', ready: () => true, log: s => `帶著${PL(s).I.piece}來到洛陽，要找一個${PL(s).C.job}。`,
    scene: s => { const { I, C } = PL(s); return { type: '主線', title: I.piece, art: 'road',
      pages: [(ORIGIN_OPEN[s.origin] || ORIGIN_OPEN['破廟孤兒'])(I, C), `${I.desc}\n\n${I.hide}`,
        `走了一個多月，洛陽城的城樓終於出現在官道盡頭。城門口人來人往，挑擔的、騎馬的、佩刀的，沒有人多看你一眼。\n\n你今年十六歲，${s.silver >= 50 ? `身上有${s.silver}兩銀子` : '身上只有幾個銅板'}，和一個不能讓人看見的秘密。\n\n得先找個消息靈通的地方問問。`],
      choices: [{ t: '走進洛陽城', go: () => '城裡最熱鬧的是酒樓。南來北往的人都在那裡歇腳，要打聽消息，沒有比那更好的去處。〔主線目標已更新，可在「江湖」頁上方查看〕' }] }; } },

  { ch: '第一章　故人', goal: s => `在洛陽城的酒樓打聽${PL(s).C.job}`, rumor: () => '要找人？問店小二，他什麼都知道。',
    ready: s => s.flags.askChen, log: s => `打聽到陳伯在${PL(s).C.where}，還有另一夥人也在找他。`,
    scene: s => { const { C, V } = PL(s); return { type: '主線', title: '酒樓問路', art: 'city', who: 'kid',
      pages: [`店小二擦著桌子，頭也不抬：${C.ask}`, `他忽然停下手，壓低聲音：「客官，您是這個月第三撥來問他的了。前兩撥問完話連茶錢都沒給。」\n\n他瞄了一眼你的臉色：「小的多嘴。那幾位，看著可不像是去敘舊的。」`],
      choices: [
        { t: '多給五兩賞錢，問清那些人的來歷', cond: s2 => s2.silver >= 5, go: () => `小二把銀子攏進袖子，聲音更低了：「那夥人${V.mark}。他們三天前出的城。」\n\n三天。你心裡一沉。` + gain({ silver: -5 }) },
        { t: '道聲謝，立刻動身', go: () => '你放下酒錢起身。門外的日頭正往西斜。' },
      ] }; } },

  { ch: '第一章　故人', goal: s => `前往${PL(s).C.where}，尋找陳伯（「趕路」）`, rumor: () => '這幾天城外的官道上，常見到生面孔，走路沒聲音的那種。',
    ready: s => s.loc === PL(s).p.c1, log: () => '救下陳伯，他臨終前說出了那件東西的來歷。',
    scene: s => { const { I, C, V } = PL(s); return { type: '主線', title: '火光', art: C.art, who: 'elder',
      pages: [`${C.scene}\n\n火光裡，三個人圍著一個白髮老者。老者手裡攥著${C.prop}，左肩一片血紅，卻還站著。`,
        `「陳老頭，」為首的那人說，「${V.call}只要你那${I.mw}${I.each}。你守了三十年，夠本了。」\n\n老者啐出一口血沫：「要東西沒有，要命一條。」\n\n他的目光越過那人的肩膀，落在你身上，忽然定住了——像是認出了什麼。`],
      choices: [{ t: '衝上前去', go: () => ({ battle: foe(V.minion, 1, 0.42, 'blade'), noFlee: true, intro: '另外兩個人被陳伯拚死纏住。為首的那個轉過身，朝你抽出了刀。',
        win: s2 => chenWords(s2, '那人倒在火光裡，另外兩個見勢不妙，翻牆逃進了夜色。'),
        lose: s2 => { s2.hp = Math.round(maxHp() * 0.4); return chenWords(s2, `你被一刀背砸翻在地。陳伯怒吼一聲，用${C.prop}砸碎了那人的後腦——那是他最後的力氣。剩下兩個拖著傷逃了。`); } }) }] }; } },

  { ch: '第二章　拜師', goal: '拜入一個門派（到各派山門「拜師入門」；陳伯說要先學本事）', rumor: () => '想學真本事得拜師。各家山門都收徒，只是各有各的門檻。',
    ready: s => s.sect, log: () => '拜入門派，師父認出了那件東西。',
    scene: s => { const { I, V } = PL(s), k = SECTS[s.sect], me = s.sect === 'xuesha' && s.plot.villain === 'li'; return { type: '主線', title: '師父的眼神', art: 'legacy', who: me ? 'boss' : 'elder',
      pages: me
        ? [`入教第三天夜裡，你被帶上血煞崖頂。教主厲無咎背對著你，望著崖下的雲海。\n\n「把你藏著的東西拿出來。」\n\n你渾身的血都涼了。`,
           `他只看了一眼，就笑了。「陳老鬼守了三十年的東西，竟自己送上門來。」他把${I.each}拋還給你，「留著。本座不搶自家人的東西。」`,
           `「${I.whole}一分為三，你手裡是其一。」他終於轉過身，目光像刀子，「替本座找齊另外兩${I.mw}。事成之後，這教主之位，未必不能是你的。」\n\n你退下時，看見石階旁站著一個紅衣女子，正若有所思地望著你。`]
        : [`拜師禮畢，${k.master}讓旁人都退下，只留你一人。\n\n「你進門時，下意識護了三次同一個地方。」那目光很平靜，「藏的是什麼？」\n\n你猶豫了很久，終於取出了${I.piece}。`,
           `${k.master}的臉色變了。那是你第一次，也是唯一一次，見到這位掌事失態。\n\n「三十年前，武聖獨孤絕坐化之前，把${I.whole}一分為三，交給三個他信得過的人。江湖上都說那裡頭藏著他畢生絕學。為了它，死了不下千人。」`,
           `「陳渡是其中一個。你這${I.mw}的原主，是另一個。」${k.master}把東西推回你面前，「收好。在你有本事守住它之前，不要再讓第二個人看見。」\n\n「等你成了內門弟子，我再告訴你剩下的事。」`],
      choices: [{ t: '把東西收好', go: () => me ? '你走下血煞崖。厲無咎沒有搶，這比搶更讓你不安。' : '從今天起，你有了師門，也有了必須變強的理由。' }] }; } },

  { ch: '第二章　拜師', goal: '在門派中晉升為內門弟子（做門派任務累積貢獻 100，再通過「晉升考核」）', progress: s => s.sect ? `累計貢獻 ${s.contribTotal}/100` : '你已離開師門：自行苦練到足夠強也可以',
    ready: s => s.rank >= 1 || power() >= 14, log: s => `得知第二位守護者在${PL(s).G2.where}。`,
    scene: s => { const { I, G2, G3 } = PL(s); return { type: '主線', title: '第二位守護者', art: 'legacy', who: 'elder',
      pages: [s.sect ? `${SECTS[s.sect].master}把你叫進內室，關上了門。` : '你憑自己的本事闖出了一點名堂，也從故紙堆和酒桌上，一點點拼出了當年的事。',
        `「三個人：陳渡已經死了。${G2.n}隱居在${G2.where}。還有一位，三十年前去了${G3.where}，再沒有消息。」\n\n「那夥人既然找得到陳渡，就找得到另外兩個。」`,
        `「去${G2.where}找${G2.n}。把陳渡的死訊告訴他，再問問他，${I.whole}裡到底是什麼。」\n\n「三十年了。我總覺得，江湖上傳的那個說法，不對。」`],
      choices: [{ t: '領命', go: () => '〔主線目標已更新〕' }] }; } },

  { ch: '第三章　血案', goal: s => `前往${PL(s).G2.where}，尋訪${PL(s).G2.n}（「趕路」→ ${LOCS[PL(s).p.g2].n}）`, rumor: s => `${PL(s).G2.where}前幾天夜裡出了事，沒人敢去看。`,
    ready: s => s.loc === PL(s).p.g2, log: s => `${PL(s).G2.where}遭襲，${PL(s).G2.n}說出半句真相。`,
    scene: s => { const { I, T, V, G2, G3 } = PL(s); return { type: '主線', title: `${LOCS[s.plot ? s.plot.g2 : 'cangmang'].n}血案`, art: G2.art,
      pages: [G2.p1, `帶頭的人舉起了刀：「${G2.n}，交出${I.each}，這些人還能活。」\n\n老人笑了一聲：「三十年前，也有人這麼跟我說過。」`],
      choices: [
        { t: '「住手！」', go: () => ({ battle: foe(V.cap, 6, 0.6, V.style), noFlee: true,
          win: s2 => { s2.flags.key2 = true; return `帶頭的倒下，餘眾潰散。${G2.n}靠著牆滑坐下去，把一${I.mw}染血的${I.each}塞進你手裡。\n\n「陳渡的後人？好，好……」他喘著氣，「聽著。${I.whole}${T.short}。到底是什麼，只有${G3.where}的那一位知道。去找他。」` + gain({ fame: 50, moral: 15 }); },
          lose: s2 => { s2.hp = Math.round(maxHp() * 0.3); return `你倒下了。醒來時四周已是一片狼藉。一個倖存的孩子告訴你，${G2.n}被那些人帶走了，東西也被搶了。\n\n他臨走前託孩子帶給你一句話：「${I.whole}${T.short}。去${G3.where}，找最後那一位。」`; } }) },
        { t: '寡不敵眾，躲在暗處看著', go: () => `你看著火燒了一整夜。天亮後你在灰燼裡找到${G2.n}，他只剩一口氣：「東西……被搶了……${I.whole}${T.short}……去${G3.where}……」` + gain({ moral: -10 }) },
      ] }; } },

  { ch: '第四章　真相', goal: s => `前往${PL(s).G3.where}，尋找最後一位守護者（「趕路」→ ${LOCS[PL(s).p.g3].n}；備足丹藥）`, rumor: s => `${PL(s).G3.where}有個怪老頭，一住三十年，從不跟人說話。`,
    ready: s => s.loc === PL(s).p.g3, log: s => `找到${PL(s).G3.n}，得知${PL(s).I.whole}的真相。`,
    scene: s => { const { I, G3 } = PL(s); return { type: '主線', title: '最後一位', art: G3.art, who: 'elder',
      pages: [G3.p1, `「老東西，」為首的說，「有人出一千兩黃金買你那${I.mw}${I.each}。你是自己交，還是我把你的手剁下來拿？」\n\n老人瞇著眼，像在算時辰：「再等一刻鐘，你們就都走不了了。」`],
      choices: [{ t: '出手救人', go: () => ({ battle: foe(G3.foe, 8, 0.58, 'blade'), noFlee: true,
        win: s2 => shaWords(s2, `${G3.foe}倒下了。${G3.out}`),
        lose: s2 => { s2.hp = Math.round(maxHp() * 0.3); return shaWords(s2, `你被打翻在地。就在這時，${G3.out}一隻乾瘦的手把你拖到了安全的地方。`); } }) }] }; } },

  { ch: '第五章　四指', goal: '闖出名聲後回洛陽，把內奸找出來（聲望須達 250，並身在洛陽）', progress: s => `聲望 ${s.fame}/250`, rumor: () => '洛陽城裡最近多了不少打聽消息的人，連店小二都說忙不過來。',
    ready: s => s.loc === 'luoyang' && s.fame >= 250, log: s => `揭穿了三十年前的內奸：${PL(s).R.n}。`,
    scene: s => traitorScene(s) },

  { ch: '終章　決戰', goal: '大敵將至。備妥丹藥、練好武功後，在洛陽城中選「赴洛陽決戰」', progress: s => `你手中的${PL(s).I.each}：${keys(s)} ${PL(s).I.mw}`, rumor: () => '城裡的鏢局都在往外撤。要出大事了。',
    ready: s => s.flags.goFinal && s.loc === 'luoyang', log: s => `洛陽城中，與${PL(s).V.short}決一死戰。`,
    scene: s => finalScene(s) },

  { ch: '尾聲', goal: '', ready: () => true, log: () => '塵埃落定。',
    scene: s => epilogue(s) },
];

function chenWords(s, lead) {
  const { I } = PL(s);
  return `${lead}\n\n陳伯倒在你懷裡，血已經浸透了半邊衣裳。他看見你藏著的東西，笑了。\n\n「我認得它……也認得你這雙眼睛，和當年一模一樣。」\n\n「${I.whole}，一分為三。你一${I.mw}，我一${I.mw}，還有一${I.mw}在……」他咳出一口血，把話嚥了回去，「你還太弱，守不住。先找個門派，學本事。」\n\n他抓緊你的手腕，瞳孔開始散了：「記住……莫信……」\n\n莫信誰？他沒能說完。` +
    gain({ moral: 3, silver: 30 }) + addItem('jinchuang', 2) + (xp(s.nei, 80) || '');
}
function shaWords(s, lead) {
  const { I, T, G3 } = PL(s);
  s.flags.key3 = true;
  return `${lead}\n\n${G3.n}聽你說完另外兩位的事，半天沒有作聲。\n\n「都以為${I.whole}裡是武聖的絕學。」他終於開口。${T.real(I.whole)}\n\n他把最後一${I.mw}${I.each}放進你手裡，又說了一句讓你脊背發涼的話：\n\n「當年出賣我們行蹤的，是個替人望風的孩子，被陳渡削掉了左手一根小指。這人如今就在洛陽，日日與人打交道，誰也不會疑心他。你回去，多看看別人的手。」` +
    gain({ bonusMp: 25, int: 1 }) + (xp(s.nei, 200) || '');
}
function traitorScene(s) {
  const { p, I, V, R } = PL(s);
  const after = { li: '「血煞教傾巢而出，三個月內兵臨洛陽。厲無咎等不及了。」', yue: `「嶽盟主已廣發英雄帖，要在洛陽英雄台上『當眾銷毀${I.whole}，以絕後患』。那是個局。他要你自己把東西送上台。」`, cao: `「東廠的緹騎已經封了洛陽四門。督公親至，限三日交出${I.whole}，否則屠城。」` }[p.villain];
  const pages = {
    pei: ['武林盟主嶽鎮山在府中設宴，款待各路豪傑。你把這一路的事說了，只隱去了東西在誰身上。\n\n「照兒，」盟主吩咐，「替我敬這位少俠一杯。」', '敬酒的是盟主的義子、連續三屆英雄會魁首——「小孟嘗」裴照。他笑得溫文爾雅，雙手捧杯。\n\n你接過酒杯的時候，看清了他的左手。\n\n四根手指。\n\n那一夜三更，你房間的窗紙被輕輕捅破了。'],
    xiaoer: ['你又坐進了初到洛陽時的那間酒樓。還是那張桌子，還是那個店小二，還是那句：「客官，要點什麼？」', '他擦桌子的時候，你頭一回認真看了他的手。左手，四根手指，斷口是很多年前的舊傷。\n\n你想起來了：第一天，是他告訴你陳伯在哪裡。也是他，「好心」提醒你有人先去了。\n\n他一直都知道。每一個來問路的人，他都賣了兩次。\n\n小二抬起頭，對上你的目光，臉上那副討好的笑一點點收了起來。'],
    biao: ['威遠鏢局的少鏢頭在門口攔住你，滿臉熱絡：「久仰大名！家父常提起您。裡面請，有趟要緊的鏢，非您押不可。」', '他伸手替你掀簾子。左手，四根手指。\n\n鏢局。天南地北的消息、誰往哪裡去、誰家藏著什麼人——沒有比鏢局更清楚的地方了。三十年來，三位守護者的行蹤，就是從這扇門裡一趟一趟送出去的。\n\n後堂的門在你身後關上了。少鏢頭臉上的笑還在，手已經按在了刀柄上。'],
  }[p.traitor];
  return { type: '主線', title: '四根手指', art: p.traitor === 'pei' ? 'night' : 'city', who: R.who, pages,
    choices: [{ t: '「等你多時了。」', go: () => ({ battle: foe(R.n, R.fix, 0.62, 'master'), noFlee: true, intro: `「你不該認出來的。」${R.n}亮出了兵刃。`,
      win: () => `${R.n}的兵刃脫手飛出。\n\n「三十年前我才九歲！」他嘶聲道，「他們要我望風，我能怎麼辦？後來一步錯，步步錯……是${V.short}！一直都是${V.short}！他要湊齊${I.whole}，我只是他養的一條狗！」\n\n${p.villain === 'yue' ? '你腦中嗡的一聲。武林盟主。那個人人敬仰的嶽鎮山。\n\n' : ''}窗外有人急急敲門，是來報信的：${after}` + gain({ fame: 60 }),
      lose: s2 => { s2.hp = Math.round(maxHp() * 0.3); s2.flags.keyLost = true; return `你倒在血泊裡。${R.n}從你身上搜走了一${I.mw}${I.each}，臨走前低聲說：「別怪我。要怪就怪${V.short}，是他要這東西。」\n\n${p.villain === 'yue' ? '武林盟主。那個人人敬仰的嶽鎮山。\n\n' : ''}你掙扎著爬起來時，報信的人已經到了門口：${after}`; } }) }] };
}
function finalScene(s) {
  const { p, I, V } = PL(s);
  if (p.villain === 'li' && s.sect === 'xuesha') return Object.assign({}, FIXED.arc3, { type: '主線' });
  const lost = s.flags.keyLost ? `少了一${I.mw}${I.each}的你，面對的是一個準備得更充分的對手。\n\n` : '';
  const text = {
    li: `血煞教兵臨洛陽。厲無咎負手立在陣前，聲音不大，卻傳遍了整個城頭：「本座只要那三${I.mw}${I.each}。交出來，洛陽城雞犬不驚。」\n\n武林盟主上前接戰，三招落敗，重傷嘔血。${lost}群雄的目光在人群中搜尋，最後一道接一道，落在了你的身上。`,
    yue: `洛陽英雄台，萬人空巷。嶽鎮山一身素袍立在台上，聲如洪鐘：「${I.whole}為禍武林三十年。今日請這位少俠將它交出，嶽某當眾毀去，以絕後患！」\n\n台下掌聲雷動。沒有人知道，這三十年的禍，正是台上這個人一手釀的。\n\n${lost}你一步一步走上台。嶽鎮山微笑著伸出手，眼底沒有一絲笑意：「孩子，給我。」`,
    cao: `洛陽四門緊閉。東廠督公曹無傷坐在城樓的太師椅上，慢條斯理地撥著茶沫，腳下跪著一排五花大綁的百姓。\n\n「咱家數到十。」他的聲音又尖又輕，「${I.whole}不到，砍一個。」\n\n${lost}各派掌門面面相覷——與朝廷動手，是滅門的罪。\n\n「一。」`,
  }[p.villain];
  const c = [{ t: p.villain === 'yue' ? '「嶽盟主，三十年前的帳，今日該算了。」' : '踏前一步：「我來。」', go: () => ({ battle: foe(V.n, 26 + (s.flags.keyLost ? 3 : 0), 0.4, V.style), noFlee: true,
    win: s2 => { s2.flags.savedWulin = true; return `${V.short}仰面倒下。先是一片死寂，然後是山呼海嘯般的歡呼。\n\n這一天，被後世的說書人講了一百年。` + gain({ fame: 300, moral: 20 }); },
    lose: s2 => { s2.hp = Math.round(maxHp() * 0.2); return `你倒在了${V.short}面前，被同道拚死搶回。你這一戰，為眾人爭得了撤退的時間；${V.short}也受了傷，暫時退走。\n\n東西還在你手裡。事情還沒有完。` + gain({ fame: 60 }); } }) }];
  if (p.villain === 'li' && (s.flags.lover === 'li' || s.spouse === 'li')) c.push({ t: '請厲紅綃出面勸父', go: () => { S.flags.savedWulin = true; return '紅衣女子走到兩軍陣前，把刀架在了自己頸上：「爹，你要這天下，還是要女兒？」\n\n厲無咎的手抖了很久，終於仰天長嘆。血煞教退兵三百里，立誓二十年不入中原。' + gain({ fame: 200, moral: 15 }); } });
  c.push({ t: '隱在人群中，不發一言', go: () => `最終是幾位前輩聯手，以命換命，才逼退了${V.short}。你活了下來，卻很久不敢看鏡子裡的自己。` + gain({ fame: -30, moral: -10 }) });
  return { type: '主線', title: '洛陽決戰', art: 'fight', who: V.who, text, choices: c };
}
function epilogue(s) {
  const { p, I } = PL(s);
  const open = s.flags.savedWulin ? '洛陽的硝煙散了。' : s.flags.demonLord ? '你成了血煞教的新主人。' : '這一戰沒有贏家。許多日子以後，';
  const full = keys(s) >= 3, end = '\n\n【主線完結】往後的江湖路，隨你的心意去走。';
  const door = { lock: '門楣上刻著武聖的親筆：\n\n「吾晚年創『血河』一功，練成之日，方知此功以人命為薪，不死不休。吾殺不了它，只能鎖住它。後來者至此，望念蒼生，莫開此門。」',
    ledger: '門楣上刻著武聖的親筆：\n\n「此中所記，皆是實情。吾當年在場，未曾阻止，亦是罪人。留此一冊，非為要挾誰，只為有朝一日，有人敢把它念出來。」',
    army: '門楣上刻著武聖的親筆：\n\n「國破之日，吾藏此甲兵，以待復國。三十年後回望，百姓已安居樂業，不知前朝為何物。吾方知，此物一出，便是十年兵禍。後來者慎之。」' }[p.truth];
  const choices = { lock: [
      { t: `把${I.each}毀去，讓這扇門永遠打不開`, go: () => '碎片從你指縫間落進山澗。風吹過石門，像一聲很長的嘆息。\n\n三十年的守護，到你這裡，終於可以放下了。' + end + gain({ moral: 20, fame: 100, bonusHp: 60, bonusMp: 40 }) },
      { t: '打開石門。武學沒有正邪，只看用的人', cond: () => full, go: () => '石室正中只有一卷帛書。你讀完最後一個字時，丹田裡像是有什麼東西醒了過來。\n\n你得到了武聖畢生的功力，也聽見了心底那個陌生的聲音。' + end + gain({ moral: -30, bonusHp: 150, bonusMp: 120, str: 2, con: 2 }) + learn('xs_ult') },
      { t: '分藏三處，交給下一代人去守', go: () => '你把它們分別埋在了三個只有你知道的地方，又在心裡默默記下了三個值得託付的名字。\n\n守護者的故事還會繼續。只是這一次，由你來寫開頭。' + end + gain({ moral: 10, fame: 60, int: 2, bonusMp: 60 }) }],
    ledger: [
      { t: '一把火燒了它。死人的帳，不該壓在活人身上', go: () => '火舌舔過一個個顯赫的名字。你知道有些人永遠得不到公道了，也知道有些仇殺因此不會發生。\n\n你說不清這是對是錯。' + end + gain({ moral: 8, fame: 60, bonusHp: 60, bonusMp: 40 }) },
      { t: '帶出去，在英雄會上一字一句念出來', cond: () => full, go: () => '你念了整整一個時辰。台下從喧嘩，到死寂，到有人開始磕頭謝罪。七大門派的聲望一夜掃地，江湖亂了三年，然後，慢慢長出了一些新的東西。\n\n很多人恨你。也有很多人，終於等到了這一天。' + end + gain({ moral: 25, fame: 250, cha: 2, bonusMp: 40 }) },
      { t: '收進懷裡。這是天下最鋒利的一把刀', cond: () => full, go: () => '從那以後，各派掌門見了你都格外客氣，逢年過節還有厚禮送到。\n\n你再也沒有交到過一個真心的朋友。' + end + gain({ moral: -30, fame: 120, silver: 3000 }) }],
    army: [
      { t: '封死洞口，讓它永遠睡在山裡', go: () => '你推下了洞頂的斷龍石。轟然一聲，三萬副甲冑重新歸於黑暗。\n\n山下的村莊炊煙裊裊，沒有人知道他們剛剛躲過了什麼。' + end + gain({ moral: 20, fame: 100, bonusHp: 60, bonusMp: 40 }) },
      { t: '甲兵不動，取出金銀賑濟災民', cond: () => full, go: () => '那一年黃河決口，有人在七個州縣同時開了粥棚，一開就是兩年。百姓只知道施主姓「武」，名「聖」。\n\n你覺得，老將軍會喜歡這個用法。' + end + gain({ moral: 30, fame: 200, silver: 800, luck: 2 }) },
      { t: '據為己有。亂世裡，兵就是道理', cond: () => full, go: () => '三年後，嵩嶽一帶多了一支不屬於任何人的私兵。朝廷和江湖都不敢惹你。\n\n夜裡你常夢見武聖門楣上的那行字。' + end + gain({ moral: -30, fame: 200, silver: 3000, str: 2 }) }] }[p.truth];
  return { type: '主線', title: '最後一扇門', art: 'end',
    pages: [`${open}你獨自來到嵩嶽深處，按最後那位守護者說的方位，找到了一扇石門。`, `石門上有三個凹槽。${door}`,
      `你把手裡的${keys(s)}${I.mw}${I.each}握在掌心，站了很久。\n\n陳伯和另外兩位，還有你的長輩，四個人用了三十年，守的原來是這個。${full ? '' : '\n\n東西不全，這扇門你打不開。但要讓別人也永遠打不開，卻不難。'}`],
    choices };
}

function storyDue() {
  if (S.story == null) { S.story = S.flags.savedWulin || S.flags.demonLord ? STORY.length : 0; S.journal = S.journal || []; }
  if (!S.plot) S.plot = Object.assign({}, DEFAULT_PLOT);
  const st = STORY[S.story];
  if (!st || !st.ready(S)) return null;
  S.story++;
  S.journal.push({ t: dateStr(), ch: st.ch, s: st.log(S) });
  return st.scene(S);
}
function storyNow() {
  const st = S.story == null ? STORY[0] : STORY[S.story];
  if (!st) return null;
  const f = v => typeof v === 'function' ? v(S) : v;
  return { ch: st.ch, goal: f(st.goal), progress: st.progress ? st.progress(S) : '', rumor: st.rumor ? st.rumor(S) : '' };
}
