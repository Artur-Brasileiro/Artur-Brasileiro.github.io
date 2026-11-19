/** Case da CNC plotter: ficha, marcos e números da página (o guia mora em cncGuia.ts). */

/* ------------------------------------------------------------------ */
/* Case: CNC Plotter                                                   */
/* ------------------------------------------------------------------ */

export const cnc = {
  title: "CNC Plotter",
  category: "Hardware & mecânica",
  status: "Funcionando",
  statusNote: "Carro v3 · homing e origem fixa",
  summary:
    "Uma plotter de mesa grande, feita em casa: barras de aço de 1 metro, correias GT2 e dois NEMA 17 levam uma caneta por uma área de 810 × 390 mm, com Arduino e GRBL. A máquina inteira está modelada no FreeCAD, e é esse modelo que desenha aqui embaixo. Logo depois vem o guia para montar a sua.",
  specs: [
    { label: "Área útil", value: "810 × 390 mm" },
    { label: "Eixo X", value: "2 × barra Ø12 × 1000 mm · 3 × LM12UU" },
    { label: "Eixo Y", value: "2 × barra Ø6 × 500 mm · 4 × LM6UU" },
    { label: "Motores", value: "2 × NEMA 17 (17HS4401S)" },
    { label: "Transmissão", value: "Correia GT2 6 mm · polias 20T" },
    { label: "Caneta", value: "Servo MG90S · Pen Holder em LM6UU" },
    { label: "Controle", value: "Arduino Uno + CNC Shield · GRBL 1.1h" },
    { label: "Resolução", value: "80 passos/mm (1/16 de micropasso)" },
  ],
  /** como cada eixo se move */
  mechanics: [
    {
      ref: "X",
      title: "Eixo X em ômega",
      text: "A correia do eixo longo fica presa nos dois suportes do fundo e não se move. O motor viaja com a ponte e passa a correia por duas polias loucas e pela própria polia, num desenho de ômega: girando, ele “escala” a correia e arrasta a ponte inteira, de 1,2 kg, sobre as barras de 12 mm.",
    },
    {
      ref: "Y",
      title: "Eixo Y em laço",
      text: "No eixo curto a correia fecha um laço entre a polia do motor, preso por baixo da Base Principal, e a polia louca do Apoio Secundário. As duas pontas dão a volta no pino de uma presilha do carro e travam dente com dente; um M3 no rasgo ajusta a tensão.",
    },
    {
      ref: "Z",
      title: "Caneta por gravidade",
      text: "O Pen Holder corre em quatro LM6UU, em duas hastes. O braço do servo MG90S só levanta a caneta; para baixar, ele sai da frente e o Pen Holder desce pelo próprio peso e por uma mola, acompanhando qualquer ondulação da mesa.",
    },
  ],
  /** linha do tempo (especificacoes.json do pacote); fica aqui e não no guia para o texto do guia não entrar no primeiro carregamento */
  marcos: [
    { data: "06/11", text: "Ligação dos motores corrigida (X ↔ Y)" },
    { data: "07/11", text: "Primeiro desenho no papel: quadrado + círculo, em passo cheio" },
    { data: "08/11", text: "Fins de curso instalados" },
    { data: "10/11", text: "Carro e Pen Holder v3 projetados" },
    { data: "12/11", text: "Micropasso 1/16, eletrônica fixada, carro v3 montado" },
    { data: "13/11", text: "Homing, origem fixa, testes de traço e gabarito desenhado na mesa" },
    { data: "14/11", text: "G-code do pôster do F-16 e o caminho imagem → SVG → G-code" },
  ],
  numbers: [
    { value: "810 × 390", label: "mm de área útil" },
    { value: "0,0125", label: "mm por micropasso" },
    { value: "F500", label: "velocidade de desenho" },
    { value: "200 mm/s", label: "com a caneta no ar" },
  ],
};

