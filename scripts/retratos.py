"""Sus dos retratos, recortados, con la misma gradación suave y a tres anchos.

Recorte 4:5 por encima del zócalo de azulejo (ese motivo ya es de Las
Dehesillas y el selector de despachos va sin él). Gradación, igual en los dos:
  · un punto más cálida (R ×1,02, B ×0,965), hacia el marfil de la web;
  · negros levantados a 10/255 y una curva suave que no queme la pared blanca;
  · saturación al 90 %: el azul marino de la chaqueta se queda, pero baja.
Salen JPG (respaldo), WebP (PIL) y AVIF (ffmpeg + libaom; PIL no lo escribe).

    python scripts/retratos.py
"""
import subprocess
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ.parent / 'aurea-fernandez-abogada-valverde-bocetos' / 'ref' / 'fotos-ok'
DESTINO = RAIZ / 'assets' / 'img'
RETRATOS = {
    'retrato-despacho': ('tezza_4835.JPG', (300, 100, 1260, 1300)),   # Sobre mí
    'retrato-sonrisa': ('tezza_5482.jpg', (345, 170, 1305, 1370)),    # Escríbeme
}
ANCHOS = [480, 800, 960]


def gradar(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    a = 0.04 + a * 0.96                                   # negros a ~10/255
    a = a - 0.06 * np.sin(np.pi * a) * (a - 0.5)          # curva suave
    a[..., 0] *= 1.02
    a[..., 2] *= 0.965
    im = Image.fromarray((np.clip(a, 0, 1) * 255).round().astype(np.uint8))
    return ImageEnhance.Color(im).enhance(0.9)


if __name__ == '__main__':
    DESTINO.mkdir(parents=True, exist_ok=True)
    for nombre, (archivo, caja) in RETRATOS.items():
        im = Image.open(ORIGEN / archivo)
        im = gradar(im.crop(caja))
        for w in ANCHOS:
            h = round(w * im.height / im.width)
            r = im.resize((w, h), Image.LANCZOS)
            base = DESTINO / f'{nombre}-{w}'
            r.save(base.with_suffix('.jpg'), quality=82, optimize=True, progressive=True)
            r.save(base.with_suffix('.webp'), quality=80, method=6)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(base.with_suffix('.jpg')),
                            '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '30', '-b:v', '0',
                            '-pix_fmt', 'yuv420p', str(base.with_suffix('.avif'))], check=True)
            print(nombre, w, '×', h, {e: round(base.with_suffix(e).stat().st_size / 1024) for e in ['.jpg', '.webp', '.avif']}, 'KB')
