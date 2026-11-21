/* 江湖歲月錄 — 事件：奇遇、戰鬥、戀愛、傳承、江湖 */
'use strict';

const RUMORS = [
  '過招講究料敵機先：攻克破、破克守、守克攻。同一個對手打得多了，自然看得穿他的套路。',
  '機關銅人只會照著固定的次序出招，看過一輪就能全猜中。',
  '天目山深處有面石壁，刻著前人留下的內功心法，悟性不夠的人看了也是白看。',
  '每年九月初九，臨安城外有重陽擂台，奪魁的人能風光好一陣子。',
  '終南山上有個女道士愛琴，嘉興回春堂那位小醫女偏愛蘇州胭脂。',
  '燕京夜市有個紅衣姑娘常獨自喝酒，誰送她好酒，她就多看誰一眼。',
  '臨安有個姓顧的浪子，劍法好，酒品差。襄陽書肆的沈先生倒是只愛孤本。',
  '漠北凶險得很，可敢跟商隊去的人，回來都發了財。',
  '入了門派要多做任務，攢夠貢獻才學得到上乘武功。',
  '內功分陰陽，內外屬性相合，出手威力才大；陰陽相沖，反倒打折扣。',
  '聽說有人在山裡救過一隻白狐，後來交了大運。',
  '年過而立、小有名氣的人，自然有人上門拜師。武功總得有人傳下去。',
  '草藥別急著賣，在城裡的藥舖三株就能煉一份金創藥。',
  '丐幫弟子遍天下，要打聽消息，請叫化子喝碗酒準沒錯。',
  '少林寺收俗家弟子，只要根骨好、心術正；全真教收徒看悟性。',
  '想看大事，得先知道大事在哪裡發生。酒樓裡的閒話，有時候比官府的邸報還準。',
];

// 同陣營：主角所屬門派的陣營（1 正道、0 中立、-1 邪道）與指定陣營相同。無門無派視為中立
const sameSide = (s, align) => { const a = s.sect && SECTS[s.sect] ? SECTS[s.sect].align : 0; return a === align; };
const win = (e, w, l, x) => Object.assign({ battle: e, win: w, lose: l }, x || {});
const topNpc = min => { let b = null; for (const id in S.npcs) { const n = S.npcs[id]; if (n.met && n.fav >= min && (!b || n.fav > S.npcs[b].fav)) b = id; } return S.spouse || b; };

// 已有伴侶或定情之人後，雨中共傘只會是那個人
const rainNpc = s => Object.keys(s.npcs).find(i => s.npcs[i].met && s.npcs[i].fav >= 25 && NPCS[i].loc === s.loc && (!(s.spouse || s.flags.lover) || i === (s.spouse || s.flags.lover)));
// 節日能否相伴：對方就在此地，或已成親同行
const nearNpc = min => { const id = topNpc(min); return id && (id === S.spouse || NPCS[id].loc === S.loc) ? id : null; };

// 邂逅條件：初入江湖的前三個月不談情緣；每位有緣人只在合乎你身分與處境時才會遇上
const daysIn = s => (s.date.y - 1) * 360 + (s.date.m - 1) * 30 + s.date.d;
const MEET = {
  su:   { cond: s => s.sect === 'quanzhen' || s.fame >= 60,
          text: s => s.sect === 'quanzhen' ? NPCS.su.meet.replace('「看夠了？這條路外人不該來。」', '「看夠了？新入門的都愛躲在樹後偷看，你倒是頭一個站著不動的。」') : NPCS.su.meet },
  hua:  { cond: () => true },
  li:   { cond: s => s.fame >= 30 || power() >= 7 },                       // 她只對有點膽色本事的人感興趣
  gu:   { cond: s => s.silver >= 50 },                                     // 他開口就是借錢
  shen: { cond: s => s.origin === '書香門第' || s.stats.int >= 8 || s.fame >= 80 || s.sect === 'quanzhen',   // 書肆不是誰都會進去、也不是誰都留得住
          text: s => s.origin === '破廟孤兒' ? '你在襄陽書肆的屋簷下避雨，隔著窗看架上的書。夥計正要趕人，一個青衣男子攔住了他，把一卷書遞到窗外：「認得字麼？這本講的是劍理，卻沒有一招劍法。雨停之前，進來坐著讀吧。」' : NPCS.shen.meet },
};

