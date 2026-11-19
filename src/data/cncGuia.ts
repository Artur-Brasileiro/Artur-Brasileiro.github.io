/**
 * Guia "Monte a sua" da CNC plotter, na página /projeto/cnc-plotter.
 *
 * Tudo aqui vem do pacote do projeto (cnc-plotter-artur.zip: guia de montagem,
 * esquema de ligações, firmware, G-codes e especificacoes.json). Os arquivos
 * para baixar ficam em /projetos/cnc/arquivos/; o .zip de lá é o pacote, sem as
 * páginas de rascunho.
 *
 * Fotos: cada espaço de foto tem um id. Para pôr a foto, salve
 * public/projetos/cnc/fotos/<id>.webp (lado maior ~1600 px) e preencha `src`
 * com o nome do arquivo. Sem `src`, a página mostra o espaço reservado.
 */
import { tr, type Tx } from "@/i18n/core";

/** texto que muda com o idioma (tr) ou igual nos dois (string pura) */
type Text = string | Tx;
/** linha de tabela; depois do useLocalized vira o Row do kit (string[]) */
type Row = Text[];

const A = "/projetos/cnc/arquivos";
/** STL e STEP das peças impressas */
const P = `${A}/modelos-3d`;
export const IMG = "/projetos/cnc/imagens";
export const FOTOS = "/projetos/cnc/fotos";

export type Download = { label: Text; detail: Text; href: string };

/* ------------------------------------------------------------------ fotos */

export type Foto = {
  /** número na lista de fotos */
  n: string;
  title: Text;
  /** legenda na página */
  caption: Text;
  /** como fotografar (vai só para a lista de fotos) */
  how: string;
  ratio: "4/3" | "3/2" | "16/9" | "3/4" | "2/3" | "1/1";
  /** enquadramento quando a proporção corta a foto (object-position) */
  pos?: string;
  /** nome do arquivo em /projetos/cnc/fotos/; sem ele, aparece o espaço reservado */
  src?: string;
};

export const fotos = {
  maquinaInteira: {
    n: "01",
    title: tr("A máquina inteira", "The whole machine"),
    caption: tr("A máquina montada na mesa de pinus, com uma folha no lugar.", "The machine assembled on the pine table, with a sheet in place."),
    how: "De cima e um pouco de lado (três-quartos), pegando a mesa inteira. Luz do dia, ponte no meio do curso, com uma cartolina na mesa.",
    ratio: "4/3",
    pos: "50% 80%",
    src: "maquina-inteira.webp",
  },
  pecasImpressas: {
    n: "02",
    title: tr("Peças impressas", "Printed parts"),
    caption: tr(
      "Todas as peças, no modelo 3D: em preto as de PLA, em branco o carro e o Pen Holder v3, em PETG. O ×2 marca as que se imprime em dobro.",
      "All the parts, in the 3D model: PLA parts in black, the carriage and the Pen Holder v3 in white, in PETG. ×2 marks the ones you print twice.",
    ),
    how: "Render do modelo 3D com as peças soltas e os nomes.",
    ratio: "4/3",
    src: "pecas-impressas.webp",
  },
  suportes: {
    n: "03",
    title: tr("Suporte com a barra de 12 mm", "Support with the 12 mm rod"),
    caption: tr("Base em L + abraçadeira presas no tampo, segurando a barra de Ø12.", "L-shaped base + clamp screwed to the tabletop, holding the Ø12 rod."),
    how: "Close de um suporte alto (frente) com a barra presa, de lado, mostrando os 4 parafusos M3 e os M4 na madeira.",
    ratio: "4/3",
    pos: "50% 85%",
    src: "suportes.webp",
  },
  apoioBase: {
    n: "04",
    title: tr("Apoio Base", "Base Support"),
    caption: tr("Os dois LM12UU que guiam a ponte na barra do fundo, embaixo da Base Principal.", "The two LM12UU that guide the gantry on the back rod, under the Main Base."),
    how: "Por baixo ou bem de lado, mostrando os 2 rolamentos LM12UU na barra do fundo.",
    ratio: "1/1",
    src: "apoio-base.webp",
  },
  apoioSecundario: {
    n: "05",
    title: tr("Apoio Secundário", "Secondary Support"),
    caption: tr(
      "Um LM12UU só, que apoia sem guiar, e a polia louca dentada que faz a volta da correia do Y.",
      "A single LM12UU that supports without guiding, and the toothed idler pulley the Y belt turns around.",
    ),
    how: "Close do Apoio Secundário na barra da frente, mostrando o rolamento e a polia louca do Y.",
    ratio: "1/1",
    src: "apoio-secundario.webp",
  },
  omega: {
    n: "06",
    title: tr("A correia do X em ômega", "The X belt in omega"),
    caption: tr(
      "A correia parada passa por baixo das duas polias loucas e dá a volta na polia do motor.",
      "The fixed belt runs under the two idler pulleys and wraps around the motor pulley.",
    ),
    how: "Close de frente para a Base Principal, na altura da correia, mostrando o caminho em ômega (polia louca, polia do motor, polia louca).",
    ratio: "4/3",
    pos: "50% 40%",
    src: "omega.webp",
  },
  presilha: {
    n: "07",
    title: tr("Presilha da correia do Y", "Y belt clamp"),
    caption: tr(
      "A correia dá a volta no pino e trava dente com dente; o M3 no rasgo ajusta a tensão.",
      "The belt wraps around the pin and locks tooth to tooth; the M3 in the slot sets the tension.",
    ),
    how: "Close bem de perto de uma presilha presa no carro, com a correia travada.",
    ratio: "1/1",
    src: "presilha.webp",
  },
  carro: {
    n: "08",
    title: tr("Carro e Pen Holder v3", "Carriage and Pen Holder v3"),
    caption: tr("O carro v3 em PETG com o servo, a mola e a caneta presa.", "The PETG v3 carriage with the servo, the spring and the pen clamped in."),
    how: "De lado, na altura do carro, com a caneta presa e o servo aparecendo. Fundo limpo.",
    ratio: "1/1",
    src: "carro.webp",
  },
  canalV: {
    n: "09",
    title: tr("Caneta no canal em V", "Pen in the V-groove"),
    caption: tr("Os dois M3 empurram a caneta contra o canal em V, que centraliza de 3 a 12 mm.", "The two M3 screws push the pen into the V-groove, which centers anything from 3 to 12 mm."),
    how: "Close de frente para o Pen Holder, mostrando os 2 parafusos e a caneta encostada no V.",
    ratio: "1/1",
    src: "canal-v.webp",
  },
  fimDeCurso: {
    n: "10",
    title: tr("Fim de curso do Y", "Y limit switch"),
    caption: tr(
      "A chave com rolete, presa embaixo da Base Principal: o carro a aciona quando chega ao fundo. COM no GND, NO no sinal.",
      "The roller switch, mounted under the Main Base: the carriage presses it when it reaches the back. COM to GND, NO to signal.",
    ),
    how: "Close da chave do Y (ou da X) sendo acionada. Se der, uma foto de cada.",
    ratio: "1/1",
    src: "fim-de-curso.webp",
  },
  eletronicaMesa: {
    n: "11",
    title: tr("Eletrônica ligada, na borda da mesa", "Electronics wired up, at the table edge"),
    caption: tr(
      "Arduino + CNC Shield na base impressa, no meio da borda do fundo: motores em X e Y, fins de curso em X+ e Y+, servo no Z+.",
      "Arduino + CNC Shield on the printed base, in the middle of the back edge: motors on X and Y, limit switches on X+ and Y+, servo on Z+.",
    ),
    how: "De cima, bem de perto, com o shield montado no Arduino e todos os fios ligados. Nítido o bastante para ler as etiquetas do shield; se der, pegue também o step-down do servo.",
    ratio: "1/1",
    src: "eletronica-mesa.webp",
  },
  vref: {
    n: "12",
    title: tr("Medindo o Vref", "Measuring Vref"),
    caption: tr("Multímetro no trimpot do driver: ≈ 0,60 V, o que dá ≈ 1,5 A no motor.", "Multimeter on the driver trimpot: ≈ 0.60 V, which gives ≈ 1.5 A at the motor."),
    how: "Mão segurando a ponta do multímetro no trimpot, com o visor do multímetro legível.",
    ratio: "1/1",
    src: "vref.webp",
  },
  escala: {
    n: "13",
    title: tr("Conferindo a escala", "Checking the scale"),
    caption: tr(
      "A régua que a máquina desenhou na mesa, conferida com o paquímetro: os 100 mm caem em cima da marca.",
      "The ruler the machine drew on the table, checked with calipers: the 100 mm lands right on the mark.",
    ),
    how: "Régua de verdade ao lado do traço de 150 mm do teste de escala, de cima, bem de perto.",
    ratio: "1/1",
    src: "escala.webp",
  },
  gabarito: {
    n: "14",
    title: tr("Gabarito desenhado na mesa", "Template drawn on the table"),
    caption: tr(
      "A própria máquina desenhou na madeira o limite da área útil, as réguas e os cantos de A4 e A3.",
      "The machine itself drew the work area boundary, the rulers and the A4 and A3 corners on the wood.",
    ),
    how: "De cima, pegando o gabarito inteiro no tampo, sem papel.",
    ratio: "1/1",
    src: "gabarito.webp",
  },
  cartolina: {
    n: "15",
    title: tr("Cartolina de testes", "Test poster board"),
    caption: tr("Retas e círculos de F500 a F4000: as ondulações só aparecem com curva e velocidade.", "Lines and circles from F500 to F4000: the ripples only show up with curves and speed."),
    how: "A cartolina dos testes de velocidade inteira, de cima, e se der um close nos círculos de F2000/F4000.",
    ratio: "4/3",
    pos: "50% 35%",
    src: "cartolina.webp",
  },
  f16: {
    n: "16",
    title: tr("Pôster do F-16 terminado", "The finished F-16 poster"),
    caption: tr(
      "O pôster de 600 × 385 mm na cartolina azul, em caneta branca, ainda preso na mesa: ~84 min de máquina.",
      "The 600 × 385 mm poster on blue poster board, in white pen, still taped to the table: ~84 min of machine time.",
    ),
    how: "O pôster inteiro, reto (de frente, sem perspectiva), com luz uniforme. Pode ser na parede ou na mesa. Em pé, como na prévia.",
    ratio: "1/1",
    src: "f16.webp",
  },
  f16Detalhe: {
    n: "17",
    title: tr("Detalhe dos traços", "Stroke detail"),
    caption: tr("De perto: os traços de linha única da vetorização centerline.", "Up close: the single-line strokes from the centerline vectorization."),
    how: "Close bem de perto num pedaço com muitos traços (cabine ou a tabela de texto).",
    ratio: "1/1",
    src: "f16-detalhe.webp",
  },
  primeiro: {
    n: "18",
    title: tr("O primeiro desenho", "The first drawing"),
    caption: tr("Quadrado + círculo, 07/11/2026, ainda em passo cheio: retas boas, círculo tremido.", "Square + circle, Nov 7, 2026, still in full step: clean lines, shaky circle."),
    how: "O papel do primeiro teste (quadrado + círculo), de frente.",
    ratio: "4/3",
    src: "primeiro.webp",
  },
  emAcao: {
    n: "19",
    title: tr("A máquina desenhando", "The machine drawing"),
    caption: tr(
      "No meio do pôster: o Pen Holder desce a caneta na cartolina e a ponte leva o carro de um traço a outro.",
      "Halfway through the poster: the Pen Holder lowers the pen onto the poster board and the gantry carries the carriage from one stroke to the next.",
    ),
    how: "Foto (ou vídeo curto) com a máquina desenhando, carro em foco e um pouco de movimento na ponte.",
    ratio: "3/4",
    src: "em-acao.webp",
  },
} satisfies Record<string, Foto>;

