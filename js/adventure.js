/* 江湖歲月錄 — 歷練：事件牌流。按一次「歷練」過約一個月，抽一張事件牌：情境、兩三個選項、d20 檢定、結果。
   歷史大事到了日子會自動插入，並用劇情交代你怎麼趕到現場。 */
'use strict';

/* ---------- d20 檢定 ---------- */
const d20 = () => ri(1, 20);
const half = () => {};                  // 戰鬥打輸扣命已在 endBattle 統一處理
// 檢定加值：能力調整值（每 2 點差 1）；難度隨等級慢慢提高
const statMod = k => Math.floor((S.stats[k] - 5) / 2);
const dcOf = dc => dc + Math.floor(((S.lv || 1) - 1) / 4);
// 檢定機率：以 d20 逐點算成功率（20 必成、1 必敗），加成為能力調整值＋裝備詞條
const checkMod = stat => stat ? statMod(stat) + gearChk(stat) : 0;
function checkOdds(stat, dc) {
  const mod = checkMod(stat), need = dcOf(dc);
  let ok = 0;
  for (let r = 1; r <= 20; r++) if (r === 20 || (r !== 1 && r + mod >= need)) ok++;
  return { pct: Math.round(ok / 20 * 100), mod };
}
function check(stat, dc) {
  dc = dcOf(dc);
  const roll = d20(), mod = checkMod(stat), total = roll + mod;   // 裝備詞條可加檢定
  return { roll, mod, total, dc, stat, crit: roll === 20, fumble: roll === 1, ok: roll === 20 || (roll !== 1 && total >= dc) };
}
const dieHtml = (n, crit, fumble) => `<b class="die roll${crit ? ' crit' : fumble ? ' fumble' : ''}">${n}</b>`;
const rollLine = c => `<span class="rollline">${dieHtml(c.roll, c.crit, c.fumble)} ${c.stat ? `${STAT_N[c.stat]}${pctText(c.mod)}` : ''}　<em class="${c.ok ? 'win' : 'lose'}">${c.crit ? '大成功' : c.fumble ? '大失手' : c.ok ? '成功' : '失敗'}</em></span><br>`;
// 能力加成換算成百分比：d20 每點 = 5%
const pctText = mod => `${mod >= 0 ? '+' : ''}${mod * 5}%`;
const reqLine = o => { if (!o.stat) return o.fight ? '〔動手〕' : ''; const od = checkOdds(o.stat, o.dc); return `〔成功 ${od.pct}%・${STAT_N[o.stat]}${pctText(od.mod)}〕`; };

/* ---------- 事件牌語法 ---------- */
// O：檢定選項（成功 ok／失敗 no，各為 [文字, 獲得, 額外函式]）；P：無檢定；F：戰鬥。外面再包 $g／$e／$n 標明正派、反派、無視
const O = (t, stat, dc, ok, no, x) => Object.assign({ t, stat, dc, ok, no }, x || {});
const P = (t, ok, x) => Object.assign({ t, ok }, x || {});
const F = (t, foe, win, lose, x) => Object.assign({ t, fight: { foe, win, lose } }, x || {});
const $g = o => Object.assign(o, { s: 'g' }), $e = o => Object.assign(o, { s: 'e' }), $n = o => Object.assign(o, { s: 'n' });
const XP = n => () => battleXp(n) || '';
const XN = n => () => xp(S.nei, n) || '';
const HERB = n => () => addItem('herb', n);
const HEAL = () => heal(1);
const FULL = () => heal(1) + gainQi(99);
const HURT = () => () => hurt(1);       // 事件中受傷：扣一顆命
const GOSSIP = () => gossipReveal();
const ITEM = id => () => addItem(id);
const money = n => s => s.silver >= n;

// 讓聽到的下一件大事浮出來
function gossipReveal() {
  const known = S.flags.heardOf || {};
  const nx = histRumors(720, true).filter(x => !x.now && !known[x.h.id]).sort((a, b) => hStart(a.h) - hStart(b.h))[0];
  if (!nx) return '　鄰桌的人聊的都是家長里短，這陣子江湖上似乎沒有什麼大動靜。';
  S.flags.heardOf = S.flags.heardOf || {}; S.flags.heardOf[nx.h.id] = 1;
  return `\n\n「${nx.h.rumor}」——${nx.when}，${nx.where}。〔已記入江湖風聞〕`;
}

