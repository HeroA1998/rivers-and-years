'use strict';
/* v9.7：傳奇裝備與劇情線（參考 Life in Adventure 的傳奇裝備：綁劇情、有二選一的分歧）
   六條線，每條「遇上遺物」＋「幾個月後做決定」兩幕。決定不同，得到的裝備不同，也各有代價：
     一、太平遺甲   交給太平道 → 天公符甲；交給縣尉 → 討賊司馬印；自己補綴 → 補綴符甲
     二、赤怨札甲   直接穿上 → 赤怨札甲（強，但怨氣纏身）；請方士淨化 → 淨化赤甲（穩，但要錢）
     三、青色斷劍   重鑄成長劍 → 青虹劍；重鑄成雙匕 → 蛇信雙匕
     四、羌女與弓   救她 → 白羽長弓（或狼牙護符）；搶她的弓 → 奪來的羌弓
     五、七探盤蛇槍 買下 → 立得；以工換 → 之後選擇留槍或讓給官軍
     六、老將的刀   還給舊部 → 虎符；自己留下 → 斷流刀
   傳奇裝備在說明裡標「傳奇」，每件都有代價詞條。 */

/* ---------- 裝備 ---------- */
Object.assign(ITEMS, {
  // 一、太平遺甲
  lg_tp_scrap:  { n: '殘符甲片', kind: 'misc', price: 0, d: '一塊縫滿符文的舊皮甲殘片，邊緣燒焦。不知是誰的遺物。' },
  lg_tp_armor:  { n: '天公符甲', kind: 'armor', def: 10, price: 0, legend: 1, set: 'hj', tags: ['謀', '守'], st: { int: 1, con: 1 },
    fx: { ward: 2, regen: 0.02, dmgRed: 0.03, chk: { cha: -1 }, d: '太平道秘傳的符文甲：辟邪 +2，每兩步回 2% 氣血，受傷 -3%；代價：官府視你為黃巾同黨，魅力檢定 -1' } },
  lg_tp_seal:   { n: '討賊司馬印', kind: 'relic', price: 0, legend: 1, tags: ['謀'], st: { cha: 1, int: 1 },
    fx: { eye: 2, foeWeak: 0.03, stealth: -2, d: '縣尉轉贈的官印：戰力 +6%，對手攻擊 -3%；代價：官印招搖，隱匿 -2' } },
  lg_tp_patch:  { n: '補綴符甲', kind: 'armor', def: 6, price: 0, legend: 1, tags: ['謀'], fx: { ward: 1, d: '你自己縫補的舊符甲：辟邪 +1；代價：針腳粗糙，沒有任何額外好處' } },
  // 二、赤怨札甲
  lg_cr_shell:  { n: '赤色舊甲', kind: 'misc', price: 0, d: '從古戰場帶回來的赤色札甲，摸上去有點燙。要找人看看才敢穿。' },
  lg_cr_red:    { n: '赤怨札甲', kind: 'armor', def: 14, price: 0, legend: 1, tags: ['重'], st: { con: 1, str: 1 },
    fx: { dmgRed: 0.07, crit: 3, intim: 1, ward: -2, qiCap: -1, d: '亡者怨氣凝成的赤甲：受傷 -7%，暴擊率 +3%，威嚇 +1；代價：辟邪 -2，氣上限 -1' } },
  lg_cr_pure:   { n: '淨化赤甲', kind: 'armor', def: 11, price: 0, legend: 1, tags: ['重'], st: { con: 1 },
    fx: { dmgRed: 0.04, ward: 2, stealth: -1, d: '方士誦經淨化後的赤甲：受傷 -4%，辟邪 +2；代價：隱匿 -1（鐵甲仍然笨重）' } },
  // 三、青色斷劍
  lg_sw_shard:  { n: '青色斷劍', kind: 'misc', price: 0, d: '劍身斷成兩截，斷口卻像新的。劍柄纏著褪色的青絲。要重鑄才能用。' },
  lg_sw_long:   { n: '青虹劍', kind: 'weapon', wt: 'sword', atk: 30, price: 0, legend: 1, stat: 'agi', sec: 'int', st: { agi: 2, int: 1 }, tags: ['輕'],
    fx: { bleed: 8, crit: 4, stealth: -1, d: '重鑄的青鋒：8% 機率令對手流血，暴擊率 +4%；代價：寶劍露鋒，隱匿 -1' }, mv: ['青虹貫日', 44, 'bleed'] },
  lg_sw_dag:    { n: '蛇信雙匕', kind: 'weapon', wt: 'dagger', atk: 26, price: 0, legend: 1, st: { agi: 2 }, tags: ['血', '輕'],
    fx: { bleed: 12, stealth: 1, opener: 0.4, dmgRed: -0.02, d: '斷劍改鑄的雙匕：12% 機率令對手流血，隱匿 +1，開戰先出手；代價：刃短貼身，受傷 +2%' }, mv: ['蛇信吐', 40, 'bleed'] },
  // 四、羌女與弓
  lg_bw_grab:   { n: '奪來的羌弓', kind: 'weapon', wt: 'bow', atk: 18, price: 0, legend: 1, st: { agi: 1 }, fx: { crit: 2, chk: { cha: -1 }, d: '暴擊率 +2%；代價：來路不正，魅力檢定 -1' } },
  lg_bw_gift:   { n: '白羽長弓', kind: 'weapon', wt: 'bow', atk: 30, price: 0, legend: 1, st: { agi: 2, luck: 1 }, req: { str: 8 }, tags: ['疾'],
    fx: { crit: 5, stealth: 1, opener: 0.3, d: '羌人獵手的傳家弓：暴擊率 +5%，隱匿 +1，開戰先射一箭；代價：弓力極強，需臂力 8' }, mv: ['白羽穿雲', 46, 'pierce'] },
  lg_bw_charm:  { n: '狼牙護符', kind: 'acc', price: 0, legend: 1, st: { agi: 1 }, tags: ['疾'], fx: { ward: 1, stealth: 1, dodge: 2, d: '羌人祈福的狼牙：辟邪 +1，隱匿 +1，閃避 +2' } },
  // 五、七探盤蛇槍
  lg_sp_snake:  { n: '七探盤蛇槍', kind: 'weapon', wt: 'spear', atk: 30, hand: 2, price: 0, legend: 1, st: { str: 2, agi: 1 }, tags: ['重'], req: { str: 8 },
    fx: { pierce: 1, intim: 1, stealth: -1, d: '槍尖七探如盤蛇，專破重甲；威嚇 +1；代價：長槍扛在肩上太顯眼，隱匿 -1' }, mv: ['盤蛇七探', 46, 'pierce'] },
  lg_sp_medal:  { n: '軍功賞牌', kind: 'relic', price: 0, legend: 1, st: { cha: 1 }, fx: { eye: 1, chk: { cha: 1 }, d: '官軍頒給功臣的賞牌：戰力 +3%，魅力檢定 +1' } },
  // 六、老將的刀
  lg_dr_blade:  { n: '斷流刀', kind: 'weapon', wt: 'blade', atk: 31, hand: 2, price: 0, legend: 1, st: { str: 2, con: 1 }, tags: ['重', '血'], req: { str: 8 },
    fx: { crit: 4, intim: 2, chk: { cha: -1 }, stealth: -1, d: '老將軍征戰半生的大刀：暴擊率 +4%，威嚇 +2；代價：舊部視你為賊，魅力檢定 -1，隱匿 -1' }, mv: ['斷流一斬', 48, 'stun'] },
  lg_dr_tally:  { n: '舊部虎符', kind: 'relic', price: 0, legend: 1, tags: ['謀'], st: { cha: 1, int: 1 }, fx: { eye: 2, intim: 1, d: '老將軍舊部送你的半枚虎符：戰力 +6%，威嚇 +1' } },
});
// 「氣上限」詞條：赤怨札甲用
// （qiMax 已在 index.html 讀取 gearFx('qiCap')）

