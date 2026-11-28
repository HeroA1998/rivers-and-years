'use strict';
/* 事件多元化（v9.2）：參考 Life in Adventure 的事件設計
   ‧ 多層分支：選項的結果可以是「下一層」，同一件事接著往下走（NX）。
   ‧ 不再固定三個選項：一件事可以有二到五個選擇，有的要花錢、要道具、要俠義才開得出來。
   ‧ 檢定選項直接標出成功率；有的選項先檢定、成功了才多出新的選擇。
   ‧ 與「氣」掛鉤：歇息、聽曲、看戲、吃飽會回氣，目睹慘事、做了違心事會傷氣。 */

/* ---------- 多層分支 ---------- */
const NX = (text, choices) => ({ next: { text, choices } });
const OPT = (s, t, go, x) => C(s, t, go, Object.assign({ plain: true }, x || {}));
const ROLLT = (stat, dc) => { const c = check(stat, dc); return { ok: c.ok, line: rollLine(c) }; };
const ODDS = (stat, dc) => '　' + reqLine({ stat, dc });
{
  const _hr = handleResult;
  handleResult = function (r) {
    if (r && typeof r === 'object' && r.next) {
      const ov = UI.ov && UI.ov.k === 'event' ? UI.ov : null;
      if (!ov) return _hr(r.next.text || '');
      if (r.next.text) storyAppend('result', r.next.text + takePend());
      const raw = typeof r.next.choices === 'function' ? r.next.choices(S) : r.next.choices;
      const choices = sides(raw).map(c => Object.assign({}, c, { qi: 0, dis: !!((c.req && !c.req(S)) || (c.cond && !c.cond(S))), reqT: c.reqT || '' }));
      if (choices.length && choices.every(c => c.dis)) choices[choices.length - 1].dis = false;
      ov.choices = choices; ov.result = null;
      render();
      return;
    }
    return _hr(r);
  };
}

/* ---------- 占卜用：三種問法，各兩種解卦 ---------- */
const DIVINE = {
  財: { gua: '卦得「屯」，雲雷屯：萬事起頭難，可是難中藏著生機。', a: ['「那我就腳踏實地，一步一步來。」', { str: 1, luck: -1 }], b: ['「富貴險中求。」', { luck: 1, con: -1 }] },
  名: { gua: '卦得「乾」，初九：潛龍勿用。龍還在水裡，不到出頭的時候。', a: ['「那就先韜光養晦。」', { int: 1, cha: -1 }], b: ['「時候是自己掙來的。」', { cha: 1, int: -1 }] },
  緣: { gua: '卦得「咸」，山上有澤：兩心相感，不必強求。', a: ['「那我真心待人就是了。」', { cha: 1, agi: -1 }], b: ['「隨緣吧。」', { luck: 1, cha: -1 }] },
};
const divine = k => {
  const d = DIVINE[k];
  return NX(`老卜者收了錢，把蓍草分了又分，數了又數。${gain({ silver: -10 })}\n\n「${d.gua}」他抬起那隻好眼：「卦是死的，人是活的。你心裡怎麼想？」`, [
    OPT('n', d.a[0], () => '老卜者點點頭：「心定了，路就順了。」' + gain(Object.assign({ qi: 1 }, d.a[1]))),
    OPT('n', d.b[0], () => '老卜者笑了：「也是一條路。」' + gain(Object.assign({ qi: 1 }, d.b[1])))]);
};

/* ---------- 射覆 ---------- */
const RIDDLE_OK = () => '老者揭開碗，下面果然是一顆骨製的骰子。他哈哈大笑：「好！後生可畏！」圍觀的人起鬨，湊了些賞錢給你。' + gain({ int: 1, qi: 1, silver: 15, fame: 2 });
const RIDDLE_NO = () => '老者搖搖頭，遞過一碗酒：「罰！」你一口乾了，圍觀的人一陣起鬨。老者揭開碗——是一顆骰子。' + gain({ qi: 1 });
const RIDDLE_OPTS = () => [OPT('n', '「骰子。」', RIDDLE_OK), OPT('n', '「印章。」', RIDDLE_NO), OPT('n', '「銅錢。」', RIDDLE_NO), OPT('n', '「棋子。」', RIDDLE_NO)];

