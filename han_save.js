'use strict';
/* 存檔位置（v9.1）
   ‧ 三個存檔位置：標題畫面可以繼續、刪除，或在空位開新遊戲。
   ‧ 進度除了存在這個瀏覽器，也備份到你的帳號（artifact 的私有資料區，只有你自己看得到）。
     換裝置、瀏覽器儲存被清掉、或 app 不保留網頁資料時，進度仍然在；載入時會自動採用較新的那份。
   ‧ 「備份與還原」可以產生存檔代碼，手動搬移或自己留一份。
   ‧ 舊版只有一個存檔，第一次載入時自動搬到存檔 1。 */

const SLOT_N = 3;
const SLOT_KEY = i => 'jianghu_huangjin_v8_s' + i;
const LEGACY_KEY = 'jianghu_huangjin_v8';
const CUR_KEY = 'jianghu_huangjin_cur_slot';
let CUR_SLOT = 1;
const SLOT_MEM = {};   // 瀏覽器不讓寫儲存時，至少在這次開啟期間可以換存檔

const lsGet = k => { try { const v = localStorage.getItem(k); return v == null ? (SLOT_MEM[k] || null) : v; } catch (e) { return SLOT_MEM[k] || null; } };
const lsSet = (k, v) => { SLOT_MEM[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* 無法存檔時照常遊玩 */ } };
const lsDel = k => { delete SLOT_MEM[k]; try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ } };

// 舊版單一存檔 → 存檔 1
(() => {
  const old = lsGet(LEGACY_KEY);
  if (old && old !== 'null' && !lsGet(SLOT_KEY(1))) { lsSet(SLOT_KEY(1), old); }
  if (old) lsDel(LEGACY_KEY);
  const c = +lsGet(CUR_KEY); if (c >= 1 && c <= SLOT_N) CUR_SLOT = c;
})();

const readSlot = i => { try { const t = lsGet(SLOT_KEY(i)); const o = t && t !== 'null' ? JSON.parse(t) : null; return o && o.name && o.date ? o : null; } catch (e) { return null; } };
const setCurSlot = i => { CUR_SLOT = i; lsSet(CUR_KEY, String(i)); };

/* ---------- 帳號備份（db 的私有資料區） ---------- */
let CLOUD = null, CLOUD_UID = null, CLOUD_STATE = 'pending';   // pending 連線中／ok 已連線／off 沒有帳號備份
const cloudDoc = i => CLOUD.collection('data/users/' + CLOUD_UID).doc('slot' + i);
const cloudQueue = {};
let cloudTimer = null, cloudBusy = false;

function cloudCompact(j) {
  if (j.length < 235000) return j;
  try { const o = JSON.parse(j); o.log = (o.log || []).slice(-8); o.journal = (o.journal || []).slice(-15); return JSON.stringify(o); } catch (e) { return j; }
}
async function cloudFlush() {
  if (!CLOUD || cloudBusy) return;
  cloudBusy = true;
  try {
    for (const i of Object.keys(cloudQueue)) {
      const it = cloudQueue[i]; delete cloudQueue[i];
      try { await cloudDoc(+i).set({ t: it.t, j: it.j }); } catch (e) { if (e && e.code === 'unavailable') cloudQueue[i] = cloudQueue[i] || it; }
    }
  } finally { cloudBusy = false; }
}
function cloudPush(i, j, t) {
  if (!CLOUD) return;
  cloudQueue[i] = { t, j: j === '' ? '' : cloudCompact(j) };
  clearTimeout(cloudTimer); cloudTimer = setTimeout(cloudFlush, 2500);
}
async function cloudPull() {
  for (let i = 1; i <= SLOT_N; i++) {
    let snap; try { snap = await cloudDoc(i).get(); } catch (e) { continue; }
    const loc = readSlot(i), lt = loc ? (loc.savedAt || 0) : 0;
    if (snap.exists) {
      const d = snap.data() || {};
      if ((d.t || 0) > lt) { if (d.j) lsSet(SLOT_KEY(i), d.j); else if (loc) lsDel(SLOT_KEY(i)); }
      else if (loc && lt > (d.t || 0)) cloudPush(i, lsGet(SLOT_KEY(i)), lt);
    } else if (loc) cloudPush(i, lsGet(SLOT_KEY(i)), lt || Date.now());
  }
}
(async () => {
  try {
    if (typeof claude === 'undefined' || !claude.use) { CLOUD_STATE = 'off'; return; }
    const [u, d] = await Promise.all([claude.use('user'), claude.use('db')]);
    const uid = u && await u.id();
    if (!d || !uid) { CLOUD_STATE = 'off'; if (typeof UI !== 'undefined' && UI.screen === 'title') render(); return; }
    CLOUD = d; CLOUD_UID = uid;
    await cloudPull();
    CLOUD_STATE = 'ok';
    await cloudFlush();
    if (UI.screen === 'title' || UI.screen === 'backup') render();
  } catch (e) { CLOUD_STATE = 'off'; if (UI.screen === 'title') render(); }
})();
window.addEventListener('pagehide', () => { clearTimeout(cloudTimer); cloudFlush(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(cloudTimer); cloudFlush(); } });

