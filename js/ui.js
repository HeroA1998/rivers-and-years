/* 江湖歲月錄 — 介面 */
'use strict';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function h(fn) { H.push(fn); return ` data-h="${H.length - 1}"`; }
function B(label, fn, cls = '', dis = false) { return `<button type="button" class="btn ${cls}"${dis ? ' disabled' : h(fn)}>${label}</button>`; }
function A(label, sub, fn, dis = false) { return `<button type="button" class="act"${dis ? ' disabled' : h(fn)}><b>${label}</b><small>${sub}</small></button>`; }
const bar = (v, m, cls) => `<span class="bar ${cls}"><i style="width:${clamp(m ? v / m * 100 : 0, 0, 100)}%"></i></span>`;
const art = (kind, seed, cls = '') => `<canvas class="art ${cls}" data-art="${kind}" data-seed="${esc(seed)}" width="640" height="300" aria-hidden="true"></canvas>`;
const TYPE_CLS = { '奇遇': 'gold', '戰鬥': 'seal', '戀愛': 'rose', '傳承': 'jade', '江湖': 'grey' };

function render() {
  H = [];
  const root = document.getElementById('app');
  const sc = document.querySelector('.sheet');
  const keep = sc && UI.ov && UI.ov.k === 'menu' ? sc.scrollTop : 0;
  let html = SCREENS[UI.screen]();
  if (UI.ov) html += overlay();
  if (toastMsg) { html += `<div class="toast" role="status">${toastMsg}</div>`; toastMsg = ''; }
  root.innerHTML = html;
  document.querySelectorAll('canvas.art').forEach(c => paintArt(c, c.dataset.art, c.dataset.seed));
  const bl = document.querySelector('.blog'); if (bl) bl.scrollTop = bl.scrollHeight;
  const ns = document.querySelector('.sheet'); if (ns && keep) ns.scrollTop = keep;
}

