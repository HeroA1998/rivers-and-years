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
  // 事件內容直接呈現在江湖頁，不再以全螢幕彈窗覆蓋故事。
  if (UI.ov && UI.ov.k !== 'event') html += overlay();
  if (toastMsg) { html += `<div class="toast" role="status">${toastMsg}</div>`; toastMsg = ''; }
  root.dataset.align = S ? (S.moral >= 20 ? 'g' : S.moral <= -20 ? 'e' : 'n') : 'n';
  root.dataset.page = UI.screen === 'game' ? UI.tab : UI.screen;
  root.innerHTML = html;
  if (DIE3) root.querySelectorAll('.tray[data-phase]').forEach(el => DIE3.mount(el, {
    seq: +el.dataset.seq, roll: el.dataset.roll === '' ? null : +el.dataset.roll, phase: el.dataset.phase, tick: +el.dataset.tick, tone: el.dataset.tone }));
  if (DIE3 && !root.querySelector('.tray')) DIE3.hide();
  document.querySelectorAll('canvas.art').forEach(c => paintArt(c, c.dataset.art, c.dataset.seed));
  const bl = document.querySelector('.blog:not(.recap)'); if (bl) bl.scrollTop = bl.scrollHeight;
  const ns = document.querySelector('.sheet'); if (ns && keep) ns.scrollTop = keep;
  activateStoryAnimation(root);
}