export type FotoId = keyof typeof fotos;

/* ------------------------------------------------------------------ guia */

export const guia = {
  intro: tr(
    "Tudo o que aprendi construindo a minha, na ordem em que você vai precisar: o que comprar, como montar, como ligar, como configurar e o que fazer quando algo dá errado. Os números foram medidos na bancada, tirados do modelo do FreeCAD ou calculados, e cada tabela diz qual é qual.",
    "Everything I learned building mine, in the order you'll need it: what to buy, how to assemble it, how to wire it, how to configure it and what to do when something goes wrong. The numbers were measured on the bench, taken from the FreeCAD model or calculated, and every table says which is which.",
  ),

  downloads: {
    principal: {
      label: tr("Pacote completo", "Full package"),
      detail: tr(".zip · 2,4 MB · guia, ligações, firmware, G-codes, scripts, STL e STEP", ".zip · 2.4 MB · guide, wiring, firmware, G-codes, scripts, STL and STEP"),
      href: `${A}/cnc-plotter-arquivos.zip`,
    } satisfies Download,
    outros: [
      { label: "configuracao_grbl.txt", detail: tr("todos os parâmetros $", "every $ setting"), href: `${A}/firmware/configuracao_grbl.txt` },
      { label: "svg_para_gcode.py", detail: tr("qualquer SVG vira G-code", "turns any SVG into G-code"), href: `${A}/software/svg_para_gcode.py` },
      { label: "Base_CNC_Shield.stl", detail: tr("base do Arduino", "Arduino base"), href: `${A}/modelos-3d/Base_CNC_Shield.stl` },
      { label: "pecas-impressas-stl.zip", detail: tr("todas as peças · STL + STEP · 1 MB", "all the parts · STL + STEP · 1 MB"), href: `${A}/pecas-impressas-stl.zip` },
    ] satisfies Download[],
  },

  capitulos: [
    { id: "visao", n: "01", title: tr("Visão geral", "Overview") },
    { id: "material", n: "02", title: tr("Lista de materiais", "Bill of materials") },
    { id: "impressao", n: "03", title: tr("Peças impressas", "Printed parts") },
    { id: "mesa", n: "04", title: tr("Mesa, barras e ponte", "Table, rods and gantry") },
    { id: "correias", n: "05", title: tr("Motores e correias", "Motors and belts") },
    { id: "carro", n: "06", title: tr("Carro e caneta", "Carriage and pen") },
    { id: "fins", n: "07", title: tr("Fins de curso e eletrônica", "Limit switches and electronics") },
    { id: "ligacoes", n: "08", title: tr("Ligações elétricas", "Wiring") },
    { id: "firmware", n: "09", title: tr("Firmware GRBL", "GRBL firmware") },
    { id: "calibracao", n: "10", title: tr("Calibração", "Calibration") },
    { id: "rotina", n: "11", title: tr("Rotina de uso", "Daily routine") },
    { id: "traco", n: "12", title: tr("Qualidade do traço", "Line quality") },
    { id: "gcode", n: "13", title: tr("Do desenho ao G-code", "From drawing to G-code") },
    { id: "problemas", n: "14", title: tr("Solução de problemas", "Troubleshooting") },
  ],

  /* ---------------------------------------------------------------- 01 */
  visao: {
    resumo: tr(
      "É uma **ponte (gantry)** que anda sobre duas barras compridas, com um carro que anda sobre a ponte levando a caneta. Os dois motores viajam junto com a ponte, montados na Base Principal, e o eixo longo usa **tração em ômega**: a correia fica parada e o motor “escala” por ela. A área útil é de **810 × 390 mm**, perto de 2:1, pensada para quadros grandes e alongados.",
      "It's a **gantry** that rides on two long rods, with a carriage that rides on the gantry carrying the pen. Both motors travel with the gantry, mounted on the Main Base, and the long axis uses an **omega drive**: the belt stays fixed and the motor “climbs” along it. The work area is **810 × 390 mm**, close to 2:1, meant for large, wide pieces.",
    ),
    eixos: [
      { k: tr("Eixo X (longo)", "X axis (long)"), v: tr("A ponte inteira corre sobre **2 barras de aço Ø12 × 1000 mm**, presas na mesa.", "The whole gantry runs on **2 Ø12 × 1000 mm steel rods** fixed to the table.") },
      { k: tr("Eixo Y (curto)", "Y axis (short)"), v: tr("O carro da caneta corre sobre **2 barras Ø6 × 500 mm**, presas na ponte.", "The pen carriage runs on **2 Ø6 × 500 mm rods** fixed to the gantry.") },
      { k: tr("Caneta", "Pen"), v: tr("Sobe e desce com um **servo**, comandado pelo próprio GRBL: `M5` sobe, `M3 S220` desce.", "Goes up and down with a **servo**, driven by GRBL itself: `M5` lifts, `M3 S220` lowers.") },
    ],
    lados: [
      tr("**Frente:** lado do Apoio Secundário (barra de 12 mm mais alta, a 80 mm da mesa).", "**Front:** the Secondary Support side (the higher 12 mm rod, 80 mm above the table)."),
      tr("**Fundo:** lado da Base Principal e dos motores (barra de 12 mm mais baixa, a 51,4 mm).", "**Back:** the Main Base and motors side (the lower 12 mm rod, at 51.4 mm)."),
      tr("**X+ é para a direita. Y+ é para longe de você**, em direção à Base Principal.", "**X+ points right. Y+ points away from you**, toward the Main Base."),
      tr(
        "**Origem do papel (0,0):** canto da frente à esquerda. **Home:** ponte toda à direita e carro no fundo.",
        "**Paper origin (0,0):** front left corner. **Home:** gantry all the way right and carriage at the back.",
      ),
    ],
    /** a terceira coluna é a chave da origem ("medido", "calculado"): o CncGuide escreve o rótulo no idioma */
    specs: [
      [tr("Área útil", "Work area"), "**810 × 390 mm**", "medido"],
      [tr("Resolução", "Resolution"), tr("0,0125 mm por micropasso (1/16, 80 passos/mm)", "0.0125 mm per microstep (1/16, 80 steps/mm)"), "calculado"],
      [tr("Velocidade de desenho", "Drawing speed"), tr("F500 para precisão máxima; até F1000–1500 sem perda visível", "F500 for maximum precision; up to F1000–1500 with no visible loss"), "medido"],
      [tr("Deslocamento com a caneta levantada", "Pen-up travel"), tr("até 200 mm/s (`$110` = 12000 mm/min)", "up to 200 mm/s (`$110` = 12000 mm/min)"), "medido"],
      [tr("Aceleração", "Acceleration"), "800 mm/s²", "medido"],
      [tr("Massa móvel do eixo X", "X axis moving mass"), tr("≈ 1,2 kg, com os 2 motores", "≈ 1.2 kg, with both motors"), "calculado"],
      [tr("Massa móvel do eixo Y", "Y axis moving mass"), "≈ 110 g", "calculado"],
      [tr("Mesa", "Table"), tr("tampo de pinus 1200 × 700 × 18 mm", "1200 × 700 × 18 mm pine tabletop"), "medido"],
      [tr("Controle", "Controller"), tr("Arduino Uno + CNC Shield V3 + GRBL 1.1h com servo", "Arduino Uno + CNC Shield V3 + GRBL 1.1h with servo"), ""],
      [tr("Software no PC", "PC software"), "LaserGRBL (Windows)", ""],
    ] as Row[],
  },

  /* ---------------------------------------------------------------- 02 */
  material: {
    mecanica: [
      [tr("Barra de aço Ø12 × 1000 mm", "Ø12 × 1000 mm steel rod"), "2", tr("eixo X", "X axis")],
      [tr("Barra de aço Ø6 × 500 mm", "Ø6 × 500 mm steel rod"), "2", tr("eixo Y, na ponte", "Y axis, on the gantry")],
      [tr("Haste de aço Ø6 × 73,4 mm", "Ø6 × 73.4 mm steel rod"), "2", tr("guia vertical do Pen Holder", "Pen Holder vertical guide")],
      [tr("Rolamento linear **LM12UU** (Ø12 × Ø21 × 30)", "**LM12UU** linear bearing (Ø12 × Ø21 × 30)"), "3", tr("2 no Apoio Base + 1 no Apoio Secundário", "2 in the Base Support + 1 in the Secondary Support")],
      [tr("Rolamento linear **LM6UU**", "**LM6UU** linear bearing"), "8", tr("4 no carro (2 por túnel) + 4 no Pen Holder", "4 in the carriage (2 per bore) + 4 in the Pen Holder")],
      [tr("Polia **GT2 20 dentes**, furo 5 mm", "**GT2 20-tooth** pulley, 5 mm bore"), "2", tr("uma em cada motor", "one on each motor")],
      [tr("Polia louca GT2", "GT2 idler pulley"), "3", tr("2 no ômega do X + 1 dentada no Apoio Secundário", "2 in the X omega + 1 toothed in the Secondary Support")],
      [tr("Correia **GT2 6 mm**", "**GT2 6 mm** belt"), "~3 m", tr("≈ 1,15 m no Y + ≈ 1,1 m no X; compre com sobra", "≈ 1.15 m on Y + ≈ 1.1 m on X; buy extra")],
      [tr("Tampo de pinus 1200 × 700 × 18 mm", "1200 × 700 × 18 mm pine tabletop"), "1", tr("a “mesa” da máquina", "the machine's “table”")],
      [tr("Mola pequena", "Small spring"), "1", tr("pressão da caneta no Pen Holder", "pen pressure in the Pen Holder")],
    ] as Row[],
    parafusos: [
      [tr("M4 de cabeça chata para madeira", "M4 flat-head wood screws"), "~14", tr("suportes e base da eletrônica (2 × 16 mm na base)", "supports and electronics base (2 × 16 mm on the base)")],
      [tr("M3 + porcas", "M3 + nuts"), "~25", tr("suportes (4 por suporte) e Pen Holder (2 com porca presa)", "supports (4 per support) and Pen Holder (2 with captive nuts)")],
      [tr("M3 × 30 + porca", "M3 × 30 + nut"), "2", tr("presilhas da correia do Y", "Y belt clamps")],
      [tr("M3 × 6 autoatarraxante", "M3 × 6 self-tapping"), "4", tr("Arduino na base impressa", "Arduino on the printed base")],
    ] as Row[],
    eletronica: [
      ["Arduino Uno", "1", ""],
      ["CNC Shield V3", "1", ""],
      [tr("Driver A4988 / HR4988", "A4988 / HR4988 driver"), "2", tr("+1 de reserva; slots X e Y", "+1 spare; X and Y slots")],
      [tr("Jumpers de micropasso", "Microstepping jumpers"), "6", tr("3 embaixo de cada driver (1/16)", "3 under each driver (1/16)")],
      [tr("Motor NEMA 17 **US-17HS4401S**", "NEMA 17 **US-17HS4401S** motor"), "2", tr("1,7 A/fase, ~1,5 Ω, 200 passos/volta, ~280 g", "1.7 A/phase, ~1.5 Ω, 200 steps/rev, ~280 g")],
      [tr("Fonte chaveada **12 V / 5 A** com plugue P4", "**12 V / 5 A** switching power supply with a P4 plug"), "1", ""],
      [tr("Divisor Y P4 (1 fêmea → 2 machos)", "P4 Y splitter (1 female → 2 male)"), "1", ""],
      [tr("Jack P4 fêmea com borne", "Female P4 jack with screw terminal"), "2", tr("um para o shield, outro para o step-down", "one for the shield, one for the step-down")],
      [tr("Step-down 12 V → 5 V (≈ 18 × 12 mm)", "12 V → 5 V step-down (≈ 18 × 12 mm)"), "1", tr("alimenta **só** o servo", "powers **only** the servo")],
      [tr("Servo **MG90S** (ou SG90)", "**MG90S** servo (or SG90)"), "1", tr("levanta a caneta", "lifts the pen")],
      [tr("Microswitch com rolete (COM/NO/NC)", "Roller microswitch (COM/NO/NC)"), "2", tr("fins de curso X e Y", "X and Y limit switches")],
      [tr("Cabo USB A-B", "USB A-B cable"), "1", "PC ↔ Arduino"],
      [tr("Fios", "Wires"), "—", tr("cabos de motor de 4 vias, par trançado para os fins de curso, jumpers", "4-wire motor cables, twisted pair for the limit switches, jumper wires")],
    ] as Row[],
  },

  /* ---------------------------------------------------------------- 03 */
  impressao: {
    resumo: tr(
      "A estrutura sai em **PLA** e as duas peças que mais sofrem, o carro e o Pen Holder, em **PETG**. O modelo completo foi feito no FreeCAD; o carro v3 e a base do shield, em CadQuery (código, para mudar uma medida e gerar de novo).",
      "The frame is printed in **PLA**, and the two parts that take the most stress, the carriage and the Pen Holder, in **PETG**. The full model was made in FreeCAD; the v3 carriage and the shield base in CadQuery (code, so you can change a dimension and regenerate).",
    ),
    /** peça, qtd, material, função, STL, STEP (vazio quando não há) */
    pecas: [
      [tr("Suporte alto · base (88,7 mm)", "Tall support · base (88.7 mm)"), "2", "PLA", tr("barra de 12 mm da **frente**", "**front** 12 mm rod"), `${P}/pecas/Suporte_Alto_Base.stl`, `${P}/pecas/Suporte_Alto_Base.step`],
      [tr("Suporte alto · abraçadeira", "Tall support · clamp"), "2", "PLA", tr("fecha sobre a barra da frente (4 × M3)", "closes over the front rod (4 × M3)"), `${P}/pecas/Suporte_Alto_Abracadeira.stl`, `${P}/pecas/Suporte_Alto_Abracadeira.step`],
      [tr("Suporte baixo · base (60 mm)", "Short support · base (60 mm)"), "2", "PLA", tr("barra do **fundo** e pontas da correia do X", "**back** rod and the X belt ends"), `${P}/pecas/Suporte_Baixo_Base.stl`, `${P}/pecas/Suporte_Baixo_Base.step`],
      [tr("Suporte baixo · abraçadeira", "Short support · clamp"), "2", "PLA", tr("fecha sobre a barra do fundo (4 × M3)", "closes over the back rod (4 × M3)"), `${P}/pecas/Suporte_Baixo_Abracadeira.stl`, `${P}/pecas/Suporte_Baixo_Abracadeira.step`],
      [tr("Base Principal", "Main Base"), "1", "PLA", tr("placa dos motores, em cima do Apoio Base", "motor plate, on top of the Base Support"), `${P}/pecas/Base_Principal.stl`, `${P}/pecas/Base_Principal.step`],
      [tr("Apoio Base", "Base Support"), "1", "PLA", tr("2 × LM12UU na barra do fundo", "2 × LM12UU on the back rod"), `${P}/pecas/Apoio_Base.stl`, `${P}/pecas/Apoio_Base.step`],
      [tr("Apoio Secundário", "Secondary Support"), "1", "PLA", tr("1 × LM12UU na barra da frente + polia louca do Y", "1 × LM12UU on the front rod + the Y idler pulley"), `${P}/pecas/Apoio_Secundario.stl`, `${P}/pecas/Apoio_Secundario.step`],
      [tr("Carro Principal **v3**", "Main Carriage **v3**"), "1", "**PETG**", tr("leva a caneta; 4 × LM6UU", "carries the pen; 4 × LM6UU"), `${P}/pecas/Carro_Principal_v3.stl`, ""],
      ["Pen Holder **v3**", "1", "**PETG**", tr("segura a caneta; 4 × LM6UU", "holds the pen; 4 × LM6UU"), `${P}/pecas/Pen_Holder_v3.stl`, ""],
      [tr("Presilha da correia GT2", "GT2 belt clamp"), "2", "PLA", tr("prende as pontas da correia do Y no carro", "holds the Y belt ends on the carriage"), `${P}/pecas/Presilha_GT2.stl`, `${P}/pecas/Presilha_GT2.step`],
      [tr("Base do CNC Shield", "CNC Shield base"), "1", "PLA", tr("Arduino + shield rente à mesa (4 mm)", "Arduino + shield flush with the table (4 mm)"), `${P}/Base_CNC_Shield.stl`, `${P}/Base_CNC_Shield.step`],
    ] as Row[],
    dicas: [
      tr("Imprima as abraçadeiras com o eixo do furo de 12,2 mm **na vertical**: o furo sai redondo.", "Print the clamps with the 12.2 mm hole axis **vertical**: the hole comes out round."),
      tr(
        "No carro v3, os furos dos LM6UU têm **nervuras de pressão** (3 por furo, inscrito Ø11,9): o rolamento entra justo e fica sem folga, sem depender da tolerância da impressora.",
        "On the v3 carriage, the LM6UU bores have **press-fit ribs** (3 per bore, Ø11.9 inscribed): the bearing goes in snug with no play, without depending on the printer's tolerance.",
      ),
      tr("A estrutura foi impressa numa Creality Ender; carro e Pen Holder em PETG, numa Snapmaker.", "The frame was printed on a Creality Ender; the carriage and Pen Holder in PETG, on a Snapmaker."),
      tr(
        "Os STL estão na posição em que a peça fica na máquina, em milímetros: gire no fatiador para a orientação de impressão que preferir.",
        "The STLs are in the position each part sits on the machine, in millimeters: rotate them in the slicer to whatever print orientation you prefer.",
      ),
    ],
    base: {
      title: tr("Base do Arduino + CNC Shield", "Arduino + CNC Shield base"),
      text: tr(
        "101,6 × 62,3 × 4 mm, ~5 g de PLA, imprime deitada sem suporte. O quadro fica todo fora do contorno da placa, então nenhum pino soldado encosta no plástico.",
        "101.6 × 62.3 × 4 mm, ~5 g of PLA, prints flat with no supports. The frame sits entirely outside the board outline, so no soldered pin touches the plastic.",
      ),
      files: [
        { label: "STL", detail: tr("para fatiar", "for slicing"), href: `${A}/modelos-3d/Base_CNC_Shield.stl` },
        { label: "STEP", detail: tr("para o CAD", "for CAD"), href: `${A}/modelos-3d/Base_CNC_Shield.step` },
        { label: "base.py", detail: tr("CadQuery, paramétrico", "CadQuery, parametric"), href: `${A}/modelos-3d/base.py` },
      ] satisfies Download[],
    },
    pendente: tr(
      "Estão todos no pecas-impressas-stl.zip (lista de downloads no topo do guia): suportes alto e baixo (base e abraçadeira), Base Principal, Apoio Base, Apoio Secundário, Carro Principal e Pen Holder v3, presilha GT2 e a base do shield, em STL para fatiar e STEP para o CAD (o carro e o Pen Holder v3 só em STL). Um LEIA-ME dentro do zip diz a quantidade e o material de cada peça.",
      "They're all in pecas-impressas-stl.zip (in the downloads at the top of the guide): tall and short supports (base and clamp), Main Base, Base Support, Secondary Support, Main Carriage and Pen Holder v3, the GT2 belt clamp and the shield base, as STL for slicing and STEP for CAD (the carriage and the Pen Holder v3 only as STL). A LEIA-ME (readme, in Portuguese) inside the zip lists the quantity and material of each part.",
    ),
  },

  /* ---------------------------------------------------------------- 04 */
  mesa: {
    suportes: [
      tr(
        "Parafuse os **2 suportes baixos** (fundo) e os **2 suportes altos** (frente) no tampo, com parafusos M4 de cabeça chata.",
        "Screw the **2 short supports** (back) and the **2 tall supports** (front) to the tabletop with M4 flat-head screws.",
      ),
      tr(
        "A distância entre os eixos das barras é **516 mm**. Meça nas duas pontas: as barras precisam ficar paralelas, senão a ponte trava em algum trecho do curso.",
        "The distance between the rod centerlines is **516 mm**. Measure at both ends: the rods have to be parallel, or the gantry binds somewhere along its travel.",
      ),
      tr(
        "Cada suporte tem 2 peças (base em L + abraçadeira), unidas por 4 parafusos M3. Encaixe a barra e aperte as abraçadeiras por igual.",
        "Each support has 2 parts (L-shaped base + clamp), joined by 4 M3 screws. Seat the rod and tighten the clamps evenly.",
      ),
      tr(
        "Alturas finais: barra do fundo a **51,4 mm** da mesa, barra da frente a **80 mm**. A diferença de 28,6 mm é de propósito: o Apoio Base, com 2 rolamentos, fica embaixo da Base Principal, e mesmo assim as barras de 6 mm da ponte ficam niveladas a 80 mm.",
        "Final heights: back rod at **51.4 mm** above the table, front rod at **80 mm**. The 28.6 mm difference is on purpose: the Base Support, with 2 bearings, sits under the Main Base, and the gantry's 6 mm rods still end up level at 80 mm.",
      ),
      tr(
        "O vão livre entre as abraçadeiras fica em **920 mm**. A ponte ocupa ~100 mm e sobram ~820 mm de curso.",
        "The clear span between the clamps is **920 mm**. The gantry takes up ~100 mm, leaving ~820 mm of travel.",
      ),
    ],
    medidas: [
      { v: "516 mm", k: tr("entre os eixos das barras de 12", "between the 12 mm rod centerlines") },
      { v: tr("51,4 mm", "51.4 mm"), k: tr("altura da barra do fundo", "back rod height") },
      { v: "80 mm", k: tr("altura da barra da frente", "front rod height") },
      { v: "920 mm", k: tr("vão livre entre as abraçadeiras", "clear span between the clamps") },
    ],
    ideia: tr(
      "O projeto previa 2 rolamentos no Apoio Secundário. Mas com 4 rolamentos firmes em 2 barras o sistema fica **hiperestático**: qualquer falta de paralelismo faz os dois lados “brigarem”, e isso aparece como trepidação (stick-slip, trava e solta). Com **2 rolamentos no fundo, que guiam, e 1 na frente, que só apoia**, a máquina tolera pequenos desalinhamentos. É como uma gaveta: a boa tem um trilho que guia e outro que só segura o peso.",
      "The design called for 2 bearings in the Secondary Support. But with 4 rigid bearings on 2 rods the system is **over-constrained**: any lack of parallelism makes the two sides “fight”, and that shows up as chatter (stick-slip: it binds and releases). With **2 bearings at the back that guide, and 1 at the front that only supports**, the machine tolerates small misalignments. It's like a drawer: a good one has one rail that guides and another that just carries the weight.",
    ),
    ponte: [
      tr(
        "Coloque os **2 LM12UU no Apoio Base**, a **66 mm** de centro a centro, e passe pela barra do fundo.",
        "Fit the **2 LM12UU in the Base Support**, **66 mm** center to center, and slide it onto the back rod.",
      ),
      tr("Coloque **1 LM12UU no Apoio Secundário**, centralizado, e passe pela barra da frente.", "Fit **1 LM12UU in the Secondary Support**, centered, and slide it onto the front rod."),
      tr(
        "Prenda as **2 barras de 6 × 500 mm** entre o Apoio Base/Base Principal e o Apoio Secundário: **64 mm** entre elas, **450 mm** de vão livre.",
        "Fix the **2 rods of 6 × 500 mm** between the Base Support/Main Base and the Secondary Support: **64 mm** apart, **450 mm** clear span.",
      ),
      tr(
        "Empurre a ponte com a mão de ponta a ponta. Ela deve correr leve e por igual. Se travar num trecho, o problema é o paralelismo das barras de 12 mm.",
        "Push the gantry by hand from end to end. It should run light and even. If it binds somewhere, the problem is the parallelism of the 12 mm rods.",
      ),
    ],
    barras6: tr(
      "As barras de 6 mm são finas o bastante para flexionar um pouco. 1 mm de desalinhamento entre as barras de 12 mm gera só ~3 N de força lateral, que elas absorvem como molas.",
      "The 6 mm rods are thin enough to flex a little. 1 mm of misalignment between the 12 mm rods creates only ~3 N of side force, which they absorb like springs.",
    ),
  },

  /* ---------------------------------------------------------------- 05 */
  correias: {
    omegaIdeia: tr(
      "No eixo X a correia fica presa nas duas pontas e não se move. Ela passa por baixo de duas polias loucas e dá a volta na polia do motor. Quando o motor gira, ele “sobe” pela correia e leva a ponte junto, como alguém se puxando ao longo de uma corda esticada.",
      "On the X axis the belt is fixed at both ends and doesn't move. It runs under two idler pulleys and wraps around the motor pulley. When the motor turns, it “climbs” along the belt and takes the gantry with it, like someone pulling themselves along a taut rope.",
    ),
    x: [
      tr(
        "Os dois motores ficam na **Base Principal**, na linha do meio entre as barras de 6 mm, a **56 mm** um do outro.",
        "Both motors sit on the **Main Base**, on the center line between the 6 mm rods, **56 mm** apart.",
      ),
      tr("**Motor do X** (eixo longo): em cima da placa, com o eixo **para baixo** e a polia GT2 20T.", "**X motor** (long axis): on top of the plate, shaft **pointing down**, with the GT2 20T pulley."),
      tr(
        "Prenda uma ponta da correia num suporte do fundo, passe por baixo da **primeira polia louca**, dê a volta na **polia do motor**, passe pela **segunda polia louca** e prenda a outra ponta no outro suporte do fundo.",
        "Fix one end of the belt to a back support, run it under the **first idler pulley**, around the **motor pulley**, through the **second idler pulley**, and fix the other end to the other back support.",
      ),
      tr(
        "Ajuste a tensão pelo **esticador por parafuso** num dos suportes. Firme, sem “barriga”, mas sem forçar: tensão de violão afinado grave, não de corda de arco.",
        "Set the tension with the **screw tensioner** on one of the supports. Firm, no sag, but don't overdo it: the tension of a guitar tuned low, not a bowstring.",
      ),
    ],
    y: [
      tr(
        "**Motor do Y** (eixo curto): preso **por baixo** da Base Principal, com o eixo **para cima**. A polia passa pelo furo de Ø25.",
        "**Y motor** (short axis): mounted **under** the Main Base, shaft **pointing up**. The pulley goes through the Ø25 hole.",
      ),
      tr(
        "A correia fecha um laço entre a polia do motor e a **polia louca dentada do Apoio Secundário**, a 89 mm de altura e 529,5 mm de distância entre os centros.",
        "The belt forms a loop between the motor pulley and the **toothed idler pulley on the Secondary Support**, 89 mm high and 529.5 mm center to center.",
      ),
      tr("As duas pontas vão presas no carro pelas **presilhas GT2**.", "Both ends are fixed to the carriage with the **GT2 belt clamps**."),
    ],
    presilha: [
      tr("Cada presilha tem um pino de Ø8,5 mm, uma aba e uma **fenda de entrada de 2,5 mm**.", "Each clamp has a Ø8.5 mm pin, a tab and a **2.5 mm entry slot**."),
      tr(
        "Passe a correia pela fenda, dê a volta no pino **com os dentes virados para o pino** e volte pela mesma fenda.",
        "Feed the belt through the slot, wrap it around the pin **with the teeth facing the pin** and back out through the same slot.",
      ),
      tr(
        "A correia trava dente com dente: as duas pernas juntas medem ~2,0 mm, e para escorregar os dentes teriam que “pular” ~2,8 mm.",
        "The belt locks tooth to tooth: the two layers together measure ~2.0 mm, and to slip the teeth would have to “jump” ~2.8 mm.",
      ),
      tr(
        "Prenda cada presilha com **M3 × 30 + porca** no rasgo de 23,2 × 3,2 mm do carro. O parafuso corre no rasgo e dá **~8 mm de ajuste de tensão**.",
        "Fix each clamp with an **M3 × 30 + nut** in the carriage's 23.2 × 3.2 mm slot. The screw slides in the slot and gives **~8 mm of tension adjustment**.",
      ),
    ],
    figuras: [
      { v: "56 mm", k: tr("entre os dois motores", "between the two motors") },
      { v: tr("529,5 mm", "529.5 mm"), k: tr("entre centros das polias do Y", "between the Y pulley centers") },
      { v: "40 mm", k: tr("por volta da polia GT2 20T", "per turn of the GT2 20T pulley") },
      { v: "~8 mm", k: tr("de ajuste em cada presilha", "of adjustment on each clamp") },
    ],
  },

  /* ---------------------------------------------------------------- 06 */
  carro: {
    passos: [
      tr(
        "Coloque **2 LM6UU em cada túnel** do Carro Principal (4 no total). O anel central serve de batente.",
        "Fit **2 LM6UU in each bore** of the Main Carriage (4 in total). The center ring acts as the end stop.",
      ),
      tr("Passe o carro pelas barras de 6 mm.", "Slide the carriage onto the 6 mm rods."),
      tr(
        "No **Pen Holder**, coloque **2 LM6UU em cada furo** e passe pelas **2 hastes verticais Ø6 × 73,4 mm** do carro. Com 40 mm de guia por haste (antes eram 19 mm), a caneta inclina a metade.",
        "In the **Pen Holder**, fit **2 LM6UU in each hole** and slide it onto the carriage's **2 vertical Ø6 × 73.4 mm rods**. With 40 mm of guidance per rod (it used to be 19 mm), the pen tilts half as much.",
      ),
      tr("Coloque a **mola** no Pen Holder.", "Fit the **spring** in the Pen Holder."),
      tr(
        "Prenda o **servo** no carro: vão de 23,5 mm, parafusos do próprio servo nos furos de Ø1,8 mm. O braço do servo empurra o pino do Pen Holder para cima.",
        "Mount the **servo** on the carriage: 23.5 mm opening, the servo's own screws in the Ø1.8 mm holes. The servo horn pushes the Pen Holder pin up.",
      ),
      tr(
        "**Caneta:** passe pelo rasgo aberto de 16 mm do carro e pelo furo do Pen Holder. Os **2 parafusos M3** (a 28 mm um do outro, em porcas presas) empurram a caneta contra um **canal em V de 90°**, que centraliza qualquer diâmetro de 3 a 12 mm.",
        "**Pen:** pass it through the carriage's 16 mm open slot and the Pen Holder hole. The **2 M3 screws** (28 mm apart, in captive nuts) push the pen into a **90° V-groove**, which centers any diameter from 3 to 12 mm.",
      ),
    ],
    gravidade: tr(
      "O servo não empurra a caneta para baixo: ele só a **levanta**. Para descer, o servo sai do caminho e o Pen Holder desce pelo próprio peso e pela mola. Assim a caneta acompanha pequenas ondulações da mesa e a flecha das barras sem perder o contato com o papel.",
      "The servo doesn't push the pen down: it only **lifts** it. To lower it, the servo gets out of the way and the Pen Holder drops under its own weight and the spring. That way the pen follows small ripples in the table and the sag of the rods without losing contact with the paper.",
    ),
    rasgo: tr(
      "Na v2, o furo do “C” do carro tinha Ø12,2 e o do Pen Holder, Ø12. Os parafusos empurravam a caneta para fora do centro e ela raspava no carro, travando. Com o rasgo aberto de 16 mm sobram pelo menos ~2,3 mm de folga para qualquer caneta.",
      "On v2, the carriage's “C” hole was Ø12.2 and the Pen Holder's was Ø12. The screws pushed the pen off center and it rubbed against the carriage and jammed. With the 16 mm open slot there's at least ~2.3 mm of clearance for any pen.",
    ),
    figuras: [
      { v: "3–12 mm", k: tr("diâmetros de caneta que o V centraliza", "pen diameters the V centers") },
      { v: "40 mm", k: tr("de guia por haste (eram 19)", "of guidance per rod (was 19)") },
      { v: "16 mm", k: tr("rasgo aberto no carro", "open slot in the carriage") },
      { v: "~78°", k: tr("giro do servo entre em cima e embaixo", "servo swing between up and down") },
    ],
  },

  /* ---------------------------------------------------------------- 07 */
  fins: {
    chaves: [
      tr("**X:** microswitch com rolete, acionado quando a **ponte chega toda à direita** (X+).", "**X:** roller microswitch, triggered when the **gantry reaches the far right** (X+)."),
      tr(
        "**Y:** embaixo da Base Principal, entre as barras de 6 mm, acionado pelo **“dedo”** do carro (5 × 14 mm, descendo 7 mm) quando ele chega ao fundo (Y+).",
        "**Y:** under the Main Base, between the 6 mm rods, triggered by the carriage's **“finger”** (5 × 14 mm, reaching 7 mm down) when it reaches the back (Y+).",
      ),
      tr("Ligação: **COM** no GND e **NO** no sinal. Os detalhes estão no capítulo 08.", "Wiring: **COM** to GND and **NO** to signal. The details are in chapter 08."),
    ],
    eletronica: [
      tr(
        "Imprima a **Base_CNC_Shield** e prenda na mesa com 2 parafusos M4 × 16 de cabeça chata. Pinus perto da borda racha fácil: faça um furo-guia de ~2,5 mm antes.",
        "Print the **Base_CNC_Shield** and screw it to the table with 2 M4 × 16 flat-head screws. Pine splits easily near the edge: drill a ~2.5 mm pilot hole first.",
      ),
      tr(
        "Posição: no **meio do comprimento da mesa**, na **borda do fundo** (lado dos motores). Como os motores andam com a ponte, ficar no meio do curso reduz a sobra de fio para ~metade do curso (~410 mm), e não o curso inteiro.",
        "Position: at the **middle of the table's length**, on the **back edge** (the motor side). Since the motors travel with the gantry, sitting mid-travel cuts the cable slack to ~half the travel (~410 mm) instead of the full travel.",
      ),
      tr("Prenda o Arduino com 4 parafusos **M3 × 6 autoatarraxantes**.", "Mount the Arduino with 4 **M3 × 6 self-tapping** screws."),
      tr(
        "Cabos que acompanham a ponte: deixe um caminho controlado (uma esteira porta-cabos impressa é a solução prevista) e prenda o fio do servo ao longo da ponte para não enroscar.",
        "Cables that travel with the gantry: give them a controlled path (a printed cable chain is the planned solution) and tie the servo wire along the gantry so it doesn't snag.",
      ),
    ],
    altura: tr(
      "Quem decide se a eletrônica cabe embaixo do Apoio Base é a pilha de placas: Uno + shield + drivers com dissipador dá ~27–30 mm, e os plugues dos motores podem passar de ~33 mm. Passe a ponte devagar com a mão por cima **antes** de parafusar.",
      "Whether the electronics fit under the Base Support depends on the board stack: Uno + shield + drivers with heatsinks comes to ~27–30 mm, and the motor plugs can go past ~33 mm. Slowly push the gantry over it by hand **before** screwing it down.",
    ),
  },

  /* ---------------------------------------------------------------- 08 */
  ligacoes: {
    resumo: tr(
      "Dois circuitos de energia saem da mesma fonte, com o **GND em comum**: 12 V para o shield e os motores, e 12 V → 5 V (step-down) só para o servo. O Arduino recebe a lógica e o G-code pelo USB.",
      "Two power circuits come from the same supply, with a **common GND**: 12 V for the shield and the motors, and 12 V → 5 V (step-down) for the servo only. The Arduino gets its logic power and the G-code over USB.",
    ),
    servo: tr(
      "Ligado no 5 V do Arduino, que vem do USB, o pico de corrente do servo derrubava a tensão e **resetava o Arduino** no meio do desenho. O LaserGRBL acusava `UnexpectedReset` logo depois do primeiro `M3`, e a máquina perdia a origem. Com o servo no step-down próprio, o problema sumiu. É como ligar o chuveiro e a luz da casa piscar.",
      "On the Arduino's 5 V, which comes from USB, the servo's current spike dragged the voltage down and **reset the Arduino** mid-drawing. LaserGRBL reported `UnexpectedReset` right after the first `M3`, and the machine lost its origin. With the servo on its own step-down, the problem went away. It's like turning on a big appliance and watching the house lights flicker.",
    ),
    pinos: [
      [tr("Motor do eixo longo", "Long axis motor"), tr("Saída X (2B 2A 1A 1B)", "X output (2B 2A 1A 1B)"), "STEP D2 · DIR D5", tr("driver X com 3 jumpers (1/16)", "X driver with 3 jumpers (1/16)")],
      [tr("Motor do eixo curto", "Short axis motor"), tr("Saída Y (2B 2A 1A 1B)", "Y output (2B 2A 1A 1B)"), "STEP D3 · DIR D6", tr("driver Y com 3 jumpers (1/16)", "Y driver with 3 jumpers (1/16)")],
      [tr("Habilitar drivers", "Driver enable"), "EN", tr("D8 (ativo em LOW)", "D8 (active LOW)"), tr("interno ao shield", "internal to the shield")],
      [tr("Fim de curso X · NO", "X limit switch · NO"), tr("X+ branco", "X+ white"), "D9", tr("COM em X+ preto (GND)", "COM to X+ black (GND)")],
      [tr("Fim de curso Y · NO", "Y limit switch · NO"), tr("Y+ branco", "Y+ white"), "D10", tr("COM em Y+ preto (GND)", "COM to Y+ black (GND)")],
      [tr("Servo · sinal", "Servo · signal"), tr("Z+ branco", "Z+ white"), tr("D11 (PWM do spindle)", "D11 (spindle PWM)"), tr("nunca ligue fim de curso em Z−/Z+", "never wire a limit switch to Z−/Z+")],
      ["Servo · 5 V", "—", "—", tr("OUT+ do step-down (5,0 V)", "step-down OUT+ (5.0 V)")],
      ["Servo · GND", tr("(ou Z+ preto)", "(or Z+ black)"), "GND", tr("OUT− do step-down; GND comum pela fonte", "step-down OUT−; common GND through the supply")],
      [tr("Alimentação", "Power"), tr("borne 12–36 V", "12–36 V screw terminal"), "—", tr("fonte 12 V / 5 A pelo Jack A", "12 V / 5 A supply through Jack A")],
    ] as Row[],
    detalhes: [
      {
        title: tr("Fins de curso", "Limit switches"),
        text: tr(
          "O GRBL usa o pull-up interno: com a chave solta o pino fica em 5 V, e apertada ela fecha com o GND.",
          "GRBL uses the internal pull-up: with the switch released the pin sits at 5 V, and pressed it closes to GND.",
        ),
        itens: [
          tr("**COM + NO** (como está montado): `$5=0`.", "**COM + NO** (as built): `$5=0`."),
          tr(
            "**COM + NC**: `$5=1`. Mais resistente a ruído, e um fio rompido aparece como “acionado” (falha segura).",
            "**COM + NC**: `$5=1`. More noise-resistant, and a broken wire shows up as “triggered” (fail-safe).",
          ),
          tr("As duas chaves têm que ser do mesmo tipo: o `$5` vale para todas.", "Both switches have to be wired the same way: `$5` applies to all of them."),
          tr("Trance o sinal com o GND de cada chave e afaste esses fios dos cabos dos motores.", "Twist each switch's signal wire with its GND and keep those wires away from the motor cables."),
        ],
      },
      {
        title: tr("Bobinas do motor", "Motor coils"),
        text: tr(
          "Os 4 fios são 2 pares. No multímetro em Ω, os dois fios do mesmo par dão ~1,5 Ω; fios de pares diferentes dão circuito aberto.",
          "The 4 wires are 2 pairs. With the multimeter on Ω, the two wires of the same pair read ~1.5 Ω; wires from different pairs read open circuit.",
        ),
        itens: [
          tr("Um par vai em `1A/1B` e o outro em `2A/2B`.", "One pair goes to `1A/1B` and the other to `2A/2B`."),
          tr(
            "Eixo andando ao contrário: gire o plugue 180° ou inverta no `$3`. Marque a orientação do plugue depois de acertar.",
            "Axis moving backwards: turn the plug 180° or invert it in `$3`. Mark the plug orientation once it's right.",
          ),
          tr("Motor dando “espasmos” sem andar = mau contato num dos 4 fios.", "Motor “twitching” without moving = bad contact on one of the 4 wires."),
          tr("**Nunca** conecte ou desconecte um motor com o sistema ligado: queima o driver.", "**Never** plug or unplug a motor with the system powered: it fries the driver."),
        ],
      },
      {
        title: tr("Drivers e micropasso", "Drivers and microstepping"),
        text: tr(
          "Corrente do motor: `I = Vref / (8 · Rs)`. Com Vref ≈ 0,60 V e Rs = 0,05 Ω, dá ≈ 1,5 A, abaixo dos 1,7 A do motor. Depois de vários minutos rodando, o dissipador fica só morno.",
          "Motor current: `I = Vref / (8 · Rs)`. With Vref ≈ 0.60 V and Rs = 0.05 Ω, that's ≈ 1.5 A, below the motor's 1.7 A. After several minutes of running, the heatsink is only warm.",
        ),
        itens: [
          tr("Alinhe o pino **EN** do driver com o EN marcado no shield. Driver invertido queima na hora.", "Line up the driver's **EN** pin with the EN marked on the shield. A driver plugged in backwards burns out instantly."),
          tr(
            "3 jumpers (M0, M1, M2) embaixo de cada driver = **1/16** no A4988/HR4988 → `$100=$101=80`. Num DRV8825, os mesmos 3 dariam 1/32.",
            "3 jumpers (M0, M1, M2) under each driver = **1/16** on the A4988/HR4988 → `$100=$101=80`. On a DRV8825, the same 3 would give 1/32.",
          ),
          tr(
            "Ajuste o Vref com a fonte ligada e os motores parados, com chave de plástico ou cerâmica se tiver.",
            "Set Vref with the supply on and the motors stopped, using a plastic or ceramic screwdriver if you have one.",
          ),
        ],
      },
    ],
    antes: [
      tr("Polaridade da fonte conferida com multímetro: os dois fios dela podem ser pretos.", "Supply polarity checked with a multimeter: both of its wires may be black."),
      tr("Step-down ajustado para **5,0 V** sem nada ligado na saída.", "Step-down set to **5.0 V** with nothing connected to the output."),
      tr("Drivers com o EN alinhado; jumpers 1/16 no X e no Y.", "Drivers with EN lined up; 1/16 jumpers on X and Y."),
      tr("Pares das bobinas conferidos (~1,5 Ω).", "Coil pairs checked (~1.5 Ω)."),
      tr("Nada ligado em Z−; o servo só no Z+.", "Nothing on Z−; the servo only on Z+."),
    ],
    ligar: tr("USB primeiro (conecta o LaserGRBL), depois os 12 V. Em seguida, `$H`.", "USB first (connect LaserGRBL), then the 12 V. Then `$H`."),
    desligar: tr("Primeiro os 12 V, depois o USB. Nunca mexa em plugue de motor com tudo ligado.", "The 12 V first, then USB. Never touch a motor plug with everything powered."),
    testes: [
      tr("Monitor Serial (115200), envie `?`: chave apertada mostra `Pn:X` / `Pn:Y`.", "Serial Monitor (115200), send `?`: a pressed switch shows `Pn:X` / `Pn:Y`."),
      tr("`M3 S220` desce a caneta; `M5` sobe.", "`M3 S220` lowers the pen; `M5` lifts it."),
      tr("`G91 G0 X10` deve ir para a direita e `G91 G0 Y10` para longe de você. Depois, `G90`.", "`G91 G0 X10` should move right and `G91 G0 Y10` away from you. Then `G90`."),
    ],
  },

  /* ---------------------------------------------------------------- 09 */
  firmware: {
    gravar: [
      tr("Baixe o fork **vankesteren/grbl-servo**: GRBL 1.1h com o servo no PWM do spindle, pino D11.", "Download the **vankesteren/grbl-servo** fork: GRBL 1.1h with the servo on the spindle PWM, pin D11."),
      tr("Copie a pasta `grbl` para `Documentos/Arduino/libraries`.", "Copy the `grbl` folder to `Documents/Arduino/libraries`."),
      tr("Na Arduino IDE: **Arquivo → Exemplos → grbl → grblUpload**, placa Arduino Uno, e grave.", "In the Arduino IDE: **File → Examples → grbl → grblUpload**, board Arduino Uno, and upload."),
      tr("O aviso “Low memory available” é normal no GRBL (92% de flash, 79% de RAM).", "The “Low memory available” warning is normal for GRBL (92% flash, 79% RAM)."),
      tr("Esse fork já vem com o homing só em X e Y, sem Z: não precisa recompilar nada.", "This fork already ships with homing on X and Y only, no Z: no need to recompile anything."),
    ],
    forkUrl: "https://github.com/vankesteren/grbl-servo",
    params: [
      ["`$32`", "**0**", tr("modo não-laser: **obrigatório** para o servo", "non-laser mode: **required** for the servo")],
      ["`$30`", "**255**", tr("escala do PWM. Com o padrão 1000, `S255` dava só 25% e o servo não se mexia", "PWM scale. With the default of 1000, `S255` gave only 25% and the servo didn't move")],
      ["`$100` / `$101`", "**80**", tr("1/16 de micropasso × 200 passos ÷ 40 mm por volta", "1/16 microstepping × 200 steps ÷ 40 mm per turn")],
      ["`$110` / `$111`", "12000", tr("200 mm/s nos deslocamentos", "200 mm/s on travel moves")],
      ["`$120` / `$121`", "800", tr("reduzir para 400 não melhorou as curvas", "dropping it to 400 didn't improve the curves")],
      ["`$130` / `$131`", "**810 / 390**", tr("curso útil medido; no Y sobram ~2 mm até o fim mecânico", "measured usable travel; on Y there's ~2 mm left to the mechanical limit")],
      ["`$3`", "**3**", tr("inverte X e Y; confira na sua montagem (capítulo 10)", "inverts X and Y; check it on your build (chapter 10)")],
      ["`$5`", "0", tr("fins de curso em NO (1 se usar NC)", "limit switches on NO (1 if you use NC)")],
      ["`$20` / `$21`", "1 / 0", tr("limite por software ligado; físico desligado", "soft limits on; hard limits off")],
      ["`$22` / `$23`", "1 / 0", tr("homing ligado, no sentido +", "homing on, in the + direction")],
      ["`$24` / `$25`", "200 / **4000**", tr("aproximação / busca. Acima de ~5000 a ponte de 1,2 kg bate forte na chave", "feed / seek. Above ~5000 the 1.2 kg gantry hits the switch hard")],
      ["`$26` / `$27`", "250 / 3", tr("debounce (ms) / recuo depois de tocar a chave (mm)", "debounce (ms) / pull-off after touching the switch (mm)")],
    ] as Row[],
    arquivos: [
      { label: "configuracao_grbl.txt", detail: tr("todos os $, comentados", "every $ setting, commented"), href: `${A}/firmware/configuracao_grbl.txt` },
      { label: "comandos_uteis.txt", detail: tr("cola do console", "console cheat sheet"), href: `${A}/firmware/comandos_uteis.txt` },
    ] satisfies Download[],
  },

  /* ---------------------------------------------------------------- 10 */
  calibracao: {
    sentido: [
      tr("Ligue, conecte o LaserGRBL (porta COM, **115200**) e desbloqueie com `$X`.", "Power on, connect LaserGRBL (COM port, **115200**) and unlock with `$X`."),
      tr(
        "Envie `G91 G0 X10`: a ponte deve ir para a **direita**. Envie `G91 G0 Y10`: o carro deve ir para **longe de você**. Depois, `G90`.",
        "Send `G91 G0 X10`: the gantry should move **right**. Send `G91 G0 Y10`: the carriage should move **away from you**. Then `G90`.",
      ),
      tr(
        "Se algum eixo for ao contrário, ajuste o `$3` (1 = inverte X, 2 = inverte Y, 3 = os dois) ou gire o plugue do motor 180° **com tudo desligado**.",
        "If an axis goes the wrong way, set `$3` (1 = invert X, 2 = invert Y, 3 = both) or turn the motor plug 180° **with everything powered off**.",
      ),
    ],
    sentidoNota: tr(
      "Aqui começou em `$3=2`; depois que o plugue do motor X foi reconectado invertido, passou para `$3=3`. Marque a orientação dos plugues.",
      "Mine started at `$3=2`; after the X motor plug was reconnected the other way around, it became `$3=3`. Mark the plug orientation.",
    ),
    escala: [
      tr("Rode o `teste_escala.gcode`: réguas de 150 mm (X) e 100 mm (Y).", "Run `teste_escala.gcode`: rulers of 150 mm (X) and 100 mm (Y)."),
      tr("Meça. Se der diferente: `$100 novo = $100 atual × (comandado ÷ medido)`.", "Measure. If it's off: `new $100 = current $100 × (commanded ÷ measured)`."),
      tr(
        "Na minha, 150 mm em X pararam **exatamente** na marca, e 20 mm em Y deram 20 mm exatos no paquímetro.",
        "On mine, 150 mm on X stopped **exactly** on the mark, and 20 mm on Y measured exactly 20 mm with calipers.",
      ),
    ],
    escalaAviso: tr(
      "Um primeiro teste de ±10 mm indicou só 7 mm. Era folga ou erro de leitura num deslocamento pequeno, não erro de escala. Meça sempre distâncias longas, e num sentido só.",
      "A first ±10 mm test showed only 7 mm. That was backlash or a misreading on a short move, not a scale error. Always measure long distances, in one direction only.",
    ),
    homing: [
      tr("Antes do primeiro `$H`, confira que X+ e Y+ apontam para as chaves.", "Before the first `$H`, check that X+ and Y+ point toward the switches."),
      tr(
        "Com a ponte e o carro no meio do curso, envie `$H` (o botão da casinha). Os dois eixos vão até as chaves, recuam, encostam devagar e recuam de novo.",
        "With the gantry and carriage mid-travel, send `$H` (the house button). Both axes move to the switches, back off, touch again slowly and back off once more.",
      ),
      tr(
        "Rode **uma vez** o `configurar_origem.gcode`. Ele grava na EEPROM que o (0,0) do papel fica no **canto da frente à esquerda**.",
        "Run `configurar_origem.gcode` **once**. It stores in EEPROM that the paper's (0,0) is at the **front left corner**.",
      ),
    ],
    origem: tr(
      `G92.1
G10 L2 P1 X-810 Y-390
G90
G0 X0 Y0
; a caneta para em cima do (0,0): marque esse ponto na mesa`,
      `G92.1
G10 L2 P1 X-810 Y-390
G90
G0 X0 Y0
; the pen stops above (0,0): mark this point on the table`,
    ),
    origemNota: tr(
      "Depois de cada `$H`, o (0,0) volta exatamente ao mesmo ponto físico, e as coordenadas do desenho vão de 0 a 810 (X) e de 0 a 390 (Y), todas positivas, como no Inkscape.",
      "After every `$H`, (0,0) returns to exactly the same physical point, and drawing coordinates run from 0 to 810 (X) and 0 to 390 (Y), all positive, as in Inkscape.",
    ),
    escuro: tr(
      "A máquina não tem sensor do lado oposto. No `$H` ela encosta na chave e chama aquele ponto de zero; depois só conta passos, 80 por mm. É como andar numa garagem escura contando os passos a partir da parede. Se você empurrar a ponte com a mão, ou a máquina perder passos, faça `$H` de novo.",
      "The machine has no sensor on the far side. On `$H` it touches the switch and calls that point zero; after that it just counts steps, 80 per mm. It's like walking through a dark garage counting your steps from the wall. If you push the gantry by hand, or the machine loses steps, run `$H` again.",
    ),
    gabarito: tr(
      "Desenhe um gabarito na madeira da mesa com a própria máquina: o limite da área útil, réguas a cada 10 mm e os cantos de A4 e A3. Fica muito mais fácil posicionar o papel.",
      "Have the machine draw a template on the wooden table: the work area boundary, rulers every 10 mm and the A4 and A3 corners. It makes placing the paper much easier.",
    ),
    caneta: [
      [tr("Caneta em cima", "Pen up"), "`M5`", tr("o servo empurra o pino do Pen Holder para cima", "the servo pushes the Pen Holder pin up")],
      [tr("Caneta embaixo", "Pen down"), "`M3 S220`", tr("o servo gira ~78° e a caneta desce por completo", "the servo turns ~78° and the pen drops all the way")],
    ] as Row[],
    canetaNotas: [
      tr(
        "**`M5` = caneta em cima, por segurança:** o GRBL executa `M5` ao ligar, resetar ou entrar em alarme, então qualquer pane levanta a caneta sozinha, como o freio de caminhão, que vem acionado por padrão.",
        "**`M5` = pen up, for safety:** GRBL runs `M5` on power-up, reset or alarm, so any fault lifts the pen on its own, like truck air brakes, which are engaged by default.",
      ),
      tr(
        "Depois de cada `M3` ou `M5`, o G-code leva `G4 P0.3`: o servo completa o curso antes de andar.",
        "After every `M3` or `M5`, the G-code has a `G4 P0.3`: the servo finishes its travel before the machine moves.",
      ),
      tr(
        "**Altura:** com a caneta embaixo, a ponta apoia no papel com o Pen Holder 2–3 mm acima do batente. Com `M5`, a ponta sai do papel com pelo menos 3 mm de folga.",
        "**Height:** with the pen down, the tip rests on the paper with the Pen Holder 2–3 mm above the end stop. With `M5`, the tip clears the paper by at least 3 mm.",
      ),
      tr(
        "**Pressão:** só com o peso do Pen Holder a esferográfica encostava mas **não riscava**. A mola resolveu.",
        "**Pressure:** with just the Pen Holder's weight, the ballpoint touched the paper but **didn't draw**. The spring fixed it.",
      ),
    ],
    testes: [
      { file: "teste_escala.gcode", what: tr("Réguas de 150 mm em X e 100 mm em Y.", "Rulers of 150 mm on X and 100 mm on Y."), ok: tr("as marcas batem com a régua de verdade.", "the marks match a real ruler.") },
      { file: "teste_caneta.gcode", what: tr("Uma fileira de tracinhos curtos, sobe e desce.", "A row of short dashes, up and down."), ok: tr("cada tracinho começa e termina nítido.", "every dash starts and ends crisp.") },
      {
        file: "teste_quadrado_circulo_F500.gcode",
        what: tr("O primeiro desenho da máquina: quadrado e círculo em F500.", "The machine's first drawing: a square and a circle at F500."),
        ok: tr("o círculo fecha liso, sem tremer.", "the circle closes smoothly, with no wobble."),
      },
      {
        file: "teste_velocidades.gcode",
        what: tr("Retas e círculos em velocidades crescentes (capítulo 12).", "Lines and circles at increasing speeds (chapter 12)."),
        ok: tr("até F1500 não dá para ver diferença.", "up to F1500 you can't see a difference."),
      },
    ],
    origemFile: { label: "configurar_origem.gcode", detail: tr("rode uma vez, depois de um $H", "run once, after a $H"), href: `${A}/firmware/configurar_origem.gcode` },
  },

  /* ---------------------------------------------------------------- 11 */
  rotina: {
    passos: [
      tr("Ligar → conectar o LaserGRBL → **`$H`**.", "Power on → connect LaserGRBL → **`$H`**."),
      tr("Colocar o papel com o canto no (0,0), usando o gabarito da mesa.", "Place the paper with its corner at (0,0), using the template on the table."),
      tr("Abrir o arquivo `.gcode` → play.", "Open the `.gcode` file → play."),
      tr(
        "Entre desenhos **não precisa** refazer o `$H`: o G-code é absoluto (`G90`) e a máquina vai sozinha ao primeiro ponto com a caneta levantada.",
        "Between drawings you **don't need** to redo `$H`: the G-code is absolute (`G90`) and the machine moves to the first point on its own with the pen up.",
      ),
      tr(
        "Refaça o `$H` depois de: desligar, reconectar, reset, alarme ou empurrar a máquina com a mão.",
        "Redo `$H` after: powering off, reconnecting, a reset, an alarm or pushing the machine by hand.",
      ),
    ],
    dicas: [
      tr(
        "Não aceite a sugestão de ativar o **Laser Mode** (`$32=1`): o servo para de funcionar.",
        "Don't accept the prompt to enable **Laser Mode** (`$32=1`): the servo stops working.",
      ),
      tr("Casinha = `$H`; raio = reset; cadeado = `$X`.", "House = `$H`; lightning bolt = reset; padlock = `$X`."),
      tr("Ao abrir a porta serial, o Uno reinicia: toda reconexão exige um novo `$H`.", "Opening the serial port restarts the Uno: every reconnect needs a new `$H`."),
      tr(
        "Depois de usar `G91`, volte para `G90`. Senão `G0 X0 Y0` vira “andar 0 mm” e parece que a máquina ignorou o comando.",
        "After using `G91`, switch back to `G90`. Otherwise `G0 X0 Y0` means “move 0 mm” and it looks like the machine ignored the command.",
      ),
      tr(
        "Comentários no G-code: use `;`. Parênteses aninhados como `( centro (60,60) )` dão o erro “Expected command letter”.",
        "G-code comments: use `;`. Nested parentheses like `( center (60,60) )` cause the “Expected command letter” error.",
      ),
      tr(
        "O LaserGRBL esconde a resposta do `?`. Para ver os pinos (`Pn:X`, `Pn:Y`), use o Monitor Serial da Arduino IDE com o LaserGRBL desconectado: só um programa usa a porta por vez.",
        "LaserGRBL hides the response to `?`. To see the pins (`Pn:X`, `Pn:Y`), use the Arduino IDE Serial Monitor with LaserGRBL disconnected: only one program can use the port at a time.",
      ),
    ],
    comandos: tr(
      `$H              homing (botão da casinha)
$X              desbloquear depois de alarme (cadeado)
$$              listar todas as configurações
M5              caneta EM CIMA
M3 S220         caneta EMBAIXO
G4 P0.3         pausa de 0,3 s (espera o servo)
G90             coordenadas absolutas (padrão)
G91             coordenadas relativas (lembre de voltar para G90)
G0 X0 Y0        ir para a origem do papel
$J=G91 X10 F1000    jog: andar 10 mm em X`,
      `$H              homing (house button)
$X              unlock after an alarm (padlock)
$$              list all settings
M5              pen UP
M3 S220         pen DOWN
G4 P0.3         0.3 s pause (waits for the servo)
G90             absolute coordinates (default)
G91             relative coordinates (remember to switch back to G90)
G0 X0 Y0        go to the paper origin
$J=G91 X10 F1000    jog: move 10 mm on X`,
    ),
  },

  /* ---------------------------------------------------------------- 12 */
  traco: {
    micropasso: tr(
      "O primeiro desenho, quadrado + círculo, foi feito em **passo cheio**: as retas saíram boas, mas o círculo saiu tremido e com um barulho diferente no motor. Em passo cheio cada passo anda 0,2 mm num tranco; na curva, cada eixo acelera e freia o tempo todo e passa pela faixa em que o NEMA 17 entra em **ressonância** (~100–250 passos/s). Com **1/16**, cada passo anda 0,0125 mm. Passo cheio é descer uma escada de degraus altos; micropasso é descer uma rampa.",
      "The first drawing, square + circle, was done in **full step**: the lines came out clean, but the circle was shaky and the motor made an odd noise. In full step each step moves 0.2 mm in one jolt; on a curve, each axis keeps accelerating and braking and passes through the range where the NEMA 17 hits **resonance** (~100–250 steps/s). At **1/16**, each step moves 0.0125 mm. Full step is walking down a staircase with tall steps; microstepping is walking down a ramp.",
    ),
    figuras: [
      { v: tr("0,2 mm", "0.2 mm"), k: tr("por passo, em passo cheio", "per step, in full step") },
      { v: tr("0,0125 mm", "0.0125 mm"), k: tr("por micropasso, em 1/16", "per microstep, at 1/16") },
      { v: "F500", k: tr("velocidade de trabalho", "working speed") },
      { v: "F1500", k: tr("ainda sem perda visível", "still no visible loss") },
    ],
    testes: [
      [tr("Retas de 400 mm (X) e 360 mm (Y), nos dois sentidos, F1500", "400 mm (X) and 360 mm (Y) lines, both directions, F1500"), tr("**perfeitas**", "**perfect**")],
      [tr("Círculos r = 40 mm em F500 e F1000", "r = 40 mm circles at F500 and F1000"), tr("**impecáveis**", "**flawless**")],
      [tr("Círculo em F2000", "Circle at F2000"), tr("pequenas ondulações, só bem de perto", "small ripples, only up close")],
      [tr("Círculo em F4000", "Circle at F4000"), tr("um pouco mais de ondulação, ainda sutil", "a bit more ripple, still subtle")],
      [tr("F2000 com aceleração 400", "F2000 with acceleration 400"), tr("**não** melhorou", "did **not** improve")],
    ] as Row[],
    conclusao: tr(
      "Não é folga, que apareceria em qualquer velocidade, nem polia ou driver, que apareceriam nas retas. As ondulações só aparecem com **curva + velocidade**: é um efeito **dinâmico** da elasticidade da correia e da massa da ponte. É como carregar um copo cheio andando em círculo: devagar a água fica parada, rápido ela balança.",
      "It's not backlash, which would show at any speed, nor a pulley or driver, which would show on the lines. The ripples only appear with **curve + speed**: it's a **dynamic** effect of belt elasticity and gantry mass. It's like carrying a full glass while walking in a circle: slowly the water stays still, fast it sloshes.",
    ),
    decisao: tr(
      "**F500** com velocidade fixa para precisão máxima. F1000–1500 ainda sai muito bom. Os deslocamentos com a caneta levantada (`G0`) continuam rápidos.",
      "**F500** at a fixed speed for maximum precision. F1000–1500 still comes out very good. Pen-up travel moves (`G0`) stay fast.",
    ),
  },

  /* ---------------------------------------------------------------- 13 */
  gcode: {
    cadeia: [tr("Imagem ou SVG", "Image or SVG"), tr("SVG de traço único", "Single-stroke SVG"), "vpype", "G-code", "LaserGRBL", "GRBL"],
    svg: tr(
      "O `svg_para_gcode.py` faz tudo de uma vez: junta traços que se encostam, tira sujeira (< 0,6 mm), **ordena os traços** para a caneta andar o mínimo possível levantada, encaixa o desenho no papel e gera o G-code com `M3 S220` / `M5`, `G4 P0.3` e **F500 em todas as linhas G1**. No pôster do F-16, a ordenação reduziu o deslocamento com a caneta levantada de ~112 m para ~5 m.",
      "`svg_para_gcode.py` does it all in one go: it merges strokes that touch, removes specks (< 0.6 mm), **sorts the strokes** so the pen travels as little as possible while up, fits the drawing to the paper and generates G-code with `M3 S220` / `M5`, `G4 P0.3` and **F500 on every G1 line**. On the F-16 poster, sorting cut pen-up travel from ~112 m to ~5 m.",
    ),
    // as opções (--papel, --margem, --rotacao) são as do script: não mudam com o idioma
    svgCmd: tr(
      `pip install vpype vpype-gcode
python svg_para_gcode.py desenho.svg --papel a4
python svg_para_gcode.py desenho.svg --papel 600x385 --margem 10 --rotacao -90`,
      `pip install vpype vpype-gcode
python svg_para_gcode.py drawing.svg --papel a4
python svg_para_gcode.py drawing.svg --papel 600x385 --margem 10 --rotacao -90`,
    ),
    centerline: tr(
      "Para plotter, o desenho precisa ser de **traço único (centerline)**. O “Vetorizar bitmap” do Inkscape contorna as **bordas** de cada linha, e a caneta passaria duas vezes em cada traço. O processo que funcionou:",
      "For a plotter, the drawing has to be **single-stroke (centerline)**. Inkscape's “Trace Bitmap” follows the **edges** of each line, so the pen would go over every stroke twice. The process that worked:",
    ),
    passos: [
      tr("Normalizar o fundo da imagem e ampliar 4×.", "Normalize the image background and upscale 4×."),
      tr(
        "Achar o **centro** de cada linha (filtro de crista + limiar com histerese). Isso separa linhas paralelas que estão quase coladas.",
        "Find the **center** of each line (ridge filter + hysteresis threshold). This separates parallel lines that are almost touching.",
      ),
      tr("Preencher as “células” pequenas de sombreado, esqueletizar e podar os espinhos.", "Fill the small shading “cells”, skeletonize and prune the spurs."),
      tr("Suavizar e simplificar os traços.", "Smooth and simplify the strokes."),
      tr(
        "Refazer os textos com **fonte Hershey** (traço único). Acentos como Ç, Ã e É não existem nessas fontes: desenhe-os como traços próprios.",
        "Redo the text in a **Hershey font** (single-stroke). Accented letters like Ç, Ã and É don't exist in these fonts: draw the accents as separate strokes.",
      ),
    ],
    fotosDica: tr("Para fotos, o **DrawingBotV3** gera arte de linhas própria para plotter.", "For photos, **DrawingBotV3** generates line art made for plotters."),
    f16: [
      { v: tr("~2.200", "~2,200"), k: tr("traços", "strokes") },
      { v: tr("26,5 m", "26.5 m"), k: tr("de caneta no papel", "of pen on paper") },
      { v: "~84 min", k: tr("em F500", "at F500") },
      { v: "112 → 5 m", k: tr("de caneta no ar, depois de ordenar", "of pen-up travel, after sorting") },
    ],
    f16Scripts: [
      { label: "1_vetorizar_centerline.py", detail: tr("acha o eixo de cada linha", "finds each line's centerline"), href: `${A}/software/exemplo-f16/1_vetorizar_centerline.py` },
      { label: "2_remover_vista_do_meio.py", detail: tr("edição por regiões", "region-based editing"), href: `${A}/software/exemplo-f16/2_remover_vista_do_meio.py` },
      { label: "3_montar_poster.py", detail: tr("moldura, textos Hershey, tabela", "frame, Hershey text, table"), href: `${A}/software/exemplo-f16/3_montar_poster.py` },
      { label: "plotter.toml", detail: tr("perfil do vpype-gcode", "vpype-gcode profile"), href: `${A}/software/exemplo-f16/plotter.toml` },
      { label: "renderizar_previa.py", detail: tr("simula uma caneta de 0,5 mm", "simulates a 0.5 mm pen"), href: `${A}/software/exemplo-f16/renderizar_previa.py` },
    ] satisfies Download[],
    vpype: `vpype read f16c_raw.svg linemerge -l 1 --tolerance 0.35mm \\
  linesimplify -l 1 --tolerance 0.03mm filter -l 1 --min-length 0.6mm \\
  reloop lmove all 1 linesort --two-opt write --page-size 385mmx600mm poster.svg

vpype -c plotter.toml read poster.svg rotate -- -90 \\
  layout --landscape 600mmx385mm linesort --two-opt gwrite -p cnc_artur poster.gcode`,
    laserGrbl: [
      [tr("Velocidade", "Speed"), "500"],
      [tr("Modo", "Mode"), "`M3 - Constant Power`"],
      ["S-MIN", tr("0 (caneta em cima)", "0 (pen up)")],
      ["S-MAX", tr("220 (caneta embaixo)", "220 (pen down)")],
      [tr("Suporte a PWM", "PWM support"), tr("ativado nas configurações do LaserGRBL", "enabled in the LaserGRBL settings")],
    ] as Row[],
    laserGrblAviso: tr(
      "O LaserGRBL não insere pausa para o servo, então o começo de alguns traços pode falhar. Os arquivos gerados pelo `svg_para_gcode.py` já têm a pausa.",
      "LaserGRBL doesn't add a pause for the servo, so the start of some strokes can be missed. Files generated by `svg_para_gcode.py` already include the pause.",
    ),
    simulador: tr(
      "A aba **Escrever** do simulador lá em cima faz o mesmo caminho com um texto: fonte Hershey de traço único, encaixe no papel, um `G0` até o começo de cada traço, `M3` para baixar, os `G1` e `M5` para subir. O G-code pode ser baixado.",
      "The simulator's **Write** tab up top does the same thing with text: a single-stroke Hershey font, fit to the paper, a `G0` to the start of each stroke, `M3` to lower the pen, the `G1` moves and `M5` to lift it. You can download the G-code.",
    ),
    software: [
      { label: "svg_para_gcode.py", detail: tr("SVG → G-code da máquina", "SVG → G-code for the machine"), href: `${A}/software/svg_para_gcode.py` },
      { label: "logo_cnc_plotter.py", detail: tr("gera o logo em traço único", "generates the single-stroke logo"), href: `${A}/software/logo_cnc_plotter.py` },
      { label: "gerar_testes.py", detail: tr("gera os G-codes de teste", "generates the test G-codes"), href: `${A}/software/gerar_testes.py` },
    ] satisfies Download[],
  },

  /* ---------------------------------------------------------------- 14 */
  problemas: [
    [
      tr("LaserGRBL acusa `UnexpectedReset` logo depois do primeiro `M3`", "LaserGRBL reports `UnexpectedReset` right after the first `M3`"),
      tr("servo ligado no 5 V do Arduino (queda de tensão)", "servo powered from the Arduino's 5 V (voltage drop)"),
      tr("alimentar o servo pelo step-down", "power the servo from the step-down"),
    ],
    [
      tr("`G0 X0 Y0` “não faz nada”", "`G0 X0 Y0` “does nothing”"),
      tr("o Arduino resetou e perdeu a origem, ou ficou em `G91`", "the Arduino reset and lost its origin, or it was left in `G91`"),
      tr("refazer `$H`; enviar `G90`", "redo `$H`; send `G90`"),
    ],
    [tr("Servo não mexe", "Servo doesn't move"), tr("`$32=1` (laser) ou `$30=1000`", "`$32=1` (laser) or `$30=1000`"), tr("`$32=0` e `$30=255`", "`$32=0` and `$30=255`")],
    [
      tr("Servo gira ao contrário no meio do desenho", "Servo turns the wrong way mid-drawing"),
      tr("servo com defeito ou ruído (aconteceu uma vez com o MG90S)", "faulty servo or noise (happened once with the MG90S)"),
      tr("religar; se repetir, trocar o servo", "power cycle; if it happens again, replace the servo"),
    ],
    [tr("Caneta encosta mas não risca", "Pen touches but doesn't draw"), tr("pouca pressão", "not enough pressure"), tr("mola no Pen Holder; conferir o `S220`", "spring in the Pen Holder; check the `S220`")],
    [
      tr("Caneta raspa e trava no carro", "Pen rubs and jams in the carriage"),
      tr("folga zero entre a caneta e o carro (v2)", "zero clearance between the pen and the carriage (v2)"),
      tr("carro v3, com rasgo aberto de 16 mm", "v3 carriage, with the 16 mm open slot"),
    ],
    [
      tr("Ponte trepida de vez em quando", "Gantry chatters now and then"),
      tr("ponte hiperestática (rolamentos demais brigando)", "over-constrained gantry (too many bearings fighting)"),
      tr("2 LM12UU no fundo, que guiam, e 1 só na frente, que apoia", "2 LM12UU at the back that guide, and just 1 at the front that supports"),
    ],
    [tr("Curvas onduladas", "Wavy curves"), tr("velocidade alta (efeito dinâmico)", "high speed (dynamic effect)"), "F500–F1500"],
    [tr("Círculo tremido e barulho no motor", "Shaky circle and motor noise"), tr("passo cheio (ressonância)", "full step (resonance)"), tr("jumpers 1/16 e `$100=$101=80`", "1/16 jumpers and `$100=$101=80`")],
    [tr("Carro bateu no fim do curso", "Carriage crashed at the end of travel"), tr("perda de passos (aceleração alta)", "lost steps (high acceleration)"), tr("aceleração ≤ 800 mm/s²", "acceleration ≤ 800 mm/s²")],
    [tr("Motor dá “espasmos” sem andar", "Motor “twitches” without moving"), tr("mau contato num fio do motor", "bad contact on a motor wire"), tr("refazer o conector, com tudo desligado", "redo the connector, with everything powered off")],
    [tr("Eixo anda ao contrário", "Axis moves backwards"), tr("plugue do motor invertido", "motor plug reversed"), tr("`$3` ou girar o plugue", "`$3` or turn the plug around")],
    ["`ALARM:2`", tr("destino fora da área (limite por software)", "target outside the work area (soft limit)"), tr("conferir o desenho e a origem; `$X`", "check the drawing and the origin; `$X`")],
    [tr("Erro “Expected command letter”", "“Expected command letter” error"), tr("parênteses aninhados no comentário", "nested parentheses in a comment"), tr("usar comentários com `;`", "use `;` comments")],
    [
      tr("Alarme falso de fim de curso com o motor andando", "False limit switch alarm while the motor runs"),
      tr("ruído no fio da chave", "noise on the switch wire"),
      tr("trançar sinal + GND, afastar dos motores, 100 nF perto do shield", "twist signal + GND, route away from the motors, 100 nF near the shield"),
    ],
    [
      tr("UGS não conecta (botões desabilitados)", "UGS won't connect (buttons disabled)"),
      tr("não identificada", "not identified"),
      tr("usar o LaserGRBL, que conecta de primeira", "use LaserGRBL, which connects on the first try"),
    ],
  ] as Row[],

  /* ---------------------------------------------------------------- lições */
  licoes: [
    {
      title: tr("Trilho emendado não alinha", "A spliced rail won't line up"),
      text: tr(
        "A primeira tentativa usou trilhos MGN15H de 50 cm emendados com peça impressa. O carro tremia e travava na junção: emenda impressa nunca fica alinhada o bastante.",
        "The first attempt used 50 cm MGN15H rails joined with a printed part. The carriage shook and jammed at the joint: a printed splice never lines up well enough.",
      ),
    },
    {
      title: tr("Barra fina enverga e se desgasta", "A thin rod sags and wears out"),
      text: tr(
        "Uma barra de inox de 6 mm no apoio oposto do eixo longo envergava com o peso, pedindo contraflecha, e os rolamentos “comiam” a barra. As barras de 12 mm com LM12UU resolveram.",
        "A 6 mm stainless rod on the far support of the long axis sagged under the weight, needing a pre-camber, and the bearings “ate into” the rod. The 12 mm rods with LM12UU fixed it.",
      ),
    },
    {
      title: tr("Guiar de um lado, apoiar do outro", "Guide on one side, support on the other"),
      text: tr(
        "Com 4 rolamentos a ponte era hiperestática e trepidava. Ficou com 3: dois que guiam e um que só apoia.",
        "With 4 bearings the gantry was over-constrained and chattered. It ended up with 3: two that guide and one that only supports.",
      ),
    },
    {
      title: tr("Carro v1 → v2", "Carriage v1 → v2"),
      text: tr(
        "O servo não cabia (vão de 15,9 mm para um corpo de 22,5 mm), os furos dele eram grandes demais, o braço batia no Pen Holder e o fim de curso quase não era acionado.",
        "The servo didn't fit (a 15.9 mm opening for a 22.5 mm body), its holes were too big, the horn hit the Pen Holder and the limit switch barely got triggered.",
      ),
    },
    {
      title: tr("Carro v2 → v3", "Carriage v2 → v3"),
      text: tr(
        "A caneta raspava no “C” do carro. A v3 trouxe rasgo aberto, canal em V, guias duplas e mais rigidez, em PETG.",
        "The pen rubbed against the carriage's “C”. v3 brought an open slot, a V-groove, double guides and more rigidity, in PETG.",
      ),
    },
    {
      title: tr("Servo com fonte própria", "A dedicated supply for the servo"),
      text: tr(
        "No 5 V do USB, o servo resetava o Arduino no meio do desenho. Um step-down só para ele acabou com os resets.",
        "On the USB 5 V, the servo reset the Arduino mid-drawing. A step-down just for it ended the resets.",
      ),
    },
  ],
};

