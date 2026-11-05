// Servidor estatico minimo para la app web exportada (frontend/dist): sirve los archivos y, si la ruta
// no existe, responde index.html (las rutas de expo-router se resuelven en el navegador).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(process.argv[2] || path.join(__dirname, '..', 'frontend', 'dist'));
const puerto = Number(process.argv[3]) || 8090;
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.wasm': 'application/wasm' };

http.createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let archivo = path.join(raiz, ruta);
  if (!archivo.startsWith(raiz)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
    const html = `${archivo.replace(/\/$/, '')}.html`;
    archivo = fs.existsSync(html) ? html : path.join(raiz, 'index.html');
  }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
  fs.createReadStream(archivo).pipe(res);
}).listen(puerto, '127.0.0.1', () => console.log(`web en http://127.0.0.1:${puerto} (${raiz})`));