const SCREENS = {
  title() {
    const sv = loadSave();
    return `<div class="title-screen">
      ${art('title', 'title', 'hero')}
      <h1>江湖歲月錄</h1>
      <p class="lead">你不是郭靖，也不是張無忌。你只是那個年代裡的一個江湖人——親眼看著傳說發生，也過著自己的一生。</p>
      <div class="col">
        ${sv ? B(`繼續前緣<small>${esc(sv.name)}・${reign((sv.y0 || 1222) + sv.date.y - 1)}</small>`, () => { S = migrate(sv); recalc(); UI = { screen: 'game', tab: 'world', ov: null }; Q = []; continueStory(); }, 'primary big') : ''}
        ${B('初入江湖', () => { UI.screen = 'create'; UI.create = { name: '', gender: '男', origin: 0, stats: rollStats(), year: ERAS[0].y }; render(); }, sv ? 'big' : 'primary big')}
      </div>
      <p class="ver">${VERSION}</p></div>`;
  },
  create() {
    const c = UI.create, st = c.stats;
    return `<div class="create">
      <h2>${c.legacy ? `第${cnNum(c.legacy.gen + 1)}代傳人` : '初入江湖'}</h2>
      ${c.legacy ? `<p class="note">承襲自${esc(c.legacy.from)}：${c.legacy.skill ? `${SKILLS[c.legacy.skill.id].n}第${cnNum(c.legacy.skill.lv)}層、` : ''}銀兩 ${c.legacy.silver}${c.legacy.weapon ? '、' + ITEMS[c.legacy.weapon].n : ''}${c.legacy.blood ? '、血脈天賦（悟性根骨各+1）' : ''}</p>` : ''}
      <div class="field">年代</div>
      <div class="col">${eraOptions(c).map(x => x.sealed
        ? `<button type="button" class="opt sealed" disabled><b>${x.n}<i>封印中</i></b><span>暫時不開放，先專心走完射鵰篇。</span></button>`
        : `<button type="button" class="opt ${c.year === x.y ? 'on' : ''}"${h(() => { c.year = x.y; render(); })}><b>${x.n}<i>${reign(x.y)}・${x.y}年</i></b><span>${x.d}</span></button>`).join('')}</div>
      <label class="field" for="nm">姓名<input id="nm" maxlength="6" placeholder="例：沈孤雁" value="${esc(c.name)}" autocomplete="off"></label>
      <div class="field">性別<div class="row">${['男', '女'].map(g => B(g, () => { c.gender = g; render(); }, c.gender === g ? 'on' : '')).join('')}</div></div>
      <p class="note">出身由天：投胎到什麼人家、生在哪裡，要等踏入江湖才知道。不同出身另有天資加成。</p>
      <div class="field">天資 ${B('重擲', () => { c.stats = rollStats(); render(); }, 'mini')}</div>
      <div class="stats">${Object.keys(STAT_N).map(k => `<div><span>${ico(k)}${STAT_N[k]}</span><b>${st[k]}</b><small>${STAT_D[k]}</small></div>`).join('')}</div>
      ${B('踏入江湖', () => { c.name = (document.getElementById('nm').value || '').trim() || (c.gender === '男' ? '沈孤雁' : '葉輕眉'); newGame(c, c.legacy); }, 'primary big')}
    </div>`;
  },
  game() {
    if (UI.tab === 'skill' || UI.tab === 'people') { UI.sub = UI.tab; UI.tab = 'me'; }
    if (!TABS[UI.tab] || UI.tab === 'status') UI.tab = 'world';
    const isWorld = UI.tab === 'world';
    const resources = isWorld ? '' : `<div class="chips2" aria-label="江湖資源">
      <span>${ico('coin')} 銀兩 <b>${S.silver}</b></span>
      <span>${ico('star')} 聲望 <b>${S.fame}</b></span>
      <span>${esc(moralName())}</span>
      ${S.pts ? '<span class="hot">待分配屬性點 ' + S.pts + '</span>' : ''}
    </div>`;
    return `${gameHud(false)}
      ${resources}
      <main id="main-content">${TABS[UI.tab]()}</main>
      ${gameNav(UI.tab, true)}`;
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
      ${e.reason === '戰死' ? '' : `<h3>傳承</h3>
      <p class="note">${heir ? `你的${heir}將繼承一門武功（層數減半）、三成積蓄與隨身兵刃。` : '你沒有傳人。多年後，一個有緣的後輩拾得你的遺冊（層數僅餘三成、積蓄一成）。'}選擇要傳下去的武功：</p>
      <div class="col">${e.best.map(id => `<button type="button" class="opt ${e.pick === id ? 'on' : ''}"${h(() => { e.pick = id; render(); })}><b>${SKILLS[id].n}</b><span>${TIER_N[SKILLS[id].tier]}${TYPE_N[SKILLS[id].type]}・第${cnNum(S.skills[id].lv)}層</span></button>`).join('')}</div>
      <div class="col">${B('薪火相傳，開啟下一代', inherit, 'primary big')}</div>`}
      <div class="col">${B('回到標題', () => { S = null; UI = { screen: 'title', ov: null }; render(); }, e.reason === '戰死' ? 'primary big' : 'big')}</div>
    </div>`;
  },
};

/* ---------- 圖示庫：全部用 SVG 線稿，跟著文字顏色走 ---------- */
const IC = {
  str: '<path d="M7 12V8.500a1.500 1.500 0 013 0V7a1.500 1.500 0 013 0v1a1.500 1.500 0 013 0v5.500a5 5 0 01-5 5h-1a5 5 0 01-5-5z"/>',
  con: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/><path d="M12 8v7M8.500 11.500h7"/>',
  int: '<path d="M4 5.500h6.500a2 2 0 012 2V20a2 2 0 00-2-2H4z"/><path d="M20 5.500h-6.500a1 1 0 00-1 1M20 5.500V18h-6"/>',
  agi: '<path d="M3 9h10a3 3 0 10-3-3M3 15h14a3 3 0 11-3 3M3 12h7"/>',
  luck: '<circle cx="8.500" cy="8.500" r="3.200"/><circle cx="15.500" cy="8.500" r="3.200"/><circle cx="8.500" cy="15.500" r="3.200"/><circle cx="15.500" cy="15.500" r="3.200"/><path d="M12 12l6 8"/>',
  cha: '<path d="M12 20c-5-2-8-6-8-10 3 0 6 1 8 4 2-3 5-4 8-4 0 4-3 8-8 10z"/><path d="M12 14c-1.500-3-1.500-6 0-9 1.500 3 1.500 6 0 9z"/>',
  sword: '<path d="M20.500 3.500l-11 11M20.500 3.500L15.500 4.500 7 13l4 4 8.500-8.500z"/><path d="M5 12l7 7M8.500 15.500L3.500 20.500"/>',
  blade: '<path d="M5 19c7-1 12-7 14-15-1 6-3 10-7 13l-3 3z"/><path d="M5 19l-2 2"/>',
  fist: '<path d="M7 12V8.500a1.500 1.500 0 013 0V7a1.500 1.500 0 013 0v1a1.500 1.500 0 013 0v5.500a5 5 0 01-5 5h-1a5 5 0 01-5-5z"/>',
  staff: '<path d="M4 20L20 4"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="1.600"/>',
  spear: '<path d="M5 19L17 7"/><path d="M17 7l-.8-4 4 .8z"/><path d="M5 19l-2 2"/>',
  whip: '<path d="M4 19c4-9 6 3 10-5s4-7 6-9"/><path d="M4 19l-1 2"/>',
  dart: '<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>',
  qing: '<path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15z"/><path d="M5 19l8-8"/>',
  nei: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18 4.500 4.500 0 010-9 4.500 4.500 0 000-9z"/>',
  sup: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  star: '<path d="M12 3l2.700 5.800 6.300.7-4.700 4.300 1.300 6.200L12 16.800 6.400 20l1.300-6.200L3 9.500l6.300-.7z"/>',
  ring: '<circle cx="12" cy="15" r="6"/><path d="M9 6l3-3 3 3-3 3z"/>',
  bottle: '<path d="M10 3h4M10.500 3v4l-3 4.500A6 6 0 0012 21a6 6 0 004.500-9.500L13.500 7V3"/><path d="M8 14h8"/>',
  scroll: '<path d="M6 4h12v14a2 2 0 01-2 2H8a2 2 0 01-2-2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  box: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18M12 9v11M12 9c-3-5-6-2-4 0M12 9c3-5 6-2 4 0"/>',
  leaf: '<path d="M5 19C5 10 10 5 20 4c0 9-5 14-13 14z"/><path d="M5 19c3-5 6-8 11-11"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M16 8l-2.500 5.500L8 16l2.500-5.500z"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.500 3.500-7 8-7s8 2.500 8 7"/>',
  bag: '<path d="M6 9h12l1 12H5z"/><path d="M9 9V7a3 3 0 016 0v2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/>',
  settings: '<path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/><path d="M10 2h4l.6 2.5 2 1.1 2.4-.8 2 3.4-1.8 1.8v2l1.8 1.8-2 3.4-2.4-.8-2 1.1L14 22h-4l-.6-2.5-2-1.1-2.4.8-2-3.4L4.8 14v-2L3 10.2l2-3.4 2.4.8 2-1.1z"/>',
  flag: '<path d="M5 21V4M5 5c5-3 9 3 14 0v10c-5 3-9-3-14 0z"/>',
};
const ico = (n, cls = '') => IC[n] ? `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>` : '';
const artIcon = id => artRole(id) === 'sup' ? 'sup' : SKILLS[id].type;
const itemIcon = it => ({ med: 'bottle', tonic: 'bottle', gift: 'box', misc: 'leaf', manual: 'scroll', armor: 'shield', acc: 'ring' }[it.kind] || it.wt || 'box');
const stars = n => '★'.repeat(n);

/* ---------- 分頁 ---------- */
const heartSvg = on => `<svg class="heart ${on ? 'on' : 'off'}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.6-4.7-9.6-9.3C1 8.3 3.2 4.8 6.6 4.8c2 0 3.7 1.1 5.4 3 1.7-1.9 3.4-3 5.4-3 3.4 0 5.6 3.5 4.2 6.9C19.6 16.300 12 21 12 21z"/></svg>`;
const orbSvg = on => `<svg class="orb ${on ? 'on' : 'off'}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18 4.500 4.500 0 010-9 4.500 4.500 0 000-9z"/></svg>`;
const hearts = (n = S.life, m = lifeMax()) => Array.from({ length: m }, (_, i) => heartSvg(i < n)).join('');
const orbs = (n, m) => Array.from({ length: m }, (_, i) => orbSvg(i < n)).join('');
const statRow = () => `<div class="statrow">${Object.keys(STAT_N).map(k => `<span>${ico(k)}<i>${STAT_N[k]}</i><b>${S.stats[k]}</b>${S.bonus && S.bonus[k] ? `<small>+${S.bonus[k]}</small>` : ''}</span>`).join('')}</div>`;
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
    // 每個事件都在同一個閱讀區呈現。情節結果的「繼續」由
    // closeEvent() 直接取得下一事件，不插入遊歷方向畫面。
    if (UI.ov && UI.ov.k === 'event') return eventReader(UI.ov);
    return `<section class="story-stage idle-stage">
      <div class="story-heading"><span class="story-chapter">江湖歲月錄</span><h2>江湖路上</h2></div>
      <div class="story-prose"><p>前一段故事已落下帷幕。接下來，又會遇見怎樣的人與事？</p></div>
      <div class="story-choice-block"><div class="story-options">
        ${B('繼續', continueStory, 'story-option')}
      </div></div>
    </section>`;
  },
  status() {
    return `<section class="group"><h3>${esc(S.name)}・Lv ${S.lv}</h3>
      <p class="desc">${S.gender}・${S.birth || S.origin}・${cnNum(age())}歲${S.gen > 1 ? `・第${cnNum(S.gen)}代（承${esc(S.legacyFrom)}遺澤）` : ''}<br>
      稱號：${fameTitle()}　心性：${moralName()}（${S.moral}）<br>
      門派：${S.sect ? `${SECTS[S.sect].n}・${RANKS[S.rank]}・貢獻 ${S.contrib}` : '無門無派'}　戰績：${S.wins} 勝 ${S.losses} 負<br>
      戰力 ${Math.round(power())}　閃避 ${Math.round(pDodge())}　防禦 ${Math.round(pDef())}</p>
      <div class="icorow big"><span>氣血</span><span class="ico">${hearts()}</span></div><div class="icorow big"><span>內力</span><span class="ico">${orbs(S.qi, qiMax())}</span></div>
      <div class="stats">${Object.keys(STAT_N).map(k => `<div><span>${ico(k)}${STAT_N[k]}</span><b>${S.stats[k]}</b><small>本身 ${S.base[k]}${S.bonus[k] ? `　裝備 +${S.bonus[k]}` : ''}<br>${STAT_D[k]}</small></div>`).join('')}</div>
      <p class="desc">能力值只會因為升級配點、故事中的遭遇，以及裝備的兵刃、護甲、飾品與武功而改變。</p></section>`;
  },
  skill() {
    const ids = Object.keys(S.skills).sort((a, b) => (S.eq.includes(b) - S.eq.includes(a)) || ['atk', 'sup', 'nei', 'qing'].indexOf(artRole(a)) - ['atk', 'sup', 'nei', 'qing'].indexOf(artRole(b)) || SKILLS[b].tier - SKILLS[a].tier);
    const cb = activeCombo();
    const slots = `<section class="group"><h3>武學裝備 ${S.eq.length}/${EQ_MAX}</h3><div class="slots">${[0, 1, 2, 3, 4].map(i => { const id = S.eq[i]; return id ? `<div class="slot r-${artRole(id)} tier-${SKILLS[id].tier}">${ico(artIcon(id), 'slotic')}<i>${ROLE_N[artRole(id)]}</i><b>${SKILLS[id].n}</b><em class="stars">${stars(SKILLS[id].tier)}</em><small>${artRole(id) === 'atk' ? `攻擊 ${artAtk(id)}` : `第${cnNum(S.skills[id].lv)}層`}</small></div>` : '<div class="slot empty">' + ico('nei', 'slotic') + '<i>空</i><b>—</b><small>未裝備</small></div>'; }).join('')}</div>
      <p class="desc">${S.nei ? `主修內功：${SKILLS[S.nei].n}（${ATTR_N[SKILLS[S.nei].attr]}）——與招式屬性相合則威力大增。` : '沒有裝備內功：氣血內力較少，出招也沒有內力加成。'}${cb ? `<br>武功組合：<b>${cb.n}</b>，威力 +${Math.round(cb.mul * 100 - 100)}%。` : ''}<br>每門裝備中的武功依類別加能力值（入門 +1、上乘 +2、絕學 +3）；只有裝備中的武功會在實戰中長進。</p></section>`;
    return slots + ids.map(id => {
      const k = SKILLS[id], sk = S.skills[id], r = artRole(id), on = S.eq.includes(id), st = artSt(id), fx = artFxText(id);
      const ctl = on ? B('卸下', () => unequipArt(id), 'mini on') : B('裝備', () => equipArt(id), 'mini', S.eq.length >= EQ_MAX);
      const stat = Object.keys(st).map(x => `${STAT_N[x]}+${st[x]}`).join('、');
      const detail = k.type === 'nei' ? `每層 氣血+${k.hp} 內力+${k.mp}${k.evil ? '・每升一層俠義-3' : ''}`
        : k.type === 'qing' ? `每層 閃避+${k.dodge}`
        : r === 'sup' ? '不出招，只提供戰鬥效果'
        : k.moves.map(m => `<span class="${sk.lv >= m[1] ? '' : 'locked'}">${m[0]}${m[4] ? `〔${FX_N[m[4]]}〕` : ''}${sk.lv >= m[1] ? '' : `（${m[1]}層）`}</span>`).join('、');
      return `<article class="card tier-${k.tier}${on ? ' equipped' : ''}"><div class="card-h"><span class="artic">${ico(artIcon(id), 'big')}</span><b>${k.n}</b><em class="stars">${stars(k.tier)}</em><span class="tag r-${r}">${ROLE_N[r]}</span><span class="tag ${k.tier === 3 ? 'gold' : 'grey'}">${TIER_N[k.tier]}${TYPE_N[k.type]}・${ATTR_N[k.attr]}</span>${ctl}</div>
        <div class="lvrow">第${cnNum(sk.lv)}層 ${sk.lv >= 10 ? '<em>圓滿</em>' : bar(sk.exp, xpNeed(sk.lv, k.tier), 'xp') + `<em>${sk.exp}/${xpNeed(sk.lv, k.tier)}</em>`}</div>
        <p class="props">${r === 'atk' ? `<span>攻擊力 <b>${artAtk(id)}</b></span>` : ''}<span>裝備加成 <b>${stat}</b></span>${fx ? `<span>效果 <b>${fx}</b></span>` : ''}</p>
        <details class="skill-details"><summary>查看招式與典故</summary><p>${k.d}</p><p class="moves">${detail}</p></details></article>`;
    }).join('');
  },
  bag() {
    const ids = Object.keys(S.inv);
    const stx = it => Object.keys(it.st || {}).map(k => STAT_N[k] + '+' + it.st[k]).join('、');
    const desc = it => it.d || (it.kind === 'weapon'
      ? TYPE_N[it.wt] + '威力+' + it.atk + '（僅對同類武功有效）'
      : it.kind === 'armor' ? '防禦+' + it.def : it.kind === 'acc' ? '飾品'
      : it.kind === 'manual' ? '可習得' + SKILLS[it.skill].n : '');
    const slot = (n, id, ic) => '<div>' + ico(ic, 'gearic') +
      '<span>' + n + '</span><b>' + (id ? ITEMS[id].n : '—') + '</b><small>' +
      (id ? [desc(ITEMS[id]), stx(ITEMS[id])].filter(Boolean).join('・') : '未裝備') + '</small></div>';
    const equipped = '<section class="group"><h3>隨身裝備</h3><div class="stats gear">' +
      slot('兵刃', S.weapon, S.weapon ? ITEMS[S.weapon].wt : 'sword') +
      slot('護甲', S.armor, 'shield') + slot('飾品', S.acc, 'ring') + '</div></section>';
    const groups = [
      ['兵器與裝備', ['weapon', 'armor', 'acc']],
      ['藥品與補給', ['med', 'tonic']],
      ['武功秘笈', ['manual']],
      ['其他物品', []]
    ];
    const content = groups.map(([title, kinds]) => {
      const matching = ids.filter(id => {
        const kind = ITEMS[id] && ITEMS[id].kind;
        return kind && (kinds.length ? kinds.includes(kind) :
          !groups.slice(0, 3).some(g => g[1].includes(kind)));
      });
      if (!matching.length) return '';
      return '<section class="bag-section"><h3>' + title + '</h3>' +
        matching.map(id => {
          const it = ITEMS[id], eqd = S.weapon === id || S.armor === id || S.acc === id;
          const lab = { med: '服用', tonic: '服用', manual: '研讀', weapon: eqd ? '卸下' : '裝備',
            armor: eqd ? '卸下' : '穿上', acc: eqd ? '卸下' : '戴上' }[it.kind];
          return '<article class="card row-card"><span class="itemic">' + ico(itemIcon(it), 'big') +
            '</span><div><b>' + it.n + '</b> ×' + S.inv[id] +
            (eqd ? ' <span class="tag jade">使用中</span>' : '') +
            '<p>' + [desc(it), stx(it)].filter(Boolean).join('・') + '</p></div>' +
            (lab ? B(lab, () => useItem(id), 'mini') : '') + '</article>';
        }).join('') + '</section>';
    }).join('');
    return equipped + (ids.length ? content : '<p class="empty">行囊空空如也。</p>');
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
      <h4>氣血與內力</h4><p>氣血是「命」：起始 3 顆愛心。打輸一場戰鬥扣一顆，事件失敗（檢定沒過、受傷）也扣一顆，歸零就命喪江湖，這一世結束、由後人接續。命不會隨時間自然回復，只靠金創藥（回一顆）、大還丹（全滿）、客店或借宿睡足、升級與療傷事件回復。內力是「氣團」：事件裡的運功、拚盡全力的選項會消耗，戰鬥中的絕招也用它；不會隨時間自然回復，只靠回氣散（回兩顆）、打坐靜修、睡足一夜與升級回復。</p>
      <h4>能力值與等級</h4><p>能力值只會因為升級配點、故事中的遭遇，以及裝備改變。事件與戰鬥給閱歷，升一級得三點屬性點數，由你自己分配。</p>
      <h4>武功即裝備</h4><p>最多裝備五門武功。攻擊類提供招式與攻擊力；內功決定氣血內力與內力屬性；身法提高閃避；輔助類不出招，只給看破、減傷、反震、回血等效果。每門裝備中的武功還會依類別加能力值。只有裝備中的武功會在實戰中長進。</p>
      <h4>戰鬥</h4><p>全自動戰鬥。開打前先擲 d20 決定這一戰的戰力：<b>10 點＝100% 戰力</b>，點數越高越強、越低越弱（戰力＝點數 ÷ 10，擲 5 點只有 50%）；<b>擲出 20 無敵</b>，對手傷不了你。也可以「跳過投擲」，直接以 10 點計。之後雙方自動對打，主角會偶爾使出絕招（耗內力），一直打到一方血量歸零。每場新戰鬥開始都是滿血，輸了扣一顆命，打不過可以投降。</p>
      <h4>時間與大事</h4><p>歷史大事照原樣在固定的日子、地點發生；人在現場就能親眼目睹，錯過了只會聽到傳聞。日子近了，會有劇情帶你趕到現場。路上偶爾會回城一趟：可以找商人買賣東西（貨品每趟重新隨機、每件限買一次）、住客棧休息，或直接離開。</p>
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
// 商人：買（本次貨品，每件限買一次）／賣（行囊裡有價錢的東西，原價一半）
MENUS.shop = () => {
  const o = UI.ov, tab = o.tab === 'sell' ? 'sell' : 'buy';
  const stx = it => Object.keys(it.st || {}).map(k => `${STAT_N[k]}+${it.st[k]}`).join('、');
  const dsc = it => [it.d || (it.kind === 'weapon' ? `${TYPE_N[it.wt]}威力+${it.atk}（僅對同類武功有效）` : it.kind === 'armor' ? `防禦+${it.def}` : it.kind === 'acc' ? '飾品' : it.kind === 'manual' ? `武功「${SKILLS[it.skill].n}」的秘笈，買下就學會` : ''), stx(it)].filter(Boolean).join('・');
  const seg = `<div class="seg two">${[['buy', '買'], ['sell', '賣']].map(x => `<button type="button" class="${tab === x[0] ? 'on' : ''}"${h(() => { o.tab = x[0]; render(); })}>${x[1]}</button>`).join('')}</div>`;
  const purse = `<p class="desc">身上銀兩 <b class="price">${S.silver}</b></p>`;
  let list;
  if (tab === 'buy') {
    const stock = (S.town && S.town.stock) || [];
    list = stock.length ? stock.map((e, i) => {
      const it = ITEMS[e.id];
      return `<article class="card row-card${e.sold ? ' sold' : ''}"><span class="itemic">${ico(itemIcon(it), 'big')}</span><div><b>${it.n}</b>${it.kind === 'manual' ? ' <span class="tag gold">武功</span>' : ''}<p>${dsc(it)}</p><p class="price">${it.price} 兩</p></div>${B(e.sold ? '已售' : '購買', () => shopBuy(i), 'mini', e.sold || S.silver < it.price)}</article>`;
    }).join('') : '<p class="empty">貨架空了。</p>';
  } else {
    const ids = Object.keys(S.inv).filter(id => ITEMS[id] && ITEMS[id].price);
    list = ids.length ? ids.map(id => {
      const it = ITEMS[id], used = gearUsed(id) && S.inv[id] === 1;
      return `<article class="card row-card"><span class="itemic">${ico(itemIcon(it), 'big')}</span><div><b>${it.n}</b> ×${S.inv[id]}${used ? ' <span class="tag jade">使用中</span>' : ''}<p>${dsc(it)}</p><p class="price">收購 ${sellPrice(id)} 兩</p></div>${B('賣出', () => shopSell(id), 'mini', used)}</article>`;
    }).join('') : '<p class="empty">行囊裡沒有可賣的東西。</p>';
  }
  return ['商人', seg + purse + list];
};


/* ---------- 單一故事閱讀區：事件、結果、下一章直接銜接 ---------- */
/* 漸進顯示故事文字；逐段進度只存在 UI，重繪後可繼續播放。 */
let storyFrame = 0;
function stopStoryAnimation() {
  if (storyFrame) cancelAnimationFrame(storyFrame);
  storyFrame = 0;
}
function finishStoryAnimation() {
  stopStoryAnimation();
  const state = UI.story;
  if (!state || !state.lines.length) return;
  state.revealed = state.lines.length;
  state.chars = 0;
  const root = document.getElementById('app');
  const node = root.querySelector('.reader-line.is-typing .reader-visible');
  if (node) node.textContent = state.lines[state.lines.length - 1].text;
  const line = root.querySelector('.reader-line.is-typing');
  if (line) line.classList.remove('is-typing');
  root.classList.remove('story-typing');
}
function activateStoryAnimation(root) {
  stopStoryAnimation();
  root.classList.remove('story-typing');
  if (UI.screen !== 'game' || UI.tab !== 'world' || !UI.ov || UI.ov.k !== 'event') return;
  const state = UI.story;
  if (!state || !state.lines.length || state.revealed >= state.lines.length) return;
  const line = root.querySelector('.reader-line.is-typing');
  const span = line && line.querySelector('.reader-visible');
  if (!span) return;
  const letters = Array.from(state.lines[state.lines.length - 1].text);
  let shown = Math.max(0, Math.min(state.chars || 0, letters.length));
  span.textContent = letters.slice(0, shown).join('');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishStoryAnimation();
    return;
  }
  root.classList.add('story-typing');
  if (state.lines.length > 1 && line.scrollIntoView) line.scrollIntoView({ block: 'nearest' });
  const begun = performance.now(), offset = shown;
  const tick = now => {
    if (UI.story !== state || !line.isConnected) { storyFrame = 0; return; }
    shown = Math.min(letters.length, offset + Math.floor((now - begun) / 23));
    state.chars = shown;
    span.textContent = letters.slice(0, shown).join('');
    if (shown >= letters.length) { finishStoryAnimation(); return; }
    storyFrame = requestAnimationFrame(tick);
  };
  storyFrame = requestAnimationFrame(tick);
}

function eventReader(o) {
  const pendingPage = !o.result && o.pages && o.pi < o.pages.length - 1;
  const state = UI.story || {
    lines: [{ kind: 'prose', text: String(o.result || (o.pages ? o.pages[o.pi] : o.text) || '') }],
    revealed: 1, chars: 0
  };
  const lines = state.lines;
  const typing = state.revealed < lines.length;
  const label = esc(o.type || '江湖');
  const place = LOCS[S.loc] ? esc(LOCS[S.loc].n) : '';
  // 常見小事件以文字為主；只有重要事件或有登場人物時展示短畫幅。
  const media = o.who && FACES.includes(o.who)
    ? `<div class="reader-media reader-character">${face(o.who, 'reader-face')}</div>`
    : o.big && o.art
      ? `<div class="reader-media reader-landscape">${art(o.art, o.title)}</div>`
      : '';
  let controls;
  if (o.result) {
    controls = B('繼續', closeEvent, 'story-option');
  } else if (pendingPage) {
    controls = B('繼續', () => {
      o.pi++;
      storyAppend('prose', o.pages[o.pi]);
      render();
    }, 'story-option');
  } else if (!o.choices || !o.choices.length) {
    controls = B('繼續', closeEvent, 'story-option');
  } else {
    controls = o.choices.map((c, i) =>
      `<button type="button" class="btn story-option event-choice side-${c.s || 'n'}"
        ${c.dis ? ' disabled' : h(() => choose(i))}>
        ${c.plain ? '' : `<span class="choice-kind">${SIDE_LABEL[c.s] || '選擇'}</span>`}
        <span class="choice-content">${esc(c.t)}
          ${c.dis && c.reqT ? `<small>（${esc(c.reqT)}）</small>` : ''}
        </span>
      </button>`).join('');
  }
  const prompt = o.result || pendingPage || !o.choices || !o.choices.length
    ? '接下來' : '你會如何抉擇？';
  const transcript = lines.map((line, i) =>
    `<p class="reader-line reader-${line.kind}${typing && i === lines.length - 1 ? ' is-typing' : ''}" data-line-index="${i}">
      <span class="reader-screenreader">${esc(line.text)}</span>
      <span class="reader-visible" aria-hidden="true">${esc(line.text)}</span>
    </p>`).join('');
  return `<article class="story-stage event-reader" aria-label="江湖事件">
    <div class="story-heading">
      <span class="story-chapter">${label} · ${place} · ${dateStr()}</span>
      <h2>${esc(o.title || '江湖紀事')}</h2>
    </div>
    ${media}
    <div class="story-prose" aria-label="當前故事">${transcript}</div>
    <button type="button" class="reader-skip" data-story-skip>點按顯示全文</button>
    <div class="story-choice-block">
      <p class="story-question">${prompt}</p>
      <div class="story-options" role="group" aria-label="故事選擇與繼續">
        ${controls}
      </div>
    </div>
  </article>`;
}

function overlay() {
  const o = UI.ov;
  if (o.k === 'menu') {
    const [title, body] = MENUS[o.m]();
    return `<div class="veil"><div class="sheet"><div class="sheet-h"><h2>${title}</h2>${B(o.m === 'shop' ? '離開' : '關閉', o.m === 'shop' ? closeShop : closeMenu, 'mini')}</div>${body}</div></div>`;
  }
  // 故事事件已搬進江湖閱讀區；其他系統視窗維持原有處理。
  if (o.k === 'event') return '';
  if (o.k === 'lvup') {
    const used = Object.values(o.add).reduce((a, b) => a + b, 0), left = S.pts - used;
    return `<div class="veil"><div class="sheet lvup">
      <h2>等級提升！</h2><p class="lv">Lv ${S.lv}</p>
      <p class="desc">屬性點數 <b class="pts">${left}</b>　分配到想要的能力上（下列為本身數值，不含裝備加成）。</p>
      <div class="lvrows">${Object.keys(STAT_N).map(k => `<div class="lvr"><span>${ico(k, 'lvic')}${STAT_N[k]}<small>${STAT_D[k]}</small></span><b>${S.base[k] + (o.add[k] || 0)}${o.add[k] ? `<em>+${o.add[k]}</em>` : ''}</b>${B('＋', () => lvAdd(k), 'plus', left <= 0 || S.base[k] + (o.add[k] || 0) >= 30)}</div>`).join('')}</div>
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
};
ICON.X = ICON.S;

/* 大骰子：依光源方向為每個切面算明暗（左上受光），加上斜角、內陰影、磨砂顆粒與高光。
   tone：red 朱漆、gold 金漆（大成功）、iron 灰鐵（大失敗）。 */
function d20Svg(tone = 'red') {
  const [hue, sat] = { red: [9, 66], gold: [42, 80], iron: [28, 4] }[tone];
  const cx = 12, cy = 12, R = 10, Rw = R * 0.66;
  const ang = i => (-90 + 60 * i) * Math.PI / 180;
  const V = [0, 1, 2, 3, 4, 5].map(i => [cx + R * Math.cos(ang(i)), cy + R * Math.sin(ang(i))]);
  const W = [0, 1, 2, 3, 4, 5].map(i => [cx + Rw * Math.cos(ang(i)), cy + Rw * Math.sin(ang(i))]);
  const L = [-0.5, -0.87];                       // 光從左上來
  const lit = i => { const m = ang(i) + Math.PI / 6; return (Math.cos(m) * L[0] + Math.sin(m) * L[1] + 1) / 2; }; // 0 背光 ~ 1 迎光
  const pt = p => p.map(v => v.toFixed(2)).join(',');
  const bevel = V.map((p, i) => {
    const q = V[(i + 1) % 6], wp = W[i], wq = W[(i + 1) % 6];
    const l = 18 + 42 * lit(i);
    return `<polygon points="${pt(p)} ${pt(q)} ${pt(wq)} ${pt(wp)}" fill="hsl(${hue} ${sat}% ${l.toFixed(1)}%)"/>`;
  }).join('');
  const face = `<polygon points="${W.map(pt).join(' ')}" fill="hsl(${hue} ${sat}% 40%)"/>`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><defs>
    <radialGradient id="dFace" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
    <radialGradient id="dSpec" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="dGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 .75" result="a"/><feComposite in="a" in2="SourceAlpha" operator="in"/></filter>
    <filter id="dInner" x="-5%" y="-5%" width="110%" height="110%"><feOffset in="SourceAlpha" dx=".4" dy=".6" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="rim"/><feGaussianBlur in="rim" stdDeviation=".35" result="rb"/><feFlood flood-color="#1a0401" flood-opacity=".75"/><feComposite in2="rb" operator="in" result="sh"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/></feMerge></filter>
  </defs>
  <g filter="url(#dInner)">${bevel}${face}
    <polygon points="${W.map(pt).join(' ')}" fill="url(#dFace)"/>
    <polygon points="${V.map(pt).join(' ')}" fill="none" stroke="hsl(${hue} ${sat}% 12%)" stroke-width=".55" stroke-linejoin="round"/>
    <polygon points="${W.map(pt).join(' ')}" fill="none" stroke="hsl(${hue} ${sat}% 78%)" stroke-width=".3" stroke-linejoin="round" opacity=".55"/>
  </g>
  <polygon points="${V.map(pt).join(' ')}" fill="#000" filter="url(#dGrain)" opacity=".5"/>
  <ellipse cx="8.6" cy="7.6" rx="3.2" ry="1.9" fill="url(#dSpec)" transform="rotate(-32 8.6 7.6)"/>
  </svg>`;
}

/* ---------- 全自動戰鬥畫面 ---------- */
const hero = () => `<svg viewBox="0 0 64 80" aria-hidden="true"><ellipse cx="32" cy="76" rx="17" ry="3.5" fill="#000" opacity=".22"/><path d="M19 71L23 36Q32 24 41 36L45 71Z" fill="#4f8a6e"/><path d="M23 36Q32 24 41 36L39 44Q32 40 25 44Z" fill="#3d6f57"/><circle cx="32" cy="27" r="9.5" fill="#4f8a6e"/><circle cx="33" cy="29" r="5.2" fill="#ecd9bb"/><path d="M44 54L60 28" stroke="#e8edf0" stroke-width="3.4" stroke-linecap="round"/><path d="M43 56L47 51" stroke="#7a4f27" stroke-width="4.5" stroke-linecap="round"/></svg>`;
const foeFig = style => style === 'beast'
  ? `<svg viewBox="0 0 80 64" aria-hidden="true"><ellipse cx="40" cy="60" rx="26" ry="3.5" fill="#000" opacity=".22"/><ellipse cx="38" cy="38" rx="22" ry="13" fill="#8a5a3a"/><circle cx="62" cy="30" r="10" fill="#9a6642"/><path d="M58 22l-2-8 6 5zM66 21l3-7 2 8z" fill="#7a4a2c"/><circle cx="65" cy="29" r="1.8" fill="#f2d35a"/><path d="M22 46v12M32 48v10M46 48v10M56 46v12" stroke="#6e4528" stroke-width="5" stroke-linecap="round"/><path d="M17 36q-9-6-9-16" stroke="#8a5a3a" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`
  : style === 'puppet'
  ? `<svg viewBox="0 0 64 80" aria-hidden="true"><ellipse cx="32" cy="76" rx="17" ry="3.5" fill="#000" opacity=".22"/><rect x="20" y="34" width="24" height="34" rx="3" fill="#7d7468"/><rect x="24" y="14" width="16" height="18" rx="3" fill="#8f8678"/><circle cx="29" cy="22" r="2.2" fill="#e5533d"/><circle cx="36" cy="22" r="2.2" fill="#e5533d"/><rect x="8" y="36" width="12" height="7" rx="2" fill="#6a6258"/><rect x="44" y="36" width="12" height="7" rx="2" fill="#6a6258"/><rect x="22" y="68" width="8" height="8" fill="#6a6258"/><rect x="34" y="68" width="8" height="8" fill="#6a6258"/></svg>`
  : `<svg viewBox="0 0 64 80" aria-hidden="true"><ellipse cx="32" cy="76" rx="17" ry="3.5" fill="#000" opacity=".22"/><path d="M19 71L23 36Q32 24 41 36L45 71Z" fill="#a34a3f"/><path d="M23 36Q32 24 41 36L39 44Q32 40 25 44Z" fill="#7f352d"/><circle cx="32" cy="27" r="9.5" fill="#a34a3f"/><circle cx="31" cy="29" r="5.2" fill="#e3c6a4"/><path d="M6 24L44 62" stroke="#caa86a" stroke-width="3" stroke-linecap="round"/><path d="M2 20L9 27L5 29Z" fill="#dfe5e8"/></svg>`;
/* ---------- 戰鬥畫面：頂部角色列與底部導覽（像素風，依參考圖） ---------- */
const SOLID = new Set(['shield', 'star', 'bag', 'box', 'person', 'coin']);
const pxIcon = (name, color, n) => PIX.icon(IC[name], color, n, SOLID.has(name));
const STAT_COL = { str: '#B8453F', con: '#4C7BA8', int: '#8A55A8', agi: '#C9A24A', luck: '#4F8F55', cha: '#5A62B0' };
// 頂部角色列：戰鬥內外共用同一個（戰鬥中壓暗、齒輪不能按）
/* 武俠名牌：不用低質量卡通假臉，也不冒用有名字的 NPC 立繪。 */
function playerAvatar(dim = false) {
  const nameGlyph = esc(Array.from(S.name || '俠')[0] || '俠');
  const inner = '<span class="avatar-corner avatar-corner-tl"></span>' +
    '<span class="avatar-corner avatar-corner-br"></span>' +
    '<span class="avatar-glyph">' + nameGlyph + '</span>' +
    '<span class="avatar-small">江湖</span>';
  return dim ? '<span class="hport" aria-hidden="true">' + inner + '</span>' :
    '<button type="button" class="hport" aria-label="查看人物資料"' +
    h(() => { UI.tab = 'me'; render(); window.scrollTo(0, 0); }) + '>' +
    inner + '</button>';
}
function gameHud(dim) {
  const gear = dim ? '' : '<button type="button" class="hgear" aria-label="設定"' +
    h(() => openMenu('settings')) + '>' + ico('settings') + '</button>';
  const statI = { str:'力', con:'骨', int:'悟', agi:'身', luck:'緣', cha:'魅' };
  const miniStats = '<div class="hud-stats-mini" aria-label="六項能力值">' +
    Object.keys(STAT_N).map(k =>
      '<span class="mini-stat ms-' + k + '" title="' + esc(STAT_N[k]) +
      '" aria-label="' + esc(STAT_N[k]) + ' ' + S.stats[k] + '">' +
      '<span class="mini-stat-mark">' + (statI[k] || esc(STAT_N[k].slice(0,1))) +
      '</span><b>' + S.stats[k] + '</b></span>').join('') + '</div>';
  return '<header class="bhud' + (dim ? ' dim' : '') + '" aria-label="人物狀態">' +
    '<div class="hud-core">' + playerAvatar(dim) +
    '<div class="hud-identity">' +
      '<div class="hname">' + esc(S.name) + '<small>Lv ' + S.lv + '</small></div>' +
      '<div class="hfame">' + esc(fameTitle()) + '</div>' +
      '<div class="hud-life"><span aria-label="氣血">' +
        '<span class="vital-label">命</span><span class="ico">' + hearts() + '</span></span>' +
        '<span aria-label="內力"><span class="vital-label">氣</span><span class="ico">' +
        orbs(S.qi, qiMax()) + '</span></span></div>' +
    '</div>' + miniStats + gear +
    '</div>' +
    '<div class="hud-bottom"><span class="hud-date">' +
      dateStr() + ' · ' + season() + '</span>' +
    '<span class="hud-exp">閱歷 ' + S.exp + '/' + expNeed(S.lv) + '</span></div>' +
    '<div class="hxp" role="progressbar" aria-label="閱歷" aria-valuemin="0" aria-valuemax="' +
      expNeed(S.lv) + '" aria-valuenow="' + S.exp +
      '"><i style="width:' + clamp(S.exp / expNeed(S.lv) * 100, 0, 100) + '%"></i></div>' +
    '</header>';
}
// 底部導覽：江湖／人物／行囊；戰鬥中同一排圖示壓暗、不能按
// 固定三分頁，保持遊戲介面視覺一致。戰鬥時仍保留不可操作狀態。
const TAB_DEF = [['world', '江湖', 'compass'], ['me', '人物', 'person'], ['bag', '行囊', 'bag']];
function gameNav(active, live) {
  return '<nav class="bnav' + (live ? ' live' : '') + '" aria-label="主要分頁">' +
    TAB_DEF.map(t => live
      ? '<button type="button" class="nav-tab ' + (active === t[0] ? 'on' : '') +
        '" aria-label="' + t[1] + '"' +
        (active === t[0] ? ' aria-current="page"' : '') +
        h(() => { UI.tab = t[0]; render(); window.scrollTo(0, 0); }) + '>' +
        '<span class="nav-mark nav-' + t[0] + '">' + ico(t[2]) + '</span>' +
        '<span class="nav-label">' + t[1] + '</span></button>'
      : '<span class="nav-tab" aria-hidden="true"><span class="nav-mark nav-' +
        t[0] + '">' + ico(t[2]) + '</span><span class="nav-label">' +
        t[1] + '</span></span>').join('') + '</nav>';
}
// 戰鬥背景：用事件或所在地的場景圖，不再固定同一張
const battleBg = o => [o.art, LOCS[S.loc] && LOCS[S.loc].art, 'road'].find(k => k && k !== 'fight' && ART[k]) || 'road';

function battleView(o) {
  const e = o.e, adv = o.over ? null : advPct(o), pw = power() * (o.roll ? o.mult : 1), bm = basicMove();
  const fx = [o.fx.bleed ? '流血' : '', o.fx.poison ? '中毒' : '', o.fx.stun ? '震暈' : '', o.fx.weak ? '破勢' : ''].filter(Boolean).map(x => `<span class="tag seal">${x}</span>`).join('');
  const chips = ids => ids.map(id => `<i class="ac r-${artRole(id)} tier-${SKILLS[id].tier}" title="${SKILLS[id].n}">${ico(artIcon(id))}<small>${SKILLS[id].n.slice(0, 2)}</small></i>`).join('');
  const pop = o.pop || { toE: 0, toP: 0 }, fight = o.phase === 'fight';
  const pcls = `fgt p${fight && pop.toE ? ' atk' : ''}${fight && pop.toP ? ' hit' : ''}${o.god ? ' god' : ''}`;
  const ecls = `fgt e${fight && pop.toP ? ' atk' : ''}${fight && pop.toE ? ' hit' : ''}${o.over === 'win' ? ' down' : ''}`;
  const last = o.log[o.log.length - 1];
  // 點數在骰子落定時才揭曉；落定動畫只播一次（之後的重繪不重播）
  const tone = o.roll === 20 ? 'gold' : o.roll === 1 ? 'iron' : 'red';
  const dieCls = `bigdie${o.roll === 20 ? ' crit' : o.roll === 1 ? ' fumble' : ''}`;
  // 3D 骰子由 DIE3 掛載（render 之後執行）；沒有 three.js 時退回平面骰
  const dieInner = DIE3 ? '' : `${d20Svg(tone)}<b>${o.roll == null || o.phase === 'rolling' ? '' : o.roll}</b>`;
  const PB = (label, fn, cls = '') => `<button type="button" class="pxbtn ${cls}"${h(fn)}>${label}</button>`;
  let side;
  if (o.over) side = `<div class="col">${PB(o.over === 'win' ? '收招' : '繼續', endBattle)}</div>`;
  else if (o.phase === 'roll') side = `<div class="col">${PB('擲骰子（1~20）', () => rollBattle(false))}${PB('跳過投擲（10）', () => rollBattle(true))}</div>`;
  else side = '';
  const PXI = (name, color, n) => `<span class="battle-ic" style="color:${color}">${ico(name)}</span>`;
  const ROLE_COL = { atk: '#C0453D', nei: '#2E8F7D', qing: '#C9A24A', sup: '#A8508A' };
  const slot = (name, color, badge) => `<span class="slot2">${PXI(name, color, 16)}${badge ? `<small>${badge}</small>` : ''}</span>`;
  const foeIco = e.style === 'beast' ? 'fist' : e.style === 'blade' || e.style === 'demon' ? 'blade' : e.style === 'puppet' ? 'staff' : 'sword';
  const mine = S.eq.map(id => slot(artIcon(id), ROLE_COL[artRole(id)], S.skills[id].lv)).join('');
  const theirs = e.moves.map(() => slot(foeIco, '#B0463F', '')).join('');
  const shield = `<img class="pxi shd" src="${pxIcon('shield', '#EDE7D3', 12)}" alt="">`;
  const pct = (v, m) => clamp(m ? v / m * 100 : 0, 0, 100);
  return `<div class="veil bveil"><div class="sheet battle auto">
    ${gameHud(true)}
    <div class="bpanel">
      <div class="bhead">
        <div class="side-p"><b>${esc(S.name)}</b><span class="pw">${PXI('sword', '#6B6556', 12)}${pw.toFixed(1)}</span></div>
        <img class="orn" src="${PIX.diamond()}" alt="">
        <div class="adv">${adv == null ? '' : `<b class="${adv >= 50 ? 'win' : 'lose'}">${adv >= 65 ? '優勢' : adv >= 45 ? '勢均' : '劣勢'}</b><span class="${adv >= 50 ? 'win' : 'lose'}">${adv.toFixed(1)}%</span>`}</div>
        <img class="orn" src="${PIX.diamond()}" alt="">
        <div class="side-e"><b>${e.n}</b><span class="pw">${e.P.toFixed(1)}${PXI('sword', '#6B6556', 12)}</span></div>
      </div>
      <div class="hprow">
        <div class="pxbar p">${shield}<i style="width:${pct(S.hp, maxHp())}%"></i><span>${Math.max(0, S.hp)}/${maxHp()}</span></div>
        <div class="pxbar e"><i style="width:${pct(e.hp, e.mhp)}%"></i><span>${Math.max(0, e.hp)}/${e.mhp}</span>${shield.replace('shd"', 'shd r"')}</div>
      </div>
      <div class="arena">${art(battleBg(o), e.n, 'bg')}
        <div class="${pcls}">${hero()}${fight && pop.toP ? `<em class="pop">-${pop.toP}</em>` : ''}</div>
        <div class="${ecls}">${foeFig(e.style)}${fight && pop.toE ? `<em class="pop">-${pop.toE}</em>` : ''}</div>
        ${o.god ? '<div class="godtag">無敵</div>' : ''}
      </div>
      <div class="srow"><div class="sl">${mine}</div><div class="sr">${fx}${theirs}</div>
        ${o.over ? '' : `<button type="button" class="spd"${h(battleSpeed)}>▷▷ x${o.speed === 1 ? 1 : 2}</button>`}</div>
    </div>
    <div class="bdock">
      <div class="surr">${o.over || o.phase !== 'roll' && o.phase !== 'fight' ? '' : `<button type="button" class="pxbtn"${h(pSurrender)}>${ico('flag')}<span>投降</span></button>`}</div>
      <div class="tray ${o.phase === 'roll' ? 'live' : ''}" data-seq="${o.seq || 0}" data-roll="${o.roll == null ? '' : o.roll}" data-phase="${o.phase}" data-tick="${o.tick || 0}" data-tone="${tone}">${DIE3 ? '' : `<div class="${dieCls}">${dieInner}</div>`}</div>
      <div class="side">${side}</div>
    </div>
    ${gameNav(null, false)}
  </div></div>`;
}

/* ---------- 啟動 ---------- */
document.addEventListener('click', ev => {
  if (ev.target.closest('[data-story-skip], .reader-line.is-typing')) {
    finishStoryAnimation(); return;
  }
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
