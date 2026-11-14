"""Gera os G-codes de teste da CNC Plotter (caneta M3 S220 / M5, pausa G4 P0.3)."""
import os
DOWN, UP = "M3 S220\nG4 P0.3\n", "M5\nG4 P0.3\n"
HEAD = "G21\nG90\nM5\nG4 P0.3\n"
END = "M5\nG4 P0.3\nG0 X0 Y0\n; fim\n"

def poly(pts, f):
    s = f"G0 X{pts[0][0]:.3f} Y{pts[0][1]:.3f}\n" + DOWN
    for x, y in pts[1:]:
        s += f"G1 X{x:.3f} Y{y:.3f} F{f}\n"
    return s + UP

def circle(cx, cy, r, f):
    return (f"G0 X{cx+r:.3f} Y{cy:.3f}\n" + DOWN +
            f"G2 X{cx+r:.3f} Y{cy:.3f} I{-r:.3f} J0 F{f}\n" + UP)

out = "gcode/testes"
# 1) quadrado + círculo (primeiro desenho da máquina), agora em F500
g = "; teste_quadrado_circulo - quadrado 100 x 100 mm + círculo r=30 mm, F500\n" + HEAD
g += poly([(10,10),(110,10),(110,110),(10,110),(10,10)], 500) + circle(60, 60, 30, 500) + END
open(f"{out}/teste_quadrado_circulo_F500.gcode", "w").write(g)

# 2) diagnóstico de velocidade: 4 círculos r=40 + retas nos dois sentidos (teste A)
g = "; teste_velocidades - circulos r=40 em F500/F1000/F2000/F4000; retas de 400 mm (X) e 360 mm (Y) nos dois sentidos em F1500\n"
g += "; use numa cartolina (canto em 0,0). Compare as ondulações das curvas entre as velocidades.\n" + HEAD
for i, f in enumerate((500, 1000, 2000, 4000)):
    cx = 60 + i * 100
    g += f"; circulo F{f}\n" + circle(cx, 320, 40, f)
g += "; retas X (ida e volta)\n" + poly([(10, 250), (410, 250)], 1500) + poly([(410, 240), (10, 240)], 1500)
g += "; retas Y (ida e volta)\n" + poly([(450, 10), (450, 370)], 1500) + poly([(460, 370), (460, 10)], 1500)
g += END
open(f"{out}/teste_velocidades.gcode", "w").write(g)

# 3) escala: régua de 150 mm em X e 100 mm em Y com marcas a cada 10 mm
g = "; teste_escala - réguas de 150 mm (X) e 100 mm (Y), marcas a cada 10 mm, F500\n"
g += "; meça com paquímetro/régua: 150,0 mm e 100,0 mm. Se der diferente: $100 novo = $100 x (comandado / medido)\n" + HEAD
g += poly([(20, 20), (170, 20)], 500) + poly([(20, 20), (20, 120)], 500)
for k in range(16):
    x = 20 + 10 * k; h = 6 if k % 5 == 0 else 3
    g += poly([(x, 20), (x, 20 + h)], 500)
for k in range(11):
    y = 20 + 10 * k; h = 6 if k % 5 == 0 else 3
    g += poly([(20, y), (20 + h, y)], 500)
g += END
open(f"{out}/teste_escala.gcode", "w").write(g)

# 4) caneta: sobe e desce 5 vezes parada, depois 5 tracinhos (confere S220 e a pausa)
g = "; teste_caneta - 5 tracinhos de 10 mm; confira se cada um começa e termina nítido\n" + HEAD
for k in range(5):
    g += poly([(20 + 8 * k, 20), (20 + 8 * k, 30)], 500)
g += END
open(f"{out}/teste_caneta.gcode", "w").write(g)
print(os.listdir(out))
