/* Construye lo que se repite o sale de datos:
     · blog/<slug>/index.html   sus 6 entradas, texto íntegro (scripts/blog-fuente.mjs)
     · blog/index.html          índice; las dos de cláusula suelo, solo si casos.json da permiso
     · redirecciones de Siweb   /sobre-mi, /areas-legales, /servicios, /contacto, /cookies
                                y /D/post/<slug>/ → /blog/<slug>/ (meta refresh + canonical + enlace)
     · aviso-legal.html, privacidad.html y 404.html
     · las citas de index.html, desde data/opiniones.json (entre <!-- citas:inicio/fin -->)
   Después: python scripts/logo.py (símbolos) y node scripts/versionar.mjs.

   node scripts/construir.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENTRADAS, corregida, fechaLarga } from './blog-fuente.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOMINIO = 'https://aureafernandezabogada.es/';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escribir = (rel, txt) => { const r = path.join(raiz, rel); fs.mkdirSync(path.dirname(r), { recursive: true }); fs.writeFileSync(r, txt); console.log('escrito ' + rel); };

/* ───────── esqueleto de las páginas interiores ───────── */
function pagina({ rel, titulo, descripcion, canonical, cuerpo, scriptsExtra = '' }) {
  const prof = rel.split('/').length - 1;
  const R = '../'.repeat(prof);
  return `<!DOCTYPE html>
<!-- Áurea Mª Fernández · Abogada · web «Laurel». Generado por scripts/construir.mjs: no editar a mano. -->
<html lang="es" class="sin-js" data-raiz="${R}">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta name="theme-color" content="#151412">
${canonical ? `<link rel="canonical" href="${DOMINIO}${canonical}">\n` : ''}<link rel="icon" href="${R}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Ibarra+Real+Nova:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<link rel="stylesheet" href="${R}css/estilos.css">
<script>document.documentElement.classList.replace('sin-js', 'con-js');</script>
</head>
<body class="interior">

<!-- simbolos:inicio --><!-- simbolos:fin -->

<a class="salto-contenido" href="#contenido">Saltar al contenido</a>
<header class="cabecera" id="cabecera">
  <a class="marca" href="${R}index.html" aria-label="Áurea Mª Fernández, abogada · ir al inicio">
    <svg class="marca__mono" width="34" height="38" viewBox="700 44 640 720" aria-hidden="true"><use href="#monograma"/></svg>
    <span class="marca__nombre" aria-hidden="true">Áurea Mª Fernández</span>
  </a>
  <nav class="cabecera__nav" id="menu" aria-label="Principal">
    <a href="${R}index.html#areas">Áreas</a>
    <a href="${R}index.html#sobre-mi">Sobre mí</a>
    <a href="${R}blog/">Notas</a>
    <a class="cabecera__llamar-movil" href="tel:+34657656956">Llamar · 657 65 69 56</a>
  </nav>
  <a class="boton boton--mini cabecera__cta" href="${R}index.html#escribeme">Pedir cita</a>
  <button class="hamburguesa" id="hamburguesa" type="button" aria-expanded="false" aria-controls="menu">
    <span class="hamburguesa__linea"></span><span class="hamburguesa__linea"></span>
    <span class="visualmente-oculto">Abrir menú</span>
  </button>
</header>

${cuerpo}

<footer class="pie pie--corto">
  <div class="pie__legal">
    <p>© <span id="anio">2026</span> Áurea María Fernández García-Moreno · Abogada colegiada nº 4.201 del ICABA · <a href="tel:+34657656956">657 65 69 56</a> · <a href="mailto:4201@icaba.com">4201@icaba.com</a></p>
    <p><a href="${R}aviso-legal.html">Aviso legal</a> · <a href="${R}privacidad.html">Privacidad</a> · <a href="${R}privacidad.html#cookies">Cookies</a> · <button class="enlace" id="cookies-reabrir" type="button">Configurar cookies</button></p>
  </div>
</footer>

<div class="cookies" id="cookies" role="region" aria-label="Aviso de cookies" hidden>
  <p class="cookies__texto">Esta web no usa cookies de seguimiento. Solo recuerda en tu navegador que has visto este aviso. <a href="${R}privacidad.html#cookies">Más información</a></p>
  <div class="cookies__acciones"><button class="boton boton--claro boton--mini" id="cookies-aceptar" type="button">Entendido</button></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="${R}js/main.js"></script>
${scriptsExtra}</body>
</html>
`;
}

