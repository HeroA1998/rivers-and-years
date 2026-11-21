/* 江湖歲月錄 — 歷練：事件牌流。按一次「歷練」過約一個月，抽一張事件牌：情境、兩三個選項、d20 檢定、結果。
   歷史大事到了日子會自動插入，並用劇情交代你怎麼趕到現場。 */
'use strict';

/* ---------- d20 檢定 ---------- */
const d20 = () => ri(1, 20);
const half = s => { s.hp = Math.max(1, Math.round(maxHp() * 0.3)); };
// 檢定加值：能力調整值（每 2 點差 1）＋武功加成（每 12 點戰力 +1）
const statMod = k => Math.floor((S.stats[k] - 5) / 2) + Math.floor(power() / 12);
function check(stat, dc) {
  const roll = d20(), mod = stat ? statMod(stat) : 0, total = roll + mod;
  return { roll, mod, total, dc, stat, crit: roll === 20, fumble: roll === 1, ok: roll === 20 || (roll !== 1 && total >= dc) };
}
const dieHtml = (n, crit, fumble) => `<b class="die roll${crit ? ' crit' : fumble ? ' fumble' : ''}">${n}</b>`;
const rollLine = c => `<span class="rollline">${dieHtml(c.roll, c.crit, c.fumble)} ${c.stat ? `${STAT_N[c.stat]}${c.mod >= 0 ? '+' : ''}${c.mod}` : ''} ＝ ${c.total}／難度 ${c.dc}　<em class="${c.ok ? 'win' : 'lose'}">${c.crit ? '大成功' : c.fumble ? '大失手' : c.ok ? '成功' : '失敗'}</em></span><br>`;
const reqLine = o => o.stat ? `〔${STAT_N[o.stat]}檢定・難度 ${o.dc}〕` : o.fight ? '〔動手〕' : '';

/* ---------- 事件牌語法 ---------- */
// O：檢定選項（成功 ok／失敗 no，各為 [文字, 獲得, 額外函式]）；P：無檢定；F：戰鬥
const O = (t, stat, dc, ok, no, x) => Object.assign({ t, stat, dc, ok, no }, x || {});
const P = (t, ok, x) => Object.assign({ t, ok }, x || {});
const F = (t, foe, win, lose, x) => Object.assign({ t, fight: { foe, win, lose } }, x || {});
const XP = n => () => battleXp(n) || '';
const XN = n => () => xp(S.nei, n) || '';
const HERB = n => () => addItem('herb', n);
const HEAL = () => { S.hp = Math.min(maxHp(), S.hp + Math.round(maxHp() * 0.25)); return ''; };
const HURT = p => () => { S.hp = Math.max(1, S.hp - Math.round(maxHp() * p)); return ''; };
const GOSSIP = () => gossipReveal();

// 讓聽到的下一件大事浮出來
function gossipReveal() {
  const known = S.flags.heardOf || {};
  const nx = histRumors(720, true).filter(x => !x.now && !known[x.h.id]).sort((a, b) => hStart(a.h) - hStart(b.h))[0];
  if (!nx) return '　鄰桌的人聊的都是家長里短，這陣子江湖上似乎沒有什麼大動靜。';
  S.flags.heardOf = S.flags.heardOf || {}; S.flags.heardOf[nx.h.id] = 1;
  return `\n\n「${nx.h.rumor}」——${nx.when}，${nx.where}。〔已記入江湖風聞〕`;
}