/* ---------- 事件牌：每張三個選項——正派、反派、無視或拒絕 ---------- */
const CARDS = [
  /* ===== 城中 ===== */
  { id: 'c_gamble', ctx: ['city'], title: '賭坊', art: 'city', text: '賭坊裡骰子聲響成一片。你看了一會兒就看出來了：莊家袖口裡藏著東西，輸光了的人一個個紅著眼出門。',
    opts: [$g(O('當眾揭穿莊家出千', 'int', 13, ['你一把扣住莊家的手腕，袖裡滾出兩顆灌了鉛的骰子。賭客們一擁而上，討回了自己的錢，也塞了一份給你。', { fame: 4, silver: 30 }], ['你看走了眼，被打手們架著扔出了門。', {}, HURT(0.1)])),
      $e(O('押 50 兩，跟著莊家一起出千', 'luck', 12, ['你瞧準了莊家的手法，押了個準。莊家瞪你一眼，卻不敢聲張。', { silver: 70 }], ['莊家笑瞇瞇地把銀子攏了過去：「同行？那更得交學費。」', { silver: -50 }], { req: money(50), reqT: '需 50 兩' })),
      $n(P('只看不賭', ['你在一旁看了半天，記住了幾個老千的手法，沒有吃虧。']))] },
  { id: 'c_story', ctx: ['city'], title: '說書人', art: 'city', text: '茶樓裡說書人醒木一拍，講的正是近年江湖上的事。堂下坐滿了人，連後排都站著聽。',
    opts: [$g(P('賞他 10 兩', ['說書人收了銀子，壓低聲音多說了一段只有行內人才知道的消息。', { silver: -10 }, GOSSIP], { req: money(10), reqT: '需 10 兩' })),
      $e(O('當場拆台，把場子搶過來自己講', 'cha', 12, ['你講得比他還精彩，賞錢叮叮噹噹全落進了你的碗裡。說書人鐵青著臉收拾了東西。', { silver: 18, fame: 1 }], ['滿堂的人噓你下台，茶博士把你請了出去。', { fame: -1 }])),
      $n(O('擠到前排細聽', 'int', 11, ['你聽出了幾處和傳聞對不上的地方，順藤摸瓜，想通了一件事。', {}, GOSSIP], ['人太多，你什麼也沒聽清。']))] },
  { id: 'c_thief', ctx: ['city'], title: '妙手空空', art: 'city', cond: s => s.silver >= 30, text: '人群裡有人撞了你一下，連聲賠不是。你下意識摸向腰間——',
    opts: [$g(O('扣住那隻手，問清緣由', 'agi', 12, ['你捏住了一隻正往外抽的手。是個十來歲的瘦小孩子，說家裡娘病了。你嘆了口氣，放了他，還塞了幾文錢。', { silver: -3, moral: 3 }], ['錢袋輕了一截，那人早消失在人堆裡。', { silver: -35 }])),
      $e(F('追上去，連他偷來的一起搶', ['慣竊「過街鼠」', 1, 0.5, 'thug'], ['你把他按在牆角，搜出了你的銀子，還有一串別人的荷包——你一併收下了。', { silver: 60 }], ['你被他引進死巷，吃了一頓拳腳。', { silver: -20 }])),
      $n(P('算了，自認倒楣', ['你摸了摸腰間，少了二十兩。江湖路上，總要交些學費。', { silver: -20 }]))] },
  { id: 'c_brawl', ctx: ['city'], title: '酒館鬥毆', art: 'fight', text: '鄰桌兩夥人為了一碗酒吵了起來，桌椅翻倒，眼看就要動刀。掌櫃躲在櫃檯後面直哆嗦。',
    opts: [$g(F('誰先動刀我先打誰', ['滋事的潑皮', 1, 0.5, 'thug'], ['你三兩下打翻了領頭的，酒館重歸平靜。掌櫃感激地送了你一壺好酒。', { fame: 5, hp: 20 }], ['你寡不敵眾，被扔出了門外。', { fame: -2 }])),
      $e(O('趁亂摸走兩邊的錢袋', 'agi', 12, ['桌椅亂飛之間，你的手比誰都快。出門時腰間沉甸甸的。', { silver: 45 }], ['你的手剛伸進去，就被人一把抓住。兩夥人居然一起轉過來打你。', {}, HURT(0.15)])),
      $n(P('端起酒碗，換一桌', ['你換了一桌，看他們打完。']))] },
  { id: 'c_herb', ctx: ['city'], title: '藥舖', art: 'city', text: '藥舖掌櫃拿著一包來路不明的藥材犯愁：「這是山裡人送來的，我認不全。你要是懂行，勻你兩株。」',
    opts: [$g(O('幫掌櫃辨認藥材', 'int', 11, ['你認出了其中幾味，掌櫃樂得多給了你好幾株。', {}, HERB(4)], ['你認錯了一味，被掌櫃笑了好一陣子。'])),
      $e(O('趁他不懂，把好藥說成雜草低價收走', 'cha', 12, ['掌櫃信了你的話，把一包上好的藥材當柴火價賣給了你。', { silver: -5 }, HERB(6)], ['掌櫃起了疑心，請來了老郎中。你灰溜溜地走了。', { fame: -2 }])),
      $n(P('不懂就別碰', ['你婉拒了掌櫃的好意。']))] },
  { id: 'c_bounty', ctx: ['city'], title: '懸賞告示', art: 'fight', cond: s => s.fame >= 30, text: '城門口新貼了一張告示：城外有夥盜匪專劫商旅，官府懸賞一百兩。有人說他們的老巢就在城西的破窯。',
    opts: [$g(F('去破窯會會他們', ['劫道的盜首', 4, 0.6, 'blade'], ['你押著盜首進了衙門，領了賞銀。', { silver: 100, fame: 12 }], ['你被打得滿頭是血逃了出來。', { fame: -3 }])),
      $e(O('找到盜首，跟他分贓入夥', 'cha', 12, ['盜首掂了掂你的分量，分了你一份贓銀：「下回有買賣，再找你。」', { silver: 80 }], ['盜首不信你，一刀砍了過來。你逃得狼狽。', {}, HURT(0.2)])),
      $n(P('這種事不是我管的', ['你瞥了一眼告示，轉身走了。']))] },
  { id: 'c_orphan', ctx: ['city'], title: '街角的孩子', art: 'city', text: '街角蹲著一個髒兮兮的孩子，面前放著一個破碗，空空如也。他看見你，沒有伸手，只是把頭低了下去。',
    opts: [$g(P('買兩個包子給他，再塞幾個錢', ['孩子狼吞虎嚥，吃完了朝你磕了個頭。', { silver: -8, moral: 4 }], { req: money(8), reqT: '需 8 兩' })),
      $e(P('把他帶去給乞丐頭子，換點賞錢', ['乞丐頭子給了你二十文，把孩子拖進了巷子。你沒回頭。', { silver: 20, moral: -6 }])),
      $n(P('走開', ['你加快了腳步。']))] },
  { id: 'c_escort', ctx: ['city'], title: '鏢局缺人', art: 'road', cond: s => power() >= 5, text: '鏢局門口貼著告示：缺短途趟子手，五日往返，酬勞從優。總鏢頭見你腰間有兵刃，招手叫住了你。',
    opts: [$g(O('接下這趟短鏢', 'con', 11, ['一路平安，總鏢頭拍著你的肩膀，酬金一文不少。', { silver: 90, fame: 3 }], ['路上遇雨，你病倒了兩天，只拿到一半酬勞。', { silver: 40 }], { days: 5 })),
      $e(O('接鏢，路上和劫匪串通分贓', 'cha', 13, ['鏢「被劫」了。你分到的那份，比酬金多出一倍。總鏢頭到現在都還感激你拚死逃回來報信。', { silver: 160, fame: -2 }], ['劫匪拿了貨就翻臉不認人，你兩手空空回來，還被總鏢頭看出了破綻。', { fame: -8 }], { days: 5 })),
      $n(P('婉言謝絕', ['你拱手謝絕，總鏢頭也不強求。']))] },
  { id: 'c_guard', ctx: ['city'], title: '官差盤查', art: 'city', text: '城門口的官差把你攔了下來，上下打量：「從哪來？進城做什麼？身上帶的什麼？」他的目光停在你的兵刃上。',
    opts: [$g(O('從容應對，據實以告', 'cha', 12, ['你說得有條有理，官差揮手放行，還客氣地讓了讓路。'], ['官差越問越起疑，把你扣了半天才放。', {}, HURT(0.05)])),
      $e(P('塞給他 20 兩', ['官差掂了掂銀子，眼睛一眯：「進去吧。」', { silver: -20 }], { req: money(20), reqT: '需 20 兩' })),
      $n(O('繞道，從水門混進城', 'agi', 11, ['你跟著運菜的船進了城，沒人多看你一眼。'], ['你在水門被抓了個正著，罰了十兩。', { silver: -10 }]))] },
  { id: 'c_book', ctx: ['city'], title: '舊書攤', art: 'city', text: '舊書攤上堆著一摞發黃的冊子，攤主睡眼惺忪：「隨便翻，五文一本。」你翻到一本沒有書名的手抄本，上頭畫著吐納的姿勢。',
    opts: [$g(O('付錢買下，回去細讀', 'int', 12, ['你讀了整整一下午，把其中的口訣和自己的功夫對照，有所領悟。', { silver: -5, int: 1 }, XN(80)], ['字跡潦草，你看不太懂，只能慢慢琢磨。', { silver: -5 }, XN(30)])),
      $e(O('趁攤主打盹，把冊子揣進懷裡', 'agi', 11, ['你走出三條街才翻開。口訣對你的內功頗有啟發。', {}, XN(80)], ['攤主醒了，拿掃帚追了你半條街。', { silver: -10 }])),
      $n(P('放下，走開', ['你把冊子放回了原處。']))] },
  { id: 'c_busk', ctx: ['city'], title: '街頭賣藝', art: 'city', text: '街心空地上，一個賣藝的漢子耍了一套拳，圍觀的人不少，銅錢卻沒幾個。他喘著氣望著人群，目光落在你身上。',
    opts: [$g(O('跳進場子幫他撐撐場面', 'str', 11, ['你打了一套拳，博得滿堂彩，賞錢嘩嘩落進了銅鑼。漢子執意分了一半給你。', { silver: 25, fame: 3 }], ['你一招使過了勁，差點撞翻了圍觀的人，還賠了點醫藥費。', { silver: -10 }])),
      $e(F('砸了他的場子，賞錢歸我', ['賣藝的漢子', 1, 0.5, 'thug'], ['漢子被你打倒在地，你把銅鑼裡的錢倒進了自己的錢袋。圍觀的人散得很快。', { silver: 30 }], ['那漢子拳腳比你想的硬，你被打得灰頭土臉。', { fame: -2 }])),
      $n(P('丟幾個銅板就走', ['漢子抱拳道謝。', { silver: -2 }]))] },
  { id: 'c_elder', ctx: ['city'], title: '摔倒的老人', art: 'city', text: '橋頭一個老人被人群擠得摔倒在地，挑著的籮筐翻了一地，銅錢、雞蛋滾得到處都是，圍觀的人都往後讓。',
    opts: [$g(P('上前扶起他，幫他把東西撿好', ['老人拉著你的手連連道謝，說他是城西開茶棚的，往後你喝茶不收錢。', { moral: 3 }])),
      $e(P('趁亂撿走地上的銅錢', ['你彎腰撿了一把銅錢，揣進袖子裡。老人還在地上找他的雞蛋。', { silver: 8, moral: -3 }])),
      $n(P('繞過去', ['你從人群的另一邊過了橋。']))] },
  { id: 'c_dojo', ctx: ['city'], title: '武館', art: 'fight', cond: s => power() >= 6, text: '武館的招牌寫著「拳打三山，腳踢五嶽」。門口的教頭見你駐足，嗤笑道：「看什麼看？有本事進來討教兩招。」',
    opts: [$g(F('光明正大地進去討教', ['武館教頭', 3, 0.6, 'thug'], ['教頭收了拳，臉上有些掛不住，還是送了你一瓶跌打酒。', { fame: 8, hp: 15 }, XP(80)], ['你被抬了出來，躺了半天。', { fame: -3 }])),
      $e(O('夜裡翻牆進去，砸招牌、偷錢箱', 'agi', 12, ['第二天全城都在說，武館的招牌被人劈成了兩半，錢箱也空了。', { silver: 40 }], ['你剛摸到錢箱，就被巡夜的弟子圍住了。', { fame: -4 }, HURT(0.2)])),
      $n(P('一笑置之', ['你笑了笑，走開了。']))] },
  { id: 'c_tavern', ctx: ['city'], title: '酒樓', art: 'city', w: 22, text: '酒樓裡人聲鼎沸，南來北往的客人在這裡歇腳，有人高談闊論，有人悶頭喝酒，也有人壓低聲音在說些什麼。',
    opts: [$g(P('請鄰桌的老鏢師喝一壺', ['老鏢師喝得高興，把這陣子聽來的事都說了。', { silver: -5 }, GOSSIP], { req: money(5), reqT: '需 5 兩' })),
      $e(O('偷聽角落裡的密談，事後去敲詐', 'cha', 13, ['那兩人在做見不得光的買賣。你堵在巷口一開口，他們就乖乖掏了錢，還把知道的都抖了出來。', { silver: 40 }, GOSSIP], ['那兩人是練家子，你剛開口就被打翻在地。', {}, HURT(0.15)])),
      $n(P('坐下喝悶酒', ['你一個人喝了半壺，鄰桌的閒聊斷斷續續飄進耳朵。', { silver: -2 }, () => chance(50) ? GOSSIP() : '']))] },

  /* ===== 野外 ===== */
  { id: 'w_slope', ctx: ['wild'], title: '山路濕滑', art: 'mountain', text: '雨後的山路滑得像抹了油。前頭一個挑柴的樵夫腳下一滑，整個人往崖邊溜了下去，一隻手死死扒著藤條。',
    opts: [$g(O('撲過去拉住他', 'str', 12, ['你一把攥住樵夫的手腕，把他拖了上來。他坐在泥地裡喘了半天，非要把一捆最好的柴送你。', { moral: 2 }, XP(60)], ['你拉住了他，自己卻也滑了下去，兩人滾了十幾丈才停住。', { moral: 2 }, HURT(0.2)])),
      $e(O('踩著他的扁擔借力翻過去', 'agi', 10, ['你足尖在扁擔上一點，輕巧地翻上了山道。背後傳來一聲驚叫。', {}, XP(60)], ['扁擔一翻，你和樵夫一起滾下了坡。', {}, HURT(0.25)])),
      $n(O('不管閒事，穩住身形慢慢走', 'con', 11, ['你一步一步挪下了山。後來樵夫自己爬了上來。'], ['你走到一半還是摔了一跤，渾身青紫。', {}, HURT(0.15)]))] },
  { id: 'w_beast', ctx: ['wild'], title: '猛獸', art: 'fight', text: '林深處腥風撲面，一頭斑斕猛虎伏在草叢裡，兩隻眼睛在暗處發綠光。山下的村子說，這半年牠叼走了三個孩子。',
    opts: [$g(F('拔出兵刃，替村子除害', ['斑斕猛虎', 3, 0.5, 'beast'], ['猛虎倒下了。村民們抬著虎屍敲鑼打鼓，還湊了些銀子謝你。', { silver: 60, fame: 8 }], ['你負傷逃出了林子，猛虎在身後怒吼。', {}])),
      $e(O('把老虎引向山下的獵戶棚子，自己脫身', 'agi', 11, ['你繞著棚子跑了一圈，老虎撲向了棚裡的人。你頭也不回地跑了。', { moral: -4 }], ['老虎根本不上當，一爪把你掀翻在地。', {}, HURT(0.3)])),
      $n(O('慢慢往後退', 'agi', 13, ['你一步一步退出了林子，猛虎沒有追。'], ['你剛退兩步就踩斷了枯枝，猛虎撲了上來。', {}, HURT(0.3)]))] },
  { id: 'w_herb', ctx: ['wild'], title: '溪邊藥草', art: 'mountain', text: '溪水邊長著一大叢你認得的藥草，葉子上還掛著露水。附近的山民說，這是他們冬天治風寒的救命藥。',
    opts: [$g(P('只採一半，留些給山民', ['你小心地採了一半，把根留在土裡，明年還會再長。', { moral: 1 }, HERB(3)])),
      $e(P('連根拔光，一株不留', ['你把整叢藥草連根拔起，塞滿了行囊。', {}, HERB(6)])),
      $n(O('不碰這叢，順著溪流往上找', 'luck', 11, ['你在一處背陰的石縫裡發現了另一片藥草。', {}, HERB(4)], ['你走了很遠，只多找到幾株。', {}, HERB(1)]))] },
  { id: 'w_cave', ctx: ['wild'], title: '山洞', art: 'cave', text: '一場急雨把你逼進了一個山洞。洞壁上有人用利器刻過字，歲月久了，字痕裡長滿青苔，有幾處已經剝落。',
    opts: [$g(O('細讀之後，把快剝落的字拓下來留給後人', 'int', 12, ['那是一段前人練功的心得。你照著比劃了一個時辰，又用炭灰把字一一描深。', { moral: 2 }, XN(120)], ['字跡太淺，你辨認了半天，只認出幾個字。'])),
      $e(O('練會之後把字全刮掉，免得別人學去', 'int', 12, ['你照著練了一夜，有所領悟。天亮時你用刀把石壁刮得乾乾淨淨。', {}, XN(150)], ['字跡太淺，你辨認了半天，一怒之下把石壁劈了。'])),
      $n(P('升堆火，等雨停', ['雨停時，你已把衣服烤乾了。', {}, HEAL]))] },
  { id: 'w_lost', ctx: ['wild'], title: '迷路', art: 'mountain', text: '天色漸暗，你發現自己在同一棵歪脖子樹下轉了第三圈。不遠處有一間獵戶的木屋，屋裡沒人，門虛掩著。',
    opts: [$g(O('辨認星斗找方向，不擾別人', 'int', 11, ['你憑著星斗摸出了方向，天亮前走出了林子。'], ['你走錯了方向，在林子裡多繞了兩天。', {}, HURT(0.1)])),
      $e(P('闖進木屋，把乾糧和地圖都拿走', ['木屋裡有乾糧、獸皮，還有一張手畫的山圖。你全拿走了，獵戶回來會怎樣，你沒有想。', { silver: 15 }])),
      $n(O('找一棵最高的樹爬上去看', 'agi', 11, ['你爬到樹頂，看見遠處有一點火光，順著它走了出去。'], ['你爬到一半樹枝斷了，摔了個屁股墩。', {}, HURT(0.15)]))] },
  { id: 'w_trap', ctx: ['wild'], title: '獵戶陷阱', art: 'mountain', text: '你聽見草叢裡有悶悶的呻吟聲。一隻幼鹿的後腿被獵戶的鐵夾子夾住了，母鹿在旁邊急得直轉圈。',
    opts: [$g(O('掰開鐵夾', 'str', 12, ['你費了好大力氣掰開鐵夾，幼鹿一瘸一拐地跟著母鹿走了，臨走時回頭看了你一眼。', { moral: 4, luck: 1 }], ['鐵夾紋絲不動，你被夾傷了手。', {}, HURT(0.1)])),
      $e(P('把幼鹿帶走，賣給山下的酒館', ['酒館掌櫃給了你三十兩。母鹿在林子邊上站了很久。', { silver: 30 }])),
      $n(P('這是獵戶的東西，不碰', ['你繞開走了。']))] },
  { id: 'w_bandit', ctx: ['wild'], title: '攔路', art: 'fight', text: '山道轉彎處滾下幾塊亂石，七八條漢子從林中跳出來，為首的把鬼頭刀往肩上一扛：「此山是我開！留下買路財！」',
    opts: [$g(F('拔出兵刃', ['山賊頭目', 2, 0.55, 'blade'], ['頭目一倒，嘍囉們一哄而散。你把他們搶來的財物送去了山下的村子，只留了一點盤纏。', { silver: 20, fame: 6 }], ['你被打得抱頭鼠竄，銀子也被搜走了一些。', { silver: -30 }])),
      $e(O('「帶我入夥，一起劫下一票。」', 'cha', 12, ['頭目大笑著拍你的肩。那天傍晚，你們劫了一支小商隊，你分到了一份。', { silver: 60 }], ['頭目不信你，把你搜了個乾淨才放走。', { silver: -30 }])),
      $n(O('施展身法衝過去', 'agi', 13, ['你足尖一點，從眾人頭頂掠過，山賊只來得及看見你的背影。'], ['你剛躍起就被套索絆住，被按在地上摸走了銀子。', { silver: -40 }]))] },
  { id: 'w_fall', ctx: ['wild'], title: '飛瀑', art: 'mountain', text: '百丈飛瀑轟然而下，砸在潭中的巨石上，水花四濺，巨石卻紋絲不動。潭邊的小廟供著山神，香案上擺著山民的供錢。',
    opts: [$g(O('在瀑下練功', 'con', 12, ['冰冷的水柱砸在肩上，你咬牙撐了一個時辰，渾身通透。', {}, XP(120)], ['你被水流沖得站立不穩，嗆了好幾口水。', {}, HURT(0.1)])),
      $e(P('拿走香案上的供錢', ['供錢不多，二十來文。你揣進懷裡，背後的山神像不會說話。', { silver: 20, luck: -1 }])),
      $n(P('潭邊靜坐調息', ['水聲如雷，心卻漸漸靜了下來。', {}, XN(80)]))] },
  { id: 'w_traveler', ctx: ['wild'], title: '受傷的旅人', art: 'road', text: '路邊倒著一個中年人，腿上一道深可見骨的傷口，血浸透了褲管，腰間的錢袋鼓鼓的。他看見你，勉強擠出一個笑：「少俠……能不能幫幫我？」',
    opts: [$g(P('替他包紮，送他去最近的村子', [`你替他止了血，背著他走了十里山路。`, { moral: 5 }, () => has('jinchuang') ? (addItem('jinchuang', -1), '〔用去金創藥一份〕') : '']), { req: s => has('jinchuang') || s.stats.con >= 7, reqT: '需金創藥或根骨 7' }),
      $e(P('搜走他的錢袋', ['他想抓住你的衣角，沒抓住。', { silver: 45, moral: -6 }])),
      $n(P('這是別人的事，走開', ['你快步走遠了，背後的呻吟聲漸漸聽不見。']))] },
  { id: 'w_wolves', ctx: ['wild'], title: '夜半狼嚎', art: 'night', text: '夜宿荒野，和你同宿的還有一對趕路的父子。篝火快燒完時，四周亮起了一雙雙幽綠的眼睛。頭狼低吼一聲，狼群慢慢圍了上來。',
    opts: [$g(F('護著那對父子，迎戰頭狼', ['頭狼', 4, 0.5, 'beast'], ['頭狼倒下，狼群夾著尾巴退入了黑暗。那對父子守著你坐到天亮。', { fame: 4 }], ['你拚死殺出一條血路，滿身是傷。', {}])),
      $e(O('把他們的乾糧扔出去引開狼群，自己先走', 'agi', 10, ['狼群撲向了乾糧和那對父子。你沒有回頭。', {}], ['你跑得太急，摔進了溝裡，被一頭狼咬傷了腿。', {}, HURT(0.2)])),
      $n(O('添柴、揮火把驅趕', 'cha', 12, ['火光騰起，狼群遲疑片刻，終於退去。'], ['火把被撲滅了，你們只得爬上樹，在上面挨了一夜。', {}, HURT(0.12)]))] },

  /* ===== 任何地方 ===== */
  { id: 'a_caravan', ctx: ['city', 'wild', 'sect'], title: '商隊', art: 'road', text: '一支商隊在路邊歇腳，領隊的瘦老頭正愁人手不夠，見你背著兵刃，湊過來：「這位爺，同路嗎？管飯，到了地頭有賞錢。」',
    opts: [$g(O('護送一程', 'con', 11, ['一路平安，老頭很滿意，多給了你一份賞錢。', { silver: 70, fame: 2 }], ['你一路疲憊，賞錢只拿到一半。', { silver: 30 }], { days: 6 })),
      $e(O('跟著走，夜裡偷他們的貨', 'agi', 12, ['你每夜摸一點，到地頭時已攢了一包好東西。老頭到現在還在誇你勤快。', { silver: 110 }], ['第三夜你被夥計逮個正著，挨了一頓打被趕走。', { fame: -5 }, HURT(0.15)], { days: 6 })),
      $n(P('婉言謝絕', ['老頭嘆了口氣，招呼夥計繼續趕路。']))] },
  { id: 'a_inn', ctx: ['city', 'wild', 'sect'], title: '客店', art: 'night', text: '日頭偏西，你在路邊的客店住下。大堂裡有個說書的瞎子，一邊拉琴一邊講故事。隔壁房住著一個闊綽的客商。',
    opts: [$g(O('給瞎子添一碗酒，聽他講完', 'int', 11, ['故事講的是一個舊日門派的興衰，你聽得入了神，隱隱有些領悟。', { silver: -3 }, XN(60)], ['你聽到一半就睡著了。', { silver: -3 }])),
      $e(O('半夜摸進隔壁房翻包袱', 'agi', 12, ['客商睡得像死豬。你摸走了一錠銀子，回房睡到天亮。', { silver: 50 }], ['客商的保鏢一直醒著。你被打了出來，還賠了店家的門。', { silver: -20 }, HURT(0.15)])),
      $n(P('安心睡一覺', ['你一覺睡到天亮，渾身舒坦。', {}, FULL]))] },
  { id: 'a_challenger', ctx: ['city', 'wild', 'sect'], title: '年輕劍客', art: 'fight', text: '一個年輕劍客攔在路中央，抱拳道：「聽說這一帶有位高手，在下特來請教。」他的眼神很亮，劍握得很穩，看得出是下了苦功的。',
    opts: [$g(F('點到為止', ['年輕劍客', 3, 0.6, 'sword'], ['你贏了半招。年輕人收劍行禮，由衷道：「受教了。」', { fame: 6 }, XP(100)], ['你輸了半招。年輕人臉紅了，反倒向你賠禮：「僥倖，僥倖。」', { fame: 1 }])),
      $e(F('趁他抱拳行禮時出手偷襲', ['年輕劍客', 2, 0.45, 'sword'], ['他倒在地上，不敢相信地看著你。你拿走了他的盤纏。', { silver: 30, fame: -4 }, XP(60)], ['偷襲沒有得手，他的劍比你想的快。', { fame: -6 }])),
      $n(P('「我只是個趕路的。」', ['劍客愣了愣，讓開了路。']))] },
  { id: 'a_river', ctx: ['city', 'wild'], title: '渡河', art: 'river', text: '大河橫在眼前，渡口只剩一條破渡船，船夫叼著旱煙：「風浪大，不太好走，加錢才開船。」岸邊還蹲著幾個付不起船錢的窮人。',
    opts: [$g(P('付 30 兩，連那幾個窮人的船錢一起付', ['船夫嘟囔著開了船。上岸時，那幾個人一直在後面朝你作揖。', { silver: -30, moral: 3 }], { req: money(30), reqT: '需 30 兩' })),
      $e(O('把船夫推下水，自己划船過去', 'str', 12, ['船夫在水裡罵你祖宗十八代。你把船划到對岸，扔在了蘆葦叢裡。'], ['船夫的槳比你的拳頭還硬，你被打下了水。', {}, HURT(0.2)])),
      $n(O('自己游過去', 'con', 13, ['你憑著一口氣游到對岸，渾身濕透卻神清氣爽。', {}, XP(70)], ['河中心暗流把你沖出老遠，爬上岸時筋疲力盡。', {}, HURT(0.2)]))] },
  { id: 'a_enemy', ctx: ['city', 'wild', 'sect'], title: '狹路相逢', art: 'fight', cond: s => s.fame >= 40, text: '客店裡，鄰桌三個人一直在偷眼看你。其中一人壓低聲音說了句什麼，三人同時站了起來，手摸向了腰間。',
    opts: [$g(F('起身問明恩怨，按江湖規矩動手', ['尋仇的惡客', 4, 0.6, 'blade'], ['你放倒了領頭的，另外兩個丟下一句狠話奪門而逃。', { fame: 8 }], ['你被打翻在地，他們搜走了你一部分銀子。', { silver: -40 }])),
      $e(O('先在他們的酒裡下藥', 'int', 12, ['三個人喝著喝著就趴下了。你搜走了他們身上的銀子，還有一封寫著你名字的信。', { silver: 60 }], ['藥下得太重，被他們聞了出來。三把刀一齊砍了過來。', {}, HURT(0.25)])),
      $n(O('起身賠笑，付了酒錢快走', 'cha', 12, ['你一路笑著出門，沒人攔你。'], ['你剛邁出門檻，背後一把刀架在了脖子上。', { silver: -30 }]))] },
  { id: 'a_temple', ctx: ['wild'], title: '雨夜破廟', art: 'night', text: '雨夜，你躲進一座荒廢的小廟。神像後面隱約有人影，火堆邊坐著一個老乞丐，正在烤一隻不知哪來的雞。',
    opts: [$g(P('分他一點乾糧，換半隻雞', ['老乞丐樂得直拍大腿，把雞撕了一半給你，還講了一肚子江湖舊事。', {}, () => HEAL() + (chance(35) ? GOSSIP() : '')])),
      $e(O('一把搶過整隻雞', 'str', 10, ['老乞丐縮在角落裡罵罵咧咧。雞很香。', {}], ['老乞丐一棍子敲在你手腕上，雞掉進了火裡。', {}, HURT(0.1)])),
      $n(P('在角落睡下，不理他們', ['你聽著雨聲睡了一夜。']))] },

  /* ===== 門派 ===== */
  { id: 's_spar', ctx: ['sect'], title: '同門切磋', art: 'fight', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '演武場上，一位同門師兄抱拳邀你切磋。四周圍滿了師兄弟，有人起鬨，有人搖頭。',
    opts: [$g(F('請賜教', ['同門師兄', 3, 0.55, 'sword'], ['你勝了半招。師兄爽朗大笑，當晚請你喝了酒。', { contrib: 15 }, XP(100)], ['你敗了。師兄扶你起來，指出了你的三處破綻。', { contrib: 5 }, XP(60)])),
      $e(F('暗下重手，讓他躺半個月', ['同門師兄', 2, 0.5, 'sword'], ['師兄被抬了下去。師父看了你很久，什麼也沒說。', { contrib: -10, fame: 2 }, XP(100)], ['你的重手被他看穿了，反倒摔了個大跟頭。', { contrib: -5 }])),
      $n(P('今日不便', ['師兄聳聳肩，轉身找別人去了。']))] },
  { id: 's_exam', ctx: ['sect'], title: '師父考較', art: 'legacy', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '師父把你叫到跟前，隨手拈起一片樹葉：「你入門這些時日，功夫練得如何？來，給為師演一遍。」',
    opts: [$g(O('把學過的功夫老老實實演一遍', 'int', 12, ['師父看完，點了點頭，單獨給你講了半個時辰。', { contrib: 20 }, XN(150)], ['你演到一半忘了下一招，師父皺了皺眉：「回去再練。」', { contrib: 3 }])),
      $e(O('把師兄的練功心得說成自己的', 'cha', 13, ['師父聽得連連點頭，賞了你一瓶丹藥。師兄在旁邊臉都綠了。', { contrib: 25 }, ITEM('huiqi')], ['師父冷冷看了你一眼：「這是你師兄上個月跟我說的。」', { contrib: -15 }])),
      $n(P('推說還沒練熟，改日再演', ['師父擺擺手讓你下去了。']))] },
  { id: 's_back', ctx: ['sect'], title: '後山練功', art: 'mountain', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '後山的空地上，幾個師弟正在練功。見你走來，都停下了手：「師兄師姐，能不能指點一下？」',
    opts: [$g(O('一招一式帶他們練', 'cha', 11, ['你講得清楚，師弟們進步很快，你自己也在教的過程中有了新的領悟。', { contrib: 15 }, XP(80)], ['你講得磕磕絆絆，師弟們面面相覷。', { contrib: 2 }])),
      $e(P('讓他們替你挑水洗衣，自己去睡覺', ['你睡了一個下午。師弟們挑了二十擔水，沒人敢說什麼。', { contrib: -3 }, FULL])),
      $n(P('自己找個角落練', ['你獨自練了一個下午。', {}, XP(70)]))] },
  { id: 's_library', ctx: ['sect'], title: '藏經閣', art: 'legacy', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '藏經閣的老管事叫住你：「後面那排書架亂了，你要是閒著，幫忙整理整理，有什麼看得懂的，隨便翻翻。」',
    opts: [$g(O('整理並翻閱', 'int', 11, ['你整理了兩個時辰，順手翻了幾本，有一段內功的口訣讓你茅塞頓開。', { contrib: 10 }, XN(130)], ['你整理得亂七八糟，老管事一邊嘆氣一邊自己重新整理。', { contrib: 2 }])),
      $e(O('把一本秘笈夾帶出來', 'agi', 13, ['你把秘笈藏在被褥下讀了三夜，再悄悄放了回去。', {}, XN(220)], ['你剛走到門口，老管事就把你叫住了：「懷裡那本，放下。」', { contrib: -30 }])),
      $n(P('推說有事', ['老管事嘆了口氣，自己搬梯子去了。']))] },
  { id: 's_trouble', ctx: ['sect'], title: '山下鬧事', art: 'fight', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '山門下，一夥無賴正在欺負上山燒香的老百姓。守山門的師弟匆匆跑來：「師兄師姐，他們人多，我們攔不住。」',
    opts: [$g(F('下山去收拾他們', ['鬧事的無賴頭子', 2, 0.55, 'thug'], ['你一個人把他們打得抱頭鼠竄。百姓紛紛叩謝，山門的名聲也更響了。', { contrib: 25, fame: 4 }], ['你寡不敵眾，勉強把人嚇走，自己也掛了彩。', { contrib: 8 }])),
      $e(P('收了無賴頭子的好處，放他們走', ['無賴頭子塞給你三十兩，大搖大擺地走了。百姓們看你的眼神變了。', { silver: 30, contrib: -10 }])),
      $n(P('讓守山的師弟自己去處理', ['師弟們被打傷了兩個。師父問起時，你說你在練功。', { contrib: -3 }]))] },
  { id: 's_hurt', ctx: ['sect'], title: '受傷的同門', art: 'legacy', cond: s => s.sect && LOCS[s.loc].sect === s.sect, text: '一個師弟從山下回來，手臂上一道深口子，血還在往外滲。他背上的包袱裡是剛化來的香火錢。',
    opts: [$g(O('用布條止血，背他去藥房', 'con', 11, ['你一路背著他跑，到藥房時，血已經止住了。師弟第二天特意送了你一壺茶。', { contrib: 10 }], ['你跑岔了路，兜了好大一圈才到藥房。', { contrib: 4 }])),
      $e(P('「我替你把香火錢交上去。」然後扣下一半', ['你交上去一半，另一半進了你的口袋。師弟到現在還謝你。', { silver: 20, contrib: -5 }])),
      $n(P('讓他自己去藥房', ['師弟捂著手臂走了。']))] },

  /* ===== 年代 ===== */
  { id: 'e_jin', ctx: ['city', 'wild'], y: [1222, 1234], title: '金兵盤查', art: 'road', text: '路口設了關卡，幾個金兵正挨個盤問行人，搜身、翻包袱。一個老人被推倒在地，包袱散了一地。',
    opts: [$g(F('動手', ['金兵小隊長', 3, 0.6, 'blade'], ['你放倒了領頭的，金兵們一哄而散。老人連連磕頭。', { moral: 4, fame: 5 }], ['你被金兵們按在地上打了一頓。', { fame: -2 }])),
      $e(P('替金兵指認哪個行人藏了銀子', ['金兵賞了你二十五兩。被你指認的那個人，被拖到了路邊。', { silver: 25, moral: -6 }])),
      $n(P('低頭繞行', ['你加快了腳步。']))] },
  { id: 'e_xy', ctx: ['city', 'wild'], y: [1240, 1273], title: '襄陽募勇', art: 'fight', text: '路邊的告示牌上，襄陽城守軍正在招募義勇，凡能開弓使刀者，可領軍糧、軍餉。招兵的小校扯著嗓子：「蒙古人又要來了，有種的來！」',
    opts: [$g(O('報名守城一月', 'con', 12, ['你在城頭守了一個月，推下無數雲梯，也見識了真正的戰場。', { silver: 60, fame: 8, moral: 4 }, XP(160)], ['你守了半個月就累病了，被抬了下來。', { silver: 20, moral: 2 }], { days: 30 })),
      $e(O('冒名報上去，領了軍餉就跑', 'agi', 12, ['你領了兩個月的餉，當夜就翻出了城。', { silver: 60 }], ['你被巡營的小校逮住，挨了二十軍棍。', { fame: -5 }, HURT(0.2)])),
      $n(P('這不關我的事', ['你搖搖頭，走開了。']))] },
  { id: 'e_rebel', ctx: ['city', 'wild'], y: [1335, 1368], title: '義軍', art: 'road', text: '路邊的林子裡，一群頭裹紅巾的漢子正在歇腳。他們看見你，也不躲，領頭的抱拳道：「這位朋友，如今朝廷不給活路，我們只想討個說法。你願不願意同行一段？」',
    opts: [$g(O('同行一段，看看他們是什麼人', 'cha', 11, ['你同他們走了幾日，聽了一肚子的苦水，也見識了他們怎麼聚眾練功。', { moral: 3 }, XP(100)], ['他們對你不太放心，只讓你跟在隊尾。'])),
      $e(P('套出他們的去向，報官領賞', ['官府賞了你八十兩。三天後，林子裡起了火。', { silver: 80, moral: -8 }])),
      $n(P('婉拒', ['領頭的也不勉強，叮囑你一路小心。']))] },
  { id: 'e_press', ctx: ['city'], y: [1300, 1368], title: '抓壯丁', art: 'fight', text: '街上一陣大亂，一隊官差正挨家挨戶抓壯丁，被抓的人一個接一個被繩子串成一串。一個少年被拖走，他娘追著哭喊。',
    opts: [$g(F('擋在官差面前', ['官差頭目', 4, 0.6, 'blade'], ['你放倒了領頭的，少年掙脫繩子，扶著他娘跑開了。', { moral: 6, fame: 6 }], ['你被官差們圍住打了一頓。', { moral: 2, fame: -2 }])),
      $e(P('幫官差抓人，領一份賞', ['你指出了三戶藏人的人家。官差頭目拍拍你的肩，賞了你二十兩。', { silver: 20, moral: -8 }])),
      $n(P('躲進店裡，等他們過去', ['你在布莊裡站了半個時辰，外面的哭聲才漸漸遠了。']))] },

  /* ===== 門派：拜師、差遣、傳功、晉升（取代原本的手動行動） ===== */
  { id: 'y_recruit', ctx: ['city', 'wild', 'sect'], w: s => LOCS[s.loc].sect ? 40 : 8, cond: s => !s.sect && daysIn(s) > 40 && age() < 40 && recruitSect(s), make: recruitCard },
  { id: 'y_task', ctx: ['city', 'wild', 'sect'], w: 14, cond: s => s.sect, make: taskCard },
  { id: 'y_call', ctx: ['city', 'wild'], w: 10, cond: s => s.sect && LOCS[s.loc].sect !== s.sect && sectOpen(s.sect), make: callCard },
  { id: 'y_learn', ctx: ['sect'], w: 40, cond: s => s.sect && LOCS[s.loc].sect === s.sect && sectNext(), make: learnCard },
  { id: 'y_promote', ctx: ['sect'], w: 45, cond: s => LOCS[s.loc].sect === s.sect && canPromote(), make: promoteCard },

  /* ===== 回城 ===== */
  { id: 'y_townmed', ctx: ['city', 'wild', 'sect'], w: s => s.life < lifeMax() ? 38 : 9, make: townMedCard },

  /* ===== 買賣 ===== */
  { id: 'y_market', ctx: ['city'], w: 10, make: marketCard },
  { id: 'y_smith', ctx: ['city'], w: 9, make: smithCard },
  { id: 'y_peddler', ctx: ['city', 'wild', 'sect'], w: 8, make: peddlerCard },
  { id: 'y_pharm', ctx: ['city'], w: 16, cond: s => (s.inv.herb || 0) >= 3, make: pharmCard },

  /* ===== 情緣 ===== */
  { id: 'y_visit', ctx: ['city', 'wild', 'sect'], w: 40, cond: s => visitNpc(s), make: visitCard },
  { id: 'y_wed', ctx: ['city', 'wild', 'sect'], w: 60, cond: s => s.flags.lover && !s.spouse && NPCS[s.flags.lover].loc === s.loc && npc(s.flags.lover).fav >= 95, make: wedCard },
];

