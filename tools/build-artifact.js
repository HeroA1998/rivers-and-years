// 把遊戲打包成單一 HTML 片段（供 Claude Artifact 發佈）：node tools/build-artifact.js <輸出路徑>
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const inline = {};
for (const f of fs.readdirSync(path.join(root, 'assets/art'))) inline[f.replace('.jpg', '')] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(root, 'assets/art', f)).toString('base64');
const js = 'window.ART_INLINE = ' + JSON.stringify(inline) + ';\n' + ['data', 'artlist', 'game', 'events', 'art', 'ui'].map(f => rd(`js/${f}.js`)).join('\n');
const out = `<title>江湖歲月錄</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC&family=Noto+Sans+TC:wght@400;500&display=swap">
<style>
${rd('css/style.css')}
</style>
<div id="app"></div>
<script>
${js}
</script>
`;
fs.writeFileSync(process.argv[2] || path.join(root, 'dist-artifact.html'), out);
console.log('ok', out.length);