const MORE_EV = [
  { id: 'hx_diviner', type: '奇遇', title: '一卦十錢', ctx: ['city'], w: 8, art: 'city',
    text: '市集角落蹲著一個瞎了一隻眼的老卜者，面前攤著一把蓍草、半片龜甲。他用那隻好眼盯著你：「十錢一卦。問財、問功名，還是問姻緣？」',
    choices: () => [
      OPT('n', '問財（10 錢）', () => divine('財'), { req: money(10), reqT: '需 10 錢' }),
      OPT('n', '問功名（10 錢）', () => divine('名'), { req: money(10), reqT: '需 10 錢' }),
      OPT('n', '問姻緣（10 錢）', () => divine('緣'), { req: money(10), reqT: '需 10 錢' }),
      OPT('e', '「裝神弄鬼。」搶過他的龜甲看看', () => '龜甲上的裂紋你一條也看不懂。老卜者也不惱，伸手要了回去：「卦象不是給搶的。」' + gain({ luck: -1, moral: -1 })),
      OPT('n', '不信這一套，走開', () => '老卜者在你身後慢悠悠地說：「不問，也是一卦。」')] },

  { id: 'hx_armwrestle', type: '江湖', title: '比腕力', ctx: ['city'], w: 7, art: 'city',
    text: '酒肆裡一個赤膊大漢把手肘頓在案上：「誰來掰手腕？押十錢，贏的拿二十！」他腳邊已經坐著兩個揉手腕的。',
    choices: () => [
      OPT('n', '坐下來跟他比力氣' + ODDS('str', 12), () => { const r = ROLLT('str', 12); return r.line + (r.ok ? '你咬牙一壓，他的手背砰地砸在案上。滿堂叫好。' + gain({ silver: 20, fame: 2 }) + (battleXp(40) || '') : '他手腕一翻，你的手背砸在案上，疼得發麻。' + gain({ silver: -10 }) + qiLoss(1)); }, { req: money(10), reqT: '需 10 錢' }),
      OPT('n', '不比蠻力，比巧勁' + ODDS('agi', 13), () => { const r = ROLLT('agi', 13); return r.line + (r.ok ? '你趁他發力的一瞬間鬆了半分，再猛地一扣，他整個人都被帶歪了。' + gain({ silver: 20, fame: 2 }) : '巧勁沒使出來，倒把自己的手腕扭了。' + gain({ silver: -10 }) + qiLoss(1)); }, { req: money(10), reqT: '需 10 錢' }),
      OPT('e', '先請他喝三碗烈酒再比（15 錢）', () => '三碗下肚，大漢的眼神就有點發直了。你輕輕鬆鬆把他壓了下去，贏的錢正好抵酒錢。' + gain({ silver: 5, moral: -1 }), { req: money(15), reqT: '需 15 錢' }),
      OPT('n', '在旁邊喝酒看熱鬧', () => '你看他連贏了五個人，最後被一個瘦小的老頭掰倒，全場笑翻了。' + gain({ qi: 1 }))] },

  { id: 'hx_shells', type: '江湖', title: '三碗猜珠', ctx: ['city'], w: 7, art: 'city', cond: s => s.silver >= 50,
    text: '街邊一個伶俐的漢子在案上倒扣三個陶碗，手指翻飛，把一顆木珠在碗底下換來換去：「看準了，押五十錢，猜中翻倍！」圍觀的人裡剛好有個人贏了錢，笑得合不攏嘴。',
    choices: s => [
      OPT('n', '押五十錢猜一把', () => chance(20 + s.stats.luck * 2) ? '你指了中間那個，碗一翻，珠子果然在下面！' + gain({ silver: 50 }) : '碗一翻，空的。另外兩個碗裡也是空的——珠子早就不在桌上了。' + gain({ silver: -50 }) + qiLoss(1), { req: money(50), reqT: '需 50 錢' }),
      OPT('n', '盯著他的手，看他怎麼換' + ODDS('int', 12), () => {
        const r = ROLLT('int', 12);
        if (!r.ok) return r.line + '你看得眼花，什麼也沒看出來。';
        return NX(r.line + '你看出來了：珠子一直夾在他的小指縫裡，剛才贏錢的那個人是他的同夥。', [
          OPT('g', '當眾揭穿他', () => '你一把扣住他的手，小指縫裡掉出一顆珠子。圍觀的人一擁而上討回了錢，那漢子和同夥抱頭逃了。' + gain({ fame: 5, moral: 3 })),
          OPT('e', '把他拉到巷子裡：「分我一半，我就不說。」', () => '他咬著牙分了你一份。從那天起，你在這條街上多了一個仇人。' + gain({ silver: 60, moral: -4 })),
          OPT('n', '什麼也不說，走開', () => '你搖搖頭走了。又一個鄉下人押上了他半年的工錢。' + gain({ qi: -1 }))]); }),
      OPT('e', '出老千：趁他不注意換掉碗' + ODDS('agi', 13), () => {
        const r = ROLLT('agi', 13);
        if (r.ok) return r.line + '你袖子一抖，把碗換了位置。他翻開碗時臉都綠了，只好賠錢。' + gain({ silver: 50, moral: -2 });
        return NX(r.line + '你的手剛伸過去，就被他一把抓住：「行家？行家也得守規矩！」他身後站起來兩個人。', [
          OPT('n', '動手', () => win(foe('騙局的打手', 2, 0.55, 'thug'), () => '你打翻了兩個打手，騙子捲起碗跑了，桌上剩下的錢歸了你。' + gain({ silver: 40 }), null)),
          OPT('n', '賠錢了事（30 錢）', () => '你掏了三十錢，灰溜溜地走了。' + gain({ silver: -30 }) + qiLoss(1), { req: money(30), reqT: '需 30 錢' })]); }),
      OPT('n', '不玩，看別人輸', () => '你看了一刻鐘，沒見誰贏過第二次。')] },

  { id: 'hx_fork', type: '江湖', title: '岔路', ctx: ['travel'], w: 9, art: 'road',
    text: '路分成了兩條。路邊的石碑上刻著：左走山徑，近而險；右走官道，遠而平。天色不早了。',
    choices: () => [
      OPT('n', '走山徑' + ODDS('agi', 11), () => { const r = ROLLT('agi', 11); return r.line + (r.ok ? '你手腳並用翻過了山脊，比預計早到了一天。' + (battleXp(40) || '') : '你在碎石坡上滑了一跤，滾下去好幾丈。' + hurt(1)); }),
      OPT('n', '走官道', () => {
        advance(2);
        if (!chance(45)) return '官道雖遠，一路平安無事。〔耗時二日〕';
        return NX('官道果然好走。走到第二天傍晚，路旁的林子裡忽然傳出一聲悶吼——一頭黑熊人立起來，擋在路中間。', [
          OPT('n', '慢慢後退' + ODDS('agi', 12), () => { const r = ROLLT('agi', 12); return r.line + (r.ok ? '你一步一步退出了牠的視線，黑熊哼了一聲，搖搖擺擺地走了。' : '你踩斷了一根枯枝，黑熊撲上來給了你一掌，你連滾帶爬地逃了。' + hurt(1)); }),
          OPT('n', '趴下裝死' + ODDS('luck', 11), () => { const r = ROLLT('luck', 11); return r.line + (r.ok ? '你趴在地上大氣也不敢出。黑熊嗅了嗅你的後腦勺，走了。你爬起來時，腿還在抖。' + qiLoss(1) : '黑熊用爪子把你翻了個面，你只好跳起來逃命。' + hurt(1)); }),
          OPT('n', '拔出兵刃', () => win(foe('黑熊', 3, 0.5, 'beast'), () => '黑熊倒下了。熊掌和熊皮在下一個集市換了不少錢。' + gain({ silver: 60, fame: 3 }), null))]); }),
      OPT('n', '就地紮營，明天再說', () => '你在路邊升了堆火，睡了一夜好覺。' + gain({ qi: 1 }))] },

  { id: 'hx_riddle', type: '奇遇', title: '射覆', ctx: ['city', 'travel'], w: 6, once: true, art: 'city',
    text: '街頭圍著一圈人。一個穿著舊儒衫的老者把一個陶碗倒扣在案上：「當年東方朔射覆，猜無不中。老夫今日也來一回：碗下是一樣東西，猜中的有賞，猜錯的罰酒一碗。」\n\n他慢悠悠地念：「六面皆有眼，眼眼不相同。一擲定輸贏，吉凶在掌中。」',
    choices: () => [...RIDDLE_OPTS(),
      OPT('n', '先想一想' + ODDS('int', 11), () => { const r = ROLLT('int', 11); return r.ok ? NX(r.line + '「六面皆有眼」——眼，說的是點數。你心裡有數了。', [OPT('n', '「骰子。」', RIDDLE_OK)]) : NX(r.line + '你想得頭都疼了，還是沒有頭緒。老者在一旁笑瞇瞇地等著。', RIDDLE_OPTS()); })] },

  { id: 'hx_baixi', type: '江湖', title: '百戲', ctx: ['city'], w: 7, art: 'city',
    text: '市上搭起了百戲棚：有人吞刀吐火，有人在繩索上翻跟頭，一個少年把七顆彈丸拋在空中接來接去。班主敲著鑼：「看戲的隨意給！」',
    choices: () => [
      OPT('n', '擠進去看戲，丟幾個錢（5 錢）', () => '你看得目瞪口呆，跟著眾人喝了好幾聲采。' + gain({ silver: -5, qi: 2 }), { req: money(5), reqT: '需 5 錢' }),
      OPT('n', '上台跟少年一起跳丸' + ODDS('agi', 12), () => { const r = ROLLT('agi', 12); return r.line + (r.ok ? '你接住了五顆彈丸，台下掌聲雷動。班主硬塞給你一串錢：「要不要跟我們走？」' + gain({ silver: 25, fame: 3, qi: 1 }) : '彈丸砸了你一頭包，台下笑成一片。' + gain({ fame: -1 })); }),
      OPT('e', '趁大家仰著頭看，摸幾個錢袋' + ODDS('agi', 12), () => {
        const r = ROLLT('agi', 12);
        if (r.ok) return r.line + '人人仰著頭，沒人看你的手。' + gain({ silver: 35, moral: -3 });
        return NX(r.line + '一隻手扣住了你的手腕——是班主。「在我的場子裡偷錢？」', [
          OPT('n', '賠罪，把錢還回去（20 錢）', () => '你賠了錢，在一片噓聲裡擠出了人群。' + gain({ silver: -20, fame: -2 }), { req: money(20), reqT: '需 20 錢' }),
          OPT('n', '甩開他就跑' + ODDS('agi', 11), () => { const r2 = ROLLT('agi', 11); return r2.line + (r2.ok ? '你一扭手腕掙脫了，鑽進人群不見了。' + gain({ fame: -1 }) : '班主的徒弟們把你按在地上打了一頓。' + hurt(1)); })]); }),
      OPT('n', '不看了，走開', () => '鑼聲在你身後響了很久。')] },

  { id: 'hx_toll', type: '江湖', title: '山口的流民', ctx: ['travel'], w: 8, art: 'road',
    text: '山口橫著一根樹幹，幾個面黃肌瘦的漢子拿著竹槍：「過路的，留下二十錢！」看那樣子，不像山賊，倒像是逃荒的流民。',
    choices: () => [
      OPT('n', '給他們二十錢', () => '領頭的漢子愣了一下，好像沒想到真有人給。他讓開路，低聲說了句謝謝。' + gain({ silver: -20, moral: 2 }), { req: money(20), reqT: '需 20 錢' }),
      OPT('g', '分他們乾糧，問他們從哪裡來', () => NX('他們是鉅鹿來的，田被豪強佔了，又遇上疫病，一路往北逃。「聽說太平道的人在發糧，」領頭的說，「我們想去投他們。」', [
        OPT('g', '「那邊要出大事，別去。」勸他們往幽州找活路', () => '他們商量了很久，最後朝北走了。' + gain({ moral: 4 })),
        OPT('n', '「各人有各人的路。」', () => '你看著他們的背影消失在山口。' + GOSSIP())])),
      OPT('n', '說自己是太平道的人', () => '漢子們眼睛一亮，連忙讓開，還塞給你半塊餅。' + gain({ qi: 1 }), { req: s => has('hj_band') || has('hj_robe') || has('hj_talisman'), reqT: '需要太平道的信物' }),
      OPT('n', '「讓開。」' + ODDS('cha', 11), () => { const r = ROLLT('cha', 11); return r.ok ? r.line + '他們看了看你的兵刃，默默挪開了樹幹。' : win(foe('拿竹槍的流民', 1, 0.4, 'thug'), () => '他們一觸即潰，哭喊著逃進了林子。你心裡不太好受。' + gain({ qi: -1 }), null, { intro: '你的話沒嚇住他們。領頭的一咬牙，竹槍刺了過來。' }); }),
      OPT('e', '亮出兵刃，把他們的竹槍全折了', () => win(foe('拿竹槍的流民', 1, 0.4, 'thug'), () => '你折了他們的竹槍，揚長而去。他們身上連一文錢都搜不出來。' + gain({ moral: -4, qi: -1 }), null))] },

  { id: 'hx_lostchild', type: '江湖', title: '走失的孩子', ctx: ['city'], w: 7, once: true, art: 'city',
    text: '一個婦人拉住你的袖子，眼睛哭得紅腫：「壯士，我的阿牛不見了！早上還在市口玩，一轉眼就沒了……」旁邊的人說，這個月城裡已經丟了三個孩子。',
    choices: () => [
      OPT('g', '「我幫你找。」到市口問人' + ODDS('cha', 11), () => {
        const r = ROLLT('cha', 11);
        if (!r.ok) return r.line + '問了一圈，沒人看見。婦人坐在地上，再也站不起來。' + gain({ qi: -1 });
        return NX(r.line + '一個賣餅的老漢說，早上看見一個戴斗笠的人牽著個孩子，往城南的破窯去了。', [
          OPT('g', '直奔破窯', () => win(foe('拐賣孩童的人販', 2, 0.58, 'blade'), () => '你踹開破窯的門，三個孩子縮在角落裡，阿牛就在其中。人販被你捆起來送去了縣寺。婦人跪在地上給你磕頭，額頭都磕破了。' + gain({ moral: 8, fame: 12, qi: 2 }), () => '你被打倒在破窯外，人販帶著孩子跑了。' + qiLoss(1), { noFlee: true })),
          OPT('n', '先去縣寺報官', () => { advance(2); return '縣寺的小吏拖了兩天才派人去，破窯裡只剩下一堆冷灰。' + gain({ qi: -1 }); })]); }),
      OPT('n', '給她些錢，讓她去求縣寺（20 錢）', () => '婦人接過錢，一步三回頭地走了。' + gain({ silver: -20, moral: 2 }), { req: money(20), reqT: '需 20 錢' }),
      OPT('n', '「這種事，管不了。」', () => '你抽回了袖子。婦人的哭聲在你身後響了很久。' + gain({ qi: -1 }))] },

  { id: 'hx_feast', type: '江湖', title: '豪強壽宴', ctx: ['city'], w: 6, art: 'city',
    text: '縣裡的豪強做六十大壽，門口支起大鍋施粥，院子裡擺了上百桌。管家站在門口吆喝：「有本事的進來獻藝，賞錢少不了！」可你也聽說，這位豪強去年剛把半個鄉的田佔了。',
    choices: () => [
      OPT('n', '進去獻藝' + ODDS('cha', 12), () => { const r = ROLLT('cha', 12); return r.line + (r.ok ? '你一曲唱罷，滿堂喝采。豪強親手賞了你一匹絹，你轉手就換成了錢。' + gain({ silver: 60, fame: 3, qi: 1 }) : '你一開口就卡了殼，被管家請了出去。' + gain({ fame: -1 })); }),
      OPT('n', '排隊喝一碗粥就走', () => '粥熬得很稠，裡頭還有幾片肉。排在你前面的老婦人說，這是她三天來吃的第一頓飽飯。' + heal(1) + gain({ qi: 1 })),
      OPT('g', '在席間當眾質問他強佔民田的事', () => NX('滿院子一下靜了下來。豪強放下酒爵，瞇著眼看你：「哪裡來的野狗？」他身後的家丁拔出了刀。', [
        OPT('g', '「我替被你逼死的人來的。」', () => win(foe('豪強的家丁頭目', 4, 0.6, 'blade'), () => '家丁倒了一地。你轉身走出大門，門口排隊喝粥的百姓自動讓出了一條路。' + gain({ moral: 8, fame: 15 }), () => '你被打出大門，扔在街心。排隊的百姓沒人敢扶你，可有人偷偷往你懷裡塞了半個餅。' + gain({ moral: 3, fame: 4 }), { noFlee: true })),
        OPT('n', '「失言，失言。」賠笑退下', () => '你在一片冷笑聲裡退了出去。' + gain({ fame: -3, qi: -1 }))]), { req: s => s.moral >= 20, reqT: '需心存俠義' }),
      OPT('e', '混進廚房偷些酒肉' + ODDS('agi', 11), () => { const r = ROLLT('agi', 11); return r.line + (r.ok ? '你抱著一隻燒雞和一罈酒溜了出來，在牆根下吃得滿嘴流油。' + gain({ qi: 1, moral: -1 }) : '廚子抄起擀麵杖把你打了出來。' + hurt(1)); }),
      OPT('n', '走開', () => '院子裡的喧鬧聲一直傳到街口。')] },

  { id: 'hx_scholar', type: '奇遇', title: '醉臥路旁的名士', ctx: ['city'], w: 6, once: true, art: 'city',
    text: '路旁的柳樹下躺著一個人，衣冠不整，懷裡還抱著一個空酒罈，嘴裡念念有詞：「天下熙熙，皆為利來……」看他的衣料，倒像個讀書人。',
    choices: () => [
      OPT('g', '扶他回家', () => NX('他家住在城西一座破舊的院子裡，滿屋子都是竹簡。他醒了一半，拉著你不放：「好人！陪我再喝一罈！」', [
        OPT('n', '陪他喝', () => '你們從《春秋》聊到天下大勢。他說：「這天下，不出十年就要亂了。」天亮時他塞給你一卷他抄的兵書。' + gain({ int: 1, qi: 1 }) + addItem('xinde')),
        OPT('n', '煮了碗醒酒湯就走', () => '他喝了湯，迷迷糊糊地說了聲謝。你走的時候，聽見他在屋裡吟詩。' + gain({ moral: 2, qi: 1 }))])),
      OPT('e', '搜他的錢袋', () => '錢袋裡只有幾文錢和一枚私印。你把錢拿走，私印扔回了他懷裡。' + gain({ silver: 6, moral: -3 })),
      OPT('n', '繞過去', () => '你從他身邊走過，他翻了個身，接著念他的詩。')] },

  { id: 'hx_fishing', type: '奇遇', title: '河灣垂釣', ctx: ['wild', 'travel'], w: 7, art: 'river',
    text: '河灣裡水流平緩，岸邊插著一根不知誰留下的魚竿。你肚子正餓。',
    choices: () => [
      OPT('n', '用魚竿釣' + ODDS('luck', 10), () => {
        const r = ROLLT('luck', 10);
        if (!r.ok) return r.line + '你坐了一下午，只釣上來一隻破草鞋。不過河風吹得人很舒服。' + gain({ qi: 1 });
        return NX(r.line + '竿梢一沉，拉上來一條兩尺長的大鯉魚，在草地上活蹦亂跳。', [
          OPT('n', '升火烤來吃', () => '魚皮烤得焦香，你吃得一點不剩。' + heal(1) + gain({ qi: 1 })),
          OPT('n', '拿到下個集市賣', () => '鯉魚賣了個好價錢。' + gain({ silver: 30 })),
          OPT('g', '放回河裡', () => '鯉魚一甩尾巴，鑽回了水裡。老人說鯉魚躍過龍門就能化龍——你希望牠能躍過去。' + gain({ luck: 1, qi: 1 }))]); }),
      OPT('n', '下水徒手摸魚' + ODDS('agi', 12), () => { const r = ROLLT('agi', 12); return r.line + (r.ok ? '你摸到了一條滑溜溜的大魚，緊緊抱在懷裡爬上了岸。' + heal(1) + gain({ qi: 1 }) : '魚沒摸著，倒被河蚌夾了手指。' + gain({ qi: -1 })); }),
      OPT('n', '不釣了，趕路', () => '你在河邊洗了把臉，繼續上路。')] },

  { id: 'hx_well', type: '奇遇', title: '古井怪聲', ctx: ['wild', 'travel'], w: 6, once: true, art: 'night',
    text: '荒村口有一口古井，井口長滿青苔。你走近時，井底傳來一陣「咚、咚」的聲音，像有人在敲井壁。村子早就沒人住了。',
    choices: () => [
      OPT('n', '攀著井繩下去看' + ODDS('con', 12), () => {
        const r = ROLLT('con', 12);
        if (!r.ok) return r.line + '井繩斷了，你摔到井底，在黑暗裡摸了半天才爬上來。' + hurt(1) + gain({ qi: -1 });
        return NX(r.line + '井底沒有水，只有一個半人高的洞口，裡頭黑漆漆的。敲井壁的是一隻被困住的山羊，牠腳邊還有一個爛了一半的木箱。', [
          OPT('g', '把山羊抱上去', () => '你費了好大力氣才把山羊弄上去。牠在井口咩了一聲，跑進了荒村。' + gain({ moral: 2, luck: 1 })),
          OPT('n', '撬開木箱', () => chance(60) ? '箱子裡是一串串發綠的五銖錢，大概是當年村民藏的。' + gain({ silver: 120 }) : win(foe('花斑毒蛇', 2, 0.5, 'beast'), () => '你打死了毒蛇。箱子裡只有幾件爛衣服。', null, { intro: '你剛撬開箱蓋，一條花蛇竄了出來！' })),
          OPT('n', '鑽進洞裡看看', () => '洞很窄，越往裡越冷。你摸到一面石壁，上頭刻滿了你看不懂的字，再往前就沒路了。你在黑暗裡待得太久，爬出井口時，手還在抖。' + gain({ int: 1 }) + shock(1, '你湊近看了很久，才發覺那些字只是前人記路的符號，並不嚇人。'))]); }),
      OPT('n', '往井裡丟塊石頭', () => '石頭落下去，「咚」的一聲。井底的聲音停了。過了很久，又響了起來。你決定不管了。' + shock(1, '你側耳聽了很久，聽出那不過是山羊的蹄子敲在石壁上的回聲，也就沒什麼可怕了。')),
      OPT('n', '趕快離開', () => '你頭也不回地走了。走出很遠，好像還聽得見那「咚、咚」的聲音。')] },

  { id: 'hx_plague', type: '江湖', title: '疫村', ctx: ['travel'], w: 7, art: 'road',
    text: '村口掛著白幡，路邊躺著兩個蓋了草蓆的人。一個面色蠟黃的老人坐在村口：「村裡鬧疫病，外人別進來了。」可你聽見村子裡有孩子在哭。',
    choices: () => [
      OPT('g', '進村幫忙照顧病人' + ODDS('con', 12), () => { advance(5); const r = ROLLT('con', 12); return r.line + (r.ok ? '你在村裡待了五天，挑水、熬藥、埋死人。走的時候，病倒的人裡有一半好了起來。' + gain({ moral: 8, fame: 6 }) + qiLoss(1) : '你幫了五天忙，自己也發起了高燒，躺了好幾天才緩過來。' + gain({ moral: 6 }) + hurt(1) + qiLoss(1)) + '〔耗時五日〕'; }),
      OPT('g', '把草藥留給村子（3 株）', () => { addItem('herb', -3); return '老人捧著草藥，對你拜了又拜。' + gain({ moral: 5, fame: 3 }); }, { req: s => (s.inv.herb || 0) >= 3, reqT: '需草藥 3 株' }),
      OPT('e', '趁亂進村，搜死人家裡的財物', () => '你在空屋裡翻出了不少東西。夜裡你夢見那些蓋著草蓆的人坐起來看著你。' + gain({ silver: 90, moral: -8 }) + qiLoss(2)),
      OPT('n', '繞道走', () => '你繞過了村子。孩子的哭聲被風吹散了。' + gain({ qi: -1 }))] },

  { id: 'hx_cockfight', type: '江湖', title: '鬥雞', ctx: ['city'], w: 6, art: 'city', cond: s => s.silver >= 20,
    text: '牆根下圍著一圈人，正在鬥雞。一隻紅冠大公雞和一隻黑羽小公雞撲騰得羽毛亂飛。莊家喊：「押紅的一賠一，押黑的一賠二！」',
    choices: s => [
      OPT('n', '押紅冠（20 錢）', () => chance(55) ? '紅冠一啄就把黑雞啄翻了，你贏了二十錢。' + gain({ silver: 20 }) : '黑雞忽然一個翻身，啄瞎了紅冠的一隻眼。你輸了。' + gain({ silver: -20 }), { req: money(20), reqT: '需 20 錢' }),
      OPT('n', '押黑羽（20 錢）', () => chance(30 + s.stats.luck) ? '黑雞以小搏大，硬是把紅冠趕出了圈子！你贏了四十錢。' + gain({ silver: 40, qi: 1 }) : '黑雞撐不到三個回合就倒了。' + gain({ silver: -20 }), { req: money(20), reqT: '需 20 錢' }),
      OPT('e', '偷偷餵紅冠吃一把泡過酒的米' + ODDS('agi', 12), () => { const r = ROLLT('agi', 12); return r.line + (r.ok ? '紅冠醉醺醺地東倒西歪，黑雞大勝。你押的黑雞讓你賺了一筆。' + gain({ silver: 45, moral: -2 }) : '雞主人一把抓住了你的手：「你餵牠吃什麼？」圍觀的人把你推出了圈子。' + gain({ fame: -3, silver: -Math.min(20, S.silver) })); }),
      OPT('n', '看熱鬧', () => '你看了幾場，難怪城裡的少年都愛鬥雞走狗。' + gain({ qi: 1 }))] },

  { id: 'hx_minstrel', type: '江湖', title: '瞽者彈唱', ctx: ['city'], w: 8, art: 'city',
    text: '街角的樹下，一個瞽者抱著一把舊琴，唱的是〈十五從軍征〉：「十五從軍征，八十始得歸……」路過的人有的停下腳步，有的低頭走開。',
    choices: () => [
      OPT('n', '坐下來聽完，給他幾個錢（3 錢）', () => '他唱完最後一句，琴聲停了很久，你才發覺自己眼眶有點濕。' + gain({ silver: -3, qi: 2 }), { req: money(3), reqT: '需 3 錢' }),
      OPT('n', '點一首歡快的曲子（10 錢）', () => '他換了一首〈陌上桑〉，周圍的孩子都跟著拍手。' + gain({ silver: -10, qi: 2 }), { req: money(10), reqT: '需 10 錢' }),
      OPT('e', '把他碗裡的錢倒走', () => '他聽見錢響，停下琴，朝你的方向「看」了很久，什麼也沒說。' + gain({ silver: 15, moral: -5 }) + qiLoss(1)),
      OPT('n', '繼續趕路', () => '琴聲跟了你半條街。')] },

  { id: 'hx_camp', type: '奇遇', title: '剛熄的營火', ctx: ['wild'], w: 7, art: 'mountain',
    text: '林子裡有一處剛熄的營火，灰還是溫的。火邊的瓦罐裡還有半罐熱粥，旁邊放著一個包袱。四周沒有人。',
    choices: () => [
      OPT('n', '喝了那半罐粥', () => '粥是粟米熬的，加了野菜，你喝得一乾二淨。' + heal(1) + gain({ qi: 1 })),
      OPT('n', '翻看包袱' + ODDS('int', 11), () => {
        const r = ROLLT('int', 11);
        if (!r.ok) return r.line + '包袱裡只有幾件破衣服。';
        return NX(r.line + '包袱裡是幾件破衣和一塊木牌，上面寫著某縣的徭役名籍——這是逃役的民夫。林子後面傳來輕微的腳步聲。', [
          OPT('g', '留下一些錢和乾糧，悄悄離開（20 錢）', () => '你走出很遠，回頭看見幾個瘦得皮包骨的人從樹後走出來，對著你的方向作揖。' + gain({ silver: -20, moral: 5, qi: 1 }), { req: money(20), reqT: '需 20 錢' }),
          OPT('e', '拿著名籍去縣寺告發', () => '縣寺賞了你五十錢。那天下午，一隊兵丁進了林子。' + gain({ silver: 50, moral: -8 }) + qiLoss(1)),
          OPT('n', '把包袱放回原處', () => '你把東西放回原樣，悄悄走了。')]); }),
      OPT('n', '在火堆邊等主人回來' + ODDS('cha', 11), () => { const r = ROLLT('cha', 11); return r.line + (r.ok ? '等了一個時辰，幾個衣衫襤褸的漢子小心翼翼地走了出來。你說明來意，他們分了你一碗粥，還告訴你一條近路。' + gain({ qi: 1 }) + GOSSIP() : '天黑了也沒人回來。你只好自己升起火，過了一夜。'); })] },
];
EVENTS.push(...MORE_EV);