const EVENTS = [
  /* ================= 江湖 ================= */
  { id: 'j_refugee', type: '江湖', title: '路有饑民', ctx: ['travel', 'city'], w: 9, art: 'road',
    text: '官道旁蜷著一群逃荒的饑民，一個婦人抱著孩子向你伸出手，嘴唇乾裂得說不出話。',
    choices: [
      { t: '解囊相助（50 兩）', cond: s => s.silver >= 50, go: () => '你把銀子塞進婦人手裡，又指了附近粥棚的方向。人群中有人認出了你。' + gain({ silver: -50, moral: 7, fame: 4 }) },
      { t: '分些乾糧', go: () => '你把行囊裡的乾糧分了出去，自己餓了一天。' + gain({ moral: 3, hp: -8 }) },
      { t: '快步走開', go: () => '你低頭加快了腳步。身後孩子的哭聲追了你很遠。' + gain({ moral: -3 }) },
    ] },
  { id: 'j_bully', type: '江湖', title: '惡霸當街', ctx: ['city'], w: 10, art: 'fight',
    text: '市集上，一個滿臉橫肉的惡霸掀翻了賣唱老人的攤子，揪著老人的孫女不放。圍觀的人不少，沒有一個敢出聲。',
    choices: [
      { t: '路見不平，出手', go: () => win(foe('惡霸「鎮三街」', 1, 0.5, 'thug'), () => '惡霸跪地求饒，圍觀百姓拍手稱快。老人拉著孫女向你連連作揖。' + gain({ moral: 7, fame: 8 }), null) },
      { t: '悄悄去報官', go: () => '差役姍姍來遲，惡霸早已揚長而去。' + gain({ moral: 1 }) },
      { t: '事不關己', go: () => '你轉身離開了人群。' + gain({ moral: -4 }) },
    ] },
  { id: 'j_thief', type: '江湖', title: '妙手空空', ctx: ['city'], w: 7, art: 'city', cond: s => s.silver >= 40,
    text: '擁擠的街上有人撞了你一下，連聲道歉。你下意識摸向腰間——',
    choices: [{ t: '看看錢袋還在不在', go: s => {
      if (s.origin === '破廟孤兒') return '你頭也不回，反手就扣住了那隻手——這一招你八歲就會了。小賊看清你的眼神，訕訕地笑：「原來是同道……得罪，得罪。」他臨走前塞給你一句話，說城東當鋪的掌櫃最近收了件好東西。' + gain({ luck: 1 });
      if (s.stats.agi + R(6) >= 10) return '你反手一扣，捏住了一隻正往外抽的手。是個十來歲的瘦小孩子，嚇得臉都白了。你嘆了口氣，放了他，還塞了幾文錢。' + gain({ moral: 3, silver: -2 });
      return '錢袋輕了一截。那人早已消失在人群裡。' + gain({ silver: -Math.round(s.silver * 0.15) });
    } }] },
  { id: 'j_escort', type: '江湖', title: '鏢局缺人', ctx: ['city'], w: 8, art: 'road',
    // 鏢局只找信得過的人：同行之後、有名聲者，或帶著兵刃且看得出練過的人
    cond: s => isBirth(s, '鏢') || s.fame >= 40 || (s.weapon && power() >= 5 && s.origin !== '破廟孤兒'),
    text: s => isBirth(s, '鏢') ? '威遠鏢局的總鏢頭在門口張望，一見你就愣住了：「你這眉眼……是老鏢頭家的孩子吧？你爹當年和我一口鍋裡吃過飯。正好，有趟短鏢缺個信得過的人，五日來回，酬勞從優。」'
      : s.fame >= 40 ? `威遠鏢局的總鏢頭迎出門來，抱拳道：「可是${s.name}少俠？久聞大名。敝局有趟短鏢缺個壓陣的好手，五日來回，酬勞從優。」`
      : `威遠鏢局的總鏢頭在門口張望，看見你腰間的${ITEMS[s.weapon].n}，又打量了一下你的步子，眼睛一亮：「這位少俠是練家子。有趟短鏢缺個人手，五日來回，酬勞從優。」`,
    choices: [
      { t: '接下這趟鏢', go: () => { advance(5); return win(foe('劫鏢的綠林好手', 2, 0.6, 'blade'), () => '鏢車平安送達。總鏢頭拍著你的肩膀，酬金一文不少。' + gain({ silver: ri(90, 140), fame: 6 }), () => { S.hp = Math.round(maxHp() * 0.3); return '鏢被劫了，你帶傷逃回，分文未得。' + gain({ fame: -6 }); }, { intro: '行至半途，林中殺出一夥蒙面人：「鏢留下！」' }); } },
      { t: '婉言謝絕', go: () => '你拱手謝絕，總鏢頭也不強求。' },
    ] },
  { id: 'j_sick', type: '江湖', title: '風寒入體', ctx: ['travel', 'wild'], w: 8, art: 'snow', cond: s => s.date.m >= 10 || s.date.m <= 1,
    text: '朔風如刀，大雪封路。你在風雪裡趕了一天路，夜裡開始渾身發燙。',
    choices: [{ t: '咬牙硬撐', go: s => {
      if (s.stats.con + R(6) >= 11) return '你運功逼出一身大汗，天亮時燒已退了。這副身子骨還算爭氣。';
      advance(8); return '你病倒在一間農舍裡，躺了八天，全靠主人家一碗碗熱薑湯。' + gain({ hp: -Math.round(maxHp() * 0.3), silver: -15 });
    } }] },
  { id: 'j_bounty', type: '江湖', title: '官府懸賞', ctx: ['city'], w: 7, art: 'fight', cond: s => s.fame >= 50,
    text: '城門口貼著懸賞告示：江洋大盜「飛天蜈蚣」連犯七案，賞銀二百兩。告示旁有人低聲說，那大盜今夜就藏在城東破窯。',
    choices: [
      { t: '夜探破窯，擒拿大盜', go: () => win(foe('飛天蜈蚣', 4, 0.7, 'blade'), () => '你把五花大綁的大盜扔在衙門口，領了賞銀。' + gain({ silver: 200, fame: 18, moral: 4 }), null) },
      { t: '沒把握，不蹚這渾水', go: () => '你揭過了這一頁。' },
    ] },
  { id: 'j_gamble', type: '江湖', title: '賭坊試手氣', ctx: ['city'], w: 6, art: 'city', cond: s => s.silver >= 50,
    text: '賭坊裡骰子聲、吆喝聲響成一片。莊家衝你招手：「客官，押大押小，買定離手！」',
    choices: [
      { t: '押 50 兩', go: s => chance(35 + s.stats.luck * 3) ? '骰盅揭開，你押中了！' + gain({ silver: 50 }) : '莊家笑瞇瞇地把你的銀子攏了過去。' + gain({ silver: -50 }) },
      { t: '看看就走', go: () => '十賭九輸，你搖搖頭走了出去。' },
    ] },
  { id: 'j_rival', who: 'qin', type: '江湖', title: '少年對手', ctx: ['city', 'travel', 'sect'], w: 9, art: 'fight', cond: s => s.rival < 3 && s.date.y >= 1 + s.rival * 2 && s.fame >= 20 + s.rival * 60,
    text: s => ['一個錦衣少年攔住你，下巴抬得老高：「聽說你最近有點名氣？我叫秦昭，專打有名氣的。」',
      '「又見面了。」秦昭比上次沉穩了不少，手上的繭也厚了。「上回是我輕敵。這兩年我沒有一天不想著再打一場。」',
      '秦昭站在長亭外等你，身後的馬已備好鞍。「我要去塞外了。走之前最後打一場，不論輸贏，你都是我秦昭這輩子唯一的對手。」'][s.rival],
    choices: [
      { t: '奉陪', go: s => win(foe('秦昭', 2 + s.rival * 5, 0.7 + s.rival * 0.08, 'sword'), () => { s.rival++; if (s.rival === 3) return '秦昭大笑著把佩劍拋給你：「痛快！這柄劍送你，塞外若聽到你的名字，我就知道沒輸給庸人。」' + (has('w_sword2') || has('w_sword3') ? gain({ silver: 300 }) : addItem('w_sword2')) + gain({ fame: 30 }); return '秦昭咬著牙爬起來：「下次，下次我一定贏你！」' + gain({ fame: 10 }); },
          () => { s.rival++; S.hp = Math.round(maxHp() * 0.4); return '秦昭收劍，神色複雜：「你讓我失望了。……把傷養好，下次別這麼不經打。」' + gain({ fame: -5 }); }, { noFlee: true }) },
      { t: '「今日沒空。」', go: () => '秦昭哼了一聲：「怕了就直說。我改日再來。」' },
    ] },

  /* ================= 出身（各出身獨有） ================= */
  { id: 'o_escort', type: '江湖', title: '父親的鏢旗', ctx: ['city', 'travel'], w: 14, once: true, art: 'fight', cond: s => isBirth(s, '鏢') && s.date.y >= 2,
    text: '酒肆角落裡，一個刀疤臉正拿一面殘破的鏢旗擦桌子。你認得那面旗——那是你爹走的最後一趟鏢。刀疤臉見你盯著看，咧嘴笑了：「怎麼，認得？當年那老鏢頭骨頭倒硬，可惜刀不夠快。」',
    choices: [
      { t: '「把旗放下。」', go: () => win(foe('「斷魂刀」屠九', 5, 0.72, 'blade'), () => '屠九倒在碎桌爛椅之間。你把鏢旗疊好收進懷裡，從他身上搜出一本染血的刀譜——封皮上是你爹的字跡。' + learn('m_blade') + gain({ fame: 25, moral: 3, str: 1 }), () => { S.hp = Math.round(maxHp() * 0.3); S.done.o_escort = 0; return '你被一腳踹出門外。屠九把鏢旗扔在你臉上：「回去再練十年。」這筆帳，你記下了。'; }, { noFlee: true }) },
      { t: '記住這張臉，日後再算', go: s => { s.done.o_escort = 0; return '你攥緊了拳頭，慢慢鬆開。君子報仇，十年不晚。'; } },
    ] },
  { id: 'o_scholar', type: '江湖', title: '舊日恩師', ctx: ['city'], w: 14, once: true, art: 'city', cond: s => s.origin === '書香門第',
    text: '書肆裡，一位清癯老者正與掌櫃爭一部殘卷的價錢。他回過頭，竟是你幼時的蒙師。老人上下打量你一身風塵，嘆了口氣：「好好的讀書種子，偏要去舞刀弄槍。……罷了，文武之道，本是一理。」',
    choices: [
      { t: '陪恩師長談一夜', go: () => { advance(1); return '老人從《易》講到兵法，又從兵法講到劍理。天亮時你才發覺，他講的每一句，都能用在武功上。' + gain({ int: 1 }) + (xp(S.nei, 180) || '') + addItem('book'); } },
      { t: '替恩師抄書籌措盤纏', go: () => { advance(5); return '你一手好字還沒丟下。五日抄完三卷，書肆掌櫃爽快地付了潤筆。' + gain({ silver: 120, moral: 2 }); } },
    ] },
  { id: 'o_hunter', type: '奇遇', title: '獸徑', ctx: ['wild'], w: 14, once: true, art: 'mountain', cond: s => s.origin === '山中獵戶',
    text: '泥地上有一串梅花印，旁人看來不過是野獸腳印，你卻一眼認出：步距寬、落地淺，是頭懷著崽的母麝，剛過去不到半個時辰。順著牠常走的獸徑，多半能找到別人找不到的東西。',
    choices: [
      { t: '循跡追蹤', go: () => { advance(2); return '你追了兩日，母麝把你引到一處人跡罕至的崖坳，滿坡都是上了年份的藥草。你沒有驚動牠，只採了藥。' + addItem('herb', 8) + addItem('lingzhi') + gain({ agi: 1 }); } },
      { t: '設套捕獵，換些銀兩', go: () => '你下的套子從不落空。麝香在藥行賣了個好價錢。' + gain({ silver: 180, moral: -2 }) },
    ] },
  { id: 'o_merchant', type: '江湖', title: '肉票', ctx: ['travel'], w: 14, once: true, art: 'night', cond: s => s.origin === '富商子弟',
    text: '客棧的夥計對你格外殷勤，酒也格外香。你喝到第二碗才覺出不對——四肢已經發軟了。門簾一掀，進來幾個蒙面漢子：「果然是那位大財主家的寶貝疙瘩。別怕，等你爹的贖金到了，自然放你走。」',
    choices: [
      { t: '運功逼毒，掀桌動手', go: () => { S.hp = Math.max(1, Math.round(S.hp * 0.7)); return win(foe('綁匪頭子', 2, 0.6, 'thug'), () => '你把綁匪捆成一串扔進柴房。這一回你總算明白：家世在江湖上不是護身符，是靶子。' + gain({ fame: 12, silver: 60, con: 1 }), () => { const l = Math.round(S.silver * 0.5); S.silver -= l; S.hp = Math.round(maxHp() * 0.3); advance(20); return `你被關了二十天，直到家裡送來贖金。隨身的銀兩也被搜走大半。〔銀兩-${l}　耗時二十日〕`; }, { noFlee: true, intro: '藥力未散，你只剩七成氣力，仍咬牙站了起來。' }); } },
      { t: '「我自己寫信，要多少給多少。」', go: () => { advance(12); return '家裡的銀子來得很快。綁匪頭子臨走還拍了拍你的臉：「小財神，江湖不是這麼闖的。」' + gain({ fame: -8 }) + '〔耗時十二日〕'; } },
    ] },
  { id: 'o_orphan', who: 'kid', type: '江湖', title: '破廟舊友', ctx: ['city'], w: 16, once: true, art: 'city', cond: s => isBirth(s, '孤兒'),
    text: '「喂！是你！」一個精瘦的少年從牆頭跳下來，一拳捶在你肩上。是小六子，當年和你在破廟裡分過半個冷饅頭的小六子。他如今背上掛著兩個麻袋，神氣得很：「我入了丐幫啦，是二袋弟子！你呢，還是一個人？」',
    choices: [
      { t: '「帶我去見見你們丐幫的人。」', cond: s => !s.sect, go: () => { S.sect = 'gaibang'; S.rank = 0; S.contrib = 60; S.contribTotal = 60; return '小六子拍著胸脯作保。帶他的錢八袋只看了你一眼就笑了：「吃過苦的孩子，錯不了。」你成了丐幫弟子，小六子還替你墊了一筆見面功勞。' + learn('gb_fist') + '〔門派貢獻+60〕'; } },
      { t: '請他喝頓酒，打聽消息', go: () => { advance(1); return '小六子喝得舌頭都大了，把城裡三教九流的門道倒了個乾淨：哪家當鋪收贓、哪個捕頭貪杯、哪條巷子夜裡別走。' + gain({ silver: -10, luck: 1, cha: 1 }); } },
      { t: '「各走各的路吧。」', go: () => '小六子愣了愣，把手裡的半個燒餅塞給你，轉身走了。' + gain({ hp: 20 }) },
    ] },

  /* ================= 戰鬥 ================= */
  { id: 'b_bandit', type: '戰鬥', title: '山賊攔路', ctx: ['travel'], w: 14, art: 'fight',
    text: '山道轉彎處滾下幾塊亂石，七八條漢子從林中跳出來，為首的把鬼頭刀往肩上一扛：「此山是我開！留下買路財！」',
    choices: [
      { t: '拔出兵刃', go: () => win(foe('山賊頭目', 1, 0.55, 'blade'), () => '頭目一倒，嘍囉們一哄而散。你從他身上搜出些不義之財。' + gain({ silver: ri(30, 80), fame: 4, moral: 2 }), null) },
      { t: '交 30 兩買路錢', cond: s => s.silver >= 30, go: () => '破財消災。山賊們掂著銀子，讓開了路。' + gain({ silver: -30 }) },
      { t: '施展身法衝過去', go: s => s.stats.agi + qingBonus() / 2 + R(6) >= 11 ? '你足尖一點，從眾人頭頂掠過，山賊只來得及看見你的背影。' : win(foe('山賊頭目', 1, 0.55, 'blade'), null, null, { intro: '你剛躍起就被套索絆住，只得回身硬拚！' }) },
    ] },
  { id: 'b_assassin', type: '戰鬥', title: '夜半刺客', ctx: ['city', 'sect'], w: 7, art: 'night', cond: s => s.fame >= 150,
    text: '夜深人靜，窗紙上映出一道黑影。你翻身滾下床榻的瞬間，三枚喪門釘釘入了枕頭。',
    choices: [{ t: '迎敵', go: () => win(foe('蒙面刺客', 4, 0.72, 'sword'), () => '刺客服毒自盡，身上只搜出一塊血色腰牌。看來你的名聲，已經讓某些人睡不著了。' + gain({ fame: 10, silver: 60 }), null, { noFlee: true }) }] },
  { id: 'b_sectwar', type: '戰鬥', title: '狹路相逢', ctx: ['travel'], w: 10, art: 'fight', cond: s => s.sect && SECTS[s.sect].align !== 0,
    text: s => SECTS[s.sect].align > 0 ? '道旁茶棚裡，幾個橫行鄉里的惡徒正在逼問一個過路的鏢師。其中一人認出了你的門派服色，冷笑著站起身來：「名門正派的小雜毛，也敢管閒事？」' : '你被幾個名門弟子堵在渡口。「你是那幫惡賊的人！」為首的青年拔劍出鞘，「今日替天行道！」',
    choices: [
      { t: '動手', go: s => win(foe(SECTS[s.sect].align > 0 ? '惡徒頭目' : '名門少俠', 2, 0.65, SECTS[s.sect].align > 0 ? 'blade' : 'sword'), () => '你為師門掙了臉面。消息傳回山門，師父頗為嘉許。' + gain({ contrib: 30, fame: 8, moral: SECTS[s.sect].align * 3 }), null) },
      { t: '不願多生事端，避走', go: () => '你壓低斗笠，從人群中悄然離開。' },
    ] },
  { id: 'b_kick', type: '戰鬥', title: '武館踢館', ctx: ['city'], w: 6, art: 'fight', cond: s => power() >= 8,
    text: '「振威武館」的招牌寫著「拳打三山、腳踢五嶽」。門口的教頭見你駐足，嗤笑道：「看什麼看？有本事進來討教兩招。」',
    choices: [
      { t: '進去討教', go: () => win(foe('振威館主', 3, 0.68, 'thug'), () => '館主捂著胸口，親手摘下了那塊招牌。街坊都說，早該有人治治他了。' + gain({ fame: 14, silver: 50 }), () => { S.hp = Math.round(maxHp() * 0.3); return '你被抬出了武館。' + gain({ fame: -6 }); }, { noFlee: true }) },
      { t: '一笑置之', go: () => '你笑了笑，走開了。' },
    ] },
  { id: 'b_flower', type: '戰鬥', title: '月黑風高', ctx: ['city'], w: 6, art: 'night',
    text: '夜裡你被屋瓦上的輕響驚醒。一道人影扛著個麻袋掠過屋脊，麻袋裡傳出悶住的哭聲。',
    choices: [
      { t: '追上去', go: () => win(foe('採花賊「粉蝴蝶」', 2, 0.62, 'sword'), () => '你救下了被擄的姑娘，把賊人捆了送官。天亮時，半個城都知道了你的名字。' + gain({ moral: 9, fame: 12 }), null) },
      { t: '翻身繼續睡', go: () => '第二天，滿城都在議論昨夜失蹤的姑娘。你一整天沒有說話。' + gain({ moral: -6 }) },
    ] },
  { id: 'b_duel', type: '戰鬥', title: '名劍客下戰書', ctx: ['city', 'sect'], w: 6, art: 'fight', cond: s => s.fame >= 300,
    text: '一封戰書釘在你的門上，字跡如劍：「久聞大名。明日午時，城外十里亭，一決高下。——『一劍寒』薛孤城」',
    choices: [
      { t: '如約赴會', go: () => win(foe('薛孤城', 8, 0.78, 'master'), () => '薛孤城的劍斷成兩截。他看著斷劍，忽然笑了：「好。三十年來，第一次有人讓我想重新練劍。」' + gain({ fame: 45 }), () => { S.hp = Math.round(maxHp() * 0.3); return '劍尖停在你咽喉前一寸。薛孤城收劍：「還差得遠。但你敢來，比許多人強。」' + gain({ fame: 5 }); }, { noFlee: true }) },
      { t: '避而不戰', go: () => '江湖上傳開了你怯戰的消息。' + gain({ fame: -15 }) },
    ] },

  /* ================= 奇遇 ================= */
  { id: 'a_cliff', type: '奇遇', title: '崖底洞天', ctx: ['wild', 'travel'], w: 5, once: true, art: 'cave',
    text: '山路濕滑，你一腳踏空，沿著陡坡滾落數十丈，被一株老松掛住。松後竟有個洞口。洞中一具枯骨盤膝而坐，膝上攤著一卷帛書，題著：九陰真經・蛇行狸翻。看那枯骨的姿態，像是當年偷學了真經、被人追殺至此的人。',
    choices: [
      { t: '先葬了前輩，再磕頭取書', go: () => { advance(1); return '你用雙手刨了一個坑。安葬已畢，你才發現枯骨原先坐著的石板下，還壓著一行小字：「肯葬我者，方為傳人。」石板下另有一枚丹丸。' + learn('q_shadow') + gain({ luck: 1, bonusHp: 20, moral: 3 }); } },
      { t: '取了帛書就走', go: () => '你把帛書揣入懷中，攀藤離開了山洞。' + learn('q_shadow') },
    ] },
  { id: 'a_herb', type: '奇遇', title: '千年靈芝', ctx: ['wild'], w: 6, art: 'cave',
    text: '絕壁的石縫間，一株紫芝正吐著幽光，傘蓋足有海碗大。你剛伸出手，一條水桶粗的赤鱗大蛇從岩後昂起了頭。',
    choices: [
      { t: '鬥蛇奪芝', go: () => win(foe('赤鱗巨蟒', 5, 0.7, 'beast'), () => '巨蟒癱軟在地。你小心翼翼地把靈芝連根採下。' + addItem('lingzhi'), null) },
      { t: '靈物有主，退走', go: () => '你慢慢後退，大蛇盤回了原處。' },
    ] },
  { id: 'a_beggar', who: 'elder', type: '奇遇', title: '討酒的老乞丐', ctx: ['city'], w: 7, once: true, art: 'city',
    text: '牆根下一個邋遢老乞丐衝你咂嘴：「小娃娃，老叫化三天沒聞著酒味了。賞口酒喝，老叫化不白喝你的。」',
    choices: [
      { t: '把陳年花雕遞給他', cond: () => has('wine'), go: () => { addItem('wine', -1); return '老乞丐一口氣灌了半罈，抹抹嘴，伸指在你背上連點七下。你只覺一股熱流貫通了平日滯澀的經脈。「你這娃娃不錯。記住，練功別光用蠻力，要用這裡。」他點了點你的額頭，晃晃悠悠地走了。' + gain({ int: 2, bonusMp: 25 }); } },
      { t: '給他 20 兩買酒', cond: s => s.silver >= 20, go: () => '老乞丐掂了掂銀子，嘿嘿一笑：「心是好的，就是不懂酒。」他隨手指點了你一處運勁的毛病。' + gain({ silver: -20, luck: 1 }) + xp(S.nei, 120) },
      { t: '捂著鼻子走開', go: () => '身後傳來老乞丐的嘆氣聲：「沒緣分，沒緣分哪。」' },
    ] },
  { id: 'a_fox', type: '奇遇', title: '雪地白狐', ctx: ['wild', 'travel'], w: 6, once: true, art: 'snow',
    text: '獵人的鐵夾上夾著一隻通體雪白的狐狸，後腿血肉模糊。牠沒有掙扎，只是用一雙琥珀色的眼睛靜靜地看著你。',
    choices: [
      { t: '掰開鐵夾，替牠敷藥', cond: () => has('jinchuang'), go: s => { addItem('jinchuang', -1); s.flags.fox = s.date.y; return '白狐一瘸一拐地走出幾步，回頭看了你很久，才消失在雪林深處。' + gain({ moral: 3 }); } },
      { t: '掰開鐵夾放牠走', go: () => '白狐拖著傷腿鑽進了灌木叢。' + gain({ moral: 1 }) },
      { t: '狐皮值錢，帶走', go: () => '你把狐皮賣給了皮貨商。' + gain({ silver: 80, moral: -6, luck: -1 }) },
    ] },
  { id: 'a_fox2', type: '奇遇', title: '白衣故人', ctx: ['wild', 'travel', 'city'], w: 12, once: true, art: 'love', cond: s => s.flags.fox && s.date.y > s.flags.fox,
    text: '客店裡，一個白衣人在你對面坐下，琥珀色的眼睛含著笑：「恩公不記得我了？那年大雪，一副鐵夾，一包金創藥。」白衣人放下一隻錦盒，起身一揖，「山野之物，聊表寸心。」你一眨眼，對面已空無一人。',
    choices: [{ t: '打開錦盒', go: () => '盒中是兩枚異香撲鼻的丹藥，和一小撮雪白的絨毛。' + addItem('dahuan', 2) + gain({ luck: 2 }) }] },
  { id: 'a_tomb', type: '奇遇', title: '古墓機關', ctx: ['wild'], w: 5, once: true, art: 'cave', cond: () => power() >= 8,
    text: '塌方露出了一道刻滿符文的石門。墓室正中，一尊銅鑄機關人守著兩座兵器架：左邊一柄劍寒氣森森，右邊一口刀烏沉沉不見光。機關人的眼窩裡亮起了紅光。',
    choices: [
      { t: '取劍', go: () => win(foe('守墓銅人', 8, 0.55, 'puppet'), () => '銅人轟然倒地。你握住劍柄，一股涼意直透掌心。' + addItem('w_sword3'), null) },
      { t: '取刀', go: () => win(foe('守墓銅人', 8, 0.55, 'puppet'), () => '銅人轟然倒地。那口刀重得出奇，是天外隕鐵所鑄。' + addItem('w_blade3'), null) },
      { t: '不擾亡者安寧', go: () => '你對著石門拜了三拜，原路退出。' + gain({ moral: 2 }) },
    ] },
  { id: 'a_auction', type: '奇遇', title: '鬼市', ctx: ['city'], w: 5, art: 'night', cond: s => s.silver >= 180,
    text: '三更時分，城隍廟後亮起一排白紙燈籠。這是只開半個時辰的鬼市，賣主都蒙著臉，不問來路，不講價錢。',
    choices: [
      { t: '買一枚大還丹（180 兩）', go: () => '賣主收了銀子，把蠟丸推過來，一個字也沒說。' + gain({ silver: -180 }) + addItem('dahuan') },
      { t: '買一株靈芝（300 兩）', cond: s => s.silver >= 300, go: () => '貨真價實的千年靈芝，不知是從哪座深山裡盜出來的。' + gain({ silver: -300 }) + addItem('lingzhi') },
      { t: '只看不買', go: () => '燈籠一盞盞熄滅，鬼市像從沒存在過。' },
    ] },
  { id: 'a_fall', type: '奇遇', title: '觀瀑有悟', ctx: ['wild', 'travel'], w: 8, art: 'mountain',
    text: '百丈飛瀑轟然而下，砸在潭中巨石上，水花四濺，巨石卻紋絲不動。你站在潭邊看了很久，隱約覺得這一衝一守之間，藏著某種道理。',
    choices: [
      { t: '在瀑下演練招式', go: () => { advance(3); return '你在水霧中把一套功夫翻來覆去練了三天，招式裡多了幾分渾然天成。' + (battleXp(120 + S.stats.int * 8) || '〔武學領悟加深〕'); } },
      { t: '在潭邊靜坐調息', go: () => { advance(3); return '水聲如雷，你的心卻越來越靜。' + (xp(S.nei, 140 + S.stats.int * 8) || '〔內息更加圓融〕') + gain({ mp: 999 }); } },
    ] },
  { id: 'a_chess', who: 'elder', type: '奇遇', title: '山中棋局', ctx: ['wild', 'travel'], w: 5, once: true, art: 'mountain',
    text: '松下石枰旁，兩位白鬚老者正在對弈，落子極慢。你湊近看了一眼，棋盤上黑白交錯，竟隱隱像兩位高手在拆招。',
    choices: [
      { t: '站在一旁觀棋', go: s => {
        if (s.stats.int >= 9) return '你看懂了。每一手棋都是一招，每一招都有來歷。一局終了，老者抬頭一笑：「看得懂的後生，三十年沒見過了。」' + gain({ int: 2 }) + (battleXp(200) || '');
        advance(30); return '你看得入了迷。等回過神來，肩上已落了一層枯葉，兩位老者早已不見——你竟站了整整一個月。' + gain({ int: 1 }) + '〔耗時三十日〕';
      } },
      { t: '不便打擾，悄悄離開', go: () => '你放輕腳步下了山。' },
    ] },
  { id: 'a_lake', type: '奇遇', title: '湖底沉箱', ctx: ['city', 'travel'], loc: 'linan', w: 8, once: true, art: 'river',
    text: '你在湖邊租了條小船垂釣，魚鉤忽然一沉，拉上來的不是魚，是一隻纏滿水草的銅皮箱子。',
    choices: [{ t: '撬開箱子', go: () => '箱裡是前朝某位官眷的首飾匣，銀錠早已發黑，一支白玉簪卻溫潤如新。' + gain({ silver: 180 }) + addItem('hairpin') }] },
  { id: 'a_temple', type: '奇遇', title: '破廟殘卷', ctx: ['travel'], w: 7, once: true, art: 'night',
    text: '夜雨，破廟。你撥旺火堆，發現供桌下墊著桌腳的竟是兩本發霉的冊子，封皮上依稀可辨刀與箭的圖樣。火光只夠你在天亮前讀完一本。',
    choices: [
      { t: '讀刀譜', go: () => '你就著火光比劃了一夜。' + learn('m_blade') },
      { t: '讀暗器圖解', go: () => '你撿了幾塊石子，對著廟柱練了一夜準頭。' + learn('m_dart') },
    ] },
  { id: 'a_storm', type: '奇遇', title: '雷雨夜', ctx: ['wild', 'travel'], w: 6, art: 'night', cond: s => s.date.m >= 4 && s.date.m <= 8 && s.skills[s.nei].lv >= 3,
    text: '烏雲壓頂，電蛇亂舞。一道驚雷劈中了不遠處的古樹，空氣裡滿是焦味。你體內的真氣竟隨著雷聲隱隱躁動起來。',
    choices: [
      { t: '登上峰頂，迎雷運功', go: s => s.stats.con + R(6) >= 11 ? '雷聲每響一次，你的真氣就壯大一分。雨停時，你的衣衫盡碎，丹田卻前所未有地充盈。' + gain({ bonusMp: 30 }) + xp(S.nei, 150) : '一道餘電掃過你的肩頭，你當場昏死過去，醒來時半邊身子還是麻的。' + gain({ hp: -Math.round(maxHp() * 0.5), bonusMp: 8 }) },
      { t: '找個山洞避雨', go: () => '你在山洞裡聽了一夜雷聲。' },
    ] },
  { id: 'a_spring', type: '奇遇', title: '地脈靈泉', ctx: ['wild'], w: 5, once: true, art: 'cave',
    text: '循著硫磺味，你在亂石後找到一眼冒著熱氣的泉水，水色乳白，泉邊寸草不生，石上卻有前人刻的兩個字：洗髓。',
    choices: [{ t: '入泉浸泡', go: () => { advance(3); return '泉水滾燙，像千萬根針扎進骨縫。你咬牙泡足了三日，出水時渾身輕了幾斤，舊傷的疤也淡了。' + gain({ bonusHp: 40, con: 1, hp: 999 }); } }] },
  { id: 'a_doctor', type: '奇遇', title: '遊方郎中', ctx: ['city', 'travel'], w: 5, once: true, art: 'road', cond: s => s.silver >= 200,
    text: '搖著串鈴的遊方郎中盯著你看了半晌：「少俠幼時傷過根基，氣血雖旺，經脈卻有三處淤塞。老朽有一套金針，可通此塞。診金二百兩，不二價。」',
    choices: [
      { t: '請先生施針（200 兩）', go: () => '七十二根金針拔出時，你吐出一口黑血，只覺四肢百骸無不通泰。' + gain({ silver: -200, str: 1, agi: 1, bonusMp: 15 }) },
      { t: '「江湖騙子。」', go: () => '郎中搖搖頭，搖著串鈴遠去了。' },
    ] },

  /* ================= 傳承 ================= */
  { id: 'l_dying', who: 'elder', type: '傳承', title: '垂死的高人', ctx: ['travel', 'wild'], w: 6, once: true, art: 'legacy', cond: s => s.date.y >= 2,
    text: '血跡一路延伸到山神廟裡。一個渾身是傷的老者靠著神案，身邊倒著七具黑衣屍體。他看見你，渾濁的眼裡亮了一下：「老夫縱橫四十年，臨了卻連個磕頭的人都沒有……娃娃，你過來。老夫一手劍、一手刀，只剩傳一樣的力氣了。」',
    choices: [
      { t: '「晚輩願學劍。」', go: () => '老者以指代劍，在地上劃了三十六道痕。每劃一道，他的氣息就弱一分。最後一道劃完，他把手按在你頭頂，將殘存的內力盡數渡了過來。「去吧。別讓它……埋沒了……」' + learn('q_swan') + gain({ bonusMp: 30 }) },
      { t: '「晚輩願學刀。」', go: () => '老者大笑，笑得咳出血來：「好！刀才是男兒氣概——女兒家使來，更是了不得！」他口述了十八句刀訣，逼你背了三遍，才把手按在你頭頂，渡盡了最後的內力。' + learn('q_king') + gain({ bonusMp: 30 }) },
      { t: '先替他治傷', cond: () => has('jinchuang'), go: () => { addItem('jinchuang', -1); return '老者推開你的手：「沒用了，五臟都碎了。」他卻笑了，「可你這份心，老夫記下了。」他把刀劍兩樣的總綱一併念給你聽——能悟多少，看你的造化。' + learn(S.eq.some(e => SKILLS[e].type === 'blade') ? 'q_king' : 'q_swan') + gain({ bonusMp: 40, bonusHp: 30, moral: 4 }); } },
    ] },
  { id: 'l_wall', type: '傳承', title: '石壁遺刻', ctx: ['wild'], loc: 'tianmu', w: 9, once: true, art: 'cave', cond: s => s.stats.int >= 8 || s.stats.luck >= 9,
    text: '藤蔓後露出一間石屋，屋裡空無一物，四面石壁卻刻滿了字。落款是「黃裳」——一個北宋的老人，為了破解天下武功，在這裡獨自想了四十年。\n\n你認出了其中幾行：這是《九陰真經》的草稿。壁腳一行小字：「貪多必噬。後來者擇其一。」',
    choices: [
      { t: '參悟上卷的內功', go: () => { advance(20); return '你在壁前坐了二十日。內息運行，陰陽互濟，像是兩條河匯成了一條。' + learn('q_ice'); } },
      { t: '參悟下卷的摧心掌', go: () => { advance(20); return '你在壁前坐了二十日。這門掌法狠毒得讓你心驚，可你終究還是學會了。' + learn('jy_heart') + gain({ moral: -8 }); } },
      { t: '參悟角落裡的移魂大法', go: () => { advance(20); return '你在壁前坐了二十日，看著自己在石壁上的倒影，看到後來，竟分不清哪個是自己。' + learn('jy_soul'); } },
    ] },
  { id: 'l_master', who: 'elder', type: '傳承', title: '鎮派絕學', ctx: ['sect'], w: 40, art: 'legacy',
    cond: (s, L) => s.sect && sectUlt(s.sect) && L.sect === s.sect && s.rank === 3 && s.contribTotal >= ultNeed(s.sect).contrib && s.fame >= ultNeed(s.sect).fame,
    text: s => { const k = SECTS[s.sect]; return `${k.master}領你走進後殿，${k.head}已經在那裡等著了。\n\n「你入門這些年，替本門做的事，大家都看在眼裡。」${k.head}看著你，「掌門之位自有人選，那不是你的路。可本門的「${SKILLS[sectUlt(s.sect)].n}」，不該只傳給一個人。」\n\n「按規矩，你得先接下傳功長老三十招。」`; },
    choices: [
      { t: '「弟子領命。」', go: s => win(foe('傳功長老', 16, 0.6, SECTS[s.sect].align < 0 ? 'demon' : 'master'), () => { const k = SECTS[s.sect]; return `傳功長老收了手，對${k.head}點了點頭。\n\n那天夜裡，${k.head}在後殿一招一式地把本門絕學傳給了你。臨別時只說了一句：「這門功夫，往後是你的，也是本門的。用的時候，記得自己是誰教的。」` + learn(sectUlt(s.sect)) + gain({ fame: 80, moral: k.align * 3 }); },
        () => { S.hp = Math.round(maxHp() * 0.4); return '你沒能撐過三十招。傳功長老扶起你：「功力還差一截。再練些日子，回山門來，我還在這裡等你。」'; }, { noFlee: true }) },
      { t: '「弟子資質平庸，不敢領受。」', go: () => '後殿裡靜了很久。最後只聽見一聲輕笑：「知道自己幾斤幾兩，也是一門功夫。」你得了一段心法口訣作為補償。' + gain({ moral: 5, int: 1, bonusMp: 30 }) },
    ] },
  /* ================= 武學奇緣：書中武功 ================= */
  { id: 'k_spear', type: '奇遇', title: '牛家村的舊槍', ctx: ['city', 'travel'], loc: 'linan', w: 7, once: true, art: 'road', cond: () => ad() >= 1210,
    text: '你在臨安城外迷了路，走進了一個叫牛家村的小村子。村東頭有兩間荒廢多年的屋子，門板都朽了。\n\n其中一間的牆上掛著一桿生鏽的鐵槍，槍桿上刻著四個字：鐵心楊氏。槍下壓著一疊發黃的紙，畫著一個個持槍的小人。',
    choices: [
      { t: '取下槍譜，在院子裡照著練', go: () => { advance(7); return '你在破屋裡住了七天，把那疊紙上的槍法從頭到尾練了一遍。臨走前，你把那桿鐵槍擦乾淨，重新掛回了牆上。〔耗時七日〕' + learn('y_spear') + (has('w_spear1') || has('w_spear2') ? '' : addItem('w_spear1')); } },
      { t: '這是別人家的東西，不碰', go: () => '你對著那桿槍行了一禮，輕輕帶上了門。村裡的老人說，這兩戶人家十幾年前一夜之間就沒了。' + gain({ moral: 3 }) },
    ] },
  { id: 'k_taohua', type: '奇遇', title: '落英', ctx: ['wild'], loc: 'taohua', w: 10, once: true, art: 'valley', cond: s => s.stats.int + s.stats.luck >= 16,
    text: '你又一次迷失在桃花陣裡。這回你沒有亂走，而是坐下來看。\n\n林子深處有一個啞僕在掃落花。他不用掃帚，用的是一雙手掌：掌風一動，滿地花瓣就旋成一團，被送到樹根底下。他的掌影快得你數不清，可每一片花瓣都沒有碎。',
    choices: [
      { t: '躲在樹後，看他掃完一整片林子', go: s => { advance(3); return s.stats.int >= 11 ? '你看了三天，啞僕也掃了三天。第三天傍晚，他忽然轉過頭，衝你比了一個手勢——像是在說：「看夠了？那就走吧。」\n\n你走出桃花林時，雙掌間像是還有花瓣在轉。〔耗時三日〕' + learn('th_palm') : '你看了三天，只看懂了一點皮毛。可那一點皮毛，已經比你從前學的任何掌法都精妙。〔耗時三日〕' + (battleXp(220) || '') + gain({ agi: 1 }); } },
      { t: '上前問路', go: () => '啞僕看了你一眼，指了指海邊的方向，又低頭掃他的花去了。' },
    ] },
  { id: 'k_jebe', type: '奇遇', title: '神箭手', ctx: ['wild', 'travel'], loc: 'mobei', w: 10, once: true, art: 'desert', cond: () => ad() <= 1227,
    text: '草原上，一個黑臉的蒙古將軍正在教一群牧童射箭。他拉弓的時候，連風都像是停了。\n\n一隻大鵰從天上飛過，他隨手一箭，兩隻鵰一起掉了下來。牧童們歡呼起來。有人告訴你，那是大汗帳下的第一神箭手，叫哲別。',
    choices: [
      { t: '牽著馬上前，求他指點', go: s => s.stats.str + s.stats.agi >= 13 ? '哲別看了看你的手臂，扔給你一張弓：「拉開它。」你拉開了。他點了點頭：「肩要沉，氣要穩，眼睛看著你要射的東西，別看箭。」\n\n他教了你整整一個下午。' + learn('mg_bow') : '你拉不開他那張弓。哲別哈哈一笑，換了一張小弓給你，教了你幾句要訣。' + gain({ agi: 1 }) },
      { t: '遠遠看著就好', go: () => '那一箭雙鵰的畫面，你記了很多年。' },
    ] },
  { id: 'k_wrestle', type: '奇遇', title: '那達慕', ctx: ['wild', 'travel'], loc: 'mobei', w: 8, once: true, art: 'desert',
    text: '草原上正在過那達慕大會，賽馬、射箭、摔跤，熱鬧得像過年。摔跤場上，一個膀大腰圓的漢子已經連摔了九個人，正叉著腰找第十個。\n\n他看見了你：「南邊來的？敢不敢下場？」',
    choices: [
      { t: '脫了外衣下場', go: () => ({ battle: foe('摔跤手巴圖', 2, 0.55, 'thug'), noFlee: true,
        win: () => '巴圖被你摔進了泥裡，爬起來卻哈哈大笑，拉著你喝了一整夜的馬奶酒，還把摔跤的訣竅一樣一樣教給你。' + learn('mg_wrestle') + gain({ fame: 5 }),
        lose: s => { s.hp = Math.round(maxHp() * 0.5); return '你被摔得眼冒金星。巴圖把你拉起來：「不錯，有骨氣！」他教了你幾手，說明年再來。' + learn('mg_wrestle'); } }) },
      { t: '在場邊喝酒看熱鬧', go: () => '馬奶酒有點酸，但喝多了，你也跟著大夥兒一起吼了起來。' + gain({ cha: 1 }) },
    ] },
  { id: 'k_jiuyin', type: '奇遇', title: '白骨', ctx: ['city'], loc: 'yanjing', w: 10, once: true, art: 'night', cond: () => ad() >= 1218 && ad() <= 1225,
    text: '你半夜穿過趙王府的後山，聽見林子裡有怪聲。\n\n月光下，一個披頭散髮的瞎眼女人正在練功。她的十根手指插進地上排成一排的骷髏頭頂，每個骷髏頭頂上都有五個整整齊齊的小洞。\n\n她練完就走了。地上落下一小片東西，像是一塊人皮，上面密密麻麻刺著字。',
    choices: [
      { t: '撿起來，照著上面的字練', go: () => '人皮上的字晦澀難懂，你只看懂了練爪的那一段。練成那天，你看著自己的手，忽然有些害怕。' + learn('jy_claw') + gain({ moral: -15 }) },
      { t: '撿起她落在地上的白色長鞭', go: () => '那條鞭子長得出奇，鞭梢上還纏著幾根人的頭髮。你回去照著她揮鞭的樣子練了一個月。' + learn('jy_whip') + gain({ moral: -5 }) },
      { t: '一把火燒了它', go: () => '人皮燒起來有一股奇怪的味道。你不知道自己燒掉的是什麼，只知道這種東西，不該留在世上。' + gain({ moral: 8, int: 1 }) },
      { t: '裝作什麼也沒看見，快步離開', go: () => '你一路沒敢回頭。後來你才聽說，江湖上有個叫「鐵屍」梅超風的女人，就住在趙王府。' },
    ] },
  { id: 'k_finger', type: '傳承', title: '七十二絕技・拈花指', ctx: ['sect'], loc: 'shaolin', w: 14, once: true, art: 'temple', cond: s => s.sect === 'shaolin' && s.rank >= 2 && ad() < 1300,
    text: '達摩院的首座把你叫去，桌上擺著一朵花。\n\n「本寺七十二絕技，每一門都要有相應的佛法修為才能練，否則必傷己身。你入寺以來心性還算端正。這門拈花指，講的是一個『放』字。」他拈起那朵花，「你看，我手上有花，心裡沒有。」',
    choices: [{ t: '合十受教', go: s => s.moral >= 10 ? '你在達摩院面壁三個月，終於能面帶微笑地出指了。〔耗時九十日〕' + (advance(90), '') + learn('sl_finger') : '首座看了你很久，搖搖頭：「你心裡的東西太多了。先回去吧。」' + gain({ int: 1 }) }] },
  { id: 'k_dragon', type: '傳承', title: '七十二絕技・龍爪手', ctx: ['sect'], loc: 'shaolin', w: 14, once: true, art: 'temple', cond: s => s.sect === 'shaolin' && s.rank >= 2 && ad() >= 1300,
    text: '達摩院的一位老僧在後院教幾個武僧練爪。他的出手又快又準，三十六式一氣呵成，一個武僧連他的衣角都碰不到。\n\n老僧看見了你：「你也來。龍爪手是本寺七十二絕技裡最講實戰的一門。練它不難，難的是知道什麼時候不該用。」',
    choices: [{ t: '上前一起練', go: () => { advance(30); return '你跟著老僧練了一個月，十根手指磨破了又長好。〔耗時三十日〕' + learn('sl_dragon'); } }] },
  { id: 'k_eagle', type: '江湖', title: '天鷹教', ctx: ['city'], w: 9, once: true, art: 'city', cond: s => ad() >= 1336 && ad() <= 1357 && ['linan', 'jiaxing'].includes(s.loc),
    text: '街口搭了個台子，幾個穿白袍的漢子在招人。台上一個壇主正在演示功夫：十指一扣，一塊青磚就碎成了五瓣。\n\n「天鷹教廣招天下英雄！」他朗聲道，「誰能接我十招鷹爪功，本壇主親自傳他這門功夫！」',
    choices: [
      { t: '上台接招', go: () => ({ battle: foe('天鷹教壇主', 4, 0.62, 'thug'), noFlee: true,
        win: () => '壇主收了手，臉上倒有幾分佩服：「好！說話算話。」他把鷹爪擒拿手的口訣一句句傳給了你，臨走還塞給你一張帖子：「想入教，拿這個來找我。」' + learn('ty_claw') + gain({ fame: 8 }),
        lose: s => { s.hp = Math.round(maxHp() * 0.4); return '你沒撐過十招，手腕被扣得青紫。壇主哈哈一笑：「練好了再來。」'; } }) },
      { t: '不湊這個熱鬧', go: () => '你聽人說，天鷹教的教主是明教從前的護教法王，正派中人都不愛和他們打交道。' },
    ] },
  /* ================= 五絕與名家 ================= */
  { id: 'k_yideng', type: '奇遇', title: '漁樵耕讀', ctx: ['sect', 'wild', 'travel'], loc: 'tiezhang', w: 10, once: true, art: 'mountain', cond: s => ad() >= 1225 && ad() <= 1262 && (s.fame >= 100 || s.stats.int >= 9),
    text: '你在湘西深山裡迷了路，循著水聲找到一道瀑布。瀑布邊坐著一個釣魚的漁人，再往上，有樵夫砍柴、農夫耕田，山頂竹林裡還有個書生在讀書。\n\n四個人都不像普通人。他們守著的山頂上，似乎住著一位老和尚。',
    choices: [
      { t: '上山去，跟那書生對對子', go: s => s.stats.int >= 10 ? '書生出了三道題，你答上了兩道半。他搖著扇子笑了：「也罷，師父說今日有客。」\n\n山頂的老和尚慈眉善目，聽說你一路的經歷，伸出一根手指，在你胸口輕輕一點。一股暖流從那一點散開，走遍了你的四肢百骸。「這一指，你記住就好。」' + learn('yy_finger') : '書生的題目你一道也答不上來。他歎了口氣，指了指下山的路。' + gain({ int: 1 }) },
      { t: '跟那樵夫打一架，硬闖上去', go: () => ({ battle: foe('樵子', 9, 0.6, 'blade'), noFlee: true,
        win: () => '樵夫放下了斧頭：「你這人倒也實在。」山頂的老和尚聽見動靜，出來看了你一眼，搖頭笑了笑，用一根手指替你治好了身上的傷——你這才知道，世上真有這種指法。' + learn('yy_finger'),
        lose: s => { s.hp = Math.round(maxHp() * 0.4); return '你被樵夫一斧背拍下了山。他在上面喊：「年輕人，脾氣別這麼急！」'; } }) },
    ] },
  { id: 'k_toad', type: '奇遇', title: '倒立的瘋子', ctx: ['wild', 'travel'], w: 8, once: true, art: 'mountain', cond: () => ad() >= 1236 && ad() <= 1242,
    text: '路邊有個白髮蓬亂的老人，頭下腳上地倒立著走路，嘴裡念念有詞。他看見你，一個翻身站起來，抓住你的肩膀，力氣大得嚇人：「我是誰？你說，我是誰？」',
    choices: [
      { t: '「你就是你。」', go: () => '老人愣了很久，忽然哈哈大笑：「對！我就是我！好孩子，叫一聲爹，我教你天下第一的功夫！」\n\n你叫了。他果然教了你——蹲在地上，呱呱叫著，教了你整整一夜。天亮時他人已經不見了。' + learn('hm_toad') },
      { t: '「你是個瘋子。」', go: () => ({ battle: foe('瘋老人', 14, 0.5, 'master'), noFlee: true, intro: '老人勃然大怒，蹲下身子，呱的一聲叫——',
        win: () => '你居然撐住了。老人歪著頭看你，像看一個怪物，然後手臂一彎，像蛇一樣繞過你的格擋拍了你一下：「這叫靈蛇拳，你接得住，就送給你。」說完倒立著走遠了。你後來才聽說，他是西毒歐陽鋒。' + learn('ws_snake') + gain({ fame: 30 }),
        lose: s => { s.hp = Math.round(maxHp() * 0.2); return '你被一股排山倒海的勁力推出了好幾丈。醒來時老人已經不見了，只在地上留下一個蛤蟆形狀的坑。'; } }) },
      { t: '甩開他，拔腿就跑', go: () => '你跑出了三里地才敢回頭。他沒有追，仍舊在原地倒立著，對著天空問：「我是誰？」' },
    ] },
  { id: 'k_flick', type: '奇遇', title: '青袍客', ctx: ['city'], w: 8, once: true, art: 'city', cond: s => ad() >= 1225 && ad() <= 1265 && ['jiaxing', 'linan'].includes(s.loc),
    text: '茶樓上，一個戴著面具的青袍人獨自喝茶。一隻蒼蠅在他頭頂嗡嗡繞了三圈，他屈指一彈，一粒瓜子殼飛出去，把蒼蠅釘在了對面的柱子上。\n\n滿樓的人都沒注意到。只有你看見了。',
    choices: [
      { t: '端著茶過去，跟他聊聊奇門五行', go: s => s.stats.int >= 11 ? '你們從五行生剋聊到樂律，又從樂律聊到天下大勢。他說話刻薄，卻句句說到了點子上。臨走時他拈起一粒瓜子，在你面前慢慢彈了一次：「看清楚了。只演一遍。」' + learn('th_flick') : '你說了幾句，他就不耐煩了：「俗人。」說完扔下茶錢走了。' + gain({ int: 1 }) },
      { t: '裝作沒看見', go: () => '他離開時看了你一眼，像是知道你看見了。後來你才想到，他也許就是桃花島主。' },
    ] },
  { id: 'k_kongming', type: '奇遇', title: '老頑童', ctx: ['wild', 'travel'], w: 8, once: true, art: 'mountain', cond: s => ad() >= 1225 && ad() <= 1300 && s.stats.luck >= 7,
    text: '一個白鬍子老頭從樹上倒掛下來，嚇了你一跳。他笑嘻嘻地說：「小娃娃，陪我玩一會兒！我左手跟右手打架，你當裁判！」\n\n他真的左手打右手，打得有來有回，還一邊打一邊替兩隻手吵架。',
    choices: [{ t: '陪他玩', go: s => { advance(5); let t = '你陪他玩了五天。他教你的拳法輕飄飄的，怎麼都打不到人，可也怎麼都打不著你。〔耗時五日〕' + learn('kong_fist');
      if (s.stats.int <= 8) { s.flags.huibo = true; t += '\n\n他又教你左手畫圓、右手畫方。你笨手笨腳地畫了三天，居然畫成了。老頭大喜：「笨人才學得會！聰明人心思太多，一輩子學不會！」〔學會左右互搏：兩門拳掌同時備戰時威力大增〕'; }
      else t += '\n\n他又教你左手畫圓、右手畫方，你怎麼也畫不成。老頭搖頭：「你太聰明了，學不會的。」';
      return t; } }] },

  /* ================= 遺留武功：依年代與地點的奇遇 ================= */
  { id: 'k_qiguai', type: '奇遇', title: '江南七怪', ctx: ['city'], loc: 'jiaxing', w: 12, once: true, art: 'dock', cond: () => ad() >= 1223 && ad() <= 1225,
    text: '醉仙樓裡坐著一桌怪人：一個瞎眼的老頭、一個邋遢書生、一個矮胖子、一個挑扁擔的、一個樵夫模樣的、一個市儈的秤桿漢，還有一個清秀的姑娘。\n\n店小二說，這是嘉興出了名的「江南七怪」，在蒙古待了十幾年，剛回來。他們今天心情好，說要考考後生。',
    choices: [
      { t: '請那位姑娘指點劍法', go: s => s.stats.agi >= 8 ? '韓姑娘讓你走了三趟步子，點點頭，教了你一路越女劍法。' + learn('q_swan') : '韓姑娘看了你的步子，搖頭：「腳下太慢。」只教了你兩句步法要訣。' + gain({ agi: 1 }) },
      { t: '跟邋遢書生學兩手', go: () => '書生跟你握了握手。你一低頭，錢袋已經在他手裡了。他哈哈大笑，把錢袋還你，順手教了你一路拆人筋骨的手法。' + learn('jn_zhu') },
      { t: '向矮胖子討教鞭法', go: () => '矮胖子把一條金龍鞭甩得呼呼作響，教了你一下午。' + learn('jn_whip') + (has('w_whip1') ? '' : addItem('w_whip1')) },
      { t: '敬瞎眼老頭一碗酒', go: () => '老頭接過酒一飲而盡，忽然手一揚，桌上的蒼蠅全掉了下來。「鐵菱。你要學，就別拿它對著好人。」' + learn('jn_ling') },
    ] },
  { id: 'k_guiyun', type: '奇遇', title: '歸雲莊', ctx: ['city'], loc: 'jiaxing', w: 8, once: true, art: 'river', cond: () => ad() >= 1222 && ad() <= 1245,
    text: '你在太湖邊借宿，莊主是個雙腿殘廢的中年人，姓陸，談吐風雅，莊子裡的佈置暗合奇門五行。\n\n他看你在院子裡打拳，搖頭笑了：「腿上功夫太弱。我年輕時學過一路腿法，可惜這雙腿再也使不出來了。」',
    choices: [{ t: '請陸莊主指點', go: () => '陸莊主坐在椅子上，一招一式地講，讓他兒子演給你看。你在莊裡住了十天。〔耗時十日〕' + (advance(10), '') + learn('th_leg') }] },
  { id: 'k_taohua2', type: '奇遇', title: '試劍亭', ctx: ['wild'], loc: 'taohua', w: 8, once: true, art: 'valley', cond: s => ad() >= 1220 && ad() <= 1265 && s.stats.int >= 11,
    text: '你這回沒有迷路。順著桃樹的排列找到了規律，走到了島中央的一座小亭。\n\n亭柱上刻著一行行簫譜，旁邊畫著持簫的人形。你看了半天才明白：這些簫譜既是曲子，也是劍招。',
    choices: [
      { t: '照著人形，以簫為劍', go: () => '你折了一根竹子當簫，在亭子裡比劃了一整天。' + learn('th_xiao') },
      { t: '試著吹奏亭柱上的簫譜', go: s => { s.hp = Math.max(1, s.hp - Math.round(maxHp() * 0.3)); return '你吹到一半，心口一陣絞痛，吐出一口血來。可是那曲子的調子，從此你一聽就會。' + learn('th_sea'); } },
    ] },
  { id: 'k_lanhua', type: '奇遇', title: '黃幫主', ctx: ['city'], loc: 'xiangyang', w: 8, once: true, art: 'city', cond: s => ad() >= 1243 && ad() <= 1272 && (s.sect === 'gaibang' || s.fame >= 200),
    text: '襄陽城的丐幫分舵裡，一位中年美婦在教幾個弟子點穴。她出手像拂花一樣好看，可被點中的人當場就動不了了。\n\n有人小聲告訴你，那就是黃幫主——郭大俠的夫人。',
    choices: [{ t: '站在後面跟著學', go: () => '她看見了你，也不趕你，只是把手法放慢了一些。' + learn('th_lan') }] },
  { id: 'k_baituo', type: '戰鬥', title: '白駝山少主', ctx: ['city'], loc: 'yanjing', w: 8, once: true, art: 'city', cond: () => ad() >= 1222 && ad() <= 1225,
    text: '一個白衣公子騎著白駱駝進了燕京城，身後跟著二十幾個白衣女子。他看上了街邊賣花的姑娘，伸手就要拉。\n\n一個白衣女子攔在你面前：「少主辦事，閒人退開。」',
    choices: [{ t: '「這個閒事我管定了。」', go: () => ({ battle: foe('白駝山女弟子', 4, 0.6, 'thug'), noFlee: true,
      win: () => '白衣公子收起摺扇，饒有興味地看著你：「有點意思。」他當場使了一路掌法給你看，像是在炫耀：「這叫神駝雪山掌，你學得會，算你本事。」' + learn('ws_camel'),
      lose: s => { s.hp = Math.round(maxHp() * 0.4); return '你被一掌打退了。白衣公子大笑著揚長而去，那掌法的路數，卻深深印在了你腦子裡。' + learn('ws_camel'); } }) }] },
  { id: 'k_lama', type: '戰鬥', title: '藏僧', ctx: ['city'], loc: 'yanjing', w: 7, once: true, art: 'city', cond: () => ad() >= 1222 && ad() <= 1225,
    text: '趙王府門口，一個紅衣藏僧在跟人打賭：誰能接他一掌，他就把掌法教給誰。地上已經躺了三個。',
    choices: [{ t: '上前接掌', go: () => ({ battle: foe('紅衣藏僧', 4, 0.62, 'master'), noFlee: true,
      win: () => '藏僧雙手合十：「施主好功夫。」他果然把大手印的口訣傳給了你。' + learn('zm_hand'),
      lose: s => { s.hp = Math.round(maxHp() * 0.3); return '你被一掌拍飛了。藏僧笑了笑，沒有再理你。'; } }) }] },
  { id: 'k_yingu', type: '奇遇', title: '黑沼', ctx: ['sect', 'wild', 'travel'], loc: 'tiezhang', w: 8, once: true, art: 'night', cond: s => ad() >= 1225 && ad() <= 1262 && (s.stats.int >= 10 || s.stats.agi >= 10),
    text: '湘西的密林裡有一片黑沼，沼中的小屋住著一個白髮女人，屋裡地上擺滿了算籌。她頭也不抬：「你來得正好。這道題，你算得出來，我就讓你走。」',
    choices: [{ t: '蹲下來陪她算', go: s => s.stats.int >= 10 ? '你算了一夜，終於算出來了。她第一次抬頭看你，然後帶你走了一趟黑沼。她在泥地上滑行，像一條泥鰍。「這叫泥鰍功。走得出這片沼，你就學會了。」' + learn('yg_eel') : '你算不出來。她嘆了口氣，揮手讓你走。你在沼裡掙扎了半天才出來，身法倒是靈活了些。' + gain({ agi: 1 }) }] },
  { id: 'k_sad', type: '奇遇', title: '獨臂人', ctx: ['wild', 'travel'], w: 6, once: true, art: 'river', cond: s => ad() >= 1260 && ad() <= 1300 && !s.spouse && Object.values(s.npcs || {}).some(n => n.fav >= 50),
    text: '海邊的礁石上坐著一個獨臂的中年人，身邊站著一隻醜陋的大鵰。他對著大海出了一掌，浪花在他面前炸開。\n\n他回頭看了你一眼：「你心裡也有放不下的人。」',
    choices: [{ t: '點了點頭', go: () => '他沉默了很久，起身教了你幾招。招式很怪，有一招叫「心驚肉跳」，一招叫「魂不守舍」。\n\n「這套掌法，心裡沒有思念的人使不出來。」他說，「但願你一輩子都練不到家。」' + learn('yg_sad') }] },
  { id: 'k_jianzhong', type: '奇遇', title: '劍塚', ctx: ['city'], loc: 'xiangyang', w: 6, once: true, art: 'cave', cond: s => ad() >= 1245 && s.stats.str >= 12,
    text: '襄陽城外的荒谷裡，你跟著一隻大鳥的足跡找到了一處山洞。洞後的石壁下，並排插著幾塊石碑，碑前的石頭上刻著：「劍魔獨孤求敗，縱橫江湖三十餘載……」\n\n第二塊碑前，有一道很深的劍痕，旁邊的字寫著：「重劍無鋒，大巧不工。」',
    choices: [{ t: '撿一根粗重的鐵棍，照著劍痕揮', go: () => { advance(20); return '你在谷裡揮了二十天，手臂腫了又消，消了又腫。最後一天，你一棍揮出，瀑布的水被生生劈開了一瞬。〔耗時二十日〕' + learn('yg_iron'); } }] },
  { id: 'k_luzhuang', type: '奇遇', title: '陸家莊', ctx: ['city'], loc: 'jiaxing', w: 14, once: true, art: 'night', cond: () => ad() >= 1240 && ad() <= 1241,
    text: '嘉興陸家莊的牆上，被人按了九個血紅的手印。街坊說，那是赤練仙子的記號——她要殺陸家滿門。\n\n那天夜裡，一個杏黃道袍的女子帶著一個年輕女弟子來了。你躲在對街的屋簷下，看見那女弟子先動了手，一招一式都像古畫裡的美人。',
    choices: [{ t: '記下那女弟子的拳招', go: () => '她每一招都有個好聽的名字，你聽見她師父在旁邊喊：「貴妃回眸！文姬歸漢！」你一招一招記了下來。' + learn('gm_fist') + gain({ moral: -2 }) },
      { t: '去附近報官、喊人', go: () => '等你喊來人時，莊子裡已經沒有活口了。只有兩個小姑娘被一個瘋瘋癲癲的老頭和一個道姑救走了。' + gain({ moral: 5 }) }] },
  { id: 'k_jinlun', type: '奇遇', title: '蒙古軍營', ctx: ['wild', 'travel'], loc: 'mobei', w: 9, once: true, art: 'desert', cond: s => ad() >= 1243 && ad() <= 1259 && s.stats.con >= 10,
    text: '你在蒙古軍營裡當了幾個月的民夫。營裡有個高大的藏僧，人人敬他是國師。他的大弟子力氣大得驚人，一個人能扛起一頭牛。\n\n那大弟子腦子不太靈光，卻很喜歡跟你說話。',
    choices: [{ t: '跟他學怎麼練出那身力氣', go: () => { advance(30); return '他教你的是他師父的密宗功夫，最淺的那一層。他說，他師父已經練到了第十層，每一層都有一龍一象之力。〔耗時三十日〕' + learn('jl_dragon'); } }] },
  { id: 'k_qinghua', type: '奇遇', title: '絕情谷', ctx: ['travel', 'wild'], w: 7, once: true, art: 'valley', cond: () => ad() >= 1243 && ad() <= 1258,
    text: '你迷路走進了一座山谷，谷裡開滿了一種你沒見過的花，花瓣上有刺。谷裡的人都穿綠衣，不吃葷，說話也很少。\n\n谷主是個面色冷漠的中年人，他的劍和刀一黑一金，換著使。谷底的山洞裡，據說還關著一個沒有腿的老婦人。',
    choices: [
      { t: '偷看谷主練刀劍', go: () => '你看了三天才看懂：他用刀的手法使劍，用劍的手法使刀。' + learn('gs_blade') },
      { t: '去谷底看那個老婦人', go: () => '老婦人坐在洞底，口一張，一顆棗核釘進了你身邊的石壁。她冷笑：「想學？先給我找些棗子來。」' + learn('qc_nail') },
      { t: '不碰谷裡的花，趕緊離開', go: () => '你後來聽說，被那花刺扎過的人，一動情念就會痛不欲生。' },
    ] },
  { id: 'k_zhuzi', type: '奇遇', title: '一陽書指', ctx: ['city'], loc: 'xiangyang', w: 7, once: true, art: 'city', cond: s => ad() >= 1243 && ad() <= 1273 && s.stats.int >= 11,
    text: '襄陽城裡有個書生打扮的中年人，每天在城頭寫字。他寫字不用筆，用的是一根手指，指力透進石頭裡，筆畫清清楚楚。\n\n他看見你在旁邊看，笑道：「你也懂書法？」',
    choices: [{ t: '「懂一點。」', go: () => '你們從顏真卿聊到懷素。他教你：「一陽指不在指，在意。字寫到心裡，指力自然到。」' + learn('zz_finger') }] },
  { id: 'k_kunlun1', type: '奇遇', title: '崑崙三聖', ctx: ['sect', 'wild', 'travel'], loc: 'kunlun', w: 9, once: true, art: 'snow', cond: () => ad() >= 1262 && ad() < 1300,
    text: '崑崙山中有一座小屋，住著一個白衣書生，彈琴、下棋、練劍，自稱「崑崙三聖」。他說自己幾年前在少林寺輸了一場，從此發誓不再出山。',
    choices: [{ t: '陪他下一盤棋', go: () => '你輸了。他很高興，教了你一路劍法，劍招裡帶著琴聲。' + learn('kl_sword') }] },
  { id: 'k_kunlun2', type: '奇遇', title: '崑崙派', ctx: ['sect', 'wild', 'travel'], loc: 'kunlun', w: 8, once: true, art: 'snow', cond: () => ad() >= 1300,
    text: '崑崙派的掌門夫婦在山下比劍，兩人一個使正兩儀，一個使反兩儀，誰也不服誰。他們吵著吵著，請你這個路人評評理。',
    choices: [{ t: '說劍法不錯，刀法也不錯', go: () => '兩人都很滿意。那掌門夫人一高興，教了你幾路兩儀劍法。' + learn('kl_liangyi') }] },
  { id: 'k_huashan', type: '奇遇', title: '華山二老', ctx: ['wild'], loc: 'huashan', w: 9, once: true, art: 'snow', cond: () => ad() >= 1300,
    text: '華山派的兩位長老在山腰上吵架，一個說刀好，一個說拳好。他們看見了你：「你來試試！」',
    choices: [
      { t: '試那位長老的刀法', go: () => '那是一路反兩儀刀法，刀勢顛倒，跟你學過的都不一樣。' + learn('q_king') },
      { t: '試那位長老的拳法', go: () => '他一手如鷹、一手如蛇，教你的時候還在跟另一位吵。' + learn('hs_eagle') },
    ] },
  { id: 'k_jiuyang', type: '奇遇', title: '九陽歸一', ctx: ['wild', 'travel', 'city', 'sect'], w: 30, once: true, art: 'cave', cond: s => ['wd_nei', 'em_nei', 'sl_jy', 'q_thunder'].filter(x => s.skills[x]).length >= 2,
    text: '你閉目調息時，體內兩股九陽真氣忽然撞在了一起。它們本是同源，分開了幾十年，此刻像是找到了彼此。\n\n一股熱流從丹田升起，衝開了一條又一條經脈。',
    choices: [{ t: '任由真氣運轉', go: () => '你昏睡了三天三夜。醒來時，全身暖洋洋的，像是曬了一整個夏天的太陽。〔耗時三日〕' + (advance(3), '') + learn('jy_god') }] },
  { id: 'k_bat', type: '奇遇', title: '青翼蝠王', ctx: ['city', 'travel'], w: 8, once: true, art: 'night', cond: () => ad() >= 1336 && ad() <= 1360,
    text: '半夜，你被一陣涼風吹醒。窗邊站著一個瘦高的青衫人，臉色青白，嘴角帶著血。他咧嘴一笑：「別怕，我不吸你的血。我只是走累了，歇歇腳。」\n\n他坐下來的時候，你根本沒看清他是怎麼從窗外到屋裡的。',
    choices: [{ t: '倒一碗熱酒給他', go: s => { let t = '他喝了酒，身上不再發抖。臨走時他說：「你這人不錯。我的輕功天下第一，教你一點，算是酒錢。」' + learn('mj_bat'); if (s.sect === 'mingjiao') t += '\n\n他瞥見你身上的明教標記，又多教了一路掌法：「自家兄弟，這個也給你。」' + learn('mj_ice'); return t; } }] },
  { id: 'k_qishang', type: '奇遇', title: '七傷拳譜', ctx: ['travel', 'city'], w: 7, once: true, art: 'road', cond: () => ad() >= 1320,
    text: '一個崆峒派的老頭在路邊賣書，攤上有一本《七傷拳譜》，標價五十兩。他說：「這拳一拳七股勁力，打人七傷。不過，練不好先傷自己。」',
    choices: [
      { t: '買下來（50 兩）', cond: s => s.silver >= 50, go: () => '你照著拳譜練了一個月，拳力果然大進，可胸口常常隱隱作痛。' + learn('kt_seven') + gain({ silver: -50, bonusHp: -30 }) },
      { t: '不買', go: () => '老頭聳聳肩：「也好，命比拳要緊。」' },
    ] },
  { id: 'k_xuanming', type: '江湖', title: '汝陽王府', ctx: ['city'], loc: 'yanjing', w: 8, once: true, art: 'night', cond: () => ad() >= 1336 && ad() <= 1360,
    text: '汝陽王府的管家找上了你：「王爺招攬天下英雄，待遇優厚。」他身後站著兩個老頭，一個拄著鹿角杖，一個拿著鶴嘴筆，眼神陰冷。\n\n「這兩位是玄冥二老。你若肯為王爺效力，他們的掌法可以傳你。」',
    choices: [
      { t: '答應為王府效力', go: () => '你替王府辦了半年事，做了很多你不願再想起的事。玄冥二老果然守信，把掌法傳給了你。〔耗時半年〕' + (advance(180), '') + learn('xm_palm') + gain({ moral: -25, silver: 300 }) },
      { t: '「漢人不替韃子賣命。」', go: () => ({ battle: foe('鹿杖客', 12, 0.6, 'master'), noFlee: true,
        win: () => '你一掌把鹿杖客逼退了三步，趁亂翻牆而去。' + gain({ fame: 40, moral: 10 }),
        lose: s => { s.hp = Math.round(maxHp() * 0.2); return '一股寒氣從胸口散開，你凍得渾身發抖，拚死才逃了出來。' + gain({ moral: 8 }); } }) },
    ] },
  { id: 'k_chengkun', type: '奇遇', title: '圓真', ctx: ['sect', 'wild'], loc: 'shaolin', w: 7, once: true, art: 'temple', cond: s => ad() >= 1340 && ad() <= 1359 && s.moral <= 10,
    text: '少林寺後山的竹林裡，一個面目慈和的老和尚叫住了你。他說他法號圓真，看你骨骼清奇，想傳你兩門功夫——不過，不可讓旁人知道。\n\n他說話很溫和，你卻總覺得背上發涼。',
    choices: [
      { t: '學那門指法', go: () => '他的指力陰寒刺骨。練成那天，他拍拍你的肩：「往後我有事，自會找你。」' + learn('ck_finger') + gain({ moral: -10 }) },
      { t: '學那門掌法', go: () => '他一掌拍在竹子上，竹子當場炸開。你學了一個月才學會。' + learn('ck_thunder') + gain({ moral: -5 }) },
      { t: '推說要回去稟告師父', go: () => '他笑了笑，沒有攔你。後來你才知道，他就是混元霹靂手成崑，金毛獅王謝遜一家的仇人。' + gain({ moral: 5 }) },
    ] },

  /* ================= 同陣營一同學習 ================= */
  // 範例：松林中老叫化示範降龍掌。同陣營（正道）的人可以一同學；其他陣營只能旁觀
  { id: 'k_pine', type: '傳承', title: '松林傳功', ctx: ['wild', 'travel'], w: 10, once: true, art: 'legacy', who: 'elder',
    cond: s => sameSide(s, 1) && ad() >= 1200 && ad() <= 1260,
    text: '松林深處，一個白髮老叫化正對著一棵枯樹出掌。樹身沒有倒下，只是從中間整齊地裂開，斷口平滑。\n\n老叫化回頭看見你，招了招手：「是丐幫的兄弟？過來。這掌法不傳外人，你我同幫，今天就讓你看看真的。」',
    choices: [
      { t: '跟著他一起練', go: () => { advance(10); return '你們在松林裡練了十天。他一邊演示，一邊讓你照著他的步法和發力，每一掌都要你自己感受「能發能收」。〔耗時十日〕' + learn('gb_ult'); } },
      { t: '站在一旁看，不敢出聲', go: () => '你只能在旁邊看。老叫化瞥了你一眼，沒有說話，但也沒有趕你。' + (xp(S.nei, 80) || '') + gain({ int: 1 }) },
    ] },
  { id: 'k_pine_out', type: '傳承', title: '松林外', ctx: ['wild', 'travel'], w: 10, once: true, art: 'legacy', who: 'elder',
    cond: s => !sameSide(s, 1) && ad() >= 1200 && ad() <= 1260,
    text: '松林深處，一個白髮老叫化正對著一棵枯樹出掌。樹身從中間整齊地裂開。\n\n他看見你，皺了皺眉：「你不是丐幫的人。站遠點，看看可以，學可不行。」',
    choices: [
      { t: '退開幾步，靜靜看', go: () => '你記住了幾處發力的方向，但只能看，無法真正學到。' + (xp(S.nei, 60) || '') + gain({ int: 1 }) },
      { t: '「我自己也會幾招，讓我試試。」', go: () => ({ battle: foe('老叫化', 10, 0.5, 'master'), noFlee: true,
        win: () => '他收了掌，點頭：「有點本事，可惜不是我的弟子。」之後他沒有再教，只把你的破綻指給你看。' + (xp(S.nei, 120) || '') + gain({ fame: 10 }),
        lose: s => { s.hp = Math.round(maxHp() * 0.3); return '你被他一掌推出幾丈遠。「看夠了就走。」他說，「同幫的事，外人沾不得。」'; } }) },
    ] },
  /* ================= 古墓派 ================= */
  { id: 'k_gumu_net', type: '奇遇', title: '玉蜂', ctx: ['sect', 'wild'], loc: 'zhongnan', w: 9, once: true, art: 'taoist', cond: () => ad() >= 1222 && ad() <= 1239,
    text: '你誤入終南山後山的林子，一群白色的蜂子圍上來，蜇得你滿頭是包，半邊身子發麻。\n\n一個駝背的老婆婆從林子裡走出來，揮手趕開了蜂子，往你嘴裡倒了一勺蜂蜜：「這裡是禁地，誰叫你亂闖？」',
    choices: [{ t: '道謝，問她怎麼趕開那些蜂子的', go: s => { s.hp = maxHp(); return '老婆婆說，那是她家主人的玉蜂。她當著你的面，雙掌一圍一攏，把一隻亂飛的麻雀攏在了掌心，又放走了。「這叫天羅地網。你學去吧，往後別再來了。」' + learn('gm_net'); } }] },
  { id: 'k_gumu_needle', type: '奇遇', title: '赤練仙子', ctx: ['travel', 'wild'], w: 8, once: true, art: 'night', cond: () => ad() >= 1240 && ad() <= 1257,
    text: '夜宿荒村，隔壁一戶人家傳來慘叫。你從門縫裡看見一個穿杏黃道袍的美貌女子，手裡拂塵一揮，一家人就倒下了。她唱著歌走了：「問世間，情是何物……」\n\n你等到天亮才敢出去。死者身上插著幾根銀針，針尾發著幽幽的藍光。',
    choices: [
      { t: '拔下銀針，研究它的手法', go: s => { s.hp = Math.max(1, s.hp - Math.round(maxHp() * 0.3)); return '你的手指被針尖劃破了一點，半條胳膊立刻麻了。你逼出毒血，花了半個月，才摸清這種銀針的發射手法。' + learn('gm_needle') + gain({ moral: -3 }); } },
      { t: '照著屍首上的赤紅掌印揣摩掌法', go: () => '那掌印五指分明，紅得發紫。你揣摩了好幾天，練到後來，連自己的掌心都泛著紅。' + learn('lm_poison') + gain({ moral: -10 }) },
      { t: '照著門框上拂塵留下的痕跡揣摩', go: () => '那些痕跡細如髮絲，卻深入木頭半寸。你琢磨了很久，才明白那是用拂塵打出來的。' + learn('lm_whip') + gain({ moral: -3 }) },
      { t: '把這一家人好好葬了', go: () => '你挖了一整天的坑。立碑的時候，你不知道該寫什麼，只寫了「無辜」兩個字。' + gain({ moral: 8 }) },
    ] },
  { id: 'k_gumu_tomb', type: '奇遇', title: '古墓', ctx: ['sect', 'wild'], loc: 'zhongnan', w: 9, once: true, art: 'cave', cond: s => ad() >= 1262 && s.stats.int >= 10,
    text: '終南山後山的古墓，墓門不知何時開了一道縫。附近的人都說，墓裡的人早就走了。\n\n你舉著火把走進去。石室一間連著一間，最深處的一間，屋頂上密密麻麻刻滿了字，牆上還畫著一男一女持劍對舞的圖。',
    choices: [
      { t: '照著石刻和壁畫練', go: () => { advance(30); return '你在古墓裡住了一個月，出來時臉色白得像紙，眼睛卻亮得嚇人。牆角的木盒裡還有幾枚細如蜂尾的金針。〔耗時三十日〕' + learn('gm_nei') + learn('gm_sword') + learn('gm_bee'); } },
      { t: '退出去，把墓門推上', go: () => '有些地方，主人不在，也該替他們守著。' + gain({ moral: 5 }) },
    ] },
  { id: 'l_elder', who: 'elder', type: '傳承', title: '掃地老人', ctx: ['sect'], w: 12, once: true, art: 'legacy', cond: (s, L) => s.sect && L.sect === s.sect && s.rank >= 1 && SECTS[s.sect].align > 0,
    text: '藏經閣外，那個掃了幾十年落葉的啞巴老人忽然用掃帚攔住你，在地上寫了一行字：「你昨日練功，第三轉氣走岔了。」',
    choices: [
      { t: '恭敬請教', go: () => '老人用掃帚柄在你身上點了幾處，你照著運氣，果然暢通無阻。你想再問，他已低頭掃他的落葉去了。後來你才聽說，他是上上代的掌門師弟。' + (xp(S.nei, 400) || '') + gain({ int: 1 }) },
      { t: '半信半疑，自己琢磨', go: () => '你琢磨了幾天，發現老人說得一點沒錯。' + (xp(S.nei, 150) || '〔內功領悟加深〕') },
    ] },
  { id: 'l_disciple', type: '傳承', title: '雪中拜師', ctx: ['city', 'sect', 'travel'], w: 14, once: true, art: 'snow', cond: s => age() >= 28 && s.fame >= 200 && !s.disciple,
    text: '一個十二三歲的孩子在你門外跪了一夜，膝下的雪都化了又結成冰。「求前輩收我為徒！我爹娘死在馬賊刀下，我要學本事。」孩子的眼睛很亮，亮得讓你想起當年初到臨安的自己。',
    choices: [
      { t: '扶起孩子：「起來，叫師父。」', go: s => { const n = pick(['阿蘅', '小石頭', '雲生', '阿照', '念慈']); s.disciple = { n, y: s.date.y, done: false }; return `你收下了平生第一個弟子，取名${n}。武功這東西，原來教人比自己練還難。` + gain({ moral: 4, fame: 10 }); } },
      { t: '給些銀兩，指條去處', go: () => '你給了孩子盤纏，寫了封薦書讓他去投鏢局。' + gain({ silver: -20, moral: 1 }) },
    ] },
  { id: 'l_ancestor', type: '傳承', title: '故人之後', ctx: ['city', 'travel'], w: 16, once: true, art: 'legacy', cond: s => s.legacyFrom,
    text: s => `酒肆裡一個獨臂老鏢師盯著你的招式路數看了半天，手裡的酒碗都在抖：「這是……${s.legacyFrom}的功夫！你是他什麼人？」聽完你的回答，老人眼眶紅了，從懷裡摸出一個油布包。「當年他救過我一命，這東西我替他保管了半輩子，該物歸原主了。」`,
    choices: [{ t: '雙手接過', go: () => '油布包裡是半部手札，記著前人畢生的練功心得。' + (battleXp(300) || '') + (xp(S.nei, 300) || '') + gain({ silver: 100 }) }] },

  /* ================= 戀愛（邂逅與插曲） ================= */
  ...Object.keys(NPCS).map(id => ({
    id: 'm_' + id, who: id, type: '戀愛', title: `邂逅・${NPCS[id].n}`, ctx: ['city', 'sect', 'travel'], loc: NPCS[id].loc, w: 16, once: true, art: 'love',
    cond: s => daysIn(s) > 90 && MEET[id].cond(s),
    text: s => MEET[id].text ? MEET[id].text(s) : NPCS[id].meet,
    choices: [
      { t: '上前攀談', go: () => { const n = npc(id); n.met = true; n.fav += 8; return `你與${NPCS[id].n}（${NPCS[id].title}）就此相識。${NPCS[id].d}〔好感+8〕`; } },
      { t: '點頭致意，就此別過', go: () => { const n = npc(id); n.met = true; n.fav += 2; return `你記住了這個名字：${NPCS[id].n}。往後在${LOCS[NPCS[id].loc].n}，或許還會再見。`; } },
    ],
  })),
  { id: 'r_rain', who: s => s.flags.rainId, type: '戀愛', title: '一傘煙雨', ctx: ['city', 'sect'], w: 12, art: 'love',
    cond: s => rainNpc(s) && daysIn(s) > 90,
    text: s => { const id = rainNpc(s); s.flags.rainId = id; return `驟雨忽至，你在屋簷下躲雨，身旁多了一個人。${NPCS[id].n}撐開一把油紙傘，往你這邊偏了偏：「一起走？」傘不大，兩個人的肩膀都濕了一半。`; },
    choices: [
      { t: '接過傘柄，往對方那邊傾', go: s => { const n = s.npcs[s.flags.rainId]; n.fav = clamp(n.fav + 7, 0, 100); return `一路上誰也沒說話，雨聲卻一點也不嫌吵。〔${NPCS[s.flags.rainId].n} 好感+7〕`; } },
      { t: '「我淋雨慣了。」', go: s => `${NPCS[s.flags.rainId].n}看了你一眼，撐著傘走進了雨裡。` },
    ] },
  { id: 'r_letter', who: s => s.spouse || s.flags.lover, type: '戀愛', title: '千里書信', ctx: ['travel', 'wild'], w: 10, art: 'love',
    cond: s => (s.flags.lover || s.spouse) && NPCS[s.spouse || s.flags.lover].loc !== s.loc,
    text: s => { const k = NPCS[s.spouse || s.flags.lover]; return `驛站的夥計追出來，遞給你一封信。是${k.n}的字跡，絮絮寫了三頁家常，末尾只有一句：「江湖路遠，添衣，少飲，早歸。」`; },
    choices: [{ t: '把信疊好，貼身收起', go: s => { const id = s.spouse || s.flags.lover; s.npcs[id].fav = clamp(s.npcs[id].fav + 4, 0, 100); return '這一夜你睡得格外安穩。' + gain({ hp: 999, mp: 999 }); } }] },
];

