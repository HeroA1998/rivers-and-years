/* 江湖歲月錄 — 戰鬥背景：程序生成的寫實風景（不載入圖檔）。
   1. 低解析度逐像素計算：天空漸層、太陽光暈、雲層、五層山（雜訊地形＋受光面＋岩紋＋大氣霧化＋谷霧）、水面倒影。
   2. 放大到畫布後，在全解析度補上前景細節：草、樹、城樓、寶塔、船、雪、花瓣、光束。
   3. 暗角與膠片顆粒。結果依「場景＋種子」快取，戰鬥中重繪時直接貼上。 */
'use strict';

// sky：天頂、中段、地平線；mts：遠→近五層（最後一層是地面）；haze：霧色
const BB_PAL = {
  river:    { sky: ['#4F86BA', '#A9C9DE', '#EDE6D2'], haze: '#C4D6DE', mts: ['#8DA2B0', '#6F8C93', '#557770', '#41624F', '#36522F'], water: '#3D6E7E', sun: '#FFF0C4', sunX: 0.72, sunY: 0.2, cloud: 0.5, ridged: 0.45, feat: ['water', 'trees', 'rays'] },
  dock:     { sky: ['#3F86A8', '#9FCAD6', '#E9EEE0'], haze: '#BFD7DB', mts: ['#7F9CAA', '#5F818C', '#466974', '#34535B', '#2B4348'], water: '#2D6273', sun: '#FFEFC2', sunX: 0.3, sunY: 0.22, cloud: 0.45, ridged: 0.35, feat: ['water', 'boat'] },
  city:     { sky: ['#C9693F', '#F0A866', '#FBDDA8'], haze: '#EDC69A', mts: ['#B08A78', '#8E6B5C', '#6E5246', '#503B33', '#3E2E27'], sun: '#FFE7A8', sunX: 0.7, sunY: 0.3, cloud: 0.35, ridged: 0.3, feat: ['city', 'rays'] },
  fight:    { sky: ['#8E3328', '#D7724A', '#F4C08A'], haze: '#E3A783', mts: ['#9C6155', '#7A4740', '#5C3631', '#432824', '#33201C'], sun: '#FFD9A0', sunX: 0.62, sunY: 0.32, cloud: 0.4, ridged: 0.4, feat: ['city', 'rays', 'grass'] },
  mountain: { sky: ['#3E6EA6', '#9DBAD6', '#E8EDF0'], haze: '#C6D3E0', mts: ['#9AAABE', '#7B8DA6', '#5D708A', '#46566B', '#3A4733'], sun: '#FFF5DC', sunX: 0.68, sunY: 0.18, cloud: 0.55, ridged: 0.8, feat: ['pines', 'grass'] },
  peak:     { sky: ['#355E92', '#90AFCF', '#E4EBF0'], haze: '#C8D5E2', mts: ['#A6B4C6', '#8494AB', '#64758D', '#4B5A6E', '#3C4757'], sun: '#FFF8E8', sunX: 0.3, sunY: 0.16, cloud: 0.6, ridged: 0.95, snow: 0.55, feat: ['pines'] },
  snow:     { sky: ['#6C93BC', '#B7CDE0', '#EEF3F6'], haze: '#D8E3EC', mts: ['#AEBDCF', '#93A6BD', '#7A90AA', '#9FB1C4', '#E2EAF1'], sun: '#FFFFFF', sunX: 0.75, sunY: 0.2, cloud: 0.7, ridged: 0.8, snow: 0.85, feat: ['pines', 'snowfall'] },
  cliff:    { sky: ['#9E5435', '#DE9A68', '#F5D4AE'], haze: '#E8BC97', mts: ['#B57C5E', '#9A5E44', '#7C4632', '#5C3224', '#45261B'], sun: '#FFD898', sunX: 0.24, sunY: 0.26, cloud: 0.3, ridged: 0.95, feat: ['rays'] },
  desert:   { sky: ['#D08B44', '#EFC27C', '#FBE6BC'], haze: '#F2D3A0', mts: ['#E0B37A', '#D29A5D', '#BE8146', '#A86A37', '#94592C'], sun: '#FFF6D2', sunX: 0.7, sunY: 0.2, cloud: 0.12, ridged: 0, dune: 1, feat: ['rays'] },
  valley:   { sky: ['#4D8CC0', '#A6CCDE', '#EAF0DC'], haze: '#C7DCCF', mts: ['#8EAA9E', '#6A947B', '#4E7D5C', '#3A6544', '#355A2C'], sun: '#FFF3C2', sunX: 0.7, sunY: 0.2, cloud: 0.55, ridged: 0.3, feat: ['trees', 'grass', 'rays'] },
  road:     { sky: ['#5E8CB8', '#B6CDD8', '#F2E7C8'], haze: '#D9D3B9', mts: ['#A3A58F', '#858A6C', '#6A7150', '#535A3A', '#5E5434'], sun: '#FFF0B8', sunX: 0.32, sunY: 0.24, cloud: 0.45, ridged: 0.35, feat: ['trees', 'grass', 'road'] },
  temple:   { sky: ['#B9503E', '#E99B69', '#F9D6A6'], haze: '#EBBE98', mts: ['#A87666', '#875749', '#683F35', '#4B2C26', '#3B241E'], sun: '#FFE09A', sunX: 0.74, sunY: 0.28, cloud: 0.35, ridged: 0.55, feat: ['pagoda', 'pines', 'rays'] },
  taoist:   { sky: ['#5A9AA6', '#A9D0CC', '#EBF2E8'], haze: '#CDE1DA', mts: ['#8FAFA8', '#6D968C', '#517C70', '#3D6457', '#334F3B'], sun: '#FFFBE8', sunX: 0.68, sunY: 0.2, cloud: 0.7, ridged: 0.85, feat: ['pagoda', 'pines'] },
  cave:     { sky: ['#0C0A14', '#1A1526', '#2B2238'], haze: '#3A2F4C', mts: ['#2E2640', '#241D33', '#1B1527', '#14101D', '#0F0B16'], sun: '#C9B6FF', sunX: 0.5, sunY: 0.42, cloud: 0, ridged: 0.6, cave: 1, feat: ['cave'] },
  night:    { sky: ['#0A0F26', '#1C2A52', '#3A4C7A'], haze: '#33446E', mts: ['#2F3D60', '#24304F', '#1A2440', '#121A31', '#0E1424'], sun: '#F4F2E6', sunX: 0.7, sunY: 0.2, cloud: 0.3, ridged: 0.6, night: 1, feat: ['pines'] },
  love:     { sky: ['#C2708C', '#EDB3B8', '#FBE5D8'], haze: '#EFCACB', mts: ['#BC93A0', '#9D7586', '#7E5B6C', '#5F4352', '#5A4A3A'], sun: '#FFF0E8', sunX: 0.66, sunY: 0.24, cloud: 0.45, ridged: 0.3, feat: ['blossoms', 'grass', 'petals'] },
  legacy:   { sky: ['#6A5F9A', '#B6AACF', '#EFE6EC'], haze: '#D3CADF', mts: ['#A49DB8', '#857D9F', '#675F82', '#4D4665', '#3F3A4C'], sun: '#FFF4D6', sunX: 0.7, sunY: 0.22, cloud: 0.55, ridged: 0.6, feat: ['pines', 'rays'] },
};
const BB_ALIAS = { title: 'mountain', end: 'night', luck: 'valley' };
const BB_CACHE = new Map();

