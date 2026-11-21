/* 戰鬥用 3D 骰子：真正的 20 面體（three.js 渲染）。
   骰子在「骰盤」裡可以被揮出去彈射，碰到邊框會回彈；停下後落在擲出的那一面。
   沒有 three.js 時 DIE3 為 null，介面退回平面骰。 */
const DIE3 = (function () {
  if (typeof THREE === 'undefined') return null;
  const T = THREE;
  const TRAY_H = 150, VIEW_H = 2.5;   // 骰盤高 150px 對應 2.5 個世界單位（PX = 60 px/單位，會跟著 #app 的縮放）
  const S = 0.92;                     // 骰子外接圓半徑（世界單位）
  const CAM_Z = 6;
  const FLIGHT = 1.0, SETTLE = 0.3, GLIDE = 0.45, PIXEL = 2;   // PIXEL：每個像素格的 CSS px（像素風渲染）   // 秒：飛行（整個螢幕）、飛回骰盤
  const FRICTION = 1.3, RESTITUTION = 0.7;
  let PX = 60;                        // 螢幕 px 每世界單位

  let R = null, cam = null, scene = null, mesh = null, atlases = {};
  const BG = { red: '#BC2B20', gold: '#E0A92A', iron: '#8A8478' };
  let emits = {}, faceNum = [], faceOf = [], faceN = [], faceUp = [];
  let tone = 'red', shownTone = null, sizeW = 0;
  let anim = null, raf = 0, seq = -1, lastT = 0, away = false, wantHome = false;
  let cur = null, pos = new T.Vector2(0, 0), vel = new T.Vector2(0, 0), ang = new T.Vector3();
  let pendingToss = null;
  let plainMat = null, numMat = null, tray = null, canvasReady = false, aimC = null, aimG = null;

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

  // 數字圖集：5×4 格，每格 64px，不做平滑，像素風；底色平塗，明暗交給光照形成低多邊形切面
  function atlas(name, emit) {
    const CELL = 64, c = document.createElement('canvas'); c.width = CELL * 5; c.height = CELL * 4;
    const g = c.getContext('2d');
    const pal = { red: ['#BC2B20', '#F5CF55', '#3A0B07'], gold: ['#E0A92A', '#FFFDF2', '#5A3A05'], iron: ['#8A8478', '#FFFDF4', '#2A2722'] }[name];
    for (let n = 1; n <= 20; n++) {
      const x0 = ((n - 1) % 5) * CELL, y0 = Math.floor((n - 1) / 5) * CELL;
      g.fillStyle = emit ? '#000' : pal[0]; g.fillRect(x0, y0, CELL, CELL);
      const txt = String(n), cx = x0 + CELL / 2, cy = y0 + CELL * 0.7;
      g.font = 'bold ' + (n >= 10 ? 30 : 40) + 'px "Courier New", monospace';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      if (!emit) { g.lineWidth = 5; g.strokeStyle = pal[2]; g.strokeText(txt, cx, cy); }
      g.fillStyle = pal[1]; g.fillText(txt, cx, cy);
    }
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.magFilter = T.NearestFilter; tex.minFilter = T.NearestFilter; tex.generateMipmaps = false;
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
    for (let i = 0; i < 20; i++) g.addGroup(i * 3, 3, 0);
    return g;
  }

  function init() {
    const tri = layout();
    R = new T.WebGLRenderer({ alpha: true, antialias: false });
    R.setPixelRatio(1 / PIXEL);
    R.outputColorSpace = T.SRGBColorSpace;
    // 畫布蓋住整個螢幕，但不攔截點擊；骰子可以飛到任何地方
    const st = R.domElement.style;
    st.position = 'fixed'; st.left = '0'; st.top = '0'; st.width = '100vw'; st.height = '100vh';
    st.pointerEvents = 'none'; st.zIndex = '60'; st.imageRendering = 'pixelated';
    document.body.appendChild(R.domElement);
    scene = new T.Scene();
    cam = new T.OrthographicCamera(-1, 1, 1, -1, -50, 50);
    cam.position.set(0, 0, 10);
    // 瞄準線畫在另一張蓋住整個螢幕的 2D 畫布上
    aimC = document.createElement('canvas'); aimG = aimC.getContext('2d');
    const as = aimC.style; as.position = 'fixed'; as.left = '0'; as.top = '0'; as.width = '100vw'; as.height = '100vh'; as.pointerEvents = 'none'; as.zIndex = '61';
    document.body.appendChild(aimC);
    sizeScreen();
    window.addEventListener('resize', () => { sizeScreen(); if (!anim && !away) { pos.copy(home()); renderNow(); } });
    window.addEventListener('scroll', () => { if (!anim && !away) { pos.copy(home()); renderNow(); } }, { passive: true });
    scene.add(new T.AmbientLight(0xffffff, 0.62));
    const key = new T.DirectionalLight(0xffffff, 1.9); key.position.set(-3, 5, 4); scene.add(key);
    atlases = { red: atlas('red'), gold: atlas('gold'), iron: atlas('iron') };
    emits = { red: atlas('red', true), gold: atlas('gold', true), iron: atlas('iron', true) };   // 數字自發光：不受光照影響，永遠亮
    plainMat = new T.MeshLambertMaterial({ color: new T.Color(BG.red), flatShading: true });
    numMat = new T.MeshLambertMaterial({ map: atlases.red, emissive: new T.Color(0xffffff), emissiveMap: emits.red, flatShading: true });
    mesh = new T.Mesh(buildGeometry(tri), [plainMat, numMat]);
    mesh.scale.setScalar(S);
    scene.add(mesh);
    cur = targetQuat(20);
    mesh.quaternion.copy(cur);
    showFace(null);
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
    plainMat.color.set(BG[name]); numMat.map = atlases[name]; numMat.emissiveMap = emits[name]; numMat.needsUpdate = true;
    shownTone = name;
  }

  // 整個螢幕就是邊框：世界座標以螢幕中心為原點，y 向上
  function sizeScreen() {
    const W = window.innerWidth, H = window.innerHeight;
    R.setSize(W, H, false);
    cam.left = -W / 2 / PX; cam.right = W / 2 / PX; cam.top = H / 2 / PX; cam.bottom = -H / 2 / PX;
    cam.updateProjectionMatrix();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    aimC.width = W * dpr; aimC.height = H * dpr; aimG.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function bounds() {
    const halfW = window.innerWidth / 2 / PX, halfH = window.innerHeight / 2 / PX;
    return { x: halfW - S * 1.02, y: halfH - S * 1.02 };
  }
  // 骰盤中心在世界座標中的位置（骰子靜止時停在這裡）
  function home() {
    if (!tray) return new T.Vector2(0, 0);
    const r = tray.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const px = Math.max(30, r.height / VIEW_H);
    if (Math.abs(px - PX) > 0.01) { PX = px; sizeScreen(); }
    return new T.Vector2((cx - window.innerWidth / 2) / PX, -(cy - window.innerHeight / 2) / PX);
  }
  function showFace(r) {            // 只有擲出的那一面有數字，其他面保持素面
    mesh.geometry.groups.forEach((gr, i) => { gr.materialIndex = (r != null && faceNum[i] === r) ? 1 : 0; });
  }
  function place() { if (cur) mesh.quaternion.copy(cur); mesh.position.set(pos.x, pos.y, 0); }
  function renderNow() { place(); R.render(scene, cam); }

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
        if (now - anim.t0 >= FLIGHT * 1000) { anim.phase = 'settle'; anim.t1 = now; anim.from = cur.clone(); vel.set(0, 0); showFace(anim.r); }
        mesh.scale.setScalar(S);
      } else if (anim.phase === 'settle') {
        // 停在原地，朝向轉到結果那一面
        const p = Math.min(1, (now - anim.t1) / (SETTLE * 1000));
        const e = 1 - Math.pow(1 - p, 3);
        cur = anim.from.clone().slerp(anim.to, e);
        mesh.scale.setScalar(S * (1 + 0.05 * Math.sin(p * Math.PI) * (1 - p)));
        if (p >= 1) { cur = anim.to.clone(); if (wantHome) startGlide(now); else { anim = null; away = true; } }
      } else {
        // 飛回骰盤：位置滑回中央，朝向轉到結果那一面，落下時微微彈一下
        const p = Math.min(1, (now - anim.t1) / (GLIDE * 1000));
        const e = 1 - Math.pow(1 - p, 3);
        pos.copy(anim.fromPos).lerp(home(), e);
        cur = anim.from.clone().slerp(anim.to, e);
        mesh.scale.setScalar(S * (1 + 0.05 * Math.sin(p * Math.PI) * (1 - p)));
        if (p >= 1) { cur = anim.to.clone(); pos.copy(home()); anim = null; away = false; }
      }
    }
    if (cur) mesh.quaternion.copy(cur);
    mesh.position.set(pos.x, pos.y, 0);
    R.render(scene, cam);
    if (anim) raf = requestAnimationFrame(frame);
  }

  // 攻擊開始後，骰子才飛回骰盤
  function startGlide(now) {
    anim = { phase: 'glide', t1: now || performance.now(), fromPos: pos.clone(), from: cur.clone(), to: cur.clone() };
    away = false;
    if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); }
  }

  // 擲出：flight 階段隨機或玩家的揮動速度，settle 階段落到結果那一面
  function start(r, toss, instant) {
    if (!cur) cur = mesh.quaternion.clone();
    if (instant) {
      anim = { phase: 'glide', t1: performance.now(), fromPos: pos.clone(), from: cur.clone(), to: targetQuat(r), r };
      showFace(r); vel.set(0, 0); ang.set(0, 0, 0); away = false;
    } else {
      if (!away) pos.copy(home());
      away = false;
      const v = toss || randomToss();
      vel.copy(v);
      ang.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16);
      anim = { phase: 'flight', t0: performance.now(), to: targetQuat(r), r };
      showFace(null);
    }
    if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); }
  }

  function randomToss() {
    const a = Math.random() * Math.PI * 2, sp = 12 + Math.random() * 5;   // 世界單位/秒，約每秒 700~1000px
    return new T.Vector2(Math.cos(a) * sp, Math.sin(a) * sp);
  }

  function ensureRenderer(el) {
    const W = Math.max(160, Math.round(el.clientWidth || 300));
    if (!R) init();
    if (!canvasReady) { canvasReady = true; }
    if (W !== sizeW) { sizeW = W; }
  }

  // ---- 怪物彈珠式操作：在骰盤上按住往後拉，放開後骰子往反方向彈出去 ----
  const MAXPULL = 3.2;                                   // 最大拉距（世界單位）
  function diePx() { const h = home(); return { x: h.x * PX + window.innerWidth / 2, y: -h.y * PX + window.innerHeight / 2 }; }
  function launchOf(fx, fy) {
    const d0 = diePx(), px = d0.x - fx, py = d0.y - fy, d = Math.hypot(px, py);
    if (d < 22) return null;                             // 拉得太短：視為點一下，隨機彈出
    const power = Math.min(d / PX, MAXPULL), sp = 8 + power * 6;
    return { dir: [px / d, py / d], power, speed: sp, vel: new T.Vector2(px / d * sp, -py / d * sp), d0, d };
  }
  function aimClear() { if (aimG) aimG.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  function aimDraw(fx, fy) {
    aimClear();
    const d0 = diePx(), L = launchOf(fx, fy), g = aimG;
    g.save(); g.lineCap = 'round';
    // 拉繩：從骰子到手指
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(d0.x, d0.y); g.lineTo(fx, fy); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(fx, fy, 9, 0, 7); g.fill();
    g.restore();
  }
  function bindSling(el) {
    let down = false;
    el.onpointerdown = e => {
      if (el.dataset.phase !== 'roll') return;
      down = true; el.setPointerCapture && el.setPointerCapture(e.pointerId); aimDraw(e.clientX, e.clientY);
    };
    el.onpointermove = e => { if (down) aimDraw(e.clientX, e.clientY); };
    el.onpointercancel = () => { down = false; aimClear(); };
    el.onpointerup = e => {
      if (!down) return;
      down = false; aimClear();
      const L = launchOf(e.clientX, e.clientY);
      if (typeof rollBattle === 'function' && UI.ov && UI.ov.phase === 'roll') {
        pendingToss = L ? L.vel : null;                  // 拉出去的力道決定速度；點一下則隨機
        rollBattle(false);
      }
    };
  }

  return {
    // 離開戰鬥畫面：藏起骰子與瞄準線，停掉動畫
    hide() {
      if (!R) return;
      R.domElement.style.display = 'none'; aimC.style.display = 'none'; aimClear();
      anim = null; if (raf) { cancelAnimationFrame(raf); raf = 0; }
      tray = null; away = false; wantHome = false; showFace(null); cur = targetQuat(20); pos.set(0, 0); vel.set(0, 0);
    },
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
      R.domElement.style.display = ''; aimC.style.display = '';
      el.classList.add('live3d');
      if (o.phase === 'roll') bindSling(el); else aimClear();
      setTone(o.tone || 'red');
      if (o.roll != null && o.seq !== seq) {
        seq = o.seq;
        const toss = pendingToss; pendingToss = null;
        if (o.phase === 'rolling') start(o.roll, toss, false);
        else start(o.roll, null, true);                       // 跳過投擲：直接落定
      } else if (!anim && o.roll == null && !cur) {
        cur = targetQuat(20);
      }
      if (!anim && !cur) cur = targetQuat(20);
      wantHome = o.phase === 'fight' && o.tick > 0;           // 第一下攻擊出手後，骰子才回骰盤
      if (!anim && away && wantHome) startGlide();
      if (!anim && !away) pos.copy(home());
      if (!anim && !raf) renderNow();
      if (anim && !raf) { lastT = 0; raf = requestAnimationFrame(frame); }
    },
  };
})();
