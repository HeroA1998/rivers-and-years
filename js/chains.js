/* 江湖歲月錄 — 奇緣：隨機觸發的多段小故事。每局遇到哪幾個、先後順序、內情（roll 出的變數）都不同 */
'use strict';

const fightThen = (e, w, l, x) => Object.assign({ battle: e, win: w, lose: l, noFlee: true }, x || {});
const CHAINS = {
  /* ---- 託孤 ---- */
  letter: { title: '託孤', roll: () => ({ city: pick(['linan', 'yanjing', 'xiangyang']), fate: pick(['debt', 'maid', 'thief']) }),
    steps: [
      { ctx: ['travel', 'wild'], log: '答應替垂死的劍客駱寒送信給女兒。', scene: (s, v) => ({ title: '道旁的劍客', art: 'road',
        pages: ['官道旁的老槐樹下靠著一個人，胸口一片暗紅，手裡還握著劍。他聽見腳步聲，費力地睜開眼。', `「在下駱寒。」他從懷裡摸出一封信，連劍一起推向你，「${LOCS[v.city].n}……我女兒，阿蘅……十年沒見了。信和劍，替我交給她。」\n\n「我沒有銀子謝你。只有一句話：這輩子別學我，為了爭一口氣，把家丟了。」`],
        choices: [C('g', '接過信和劍', () => '駱寒笑了笑，頭慢慢垂了下去。你在槐樹下葬了他，把劍背在身上。' + gain({ moral: 3 })),
          C('e', '等他斷氣，拿了劍去賣', s2 => { s2.chain.letter.st = 99; return '劍在鐵匠舖換了五十兩。那封信，你隨手扔進了路邊的溝裡。' + gain({ silver: 50, moral: -6 }); }),
          C('n', '「我有要事在身。」', s2 => { s2.chain.letter.st = 99; return '你繞開了他。走出很遠，回頭還能看見那棵槐樹。'; })] }) },
      { ctx: ['city', 'travel'], loc: v => v.city, hint: v => `把駱寒的信和劍送到${LOCS[v.city].n}，交給他女兒阿蘅`, log: '找到了阿蘅。', scene: (s, v) => ({ title: '阿蘅', art: 'city', who: 'kid',
        text: { debt: '你問了三條街才找到阿蘅——在賭坊的後廚裡刷碗。賭坊掌櫃攔住你：「她爹欠了一百五十兩賭債，人跑了，拿閨女抵。想帶走？行，拿銀子來。」', maid: '阿蘅在城南一戶大戶人家當丫鬟。管家斜著眼看你：「簽的是死契。贖身一百兩，少一文都不行。再說了，她走了誰伺候老夫人？」', thief: '你是被偷了錢袋才找到阿蘅的。巷子深處，十幾個小乞兒圍著一個短髮少女，她掂著你的錢袋，聽完你的來意，冷笑一聲：「我沒有爹。他十年前就死了。」' }[v.fate],
        choices: v.fate === 'thief'
          ? [C('g', '把信一字一句念給她聽', s2 => s2.stats.cha + s2.stats.int + R(8) >= 16 ? (v.ok = true, '念到「爹對不住你」時，她背過身去，肩膀抖了很久。再轉回來時，她伸手接過了劍，也把錢袋還給了你。' + gain({ moral: 6, cha: 1 })) : '她聽完，把信撕成兩半，轉身走了。你把劍留在了巷口的石墩上。第二天再去看，劍不見了。'),
             C('e', '搶回錢袋，連劍也不給她了', () => '你把錢袋奪了回來，揹著劍走出巷子。十幾個小乞兒在後面朝你扔石頭。' + gain({ moral: -4 })),
             C('n', '把劍和信放下就走', () => '你把東西放在地上。走出巷口時，你聽見身後有人撿起了劍。' + gain({ moral: 2 }))]
          : [C('g', `付${v.fate === 'debt' ? '一百五十' : '一百'}兩贖人`, () => { v.ok = true; return '阿蘅抱著父親的劍，在街邊哭了很久。她抬起頭問你：「他最後……有沒有提到我？」你說，他最後一句話，說的就是你。' + gain({ silver: -(v.fate === 'debt' ? 150 : 100), moral: 10, fame: 8 }); }, { req: s2 => s2.silver >= (v.fate === 'debt' ? 150 : 100), reqT: '銀兩不足' }),
             C('n', '把信交給她就走', () => '你把信和劍交給了阿蘅。她什麼也沒說，只是把劍抱得很緊。' + gain({ moral: 2 })),
             C('e', '銀子沒有，拳頭有', () => fightThen(foe(v.fate === 'debt' ? '賭坊打手頭目' : '護院教頭', 3, 0.6, 'thug'), () => { v.ok = true; return '你帶著阿蘅殺出一條路。她一手抱著劍，一手緊緊攥著你的衣角，一聲沒哭。' + gain({ moral: 6, fame: 10 }); }, s2 => { return '你被打出門外。阿蘅隔著門縫看著你，搖了搖頭，示意你別再來了。你把信從門縫裡塞了進去。'; }))] }) },
      { ctx: ['city', 'travel'], cond: (s, v) => v.ok, log: '阿蘅學成了父親的劍法。', scene: s => ({ title: '故人之女', art: 'legacy', who: 'kid',
        pages: ['有人在身後叫你。你回過頭，幾乎認不出來——那個瘦小的丫頭長高了一截，腰背挺直，背上是那柄你親手交給她的劍。', '「我照著爹留在劍鞘裡的劍譜練的。」阿蘅說，「練到第三式才明白，他這十年不是不想回來，是不敢。」\n\n她解下一卷手抄的冊子遞給你：「這是我抄的。爹的劍，你也有一份。」'],
        choices: [C('g', '「跟我學吧，我教你下半套。」', s2 => { s2.disciple = { n: '阿蘅', y: s2.date.y, done: false }; return '阿蘅愣了一下，然後結結實實跪了下去：「師父。」' + (battleXp(200) || '') + gain({ moral: 4 }); }, { req: s2 => !s2.disciple && age() >= 20, reqT: '已有弟子或年紀太輕' }),
          C('e', '收下劍譜，再向她要那柄劍', () => '阿蘅愣了一下，把劍解下來給了你，什麼也沒說就走了。' + (battleXp(260) || '') + addItem('w_sword2') + gain({ fame: -5 })),
          C('n', '收下劍譜', () => '阿蘅朝你抱了抱拳，轉身走進人群。江湖上，又多了一個背劍的人。' + (battleXp(260) || '〔武學領悟加深〕') + gain({ fame: 15 }))] }) },
    ] },

  /* ---- 古寺夜哭 ---- */
  ghost: { title: '古寺夜哭', roll: () => ({ who: pick(['robbers', 'widow', 'deserter']) }),
    steps: [
      { ctx: ['travel', 'wild'], log: '夜探鬧鬼的古寺。', scene: (s, v) => ({ title: '古寺夜哭', art: 'night',
        pages: ['山腳的村子天沒黑就關門閉戶。借宿的老漢壓低聲音告訴你：山上的破廟鬧鬼，夜夜有哭聲，已經有三個後生上山去看，一個也沒回來。', '半夜，風裡果然傳來了哭聲。不是一個人的，是很多人的，忽高忽低，聽得人後頸發涼。'],
        choices: [C('g', '提燈上山', () => ({
            robbers: () => fightThen(foe('盜墓賊頭目', 3, 0.6, 'blade'), () => { v.res = 'win'; return '「鬼」是一夥盜墓賊，在佛像底下挖前朝的地宮，哭聲是他們用陶哨吹的。那三個後生被綁在偏殿，還活著。你把賊人捆成一串，帶著後生和半袋贓銀下了山。' + gain({ silver: 120, fame: 20, moral: 5 }); }, s2 => { v.res = 'lose'; return '你中了埋伏，滾下山坡才撿回一條命。「鬼」是一夥盜墓賊。他們認得你的臉了。'; }, { intro: '佛像後閃出幾條黑影，為首的獰笑：「又來一個送死的。」' }),
            widow: () => (v.res = 'meet', '大殿裡沒有鬼，只有一個瘦得脫形的婦人，和七八個擠在草堆裡的孩子。哭聲是孩子們餓的。\n\n婦人跪下了：「我男人欠了債，債主要拿孩子抵。這些都是沒人要的孤兒……求您別說出去。那三個後生是我騙下山去報信的，早從後山走了。」'),
            deserter: () => (v.res = 'meet', '供桌下蜷著一個斷了腿的年輕人，身上是破爛的軍衣。哭聲是他疼得忍不住時發出來的。\n\n「別報官，」他抓住你的褲腳，「我不是怕死才跑的。將軍要我們殺良冒功，屠一個村子。我下不了手。」'),
          }[v.who])()),
          C('e', '跟老漢收一筆「驅鬼錢」，再去山上看看', s2 => { s2.silver += 30; s2.chain.ghost.st = 99; return '你收了老漢三十兩，上山轉了一圈，什麼也沒看見就下來了，說鬼已經趕走了。〔銀兩+30〕'; }),
          C('n', '蒙上被子睡覺', s2 => { s2.chain.ghost.st = 99; return '你一夜沒睡踏實。天亮後你離開了村子，沒有回頭。'; })] }) },
      { ctx: ['travel', 'wild', 'city'], cond: (s, v) => v.res, log: '古寺一事有了後續。', scene: (s, v) => ({ title: '古寺餘波', art: v.who === 'robbers' ? 'fight' : 'road',
        text: { robbers: v.res === 'win' ? '有人攔住了你的去路。「我兄弟栽在你手裡。」是個獨眼漢子，身後跟著七八個人，「盜墓這行有規矩：斷人財路，如殺人父母。」' : '你又遇上了那夥盜墓賊。這回是在大白天的官道上，他們正押著一車剛出土的東西。為首的認出了你，臉色一變。',
          widow: '那個婦人託人輾轉找到了你。她帶著孩子們在廟裡種了半畝菜，可債主還是尋來了，揚言三天後上山拿人。', deserter: '城門口貼出了海捕文書，畫的正是那個逃兵，賞銀二百兩。旁邊的兵丁說，有人看見他往山上的破廟去了，明日就搜山。' }[v.who],
        choices: v.who === 'robbers'
          ? [C('g', '「那就手底下見真章。」', () => fightThen(foe('獨眼盜魁', 6, 0.6, 'blade'), () => { v.end = 'good'; return '盜魁服了。「地宮裡有樣東西，我們不識貨，你拿去。」他丟給你一個長匣子，帶著人走了。' + addItem(pick(['w_sword2', 'w_blade2', 'a_gold'])) + gain({ fame: 20 }); }, s2 => { return '你又輸了一次。他們搜走了你身上的銀子。' + gain({ silver: -Math.round(s2.silver * 0.3) }); })),
             C('e', '「入夥，地宮裡的東西分我一份。」', () => '盜魁大笑著拍你的肩。那車出土的東西，你分到了三成。' + gain({ silver: 160, moral: -8 })),
             C('n', '賠個不是，繞道走', () => '盜魁哼了一聲，讓開了路。')]
          : v.who === 'widow'
            ? [C('g', '在山道上等債主', () => s.silver >= 120 ? (v.end = 'good', '你把一百二十兩拍在債主面前。債主數完銀子，撕了借據。孩子們躲在婦人身後看你，最小的那個忽然跑過來，往你手裡塞了一個烤得焦黑的紅薯。' + gain({ silver: -120, moral: 10, fame: 10 })) : fightThen(foe('債主的打手', 3, 0.6, 'thug'), () => { v.end = 'good'; return '打手們抬著債主下了山。你讓他帶句話：這座廟，以後有人罩著。' + gain({ moral: 8, fame: 15 }); }, s2 => { return '你沒能攔住他們。等你醒來，廟裡已經空了。' + gain({ moral: -2 }); })),
               C('e', '把孩子們的下落賣給債主', () => '債主給了你五十兩。三天後，山上的破廟又傳出了哭聲。' + gain({ silver: 50, moral: -12 })),
               C('n', '這是別人的家事', () => '你把口信退了回去。後來聽說，那座廟空了。' + gain({ moral: -3 }))]
            : [C('g', '連夜上山，送他出關', () => { v.end = 'good'; advance(6); return '你背著他翻了兩座山，把他交給關外的馬幫。臨別時他把一塊軍中腰牌塞給你：「我這條命是你的。哪天你要用得著當兵的，拿這個到雁門找我。」〔耗時六日〕' + gain({ moral: 10, con: 1 }); }),
               C('e', '去衙門領賞', () => '二百兩賞銀沉甸甸的。行刑那天，你沒有去看。' + gain({ silver: 200, moral: -12 })),
               C('n', '這事與我無關', () => '第二天兵丁搜了山，帶下來一具屍首。')] }) },
      { ctx: ['travel', 'city', 'wild'], cond: (s, v) => v.end === 'good', log: '古寺的故事有了結局。', scene: (s, v) => ({ title: '善因', art: 'legacy',
        text: { robbers: '你打開了那個長匣子的夾層。裡頭還有一卷薄絹，畫的是一套吐納的姿勢，旁邊的小字寫著：「地宮主人自創，傳於有緣。」', widow: '再路過那座山時，破廟已經修葺一新，門口掛了塊木牌：「慈幼堂」。孩子們圍上來叫你恩公，婦人端出一碗熱湯，說這湯裡的藥草，是一個路過的老郎中教她們認的，喝了能固本培元。', deserter: '雁門關外來了一個商隊，指名要找你。領頭的正是那個逃兵，如今是馬幫的二當家。他卸下兩匹馬馱的貨：「說過這條命是你的。先還個零頭。」' }[v.who],
        choices: [C('g', '收下這份心意', () => ({ robbers: () => '你照著薄絹練了幾日，氣息綿長了不少。' + (xp(S.nei, 350) || '') + gain({ bonusMp: 30 }), widow: () => '一碗熱湯下肚，四肢百骸都暖了。' + gain({ bonusHp: 50, con: 1, moral: 3 }), deserter: () => '馬背上是上好的皮貨、藥材和三百兩銀子。' + gain({ silver: 300, fame: 10 }) + addItem('dahuan') }[v.who])()),
          C('e', '「就這點？」再多要一些', () => '對方愣了一下，又添了一份。走的時候，誰也沒有回頭看你。' + gain({ silver: 150, fame: -8 })),
          C('n', '「不必了，你們留著吧。」', () => '你推辭了。對方堅持塞給你一包乾糧，你收下了。' + gain({ moral: 4, luck: 1 }))] }) },
    ] },

  /* ---- 鏢銀失竊 ---- */
  heist: { title: '鏢銀失竊', roll: () => ({ culprit: pick(['zhang', 'sun', 'liu']) }),
    steps: [
      { ctx: ['city'], cond: s => s.fame >= 30, log: '受託查訪鏢銀失竊案。', scene: () => ({ title: '三千兩', art: 'city',
        pages: ['鏢局的總鏢頭在酒樓找到你，眼裡全是血絲。「三千兩官銀，昨夜在庫房裡不翼而飛。門鎖完好，守夜的人什麼也沒聽見。五日內找不回來，我這塊招牌就得摘了。」', '「能進庫房的只有三個人：管了二十年帳的老張，最近手氣背，欠了賭債；新來的趟子手孫二，來歷說不清；還有我那小舅子劉三，遊手好閒，這幾天忽然闊綽起來。」\n\n「我不敢信自己人，只能求外人。」'],
        choices: [C('g', '「我替你查。」', () => '總鏢頭長揖到地。你決定先在城裡走訪幾日。'),
          C('e', '「先付一百兩定金，我再查。」', s2 => { s2.silver += 100; return '總鏢頭咬咬牙，給了。〔銀兩+100〕你決定先在城裡走訪幾日。'; }),
          C('n', '「這種事該報官。」', s2 => { s2.chain.heist.st = 99; return '總鏢頭苦笑：「報了官，銀子就更回不來了。」'; })] }) },
      { ctx: ['city'], hint: () => '在城裡走動，查訪鏢銀失竊案', log: '查到了一條線索。', scene: (s, v) => { const sharp = s.stats.int + s.stats.luck + R(8) >= 17; const clue = {
          book: { zhang: '帳本最後三頁的墨色比前面新，有幾筆數目被重抄過。', sun: '帳本一筆不亂。老張欠的賭債，上個月就用自己的棺材本還清了。', liu: '帳本一筆不亂。倒是夾著一張借據：劉三向老張借過五十兩，至今未還。' },
          stable: { zhang: '馬廄的馬一匹不少，車轍也沒有新的。銀子根本沒出過鏢局。', sun: '馬廄少了一副馱鞍。草料堆下有一雙沾著庫房石灰的新鞋，是趟子手的尺碼。', liu: '馬廄的馬一匹不少。馬伕說孫二每夜都睡在草料堆上，鼾聲如雷，全鏢局都聽得見。' },
          pawn: { zhang: '當鋪掌櫃說，劉三前幾日贖回了自家的地契，銀子是他娘賣了陪嫁鐲子湊的。', sun: '當鋪掌櫃說，劉三前幾日贖回了自家的地契，銀子是他娘賣了陪嫁鐲子湊的。', liu: '當鋪掌櫃一看見官銀的印記就變了臉色：「前天有人拿這種銀錠來兌散碎的，戴著斗笠，可手上那枚翡翠扳指我認得。」' } };
        const ask = k => () => { v.clue = sharp ? clue[k][v.culprit] : '問了一圈，各說各話，沒有一句對得上。'; return `你查到的是：${v.clue}`; };
        return { title: '查訪', art: 'city', text: '五日之期只剩兩日。你的時間只夠細查一處。',
          choices: [C('g', '翻查帳房的帳本', ask('book')), C('e', '撬開當鋪的櫃子，翻他們的帳', ask('pawn')), C('n', '只去馬廄看看車轍', ask('stable'))] }; } },
      { ctx: ['city'], hint: () => '回鏢局，指認偷走鏢銀的人', log: '鏢銀案水落石出。', scene: (s, v) => { const acc = k => () => k === v.culprit
          ? '那人臉色煞白，撲通跪下了。銀子就藏在' + { zhang: '帳房地磚下——他把數目做進假帳，本想月底悄悄補上', sun: '城外的枯井裡——他本是綠林探子，混進來就為這一票', liu: '他姐姐的陪嫁箱籠裡——誰也想不到去搜總鏢頭夫人的屋子' }[k] + '。總鏢頭紅著眼眶，把謝儀硬塞進你手裡。' + gain({ silver: 220, fame: 30, int: 1 })
          : '被你指認的人大喊冤枉。當夜，真正的賊帶著銀子遠走高飛。三天後鏢局摘了招牌。那個被冤枉的人，後來再也沒人肯雇。' + gain({ fame: -15, moral: -6 });
        return { title: '指認', art: 'city', text: `鏢局大堂，三個人站成一排。總鏢頭看著你。\n\n你手裡的線索：${v.clue || '幾乎沒有。'}`,
          choices: [C('g', '指認你查到的人', () => acc(v.clue && v.clue.includes('翡翠扳指') ? 'liu' : v.clue && v.clue.includes('新鞋') ? 'sun' : v.clue && v.clue.includes('墨色') ? 'zhang' : pick(['zhang', 'sun', 'liu']))()),
            C('e', '隨便指一個，拿了謝儀就走', () => acc(pick(['zhang', 'sun', 'liu']))()),
            C('n', '「我查不出來。」', () => '你把定金退了回去。總鏢頭嘆了口氣，沒有怪你。')] }; } },
    ] },

  /* ---- 三碗酒 ---- */
  drunk: { title: '三碗酒', roll: () => ({ secret: pick(['fugitive', 'master', 'killer']) }),
    steps: [
      { ctx: ['city'], log: '結識了邋遢劍客楚狂。', scene: () => ({ title: '第一碗', art: 'city', who: 'gu',
        text: '酒樓角落裡，一個鬍子拉碴的漢子把腳架在桌上，身邊橫著一柄用草繩纏著劍柄的劍。他朝你舉了舉碗：「喂，一個人喝酒最沒意思。坐過來，輸的人付帳。」',
        choices: [C('g', '坐過去，陪他喝', s => '你們從黃昏喝到打烊。他酒量好得不像話，酒品卻不壞，只是從頭到尾沒說自己從哪裡來。\n\n「我叫楚狂。」臨走時他說，「這頓算我欠你的。」' + gain({ silver: -Math.min(12, s.silver), cha: 1 })),
          C('e', '陪他喝，趁他醉了摸他的錢袋', s => '你們從黃昏喝到打烊。他醉倒在桌上，你摸走了他的錢袋——裡頭只有幾文錢和一張畫著女人的舊紙。\n\n「我叫楚狂。」他醒來時說，「錢袋你拿去，那張紙還我。」' + gain({ silver: 3 })),
          C('n', '「我不和醉鬼喝酒。」', s => { s.chain.drunk.st = 99; return '他哈哈一笑，自己乾了那碗。'; })] }) },
      { ctx: ['travel', 'wild'], log: '與楚狂並肩打了一架。', scene: (s, v) => ({ title: '第二碗', art: 'fight', who: 'gu',
        text: `山道上有人在打鬥。你一眼認出了那柄草繩纏柄的劍——楚狂被${{ fugitive: '七八個官差', master: '一群年輕劍客', killer: '幾個蒙面人' }[v.secret]}圍在中間，左臂已經見了血，嘴裡還在笑：「一起上，省得爺一個個打發！」`,
        choices: [C('g', '拔出兵刃，站到他身邊', () => fightThen(foe({ fugitive: '帶隊的捕頭', master: '為首的劍客', killer: '蒙面人首領' }[v.secret], 6, 0.6, 'sword'), () => { v.friend = true; return '人退了。楚狂靠著樹坐下，從懷裡摸出個扁酒壺，自己喝一口，遞給你一口。\n\n「你不問他們為什麼追我？」\n\n「你想說自然會說。」\n\n他看了你半晌，笑了：「這酒沒白喝。」' + gain({ fame: 10 }); }, s2 => { v.friend = true; return '你倒下了。醒來時身上蓋著一件舊袍子，傷口已經包好，旁邊放著半壺酒。人不見了。'; })),
          C('e', '幫圍攻的人，拿他領賞', s2 => { s2.chain.drunk.st = 99; return '楚狂被你從背後一擊打倒。他回頭看你的那一眼，你很久都忘不掉。圍攻的人分了你一份。' + gain({ silver: 80, moral: -8 }); }),
          C('n', '不明就裡，不便插手', s2 => { s2.chain.drunk.st = 99; return '你從岔路繞開了。後來你再也沒見過那柄草繩纏柄的劍。'; })] }) },
      { ctx: ['city', 'travel'], cond: (s, v) => v.friend, log: '知道了楚狂是誰。', scene: (s, v) => ({ title: '第三碗', art: 'night', who: 'gu',
        pages: ['楚狂在城外的破亭子裡等你，面前擺著兩個碗，一罈沒開封的酒。他今天沒有笑。', { fugitive: '「我是朝廷欽犯。三年前有個知府強佔民田，逼死了一家七口。我殺了他。」他倒滿兩碗酒，「追我的官差沒有錯，他們吃的是這碗飯。我躲累了。你把我交出去，賞銀三百兩，夠你花一陣子。」',
          master: '「二十年前，江湖上有個人，三十歲就打遍天下。他太狂了，一場比劍誤殺了最好的朋友。」他攤開右手，掌心一道橫貫的舊疤，「他自己挑斷了手筋。那些追著我打的年輕人，是那位朋友的後輩。他們該打。」',
          killer: '「有人出五百兩，買你的命。」他把酒碗推到你面前，「我接了。第一碗酒是為了看清你的身手，第二回是想等你跟人動完手再撿便宜。」\n\n「可你站到我身邊來了。」他苦笑，「做我們這行的，最怕這個。」' }[v.secret]],
        choices: { fugitive: [C('g', '「我送你出關。」', () => { advance(8); return '你們走了八天山路。出關那天，他把那柄草繩纏柄的劍解下來給你：「劍我用不著了。劍法在這裡，」他點了點你的額頭，「這八天，我都教給你了。」〔耗時八日〕' + (battleXp(380) || '') + gain({ moral: 12, agi: 1 }); }),
            C('e', '把他交給官府', () => '楚狂伸出雙手讓你綁，一路上沒有再看你一眼。三百兩賞銀到手那天，你喝了很多酒，一點也不醉。' + gain({ silver: 300, moral: -18, fame: 10 })),
            C('n', '「我什麼也沒聽見。」', () => '你們喝完了那罈酒。天亮時，他已經走了。' + gain({ cha: 1 }))],
          master: [C('g', '「教我。你不能用的劍，我替你用。」', () => { advance(10); return '他用左手握著樹枝，教了你十天。最後一天他說：「我這輩子就錯在一個狂字。你記著，劍越快，心要越慢。」〔耗時十日〕' + (battleXp(450) || '') + (xp(S.nei, 250) || '') + gain({ int: 1, bonusMp: 30 }); }),
            C('e', '把他的下落告訴那些年輕人', () => '那些年輕人給了你一百兩。後來聽說，楚狂沒有還手。' + gain({ silver: 100, moral: -12 })),
            C('n', '陪他把這罈酒喝完', () => '你們喝到天亮，誰也沒再提劍。分別時他拍了拍你的肩：「有你這個朋友，這二十年不算白活。」' + gain({ moral: 3, cha: 1, luck: 1 }))],
          killer: [C('e', '「那就在這裡了結。」', () => fightThen(foe('楚狂', 10, 0.6, 'sword'), () => '你的兵刃停在他咽喉前。他閉上了眼。你收了手。\n\n「雇你的人是誰？」\n\n他說了一個名字。那是一個你曾經得罪過的人。「我不會再接這單生意。」他把訂金的銀票撕了，「但他會找別人。你當心。」' + gain({ fame: 25, silver: 100 }), s2 => { return '他的劍停在你咽喉前，抖得厲害。良久，他把劍扔進了河裡。\n\n「這行我幹不下去了。」他說，「你好好活著，別讓我後悔。」' + gain({ moral: 3 }); })),
            C('g', '端起碗：「這第三碗，我敬你沒有動手。」', () => '兩隻碗碰在一起。他一飲而盡，把五百兩的銀票撕成兩半，一半扔進風裡，一半塞給你：「留個念想。往後誰要動你，先問過我這柄劍。」' + gain({ moral: 6, luck: 2, cha: 1 })),
            C('n', '起身就走，不再理他', () => '你走出破亭子時，聽見背後碗碎的聲音。')] }[v.secret] }) },
    ] },
};

