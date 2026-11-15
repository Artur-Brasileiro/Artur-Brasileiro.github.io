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
import type { Row } from "@/components/guide/kit";

const A = "/projetos/cnc/arquivos";
export const IMG = "/projetos/cnc/imagens";
export const FOTOS = "/projetos/cnc/fotos";

export type Download = { label: string; detail: string; href: string };

/* ------------------------------------------------------------------ fotos */

export type Foto = {
  /** número na lista de fotos */
  n: string;
  title: string;
  /** legenda na página */
  caption: string;
  /** como fotografar (vai só para a lista de fotos) */
  how: string;
  ratio: "4/3" | "3/2" | "16/9" | "3/4" | "2/3" | "1/1";
  /** nome do arquivo em /projetos/cnc/fotos/; sem ele, aparece o espaço reservado */
  src?: string;
};

export const fotos = {
  maquinaInteira: {
    n: "01",
    title: "A máquina inteira",
    caption: "A máquina montada na mesa de pinus, com uma folha no lugar.",
    how: "De cima e um pouco de lado (três-quartos), pegando a mesa inteira. Luz do dia, ponte no meio do curso, com uma cartolina na mesa.",
    ratio: "16/9",
  },
  pecasImpressas: {
    n: "02",
    title: "Peças impressas",
    caption: "Suportes, Base Principal, Apoios, carro e Pen Holder v3, presilhas e a base do shield.",
    how: "A máquina já está montada: pode ser uma imagem do modelo 3D com as peças soltas (vista explodida ou lado a lado), exportada do FreeCAD.",
    ratio: "3/2",
  },
  suportes: {
    n: "03",
    title: "Suporte com a barra de 12 mm",
    caption: "Base em L + abraçadeira presas no tampo, segurando a barra de Ø12.",
    how: "Close de um suporte alto (frente) com a barra presa, de lado, mostrando os 4 parafusos M3 e os M4 na madeira.",
    ratio: "4/3",
  },
  apoioBase: {
    n: "04",
    title: "Apoio Base",
    caption: "Os dois LM12UU que guiam a ponte na barra do fundo, embaixo da Base Principal.",
    how: "Por baixo ou bem de lado, mostrando os 2 rolamentos LM12UU na barra do fundo.",
    ratio: "4/3",
  },
  apoioSecundario: {
    n: "05",
    title: "Apoio Secundário",
    caption: "Um LM12UU só, que apoia sem guiar, e a polia louca dentada que faz a volta da correia do Y.",
    how: "Close do Apoio Secundário na barra da frente, mostrando o rolamento e a polia louca do Y.",
    ratio: "4/3",
  },
  omega: {
    n: "06",
    title: "A correia do X em ômega",
    caption: "A correia parada passa por baixo das duas polias loucas e dá a volta na polia do motor.",
    how: "Close de frente para a Base Principal, na altura da correia, mostrando o caminho em ômega (polia louca, polia do motor, polia louca).",
    ratio: "4/3",
  },
  presilha: {
    n: "07",
    title: "Presilha da correia do Y",
    caption: "A correia dá a volta no pino e trava dente com dente; o M3 no rasgo ajusta a tensão.",
    how: "Close bem de perto de uma presilha presa no carro, com a correia travada.",
    ratio: "4/3",
  },
  carro: {
    n: "08",
    title: "Carro e Pen Holder v3",
    caption: "O carro v3 em PETG com o servo, a mola e a caneta presa.",
    how: "De lado, na altura do carro, com a caneta presa e o servo aparecendo. Fundo limpo.",
    ratio: "4/3",
  },
  canalV: {
    n: "09",
    title: "Caneta no canal em V",
    caption: "Os dois M3 empurram a caneta contra o canal em V, que centraliza de 3 a 12 mm.",
    how: "Close de frente para o Pen Holder, mostrando os 2 parafusos e a caneta encostada no V.",
    ratio: "4/3",
  },
  fimDeCurso: {
    n: "10",
    title: "Fim de curso do Y",
    caption: "O “dedo” do carro aciona a chave embaixo da Base Principal quando ele chega ao fundo.",
    how: "Close da chave do Y (ou da X) sendo acionada. Se der, uma foto de cada.",
    ratio: "4/3",
  },
  eletronicaMesa: {
    n: "11",
    title: "Eletrônica ligada, na borda da mesa",
    caption: "Arduino + CNC Shield na base impressa, no meio da borda do fundo: motores em X e Y, fins de curso em X+ e Y+, servo no Z+.",
    how: "De cima, bem de perto, com o shield montado no Arduino e todos os fios ligados. Nítido o bastante para ler as etiquetas do shield; se der, pegue também o step-down do servo.",
    ratio: "4/3",
  },
  vref: {
    n: "12",
    title: "Medindo o Vref",
    caption: "Multímetro no trimpot do driver: ≈ 0,60 V, o que dá ≈ 1,5 A no motor.",
    how: "Mão segurando a ponta do multímetro no trimpot, com o visor do multímetro legível.",
    ratio: "4/3",
  },
  escala: {
    n: "13",
    title: "Conferindo a escala",
    caption: "A régua de 150 mm desenhada pela máquina, conferida com régua ou paquímetro.",
    how: "Régua de verdade ao lado do traço de 150 mm do teste de escala, de cima, bem de perto.",
    ratio: "16/9",
  },
  gabarito: {
    n: "14",
    title: "Gabarito desenhado na mesa",
    caption: "A própria máquina desenhou na madeira o limite da área útil, as réguas e os cantos de A4 e A3.",
    how: "De cima, pegando o gabarito inteiro no tampo, sem papel.",
    ratio: "16/9",
  },
  cartolina: {
    n: "15",
    title: "Cartolina de testes",
    caption: "Retas e círculos de F500 a F4000: as ondulações só aparecem com curva e velocidade.",
    how: "A cartolina dos testes de velocidade inteira, de cima, e se der um close nos círculos de F2000/F4000.",
    ratio: "3/2",
  },
  f16: {
    n: "16",
    title: "Pôster do F-16 terminado",
    caption: "O pôster de 600 × 385 mm na cartolina, depois de ~84 min de caneta.",
    how: "O pôster inteiro, reto (de frente, sem perspectiva), com luz uniforme. Pode ser na parede ou na mesa. Em pé, como na prévia.",
    ratio: "2/3",
  },
  f16Detalhe: {
    n: "17",
    title: "Detalhe dos traços",
    caption: "De perto: os traços de linha única da vetorização centerline.",
    how: "Close bem de perto num pedaço com muitos traços (cabine ou a tabela de texto).",
    ratio: "4/3",
  },
  primeiro: {
    n: "18",
    title: "O primeiro desenho",
    caption: "Quadrado + círculo, 07/11/2026, ainda em passo cheio: retas boas, círculo tremido.",
    how: "O papel do primeiro teste (quadrado + círculo), de frente.",
    ratio: "4/3",
  },
  emAcao: {
    n: "19",
    title: "A máquina desenhando",
    caption: "No meio de um desenho: a caneta embaixo e a ponte andando.",
    how: "Foto (ou vídeo curto) com a máquina desenhando, carro em foco e um pouco de movimento na ponte.",
    ratio: "16/9",
  },
} satisfies Record<string, Foto>;

