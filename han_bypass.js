'use strict';
/* 繞過戰鬥（v9.4）：參考 Life in Adventure——遭遇大多能用能力檢定避開，不同能力的角色走法不同。
   事件或卡片要開打之前，若不是劇情裡躲不掉的硬仗（noFlee、劇情戰鬥），先多一步：
   動手，或是依對手的種類，選擇說服、賄賂、嚇退、潛行、智取。
   ‧ 檢定難度看對手比你強多少；畫面上直接標出成功率。
   ‧ 成功：不必打，也沒有戰利品；失敗：氣 -1，而且還是得打。
   ‧ 人形對手才聽得進話、收得了錢；野獸只能繞開或引開；機關人只能找破綻；大高手與妖人只剩潛行。 */

const BYPASS_HUMAN = ['thug', 'blade', 'sword'];

function bypassPlan(r) {
  const e = r.battle, st = e.style, f = e.P || 3, pw = Math.max(1, power());
  const dc = clamp(9 + Math.round((f - pw) / 2), 8, 17);
  const intim = gearFx('intim'), stealth = gearFx('stealth'), ward = gearFx('ward');
  const feel = f > pw * 1.35 ? '看上去比你強得多' : f > pw * 1.05 ? '看上去比你略強' : f > pw * 0.7 ? '和你勢均力敵' : '看上去不是你的對手';
  const fail = (msg, qiCut = true) => () => Object.assign({}, r, { pre: true, intro: (qiCut ? qiLoss(1) : '') + msg + (r.intro ? '\n' + r.intro : '') });
  const tryStat = (stat, d, okText, noText, okGain, use) => () => {
    if (use) addItem(use, -1);
    const c = ROLLT(stat, d);
    return c.ok ? c.line + okText + gain(okGain || {}) : fail(noText)();
  };
  // 道具當鑰匙：成功率不看能力，看運氣與道具本身
  const tryChance = (pct, okText, noText, use) => () => {
    if (use) addItem(use, -1);
    return chance(pct) ? okText : fail(noText, false)();
  };
  const opts = [OPT('n', '動手', () => Object.assign({}, r, { pre: true }))];
  const human = BYPASS_HUMAN.includes(st), he = st === 'beast' ? '牠' : st === 'puppet' ? '它' : '他';
  const sneakDc = dc + (st === 'master' ? 2 : st === 'demon' ? 3 : 0) - Math.round(stealth * 1.5);
  if (human) {
    opts.push(OPT('g', '開口說服他讓路' + ODDS('cha', dc), tryStat('cha', dc,
      pick([`你把前因後果說得條理分明，${e.n}聽著聽著，握兵刃的手慢慢鬆開了。「……算了，今天算你運氣好。」他讓開了路。`, `你不提打，只說這條路上誰都不容易。${e.n}沉默半晌，把兵刃別回腰間，轉身走了。`, `幾句話說下來，${e.n}的臉色從狠變成了尷尬。他乾咳一聲：「誤會，都是誤會。」`]),
      `你的話才說到一半，${e.n}就不耐煩地打斷了你：「少囉嗦！」`)));
    const cost = clamp(Math.round(f * 5), 15, 300);
    opts.push(OPT('n', `塞錢了事（${cost} 錢）`, () => `你掏出錢袋，在${e.n}眼前晃了晃。他掂了掂分量，哼了一聲，把路讓開。${gain({ silver: -cost })}`, { req: money(cost), reqT: `需 ${cost} 錢` }));
    if (pw >= f * 0.85 || intim >= 1) opts.push(OPT('e', '亮出兵刃嚇退他' + ODDS('str', dc - 2 - intim * 2), tryStat('str', dc - 2 - intim * 2,
      `你不說話，只是把兵刃緩緩拔出半截。${e.n}盯著你的手看了很久，咽了口唾沫，帶著人退開了。`, `你擺出架勢，可${e.n}看出了你的底，冷笑一聲迎了上來。`, { fame: 2 })));
    if (has('wine')) opts.push(OPT('g', '遞上一壺稻酒，請他喝一口（用掉稻酒）', tryChance(clamp(55 + S.stats.cha * 3, 55, 90),
      `${e.n}猶豫了一下，接過酒壺灌了一大口，抹抹嘴：「……下回別讓我再遇上。」他擺擺手讓開了路。`, `${e.n}接過酒喝了，卻還是把兵刃橫了過來：「酒我收了，路不讓。」`, 'wine')));
    if (has('rope')) opts.push(OPT('n', '把麻繩橫拉在路上，絆倒領頭的' + ODDS('agi', dc - 3), tryStat('agi', dc - 3,
      `你把麻繩貼地一拉，領頭的${e.n}摔了個狗吃屎，後面的人撞成一團。你趁亂已經走遠了。`, `繩子被${e.n}一腳踩住，他冷笑著把你連人帶繩拽了過去。`)));
  }
  if (st === 'beast') {
    opts.push(OPT('n', '丟乾糧、揮火把，把牠引開' + ODDS('int', dc), tryStat('int', dc, `你把乾糧丟向遠處，同時揮著火把往另一個方向退。${e.n}猶豫了一下，轉身去追那團食物，你趁機繞了過去。`, `誘餌丟偏了，${e.n}死死盯著你，慢慢壓低了身子。`)));
    if (has('torch')) opts.push(OPT('n', '舉起火把驅趕牠（用掉火把）', tryChance(85, `你把火把往牠面前一送，${e.n}怕火，低吼著退進了林子。火把也燒到了盡頭。`, `火把被${e.n}一爪子拍落在地，火星四濺。牠沒有退。`, 'torch')));
    if (has('ration')) opts.push(OPT('n', '把乾糧遠遠拋出去，引開牠（用掉乾糧）', tryChance(75, `${e.n}聞到乾糧的味道，頭也不回地追了過去。你屏著氣從牠剛才站的地方繞了過去。`, `${e.n}只看了乾糧一眼，目光又落回了你身上。`, 'ration')));
    if (has('rope')) opts.push(OPT('n', '在路上拉起絆索，引牠一頭栽進去' + ODDS('agi', dc - 4), tryStat('agi', dc - 4, `你在窄道上拉好麻繩，轉身就跑。${e.n}追得太急，一頭栽進繩圈，掙扎著翻了好幾個滾。你已經走遠了。`, `繩圈剛拉好，${e.n}就從側面撲了過來。`)));
  }
  if (st === 'puppet') {
    opts.push(OPT('n', '找出機關的死角' + ODDS('int', dc), tryStat('int', dc, `你繞著${e.n}看了一圈，發現它的關節處有一道縫，正好卡在視線之外。你貼著牆根，一步一步挪了過去。`, `你剛靠近，${e.n}眼窩裡的紅光就亮了起來。`)));
    if (has('pickaxe')) opts.push(OPT('n', '用鐵鎬撬進關節縫裡' + ODDS('str', dc - 3), tryStat('str', dc - 3, `你把鐵鎬卡進${e.n}的肩關節，用盡全身力氣一撬。「喀」的一聲，它的手臂垂了下來，眼窩裡的紅光慢慢暗了。`, `鐵鎬剛卡進去就被一股力道彈開，${e.n}的手臂掄了過來。`)));
    if (has('rope')) opts.push(OPT('n', '用麻繩纏住它的關節' + ODDS('agi', dc - 3), tryStat('agi', dc - 3, `你把麻繩拋過${e.n}的腰間，繞了兩圈，死死拴在石柱上。它掙了幾下，只能原地打轉。`, `繩圈剛拋出去，${e.n}一抬手就把它扯斷了。`)));
  }
  if (st === 'demon' && (has('mirror') || ward >= 1)) {
    opts.push(OPT('n', `舉起${ward >= 1 ? '護身的辟邪之物' : '銅鏡'}，照向${he}`, tryChance(80, `${e.n}一看見那道光，臉色一變，嘴裡唸唸有詞地後退了幾步，轉身消失在黑暗裡。`, `${e.n}只是冷笑了一聲：「這點把戲，也敢拿出來？」`)));
  }
  if (st !== 'puppet') {
    opts.push(OPT('n', `趁${he}沒注意，悄悄繞過去` + ODDS('agi', sneakDc), tryStat('agi', sneakDc, `你屏住呼吸，貼著陰影一步一步挪開。${e.n}始終沒有回頭。直到走出很遠，你才發覺自己的背都濕透了。`, `你剛挪了兩步，腳下一根枯枝「啪」地斷了。${e.n}猛地轉過頭。`)));
  }
  if (st === 'master') {
    opts.push(OPT('g', '抱拳說明來意，請他高抬貴手' + ODDS('cha', dc + 3), tryStat('cha', dc + 3, `你抱拳行禮，把話說得不卑不亢。${e.n}打量你許久，緩緩點頭：「後生還算懂規矩。去吧。」`, `${e.n}冷冷一笑：「少來這一套，拔劍。」`)));
  }
  return { text: `${e.n}擋在你前面，${feel}。\n\n你可以動手，也可以想想有沒有別的辦法。`, opts };
}

{
  const _hr = handleResult;
  handleResult = function (r) {
    if (r && typeof r === 'object' && r.battle && !r.noFlee && !r.pre && !r.title && UI.ov && UI.ov.k === 'event') {
      const plan = bypassPlan(r);
      if (plan.opts.length > 1) return _hr(NX(plan.text, plan.opts));
    }
    return _hr(r);
  };
}