/* ---------- 取代原本的存檔函式 ---------- */
save = function () {
  if (!S) return;
  S.savedAt = Date.now();
  const j = JSON.stringify(S);
  lsSet(SLOT_KEY(CUR_SLOT), j);
  cloudPush(CUR_SLOT, j, S.savedAt);
};
loadSave = function () { return readSlot(CUR_SLOT); };
wipeSave = function () { lsDel(SLOT_KEY(CUR_SLOT)); cloudPush(CUR_SLOT, '', Date.now()); };

/* ---------- 標題畫面：存檔位置 ---------- */
(() => {
  const css = document.createElement('style');
  css.textContent = '.slotcard{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:9px;text-align:left}' +
    '.slotcard .sh{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.slotcard .sh b{font:600 17px var(--f-brush)}' +
    '.slotcard .sm{color:var(--ink2);font-size:13px;line-height:1.5}.slotcard.empty{border-style:dashed}.slotcard .row .btn{flex:1}' +
    '.cloudnote{font-size:12px;color:var(--ink2);text-align:center}.bkbox{width:100%;min-height:150px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font:12px/1.5 monospace;word-break:break-all}';
  document.head.appendChild(css);
})();

const slotSummary = o => `${esc(o.name)}・${reign((o.y0 || 178) + o.date.y - 1)}・Lv ${o.lv || 1}・${cnNum(15 + o.date.y + (o.age0 || 0))}歲` + (o.gen > 1 ? `・第${cnNum(o.gen)}代` : '');
const cloudLine = () => CLOUD_STATE === 'ok' ? '進度已同步備份到你的帳號（換裝置也能繼續）' : CLOUD_STATE === 'pending' ? '正在連線帳號備份……' : '目前沒有帳號備份：進度只存在這個瀏覽器。建議到「備份與還原」留一份代碼。';

SCREENS.title = function () {
  const cards = [];
  for (let i = 1; i <= SLOT_N; i++) {
    const o = readSlot(i);
    cards.push(o
      ? `<div class="slotcard"><div class="sh"><b>存檔 ${i}</b><span class="sm">${slotSummary(o)}</span></div>
          <div class="row">${B('繼續前緣', () => { setCurSlot(i); S = migrate(o); recalc(); UI = { screen: 'game', tab: 'world', ov: null }; Q = []; continueStory(); }, 'primary')}
          ${B('刪除', () => confirmBox(`刪除存檔 ${i}？`, `「${esc(o.name)}」的進度將無法復原。`, () => { const keep = CUR_SLOT; CUR_SLOT = i; lsDel(SLOT_KEY(i)); cloudPush(i, '', Date.now()); CUR_SLOT = keep; render(); }), 'surr')}</div></div>`
      : `<div class="slotcard empty"><div class="sh"><b>存檔 ${i}</b><span class="sm">空位</span></div>
          <div class="row">${B('初入江湖', () => { setCurSlot(i); UI.screen = 'create'; UI.create = { name: '', gender: '男', origin: 0, stats: rollStats(), year: ERAS[0].y, cls: 'swordsman' }; render(); }, 'primary')}</div></div>`);
  }
  return `<div class="title-screen">
      ${art('title', 'title', 'hero')}
      <h1>江湖歲月錄</h1>
      <p class="lead">你不是劉備，也不是關羽、張飛。你只是那個亂世裡的一個小人物——親眼看著英雄起於草莽，也過著自己的一生。</p>
      <div class="col">${cards.join('')}
        ${B('備份與還原', () => { UI.screen = 'backup'; UI.bk = { slot: CUR_SLOT, code: '' }; render(); }, 'mini')}
      </div>
      <p class="cloudnote">${cloudLine()}</p>
      <p class="ver">${VERSION}</p></div>`;
};

