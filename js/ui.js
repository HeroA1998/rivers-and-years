/* 江湖歲月錄 — 介面 */
'use strict';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function h(fn) { H.push(fn); return ` data-h="${H.length - 1}"`; }
function B(label, fn, cls = '', dis = false) { return `<button type="button" class="btn ${cls}"${dis ? ' disabled' : h(fn)}>${label}</button>`; }
function A(label, sub, fn, dis = false) { return `<button type="button" class="act"${dis ? ' disabled' : h(fn)}><b>${label}</b><small>${sub}</small></button>`; }
const bar = (v, m, cls) => `<span class="bar ${cls}"><i style="width:${clamp(m ? v / m * 100 : 0, 0, 100)}%"></i></span>`;
const art = (kind, seed, cls = '') => ART[kind]
  ? `<img class="art ${cls}" src="${(window.ART_INLINE || {})[kind] || `assets/art/${kind}.jpg`}" width="800" height="375" alt="${esc(ART[kind].t)}">`
  : `<canvas class="art ${cls}" data-art="${kind}" data-seed="${esc(seed)}" width="640" height="300" aria-hidden="true"></canvas>`;
const face = (id, cls = '') => FACES.includes(id) ? `<img class="face ${cls}" src="${(window.FACE_INLINE || {})[id] || `assets/chars/${id}.webp`}" width="300" height="400" alt="">` : '';
const TYPE_CLS = { '身世': 'jade', '歷史': 'gold', '奇緣': 'jade', '主線': 'seal', '奇遇': 'gold', '戰鬥': 'seal', '戀愛': 'rose', '傳承': 'jade', '江湖': 'grey' };

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
  const bl = document.querySelector('.blog:not(.recap)'); if (bl) bl.scrollTop = bl.scrollHeight;
  const ns = document.querySelector('.sheet'); if (ns && keep) ns.scrollTop = keep;
}

