"""Vetoriza o desenho do F-16 em traços de linha única (centerline) para plotter."""
import sys, json
import cv2, numpy as np
from skimage.morphology import skeletonize, remove_small_objects
from skan import Skeleton, summarize
from shapely.geometry import LineString

import os
SRC = os.environ.get('IMAGEM', 'f16.jpg')   # caminho da imagem de entrada
S = 4                       # fator de upscale
Y0, Y1 = 105, 792           # faixa vertical do desenho (sem título/tabela)
T = float(sys.argv[1]) if len(sys.argv) > 1 else 0.85   # limiar (fração do fundo)

# rótulos "Fig.x" e texto da cota (coord. da imagem original) -> apagar
LABELS = [(304,251,356,265),(88,276,117,291),(332,277,362,292),(373,277,401,292),
          (615,276,652,291),(277,401,304,416),(426,444,454,460),(353,472,380,488),
          (131,576,159,591),(290,576,318,591),(468,576,497,591),(446,713,474,729)]

g = cv2.imread(SRC, 0).astype(np.float32)
for x0,y0,x1,y1 in LABELS:
    g[y0:y1, x0:x1] = 245
g = g[Y0:Y1]

# normaliza pelo fundo (tira o cinza do papel e as variações de iluminação)
bg = cv2.morphologyEx(g, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))
bg = cv2.GaussianBlur(bg, (0,0), 5)
norm = np.clip(g / np.maximum(bg,1), 0, 1)

# upscale + detecção de crista (centro das linhas escuras) com histerese
from skimage.filters import sato, apply_hysteresis_threshold
up = cv2.resize(norm, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
r = sato(up, sigmas=[float(v) for v in (sys.argv[4] if len(sys.argv)>4 else "1.2,1.8").split(",")], black_ridges=True)
r = r / r.max()
RT = float(sys.argv[2]) if len(sys.argv) > 2 else 0.09
ink = apply_hysteresis_threshold(r, RT, RT*3) & (up < T)
ink = remove_small_objects(ink, max_size=60)
# fecha "células" minúsculas de sombreado (viram traço único no esqueleto)
HOLE = int(sys.argv[3]) if len(sys.argv) > 3 else 120
ink = ~remove_small_objects(~ink, max_size=HOLE)
sk = skeletonize(ink)
np.save('ink.npy', ink); np.save('sk.npy', sk)

# grafo do esqueleto -> poda de "espinhos" curtos
def paths_of(sk):
    s = Skeleton(sk)
    return s, summarize(s, separator='_')

for _ in range(3):
    s, df = paths_of(sk)
    spur = df[(df.branch_type == 1) & (df.branch_distance < 2.2*S)]
    if spur.empty: break
    for i in spur.index:
        coords = s.path_coordinates(i).astype(int)
        # mantém o ponto de junção
        for r,c in coords[1:-1]: sk[r,c] = False
        # remove a ponta (o lado com grau 1)
        r0,c0 = coords[0]; r1,c1 = coords[-1]
        for r,c in ((r0,c0),(r1,c1)):
            n = sk[max(r-1,0):r+2, max(c-1,0):c+2].sum()-1
            if n <= 1: sk[r,c] = False
    sk = skeletonize(sk)

s, df = paths_of(sk)
lines = []
for i in range(len(df)):
    pc = s.path_coordinates(i)
    if len(pc) < 2: continue
    pts = np.c_[pc[:,1], pc[:,0]] / S        # (x,y) em px da imagem original
    pts[:,1] += Y0
    # isolados muito curtos = sujeira
    if df.branch_type[i] == 0 and df.branch_distance[i] < 3*S: continue
    ls = LineString(pts)
    # suaviza (média móvel) mantendo as pontas, depois simplifica
    if len(pts) > 13:
        k = 6
        sm = pts.copy()
        for j in range(k, len(pts)-k):
            sm[j] = pts[j-k:j+k+1].mean(0)
        ls = LineString(sm)
    ls = ls.simplify(0.3)
    lines.append(np.asarray(ls.coords).round(3).tolist())

json.dump(lines, open('lines_px.json','w'))
print('threshold', T, 'paths', len(lines), 'total len px', round(sum(LineString(l).length for l in lines)))