const SCREENS = {
  title() {
    const sv = loadSave();
    return `<div class="title-screen">
      ${art('peak', 'title', 'hero')}
      <h1>江湖歲月錄</h1>
      <p class="lead">十六歲入洛陽，一人一劍。拜師、修煉、結緣、傳承，寫你自己的武林春秋。</p>
      <div class="col">
        ${sv ? B(`繼續前緣<small>${esc(sv.name)}・${ERA}${sv.date.y === 1 ? '元' : cnNum(sv.date.y)}年</small>`, () => { S = sv; UI = { screen: 'game', tab: 'world', ov: null }; render(); }, 'primary big') : ''}
        ${B('初入江湖', () => { UI.screen = 'create'; UI.create = { name: '', gender: '男', origin: 0, stats: rollStats() }; render(); }, sv ? 'big' : 'primary big')}
      </div>
      <p class="ver">${VERSION}</p></div>`;
  },
  create() {
    const c = UI.create, o = ORIGINS[c.origin];
    const st = Object.assign({}, c.stats); for (const k in o.st) st[k] += o.st[k];
    return `<div class="create">
      <h2>${c.legacy ? `第${cnNum(c.legacy.gen + 1)}代傳人` : '初入江湖'}</h2>
      ${c.legacy ? `<p class="note">承襲自${esc(c.legacy.from)}：${SKILLS[c.legacy.skill.id].n}第${cnNum(c.legacy.skill.lv)}層、銀兩 ${c.legacy.silver}${c.legacy.weapon ? '、' + ITEMS[c.legacy.weapon].n : ''}${c.legacy.blood ? '、血脈天賦（悟性根骨各+1）' : ''}</p>` : ''}
      <label class="field" for="nm">姓名<input id="nm" maxlength="6" placeholder="例：沈孤雁" value="${esc(c.name)}" autocomplete="off"></label>
      <div class="field">性別<div class="row">${['男', '女'].map(g => B(g, () => { c.gender = g; render(); }, c.gender === g ? 'on' : '')).join('')}</div></div>
      <div class="field">出身</div>
      <div class="col">${ORIGINS.map((x, i) => `<button type="button" class="opt ${c.origin === i ? 'on' : ''}"${h(() => { c.origin = i; render(); })}><b>${x.n}</b><span>${x.d}</span></button>`).join('')}</div>
      <div class="field">天資 ${B('重擲', () => { c.stats = rollStats(); render(); }, 'mini')}</div>
      <div class="stats">${Object.keys(STAT_N).map(k => `<div><span>${STAT_N[k]}</span><b>${st[k]}</b><small>${STAT_D[k]}</small></div>`).join('')}</div>
      ${B('踏入洛陽城', () => { c.name = (document.getElementById('nm').value || '').trim() || (c.gender === '男' ? '沈孤雁' : '葉輕眉'); newGame(c, c.legacy); }, 'primary big')}
    </div>`;
  },
  game() {
    const L = LOCS[S.loc];
    return `<header class="top">
        <div class="date">${dateStr()}<span class="season">${season()}</span></div>
        <div class="who">${esc(S.name)}・${cnNum(age())}歲・${fameTitle()}　<span class="ver">${VERSION}</span></div>
      </header>
      <div class="scene">${art(L.art, S.loc + season())}<span class="place">${L.n}</span></div>
      <div class="vitals">
        <div><span>氣血</span>${bar(S.hp, maxHp(), 'hp')}<em>${S.hp}/${maxHp()}</em></div>
        <div><span>內力</span>${bar(S.mp, maxMp(), 'mp')}<em>${S.mp}/${maxMp()}</em></div>
        <div class="chips"><span>銀兩 <b>${S.silver}</b></span><span>聲望 <b>${S.fame}</b></span><span>${moralName()}</span></div>
      </div>
      <main>${TABS[UI.tab]()}</main>
      <nav class="tabs">${[['world', '江湖'], ['me', '人物'], ['skill', '武功'], ['bag', '行囊'], ['people', '人脈']].map(t => `<button type="button" class="${UI.tab === t[0] ? 'on' : ''}"${h(() => { UI.tab = t[0]; render(); window.scrollTo(0, 0); })}>${t[1]}</button>`).join('')}</nav>`;
  },
  end() {
    const e = UI.end;
    const heir = S.child ? `子女「${S.child}」` : S.disciple ? `弟子「${S.disciple.n}」` : null;
    return `<div class="ending">
      ${art('legacy', 'end', 'hero')}
      <p class="tag jade">${e.reason === '壽終' ? '壽終正寢' : '封劍歸隱'}・享年${cnNum(age())}</p>
      <h1>${e.title}</h1>
      <p class="story">${esc(S.name)}，${S.origin}。${e.text}</p>
      <div class="stats end-stats">
        <div><span>聲望</span><b>${S.fame}</b></div><div><span>勝場</span><b>${S.wins}</b></div><div><span>江湖評價</span><b>${e.score}</b></div>
        <div><span>門派</span><b>${S.sect ? SECTS[S.sect].n : '無門無派'}</b></div><div><span>伴侶</span><b>${S.spouse ? NPCS[S.spouse].n : '孑然一身'}</b></div><div><span>心性</span><b>${moralName()}</b></div>
      </div>
      <h3>傳承</h3>
      <p class="note">${heir ? `你的${heir}將繼承一門武功（層數減半）、三成積蓄與隨身兵刃。` : '你沒有傳人。多年後，一個有緣的後輩拾得你的遺冊（層數僅餘三成、積蓄一成）。'}選擇要傳下去的武功：</p>
      <div class="col">${e.best.map(id => `<button type="button" class="opt ${e.pick === id ? 'on' : ''}"${h(() => { e.pick = id; render(); })}><b>${SKILLS[id].n}</b><span>${TIER_N[SKILLS[id].tier]}${TYPE_N[SKILLS[id].type]}・第${cnNum(S.skills[id].lv)}層</span></button>`).join('')}</div>
      <div class="col">${B('薪火相傳，開啟下一代', inherit, 'primary big')}${B('回到標題', () => { S = null; UI = { screen: 'title', ov: null }; render(); }, 'big')}</div>
    </div>`;
  },
};

