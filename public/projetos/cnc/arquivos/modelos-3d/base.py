"""Base_CNC_Shield - suporte baixo (4 mm) para Arduino Uno + CNC Shield, parafusado no tampo de pinus.
CadQuery. Gera Base_CNC_Shield.step e Base_CNC_Shield.stl na pasta atual."""
import cadquery as cq

# ---- Arduino Uno (origem no canto inferior esquerdo, lado USB/DC em x=0) ----
PCB_L, PCB_W = 68.58, 53.34
HOLES = [(13.97, 2.54), (15.24, 50.80), (66.04, 7.62), (66.04, 35.56)]

# ---- parâmetros da peça ----
H_BOSS   = 4.0    # altura do pilar = altura do fundo da placa até a mesa
H_FRAME  = 2.5    # espessura do quadro (abaixo da placa, fora da área dela)
H_EAR    = 4.0    # orelhas de fixação na madeira
FOLGA    = 0.5    # quadro começa 0,5 mm fora do contorno da placa
W_FRAME  = 4.0
D_BOSS   = 6.0
D_PILOT  = 2.6    # M3 autoatarraxante no PLA
W_RIB    = 3.0
EAR_L, EAR_W = 12.0, 14.0
D_M4, D_CSK = 4.4, 8.6   # M4 cabeça chata (escareado 90°)

x0, y0 = -FOLGA - W_FRAME, -FOLGA - W_FRAME
x1, y1 = PCB_L + FOLGA + W_FRAME, PCB_W + FOLGA + W_FRAME

def box(xa, ya, xb, yb, h):
    return (cq.Workplane("XY").box(xb - xa, yb - ya, h, centered=False)
            .translate((xa, ya, 0)))

# quadro com janela (nada fica embaixo dos pinos soldados)
frame = box(x0, y0, x1, y1, H_FRAME).cut(
    box(-FOLGA, -FOLGA, PCB_L + FOLGA, PCB_W + FOLGA, H_FRAME))

# nervuras ligando cada pilar ao quadro, pelo caminho mais curto (zonas sem componentes)
ribs = [
    box(HOLES[0][0] - W_RIB/2, -FOLGA, HOLES[0][0] + W_RIB/2, HOLES[0][1], H_FRAME),
    box(HOLES[1][0] - W_RIB/2, HOLES[1][1], HOLES[1][0] + W_RIB/2, PCB_W + FOLGA, H_FRAME),
    box(HOLES[2][0], HOLES[2][1] - W_RIB/2, PCB_L + FOLGA, HOLES[2][1] + W_RIB/2, H_FRAME),
    box(HOLES[3][0], HOLES[3][1] - W_RIB/2, PCB_L + FOLGA, HOLES[3][1] + W_RIB/2, H_FRAME),
]
part = frame
for r in ribs:
    part = part.union(r)

for (hx, hy) in HOLES:
    part = part.union(cq.Workplane("XY").circle(D_BOSS/2).extrude(H_BOSS).translate((hx, hy, 0)))

# orelhas: esquerda entre o USB e o jack DC (y ~ 15–28), direita centralizada
EAR_LEFT_Y, EAR_RIGHT_Y = 21.5, PCB_W/2
ears = [
    (x0 - EAR_L, EAR_LEFT_Y - EAR_W/2, x0 + W_FRAME, EAR_LEFT_Y + EAR_W/2),
    (x1 - W_FRAME, EAR_RIGHT_Y - EAR_W/2, x1 + EAR_L, EAR_RIGHT_Y + EAR_W/2),
]
for (a, b, c, d) in ears:
    part = part.union(box(a, b, c, d, H_EAR).edges("|Z").fillet(1.5))

# furos M4 escareados nas orelhas
for cx, cy in [(x0 - EAR_L/2, EAR_LEFT_Y), (x1 + EAR_L/2, EAR_RIGHT_Y)]:
    part = part.cut(cq.Workplane("XY").circle(D_M4/2).extrude(H_EAR).translate((cx, cy, 0)))
    csk = cq.Solid.makeCone(D_M4/2, D_CSK/2, (D_CSK - D_M4)/2,
                            pnt=cq.Vector(cx, cy, H_EAR - (D_CSK - D_M4)/2))
    part = part.cut(cq.Workplane().add(csk))

# furos-piloto dos pilares (passantes)
for (hx, hy) in HOLES:
    part = part.cut(cq.Workplane("XY").circle(D_PILOT/2).extrude(H_BOSS).translate((hx, hy, 0)))

cq.exporters.export(part, "Base_CNC_Shield.step")
cq.exporters.export(part, "Base_CNC_Shield.stl", tolerance=0.02, angularTolerance=0.1)

bb = part.val().BoundingBox()
print("dims %.1f x %.1f x %.1f mm" % (bb.xlen, bb.ylen, bb.zlen))
print("volume %.2f cm3 -> ~%.1f g PLA (100%%)" % (part.val().Volume()/1000, part.val().Volume()/1000*1.24))
print("valid:", part.val().isValid(), "solids:", len(part.solids().vals()))
