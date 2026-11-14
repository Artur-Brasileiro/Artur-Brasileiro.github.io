"""svg_para_gcode.py - converte qualquer SVG em G-code para a CNC Plotter do Artur.

O que faz (via vpype):
  1. lê o SVG;
  2. junta traços que se encostam, simplifica e tira sujeira (< 0,6 mm);
  3. ordena os traços para a caneta andar o mínimo possível levantada;
  4. escala/posiciona o desenho na área de papel escolhida;
  5. gera G-code com caneta M3 S220 (embaixo) / M5 (em cima), pausa G4 P0.3
     para o servo e velocidade FIXA (padrão F500) em todas as linhas G1.

Uso:
  python svg_para_gcode.py desenho.svg                      -> A4 deitado, F500
  python svg_para_gcode.py desenho.svg --papel 600x385      -> cartolina, área 600 x 385 mm
  python svg_para_gcode.py desenho.svg --papel a3 --margem 15 --rotacao 90 --f 500

Requer: pip install vpype vpype-gcode
A origem (0,0) da máquina é o canto da frente à esquerda; o papel é colocado com o canto nela.
"""
import argparse, os, subprocess, sys, tempfile, textwrap

AREA_MAX = (810.0, 390.0)          # curso útil da máquina ($130 / $131), em mm
PAPEIS = {"a4": (297.0, 210.0), "a3": (420.0, 297.0), "cartolina": (600.0, 385.0)}

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("svg")
    ap.add_argument("--papel", default="a4", help="a4 | a3 | cartolina | LxA em mm (ex.: 600x385). Sempre deitado (L no eixo X).")
    ap.add_argument("--margem", type=float, default=10.0, help="margem dentro do papel, mm (padrão 10)")
    ap.add_argument("--rotacao", type=float, default=0.0, help="girar o desenho (graus, ex.: 90 ou -90)")
    ap.add_argument("--f", type=int, default=500, help="velocidade de desenho em mm/min (padrão 500)")
    ap.add_argument("--s", type=int, default=220, help="valor S da caneta embaixo (padrão 220)")
    ap.add_argument("--pausa", type=float, default=0.3, help="pausa do servo em s (padrão 0.3)")
    ap.add_argument("--sem-ajuste", action="store_true", help="não escalar: mantém o tamanho do SVG e só centraliza")
    ap.add_argument("-o", "--saida", default=None)
    a = ap.parse_args()

    p = a.papel.lower()
    W, H = PAPEIS[p] if p in PAPEIS else tuple(float(v) for v in p.split("x"))
    if W < H: W, H = H, W                                    # sempre deitado na mesa
    if W > AREA_MAX[0] or H > AREA_MAX[1]:
        sys.exit(f"Papel {W:.0f} x {H:.0f} mm passa da área útil da máquina ({AREA_MAX[0]:.0f} x {AREA_MAX[1]:.0f} mm).")

    saida = a.saida or os.path.splitext(a.svg)[0] + ".gcode"
    toml = textwrap.dedent(f"""
    [gwrite.cnc_artur]
    unit = "mm"
    invert_y = true
    document_start = "; {os.path.basename(a.svg)} - papel {W:.0f} x {H:.0f} mm (canto em 0,0) - F{a.f}\\n; Caneta: M3 S{a.s} = embaixo | M5 = em cima\\nG21\\nG90\\nM5\\nG4 P{a.pausa}\\n"
    segment_first = "G0 X{{x:.3f}} Y{{y:.3f}}\\nM3 S{a.s}\\nG4 P{a.pausa}\\n"
    segment = "G1 X{{x:.3f}} Y{{y:.3f}} F{a.f}\\n"
    line_end = "M5\\nG4 P{a.pausa}\\n"
    document_end = "M5\\nG4 P{a.pausa}\\nG0 X0 Y0\\n; fim\\n"
    """)
    with tempfile.NamedTemporaryFile("w", suffix=".toml", delete=False) as f:
        f.write(toml); cfg = f.name

    cmd = ["vpype", "-c", cfg, "read", a.svg,
           "linemerge", "--tolerance", "0.35mm",
           "linesimplify", "--tolerance", "0.03mm",
           "filter", "--min-length", "0.6mm",
           "reloop"]
    if a.rotacao:
        cmd += ["rotate", "--", str(a.rotacao)]
    if a.sem_ajuste:
        cmd += ["layout", "--landscape", f"{W}mmx{H}mm"]
    else:
        cmd += ["layout", "--landscape", "--fit-to-margins", f"{a.margem}mm", f"{W}mmx{H}mm"]
    cmd += ["lmove", "all", "1", "linesort", "--two-opt", "gwrite", "-p", "cnc_artur", saida]
    print(" ".join(cmd))
    subprocess.run(cmd, check=True)
    os.unlink(cfg)

    # resumo
    import math, re
    X = Y = 0.0; ld = lu = 0.0; n = 0; xs = []; ys = []
    for line in open(saida):
        if line.startswith("M3"): n += 1
        m = re.match(r"G([01]) X([-\d.]+) Y([-\d.]+)", line)
        if m:
            x, y = float(m[2]), float(m[3]); d = math.hypot(x - X, y - Y)
            if m[1] == "1": ld += d
            else: lu += d
            X, Y = x, y
            if (x, y) != (0, 0): xs.append(x); ys.append(y)
    t = ld / (a.f / 60) + lu / 120 + n * (2 * a.pausa + 0.25)
    print(f"\n{saida}\n  X {min(xs):.1f}..{max(xs):.1f}  Y {min(ys):.1f}..{max(ys):.1f} mm")
    print(f"  traço {ld/1000:.2f} m | caneta levantada {lu/1000:.2f} m | {n} descidas | ~{t/60:.0f} min")

if __name__ == "__main__":
    main()