/* ---------- 分頁 ---------- */
const TABS = {
  world() {
    const L = LOCS[S.loc], k = L.kind;
    const logs = S.log.slice(-5).map(l => `<li><time>${l.t}</time>${l.s}</li>`).join('');
    let g = [];
    const common = A('修煉', '武功或體魄・十日', () => openMenu('train')) + A('趕路', '前往他處', () => openMenu('travel'));
    if (k === 'city') {
      g.push(['城中', A('客棧歇息', '三日・10 兩・全復', () => rest(3, 10, '在客棧好好歇了三日，氣血內力盡復。')) + A('露宿街頭', '三日・免費・復六成', roughSleep) + A('市集', '買賣物品', () => openMenu('shop')) + A('碼頭做工', '十日・賺銀兩', work) + A('酒樓打聽', '一日・5 兩・易遇事', gossip) + A('擂台比武', '二日・名利雙收', arena)]);
    } else if (k === 'wild') {
      g.push(['野外', A('歷練', '五日・多遇強敵', explore) + A('採藥', '五日', gather) + A('露宿休整', '五日・全復', () => rest(5, 0, '尋了處避風的山坳，休整五日。'))]);
    } else {
      const sc = SECTS[L.sect];
      if (S.sect === L.sect) {
        const canUp = S.rank < 3 && S.contribTotal >= RANK_NEED[S.rank + 1];
        g.push([`${sc.n}・${RANKS[S.rank]}`, A('門派任務', '十日・得貢獻', sectTask) + A('學藝', `貢獻 ${S.contrib}`, () => openMenu('learn')) + A('同門切磋', '二日・長進武功', spar) + A('晉升考核', S.rank >= 3 ? '已至長老' : `累計貢獻 ${S.contribTotal}/${RANK_NEED[S.rank + 1]}`, promote, !canUp) + A('回房歇息', '三日・全復', () => rest(3, 0, '在弟子房中歇息三日。'))]);
      } else {
        g.push([sc.n, `<p class="desc">${sc.d}<br>武學：${sc.style}　掌事：${sc.master}　入門條件：${sc.reqT}</p>` + (S.sect ? '' : A('拜師入門', `成為${sc.n}弟子`, () => joinSect(L.sect))) + A('借宿', '三日・10 兩・全復', () => rest(3, 10, `在${sc.n}的客舍借宿三日。`))]);
      }
      if (S.sect === 'baihua' || knows('bh_nei')) g[0][1] += A('煉藥', '草藥×3 → 金創藥', brew, (S.inv.herb || 0) < 3);
    }
    const here = Object.keys(NPCS).filter(id => NPCS[id].loc === S.loc && S.npcs[id] && S.npcs[id].met);
    if (here.length) g.push(['故人', here.map(id => {
      const n = S.npcs[id], kN = NPCS[id];
      let s = A(`拜訪${kN.n}`, `二日・好感 ${n.fav}`, () => visit(id)) + A(`贈禮`, `送給${kN.n}`, () => openMenu('gift', id), !Object.keys(S.inv).some(i => ITEMS[i].kind === 'gift'));
      if (n.stage === 3 && !S.spouse && S.flags.lover === id) s += A('提親', n.fav >= 95 ? '500 兩' : '好感須達 95', () => propose(id), n.fav < 95);
      return s;
    }).join('')]);
    g.push(['行止', common]);
    return `<p class="desc">${L.d}</p><ul class="log">${logs}</ul>` + g.map(x => `<section class="group"><h3>${x[0]}</h3><div class="acts">${x[1]}</div></section>`).join('');
  },
  me() {
    return `<section class="group"><h3>${esc(S.name)}</h3>
      <p class="desc">${S.gender}・${S.origin}・${cnNum(age())}歲${S.gen > 1 ? `・第${cnNum(S.gen)}代（承${esc(S.legacyFrom)}遺澤）` : ''}<br>
      稱號：${fameTitle()}　心性：${moralName()}（${S.moral}）<br>
      門派：${S.sect ? `${SECTS[S.sect].n}・${RANKS[S.rank]}` : '無門無派'}　戰績：${S.wins} 勝 ${S.losses} 負</p>
      <div class="stats">${Object.keys(STAT_N).map(k => `<div><span>${STAT_N[k]}</span><b>${S.stats[k]}</b><small>${STAT_D[k]}</small></div>`).join('')}</div></section>
      <section class="group"><h3>去留</h3><div class="acts">
        ${A('歸隱江湖', '結算一生並傳承', () => confirmBox('封劍歸隱？', '這一世的故事將就此結算，你可以選一門武功傳給後人，開啟下一代。', () => retire('歸隱')))}
        ${S.sect ? A('叛出師門', '聲望-40', () => confirmBox('叛出師門？', `你將離開${SECTS[S.sect].n}，失去身分與貢獻，已學會的武功仍在。`, leaveSect)) : ''}
        ${A('重新開始', '刪除存檔', () => confirmBox('刪除存檔？', '目前的進度將無法復原。', () => { wipeSave(); S = null; UI = { screen: 'title', ov: null }; render(); }))}
      </div></section>`;
  },
  skill() {
    const ids = Object.keys(S.skills).sort((a, b) => Object.keys(TYPE_N).indexOf(SKILLS[a].type) - Object.keys(TYPE_N).indexOf(SKILLS[b].type) || SKILLS[b].tier - SKILLS[a].tier);
    return `<p class="desc">主修內功決定內力屬性：與招式屬性相合則威力大增，陰陽相沖則打折。備戰外功最多兩門。</p>` + ids.map(id => {
      const k = SKILLS[id], sk = S.skills[id];
      const on = k.type === 'nei' ? S.nei === id : S.eq.includes(id);
      let ctl = '';
      if (k.type === 'nei') ctl = on ? '<span class="tag jade">主修</span>' : B('設為主修', () => { S.nei = id; S.hp = Math.min(S.hp, maxHp()); S.mp = Math.min(S.mp, maxMp()); save(); render(); }, 'mini');
      else if (k.type !== 'qing') ctl = on ? B('卸下', () => { if (S.eq.length > 1) S.eq = S.eq.filter(x => x !== id); else toast('至少要備戰一門外功'); save(); render(); }, 'mini on') : B('備戰', () => { if (S.eq.length >= 2) S.eq.shift(); S.eq.push(id); save(); render(); }, 'mini');
      const detail = k.type === 'nei' ? `每層 氣血+${k.hp} 內力+${k.mp}${k.heal ? '・療傷效果提升' : ''}${k.evil ? '・每升一層俠義-3' : ''}`
        : k.type === 'qing' ? `每層 閃避+${k.dodge}`
        : k.moves.map(m => `<span class="${sk.lv >= m[1] ? '' : 'locked'}">${m[0]}${m[4] ? `〔${FX_N[m[4]]}〕` : ''}${sk.lv >= m[1] ? '' : `（${m[1]}層）`}</span>`).join('、');
      return `<article class="card"><div class="card-h"><b>${k.n}</b><span class="tag ${k.tier === 3 ? 'gold' : 'grey'}">${TIER_N[k.tier]}${TYPE_N[k.type]}・${ATTR_N[k.attr]}</span>${ctl}</div>
        <div class="lvrow">第${cnNum(sk.lv)}層 ${sk.lv >= 10 ? '<em>圓滿</em>' : bar(sk.exp, xpNeed(sk.lv, k.tier), 'xp') + `<em>${sk.exp}/${xpNeed(sk.lv, k.tier)}</em>`}</div>
        <p>${k.d}</p><p class="moves">${detail}</p></article>`;
    }).join('');
  },
  bag() {
    const ids = Object.keys(S.inv);
    return `<p class="desc">兵刃：${S.weapon ? `${ITEMS[S.weapon].n}（${TYPE_N[ITEMS[S.weapon].wt]}威力+${ITEMS[S.weapon].atk}，僅對同類武功有效）` : '空手'}<br>護甲：${S.armor ? `${ITEMS[S.armor].n}（防禦+${ITEMS[S.armor].def}）` : '布衣'}</p>` +
      (ids.length ? ids.map(id => {
        const it = ITEMS[id];
        const eqd = S.weapon === id || S.armor === id;
        const lab = { med: '服用', tonic: '服用', manual: '研讀', weapon: eqd ? '卸下' : '裝備', armor: eqd ? '卸下' : '穿上' }[it.kind];
        const d = it.d || (it.kind === 'weapon' ? `${TYPE_N[it.wt]}威力+${it.atk}` : it.kind === 'armor' ? `防禦+${it.def}` : `可習得${SKILLS[it.skill].n}`);
        return `<article class="card row-card"><div><b>${it.n}</b> ×${S.inv[id]} ${eqd ? '<span class="tag jade">使用中</span>' : ''}<p>${d}</p></div>${lab ? B(lab, () => useItem(id), 'mini') : ''}</article>`;
      }).join('') : '<p class="empty">行囊空空如也。</p>');
  },
  people() {
    const met = Object.keys(NPCS).filter(id => S.npcs[id] && S.npcs[id].met);
    let s = met.map(id => {
      const k = NPCS[id], n = S.npcs[id];
      const st = S.spouse === id ? '結髮' : ['相識', '初識', '相知', '定情'][n.stage];
      return `<article class="card"><div class="card-h"><b>${k.n}</b><span class="tag rose">${st}</span><span class="tag grey">${LOCS[k.loc].n}</span></div>
        <div class="lvrow">好感 ${bar(n.fav, 100, 'fav')}<em>${n.fav}/100</em></div><p>${k.title}。${k.d}</p></article>`;
    }).join('');
    if (met.length < Object.keys(NPCS).length) s += `<p class="empty">江湖上還有 ${Object.keys(NPCS).length - met.length} 位有緣人尚未相遇。多去各地走走，在酒樓打聽消息。</p>`;
    let fam = '';
    if (S.spouse) fam += `<p>伴侶：${NPCS[S.spouse].n}</p>`;
    if (S.child) fam += `<p>子女：${S.child}</p>`;
    if (S.disciple) fam += `<p>弟子：${S.disciple.n}${S.disciple.done ? '（已出師）' : '（學藝中）'}</p>`;
    if (S.rival) fam += `<p>對手：秦昭（已交手 ${S.rival} 次）</p>`;
    return (fam ? `<section class="group"><h3>親近之人</h3><div class="desc">${fam}</div></section>` : '') + `<section class="group"><h3>情緣</h3>${s}</section>`;
  },
};