export type FotoId = keyof typeof fotos;

/* ------------------------------------------------------------------ guia */

export const guia = {
  intro:
    "Tudo o que aprendi construindo a minha, na ordem em que você vai precisar: o que comprar, como montar, como ligar, como configurar e o que fazer quando algo dá errado. Os números foram medidos na bancada, tirados do modelo do FreeCAD ou calculados, e cada tabela diz qual é qual.",

  downloads: {
    principal: {
      label: "Pacote completo",
      detail: ".zip · 1,6 MB · guia, ligações, firmware, G-codes, scripts e STL",
      href: `${A}/cnc-plotter-arquivos.zip`,
    } satisfies Download,
    outros: [
      { label: "configuracao_grbl.txt", detail: "todos os parâmetros $", href: `${A}/firmware/configuracao_grbl.txt` },
      { label: "svg_para_gcode.py", detail: "qualquer SVG vira G-code", href: `${A}/software/svg_para_gcode.py` },
      { label: "Base_CNC_Shield.stl", detail: "base do Arduino", href: `${A}/modelos-3d/Base_CNC_Shield.stl` },
    ] satisfies Download[],
  },

  capitulos: [
    { id: "visao", n: "01", title: "Visão geral" },
    { id: "material", n: "02", title: "Lista de materiais" },
    { id: "impressao", n: "03", title: "Peças impressas" },
    { id: "mesa", n: "04", title: "Mesa, barras e ponte" },
    { id: "correias", n: "05", title: "Motores e correias" },
    { id: "carro", n: "06", title: "Carro e caneta" },
    { id: "fins", n: "07", title: "Fins de curso e eletrônica" },
    { id: "ligacoes", n: "08", title: "Ligações elétricas" },
    { id: "firmware", n: "09", title: "Firmware GRBL" },
    { id: "calibracao", n: "10", title: "Calibração" },
    { id: "rotina", n: "11", title: "Rotina de uso" },
    { id: "traco", n: "12", title: "Qualidade do traço" },
    { id: "gcode", n: "13", title: "Do desenho ao G-code" },
    { id: "problemas", n: "14", title: "Solução de problemas" },
  ],

  /* ---------------------------------------------------------------- 01 */
  visao: {
    resumo:
      "É uma **ponte (gantry)** que anda sobre duas barras compridas, com um carro que anda sobre a ponte levando a caneta. Os dois motores viajam junto com a ponte, montados na Base Principal, e o eixo longo usa **tração em ômega**: a correia fica parada e o motor “escala” por ela. A área útil é de **810 × 390 mm**, perto de 2:1, pensada para quadros grandes e alongados.",
    eixos: [
      { k: "Eixo X (longo)", v: "A ponte inteira corre sobre **2 barras de aço Ø12 × 1000 mm**, presas na mesa." },
      { k: "Eixo Y (curto)", v: "O carro da caneta corre sobre **2 barras Ø6 × 500 mm**, presas na ponte." },
      { k: "Caneta", v: "Sobe e desce com um **servo**, comandado pelo próprio GRBL: `M5` sobe, `M3 S220` desce." },
    ],
    lados: [
      "**Frente:** lado do Apoio Secundário (barra de 12 mm mais alta, a 80 mm da mesa).",
      "**Fundo:** lado da Base Principal e dos motores (barra de 12 mm mais baixa, a 51,4 mm).",
      "**X+ é para a direita. Y+ é para longe de você**, em direção à Base Principal.",
      "**Origem do papel (0,0):** canto da frente à esquerda. **Home:** ponte toda à direita e carro no fundo.",
    ],
    specs: [
      ["Área útil", "**810 × 390 mm**", "medido"],
      ["Resolução", "0,0125 mm por micropasso (1/16, 80 passos/mm)", "calculado"],
      ["Velocidade de desenho", "F500 para precisão máxima; até F1000–1500 sem perda visível", "medido"],
      ["Deslocamento com a caneta levantada", "até 200 mm/s (`$110` = 12000 mm/min)", "medido"],
      ["Aceleração", "800 mm/s²", "medido"],
      ["Massa móvel do eixo X", "≈ 1,2 kg, com os 2 motores", "calculado"],
      ["Massa móvel do eixo Y", "≈ 110 g", "calculado"],
      ["Mesa", "tampo de pinus 1200 × 700 × 18 mm", "medido"],
      ["Controle", "Arduino Uno + CNC Shield V3 + GRBL 1.1h com servo", ""],
      ["Software no PC", "LaserGRBL (Windows)", ""],
    ] as Row[],
  },

  /* ---------------------------------------------------------------- 02 */
  material: {
    mecanica: [
      ["Barra de aço Ø12 × 1000 mm", "2", "eixo X"],
      ["Barra de aço Ø6 × 500 mm", "2", "eixo Y, na ponte"],
      ["Haste de aço Ø6 × 73,4 mm", "2", "guia vertical do Pen Holder"],
      ["Rolamento linear **LM12UU** (Ø12 × Ø21 × 30)", "3", "2 no Apoio Base + 1 no Apoio Secundário"],
      ["Rolamento linear **LM6UU**", "8", "4 no carro (2 por túnel) + 4 no Pen Holder"],
      ["Polia **GT2 20 dentes**, furo 5 mm", "2", "uma em cada motor"],
      ["Polia louca GT2", "3", "2 no ômega do X + 1 dentada no Apoio Secundário"],
      ["Correia **GT2 6 mm**", "~3 m", "≈ 1,15 m no Y + ≈ 1,1 m no X; compre com sobra"],
      ["Tampo de pinus 1200 × 700 × 18 mm", "1", "a “mesa” da máquina"],
      ["Mola pequena", "1", "pressão da caneta no Pen Holder"],
    ] as Row[],
    parafusos: [
      ["M4 de cabeça chata para madeira", "~14", "suportes e base da eletrônica (2 × 16 mm na base)"],
      ["M3 + porcas", "~25", "suportes (4 por suporte) e Pen Holder (2 com porca presa)"],
      ["M3 × 30 + porca", "2", "presilhas da correia do Y"],
      ["M3 × 6 autoatarraxante", "4", "Arduino na base impressa"],
    ] as Row[],
    eletronica: [
      ["Arduino Uno", "1", ""],
      ["CNC Shield V3", "1", ""],
      ["Driver A4988 / HR4988", "2", "+1 de reserva; slots X e Y"],
      ["Jumpers de micropasso", "6", "3 embaixo de cada driver (1/16)"],
      ["Motor NEMA 17 **US-17HS4401S**", "2", "1,7 A/fase, ~1,5 Ω, 200 passos/volta, ~280 g"],
      ["Fonte chaveada **12 V / 5 A** com plugue P4", "1", ""],
      ["Divisor Y P4 (1 fêmea → 2 machos)", "1", ""],
      ["Jack P4 fêmea com borne", "2", "um para o shield, outro para o step-down"],
      ["Step-down 12 V → 5 V (≈ 18 × 12 mm)", "1", "alimenta **só** o servo"],
      ["Servo **MG90S** (ou SG90)", "1", "levanta a caneta"],
      ["Microswitch com rolete (COM/NO/NC)", "2", "fins de curso X e Y"],
      ["Cabo USB A-B", "1", "PC ↔ Arduino"],
      ["Fios", "—", "cabos de motor de 4 vias, par trançado para os fins de curso, jumpers"],
    ] as Row[],
  },

  /* ---------------------------------------------------------------- 03 */
  impressao: {
    resumo:
      "A estrutura sai em **PLA** e as duas peças que mais sofrem, o carro e o Pen Holder, em **PETG**. O modelo completo foi feito no FreeCAD; o carro v3 e a base do shield, em CadQuery (código, para mudar uma medida e gerar de novo).",
    pecas: [
      ["Suporte alto (base em L + abraçadeira, 88,7 mm)", "2", "PLA", "barra de 12 mm da **frente**"],
      ["Suporte baixo (base em L + abraçadeira, 60 mm)", "2", "PLA", "barra do **fundo** e pontas da correia do X"],
      ["Base Principal", "1", "PLA", "placa dos motores, em cima do Apoio Base"],
      ["Apoio Base", "1", "PLA", "2 × LM12UU na barra do fundo"],
      ["Apoio Secundário", "1", "PLA", "1 × LM12UU na barra da frente + polia louca do Y"],
      ["Carro Principal **v3**", "1", "**PETG**", "leva a caneta; 4 × LM6UU"],
      ["Pen Holder **v3**", "1", "**PETG**", "segura a caneta; 4 × LM6UU"],
      ["Presilha da correia GT2", "2", "PLA", "prende as pontas da correia do Y no carro"],
      ["Base_CNC_Shield", "1", "PLA", "Arduino + shield rente à mesa (4 mm)"],
    ] as Row[],
    dicas: [
      "Imprima as abraçadeiras com o eixo do furo de 12,2 mm **na vertical**: o furo sai redondo.",
      "No carro v3, os furos dos LM6UU têm **nervuras de pressão** (3 por furo, inscrito Ø11,9): o rolamento entra justo e fica sem folga, sem depender da tolerância da impressora.",
      "A estrutura foi impressa numa Creality Ender; carro e Pen Holder em PETG, numa Snapmaker.",
    ],
    base: {
      title: "Base do Arduino + CNC Shield",
      text: "101,6 × 62,3 × 4 mm, ~5 g de PLA, imprime deitada sem suporte. O quadro fica todo fora do contorno da placa, então nenhum pino soldado encosta no plástico.",
      files: [
        { label: "STL", detail: "para fatiar", href: `${A}/modelos-3d/Base_CNC_Shield.stl` },
        { label: "STEP", detail: "para o CAD", href: `${A}/modelos-3d/Base_CNC_Shield.step` },
        { label: "base.py", detail: "CadQuery, paramétrico", href: `${A}/modelos-3d/base.py` },
      ] satisfies Download[],
    },
    pendente:
      "Os STL do carro e do Pen Holder v3, das presilhas, dos suportes e dos Apoios ainda vão entrar aqui, junto com o assembly do FreeCAD. Por enquanto, o modelo inteiro está no simulador lá em cima, peça por peça.",
  },

  /* ---------------------------------------------------------------- 04 */
  mesa: {
    suportes: [
      "Parafuse os **2 suportes baixos** (fundo) e os **2 suportes altos** (frente) no tampo, com parafusos M4 de cabeça chata.",
      "A distância entre os eixos das barras é **516 mm**. Meça nas duas pontas: as barras precisam ficar paralelas, senão a ponte trava em algum trecho do curso.",
      "Cada suporte tem 2 peças (base em L + abraçadeira), unidas por 4 parafusos M3. Encaixe a barra e aperte as abraçadeiras por igual.",
      "Alturas finais: barra do fundo a **51,4 mm** da mesa, barra da frente a **80 mm**. A diferença de 28,6 mm é de propósito: o Apoio Base, com 2 rolamentos, fica embaixo da Base Principal, e mesmo assim as barras de 6 mm da ponte ficam niveladas a 80 mm.",
      "O vão livre entre as abraçadeiras fica em **920 mm**. A ponte ocupa ~100 mm e sobram ~820 mm de curso.",
    ],
    medidas: [
      { v: "516 mm", k: "entre os eixos das barras de 12" },
      { v: "51,4 mm", k: "altura da barra do fundo" },
      { v: "80 mm", k: "altura da barra da frente" },
      { v: "920 mm", k: "vão livre entre as abraçadeiras" },
    ],
    ideia:
      "O projeto previa 2 rolamentos no Apoio Secundário. Mas com 4 rolamentos firmes em 2 barras o sistema fica **hiperestático**: qualquer falta de paralelismo faz os dois lados “brigarem”, e isso aparece como trepidação (stick-slip, trava e solta). Com **2 rolamentos no fundo, que guiam, e 1 na frente, que só apoia**, a máquina tolera pequenos desalinhamentos. É como uma gaveta: a boa tem um trilho que guia e outro que só segura o peso.",
    ponte: [
      "Coloque os **2 LM12UU no Apoio Base**, a **66 mm** de centro a centro, e passe pela barra do fundo.",
      "Coloque **1 LM12UU no Apoio Secundário**, centralizado, e passe pela barra da frente.",
      "Prenda as **2 barras de 6 × 500 mm** entre o Apoio Base/Base Principal e o Apoio Secundário: **64 mm** entre elas, **450 mm** de vão livre.",
      "Empurre a ponte com a mão de ponta a ponta. Ela deve correr leve e por igual. Se travar num trecho, o problema é o paralelismo das barras de 12 mm.",
    ],
    barras6:
      "As barras de 6 mm são finas o bastante para flexionar um pouco. 1 mm de desalinhamento entre as barras de 12 mm gera só ~3 N de força lateral, que elas absorvem como molas.",
  },

  /* ---------------------------------------------------------------- 05 */
  correias: {
    omegaIdeia:
      "No eixo X a correia fica presa nas duas pontas e não se move. Ela passa por baixo de duas polias loucas e dá a volta na polia do motor. Quando o motor gira, ele “sobe” pela correia e leva a ponte junto, como alguém se puxando ao longo de uma corda esticada.",
    x: [
      "Os dois motores ficam na **Base Principal**, na linha do meio entre as barras de 6 mm, a **56 mm** um do outro.",
      "**Motor do X** (eixo longo): em cima da placa, com o eixo **para baixo** e a polia GT2 20T.",
      "Prenda uma ponta da correia num suporte do fundo, passe por baixo da **primeira polia louca**, dê a volta na **polia do motor**, passe pela **segunda polia louca** e prenda a outra ponta no outro suporte do fundo.",
      "Ajuste a tensão pelo **esticador por parafuso** num dos suportes. Firme, sem “barriga”, mas sem forçar: tensão de violão afinado grave, não de corda de arco.",
    ],
    y: [
      "**Motor do Y** (eixo curto): preso **por baixo** da Base Principal, com o eixo **para cima**. A polia passa pelo furo de Ø25.",
      "A correia fecha um laço entre a polia do motor e a **polia louca dentada do Apoio Secundário**, a 89 mm de altura e 529,5 mm de distância entre os centros.",
      "As duas pontas vão presas no carro pelas **presilhas GT2**.",
    ],
    presilha: [
      "Cada presilha tem um pino de Ø8,5 mm, uma aba e uma **fenda de entrada de 2,5 mm**.",
      "Passe a correia pela fenda, dê a volta no pino **com os dentes virados para o pino** e volte pela mesma fenda.",
      "A correia trava dente com dente: as duas pernas juntas medem ~2,0 mm, e para escorregar os dentes teriam que “pular” ~2,8 mm.",
      "Prenda cada presilha com **M3 × 30 + porca** no rasgo de 23,2 × 3,2 mm do carro. O parafuso corre no rasgo e dá **~8 mm de ajuste de tensão**.",
    ],
    figuras: [
      { v: "56 mm", k: "entre os dois motores" },
      { v: "529,5 mm", k: "entre centros das polias do Y" },
      { v: "40 mm", k: "por volta da polia GT2 20T" },
      { v: "~8 mm", k: "de ajuste em cada presilha" },
    ],
  },

  /* ---------------------------------------------------------------- 06 */
  carro: {
    passos: [
      "Coloque **2 LM6UU em cada túnel** do Carro Principal (4 no total). O anel central serve de batente.",
      "Passe o carro pelas barras de 6 mm.",
      "No **Pen Holder**, coloque **2 LM6UU em cada furo** e passe pelas **2 hastes verticais Ø6 × 73,4 mm** do carro. Com 40 mm de guia por haste (antes eram 19 mm), a caneta inclina a metade.",
      "Coloque a **mola** no Pen Holder.",
      "Prenda o **servo** no carro: vão de 23,5 mm, parafusos do próprio servo nos furos de Ø1,8 mm. O braço do servo empurra o pino do Pen Holder para cima.",
      "**Caneta:** passe pelo rasgo aberto de 16 mm do carro e pelo furo do Pen Holder. Os **2 parafusos M3** (a 28 mm um do outro, em porcas presas) empurram a caneta contra um **canal em V de 90°**, que centraliza qualquer diâmetro de 3 a 12 mm.",
    ],
    gravidade:
      "O servo não empurra a caneta para baixo: ele só a **levanta**. Para descer, o servo sai do caminho e o Pen Holder desce pelo próprio peso e pela mola. Assim a caneta acompanha pequenas ondulações da mesa e a flecha das barras sem perder o contato com o papel.",
    rasgo:
      "Na v2, o furo do “C” do carro tinha Ø12,2 e o do Pen Holder, Ø12. Os parafusos empurravam a caneta para fora do centro e ela raspava no carro, travando. Com o rasgo aberto de 16 mm sobram pelo menos ~2,3 mm de folga para qualquer caneta.",
    figuras: [
      { v: "3–12 mm", k: "diâmetros de caneta que o V centraliza" },
      { v: "40 mm", k: "de guia por haste (eram 19)" },
      { v: "16 mm", k: "rasgo aberto no carro" },
      { v: "~78°", k: "giro do servo entre em cima e embaixo" },
    ],
  },

  /* ---------------------------------------------------------------- 07 */
  fins: {
    chaves: [
      "**X:** microswitch com rolete, acionado quando a **ponte chega toda à direita** (X+).",
      "**Y:** embaixo da Base Principal, entre as barras de 6 mm, acionado pelo **“dedo”** do carro (5 × 14 mm, descendo 7 mm) quando ele chega ao fundo (Y+).",
      "Ligação: **COM** no GND e **NO** no sinal. Os detalhes estão no capítulo 08.",
    ],
    eletronica: [
      "Imprima a **Base_CNC_Shield** e prenda na mesa com 2 parafusos M4 × 16 de cabeça chata. Pinus perto da borda racha fácil: faça um furo-guia de ~2,5 mm antes.",
      "Posição: no **meio do comprimento da mesa**, na **borda do fundo** (lado dos motores). Como os motores andam com a ponte, ficar no meio do curso reduz a sobra de fio para ~metade do curso (~410 mm), e não o curso inteiro.",
      "Prenda o Arduino com 4 parafusos **M3 × 6 autoatarraxantes**.",
      "Cabos que acompanham a ponte: deixe um caminho controlado (uma esteira porta-cabos impressa é a solução prevista) e prenda o fio do servo ao longo da ponte para não enroscar.",
    ],
    altura:
      "Quem decide se a eletrônica cabe embaixo do Apoio Base é a pilha de placas: Uno + shield + drivers com dissipador dá ~27–30 mm, e os plugues dos motores podem passar de ~33 mm. Passe a ponte devagar com a mão por cima **antes** de parafusar.",
  },

  /* ---------------------------------------------------------------- 08 */
  ligacoes: {
    resumo:
      "Dois circuitos de energia saem da mesma fonte, com o **GND em comum**: 12 V para o shield e os motores, e 12 V → 5 V (step-down) só para o servo. O Arduino recebe a lógica e o G-code pelo USB.",
    servo:
      "Ligado no 5 V do Arduino, que vem do USB, o pico de corrente do servo derrubava a tensão e **resetava o Arduino** no meio do desenho. O LaserGRBL acusava `UnexpectedReset` logo depois do primeiro `M3`, e a máquina perdia a origem. Com o servo no step-down próprio, o problema sumiu. É como ligar o chuveiro e a luz da casa piscar.",
    pinos: [
      ["Motor do eixo longo", "Saída X (2B 2A 1A 1B)", "STEP D2 · DIR D5", "driver X com 3 jumpers (1/16)"],
      ["Motor do eixo curto", "Saída Y (2B 2A 1A 1B)", "STEP D3 · DIR D6", "driver Y com 3 jumpers (1/16)"],
      ["Habilitar drivers", "EN", "D8 (ativo em LOW)", "interno ao shield"],
      ["Fim de curso X · NO", "X+ branco", "D9", "COM em X+ preto (GND)"],
      ["Fim de curso Y · NO", "Y+ branco", "D10", "COM em Y+ preto (GND)"],
      ["Servo · sinal", "Z+ branco", "D11 (PWM do spindle)", "nunca ligue fim de curso em Z−/Z+"],
      ["Servo · 5 V", "—", "—", "OUT+ do step-down (5,0 V)"],
      ["Servo · GND", "(ou Z+ preto)", "GND", "OUT− do step-down; GND comum pela fonte"],
      ["Alimentação", "borne 12–36 V", "—", "fonte 12 V / 5 A pelo Jack A"],
    ] as Row[],
    detalhes: [
      {
        title: "Fins de curso",
        text: "O GRBL usa o pull-up interno: com a chave solta o pino fica em 5 V, e apertada ela fecha com o GND.",
        itens: [
          "**COM + NO** (como está montado): `$5=0`.",
          "**COM + NC**: `$5=1`. Mais resistente a ruído, e um fio rompido aparece como “acionado” (falha segura).",
          "As duas chaves têm que ser do mesmo tipo: o `$5` vale para todas.",
          "Trance o sinal com o GND de cada chave e afaste esses fios dos cabos dos motores.",
        ],
      },
      {
        title: "Bobinas do motor",
        text: "Os 4 fios são 2 pares. No multímetro em Ω, os dois fios do mesmo par dão ~1,5 Ω; fios de pares diferentes dão circuito aberto.",
        itens: [
          "Um par vai em `1A/1B` e o outro em `2A/2B`.",
          "Eixo andando ao contrário: gire o plugue 180° ou inverta no `$3`. Marque a orientação do plugue depois de acertar.",
          "Motor dando “espasmos” sem andar = mau contato num dos 4 fios.",
          "**Nunca** conecte ou desconecte um motor com o sistema ligado: queima o driver.",
        ],
      },
      {
        title: "Drivers e micropasso",
        text: "Corrente do motor: `I = Vref / (8 · Rs)`. Com Vref ≈ 0,60 V e Rs = 0,05 Ω, dá ≈ 1,5 A, abaixo dos 1,7 A do motor. Depois de vários minutos rodando, o dissipador fica só morno.",
        itens: [
          "Alinhe o pino **EN** do driver com o EN marcado no shield. Driver invertido queima na hora.",
          "3 jumpers (M0, M1, M2) embaixo de cada driver = **1/16** no A4988/HR4988 → `$100=$101=80`. Num DRV8825, os mesmos 3 dariam 1/32.",
          "Ajuste o Vref com a fonte ligada e os motores parados, com chave de plástico ou cerâmica se tiver.",
        ],
      },
    ],
    antes: [
      "Polaridade da fonte conferida com multímetro: os dois fios dela podem ser pretos.",
      "Step-down ajustado para **5,0 V** sem nada ligado na saída.",
      "Drivers com o EN alinhado; jumpers 1/16 no X e no Y.",
      "Pares das bobinas conferidos (~1,5 Ω).",
      "Nada ligado em Z−; o servo só no Z+.",
    ],
    ligar: "USB primeiro (conecta o LaserGRBL), depois os 12 V. Em seguida, `$H`.",
    desligar: "Primeiro os 12 V, depois o USB. Nunca mexa em plugue de motor com tudo ligado.",
    testes: [
      "Monitor Serial (115200), envie `?`: chave apertada mostra `Pn:X` / `Pn:Y`.",
      "`M3 S220` desce a caneta; `M5` sobe.",
      "`G91 G0 X10` deve ir para a direita e `G91 G0 Y10` para longe de você. Depois, `G90`.",
    ],
  },

  /* ---------------------------------------------------------------- 09 */
  firmware: {
    gravar: [
      "Baixe o fork **vankesteren/grbl-servo**: GRBL 1.1h com o servo no PWM do spindle, pino D11.",
      "Copie a pasta `grbl` para `Documentos/Arduino/libraries`.",
      "Na Arduino IDE: **Arquivo → Exemplos → grbl → grblUpload**, placa Arduino Uno, e grave.",
      "O aviso “Low memory available” é normal no GRBL (92% de flash, 79% de RAM).",
      "Esse fork já vem com o homing só em X e Y, sem Z: não precisa recompilar nada.",
    ],
    forkUrl: "https://github.com/vankesteren/grbl-servo",
    params: [
      ["`$32`", "**0**", "modo não-laser: **obrigatório** para o servo"],
      ["`$30`", "**255**", "escala do PWM. Com o padrão 1000, `S255` dava só 25% e o servo não se mexia"],
      ["`$100` / `$101`", "**80**", "1/16 de micropasso × 200 passos ÷ 40 mm por volta"],
      ["`$110` / `$111`", "12000", "200 mm/s nos deslocamentos"],
      ["`$120` / `$121`", "800", "reduzir para 400 não melhorou as curvas"],
      ["`$130` / `$131`", "**810 / 390**", "curso útil medido; no Y sobram ~2 mm até o fim mecânico"],
      ["`$3`", "**3**", "inverte X e Y; confira na sua montagem (capítulo 10)"],
      ["`$5`", "0", "fins de curso em NO (1 se usar NC)"],
      ["`$20` / `$21`", "1 / 0", "limite por software ligado; físico desligado"],
      ["`$22` / `$23`", "1 / 0", "homing ligado, no sentido +"],
      ["`$24` / `$25`", "200 / **4000**", "aproximação / busca. Acima de ~5000 a ponte de 1,2 kg bate forte na chave"],
      ["`$26` / `$27`", "250 / 3", "debounce (ms) / recuo depois de tocar a chave (mm)"],
    ] as Row[],
    arquivos: [
      { label: "configuracao_grbl.txt", detail: "todos os $, comentados", href: `${A}/firmware/configuracao_grbl.txt` },
      { label: "comandos_uteis.txt", detail: "cola do console", href: `${A}/firmware/comandos_uteis.txt` },
    ] satisfies Download[],
  },

  /* ---------------------------------------------------------------- 10 */
  calibracao: {
    sentido: [
      "Ligue, conecte o LaserGRBL (porta COM, **115200**) e desbloqueie com `$X`.",
      "Envie `G91 G0 X10`: a ponte deve ir para a **direita**. Envie `G91 G0 Y10`: o carro deve ir para **longe de você**. Depois, `G90`.",
      "Se algum eixo for ao contrário, ajuste o `$3` (1 = inverte X, 2 = inverte Y, 3 = os dois) ou gire o plugue do motor 180° **com tudo desligado**.",
    ],
    sentidoNota:
      "Aqui começou em `$3=2`; depois que o plugue do motor X foi reconectado invertido, passou para `$3=3`. Marque a orientação dos plugues.",
    escala: [
      "Rode o `teste_escala.gcode`: réguas de 150 mm (X) e 100 mm (Y).",
      "Meça. Se der diferente: `$100 novo = $100 atual × (comandado ÷ medido)`.",
      "Na minha, 150 mm em X pararam **exatamente** na marca, e 20 mm em Y deram 20 mm exatos no paquímetro.",
    ],
    escalaAviso:
      "Um primeiro teste de ±10 mm indicou só 7 mm. Era folga ou erro de leitura num deslocamento pequeno, não erro de escala. Meça sempre distâncias longas, e num sentido só.",
    homing: [
      "Antes do primeiro `$H`, confira que X+ e Y+ apontam para as chaves.",
      "Com a ponte e o carro no meio do curso, envie `$H` (o botão da casinha). Os dois eixos vão até as chaves, recuam, encostam devagar e recuam de novo.",
      "Rode **uma vez** o `configurar_origem.gcode`. Ele grava na EEPROM que o (0,0) do papel fica no **canto da frente à esquerda**.",
    ],
    origem: `G92.1
G10 L2 P1 X-810 Y-390
G90
G0 X0 Y0
; a caneta para em cima do (0,0): marque esse ponto na mesa`,
    origemNota:
      "Depois de cada `$H`, o (0,0) volta exatamente ao mesmo ponto físico, e as coordenadas do desenho vão de 0 a 810 (X) e de 0 a 390 (Y), todas positivas, como no Inkscape.",
    escuro:
      "A máquina não tem sensor do lado oposto. No `$H` ela encosta na chave e chama aquele ponto de zero; depois só conta passos, 80 por mm. É como andar numa garagem escura contando os passos a partir da parede. Se você empurrar a ponte com a mão, ou a máquina perder passos, faça `$H` de novo.",
    gabarito:
      "Desenhe um gabarito na madeira da mesa com a própria máquina: o limite da área útil, réguas a cada 10 mm e os cantos de A4 e A3. Fica muito mais fácil posicionar o papel.",
    caneta: [
      ["Caneta em cima", "`M5`", "o servo empurra o pino do Pen Holder para cima"],
      ["Caneta embaixo", "`M3 S220`", "o servo gira ~78° e a caneta desce por completo"],
    ] as Row[],
    canetaNotas: [
      "**`M5` = caneta em cima, por segurança:** o GRBL executa `M5` ao ligar, resetar ou entrar em alarme, então qualquer pane levanta a caneta sozinha, como o freio de caminhão, que vem acionado por padrão.",
      "Depois de cada `M3` ou `M5`, o G-code leva `G4 P0.3`: o servo completa o curso antes de andar.",
      "**Altura:** com a caneta embaixo, a ponta apoia no papel com o Pen Holder 2–3 mm acima do batente. Com `M5`, a ponta sai do papel com pelo menos 3 mm de folga.",
      "**Pressão:** só com o peso do Pen Holder a esferográfica encostava mas **não riscava**. A mola resolveu.",
    ],
    testes: [
      { file: "teste_escala.gcode", what: "Réguas de 150 mm em X e 100 mm em Y.", ok: "as marcas batem com a régua de verdade." },
      { file: "teste_caneta.gcode", what: "Uma fileira de tracinhos curtos, sobe e desce.", ok: "cada tracinho começa e termina nítido." },
      { file: "teste_quadrado_circulo_F500.gcode", what: "O primeiro desenho da máquina: quadrado e círculo em F500.", ok: "o círculo fecha liso, sem tremer." },
      { file: "teste_velocidades.gcode", what: "Retas e círculos em velocidades crescentes (capítulo 12).", ok: "até F1500 não dá para ver diferença." },
    ],
    origemFile: { label: "configurar_origem.gcode", detail: "rode uma vez, depois de um $H", href: `${A}/firmware/configurar_origem.gcode` },
  },

  /* ---------------------------------------------------------------- 11 */
  rotina: {
    passos: [
      "Ligar → conectar o LaserGRBL → **`$H`**.",
      "Colocar o papel com o canto no (0,0), usando o gabarito da mesa.",
      "Abrir o arquivo `.gcode` → play.",
      "Entre desenhos **não precisa** refazer o `$H`: o G-code é absoluto (`G90`) e a máquina vai sozinha ao primeiro ponto com a caneta levantada.",
      "Refaça o `$H` depois de: desligar, reconectar, reset, alarme ou empurrar a máquina com a mão.",
    ],
    dicas: [
      "Não aceite a sugestão de ativar o **Laser Mode** (`$32=1`): o servo para de funcionar.",
      "Casinha = `$H`; raio = reset; cadeado = `$X`.",
      "Ao abrir a porta serial, o Uno reinicia: toda reconexão exige um novo `$H`.",
      "Depois de usar `G91`, volte para `G90`. Senão `G0 X0 Y0` vira “andar 0 mm” e parece que a máquina ignorou o comando.",
      "Comentários no G-code: use `;`. Parênteses aninhados como `( centro (60,60) )` dão o erro “Expected command letter”.",
      "O LaserGRBL esconde a resposta do `?`. Para ver os pinos (`Pn:X`, `Pn:Y`), use o Monitor Serial da Arduino IDE com o LaserGRBL desconectado: só um programa usa a porta por vez.",
    ],
    comandos: `$H              homing (botão da casinha)
$X              desbloquear depois de alarme (cadeado)
$$              listar todas as configurações
M5              caneta EM CIMA
M3 S220         caneta EMBAIXO
G4 P0.3         pausa de 0,3 s (espera o servo)
G90             coordenadas absolutas (padrão)
G91             coordenadas relativas (lembre de voltar para G90)
G0 X0 Y0        ir para a origem do papel
$J=G91 X10 F1000    jog: andar 10 mm em X`,
  },

  /* ---------------------------------------------------------------- 12 */
  traco: {
    micropasso:
      "O primeiro desenho, quadrado + círculo, foi feito em **passo cheio**: as retas saíram boas, mas o círculo saiu tremido e com um barulho diferente no motor. Em passo cheio cada passo anda 0,2 mm num tranco; na curva, cada eixo acelera e freia o tempo todo e passa pela faixa em que o NEMA 17 entra em **ressonância** (~100–250 passos/s). Com **1/16**, cada passo anda 0,0125 mm. Passo cheio é descer uma escada de degraus altos; micropasso é descer uma rampa.",
    figuras: [
      { v: "0,2 mm", k: "por passo, em passo cheio" },
      { v: "0,0125 mm", k: "por micropasso, em 1/16" },
      { v: "F500", k: "velocidade de trabalho" },
      { v: "F1500", k: "ainda sem perda visível" },
    ],
    testes: [
      ["Retas de 400 mm (X) e 360 mm (Y), nos dois sentidos, F1500", "**perfeitas**"],
      ["Círculos r = 40 mm em F500 e F1000", "**impecáveis**"],
      ["Círculo em F2000", "pequenas ondulações, só bem de perto"],
      ["Círculo em F4000", "um pouco mais de ondulação, ainda sutil"],
      ["F2000 com aceleração 400", "**não** melhorou"],
    ] as Row[],
    conclusao:
      "Não é folga, que apareceria em qualquer velocidade, nem polia ou driver, que apareceriam nas retas. As ondulações só aparecem com **curva + velocidade**: é um efeito **dinâmico** da elasticidade da correia e da massa da ponte. É como carregar um copo cheio andando em círculo: devagar a água fica parada, rápido ela balança.",
    decisao:
      "**F500** com velocidade fixa para precisão máxima. F1000–1500 ainda sai muito bom. Os deslocamentos com a caneta levantada (`G0`) continuam rápidos.",
  },

  /* ---------------------------------------------------------------- 13 */
  gcode: {
    cadeia: ["Imagem ou SVG", "SVG de traço único", "vpype", "G-code", "LaserGRBL", "GRBL"],
    svg:
      "O `svg_para_gcode.py` faz tudo de uma vez: junta traços que se encostam, tira sujeira (< 0,6 mm), **ordena os traços** para a caneta andar o mínimo possível levantada, encaixa o desenho no papel e gera o G-code com `M3 S220` / `M5`, `G4 P0.3` e **F500 em todas as linhas G1**. No pôster do F-16, a ordenação reduziu o deslocamento com a caneta levantada de ~112 m para ~5 m.",
    svgCmd: `pip install vpype vpype-gcode
python svg_para_gcode.py desenho.svg --papel a4
python svg_para_gcode.py desenho.svg --papel 600x385 --margem 10 --rotacao -90`,
    centerline:
      "Para plotter, o desenho precisa ser de **traço único (centerline)**. O “Vetorizar bitmap” do Inkscape contorna as **bordas** de cada linha, e a caneta passaria duas vezes em cada traço. O processo que funcionou:",
    passos: [
      "Normalizar o fundo da imagem e ampliar 4×.",
      "Achar o **centro** de cada linha (filtro de crista + limiar com histerese). Isso separa linhas paralelas que estão quase coladas.",
      "Preencher as “células” pequenas de sombreado, esqueletizar e podar os espinhos.",
      "Suavizar e simplificar os traços.",
      "Refazer os textos com **fonte Hershey** (traço único). Acentos como Ç, Ã e É não existem nessas fontes: desenhe-os como traços próprios.",
    ],
    fotosDica: "Para fotos, o **DrawingBotV3** gera arte de linhas própria para plotter.",
    f16: [
      { v: "~2.200", k: "traços" },
      { v: "26,5 m", k: "de caneta no papel" },
      { v: "~84 min", k: "em F500" },
      { v: "112 → 5 m", k: "de caneta no ar, depois de ordenar" },
    ],
    f16Scripts: [
      { label: "1_vetorizar_centerline.py", detail: "acha o eixo de cada linha", href: `${A}/software/exemplo-f16/1_vetorizar_centerline.py` },
      { label: "2_remover_vista_do_meio.py", detail: "edição por regiões", href: `${A}/software/exemplo-f16/2_remover_vista_do_meio.py` },
      { label: "3_montar_poster.py", detail: "moldura, textos Hershey, tabela", href: `${A}/software/exemplo-f16/3_montar_poster.py` },
      { label: "plotter.toml", detail: "perfil do vpype-gcode", href: `${A}/software/exemplo-f16/plotter.toml` },
      { label: "renderizar_previa.py", detail: "simula uma caneta de 0,5 mm", href: `${A}/software/exemplo-f16/renderizar_previa.py` },
    ] satisfies Download[],
    vpype: `vpype read f16c_raw.svg linemerge -l 1 --tolerance 0.35mm \\
  linesimplify -l 1 --tolerance 0.03mm filter -l 1 --min-length 0.6mm \\
  reloop lmove all 1 linesort --two-opt write --page-size 385mmx600mm poster.svg

vpype -c plotter.toml read poster.svg rotate -- -90 \\
  layout --landscape 600mmx385mm linesort --two-opt gwrite -p cnc_artur poster.gcode`,
    laserGrbl: [
      ["Velocidade", "500"],
      ["Modo", "`M3 - Constant Power`"],
      ["S-MIN", "0 (caneta em cima)"],
      ["S-MAX", "220 (caneta embaixo)"],
      ["Suporte a PWM", "ativado nas configurações do LaserGRBL"],
    ] as Row[],
    laserGrblAviso:
      "O LaserGRBL não insere pausa para o servo, então o começo de alguns traços pode falhar. Os arquivos gerados pelo `svg_para_gcode.py` já têm a pausa.",
    simulador:
      "A aba **Escrever** do simulador lá em cima faz o mesmo caminho com um texto: fonte Hershey de traço único, encaixe no papel, um `G0` até o começo de cada traço, `M3` para baixar, os `G1` e `M5` para subir. O G-code pode ser baixado.",
    software: [
      { label: "svg_para_gcode.py", detail: "SVG → G-code da máquina", href: `${A}/software/svg_para_gcode.py` },
      { label: "logo_cnc_plotter.py", detail: "gera o logo em traço único", href: `${A}/software/logo_cnc_plotter.py` },
      { label: "gerar_testes.py", detail: "gera os G-codes de teste", href: `${A}/software/gerar_testes.py` },
    ] satisfies Download[],
  },

  /* ---------------------------------------------------------------- 14 */
  problemas: [
    ["LaserGRBL acusa `UnexpectedReset` logo depois do primeiro `M3`", "servo ligado no 5 V do Arduino (queda de tensão)", "alimentar o servo pelo step-down"],
    ["`G0 X0 Y0` “não faz nada”", "o Arduino resetou e perdeu a origem, ou ficou em `G91`", "refazer `$H`; enviar `G90`"],
    ["Servo não mexe", "`$32=1` (laser) ou `$30=1000`", "`$32=0` e `$30=255`"],
    ["Servo gira ao contrário no meio do desenho", "servo com defeito ou ruído (aconteceu uma vez com o MG90S)", "religar; se repetir, trocar o servo"],
    ["Caneta encosta mas não risca", "pouca pressão", "mola no Pen Holder; conferir o `S220`"],
    ["Caneta raspa e trava no carro", "folga zero entre a caneta e o carro (v2)", "carro v3, com rasgo aberto de 16 mm"],
    ["Ponte trepida de vez em quando", "ponte hiperestática (rolamentos demais brigando)", "2 LM12UU no fundo, que guiam, e 1 só na frente, que apoia"],
    ["Curvas onduladas", "velocidade alta (efeito dinâmico)", "F500–F1500"],
    ["Círculo tremido e barulho no motor", "passo cheio (ressonância)", "jumpers 1/16 e `$100=$101=80`"],
    ["Carro bateu no fim do curso", "perda de passos (aceleração alta)", "aceleração ≤ 800 mm/s²"],
    ["Motor dá “espasmos” sem andar", "mau contato num fio do motor", "refazer o conector, com tudo desligado"],
    ["Eixo anda ao contrário", "plugue do motor invertido", "`$3` ou girar o plugue"],
    ["`ALARM:2`", "destino fora da área (limite por software)", "conferir o desenho e a origem; `$X`"],
    ["Erro “Expected command letter”", "parênteses aninhados no comentário", "usar comentários com `;`"],
    ["Alarme falso de fim de curso com o motor andando", "ruído no fio da chave", "trançar sinal + GND, afastar dos motores, 100 nF perto do shield"],
    ["UGS não conecta (botões desabilitados)", "não identificada", "usar o LaserGRBL, que conecta de primeira"],
  ] as Row[],

  /* ---------------------------------------------------------------- lições */
  licoes: [
    {
      title: "Trilho emendado não alinha",
      text: "A primeira tentativa usou trilhos MGN15H de 50 cm emendados com peça impressa. O carro tremia e travava na junção: emenda impressa nunca fica alinhada o bastante.",
    },
    {
      title: "Barra fina enverga e se desgasta",
      text: "Uma barra de inox de 6 mm no apoio oposto do eixo longo envergava com o peso, pedindo contraflecha, e os rolamentos “comiam” a barra. As barras de 12 mm com LM12UU resolveram.",
    },
    {
      title: "Guiar de um lado, apoiar do outro",
      text: "Com 4 rolamentos a ponte era hiperestática e trepidava. Ficou com 3: dois que guiam e um que só apoia.",
    },
    {
      title: "Carro v1 → v2",
      text: "O servo não cabia (vão de 15,9 mm para um corpo de 22,5 mm), os furos dele eram grandes demais, o braço batia no Pen Holder e o fim de curso quase não era acionado.",
    },
    {
      title: "Carro v2 → v3",
      text: "A caneta raspava no “C” do carro. A v3 trouxe rasgo aberto, canal em V, guias duplas e mais rigidez, em PETG.",
    },
    {
      title: "Servo com fonte própria",
      text: "No 5 V do USB, o servo resetava o Arduino no meio do desenho. Um step-down só para ele acabou com os resets.",
    },
  ],
};