/* ---------- 四十張事件牌 ---------- */
const CARDS = [
  /* ===== 城中 ===== */
  { id: 'c_gamble', ctx: ['city'], title: '賭坊', art: 'city', text: '賭坊裡骰子聲響成一片，莊家衝你招手：「客官，押大押小，買定離手！」',
    opts: [O('押 50 兩', 'luck', 12, ['骰盅揭開，你押中了。', { silver: 60 }], ['莊家笑瞇瞇地把銀子攏了過去。', { silver: -50 }], { req: s => s.silver >= 50 }), P('只看不賭', ['你在一旁看了半天，記住了幾個老千的手法，沒有吃虧。'])] },
  { id: 'c_story', ctx: ['city'], title: '說書人', art: 'city', text: '茶樓裡說書人醒木一拍，講的正是近年江湖上的事。堂下坐滿了人，連後排都站著聽。',
    opts: [O('擠到前排細聽', 'int', 11, ['你聽出了幾處和傳聞對不上的地方，下台時說書人特意向你點頭。', { fame: 2 }, GOSSIP], ['人太多，你什麼也沒聽清。']), P('賞他 10 兩', ['說書人收了銀子，壓低聲音多說了一段只有行內人才知道的消息。', { silver: -10 }, GOSSIP], { req: s => s.silver >= 10 })] },
  { id: 'c_thief', ctx: ['city'], title: '妙手空空', art: 'city', cond: s => s.silver >= 30, text: '人群裡有人撞了你一下，連聲賠不是。你下意識摸向腰間——',
    opts: [O('反手扣住那隻手', 'agi', 12, ['你捏住了一隻正往外抽的手。是個十來歲的瘦小孩子，嚇得臉都白了。你嘆了口氣，放了他。', { moral: 3 }], ['錢袋輕了一截，那人早消失在人堆裡。', { silver: -35 }]),
      F('追上去', ['慣竊「過街鼠」', 1, 0.5, 'thug'], ['你把他按在牆角，搜出了你的銀子和一串別人的荷包。', { silver: 40, fame: 3 }], ['你被他引進死巷，吃了一頓拳腳。', { silver: -20 }])] },
  { id: 'c_brawl', ctx: ['city'], title: '酒館鬥毆', art: 'fight', text: '鄰桌兩夥人為了一碗酒吵了起來，桌椅翻倒，眼看就要動刀。掌櫃躲在櫃檯後面直哆嗦。',
    opts: [O('出面勸架', 'cha', 13, ['你三言兩語就把兩邊勸開了，掌櫃感激地送了你一壺好酒。', { fame: 3, hp: 20 }], ['兩邊都嫌你多管閒事，一起推了你一把。', { fame: -1 }]),
      F('誰先動刀我先打誰', ['滋事的潑皮', 1, 0.5, 'thug'], ['你三兩下打翻了領頭的，酒館重歸平靜。', { fame: 5, moral: 3 }], ['你寡不敵眾，被扔出了門外。', { fame: -2 }]), P('悄悄離開', ['你端起酒碗，換了一桌。'])] },
  { id: 'c_herb', ctx: ['city'], title: '藥舖', art: 'city', text: '藥舖掌櫃拿著一包來路不明的藥材犯愁：「這是山裡人送來的，我認不全。你要是懂行，勻你兩株。」',
    opts: [O('試著辨認', 'int', 11, ['你認出了其中幾味，掌櫃樂得多給了你好幾株。', {}, HERB(4)], ['你認錯了一味，被掌櫃笑了好一陣子。']), P('不懂就別碰', ['你婉拒了掌櫃的好意。'])] },
  { id: 'c_bounty', ctx: ['city'], title: '懸賞告示', art: 'fight', cond: s => s.fame >= 30, text: '城門口新貼了一張告示：城外有夥盜匪專劫商旅，官府懸賞一百兩。有人說他們的老巢就在城西的破窯。',
    opts: [F('去破窯會會他們', ['劫道的盜首', 4, 0.6, 'blade'], ['你押著盜首進了衙門，領了賞銀。', { silver: 100, fame: 12, moral: 4 }], ['你被打得滿頭是血逃了出來。', { fame: -3 }]), P('這種事不是我管的', ['你瞥了一眼告示，轉身走了。'])] },
  { id: 'c_orphan', ctx: ['city'], title: '街角的孩子', art: 'city', text: '街角蹲著一個髒兮兮的孩子，面前放著一個破碗，空空如也。他看見你，沒有伸手，只是把頭低了下去。',
    opts: [P('給他幾個錢（10 兩）', ['孩子攥著銀子跑去了包子舖。你看著他的背影，想起了從前的自己。', { silver: -10, moral: 4 }], { req: s => s.silver >= 10 }), P('買兩個包子給他', ['孩子狼吞虎嚥，吃完了朝你磕了個頭。', { silver: -3, moral: 3 }], { req: s => s.silver >= 3 }), P('走開', ['你加快了腳步。', { moral: -2 }])] },
  { id: 'c_escort', ctx: ['city'], title: '鏢局缺人', art: 'road', cond: s => power() >= 5, text: '鏢局門口貼著告示：缺短途趟子手，五日往返，酬勞從優。總鏢頭見你腰間有兵刃，招手叫住了你。',
    opts: [O('接下這趟短鏢', 'con', 11, ['一路平安，總鏢頭拍著你的肩膀，酬金一文不少。', { silver: 90, fame: 3 }], ['路上遇雨，你病倒了兩天，只拿到一半酬勞。', { silver: 40 }], { days: 5 }), F('我聽說這條路不太平', ['劫鏢的綠林好手', 3, 0.6, 'blade'], ['鏢車安然送達，總鏢頭多給了一份賞錢。', { silver: 140, fame: 8 }], ['鏢被劫了，你帶傷逃回，分文未得。', { fame: -5 }], { days: 5 })] },
  { id: 'c_guard', ctx: ['city'], title: '官差盤查', art: 'city', text: '城門口的官差把你攔了下來，上下打量：「從哪來？進城做什麼？身上帶的什麼？」他的目光停在你的兵刃上。',
    opts: [O('從容應對', 'cha', 12, ['你說得有條有理，官差揮手放行，還客氣地讓了讓路。'], ['官差越問越起疑，最後要你破財消災。', { silver: -30 }], { req: s => true }), P('塞給他 20 兩', ['官差掂了掂銀子，眼睛一眯：「進去吧。」', { silver: -20 }], { req: s => s.silver >= 20 })] },
  { id: 'c_book', ctx: ['city'], title: '舊書攤', art: 'city', text: '舊書攤上堆著一摞發黃的冊子，攤主睡眼惺忪：「隨便翻，三文一本。」你翻到一本沒有書名的手抄本，上頭畫著吐納的姿勢。',
    opts: [O('細讀手抄本', 'int', 12, ['你讀了整整一下午，把其中的口訣和自己的功夫對照，有所領悟。', { int: 1 }, XN(80)], ['字跡潦草，你看不太懂，只買了回去慢慢琢磨。', { silver: -5 }]), P('放下，走開', ['你把冊子放回了原處。'])] },
  { id: 'c_busk', ctx: ['city'], title: '街頭賣藝', art: 'city', text: '街心空地上，一個賣藝的漢子耍了一套拳，圍觀的人不少，銅錢卻沒幾個。他喘著氣望著人群，目光落在你身上。',
    opts: [O('跳進場子露兩手', 'str', 11, ['你打了一套拳，博得滿堂彩，賞錢嘩嘩落進了銅鑼。漢子執意分了一半給你。', { silver: 40, fame: 3 }], ['你一招使過了勁，差點撞翻了圍觀的人，賞錢沒掙著，還賠了點醫藥費。', { silver: -10 }]), P('丟幾個銅板', ['漢子抱拳道謝。', { silver: -2, moral: 1 }])] },
  { id: 'c_elder', ctx: ['city'], title: '摔倒的老人', art: 'city', text: '橋頭一個老人被人群擠得摔倒在地，挑著的籮筐翻了一地，圍觀的人都往後讓。',
    opts: [P('上前扶起他，幫他把東西撿好', ['老人拉著你的手連連道謝，說他是城西開茶棚的，往後你喝茶不收錢。', { moral: 3 }]), O('順手教訓那個撞人的', 'str', 11, ['你拎著那人的衣領讓他賠了禮，老人過意不去，硬塞給你一小串銅錢。', { moral: 2, silver: 15 }], ['那人跑得比兔子還快，你追了兩條街也沒追上。'])] },
  { id: 'c_dojo', ctx: ['city'], title: '武館', art: 'fight', cond: s => power() >= 6, text: '武館的招牌寫著「拳打三山，腳踢五嶽」。門口的教頭見你駐足，嗤笑道：「看什麼看？有本事進來討教兩招。」',
    opts: [F('進去討教', ['武館教頭', 3, 0.6, 'thug'], ['教頭收了拳，臉上有些掛不住，還是送了你一瓶跌打酒。', { fame: 8, hp: 15 }, XP(80)], ['你被抬了出來，躺了半天。', { fame: -3 }]), P('一笑置之', ['你笑了笑，走開了。'])] },
  { id: 'c_tavern', ctx: ['city'], title: '酒樓', art: 'city', w: 22, text: '酒樓裡人聲鼎沸，南來北往的客人在這裡歇腳，有人高談闊論，有人悶頭喝酒，也有人壓低聲音在說些什麼。',
    opts: [P('坐下要一壺酒，豎起耳朵', ['你一邊喝酒，一邊聽著鄰桌的閒聊。', { silver: -5 }, GOSSIP], { req: s => s.silver >= 5 }), O('找個看起來見多識廣的人搭話', 'cha', 11, ['那人和你聊得投機，臨走時多說了幾句內情。', {}, GOSSIP], ['對方愛理不理，你自討沒趣。'])] },

  /* ===== 野外 ===== */
  { id: 'w_slope', ctx: ['wild'], title: '山路濕滑', art: 'mountain', text: '雨後的山路滑得像抹了油，腳下的碎石一踩就滾。你抓著藤條往下挪，忽聽頭頂一聲脆響——藤斷了。',
    opts: [O('穩住身形', 'agi', 12, ['你足尖一點，穩穩落在一塊巨石上，心跳得像擂鼓。', {}, XP(60)], ['你滾了十幾丈才被一棵樹攔住，渾身青紫。', {}, HURT(0.25)])] },
  { id: 'w_beast', ctx: ['wild'], title: '猛獸', art: 'fight', text: '林深處腥風撲面，一頭斑斕猛虎伏在草叢裡，兩隻眼睛在暗處發綠光。牠已經盯上了你。',
    opts: [F('拔出兵刃', ['斑斕猛虎', 3, 0.5, 'beast'], ['猛虎倒下了。你剝下虎皮，下山可以換不少銀子。', { silver: 80, fame: 6 }], ['你負傷逃出了林子，猛虎在身後怒吼。', {}]), O('慢慢往後退', 'agi', 13, ['你一步一步退出了林子，猛虎沒有追。'], ['你剛退兩步就踩斷了枯枝，猛虎撲了上來。', {}, HURT(0.3)])] },
  { id: 'w_herb', ctx: ['wild'], title: '溪邊藥草', art: 'mountain', text: '溪水邊長著一叢你認得的藥草，葉子上還掛著露水。再往上游走，好像還有更多。',
    opts: [O('順著溪流往上找', 'luck', 11, ['你在一處背陰的石縫裡發現了成片的藥草，採了滿滿一把。', {}, HERB(6)], ['你走了很遠，只多找到幾株。', {}, HERB(2)]), P('採了眼前這叢就走', ['你小心地把藥草一株株放進行囊。', {}, HERB(3)])] },
  { id: 'w_cave', ctx: ['wild'], title: '山洞', art: 'cave', text: '一場急雨把你逼進了一個山洞。洞壁上有人用利器刻過字，歲月久了，字痕裡長滿青苔。',
    opts: [O('湊近細看', 'int', 12, ['那是一段前人練功的心得，你照著比劃了一個時辰，有些領悟。', {}, XN(120)], ['字跡太淺，你辨認了半天，只認出幾個字。']), P('升堆火，等雨停', ['雨停時，你已把衣服烤乾了。', {}, HEAL])] },
  { id: 'w_lost', ctx: ['wild'], title: '迷路', art: 'mountain', text: '天色漸暗，你發現自己在同一棵歪脖子樹下轉了第三圈。四周除了樹，什麼也沒有。',
    opts: [O('辨認星斗找方向', 'int', 11, ['你憑著星斗摸出了方向，天亮前走出了林子。'], ['你走錯了方向，在林子裡多繞了兩天。', {}, HURT(0.1)]), O('找一棵最高的樹爬上去看', 'agi', 11, ['你爬到樹頂，看見遠處有一點火光，順著它走了出去。'], ['你爬到一半樹枝斷了，摔了個屁股墩。', {}, HURT(0.15)])] },
  { id: 'w_trap', ctx: ['wild'], title: '獵戶陷阱', art: 'mountain', text: '你聽見草叢裡有悶悶的呻吟聲。一隻幼鹿的後腿被獵戶的鐵夾子夾住了，母鹿在旁邊急得直轉圈。',
    opts: [O('掰開鐵夾', 'str', 12, ['你費了好大力氣掰開鐵夾，幼鹿一瘸一拐地跟著母鹿走了，臨走時回頭看了你一眼。', { moral: 4 }], ['鐵夾紋絲不動，你被夾傷了手。', {}, HURT(0.1)]), P('這是獵戶的東西，不碰', ['你繞開走了。'])] },
  { id: 'w_bandit', ctx: ['wild'], title: '攔路', art: 'fight', text: '山道轉彎處滾下幾塊亂石，七八條漢子從林中跳出來，為首的把鬼頭刀往肩上一扛：「此山是我開！留下買路財！」',
    opts: [F('拔出兵刃', ['山賊頭目', 2, 0.55, 'blade'], ['頭目一倒，嘍囉們一哄而散。你從他身上搜出些不義之財。', { silver: 60, fame: 4, moral: 2 }], ['你被打得抱頭鼠竄，銀子也被搜走了一些。', { silver: -30 }]), P('交 30 兩買路錢', ['破財消災，山賊們讓開了路。', { silver: -30 }], { req: s => s.silver >= 30 }), O('施展身法衝過去', 'agi', 13, ['你足尖一點，從眾人頭頂掠過，山賊只來得及看見你的背影。'], ['你剛躍起就被套索絆住，被按在地上摸走了銀子。', { silver: -50 }])] },
  { id: 'w_fall', ctx: ['wild'], title: '飛瀑', art: 'mountain', text: '百丈飛瀑轟然而下，砸在潭中的巨石上，水花四濺，巨石卻紋絲不動。你站在潭邊看了很久。',
    opts: [O('在瀑下練功', 'con', 12, ['冰冷的水柱砸在肩上，你咬牙撐了一個時辰，渾身通透。', {}, XP(120)], ['你被水流沖得站立不穩，嗆了好幾口水。', {}, HURT(0.1)]), P('潭邊靜坐調息', ['水聲如雷，心卻漸漸靜了下來。', {}, XN(80)])] },
  { id: 'w_traveler', ctx: ['wild'], title: '受傷的旅人', art: 'road', text: '路邊倒著一個中年人，腿上一道深可見骨的傷口，血浸透了褲管。他看見你，勉強擠出一個笑：「少俠……能不能幫幫我？」',
    opts: [P('用金創藥替他包紮', ['他千恩萬謝，執意要把身上僅有的一點銀兩留給你，你沒要。', { moral: 5 }, () => { if (has('jinchuang')) { addItem('jinchuang', -1); return '〔用去金創藥一份〕'; } return ''; }], { req: () => has('jinchuang') }), O('背他去最近的村子', 'con', 12, ['你背著他走了十里山路，把他交給了村裡的郎中。', { moral: 4 }], ['你背到一半體力不支，兩人一起摔倒，他的傷口又裂開了。', { moral: 1 }, HURT(0.15)]), P('這是別人的事，走開', ['你快步走遠了，背後的呻吟聲漸漸聽不見。', { moral: -4 }])] },
  { id: 'w_wolves', ctx: ['wild'], title: '夜半狼嚎', art: 'night', text: '夜宿荒野，篝火快燒完時，你聽見四周亮起了一雙雙幽綠的眼睛。頭狼低吼一聲，狼群慢慢圍了上來。',
    opts: [F('背靠大樹，迎戰', ['頭狼', 4, 0.5, 'beast'], ['頭狼倒下，狼群夾著尾巴退入了黑暗。你守著殘火坐到天亮。', { fame: 4 }], ['你拚死殺出一條血路，滿身是傷。', {}]), O('添柴、揮火把驅趕', 'cha', 12, ['火光騰起，狼群遲疑片刻，終於退去。'], ['火把被撲滅了，你只得狼狽爬上樹，在上面挨了一夜。', {}, HURT(0.12)])] },

  /* ===== 任何地方 ===== */
  { id: 'a_caravan', ctx: ['city', 'wild', 'sect'], title: '商隊', art: 'road', text: '一支商隊在路邊歇腳，領隊的瘦老頭正愁人手不夠，見你背著兵刃，湊過來：「這位爺，同路嗎？管飯，到了地頭有賞錢。」',
    opts: [O('護送一程', 'con', 11, ['一路平安，老頭很滿意，多給了你一份賞錢。', { silver: 70, fame: 2 }], ['你一路疲憊，賞錢只拿到一半。', { silver: 30 }], { days: 6 }), P('婉言謝絕', ['老頭嘆了口氣，招呼夥計繼續趕路。'])] },
  { id: 'a_inn', ctx: ['city', 'wild', 'sect'], title: '客店', art: 'night', text: '日頭偏西，你在路邊的客店住下。大堂裡有個說書的瞎子，一邊拉琴一邊講故事。夥計給你端來一碗熱湯。',
    opts: [P('安心睡一覺', ['你一覺睡到天亮，渾身舒坦。', {}, () => { S.hp = maxHp(); S.mp = maxMp(); return ''; }]), O('聽瞎子講完故事', 'int', 11, ['故事講的是一個舊日門派的興衰，你聽得入了神，隱隱有些領悟。', {}, XN(60)], ['你聽到一半就睡著了。'])] },
  { id: 'a_challenger', ctx: ['city', 'wild', 'sect'], title: '年輕劍客', art: 'fight', text: '一個年輕劍客攔在路中央，抱拳道：「聽說這一帶有位高手，在下特來請教。」他的眼神很亮，劍握得很穩，看得出是下了苦功的。',
    opts: [F('點到為止', ['年輕劍客', 3, 0.6, 'sword'], ['你贏了半招。年輕人收劍行禮，由衷道：「受教了。」', { fame: 6 }, XP(100)], ['你輸了半招。年輕人臉紅了，反倒向你賠禮：「僥倖，僥倖。」', { fame: 1 }]), P('「我只是個趕路的。」', ['劍客愣了愣，讓開了路。'])] },
  { id: 'a_river', ctx: ['city', 'wild'], title: '渡河', art: 'river', text: '大河橫在眼前，渡口只剩一條破渡船，船夫叼著旱煙：「風浪大，不太好走，加錢才開船。」',
    opts: [P('多付 20 兩，乘船', ['渡船在浪裡顛簸，你抓緊船舷，總算平安靠了岸。', { silver: -20 }], { req: s => s.silver >= 20 }), O('自己游過去', 'con', 13, ['你憑著一口氣游到對岸，渾身濕透卻神清氣爽。', {}, XP(70)], ['河中心暗流把你沖出老遠，爬上岸時筋疲力盡。', {}, HURT(0.2)])] },
  { id: 'a_enemy', ctx: ['city', 'wild', 'sect'], title: '狹路相逢', art: 'fight', cond: s => s.fame >= 40, text: '客店裡，鄰桌三個人一直在偷眼看你。其中一人壓低聲音說了句什麼，三人同時站了起來，手摸向了腰間。',
    opts: [F('先下手為強', ['尋仇的惡客', 4, 0.6, 'blade'], ['你放倒了領頭的，另外兩個丟下一句狠話奪門而逃。', { fame: 8 }], ['你被打翻在地，他們搜走了你一部分銀子。', { silver: -40 }]), O('起身賠笑，付了酒錢快走', 'cha', 12, ['你一路笑著出門，沒人攔你。'], ['你剛邁出門檻，背後一把刀架在了脖子上。', { silver: -30 }])] },
  { id: 'a_temple', ctx: ['wild'], title: '雨夜破廟', art: 'night', text: '雨夜，你躲進一座荒廢的小廟。神像後面隱約有人影，火堆邊坐著一個老乞丐，正在烤一隻不知哪來的雞。',
    opts: [P('分他一點乾糧，換半隻雞', ['老乞丐樂得直拍大腿，把雞撕了一半給你，還講了一肚子江湖舊事。', { moral: 2 }, () => HEAL() + (chance(35) ? GOSSIP() : '')]), O('細看神像後面的人影', 'agi', 12, ['你發現那是一個蜷著睡覺的孩子，輕手輕腳退開，沒有驚動他。', { moral: 2 }], ['你剛靠近，那孩子驚醒大叫，引得老乞丐破口大罵，你只好狼狽退出。'])] },

  /* ===== 門派 ===== */
  { id: 's_spar', ctx: ['sect'], title: '同門切磋', art: 'fight', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '演武場上，一位同門師兄抱拳邀你切磋。四周圍滿了師兄弟，有人起鬨，有人搖頭。',
    opts: [F('請賜教', ['同門師兄', 3, 0.55, 'sword'], ['你勝了半招。師兄爽朗大笑，當晚請你喝了酒。', { contrib: 15 }, XP(100)], ['你敗了。師兄扶你起來，指出了你的三處破綻。', { contrib: 5 }, XP(60)]), P('今日不便', ['師兄聳聳肩，轉身找別人去了。'])] },
  { id: 's_exam', ctx: ['sect'], title: '師父考較', art: 'legacy', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '師父把你叫到跟前，隨手拈起一片樹葉：「你入門這些時日，功夫練得如何？來，給為師演一遍。」',
    opts: [O('把學過的功夫演一遍', 'int', 12, ['師父看完，點了點頭，單獨給你講了半個時辰。', { contrib: 20 }, XN(150)], ['你演到一半忘了下一招，師父皺了皺眉：「回去再練。」', { contrib: 3 }]), O('請師父先指點內功', 'con', 11, ['師父把手搭在你背上，一股溫熱的內息引著你走了一圈。', { contrib: 10 }, XN(100)], ['你沒能領會，師父搖頭：「火候未到。」'])] },
  { id: 's_back', ctx: ['sect'], title: '後山練功', art: 'mountain', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '後山的空地上，幾個師弟正在練功。見你走來，都停下了手：「師兄師姐，能不能指點一下？」',
    opts: [O('一招一式帶他們練', 'cha', 11, ['你講得清楚，師弟們進步很快，你自己也在教的過程中有了新的領悟。', { contrib: 15 }, XP(80)], ['你講得磕磕絆絆，師弟們面面相覷。', { contrib: 2 }]), P('自己找個角落練', ['你獨自練了一個下午。', {}, XP(70)])] },
  { id: 's_library', ctx: ['sect'], title: '藏經閣', art: 'legacy', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '藏經閣的老管事叫住你：「後面那排書架亂了，你要是閒著，幫忙整理整理，有什麼看得懂的，隨便翻翻。」',
    opts: [O('整理並翻閱', 'int', 11, ['你整理了兩個時辰，順手翻了幾本，有一段內功的口訣讓你茅塞頓開。', { contrib: 10 }, XN(130)], ['你整理得亂七八糟，老管事一邊嘆氣一邊自己重新整理。', { contrib: 2 }])] },
  { id: 's_trouble', ctx: ['sect'], title: '山下鬧事', art: 'fight', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '山門下，一夥無賴正在欺負上山燒香的老百姓。守山門的師弟匆匆跑來：「師兄師姐，他們人多，我們攔不住。」',
    opts: [F('下山去收拾他們', ['鬧事的無賴頭子', 2, 0.55, 'thug'], ['你一個人把他們打得抱頭鼠竄。百姓紛紛叩謝，山門的名聲也更響了。', { contrib: 25, fame: 4, moral: 3 }], ['你寡不敵眾，勉強把人嚇走，自己也掛了彩。', { contrib: 8 }]), O('先勸說，再喊人', 'cha', 12, ['無賴頭子被你說得下不來台，帶人灰溜溜走了。', { contrib: 15, moral: 2 }], ['無賴們根本不聽，反倒推搡起來。', { contrib: 3 }])] },
  { id: 's_hurt', ctx: ['sect'], title: '受傷的同門', art: 'legacy', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '一個師弟從山下回來，手臂上一道深口子，血還在往外滲。他強撐著笑：「沒事，皮外傷。」',
    opts: [P('用金創藥替他包紮', ['師弟感動得說不出話，第二天特意送了你一壺茶。', { contrib: 10, moral: 3 }, () => { addItem('jinchuang', -1); return '〔用去金創藥一份〕'; }], { req: () => has('jinchuang') }), O('用布條臨時止血，背他去藥房', 'con', 11, ['你一路背著他跑，到藥房時，血已經止住了。', { contrib: 8, moral: 2 }], ['你跑岔了路，兜了好大一圈才到藥房。', { contrib: 3 }])] },

  /* ===== 年代 ===== */
  { id: 'e_jin', ctx: ['city', 'wild'], y: [1222, 1234], title: '金兵盤查', art: 'road', text: '路口設了關卡，幾個金兵正挨個盤問行人，搜身、翻包袱。一個老人被推倒在地，包袱散了一地。',
    opts: [O('上前說情', 'cha', 13, ['你好言好語，塞了點銀兩，金兵終於放了老人。', { moral: 3, silver: -10 }], ['金兵不耐煩地把你也推到一邊。']), F('動手', ['金兵小隊長', 3, 0.6, 'blade'], ['你放倒了領頭的，金兵們一哄而散。老人連連磕頭。', { moral: 6, fame: 5 }], ['你被金兵們按在地上打了一頓。', { fame: -2 }]), P('低頭繞行', ['你加快了腳步。', { moral: -2 }])] },
  { id: 'e_xy', ctx: ['city', 'wild'], y: [1240, 1273], title: '襄陽募勇', art: 'fight', text: '路邊的告示牌上，襄陽城守軍正在招募義勇，凡能開弓使刀者，可領軍糧、軍餉。招兵的小校扯著嗓子：「蒙古人又要來了，有種的來！」',
    opts: [O('報名守城一月', 'con', 12, ['你在城頭守了一個月，推下無數雲梯，也見識了真正的戰場。', { silver: 60, fame: 8, moral: 4 }, XP(160)], ['你守了半個月就累病了，被抬了下來。', { silver: 20, moral: 2 }], { days: 30 }), P('這不關我的事', ['你搖搖頭，走開了。', { moral: -3 }])] },
  { id: 'e_rebel', ctx: ['city', 'wild'], y: [1335, 1368], title: '義軍', art: 'road', text: '路邊的林子裡，一群頭裹紅巾的漢子正在歇腳。他們看見你，也不躲，領頭的抱拳道：「這位朋友，如今朝廷不給活路，我們只想討個說法。你願不願意同行一段？」',
    opts: [O('同行一段，看看他們是什麼人', 'cha', 11, ['你同他們走了幾日，聽了一肚子的苦水，也見識了他們怎麼聚眾練功。', { moral: 3 }, XP(100)], ['他們對你不太放心，只讓你跟在隊尾。']), P('婉拒', ['領頭的也不勉強，叮囑你一路小心。'])] },
  { id: 'e_press', ctx: ['city'], y: [1300, 1368], title: '抓壯丁', art: 'fight', text: '街上一陣大亂，一隊官差正挨家挨戶抓壯丁，被抓的人一個接一個被繩子串成一串。一個少年被拖走，他娘追著哭喊。',
    opts: [F('擋在官差面前', ['官差頭目', 4, 0.6, 'blade'], ['你放倒了領頭的，少年掙脫繩子，扶著他娘跑開了。', { moral: 8, fame: 6 }], ['你被官差們圍住打了一頓。', { moral: 2, fame: -2 }]), O('悄悄把少年拉進暗巷', 'agi', 12, ['你趁亂把少年拉進了暗巷，官差在原地轉了好幾圈也沒找到。', { moral: 5 }], ['你剛拉住少年就被發現，兩人都被抓住了。', {}, HURT(0.15)])] },
];