/* ---------- 浮層 ---------- */
function openMenu(m, arg) { UI.ov = { k: 'menu', m, arg }; render(); }
function confirmBox(title, text, yes) { UI.ov = { k: 'menu', m: 'confirm', title, text, yes }; render(); }
const closeMenu = () => { UI.ov = null; save(); render(); };

const MENUS = {
  travel: () => ['前往何處', Object.keys(LOCS).filter(id => id !== S.loc).sort((a, b) => travelDays(a) - travelDays(b)).map(id =>
    `<button type="button" class="opt"${h(() => travel(id))}><b>${LOCS[id].n}<i>${cnNum(travelDays(id))}日</i></b><span>${LOCS[id].d}</span></button>`).join('')],
  train: () => {
    const sk = Object.keys(S.skills).map(id => { const k = SKILLS[id], s = S.skills[id]; return `<button type="button" class="opt"${s.lv >= 10 ? ' disabled' : h(() => train(id))}><b>${k.n}<i>${TYPE_N[k.type]}・第${cnNum(s.lv)}層</i></b><span>${s.lv >= 10 ? '已臻圓滿' : `進度 ${s.exp}/${xpNeed(s.lv, k.tier)}　每次約 +${Math.round((40 + S.stats.int * 5))}`}</span></button>`; }).join('');
    const dr = ['str', 'con', 'agi', 'int'].map(k => `<button type="button" class="opt"${S.stats[k] >= 20 ? ' disabled' : h(() => drill(k))}><b>鍛鍊${STAT_N[k]}<i>現為 ${S.stats[k]}</i></b><span>進度 ${S.drill[k] || 0}/${S.stats[k] * 25}　每次 +50</span></button>`).join('');
    return ['修煉十日', `<h4>武功</h4>${sk}<h4>體魄</h4>${dr}`];
  },
  shop: () => {
    const buy = SHOPS[S.loc].map(id => { const it = ITEMS[id]; const d = it.d || (it.kind === 'weapon' ? `${TYPE_N[it.wt]}威力+${it.atk}` : it.kind === 'armor' ? `防禦+${it.def}` : `可習得${SKILLS[it.skill].n}`);
      return `<article class="card row-card"><div><b>${it.n}</b> <span class="price">${it.price} 兩</span><p>${d}${S.inv[id] ? `・已有 ${S.inv[id]}` : ''}</p></div>${B('買', () => { S.silver -= it.price; addItem(id); render(); }, 'mini', S.silver < it.price)}</article>`; }).join('');
    const sell = Object.keys(S.inv).filter(id => id !== S.weapon && id !== S.armor).map(id => { const it = ITEMS[id]; const p = Math.max(5, Math.round((it.price || 400) * 0.5));
      return `<article class="card row-card"><div><b>${it.n}</b> ×${S.inv[id]} <span class="price">${p} 兩</span></div>${B('賣', () => { S.silver += p; addItem(id, -1); render(); }, 'mini')}</article>`; }).join('');
    return [`市集　銀兩 ${S.silver}`, `<h4>買入</h4>${buy}<h4>賣出</h4>${sell || '<p class="empty">沒有可賣的東西。</p>'}`];
  },
  learn: () => {
    const sc = SECTS[S.sect];
    return [`${sc.n}學藝　貢獻 ${S.contrib}`, sc.teach.map(t => { const k = SKILLS[t[0]]; const got = knows(t[0]); const ok = S.rank >= t[1];
      return `<article class="card row-card"><div><b>${k.n}</b> <span class="tag grey">${TIER_N[k.tier]}${TYPE_N[k.type]}・${ATTR_N[k.attr]}</span><p>${k.d}<br>需${RANKS[t[1]]}・貢獻 ${t[2]}</p></div>${got ? '<span class="tag jade">已學</span>' : B('學', () => learnSect(t[0], t[2]), 'mini', !ok || S.contrib < t[2])}</article>`; }).join('') +
      (sc.ult ? `<p class="empty">鎮派絕學「${SKILLS[sc.ult].n}」只傳掌門。升至長老、累計貢獻一千、聲望三百後，留在山門靜候機緣。</p>` : '')];
  },
  gift: () => { const id = UI.ov.arg; return [`贈禮給${NPCS[id].n}`, Object.keys(S.inv).filter(i => ITEMS[i].kind === 'gift').map(i => `<button type="button" class="opt"${h(() => gift(id, i))}><b>${ITEMS[i].n}<i>×${S.inv[i]}</i></b></button>`).join('')]; },
  confirm: () => { const o = UI.ov; return [o.title, `<p class="desc">${o.text}</p><div class="col">${B('確定', () => { UI.ov = null; o.yes(); }, 'primary big')}</div>`]; },
};

