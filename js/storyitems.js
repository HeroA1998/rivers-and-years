/* 江湖歲月錄 — 故事道具：有來歷的珍本，各自綁在一段原作的人物與地點上，只會得到一次。
   三件都是奇物（裝在「奇物」槽），效果寫在道具說明裡。台詞皆為本作重寫，非原著文字。 */
'use strict';

EVENTS.push(
  { id: 'y_wumu', type: '奇遇', title: '武穆遺書', ctx: ['city'], loc: 'yanjing', w: 14, once: true, art: 'city',
    cond: s => ad() >= 1222 && ad() <= 1235 && !!s.npcs.munianci && s.npcs.munianci.met && s.npcs.munianci.fav >= 15,
    text: '穆念慈在客店裡翻檢父親的舊箱，箱底壓著一卷發黃的書冊，封皮上寫著「武穆遺書」四字。她看見你，有些不好意思：「這是家父留下的，說是岳家軍的兵法。我只看得懂一半。」',
    choices: [
      C('g', '「我替你收著，好好研讀。」', () => { addItem('wumu'); return '穆念慈把書交到你手裡：「書是死的，人是活的。你比我懂得用。」' + favUp('munianci', 6); }),
      C('n', '「你留著，我看看就好。」', () => '你翻了幾頁，記下了幾句陣法口訣。' + gain({ int: 1 })),
      C('e', '趁她不注意，把書抽走', () => { addItem('wumu'); return '你把書揣進懷裡，她回頭時，只看見空空的箱底。' + gain({ moral: -6 }) + favUp('munianci', -10); }),
    ] },

  { id: 'y_jiuyin', type: '奇遇', title: '九陰殘卷', ctx: ['wild', 'city'], loc: 'huashan', w: 10, once: true, art: 'snow',
    cond: s => ad() >= 1222 && ad() <= 1225 && !!s.npcs.ouyangke && s.npcs.ouyangke.met,
    text: '雪夜，歐陽克獨自坐在華山的一間破道觀裡，手裡摩挲著一卷殘破的薄冊，字跡陰柔而詭異。他看見你，把冊子往袖裡一收：「來得正好。這是我三叔的寶貝，缺了一半，我看了半年也沒看懂。」',
    choices: [
      C('g', '「我替你參詳參詳。」', () => { addItem('jiuyin'); return '歐陽克把殘冊推過來，難得沒有笑：「拿去，別讓我後悔。」' + favUp('ouyangke', 6); }),
      C('e', '「拿來！」出手去搶', () => figFight('ouyangke', 'duel', { title: '九陰殘卷',
        intro: '歐陽克眯起眼，一手按住袖子：「你當我是好欺負的？」',
        win: () => { addItem('jiuyin'); return '歐陽克倒在雪地裡，咬牙把殘冊扔給你：「記住今天。」'; },
        lose: '你沒能碰到殘冊，反被他的蛇杖抽在肩上。他拾起殘冊，笑得很冷。' })),
      C('n', '「山上風大，你還是早些下山吧。」', () => '歐陽克怔了怔，把殘冊收回袖裡，什麼也沒說。' + favUp('ouyangke', 2) + gain({ agi: 1 })),
    ] },

  { id: 'y_jianglong', type: '奇遇', title: '降龍殘頁', ctx: ['wild', 'sect'], loc: 'junshan', w: 10, once: true, art: 'river',
    cond: s => ad() >= 1224 && ad() <= 1235,
    text: '君山的老叫化們在篝火旁傳閱一張殘頁，上面畫著掌勢的圖樣，寫著「亢龍有悔」四字。一個缺了門牙的老叫化見你多看了兩眼，冷笑：「降龍掌的殘譜，你也想看？」',
    choices: [
      C('g', '抱拳行禮：「晚輩想學些掌法，請前輩賜教。」', () => { addItem('jianglong'); return '老叫化看了你半晌，把殘頁往你懷裡一塞：「會不會，看你的造化。」' + gain({ moral: 2 }); }),
      C('e', '「拿來！」伸手就搶', () => fightThen(foe('丐幫叛徒', 6, 0.6, 'thug'),
        s => { addItem('jianglong'); return '叛徒被你打翻在地，殘頁落在泥裡。你撿起來拍乾淨，看了一眼四周，沒有人敢出聲。' + gain({ moral: -4 }); },
        s => '你被打得滿臉是血，殘頁早已不知去向。' + gain({ moral: -2 }),
        { intro: '那缺牙的老叫化身後，幾個乞丐同時站了起來。' })),
      C('n', '「殘譜，我不稀罕。」轉身離開', () => '你走出很遠，還能聽見身後的笑聲。' + gain({ int: 1 })),
    ] },
);
