/* Las 6 entradas de su blog, leídas de los volcados de su web actual
   (scripts/fuentes/texto-web.txt y texto-web-2.txt, renderizados con
   Playwright el 2026-10-01). Lo usan construir.mjs (para escribir las páginas)
   y verificar.mjs (para el diff línea a línea).

   Texto ÍNTEGRO. Solo se tocan las erratas evidentes de CORRECCIONES, y cada
   una sale en el README. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const fuentes = ['texto-web.txt', 'texto-web-2.txt'].map(f => fs.readFileSync(path.join(aqui, 'fuentes', f), 'utf8').replace(/\r\n/g, '\n'));

export const ENTRADAS = [
  { slug: 'violencia-de-genero-info', fecha: '2024-10-21', area: 'Violencia de Género' },
  { slug: 'delito-de-lesiones-info', fecha: '2024-10-21', area: 'Derecho Penal' },
  { slug: 'actualizacion-pension-de-alimentos-ipc', fecha: '2024-10-21', area: 'Derecho de Familia' },
  { slug: 'llegamos-a-un-acuerdo-con-ibercaja-banco', fecha: '2024-10-09', area: 'Derecho Bancario', caso: true },
  { slug: 'mis-clientes-recuperan-16-600-euros-por-la-clausula-suelo', fecha: '2024-10-09', area: 'Derecho Bancario', caso: true },
  { slug: 'como-manejar-un-divorcio-de-manera-consciente-y-eficaz-consejos-practicos', fecha: '2024-07-10', area: 'Derecho de Familia' }
];

/* [slug, texto original, texto corregido, motivo] */
export const CORRECCIONES = [
  ['violencia-de-genero-info', 'VIOLENCIA DE GÉNERO INFO-', 'VIOLENCIA DE GÉNERO INFO', 'guion suelto al final del título'],
  ['delito-de-lesiones-info', 'DELITO DE LESIONES INFO -', 'DELITO DE LESIONES INFO', 'guion suelto al final del título'],
  ['actualizacion-pension-de-alimentos-ipc', 'a pensión de alimentos se ha de actualizar', 'La pensión de alimentos se ha de actualizar', 'falta la «L» inicial («a pensión»)'],
  ['mis-clientes-recuperan-16-600-euros-por-la-clausula-suelo', 'Nada más satisfactorio que los clientes reciban grandes cantidades de dinero!', '¡Nada más satisfactorio que los clientes reciban grandes cantidades de dinero!', 'falta el signo de apertura «¡»'],
  ['como-manejar-un-divorcio-de-manera-consciente-y-eficaz-consejos-practicos', 'como Aurea María Fernández', 'como Áurea María Fernández', 'falta la tilde de «Áurea»']
];
/* No es una corrección del texto de la entrada: el resumen de su portada decía
   «…POR LA CLÁUSULA SUELO DE SU HIPOCA»; la entrada completa ya dice HIPOTECA,
   y los resúmenes de esta web se sacan de la entrada completa. */
export const NOTA_HIPOCA = 'En el resumen de su portada y de /blog: «HIPOCA» → «HIPOTECA» (la entrada completa ya lo decía bien).';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const fechaLarga = iso => { const [a, m, d] = iso.split('-'); return Number(d) + ' de ' + MESES[Number(m) - 1] + ' de ' + a; };

/* devuelve { titulo, lineas } ORIGINALES (sin corregir) */
export function original(slug) {
  for (const t of fuentes) {
    const cab = '===== https://aureafernandezabogada.es/D/post/' + slug + '/ =====';
    const i = t.indexOf(cab);
    if (i < 0) continue;
    const resto = t.slice(i + cab.length).split('\n');
    const iFecha = resto.findIndex(l => /^(lunes|martes|miércoles|jueves|viernes|sábado|domingo) \d+ de \w+ de \d{4}$/.test(l.trim()));
    const titulo = resto[iFecha + 1].trim();
    const fin = resto.findIndex((l, k) => k > iFecha && l.trim() === 'Abogada Aurea María Fernández García-Moreno');
    const lineas = resto.slice(iFecha + 2, fin).map(l => l.trim()).filter(Boolean);
    return { titulo, lineas, fechaFuente: resto[iFecha].trim() };
  }
  throw new Error('No encuentro la entrada ' + slug + ' en los volcados');
}

function corregir(slug, s) {
  for (const [sl, de, a] of CORRECCIONES) if (sl === slug && s.includes(de)) s = s.replace(de, a);      /* se aplica una vez, sobre el original */
  return s;
}

/* devuelve { titulo, lineas } ya corregidos: lo que tiene que decir la página */
export function corregida(slug) {
  const o = original(slug);
  return { titulo: corregir(slug, o.titulo), lineas: o.lineas.map(l => corregir(slug, l)), fechaFuente: o.fechaFuente };
}

/* la línea como queda en pantalla una vez maquetada (viñetas y emoji de viñeta fuera) */
export const comoSeLee = l => l.replace(/^- /, '').replace(/^▪️/, '').trim();