/* ---------- 動態事件牌 ---------- */
function recruitSect(s) {
  const here = LOCS[s.loc].sect;
  if (here && sectOpen(here)) return here;
  if (s.flags.recruitFor && sectOpen(s.flags.recruitFor)) return s.flags.recruitFor;
  const open = Object.keys(SECTS).filter(sectOpen);
  return open.length ? (s.flags.recruitFor = pick(open)) : null;
}
function recruitCard(s) {
  const id = recruitSect(s), k = SECTS[id], home = LOCS[s.loc].sect === id;
  s.flags.recruitFor = null;
  const intro = home ? `${LOCS[k.loc].n}的山門前，${k.master}正在挑選新入門的弟子。他看了你幾眼：「你根骨還算可以。想入${k.n}嗎？」`
    : `路邊茶棚裡，${k.n}的${k.master}正帶著幾個弟子歇腳。他聽說你一路的事，捋鬚道：「${k.n}正在收門人。你若有意，跟我回${LOCS[k.loc].n}。」`;
  const text = `${intro}\n\n${k.d}\n武學：${k.style}　入門條件：${k.reqT}`;
  const go = () => { if (!home) { S.loc = '_road'; advance(travelDays(k.loc)); S.loc = k.loc; } return joinSectNow(id); };
  const steal = O(`假意拜師，偷學一招就走`, 'agi', 13, ['你在山上待了七天，偷看了入門功夫的練法，第八天一早就溜了。', {}, () => learn(k.teach[0][0])], ['你剛翻上牆頭，就被巡山的弟子揪了下來，一頓好打。', { fame: -3 }, HURT(0.2)]);
  let opts;
  if (k.align > 0) opts = [$g(P(`恭恭敬敬拜師入門${home ? '' : `，隨他回${LOCS[k.loc].n}`}`, ['', {}, go], { req: k.req, reqT: k.reqT })), $e(steal), $n(P('婉言謝絕', [`${k.master}點點頭，也不強求。`]))];
  else if (k.align === 0) opts = [$g(P('入教，替窮苦百姓出頭', ['', {}, go], { req: k.req, reqT: k.reqT })), $e(O('假意入教，探聽虛實後去官府領賞', 'cha', 12, ['官府給了你一百兩。你沒問那些人後來怎麼樣了。', { silver: 100, moral: -10 }], ['他們早看出你不對勁，把你打了出去。', {}, HURT(0.2)])), $n(P('婉言謝絕', ['對方也不勉強。']))];
  else opts = [$g(F(`當面斥責${k.n}為虎作倀`, [`${k.n}香主`, 3, 0.6, 'blade'], ['香主被你打得說不出話來。旁邊的百姓偷偷朝你豎大拇指。', { fame: 8, moral: 4 }], ['你被打得滿地找牙。', { fame: -2 }])), $e(P(`拜入${k.n}`, ['', {}, go], { req: k.req, reqT: k.reqT })), $n(P('婉言謝絕', ['對方冷笑一聲，沒有再說什麼。']))];
  return { title: `${k.n}收徒`, art: LOCS[k.loc].art, who: 'elder', text, opts };
}
function taskCard(s) {
  const k = SECTS[s.sect], c = ri(24, 38) + s.rank * 4, t = pick(k.tasks);
  const fight = chance(35);
  const e = k.align < 0 ? ['正道遊俠', 1, 0.55, 'sword'] : [pick(['山賊頭目', '盜經賊', '尋仇的惡客']), 1, 0.55, pick(['blade', 'thug'])];
  return { title: '師門差遣', art: 'legacy', text: `師門傳下話來，要你${t}。${fight ? '聽說這一路不太平。' : ''}`,
    opts: [$g(fight ? F('盡心辦好，遇敵就打', e, ['你漂亮地完成了任務，回山覆命。', { contrib: c + 20, fame: 4 }], ['任務失敗，你帶傷回山，受了一頓訓斥。', { contrib: 5 }], { days: 10 }) : O('盡心辦好', 'con', 10, ['你辦得妥妥當當，師父很滿意。', { contrib: c, silver: ri(5, 15) }], ['你辦砸了一半，師父搖了搖頭。', { contrib: Math.round(c / 3) }], { days: 10 })),
      $e(P('敷衍了事，中飽私囊', ['你把該辦的錢扣下一大半，隨便交了差。', { silver: 40, contrib: 8 }], { days: 5 })),
      $n(P('推託不去', ['你說自己有傷在身。師父沒說什麼，派了別人去。', { contrib: -5 }]))] };
}
function callCard(s) {
  const k = SECTS[s.sect], d = travelDays(k.loc);
  return { title: '師門傳書', art: 'road', text: `一隻信鴿落在你肩頭，是${k.master}的字跡：「門中有事，速回${LOCS[k.loc].n}。」\n\n從這裡回去，要走 ${cnNum(d)} 日。`,
    opts: [$g(P('即刻動身回山', ['', {}, () => { S.loc = '_road'; advance(d); S.loc = k.loc; return `你日夜兼程，${cnNum(d)}日後回到了${LOCS[k.loc].n}。師父見你回來，點了點頭。` + gain({ contrib: 10 }); }])),
      $e(P('把信燒了，裝作沒收到', ['信在火裡捲成了灰。師門的事，你不想管了。', { contrib: -20 }])),
      $n(P('回信說晚些再回', ['你寫了回信，綁回鴿子腳上。', { contrib: -3 }]))] };
}
function learnCard(s) {
  const k = SECTS[s.sect], t = sectNext(), sk = SKILLS[t[0]];
  return { title: '傳功', art: 'legacy', who: 'elder', text: `${k.master}把你叫到偏殿：「你入門以來還算用功。本門的「${sk.n}」（${TIER_N[sk.tier]}${TYPE_N[sk.type]}），你現在可以學了。按規矩，要拿門派貢獻來換。」\n\n${sk.d}\n所需貢獻：${t[2]}　你的貢獻：${s.contrib}`,
    opts: [$g(P(`恭敬受教（貢獻 ${t[2]}）`, ['師父一招一式地教了你七天。', {}, () => { S.contrib -= t[2]; advance(7); return learn(t[0]); }], { req: s2 => s2.contrib >= t[2], reqT: `貢獻須達 ${t[2]}` })),
      $e(O('夜入藏經閣，偷看秘笈', 'agi', 13, ['你在藏經閣裡抄了三夜，誰也沒發現。', {}, () => learn(t[0])], ['你被守閣的長老當場拿住，罰去後山砍柴一個月。', { contrib: -40 }, () => { advance(30); return ''; }])),
      $n(P('「弟子功夫還不紮實，過些日子再學。」', ['師父點點頭：「也好。」']))] };
}
function promoteCard(s) {
  const k = SECTS[s.sect], e = ['執事師兄', '傳功長老座下首徒', '護法長老'][s.rank], cost = 150 * (s.rank + 1);
  return { title: '晉升考核', art: 'legacy', who: 'elder', text: `${k.master}端坐堂上：「你入門以來的功勞，為師都看在眼裡。接下${e}三十招，便許你晉為${RANKS[s.rank + 1]}。」`,
    opts: [$g(F('弟子領命', [e, 3 + s.rank * 6, 0.55, k.align < 0 ? 'blade' : 'master'], ['', {}, () => { S.rank++; return `你通過了考核，晉升為${k.n}${RANKS[S.rank]}！` + gain({ fame: 15 * S.rank }); }], ['你未能撐過考核。師父道：「回去再練，來日方長。」', {}], { noFlee: true })),
      $e(P(`私下塞給執事長老 ${cost} 兩`, ['', {}, () => { S.silver -= cost; S.rank++; return `考核走了個過場。你晉升為${k.n}${RANKS[S.rank]}，可師兄弟們背後都在議論。` + gain({ fame: -10 }); }], { req: money(cost), reqT: `需 ${cost} 兩` })),
      $n(P('「弟子還想再練練。」', ['師父笑了笑：「不急。」']))] };
}