/* ------------------------------------------------------------------ resultados */

export type Resultado = {
  id: string;
  title: Text;
  /** papel e tamanho */
  meta: Text;
  text: Text;
  /** sem foto: a prévia fica como a imagem do resultado */
  foto?: FotoId;
  /** prévia digital, enquanto a foto não chega */
  previa?: { src: string; alt: Text; fit?: "contain" | "cover" };
  numeros?: { v: Text; k: Text }[];
  arquivos?: Download[];
  destaque?: boolean;
};

export const resultados: Resultado[] = [
  {
    id: "f16",
    title: "F-16 Fighting Falcon",
    meta: tr("cartolina · 600 × 385 mm · F500", "poster board · 600 × 385 mm · F500"),
    text: tr(
      "Uma imagem de 736 × 1104 px, borrada em várias partes, vetorizada pelo eixo das linhas e montada como pôster técnico: três vistas, cota, tabela e rodapé em fonte de traço único, com os acentos desenhados à mão.",
      "A 736 × 1104 px image, blurry in several places, vectorized along the line centers and laid out as a technical poster: three views, a dimension, a table and a footer in a single-stroke font, with the accents drawn by hand.",
    ),
    foto: "f16",
    previa: {
      src: `${IMG}/f16-previa.webp`,
      alt: tr(
        "Prévia do pôster do F-16: três vistas do caça, tabela de características e o título no topo, em traço de caneta.",
        "Preview of the F-16 poster: three views of the fighter, a spec table and the title at the top, in pen strokes.",
      ),
      fit: "contain",
    },
    numeros: [
      { v: tr("~2.200", "~2,200"), k: tr("traços", "strokes") },
      { v: tr("26,5 m", "26.5 m"), k: tr("de caneta", "of pen") },
      { v: "~84 min", k: tr("de máquina", "of machine time") },
    ],
    arquivos: [
      { label: "G-code", detail: "360 KB", href: `${A}/gcode/desenhos/f16_poster_cartolina_600x385_F500.gcode` },
      { label: "SVG", detail: "298 KB", href: `${A}/gcode/desenhos/f16_poster_cartolina_600x385.svg` },
    ],
    destaque: true,
  },
  {
    id: "logo",
    title: tr("Logo do projeto", "Project logo"),
    meta: tr("folha A4 · F500", "A4 sheet · F500"),
    text: tr(
      "Engrenagem, caneta e o nome em traço único, gerados em Python: o desenho que a máquina faz para se apresentar.",
      "A gear, a pen and the name in single stroke, generated in Python: the drawing the machine makes to introduce itself.",
    ),
    previa: {
      src: `${IMG}/logo.svg`,
      alt: tr(
        "Logo CNC Plotter: uma engrenagem com uma caneta na frente e o nome ao lado, em traço único.",
        "CNC Plotter logo: a gear with a pen in front and the name beside it, in single stroke.",
      ),
      fit: "contain",
    },
    arquivos: [{ label: "G-code", detail: "8 KB", href: `${A}/gcode/desenhos/logo_cnc_plotter_A4_F500.gcode` }],
  },
  {
    id: "primeiro",
    title: tr("O primeiro desenho", "The first drawing"),
    meta: tr("07/11/2026 · passo cheio", "Nov 7, 2026 · full step"),
    text: tr(
      "Quadrado e círculo. As retas saíram boas; o círculo tremeu, e foi isso que levou ao micropasso de 1/16.",
      "A square and a circle. The lines came out clean; the circle wobbled, and that's what led to 1/16 microstepping.",
    ),
    foto: "primeiro",
    arquivos: [{ label: "G-code", detail: "1 KB", href: `${A}/gcode/testes/teste_quadrado_circulo_F500.gcode` }],
  },
  {
    id: "velocidades",
    title: tr("Cartolina de testes", "Test poster board"),
    meta: tr("cartolina · F500 a F4000", "poster board · F500 to F4000"),
    text: tr(
      "Retas e círculos em velocidades crescentes, de F500 a F4000, para achar onde o traço começa a ondular.",
      "Lines and circles at increasing speeds, from F500 to F4000, to find where the stroke starts to ripple.",
    ),
    foto: "cartolina",
    arquivos: [{ label: "G-code", detail: "1 KB", href: `${A}/gcode/testes/teste_velocidades.gcode` }],
  },
];