/* ================= 原著傳功場景：同陣營一同學習 =================
   原著中師父教徒弟的場面，人在現場時：陣營相同（side：1 正道、0 中立、-1 邪道）可以一同學；陣營不同只能旁觀。 */
const SIDE_N = { 1: '正道', 0: '中立', '-1': '邪道' };
function teachEvent(d) {
  const observe = () => '你只能遠遠看著。招式記住了幾分，可門道沒人點破，終究學不到手。' + (xp(S.nei, 60) || '') + gain({ int: 1 });
  return { id: d.id, type: '傳承', title: d.title, ctx: d.ctx || ['wild', 'travel', 'city'], loc: d.loc, w: d.w || 14, once: true, art: d.art || 'legacy',
    cond: s => ad() >= d.y[0] && ad() <= d.y[1] && !knows(d.skill),
    text: s => d.text + '\n\n' + (sameSide(s, d.side) ? d.inText : (d.outText || `${d.teacher}看了你一眼，搖了搖頭：「門戶有別，看看可以，學不行。」〔陣營不同：只有${SIDE_N[d.side]}中人能一同學〕`)),
    choices: s => sameSide(s, d.side)
      ? [{ t: '跟著一起學', go: () => { advance(d.days || 7); return `${d.learnText}〔耗時${cnNum(d.days || 7)}日〕` + learn(d.skill); } },
         { t: '不打擾，在一旁看', go: observe }]
      : [{ t: '在一旁看', go: observe }, { t: '悄悄離開', go: () => '你轉身走了。有些功夫，不是誰都能學的。' }] };
}
EVENTS.push(...[
  { id: 't_xiaoyao', title: '客店院中', skill: 'gb_fist', side: 1, y: [1223, 1225], ctx: ['city'], teacher: '老叫化',
    text: '客店後院，一個背著紅葫蘆的老叫化正在教一個少女練拳。少女聰明得很，一招看一遍就會，老叫化一邊教一邊嚷著要吃她做的菜。',
    inText: '老叫化瞧見你在旁邊，擺擺手：「你也是正道的娃娃？站過來，多一個人學，我也不吃虧。」',
    learnText: '這套拳法輕飄飄的，像是在逛街，可你照著練了幾天，才發現每一步都藏著閃避的門道。' },
  { id: 't_kongming', title: '桃花島山洞', skill: 'kong_fist', side: 1, y: [1224, 1225], loc: 'taohua', ctx: ['wild'], teacher: '白鬍子老頭', art: 'cave',
    text: '桃花島的一個山洞裡，困著一個白鬍子老頭。他在洞口教一個濃眉大眼的年輕人練拳，拳法輕飄飄的，像是一點力氣都沒有。',
    inText: '老頭看見你，眼睛一亮：「又來一個陪我玩的！你也是正派的人？好，一起學，誰學得快我請誰吃果子。」',
    learnText: '那拳法以空為本，你練了好幾天，才明白老頭說的「打不到人，但人也打不到你」是什麼意思。' },
  { id: 't_mayu', title: '懸崖夜課', skill: 'qz_nei', side: 1, y: [1222, 1223], loc: 'mobei', ctx: ['wild', 'travel'], teacher: '中年道人', art: 'mountain',
    text: '草原的一座懸崖上，每天夜裡都有一個中年道人帶著一個少年爬上去打坐。道人教的是呼吸吐納，一句一句講得極慢。',
    inText: '道人發現了你，並不驚訝：「你也是正道中人？那就坐下來吧。玄門正宗的功夫，本就不該只傳一人。」',
    learnText: '你們在懸崖上坐了好多個夜晚。風很大，可你的呼吸越來越穩，丹田裡漸漸有了一團暖氣。' },
  { id: 't_yunv', title: '古墓石床', skill: 'gm_nei', side: 0, y: [1240, 1244], loc: 'zhongnan', ctx: ['sect', 'wild'], teacher: '白衣少女', art: 'cave',
    text: '你在終南山後山的林子裡，看見一個白衣少女在教一個少年練功。少年躺在一張冷冰冰的石床上，少女在旁邊講口訣，聲音像山泉一樣冷。',
    inText: '少女看了你一眼：「你不是全真教的人。」她頓了頓，「那就一起聽吧。只此一次。」',
    learnText: '那心法要人心如止水。你在古墓外坐了好幾天，心裡越來越靜，連自己的心跳都聽得清清楚楚。' },
  { id: 't_xiao', title: '簫聲', skill: 'th_xiao', side: 0, y: [1241, 1243], ctx: ['travel', 'wild'], teacher: '青袍人',
    text: '路邊的涼亭裡，一個青袍人手持玉簫，正在教一個少年使劍。他不用劍，只用簫比劃，簫聲隨著招式忽高忽低。',
    inText: '青袍人斜眼看你：「你不是名門正派出身？好，我最討厭那些假仁假義的。來，一起學。」',
    learnText: '他教得很快，從不重複。你和那少年拚命記，記到後來，劍招和簫譜在腦子裡攪成了一團，卻又分明是同一件事。' },
  { id: 't_dog', title: '華山絕頂', skill: 'gb_dog', side: 1, y: [1242, 1242], loc: 'huashan', ctx: ['wild'], teacher: '老叫化', art: 'snow',
    text: '華山絕頂的雪地裡，一個病懨懨的老叫化正在教一個少年使棒。他自己已經站不太穩了，教的時候卻一點也不馬虎。',
    inText: '老叫化喘著氣說：「我時日無多了。你是正道的人，就一起學吧。這棒法要是失傳，我死也不閉眼。」',
    learnText: '絆、劈、纏、戳、挑、引、封、轉。老叫化每教一個字，就要歇好一會兒。你記住了每一個字。' },
  { id: 't_taiji', title: '武當大殿', skill: 'wd_taiji', side: 1, y: [1357, 1358], loc: 'wudang', ctx: ['sect', 'wild'], teacher: '白鬚老道', art: 'taoist',
    text: '武當山大殿上，一個白鬚老道當著強敵的面，把一套新創的拳法慢慢演給一個年輕人看。他打得很慢，一招一式都像在畫圓。\n\n敵人就在殿外等著。',
    inText: '老道打完一遍，看了看你：「你也是正道的人？好。記住了多少？忘了多少？」',
    learnText: '老道又打了一遍，問你記住了多少。你說忘了一半。他又打一遍，你說全忘了。他笑了：「好，你可以去了。」' },
  { id: 't_qiankun', title: '光明頂密道', skill: 'mj_qk', side: 0, y: [1357, 1357], loc: 'kunlun', ctx: ['sect', 'wild', 'travel'], teacher: '年輕人', art: 'cave',
    text: '光明頂的密道深處，你撞見一個年輕人和一個小丫鬟正借著火光看一張羊皮，那羊皮上的字寫的是一門心法。年輕人看一段、練一段，進境快得嚇人。',
    inText: '那小丫鬟警惕地看著你。年輕人卻說：「你也不是名門正派的人，那就一起看吧。這東西本就是明教的，不該只歸一人。」',
    learnText: '你只看懂了前幾層，再往下，就覺得心浮氣躁，不敢再練。可單是這幾層，已經夠你受用一輩子了。' },
].map(teachEvent));