/* ---------- 回城：隨機回到城裡買藥、買武功 ---------- */
function goTown() {
  if (LOCS[S.loc] && LOCS[S.loc].kind === 'city') return;
  const to = Object.keys(LOCS).filter(id => LOCS[id].kind === 'city').sort((a, b) => travelDays(a) - travelDays(b))[0];
  const d = travelDays(to), from = LOCS[S.loc] ? LOCS[S.loc].n : '路上';
  log(`這個月你回了一趟${LOCS[to].n}，路上走了${cnNum(d)}日。`);
  S.flags.moved = [from, LOCS[to].n];
  S.loc = '_road'; advance(d); S.loc = to;
}
const artShop = s => Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'manual' && !knows(ITEMS[id].skill));
// 回城：買藥、買裝備、客棧休息，三個都要花錢，沒有正邪之分（選項不標示陣營）
const $p = o => Object.assign(o, { s: 'n', plain: true });
/* ---------- 回城：商人、客棧、離開 ----------
   商人可以買、可以賣。貨品每次回城重新隨機，每件只能買一次；賣東西按原價的一半收。 */
const sellPrice = id => Math.max(1, Math.round(ITEMS[id].price * 0.5));
const gearUsed = id => GEAR_SLOTS.some(x => S[x[0]] === id);
const shuf = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
function townStock(s) {
  // 同一種藥只列一筆，用 qty 表示數量
  const med = [{ id: 'jinchuang', qty: 2 }, { id: 'huiqi', qty: 1 }];
  if (chance(25)) med.push({ id: 'dahuan', qty: 1 });
  const gear = shuf(Object.keys(ITEMS).filter(id => ['weapon', 'armor', 'acc', 'off', 'relic'].includes(ITEMS[id].kind) && ITEMS[id].price && !has(id))).slice(0, 4);
  const arts = shuf(artShop(s).filter(id => ITEMS[id].price)).slice(0, 2);
  return [...med, ...gear.map(id => ({ id, qty: 1 })), ...arts.map(id => ({ id, qty: 1 }))].map(e => ({ id: e.id, sold: false, qty: e.qty }));
}
function townMedCard(s) {
  goTown();
  s.town = { stock: townStock(s) };                       // 新的一趟回城，貨品重新上架
  return townCard(s);
}
function townCard(s) {
  const hurtNow = s.life < lifeMax(), restCost = Math.min(s.silver, 10);
  return { title: '回城', art: 'city', text: `你回到${LOCS[s.loc].n}，${hurtNow ? `身上的傷還沒好利索（氣血 ${s.life}/${lifeMax()}），` : ''}先在街上轉了一圈。\n\n你身上有 ${s.silver} 兩。`,
    opts: [
      $p({ t: '商人（買東西、賣東西）', shop: true }),
      $p(P(`客棧休息一夜（${restCost} 兩）`, ['你要了間客房，睡了個踏實覺，氣血與內息都回復了一些。', { silver: -restCost }, () => gain({ hp: 1 }) + gainQi(1)], { req: money(Math.max(1, restCost)), reqT: '需 10 兩' })),
      $p(P('離開', ['你沒再多逛，轉身離開了。']))
    ] };
}
function shopBuy(i) {
  const e = S.town && S.town.stock[i];
  if (!e || e.sold) return;
  const it = ITEMS[e.id];
  if (S.silver < it.price) return toastRender('銀兩不夠');
  S.silver -= it.price; if ((e.qty || 1) > 1) e.qty--; else e.sold = true;
  const msg = it.kind === 'manual' ? learn(it.skill) : (addItem(e.id), autoGear(e.id));
  toastRender(`買下${it.n}${msg ? ' ' + msg.replace(/<[^>]*>/g, '') : ''}`);
}
function shopSell(id) {
  if (!has(id) || !ITEMS[id].price || (gearUsed(id) && S.inv[id] === 1)) return;
  const p = sellPrice(id);
  S.inv[id]--; if (!S.inv[id]) delete S.inv[id];
  S.silver += p;
  toastRender(`賣出${ITEMS[id].n}，得 ${p} 兩`);
}
function openShop() { UI.ov = { k: 'menu', m: 'shop', tab: 'buy' }; render(); }
function closeShop() { save(); showEvent(cardEvent(townCard(S))); }   // 離開商人，回到回城的三個選項

