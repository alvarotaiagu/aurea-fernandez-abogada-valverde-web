/* Verificación de la web de Áurea Mª Fernández · «Laurel».
   Levanta un servidor estático, abre la web con Playwright (bajando con
   mouse.wheel: con Lenis, window.scrollTo no dispara ScrollTrigger) y comprueba:
     · un test por cada punto del checklist de web desde cero;
     · la cortina: fotogramas a medias, que la corona acaba EXACTAMENTE en el
       hero, y su retirada sin CDN y con movimiento reducido;
     · que la balanza del monograma no tiene ninguna animación de rotación;
     · la pila de áreas en página limpia;
     · el formulario compone bien WhatsApp, email y llamar;
     · los tres módulos: borrado en copias temporales, y Casos con permiso true/false;
     · el selector de despachos con teclado;
     · las dos densidades, y que sin ?revision no hay mando (ni en la copia sin mando);
     · las redirecciones de Siweb; el blog íntegro (diff línea a línea);
     · que cada cita de opiniones.json está en google-resenas.json;
     · textos vetados, contraste medido componiendo el alfa, consola y peticiones.

   node scripts/verificar.mjs             (todo)
   node scripts/verificar.mjs --capturas  (además guarda screenshots/)
*/
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { servir } from './servir.mjs';
import { ENTRADAS, CORRECCIONES, original, corregida, comoSeLee } from './blog-fuente.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conCapturas = process.argv.includes('--capturas');
if (conCapturas) fs.mkdirSync(path.join(raiz, 'screenshots'), { recursive: true });
const foto = n => path.join(raiz, 'screenshots', n);

const fallos = [], notas = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }

async function rueda(page, vueltas, paso = 600, espera = 200) {
  for (let i = 0; i < vueltas; i++) { await page.mouse.wheel(0, paso); await page.waitForTimeout(espera); }
  await page.waitForTimeout(1400);
}
/* lleva la página con la rueda hasta que el selector quede bajo la cabecera */
async function hasta(page, selector, margen = 0) {
  for (let i = 0; i < 140; i++) {
    const top = await page.evaluate(s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top : 0; }, selector);
    if (top <= 90 + margen && top > -40) break;
    const paso = top > 0 ? Math.min(650, Math.max(90, top - 60)) : Math.max(-650, top - 80);
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(1500);
}
async function nuevaPagina(navegador, op = {}) {
  const contexto = await navegador.newContext({
    viewport: op.viewport || { width: 1440, height: 900 },
    reducedMotion: op.reducedMotion || 'no-preference',
    hasTouch: !!op.tactil, isMobile: !!op.tactil, deviceScaleFactor: 1
  });
  if (op.cookiesVistas) await contexto.addInitScript(() => { try { localStorage.setItem('aurea-cookies', 'ok'); } catch (e) {} });
  if (op.sinGsap) await contexto.route(/cdn\.jsdelivr\.net\/npm\/(gsap|lenis)/, r => r.abort());
  const page = await contexto.newPage();
  const errores = [], caidas = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('requestfailed', r => caidas.push(r.url() + ' → ' + (r.failure()?.errorText || '')));
  page.on('response', r => { if (r.status() >= 400) caidas.push(r.status() + ' ' + r.url()); });
  return { contexto, page, errores, caidas };
}
const esperarCortina = page => page.waitForFunction(() => { const c = document.getElementById('cortina'); return !c || getComputedStyle(c).display === 'none'; }, null, { timeout: 9000 }).catch(() => {});
const propias = c => c.filter(x => !/favicon\.ico|google\.com\/maps|gstatic|googleapis\.com\/maps|places\.googleapis|maps\.google|googleusercontent/.test(x));

const PUERTO = 4211;
const base = 'http://127.0.0.1:' + PUERTO;
const servidor = await servir(raiz, PUERTO);
const navegador = await chromium.launch();
const VIEWPORTS = [[360, 640], [375, 667], [390, 844], [768, 1024], [1440, 900]];
const ORDEN = ['inicio', 'areas', 'como-trabajo', 'sobre-mi', 'opiniones', 'casos', 'despachos', 'escribeme', 'notas'];
const paginasHtml = [];
(function recorrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['scripts', 'screenshots', 'node_modules', '.git'].includes(e.name)) continue;
    const r = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(r); else if (e.name.endsWith('.html')) paginasHtml.push(path.relative(raiz, r).replace(/\\/g, '/'));
  }
})(raiz);
function copiaTemporal(nombre) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'aurea-' + nombre + '-'));
  fs.cpSync(raiz, d, { recursive: true, filter: s => !/[\\/](screenshots|node_modules|\.git)([\\/]|$)/.test(s) });
  return d;
}

/* contraste en el navegador, componiendo el alfa (y leyendo color(srgb …) de color-mix) */
const CONTRASTE = `(sel) => {
  const el = document.querySelector(sel); if (!el) return null;
  const leer = c => { let m = c.match(/color\\(srgb ([\\d.]+) ([\\d.]+) ([\\d.]+)(?: \\/ ([\\d.]+))?\\)/);
    if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4]];
    m = c.match(/rgba?\\(([\\d.]+), ([\\d.]+), ([\\d.]+)(?:, ([\\d.]+))?\\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : [0, 0, 0, 0]; };
  let n = el, fondo = null;
  while (n && n.nodeType === 1) { const f = leer(getComputedStyle(n).backgroundColor); if (f[3] > 0.5) { fondo = f; break; } n = n.parentElement; }
  fondo = fondo || [246, 242, 234, 1];
  const t = leer(getComputedStyle(el).color);
  const c = [0, 1, 2].map(i => t[i] * t[3] + fondo[i] * (1 - t[3]));
  const L = v => { v = v.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const a = L(c), b = L(fondo);
  return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
}`;

