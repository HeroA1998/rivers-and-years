// 把遊戲打包成單一 HTML（供 Claude Artifact 發佈）：node tools/build-artifact.js <輸出路徑>
// 順序與 index.html 相同；所有圖片路徑（assets/…）在打包時換成內嵌的 data URI，讓單一檔案可以獨立執行。
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const index = rd('index.html');
const order = kind => [...index.matchAll(kind === 'js' ? /<script src="([^"?]+)/g : /<link rel="stylesheet" href="([^"?]+)/g)]
  .map(m => m[1]).filter(f => !/^https?:/.test(f));
const mime = f => f.endsWith('.webp') ? 'image/webp' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.png') ? 'image/png' : f.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
const dataUri = f => `data:${mime(f)};base64,` + fs.readFileSync(path.join(root, f)).toString('base64');
// 找出 JS / CSS 裡引用到的本地圖片，逐一內嵌
const assetCache = {};
const inlineAssets = text => text.replace(/(?:\.\.\/)?(assets\/[\w\/.-]+\.(?:webp|jpg|png|svg))/g, (m, p) => {
  if (!fs.existsSync(path.join(root, p))) throw new Error('missing asset: ' + p);
  if (!assetCache[p]) assetCache[p] = dataUri(p);
  return assetCache[p];
});
const inline = {};
for (const f of fs.readdirSync(path.join(root, 'assets/art'))) inline[f.replace('.jpg', '')] = dataUri('assets/art/' + f);
const heroes = {};
for (const f of fs.readdirSync(path.join(root, 'assets/ui/v12'))) if (/^hero_.*\.webp$/.test(f)) heroes[f] = dataUri('assets/ui/v12/' + f);
const faces = {};
for (const f of fs.readdirSync(path.join(root, 'assets/chars'))) faces[f.replace('.webp', '')] = dataUri('assets/chars/' + f);
let js = order('js').map(f => rd(f.startsWith('js/') ? f : 'js/' + f)).join('\n');
js = inlineAssets(js);
const extra = 'window.ART_INLINE = ' + JSON.stringify(inline) + ';\nwindow.FACE_INLINE = ' + JSON.stringify(faces) + ';\nwindow.HERO_INLINE = ' + JSON.stringify(heroes) + ';\n';
let css = order('css').map(f => rd(f.startsWith('css/') ? f : 'css/' + f)).join('\n');
css = inlineAssets(css);
const out = `<title>江湖歲月錄</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC&family=Noto+Sans+TC:wght@400;500&display=swap">
<style>
${css}
</style>
<div id="app"></div>
<script>
${extra}${js}
</script>
`;
const dest = process.argv[2] || path.join(root, 'dist-artifact.html');
fs.writeFileSync(dest, out);
console.log('ok', dest, out.length, 'bytes; inlined assets:', Object.keys(assetCache).length);
