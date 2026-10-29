// Convierte los diagramas Mermaid de fuente/*.md y las vistas Archify en PNG (entrega/diagramas/img).
// Requiere playwright-core y mermaid.min.js en esta carpeta:
//   curl -o mermaid.min.js https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const E = path.resolve(__dirname, '..') + '/'; // entrega/fuente/
const IMG = path.resolve(__dirname, '../../diagramas/img') + '/';
const DIAG = path.resolve(__dirname, '../../diagramas') + '/';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
  await p.setContent('<html><body style="margin:0;background:#fff"><div id="d"></div></body></html>');
  await p.addScriptTag({ path: __dirname + '/mermaid.min.js' });
  await p.waitForFunction(() => window.mermaid);
  await p.evaluate(() => mermaid.initialize({ startOnLoad: false, theme: 'default', fontFamily: 'Arial', flowchart: { htmlLabels: true } }));
  const out = {};
  for (const f of fs.readdirSync(E).filter((x) => x.endsWith('.md'))) {
    const md = fs.readFileSync(E + f, 'utf8');
    const bloques = [...md.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
    for (let i = 0; i < bloques.length; i++) {
      const name = `${f.replace('.md', '')}_m${i}.png`;
      const svg = await p.evaluate(async ([code, id]) => (await mermaid.render(id, code)).svg, [bloques[i], 'g' + Math.random().toString(36).slice(2)]);
      await p.evaluate((s) => { document.getElementById('d').innerHTML = s; }, svg);
      const el = await p.$('#d svg');
      await el.screenshot({ path: IMG + name });
      out[name] = true;
    }
  }
  const a = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await a.goto('file://' + DIAG + 'arquitectura_talklate.html'); await a.waitForTimeout(1500);
  await a.screenshot({ path: IMG + 'archify_general.png', clip: { x: 43, y: 93, width: 1354, height: 790 } });
  await a.goto('file://' + DIAG + 'arquitectura_hexagonal.html'); await a.waitForTimeout(1500);
  await a.screenshot({ path: IMG + 'archify_hexagonal.png', clip: { x: 33, y: 140, width: 1374, height: 775 } });
  console.log(Object.keys(out).join('\n'));
  await b.close();
})();