const SCREENS = {
  title() {
    const sv = loadSave();
    return `<div class="title-screen">
      ${art('title', 'title', 'hero')}
      <h1>江湖歲月錄</h1>
      <p class="lead">你不是郭靖，也不是張無忌。你只是那個年代裡的一個江湖人——親眼看著傳說發生，也過著自己的一生。</p>
      <div class="col">
        ${sv ? B(`繼續前緣<small>${esc(sv.name)}・${reign((sv.y0 || 1222) + sv.date.y - 1)}</small>`, () => { S = migrate(sv); recalc(); UI = { screen: 'game', tab: 'world', ov: null }; render(); }, 'primary big') : ''}
        ${B('初入江湖', () => { UI.screen = 'create'; UI.create = { name: '', gender: '男', origin: 0, stats: rollStats(), year: ERAS[0].y }; render(); }, sv ? 'big' : 'primary big')}
      </div>
      <p class="ver">${VERSION}</p></div>`;
  },
  create() {
    const c = UI.create, st = c.stats;
    return `<div class="create">
      <h2>${c.legacy ? `第${cnNum(c.legacy.gen + 1)}代傳人` : '初入江湖'}</h2>
      ${c.legacy ? `<p class="note">承襲自${esc(c.legacy.from)}：${SKILLS[c.legacy.skill.id].n}第${cnNum(c.legacy.skill.lv)}層、銀兩 ${c.legacy.silver}${c.legacy.weapon ? '、' + ITEMS[c.legacy.weapon].n : ''}${c.legacy.blood ? '、血脈天賦（悟性根骨各+1）' : ''}</p>` : ''}
      <div class="field">年代</div>
      <div class="col">${eraOptions(c).map(x => `<button type="button" class="opt ${c.year === x.y ? 'on' : ''}"${h(() => { c.year = x.y; render(); })}><b>${x.n}<i>${reign(x.y)}・${x.y}年</i></b><span>${x.d}</span></button>`).join('')}</div>
      <label class="field" for="nm">姓名<input id="nm" maxlength="6" placeholder="例：沈孤雁" value="${esc(c.name)}" autocomplete="off"></label>
      <div class="field">性別<div class="row">${['男', '女'].map(g => B(g, () => { c.gender = g; render(); }, c.gender === g ? 'on' : '')).join('')}</div></div>
      <p class="note">出身由天：投胎到什麼人家、生在哪裡，要等踏入江湖才知道。不同出身另有天資加成。</p>
      <div class="field">天資 ${B('重擲', () => { c.stats = rollStats(); render(); }, 'mini')}</div>
      <div class="stats">${Object.keys(STAT_N).map(k => `<div><span>${STAT_N[k]}</span><b>${st[k]}</b><small>${STAT_D[k]}</small></div>`).join('')}</div>
      ${B('踏入江湖', () => { c.name = (document.getElementById('nm').value || '').trim() || (c.gender === '男' ? '沈孤雁' : '葉輕眉'); newGame(c, c.legacy); }, 'primary big')}
    </div>`;
  },
  game() {
    const L = LOCS[S.loc];
    if (UI.tab === 'skill' || UI.tab === 'people') { UI.sub = UI.tab; UI.tab = 'me'; }
    if (!TABS[UI.tab] || UI.tab === 'status') UI.tab = 'world';
    return `<header class="top">
        <div class="date">${dateStr()}<span class="season">${season()}</span></div>
        ${B('⚙ 設定', () => openMenu('settings'), 'mini gear')}
        <div class="who">${esc(S.name)}・${cnNum(age())}歲・${fameTitle()}</div>
      </header>
      <div class="scene">${art(L.art, S.loc + season())}<span class="place">${L.n}</span></div>
      <div class="vitals">
        <div><span>氣血</span>${bar(S.hp, maxHp(), 'hp')}<em>${S.hp}/${maxHp()}</em></div>
        <div><span>內力</span>${bar(S.mp, maxMp(), 'mp')}<em>${S.mp}/${maxMp()}</em></div>
        <div><span>Lv ${S.lv}</span>${bar(S.exp, expNeed(S.lv), 'xp')}<em>${S.exp}/${expNeed(S.lv)}</em></div>
        ${statRow()}
        <div class="chips"><span>銀兩 <b>${S.silver}</b></span><span>聲望 <b>${S.fame}</b></span><span>${moralName()}</span>${S.pts ? `<span class="hot">屬性點 ${S.pts}</span>` : ''}</div>
      </div>
      <main>${TABS[UI.tab]()}</main>
      <nav class="tabs">${[['world', '江湖'], ['me', '人物'], ['bag', '行囊']].map(t => `<button type="button" class="${UI.tab === t[0] ? 'on' : ''}"${h(() => { UI.tab = t[0]; render(); window.scrollTo(0, 0); })}>${t[1]}</button>`).join('')}</nav>`;
  },
  end() {
    const e = UI.end;
    const heir = S.child ? `子女「${S.child}」` : S.disciple ? `弟子「${S.disciple.n}」` : null;
    return `<div class="ending">
      ${art('end', 'end', 'hero')}
      <p class="tag jade">${e.reason === '壽終' ? '壽終正寢' : '封劍歸隱'}・享年${cnNum(age())}</p>
      <h1>${e.title}</h1>
      <p class="story">${esc(S.name)}，${S.birth || S.origin}。${e.text}</p>
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
const statRow = () => `<div class="statrow">${Object.keys(STAT_N).map(k => `<span><i>${STAT_N[k]}</i><b>${S.stats[k]}</b>${S.bonus && S.bonus[k] ? `<small>+${S.bonus[k]}</small>` : ''}</span>`).join('')}</div>`;
function eraOptions(c) {
  const out = [];
  if (c.legacy) out.push({ y: c.legacy.year, n: '承接上一代', d: `緊接著${c.legacy.from}歸隱的第二年。江湖上的人和事，都還記得${c.legacy.from}。` });
  for (const e of ERAS) if (!c.legacy || e.y > c.legacy.year + 5) out.push(c.legacy ? Object.assign({}, e, { n: `${e.n}（數十年後的後人）` }) : e);
  return out;
}
const SUBS = [['status', '狀態'], ['skill', '武功'], ['people', '人脈']];
const TABS = {
  me() {
    const sub = SUBS.some(x => x[0] === UI.sub) ? UI.sub : 'status';
    return `<div class="seg">${SUBS.map(x => `<button type="button" class="${sub === x[0] ? 'on' : ''}"${h(() => { UI.sub = x[0]; render(); window.scrollTo(0, 0); })}>${x[1]}</button>`).join('')}</div>` + TABS[sub]();
  },
  world() {
    const logs = S.log.slice(-6).map(l => `<li><time>${l.t}</time>${l.s}</li>`).join('');
    const rum = histRumors(720);
    const quest = `<section class="quest"><span class="tag seal">江湖風聞</span><h3>${reign(ad())}（${ad()}年）</h3>${rum.length ? rum.map(x => `<small class="rum${x.now ? ' now' : ''}"><b>${x.when}・${x.where}</b>${x.now ? '　正在發生！' : ''}<br>${x.h.rumor}</small>`).join('') : '<p>眼下江湖上沒有什麼大消息。在城裡的酒樓茶肆，比較容易聽到風聲。</p>'}${chainHints().map(c => `<small class="side"><span class="tag jade">奇緣</span> ${c.title}：${c.hint}</small>`).join('')}</section>`;
    const ng = nextGoal();
    const guide = `<section class="guide"><span class="tag jade">下一步</span><h3>${ng.title}</h3><p>${ng.desc}</p>${ng.note ? `<small>${ng.note}</small>` : ''}<div class="col">${ng.acts.map(a => B(a[0], a[1], 'primary big')).join('')}</div></section>`;
    return guide + `<p class="desc">${LOCS[S.loc].d}</p>` + quest + `<ul class="log">${logs}</ul>`;
  },
  status() {
    return `<section class="group"><h3>${esc(S.name)}・Lv ${S.lv}</h3>
      <p class="desc">${S.gender}・${S.birth || S.origin}・${cnNum(age())}歲${S.gen > 1 ? `・第${cnNum(S.gen)}代（承${esc(S.legacyFrom)}遺澤）` : ''}<br>
      稱號：${fameTitle()}　心性：${moralName()}（${S.moral}）<br>
      門派：${S.sect ? `${SECTS[S.sect].n}・${RANKS[S.rank]}・貢獻 ${S.contrib}` : '無門無派'}　戰績：${S.wins} 勝 ${S.losses} 負<br>
      戰力 ${Math.round(power())}　閃避 ${Math.round(pDodge())}　防禦 ${Math.round(pDef())}</p>
      <div class="stats">${Object.keys(STAT_N).map(k => `<div><span>${STAT_N[k]}</span><b>${S.stats[k]}</b><small>本身 ${S.base[k]}${S.bonus[k] ? `　裝備 +${S.bonus[k]}` : ''}<br>${STAT_D[k]}</small></div>`).join('')}</div>
      <p class="desc">能力值只會因為升級配點、故事中的遭遇，以及裝備的兵刃、護甲、飾品與武功而改變。</p></section>`;
  },
  skill() {
    const ids = Object.keys(S.skills).sort((a, b) => (S.eq.includes(b) - S.eq.includes(a)) || ['atk', 'sup', 'nei', 'qing'].indexOf(artRole(a)) - ['atk', 'sup', 'nei', 'qing'].indexOf(artRole(b)) || SKILLS[b].tier - SKILLS[a].tier);
    const cb = activeCombo();
    const slots = `<section class="group"><h3>武學裝備 ${S.eq.length}/${EQ_MAX}</h3><div class="slots">${[0, 1, 2, 3, 4].map(i => { const id = S.eq[i]; return id ? `<div class="slot r-${artRole(id)}"><i>${ROLE_N[artRole(id)]}</i><b>${SKILLS[id].n}</b><small>${artRole(id) === 'atk' ? `攻擊 ${artAtk(id)}` : `第${cnNum(S.skills[id].lv)}層`}</small></div>` : '<div class="slot empty"><i>空</i><b>—</b><small>未裝備</small></div>'; }).join('')}</div>
      <p class="desc">${S.nei ? `主修內功：${SKILLS[S.nei].n}（${ATTR_N[SKILLS[S.nei].attr]}）——與招式屬性相合則威力大增。` : '沒有裝備內功：氣血內力較少，出招也沒有內力加成。'}${cb ? `<br>武功組合：<b>${cb.n}</b>，威力 +${Math.round(cb.mul * 100 - 100)}%。` : ''}<br>每門裝備中的武功依類別加能力值（入門 +1、上乘 +2、絕學 +3）；只有裝備中的武功會在實戰中長進。</p></section>`;
    return slots + ids.map(id => {
      const k = SKILLS[id], sk = S.skills[id], r = artRole(id), on = S.eq.includes(id), st = artSt(id), fx = artFxText(id);
      const ctl = on ? B('卸下', () => unequipArt(id), 'mini on') : B('裝備', () => equipArt(id), 'mini', S.eq.length >= EQ_MAX);
      const stat = Object.keys(st).map(x => `${STAT_N[x]}+${st[x]}`).join('、');
      const detail = k.type === 'nei' ? `每層 氣血+${k.hp} 內力+${k.mp}${k.evil ? '・每升一層俠義-3' : ''}`
        : k.type === 'qing' ? `每層 閃避+${k.dodge}`
        : r === 'sup' ? '不出招，只提供戰鬥效果'
        : k.moves.map(m => `<span class="${sk.lv >= m[1] ? '' : 'locked'}">${m[0]}${m[4] ? `〔${FX_N[m[4]]}〕` : ''}${sk.lv >= m[1] ? '' : `（${m[1]}層）`}</span>`).join('、');
      return `<article class="card${on ? ' equipped' : ''}"><div class="card-h"><b>${k.n}</b><span class="tag r-${r}">${ROLE_N[r]}</span><span class="tag ${k.tier === 3 ? 'gold' : 'grey'}">${TIER_N[k.tier]}${TYPE_N[k.type]}・${ATTR_N[k.attr]}</span>${ctl}</div>
        <div class="lvrow">第${cnNum(sk.lv)}層 ${sk.lv >= 10 ? '<em>圓滿</em>' : bar(sk.exp, xpNeed(sk.lv, k.tier), 'xp') + `<em>${sk.exp}/${xpNeed(sk.lv, k.tier)}</em>`}</div>
        <p class="props">${r === 'atk' ? `<span>攻擊力 <b>${artAtk(id)}</b></span>` : ''}<span>裝備加成 <b>${stat}</b></span>${fx ? `<span>效果 <b>${fx}</b></span>` : ''}</p>
        <p>${k.d}</p><p class="moves">${detail}</p></article>`;
    }).join('');
  },
  bag() {
    const ids = Object.keys(S.inv);
    const stx = it => Object.keys(it.st || {}).map(k => `${STAT_N[k]}+${it.st[k]}`).join('、');
    const desc = it => it.d || (it.kind === 'weapon' ? `${TYPE_N[it.wt]}威力+${it.atk}（僅對同類武功有效）` : it.kind === 'armor' ? `防禦+${it.def}` : it.kind === 'acc' ? '飾品' : it.kind === 'manual' ? `可習得${SKILLS[it.skill].n}` : '');
    const slot = (n, id) => `<div><span>${n}</span><b>${id ? ITEMS[id].n : '—'}</b><small>${id ? [desc(ITEMS[id]), stx(ITEMS[id])].filter(Boolean).join('・') : '未裝備'}</small></div>`;
    return `<section class="group"><h3>裝備</h3><div class="stats gear">${slot('兵刃', S.weapon)}${slot('護甲', S.armor)}${slot('飾品', S.acc)}</div><p class="desc">兵刃、護甲、飾品在路上的市集、鐵匠舖、貨郎那裡買得到，也可能在奇遇裡得到。</p></section>` +
      (ids.length ? ids.map(id => {
        const it = ITEMS[id];
        const eqd = S.weapon === id || S.armor === id || S.acc === id;
        const lab = { med: '服用', tonic: '服用', manual: '研讀', weapon: eqd ? '卸下' : '裝備', armor: eqd ? '卸下' : '穿上', acc: eqd ? '卸下' : '戴上' }[it.kind];
        return `<article class="card row-card"><div><b>${it.n}</b> ×${S.inv[id]} ${eqd ? '<span class="tag jade">使用中</span>' : ''}<p>${[desc(it), stx(it)].filter(Boolean).join('・')}</p></div>${lab ? B(lab, () => useItem(id), 'mini') : ''}</article>`;
      }).join('') : '<p class="empty">行囊空空如也。</p>');
  },
  people() {
    const met = Object.keys(NPCS).filter(id => S.npcs[id] && S.npcs[id].met);
    let s = met.map(id => {
      const k = NPCS[id], n = S.npcs[id];
      const st = S.spouse === id ? '結髮' : ['相識', '初識', '相知', '定情'][n.stage];
      return `<article class="card has-face">${face(id)}<div class="card-h"><b>${k.n}</b><span class="tag rose">${st}</span><span class="tag grey">${LOCS[k.loc].n}</span></div>
        <div class="lvrow">好感 ${bar(n.fav, 100, 'fav')}<em>${n.fav}/100</em></div><p>${k.title}。${k.d}</p></article>`;
    }).join('');
    if (met.length < Object.keys(NPCS).length) s += `<p class="empty">江湖上還有 ${Object.keys(NPCS).length - met.length} 位有緣人尚未相遇。歷練時走到不同的地方，自然會遇上。</p>`;
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

const CRED_HTML = () => {
  const list = Object.keys(ART).map(k => `<li><a href="${ART[k].u}" target="_blank" rel="noopener">${esc(ART[k].t)}</a><span>${esc(ART[k].by)}</span></li>`).join('');
  return `<p class="desc">場景圖取自克里夫蘭美術館開放典藏的中國古畫，授權為 CC0 公有領域，經裁切使用。<br>歷史事件改寫自金庸小說，年份大致依網路流傳的大事年表，文字為本作重寫。<br>人物立繪由 <a href="https://linxuelian.itch.io" target="_blank" rel="noopener">LinXueLian</a> 手繪（linxuelian.itch.io），授權為 CC BY-SA 4.0，經合成與裁切使用。</p><ul class="credits">${list}</ul>`;
};
const MENUS = {
  confirm: () => { const o = UI.ov; return [o.title, `<p class="desc">${o.text}</p><div class="col">${B('確定', () => { UI.ov = null; o.yes(); }, 'primary big')}</div>`]; },
};


const REF_TABS = [['codex', '武學圖鑑'], ['arms', '神兵譜'], ['journal', '江湖記事'], ['timeline', '大事年表'], ['help', '玩法說明'], ['credits', '美術出處']];
const REF = {
  codex: () => {
    const all = Object.keys(SKILLS), mine = Object.keys(S.skills);
    return `<p class="desc">已習得 ${mine.length} 門，江湖上共有 ${all.length} 門武功。各派的武功要拜師才學得到，書中名家的武功要靠奇遇，鎮派絕學由掌門親傳。</p>
      <div class="codex">${Object.keys(TYPE_N).map(t => { const ks = all.filter(id => SKILLS[id].type === t); return `<div><b>${TYPE_N[t]}</b><span>${ks.filter(id => S.skills[id]).length}/${ks.length}</span></div>`; }).join('')}</div>
      <h4>已習得</h4><p class="desc">${mine.map(id => SKILLS[id].n).join('、') || '尚無'}</p>`;
  },
  arms: () => `<p class="desc">傳說中的神兵利器，旁觀者拿不到，親眼見過就記在這裡。</p><div class="col">${LEGEND_ARMS.map(a => { const seen = (S.hist || {})[a.hist] === 'seen'; return `<article class="card"><div class="card-h"><b>${seen ? a.n : '？？？'}</b><span class="tag ${seen ? 'gold' : 'grey'}">${seen ? '親眼見過' : '未曾得見'}</span></div><p>${seen ? a.d : '要在它出現的那一天，人在現場。'}</p></article>`; }).join('')}</div>`,
  journal: () => `<p class="desc">親眼目睹 ${histCount('seen')} 件・事後耳聞 ${histCount('heard')} 件</p>${(S.journal || []).length ? `<ul class="log journal">${S.journal.slice().reverse().map(j => `<li><time>${j.t}・${j.ch}</time>${j.s}</li>`).join('')}</ul>` : '<p class="empty">故事才剛開始。</p>'}`,
  timeline: () => {
    const rows = HIST.filter(h => (S.hist || {})[h.id] === 'seen' || (S.hist || {})[h.id] === 'heard').sort((a, b) => hStart(a) - hStart(b));
    return `<p class="desc">只列出你親眼見過或聽說過的事。還沒發生、沒打聽到的，不會顯示。</p>` + (rows.length ? `<ul class="log journal">${rows.map(h => `<li><time>${reign(h.y)}${MONTH_N[h.m]}${h.d ? cnDay(h.d) : ''}・${S.hist[h.id] === 'seen' ? '親見' : '耳聞'}</time>${h.news}</li>`).join('')}</ul>` : '<p class="empty">還沒有。</p>');
  },
  help: () => `<div class="help">
      <h4>怎麼玩</h4><p>唯一的主行動是「歷練」：按一次過約一個月，路上會遇到各種事。拜師、學藝、晉升、買賣、情緣、奇遇，全都在事件裡發生。</p>
      <h4>三條路</h4><p>每件事都有三個選項：正派行動、反派行動、無視或拒絕。正派讓人敬重，反派往往有立即的好處，但會讓俠義一路往下掉，名門正派也會看不起你。有些選項要擲 d20 檢定能力值。</p>
      <h4>能力值與等級</h4><p>能力值只會因為升級配點、故事中的遭遇，以及裝備改變。事件與戰鬥給閱歷，升一級得三點屬性點數，由你自己分配。</p>
      <h4>武功即裝備</h4><p>最多裝備五門武功。攻擊類提供招式與攻擊力；內功決定氣血內力與內力屬性；身法提高閃避；輔助類不出招，只給看破、減傷、反震、回血等效果。每門裝備中的武功還會依類別加能力值。只有裝備中的武功會在實戰中長進。</p>
      <h4>戰鬥</h4><p>一局定勝負。先擲骰子看破對手：點數越高越能看穿對手的攻擊牌，擲出 20 全部看穿，擲出 1 什麼也看不穿（跳過以 10 計）。之後雙方各排六手：攻克破、破克守、守克攻；同招各傷一半；連勝三手追擊；絕招耗內力、無視克制。六手打完先倒下者敗，都沒倒下就比誰剩的氣血比例高。打不過可以投降。</p>
      <h4>時間與大事</h4><p>歷史大事照原樣在固定的日子、地點發生；人在現場就能親眼目睹，錯過了只會聽到傳聞。日子近了，會有劇情帶你趕到現場。</p>
      <h4>陣營</h4><p>師父在事件中示範武功時，陣營相同的人可以一同學，其他人只能旁觀或冒險偷學。正道：全真、少林、丐幫、武當、峨嵋；中立：明教與無門無派；邪道：鐵掌幫。</p>
      <h4>傳承</h4><p>歸隱或壽終後可以選一門武功傳給下一代。存檔存在這支手機的瀏覽器裡。</p>
    </div>`,
  credits: () => `<div class="credits-wrap">${CRED_HTML()}</div>`,
};
const MENU_EXTRA = {
  settings: () => ['設定', `<div class="col setlist">
      ${A('參考', '武學圖鑑、神兵譜、江湖記事、大事年表、玩法說明、美術出處', () => openMenu('ref', 'codex'))}
      ${A('歸隱江湖', '結算一生並傳承', () => confirmBox('封劍歸隱？', '這一世的故事將就此結算，你可以選一門武功傳給後人，開啟下一代。', () => retire('歸隱')))}
      ${S.sect ? A('叛出師門', '聲望 -40', () => confirmBox('叛出師門？', `你將離開${SECTS[S.sect].n}，失去身分與貢獻，已學會的武功仍在。`, leaveSect)) : ''}
      ${A('重新開始', '刪除存檔，回到標題', () => confirmBox('刪除存檔？', '目前的進度將無法復原。', () => { wipeSave(); S = null; UI = { screen: 'title', ov: null }; render(); }))}
    </div><p class="ver">${VERSION}</p>`],
  ref: () => {
    const cur = REF_TABS.some(x => x[0] === UI.ov.arg) ? UI.ov.arg : 'codex';
    return [`參考・${REF_TABS.find(x => x[0] === cur)[1]}`, `<div class="refnav">${B('← 設定', () => openMenu('settings'), 'mini')}${REF_TABS.map(x => B(x[1], () => openMenu('ref', x[0]), 'mini' + (x[0] === cur ? ' on' : ''))).join('')}</div>` + REF[cur]()];
  },
};
Object.assign(MENUS, MENU_EXTRA);

function overlay() {
  const o = UI.ov;
  if (o.k === 'menu') {
    const [title, body] = MENUS[o.m]();
    return `<div class="veil"><div class="sheet"><div class="sheet-h"><h2>${title}</h2>${B('關閉', closeMenu, 'mini')}</div>${body}</div></div>`;
  }
  if (o.k === 'event') {
    return `<div class="veil"><div class="sheet event">
      <div class="scene">${art(o.art || (o.type === '戰鬥' ? 'fight' : o.type === '戀愛' ? 'love' : o.type === '傳承' ? 'legacy' : 'road'), o.title)}${face(o.who, 'on-art')}</div>
      <p class="tag ${TYPE_CLS[o.type] || 'grey'}">${o.type}事件</p><h2>${o.title}</h2>
      ${o.result ? `<p class="story">${o.result}</p><div class="col">${B('繼續', closeEvent, 'primary big')}</div>`
        : o.pages && o.pi < o.pages.length - 1
          ? `<p class="story">${o.pages[o.pi]}</p><div class="col">${B(`繼續　${o.pi + 1}/${o.pages.length}`, () => { o.pi++; render(); document.querySelector('.sheet').scrollTop = 0; }, 'primary big')}</div>`
          : `<p class="story">${o.pages ? o.pages[o.pi] : o.text}</p><div class="col">${o.choices.map((c, i) => `<button type="button" class="btn choice side-${c.s}"${c.dis ? ' disabled' : h(() => choose(i))}><i class="side">${SIDE_LABEL[c.s]}</i><span>${c.t}${c.dis && c.reqT ? `<small>（${c.reqT}）</small>` : ''}</span></button>`).join('')}</div>`}
    </div></div>`;
  }
  if (o.k === 'lvup') {
    const used = Object.values(o.add).reduce((a, b) => a + b, 0), left = S.pts - used;
    return `<div class="veil"><div class="sheet lvup">
      <h2>等級提升！</h2><p class="lv">Lv ${S.lv}</p>
      <p class="desc">屬性點數 <b class="pts">${left}</b>　分配到想要的能力上（下列為本身數值，不含裝備加成）。</p>
      <div class="lvrows">${Object.keys(STAT_N).map(k => `<div class="lvr"><span>${STAT_N[k]}<small>${STAT_D[k]}</small></span><b>${S.base[k] + (o.add[k] || 0)}${o.add[k] ? `<em>+${o.add[k]}</em>` : ''}</b>${B('＋', () => lvAdd(k), 'plus', left <= 0 || S.base[k] + (o.add[k] || 0) >= 30)}</div>`).join('')}</div>
      <div class="row">${B('重置', lvReset, 'big', !used)}${B('確認', lvOk, 'primary big', left > 0)}</div>
    </div></div>`;
  }
  // 戰鬥：猜拳式對決
  if (o.rv) return revealView(o);
  const e = o.e, mv = pMoves(), bm = basicMove(), full = o.plan.length >= 6, left = S.mp - planMp(o);
  const fx = [o.fx.bleed ? '流血' : '', o.fx.poison ? '中毒' : '', o.fx.stun ? '震暈' : '', o.fx.weak ? '破勢' : ''].filter(Boolean).map(x => `<span class="tag seal">${x}</span>`).join('');
  const cells = `<div class="duel">
      <span class="who-l">敵</span>${o.foe.map((c, i) => o.shown[i] ? card(c) : card('?')).join('')}
      <span class="who-l">我</span>${[0, 1, 2, 3, 4, 5].map(i => o.plan[i] ? card(o.plan[i].t) : `<i class="cell empty${i === o.plan.length ? ' next' : ''}"></i>`).join('')}
    </div>`;
  let ctl;
  if (o.over) ctl = `<div class="col">${B(o.over === 'win' ? '收招' : '繼續', endBattle, 'primary big')}</div>`;
  else if (o.sub === 'med') {
    const meds = Object.keys(S.inv).filter(i => ITEMS[i].kind === 'med');
    ctl = `<div class="moves-grid">${meds.map(i => `<button type="button" class="mv"${h(() => planAdd({ t: 'I', item: i }))}><b>${ITEMS[i].n} ×${S.inv[i]}</b><small>${ITEMS[i].d}・佔一手</small></button>`).join('') || '<p class="empty">沒有丹藥了。</p>'}</div><div class="row4">${B('返回', () => { o.sub = null; render(); }, 'mini')}</div>`;
  } else ctl = `<div class="stances">
        <button type="button" class="mv cA"${full ? ' disabled' : h(() => planAdd({ t: 'A' }))}>${ICON.A}<b>攻</b><small>快招・克破</small></button>
        <button type="button" class="mv cB"${full ? ' disabled' : h(() => planAdd({ t: 'B' }))}>${ICON.B}<b>破</b><small>重手・克守</small></button>
        <button type="button" class="mv cG"${full ? ' disabled' : h(() => planAdd({ t: 'G' }))}>${ICON.G}<b>守</b><small>反擊・克攻</small></button>
      </div>
      ${mv.length ? `<div class="moves-grid">${mv.map(m => `<button type="button" class="mv"${full || left < m.mp ? ' disabled' : h(() => planAdd({ t: 'S', mv: m }))}><b>${m.n}</b><small>絕招・內力 ${m.mp}${m.fx ? '・' + FX_N[m.fx] : ''}</small></button>`).join('')}</div>` : ''}
      <div class="row4">${B('調息', () => planAdd({ t: 'H' }), 'mini', full || left < 12)}${B('用藥', () => { o.sub = 'med'; render(); }, 'mini', full)}${B('撤回', planUndo, 'mini', !o.plan.length)}</div>
      <div class="col">${full ? B('出手', commitRound, 'primary big') : B(`補滿（還差 ${6 - o.plan.length} 手）`, planFill, 'big')}</div>`;
  if (!o.over && !o.ins) ctl = `<div class="dice-step"><p class="desc">先擲骰子看破對手：點數越高，越能看穿對手的攻擊牌——擲出 20 全部看穿，擲出 1 什麼也看不穿。悟性${fxSum('eye') ? '、輔助武功' : ''}與交手次數有加成。</p>
      <div class="col">${B(`${ICON.D}擲骰子（1~20）`, () => rollInsight(false), 'primary big dice')}${B('跳過投擲（10）', () => rollInsight(true), 'big')}</div></div>`;
  const chips = (ids) => ids.map(id => `<i class="ac r-${artRole(id)}" title="${SKILLS[id].n}">${TYPE_N[SKILLS[id].type][0]}<small>${SKILLS[id].n.slice(0, 2)}</small></i>`).join('');
  const adv = o.over ? null : advPct(o);
  return `<div class="veil"><div class="sheet battle">
    <div class="bhead"><p class="tag seal">戰鬥・一局定勝負</p>${o.over ? '' : B('投降', pSurrender, 'mini surr')}</div>
    <div class="vs">
      <div class="side-p"><b>${esc(S.name)}</b><span class="pw">戰力 ${Math.round(power())}</span>${bar(S.hp, maxHp(), 'hp')}<em>${Math.max(0, S.hp)}/${maxHp()}</em><div class="acs">${chips(S.eq)}</div></div>
      <div class="adv">${adv == null ? '' : `<b class="${adv >= 50 ? 'win' : 'lose'}">${adv >= 65 ? '優勢' : adv >= 45 ? '勢均' : '劣勢'}</b><span class="${adv >= 50 ? 'win' : 'lose'}">勝算 ${adv.toFixed(1)}%</span>`}</div>
      <div class="side-e">${face(o.who, 'mini-face')}<b>${e.n}</b><span class="pw">戰力 ${Math.round(e.P)}</span>${bar(e.hp, e.mhp, 'hp')}<em>${Math.max(0, e.hp)}/${e.mhp}</em><div class="acs">${fx}${e.moves.map(m => `<i class="ac r-foe">${m[0][0]}<small>${m[0].slice(0, 2)}</small></i>`).join('')}</div></div>
    </div>
    <p class="rule">只打這一局：六手出完，先倒下者敗；都沒倒下，就比誰剩的氣血比例高。攻克破・破克守・守克攻，連勝三手追擊，絕招無視克制。基本招式：${bm.n}${activeCombo() ? `<br>武功組合：${activeCombo().n}（威力 +${Math.round(activeCombo().mul * 100 - 100)}%）` : ''}</p>
    ${o.over || !o.ins ? '' : insightHtml(o)}
    ${o.over ? '' : cells}
    <ol class="blog">${o.log.slice(-16).map(l => `<li>${l}</li>`).join('')}</ol>
    <div class="vitals in-battle one">
      <div><span>內力</span>${bar(S.mp, maxMp(), 'mp')}<em>${S.mp}/${maxMp()}${planMp(o) ? `（本回合將用 ${planMp(o)}）` : ''}</em></div>
    </div>${ctl}</div></div>`;
}

/* ---------- 指令牌與揭牌 ---------- */
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  A: svg('<path d="M20.5 3.5l-11 11M20.5 3.5L15 4.5 6.5 13l4.5 4.5L19.5 9z" fill="currentColor" fill-opacity=".18"/><path d="M5 12l7 7M8.5 15.5L3.5 20.5"/>'),            // 劍
  B: svg('<path d="M13.5 2.5l8 8-3.5 3.5-8-8z" fill="currentColor" fill-opacity=".18"/><path d="M12.5 8.5L3 18l3 3 9.5-9.5"/>'),                                             // 重錘
  G: svg('<path d="M12 2.5l8 3v6.5c0 5-3.4 8.3-8 9.5-4.6-1.2-8-4.5-8-9.5V5.5z" fill="currentColor" fill-opacity=".18"/><path d="M12 7v9M8 11.5h8"/>'),                       // 盾
  S: svg('<path d="M12 2l2.6 6.4L21 9l-5 4.4L17.6 20 12 16.4 6.4 20 8 13.4 3 9l6.4-.6z" fill="currentColor" fill-opacity=".3"/>'),                                           // 絕招
  I: svg('<path d="M10 2.5h4M10.5 2.5v3a3.2 3.2 0 00-.8 5.4 5.6 5.6 0 104.6 0 3.2 3.2 0 00-.8-5.4v-3" fill="currentColor" fill-opacity=".18"/>'),                            // 藥葫蘆
  H: svg('<path d="M4 13a8 8 0 1113.5 5.8M12 13a3.2 3.2 0 10-3.2-3.2M8 20.5h8"/>'),                                                                                          // 調息
  '?': svg('<path d="M12 3l9 9-9 9-9-9z"/><path d="M12 8l4 4-4 4-4-4z" fill="currentColor" fill-opacity=".25"/>'),
  '-': svg('<path d="M5 8c2-3 5 3 7 0s5 3 7 0M5 15c2-3 5 3 7 0s5 3 7 0"/>'),
  D: svg('<path d="M12 2.5l8.5 5v9L12 21.5l-8.5-5v-9z" fill="currentColor" fill-opacity=".18"/><path d="M12 2.5v9.5m0 0l8.5-4.5M12 12l-8.5-4.5M12 12v9.5"/>'),
};
ICON.X = ICON.S;
const CARD_N = { A: '攻', B: '破', G: '守', S: '絕', X: '絕', I: '藥', H: '息', '?': '？', '-': '暈' };
const card = (t, cls = '', extra = '') => `<i class="cell card c${t === '?' ? 'U' : t === '-' ? 'U' : t} ${cls}">${ICON[t]}<b>${CARD_N[t]}</b>${extra}</i>`;

function insightHtml(o) {
  const n = o.ins, fresh = o.fresh; o.fresh = false;
  return `<div class="insight"><span>看破${n.skip ? '（跳過）' : ''}</span><b class="die${fresh ? ' roll' : ''}${n.roll === 20 ? ' crit' : n.roll === 1 ? ' fumble' : ''}">${n.roll}</b><span class="rollline">加值 ${n.mod >= 0 ? '+' : ''}${n.mod} ＝ ${n.total}　→ <em class="${n.reveal >= 3 ? 'win' : 'lose'}">看穿 ${n.reveal} 手</em>${n.roll === 20 ? '（大成功）' : n.roll === 1 ? '（大失手）' : ''}</span></div>`;
}
function revealView(o) {
  const rv = o.rv, e = o.e, n = rv.slots.length, st = rv.step, done = st >= n;
  const cur = st > 0 ? rv.slots[st - 1] : null;
  const RES = { w: ['勝', 'win'], l: ['負', 'lose'], t: ['平', 'tie'] };
  const dmg = v => v > 0 ? `<em class="dmg">-${v}</em>` : v < 0 ? `<em class="dmg heal">+${-v}</em>` : '';
  const foeRow = [0, 1, 2, 3, 4, 5].map(i => {
    if (i >= st) return i < n || !done ? (rv.shown[i] ? card(o.foe[i]) : card('?')) : card('?', 'void');
    const s = rv.slots[i], now = i === st - 1 && !rv.skipped;
    return card(s.f, `${s.res === 'l' ? 'won' : s.res === 'w' ? 'lost' : ''} ${now ? (rv.shown[i] ? 'pulse' : 'flip') : ''}`, i === st - 1 || done ? dmg(s.dE) : '');
  }).join('');
  const midRow = [0, 1, 2, 3, 4, 5].map(i => i < st ? `<span class="res ${RES[rv.slots[i].res][1]} ${i === st - 1 && !rv.skipped ? 'pop' : ''}">${RES[rv.slots[i].res][0]}</span>` : '<span class="res"></span>').join('');
  const myRow = [0, 1, 2, 3, 4, 5].map(i => {
    if (i >= st) return card(rv.plan[i].t, i >= n && done ? 'void' : '');
    const s = rv.slots[i], now = i === st - 1 && !rv.skipped;
    return card(rv.plan[i].t, `${s.res === 'w' ? 'won' : s.res === 'l' ? 'lost' : ''} ${now ? 'pulse' : ''}`, i === st - 1 || done ? dmg(s.dP) : '');
  }).join('');
  const hpP = done ? S.hp : cur ? cur.hpP : rv.start.hp, hpE = done ? e.hp : cur ? cur.hpE : rv.start.eh, mpP = done ? S.mp : cur ? cur.mpP : rv.start.mp;
  const w = rv.slots.slice(0, st).filter(s => s.res === 'w').length, l = rv.slots.slice(0, st).filter(s => s.res === 'l').length;
  const note = done
    ? `<ol class="blog recap">${rv.slots.map((s, i) => `<li class="${RES[s.res][1]}"><b>${'①②③④⑤⑥'[i]} ${RES[s.res][0]}</b> ${s.lines.join('')}</li>`).join('')}${rv.tail.map(t => `<li>${t}</li>`).join('')}</ol>`
    : `<div class="callout ${cur ? RES[cur.res][1] : ''}">${cur ? `<b>第${cnNum(st)}手・${RES[cur.res][0]}</b>${cur.lines.map(x => `<span>${x}</span>`).join('')}` : '<b>揭牌——</b><span>雙方同時亮出這一回合的六手。</span>'}</div>`;
  return `<div class="veil"><div class="sheet battle">
    <p class="tag seal">戰鬥・一局定勝負・揭牌</p>
    <div class="foe">${face(o.who, 'mini-face')}<b>${e.n}</b>${bar(hpE, e.mhp, 'hp')}<em>${Math.max(0, hpE)}/${e.mhp}</em></div>
    <div class="duel reveal">
      <span class="who-l">敵</span>${foeRow}
      <span class="who-l"></span>${midRow}
      <span class="who-l">我</span>${myRow}
    </div>
    <p class="score">本回合　<b class="win">勝 ${w}</b>　<b class="lose">負 ${l}</b>　<b class="tie">平 ${st - w - l}</b></p>
    ${note}
    <div class="vitals in-battle">
      <div><span>氣血</span>${bar(hpP, maxHp(), 'hp')}<em>${Math.max(0, hpP)}/${maxHp()}</em></div>
      <div><span>內力</span>${bar(mpP, maxMp(), 'mp')}<em>${mpP}/${maxMp()}</em></div>
    </div>
    <div class="col">${done ? B(o.over === 'win' ? '收招' : '繼續', endBattle, 'primary big') : B('跳過動畫', revealSkip, 'big')}</div>
  </div></div>`;
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
// 手機版面：以 410 單位寬為基準整體放大，字與按鈕在任何手機上都一樣大
function fitScreen() {
  const w = window.innerWidth || 410;
  document.documentElement.style.setProperty('--z', w <= 1100 ? Math.max(1, Math.min(2.6, w / 410)).toFixed(3) : '1');
}
fitScreen();
window.addEventListener('resize', fitScreen);
render();