/* ---------- 抽牌與結算 ---------- */
function cardCtx() { return LOCS[S.loc].kind; }
function drawCard(forceAny) {
  const kind = cardCtx(), hist = S.flags.cardHist = S.flags.cardHist || [], since = S.flags.sinceFight == null ? 99 : S.flags.sinceFight;
  const pool = CARDS.filter(c => (forceAny || !c.ctx || c.ctx.includes(kind)) && (!c.y || (ad() >= c.y[0] && ad() <= c.y[1])) && (!c.cond || c.cond(S)) && !hist.includes(c.id));
  if (!pool.length) return null;
  const ws = pool.map(c => (c.w || 10) * (c.opts.some(o => o.fight) ? (since >= 3 ? 3 : 1) : 1));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0), card = pool[0];
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) { card = pool[i]; break; } }
  hist.push(card.id); if (hist.length > 14) hist.shift();
  return cardEvent(card);
}
function applyOutcome(spec) {                       // spec: [文字, 獲得, 額外函式]
  const [t, g, fn] = spec;
  const extra = fn ? fn() : '';
  return t + (extra || '') + (g ? gain(g) : '');
}
function cardEvent(card) {
  const prefix = S.flags.moved ? `（這個月你從${S.flags.moved[0]}來到了${S.flags.moved[1]}。）\n\n` : '';
  S.flags.moved = null;
  return { type: '歷練', title: card.title, art: card.art || LOCS[S.loc].art, text: prefix + card.text, who: card.who,
    choices: card.opts.filter(o => !o.req || o.req(S)).map(o => ({ t: `${o.t}${reqLine(o) ? '　' + reqLine(o) : ''}`, go: () => resolveOpt(o) })) };
}
function resolveOpt(o) {
  if (o.days) advanceSteps(o.days);
  if (o.fight) {
    S.flags.sinceFight = 0;
    return { battle: foe(...o.fight.foe), win: () => applyOutcome(o.fight.win), lose: s => { half(s); return applyOutcome(o.fight.lose); } };
  }
  S.flags.sinceFight = (S.flags.sinceFight == null ? 1 : S.flags.sinceFight + 0);
  if (!o.stat) return applyOutcome(o.ok);
  const c = check(o.stat, o.dc);
  return rollLine(c) + applyOutcome(c.ok ? o.ok : (o.no || ['你沒能成功。']));
}