/* ---------- 買賣 ---------- */
const priceOf = id => ITEMS[id].price;
function buyOpts(id, how) {
  const it = ITEMS[id], p = priceOf(id);
  return [$g(P(`付 ${p} 兩買下${it.n}`, [`你數出銀子，把${it.n}收進行囊。`, { silver: -p }, () => { addItem(id); return autoGear(id); }], { req: money(p), reqT: `需 ${p} 兩` })),
    $e(O(how || `順手牽羊`, 'agi', 13, [`你趁人不注意，把${it.n}揣走了。`, {}, () => { addItem(id); return autoGear(id); }], ['你被抓了個正著，賠了錢還挨了一頓打。', { silver: -Math.min(S.silver, Math.round(p / 2)), fame: -3 }, HURT(0.1)])),
    $n(P('只看不買', ['你看了看，走開了。']))];
}
// 新買到的兵刃、護甲、飾品，比身上的好就換上
function autoGear(id) {
  const it = ITEMS[id], sl = GEAR_KIND[it.kind];
  if (!sl) return '';
  const cur = S[sl] && ITEMS[S[sl]], val = x => x ? (x.atk || 0) + (x.def || 0) + Object.values(x.st || {}).reduce((a, b) => a + b, 0) * 3 + (x.fx ? 4 : 0) : -1;
  let fits = reqOk(it);
  if (it.kind === 'weapon') fits = fits && atkArts().some(a => SKILLS[a].type === it.wt) && !(it.hand === 2 && S.off);
  if (it.kind === 'off') fits = fits && !(S.weapon && ITEMS[S.weapon].hand === 2);
  if (fits && val(it) > val(cur)) { S[sl] = id; recalc(); return `〔已裝備${it.n}〕`; }
  return '〔可在行囊頁裝備〕';
}
function marketCard(s) {
  const pool = (SHOPS[s.loc] || SHOPS.linan).filter(id => ['med', 'gift', 'armor', 'manual'].includes(ITEMS[id].kind) && !(ITEMS[id].kind === 'manual' && knows(ITEMS[id].skill)));
  const id = !has('jinchuang') ? 'jinchuang' : pick(pool);
  const it = ITEMS[id];
  return { title: '市集', art: 'city', text: `市集上人來人往。一個攤子上擺著${it.n}，${it.d ? it.d + '，' : ''}攤主吆喝著：「${it.price} 兩，童叟無欺！」`, opts: buyOpts(id) };
}
function smithCard(s) {
  const types = [...new Set(atkArts().map(a => SKILLS[a].type))];
  const ws = Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'weapon' && ITEMS[id].price && (types.includes(ITEMS[id].wt) || !types.length));
  const best = ws.filter(id => !has(id)).sort((a, b) => ITEMS[a].atk - ITEMS[b].atk);
  const id = best.find(x => ITEMS[x].price > s.silver * 0.4) || best[best.length - 1] || 'a_cloth';
  const it = ITEMS[id], st = Object.keys(it.st || {}).map(k => `${STAT_N[k]}+${it.st[k]}`).join('、');
  return { title: '鐵匠舖', art: 'city', text: `鐵匠舖裡爐火正旺。牆上掛著一${it.kind === 'weapon' ? '件' : '副'}${it.n}，${it.kind === 'weapon' ? `${TYPE_N[it.wt]}威力+${it.atk}` : `防禦+${it.def}`}${st ? `，${st}` : ''}。鐵匠擦著汗：「${it.price} 兩，不二價。」`, opts: buyOpts(id, '賒帳，然後一走了之') };
}
function peddlerCard(s) {
  const accs = Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'acc' && !has(id));
  const id = accs.length ? pick(accs) : pick(['wine', 'rouge', 'book', 'qin']);
  const it = ITEMS[id], st = Object.keys(it.st || {}).map(k => `${STAT_N[k]}+${it.st[k]}`).join('、');
  return { title: '貨郎', art: 'road', text: `一個挑著貨擔的貨郎搖著撥浪鼓走過來：「客官看看？這${it.n}可是好東西${st ? `，戴上了${st}` : ''}。只要 ${it.price} 兩。」`, opts: buyOpts(id, '嫌貴，嚇唬他白送') };
}
function pharmCard(s) {
  const n = s.inv.herb;
  return { title: '藥舖收藥', art: 'city', text: `藥舖掌櫃看見你行囊裡露出的草藥，眼睛一亮：「這是好東西。要賣，還是我替你煉成金創藥？三株煉一份。」\n\n你身上有草藥 ${n} 株。`,
    opts: [$g(P('請掌櫃煉成金創藥', ['', {}, () => { const k = Math.floor(n / 3); addItem('herb', -k * 3); return `掌櫃煉了半天，交給你${cnNum(k)}份金創藥。` + addItem('jinchuang', k); }])),
      $e(O('以次充好，摻了雜草高價賣', 'cha', 12, ['掌櫃沒看出來，照上等貨的價錢收了。', {}, () => { addItem('herb', -n); return gain({ silver: n * 28 }); }], ['掌櫃一聞就聞出來了，把你轟了出去。', { fame: -2 }])),
      $n(P('照市價賣掉', ['', {}, () => { addItem('herb', -n); return `掌櫃秤了秤，照市價收了。` + gain({ silver: n * 14 }); }]))] };
}

