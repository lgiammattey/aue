#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador do conjunto de ícones do Auê! — favicon, iOS, Android e prévia de link.

A geometria NÃO mora aqui. Ela é LIDA do `assets/aue-bolha-mark.svg`, que por
sua vez é escrito pelo `gerar-marca.mjs` a partir de `caminhoDaMarca.ts` — a
mesma função que anima a Bolha da Arena. Antes o polígono do blob era copiado à
mão para dentro deste arquivo: duas fontes da mesma forma, sem nada guardando.
Agora é uma só, e o `caminhoDaMarca.test.ts` reprova se alguém separar as duas.

Flat, duas cores da paleta registrada, sem gradiente, sem glow, sem sombra.

Uso:  python docs/design/design-system/system/scripts/build-favicons.py
      python … build-favicons.py --candidatas   (só as folhas de comparação)

Saída: assets/favicon/*  ·  assets/candidatas/*.png  ·  cópia para public/
"""

import os
import re
import shutil
import struct
import sys
from io import BytesIO

from PIL import Image, ImageDraw

# O console do Windows abre em cp1252 e engasga com seta e acento. Isto é só
# o relatório do script — não muda um byte do que ele grava.
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# ── Paleta registrada — DESIGN.md §1.1 / §1.2 ────────────────────────────────
BG = (0x0A, 0x0A, 0x08)   # Preto Carvão
FG = (0xC6, 0xFF, 0x00)   # Verde Ácido Elétrico

SS = 8            # supersampling

AQUI = os.path.dirname(os.path.abspath(__file__))
DS = os.path.normpath(os.path.join(AQUI, '..', '..'))          # docs/design/design-system
RAIZ = os.path.normpath(os.path.join(DS, '..', '..', '..'))    # raiz do repositório
ASSETS = os.path.join(DS, 'assets')
OUT = os.path.join(ASSETS, 'favicon')
CANDIDATAS = os.path.join(ASSETS, 'candidatas')
PUBLIC = os.path.join(RAIZ, 'public')
MARCA_SVG = os.path.join(ASSETS, 'aue-bolha-mark.svg')

# O que o `vite.config.ts` e o `index.html` declaram, e com que nome.
# `maskable-192.png` fica de fora de propósito: o manifest não declara.
PARA_PUBLIC = [
    ('favicon.ico', 'favicon.ico'),
    ('favicon.svg', 'favicon.svg'),
    ('apple-touch-icon.png', 'apple-touch-icon.png'),
    ('android-chrome-192.png', 'pwa-192x192.png'),
    ('android-chrome-512.png', 'pwa-512x512.png'),
    ('maskable-512.png', 'pwa-maskable-512x512.png'),
    ('og-image.png', 'og-image.png'),
]


# ── Leitura da geometria ─────────────────────────────────────────────────────

_NUMERO = re.compile(r'-?\d*\.?\d+')


def ler_d(caminho_svg):
    """O atributo `d` do único `<path>` do símbolo."""
    with open(caminho_svg, encoding='utf-8') as fh:
        svg = fh.read()
    m = re.search(r'<path[^>]*\sd="([^"]+)"', svg, re.S)
    if not m:
        raise SystemExit('não achei o `d` do <path> em %s' % caminho_svg)
    return m.group(1)


def bezier(p0, p1, p2, p3, steps):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
        y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
        pts.append((x, y))
    return pts


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


class Subcaminho:
    """
    Um contorno fechado: ponto inicial mais segmentos de reta ou cúbica.

    Guarda a CURVA, não o polígono. Achatar é decisão de quem vai desenhar: o
    raster achata, o SVG emitido não — senão um favicon vetorial de 1KB viraria
    uma lista de 500 pontos.
    """

    def __init__(self, inicio, segmentos):
        self.inicio = inicio
        self.segmentos = segmentos

    def pontos(self, steps=48):
        saida = [self.inicio]
        atual = self.inicio
        for seg in self.segmentos:
            if seg[0] == 'L':
                saida.append(seg[1])
                atual = seg[1]
            else:
                saida.extend(bezier(atual, seg[1], seg[2], seg[3], steps)[1:])
                atual = seg[3]
        return saida

    def transformado(self, fn):
        """Afim ponto a ponto. Vale para os controles porque Bézier é afim-covariante."""
        return Subcaminho(
            fn(self.inicio),
            [(s[0],) + tuple(fn(p) for p in s[1:]) for s in self.segmentos],
        )

    def d(self, f):
        partes = ['M%s,%s' % (f(self.inicio[0]), f(self.inicio[1]))]
        for seg in self.segmentos:
            if seg[0] == 'L':
                partes.append('L%s,%s' % (f(seg[1][0]), f(seg[1][1])))
            else:
                partes.append('C' + ' '.join('%s,%s' % (f(p[0]), f(p[1])) for p in seg[1:]))
        partes.append('Z')
        return ''.join(partes)


def subcaminhos(d):
    """
    O `d` quebrado em contornos fechados.

    Entende só `M`, `C`, `L` e `Z` — é exatamente o vocabulário que o
    `caminhoDaMarca.ts` emite, inclusive no pingo do `!`, que é círculo
    aproximado por quatro cúbicas justamente para não obrigar este arquivo a
    ter parser de arco elíptico.
    """
    saida, inicio, segmentos = [], None, []

    def fechar():
        if inicio is not None and segmentos:
            saida.append(Subcaminho(inicio, list(segmentos)))

    for comando in re.findall(r'[MCLZ][^MCLZ]*', d):
        v = [float(x) for x in _NUMERO.findall(comando[1:])]
        letra = comando[0]
        if letra == 'M':
            fechar()
            inicio, segmentos = (v[0], v[1]), []
        elif letra == 'L':
            for i in range(0, len(v) - 1, 2):
                segmentos.append(('L', (v[i], v[i + 1])))
        elif letra == 'C':
            for i in range(0, len(v) - 5, 6):
                segmentos.append(('C', (v[i], v[i+1]), (v[i+2], v[i+3]), (v[i+4], v[i+5])))
        elif letra == 'Z':
            fechar()
            segmentos = []
    fechar()
    return saida


class Simbolo:
    """Blob, haste e pingo — o que o `d` do símbolo carrega, nessa ordem."""

    def __init__(self, d):
        partes = subcaminhos(d)
        if len(partes) != 3:
            raise SystemExit('esperava 3 subcaminhos (blob, haste, pingo), achei %d' % len(partes))
        self.blob, self.haste, self.pingo = partes
        self.bbox = bbox(self.blob.pontos())

    def haste_engrossada(self, k):
        """Engrossa a haste em torno do próprio eixo — correção de tamanho pequeno."""
        if k == 1.0:
            return self.haste
        x0, _, x1, _ = bbox(self.haste.pontos())
        eixo = (x0 + x1) / 2
        return self.haste.transformado(lambda p: (eixo + (p[0] - eixo) * k, p[1]))

    def pingo_escalado(self, k):
        if k == 1.0:
            return self.pingo
        x0, y0, x1, y1 = bbox(self.pingo.pontos())
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        return self.pingo.transformado(lambda p: (cx + (p[0] - cx) * k, cy + (p[1] - cy) * k))


# ── Rasterização ─────────────────────────────────────────────────────────────

def render(simbolo, size, coverage, width_k=1.0, dot_k=1.0,
           largura=None, bg=BG, fg=FG, transparent=False):
    """
    size      — lado final em px (ou altura, se `largura` vier)
    coverage  — fração do lado ocupada pela MAIOR dimensão do blob
    width_k   — engrossamento da haste do "!"
    dot_k     — fator do raio do pingo

    Não existe `dot_dy`. O vão entre haste e pingo é aberto na própria marca,
    e empurrar o pingo aqui só serviria para tampar defeito de geometria.
    """
    largura = largura or size
    W, H = largura * SS, size * SS
    mode = 'RGBA' if transparent else 'RGB'
    base = (0, 0, 0, 0) if transparent else bg
    img = Image.new(mode, (W, H), base)
    d = ImageDraw.Draw(img)

    x0, y0, x1, y1 = simbolo.bbox
    span = max(x1 - x0, y1 - y0)
    scale = (min(W, H) * coverage) / span
    # centraliza o blob pelo seu bbox real, não pelo viewBox
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    ox, oy = W / 2 - cx * scale, H / 2 - cy * scale

    def T(p):
        return (p[0] * scale + ox, p[1] * scale + oy)

    fill = fg + (255,) if transparent else fg
    hole = bg + (255,) if transparent else bg

    d.polygon([T(p) for p in simbolo.blob.pontos()], fill=fill)
    d.polygon([T(p) for p in simbolo.haste_engrossada(width_k).pontos()], fill=hole)
    d.polygon([T(p) for p in simbolo.pingo_escalado(dot_k).pontos()], fill=hole)

    return img.resize((largura, size), Image.LANCZOS)


def write_ico(path, images):
    """ICO com entradas PNG (suportado por todos os navegadores atuais)."""
    blobs = []
    for im in images:
        buf = BytesIO()
        im.convert('RGBA').save(buf, format='PNG', optimize=True)
        blobs.append(buf.getvalue())
    n = len(blobs)
    header = struct.pack('<HHH', 0, 1, n)
    offset = 6 + 16 * n
    entries, data = b'', b''
    for im, blob in zip(images, blobs):
        w = 0 if im.width >= 256 else im.width
        h = 0 if im.height >= 256 else im.height
        entries += struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(blob), offset)
        offset += len(blob)
        data += blob
    with open(path, 'wb') as f:
        f.write(header + entries + data)


def emit_svg(simbolo, path, coverage, width_k=1.0, dot_k=1.0,
             bg=None, fg='#c6ff00', label='Auê!'):
    """
    Emite o símbolo como SVG vetorial já com os ajustes ópticos do raster.

    `bg=None` → fundo transparente (aba fixada do Safari, mascarada pelo SO).
    Sai em curva, não em polígono: a correção óptica é afim e a Bézier aguenta
    ser transformada pelos pontos de controle.
    """
    x0, y0, x1, y1 = simbolo.bbox
    lado = 320.0
    s = coverage * lado / max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2

    def f(v):
        t = '%.2f' % v
        return t.rstrip('0').rstrip('.') if '.' in t else t

    def enquadrar(p):
        return ((p[0] - cx) * s, (p[1] - cy) * s)

    d = ' '.join(
        sub.transformado(enquadrar).d(f)
        for sub in (simbolo.blob, simbolo.haste_engrossada(width_k), simbolo.pingo_escalado(dot_k))
    )

    rect = ('  <rect x="-160" y="-160" width="320" height="320" fill="%s"/>\n' % bg) if bg else ''
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-160 -160 320 320" '
        'width="320" height="320" role="img" aria-label="%s">\n'
        '  <title>%s</title>\n'
        '%s'
        '  <path fill="%s" fill-rule="evenodd" d="%s"/>\n'
        '</svg>\n'
    ) % (label, label, rect, fg, d)
    with open(path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(svg)


# ── Folhas de comparação das candidatas ──────────────────────────────────────

TAMANHOS_DE_COMPARACAO = (16, 32, 64, 180)


def build_candidatas():
    """Rasteriza cada SVG de `assets/candidatas/` nos tamanhos que decidem."""
    if not os.path.isdir(CANDIDATAS):
        print('sem assets/candidatas/, nada a comparar')
        return
    for nome in sorted(os.listdir(CANDIDATAS)):
        if not nome.endswith('.svg'):
            continue
        simbolo = Simbolo(ler_d(os.path.join(CANDIDATAS, nome)))
        base = nome[:-4]
        for tam in TAMANHOS_DE_COMPARACAO:
            render(simbolo, tam, 0.94).save(
                os.path.join(CANDIDATAS, '%s-%d.png' % (base, tam)), optimize=True)
        print('  ', base, '→', ' '.join(str(t) for t in TAMANHOS_DE_COMPARACAO))


# ── Conjunto oficial (Brutalista A!) ─────────────────────────────────────────

POLY_A_OUTER = [
    (30, 0), (200, 1760), (797, 1760), (964, 0),
    (631, 0), (606, 284), (394, 284), (372, 0)
]
POLY_A_INNER = [
    (419, 565), (579, 565), (502, 1460), (486, 1460)
]
dx = 994
POLY_EX_STEM = [
    (dx+125, 479), (dx+55, 1760), (dx+413, 1760), (dx+343, 479)
]
POLY_EX_DOT = [
    (dx+55, 1), (dx+55, 299), (dx+413, 299), (dx+413, 1)
]

FG_A = (0xF5, 0xF4, 0xEF)
FG_EX = (0xC6, 0xFF, 0x00)

def render_brutalist(width, height, coverage=0.88, bg=BG, fg_a=FG_A, fg_ex=FG_EX, transparent=False):
    W, H = width * SS, height * SS
    mode = 'RGBA' if transparent else 'RGB'
    base = (0, 0, 0, 0) if transparent else bg
    img = Image.new(mode, (W, H), base)
    d = ImageDraw.Draw(img)

    span = 1760.0
    scale = (min(W, H) * coverage) / span
    cx, cy = (30.0 + 1407.0) / 2.0, 1760.0 / 2.0
    ox, oy = W / 2.0 - cx * scale, H / 2.0 + cy * scale

    def T(p):
        return (p[0] * scale + ox, oy - p[1] * scale)

    fill_a = fg_a + (255,) if transparent else fg_a
    fill_ex = fg_ex + (255,) if transparent else fg_ex
    hole_a = (0, 0, 0, 0) if transparent else bg

    d.polygon([T(p) for p in POLY_A_OUTER], fill=fill_a)
    d.polygon([T(p) for p in POLY_A_INNER], fill=hole_a)
    d.polygon([T(p) for p in POLY_EX_STEM], fill=fill_ex)
    d.polygon([T(p) for p in POLY_EX_DOT], fill=fill_ex)

    return img.resize((width, height), Image.LANCZOS)

def emit_brutalist_svg(path, coverage=0.88, bg=None, fg_a='#f5f4ef', fg_ex='#c6ff00'):
    lado = 512.0
    span = 1760.0
    s = coverage * lado / span
    cx = (30.0 + 1407.0) / 2.0
    cy = 1760.0 / 2.0
    ox = lado / 2.0 - cx * s
    oy = lado / 2.0 + cy * s

    def T(p):
        return (round(p[0] * s + ox, 1), round(oy - p[1] * s, 1))

    pts_a_out = ' '.join(f'L{T(p)[0]} {T(p)[1]}' for p in POLY_A_OUTER[1:])
    pts_a_in = ' '.join(f'L{T(p)[0]} {T(p)[1]}' for p in POLY_A_INNER[1:])
    path_a = f'M{T(POLY_A_OUTER[0])[0]} {T(POLY_A_OUTER[0])[1]} {pts_a_out} Z M{T(POLY_A_INNER[0])[0]} {T(POLY_A_INNER[0])[1]} {pts_a_in} Z'

    pts_ex_stem = ' '.join(f'L{T(p)[0]} {T(p)[1]}' for p in POLY_EX_STEM[1:])
    pts_ex_dot = ' '.join(f'L{T(p)[0]} {T(p)[1]}' for p in POLY_EX_DOT[1:])
    path_ex = f'M{T(POLY_EX_STEM[0])[0]} {T(POLY_EX_STEM[0])[1]} {pts_ex_stem} Z M{T(POLY_EX_DOT[0])[0]} {T(POLY_EX_DOT[0])[1]} {pts_ex_dot} Z'

    rect = f'  <rect width="{int(lado)}" height="{int(lado)}" fill="{bg}"/>\n' if bg else ''
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {int(lado)} {int(lado)}" '
        f'width="{int(lado)}" height="{int(lado)}" role="img" aria-label="Auê!">\n'
        f'  <title>Auê!</title>\n'
        f'{rect}'
        f'  <path fill="{fg_a}" fill-rule="evenodd" d="{path_a}"/>\n'
        f'  <path fill="{fg_ex}" d="{path_ex}"/>\n'
        f'</svg>\n'
    )
    with open(path, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(svg)

def build_conjunto():
    os.makedirs(OUT, exist_ok=True)
    p = lambda n: os.path.join(OUT, n)

    # ── favicon ──────────────────────────────────────────────────────────────
    fav16 = render_brutalist(16, 16, 0.94)
    fav32 = render_brutalist(32, 32, 0.92)
    fav48 = render_brutalist(48, 48, 0.90)
    fav16.save(p('favicon-16.png'), optimize=True)
    fav32.save(p('favicon-32.png'), optimize=True)
    fav48.save(p('favicon-48.png'), optimize=True)
    write_ico(p('favicon.ico'), [fav16, fav32, fav48])

    # ── iOS ──────────────────────────────────────────────────────────────────
    render_brutalist(180, 180, 0.80).save(p('apple-touch-icon.png'), optimize=True)

    # ── Android / PWA ────────────────────────────────────────────────────────
    render_brutalist(192, 192, 0.85).save(p('android-chrome-192.png'), optimize=True)
    render_brutalist(512, 512, 0.85).save(p('android-chrome-512.png'), optimize=True)
    # maskable: conteúdo dentro do círculo de segurança de 80% do lado
    render_brutalist(192, 192, 0.68).save(p('maskable-192.png'), optimize=True)
    render_brutalist(512, 512, 0.68).save(p('maskable-512.png'), optimize=True)

    # ── prévia de link ───────────────────────────────────────────────────────
    render_brutalist(1200, 630, 0.60).save(p('og-image.png'), optimize=True)

    # ── vetoriais ────────────────────────────────────────────────────────────
    emit_brutalist_svg(p('favicon.svg'), coverage=0.88, bg='#0a0a08', fg_a='#f5f4ef', fg_ex='#c6ff00')
    emit_brutalist_svg(p('safari-pinned-tab.svg'), coverage=0.88, bg=None, fg_a='#000000', fg_ex='#000000')

    print('conjunto brutalista gerado com sucesso')
    for f in sorted(os.listdir(OUT)):
        print(' ', f, os.path.getsize(os.path.join(OUT, f)), 'bytes')


def copiar_para_public():
    """
    O conjunto só vale se chegar no jogo.

    Antes alguém tinha copiado à mão, uma vez, e `public/` ficou uma geração
    atrás do design system. O `sincroniaDosIcones.test.ts` reprova se isso
    voltar a acontecer.
    """
    print('\npara public/:')
    for origem, destino in PARA_PUBLIC:
        shutil.copyfile(os.path.join(OUT, origem), os.path.join(PUBLIC, destino))
        print('  ', origem, '→', 'public/%s' % destino)


def main():
    if '--candidatas' in sys.argv:
        build_candidatas()
        return
    build_conjunto()
    build_candidatas()
    copiar_para_public()


if __name__ == '__main__':
    main()
