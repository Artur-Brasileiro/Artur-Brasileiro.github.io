/** Case da CNC plotter: ficha, marcos e números da página (o guia mora em cncGuia.ts). */

import { tr } from "@/i18n/core";

/* ------------------------------------------------------------------ */
/* Case: CNC Plotter                                                   */
/* ------------------------------------------------------------------ */

export const cnc = {
  title: "CNC Plotter",
  category: tr("Hardware & mecânica", "Hardware & mechanics"),
  status: tr("Funcionando", "Working"),
  statusNote: tr("Carro v3 · homing e origem fixa", "Carriage v3 · homing and fixed origin"),
  summary: tr(
    "Uma plotter de mesa grande, feita em casa: barras de aço de 1 metro, correias GT2 e dois NEMA 17 levam uma caneta por uma área de 810 × 390 mm, com Arduino e GRBL. A máquina inteira está modelada no FreeCAD, e é esse modelo que desenha aqui embaixo. Logo depois vem o guia para montar a sua.",
    "A large homemade tabletop plotter: 1-meter steel rods, GT2 belts and two NEMA 17 motors move a pen across an 810 × 390 mm area, with an Arduino running GRBL. The whole machine is modeled in FreeCAD, and that model is what's drawing below. Right after it comes the guide to build your own.",
  ),
  specs: [
    { label: tr("Área útil", "Work area"), value: "810 × 390 mm" },
    { label: tr("Eixo X", "X axis"), value: tr("2 × barra Ø12 × 1000 mm · 3 × LM12UU", "2 × Ø12 × 1000 mm rod · 3 × LM12UU") },
    { label: tr("Eixo Y", "Y axis"), value: tr("2 × barra Ø6 × 500 mm · 4 × LM6UU", "2 × Ø6 × 500 mm rod · 4 × LM6UU") },
    { label: tr("Motores", "Motors"), value: "2 × NEMA 17 (17HS4401S)" },
    { label: tr("Transmissão", "Drive"), value: tr("Correia GT2 6 mm · polias 20T", "GT2 6 mm belt · 20T pulleys") },
    { label: tr("Caneta", "Pen"), value: tr("Servo MG90S · Pen Holder em LM6UU", "MG90S servo · Pen Holder on LM6UU") },
    { label: tr("Controle", "Control"), value: "Arduino Uno + CNC Shield · GRBL 1.1h" },
    { label: tr("Resolução", "Resolution"), value: tr("80 passos/mm (1/16 de micropasso)", "80 steps/mm (1/16 microstepping)") },
  ],
  /** como cada eixo se move */
  mechanics: [
    {
      ref: "X",
      title: tr("Eixo X em ômega", "Omega-drive X axis"),
      text: tr(
        "A correia do eixo longo fica presa nos dois suportes do fundo e não se move. O motor viaja com a ponte e passa a correia por duas polias loucas e pela própria polia, num desenho de ômega: girando, ele “escala” a correia e arrasta a ponte inteira, de 1,2 kg, sobre as barras de 12 mm.",
        "The belt on the long axis is clamped to the two rear supports and never moves. The motor rides on the gantry and routes the belt around two idler pulleys and its own pulley in an omega shape: as it turns, it “climbs” the belt and drags the whole 1.2 kg gantry along the 12 mm rods.",
      ),
    },
    {
      ref: "Y",
      title: tr("Eixo Y em laço", "Looped-belt Y axis"),
      text: tr(
        "No eixo curto a correia fecha um laço entre a polia do motor, preso por baixo da Base Principal, e a polia louca do Apoio Secundário. As duas pontas dão a volta no pino de uma presilha do carro e travam dente com dente; um M3 no rasgo ajusta a tensão.",
        "On the short axis, the belt forms a loop between the pulley of the motor, mounted under the Main Base, and the idler pulley on the Secondary Support. Both ends wrap around the pin of a clamp on the carriage and lock tooth to tooth; an M3 screw in the slot sets the tension.",
      ),
    },
    {
      ref: "Z",
      title: tr("Caneta por gravidade", "Gravity-lowered pen"),
      text: tr(
        "O Pen Holder corre em quatro LM6UU, em duas hastes. O braço do servo MG90S só levanta a caneta; para baixar, ele sai da frente e o Pen Holder desce pelo próprio peso e por uma mola, acompanhando qualquer ondulação da mesa.",
        "The Pen Holder slides on four LM6UU bearings, on two rods. The MG90S servo arm only lifts the pen; to lower it, the arm moves out of the way and the Pen Holder drops under its own weight and a spring, following any unevenness in the table.",
      ),
    },
  ],
  /** linha do tempo (especificacoes.json do pacote); fica aqui e não no guia para o texto do guia não entrar no primeiro carregamento */
  marcos: [
    { data: tr("06/11", "Nov 6"), text: tr("Ligação dos motores corrigida (X ↔ Y)", "Motor wiring fixed (X ↔ Y)") },
    { data: tr("07/11", "Nov 7"), text: tr("Primeiro desenho no papel: quadrado + círculo, em passo cheio", "First drawing on paper: square + circle, in full-step mode") },
    { data: tr("08/11", "Nov 8"), text: tr("Fins de curso instalados", "Limit switches installed") },
    { data: tr("10/11", "Nov 10"), text: tr("Carro e Pen Holder v3 projetados", "Carriage and Pen Holder v3 designed") },
    { data: tr("12/11", "Nov 12"), text: tr("Micropasso 1/16, eletrônica fixada, carro v3 montado", "1/16 microstepping, electronics mounted, carriage v3 assembled") },
    { data: tr("13/11", "Nov 13"), text: tr("Homing, origem fixa, testes de traço e gabarito desenhado na mesa", "Homing, fixed origin, line tests and a template drawn on the table") },
    { data: tr("14/11", "Nov 14"), text: tr("G-code do pôster do F-16 e o caminho imagem → SVG → G-code", "G-code for the F-16 poster and the image → SVG → G-code pipeline") },
  ],
  numbers: [
    { value: "810 × 390", label: tr("mm de área útil", "mm work area") },
    { value: tr("0,0125", "0.0125"), label: tr("mm por micropasso", "mm per microstep") },
    { value: "F500", label: tr("velocidade de desenho", "drawing speed") },
    { value: "200 mm/s", label: tr("com a caneta no ar", "with the pen up") },
  ],
};