/* ---------- 情緣 ---------- */
// 在對方的地方就能拜訪；好感夠了，對方也會在路上和你重逢
const visitNpc = s => { const gap = today() - (s.flags.lastVisit || -999), met = Object.keys(NPCS).filter(id => loveOK(s, id) && s.npcs[id] && s.npcs[id].met && (!(s.spouse || s.flags.lover) || id === (s.spouse || s.flags.lover)));
  return met.find(id => NPCS[id].loc === s.loc && gap > 30) || met.filter(id => s.npcs[id].fav >= 15 && gap > 75).sort((a, b) => s.npcs[b].fav - s.npcs[a].fav)[0]; };
function visitCard(s) {
  const id = visitNpc(s), k = NPCS[id], n = npc(id);
  s.flags.lastVisit = today();
  if (stageReady(id)) {
    const st = k.stage[n.stage];
    const step = c => () => { n.fav = clamp(n.fav + c[1], 0, 100); if (c[1] > 0) { n.stage++; if (n.stage === 3) { S.flags.lover = id; return `${k.n}與你兩心相許，從此江湖路上不再孤身一人。〔好感+${c[1]}　已定情〕`; } return `${k.n}看你的眼神，和從前有些不同了。〔好感+${c[1]}〕`; } return `${k.n}沉默片刻，轉身離去。有些話一旦說出口，就收不回來了。〔好感${c[1]}〕`; };
    return { type: '戀愛', who: id, title: `${k.n}・${['初識', '相知', '定情'][n.stage]}`, art: 'love', text: st.t,
      opts: [$g(P(st.a[0], ['', {}, step(st.a)])), $e(P('出言輕薄，存心戲弄', ['', {}, () => `${k.n}的臉色一下子冷了下來。` + favUp(id, -15)])), $n(P(st.b[0], ['', {}, step(st.b)]))] };
  }
  const gift = [k.like, 'wine', 'rouge', 'hairpin', 'book', 'qin'].find(has);
  return { type: '戀愛', who: id, title: `故人・${k.n}`, art: 'love', text: `${k.loc === S.loc ? `你在${LOCS[k.loc].n}又遇見了${k.n}。` : `你在${LOCS[S.loc].n}遇見了${k.n}——${k.ta}說是路過，可看起來像是特地來的。`}${pick(k.chat)}`,
    opts: [$g(gift ? P(`送上${ITEMS[gift].n}`, ['', {}, () => { addItem(gift, -1); return (gift === k.like ? `${k.ta}眼睛一亮，顯然十分喜歡。` : `${k.ta}道了聲謝，收下了。`) + favUp(id, gift === k.like ? 14 : 6); }]) : P('陪著說說話，過一兩日', ['', {}, () => { advance(2); return '日子過得很快。' + favUp(id, ri(3, 5) + Math.floor(S.stats.cha / 4)); }])),
      $e(P(`向${k.ta}借一筆錢，不打算還`, ['', {}, () => `${k.n}猶豫了一下，還是借給了你。` + gain({ silver: 40 }) + favUp(id, -12)])),
      $n(P('遠遠打個招呼', ['', {}, () => `${k.n}朝你點了點頭。` + favUp(id, 1)]))] };
}
function wedCard(s) {
  const id = s.flags.lover, k = NPCS[id];
  const wed = () => { S.spouse = id; S.flags.wedY = S.date.y; advance(3); return `紅燭高照，賓客盈門。你與${k.n}拜過天地，江湖上的朋友來了大半，連幾個舊日對頭也送了賀禮。${k.n}握著你的手，輕聲道：「往後的路，一起走。」` + gain({ [k.bonus[0]]: k.bonus[1], fame: 20 }); };
  return { type: '戀愛', who: id, title: '終身大事', art: 'love', text: `你和${k.n}在一起已經很久了。${k.n}的家人託人捎來口信：再不提親，就要替${k.ta}另議婚事了。`,
    opts: [$g(P('備下聘禮，明媒正娶（500 兩）', ['', {}, () => { S.silver -= 500; return wed(); }], { req: money(500), reqT: '需 500 兩' })),
      $e(O('「聘禮就免了，跟我走。」', 'cha', 13, ['', {}, () => wed() + gain({ moral: -3 })], [`${k.n}搖了搖頭：「你把我當成什麼人了？」`, {}, () => favUp(id, -20)])),
      $n(P('「再等等，等我攢夠了錢。」', [`${k.n}沒有說話，只是低下了頭。`, {}, () => favUp(id, -3)]))] };
}

