# Exemplo real: pôster do F-16 (imagem → SVG → G-code)

Scripts usados para transformar uma imagem raster (JPG, 736 × 1104 px, borrada em várias partes)
no pôster de 385 × 600 mm desenhado na cartolina. Servem de modelo para outras imagens.

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `1_vetorizar_centerline.py` | Normaliza o fundo, amplia 4×, acha o **centro** de cada linha (filtro de crista Sato + limiar com histerese), preenche "células" de sombreado, esqueletiza, poda espinhos, suaviza e simplifica. Saída: `lines_px.json` (traços de linha única). |
| 2 | `2_remover_vista_do_meio.py` | Seleciona e remove os traços de uma das vistas (exemplo de edição seletiva por regiões). |
| 3 | `3_montar_poster.py` | Monta a folha: moldura, título, desenho escalado, cota, tabela e rodapé em fonte Hershey (traço único), com acentos desenhados à mão (a fonte não tem Ç, Ã, É…). |
| — | `plotter.toml` | Perfil do vpype-gcode da máquina (M3 S220 / M5, G4 P0.3, F500 em toda linha G1). |
| — | `renderizar_previa.py` | Renderiza o SVG simulando uma caneta de 0,5 mm, para conferir antes de plotar. |

Por que **centerline** e não "Vetorizar bitmap" do Inkscape: o Inkscape (potrace) contorna as **bordas** de cada linha,
e a caneta passaria duas vezes em cada traço. Para plotter o certo é traçar o **eixo** da linha, uma vez só.

Comandos (depois dos scripts):
```
vpype read f16c_raw.svg linemerge -l 1 --tolerance 0.35mm linesimplify -l 1 --tolerance 0.03mm \
  filter -l 1 --min-length 0.6mm reloop lmove all 1 linesort --two-opt write --page-size 385mmx600mm poster.svg
vpype -c plotter.toml read poster.svg rotate -- -90 layout --landscape 600mmx385mm linesort --two-opt gwrite -p cnc_artur poster.gcode
```
Resultado: ~2.200 traços, 26,5 m de caneta, ~84 min em F500.

Requer: `pip install opencv-python scikit-image skan shapely vpype vpype-gcode`
