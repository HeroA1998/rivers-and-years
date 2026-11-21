/* 戰鬥用 3D 骰子：真正的 20 面體（three.js 渲染），投擲時物理式翻滾，最後停在擲出的那一面。
   沒有 three.js 時（例如舊瀏覽器）DIE3 為 null，介面退回平面骰。 */
const DIE3 = (function () {
  if (typeof THREE === 'undefined') return null;
  const T = THREE;
  let R = null, cam = null, scene = null, mesh = null, atlases = {};
  let faceNum = [], faceOf = [], faceN = [], faceUp = [];
  let tone = 'red', shownTone = null;
  let anim = null, raf = 0, seq = -1, cur = null;

  // 正二十面體的頂點與面（每條邊都被兩個面共用，對面的兩面數字加起來是 21）
  const PHI = (1 + Math.sqrt(5)) / 2;
  const RAW = [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]];
  const FACES = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const VS = RAW.map(v => new T.Vector3(...v).normalize());

  // 數字配對：找出每對對面，編號 k 與 21-k
  function layout() {
    const tri = FACES.map(f => {
      const a = VS[f[0]], b = VS[f[1]], c = VS[f[2]];
      const n = new T.Vector3().add(a).add(b).add(c).normalize();
      return { a, b, c, n };
    });
    faceN = tri.map(t => t.n);
    faceNum = new Array(20).fill(0);
    let k = 1;
    for (let i = 0; i < 20; i++) {
      if (faceNum[i]) continue;
      const j = tri.findIndex(t => t.n.dot(tri[i].n) < -0.999);
      faceNum[i] = k; faceNum[j] = 21 - k; k++;
    }
    faceOf = []; faceNum.forEach((n, i) => { faceOf[n] = i; });
    // 每面的「向上」方向：投影到該面的世界 +Y，讓數字擺正
    faceUp = tri.map(t => {
      const up = new T.Vector3(0, 1, 0).sub(t.n.clone().multiplyScalar(t.n.y)).normalize();
      return up;
    });
    return tri;
  }

  // 數字圖集：5×4 格，每格一個數字（紅漆、金漆、灰鐵三種）
  function atlas(name) {
    const c = document.createElement('canvas'); c.width = 1280; c.height = 1024;
    const g = c.getContext('2d');
    const pal = { red: ['#F6927A', '#C0392B', '#5A1009', '#FFF3E2'], gold: ['#FFF6C8', '#E2AE2E', '#7A4C08', '#3A2300'], iron: ['#E4DED0', '#8E887C', '#3E3A33', '#FBF6E8'] }[name];
    for (let n = 1; n <= 20; n++) {
      const x0 = ((n - 1) % 5) * 256, y0 = Math.floor((n - 1) / 5) * 256;
      const grd = g.createRadialGradient(x0 + 110, y0 + 90, 20, x0 + 128, y0 + 128, 190);
      grd.addColorStop(0, pal[0]); grd.addColorStop(0.55, pal[1]); grd.addColorStop(1, pal[2]);
      g.fillStyle = grd; g.fillRect(x0, y0, 256, 256);
      // 細微的漆面顆粒
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; g.fillRect(x0 + Math.random() * 256, y0 + Math.random() * 256, 2, 2); }
      g.font = 'bold 150px "LXGW WenKai TC", "Noto Serif TC", serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const txt = String(n), cx = x0 + 128, cy = y0 + 140;
      g.fillStyle = pal[2]; g.fillText(txt, cx + 3, cy + 4);       // 刻痕陰影
      g.fillStyle = pal[3]; g.fillText(txt, cx, cy);               // 字面
    }
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    return tex;
  }

  function buildGeometry(tri) {
    const pos = [], nor = [], uv = [];
    tri.forEach((t, i) => {
      const n = faceN[i], up = faceUp[i];
      const side = up.clone().cross(n);                              // 螢幕右方
      const col = (faceNum[i] - 1) % 5, row = Math.floor((faceNum[i] - 1) / 5);
      const u0 = col / 5, v0 = 1 - (row + 1) / 4, cw = 1 / 5, ch = 1 / 4;
      const verts = [t.a, t.b, t.c];
      // 頂點依高度分配：最高的頂點為數字的頂端，另兩點為左下、右下
      const order = verts.map((p, k) => ({ p, h: p.dot(up), s: p.dot(side), k })).sort((x, y) => y.h - x.h);
      const top = order[0], rest = [order[1], order[2]].sort((x, y) => x.s - y.s);
      const map = [[top.p, 0.5, 0.92], [rest[0].p, 0.08, 0.1], [rest[1].p, 0.92, 0.1]];
      map.forEach(([p, uu, vv]) => {
        pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z);
        uv.push(u0 + uu * cw, v0 + vv * ch);
      });
    });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return g;
  }

  function init() {
    const tri = layout();
    R = new T.WebGLRenderer({ alpha: true, antialias: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.setSize(100, 100, false);
    R.outputColorSpace = T.SRGBColorSpace;
    R.domElement.style.width = '100%'; R.domElement.style.height = '100%';
    scene = new T.Scene();
    cam = new T.PerspectiveCamera(28, 1, 0.1, 50);
    cam.position.set(0, 0, 5.4);
    scene.add(new T.AmbientLight(0xffffff, 0.55));
    const key = new T.DirectionalLight(0xfff4e0, 2.0); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new T.DirectionalLight(0xffe2b0, 0.7); rim.position.set(4, -2, -3); scene.add(rim);
    atlases = { red: atlas('red'), gold: atlas('gold'), iron: atlas('iron') };
    const mat = new T.MeshPhysicalMaterial({ map: atlases.red, roughness: 0.34, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.16, flatShading: true });
    mesh = new T.Mesh(buildGeometry(tri), mat);
    scene.add(mesh);
    // 初始：20 朝上，數字擺正
    cur = targetQuat(20);
    mesh.quaternion.copy(cur);
    shownTone = 'red';
  }

  // 面朝鏡頭、數字擺正的目標姿態
  function targetQuat(r) {
    const i = faceOf[r];
    const qAlign = new T.Quaternion().setFromUnitVectors(faceN[i], new T.Vector3(0, 0, 1));
    const t1 = faceUp[i].clone().applyQuaternion(qAlign);
    const phi = Math.PI / 2 - Math.atan2(t1.y, t1.x);
    const qZ = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), phi);
    return qZ.multiply(qAlign);
  }

  function setTone(name) {
    if (shownTone === name) return;
    mesh.material.map = atlases[name]; mesh.material.needsUpdate = true;
    mesh.material.emissive = new T.Color(name === 'gold' ? 0x3a2400 : 0x000000);
    shownTone = name;
  }

  function frame(now) {
    raf = 0;
    if (!anim) { R.render(scene, cam); return; }
    const p = Math.min(1, (now - anim.t0) / anim.dur);
    const e = 1 - Math.pow(1 - p, 3);                     // 減速
    const base = anim.from.clone().slerp(anim.to, e);
    const spin = new T.Quaternion().setFromAxisAngle(anim.axis, (1 - e) * anim.spins * Math.PI * 2);
    mesh.quaternion.copy(spin.multiply(base));
    mesh.position.y = 0.42 * (1 - p) * Math.abs(Math.sin(p * Math.PI * anim.bounces));  // 落地彈跳
    if (p >= 1) { mesh.quaternion.copy(anim.to); mesh.position.y = 0; cur = anim.to.clone(); anim = null; }
    R.render(scene, cam);
    if (anim) raf = requestAnimationFrame(frame);
  }

  function roll(r, dur, spins, bounces) {
    const to = targetQuat(r);
    const from = cur ? cur.clone() : mesh.quaternion.clone();
    anim = { t0: performance.now(), dur, from, to, spins, bounces, axis: new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize() };
    if (!raf) raf = requestAnimationFrame(frame);
  }

  return {
    // 目前朝向鏡頭的那一面的數字（驗證用）
    topFace() {
      if (!mesh) return null;
      let best = -2, bi = 0;
      faceN.forEach((n, i) => { const z = n.clone().applyQuaternion(mesh.quaternion).z; if (z > best) { best = z; bi = i; } });
      return faceNum[bi];
    },
    // 掛到介面上的一個容器；o 為戰鬥狀態的必要欄位
    mount(el, o) {
      if (!R) init();
      if (el.firstChild !== R.domElement) { el.innerHTML = ''; el.appendChild(R.domElement); }
      setTone(o.tone || 'red');
      if (o.roll != null && o.seq !== seq) {
        seq = o.seq;
        if (o.phase === 'rolling') roll(o.roll, 1000, 5, 3);        // 投擲：翻滾後落地
        else roll(o.roll, 480, 1.5, 1);                             // 跳過投擲：短促落定
      } else if (!anim && o.roll == null && !cur) {
        cur = targetQuat(20); mesh.quaternion.copy(cur);
      }
      if (!anim) { if (!raf) raf = requestAnimationFrame(frame); }
    },
  };
})();