/* ---------- 推進時間 ---------- */
function histNow() {
  const t = today();
  return HIST.some(h => h.loc && h.scene && !S.hist[h.id] && S.loc === h.loc && t >= hStart(h) && t < hEnd(h));
}
function advanceSteps(days) {
  let left = days;
  while (left > 0) { const n = Math.min(5, left); advance(n); left -= n; if (histNow()) break; }
  return days - left;
}

// 已知的歷史大事臨近時，用劇情把你帶到現場
function bridgeEvent() {
  const t = today();
  const r = histRumors(720, false).find(r => {
    const h = r.h;
    if (S.loc === h.loc) return false;
    const need = travelDays(h.loc);
    return hStart(h) - t - need <= 40 && t + need < hEnd(h);
  });
  if (!r) return null;
  const h = r.h, need = travelDays(h.loc), start = hStart(h);
  return { type: '歷練', title: `動身：${LOCS[h.loc].n}`, art: LOCS[h.loc].art,
    pages: [`${h.rumor}\n\n你一直把這件事記在心上。眼看日子近了，${LOCS[h.loc].n}離這裡還有 ${cnNum(need)} 日路程。`,
      `想要親眼看見的話，就得現在動身了。你收拾好行囊，把盤纏和乾糧又清點了一遍。\n\n錯過了這一場，往後恐怕只能從別人口中聽說。`],
    choices: [{ t: `動身前往${LOCS[h.loc].n}`, go: () => {
        const from = LOCS[S.loc].n;
        log(`自${from}啟程，行了${cnNum(need)}日，抵達${LOCS[h.loc].n}。`);
        S.loc = '_road'; advance(need); S.loc = h.loc;
        let wait = Math.max(0, start - today());
        if (wait) advanceSteps(wait);
        if (chance(55)) { const c = drawCard(true); if (c) Q.push(c); }
        return `你一路趕到${LOCS[h.loc].n}，${wait ? `又等了幾日，` : ''}終於趕上了。`;
      } }, { t: '這次就算了', go: () => '你把這件事放下了。日子還長，江湖上的熱鬧，總歸不止這一場。' }] };
}

