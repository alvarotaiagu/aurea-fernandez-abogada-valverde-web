/* Quita el mando de maqueta (y la versión sobria) de una carpeta de la web.
   El mando NUNCA viaja al sitio de la clienta.

   node scripts/quitar-mando.mjs ../aurea-entrega   (sobre una copia)
   node scripts/quitar-mando.mjs --aqui             (aquí mismo, sin vuelta atrás)

   Corta, entre sus marcas exactas (sin comodines):
     index.html      el aviso de arriba, la lectura de la densidad en el <head>,
                     la ficha rápida, el <div class="mando"> y la clase densidad-laurel
     estilos.css     el bloque [MANDO DE MAQUETA] (mando + reglas de la sobria)
     opiniones.css   las reglas sobrias del módulo (si el módulo sigue)
     main.js         la función mandoMaqueta()
     privacidad.html la fila de aurea-densidad
   Después comprueba con scripts/comprobar-borrado.mjs.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aqui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!arg) { console.error('Uso: node scripts/quitar-mando.mjs <carpeta> | --aqui'); process.exit(1); }
const raiz = arg === '--aqui' ? aqui : path.resolve(arg);

function cortar(t, desde, hasta, archivo, linea = true) {
  const i = t.indexOf(desde);
  if (i < 0) throw new Error(archivo + ': no encuentro «' + desde.slice(0, 50) + '…» (¿ya se quitó?)');
  const j = t.indexOf(hasta, i);
  if (j < 0) throw new Error(archivo + ': no encuentro el cierre «' + hasta.slice(0, 50) + '…»');
  let fin = j + hasta.length, ini = i;
  if (linea) {
    if (t[fin] === '\r') fin++;
    if (t[fin] === '\n') fin++;
    while (ini > 0 && (t[ini - 1] === ' ' || t[ini - 1] === '\t')) ini--;
  }
  return t.slice(0, ini) + t.slice(fin);
}
function editar(rel, cambios, maxPerdida, opcional = false) {
  const ruta = path.join(raiz, rel);
  if (!fs.existsSync(ruta)) { if (opcional) { console.log('no está ' + rel + ' (módulo quitado)'); return; } throw new Error('falta ' + rel); }
  const antes = fs.readFileSync(ruta, 'utf8');
  let t = antes;
  for (const c of cambios) t = c(t);
  if (t.length < antes.length * (1 - maxPerdida)) throw new Error('Me niego: ' + rel + ' perdería demasiado');
  fs.writeFileSync(ruta, t);
  console.log('limpio ' + rel);
}

editar('index.html', [
  t => cortar(t, '<!-- ═══ [MANDO DE MAQUETA] AVISO', 'fin del bloque [MANDO DE MAQUETA] ═══ -->', 'index.html'),
  t => cortar(t, '/* [MANDO DE MAQUETA] la densidad guardada', '/* fin del bloque [MANDO DE MAQUETA] */', 'index.html'),
  t => cortar(t, '<!-- ═══ [MANDO DE MAQUETA] ficha rápida', '<!-- ═══ fin del bloque [MANDO DE MAQUETA] ═══ -->', 'index.html'),
  t => cortar(t, '<!-- ═══ [MANDO DE MAQUETA] · solo con ?revision', '<!-- ═══ fin del bloque [MANDO DE MAQUETA] ═══ -->', 'index.html'),
  t => t.replace('<html lang="es" class="sin-js densidad-laurel">', '<html lang="es" class="sin-js">'),
  /* el return que solo servía para saltarse la densidad */
  t => t.replace(/\n\s*if \(!\/\[\?&\]revision\\b\/\.test\(location\.search\)\) return;/, '')
], 0.2);
editar('css/estilos.css', [t => cortar(t, '/* ═══════════════ [MANDO DE MAQUETA]', '/* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */', 'estilos.css')], 0.25);
editar('css/opiniones.css', [t => cortar(t, '/* [MANDO DE MAQUETA] sobria', '/* fin [MANDO DE MAQUETA] */', 'opiniones.css')], 0.4, true);
editar('js/main.js', [t => cortar(t, '  /* ═══════════════════════════════════════════════════════════════════════\n     [MANDO DE MAQUETA]', '/* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */', 'main.js')], 0.15);
editar('privacidad.html', [t => cortar(t, '<!-- [MANDO DE MAQUETA] esta fila', '<!-- fin [MANDO DE MAQUETA] -->', 'privacidad.html')], 0.2);

const versionador = path.join(raiz, 'scripts/versionar.mjs');
if (fs.existsSync(versionador)) execFileSync(process.execPath, [versionador, raiz], { stdio: 'ignore' });
console.log('Mando quitado de ' + raiz + '. Comprueba: node scripts/comprobar-borrado.mjs ' + (arg === '--aqui' ? '' : arg));