/* ---------- 既有事件加上回氣、傷氣 ---------- */
const withQi = (c, d) => Object.assign({}, c, { go: s => { const r = c.go(s); return typeof r === 'string' ? r + gain({ qi: d }) : r; } });
{
  // 事件 id → { 選項序號: 氣的增減 }
  const QI_EV = {
    j_refugee: { 1: -1, 2: -1 }, j_bully: { 1: -1 }, hn_dangren: { 1: -1, 2: -1 }, hn_locust: { 2: -1 }, b_flower: { 2: -1 },
    l_dying: { 2: -1 }, a_fall: { 2: 2 }, a_spring: { 0: 3, 1: 3 }, a_chess: { 0: 1 }, hn_baima: { 0: 1 }, hn_cuju: { 0: 1 },
    hn_jiaodi: { 2: 1 }, o_scholar: { 0: 1 }, r_rain: { 0: 1 }, r_letter: { 0: 2 }, a_fox2: { 0: 1 },
  };
  for (const id in QI_EV) {
    const e = EVENTS.find(x => x.id === id);
    if (!e || !Array.isArray(e.choices)) continue;
    for (const k in QI_EV[id]) if (e.choices[k]) e.choices[k] = withQi(e.choices[k], QI_EV[id][k]);
  }
  // 卡片 id → [選項序號, 'ok'/'no', 氣的增減]
  const QI_CARD = {
    c_tavern: [[2, 'ok', 1]], c_story: [[0, 'ok', 1], [2, 'ok', 1]], a_inn: [[2, 'ok', 2]], w_fall: [[2, 'ok', 1]], w_cave: [[2, 'ok', 1]],
    c_omen: [[1, 'ok', -1]], e_corvee: [[2, 'ok', -1]], c_orphan: [[1, 'ok', -1]], w_traveler: [[1, 'ok', -1], [2, 'ok', -1]], w_beast: [[1, 'ok', -1]],
    a_rainshrine: [[0, 'ok', 1]], w_lost: [[1, 'ok', -1]],
  };
  for (const id in QI_CARD) {
    const c = CARDS.find(x => x.id === id); if (!c || !c.opts) continue;
    for (const [i, key, d] of QI_CARD[id]) {
      const o = c.opts[i]; if (!o || !o[key]) continue;
      o[key] = o[key].slice(); o[key][1] = Object.assign({}, o[key][1] || {}, { qi: d });
    }
  }
  // 節慶：好好過節，心裡踏實
  for (const k of ['lantern', 'qixi']) {
    const f = FIXED[k], orig = f.choices;
    f.choices = s => orig(s).map((c, i) => i === 0 ? withQi(c, 1) : c);
  }
  { const f = FIXED.child; f.choices = f.choices.map((c, i) => i === 0 ? withQi(c, 2) : c); }
}