function newsEvent() {
  const who = pick(['一個路過的商旅', '山下的樵夫', '一個走江湖賣藥的郎中', '客店裡的夥計', '同路的趕腳人']);
  return { type: '歷練', title: '消息', art: LOCS[S.loc].art, text: `這個月，${who}和你閒聊起近來江湖上的事。${gossipReveal()}`, choices: [{ t: '記在心上', go: () => '你把這件事默默記了下來。' }] };
}

// 每月一次：偶爾換個地方
function maybeMove() {
  if (!chance(32)) return;
  const cand = Object.keys(LOCS).filter(id => id !== S.loc && travelDays(id) <= 12);
  if (!cand.length) return;
  const to = pick(cand), d = travelDays(to), from = LOCS[S.loc].n;
  log(`這個月你離開${from}，一路行了${cnNum(d)}日，到了${LOCS[to].n}。`);
  S.flags.moved = [from, LOCS[to].n];
  S.loc = '_road'; advance(d); S.loc = to;
}

function adventureMonth() {
  UI.ov = null;
  const br = bridgeEvent();
  if (br) { Q.push(br); return pump(); }
  maybeMove();
  const left = 30 - 0;
  const moved = advanceSteps(Math.max(5, left - (S.flags.moved ? 8 : 0)));
  const g = (40 + S.stats.int * 5) * 0.06;
  for (const id of S.eq) xp(id, g);
  xp(S.nei, g * 0.8);
  S.flags.sinceFight = (S.flags.sinceFight == null ? 1 : S.flags.sinceFight + 1);
  if (histNow()) return pump();
  const kind = cardCtx();
  // 風聲：近兩年有大事、你還不知道時，偶爾有人帶來消息
  const known = histRumors(720, false).length, unknown = histRumors(720, true).filter(x => !x.now && !(S.flags.heardOf || {})[x.h.id]).length;
  if (!known && unknown && chance(40)) { Q.push(newsEvent()); return pump(); }
  const quiet = (S.flags.sinceFight == null ? 99 : S.flags.sinceFight) < 2;   // 剛打完，這個月偏向平靜的牌
  let ev = null;
  if (chance(62)) ev = drawCard(false);
  if (!ev) ev = rollEvent(kind);
  if (ev && ev.type === '戰鬥' && quiet) ev = drawCard(false) || ev;
  if (!ev) ev = drawCard(true);
  if (ev) Q.push(ev);
  pump();
}
