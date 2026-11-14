"""Pôster F-16 para cartolina: 385 x 600 mm (retrato; vai deitado na máquina)."""
import json
import numpy as np
import vpype as vp

MM = 96 / 25.4
W, H = 385.0, 600.0
lc_all = vp.LineCollection()      # desenho, moldura, tabela (camada 1)
lc_txt = vp.LineCollection()      # textos (camada 2, não passa pelo filtro de sujeira)

def add_poly(pts):
    lc_all.append(np.asarray([complex(x*MM, y*MM) for x, y in pts]))

def _cap10(font):
    b = vp.text_line('H', font, 10.0).bounds(); return b[3] - b[1]

import unicodedata
MARKS = {'\u0301': 'acute', '\u0303': 'tilde', '\u0327': 'cedilla', '\u0302': 'circ', '\u0300': 'grave'}

def split_accents(t):
    """'TRIPULAÇÃO' -> ('TRIPULACAO', [(5,'cedilla'), (6,'tilde')])"""
    base, marks = '', []
    for ch in t:
        d = unicodedata.normalize('NFD', ch)
        base += d[0]
        for m in d[1:]:
            if m in MARKS: marks.append((len(base) - 1, MARKS[m]))
    return base, marks

def text_width(t, cap, font='futural'):
    t, _ = split_accents(t)
    b = vp.text_line(t, font, 10.0).bounds(); return (b[2]-b[0]) * cap / _cap10(font)

def text(t, x, y, cap, font='futural', align='left'):
    """cap = altura da maiúscula em mm; y = linha de base. Acentos desenhados como traços."""
    base, marks = split_accents(t)
    size = cap / _cap10(font) * 10.0 * MM
    lc = vp.text_line(base, font, size, align='left')
    ref = vp.text_line('H', font, size).bounds()
    top, bot = ref[1], ref[3]                  # topo e base da maiúscula (px)
    c = bot - top                              # altura da maiúscula (px)
    for i, kind in marks:
        right = vp.text_line(base[:i+1], font, size).bounds()[2]
        gb = vp.text_line(base[i], font, size).bounds()
        cx = right - (gb[2] - gb[0]) / 2
        if kind == 'acute':
            pts = [(cx - 0.10*c, top - 0.12*c), (cx + 0.16*c, top - 0.40*c)]
        elif kind == 'grave':
            pts = [(cx + 0.10*c, top - 0.12*c), (cx - 0.16*c, top - 0.40*c)]
        elif kind == 'circ':
            pts = [(cx - 0.22*c, top - 0.12*c), (cx, top - 0.38*c), (cx + 0.22*c, top - 0.12*c)]
        elif kind == 'tilde':
            xs = np.linspace(-0.30, 0.30, 13)
            pts = [(cx + u*c, top - 0.25*c - 0.09*c*np.sin(u/0.30*np.pi)) for u in xs]
        else:  # cedilha
            pts = [(cx + 0.02*c, bot), (cx + 0.02*c, bot + 0.10*c), (cx + 0.16*c, bot + 0.20*c),
                   (cx + 0.02*c, bot + 0.34*c), (cx - 0.12*c, bot + 0.30*c)]
        lc.append(np.array([complex(px, py) for px, py in pts]))
    b = vp.text_line(base, font, size, align='left').bounds()
    dx = x*MM - (b[0] if align == 'left' else (b[0] + b[2]) / 2)
    lc.translate(dx, y*MM - (top + cap*MM))
    lc_txt.extend(lc)

# ---------- moldura ----------
M = 10.0
add_poly([(M, M), (W-M, M), (W-M, H-M), (M, H-M), (M, M)])

# ---------- título ----------
text('F-16 FIGHTING FALCON', W/2, 50, 17.0, font='futuram', align='center')

# ---------- desenho ----------
lines = json.load(open('lines_px_nomid.json'))
allp = np.concatenate([np.array(l) for l in lines])
x0, y0 = allp.min(0); x1, y1 = allp.max(0)
DW = 340.0
s = DW / (x1 - x0)
ox = (W - DW) / 2 - x0 * s
oy = 70.0 - y0 * s
P = lambda x, y: (x * s + ox, y * s + oy)