/* ---------- 抽牌與結算 ---------- */
function cardCtx() { return LOCS[S.loc].kind; }
const cardW = c => typeof c.w === 'function' ? c.w(S) : (c.w || 10);
function drawCard(forceAny) {
  const kind = cardCtx(), hist = S.flags.cardHist = S.flags.cardHist || [], since = S.flags.sinceFight == null ? 99 : S.flags.sinceFight;
  const pool = CARDS.filter(c => (forceAny || !c.ctx || c.ctx.includes(kind)) && (!c.y || (ad() >= c.y[0] && ad() <= c.y[1])) && (!c.cond || c.cond(S)) && !hist.includes(c.id));
  if (!pool.length) return null;
  const ws = pool.map(c => cardW(c) * (c.opts && c.opts.some(o => o.fight) ? (since >= 3 ? 3 : 1) : 1));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0), card = pool[0];
  for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) { card = pool[i]; break; } }
  hist.push(card.id); if (hist.length > 14) hist.shift();
  return cardEvent(card.make ? Object.assign({ id: card.id }, card.make(S)) : card);
}
function applyOutcome(spec) {                       // spec: [文字, 獲得, 額外函式]
  const [t, g, fn] = spec;
  const extra = fn ? fn() : '';
  return t + (extra || '') + (g ? gain(g) : '');
}
function cardEvent(card) {
  const prefix = S.flags.moved ? `（這個月你從${S.flags.moved[0]}來到了${S.flags.moved[1]}。）\n\n` : '';
  S.flags.moved = null;
  return { type: card.type || '歷練', title: card.title, art: card.art || LOCS[S.loc].art, text: prefix + card.text, who: card.who,
    choices: card.opts.map(o => ({ s: o.s, plain: o.plain, t: `${o.t}${reqLine(o) ? '　' + reqLine(o) : ''}`, req: o.req, reqT: o.reqT, qi: o.qi != null ? o.qi : (o.fight ? 0 : (['agi', 'str', 'con'].includes(o.stat) && o.dc >= 12) || QI_KEY.test(o.t) ? 1 : 0), go: () => resolveOpt(o) })) };
}
function resolveOpt(o) {
  if (o.shop) return { shop: true };
  if (o.days) advanceSteps(o.days);
  if (o.fight) {
    S.flags.sinceFight = 0;
    return { battle: foe(...o.fight.foe), noFlee: o.noFlee, win: () => applyOutcome(o.fight.win), lose: s => { half(s); return applyOutcome(o.fight.lose); } };
  }
  if (!o.stat) return applyOutcome(o.ok);
  const c = check(o.stat, o.dc);
  if (c.ok) return rollLine(c) + applyOutcome(o.ok) + gainExp(6);
  const l0 = S.life, t = rollLine(c) + applyOutcome(o.no || ['你沒能成功。']);
  return t + (S.life === l0 ? hurt(1) : '');             // 檢定失敗一定吃虧：結果裡沒扣命，就補扣一顆
}

