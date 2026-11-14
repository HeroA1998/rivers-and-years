/* 江湖歲月錄 — 事件：奇遇、戰鬥、戀愛、傳承、江湖 */
'use strict';

const RUMORS = [
  '蒼莽山深處有面石壁，刻著前人留下的內功心法，悟性不夠的人看了也是白看。',
  '每年九月初九，洛陽英雄會，奪魁者名揚天下。',
  '天嵐劍宗的蘇師姐愛琴，百花谷那位小醫女偏愛蘇州胭脂。',
  '血煞教的聖女常在洛陽夜市喝酒，誰送她好酒，她就多看誰一眼。',
  '臨安有個姓顧的浪子，劍法好，酒品差。書肆的沈先生倒是只愛孤本。',
  '瀚海大漠凶險得很，可敢去的人回來都發了財。',
  '入了門派要多做任務，攢夠貢獻才學得到上乘武功。',
  '內功分陰陽，內外屬性相合，出手威力才大；陰陽相沖，反倒打折扣。',
  '聽說有人在山裡救過一隻白狐，後來交了大運。',
  '年過而立、小有名氣的人，自然有人上門拜師。武功總得有人傳下去。',
  '草藥別急著賣，百花谷的弟子三株就能煉一份金創藥。',
  '血煞教這幾年動作頻頻，怕是在找什麼東西。',
];

const win = (e, w, l, x) => Object.assign({ battle: e, win: w, lose: l }, x || {});
const topNpc = min => { let b = null; for (const id in S.npcs) { const n = S.npcs[id]; if (n.met && n.fav >= min && (!b || n.fav > S.npcs[b].fav)) b = id; } return S.spouse || b; };

// 已有伴侶或定情之人後，雨中共傘只會是那個人
const rainNpc = s => Object.keys(s.npcs).find(i => s.npcs[i].met && s.npcs[i].fav >= 25 && NPCS[i].loc === s.loc && (!(s.spouse || s.flags.lover) || i === (s.spouse || s.flags.lover)));
// 節日能否相伴：對方就在此地，或已成親同行
const nearNpc = min => { const id = topNpc(min); return id && (id === S.spouse || NPCS[id].loc === S.loc) ? id : null; };

