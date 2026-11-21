/* 像素風介面素材：九宮格邊框、寶珠、圖示，全部在載入時用 canvas 生成（不需要圖檔）。
   一個像素格 = 2 CSS px；邊框用 border-image 搭配 image-rendering: pixelated。 */
const PIX = (function () {
  const cache = {};
  const rnd = seed => { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const put = (g, x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };

  // 九宮格邊框：rings 由外到內每圈一種顏色，torn 讓外緣參差像撕過的紙
  function frame(o) {
    const key = JSON.stringify(o);
    if (cache[key]) return cache[key];
    const c = mk(o.w, o.h), g = c.getContext('2d'), R = rnd(o.seed || 7);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
      const d = Math.min(x, y, o.w - 1 - x, o.h - 1 - y);
      const corner = (x < 2 && y < 2) || (x > o.w - 3 && y < 2) || (x < 2 && y > o.h - 3) || (x > o.w - 3 && y > o.h - 3);
      if (corner) continue;
      if (o.torn && d < 2 && R() < (d === 0 ? 0.1 : 0.03)) continue;
      if (d < o.rings.length) put(g, x, y, o.rings[d]);
      else if (o.fill) put(g, x, y, o.fill);
    }
    return (cache[key] = c.toDataURL());
  }

  // 寶珠（命、內力）：金圈加高光
  function orb(kind, on) {
    const key = 'orb' + kind + on;
    if (cache[key]) return cache[key];
    const pal = kind === 'red' ? ['#B8353C', '#E0636A', '#7A1F27'] : ['#2E8F7D', '#5CC1AA', '#1B5D50'];
    const c = mk(12, 12), g = c.getContext('2d');
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
      const r = Math.hypot(x - 5.5, y - 5.5);
      if (r > 5.9) continue;
      if (r > 4.5) put(g, x, y, on ? '#C79A45' : '#6F6A5C');
      else if (!on) put(g, x, y, '#4E4A40');
      else if (x + y < 8 && r < 3.6) put(g, x, y, pal[1]);
      else if (x + y > 13) put(g, x, y, pal[2]);
      else put(g, x, y, pal[0]);
    }
    return (cache[key] = c.toDataURL());
  }

  // 向量線稿圖示 → 像素圖示：二值化後上色，再加一圈深色外框
  function icon(frag, color, n, solid) {
    n = n || 12;
    const key = 'ic' + frag + color + n + (solid ? 's' : '');
    if (cache[key]) return cache[key];
    const doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + frag + '</svg>', 'image/svg+xml');
    const c = mk(n + 2, n + 2), g = c.getContext('2d');
    g.translate(1, 1); g.scale(n / 24, n / 24);
    g.lineWidth = solid ? 2.4 : 2.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#000'; g.fillStyle = '#000';
    doc.querySelectorAll('path,circle,rect').forEach(e => {
      const t = e.tagName;
      if (t === 'path') { const p = new Path2D(e.getAttribute('d')); if (solid) g.fill(p); g.stroke(p); }
      else if (t === 'circle') { g.beginPath(); g.arc(+e.getAttribute('cx'), +e.getAttribute('cy'), +e.getAttribute('r'), 0, 7); if (solid) g.fill(); g.stroke(); }
      else { g.beginPath(); g.rect(+e.getAttribute('x'), +e.getAttribute('y'), +e.getAttribute('width'), +e.getAttribute('height')); if (solid) g.fill(); g.stroke(); }
    });
    const W = n + 2, src = g.getImageData(0, 0, W, W).data, mask = [];
    for (let i = 0; i < W * W; i++) mask[i] = src[i * 4 + 3] > 110;
    const out = mk(W, W), og = out.getContext('2d');
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (mask[i]) put(og, x, y, color);
      else if ((x > 0 && mask[i - 1]) || (x < W - 1 && mask[i + 1]) || (y > 0 && mask[i - W]) || (y < W - 1 && mask[i + W])) put(og, x, y, '#2A2218');
    }
    return (cache[key] = out.toDataURL());
  }

  // 手繪小圖：用文字格子畫像素
  function grid(rows, pal) {
    const key = 'gr' + rows.join('') + JSON.stringify(pal);
    if (cache[key]) return cache[key];
    const c = mk(rows[0].length, rows.length), g = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) put(g, x, y, pal[ch]); }));
    return (cache[key] = c.toDataURL());
  }
  const flag = () => grid([
    '.p..........', '.pYYYYY.....', '.pYYYYYYY...', '.pYyYYYYYY..', '.pYYYYYYY...', '.pYYYYY.....',
    '.p..........', '.p..........', '.p..........', '.p..........', '.p..........', '.pp.........'], { p: '#6E4A22', Y: '#E3C05A', y: '#F6E3A0' });
  const diamond = () => {
    const key = 'diamond'; if (cache[key]) return cache[key];
    const c = mk(13, 13), g = c.getContext('2d');
    for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
      const m = Math.abs(x - 6) + Math.abs(y - 6);
      if (m > 6) continue;
      if (m >= 5) put(g, x, y, '#A39877');
      else if ((x === 6 || y === 6) && m <= 4) put(g, x, y, '#8D8167');
      else put(g, x, y, '#ECE6D4');
    }
    return (cache[key] = c.toDataURL());
  };
  const gear = () => {
    const key = 'gear'; if (cache[key]) return cache[key];
    const c = mk(15, 15), g = c.getContext('2d');
    for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
      const dx = x - 7, dy = y - 7, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const tooth = r > 5 && r < 7.4 && Math.sin(a * 4) > 0.1;
      if ((r <= 5.2 && r > 2.4) || tooth) put(g, x, y, '#DAD5C6');
    }
    return (cache[key] = c.toDataURL());
  };

  // 邊框素材 → CSS 變數
  const SPRITES = {
    '--sp-panel': { w: 36, h: 36, rings: ['#8D8167', '#F4EFE0'], fill: '#E3DDCB', torn: true, seed: 3 },
    '--sp-btn':   { w: 30, h: 30, rings: ['#A99D80', '#FAF7EC'], fill: '#ECE7D8', torn: true, seed: 11 },
    '--sp-bar':   { w: 12, h: 12, rings: ['#463C28', '#BCAC7C', '#BCAC7C', '#6B5E45'] },
    '--sp-slot':  { w: 9, h: 9, rings: ['#B89B63', '#E4CF97'], fill: '#2B251C' },
    '--sp-slot-hot': { w: 9, h: 9, rings: ['#B23A3A', '#E26A6A'], fill: '#2B251C' },
    '--sp-art':   { w: 15, h: 15, rings: ['#8D8167', '#CBBA8E', '#E3DDCB', '#4A402C'] },
    '--sp-gold':  { w: 9, h: 9, rings: ['#5A4018', '#C9A24A', '#EAD58E'] },
  };
  Object.keys(SPRITES).forEach(k => document.documentElement.style.setProperty(k, `url(${frame(SPRITES[k])})`));

  return { frame, orb, icon, grid, flag, diamond, gear };
})();
