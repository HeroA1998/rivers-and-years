/* 江湖歲月錄 — 戰鬥背景：用程式繪製的彩色場景（不載入圖檔）。
   每個場景一組色票，畫天色、日月、遠中近三層山、地面，再依場景加上河水、城樓、寶塔、雪、洞穴光、船、星空等。
   同一個場景＋同一個敵人名稱，畫出來永遠一樣（以 seedRand 固定亂數）。 */
'use strict';

// [天頂, 地平線, 遠山, 中山, 近地, 日月, 霧色]
const BB_PAL = {
  river:    ['#6FA9C6', '#EAF2E4', '#7FA69A', '#4F8170', '#3B6550', '#F8DD8E', '#F2F6EC'],
  city:     ['#E0865A', '#F8D9A2', '#A0665E', '#734B44', '#4C3430', '#FFE18A', '#F7E3C4'],
  mountain: ['#86A2C4', '#EAEFF3', '#8396B4', '#5E7396', '#3F5170', '#FFF2D0', '#EEF2F6'],
  desert:   ['#E7B06A', '#F9E6B6', '#D29A58', '#B8743F', '#93562F', '#FFF3C0', '#FBEBC8'],
  snow:     ['#A9CBE4', '#F5FAFD', '#B3C6D9', '#8EA7C2', '#E9F1F8', '#FFFFFF', '#F7FBFE'],
  cave:     ['#1B1730', '#3B2F55', '#2E2545', '#221A37', '#150F22', '#B79CFF', '#3A2D5A'],
  temple:   ['#C24A3B', '#F5CC8E', '#A3443A', '#7C2E29', '#511E1B', '#FFD872', '#F8DDB0'],
  valley:   ['#78BE86', '#EEF7DA', '#64A273', '#447F55', '#2E5E3D', '#FFF1AE', '#F1F8E2'],
  dock:     ['#5AA4B6', '#D3ECEA', '#5590A0', '#346C7B', '#224D59', '#FFE6A4', '#E6F4F2'],
  cliff:    ['#C9683A', '#F3D3B0', '#A55A3B', '#7E3E2B', '#55291D', '#FFCB80', '#F6DEC6'],
  peak:     ['#7798B5', '#DFEAF1', '#7590AA', '#56718C', '#3C526A', '#FAF5E6', '#EAF0F5'],
  road:     ['#E2BC66', '#FBF0CC', '#BFA05B', '#927C47', '#6C5B36', '#FFF0AE', '#FAF0D6'],
  fight:    ['#B4493A', '#ECBB8C', '#86403A', '#62302C', '#412422', '#FFD3A0', '#F2D2B4'],
  taoist:   ['#7BB8A6', '#E6F4EF', '#69A493', '#4A8173', '#315F55', '#FFFBE0', '#EEF8F4'],
  night:    ['#171D3C', '#33407A', '#26305A', '#1A2143', '#0F1430', '#E8EAF4', '#2A3566'],
  love:     ['#D98AA0', '#F9E0D8', '#B97A8C', '#8E5C6E', '#634150', '#FFE4E8', '#FAE8EA'],
  legacy:   ['#9A8AC0', '#EEE6F2', '#8B7FAD', '#675D8A', '#463F66', '#FFF1C8', '#F1ECF6'],
};
const BB_ALIAS = { title: 'mountain', end: 'night', luck: 'valley' };

