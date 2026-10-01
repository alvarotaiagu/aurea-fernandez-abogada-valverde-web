"""Logo de Áurea Mª Fernández vectorizado con potrace desde su PNG original.

No se redibuja nada a ojo. El PNG (2000×1199, negro) se separa por
componentes conexos, que en este logo coinciden con sus piezas:

    laurel-izq   rama izquierda entera (tallo y hojas son una sola mancha)
    laurel-der   rama derecha
    monograma    la A, la F-columna y los dos platillos de la balanza
    nombre       «Áurea María Fernández García-Moreno»
    abogada      «A B O G A D A»
    hoja         la hoja de arriba de la rama izquierda, recortada con su
                 pecíolo: es la que se usa en toda la web (ninguna inventada)

Además, cada rama se parte en sus 12 hojas para dorarlas una a una en la
cortina: una apertura morfológica de radio 14 px se come el tallo (12–20 px
de grueso) y deja cada hoja (40–60 px) como mancha suelta; cada píxel de la
rama se asigna a la hoja más cercana si está a ≤ 22 px (las puntas afiladas quedan lejos del núcleo abierto) y si no, al tallo.

Escribe:
    assets/logo-aurea.svg         logotipo completo en tinta (grupos con id)
    assets/logo-aurea-marfil.svg  el mismo en marfil (pie sobre tinta)
    assets/monograma.svg          monograma suelto · assets/favicon.svg
    assets/hoja.svg               la hoja suelta
y mete en las páginas, entre <!-- simbolos:inicio --> … <!-- simbolos:fin -->,
los <path> del logo en coordenadas del PNG (la corona usa el viewBox
"500 44 1006 818"), más las hojas por separado solo en index.html
(<!-- hojas:inicio --> … <!-- hojas:fin -->), ordenadas de abajo arriba.

    python scripts/logo.py
"""
import re
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
import potrace

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = Path(__file__).resolve().parent.parent
PNG = RAIZ.parent / 'aurea-fernandez-abogada-valverde-bocetos' / 'ref' / 'fotos-ok' / 'logotipo_aceptado_mesa_de_trabajo_1_1.png'
AMPLIA = 2
TINTA = '#151412'
MARFIL = '#F6F2EA'
HOJA = (690, 44, 826, 119)            # caja de la hoja suelta, medida con rejilla
CORONA = (500, 44, 1506, 862)          # caja común de las dos ramas y el monograma
LOGO = (40, 40, 1940, 1160)


def cargar():
    a = np.asarray(Image.open(PNG).convert('RGBA'))
    return (a[..., 3] > 128) & (a[..., :3].mean(-1) < 128)


def piezas(t):
    lab, n = ndimage.label(t, np.ones((3, 3)))
    objs = ndimage.find_objects(lab)
    area = ndimage.sum(t, lab, range(1, n + 1))
    grupos = {k: np.zeros_like(t) for k in ['laurel-izq', 'laurel-der', 'monograma', 'nombre', 'abogada']}
    for i, sl in enumerate(objs):
        if area[i] < 30:
            continue                              # motas sueltas del PNG
        ys, xs = sl
        m = lab == i + 1
        if ys.start >= 1060: grupos['abogada'] |= m
        elif ys.start >= 920: grupos['nombre'] |= m
        elif xs.stop <= 900 and area[i] > 40000: grupos['laurel-izq'] |= m
        elif xs.start >= 1100 and area[i] > 40000: grupos['laurel-der'] |= m
        else: grupos['monograma'] |= m
    return grupos


def hojas_de(rama):
    r = 14
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    abierta = ndimage.binary_opening(rama, xx * xx + yy * yy <= r * r)
    lab, n = ndimage.label(abierta)
    dist, (iy, ix) = ndimage.distance_transform_edt(lab == 0, return_indices=True)
    cerca = lab[iy, ix]
    asignada = np.where(rama & (dist <= 22), cerca, 0)
    out = []
    for k in range(1, n + 1):
        m = asignada == k
        ys, xs = np.where(m)
        out.append((ys.max(), m))                 # para ordenar de abajo arriba
    out.sort(key=lambda p: -p[0])
    return [m for _, m in out]


def trazar(mascara, caja=None):
    x0, y0, x1, y1 = caja or (0, 0, mascara.shape[1], mascara.shape[0])
    trozo = mascara[y0:y1, x0:x1]
    im = Image.fromarray(np.where(trozo, 0, 255).astype(np.uint8))
    im = im.resize((im.width * AMPLIA, im.height * AMPLIA), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.1))
    g = np.asarray(im)
    # potracer toma como figura lo que vale False: se le pasa el FONDO, en bool
    curvas = potrace.Bitmap(g >= 128).trace(turdsize=12, alphamax=1.1, opticurve=True, opttolerance=0.6)
    k = 1 / AMPLIA
    f = lambda p: '%.1f %.1f' % (p.x * k + x0, p.y * k + y0)
    d = []
    for c in curvas:
        d.append('M' + f(c.start_point))
        for s in c.segments:
            d.append(('L' + f(s.c) + 'L' + f(s.end_point)) if s.is_corner else ('C' + f(s.c1) + ' ' + f(s.c2) + ' ' + f(s.end_point)))
        d.append('Z')
    return ''.join(d).replace('.0 ', ' ').replace('.0C', 'C').replace('.0L', 'L').replace('.0Z', 'Z')