// 說明裡標出「傳奇」
{
  const _gi = gearInfo;
  gearInfo = function (it) { return (it.legend ? '【傳奇】' : '') + _gi(it); };
}

/* ---------- 劇情線 ---------- */
const LG = id => addItem(id) + autoGear(id);
const lgSince = k => today() - (S.flags[k] || 0);
const lgSet = (k, v) => { S.flags[k] = v === undefined ? today() : v; };
const LEGEND_LINES = [
  ['lg_tp', '太平遺甲'], ['lg_cr', '赤怨札甲'], ['lg_sw', '青色斷劍'], ['lg_bw', '羌女與弓'], ['lg_sp', '七探盤蛇槍'], ['lg_dr', '老將的刀'],
];

EVENTS.push(
  /* 一、太平遺甲 */
  { id: 'lg_tp1', type: '奇遇', title: '疫村的符水師', ctx: ['travel', 'wild', 'city'], w: 9, once: true, art: 'road',
    text: '村口立著一根削尖的竹竿，掛著破布，是疫村的記號。你本該繞道，可村裡有人在咳著唱歌，唱的是「蒼天已死」。\n\n一個瘦得脫形的中年人靠在井邊，身上披著一件縫滿符文的舊皮甲，朝你招手：「後生……我是個符水師，給人治病，自己倒染了病。」',
    choices: () => [
      OPT('g', '蹲下來，陪他到最後（耗時五日）', () => { advance(5); lgSet('lgTpAt'); lgSet('lgTp', 1); return NX('他沒撐過那個夜晚。臨終前他把皮甲脫下來，只剩一塊最完整的甲片，塞進你手心：「太平道……要找這個。官府……也要找。你別信任何人，先放著。」', [
        OPT('n', '把甲片收進行囊', () => '你在井邊把他埋了。甲片貼著胸口，燙燙的。' + addItem('lg_tp_scrap') + gain({ moral: 4, qi: -1 })),
        OPT('n', '把甲片留在他墳前', () => { delete S.flags.lgTp; return '你把甲片壓在石頭下。風一吹，符文上的灰全散了。' + gain({ moral: 2 }); })]); }),
      OPT('n', '遠遠問他有什麼寶貝，扔過去二十錢', () => { lgSet('lgTpAt'); lgSet('lgTp', 1); return '他接過錢，苦笑：「寶貝？就這片甲。」他用竹竿把甲片挑了過來。' + addItem('lg_tp_scrap') + gain({ silver: -20 }); }, { req: money(20), reqT: '需 20 錢' }),
      OPT('e', '等他斷氣，扒下皮甲', () => { lgSet('lgTpAt'); lgSet('lgTp', 1); return '你戴著布巾，用竹竿挑下了皮甲，拿了最完整的一片。等你轉身，井邊多了兩個蒙面人，正盯著你手上的甲片。' + addItem('lg_tp_scrap') + gain({ moral: -6 }); }),
      OPT('n', '繞道走', () => '你捂住口鼻繞了很遠的路。身後的歌聲被風吹散了。')] },

  { id: 'lg_tp2', type: '奇遇', title: '兩封請帖', ctx: ['city', 'travel'], w: 40, once: true, art: 'city',
    cond: s => s.flags.lgTp === 1 && has('lg_tp_scrap') && lgSince('lgTpAt') >= 60,
    text: '兩個月後，兩撥人同時找上了你。\n\n一撥是太平道的傳道人，頭裹黃巾，笑容誠懇：「那片甲是張角大賢良師親手給我們師兄的信物。還給我們，道中記你一功。」\n\n另一撥是縣尉手下的差役：「有人密告，你身上有黃巾逆黨的信物。交出來，縣尉大人不但不問罪，還有賞。」',
    choices: () => [
      OPT('g', '交給太平道（得符甲，官府記你一筆）', () => { addItem('lg_tp_scrap', -1); lgSet('lgTp', 'hj'); return '傳道人捧著甲片，紅了眼眶。三天後，他們送來一整件修復好的符甲：「這是用信物重新縫的，穿上它，疫鬼不近身。」' + LG('lg_tp_armor') + gain({ moral: 3, fame: -6 }); }),
      OPT('n', '交給縣尉（得官印，黃巾視你為敵）', () => { addItem('lg_tp_scrap', -1); lgSet('lgTp', 'han'); return '縣尉看著甲片，點頭：「有這個，順藤摸瓜，能端掉一窩。」他賞了一枚新刻的官印給你，說有它在，城門不攔你。' + LG('lg_tp_seal') + gain({ fame: 12, moral: -4, silver: 60 }); }),
      OPT('n', '誰也不給，自己找針線補綴（悟性檢定）' + ODDS('int', 13), () => { const r = ROLLT('int', 13); addItem('lg_tp_scrap', -1); lgSet('lgTp', 'self'); return r.line + (r.ok ? '你把甲片拼進一件舊皮甲裡，符文竟然對上了。兩撥人都沒再找你，也許誰都沒想到。' : '你縫得一塌糊塗，符文全歪了。但兩邊都以為你已經毀了它，總算沒人再糾纏。') + LG('lg_tp_patch') + gain({ moral: 2 }); }),
      OPT('n', '「我什麼也沒有。」轉身離開', () => { addItem('lg_tp_scrap', -1); lgSet('lgTp', 'none'); return '你把甲片扔進了河裡。兩撥人互相看了一眼，各自走了。' + gain({ qi: 1 }); })] },

  /* 二、赤怨札甲 */
  { id: 'lg_cr1', type: '奇遇', title: '古戰場的赤甲', ctx: ['wild', 'travel'], w: 8, once: true, art: 'night',
    text: '這片荒野二十年前打過一場大仗，白骨半埋在草裡。草叢中有一點紅，是一具札甲，甲片紅得發暗，像被血浸過又晾乾。\n\n你剛走近，頭就開始發暈，耳邊隱隱有人喊殺。穿著它的屍骨早就沒了，甲裡卻莫名還有點溫度。',
    choices: () => [
      OPT('e', '穿上它' + ODDS('con', 13), () => { lgSet('lgCr', 'red'); const r = ROLLT('con', 13); return r.line + (r.ok ? '你咬牙穿上，耳邊的喊殺聲漸漸低下去，變成了一個聲音在說：「你很強。」甲片貼緊了你的身體，像是本來就屬於你。' : '穿上去的一瞬間你眼前全紅了，耳朵裡全是慘叫。你硬撐著不脫，甲片貼緊了身體，卻留下了很深的寒意。' + shock(1, '')) + LG('lg_cr_red') + gain({ moral: -2 }); }),
      OPT('n', '用麻繩拖回城裡，找人看看', () => { lgSet('lgCrAt'); lgSet('lgCr', 1); return '你連拖帶拽，把甲裝進麻袋。一路上，麻袋隔著衣服都在發燙。' + addItem('lg_cr_shell') + qiLoss(1); }, { req: () => has('rope'), reqT: '需要麻繩' }),
      OPT('n', '把甲埋了，立一塊石頭', () => '你挖了坑，把它埋進去，壓上石頭。耳邊的喊殺聲慢慢遠了。' + gain({ moral: 3, qi: 1 })),
      OPT('n', '不碰，離開', () => '你遠遠繞開了那一點紅。走了很久，耳朵還在嗡嗡響。')] },

  { id: 'lg_cr2', type: '奇遇', title: '道觀的方士', ctx: ['city'], w: 40, art: 'city',
    cond: s => s.flags.lgCr === 1 && has('lg_cr_shell') && lgSince('lgCrAt') >= 45,
    text: '你把赤色舊甲帶到城東的道觀。年老的方士在院裡看了半天，伸手一探就縮了回去：「戰場上被屠的人，怨氣附在了甲裡。要淨化，得三天三夜的誦經，貼三十道符，一百五十錢。」\n\n他停了停：「不淨化也行，只是穿它的人……會多一個聲音。」',
    choices: () => [
      OPT('g', '付一百五十錢，請他淨化', () => { addItem('lg_cr_shell', -1); lgSet('lgCr', 'pure'); advance(3); return '三天三夜，院裡香煙繚繞。最後一天，赤色褪成了暗紅。方士長出一口氣：「怨已散，甲還是好甲。」' + LG('lg_cr_pure') + gain({ silver: -150, moral: 3 }); }, { req: money(150), reqT: '需 150 錢' }),
      OPT('e', '「不用淨化，我穿它。」', () => { addItem('lg_cr_shell', -1); lgSet('lgCr', 'red'); return '方士搖頭，沒再勸。你穿上的一刻，耳邊那個聲音果然又來了。' + LG('lg_cr_red') + shock(1, ''); }),
      OPT('n', '賣給方士（三百錢）', () => { addItem('lg_cr_shell', -1); lgSet('lgCr', 'sold'); return '方士數錢時手在發抖：「這種東西，留在世上不如鎮在觀裡。」' + gain({ silver: 300 }); }),
      OPT('n', '「我再想想。」帶著甲離開', () => '方士點點頭，沒有勉強。')] },

  /* 三、青色斷劍 */
  { id: 'lg_sw1', type: '奇遇', title: '墓裡出來的斷劍', ctx: ['wild', 'city', 'travel'], w: 9, once: true, art: 'cave',
    text: '三個滿身泥土的漢子在城外的亭子裡爭得面紅耳赤。中間的草蓆上擺著一把斷成兩截的青色長劍，劍身青得像一泓水，斷口光亮如新。\n\n「是前朝大將的陪葬，」其中一個壓低聲音，「我們掘了三個月，就這一件。鐵匠說修不好，我們想賣個人情價。」',
    choices: () => [
      OPT('n', '出八十錢買下', () => { lgSet('lgSwAt'); lgSet('lgSw', 1); return '三人樂得合不攏嘴，連草蓆一起捲了送你。' + addItem('lg_sw_shard') + gain({ silver: -80 }); }, { req: money(80), reqT: '需 80 錢' }),
      OPT('e', '「墓裡的東西，官府說了算。」（動手奪下）', () => win(foe('盜墓賊', 4, 0.6, 'thug'), () => { lgSet('lgSwAt'); lgSet('lgSw', 1); return '你打翻了三個盜墓賊，把斷劍連同草蓆捲了走。其中一個爬著喊：「那劍有主！你拿不穩！」' + addItem('lg_sw_shard') + gain({ moral: -3, fame: 4 }); }, null)),
      OPT('n', '「我只看看。」摸了摸斷口（悟性檢定）' + ODDS('int', 12), () => { const r = ROLLT('int', 12); return r.line + (r.ok ? '你指腹劃過斷口，竟沒有一點崩裂的痕跡——這不是被砍斷的，是被人用手生生折斷的。盜墓賊們一臉茫然。你付了二十錢，換走了斷劍。' + (lgSet('lgSwAt'), lgSet('lgSw', 1), addItem('lg_sw_shard') + gain({ silver: -20, int: 1 })) : '你什麼也沒看出來，只覺得劍涼得瘮人。你放下它走了。'); }, { req: money(20), reqT: '需 20 錢' }),
      OPT('n', '走開', () => '你繼續走自己的路。身後的爭吵聲，漸漸被風吹遠了。')] },

  { id: 'lg_sw2', type: '奇遇', title: '鐵匠爐前', ctx: ['city'], w: 40, art: 'city',
    cond: s => s.flags.lgSw === 1 && has('lg_sw_shard') && lgSince('lgSwAt') >= 40,
    text: '城西最老的鐵匠看了斷劍許久，把手心在鐵砧上拍了拍：「好鋼，是前朝百鍊的料。能重鑄，只是熔了以後，只夠打一把長劍，或是兩把短匕。」\n\n「長劍堂堂正正，可樹大招風。雙匕輕巧，一出手就是命。」他抬起眼：「你想要哪一種？一百錢工錢。」',
    choices: () => [
      OPT('g', '重鑄成長劍（一百錢）', () => { addItem('lg_sw_shard', -1); lgSet('lgSw', 'long'); advance(4); return '七日爐火，老鐵匠一錘一錘地敲，叮噹聲響了整個西城。劍出爐的一刻，爐邊的鐵屑都靜了。' + LG('lg_sw_long') + gain({ silver: -100, fame: 5 }); }, { req: money(100), reqT: '需 100 錢' }),
      OPT('n', '重鑄成雙匕（一百錢）', () => { addItem('lg_sw_shard', -1); lgSet('lgSw', 'dag'); advance(3); return '老鐵匠把斷劍熔成兩條細長的青水，倒進模裡。三日後，兩柄細薄的短匕躺在鐵砧上，像兩條青蛇。' + LG('lg_sw_dag') + gain({ silver: -100 }); }, { req: money(100), reqT: '需 100 錢' }),
      OPT('n', '「我自己動手。」（身法檢定）' + ODDS('agi', 14), () => { const r = ROLLT('agi', 14); if (r.ok) { addItem('lg_sw_shard', -1); lgSet('lgSw', 'long'); return r.line + '你借了鐵匠的爐，守了三天三夜，竟真的把斷劍接了起來。老鐵匠看了半天：「後生，你這雙手，白白放著可惜。」' + LG('lg_sw_long') + gain({ agi: 1, fame: 5 }); } return r.line + '你把爐火燒得太旺，劍身差點燒穿。老鐵匠一把按住了你的手：「別毀了好料。」'; }),
      OPT('n', '「我再想想。」', () => '老鐵匠擺擺手：「斷劍不會長腿跑。」')] },

  /* 四、羌女與弓 */
  { id: 'lg_bw1', type: '奇遇', title: '山道上的獵手', ctx: ['wild', 'travel'], w: 9, once: true, art: 'mountain',
    text: '山道轉彎處，一頭黑熊正人立而起，面前縮著一個羌人打扮的女子，小腿被捕獸夾咬著，滿地是血。她的長弓掉在三尺外，弓背上繫著幾根白色羽毛。\n\n她看見你，用生硬的漢話喊：「救我，弓給你！」',
    choices: () => [
      OPT('g', '衝上去引開黑熊', () => win(foe('黑熊', 5, 0.65, 'beast'), () => { lgSet('lgBwAt'); lgSet('lgBw', 'saved'); return '黑熊負傷逃進林子。你撬開捕獸夾，用布條給她紮緊傷口。她躺在地上喘了很久，才用羌語說了一句什麼，然後指指自己的胸口，又指指你。' + gain({ moral: 6, fame: 8 }); }, () => { lgSet('lgBwAt'); lgSet('lgBw', 'saved'); return '你被熊掌拍飛，好在牠被女子拚命射出的最後一箭驚走了。她爬過來扶你，滿臉是淚。' + gain({ moral: 3 }); })),
      OPT('e', '趁她動彈不得，撿起弓就走', () => { lgSet('lgBw', 'grab'); return '黑熊吼了一聲，轉身逃了。你撿起了那張長弓，女子在身後喊了一句你聽不懂的話，聲音嘶啞。' + addItem('lg_bw_grab') + autoGear('lg_bw_grab') + gain({ moral: -10 }); }),
      OPT('n', '遠遠射一箭驚走黑熊，再替她紮傷', () => { lgSet('lgBwAt'); lgSet('lgBw', 'saved'); return '你搭起自己的弓，一箭釘在黑熊腳前。黑熊哼了一聲退走了。你替她紮了傷口，她用羌語連連道謝。' + gain({ moral: 4, fame: 5 }); }, { req: () => curWt() === 'bow', reqT: '需要手持弓' }),
      OPT('n', '「官道不遠，自己爬出去。」', () => '你頭也不回地走了。身後傳來黑熊的咆哮，和一聲短促的尖叫。' + gain({ moral: -6 }))] },

  { id: 'lg_bw2', type: '奇遇', title: '羌人的謝禮', ctx: ['wild', 'travel'], w: 40, once: true, art: 'mountain',
    cond: s => s.flags.lgBw === 'saved' && lgSince('lgBwAt') >= 40,
    text: '山腳下，一個騎著矮馬的羌人老者攔住了你，身後跟著那個獵手，她已經能拄著杖走路了，換了一身乾淨的皮袍。\n\n老者用生硬的漢話說：「她是我的孫女。羌人受了恩，一定要還。」他讓人抬來兩樣東西：一張白羽長弓，一串狼牙護符。「弓是我們部落最好的獵手才配得上的，需要很大的力氣。符，是祈福用的。」',
    choices: () => [
      OPT('g', '收下白羽長弓', () => { lgSet('lgBw', 'bow'); return '老者讓孫女親手把弓遞給你。她輕聲教你羌人的拉法：不是用臂，是用腰。' + LG('lg_bw_gift') + gain({ fame: 8 }); }),
      OPT('n', '收下狼牙護符，請她教你獵人的功夫', () => { lgSet('lgBw', 'charm'); return '她笑了，帶你在山裡跑了三天。你學會了怎麼踩著落葉不出聲，怎麼在風口判斷獵物的蹤跡。' + LG('lg_bw_charm') + (battleXp(120) || '') + gain({ agi: 1 }); }),
      OPT('n', '「舉手之勞，不收禮。」', () => { lgSet('lgBw', 'none'); return '老者愣了愣，隨後深深行了個羌禮。你轉身下山時，那串狼牙護符的鈴聲還在身後輕輕響。' + gain({ moral: 4, fame: 10 }); })] },

  /* 五、七探盤蛇槍 */
  { id: 'lg_sp1', type: '江湖', title: '收爐的老鐵匠', ctx: ['city'], w: 9, once: true, art: 'city',
    text: '街角的鐵匠舖正在拆爐子。老鐵匠坐在門檻上，膝蓋上橫著一桿長槍，槍桿烏黑發亮，槍尖三寸，像一條盤著的蛇。\n\n「我兒子跑了，沒人接我的手藝，」他嘆氣，「這桿槍是我打的最後一桿。七探盤蛇槍，槍頭七個轉折，專破重甲。要價三百錢。」',
    choices: () => [
      OPT('g', '付三百錢買下', () => { lgSet('lgSp', 'bought'); return '老鐵匠數了錢，用袖子擦了擦槍桿，遞給你。「好好用它。」' + LG('lg_sp_snake') + gain({ silver: -300 }); }, { req: money(300), reqT: '需 300 錢' }),
      OPT('n', '「沒那麼多錢。替您看三天爐，換這桿槍（力量檢定）」' + ODDS('str', 12), () => { const r = ROLLT('str', 12); if (!r.ok) return r.line + '你掄了半天錘，連一條直線都鍛不出來。老鐵匠搖搖頭：「你不是這塊料。」'; lgSet('lgSpAt'); lgSet('lgSp', 'work'); advance(3); return r.line + '三天，你掄大錘掄到雙臂發抖。第四天老鐵匠說：「我過幾個月回來，那時候看你還想不想要。槍，我給你留著。」'; }),
      OPT('e', '搶了槍，趁他不備跑', () => { lgSet('lgSp', 'stolen'); return '你扛著槍跑出三條街，身後傳來老鐵匠沙啞的喊聲：「那是我的命啊！」' + addItem('lg_sp_snake') + autoGear('lg_sp_snake') + gain({ moral: -12, fame: -8 }); }),
      OPT('n', '走開', () => '你搖搖頭走了。身後響起鐵錘拆爐的聲音。')] },

  { id: 'lg_sp2', type: '江湖', title: '槍的歸屬', ctx: ['city'], w: 40, once: true, art: 'city',
    cond: s => s.flags.lgSp === 'work' && lgSince('lgSpAt') >= 70,
    text: '老鐵匠回來了，咳得厲害，撐著一桿槍。他身後跟著兩個軍士，腰間佩著環首刀。\n\n「這兩位是郡裡的軍候，」老鐵匠說，「他們出五百錢，要買這桿槍獻給校尉。可我答應過你。」他看著你，眼睛渾濁：「你想要，它就是你的。」',
    choices: () => [
      OPT('g', '收下槍，替老鐵匠婉拒軍士', () => { lgSet('lgSp', 'kept'); return '老鐵匠長出一口氣，把槍遞給你：「它挑對人了。」軍士哼了一聲，走了。' + LG('lg_sp_snake') + gain({ moral: 4 }); }),
      OPT('n', '「讓給軍候吧，老丈要用錢治病。」', () => { lgSet('lgSp', 'given'); return '軍候付了五百錢，老鐵匠推了一半給你：「你看爐三天，這是你該得的。」軍候回頭對你說：「記你一功。」他們給了你一枚賞牌。' + LG('lg_sp_medal') + gain({ silver: 250, fame: 10, moral: 2 }); }),
      OPT('e', '收下槍，也收下錢（兩頭得）', () => { lgSet('lgSp', 'both'); return '你一手接槍，一手接錢，把軍候和老鐵匠全糊弄了過去。老鐵匠盯著你，沒有說話，後來也沒再提過這件事。' + LG('lg_sp_snake') + gain({ silver: 250, moral: -10, fame: -5 }); })] },

  /* 六、老將的刀 */
  { id: 'lg_dr1', type: '江湖', title: '老將軍的酒', ctx: ['city', 'travel'], w: 8, once: true, art: 'night',
    text: '客舍裡，一個白髮老者獨自喝著悶酒，膝上橫著一柄蒙塵的大刀，刀身寬大，刃口卻磨得鋥亮。有人認出他，壓低聲音說：「那是當年北邊戰場上的校尉，三十年前一刀斬了烏桓的頭領。」\n\n老者看見你背上的兵刃，招了招手：「後生，陪我喝一碗。」',
    choices: () => [
      OPT('g', '陪他喝酒，聽他說話（耗時三日）', () => { advance(3); return NX('他說了三天。說他當年的袍澤，說沒打完的仗，說那柄叫「斷流」的刀，說到最後一夜，他咳出了血。\n\n他把刀推到你面前：「我沒有兒子。部下都在北邊，有人找得到他們，把這柄刀還給他們，就是還給我。可你要是不想，也沒人怪你。」', [
        OPT('g', '「我替您送回去。」', () => { lgSet('lgDrAt'); lgSet('lgDr', 1); return '老者微微點頭，像是放下了什麼。第二天清晨，客舍裡只剩一張空榻和一柄刀。' + addItem('lg_dr_scroll') + gain({ moral: 6 }); }),
        OPT('n', '「刀太重，我背不動。」', () => '老者笑了：「也是。」他把刀收回去，沒有再說話。' + gain({ moral: -1 }))]); }),
      OPT('n', '「不了，趕路要緊。」', () => '你拱拱手走了。老者低頭又倒了一碗，沒再招呼別人。')] },

  { id: 'lg_dr2', type: '江湖', title: '舊部', ctx: ['city', 'travel'], w: 40, once: true, art: 'city',
    cond: s => s.flags.lgDr === 1 && has('lg_dr_scroll') && lgSince('lgDrAt') >= 50,
    text: '你終於在邊郡的軍營外打聽到了老將軍的舊部。是兩個鬢角花白的軍侯，看見那柄刀，兩人都沉默了很久。\n\n「是他的刀，」其中一個說，「我們欠他一條命。這刀……」他頓了頓，「他生前說過，刀要給配得上的人。可我們看著，也不知道你配不配。」另一個軍侯卻低聲說：「這刀，留給你也是可以的。」',
    choices: () => [
      OPT('g', '把刀還給舊部', () => { addItem('lg_dr_scroll', -1); lgSet('lgDr', 'returned'); return '兩個軍侯對著刀跪了下來，眼淚落在刀身上。三日後，他們送來一枚半邊虎符：「憑這個，到邊軍中不會有人為難你。」' + LG('lg_dr_tally') + gain({ moral: 8, fame: 15 }); }),
      OPT('e', '「它既然交給了我，我就留著。」', () => { addItem('lg_dr_scroll', -1); lgSet('lgDr', 'kept'); return '兩個軍侯對視一眼，一個黯然低頭，另一個握緊了拳。你收好刀，轉身時感到背後有兩道目光，像刀一樣沉。' + LG('lg_dr_blade') + gain({ moral: -8, fame: -10 }); }),
      OPT('n', '「刀留一半給你們，我帶刀鞘就夠。」（魅力檢定）' + ODDS('cha', 13), () => { const r = ROLLT('cha', 13); addItem('lg_dr_scroll', -1); lgSet('lgDr', 'split'); return r.line + (r.ok ? '軍侯愣住了，隨後大笑：「有意思！」他們留下刀身，把刀鞘送你，還送了一塊虎符。' + addItem('lg_dr_tally') + autoGear('lg_dr_tally') + gain({ moral: 4, fame: 8, cha: 1 }) : '軍侯們臉色一變，抽出刀來。「你敢糊弄我們？」你賠了禮才被放走，刀被收回了。' + gain({ moral: -2, fame: -5 })); })] },
);

// 老將的刀：中間信物（避免新增裝備，只需要一個臨時物件）
Object.assign(ITEMS, { lg_dr_scroll: { n: '斷流刀（託付中）', kind: 'misc', price: 0, d: '老將軍託你送給舊部的大刀，被粗布包著，沉甸甸的。' } });

// 神兵譜最上面列出傳奇裝備的進度
{
  const _arms = REF.arms;
  REF.arms = () => {
    const f = S.flags || {};
    const rows = LEGEND_LINES.map(([k, n]) => { const v = f[k.replace('lg_', 'lg').replace(/^lg([a-z])/, (m, c) => 'lg' + c.toUpperCase())]; return `<li><b>${n}</b>：${v === undefined ? '尚未遇上' : v === 1 ? '進行中' : '已有結局'}</li>`; });
    const own = Object.keys(ITEMS).filter(id => ITEMS[id].legend && (S.inv[id] || 0) > 0).map(id => ITEMS[id].n);
    return `<h4>傳奇裝備</h4><p class="desc">六條劇情線，各藏著一件獨一無二的裝備，選擇不同，得到的也不同。目前擁有：${own.join('、') || '尚無'}。</p><ul class="log journal">${rows.join('')}</ul>` + _arms();
  };
}