/* ---------- 推進時間 ---------- */
function histNow() {
  const t = today();
  return lineNow() || HIST.some(h => h.loc && h.scene && !S.hist[h.id] && S.loc === h.loc && t >= hStart(h) && t < hEnd(h));
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
    // 拒絕過的歷史邀請不應在每次「繼續」後重複攔路。
    if (S.flags.skippedBridge && S.flags.skippedBridge[h.id]) return false;
    if (S.loc === h.loc) return false;
    const need = travelDays(h.loc);
    return hStart(h) - t - need <= 40 && t + need < hEnd(h);
  });
  if (!r) return null;
  const h = r.h, need = travelDays(h.loc), start = hStart(h);
  return { type: '歷練', title: `動身：${LOCS[h.loc].n}`, art: LOCS[h.loc].art,
    pages: [`${h.rumor}\n\n你一直把這件事記在心上。眼看日子近了，${LOCS[h.loc].n}離這裡還有 ${cnNum(need)} 日路程。`,
      `想要親眼看見的話，就得現在動身了。你收拾好行囊，把盤纏和乾糧又清點了一遍。\n\n錯過了這一場，往後恐怕只能從別人口中聽說。`],
    choices: [{ s: 'g', t: `動身前往${LOCS[h.loc].n}`, go: () => go(need, '') },
      { s: 'e', t: '搶一匹快馬趕路', go: () => go(Math.max(1, Math.ceil(need / 2)), `你在驛站外解了一匹快馬就走，馬主追在後面大罵。` + gain({ moral: -4 })) },
      { s: 'n', t: '這次就算了', go: () => {
        (S.flags.skippedBridge = S.flags.skippedBridge || {})[h.id] = today();
        return '你把這件事放下了。日子還長，江湖上的熱鬧，總歸不止這一場。';
      } }] };
  function go(d, pre) {
    const from = LOCS[S.loc].n;
    log(`自${from}啟程，行了${cnNum(d)}日，抵達${LOCS[h.loc].n}。`);
    S.loc = '_road'; advance(d); S.loc = h.loc;
    const wait = Math.max(0, start - today());
    if (wait) advanceSteps(wait);
    if (chance(55)) { const c = drawCard(true); if (c) Q.push(c); }
    return pre + `你一路趕到${LOCS[h.loc].n}，${wait ? `又等了幾日，` : ''}終於趕上了。`;
  }
}

function newsEvent() {
  const who = pick(['一個路過的商旅', '山下的樵夫', '一個走江湖賣藥的郎中', '客店裡的夥計', '同路的趕腳人']);
  return { type: '歷練', title: '消息', art: LOCS[S.loc].art, text: `這個月，${who}和你閒聊起近來江湖上的事。${gossipReveal()}`,
    choices: [{ s: 'g', t: '謝過對方，請他喝碗酒', go: () => '你們喝了一碗，他又說了些路上的見聞。' + gain({ silver: -3 }) + HEAL() }, { s: 'e', t: '轉頭把消息賣給別人', go: () => '你在茶樓把這個消息賣了個好價錢。' + gain({ silver: 12 }) }, { s: 'n', t: '記在心上', go: () => '你把這件事默默記了下來。' }] };
}

// 每月一次：偶爾換個地方
function maybeMove() {
  if (!chance(34)) return;
  const cand = Object.keys(LOCS).filter(id => id !== S.loc && travelDays(id) <= 12);
  if (!cand.length) return;
  // 有師門的人常回山門；有心上人的常去看對方；還沒拜師的偶爾往山門走
  const home = S.sect && sectOpen(S.sect) ? SECTS[S.sect].loc : null, love = S.flags.lover ? NPCS[S.flags.lover].loc : null;
  const sectLocs = !S.sect ? Object.keys(SECTS).filter(sectOpen).map(k => SECTS[k].loc).filter(l => cand.includes(l)) : [];
  let to = pick(cand);
  if (home && home !== S.loc && chance(40)) to = home;
  else if (love && love !== S.loc && chance(25)) to = love;
  else if (!love && chance(15)) { const f = Object.keys(S.npcs).filter(id => loveOK(S, id) && S.npcs[id].met && S.npcs[id].fav >= 10 && NPCS[id].loc !== S.loc).sort((a, b) => S.npcs[b].fav - S.npcs[a].fav)[0]; if (f) to = NPCS[f].loc; }
  else if (sectLocs.length && chance(20)) to = pick(sectLocs);
  const d = travelDays(to), from = LOCS[S.loc].n;
  log(`這個月你離開${from}，一路行了${cnNum(d)}日，到了${LOCS[to].n}。`);
  S.flags.moved = [from, LOCS[to].n];
  S.loc = '_road'; advance(d); S.loc = to;
}

function adventureMonth() {
  UI.ov = null;
  const br = lineBridge() || bridgeEvent();
  if (br) { Q.push(br); return pump(); }
  maybeMove();
  const left = 30 - 0;
  const moved = advanceSteps(Math.max(5, left - (S.flags.moved ? 8 : 0)));
  const g = (40 + S.stats.int * 5) * 0.08;
  for (const id of S.eq) xp(id, g);
  S.flags.sinceFight = (S.flags.sinceFight == null ? 1 : S.flags.sinceFight + 1);
  if (histNow()) return pump();
  const kind = cardCtx();
  // 風聲：近兩年有大事、你還不知道時，偶爾有人帶來消息
  const known = histRumors(720, false).length, unknown = histRumors(720, true).filter(x => !x.now && !(S.flags.heardOf || {})[x.h.id]).length;
  if (!known && unknown && chance(40)) { Q.push(newsEvent()); return pump(); }
  const quiet = (S.flags.sinceFight == null ? 99 : S.flags.sinceFight) < 2;   // 剛打完，這個月偏向平靜的牌
  let ev = null;
  if (chance(62)) ev = drawCard(false);
  if (!ev) ev = rollEvent(S.flags.moved && chance(50) ? 'travel' : kind);
  if (ev && ev.type === '戰鬥' && quiet) ev = drawCard(false) || ev;
  if (!ev) ev = drawCard(true);
  if (!ev) {
    // 事件池耗盡時仍然給一段可閱讀、可繼續的過場，避免空白首頁。
    ev = { type: '江湖', title: '江湖歲月', art: LOCS[S.loc].art,
      text: '一段時日悄然過去。山川依舊，人事卻未必如昨。你整好行裝，繼續這段江湖路。',
      choices: [] };
  }
  Q.push(ev);
  pump();
}