/* ================= 定期與主線事件 ================= */
function tourneyRound(i) {
  const names = ['「鐵臂」張猛', '「千手」唐秋娘', '上屆魁首「小孟嘗」裴照'];
  const e = foe(names[i], [3, 6, 10][i], [0.55, 0.65, 0.75][i], ['thug', 'sword', 'master'][i]);
  return { battle: e, noFlee: true, title: '重陽擂台', intro: `第${cnNum(i + 1)}輪，你的對手是${e.n}。鑼聲一響，全場肅靜。`,
    win: () => {
      if (i < 2) { S.hp = Math.min(maxHp(), S.hp + Math.round(maxHp() * 0.3)); S.mp = Math.min(maxMp(), S.mp + Math.round(maxMp() * 0.4)); battleXp(40); return tourneyRound(i + 1); }
      S.flags.champ = (S.flags.champ || 0) + 1;
      return `裴照擲劍認輸。滿場齊呼你的名字——${reign(ad())}重陽擂台魁首，${S.name}！` + gain({ fame: 100, silver: 300 }) + addItem('dahuan');
    },
    lose: () => { S.hp = Math.round(maxHp() * 0.3); return [`你在首輪就敗下陣來。台下噓聲四起，但也有人為你鼓掌。` + gain({ fame: 2 }), '你止步第二輪。能走到這裡，已讓不少人記住了你。' + gain({ fame: 15, silver: 50 }), '你與魁首只差一步。裴照扶起你：「明年，我等你。」' + gain({ fame: 40, silver: 120 })][i]; } };
}
const FIXED = {
  tourney: { type: '戰鬥', title: '重陽擂台', art: 'fight', fixed: true, cond: s => s.loc === 'linan' || travelDays('linan') <= 8,
    text: s => `九月初九重陽，臨安城外的擂台又要開擂了。各路好手雲集，奪魁的人能風光好一陣子。${s.loc === 'linan' ? '你人就在臨安，擂台的鼓聲隔著三條街都聽得見。' : `從${LOCS[s.loc].n}趕去，需${cnNum(travelDays('linan'))}日路程。`}`,
    choices: [
      { t: '報名參加', go: s => { if (s.loc !== 'linan') { advance(travelDays('linan')); s.loc = 'linan'; } s.date.m = 9; s.date.d = Math.max(s.date.d, 9); return tourneyRound(0); } },
      { t: '今年不去湊熱鬧', go: () => '你聽說今年的魁首又是裴照。' },
    ] },
  lantern: { who: s => s.flags.fest, type: '戀愛', title: '上元燈會', art: 'love', fixed: true,
    text: s => { const id = nearNpc(20); s.flags.fest = id; return id ? `正月十五，花市燈如晝。${NPCS[id].n}不知何時站到了你身邊，手裡提著一盞兔子燈：「猜燈謎，敢不敢比？」` : '正月十五，花市燈如晝。滿街都是成雙成對的人影，你獨自提著一盞燈，在燈謎攤前停下了腳步。'; },
    choices: s => s.flags.fest
      ? [{ t: '比就比', go: () => { const n = S.npcs[S.flags.fest]; n.fav = clamp(n.fav + 8, 0, 100); return `你們一路猜過去，贏了一堆小玩意。最後一盞燈的謎底是「相思」，兩個人都看出來了，卻誰也沒有說。〔${NPCS[S.flags.fest].n} 好感+8〕`; } }]
      : [{ t: '猜燈謎', go: () => S.stats.int + R(6) >= 10 ? '你連中三元，攤主心疼地奉上彩頭。' + gain({ silver: 40 }) : '你抓耳撓腮，一個也沒猜中。攤主送了你一塊糖。' }] },
  qixi: { who: s => s.flags.fest, type: '戀愛', title: '七夕', art: 'love', fixed: true, cond: s => topNpc(50),
    text: s => { const id = topNpc(50); s.flags.fest = id; s.flags.festFar = !nearNpc(50);
      if (s.flags.festFar) return `七月初七，銀河橫天。你人在${LOCS[s.loc].n}，${NPCS[id].n}遠在${LOCS[NPCS[id].loc].n}。你抬頭找到那兩顆星，忽然很想知道，此刻${NPCS[id].ta}是不是也在看。`;
      return `七月初七，銀河橫天。${NPCS[id].n}與你並肩坐在屋頂上，指著天上兩顆星：「一年才見一次，${NPCS[id].ta === '她' ? '我' : '我'}可受不了。」說完才覺得失言，把臉別了過去。`; },
    choices: s => s.flags.festFar ? [
      { t: '提筆寫一封信，託驛站送去', go: () => { const n = S.npcs[S.flags.fest]; n.fav = clamp(n.fav + 4, 0, 100); return `信寫了又撕，撕了又寫，最後只留下一句：「見星如晤。」〔${NPCS[S.flags.fest].n} 好感+4〕`; } },
      { t: '看一會兒星星，早些睡', go: () => '夜風有些涼。' },
    ] : [
      { t: '「那就不分開。」', go: () => { const n = S.npcs[S.flags.fest]; n.fav = clamp(n.fav + 10, 0, 100); return `夜風很輕，${NPCS[S.flags.fest].n}沒有回答，只是把肩膀靠了過來。〔好感+10〕`; } },
      { t: '假裝沒聽見，抬頭看星', go: () => { const n = S.npcs[S.flags.fest]; n.fav = clamp(n.fav + 2, 0, 100); return '你們看了一夜的星星。〔好感+2〕'; } },
    ] },
  child: { who: s => s.spouse, type: '傳承', title: '弄璋弄瓦', art: 'legacy', fixed: true,
    text: s => `一聲嘹亮的啼哭劃破了清晨。${NPCS[s.spouse].n}疲憊地笑著，把襁褓遞到你懷裡。孩子攥住你的手指，力氣大得出奇。`,
    choices: [{ t: '為孩子取名', go: s => { s.child = s.name[0] + pick(['念', '承', '懷', '知']) + pick(['安', '遠', '舟', '寧']); return `你為孩子取名「${s.child}」。這身武功，總算有了血脈相傳的人。` + gain({ moral: 3 }); } }] },
  discipleDone: { type: '傳承', title: '弟子出師', art: 'legacy', fixed: true,
    text: s => `${s.disciple.n}在你面前演完了最後一套功夫，收勢，跪下，結結實實磕了三個頭。當年雪地裡那個孩子，如今已比你還高了半個頭。「師父，弟子想下山闖一闖。」`,
    choices: [{ t: '「去吧。別墮了師門的名頭。」', go: s => { s.disciple.done = true; return `${s.disciple.n}下山不到半年，江湖上就有了名號。人們提起時總要加一句：「那是${s.name}的弟子。」` + gain({ fame: 40 }); } }] },
  oldAge: { type: '傳承', title: '歲月不饒人', art: 'legacy', fixed: true,
    text: () => `這個冬天格外冷。你發現自己握劍的手開始發抖，上樓要歇兩次。一生的恩怨情仇像走馬燈一樣在眼前轉過。是時候了。`,
    choices: [{ t: '封劍歸隱', go: () => ({ end: '壽終' }) }, { t: '「我還能再走幾年。」', go: () => '你裹緊了衣襟，又一次走進了風雪裡。' + gain({ con: -1 }) }] },

};
