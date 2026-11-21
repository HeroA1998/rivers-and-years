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
      <div class="col">${eraOptions(c).map(x => x.sealed
        ? `<button type="button" class="opt sealed" disabled><b>${x.n}<i>封印中</i></b><span>暫時不開放，先專心走完射鵰篇。</span></button>`
        : `<button type="button" class="opt ${c.year === x.y ? 'on' : ''}"${h(() => { c.year = x.y; render(); })}><b>${x.n}<i>${reign(x.y)}・${x.y}年</i></b><span>${x.d}</span></button>`).join('')}</div>
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
        <div class="icorow"><span>氣血</span><span class="ico">${hearts()}</span></div>
        <div class="icorow"><span>內力</span><span class="ico">${orbs(S.qi, qiMax())}</span></div>
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
      <p class="tag jade">${e.reason === '壽終' ? '壽終正寢' : e.reason === '戰死' ? '命喪江湖' : '封劍歸隱'}・享年${cnNum(age())}</p>
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
const heartSvg = on => `<svg class="heart ${on ? 'on' : 'off'}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.6-4.7-9.6-9.3C1 8.3 3.2 4.8 6.6 4.8c2 0 3.7 1.1 5.4 3 1.7-1.9 3.4-3 5.4-3 3.4 0 5.6 3.5 4.2 6.9C19.6 16.300 12 21 12 21z"/></svg>`;
const orbSvg = on => `<svg class="orb ${on ? 'on' : 'off'}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18 4.500 4.500 0 010-9 4.500 4.500 0 000-9z"/></svg>`;
const hearts = (n = S.life, m = lifeMax()) => Array.from({ length: m }, (_, i) => heartSvg(i < n)).join('');
const orbs = (n, m) => Array.from({ length: m }, (_, i) => orbSvg(i < n)).join('');
const statRow = () => `<div class="statrow">${Object.keys(STAT_N).map(k => `<span><i>${STAT_N[k]}</i><b>${S.stats[k]}</b>${S.bonus && S.bonus[k] ? `<small>+${S.bonus[k]}</small>` : ''}</span>`).join('')}</div>`;
function eraOptions(c) {
  const out = [];
  if (c.legacy) out.push(c.legacy.reset
    ? { y: ERAS[0].y, n: '後人重走射鵰年代', d: `${c.legacy.from}的年代已成舊事，江湖上的人和事重新開場，你是他們的後人。` }
    : { y: c.legacy.year, n: '承接上一代', d: `緊接著${c.legacy.from}歸隱的第二年。江湖上的人和事，都還記得${c.legacy.from}。` });
  else for (const e of ERAS) if (e.y <= SEAL_YEAR) out.push(e);
  for (const e of ERAS) if (e.y > SEAL_YEAR) out.push(Object.assign({}, e, { sealed: true }));
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
      <div class="icorow big"><span>氣血</span><span class="ico">${hearts()}</span></div><div class="icorow big"><span>內力</span><span class="ico">${orbs(S.qi, qiMax())}</span></div>
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
      <h4>氣血與內力</h4><p>氣血是「命」：起始 3 顆愛心。打輸一場戰鬥扣一顆，事件失敗（檢定沒過、受傷）也扣一顆，歸零就命喪江湖，這一世結束、由後人接續。命每過兩個月自然回一顆，金創藥回一顆，大還丹全滿，升級也會回一顆。內力是「氣團」：事件裡的運功、拚盡全力的選項會消耗，戰鬥中的絕招也用它；每二十天回一顆，回氣散回兩顆。</p>
      <h4>能力值與等級</h4><p>能力值只會因為升級配點、故事中的遭遇，以及裝備改變。事件與戰鬥給閱歷，升一級得三點屬性點數，由你自己分配。</p>
      <h4>武功即裝備</h4><p>最多裝備五門武功。攻擊類提供招式與攻擊力；內功決定氣血內力與內力屬性；身法提高閃避；輔助類不出招，只給看破、減傷、反震、回血等效果。每門裝備中的武功還會依類別加能力值。只有裝備中的武功會在實戰中長進。</p>
      <h4>戰鬥</h4><p>全自動戰鬥。開打前先擲 d20 決定這一戰的戰力：<b>10 點＝100% 戰力</b>，點數越高越強、越低越弱（戰力＝點數 ÷ 10，擲 5 點只有 50%）；<b>擲出 20 無敵</b>，對手傷不了你。也可以「跳過投擲」，直接以 10 點計。之後雙方自動對打，主角會偶爾使出絕招（耗內力），一直打到一方血量歸零。每場新戰鬥開始都是滿血，輸了扣一顆命，打不過可以投降。</p>
      <h4>時間與大事</h4><p>歷史大事照原樣在固定的日子、地點發生；人在現場就能親眼目睹，錯過了只會聽到傳聞。日子近了，會有劇情帶你趕到現場。路上偶爾會回城一趟，買金創藥、回氣散，或是一本武功秘笈。</p>
      <h4>年代</h4><p>目前只開放射鵰篇（1222 起）；神鵰篇、倚天篇暫時封印。</p>
      <h4>陣營</h4><p>師父在事件中示範武功時，陣營相同的人可以一同學，其他人只能旁觀或冒險偷學。正道：全真、少林、丐幫；邪道：鐵掌幫。</p>
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
  return battleView(o);
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

/* ---------- 全自動戰鬥畫面 ---------- */
const hero = () => `<svg viewBox="0 0 64 80" aria-hidden="true"><ellipse cx="32" cy="76" rx="17" ry="3.5" fill="#000" opacity=".22"/><path d="M19 71L23 36Q32 24 41 36L45 71Z" fill="#4f8a6e"/><path d="M23 36Q32 24 41 36L39 44Q32 40 25 44Z" fill="#3d6f57"/><circle cx="32" cy="27" r="9.5" fill="#4f8a6e"/><circle cx="33" cy="29" r="5.2" fill="#ecd9bb"/><path d="M44 54L60 28" stroke="#e8edf0" stroke-width="3.4" stroke-linecap="round"/><path d="M43 56L47 51" stroke="#7a4f27" stroke-width="4.5" stroke-linecap="round"/></svg>`;
const foeFig = style => style === 'beast'
  ? `<svg viewBox="0 0 80 64" aria-hidden="true"><ellipse cx="40" cy="60" rx="26" ry="3.5" fill="#000" opacity=".22"/><ellipse cx="38" cy="38" rx="22" ry="13" fill="#8a5a3a"/><circle cx="62" cy="30" r="10" fill="#9a6642"/><path d="M58 22l-2-8 6 5zM66 21l3-7 2 8z" fill="#7a4a2c"/><circle cx="65" cy="29" r="1.8" fill="#f2d35a"/><path d="M22 46v12M32 48v10M46 48v10M56 46v12" stroke="#6e4528" stroke-width="5" stroke-linecap="round"/><path d="M17 36q-9-6-9-16" stroke="#8a5a3a" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`
  : style === 'puppet'
  ? `<svg viewBox="0 0 64 80" aria-hidden="true"><ellipse cx="32" cy="76" rx="17" ry="3.5" fill="#000" opacity=".22"/><rect x="20" y="34" width="24" height="34" rx="3" fill="#7d7468"/><rect x="24" y="14" width="16" height="18" rx="3" fill="#8f8678"/><circle cx="29" cy="22" r="2.2" fill="#e5533d"/><circle cx="36" cy="22" r="2.2" fill="#e5533d"/><rect x="8" y="36" width="12" height="7" rx="2" fill="#6a6258"/><rect x="44" y="36" width="12" height="7" rx="2" fill="#6a6258"/><rect x="22" y="68" width="8" height="8" fill="#6a6258"/><rect x="34" y="68" width="8" height="8" fill="#6a6258"/></svg>`
  : `<svg viewBox="0 0 64 80" aria-hidden="true"><ellipse cx="32" cy="76" rx="17" ry="3.5" fill="#000" opacity=".22"/><path d="M19 71L23 36Q32 24 41 36L45 71Z" fill="#a34a3f"/><path d="M23 36Q32 24 41 36L39 44Q32 40 25 44Z" fill="#7f352d"/><circle cx="32" cy="27" r="9.5" fill="#a34a3f"/><circle cx="31" cy="29" r="5.2" fill="#e3c6a4"/><path d="M6 24L44 62" stroke="#caa86a" stroke-width="3" stroke-linecap="round"/><path d="M2 20L9 27L5 29Z" fill="#dfe5e8"/></svg>`;
function battleView(o) {
  const e = o.e, adv = o.over ? null : advPct(o), pw = power() * (o.roll ? o.mult : 1), bm = basicMove();
  const fx = [o.fx.bleed ? '流血' : '', o.fx.poison ? '中毒' : '', o.fx.stun ? '震暈' : '', o.fx.weak ? '破勢' : ''].filter(Boolean).map(x => `<span class="tag seal">${x}</span>`).join('');
  const chips = ids => ids.map(id => `<i class="ac r-${artRole(id)}" title="${SKILLS[id].n}">${TYPE_N[SKILLS[id].type][0]}<small>${SKILLS[id].n.slice(0, 2)}</small></i>`).join('');
  const pop = o.pop || { toE: 0, toP: 0 }, fight = o.phase === 'fight';
  const pcls = `fgt p${fight && pop.toE ? ' atk' : ''}${fight && pop.toP ? ' hit' : ''}${o.god ? ' god' : ''}`;
  const ecls = `fgt e${fight && pop.toP ? ' atk' : ''}${fight && pop.toE ? ' hit' : ''}${o.over === 'win' ? ' down' : ''}`;
  const last = o.log[o.log.length - 1];
  const dieNum = o.roll == null ? '' : o.roll;
  const dieCls = `bigdie${o.phase === 'rolling' ? ' spin' : ''}${o.roll === 20 ? ' crit' : o.roll === 1 ? ' fumble' : ''}`;
  let side;
  if (o.over) side = `<div class="col">${B(o.over === 'win' ? '收招' : '繼續', endBattle, 'primary big')}</div>`;
  else if (o.phase === 'roll') side = `<div class="col">${B('擲骰子（1~20）', () => rollBattle(false), 'primary big')}${B('跳過投擲（10）', () => rollBattle(true), 'big')}</div>`;
  else side = `<div class="rollinfo"><b>${o.god ? '無敵！' : `戰力 ${Math.round(o.mult * 100)}%`}</b><small>${o.god ? '擲出 20：對手傷不了你' : `擲出 ${o.roll}・受到的傷害 ${Math.round(o.take * 100)}%`}</small></div>`;
  return `<div class="veil"><div class="sheet battle auto">
    <div class="vs2">
      <div class="side-p"><b>${esc(S.name)}</b><span class="pw">⚔ ${pw.toFixed(1)}</span></div>
      <div class="adv">${adv == null ? '' : `<b class="${adv >= 50 ? 'win' : 'lose'}">${adv >= 65 ? '優勢' : adv >= 45 ? '勢均' : '劣勢'}</b><span class="${adv >= 50 ? 'win' : 'lose'}">${adv.toFixed(1)}%</span>`}</div>
      <div class="side-e"><b>${e.n}</b><span class="pw">${e.P.toFixed(1)} ⚔</span></div>
    </div>
    <div class="hpbars"><div class="hpbar p"><i style="width:${clamp(S.hp / maxHp() * 100, 0, 100)}%"></i><b>${Math.max(0, S.hp)}/${maxHp()}</b></div><div class="hpbar e"><i style="width:${clamp(e.hp / e.mhp * 100, 0, 100)}%"></i><b>${Math.max(0, e.hp)}/${e.mhp}</b></div></div>
    <div class="arena">${art(o.art || 'fight', e.n, 'bg')}
      <div class="${pcls}">${hero()}${fight && pop.toP ? `<em class="pop">-${pop.toP}</em>` : ''}</div>
      <div class="${ecls}">${foeFig(e.style)}${fight && pop.toE ? `<em class="pop">-${pop.toE}</em>` : ''}</div>
      ${o.god ? '<div class="godtag">無敵</div>' : ''}
      <p class="cap">${last || ''}</p>
      ${o.over ? '' : `<button type="button" class="spd"${h(battleSpeed)}>▶▶ x${o.speed === 1 ? 1 : 2}</button>`}
    </div>
    <div class="skillrow"><div class="ico small">${hearts()}</div><div class="acs">${chips(S.eq)}</div><div class="acs r">${fx}${e.moves.map(m => `<i class="ac r-foe">${m[0][0]}<small>${m[0].slice(0, 2)}</small></i>`).join('')}</div></div>
    <div class="ctrl">
      <div class="surr">${o.over || o.phase !== 'roll' && o.phase !== 'fight' ? '' : B('投降', pSurrender, 'mini surr')}</div>
      <div class="${dieCls}">${ICON.D}<b>${dieNum}</b></div>
      <div class="side">${side}</div>
    </div>
    <div class="vitals in-battle one"><div class="icorow"><span>內力</span><span class="ico">${orbs(Math.ceil(S.mp / (o.K || 1) - 1e-6), qiMax())}</span><em>${S.mp}</em></div></div>
    <ol class="blog">${o.log.slice(-4).map(l => `<li>${l}</li>`).join('')}</ol>
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
