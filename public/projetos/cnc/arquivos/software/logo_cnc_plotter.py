"""Logo CNC PLOTTER (Artur) - engrenagem + caneta esferografica + traco + texto.
Tudo em linhas de traco unico (para plotter). Unidades em mm.
Uso:  python logo_cnc_plotter.py   -> gera logo_cnc_plotter.svg
Requer: numpy, shapely, vpype"""
import numpy as np, vpype as vp
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import unary_union
from shapely import affinity

def bez(P, n=60):
    P = np.array(P, float); t = np.linspace(0, 1, n)[:, None]
    return (1-t)**3*P[0] + 3*(1-t)**2*t*P[1] + 3*(1-t)*t**2*P[2] + t**3*P[3]

def text_lines(t, x, y, h, align='left', font='futural'):
    b = vp.text_line('A', font, size=10).bounds(); cap = b[3]-b[1]
    lc = vp.text_line(t, font, size=10*h/cap, align=align)
    yb = vp.text_line('A', font, size=10*h/cap).bounds()[3]
    return [np.c_[x+l.real, y+yb-l.imag] for l in lc]

def arc(cx, cy, r, a0, a1, n=24):
    a = np.radians(np.linspace(a0, a1, n)); return list(zip(cx+r*np.cos(a), cy+r*np.sin(a)))

def logo():
    out = []
    Z, Ro, Rr = 12, 36, 29.5; th = 2*np.pi/Z; pts = []
    for k in range(Z):
        a = k*th + th/4
        for ang, r in [(a-th/2, Rr), (a-th*0.24, Rr), (a-th*0.13, Ro), (a+th*0.13, Ro), (a+th*0.24, Rr)]:
            pts.append((r*np.cos(ang), r*np.sin(ang)))
    gear = Polygon(pts); hole = Point(0, 0).buffer(13, resolution=32)
    W = 6.0
    body = Polygon([(0,0),(1.2,2.5),(3.2,9),(W-0.8,13),(W-0.8,26),(W,27),(W,78)] + arc(0,78,W,0,180)[1:-1] +
                   [(-W,78),(-W,27),(-W+0.8,26),(-W+0.8,13),(-3.2,9),(-1.2,2.5)])
    rings = [LineString([(-W+0.8,y),(W-0.8,y)]) for y in (13,26)] + [LineString([(-W,30),(W,30)])]
    grips = [LineString([(-W+0.8,y),(W-0.8,y)]) for y in (17.5,21.5)]
    clip = Polygon([(W,52)] + arc(W+2.2,54,2.2,-90,0)[1:] + [(W+4.4,76),(W+4.4,80),(W,80)])
    clipline = LineString(list(clip.exterior.coords))
    L = 84; tip = -L/2*np.array([np.cos(np.radians(45)), np.sin(np.radians(45))])
    place = lambda g: affinity.translate(affinity.rotate(g, -45, origin=(0,0)), *tip)
    body, clip, clipline = map(place, (body, clip, clipline))
    rings = list(map(place, rings)); grips = list(map(place, grips))
    mask = unary_union([body, clip]).buffer(2.2)
    for g in (gear.exterior, hole.exterior):
        d = LineString(g.coords).difference(mask)
        for s in getattr(d, 'geoms', [d]): out.append(np.array(s.coords))
    out.append(np.array(body.exterior.coords))
    d = clipline.difference(body.buffer(0.01))
    for s in getattr(d, 'geoms', [d]): out.append(np.array(s.coords))
    for r in rings + grips: out.append(np.array(r.coords))
    t = tuple(tip)
    out.append(bez([t, (t[0]+6, t[1]-28), (40,-52), (118,-50)]))
    out.append(bez([(118,-50), (150,-49), (168,-44), (178,-36)], 30))
    out += text_lines('CNC', 50, -12, 30)
    out += text_lines('P L O T T E R', 51, -36, 8.5)
    return out

if __name__ == "__main__":
    O = logo(); P = np.vstack(O); x0, y0 = P.min(0); x1, y1 = P.max(0); m = 2
    W, H = x1-x0+2*m, y1-y0+2*m
    with open("logo_cnc_plotter.svg", "w") as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.1f}mm" height="{H:.1f}mm" viewBox="0 0 {W:.2f} {H:.2f}">\n')
        f.write('<g fill="none" stroke="black" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round">\n')
        for l in O:
            f.write('<polyline points="' + " ".join(f"{x-x0+m:.2f},{y1-y+m:.2f}" for x, y in l) + '"/>\n')
        f.write('</g>\n</svg>\n')
    print("logo_cnc_plotter.svg: %.1f x %.1f mm, %d polilinhas" % (W, H, len(O)))