/* 觸發規則：同時只進行一個奇緣；每段之間至少相隔一段時日 */
function chainCandidates(ctx) {
  S.chain = S.chain || {};
  const today = daysIn(S), out = [];
  const ok = (id, c) => { const st = CHAINS[id].steps[c.st]; if (!st) return false;
    const loc = typeof st.loc === 'function' ? st.loc(c.v) : st.loc;
    return (!st.ctx || st.ctx.includes(ctx)) && (!loc || loc === S.loc) && (!st.cond || st.cond(S, c.v)); };
  const active = Object.keys(S.chain).filter(id => CHAINS[id] && S.chain[id].st < CHAINS[id].steps.length);
  const last = Math.max(0, ...Object.keys(S.chain).map(id => S.chain[id].day));
  active.forEach(id => { if (today - S.chain[id].day >= 20 && ok(id, S.chain[id])) out.push({ chain: id, w: 30, type: '奇緣' }); });
  if (!active.length && today > 45 && today - last >= 40) Object.keys(CHAINS).filter(id => !S.chain[id]).forEach(id => { if (ok(id, { st: 0, v: {} })) out.push({ chain: id, w: 9, type: '奇緣' }); });
  return out;
}
function chainStep(id) {
  const def = CHAINS[id], c = S.chain[id] || (S.chain[id] = { st: 0, day: 0, v: def.roll(S) });
  const st = def.steps[c.st], ev = st.scene(S, c.v);
  c.st++; c.day = daysIn(S);
  (S.journal = S.journal || []).push({ t: dateStr(), ch: `奇緣・${def.title}`, s: st.log });
  return Object.assign({ type: '奇緣' }, ev);
}
function chainHints() {
  const out = [];
  for (const id in (S.chain || {})) { const def = CHAINS[id], c = S.chain[id], st = def && def.steps[c.st]; if (st && st.hint && (!st.cond || st.cond(S, c.v))) out.push({ title: def.title, hint: st.hint(c.v) }); }
  return out;
}
