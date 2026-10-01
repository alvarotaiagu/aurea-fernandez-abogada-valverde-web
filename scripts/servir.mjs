/* Servidor estático para revisar la maqueta en el navegador.
   Hace falta HTTP (no doble clic): las viñetas de hoja son mask-image, que no
   funciona bajo file://, y el 404 tiene que responder de verdad.

   node scripts/servir.mjs          → http://127.0.0.1:4210
   node scripts/servir.mjs 5000     → otro puerto
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const puerto = Number(process.argv[2]) || 4210;
export const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8'
};

export function servir(dir, p) {
  dir = path.resolve(dir);
  const s = http.createServer((req, res) => {
    let limpia = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    let destino = path.join(dir, limpia);
    if (!destino.startsWith(dir)) { res.writeHead(403).end('no'); return; }
    if (fs.existsSync(destino) && fs.statSync(destino).isDirectory()) {
      /* como GitHub Pages: /carpeta → /carpeta/ y /carpeta/ → index.html */
      if (!limpia.endsWith('/')) { res.writeHead(301, { location: limpia + '/' }).end(); return; }
      destino = path.join(destino, 'index.html');
    }
    if (!fs.existsSync(destino)) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(dir, '404.html')));
      return;
    }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(destino)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(destino));
  });
  return new Promise(r => s.listen(p, '127.0.0.1', () => r(s)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await servir(raiz, puerto);
  console.log('Áurea Mª Fernández en http://127.0.0.1:' + puerto + '  (con el mando: /?revision)');
  console.log('Ctrl+C para parar.');
}