/* ------------------------------------------------------------------ resultados */

export type Resultado = {
  id: string;
  title: string;
  /** papel e tamanho */
  meta: string;
  text: string;
  /** sem foto: a prévia fica como a imagem do resultado */
  foto?: FotoId;
  /** prévia digital, enquanto a foto não chega */
  previa?: { src: string; alt: string; fit?: "contain" | "cover" };
  numeros?: { v: string; k: string }[];
  arquivos?: Download[];
  destaque?: boolean;
};

export const resultados: Resultado[] = [
  {
    id: "f16",
    title: "F-16 Fighting Falcon",
    meta: "cartolina · 600 × 385 mm · F500",
    text: "Uma imagem de 736 × 1104 px, borrada em várias partes, vetorizada pelo eixo das linhas e montada como pôster técnico: três vistas, cota, tabela e rodapé em fonte de traço único, com os acentos desenhados à mão.",
    foto: "f16",
    previa: { src: `${IMG}/f16-previa.webp`, alt: "Prévia do pôster do F-16: três vistas do caça, tabela de características e o título no topo, em traço de caneta.", fit: "contain" },
    numeros: [
      { v: "~2.200", k: "traços" },
      { v: "26,5 m", k: "de caneta" },
      { v: "~84 min", k: "de máquina" },
    ],
    arquivos: [
      { label: "G-code", detail: "360 KB", href: `${A}/gcode/desenhos/f16_poster_cartolina_600x385_F500.gcode` },
      { label: "SVG", detail: "298 KB", href: `${A}/gcode/desenhos/f16_poster_cartolina_600x385.svg` },
    ],
    destaque: true,
  },
  {
    id: "logo",
    title: "Logo do projeto",
    meta: "folha A4 · F500",
    text: "Engrenagem, caneta e o nome em traço único, gerados em Python: o desenho que a máquina faz para se apresentar.",
    previa: { src: `${IMG}/logo.svg`, alt: "Logo CNC Plotter: uma engrenagem com uma caneta na frente e o nome ao lado, em traço único.", fit: "contain" },
    arquivos: [{ label: "G-code", detail: "8 KB", href: `${A}/gcode/desenhos/logo_cnc_plotter_A4_F500.gcode` }],
  },
  {
    id: "primeiro",
    title: "O primeiro desenho",
    meta: "07/11/2026 · passo cheio",
    text: "Quadrado e círculo. As retas saíram boas; o círculo tremeu, e foi isso que levou ao micropasso de 1/16.",
    foto: "primeiro",
    arquivos: [{ label: "G-code", detail: "1 KB", href: `${A}/gcode/testes/teste_quadrado_circulo_F500.gcode` }],
  },
  {
    id: "velocidades",
    title: "Cartolina de testes",
    meta: "cartolina · F500 a F4000",
    text: "Retas e círculos em velocidades crescentes, de F500 a F4000, para achar onde o traço começa a ondular.",
    foto: "cartolina",
    arquivos: [{ label: "G-code", detail: "1 KB", href: `${A}/gcode/testes/teste_velocidades.gcode` }],
  },
];

/** linha do tempo do projeto, de especificacoes.json */
export const marcos = [
  { data: "06/11", text: "Ligação dos motores corrigida (X ↔ Y)" },
  { data: "07/11", text: "Primeiro desenho no papel: quadrado + círculo, em passo cheio" },
  { data: "08/11", text: "Fins de curso instalados" },
  { data: "10/11", text: "Carro e Pen Holder v3 projetados" },
  { data: "12/11", text: "Micropasso 1/16, eletrônica fixada, carro v3 montado" },
  { data: "13/11", text: "Homing, origem fixa, testes de traço e gabarito desenhado na mesa" },
  { data: "14/11", text: "G-code do pôster do F-16 e o caminho imagem → SVG → G-code" },
];
