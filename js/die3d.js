/* 戰鬥用 3D 骰子：真正的 20 面體（three.js 渲染）。
   骰子在「骰盤」裡可以被揮出去彈射，碰到邊框會回彈；停下後落在擲出的那一面。
   沒有 three.js 時 DIE3 為 null，介面退回平面骰。 */
const DIE3 = (function () {
  if (typeof THREE === 'undefined') return null;
  const T = THREE;
  const TRAY_H = 150;                 // 骰盤高度（CSS px）
  const VIEW_H = 2.5;                 // 骰盤在 z=0 平面看得到的高度（世界單位）
  const S = 0.92;                     // 骰子外接圓半徑（世界單位）
  const CAM_Z = 6;
  const FLIGHT = 0.75, SETTLE = 0.35; // 秒
  const FRICTION = 1.5, RESTITUTION = 0.66;

  let R = null, cam = null, scene = null, mesh = null, atlases = {};
  let faceNum = [], faceOf = [], faceN = [], faceUp = [];
  let tone = 'red', shownTone = null, sizeW = 0;
  let anim = null, raf = 0, seq = -1, lastT = 0;
  let cur = null, pos = new T.Vector2(0, 0), vel = new T.Vector2(0, 0), ang = new T.Vector3();
  let pendingToss = null;
  let tray = null;

  // 正二十面體頂點與面（每條邊被兩面共用；對面兩數字相加為 21）
  const PHI = (1 + Math.sqrt(5)) / 2;
  const RAW = [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]];
  const FACES = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const VS = RAW.map(v => new T.Vector3(...v).normalize());

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
    faceUp = tri.map(t => new T.Vector3(0, 1, 0).sub(t.n.clone().multiplyScalar(t.n.y)).normalize());
    return tri;
  }

  // 數字圖集：5×4 格，每格 384px，數字為象牙白、帶深色描邊，清楚好認
  function atlas(name) {
    const CELL = 384, c = document.createElement('canvas'); c.width = CELL * 5; c.height = CELL * 4;
    const g = c.getContext('2d');
    const pal = {
      red:  ['#E0584A', '#B3261B', '#5A0F08', '#FFFDF4', '#2A0603'],
      gold: ['#FFF2B0', '#E0A92A', '#7A4B07', '#FFFDF2', '#3A2200'],
      iron: ['#D9D3C4', '#8A8478', '#3B3730', '#FFFDF4', '#1E1B17'],
    }[name];
    for (let n = 1; n <= 20; n++) {
      const x0 = ((n - 1) % 5) * CELL, y0 = Math.floor((n - 1) / 5) * CELL;
      const grd = g.createRadialGradient(x0 + CELL * 0.4, y0 + CELL * 0.35, CELL * 0.05, x0 + CELL / 2, y0 + CELL / 2, CELL * 0.75);
      grd.addColorStop(0, pal[0]); grd.addColorStop(0.55, pal[1]); grd.addColorStop(1, pal[2]);
      g.fillStyle = grd; g.fillRect(x0, y0, CELL, CELL);
      for (let i = 0; i < 380; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`; g.fillRect(x0 + Math.random() * CELL, y0 + Math.random() * CELL, 2, 2); }
      const txt = String(n), cx = x0 + CELL / 2, cy = y0 + CELL * 0.6;
      g.font = '900 ' + (n >= 10 ? 214 : 250) + 'px "Noto Sans TC", "Arial Black", Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = pal[4]; g.strokeText(txt, cx, cy);
      g.fillStyle = pal[3]; g.fillText(txt, cx, cy);
    }
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
    return tex;
  }

  function buildGeometry(tri) {
    const pos3 = [], nor = [], uv = [];
    tri.forEach((t, i) => {
      const n = faceN[i], up = faceUp[i];
      const side = up.clone().cross(n);
      const col = (faceNum[i] - 1) % 5, row = Math.floor((faceNum[i] - 1) / 5);
      const u0 = col / 5, v0 = 1 - (row + 1) / 4, cw = 1 / 5, ch = 1 / 4;
      const order = [t.a, t.b, t.c].map(p => ({ p, h: p.dot(up), s: p.dot(side) })).sort((x, y) => y.h - x.h);
      const top = order[0], rest = [order[1], order[2]].sort((x, y) => x.s - y.s);
      [[top.p, 0.5, 0.9], [rest[0].p, 0.1, 0.1], [rest[1].p, 0.9, 0.1]].forEach(([p, uu, vv]) => {
        pos3.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z);
        uv.push(u0 + uu * cw, v0 + vv * ch);
      });
    });
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos3, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return g;
  }

  function init() {
    const tri = layout();
    R = new T.WebGLRenderer({ alpha: true, antialias: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.outputColorSpace = T.SRGBColorSpace;
    R.domElement.style.width = '100%'; R.domElement.style.height = TRAY_H + 'px'; R.domElement.style.display = 'block';
    scene = new T.Scene();
    cam = new T.PerspectiveCamera(2 * Math.atan(VIEW_H / 2 / CAM_Z) * 180 / Math.PI, 1, 0.1, 50);
    cam.position.set(0, 0, CAM_Z);
    scene.add(new T.AmbientLight(0xffffff, 0.6));
    const key = new T.DirectionalLight(0xfff4e0, 2.0); key.position.set(-3, 4, 6); scene.add(key);
    const rim = new T.DirectionalLight(0xffe2b0, 0.6); rim.position.set(4, -2, -3); scene.add(rim);
    atlases = { red: atlas('red'), gold: atlas('gold'), iron: atlas('iron') };
    const mat = new T.MeshPhysicalMaterial({ map: atlases.red, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, flatShading: true });
    mesh = new T.Mesh(buildGeometry(tri), mat);
    mesh.scale.setScalar(S);
    scene.add(mesh);
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
    return new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), phi).multiply(qAlign);
  }

  function setTone(name) {
    if (shownTone === name) return;
    mesh.material.map = atlases[name]; mesh.material.needsUpdate = true;
    mesh.material.emissive = new T.Color(name === 'gold' ? 0x3a2400 : 0x000000);
    shownTone = name;
  }

  // 骰盤的可視範圍（世界單位）與牆
  function bounds() {
    const halfH = VIEW_H / 2, halfW = halfH * cam.aspect;
    return { x: halfW - S * 1.05, y: halfH - S * 1.05 };
  }

  function quatFromSpin(w, dt) {
    const a = w.length() * dt;
    if (a < 1e-9) return null;
    return new T.Quaternion().setFromAxisAngle(w.clone().normalize(), a);
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.033, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    if (anim) {
      if (anim.phase === 'flight') {
        // 飛行：移動、摩擦、撞牆回彈，同時旋轉
        pos.addScaledVector(vel, dt);
        vel.multiplyScalar(Math.exp(-FRICTION * dt));
        const b = bounds();
        if (pos.x > b.x) { pos.x = b.x; vel.x = -Math.abs(vel.x) * RESTITUTION; ang.y += (Math.random() - 0.5) * 6; ang.x += (Math.random() - 0.5) * 6; }
        if (pos.x < -b.x) { pos.x = -b.x; vel.x = Math.abs(vel.x) * RESTITUTION; ang.y += (Math.random() - 0.5) * 6; ang.x += (Math.random() - 0.5) * 6; }
        if (pos.y > b.y) { pos.y = b.y; vel.y = -Math.abs(vel.y) * RESTITUTION; ang.x += (Math.random() - 0.5) * 6; ang.z += (Math.random() - 0.5) * 6; }
        if (pos.y < -b.y) { pos.y = -b.y; vel.y = Math.abs(vel.y) * RESTITUTION; ang.x += (Math.random() - 0.5) * 6; ang.z += (Math.random() - 0.5) * 6; }
        const dq = quatFromSpin(ang, dt);
        if (dq) cur = dq.multiply(cur);
        ang.multiplyScalar(Math.exp(-1.0 * dt));
        if (now - anim.t0 >= FLIGHT * 1000) { anim.phase = 'settle'; anim.t1 = now; anim.from = cur.clone(); vel.set(0, 0); }
        mesh.scale.setScalar(S);
      } else {
        // 落定：朝向慢慢轉到結果那一面，骰子留在停下的位置，微微彈一下
        const p = Math.min(1, (now - anim.t1) / (SETTLE * 1000));
        const e = 1 - Math.pow(1 - p, 3);
        cur = anim.from.clone().slerp(anim.to, e);
        mesh.scale.setScalar(S * (1 + 0.06 * Math.sin(p * Math.PI) * (1 - p)));
        if (p >= 1) { cur = anim.to.clone(); anim = null; }
      }
    }
    if (cur) mesh.quaternion.copy(cur);
    mesh.position.set(pos.x, pos.y, 0);
    R.render(scene, cam);
    if (anim) raf = requestAnimationFrame(frame);
  }

  // 擲出：flight 階段隨機或玩家的揮動速度，settle 階段落到結果那一面
  function start(r, toss, instant) {
    if (!cur) cur = mesh.quaternion.clone();
    if (instant) {
      anim = { phase: 'settle', t1: performance.now(), from: cur.clone(), to: targetQuat(r) };
      vel.set(0, 0); ang.set(0, 0, 0);
    } else {
      const v = toss || randomToss();
      vel.copy(v);
      ang.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16);
      anim = { phase: 'flight', t0: performance.now(), to: targetQuat(r) };
    }
    if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); }
  }

  function randomToss() {
    const a = Math.random() * Math.PI * 2, sp = 3.4 + Math.random() * 1.2;
    return new T.Vector2(Math.cos(a) * sp, Math.sin(a) * sp);
  }

  function ensureRenderer(el) {
    const W = Math.max(160, Math.round(el.clientWidth || 300));
    if (!R) init();
    if (R.domElement.parentNode !== el) { el.appendChild(R.domElement); }
    if (W !== sizeW) {
      sizeW = W; R.setSize(W, TRAY_H, false);
      cam.aspect = W / TRAY_H; cam.updateProjectionMatrix();
      const b = bounds(); pos.x = Math.max(-b.x, Math.min(b.x, pos.x)); pos.y = Math.max(-b.y, Math.min(b.y, pos.y));
    }
  }

  // 玩家在骰盤上揮動：記錄最後一段軌跡，換算成骰盤世界單位的速度
  function bindFlick(el) {
    let pts = null;
    el.onpointerdown = e => {
      if (el.dataset.phase !== 'roll') return;
      pts = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
    };
    el.onpointermove = e => { if (pts) { pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (pts.length > 12) pts.shift(); } };
    el.onpointerup = e => {
      if (!pts) return;
      const now = performance.now();
      const recent = pts.filter(p => now - p.t < 140);
      let toss = null;
      if (recent.length >= 2) {
        const a = recent[0], b = recent[recent.length - 1], dtS = Math.max(0.016, (b.t - a.t) / 1000);
        const rect = el.getBoundingClientRect(), k = VIEW_H / Math.max(1, rect.height);   // 螢幕 px → 世界單位
        let vx = (b.x - a.x) / dtS * k, vy = -(b.y - a.y) / dtS * k;
        const sp = Math.hypot(vx, vy);
        if (sp > 0.8) { const m = Math.min(sp, 8) / sp; toss = new T.Vector2(vx * m, vy * m); }
      }
      pts = null;
      if (typeof rollBattle === 'function' && UI.ov && UI.ov.phase === 'roll') {
        pendingToss = toss;             // 揮動即擲骰；沒有明顯揮動就照一般擲骰
        rollBattle(false);
      }
    };
  }

  return {
    // 目前朝向鏡頭的那一面的數字（驗證用）
    topFace() {
      if (!mesh) return null;
      let best = -2, bi = 0;
      faceN.forEach((n, i) => { const z = n.clone().applyQuaternion(mesh.quaternion).z; if (z > best) { best = z; bi = i; } });
      return faceNum[bi];
    },
    // 掛到戰鬥介面的骰盤元素；o 為 {seq, roll, phase, tone}
    mount(el, o) {
      tray = el;
      ensureRenderer(el);
      el.classList.add('live3d');
      if (o.phase === 'roll') bindFlick(el);
      setTone(o.tone || 'red');
      if (o.roll != null && o.seq !== seq) {
        seq = o.seq;
        const toss = pendingToss; pendingToss = null;
        if (o.phase === 'rolling') start(o.roll, toss, false);
        else start(o.roll, null, true);                       // 跳過投擲：直接落定
      } else if (!anim && o.roll == null && !cur) {
        cur = targetQuat(20);
      }
      if (!anim && !raf) { lastT = 0; raf = requestAnimationFrame(frame); }
      if (!anim) R.render(scene, cam);
    },
  };
})();