# cota: une as duas metades da linha de cima e abre espaço só para o texto
DIM_LABEL = "9,96 M"
DIM_CAP = 4.2
xc_px, yl_px = (351.2 + 376.5) / 2, 265.6
half_gap_px = (text_width(DIM_LABEL, DIM_CAP) / 2 + 3.0) / s
for l in lines:
    a = np.array(l)
    is_dim_low = a[:,1].min() > 282 and a[:,1].max() < 285 and np.ptp(a[:,0]) > 100
    if is_dim_low:
        continue                                   # linha de cota antiga (de baixo): sai
    is_dim_top = a[:,1].min() > 264 and a[:,1].max() < 267 and np.ptp(a[:,0]) > 200
    if is_dim_top:
        if a[:,0].max() < xc_px:                   # metade esquerda
            a = np.array([[a[:,0].min(), yl_px], [xc_px - half_gap_px, yl_px]])
        else:                                      # metade direita
            a = np.array([[xc_px + half_gap_px, yl_px], [a[:,0].max(), yl_px]])
    add_poly([P(x, y) for x, y in a])
cx, cy = P(xc_px, yl_px)
text(DIM_LABEL, cx, cy + DIM_CAP/2, DIM_CAP, align='center')
draw_bottom = y1 * s + oy
print('escala %.3f mm/px | desenho %.1f a %.1f mm' % (s, y0*s+oy, draw_bottom))

# ---------- tabela ----------
heads = ['CARACTERÍSTICAS GERAIS', 'DESEMPENHO', 'ARMAMENTO']
c1 = ['TRIPULAÇÃO: 1',
      'COMPRIMENTO: 15,06 M',
      'ENVERGADURA: 9,96 M',
      'ALTURA: 4,9 M',
      'PESO VAZIO: 8.573 KG',
      'PESO MÁX. DE DECOLAGEM: 19.187 KG',
      'MOTOR: 1 X P&W F100-PW-229',
      'EMPUXO SECO: 79,2 KN',
      'EMPUXO COM PÓS-COMBUSTÃO: 129,7 KN']
c2 = ['VELOCIDADE MÁX.: MACH 2,05',
      '(2.178 KM/H A 12.200 M)',
      'ALCANCE DE COMBATE: 546 KM',
      'ALCANCE DE TRASLADO: 4.217 KM',
      'TETO DE SERVIÇO: 15.000 M']
c3 = ['CANHÃO M61A1 VULCAN 20 MM',
      '(500 PROJÉTEIS)',
      '11 PONTOS DE FIXAÇÃO',
      '(ATÉ 7.700 KG)',
      'AIM-9 SIDEWINDER',
      'AIM-120 AMRAAM',
      'AGM-65 MAVERICK',
      'AGM-88 HARM',
      'GBU-12, JDAM, MK 84']
cols_txt = [c1, c2, c3]
TX0, TX1 = 20.0, W - 20.0
PAD = 3.0
CAP = 4.6
while True:
    need = [max(text_width(t, CAP) for t in col + [h]) + 2*PAD for col, h in zip(cols_txt, heads)]
    if sum(need) <= TX1 - TX0 or CAP < 2.5:
        break
    CAP -= 0.05
extra = (TX1 - TX0 - sum(need)) / 3
widths = [n + extra for n in need]
cols = [TX0, TX0 + widths[0], TX0 + widths[0] + widths[1], TX1]
RH = CAP * 2.4
HH = CAP * 2.6
n = max(map(len, cols_txt))
TY0 = draw_bottom + 12.0
TY1 = TY0 + HH + n * RH
add_poly([(TX0, TY0), (TX1, TY0), (TX1, TY1), (TX0, TY1), (TX0, TY0)])
add_poly([(TX0, TY0 + HH), (TX1, TY0 + HH)])
for x in cols[1:-1]:
    add_poly([(x, TY0), (x, TY1)])
for i, h in enumerate(heads):
    text(h, (cols[i] + cols[i+1]) / 2, TY0 + HH/2 + CAP/2, CAP, font='futuram', align='center')
for k in range(1, n):
    y = TY0 + HH + k * RH
    add_poly([(cols[0], y), (cols[1], y)])
for ci, col in enumerate(cols_txt):
    for k, t in enumerate(col):
        text(t, cols[ci] + PAD, TY0 + HH + k*RH + RH/2 + CAP/2, CAP)
print('tabela: letra %.2f mm, %.1f a %.1f mm, colunas %s' % (CAP, TY0, TY1, [round(w,1) for w in widths]))

# ---------- rodapé ----------
FY = (TY1 + (H - M)) / 2 + 3.5
text('PRIMEIRO VOO: 20 DE JANEIRO DE 1974', W/2, FY, 7.0, font='futural', align='center')
print('rodapé (linha de base) em %.1f mm' % FY)

doc = vp.Document(page_size=(W*MM, H*MM))
doc.add(lc_all, 1)
doc.add(lc_txt, 2)
with open('f16c_raw.svg', 'w') as f:
    vp.write_svg(f, doc, page_size=(W*MM, H*MM), center=False, source_string='F-16 poster cartolina')
