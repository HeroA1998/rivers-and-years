'use strict';
/* 氣（v9.2）：命之外的第二條資源，參考 Life in Adventure 的理智值。
   ‧ 氣是心力。上限沿用舊公式（隨悟性、根骨、等級成長，3～9 點）。
   ‧ 卡片檢定失敗先扣氣；氣耗盡了才扣命。
   ‧ 氣為零時「心神俱疲」：所有檢定難度 +2。
   ‧ 每月自然回一點；升級時全滿；歇宿、喝酒、聽曲、節慶、與知心人相處會回氣；目睹慘事、做了違心事會傷氣。 */

// 回氣（原本是空函式）
gainQi = function (n) {
  if (!S) return '';
  const d = Math.max(0, Math.min(n, qiMax() - S.qi));
  S.qi += d;
  return d ? `〔氣+${d}〕` : '';
};
// 傷氣：氣扣到零是警告；氣已經是零時再受打擊，就是心神崩潰（這一世結束）
function qiLoss(n = 1) {
  if (!S) return '';
  const startZero = S.qi <= 0;
  let lost = 0;
  for (let i = 0; i < n && S.qi > 0; i++) { S.qi--; lost++; }
  if (startZero) { S.flags.breakdown = 1; return '〔氣已耗盡〕〔心神崩潰〕你再也撐不住了……'; }
  if (S.qi === 0) return `〔氣-${lost}・氣已耗盡，再受一次打擊就會崩潰〕`;
  if (S.qi === 1) return `〔氣-${lost}・只剩一點氣了〕`;
  return `〔氣-${lost}〕`;
}
// 詭異、嚇人的事：辟邪的人不怕，悟性高的人看得出門道（反而回氣），其他人才會傷氣
function shock(n, calm) {
  if (S.stats.int >= 14) return (calm ? '\n\n' + calm : '') + gainQi(1);
  if (gearFx('ward') >= 1) return '〔辟邪：你心裡很穩，沒被嚇到〕';
  return qiLoss(n);
}
const qiPen = () => (S && S.qi <= 0 ? 2 : 0);

// gain() 認得 qi：正數回氣，負數傷氣
{
  const _gain = gain;
  gain = function (o) {
    if (!o || !o.qi) return _gain(o);
    const rest = Object.assign({}, o); delete rest.qi;
    const t = o.qi > 0 ? gainQi(o.qi) : qiLoss(-o.qi);
    return _gain(rest) + t;
  };
}

// 心神俱疲：檢定難度 +2（顯示的成功率也一起算）
{
  const _check = check, _odds = checkOdds;
  check = (stat, dc) => _check(stat, dc + qiPen());
  checkOdds = (stat, dc) => _odds(stat, dc + qiPen());
}

// 卡片檢定失敗：結果裡沒扣命也沒扣氣，就扣一點氣（氣耗盡才扣命）
resolveOpt = function (o) {
  if (o.shop) return { shop: true };
  if (o.days) advanceSteps(o.days);
  if (o.fight) {
    S.flags.sinceFight = 0;
    return { battle: foe(...o.fight.foe), noFlee: o.noFlee, win: () => applyOutcome(o.fight.win), lose: s => { half(s); return applyOutcome(o.fight.lose); } };
  }
  if (!o.stat) return applyOutcome(o.ok);
  const c = check(o.stat, o.dc);
  if (c.ok) return rollLine(c) + applyOutcome(o.ok) + gainExp(6);
  const l0 = S.life, q0 = S.qi, t = rollLine(c) + applyOutcome(o.no || ['你沒能成功。']);
  return t + (S.life === l0 && S.qi === q0 ? qiLoss(1) : '');
};

// 每月回一點氣
{
  const _onMonth = onMonth;
  onMonth = function () { _onMonth(); if (S && S.qi < qiMax()) S.qi++; };
}

// 舊存檔：沒有 qi 欄位或超過上限時補正
{
  const _migrate = migrate;
  migrate = function (s) {
    const r = _migrate(s);
    if (typeof r.qi !== 'number' || isNaN(r.qi)) r.qi = 3;
    return r;
  };
}

// 命與氣分開之後，「氣血」改稱「命」，免得和氣混淆
{
  const _hurt = hurt, _heal = heal;
  hurt = function (n) { return _hurt(n).replace(/氣血/g, '命'); };
  heal = function (n) { return _heal(n).replace(/氣血/g, '命'); };
  GAIN_N.hp = '命';
}

// 心神崩潰：在事件結束、回到主畫面時結算
{
  const _pump = pump;
  pump = function (a) {
    if (S && S.flags && S.flags.breakdown && UI.screen === 'game' && !(UI.ov && UI.ov.k === 'battle')) { S.flags.breakdown = 0; UI.ov = null; return retire('崩潰'); }
    return _pump(a);
  };
}
