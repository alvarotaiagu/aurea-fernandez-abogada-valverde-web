/* Quita uno de los tres módulos de una carpeta de la web.

   node scripts/quitar-modulo.mjs opiniones ../copia-de-la-web    (sobre una copia)
   node scripts/quitar-modulo.mjs despachos --aqui                (aquí mismo, sin vuelta atrás)
   Módulos: opiniones · casos · despachos

   Es exactamente la receta del README:
     1. index.html: borra la <section> entre sus marcas «[MÓDULO X]» … «fin [MÓDULO X]»
        y las líneas con data-modulo="x": el enlace del menú, el <link> y el <script>.
     2. blog/index.html (solo casos): sus dos <li data-modulo="casos"> y su <script>.
     3. Borra css/x.css y js/x.js.
     4. Vuelve a versionar CSS y JS (?v=).
   No toca nada más: main.js y estilos.css no dependen de ningún módulo.
   Sin el de despachos, «Escríbeme» enseña sola las dos direcciones (CSS :has()).
   Se niega a escribir si un archivo pierde más de lo esperado.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aqui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [modulo, destino] = process.argv.slice(2);
if (!['opiniones', 'casos', 'despachos'].includes(modulo) || !destino) {
  console.error('Uso: node scripts/quitar-modulo.mjs <opiniones|casos|despachos> <carpeta|--aqui>');
  process.exit(1);
}
const raiz = destino === '--aqui' ? aqui : path.resolve(destino);
const MAYUS = modulo.toUpperCase();
const attr = 'data-modulo="' + modulo + '"';

function cortar(t, desde, hasta, archivo) {
  const i = t.indexOf(desde);
  if (i < 0) throw new Error(archivo + ': no encuentro «' + desde + '» (¿ya se quitó?)');
  const j = t.indexOf(hasta, i);
  if (j < 0) throw new Error(archivo + ': no encuentro el cierre «' + hasta + '»');
  let fin = j + hasta.length;
  if (t[fin] === '\r') fin++;
  if (t[fin] === '\n') fin++;
  let ini = i;
  while (ini > 0 && (t[ini - 1] === ' ' || t[ini - 1] === '\t')) ini--;
  return t.slice(0, ini) + t.slice(fin);
}
function guardar(ruta, antes, despues, maxPerdida) {
  if (despues.length < antes.length * (1 - maxPerdida)) throw new Error('Me niego: ' + path.relative(raiz, ruta) + ' perdería demasiado');
  fs.writeFileSync(ruta, despues);
}
const sinLineas = t => t.split(/\r?\n/).filter(l => !l.includes(attr)).join('\n');

/* 1 · index.html */
{
  const ruta = path.join(raiz, 'index.html');
  const antes = fs.readFileSync(ruta, 'utf8');
  let t = cortar(antes, '<!-- ═══ [MÓDULO ' + MAYUS + ']', '<!-- ═══ fin [MÓDULO ' + MAYUS + '] ═══ -->', 'index.html');
  t = sinLineas(t);
  guardar(ruta, antes, t, 0.35);
  console.log('index.html: sección y líneas con ' + attr + ' quitadas');
}
/* 2 · blog/index.html (casos) */
if (modulo === 'casos') {
  const ruta = path.join(raiz, 'blog/index.html');
  if (fs.existsSync(ruta)) {
    const antes = fs.readFileSync(ruta, 'utf8');
    let t = antes;
    for (let k = 0; k < 10 && t.includes('<li class="nota" ' + attr); k++) t = cortar(t, '<li class="nota" ' + attr, '</li>', 'blog/index.html');
    t = sinLineas(t);
    guardar(ruta, antes, t, 0.3);
    console.log('blog/index.html: entradas y script de casos quitados');
  }
}
/* 3 · sus archivos */
for (const f of ['css/' + modulo + '.css', 'js/' + modulo + '.js']) {
  const r = path.join(raiz, f);
  if (fs.existsSync(r)) { fs.rmSync(r); console.log('borrado ' + f); }
}
if (modulo === 'casos') {
  const r = path.join(raiz, 'data/casos.json');
  if (fs.existsSync(r)) { fs.rmSync(r); console.log('borrado data/casos.json'); }
}
/* 4 · versionar */
const versionador = path.join(raiz, 'scripts/versionar.mjs');
if (fs.existsSync(versionador)) execFileSync(process.execPath, [versionador, raiz], { stdio: 'ignore' });
console.log('Módulo «' + modulo + '» quitado de ' + raiz);