function overlay() {
  const o = UI.ov;
  if (o.k === 'menu') {
    const [title, body] = MENUS[o.m]();
    return `<div class="veil"><div class="sheet"><div class="sheet-h"><h2>${title}</h2>${B('關閉', closeMenu, 'mini')}</div>${body}</div></div>`;
  }
  if (o.k === 'event') {
    return `<div class="veil"><div class="sheet event">
      ${art(o.art || (o.type === '戰鬥' ? 'fight' : o.type === '戀愛' ? 'love' : o.type === '傳承' ? 'legacy' : 'road'), o.title)}
      <p class="tag ${TYPE_CLS[o.type] || 'grey'}">${o.type}事件</p><h2>${o.title}</h2>
      ${o.result ? `<p class="story">${o.result}</p><div class="col">${B('繼續', closeEvent, 'primary big')}</div>`
        : `<p class="story">${o.text}</p><div class="col">${o.choices.map((c, i) => B(c.t, () => choose(i), 'choice')).join('')}</div>`}
    </div></div>`;
  }
  // 戰鬥
  const e = o.e, mv = pMoves();
  const fx = [o.fx.bleed ? '流血' : '', o.fx.poison ? '中毒' : '', o.fx.stun ? '震暈' : '', o.fx.weak ? '破勢' : ''].filter(Boolean).map(x => `<span class="tag seal">${x}</span>`).join('');
  let ctl;
  if (o.over) ctl = `<div class="col">${B(o.over === 'win' ? '收招' : '繼續', endBattle, 'primary big')}</div>`;
  else if (o.sub === 'med') {
    const meds = Object.keys(S.inv).filter(i => ITEMS[i].kind === 'med');
    ctl = `<div class="moves-grid">${meds.map(i => `<button type="button" class="mv"${h(() => pUse(i))}><b>${ITEMS[i].n} ×${S.inv[i]}</b><small>${ITEMS[i].d}</small></button>`).join('') || '<p class="empty">沒有丹藥了。</p>'}</div><div class="row4">${B('返回', () => { o.sub = null; render(); }, 'mini')}</div>`;
  } else ctl = `<div class="moves-grid">${mv.map(m => `<button type="button" class="mv"${S.mp < m.mp ? ' disabled' : h(() => pAttack(m))}><b>${m.n}</b><small>${m.mp ? `內力 ${m.mp}` : '不耗內力'}${m.fx ? '・' + FX_N[m.fx] : ''}</small></button>`).join('')}</div>
      <div class="row4">${B('守勢', pGuard, 'mini')}${B('調息', pHeal, 'mini', S.mp < 12)}${B('用藥', () => { o.sub = 'med'; render(); }, 'mini')}${B('脫身', pFlee, 'mini', !!o.noFlee)}</div>`;
  return `<div class="veil"><div class="sheet battle">
    <p class="tag seal">戰鬥・第${cnNum(o.round)}回合</p>
    <div class="foe"><b>${e.n}</b>${fx}${bar(e.hp, e.mhp, 'hp')}<em>${Math.max(0, e.hp)}/${e.mhp}</em></div>
    <ol class="blog">${o.log.slice(-14).map(l => `<li>${l}</li>`).join('')}</ol>
    <div class="vitals in-battle">
      <div><span>氣血</span>${bar(S.hp, maxHp(), 'hp')}<em>${Math.max(0, S.hp)}/${maxHp()}</em></div>
      <div><span>內力</span>${bar(S.mp, maxMp(), 'mp')}<em>${S.mp}/${maxMp()}</em></div>
    </div>${ctl}</div></div>`;
}

/* ---------- 啟動 ---------- */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-h]');
  if (!b || b.disabled) return;
  const fn = H[+b.dataset.h];
  if (fn) fn();
});
document.addEventListener('input', ev => { if (ev.target.id === 'nm' && UI.create) UI.create.name = ev.target.value; });
try {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', () => render());
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
} catch (e) { /* 主題監聽不可用時略過 */ }
render();
