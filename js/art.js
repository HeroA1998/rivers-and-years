/* 江湖歲月錄 — 程式繪製的水墨場景（之後可換成正式美術圖） */
'use strict';

function seedRand(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function paintArt(cv, kind, seed) {
  const g = cv.getContext('2d'), W = cv.width, Hh = cv.height, r = seedRand(kind + seed);
  const cs = getComputedStyle(document.documentElement);
  const C = n => cs.getPropertyValue(n).trim() || '#888';
  const dark = ['night', 'cave', 'love'].includes(kind);
  const paper = C(dark ? '--art-night' : '--art-sky'), ink = C('--art-ink'), seal = C('--seal'), gold = C('--gold'), jade = C('--jade');
  const ia = a => { g.globalAlpha = a; g.fillStyle = ink; g.strokeStyle = ink; };

  // 天色
  g.globalAlpha = 1; g.fillStyle = paper; g.fillRect(0, 0, W, Hh);
  const sky = g.createLinearGradient(0, 0, 0, Hh);
  const tint = kind === 'cliff' ? seal : kind === 'desert' ? gold : ink;
  g.globalAlpha = dark ? 0.3 : 0.16; sky.addColorStop(0, tint); sky.addColorStop(1, 'transparent');
  g.fillStyle = sky; g.fillRect(0, 0, W, Hh);

  // 日月
  const sx = W * (0.62 + r() * 0.25), sy = Hh * (0.2 + r() * 0.1), sr = kind === 'love' || kind === 'desert' ? 46 : 26;
  g.globalAlpha = dark ? 0.9 : 0.75; g.fillStyle = dark ? C('--art-moon') : kind === 'desert' || kind === 'cliff' ? seal : gold;
  g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill();

  // 遠山
  function ridge(base, amp, alpha, sharp) {
    const p1 = r() * 9, p2 = r() * 9, p3 = r() * 9;
    ia(alpha); g.beginPath(); g.moveTo(0, Hh);
    for (let x = 0; x <= W; x += 4) {
      let y = Math.sin(x * 0.006 + p1) * 0.55 + Math.sin(x * 0.017 + p2) * 0.3 + Math.sin(x * 0.041 + p3) * 0.15;
      if (sharp) y = Math.sign(y) * Math.pow(Math.abs(y), 0.6);
      g.lineTo(x, base - (y * 0.5 + 0.5) * amp);
    }
    g.lineTo(W, Hh); g.fill();
  }
  function mist(y, hgt) {
    const m = g.createLinearGradient(0, y, 0, y + hgt);
    m.addColorStop(0, 'transparent'); m.addColorStop(0.5, paper); m.addColorStop(1, 'transparent');
    g.globalAlpha = dark ? 0.35 : 0.8; g.fillStyle = m; g.fillRect(0, y, W, hgt);
  }
  const sharp = kind === 'peak' || kind === 'cliff';
  if (kind === 'desert') {
    g.fillStyle = gold; g.strokeStyle = gold;
    for (let i = 0; i < 3; i++) { const p = r() * 9; g.globalAlpha = 0.22 + i * 0.2; g.beginPath(); g.moveTo(0, Hh); for (let x = 0; x <= W; x += 6) g.lineTo(x, Hh * (0.55 + i * 0.13) - Math.sin(x * 0.008 + p) * 26 - Math.sin(x * 0.02 + p * 2) * 8); g.lineTo(W, Hh); g.fill(); }
  } else if (kind !== 'cave') {
    ridge(Hh * 0.72, Hh * (sharp ? 0.62 : 0.42), 0.14, sharp); mist(Hh * 0.42, 70);
    ridge(Hh * 0.86, Hh * (sharp ? 0.5 : 0.36), 0.28, sharp); mist(Hh * 0.6, 60);
    if (kind === 'cliff') { g.fillStyle = seal; g.globalAlpha = 0.18; g.fillRect(0, Hh * 0.3, W, Hh * 0.7); }
    ridge(Hh * 1.02, Hh * 0.3, 0.6, false);
  }

  // 元件
  function roof(x, y, w) { g.beginPath(); g.moveTo(x - w / 2 - 8, y + 3); g.quadraticCurveTo(x - w / 4, y - 2, x, y - 12); g.quadraticCurveTo(x + w / 4, y - 2, x + w / 2 + 8, y + 3); g.quadraticCurveTo(x, y - 3, x - w / 2 - 8, y + 3); g.fill(); }
  function pagoda(x, y, tiers, w) { ia(0.9); for (let i = 0; i < tiers; i++) { const ww = w * (1 - i * 0.14), yy = y - i * 22; g.fillRect(x - ww * 0.32, yy - 16, ww * 0.64, 16); roof(x, yy - 16, ww); } g.fillRect(x - 1.5, y - tiers * 22 - 22, 3, 16); }
  function pine(x, y, s) { ia(0.85); g.fillRect(x - 1.5 * s, y - 40 * s, 3 * s, 40 * s); for (let i = 0; i < 4; i++) { const yy = y - 40 * s + i * 9 * s, ww = (10 + i * 6) * s; g.beginPath(); g.ellipse(x + (i % 2 ? 5 : -5) * s, yy, ww, 4 * s, 0, 0, 7); g.fill(); } }
  function hall(x, y, w) { ia(0.9); g.fillRect(x - w / 2, y - 18, w, 18); roof(x, y - 18, w + 10); }
  function dots(n, col, a, y0, y1, sz) { g.fillStyle = col; for (let i = 0; i < n; i++) { g.globalAlpha = a * (0.4 + r() * 0.6); g.beginPath(); g.arc(r() * W, y0 + r() * (y1 - y0), sz * (0.5 + r()), 0, 7); g.fill(); } }
  function branch(x, y, len, ang, dep) {
    if (dep === 0) { g.globalAlpha = 0.9; g.fillStyle = seal; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); return; }
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    ia(0.9); g.lineWidth = dep * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    branch(x2, y2, len * 0.72, ang - 0.5 + r() * 0.3, dep - 1); branch(x2, y2, len * 0.66, ang + 0.35 + r() * 0.4, dep - 1);
  }
  const gy = Hh * 0.9;

  if (kind === 'city' || kind === 'night') {
    ia(0.92); g.fillRect(0, gy - 34, W, 60);
    for (let x = 0; x < W; x += 22) g.fillRect(x, gy - 42, 12, 8);
    g.fillRect(W * 0.3 - 46, gy - 70, 92, 40); roof(W * 0.3, gy - 70, 110); g.fillRect(W * 0.3 - 30, gy - 96, 60, 20); roof(W * 0.3, gy - 96, 76);
    g.globalAlpha = 1; g.fillStyle = paper; g.beginPath(); g.arc(W * 0.3, gy - 6, 15, Math.PI, 0); g.fill(); g.fillRect(W * 0.3 - 15, gy - 6, 30, 30);
    hall(W * 0.72, gy - 34, 70); hall(W * 0.86, gy - 34, 46);
    g.fillStyle = seal; for (const x of [W * 0.3 - 34, W * 0.3 + 34, W * 0.72]) { g.globalAlpha = 0.95; g.beginPath(); g.ellipse(x, gy - 54, 5, 7, 0, 0, 7); g.fill(); }
  } else if (kind === 'river') {
    ia(0.5); g.lineWidth = 1.5; for (let i = 0; i < 7; i++) { const y = gy - 30 + i * 8, x = r() * W * 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60 + r() * 120, y); g.stroke(); }
    ia(0.9); const bx = W * 0.36; g.beginPath(); g.moveTo(bx - 44, gy - 22); g.quadraticCurveTo(bx, gy - 6, bx + 48, gy - 24); g.lineTo(bx + 34, gy - 14); g.lineTo(bx - 32, gy - 14); g.fill();
    g.fillRect(bx - 1, gy - 78, 2.5, 58); g.globalAlpha = 0.55; g.beginPath(); g.moveTo(bx + 3, gy - 76); g.quadraticCurveTo(bx + 40, gy - 54, bx + 3, gy - 28); g.fill();
    hall(W * 0.8, gy - 4, 60); pine(W * 0.92, gy, 1);
  } else if (kind === 'mountain' || kind === 'road' || kind === 'snow') {
    for (let i = 0; i < 5; i++) pine(W * (0.08 + r() * 0.84), gy + r() * 14, 0.7 + r() * 0.7);
    if (kind === 'road') { ia(0.3); g.beginPath(); g.moveTo(W * 0.42, Hh); g.quadraticCurveTo(W * 0.6, Hh * 0.8, W * 0.5, Hh * 0.66); g.lineTo(W * 0.53, Hh * 0.66); g.quadraticCurveTo(W * 0.68, Hh * 0.8, W * 0.6, Hh); g.fill(); }
    if (kind === 'snow') dots(90, C('--art-moon'), 0.95, 0, Hh, 2.2);
  } else if (kind === 'peak') {
    hall(W * 0.24, Hh * 0.58, 44); pine(W * 0.14, Hh * 0.6, 0.8); pine(W * 0.8, gy, 1.2);
    ia(0.5); g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 9; i++) { g.moveTo(W * 0.28 + i * 14, Hh * 0.6 + i * 10); g.lineTo(W * 0.28 + i * 14 + 12, Hh * 0.6 + i * 10); } g.stroke();
  } else if (kind === 'temple') {
    pagoda(W * 0.3, gy, 5, 64); hall(W * 0.6, gy, 90); pine(W * 0.84, gy, 1.2); pine(W * 0.1, gy, 0.9);
  } else if (kind === 'valley') {
    hall(W * 0.68, gy, 56); dots(120, C('--rose'), 0.9, Hh * 0.5, Hh, 3.4); dots(40, gold, 0.8, Hh * 0.6, Hh, 2.4);
    branch(W * 0.12, Hh, 56, -1.2, 5);
  } else if (kind === 'cliff') {
    ia(0.95); g.fillRect(W * 0.52, gy - 60, 110, 60); for (let x = 0; x < 110; x += 20) g.fillRect(W * 0.52 + x, gy - 70, 11, 10);
    g.fillRect(W * 0.52 + 40, gy - 104, 30, 44); roof(W * 0.52 + 55, gy - 104, 46);
    g.fillStyle = seal; g.globalAlpha = 0.95; g.fillRect(W * 0.52 + 50, gy - 30, 12, 30); g.beginPath(); g.moveTo(W * 0.52 + 56, gy - 140); g.lineTo(W * 0.52 + 86, gy - 130); g.lineTo(W * 0.52 + 56, gy - 120); g.fill();
    ia(0.9); g.fillRect(W * 0.52 + 54, gy - 140, 2.5, 36);
  } else if (kind === 'desert') {
    ia(0.85); for (let i = 0; i < 4; i++) { const x = W * 0.2 + i * 34, y = Hh * 0.6 + i * 3; g.beginPath(); g.ellipse(x, y, 11, 6, 0, 0, 7); g.fill(); g.fillRect(x - 8, y, 2, 12); g.fillRect(x + 6, y, 2, 12); g.fillRect(x + 8, y - 12, 3, 12); }
  } else if (kind === 'fight') {
    g.save(); g.translate(W / 2, Hh * 0.55);
    for (const s of [-1, 1]) { g.save(); g.rotate(s * 0.72); ia(0.95); g.fillRect(-3, -96, 6, 150); g.fillRect(-18, 36, 36, 6); g.fillStyle = seal; g.globalAlpha = 0.9; g.fillRect(-4, 54, 8, 26); g.restore(); }
    g.restore(); dots(26, seal, 0.8, Hh * 0.2, Hh * 0.9, 4); ia(0.25); g.beginPath(); g.ellipse(W / 2, Hh * 0.58, 150, 46, -0.2, 0, 7); g.fill();
  } else if (kind === 'love') {
    branch(W * 0.02, Hh * 0.84, 80, -0.5, 6); dots(14, seal, 0.7, Hh * 0.5, Hh, 3);
  } else if (kind === 'legacy') {
    pine(W * 0.2, gy, 2.2); ia(0.9); g.fillRect(W * 0.6, gy - 80, 44, 80); g.beginPath(); g.arc(W * 0.6 + 22, gy - 80, 22, Math.PI, 0); g.fill();
    g.globalAlpha = 0.9; g.fillStyle = paper; for (let i = 0; i < 5; i++) g.fillRect(W * 0.6 + 12 + (i % 2) * 12, gy - 74 + i * 13, 8, 8);
    g.fillStyle = seal; g.globalAlpha = 0.9; g.fillRect(W * 0.6 + 16, gy - 12, 12, 12);
  } else if (kind === 'cave') {
    const gl = g.createRadialGradient(W / 2, Hh * 0.6, 10, W / 2, Hh * 0.6, W * 0.5);
    gl.addColorStop(0, gold); gl.addColorStop(0.35, 'transparent'); g.globalAlpha = 0.7; g.fillStyle = gl; g.fillRect(0, 0, W, Hh);
    ia(0.95); g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, Hh); g.lineTo(W * 0.78, Hh);
    g.quadraticCurveTo(W * 0.86, Hh * 0.1, W * 0.5, Hh * 0.12); g.quadraticCurveTo(W * 0.14, Hh * 0.1, W * 0.22, Hh); g.lineTo(0, Hh); g.fill();
    g.fillRect(W / 2 - 22, Hh * 0.72, 44, 8); g.fillStyle = paper; g.globalAlpha = 0.9; g.fillRect(W / 2 - 14, Hh * 0.66, 28, 7);
  }
  if (kind === 'night') dots(40, C('--art-moon'), 0.8, 0, Hh * 0.5, 1.4);

  // 紙紋
  g.fillStyle = ink; for (let i = 0; i < 260; i++) { g.globalAlpha = 0.03 + r() * 0.04; g.fillRect(r() * W, r() * Hh, 1 + r() * 2, 1); }
  g.globalAlpha = 1;
}