try {
  /* ───── 0. archivos ───── */
  {
    for (const p of paginasHtml) {
      const t = fs.readFileSync(path.join(raiz, p), 'utf8');
      comprobar(/<meta name="robots" content="noindex, nofollow">/.test(t), 'noindex: ' + p);
    }
    const huella = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, f))).digest('hex').slice(0, 8);
    let malVersion = [];
    for (const p of paginasHtml) {
      const t = fs.readFileSync(path.join(raiz, p), 'utf8');
      for (const m of t.matchAll(/(?:href|src)="(?:\.\.\/)*((?:css|js)\/[\w-]+\.(?:css|js))(\?v=([0-9a-f]{8}))?"/g)) if (!m[3] || m[3] !== huella(m[1])) malVersion.push(p + ':' + m[1]);
      if (/\?v=/.test(t.replace(/(?:href|src)="[^"]*"/g, ''))) malVersion.push(p + ': ?v= fuera de href/src');
    }
    comprobar(malVersion.length === 0, 'versionado ?v=<huella> correcto y solo en href/src, en todas las páginas' + (malVersion.length ? ' → ' + malVersion.slice(0, 5).join(' | ') : ''));
    const idx = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
    comprobar(!/cdnjs\.cloudflare\.com\/ajax\/libs\/lenis/.test(idx) && /cdn\.jsdelivr\.net\/npm\/lenis@/.test(idx), 'Lenis desde jsDelivr (cdnjs da 404)');
    const css = fs.readFileSync(path.join(raiz, 'css/estilos.css'), 'utf8');
    comprobar(/\.cookies:not\(\[hidden\]\)\s*\{\s*display:\s*flex/.test(css) && !/\.cookies\s*\{[^}]*display:\s*flex/.test(css), 'checklist 4 · cookies: display:flex solo en .cookies:not([hidden])');
    comprobar(/height:\s*100dvh/.test(css), 'checklist 3 · menú móvil con altura 100dvh');
    comprobar(/\.cortina\[hidden\]\s*\{\s*display:\s*none/.test(css) && /html\.con-js \.cortina\.es-fuera/.test(css), 'cortina: regla [hidden] propia y la de retirada repite el ancestro (gana en especificidad)');
    const js = ['main', 'opiniones', 'casos', 'despachos'].map(n => fs.readFileSync(path.join(raiz, 'js', n + '.js'), 'utf8')).join('\n');
    const dash = /strokeDashoffset|stroke-dashoffset/.test(js);
    comprobar(!dash || /autoRound:\s*false/.test(js), 'checklist 8 · trazos: ' + (dash ? 'con autoRound:false' : 'nada se anima con stroke-dashoffset (las ramas son formas rellenas: crecen por recorte)'));
    const estados = (js.match(/classList\.(?:add|toggle|remove)\('([^']+)'/g) || []).map(s => s.match(/'([^']+)'/)[1]);
    const sinPrefijo = estados.filter(c => /^(activo|activa|visible|posada|abierto|fuera|actual|on|suelta|doble|copia)$/.test(c));
    comprobar(sinPrefijo.length === 0, 'checklist 9 · clases de estado con prefijo es- (' + [...new Set(estados.filter(c => c.startsWith('es-')))].join(', ') + ')' + (sinPrefijo.length ? ' → sin prefijo: ' + sinPrefijo.join(',') : ''));
    /* la balanza: nada que la gire, ni en JS ni en CSS */
    const todoCss = ['estilos', 'opiniones', 'casos', 'despachos'].map(n => fs.readFileSync(path.join(raiz, 'css', n + '.css'), 'utf8')).join('\n');
    const giraJs = /(mono|monograma|balanza|platillo)[^;\n]{0,80}rotat/i.test(js) || /rotat[^;\n]{0,80}(mono|monograma|balanza|platillo)/i.test(js);
    const giraCss = /(mono|monograma|balanza)[^{}]*\{[^}]*(rotate|animation)/i.test(todoCss);
    comprobar(!giraJs && !giraCss, 'balanza: ni el JS ni el CSS rotan o animan el monograma');
    /* datos estructurados */
    const ld = JSON.parse(idx.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const tipos = ld['@graph'].map(n => n['@type']);
    comprobar(tipos.includes('Attorney') && tipos.filter(t => t === 'LegalService').length === 2 && !/aggregateRating|"review"/.test(JSON.stringify(ld)),
      'schema.org: Attorney + 2 LegalService (los dos despachos), sin aggregateRating ni review');
    /* opiniones.json contra las 183 descargadas */
    const resenas = JSON.parse(fs.readFileSync(path.join(raiz, 'scripts/fuentes/google-resenas.json'), 'utf8'));
    const op = JSON.parse(fs.readFileSync(path.join(raiz, 'data/opiniones.json'), 'utf8'));
    const norm = s => s.replace(/\s+/g, ' ').trim();
    const malas = op.citas.filter(c => {
      const orig = norm(resenas[c.indice]?.texto || '');
      return !c.texto.split('…').map(norm).filter(Boolean).every(f => orig.includes(f));
    });
    comprobar(op.citas.length >= 10 && op.citas.length <= 12 && malas.length === 0,
      'opiniones.json: ' + op.citas.length + ' citas, todas literales en google-resenas.json por su índice (cortes con «…»)' + (malas.length ? ' → ' + malas.map(m => m.indice).join(',') : ''));
    const firmas = op.citas.map(c => c.nombre);
    comprobar(firmas.every(f => !/@/.test(f) && /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+( [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)? [A-ZÁÉÍÓÚÑ]\.$/.test(f)),
      'opiniones: firma = nombre de pila + inicial, ninguna arroba → ' + firmas.join(', '));
    comprobar(op.citas.some(c => /hipoteca/.test(c.tema)) && op.citas.some(c => /Madrid|Barcelona/.test(c.tema)) && op.citas.some(c => /empresa/.test(c.tema)),
      'opiniones: variadas (hipoteca, fuera de Extremadura, una empresa)');
    const tieneEnHtml = op.citas.every(c => idx.includes('«' + c.texto.replace(/&/g, '&amp;') + '»') && idx.includes(c.nombre + ' · Google'));
    comprobar(tieneEnHtml, 'opiniones: las citas del HTML son las de opiniones.json (construir.mjs al día)');
    /* casos.json por defecto */
    comprobar(JSON.parse(fs.readFileSync(path.join(raiz, 'data/casos.json'), 'utf8')).permiso === false, 'casos.json: "permiso": false por defecto');
    const hor = fs.readFileSync(path.join(raiz, 'data/horario.json'), 'utf8');
    comprobar(/\[CONFIRMAR\]/.test(hor) && /17:00–20:30/.test(hor) && /17:00–21:00/.test(hor), 'horario.json: las dos fuentes, marcadas [CONFIRMAR]');
    /* blog: diff línea a línea contra su web; solo cambian las erratas declaradas */
    for (const e of ENTRADAS) {
      const o = original(e.slug), c = corregida(e.slug);
      const cambios = c.lineas.filter((l, i) => l !== o.lineas[i]).length + (c.titulo !== o.titulo ? 1 : 0);
      const declaradas = CORRECCIONES.filter(k => k[0] === e.slug).length;
      comprobar(cambios === declaradas, 'blog ' + e.slug + ': ' + c.lineas.length + ' líneas de origen, ' + cambios + ' corregida(s) = ' + declaradas + ' declarada(s) en el README');
    }
    /* redirecciones en disco */
    const red = JSON.parse(fs.readFileSync(path.join(raiz, 'scripts/redirecciones.json'), 'utf8'));
    const malRed = red.filter(r => {
      const t = fs.readFileSync(path.join(raiz, r.vieja.slice(1), 'index.html'), 'utf8');
      return !(t.includes('http-equiv="refresh" content="0; url=' + r.destino + '"') && t.includes('rel="canonical" href="' + r.canonical + '"') && t.includes('<a href="' + r.destino + '">'));
    });
    comprobar(red.length === 11 && malRed.length === 0, 'redirecciones: ' + red.length + ' páginas mínimas con meta refresh + canonical + enlace visible');
  }

  /* ───── 1. escritorio, pasada normal ───── */
  {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    const muestras = [];
    const t0 = Date.now();
    const instantes = [300, 900, 1400, 1950, 2350, 2600];
    let capt = 0;
    while (Date.now() - t0 < 4200) {
      const m = await page.evaluate(() => {
        const c = document.getElementById('cortina'); if (!c) return null;
        const g = s => c.querySelector(s);
        const insetDe = e => { const v = getComputedStyle(e).clipPath; const n = (v.match(/inset\(([^)]*)\)/) || [, '0'])[1].split(' ').map(parseFloat); return n; };
        const hojas = [...c.querySelectorAll('.cortina__hojas--izq .cortina__hoja')].map(h => +getComputedStyle(h).opacity);
        const tr = getComputedStyle(document.getElementById('cortina-panel')).transform;
        const ty = tr === 'none' ? 0 : +tr.split(',')[5].replace(')', '');
        const mono = g('.cc--mono');
        const giros = [mono, document.querySelector('#hero-corona svg')].map(e => getComputedStyle(e).transform);
        const animMono = mono.getAnimations().length + document.querySelector('#hero-corona').getAnimations({ subtree: true }).length;
        return {
          display: getComputedStyle(c).display, panel: getComputedStyle(document.getElementById('cortina-panel')).backgroundColor,
          izq: insetDe(g('.cc--izq'))[0], der: insetDe(g('.cc--der'))[0], mono: insetDe(mono)[2],
          hojas, tinta: +getComputedStyle(g('.cc--tinta')).opacity, oro: +getComputedStyle(g('.cc--izq')).opacity,
          ty, h: innerHeight, giros, animMono
        };
      });
      if (!m) break;
      muestras.push({ t: Date.now() - t0, ...m });
      if (conCapturas && capt < instantes.length && Date.now() - t0 >= instantes[capt]) { await page.screenshot({ path: foto('00' + 'abcdef'[capt] + '-cortina.png') }); capt++; }
      await page.waitForTimeout(30);
    }
    const al = muestras.find(m => m.t < 300);
    const fondoHero = await page.evaluate(() => getComputedStyle(document.getElementById('inicio')).backgroundColor);
    comprobar(al && al.display === 'block' && /21, 20, 18/.test(al.panel) && al.panel !== fondoHero, 'checklist 5 · cortina: tapa al cargar, en tinta (' + (al && al.panel) + '), distinta del hero marfil (' + fondoHero + ')');
    const izqAntes = muestras.find(m => m.izq < 99 && m.izq < m.der - 1);      /* la izquierda va por delante */
    const creciendo = muestras.find(m => m.izq > 5 && m.izq < 95);
    comprobar(!!izqAntes && !!creciendo, 'cortina 1 · las ramas crecen por recorte desde el tallo (inset de arriba ' + (creciendo ? creciendo.izq.toFixed(0) + '%' : '—') + '), la izquierda primero');
    const n = muestras[0] ? muestras[0].hojas.length : 0;
    const primeraDorada = muestras.findIndex(m => m.hojas[0] > 0.95), ultimaDorada = muestras.findIndex(m => m.hojas[n - 1] > 0.95);
    const aMedias = muestras.find(m => m.hojas[0] > 0.95 && m.hojas[n - 1] < 0.05);
    comprobar(n === 12 && primeraDorada >= 0 && ultimaDorada > primeraDorada && !!aMedias, 'cortina 2 · las 12 hojas de cada rama se doran una a una, de abajo arriba (copia dorada, solo opacidad)');
    const cayendo = muestras.find(m => m.mono > 5 && m.mono < 95);
    comprobar(!!cayendo, 'cortina 3 · el monograma cae por recorte de arriba abajo (inset de abajo ' + (cayendo ? cayendo.mono.toFixed(0) + '%' : '—') + ')');
    const medias = muestras.find(m => m.display === 'block' && m.ty < -m.h * 0.08 && m.ty > -m.h * 0.92);
    comprobar(!!medias, 'cortina 4 · fotograma a medias: el panel subiendo (y = ' + (medias ? Math.round(medias.ty) : '—') + ' px)');
    const cruce = muestras.find(m => m.tinta > 0.1 && m.tinta < 0.9);
    comprobar(!!cruce && cruce.ty < -m0(muestras).h * 0.3, 'cortina 4 · la corona pasa de oro a tinta con un fundido entre dos copias, cuando el panel ya la destapa (y = ' + (cruce ? Math.round(cruce.ty) : '—') + ')');
    function m0(a) { return a[0] || { h: 900 }; }
    const quieta = muestras.every(m => m.giros.every(g => g === 'none') && m.animMono === 0);
    comprobar(quieta, 'balanza: el monograma no gira nunca (transform none y ninguna animación en ' + muestras.length + ' fotogramas, cortina y hero)');
    await esperarCortina(page);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display) === 'none', 'cortina: acaba en display:none (pasada normal)');
    const traspaso = await page.evaluate(() => {
      const d = window.Aurea.cortinaDestino(), r = document.getElementById('hero-corona').getBoundingClientRect();
      return { d, hero: { left: r.left, top: r.top, width: r.width, height: r.height }, y: scrollY };
    });
    const igual = traspaso.d && ['left', 'top', 'width', 'height'].every(k => Math.abs(traspaso.d[k] - traspaso.hero[k]) <= 1);
    comprobar(igual, 'cortina: su corona estaba EXACTAMENTE donde está la del hero (traspaso) → ' + JSON.stringify(traspaso.hero).replace(/(\.\d)\d+/g, '$1'));
    comprobar(await page.evaluate(() => document.documentElement.classList.contains('con-movimiento')), 'checklist 7 · con-movimiento activo con GSAP y sin movimiento reducido');
    await page.waitForTimeout(1600);
    const heroVisto = await page.evaluate(() => ({ letras: [...document.querySelectorAll('#hero-nombre .letra')].every(l => getComputedStyle(l).transform === 'none' || /, 0\)$/.test(getComputedStyle(l).transform)), abog: +getComputedStyle(document.getElementById('hero-abogada')).opacity }));
    comprobar(heroVisto.letras && heroVisto.abog > 0.95, 'hero: el nombre entra con char-reveal y «ABOGADA» cierra su espaciado');
    comprobar(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, 'sin desbordamiento horizontal en escritorio');
    if (conCapturas) await page.screenshot({ path: foto('01-hero-1440.png') });

    /* cursor */
    await page.mouse.move(700, 300); await page.mouse.move(720, 330, { steps: 4 }); await page.waitForTimeout(400);
    const cur = await page.evaluate(() => ({ sistema: getComputedStyle(document.body).cursor, aro: getComputedStyle(document.querySelector('.cursor')).opacity, punto: getComputedStyle(document.querySelector('.cursor-punto')).opacity }));
    comprobar(cur.sistema === 'none' && cur.aro === '1' && cur.punto === '1', 'checklist 1 · cursor: aro + punto visibles y el del sistema oculto → ' + JSON.stringify(cur));
    const bb = await page.locator('.hero__acciones .boton').first().boundingBox();
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 6 }); await page.waitForTimeout(700);
    const sobre = await page.evaluate(() => { const e = getComputedStyle(document.querySelector('.cursor')); return { fondo: e.backgroundColor, ancho: e.width, sistema: getComputedStyle(document.querySelector('.hero__acciones .boton')).cursor }; });
    const alfa = parseFloat((sobre.fondo.match(/rgba\([^)]*,\s*([\d.]+)\)/) || [])[1] || 0);
    comprobar(alfa >= 0.35 && sobre.ancho === '64px' && sobre.sistema === 'none', 'checklist 1 · cursor: sobre un botón el aro crece y se rellena de oro (alfa ' + alfa + ' ≥ .35)');
    const iman = await page.evaluate(() => getComputedStyle(document.querySelector('.hero__acciones .boton')).transform);
    comprobar(iman !== 'none', 'botón magnético: «Llamar» persigue el cursor (' + iman + ')');
    await page.mouse.move(1435, 450, { steps: 3 });

    /* áreas */
    await hasta(page, '#areas');
    if (conCapturas) await page.screenshot({ path: foto('02-areas.png') });
    const alturas = await page.evaluate(() => [...document.querySelectorAll('.pila__item .area')].map(t => ({ alto: t.offsetHeight, cabe: t.scrollHeight <= t.clientHeight + 1 })));
    comprobar(alturas.length === 5 && new Set(alturas.map(a => a.alto)).size === 1 && alturas.every(a => a.cabe), 'checklist 2 · pila: las cinco tarjetas miden lo mismo (medido por JS) y su contenido cabe → ' + alturas.map(a => a.alto).join('/'));
    await hasta(page, '#area-penal', 160); await rueda(page, 2, 200);
    const indice = await page.evaluate(() => ({ activa: [...document.querySelectorAll('#areas-indice a')].findIndex(a => a.classList.contains('es-activa')), posada: [...document.querySelectorAll('.area')].findIndex(a => a.classList.contains('es-posada')), oro: getComputedStyle(document.querySelector('.area.es-posada .area__hoja') || document.body).fill, visibles: [...document.querySelectorAll('#areas-indice a')].filter(a => a.offsetWidth > 0).length }));
    comprobar(indice.activa >= 1 && indice.activa === indice.posada && /156, 122, 60/.test(indice.oro) && indice.visibles === 5,
      'áreas: al posarse una tarjeta su hoja se dora y el índice de 5 hojas la marca (n.º ' + indice.activa + ', ' + indice.oro + ') sin esconder las demás');
    if (conCapturas) await page.screenshot({ path: foto('02b-pila-media.png') });
    const vg = await page.evaluate(() => document.getElementById('area-violencia').innerText);
    comprobar(/016/.test(vg) && /112/.test(vg) && /no deja rastro en la factura/.test(vg), 'violencia de género: línea fija con el 016 y el 112');

    /* marquee */
    await hasta(page, '#cinta', 300);
    const c1 = await page.evaluate(() => document.getElementById('cinta-pista').style.transform);
    await page.waitForTimeout(500);
    const c2 = await page.evaluate(() => ({ t: document.getElementById('cinta-pista').style.transform, hojas: document.querySelectorAll('#cinta-pista use[href="#hoja"]').length, fondo: getComputedStyle(document.getElementById('cinta')).backgroundColor, oro: getComputedStyle(document.querySelector('#cinta-pista svg')).fill }));
    comprobar(c1 !== c2.t && c2.hojas >= 14 && /21, 20, 18/.test(c2.fondo) && /156, 122, 60/.test(c2.oro), 'marquee sobre tinta, en marcha, con la hoja dorada de separador (' + c2.hojas + ')');
    if (conCapturas) await page.screenshot({ path: foto('04-marquee.png') });

    /* opiniones */
    await hasta(page, '#opiniones');
    await page.waitForTimeout(1900);
    const op = await page.evaluate(() => {
      const pistas = [...document.querySelectorAll('.opiniones__pista')];
      return {
        n: document.getElementById('opiniones-n').textContent, cifra: document.querySelector('.opiniones__cifra').textContent,
        anim: pistas.map(p => getComputedStyle(p).animationName + '/' + getComputedStyle(p).animationDirection),
        unicas: document.querySelectorAll('.opiniones__pista > li:not(.es-copia)').length,
        boton: document.querySelector('#opiniones a.boton').href,
        repiten: document.querySelector('.opiniones__repiten').textContent
      };
    });
    comprobar(op.n === '183' && op.cifra === '5,0' && /cercana, clara, rápida/.test(op.repiten), 'opiniones: «5,0» y «183 opiniones en Google» (contado al entrar) y lo que más repiten');
    comprobar(op.anim[0] === 'opiniones-sube/normal' && op.anim[1] === 'opiniones-sube/reverse' && op.unicas === 12, 'opiniones: dos columnas en bucle vertical en sentidos opuestos, 12 citas → ' + op.anim.join(' · '));
    const cb = await page.locator('#opiniones-columnas').boundingBox();
    await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2, { steps: 4 }); await page.waitForTimeout(300);
    const pausa = await page.evaluate(() => getComputedStyle(document.querySelector('.opiniones__pista')).animationPlayState);
    await page.mouse.move(5, 450); await page.focus('#opiniones-columnas'); await page.waitForTimeout(200);
    const pausaFoco = await page.evaluate(() => getComputedStyle(document.querySelector('.opiniones__pista')).animationPlayState);
    comprobar(pausa === 'paused' && pausaFoco === 'paused', 'opiniones: se pausan con hover y con foco');
    comprobar(op.boton === 'https://maps.google.com/?cid=18416980175827621575', 'opiniones: «Ver todas en Google» abre su ficha (cid 18416980175827621575)');
    if (conCapturas) { await hasta(page, '#opiniones'); await page.screenshot({ path: foto('05-opiniones.png') }); }

    /* casos apagado */
    const casos = await page.evaluate(() => ({ oculto: document.getElementById('casos').hidden, alto: document.getElementById('casos').offsetHeight, vacio: document.getElementById('casos').children.length === 0, menu: getComputedStyle(document.querySelector('#menu a[data-modulo="casos"]')).display }));
    comprobar(casos.oculto && casos.alto === 0 && casos.vacio && casos.menu === 'none', 'casos con "permiso": false: no se pinta, no deja hueco y no sale en el menú');

    /* despachos con teclado */
    await hasta(page, '#despachos');
    const altoPaneles = await page.evaluate(() => document.querySelector('.despachos__paneles').offsetHeight);
    await page.focus('#pestana-valverde');
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(450);
    const t1 = await page.evaluate(() => ({ foco: document.activeElement.id, sel: document.getElementById('pestana-badajoz').getAttribute('aria-selected'), panel: !document.getElementById('panel-badajoz').hidden && document.getElementById('panel-valverde').hidden, alto: document.querySelector('.despachos__paneles').offsetHeight, vis: getComputedStyle(document.getElementById('panel-valverde')).visibility }));
    await page.keyboard.press('Home'); await page.waitForTimeout(100);
    const t2 = await page.evaluate(() => document.activeElement.id);
    await page.keyboard.press('End'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100);
    const t3 = await page.evaluate(() => document.activeElement.id);
    comprobar(t1.foco === 'pestana-badajoz' && t1.sel === 'true' && t1.panel && t1.vis === 'hidden' && t2 === 'pestana-valverde' && t3 === 'pestana-valverde',
      'despachos: pestañas ARIA con flechas, Inicio y Fin (el foco y el panel cambian, y vuelve al principio)');
    comprobar(t1.alto === altoPaneles, 'despachos: al cambiar de despacho no salta el alto (' + altoPaneles + ' px)');
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(400);
    if (conCapturas) await page.screenshot({ path: foto('06-despachos.png') });
    const ifAntes = await page.$$eval('iframe', n => n.length);
    await page.click('.map-consent'); await page.waitForTimeout(500);
    const src = await page.$$eval('iframe', n => n.map(i => i.src));
    await page.click('#pestana-valverde'); await page.waitForTimeout(200);
    comprobar(ifAntes === 0 && src.length === 1 && /google\.com\/maps\?q=/.test(src[0]) && /output=embed/.test(src[0]), 'mapa: el iframe no existe hasta el clic en .map-consent (maps?q=…&output=embed)');
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('direcciones-planas')).display) === 'none', 'escríbeme: con el módulo de despachos, las direcciones en texto no se repiten');

    /* formulario */
    await hasta(page, '#area-familia', 160);
    await page.click('#area-familia [data-consultar]');
    await page.waitForTimeout(1800);
    comprobar(await page.evaluate(() => document.getElementById('f-area').value) === 'Derecho de Familia', 'CTA «Consultar sobre Derecho de Familia» llega al formulario con el área elegida');
    await page.click('#formulario button[type="submit"]');
    comprobar(/nombre/.test(await page.textContent('#formulario-error')), 'formulario: sin datos, avisa de lo que falta');
    await page.fill('#f-nombre', 'Lucía');
    await page.fill('#f-telefono', '600 11 22 33');
    await page.check('input[name="despacho"][value="videollamada"]');
    await page.fill('#f-mensaje', 'Quiero revisar la pensión de alimentos.');
    await page.check('#f-privacidad');
    await page.click('#formulario button[type="submit"]');
    await page.waitForTimeout(300);
    const env = await page.evaluate(() => ({ wa: document.getElementById('enviar-whatsapp').href, em: document.getElementById('enviar-email').href, tel: document.getElementById('enviar-llamar').href, visto: !document.getElementById('listo').hidden }));
    const waTxt = decodeURIComponent(env.wa.split('?text=')[1] || '');
    const emAsunto = decodeURIComponent((env.em.match(/subject=([^&]*)/) || [])[1] || ''), emCuerpo = (env.em.match(/body=(.*)$/) || [])[1] || '';
    comprobar(env.visto && env.wa.startsWith('https://wa.me/34657656956?text=') && waTxt.startsWith('Hola, Áurea. Soy Lucía. Te escribo por un tema de Derecho de Familia. Preferiría la cita por videollamada.') && /Mi teléfono: 600 11 22 33/.test(waTxt),
      'formulario → WhatsApp: wa.me con el texto codificado → «' + waTxt.split('\n')[0] + '»');
    comprobar(env.em.startsWith('mailto:4201@icaba.com?subject=') && emAsunto === 'Consulta · Derecho de Familia · Lucía' && /%0D%0A/.test(emCuerpo) && decodeURIComponent(emCuerpo).includes('pensión de alimentos'),
      'formulario → email: mailto con asunto y cuerpo (saltos CRLF codificados)');
    comprobar(env.tel === 'tel:+34657656956', 'formulario → «Llamar»: tel:+34657656956');
    if (conCapturas) { await hasta(page, '#escribeme'); await page.screenshot({ path: foto('07-escribeme.png') }); }

    /* notas y pie */
    await hasta(page, '#notas');
    const notasHome = await page.$$eval('.notas__lista a', a => a.map(x => x.getAttribute('href')));
    comprobar(notasHome.length === 3 && notasHome.every(h => /^blog\/(violencia|delito|actualizacion)/.test(h)), 'notas: en la portada, las 3 más recientes (las de cláusula suelo, no)');
    if (conCapturas) await page.screenshot({ path: foto('08-notas.png') });
    await rueda(page, 6, 700);
    if (conCapturas) await page.screenshot({ path: foto('09-pie.png') });
    const pie = await page.evaluate(() => {
      const c = document.getElementById('pie-corona'), r = c.getBoundingClientRect();
      return { visible: c.classList.contains('es-visible'), clip: getComputedStyle(c.querySelector('.pie__rama')).clipPath, abajo: Math.round(innerHeight - r.bottom), logo: document.querySelector('.pie__logo').naturalWidth > 0, redes: [...document.querySelectorAll('.pie__redes a')].map(a => a.hostname.replace('www.', '')).join(' '), legales: [...document.querySelectorAll('.pie__legal a')].map(a => a.getAttribute('href')).join(' ') };
    });
    comprobar(pie.visible && /inset\(0/.test(pie.clip) && pie.abajo < 60 && pie.logo, 'pie: logo vectorizado sobre tinta y la corona, en pequeño, cierra la página (crece al llegar)');
    comprobar(pie.redes === 'instagram.com tiktok.com facebook.com linkedin.com' && /aviso-legal/.test(pie.legales) && /privacidad/.test(pie.legales) && /#cookies/.test(pie.legales), 'pie: las cuatro redes, legal, privacidad y cookies');

    /* cookies */
    const ck = await page.evaluate(() => { const c = document.getElementById('cookies'); return { oculto: c.hidden, display: getComputedStyle(c).display }; });
    comprobar(!ck.oculto && ck.display === 'flex', 'checklist 4 · cookies: el aviso se ve al entrar');
    await page.click('#cookies-aceptar'); await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display) === 'none', 'checklist 4 · cookies: el botón lo cierra de verdad');
    const mandoSin = await page.evaluate(() => { const m = document.getElementById('mando'); return { oculto: m.hidden, display: getComputedStyle(m).display }; });
    comprobar(mandoSin.oculto && mandoSin.display === 'none', 'sin ?revision no hay mando → ' + JSON.stringify(mandoSin));
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => document.getElementById('cookies').hidden), 'checklist 4 · cookies: tras aceptar, al recargar ya no sale');
    /* orden de secciones */
    const orden = await page.evaluate(() => [...document.querySelectorAll('main > section[id]')].map(s => s.id));
    comprobar(JSON.stringify(orden.filter(id => id !== 'ficha')) === JSON.stringify(ORDEN), 'orden de secciones: ' + orden.join(' → '));
    comprobar(errores.length === 0, 'consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    const cr = propias(caidas);
    comprobar(cr.length === 0, 'sin peticiones caídas' + (cr.length ? ' → ' + cr.join(' | ') : ''));
    /* contraste */
    await esperarCortina(page);
    const pares = [
      ['texto/marfil', '.hero__nombre', 7], ['secundario/marfil', '.hero__linea', 4.5], ['antetítulo oro/marfil', '.areas .antetitulo', 4.5],
      ['frase suya oro/tostado', '.area__suya', 4.5], ['fecha oro/marfil (nota)', '.nota time', 4.5], ['recuento oro/tinta', '.opiniones__total', 4.5],
      ['cita/tinta', '.cita blockquote', 7], ['firma/tinta', '.cita figcaption', 4.5], ['pie secundario/tinta', '.pie__legal p', 4.5], ['título pie oro/tinta', '.pie__titulo', 4.5],
      ['dato/marfil (despachos)', '.despachos__donde', 4.5], ['entrada/marfil', '.sobre .entrada', 4.5]
    ];
    const medidas = [];
    for (const [nombre, sel, min] of pares) { const v = await page.evaluate(`(${CONTRASTE})(${JSON.stringify(sel)})`); medidas.push(nombre + ' ' + v); comprobar(v >= min, 'contraste ' + nombre + ': ' + v + ':1 (≥ ' + min + ')'); }
    await contexto.close();
  }

  /* ───── 1b. la pila, en una página limpia y bajando desde arriba ───── */
  for (const vp of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp, cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page); await page.waitForTimeout(1000);
    await page.mouse.move(vp.width - 5, vp.height / 2);
    const n = vp.width + '×' + vp.height;
    if (await page.evaluate(() => document.documentElement.classList.contains('es-pila-suelta'))) { comprobar(true, 'pila ' + n + ': no cabe anclada y se desapila (medido)'); await contexto.close(); continue; }
    await hasta(page, '#areas', 200);
    const tope = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.pila__item')).top));
    let ultimo = null, sueltaAntes = null, asoma = null, separan = null, posada = false;
    for (let i = 0; i < 130; i++) {
      await page.mouse.wheel(0, 90); await page.waitForTimeout(150);
      const m = await page.evaluate(() => [...document.querySelectorAll('.pila__item')].map(li => { const r = li.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }));
      ultimo = m;
      const u = m[m.length - 1], ant = m.slice(0, -1);
      if (!posada && u[0] > tope + 2 && u[0] < vp.height && ant.some(a => a[0] < tope - 2)) sueltaAntes = sueltaAntes || { paso: i, m };
      if (Math.abs(u[0] - tope) <= 2) { posada = true; if (ant.some(a => a[1] > u[1] + 1)) asoma = asoma || { paso: i, m }; }
      if (posada && ant.some(a => Math.abs(a[0] - u[0]) > 2)) separan = separan || { paso: i, m };
      if (posada && u[1] < 0) break;
    }
    const sin = posada ? '' : ' (la última no llegó a posarse: ' + JSON.stringify(ultimo) + ')';
    comprobar(posada && !sueltaAntes, 'checklist 2 · pila ' + n + ': ninguna tarjeta se suelta antes de que se pose la última' + (sueltaAntes ? ' → ' + JSON.stringify(sueltaAntes) : '') + sin);
    comprobar(posada && !asoma, 'checklist 2 · pila ' + n + ': la última tapa entera a la anterior' + (asoma ? ' → ' + JSON.stringify(asoma) : '') + sin);
    comprobar(posada && !separan, 'checklist 2 · pila ' + n + ': al acabarse, las cinco salen juntas' + (separan ? ' → ' + JSON.stringify(separan) : '') + sin);
    const hueco = await page.evaluate(() => { const ult = [...document.querySelectorAll('.pila__item')].pop().getBoundingClientRect().bottom; const sig = document.getElementById('como-trabajo').getBoundingClientRect().top; return Math.round(sig - ult); });
    comprobar(hueco < 220, 'checklist 2 · pila ' + n + ': la sección siguiente sube a tapar el hueco del margen de la última (' + hueco + ' px de aire)');
    await contexto.close();
  }

  /* ───── 1c. mejoras: corona viva, retrato, servicios, estrellas, hoja de las notas, paso entre páginas ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { cookiesVistas: true });
    await contexto.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { window.__paso = document.documentElement.classList.contains('con-paso'); }); });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page); await page.waitForTimeout(1800);
    const retAntes = await page.evaluate(() => getComputedStyle(document.getElementById('sobre-retrato')).clipPath);
    const ind = await page.evaluate(() => ({ anim: getComputedStyle(document.querySelector('.hero__bajar-hilo svg')).animationName, ancho: document.querySelector('.hero__bajar-hilo svg').getBoundingClientRect().width, op: getComputedStyle(document.getElementById('hero-bajar')).opacity, datos: [...document.querySelectorAll('.hero__dato')].map(d => d.textContent.replace(/\s+/g, ' ').trim()), luz: getComputedStyle(document.getElementById('inicio')).backgroundImage.includes('radial-gradient'), grano: getComputedStyle(document.getElementById('inicio'), '::before').backgroundImage.includes('svg') }));
    comprobar(ind.anim === 'hoja-cae' && ind.ancho >= 20 && ind.op === '1' && /5,0.*183 opiniones en Google/.test(ind.datos[0]) && /cita previa/.test(ind.datos[1]) && ind.luz && ind.grano, 'hero premium: indicador de scroll (la hoja cae por su hilo), franja con 5,0★ · 183 opiniones y cita previa, luz de oro y grano de papel → ' + JSON.stringify(ind));
    /* corona viva: el cursor cerca de la rama izquierda dora sus hojas */
    const cc = await page.locator('#hero-corona').boundingBox();
    await page.mouse.move(cc.x + cc.width * 0.12, cc.y + cc.height * 0.45, { steps: 8 });
    await page.waitForTimeout(800);
    const viva = await page.evaluate(() => ({ max: Math.max(...[...document.querySelectorAll('.hero__hoja')].map(h => +getComputedStyle(h).opacity)), n: document.querySelectorAll('.hero__hoja').length, mono: document.querySelector('.hero__mono').getAttribute('transform'), monoCss: getComputedStyle(document.querySelector('.hero__mono')).transform }));
    comprobar(viva.n === 24 && viva.max > 0.5 && !viva.mono && viva.monoCss === 'none', 'corona viva: con el cursor cerca, las hojas del hero se doran (máx. ' + viva.max.toFixed(2) + ' de 24), el monograma intacto');
    await page.mouse.move(1435, 500, { steps: 6 }); await page.waitForTimeout(900);
    const apagada = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.hero__hoja')].map(h => +getComputedStyle(h).opacity)));
    comprobar(apagada < 0.05, 'corona viva: al salir el cursor, el oro se apaga');
    await rueda(page, 2, 250);
    const recoge = await page.evaluate(() => ({ izq: document.getElementById('hero-rama-izq').getAttribute('transform') || '', der: document.getElementById('hero-rama-der').getAttribute('transform') || '', mono: document.querySelector('.hero__mono').getAttribute('transform'), y: scrollY }));
    const ang = t => { const m = t.match(/matrix\(([-\d.e]+)[ ,]+([-\d.e]+)/); return m ? Math.atan2(+m[2], +m[1]) * 180 / Math.PI : 0; };
    comprobar(+(await page.evaluate(() => getComputedStyle(document.getElementById('hero-bajar')).opacity)) < 0.5, 'hero: el indicador de scroll se apaga al empezar a bajar');
    comprobar(ang(recoge.izq) > 0.5 && ang(recoge.der) < -0.5 && !recoge.mono, 'corona viva: al bajar, las ramas se recogen (' + ang(recoge.izq).toFixed(1) + '° / ' + ang(recoge.der).toFixed(1) + '°) y la balanza no se mueve');
    /* servicios */
    const antesServ = await page.evaluate(() => document.querySelector('.servicios').classList.contains('es-visible'));
    await hasta(page, '#como-trabajo', 200); await rueda(page, 2, 300); await page.waitForTimeout(1200);
    const serv = await page.evaluate(() => ({ vis: document.querySelector('.servicios').classList.contains('es-visible'), filete: getComputedStyle(document.querySelector('.servicio:last-child'), '::before').transform, texto: getComputedStyle(document.querySelector('.servicio:last-child h3')).opacity }));
    comprobar(!antesServ && serv.vis && /matrix\(1, 0, 0, 1/.test(serv.filete) && serv.texto === '1', 'servicios: entran escalonados al llegar y su filete dorado se tiende');
    /* retrato */
    await hasta(page, '#sobre-mi'); await page.waitForTimeout(1900);
    const ret = await page.evaluate(() => ({ clip: getComputedStyle(document.getElementById('sobre-retrato')).clipPath, img: getComputedStyle(document.querySelector('#sobre-retrato img')).transform }));
    comprobar(/inset\(100%/.test(retAntes) && /inset\(0/.test(ret.clip) && ret.img !== 'none', 'retrato: se abre de abajo arriba dentro de su arco al llegar, con paralaje dentro (' + ret.img.slice(0, 32) + '…)');
    if (conCapturas) await page.screenshot({ path: foto('03-sobre-mi.png') });
    /* estrellas */
    await hasta(page, '#opiniones'); await page.waitForTimeout(1600);
    const est = await page.evaluate(() => { const c = document.querySelector('.cita.es-vista'); return { vistas: document.querySelectorAll('.cita.es-vista').length, color: c ? getComputedStyle(c.querySelector('.estrella:last-child')).color : '' }; });
    comprobar(est.vistas >= 2 && !/0\.2\)/.test(est.color), 'opiniones: las estrellas se doran una a una al entrar cada cita (' + est.vistas + ' citas vistas)');
    /* hoja de las notas */
    await hasta(page, '#notas');
    const nb = await page.locator('.notas__lista .nota').first().boundingBox();
    await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2, { steps: 5 }); await page.waitForTimeout(700);
    comprobar(/156, 122, 60/.test(await page.evaluate(() => getComputedStyle(document.querySelector('.notas__lista .nota__hoja')).fill)), 'notas: su hoja se dora al pasar el ratón');
    /* paso: portada → nota del blog */
    await page.click('.notas__lista .nota h3 a');
    await page.waitForTimeout(320);
    const cubre = await page.evaluate(() => { const p = document.querySelector('.paso'); return p ? { clase: p.classList.contains('es-cubre'), ty: getComputedStyle(p).transform } : null; }).catch(() => null);
    await page.waitForURL(/\/blog\/violencia-de-genero-info\/$/, { timeout: 5000 }).catch(() => {});
    const llegada = await page.evaluate(() => window.__paso);
    await page.waitForTimeout(1400);
    const destapada = await page.evaluate(() => !document.documentElement.classList.contains('con-paso'));
    comprobar(cubre && cubre.clase && /blog\/violencia-de-genero-info\/$/.test(page.url()) && llegada === true && destapada,
      'paso entre páginas: al ir a una nota, un panel tinta con la hoja tapa la portada (a medias: ' + (cubre ? cubre.ty : '—') + '), la nota nace tapada y se destapa');
    if (conCapturas) await page.screenshot({ path: foto('16-nota-blog.png') });
    /* paso: nota → portada#areas, sin repetir la cortina larga */
    await page.click('.cabecera__nav a[href$="index.html#areas"]').catch(async () => { await page.goto(base + '/index.html#areas'); });
    await page.waitForURL(/index\.html#areas$/, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    const vuelta = await page.evaluate(() => ({ paso: window.__paso, cortina: getComputedStyle(document.getElementById('cortina')).display, y: scrollY }));
    await page.waitForTimeout(1200);
    comprobar(vuelta.paso === true && vuelta.cortina === 'none' && vuelta.y > 300, 'paso de vuelta a la portada: sin la cortina larga y en su ancla (#areas, y = ' + Math.round(vuelta.y) + ')');
    comprobar(errores.length === 0, 'mejoras: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
    /* con movimiento reducido, no hay paso: el enlace navega sin más */
    const rm = await nuevaPagina(navegador, { cookiesVistas: true, reducedMotion: 'reduce' });
    await rm.page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await rm.page.click('.notas__lista .nota h3 a');
    await rm.page.waitForURL(/\/blog\//, { timeout: 4000 }).catch(() => {});
    comprobar(/\/blog\//.test(rm.page.url()) && await rm.page.evaluate(() => !document.documentElement.classList.contains('con-paso')), 'movimiento reducido: los enlaces navegan sin paso ni capa');
    await rm.contexto.close();
  }

  /* ───── 2. las dos densidades (?revision) ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    const conAviso = await page.evaluate(() => { const m = document.getElementById('mando'); return { oculto: m.hidden, vis: getComputedStyle(m).visibility }; });
    await page.click('#cookies-aceptar'); await page.waitForTimeout(500);
    const sinAviso = await page.evaluate(() => getComputedStyle(document.getElementById('mando')).visibility);
    comprobar(!conAviso.oculto && conAviso.vis === 'hidden' && sinAviso === 'visible', 'mando (?revision): se aparta con el aviso de cookies y aparece al cerrarlo');
    const botones = await page.$$eval('#mando [data-densidad]', b => b.map(x => x.textContent));
    comprobar(botones.join('|') === 'Laurel|Sobria', 'mando: «Laurel» (el concepto) y «Sobria»');
    if (conCapturas) await page.screenshot({ path: foto('10-laurel.png') });
    await page.click('[data-densidad="sobria"]'); await page.waitForTimeout(900);
    const s = await page.evaluate(() => ({
      clase: document.documentElement.classList.contains('densidad-sobria'),
      ficha: getComputedStyle(document.getElementById('ficha')).display, filas: document.querySelectorAll('#ficha tr').length,
      botones: [...document.querySelectorAll('.area__alternar')].map(b => b.getAttribute('aria-expanded')),
      pila: getComputedStyle(document.querySelector('.pila__item')).position, cuerposOcultos: [...document.querySelectorAll('.area__cuerpo')].filter(c => c.hidden).length,
      cinta: getComputedStyle(document.getElementById('cinta')).display, citas: [...document.querySelectorAll('.opiniones__pista > li')].filter(l => l.offsetWidth > 0).length,
      pie: getComputedStyle(document.getElementById('pie-corona')).display, hojaSep: getComputedStyle(document.querySelector('.separa svg')).display,
      vineta: getComputedStyle(document.querySelector('.lista-hojas li'), '::before').maskImage, desborda: document.documentElement.scrollWidth - innerWidth
    }));
    comprobar(s.clase && s.ficha === 'block' && s.filas === 9, 'sobria: añade la «Ficha rápida» (9 filas) que la cargada no tiene');
    comprobar(s.botones.length === 5 && s.botones[0] === 'true' && s.pila === 'static' && s.cuerposOcultos === 4, 'sobria: las áreas en acordeón (5 botones aria-expanded) en vez de pila');
    comprobar(s.cinta === 'none' && s.citas === 3 && s.pie === 'none' && s.hojaSep === 'none' && s.vineta === 'none', 'sobria: sin marquee, opiniones con 3 citas fijas, sin corona en el pie, separadores de línea y viñetas de guion');
    comprobar(s.desborda <= 1, 'sobria: sin desbordamiento horizontal nuevo');
    await page.click('.area__alternar >> nth=2'); await page.waitForTimeout(200);
    comprobar(await page.evaluate(() => !document.querySelectorAll('.area__cuerpo')[2].hidden), 'sobria: el acordeón abre y cierra');
    if (conCapturas) { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500); await page.screenshot({ path: foto('11-sobria.png') }); await hasta(page, '#areas'); await page.screenshot({ path: foto('11b-sobria-areas.png') }); await hasta(page, '#ficha'); await page.screenshot({ path: foto('11c-sobria-ficha.png') }); }
    /* al recargar en sobria: la cortina, sin corona */
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(500);
    const cs = await page.evaluate(() => ({ clase: document.documentElement.classList.contains('densidad-sobria'), corona: getComputedStyle(document.getElementById('cortina-corona')).display, nombre: getComputedStyle(document.getElementById('cortina-nombre')).display, heroCorona: getComputedStyle(document.getElementById('hero-corona')).display }));
    comprobar(cs.clase && cs.corona === 'none' && cs.nombre === 'grid' && cs.heroCorona === 'block', 'sobria: la corona solo en el hero (la cortina enseña el nombre), aplicada sin parpadeo desde el <head>');
    await esperarCortina(page);
    await page.click('[data-densidad="laurel"]'); await page.waitForTimeout(900);
    const vuelta = await page.evaluate(() => ({ laurel: document.documentElement.classList.contains('densidad-laurel'), alt: document.querySelectorAll('.area__alternar').length, pila: getComputedStyle(document.querySelector('.pila__item')).position, cinta: getComputedStyle(document.getElementById('cinta')).display }));
    comprobar(vuelta.laurel && vuelta.alt === 0 && (vuelta.pila === 'sticky' || await page.evaluate(() => document.documentElement.classList.contains('es-pila-suelta'))) && vuelta.cinta !== 'none', 'mando: se puede volver a «Laurel» (vuelve la pila y el marquee)');
    comprobar(errores.length === 0, 'densidades: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await page.evaluate(() => localStorage.removeItem('aurea-densidad'));
    await contexto.close();
    /* sin ?revision, una densidad guardada no se aplica */
    const x = await nuevaPagina(navegador, { cookiesVistas: true });
    await x.contexto.addInitScript(() => { try { localStorage.setItem('aurea-densidad', 'sobria'); } catch (e) {} });
    await x.page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    comprobar(await x.page.evaluate(() => !document.documentElement.classList.contains('densidad-sobria') && document.getElementById('mando').hidden), 'sin ?revision: ni mando ni la densidad guardada (el enlace de la clienta sale limpio)');
    await x.contexto.close();
  }

  /* ───── 3. móvil: menú con la cabecera fija, sin cursor ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 }, tactil: true, cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page); await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => !document.querySelector('.cursor')), 'checklist 1 · móvil táctil: no hay cursor propio');
    await page.evaluate(() => window.scrollTo(0, 1600)); await page.waitForTimeout(700);
    const cerrado = await page.evaluate(() => { const n = document.getElementById('menu'), r = n.getBoundingClientRect(); return { fija: document.getElementById('cabecera').classList.contains('cabecera--fija'), filtro: getComputedStyle(document.getElementById('cabecera')).backdropFilter, bottom: Math.round(r.bottom), alto: Math.round(r.height) }; });
    comprobar(cerrado.fija && /blur/.test(cerrado.filtro) && cerrado.bottom <= 1 && cerrado.alto >= 844, 'checklist 3 · móvil: con la cabecera fija (blur), el menú cerrado queda fuera y mide la pantalla → ' + JSON.stringify(cerrado));
    await page.click('#hamburguesa'); await page.waitForTimeout(900);
    const abierto = await page.evaluate(() => { const r = document.getElementById('menu').getBoundingClientRect(); return { top: Math.round(r.top), alto: Math.round(r.height), exp: document.getElementById('hamburguesa').getAttribute('aria-expanded') }; });
    comprobar(abierto.top === 0 && abierto.alto >= 844 && abierto.exp === 'true', 'checklist 3 · móvil: el menú abierto ocupa toda la pantalla (aria-expanded) → ' + JSON.stringify(abierto));
    if (conCapturas) await page.screenshot({ path: foto('12-menu-movil.png') });
    await page.click('#hamburguesa'); await page.waitForTimeout(500);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'false', 'móvil: el botón también cierra el menú');
    await contexto.close();
  }

  /* ───── 4. hero en cinco pantallas + capturas ───── */
  for (const [w, h] of VIEWPORTS) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: { width: w, height: h }, cookiesVistas: true, tactil: w < 1000 });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page); await page.waitForTimeout(2600);
    const r = await page.evaluate(() => {
      const caja = s => { const b = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right) }; };
      const piezas = ['#hero-corona', '#hero-nombre', '#hero-abogada', '.hero__linea', '.hero__acciones', '#hero-bajar'].map(caja);
      const pisan = piezas.slice(1).some((p, i) => p.top < piezas[i].bottom - 1);
      const partidas = [...document.querySelectorAll('#hero-nombre .palabra')].filter(p => p.getClientRects().length > 1 || p.offsetHeight > parseFloat(getComputedStyle(p).lineHeight) * 1.5).length;
      const lineas = Math.round(document.getElementById('hero-nombre').offsetHeight / parseFloat(getComputedStyle(document.getElementById('hero-nombre')).lineHeight));
      return { cab: document.getElementById('cabecera').offsetHeight, piezas, pisan, partidas, lineas, ancho: document.documentElement.scrollWidth - innerWidth };
    });
    const ok = !r.pisan && r.partidas === 0 && r.piezas[0].top >= r.cab && r.piezas.every(p => p.left >= 0 && p.right <= w + 1) && r.ancho <= 1;
    comprobar(ok, 'checklist 6 · hero ' + w + '×' + h + ': corona, nombre (' + r.lineas + ' línea/s, ninguna palabra partida), ABOGADA, línea, CTAs e indicador de scroll no se pisan → ' + (ok ? 'bien' : JSON.stringify(r)));
    if (conCapturas) {
      await page.screenshot({ path: foto('hero-' + w + 'x' + h + '.png') });
      await page.addStyleTag({ content: '.con-movimiento .cursos li{opacity:1!important;transform:none!important}' });
      for (let i = 0; i < 70; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(40); }
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
      await page.screenshot({ path: foto('completa-' + w + 'x' + h + '.png'), fullPage: true });
    }
    await contexto.close();
  }

  /* ───── 5. textos vetados (texto visible de todas las páginas) ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true, sinGsap: true });
    const vetados = [/garantiz/i, /éxito asegurado/i, /primera consulta gratuita/i, /nuestro equipo/i, /nuestros abogados/i, /nuestros servicios/i, /ENVÍO GRATIS/i, /abierto ahora/i, /espíritu y no la forma/i, /recupera tu dinero/i, /ganamos/i];
    const encontrados = [];
    for (const p of paginasHtml.filter(p => !/^(D|sobre-mi|areas-legales|servicios|contacto|cookies)\//.test(p))) {
      await page.goto(base + '/' + p, { waitUntil: 'domcontentloaded' });
      const t = await page.evaluate(() => document.body.innerText + ' ' + document.title + ' ' + [...document.querySelectorAll('[aria-label],[alt],meta[name="description"]')].map(n => n.getAttribute('aria-label') || n.getAttribute('alt') || n.content).join(' '));
      for (const v of vetados) if (v.test(t)) encontrados.push(p + ': ' + v);
      if (/@/.test(await page.evaluate(() => [...document.querySelectorAll('.cita figcaption')].map(f => f.textContent).join(' ')))) encontrados.push(p + ': arroba en una firma');
    }
    comprobar(encontrados.length === 0, 'textos vetados: ni «garantiz», «éxito asegurado», «primera consulta gratuita», «nuestro equipo», «ENVÍO GRATIS», «abierto ahora» ni arroba en una firma' + (encontrados.length ? ' → ' + encontrados.join(' | ') : ''));
    /* blog: lo que se lee en cada página = su web, línea a línea */
    for (const e of ENTRADAS) {
      await page.goto(base + '/blog/' + e.slug + '/', { waitUntil: 'domcontentloaded' });
      const leido = await page.evaluate(() => ({ h1: document.querySelector('h1').textContent, lineas: [...document.querySelectorAll('.articulo__cuerpo > p, .articulo__cuerpo > h2, .articulo__cuerpo > blockquote, .articulo__cuerpo li')].map(n => n.textContent.trim()), fecha: document.querySelector('time').getAttribute('datetime') }));
      const c = corregida(e.slug);
      const esperado = c.lineas.map(comoSeLee);
      const dif = esperado.map((l, i) => l === leido.lineas[i] ? null : i).filter(i => i !== null);
      comprobar(leido.h1 === c.titulo && dif.length === 0 && leido.lineas.length === esperado.length && leido.fecha === e.fecha,
        'blog íntegro · ' + e.slug + ': ' + esperado.length + ' líneas idénticas a su web y fecha original ' + e.fecha + (dif.length ? ' → difieren ' + dif.join(',') : ''));
    }
    await page.goto(base + '/blog/', { waitUntil: 'domcontentloaded' });
    const ib = await page.evaluate(() => ({ vis: [...document.querySelectorAll('.indice-blog li')].filter(l => l.offsetHeight > 0).length, total: document.querySelectorAll('.indice-blog li').length }));
    comprobar(ib.total === 6 && ib.vis === 4, 'blog: migradas las 6; sin permiso, el índice enseña 4 (las de cláusula suelo solo desde Casos)');
    await contexto.close();
  }

  /* ───── 6. redirecciones de Siweb (siguiéndolas) ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true, sinGsap: true });
    const casosRed = [['/sobre-mi', /\/index\.html#sobre-mi$/], ['/areas-legales/', /\/index\.html#areas$/], ['/servicios', /\/index\.html#como-trabajo$/], ['/contacto', /\/index\.html#escribeme$/],
      ['/cookies', /\/privacidad\.html#cookies$/], ['/D/post/actualizacion-pension-de-alimentos-ipc/', /\/blog\/actualizacion-pension-de-alimentos-ipc\/$/], ['/Blog/All/', /\/blog\/$/]];
    const malas = [];
    for (const [vieja, re] of casosRed) {
      await page.goto(base + vieja, { waitUntil: 'domcontentloaded' });
      await page.waitForURL(re, { timeout: 4000 }).catch(() => {});
      if (!re.test(page.url())) malas.push(vieja + ' → ' + page.url());
    }
    comprobar(malas.length === 0, 'redirecciones: /sobre-mi, /areas-legales, /servicios, /contacto, /cookies, /D/post/<slug>/ y /Blog/All/ llegan a su sitio nuevo' + (malas.length ? ' → ' + malas.join(' | ') : ''));
    for (const p of ['404.html', 'aviso-legal.html', 'privacidad.html']) {
      const r = await page.goto(base + '/' + p, { waitUntil: 'domcontentloaded' });
      comprobar(r.ok() && (await page.title()).length > 5, p + ' carga');
    }
    comprobar(/NIF[\s\S]*\[PENDIENTE\]/.test(await page.goto(base + '/aviso-legal.html').then(() => page.evaluate(() => document.body.innerText))) && /Aurea María Fernández García Moreno/.test(await page.evaluate(() => document.body.innerText)), 'aviso legal: titular «Aurea María Fernández García Moreno», NIF [PENDIENTE]');
    await contexto.close();
  }

  /* ───── 7. sin GSAP (CDN caído) ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { sinGsap: true, cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({ cortina: getComputedStyle(document.getElementById('cortina')).display, mov: document.documentElement.classList.contains('con-movimiento'), titulo: getComputedStyle(document.querySelector('#hero-nombre .letra')).transform, abog: getComputedStyle(document.getElementById('hero-abogada')).opacity, citas: document.querySelectorAll('.opiniones__pista > li').length, n: document.getElementById('opiniones-n').textContent }));
    comprobar(r.cortina === 'none' && !r.mov && r.titulo === 'none' && r.abog === '1' && r.citas === 12 && r.n === '183', 'sin GSAP: la cortina se retira y la página se lee entera (titulares, 12 citas en lista, 183) → ' + JSON.stringify(r));
    comprobar(errores.filter(e => !/Failed to load resource|ERR_FAILED/.test(e)).length === 0, 'sin GSAP: sin errores de JS');
    if (conCapturas) await page.screenshot({ path: foto('13-sin-gsap.png') });
    await contexto.close();
  }

  /* ───── 8. movimiento reducido: el contenido sigue, el movimiento no ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { reducedMotion: 'reduce', cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    const alInicio = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display);
    await page.waitForLoadState('networkidle'); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ cortina: getComputedStyle(document.getElementById('cortina')).display, titulo: getComputedStyle(document.querySelector('#hero-nombre .letra')).transform, cursor: !!document.querySelector('.cursor'), n: document.getElementById('opiniones-n').textContent, anim: getComputedStyle(document.querySelector('.opiniones__pista')).animationName, doble: document.querySelector('.opiniones__pista').classList.contains('es-doble') }));
    comprobar(alInicio === 'none' && r.cortina === 'none', 'movimiento reducido: la cortina no pinta ni un fotograma (display:none desde el primer momento)');
    comprobar(r.titulo === 'none' && !r.cursor && r.n === '183' && r.anim === 'none' && !r.doble, 'checklist 7 · movimiento reducido: titulares en su sitio, sin cursor, el recuento ya en 183 y las citas quietas en lista');
    await hasta(page, '#areas', 100);
    await page.evaluate(() => window.scrollBy(0, 400)); await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => document.querySelectorAll('.area.es-posada').length === 1), 'movimiento reducido: el área en curso se sigue marcando (contenido, no movimiento)');
    comprobar(errores.length === 0, 'movimiento reducido: consola sin errores');
    if (conCapturas) { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: foto('14-reducido.png') }); }
    await contexto.close();
  }

  /* ───── 9. módulos: borrado en copias temporales ───── */
  for (const modulo of ['opiniones', 'casos', 'despachos', 'todos']) {
    const dir = copiaTemporal(modulo);
    const lista = modulo === 'todos' ? ['opiniones', 'casos', 'despachos'] : [modulo];
    try { for (const m of lista) execFileSync(process.execPath, [path.join(dir, 'scripts/quitar-modulo.mjs'), m, dir], { stdio: 'pipe' }); }
    catch (e) { comprobar(false, 'quitar módulo ' + modulo + ': el script falló → ' + (e.stderr || e.message)); continue; }
    const srv = await servir(dir, PUERTO + 10);
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador, { cookiesVistas: true });
    await page.goto('http://127.0.0.1:' + (PUERTO + 10) + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page); await page.waitForTimeout(600);
    const r = await page.evaluate(l => ({
      quedan: l.filter(m => document.getElementById(m) || document.querySelector('[data-modulo="' + m + '"]')),
      planas: getComputedStyle(document.getElementById('direcciones-planas')).display,
      planasTexto: document.getElementById('direcciones-planas').innerText,
      secciones: [...document.querySelectorAll('main > section[id]')].map(s => s.id)
    }), lista);
    const archivos = lista.flatMap(m => ['css/' + m + '.css', 'js/' + m + '.js']).filter(f => fs.existsSync(path.join(dir, f)));
    const sinDesp = lista.includes('despachos');
    comprobar(r.quedan.length === 0 && archivos.length === 0 && errores.length === 0 && propias(caidas).length === 0 && r.secciones.includes('escribeme') && r.secciones.includes('notas'),
      'módulo «' + modulo + '» quitado (copia temporal): sin rastro, sin sus archivos, sin errores ni 404 y el resto en orden' + (errores.length ? ' → ' + errores.join(' | ') : '') + (propias(caidas).length ? ' → ' + propias(caidas).join(' | ') : ''));
    if (sinDesp) comprobar(r.planas !== 'none' && /Santa Eulalia/.test(r.planasTexto) && /Zurbarán/.test(r.planasTexto), 'sin el módulo de despachos, «Escríbeme» enseña las dos direcciones en texto plano');
    await contexto.close(); srv.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }

  /* ───── 10. Casos con "permiso": true ───── */
  {
    const dir = copiaTemporal('casos-si');
    const ruta = path.join(dir, 'data/casos.json');
    fs.writeFileSync(ruta, fs.readFileSync(ruta, 'utf8').replace('"permiso": false', '"permiso": true'));
    const srv = await servir(dir, PUERTO + 11);
    const { contexto, page, errores } = await nuevaPagina(navegador, { cookiesVistas: true });
    await page.goto('http://127.0.0.1:' + (PUERTO + 11) + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await hasta(page, '#casos'); await page.waitForTimeout(2200);
    const r = await page.evaluate(() => ({ visible: !document.getElementById('casos').hidden && document.getElementById('casos').offsetHeight > 100, cifras: [...document.querySelectorAll('.caso__cifra')].map(c => c.textContent.replace(/ /g, ' ')), aviso: [...document.querySelectorAll('.caso__fijo')].map(c => c.textContent), enlaces: [...document.querySelectorAll('.caso a')].map(a => a.getAttribute('href')), menu: getComputedStyle(document.querySelector('#menu a[data-modulo="casos"]')).display, fechas: [...document.querySelectorAll('.caso time')].map(t => t.getAttribute('datetime')) }));
    comprobar(r.visible && r.cifras.join('|') === '8.700 €|16.610,23 €' && r.menu !== 'none', 'casos con "permiso": true: aparece, sale en el menú y las cifras cuentan hasta 8.700 € y 16.610,23 €');
    comprobar(r.aviso.length === 2 && r.aviso.every(a => a === 'Cada caso es distinto; esto no anticipa el resultado del tuyo.') && r.fechas.every(f => f === '2024-10-09') && r.enlaces.every(h => /^blog\/(llegamos|mis-clientes)/.test(h)),
      'casos: cada tarjeta con su fecha, el enlace a su entrada y la línea fija «Cada caso es distinto…»');
    if (conCapturas) await page.screenshot({ path: foto('15-casos-con-permiso.png') });
    await page.goto('http://127.0.0.1:' + (PUERTO + 11) + '/blog/', { waitUntil: 'networkidle' }); await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => [...document.querySelectorAll('.indice-blog li')].filter(l => l.offsetHeight > 0).length) === 6, 'casos con permiso: el índice del blog enseña las 6 entradas');
    comprobar(errores.length === 0, 'casos con permiso: consola sin errores');
    await contexto.close(); srv.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }

  /* ───── 11. la copia sin mando que viajaría a la clienta ───── */
  {
    const dir = copiaTemporal('sin-mando');
    let ok = true;
    try { execFileSync(process.execPath, [path.join(dir, 'scripts/quitar-mando.mjs'), dir], { stdio: 'pipe' }); execFileSync(process.execPath, [path.join(dir, 'scripts/comprobar-borrado.mjs'), dir], { stdio: 'pipe' }); }
    catch (e) { ok = false; comprobar(false, 'quitar el mando: ' + String(e.stdout || e.message).slice(-400)); }
    if (ok) {
      const srv = await servir(dir, PUERTO + 12);
      const { contexto, page, errores } = await nuevaPagina(navegador);
      await page.goto('http://127.0.0.1:' + (PUERTO + 12) + '/index.html?revision', { waitUntil: 'networkidle' });
      await esperarCortina(page);
      const r = await page.evaluate(() => ({ mando: !!document.getElementById('mando'), ficha: !!document.getElementById('ficha'), pila: document.querySelectorAll('.pila__item').length }));
      comprobar(!r.mando && !r.ficha && r.pila === 5 && errores.length === 0, 'copia sin mando (comprobar-borrado.mjs = 0 rastros): ni mando ni ficha, ni con ?revision, y la web entera sin errores');
      await contexto.close(); srv.close();
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }

  /* ───── 12. su ficha de Google (necesita red; si no hay, se avisa) ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador);
    await contexto.addCookies([{ name: 'SOCS', value: 'CAI', domain: '.google.com', path: '/' }, { name: 'CONSENT', value: 'YES+cb', domain: '.google.com', path: '/' }]);
    try {
      await page.goto('https://maps.google.com/?cid=18416980175827621575', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(4000);
      const t = (await page.title()) + ' ' + page.url();
      if (/consent\.google/.test(page.url())) notas.push('AVISO · ficha de Google: la consulta acabó en el aviso de consentimiento de Google; no se pudo leer el título');
      else comprobar(/F[eé]rn[aá]ndez|Aurea|Áurea/i.test(decodeURIComponent(t)), 'la ficha de Google (cid) abre la suya → ' + decodeURIComponent(t).slice(0, 120));
    } catch (e) { notas.push('AVISO · ficha de Google sin comprobar (sin red): ' + e.message.slice(0, 80)); }
    await contexto.close();
  }
} finally {
  await navegador.close();
  servidor.close();
}

console.log(notas.join('\n'));
if (fallos.length) console.log('\n' + fallos.join('\n'));
console.log('\n' + (notas.filter(n => n.startsWith('OK')).length) + ' bien · ' + fallos.length + ' mal');
process.exitCode = fallos.length ? 1 : 0;