// 邂逅條件：初入江湖的前三個月不談情緣；每位有緣人只在合乎你身分與處境時才會遇上
const daysIn = s => (s.date.y - 1) * 360 + (s.date.m - 1) * 30 + s.date.d;
const MEET = {
  su:   { cond: s => s.sect === 'tianlan' || s.fame >= 60,
          text: s => s.sect === 'tianlan' ? NPCS.su.meet.replace('「看夠了？這條路外人不該來。」', '「看夠了？新入門的都愛躲在樹後偷看，你倒是頭一個站著不動的。」') : NPCS.su.meet },
  hua:  { cond: () => true },
  li:   { cond: s => s.fame >= 30 || power() >= 7 },                       // 她只對有點膽色本事的人感興趣
  gu:   { cond: s => s.silver >= 50 },                                     // 他開口就是借錢
  shen: { cond: s => s.origin === '書香門第' || s.stats.int >= 8 || s.fame >= 80 || s.sect === 'xuanzhen',   // 書肆不是誰都會進去、也不是誰都留得住
          text: s => s.origin === '破廟孤兒' ? '你在洛陽書肆的屋簷下避雨，隔著窗看架上的書。夥計正要趕人，一個青衣男子攔住了他，把一卷書遞到窗外：「認得字麼？這本講的是劍理，卻沒有一招劍法。雨停之前，進來坐著讀吧。」' : NPCS.shen.meet },
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
    cond: s => s.origin === '鏢師之後' || s.fame >= 40 || (s.weapon && power() >= 5 && s.origin !== '破廟孤兒'),
    text: s => s.origin === '鏢師之後' ? '威遠鏢局的總鏢頭在門口張望，一見你就愣住了：「你這眉眼……是老鏢頭家的孩子吧？你爹當年和我一口鍋裡吃過飯。正好，有趟短鏢缺個信得過的人，五日來回，酬勞從優。」'
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
  { id: 'j_rival', type: '江湖', title: '少年對手', ctx: ['city', 'travel', 'sect'], w: 9, art: 'fight', cond: s => s.rival < 3 && s.date.y >= 1 + s.rival * 2 && s.fame >= 20 + s.rival * 60,
    text: s => ['一個錦衣少年攔住你，下巴抬得老高：「聽說你最近有點名氣？我叫秦昭，專打有名氣的。」',
      '「又見面了。」秦昭比上次沉穩了不少，手上的繭也厚了。「上回是我輕敵。這兩年我沒有一天不想著再打一場。」',
      '秦昭站在長亭外等你，身後的馬已備好鞍。「我要去塞外了。走之前最後打一場，不論輸贏，你都是我秦昭這輩子唯一的對手。」'][s.rival],
    choices: [
      { t: '奉陪', go: s => win(foe('秦昭', 2 + s.rival * 5, 0.7 + s.rival * 0.08, 'sword'), () => { s.rival++; if (s.rival === 3) return '秦昭大笑著把佩劍拋給你：「痛快！這柄劍送你，塞外若聽到你的名字，我就知道沒輸給庸人。」' + (has('w_sword2') || has('w_sword3') ? gain({ silver: 300 }) : addItem('w_sword2')) + gain({ fame: 30 }); return '秦昭咬著牙爬起來：「下次，下次我一定贏你！」' + gain({ fame: 10 }); },
          () => { s.rival++; S.hp = Math.round(maxHp() * 0.4); return '秦昭收劍，神色複雜：「你讓我失望了。……把傷養好，下次別這麼不經打。」' + gain({ fame: -5 }); }, { noFlee: true }) },
      { t: '「今日沒空。」', go: () => '秦昭哼了一聲：「怕了就直說。我改日再來。」' },
    ] },

  /* ================= 出身（各出身獨有） ================= */
  { id: 'o_escort', type: '江湖', title: '父親的鏢旗', ctx: ['city', 'travel'], w: 14, once: true, art: 'fight', cond: s => s.origin === '鏢師之後' && s.date.y >= 2,
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
  { id: 'o_orphan', type: '江湖', title: '破廟舊友', ctx: ['city'], w: 16, once: true, art: 'city', cond: s => s.origin === '破廟孤兒',
    text: '「喂！是你！」一個精瘦的少年從牆頭跳下來，一拳捶在你肩上。是小六子，當年和你在破廟裡分過半個冷饅頭的小六子。他如今腰裡繫著風塵幫的草繩，神氣得很：「我跟了洪七爺啦。你呢，還是一個人？」',
    choices: [
      { t: '「帶我去見見你們七爺。」', cond: s => !s.sect, go: () => { S.sect = 'fengchen'; S.rank = 0; S.contrib = 60; S.contribTotal = 60; return '小六子拍著胸脯作保。洪七爺只看了你一眼就笑了：「吃過苦的孩子，錯不了。」你成了風塵幫弟子，小六子還替你墊了一筆見面功勞。' + learn('fc_palm') + '〔門派貢獻+60〕'; } },
      { t: '請他喝頓酒，打聽消息', go: () => { advance(1); return '小六子喝得舌頭都大了，把洛陽城裡三教九流的門道倒了個乾淨：哪家當鋪收贓、哪個捕頭貪杯、哪條巷子夜裡別走。' + gain({ silver: -10, luck: 1, cha: 1 }); } },
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
  { id: 'b_sectwar', type: '戰鬥', title: '正邪不兩立', ctx: ['travel'], w: 10, art: 'fight', cond: s => s.sect && SECTS[s.sect].align !== 0,
    text: s => SECTS[s.sect].align > 0 ? '道旁茶棚裡，幾個血煞教徒正在逼問一個過路的鏢師。其中一人認出了你的門派服色，冷笑著站起身來。' : '你被幾個正道弟子堵在渡口。「血煞教的妖人！」為首的青年拔劍出鞘，「今日替天行道！」',
    choices: [
      { t: '動手', go: s => win(foe(SECTS[s.sect].align > 0 ? '血煞教香主' : '正道少俠', 2, 0.65, SECTS[s.sect].align > 0 ? 'blade' : 'sword'), () => '你為師門掙了臉面。消息傳回山門，師父頗為嘉許。' + gain({ contrib: 30, fame: 8, moral: SECTS[s.sect].align * 3 }), null) },
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
    text: '山路濕滑，你一腳踏空，沿著陡坡滾落數十丈，被一株老松掛住。松後竟有個洞口。洞中一具枯骨盤膝而坐，膝上攤著一卷帛書，題著四個字：驚鴻照影。',
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
  { id: 'a_beggar', type: '奇遇', title: '討酒的老乞丐', ctx: ['city'], w: 7, once: true, art: 'city',
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
  { id: 'a_chess', type: '奇遇', title: '山中棋局', ctx: ['wild', 'travel'], w: 5, once: true, art: 'mountain',
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
  { id: 'l_dying', type: '傳承', title: '垂死的高人', ctx: ['travel', 'wild'], w: 6, once: true, art: 'legacy', cond: s => s.date.y >= 2,
    text: '血跡一路延伸到山神廟裡。一個渾身是傷的老者靠著神案，身邊倒著七具黑衣屍體。他看見你，渾濁的眼裡亮了一下：「老夫縱橫四十年，臨了卻連個磕頭的人都沒有……娃娃，你過來。老夫一手劍、一手刀，只剩傳一樣的力氣了。」',
    choices: [
      { t: '「晚輩願學劍。」', go: () => '老者以指代劍，在地上劃了三十六道痕。每劃一道，他的氣息就弱一分。最後一道劃完，他把手按在你頭頂，將殘存的內力盡數渡了過來。「去吧。別讓它……埋沒了……」' + learn('q_swan') + gain({ bonusMp: 30 }) },
      { t: '「晚輩願學刀。」', go: () => '老者大笑，笑得咳出血來：「好！刀才是男兒氣概——女兒家使來，更是了不得！」他口述了十八句刀訣，逼你背了三遍，才把手按在你頭頂，渡盡了最後的內力。' + learn('q_king') + gain({ bonusMp: 30 }) },
      { t: '先替他治傷', cond: () => has('jinchuang'), go: () => { addItem('jinchuang', -1); return '老者推開你的手：「沒用了，五臟都碎了。」他卻笑了，「可你這份心，老夫記下了。」他把刀劍兩樣的總綱一併念給你聽——能悟多少，看你的造化。' + learn(S.eq.some(e => SKILLS[e].type === 'blade') ? 'q_king' : 'q_swan') + gain({ bonusMp: 40, bonusHp: 30, moral: 4 }); } },
    ] },
  { id: 'l_wall', type: '傳承', title: '石壁遺刻', ctx: ['wild'], loc: 'cangmang', w: 9, once: true, art: 'cave', cond: s => s.stats.int >= 8 || s.stats.luck >= 9,
    text: '藤蔓後露出一面光滑如鏡的石壁，上頭密密麻麻刻滿了字。左半面字跡剛勁，題為「九霄雷音」；右半面字跡陰柔，題為「寒魄冰心」。壁腳一行小字：「陰陽殊途，貪多必噬。後來者擇其一。」',
    choices: [
      { t: '參悟左壁「九霄雷音訣」', go: () => { advance(20); return '你在壁前坐了二十日。某個清晨，丹田裡響起了第一聲悶雷。' + learn('q_thunder'); } },
      { t: '參悟右壁「寒魄冰心訣」', go: () => { advance(20); return '你在壁前坐了二十日。某個深夜，你呵出的氣在盛夏裡凝成了霜。' + learn('q_ice'); } },
    ] },
  { id: 'l_master', type: '傳承', title: '衣缽相傳', ctx: ['sect'], w: 40, once: true, art: 'legacy',
    cond: (s, L) => s.sect && L.sect === s.sect && s.rank === 3 && s.contribTotal >= 1000 && s.fame >= 300,
    text: s => `${SECTS[s.sect].master}屏退了左右，把一方印信放在你面前。「為師老了。這副擔子，門中只有你和你大師兄挑得起。」他望著堂外，「按祖師規矩，你們比一場。勝者接掌門戶，並得授本門不傳之秘。」`,
    choices: [
      { t: '「弟子當仁不讓。」', go: s => win(foe('大師兄', 16, 0.6, SECTS[s.sect].align < 0 ? 'demon' : 'master'), () => { s.rank = 4; const u = SECTS[s.sect].ult; return `大師兄單膝跪地，第一個向你行禮：「參見掌門。」從今日起，你就是${SECTS[s.sect].n}之主。` + (u ? learn(u) : gain({ str: 2, con: 2 })) + gain({ fame: 150 }); }, () => { S.hp = Math.round(maxHp() * 0.4); S.done.l_master = 0; return '你敗了。師父嘆道：「火候未到。此事過些時日再議。」'; }, { noFlee: true }) },
      { t: '「弟子願輔佐大師兄。」', go: () => '師父看了你很久，點了點頭：「不爭，也是一種氣度。」他另傳了你一段心法口訣作為補償。' + gain({ moral: 5, int: 1, bonusMp: 30 }) },
    ] },
  { id: 'l_elder', type: '傳承', title: '掃地老人', ctx: ['sect'], w: 12, once: true, art: 'legacy', cond: (s, L) => s.sect && L.sect === s.sect && s.rank >= 1 && SECTS[s.sect].align > 0,
    text: '藏經閣外，那個掃了幾十年落葉的啞巴老人忽然用掃帚攔住你，在地上寫了一行字：「你昨日練功，第三轉氣走岔了。」',
    choices: [
      { t: '恭敬請教', go: () => '老人用掃帚柄在你身上點了幾處，你照著運氣，果然暢通無阻。你想再問，他已低頭掃他的落葉去了。後來你才聽說，他是上上代的掌門師弟。' + (xp(S.nei, 400) || '') + gain({ int: 1 }) },
      { t: '半信半疑，自己琢磨', go: () => '你琢磨了幾天，發現老人說得一點沒錯。' + (xp(S.nei, 150) || '〔內功領悟加深〕') },
    ] },
  { id: 'l_disciple', type: '傳承', title: '雪中拜師', ctx: ['city', 'sect', 'travel'], w: 14, once: true, art: 'snow', cond: s => age() >= 28 && s.fame >= 200 && !s.disciple,
    text: '一個十二三歲的孩子在你門外跪了一夜，膝下的雪都化了又結成冰。「求前輩收我為徒！我爹娘死在馬賊刀下，我要學本事。」孩子的眼睛很亮，亮得讓你想起當年初到洛陽的自己。',
    choices: [
      { t: '扶起孩子：「起來，叫師父。」', go: s => { const n = pick(['阿蘅', '小石頭', '雲生', '阿照', '念慈']); s.disciple = { n, y: s.date.y, done: false }; return `你收下了平生第一個弟子，取名${n}。武功這東西，原來教人比自己練還難。` + gain({ moral: 4, fame: 10 }); } },
      { t: '給些銀兩，指條去處', go: () => '你給了孩子盤纏，寫了封薦書讓他去投鏢局。' + gain({ silver: -20, moral: 1 }) },
    ] },
  { id: 'l_ancestor', type: '傳承', title: '故人之後', ctx: ['city', 'travel'], w: 16, once: true, art: 'legacy', cond: s => s.legacyFrom,
    text: s => `酒肆裡一個獨臂老鏢師盯著你的招式路數看了半天，手裡的酒碗都在抖：「這是……${s.legacyFrom}的功夫！你是他什麼人？」聽完你的回答，老人眼眶紅了，從懷裡摸出一個油布包。「當年他救過我一命，這東西我替他保管了半輩子，該物歸原主了。」`,
    choices: [{ t: '雙手接過', go: () => '油布包裡是半部手札，記著前人畢生的練功心得。' + (battleXp(300) || '') + (xp(S.nei, 300) || '') + gain({ silver: 100 }) }] },

  /* ================= 戀愛（邂逅與插曲） ================= */
  ...Object.keys(NPCS).map(id => ({
    id: 'm_' + id, type: '戀愛', title: `邂逅・${NPCS[id].n}`, ctx: ['city', 'sect', 'travel'], loc: NPCS[id].loc, w: 16, once: true, art: 'love',
    cond: s => daysIn(s) > 90 && MEET[id].cond(s),
    text: s => MEET[id].text ? MEET[id].text(s) : NPCS[id].meet,
    choices: [
      { t: '上前攀談', go: () => { const n = npc(id); n.met = true; n.fav += 8; return `你與${NPCS[id].n}（${NPCS[id].title}）就此相識。${NPCS[id].d}〔好感+8〕`; } },
      { t: '點頭致意，就此別過', go: () => { const n = npc(id); n.met = true; n.fav += 2; return `你記住了這個名字：${NPCS[id].n}。往後在${LOCS[NPCS[id].loc].n}，或許還會再見。`; } },
    ],
  })),
  { id: 'r_rain', type: '戀愛', title: '一傘煙雨', ctx: ['city', 'sect'], w: 12, art: 'love',
    cond: s => rainNpc(s) && daysIn(s) > 90,
    text: s => { const id = rainNpc(s); s.flags.rainId = id; return `驟雨忽至，你在屋簷下躲雨，身旁多了一個人。${NPCS[id].n}撐開一把油紙傘，往你這邊偏了偏：「一起走？」傘不大，兩個人的肩膀都濕了一半。`; },
    choices: [
      { t: '接過傘柄，往對方那邊傾', go: s => { const n = s.npcs[s.flags.rainId]; n.fav = clamp(n.fav + 7, 0, 100); return `一路上誰也沒說話，雨聲卻一點也不嫌吵。〔${NPCS[s.flags.rainId].n} 好感+7〕`; } },
      { t: '「我淋雨慣了。」', go: s => `${NPCS[s.flags.rainId].n}看了你一眼，撐著傘走進了雨裡。` },
    ] },
  { id: 'r_letter', type: '戀愛', title: '千里書信', ctx: ['travel', 'wild'], w: 10, art: 'love',
    cond: s => (s.flags.lover || s.spouse) && NPCS[s.spouse || s.flags.lover].loc !== s.loc,
    text: s => { const k = NPCS[s.spouse || s.flags.lover]; return `驛站的夥計追出來，遞給你一封信。是${k.n}的字跡，絮絮寫了三頁家常，末尾只有一句：「江湖路遠，添衣，少飲，早歸。」`; },
    choices: [{ t: '把信疊好，貼身收起', go: s => { const id = s.spouse || s.flags.lover; s.npcs[id].fav = clamp(s.npcs[id].fav + 4, 0, 100); return '這一夜你睡得格外安穩。' + gain({ hp: 999, mp: 999 }); } }] },
];

/* ================= 定期與主線事件 ================= */
function tourneyRound(i) {
  const names = ['「鐵臂」張猛', '「千手」唐秋娘', '上屆魁首「小孟嘗」裴照'];
  const e = foe(names[i], [3, 6, 10][i], [0.55, 0.65, 0.75][i], ['thug', 'sword', 'master'][i]);
  return { battle: e, noFlee: true, title: '洛陽英雄會', intro: `第${cnNum(i + 1)}輪，你的對手是${e.n}。鑼聲一響，全場肅靜。`,
    win: () => {
      if (i < 2) { S.hp = Math.min(maxHp(), S.hp + Math.round(maxHp() * 0.3)); S.mp = Math.min(maxMp(), S.mp + Math.round(maxMp() * 0.4)); battleXp(40); return tourneyRound(i + 1); }
      S.flags.champ = (S.flags.champ || 0) + 1;
      return `裴照擲劍認輸。萬人齊呼你的名字——${ERA}${cnNum(S.date.y)}年英雄會魁首，${S.name}！` + gain({ fame: 100, silver: 300 }) + addItem('dahuan');
    },
    lose: () => { S.hp = Math.round(maxHp() * 0.3); return [`你在首輪就敗下陣來。台下噓聲四起，但也有人為你鼓掌。` + gain({ fame: 2 }), '你止步第二輪。能走到這裡，已讓不少人記住了你。' + gain({ fame: 15, silver: 50 }), '你與魁首只差一步。裴照扶起你：「明年，我等你。」' + gain({ fame: 40, silver: 120 })][i]; } };
}
const FIXED = {
  tourney: { type: '戰鬥', title: '洛陽英雄會', art: 'fight', fixed: true,
    text: s => `九月初九重陽，洛陽英雄會將開擂。天下豪傑雲集，奪魁者名動江湖。${s.loc === 'luoyang' ? '你人就在洛陽，擂台的鼓聲隔著三條街都聽得見。' : `從${LOCS[s.loc].n}趕去，需${cnNum(travelDays('luoyang'))}日路程。`}`,
    choices: [
      { t: '報名參加', go: s => { if (s.loc !== 'luoyang') { advance(travelDays('luoyang')); s.loc = 'luoyang'; } s.date.m = 9; s.date.d = Math.max(s.date.d, 9); return tourneyRound(0); } },
      { t: '今年不去湊熱鬧', go: () => '你聽說今年的魁首又是裴照。' },
    ] },
  lantern: { type: '戀愛', title: '上元燈會', art: 'love', fixed: true,
    text: s => { const id = nearNpc(20); s.flags.fest = id; return id ? `正月十五，花市燈如晝。${NPCS[id].n}不知何時站到了你身邊，手裡提著一盞兔子燈：「猜燈謎，敢不敢比？」` : '正月十五，花市燈如晝。滿街都是成雙成對的人影，你獨自提著一盞燈，在燈謎攤前停下了腳步。'; },
    choices: s => s.flags.fest
      ? [{ t: '比就比', go: () => { const n = S.npcs[S.flags.fest]; n.fav = clamp(n.fav + 8, 0, 100); return `你們一路猜過去，贏了一堆小玩意。最後一盞燈的謎底是「相思」，兩個人都看出來了，卻誰也沒有說。〔${NPCS[S.flags.fest].n} 好感+8〕`; } }]
      : [{ t: '猜燈謎', go: () => S.stats.int + R(6) >= 10 ? '你連中三元，攤主心疼地奉上彩頭。' + gain({ silver: 40 }) : '你抓耳撓腮，一個也沒猜中。攤主送了你一塊糖。' }] },
  qixi: { type: '戀愛', title: '七夕', art: 'love', fixed: true, cond: s => topNpc(50),
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
  child: { type: '傳承', title: '弄璋弄瓦', art: 'legacy', fixed: true,
    text: s => `一聲嘹亮的啼哭劃破了清晨。${NPCS[s.spouse].n}疲憊地笑著，把襁褓遞到你懷裡。孩子攥住你的手指，力氣大得出奇。`,
    choices: [{ t: '為孩子取名', go: s => { s.child = s.name[0] + pick(['念', '承', '懷', '知']) + pick(['安', '遠', '舟', '寧']); return `你為孩子取名「${s.child}」。這身武功，總算有了血脈相傳的人。` + gain({ moral: 3 }); } }] },
  discipleDone: { type: '傳承', title: '弟子出師', art: 'legacy', fixed: true,
    text: s => `${s.disciple.n}在你面前演完了最後一套功夫，收勢，跪下，結結實實磕了三個頭。當年雪地裡那個孩子，如今已比你還高了半個頭。「師父，弟子想下山闖一闖。」`,
    choices: [{ t: '「去吧。別墮了師門的名頭。」', go: s => { s.disciple.done = true; return `${s.disciple.n}下山不到半年，江湖上就有了名號。人們提起時總要加一句：「那是${s.name}的弟子。」` + gain({ fame: 40 }); } }] },
  oldAge: { type: '傳承', title: '歲月不饒人', art: 'legacy', fixed: true,
    text: () => `這個冬天格外冷。你發現自己握劍的手開始發抖，上樓要歇兩次。一生的恩怨情仇像走馬燈一樣在眼前轉過。是時候了。`,
    choices: [{ t: '封劍歸隱', go: () => ({ end: '壽終' }) }, { t: '「我還能再走幾年。」', go: () => '你裹緊了衣襟，又一次走進了風雪裡。' + gain({ con: -1 }) }] },

  arc1: { type: '江湖', title: '天機圖現世', art: 'night', fixed: true,
    text: '江湖上忽然流言四起：前朝武聖留下的「天機圖」重現人間，得圖者可得武聖畢生絕學。短短一個月，已有三家鏢局、兩個幫會為它滅門，現場都留著血色掌印。有人說，是血煞教動的手。',
    choices: [
      { t: '暗中留意此事', go: s => { s.flags.arc = 1; return '你把這件事記在了心裡。山雨欲來，風已滿樓。'; } },
      { t: '「與我無關。」', go: () => '你搖搖頭。但你隱隱覺得，這江湖裡沒有誰能真的置身事外。' },
    ] },
  arc2: { type: '戰鬥', title: '血洗青石鎮', art: 'fight', fixed: true,
    text: s => s.sect === 'xuesha'
      ? '教主密令：天機圖的殘片在青石鎮天嵐劍宗的別院中。你被點為先鋒，率三十教眾連夜奔襲。別院裡燈火通明，一位白髮長老拄劍立在門前，身後是一群面帶稚氣的年輕弟子。'
      : '你途經青石鎮時，鎮口已火光沖天。血煞教徒正在挨家挨戶地搜，一位重傷的劍宗長老護著一群孩子退到了祠堂前。帶隊的血煞壇主舉起了刀。',
    choices: s => s.sect === 'xuesha'
      ? [{ t: '奉命行事，奪圖', go: () => win(foe('天嵐劍宗長老', 9, 0.62, 'sword'), () => '你奪得了殘片。回崖覆命時，教主當眾賞了你一杯酒。那一夜你洗了很久的手。' + gain({ contrib: 120, fame: 30, moral: -20 }), null, { noFlee: true }) },
         { t: '虛張聲勢，放他們從後門走', go: () => '你讓教眾在前門鼓譟了半夜，等衝進去時，別院已人去樓空。壇主狐疑地看了你一眼。' + gain({ moral: 12, contrib: -40 }) }]
      : [{ t: '「住手！」', go: () => win(foe('血煞教壇主', 9, 0.62, 'demon'), () => { S.flags.arc = 2; return '壇主伏誅，餘眾潰散。長老把一枚染血的玉片塞進你手裡：「天機圖……殘片……絕不可落入厲無咎之手……」' + gain({ fame: 50, moral: 15 }); }, null, { noFlee: true }) },
         { t: '寡不敵眾，繞道而行', go: () => '你在山坡上回頭，鎮子燒了一整夜。' + gain({ moral: -8 }) }] },
  arc3: { type: '戰鬥', title: '洛陽決戰', art: 'fight', fixed: true,
    text: s => s.sect === 'xuesha'
      ? '血煞教傾巢而出，兵臨洛陽。正道群雄在城下列陣，為首的是武林盟主嶽鎮山。教主厲無咎轉過頭，把目光落在你身上：「這一陣，你去。拿下嶽鎮山的人頭，血煞教的下一任教主就是你。」'
      : '血煞教主厲無咎集齊了天機圖，神功大成，率教眾兵臨洛陽。武林盟主三招落敗，重傷嘔血。群雄的目光在人群中搜尋，最後一道接一道，落在了你的身上。厲無咎負手而立：「還有誰？」',
    choices: s => {
      const boss = () => foe('血煞教主・厲無咎', 26, 0.4, 'demon');
      const saved = () => { S.flags.savedWulin = true; return '厲無咎仰面倒下，血河刀斷為三截。洛陽城頭，先是一片死寂，然後是山呼海嘯般的歡呼。這一天，被後世的說書人講了一百年。' + gain({ fame: 300, moral: 20 }); };
      if (s.sect === 'xuesha') return [
        { t: '領命出陣，戰嶽鎮山', go: () => win(foe('武林盟主・嶽鎮山', 24, 0.4, 'master'), () => { S.flags.demonLord = true; return '嶽鎮山轟然倒地，正道群雄四散奔逃。厲無咎大笑著把教主令牌拋給你。從此，江湖只有一個聲音。' + gain({ fame: 300, moral: -40, contrib: 500 }); }, () => { S.hp = Math.round(maxHp() * 0.2); return '你敗了。血煞教退回了血煞崖，厲無咎看你的眼神像看一件廢物。' + gain({ fame: -30, contrib: -100 }); }, { noFlee: true }) },
        { t: '臨陣倒戈，刀指教主', go: () => win(boss(), () => { S.sect = null; S.rank = 0; return saved() + '你親手終結了自己曾效忠的一切。'; }, () => { S.sect = null; S.rank = 0; S.hp = Math.round(maxHp() * 0.2); return '你敗了，被正道中人拚死救出。血煞教從此懸賞你的人頭。' + gain({ moral: 15, fame: 20 }); }, { noFlee: true }) },
      ];
      const c = [{ t: '踏前一步：「我。」', go: () => win(boss(), saved, () => { S.hp = Math.round(maxHp() * 0.2); return '你倒在了厲無咎刀下，被同道搶回。正道元氣大傷，退守各自山門。但你這一戰，為群雄爭得了撤退的時間。' + gain({ fame: 60 }); }, { noFlee: true }) }];
      if (s.flags.lover === 'li' || s.spouse === 'li') c.push({ t: '請厲紅綃出面勸父', go: () => { S.flags.savedWulin = true; return '紅衣女子走到兩軍陣前，把刀架在了自己頸上：「爹，你要這天下，還是要女兒？」厲無咎的手抖了很久，終於仰天長嘆，撕碎了天機圖。血煞教退兵三百里，立誓二十年不入中原。' + gain({ fame: 200, moral: 15 }); } });
      c.push({ t: '隱在人群中，不發一言', go: () => '最終是幾位前輩聯手，以命換命，才逼退了厲無咎。你活了下來，卻很久不敢看鏡子裡的自己。' + gain({ fame: -30, moral: -10 }) });
      return c;
    } },
};