function paintBattleBg(cv, scene, seed) {
  const key = BB_PAL[scene] ? scene : BB_ALIAS[scene] || 'road';
  const P = BB_PAL[key];
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const r = seedRand('bb' + key + (seed || ''));
  const dark = key === 'night' || key === 'cave';
  g.save(); g.clearRect(0, 0, W, H); g.globalAlpha = 1;

  // 天色
  const sky = g.createLinearGradient(0, 0, 0, H * 0.75);
  sky.addColorStop(0, P[0]); sky.addColorStop(1, P[1]);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);

  // 星空（夜、洞穴）
  if (dark) {
    for (let i = 0; i < 70; i++) {
      g.globalAlpha = 0.25 + r() * 0.6; g.fillStyle = key === 'cave' ? P[5] : '#FFFFFF';
      g.beginPath(); g.arc(r() * W, r() * H * 0.55, r() * 1.6 + 0.3, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }

  // 日月與光暈
  if (key !== 'cave') {
    const sx = W * (0.62 + r() * 0.24), sy = H * (0.16 + r() * 0.1), sr = key === 'desert' || key === 'love' ? 42 : 30;
    const glow = g.createRadialGradient(sx, sy, sr * 0.4, sx, sy, sr * 4);
    glow.addColorStop(0, P[5]); glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalAlpha = dark ? 0.35 : 0.55; g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.globalAlpha = 1; g.fillStyle = P[5]; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill();
    if (key === 'night') { g.fillStyle = P[0]; g.beginPath(); g.arc(sx + sr * 0.45, sy - sr * 0.2, sr * 0.85, 0, 7); g.fill(); }
  }

  // 一層起伏的山脊
  function ridge(base, amp, color, sharp, alpha) {
    const p1 = r() * 9, p2 = r() * 9, p3 = r() * 9;
    g.globalAlpha = alpha == null ? 1 : alpha; g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      let y = Math.sin(x * 0.006 + p1) * 0.55 + Math.sin(x * 0.017 + p2) * 0.3 + Math.sin(x * 0.043 + p3) * 0.15;
      if (sharp) y = Math.sign(y) * Math.pow(Math.abs(y), 0.55);
      g.lineTo(x, base - (y * 0.5 + 0.5) * amp);
    }
    g.lineTo(W, H); g.closePath(); g.fill(); g.globalAlpha = 1;
  }
  function mist(y, h) {
    const m = g.createLinearGradient(0, y, 0, y + h);
    m.addColorStop(0, 'rgba(255,255,255,0)'); m.addColorStop(0.5, P[6]); m.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalAlpha = dark ? 0.2 : 0.38; g.fillStyle = m; g.fillRect(0, y, W, h); g.globalAlpha = 1;
  }

  const sharp = key === 'peak' || key === 'cliff' || key === 'snow' || key === 'mountain';
  if (key === 'desert') {
    for (let i = 0; i < 3; i++) {
      const p = r() * 9, col = [P[2], P[3], P[4]][i];
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, H * (0.5 + i * 0.14) - Math.sin(x * 0.008 + p) * 24 - Math.sin(x * 0.021 + p * 2) * 10);
      g.lineTo(W, H); g.closePath(); g.fill();
    }
  } else if (key === 'cave') {
    // 洞頂與鐘乳石、洞口光
    const lg = g.createRadialGradient(W * 0.5, H * 0.55, 20, W * 0.5, H * 0.55, W * 0.6);
    lg.addColorStop(0, 'rgba(183,156,255,0.45)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.fillStyle = P[3]; g.beginPath(); g.moveTo(0, 0);
    for (let x = 0; x <= W; x += 18) g.lineTo(x, 24 + r() * 50 + (r() < 0.3 ? 40 : 0));
    g.lineTo(W, 0); g.closePath(); g.fill();
    ridge(H * 0.95, H * 0.25, P[2], false); ridge(H * 1.02, H * 0.18, P[4], false);
  } else {
    ridge(H * 0.66, H * (sharp ? 0.5 : 0.34), P[2], sharp, 0.85); mist(H * 0.4, 110);
    ridge(H * 0.8, H * (sharp ? 0.42 : 0.3), P[3], sharp); mist(H * 0.58, 90);
  }

  // 近地與場景元素
  const groundY = H * 0.82;
  if (key === 'river' || key === 'dock') {
    const wg = g.createLinearGradient(0, groundY - 30, 0, H);
    wg.addColorStop(0, key === 'dock' ? '#4B95A8' : '#7DB8C8'); wg.addColorStop(1, key === 'dock' ? '#1E4D5A' : '#3E7E8E');
    g.fillStyle = wg; g.fillRect(0, groundY - 30, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const x = r() * W, y = groundY - 20 + r() * (H - groundY + 10); g.globalAlpha = 0.3 + r() * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 18 + r() * 30, y); g.stroke(); }
    g.globalAlpha = 1;
    if (key === 'dock') {
      // 船
      const bx = W * (0.15 + r() * 0.2), by = groundY - 4;
      g.fillStyle = '#3B2A1E'; g.beginPath(); g.moveTo(bx - 60, by); g.quadraticCurveTo(bx, by + 26, bx + 60, by); g.closePath(); g.fill();
      g.fillRect(bx - 2, by - 60, 4, 60); g.fillStyle = '#EAD9B0'; g.beginPath(); g.moveTo(bx + 2, by - 58); g.lineTo(bx + 40, by - 20); g.lineTo(bx + 2, by - 12); g.closePath(); g.fill();
    }
    // 岸邊一抹草地
    g.fillStyle = P[4]; g.fillRect(0, H - 22, W, 22);
  } else {
    const gg = g.createLinearGradient(0, groundY - 10, 0, H);
    gg.addColorStop(0, P[4]); gg.addColorStop(1, bbShade(P[4], -0.25));
    g.fillStyle = gg; g.beginPath(); g.moveTo(0, groundY);
    for (let x = 0; x <= W; x += 10) g.lineTo(x, groundY - Math.sin(x * 0.01 + r()) * 4);
    g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
  }

  // 城樓、寶塔、樹
  function roofShape(x, y, w, col) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w / 2 - 10, y + 4);
    g.quadraticCurveTo(x - w / 4, y - 2, x, y - 14); g.quadraticCurveTo(x + w / 4, y - 2, x + w / 2 + 10, y + 4); g.closePath(); g.fill();
  }
  if (key === 'city' || key === 'fight') {
    const wallY = H * 0.74; g.fillStyle = bbShade(P[3], -0.1); g.fillRect(0, wallY, W, groundY - wallY + 4);
    for (let x = 0; x < W; x += 22) g.fillRect(x, wallY - 8, 12, 8);
    const tx = W * (0.35 + r() * 0.3); g.fillStyle = bbShade(P[3], -0.2); g.fillRect(tx - 40, wallY - 46, 80, 46); roofShape(tx, wallY - 46, 90, bbShade(P[3], -0.35));
    g.fillStyle = '#FFD27A'; for (let i = 0; i < 3; i++) g.fillRect(tx - 28 + i * 24, wallY - 34, 8, 12);
  }
  if (key === 'temple' || key === 'taoist') {
    const px = W * (0.18 + r() * 0.15), py = H * 0.78;
    for (let i = 0; i < 4; i++) { const w = 70 * (1 - i * 0.16), y = py - i * 24; g.fillStyle = bbShade(P[3], -0.15); g.fillRect(px - w * 0.3, y - 18, w * 0.6, 18); roofShape(px, y - 18, w, bbShade(P[4], -0.1)); }
    g.fillStyle = P[5]; g.globalAlpha = 0.9; g.beginPath(); g.arc(px, py - 4 * 24 - 6, 4, 0, 7); g.fill(); g.globalAlpha = 1;
  }
  if (key === 'valley' || key === 'road' || key === 'river' || key === 'taoist' || key === 'love') {
    for (let i = 0; i < 5; i++) {
      const x = r() < 0.5 ? r() * W * 0.22 : W * 0.78 + r() * W * 0.22, y = groundY + 6, s = 0.7 + r() * 0.6;
      g.fillStyle = bbShade(P[4], -0.3); g.fillRect(x - 2 * s, y - 34 * s, 4 * s, 34 * s);
      g.fillStyle = key === 'love' ? '#E79AB0' : bbShade(P[3], -0.05);
      for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x + (k - 1) * 9 * s, y - (34 + k * 6) * s, 14 * s, 10 * s, 0, 0, 7); g.fill(); }
    }
  }
  if (key === 'snow') {
    g.fillStyle = '#FFFFFF';
    for (let i = 0; i < 90; i++) { g.globalAlpha = 0.4 + r() * 0.6; g.beginPath(); g.arc(r() * W, r() * H, r() * 2 + 0.6, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  if (key === 'love') {
    for (let i = 0; i < 24; i++) { g.globalAlpha = 0.5 + r() * 0.4; g.fillStyle = '#F6B8C8'; g.beginPath(); g.ellipse(r() * W, r() * H * 0.8, 4, 2.5, r() * 3, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }

  // 下方一層淡暗角，讓人物更清楚
  const vg = g.createLinearGradient(0, H * 0.55, 0, H);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = vg; g.fillRect(0, H * 0.55, W, H * 0.45);
  g.restore();
}

// 顏色變亮（amt>0）或變暗（amt<0）
function bbShade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let rr = n >> 16, gg = (n >> 8) & 255, bb = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + [f(rr), f(gg), f(bb)].map(v => v.toString(16).padStart(2, '0')).join('');
}
