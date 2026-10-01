/* GitHub Pages sirve CSS/JS con max-age=600: tras un push el navegador mezcla
   durante 10 minutos la hoja vieja con el HTML nuevo. Cada referencia a los
   CSS/JS propios lleva ?v=<huella del contenido>; este script la recalcula.

   Anclado al ATRIBUTO (href="…" / src="…"), nunca a la primera mención: la
   versión heredada de Miralles versionaba un comentario y se comía el <html>.
   Idempotente. Si un módulo se ha quitado, sus archivos se saltan sin error.

   node scripts/versionar.mjs            (en esta carpeta)
   node scripts/versionar.mjs <carpeta>  (en una copia)
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const raiz = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const huella = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, f))).digest('hex').slice(0, 8);
const ARCHIVOS = ['css/estilos.css', 'css/opiniones.css', 'css/casos.css', 'css/despachos.css', 'js/main.js', 'js/opiniones.js', 'js/casos.js', 'js/despachos.js'];
const versiones = Object.fromEntries(ARCHIVOS.filter(f => fs.existsSync(path.join(raiz, f))).map(f => [f, huella(f)]));
const escapar = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

const paginas = [];
(function recorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['scripts', 'screenshots', 'node_modules', '.git'].includes(e.name)) continue;
    const r = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(r); else if (e.name.endsWith('.html')) paginas.push(r);
  }
})(raiz);

let cambiadas = 0;
for (const ruta of paginas) {
  let html = fs.readFileSync(ruta, 'utf8');
  const antes = html;
  for (const [archivo, v] of Object.entries(versiones)) {
    /* href="css/x.css" o href="../../css/x.css", con o sin ?v= */
    html = html.replace(new RegExp('((?:href|src)="(?:\\.\\./)*' + escapar(archivo) + ')(\\?v=[0-9a-f]*)?"', 'g'), '$1?v=' + v + '"');
  }
  if (html !== antes) { fs.writeFileSync(ruta, html); cambiadas++; }
}
console.log(cambiadas + ' página(s) actualizada(s) de ' + paginas.length);
console.log(versiones);