// ---- 雜訊 ----
function bbNoise(seed) {
  const r = seedRand('n' + seed), p = new Uint8Array(512), v = new Float32Array(256);
  const q = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = q[i]; q[i] = q[j]; q[j] = t; }
  for (let i = 0; i < 512; i++) p[i] = q[i & 255];
  for (let i = 0; i < 256; i++) v[i] = r();
  const fade = t => t * t * (3 - 2 * t);
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
    const a = v[p[p[X] + Y]], b = v[p[p[X + 1] + Y]], c = v[p[p[X] + Y + 1]], d = v[p[p[X + 1] + Y + 1]];
    const u = fade(xf), w = fade(yf), top = a + (b - a) * u, bot = c + (d - c) * u;
    return top + (bot - top) * w;
  };
  const fbm = (x, y, o) => { let s = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); t += a; a *= 0.5; f *= 2.03; } return s / t; };
  const ridged = (x, y, o) => { let s = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++) { const n = 1 - Math.abs(n2(x * f, y * f) * 2 - 1); s += a * n * n; t += a; a *= 0.5; f *= 2.1; } return s / t; };
  return { n2, fbm, ridged };
}
const bbHex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const bbMix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const bbCl = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const bbSS = (a, b, x) => { const t = bbCl((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---- 低解析度：天空、雲、山、水 ----
function bbBase(P, N, r, w, h) {
  const img = new ImageData(w, h), d = img.data;
  const sky = P.sky.map(bbHex), haze = bbHex(P.haze), sun = bbHex(P.sun), mts = P.mts.map(bbHex);
  const sunX = P.sunX * w, sunY = P.sunY * h, water = P.feat.includes('water'), wl = Math.round(h * 0.72);
  const L = 5, top = [], off = [r() * 50, r() * 50, r() * 50, r() * 50, r() * 50];
  for (let i = 0; i < L; i++) {
    const base = h * [0.5, 0.58, 0.66, 0.76, 0.86][i], amp = h * [0.3, 0.26, 0.2, 0.12, 0.04][i] * (P.ridged > 0.7 ? 1.25 : 1);
    const fq = [2.2, 3.2, 4.4, 6.0, 9.0][i] / w, row = new Float32Array(w + 2);
    for (let x = -1; x <= w; x++) {
      const smooth = N.fbm(x * fq + off[i], i * 7.3, 5), rid = N.ridged(x * fq + off[i], i * 3.1 + 40, 5);
      let t = smooth * (1 - P.ridged) + rid * P.ridged;
      if (P.dune) t = 0.5 + 0.3 * Math.sin(x * fq * 6.2 + off[i]) + (smooth - 0.5) * 0.8;
      row[x + 1] = base - t * amp;
    }
    top.push(row);
  }
  const fogAmt = [0.62, 0.46, 0.3, 0.16, 0.06];
  const put = (x, y, c) => { const k = (y * w + x) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; };
  const maxLayer = water ? 2 : L - 1, limit = water ? wl : h;
  for (let y = 0; y < limit; y++) for (let x = 0; x < w; x++) {
    let layer = -1;
    for (let i = maxLayer; i >= 0; i--) if (y >= top[i][x + 1]) { layer = i; break; }
    let c;
    if (layer < 0) {
      const t = y / (h * 0.75);
      c = t < 0.5 ? bbMix(sky[0], sky[1], t / 0.5) : bbMix(sky[1], sky[2], bbCl((t - 0.5) / 0.5));
      const dx = (x - sunX) / w, dy = (y - sunY) / h, dist = Math.sqrt(dx * dx * 1.3 + dy * dy);
      const glow = Math.exp(-dist * (P.night ? 9 : 5.5)) * (P.night ? 0.45 : 0.75);
      c = bbMix(c, sun, glow);
      if (P.night && N.n2(x * 1.7 + 300, y * 1.7) > 0.93 && N.n2(x * 3.1, y * 3.1 + 90) > 0.8) c = bbMix(c, [255, 255, 255], 0.85);
      if (P.cloud > 0) {
        const cn = N.fbm(x * 0.012 + 11, y * 0.04, 6), cov = bbSS(0.62 - P.cloud * 0.25, 0.82, cn) * (1 - bbSS(0.45, 0.7, y / h));
        if (cov > 0) {
          const lit = bbCl(0.55 + (N.fbm(x * 0.012 + 11 + (sunX - x) * 0.0006, y * 0.04 - 0.05, 4) - cn) * 6);
          const cc = bbMix(bbMix(haze, sky[0], 0.25), P.night ? [110, 120, 160] : [255, 252, 244], lit);
          c = bbMix(c, bbMix(cc, sun, glow * 0.6), cov * 0.92);
        }
      }
    } else {
      const slope = top[layer][x + 2] - top[layer][x];
      const depth = bbCl((y - top[layer][x + 1]) / (h * 0.25));
      const sd = sunX > x ? 1 : -1;
      // 山脊附近：依稜線坡度決定向光／背光，往下逐漸淡出
      let light = 1 + bbCl(-sd * slope * 0.3, -0.3, 0.3) * Math.exp(-depth * 5);
      // 地表起伏：扭曲座標後的二維雜訊，取水平梯度當作岩面朝向
      const wx = x * 0.055 + layer * 20 + N.fbm(x * 0.02, y * 0.02 + layer, 3) * 3, wy = y * 0.075 + N.fbm(x * 0.02 + 5, y * 0.02, 3) * 3;
      const hb = N.fbm(wx, wy, 5), gx = N.fbm(wx + 0.06, wy, 5) - N.fbm(wx - 0.06, wy, 5);
      light *= 0.86 + hb * 0.24 + bbCl(gx * sd * 9, -0.22, 0.22) * (0.5 + P.ridged * 0.6);
      if (layer === L - 1) light *= 1 - depth * 0.25;
      const tex = hb;
      let base = mts[layer].map(v => v * light);
      if (P.snow && layer <= 2) {
        const sl = (1 - bbSS(0.02, 0.06 + P.snow * 0.3, depth - tex * 0.12)) * (Math.abs(slope) < 2.2 ? 1 : 0.4);
        const k = bbCl(light, 0.6, 1.08);
        base = bbMix(base, [246 * k, 250 * k, 255 * k], sl);
      }
      const valley = layer < 3 ? bbSS(0.25, 1, depth) * 0.45 : 0;
      c = bbMix(base, haze, bbCl(fogAmt[layer] + valley));
      if (P.cave) c = bbMix(c, sun, Math.exp(-Math.hypot((x - sunX) / w, (y - sunY) / h) * 4) * 0.35);
    }
    put(x, y, c);
  }
  if (water) {
    const wc = bbHex(P.water);
    for (let y = wl; y < h; y++) {
      const dep = (y - wl) / (h - wl);
      for (let x = 0; x < w; x++) {
        const rip = Math.sin(y * 1.3 + N.n2(x * 0.08, y * 0.6) * 9) * (1 + dep * 3);
        const sx = bbCl(Math.round(x + rip), 0, w - 1), sy = bbCl(2 * wl - y - 1, 0, wl - 1), k = (sy * w + sx) * 4;
        let c = bbMix([d[k], d[k + 1], d[k + 2]], wc, 0.35 + dep * 0.4);
        const streak = N.n2(x * 0.5, y * 2.2);
        if (Math.abs(x - sunX) < w * (0.03 + dep * 0.07) && streak > 0.8 && N.n2(x * 2.3, y * 4.1) > 0.55) c = bbMix(c, sun, 0.45);
        else if (streak > 0.86) c = bbMix(c, [255, 255, 255], 0.18);
        put(x, y, c);
      }
    }
  }
  return img;
}

// ---- 全解析度前景 ----
function bbDetails(g, P, N, r, W, H) {
  const sunX = P.sunX * W, sunY = P.sunY * H, mts = P.mts.map(bbHex), haze = bbHex(P.haze);
  const rgb = c => `rgb(${c.map(v => Math.round(bbCl(v, 0, 255))).join(',')})`, has = f => P.feat.includes(f);
  if (has('rays') && !P.night) {
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.25 + r() * 0.5), len = H * 1.4, wd = 0.04 + r() * 0.05;
      const gr = g.createLinearGradient(sunX, sunY, sunX + Math.cos(a) * len, sunY + Math.sin(a) * len);
      gr.addColorStop(0, 'rgba(255,240,200,0.2)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(sunX, sunY);
      g.lineTo(sunX + Math.cos(a - wd) * len, sunY + Math.sin(a - wd) * len); g.lineTo(sunX + Math.cos(a + wd) * len, sunY + Math.sin(a + wd) * len); g.fill();
    }
    g.restore();
  }
  if (!P.cave) {
    const R = P.night ? 22 : 30, s = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, R);
    s.addColorStop(0, 'rgba(255,253,240,1)'); s.addColorStop(0.6, P.night ? 'rgba(236,234,218,0.95)' : 'rgba(255,245,210,0.9)'); s.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = s; g.beginPath(); g.arc(sunX, sunY, R, 0, 7); g.fill();
    if (P.night) { g.fillStyle = 'rgba(200,200,190,0.25)'; [[-6, -4, 5], [5, 6, 4], [3, -8, 3]].forEach(([dx, dy, rr]) => { g.beginPath(); g.arc(sunX + dx, sunY + dy, rr, 0, 7); g.fill(); }); }
  }
  const water = has('water'), groundY = water ? H * 0.92 : H * 0.86;
  if (water) {
    const sg = g.createLinearGradient(0, groundY - 8, 0, H); sg.addColorStop(0, rgb(bbMix(mts[4], [90, 110, 60], 0.2))); sg.addColorStop(1, rgb(bbMix(mts[4], [0, 0, 0], 0.35)));
    g.fillStyle = sg; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, groundY - 6 - N.fbm(x * 0.01, 3, 3) * 14);
    g.lineTo(W, H); g.closePath(); g.fill();
  }
  const farY = water ? H * 0.72 : H * 0.8;
  function pine(x, y, s, tint) {
    const dark = bbMix(mts[4], [10, 18, 12], 0.35), lite = bbMix(mts[3], [120, 150, 100], 0.25), ct = c => rgb(bbMix(c, haze, tint));
    g.fillStyle = ct(bbMix(dark, [40, 28, 20], 0.5)); g.fillRect(x - 2 * s, y - 16 * s, 4 * s, 16 * s);
    for (let k = 0; k < 6; k++) {
      const yy = y - 12 * s - k * 11 * s, wd = (30 - k * 4.2) * s;
      g.fillStyle = ct(dark); g.beginPath(); g.moveTo(x - wd, yy);
      for (let j = 0; j <= 6; j++) g.lineTo(x - wd + (wd * 2) * j / 6, yy + (j % 2 ? -3 : 2) * s);
      g.lineTo(x, yy - 18 * s); g.closePath(); g.fill();
      g.fillStyle = ct(lite); g.globalAlpha = 0.5; g.beginPath(); g.moveTo(x, yy - 18 * s); g.lineTo(x + (sunX > x ? wd * 0.9 : -wd * 0.9), yy); g.lineTo(x, yy); g.closePath(); g.fill(); g.globalAlpha = 1;
    }
  }
  function tree(x, y, s, tint, petal) {
    const base = petal ? [222, 140, 165] : bbMix(mts[3], [40, 80, 40], 0.4), hl = petal ? [255, 210, 220] : bbMix(base, [210, 230, 150], 0.45), sh = bbMix(base, [8, 14, 8], 0.45), ct = c => rgb(bbMix(c, haze, tint));
    g.strokeStyle = ct([55, 40, 30]); g.lineWidth = 4 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4 * s, y - 25 * s, x - 2 * s, y - 46 * s); g.stroke();
    for (let k = 0; k < 14; k++) {
      const a = r() * Math.PI * 2, rr = r() * 26 * s, cx = x + Math.cos(a) * rr, cy = y - 58 * s + Math.sin(a) * rr * 0.7, rad = (9 + r() * 9) * s;
      const gr = g.createRadialGradient(cx + (sunX > cx ? 4 : -4) * s, cy - 4 * s, 1, cx, cy, rad);
      gr.addColorStop(0, ct(hl)); gr.addColorStop(0.55, ct(base)); gr.addColorStop(1, ct(sh));
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rad, 0, 7); g.fill();
    }
  }
  function roof(x, y, w, col, hi) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w / 2 - 12, y + 3); g.quadraticCurveTo(x - w / 4, y - 3, x, y - 15); g.quadraticCurveTo(x + w / 4, y - 3, x + w / 2 + 12, y + 3); g.lineTo(x + w / 2 - 2, y + 6); g.lineTo(x - w / 2 + 2, y + 6); g.closePath(); g.fill();
    g.strokeStyle = hi; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - w / 2 - 12, y + 3); g.quadraticCurveTo(x - w / 4, y - 3, x, y - 15); g.stroke();
  }
  if (has('city')) {
    const wy = H * 0.7, wallC = bbMix(mts[3], [120, 100, 85], 0.3), lit = bbMix(wallC, [255, 220, 170], 0.25);
    const wg = g.createLinearGradient(0, wy, 0, groundY); wg.addColorStop(0, rgb(lit)); wg.addColorStop(1, rgb(bbMix(wallC, [0, 0, 0], 0.3)));
    g.fillStyle = wg; g.fillRect(0, wy, W, groundY - wy + 6);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1;
    for (let yy = wy + 8, row = 0; yy < groundY; yy += 8, row++) { g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke(); for (let xx = (row % 2) * 12; xx < W; xx += 24) { g.beginPath(); g.moveTo(xx, yy - 8); g.lineTo(xx, yy); g.stroke(); } }
    g.fillStyle = rgb(bbMix(wallC, [0, 0, 0], 0.15)); for (let x = 0; x < W; x += 26) g.fillRect(x, wy - 10, 15, 10);
    const tx = W * (0.38 + r() * 0.24), tw = 120, th = 60;
    g.fillStyle = rgb(bbMix(wallC, [0, 0, 0], 0.25)); g.fillRect(tx - tw / 2, wy - th, tw, th);
    g.fillStyle = 'rgba(20,10,5,0.75)'; g.beginPath(); g.moveTo(tx - 18, wy + 40); g.lineTo(tx - 18, wy + 14); g.quadraticCurveTo(tx, wy - 2, tx + 18, wy + 14); g.lineTo(tx + 18, wy + 40); g.fill();
    roof(tx, wy - th, tw + 20, rgb(bbMix(mts[4], [30, 25, 25], 0.3)), 'rgba(255,220,170,0.4)');
    for (let i = 0; i < 4; i++) { const lx = tx - 42 + i * 28, ly = wy - th + 26, lg = g.createRadialGradient(lx, ly, 1, lx, ly, 16); lg.addColorStop(0, 'rgba(255,200,110,0.95)'); lg.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = lg; g.beginPath(); g.arc(lx, ly, 16, 0, 7); g.fill(); g.fillStyle = '#C0392B'; g.fillRect(lx - 3, ly - 5, 6, 9); }
  }
  if (has('pagoda')) {
    const px = W * 0.2 + r() * 40, py = H * 0.68, tint = 0.32, col = rgb(bbMix(bbMix(mts[3], [80, 40, 30], 0.35), haze, tint)), rf = rgb(bbMix(bbMix(mts[4], [30, 30, 30], 0.3), haze, tint));
    for (let i = 0; i < 5; i++) { const w = 64 * (1 - i * 0.13), y = py - i * 26; g.fillStyle = col; g.fillRect(px - w * 0.3, y - 20, w * 0.6, 20); g.fillStyle = 'rgba(255,210,140,0.35)'; g.fillRect(px - w * 0.3 + w * 0.42, y - 20, w * 0.18, 20); roof(px, y - 20, w, rf, 'rgba(255,230,190,0.35)'); }
    g.fillStyle = rf; g.fillRect(px - 1.5, py - 5 * 26 - 34, 3, 18);
  }
  if (has('pines')) for (let i = 0; i < 6; i++) { const far = i < 3, x = far ? W * (0.5 + r() * 0.4) : (r() < 0.5 ? r() * W * 0.18 : W * (0.84 + r() * 0.16)); pine(x, far ? (water ? farY : H * 0.78) : groundY + 14, far ? 0.55 + r() * 0.2 : 1.1 + r() * 0.4, far ? 0.45 : 0.05); }
  if (has('trees')) for (let i = 0; i < 5; i++) { const far = i < 2, x = far ? W * (0.45 + r() * 0.4) : (r() < 0.5 ? r() * W * 0.17 : W * (0.85 + r() * 0.15)); tree(x, far ? farY : groundY + 12, far ? (water ? 0.32 : 0.5) : 1.05 + r() * 0.3, far ? 0.5 : 0.04, false); }
  if (has('blossoms')) for (let i = 0; i < 4; i++) { const x = r() < 0.5 ? r() * W * 0.2 : W * (0.82 + r() * 0.18); tree(x, groundY + 12, 1 + r() * 0.3, 0.04, true); }
  if (has('boat')) {
    const bx = W * (0.62 + r() * 0.18), by = H * 0.8;
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(bx, by + 16, 80, 6, 0, 0, 7); g.fill();
    const hg = g.createLinearGradient(0, by - 10, 0, by + 14); hg.addColorStop(0, '#6B4A30'); hg.addColorStop(1, '#2E1E14');
    g.fillStyle = hg; g.beginPath(); g.moveTo(bx - 78, by - 6); g.quadraticCurveTo(bx, by + 22, bx + 78, by - 10); g.lineTo(bx + 60, by - 2); g.lineTo(bx - 60, by); g.closePath(); g.fill();
    g.fillStyle = '#3A2A1E'; g.fillRect(bx - 3, by - 92, 5, 90);
    const sg = g.createLinearGradient(bx, by - 90, bx + 55, by - 20); sg.addColorStop(0, '#F3E6C6'); sg.addColorStop(1, '#C8B48C');
    g.fillStyle = sg; g.beginPath(); g.moveTo(bx + 3, by - 88); g.quadraticCurveTo(bx + 50, by - 60, bx + 52, by - 20); g.lineTo(bx + 3, by - 16); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(80,60,40,0.4)'; g.lineWidth = 1; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(bx + 3, by - 88 + k * 14); g.lineTo(bx + 46, by - 82 + k * 14); g.stroke(); }
  }
  if (has('road')) {
    const rg = g.createLinearGradient(0, H * 0.8, 0, H); rg.addColorStop(0, 'rgba(210,180,120,0.55)'); rg.addColorStop(1, 'rgba(170,140,90,0.85)');
    g.fillStyle = rg; g.beginPath(); g.moveTo(W * 0.46, H * 0.8); g.quadraticCurveTo(W * 0.52, H * 0.9, W * 0.3, H); g.lineTo(W * 0.72, H); g.quadraticCurveTo(W * 0.6, H * 0.9, W * 0.54, H * 0.8); g.fill();
  }
  if (has('cave')) {
    const lg = g.createRadialGradient(sunX, sunY, 10, sunX, sunY, W * 0.45); lg.addColorStop(0, 'rgba(200,180,255,0.5)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { const x = r() * W, len = 20 + r() * 80, w = 6 + r() * 12, sg = g.createLinearGradient(x - w, 0, x + w, 0); sg.addColorStop(0, '#0E0A16'); sg.addColorStop(0.5, '#3A2F4E'); sg.addColorStop(1, '#0E0A16'); g.fillStyle = sg; g.beginPath(); g.moveTo(x - w, 0); g.lineTo(x + w, 0); g.lineTo(x, len); g.closePath(); g.fill(); }
  }
  if (has('grass') || has('trees') || has('blossoms')) {
    const gb = bbMix(mts[4], [20, 30, 10], 0.25), gl = bbMix(mts[4], [190, 200, 120], 0.35);
    for (let i = 0; i < 520; i++) {
      const x = r() * W, y = groundY + 6 + r() * (H - groundY), hgt = 8 + r() * 22 * (0.5 + (y - groundY) / (H - groundY)), lean = (r() - 0.5) * 10;
      g.strokeStyle = rgb(bbMix(gb, gl, r() * 0.8)); g.lineWidth = 1 + r() * 1.2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * 0.3, y - hgt * 0.6, x + lean, y - hgt); g.stroke();
    }
  }
  if (has('snowfall')) for (let i = 0; i < 160; i++) { const s = r(), x = r() * W, y = r() * H, rad = 0.6 + s * 2.6; g.globalAlpha = 0.35 + s * 0.6; const sg = g.createRadialGradient(x, y, 0, x, y, rad); sg.addColorStop(0, '#fff'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
  if (has('petals')) for (let i = 0; i < 40; i++) { g.globalAlpha = 0.55 + r() * 0.4; g.fillStyle = r() < 0.5 ? '#F7C2CF' : '#F3A5B9'; g.beginPath(); g.ellipse(r() * W, r() * H * 0.85, 4 + r() * 2, 2.2, r() * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}

function bbFinish(g, W, H, r) {
  const v = g.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.32)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  const id = g.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}

function paintBattleBg(cv, scene, seed) {
  const key = BB_PAL[scene] ? scene : BB_ALIAS[scene] || 'road', ck = key + '|' + (seed || '') + '|' + cv.width + 'x' + cv.height;
  let src = BB_CACHE.get(ck);
  if (!src) {
    const W = cv.width, H = cv.height, P = BB_PAL[key], N = bbNoise(key + (seed || '')), r = seedRand('bb' + key + (seed || ''));
    src = document.createElement('canvas'); src.width = W; src.height = H;
    const g = src.getContext('2d'), lw = Math.round(W / 2), lh = Math.round(H / 2), lo = document.createElement('canvas');
    lo.width = lw; lo.height = lh; lo.getContext('2d').putImageData(bbBase(P, N, r, lw, lh), 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(lo, 0, 0, W, H);
    bbDetails(g, P, N, r, W, H);
    bbFinish(g, W, H, r);
    BB_CACHE.set(ck, src);
  }
  const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(src, 0, 0);
}