/* ───────── cuerpo de una entrada: maquetar sin tocar el texto ───────── */
function maquetar(lineas) {
  const out = [];
  let lista = null;
  const cierra = () => { if (lista) { out.push('<ul class="lista-hojas">' + lista.join('') + '</ul>'); lista = null; } };
  for (const l of lineas) {
    if (/^- /.test(l) || /^▪️/.test(l)) { (lista = lista || []).push('<li>' + esc(l.replace(/^- /, '').replace(/^▪️/, '').trim()) + '</li>'); continue; }
    cierra();
    if (/^\d+\.\s/.test(l) || l === 'Conclusión' || l === 'Ley Orgánica 1/2004' || /^TIPOS DE VIOLENCIA:$/.test(l)) out.push('<h2>' + esc(l) + '</h2>');
    else if (/^“/.test(l)) out.push('<blockquote><p>' + esc(l) + '</p></blockquote>');
    else if (/^#/.test(l)) out.push('<p class="articulo__etiquetas">' + esc(l) + '</p>');
    else if (/📞/.test(l)) out.push('<p><a href="tel:+34657656956">' + esc(l) + '</a></p>');
    else out.push('<p>' + esc(l) + '</p>');
  }
  cierra();
  return out.join('\n      ');
}
const resumen = (lineas, palabras = 26) => {
  const t = lineas.map(l => l.replace(/^- /, '').replace(/^▪️/, '')).join(' ').replace(/\s+/g, ' ').trim();
  const p = t.split(' ');
  return p.length > palabras ? p.slice(0, palabras).join(' ').replace(/[,.;:]$/, '') + '…' : t;
};

const entradas = ENTRADAS.map(e => ({ ...e, ...corregida(e.slug) }));

for (const e of entradas) {
  const rel = 'blog/' + e.slug + '/index.html';
  const cuerpo = `<main id="contenido" class="articulo">
  <a class="articulo__volver" href="../">← Notas legales</a>
  <article aria-labelledby="titulo-entrada">
    <time datetime="${e.fecha}">${fechaLarga(e.fecha)}</time>
    <h1 id="titulo-entrada">${esc(e.titulo)}</h1>
    <div class="articulo__cuerpo">
      ${maquetar(e.lineas)}
    </div>
    <p class="articulo__aviso">Publicada por Áurea Mª Fernández el ${fechaLarga(e.fecha)}. Es información general: para tu caso concreto, mejor en una cita.</p>
  </article>
  <div class="articulo__pie">
    <p>¿Tienes una consulta sobre ${esc(e.area)}?</p>
    <a class="boton" href="../../index.html#escribeme">Escríbeme</a>
  </div>
</main>`;
  escribir(rel, pagina({ rel, titulo: e.titulo + ' · Áurea Mª Fernández, abogada', descripcion: resumen(e.lineas, 24), canonical: 'blog/' + e.slug + '/', cuerpo }));
}

/* índice del blog: las cláusulas suelo, apagadas como el módulo Casos */
{
  const rel = 'blog/index.html';
  const orden = [...entradas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const items = orden.map(e => `      <li class="nota"${e.caso ? ' data-modulo="casos" hidden' : ''}>
        <time datetime="${e.fecha}">${fechaLarga(e.fecha)}</time>
        <h2><a href="${e.slug}/">${esc(e.titulo)}</a></h2>
        <p>${esc(resumen(e.lineas))}</p>
      </li>`).join('\n');
  const cuerpo = `<main id="contenido" class="articulo">
  <p class="antetitulo"><svg class="hoja-icono" viewBox="0 0 136 75" aria-hidden="true"><use href="#hoja"/></svg>Notas legales</p>
  <h1>Notas legales</h1>
  <p class="entrada">En esta sección comparto las últimas sentencias, noticias y artículos relacionados con el mundo jurídico.</p>
  <ul class="indice-blog">
${items}
  </ul>
</main>`;
  escribir(rel, pagina({ rel, titulo: 'Notas legales · Áurea Mª Fernández, abogada', descripcion: 'Notas legales de Áurea Mª Fernández: violencia de género, delito de lesiones, pensión de alimentos y divorcio.', canonical: 'blog/', cuerpo,
    scriptsExtra: '<script src="../js/casos.js" data-modulo="casos"></script>\n' }));
}

/* ───────── redirecciones de las URLs de Siweb ───────── */
function redireccion(rel, destinoRel, canonical, nombre) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(nombre)} · Áurea Mª Fernández, abogada</title>
<meta http-equiv="refresh" content="0; url=${destinoRel}">
<link rel="canonical" href="${DOMINIO}${canonical}">
<style>body{margin:0;min-height:100vh;display:grid;place-content:center;background:#F6F2EA;color:#151412;font:1.1rem/1.5 system-ui,sans-serif;text-align:center;padding:1rem}a{color:inherit}</style>
</head>
<body>
<p>Esta página ha cambiado de sitio.<br><a href="${destinoRel}">Ir a ${esc(nombre)}</a></p>
</body>
</html>
`;
}
const REDIRECCIONES = [
  ['sobre-mi/index.html', '../index.html#sobre-mi', '#sobre-mi', 'Sobre mí'],
  ['areas-legales/index.html', '../index.html#areas', '#areas', 'Áreas'],
  ['servicios/index.html', '../index.html#como-trabajo', '#como-trabajo', 'Cómo trabajo'],
  ['contacto/index.html', '../index.html#escribeme', '#escribeme', 'Escríbeme'],
  ['cookies/index.html', '../privacidad.html#cookies', 'privacidad.html#cookies', 'la política de cookies'],
  ...entradas.map(e => ['D/post/' + e.slug + '/index.html', '../../../blog/' + e.slug + '/', 'blog/' + e.slug + '/', 'la nota «' + e.titulo + '»'])
];
for (const [rel, dest, can, nombre] of REDIRECCIONES) escribir(rel, redireccion(rel, dest, can, nombre));
fs.writeFileSync(path.join(raiz, 'scripts', 'redirecciones.json'), JSON.stringify(REDIRECCIONES.map(([rel, dest, can]) => ({ vieja: '/' + rel.replace(/index\.html$/, ''), destino: dest, canonical: DOMINIO + can })), null, 2));

/* ───────── legales ───────── */
escribir('aviso-legal.html', pagina({
  rel: 'aviso-legal.html', titulo: 'Aviso legal · Áurea Mª Fernández, abogada', descripcion: 'Aviso legal de la web de Áurea María Fernández García-Moreno, abogada.', canonical: 'aviso-legal.html',
  cuerpo: `<main id="contenido" class="articulo legal__cuerpo">
  <h1>Aviso legal</h1>
  <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), estos son los datos de la titular de esta web:</p>
  <dl class="legal__datos">
    <div><dt>Titular</dt><dd>Aurea María Fernández García Moreno</dd></div>
    <div><dt>NIF</dt><dd>[PENDIENTE]</dd></div>
    <div><dt>Profesión</dt><dd>Abogada. Título obtenido en España (Grado en Derecho, Universidad de Sevilla).</dd></div>
    <div><dt>Colegio profesional</dt><dd>Ilustre Colegio de Abogados de Badajoz (ICABA), abogada ejerciente nº 4.201</dd></div>
    <div><dt>Normas profesionales</dt><dd>Estatuto General de la Abogacía Española y Código Deontológico de la Abogacía Española, publicados en abogacia.es</dd></div>
    <div><dt>Domicilio</dt><dd>C/ Santa Eulalia s/n, despacho nº 6 · 06130 Valverde de Leganés (Badajoz)</dd></div>
    <div><dt>Otro despacho</dt><dd>C/ Zurbarán nº 1, planta 2, puerta 3 · 06002 Badajoz</dd></div>
    <div><dt>Teléfono</dt><dd>657 65 69 56</dd></div>
    <div><dt>Email</dt><dd>4201@icaba.com</dd></div>
  </dl>
  <h2>Uso de la web</h2>
  <p>Los contenidos de esta web son informativos y no constituyen asesoramiento jurídico para un caso concreto. Cada asunto requiere su estudio en una consulta.</p>
  <p>Las opiniones que se citan son de clientes y están publicadas en la ficha de Google de la titular; se reproducen literalmente, firmadas solo con el nombre y la inicial.</p>
  <h2>Propiedad intelectual</h2>
  <p>El logotipo, los textos y las fotografías son de la titular. No se pueden reproducir sin su permiso.</p>
  <h2>Enlaces</h2>
  <p>Los enlaces a Google Maps, WhatsApp y redes sociales llevan a servicios de terceros, con sus propias condiciones y políticas de privacidad.</p>
</main>`
}));

escribir('privacidad.html', pagina({
  rel: 'privacidad.html', titulo: 'Privacidad y cookies · Áurea Mª Fernández, abogada', descripcion: 'Política de privacidad y de cookies de la web de Áurea María Fernández García-Moreno, abogada.', canonical: 'privacidad.html',
  cuerpo: `<main id="contenido" class="articulo legal__cuerpo">
  <h1>Privacidad</h1>
  <dl class="legal__datos">
    <div><dt>Responsable</dt><dd>Aurea María Fernández García Moreno · NIF [PENDIENTE]</dd></div>
    <div><dt>Contacto</dt><dd>4201@icaba.com · 657 65 69 56 · C/ Santa Eulalia s/n, despacho nº 6, 06130 Valverde de Leganés</dd></div>
  </dl>
  <h2>El formulario «Escríbeme»</h2>
  <p>El formulario de esta web no envía nada a ningún servidor ni guarda tus datos. Solo compone un mensaje en tu propio navegador; eres tú quien decide enviarlo desde tu WhatsApp, desde tu correo o llamando. A partir de ese momento, tus datos los trata la titular para atender tu consulta y concertar la cita, con base en tu consentimiento y en las medidas precontractuales que pides.</p>
  <p>Te pedimos que no incluyas datos sensibles en ese primer mensaje: se hablan en la cita.</p>
  <p>Los datos se conservan mientras dure la relación profesional y, después, durante los plazos legales. No se ceden a terceros salvo obligación legal. Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a 4201@icaba.com, y reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
  <h2 id="cookies">Cookies</h2>
  <p>Esta web no usa cookies de análisis ni de publicidad. Solo guarda en el almacenamiento local de tu navegador (localStorage) lo imprescindible:</p>
  <table class="legal__tabla">
    <thead><tr><th>Clave</th><th>Para qué</th><th>Duración</th></tr></thead>
    <tbody>
      <tr><td><code>aurea-cookies</code></td><td>Recordar que ya has visto este aviso</td><td>Hasta que borres los datos del navegador</td></tr>
      <!-- [MANDO DE MAQUETA] esta fila se quita con el mando -->
      <tr><td><code>aurea-densidad</code></td><td>Solo en la maqueta de revisión: qué versión visual estás viendo</td><td>Hasta que borres los datos del navegador</td></tr>
      <!-- fin [MANDO DE MAQUETA] -->
    </tbody>
  </table>
  <p>El mapa de Google Maps no se carga hasta que pulsas «Ver el mapa». Si lo haces, Google puede instalar sus propias cookies, según su política de privacidad. Los botones de WhatsApp y de redes sociales son enlaces normales: no cargan nada de esos servicios hasta que los pulsas.</p>
</main>`
}));

escribir('404.html', pagina({
  rel: '404.html', titulo: 'Página no encontrada · Áurea Mª Fernández, abogada', descripcion: 'Esta página no existe.', canonical: '',
  cuerpo: `<main id="contenido" class="perdido">
  <svg class="perdido__corona" viewBox="700 44 640 720" aria-hidden="true"><use href="#monograma"/></svg>
  <h1 class="titular">Esta página no está</h1>
  <p class="entrada">Puede que venga de la web anterior. Todo lo de entonces sigue aquí:</p>
  <p><a class="boton" href="/" id="volver-inicio">Ir al inicio</a></p>
  <script>
  /* las URLs viejas de Siweb que no se pueden servir como carpeta (en Windows
     «Blog» y «blog» son la misma): se redirigen aquí, sea cual sea la raíz */
  (function () {
    var p = location.pathname, m = p.match(/^(.*?)\\/Blog\\/All\\/?$/);
    if (m) { location.replace(m[1] + '/blog/'); return; }
    var i = p.search(/\\/(blog|D|sobre-mi|areas-legales|servicios|contacto|cookies)(\\/|$)/i);
    document.getElementById('volver-inicio').href = (i > 0 ? p.slice(0, i) : '') + '/';
  })();
  </script>
</main>`
}));

/* ───────── citas de opiniones.json en index.html ───────── */
{
  const datos = JSON.parse(fs.readFileSync(path.join(raiz, 'data/opiniones.json'), 'utf8'));
  const col = n => datos.citas.filter(c => c.columna === n).map(c => `          <li><figure class="cita">
            <p class="cita__estrellas" aria-label="${c.estrellas} de 5 estrellas">${'★'.repeat(c.estrellas)}${'☆'.repeat(5 - c.estrellas)}</p>
            <blockquote><p>«${esc(c.texto)}»</p></blockquote>
            <figcaption>${esc(c.nombre)} · Google</figcaption>
          </figure></li>`).join('\n');
  const bloque = `<!-- citas:inicio · generado por scripts/construir.mjs desde data/opiniones.json -->
      <div class="opiniones__col opiniones__col--1">
        <ul class="opiniones__pista">
${col(1)}
        </ul>
      </div>
      <div class="opiniones__col opiniones__col--2">
        <ul class="opiniones__pista">
${col(2)}
        </ul>
      </div>
<!-- citas:fin -->`;
  const ruta = path.join(raiz, 'index.html');
  const t = fs.readFileSync(ruta, 'utf8');
  const nuevo = t.replace(/<!-- citas:inicio[^>]*-->[\s\S]*?<!-- citas:fin -->/, () => bloque);
  if (nuevo === t && !t.includes(bloque)) throw new Error('index.html sin marcas <!-- citas:inicio/fin -->');
  fs.writeFileSync(ruta, nuevo);
  console.log('citas: ' + datos.citas.length + ' en index.html');
}