def caja_svg(c):
    return f'{c[0]} {c[1]} {c[2] - c[0]} {c[3] - c[1]}'


def logo_svg(d, color, titulo):
    g = ''.join(f'<g id="{k}"><path d="{v}"/></g>' for k, v in d.items() if k != 'hoja')
    w, h = LOGO[2] - LOGO[0], LOGO[3] - LOGO[1]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{caja_svg(LOGO)}" width="{w}" height="{h}" role="img" aria-labelledby="t">'
            f'<title id="t">{titulo}</title><g fill="{color}" fill-rule="evenodd">{g}</g></svg>\n')


def sustituir(pagina, marca, bloque):
    ruta = RAIZ / pagina
    if not ruta.exists():
        return False
    t = ruta.read_text(encoding='utf8')
    patron = re.compile(r'<!-- ' + marca + r':inicio[^>]*-->.*?<!-- ' + marca + r':fin -->', re.S)
    nuevo, n = patron.subn(lambda m: bloque, t)
    if n:
        ruta.write_text(nuevo, encoding='utf8')
    return bool(n)


if __name__ == '__main__':
    t = cargar()
    g = piezas(t)
    d = {k: trazar(m) for k, m in g.items()}
    hoja_m = g['laurel-izq'].copy()
    d['hoja'] = trazar(hoja_m, HOJA)
    hojas = {lado: [trazar(m) for m in hojas_de(g['laurel-' + lado])] for lado in ['izq', 'der']}
    assets = RAIZ / 'assets'
    assets.mkdir(exist_ok=True)
    titulo = 'Áurea María Fernández García-Moreno · Abogada'
    (assets / 'logo-aurea.svg').write_text(logo_svg(d, TINTA, titulo), encoding='utf8')
    (assets / 'logo-aurea-marfil.svg').write_text(logo_svg(d, MARFIL, titulo), encoding='utf8')
    mx = caja_svg((700, 44, 1340, 764))
    (assets / 'monograma.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{mx}" width="320" height="360" role="img" aria-label="Monograma AF">'
        f'<path fill="{TINTA}" fill-rule="evenodd" d="{d["monograma"]}"/></svg>\n', encoding='utf8')
    # favicon: el monograma en tinta sobre un cuadrado marfil
    lado = 860
    (assets / 'favicon.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{1020 - lado // 2} {404 - lado // 2} {lado} {lado}">'
        f'<rect x="{1020 - lado // 2}" y="{404 - lado // 2}" width="{lado}" height="{lado}" rx="150" fill="{MARFIL}"/>'
        f'<path fill="{TINTA}" fill-rule="evenodd" d="{d["monograma"]}"/></svg>\n', encoding='utf8')
    (assets / 'hoja.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{caja_svg(HOJA)}" width="136" height="75"><path fill="#9C7A3C" d="{d["hoja"]}"/></svg>\n', encoding='utf8')

    def bloque(claves):
        return ('<!-- simbolos:inicio · generado por scripts/logo.py, no editar a mano -->\n'
                '<svg class="simbolos" width="0" height="0" aria-hidden="true" focusable="false"><defs>'
                + ''.join(f'<path id="{k}" fill-rule="evenodd" d="{d[k]}"/>' for k in claves)
                + f'<symbol id="hoja" viewBox="{caja_svg(HOJA)}"><path d="{d["hoja"]}"/></symbol>'
                + '</defs></svg>\n<!-- simbolos:fin -->')
    hojas_bloque = ('<!-- hojas:inicio · generado por scripts/logo.py · de abajo arriba -->'
                    + ''.join(f'<g class="cortina__hojas cortina__hojas--{lado}">'
                              + ''.join(f'<path class="cortina__hoja" d="{p}"/>' for p in ps) + '</g>'
                              for lado, ps in hojas.items())
                    + '<!-- hojas:fin -->')
    # la portada lleva las ramas (cortina, hero, pie); las interiores, solo monograma y hoja
    for ruta in sorted(RAIZ.rglob('*.html')):
        rel = ruta.relative_to(RAIZ).as_posix()
        if rel.startswith(('scripts/', 'screenshots/', 'node_modules/')):
            continue
        claves = ['laurel-izq', 'laurel-der', 'monograma'] if rel == 'index.html' else ['monograma']
        if sustituir(rel, 'simbolos', bloque(claves)):
            print('símbolos en ' + rel)
    print(('hojas en index.html' if sustituir('index.html', 'hojas', hojas_bloque) else 'sin marcas de hojas en index.html'))
    print({k: len(v) for k, v in d.items()}, {k: len(v) for k, v in hojas.items()})