/* ---------- 備份與還原 ---------- */
const BK_PREFIX = 'JHSW1:';
const bkEncode = o => BK_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const bkDecode = t => {
  t = String(t || '').replace(/\s+/g, '');
  if (!t.startsWith(BK_PREFIX)) throw new Error('prefix');
  const o = JSON.parse(decodeURIComponent(escape(atob(t.slice(BK_PREFIX.length)))));
  if (!o || !o.name || !o.date || !o.base) throw new Error('shape');
  return o;
};
SCREENS.backup = function () {
  const bk = UI.bk = UI.bk || { slot: CUR_SLOT, code: '' };
  return `<div class="create">
      <h2>備份與還原</h2>
      <p class="note">${cloudLine()}<br>代碼是一長串文字，把它貼到備忘錄收好，之後貼回來就能還原。</p>
      <div class="field">存檔位置</div>
      <div class="seg">${[1, 2, 3].map(i => `<button type="button" class="${bk.slot === i ? 'on' : ''}"${h(() => { bk.slot = i; render(); })}>存檔 ${i}${readSlot(i) ? '' : '（空）'}</button>`).join('')}</div>
      <textarea id="bkcode" class="bkbox" spellcheck="false" placeholder="存檔代碼會出現在這裡；要還原時，把代碼貼在這裡。">${esc(bk.code)}</textarea>
      <div class="row">${B('產生代碼', () => { const o = readSlot(bk.slot); if (!o) { bk.code = ''; return toastRender('這個存檔位置是空的'); } bk.code = bkEncode(o); render(); }, 'mini')}${B('複製', () => { try { navigator.clipboard.writeText(bk.code).then(() => toastRender('已複製'), () => toastRender('複製失敗，請長按文字框手動複製')); } catch (e) { toastRender('複製失敗，請長按文字框手動複製'); } }, 'mini')}</div>
      ${B(`把代碼還原到存檔 ${bk.slot}`, () => {
        try {
          const o = bkDecode(bk.code);
          const doIt = () => { const keep = CUR_SLOT; CUR_SLOT = bk.slot; o.savedAt = Date.now(); const j = JSON.stringify(o); lsSet(SLOT_KEY(bk.slot), j); cloudPush(bk.slot, j, o.savedAt); CUR_SLOT = keep; UI.screen = 'title'; toastRender(`已還原到存檔 ${bk.slot}`); };
          if (readSlot(bk.slot)) confirmBox(`覆蓋存檔 ${bk.slot}？`, '這個位置現有的進度會被代碼裡的進度取代。', doIt); else doIt();
        } catch (e) { toastRender('代碼不正確，請確認貼的是完整的一段'); }
      }, 'primary big')}
      ${B('返回', () => { UI.screen = 'title'; render(); }, 'big')}
    </div>`;
};
document.addEventListener('input', ev => { if (ev.target.id === 'bkcode' && UI.bk) UI.bk.code = ev.target.value; });

/* ---------- 遊戲中：設定裡加上「切換存檔」 ---------- */
(() => {
  const orig = MENUS.settings;
  MENUS.settings = function () {
    const [t, html] = orig();
    const add = A('切換存檔位置', '先存好目前進度，回到標題選擇其他存檔', () => { save(); S = null; UI = { screen: 'title', ov: null }; render(); });
    return [t, html.replace('</div><p class="ver">', add + '</div><p class="ver">')];
  };
})();

// 這個檔案載入時，頁面已經用舊的標題畫面畫過一次；補畫一次
try { if (UI.screen === 'title') render(); } catch (e) { /* 忽略 */ }
