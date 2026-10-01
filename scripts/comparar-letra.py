"""Qué serif de Google Fonts se parece más al nombre del logo.

Se recorta «Áurea María Fernández García-Moreno» del PNG original, se compone
la misma línea con cada candidata a la MISMA altura de mayúscula (la «M» de
«María» mide 75 px en el PNG) y se comparan tres cosas:
  · ancho   cuánto mide la línea frente a la del logo (1,00 = igual)
  · mancha  proporción de tinta dentro de la caja (lo negra que es)
  · solape  IoU de las dos manchas estiradas a la misma caja (forma)
Y lo mismo con «ABOGADA» (las siete letras juntas, sin el espaciado).
Guarda una lámina para mirarlas una debajo de otra.

    python scripts/comparar-letra.py

Excluidas de antemano: Gelasio (Pozo Rondón) y DM Serif Display (su web actual).
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

sys.stdout.reconfigure(encoding='utf-8')
AQUI = Path(__file__).resolve().parent
FUENTES = AQUI / 'fuentes'
LOGO = AQUI.parent.parent / 'aurea-fernandez-abogada-valverde-bocetos' / 'ref' / 'fotos-ok' / 'logotipo_aceptado_mesa_de_trabajo_1_1.png'
SALIDA = FUENTES / 'comparar-letra.png'
NOMBRE = 'Áurea María Fernández García-Moreno'
ALTO_M = 75            # «M» de «María» en el PNG: y 957 → 1032


def tinta(im):
    return np.asarray(im.convert('L')) < 128


def caja(m):
    ys, xs = np.where(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def recorte_logo(y0, y1):
    im = Image.open(LOGO).convert('RGBA')
    im = Image.alpha_composite(Image.new('RGBA', im.size, 'white'), im)
    m = tinta(im.crop((0, y0, im.width, y1)))
    x0, a, x1, b = caja(m)
    return m[a:b, x0:x1]


def letras_juntas(m, hueco=6):
    """Quita el espaciado de «A B O G A D A»: columnas vacías → un hueco fijo."""
    cols = m.any(0)
    trozos, dentro, ini = [], False, 0
    for x, c in enumerate(list(cols) + [False]):
        if c and not dentro: dentro, ini = True, x
        if not c and dentro:
            dentro = False
            trozos.append(m[:, ini:x])
    sep = np.zeros((m.shape[0], hueco), bool)
    out = []
    for t in trozos:
        out += [t, sep]
    return np.concatenate(out[:-1], 1)


def instancia(ruta, ejes):
    if not ejes:
        return str(ruta)
    destino = FUENTES / (ruta.stem.split('[')[0] + '-' + '-'.join(f'{k}{v}' for k, v in ejes.items()) + '.ttf')
    if not destino.exists():
        instantiateVariableFont(TTFont(ruta), ejes).save(destino)
    return str(destino)


def tam_para_mayuscula(ruta, alto):
    f = ImageFont.truetype(ruta, 400)
    l = Image.new('L', (800, 800), 255)
    ImageDraw.Draw(l).text((50, 50), 'M', font=f, fill=0)
    x0, y0, x1, y1 = caja(tinta(l))
    return 400 * alto / (y1 - y0)


def componer(ruta, texto, alto_m):
    f = ImageFont.truetype(ruta, round(tam_para_mayuscula(ruta, alto_m) * 4))
    l = Image.new('L', (len(texto) * f.size, f.size * 2), 255)
    ImageDraw.Draw(l).text((20, f.size // 2), texto, font=f, fill=0)
    m = tinta(l)
    x0, y0, x1, y1 = caja(m)
    m = m[y0:y1, x0:x1]
    im = Image.fromarray((~m * 255).astype(np.uint8))
    return tinta(im.resize((max(1, round(m.shape[1] / 4)), max(1, round(m.shape[0] / 4))), Image.LANCZOS))


def iou(a, b):
    h, w = b.shape
    a2 = tinta(Image.fromarray((~a * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS))
    return (a2 & b).sum() / (a2 | b).sum()


CANDIDATAS = [
    ('Libre Caslon Text 700', FUENTES / 'LibreCaslonText[wght].ttf', {'wght': 700}),
    ('Libre Caslon Display 400', FUENTES / 'LibreCaslonDisplay-Regular.ttf', {}),
    ('Ibarra Real Nova 600', FUENTES / 'IbarraRealNova[wght].ttf', {'wght': 600}),
    ('Ibarra Real Nova 700', FUENTES / 'IbarraRealNova[wght].ttf', {'wght': 700}),
    ('Lora 700', FUENTES / 'Lora[wght].ttf', {'wght': 700}),
]

if __name__ == '__main__':
    nombre = recorte_logo(925, 1045)
    abogada_logo = recorte_logo(1060, 1155)
    alto_ab = abogada_logo.shape[0]
    abogada = letras_juntas(abogada_logo)
    print(f'Logo · nombre {nombre.shape[1]}×{nombre.shape[0]} px, mancha {nombre.mean():.3f} · ABOGADA (sin espaciado) {abogada.shape[1]} px, mancha {abogada.mean():.3f}')
    filas = [('LOGO', nombre, abogada)]
    resultados = []
    for etiqueta, ruta, ejes in CANDIDATAS:
        r = instancia(ruta, ejes)
        m = componer(r, NOMBRE, ALTO_M)
        a = letras_juntas(componer(r, 'ABOGADA', alto_ab))
        fila = (etiqueta, m.shape[1] / nombre.shape[1], m.mean(), iou(m, nombre), a.shape[1] / abogada.shape[1], iou(a, abogada))
        resultados.append(fila)
        print(f'{etiqueta:26s} nombre: ancho {fila[1]:.3f}  mancha {fila[2]:.3f} (logo {nombre.mean():.3f})  solape {fila[3]:.3f}  |  ABOGADA: ancho {fila[4]:.3f}  solape {fila[5]:.3f}')
        filas.append((etiqueta, m, a))
    ancho = max(f[1].shape[1] for f in filas) + 270
    alto_fila = max(f[1].shape[0] for f in filas) + max(f[2].shape[0] for f in filas) + 40
    lam = Image.new('RGB', (ancho, len(filas) * alto_fila + 10), 'white')
    d = ImageDraw.Draw(lam)
    for i, (n, m, a) in enumerate(filas):
        y = 10 + i * alto_fila
        lam.paste(Image.fromarray((~m * 255).astype(np.uint8)).convert('RGB'), (260, y))
        lam.paste(Image.fromarray((~a * 255).astype(np.uint8)).convert('RGB'), (260, y + m.shape[0] + 14))
        d.text((8, y + 30), n, fill=(156, 122, 60))
    lam.save(SALIDA)
    print('lámina:', SALIDA.relative_to(AQUI.parent))
