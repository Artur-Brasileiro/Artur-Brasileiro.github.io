/**
 * Guia "Monte o seu" do pêndulo invertido, na página /projeto/pendulo-invertido.
 *
 * Tudo aqui vem da documentação do projeto (pendulo-invertido-documentacao.zip),
 * que também está para baixar em /projetos/pendulo/arquivos/. Se a documentação
 * mudar, mude aqui e troque o zip.
 */

const A = "/projetos/pendulo/arquivos";

export type Download = { label: string; detail: string; href: string };
export type Row = string[];

export const guia = {
  intro:
    "Tudo o que eu usei para construir o meu, na ordem em que fiz: o material, as peças impressas, a montagem, as ligações, os testes, a medição da haste e o controle. Cada número aqui veio do aparelho.",

  downloads: {
    principal: {
      label: "Documentação completa",
      detail: ".zip · 570 KB · firmware, scripts, STL, fiação e guias",
      href: `${A}/pendulo-invertido-documentacao.zip`,
    } satisfies Download,
    outros: [
      { label: "pendulo_controle.ino", detail: "o firmware final", href: `${A}/firmware/pendulo_controle.ino` },
      { label: "MONTAGEM_completa.stl", detail: "o aparelho inteiro em 3D · 1,2 MB", href: `${A}/stl/MONTAGEM_completa.stl` },
    ] satisfies Download[],
  },

  capitulos: [
    { id: "material", n: "01", title: "Material" },
    { id: "impressao", n: "02", title: "Imprimir as peças" },
    { id: "montagem", n: "03", title: "Montar a mecânica" },
    { id: "eletronica", n: "04", title: "Ligar a eletrônica" },
    { id: "testes", n: "05", title: "Testar uma coisa de cada vez" },
    { id: "medicoes", n: "06", title: "Medir a sua haste" },
    { id: "ligar", n: "07", title: "Gravar o controle e ligar" },
  ],

  /* ---------------------------------------------------------------- 01 */
  material: {
    grupos: [
      {
        title: "Mecânica",
        itens: [
          ["Trilho linear MGN15H, 500 mm, com bloco", "412 mm de curso livre entre os batentes"],
          ["Motor de passo NEMA 17 (17HS4401S)", ""],
          ["Correia GT2 de 6 mm", "a polia de 30 dentes é impressa"],
          ["2× rolamento 625ZZ", "no rolo do esticador"],
          ["Haste de inox Ø6 × 500 mm", "a minha pesa 110 g"],
          ["Tábua de madeira para a base", "o trilho fica perto da borda da frente"],
        ],
      },
      {
        title: "Eletrônica",
        itens: [
          ["Arduino UNO", ""],
          ["Driver de passo A4988", "usei um HR4988 vermelho (placa HW-134A), compatível"],
          ["Encoder óptico LPD3806-1000BM", "4000 contagens por volta (0,09°)"],
          ["Fonte de 12 V 5 A", "uma fonte só alimenta tudo"],
          ["Divisor Y e um P4 fêmea com borne", "um ramo vai no Arduino, o outro no motor"],
          ["Protoboard, jumpers e capacitor de 100 µF / 25 V", "o capacitor protege o driver"],
        ],
      },
      {
        title: "Parafusos",
        itens: [
          ["4× M3×8", "carro no bloco do trilho"],
          ["3× M3×8 + arruela", "encoder na flange (M3×10 se a rosca do encoder for funda)"],
          ["4× M3×12 + 4 porcas", "garra da correia (as porcas encaixam por baixo do carro)"],
          ["1× M3×10 + porca", "cubo travando no chato do eixo do encoder"],
          ["1× M3×8 + porca", "cubo travando a haste"],
          ["4× M3×10", "motor no suporte"],
          ["1× M3×6 sem cabeça (ou M3×8) + porca", "polia no eixo do motor"],
          ["2× M5×30 + porcas e arruelas", "um no rolo do esticador, outro como tensor"],
          ["2× M3×25", "trocam o 1º e o último parafuso do trilho e prendem os batentes"],
          ["~9× parafuso para madeira 4 mm, cabeça chata", "fixação na base"],
        ],
      },
    ],
    nota: "Só M3 e M5, de propósito: era o que eu tinha na gaveta. Nada de chave de fim de curso.",
  },

  /* ---------------------------------------------------------------- 02 */
  impressao: {
    resumo:
      "Ender-3 V3 SE, Cura, PLA, perfil Super Quality (0,12 mm). Todas as peças foram desenhadas para imprimir sem suporte: furos horizontais em gota, cada peça já na posição de imprimir.",
    destaques: [
      { k: "Camada", v: "0,12 mm" },
      { k: "Paredes", v: "4 filetes" },
      { k: "Preenchimento", v: "40 % giroide" },
      { k: "Bico / mesa", v: "210 °C / 60–65 °C" },
      { k: "Velocidade", v: "80 mm/s" },
      { k: "Aderência", v: "brim de 5 mm" },
    ],
    aviso:
      "Gerar Suporte: DESLIGADO. Com suporte o Cura enche os furos e os encaixes não funcionam. Expansão horizontal em 0,0 mm: as folgas já estão no desenho.",
    pecas: [
      ["carro_encoder", "1", "40 %", "base no bico; a peça principal do carro", "carro_encoder.stl"],
      ["garra_correia", "1", "40 %", "dentinhos para cima", "garra_correia.stl"],
      ["cubo_pendulo", "1", "100 %", "face da frente na mesa; leva parafuso apertando", "cubo_pendulo.stl"],
      ["suporte_motor", "1", "40 %", "pé na mesa", "suporte_motor.stl"],
      ["polia_motor_gt2_30d", "1", "100 %", "se os dentes saírem ruins, imprima só ela a 40 mm/s", "polia_motor_gt2_30d.stl"],
      ["esticador_base", "1", "40 %", "piso na mesa", "esticador_base.stl"],
      ["esticador_carro", "1", "40 %", "base na mesa; se ficar justo, lixe de leve o chanfro", "esticador_carro.stl"],
      ["rolo_esticador", "1", "40 %", "furo de Ø16,1 para os dois 625ZZ prensados", "rolo_esticador.stl"],
      ["batente_trilho", "2", "40 %", "TPU fica melhor, PLA funciona", "batente_trilho.stl"],
    ] as Row[],
    stlBase: `${A}/stl/`,
    stlNota:
      "Os STL daqui são os da documentação, na posição de montagem: servem para ver as peças em 3D (o GitHub e o Windows abrem direto). No fatiador, deite cada peça como diz a coluna da posição.",
    dicaTeste:
      "Antes do carro (~4 h de impressão), imprima uma peça de teste: só a flange do encoder e o começo do cubo, 51 min. As medidas do meu encoder vinham da ficha técnica, e o eixo do exemplar real era 2 mm mais comprido.",
    conferir: [
      "Rolamentos do rolo do esticador entram com pressão firme.",
      "O carrinho do esticador corre na base sem levantar.",
      "Furos M3 apertados: broca de 2,5 mm (rosca) ou 3,2 mm (passagem) na mão.",
    ],
    problemas: [
      ["Cantos levantando", "mesa limpa com álcool isopropílico, 65 °C, brim de 5 mm, sem vento perto"],
      ["Fiapos", "retração em 1,0 mm; se continuar, 205 °C"],
      ["Peça quebrando nas camadas", "215 °C e 80 mm/s"],
      ["Dentes da polia ruins", "imprima só a polia a 40 mm/s, ou use uma GT2 metálica de 20 dentes"],
    ] as Row[],
  },

  /* ---------------------------------------------------------------- 03 */
  montagem: {
    referencia:
      "Tudo é referenciado ao eixo do trilho. A aba fina (3 mm) do suporte do motor e da base do esticador encosta na lateral de trás do trilho: isso já põe a correia a 32 mm do eixo, alinhada com a garra do carro, sem medir nada.",
    medidas: [
      { v: "30 mm", k: "do eixo do motor ao início do trilho (e do fim do trilho ao eixo do rolo)" },
      { v: "22 mm", k: "da base ao ramo de baixo da correia, no topo da garra" },
      { v: "44 mm", k: "da base ao eixo do encoder" },
      { v: "≤ 30 mm", k: "do eixo do trilho à borda da base, para a haste passar livre por baixo" },
    ],
    passos: [
      "Prenda o trilho na base, perto da borda da frente.",
      "Parafuse o carro no bloco (4× M3×8) antes de colocar o encoder: os parafusos ficam embaixo dele.",
      "Encaixe o ressalto Ø20 do encoder no furo da flange, gire até o cabo apontar para cima e aperte os 3× M3 nos rasgos em arco (eles aceitam furos de Ø28 e Ø30 em qualquer posição).",
      "Monte motor e polia no suporte; monte o rolo, com os dois 625ZZ, no carrinho do esticador. A base do esticador não tem porca escondida: pode parafusá-la na tábua primeiro. O carrinho entra deslizando pela ponta aberta da base e é puxado pelo M5, que rosca na porca encaixada por cima dele.",
      "Encoste as abas na lateral do trilho e parafuse os dois suportes na base.",
      "Passe a correia e prenda as duas pontas embaixo da garra, com os dentes da correia para cima, encaixando nos dentinhos da garra. Tensione girando o M5 da ponta: a própria tensão da correia segura a regulagem.",
      "Cubo no eixo do encoder (travando no chato do “D”), haste no cubo, com o eixo a 35 mm de uma das pontas.",
    ],
    polia:
      "Polia metálica no lugar da impressa: uma GT2 de 20 dentes, furo de 5 mm, também serve. No firmware, PASSOS_POR_MM passa a ser 800.0 / 40.0.",
  },

  /* ---------------------------------------------------------------- 04 */
  eletronica: {
    resumo:
      "Arduino UNO e o driver de passo numa protoboard, sem CNC shield. Uma fonte de 12 V alimenta tudo pelo divisor Y: o Arduino pelo jack e o motor pela protoboard. Monte fio a fio pelo desenho, na ordem segura, ou toque numa cor para seguir só aquela ligação.",
    problemas: [
      ["“Acesso negado” na porta COM ao enviar o código", "outro programa (no meu caso, o Cura) estava segurando a porta serial: feche e envie de novo"],
      ["Tirar o USB com tudo ligado queima algo?", "não: com a fonte ligada, o Arduino continua alimentado pelo jack"],
    ] as Row[],
  },

  /* ---------------------------------------------------------------- 05 */
  testes: {
    resumo:
      "Antes do controle, cada parte foi testada sozinha. Assim, quando algo não funciona, só existe um suspeito. Todos os sketches usam o Monitor Serial em 115200.",
    sketches: [
      {
        n: "1",
        file: "teste_encoder.ino",
        what: "Lê o encoder e mostra o ângulo. Gire a haste uma volta completa com a mão.",
        ok: "uma volta = 4000 contagens, sem perder contagem em giro rápido",
      },
      {
        n: "2",
        file: "teste_motor.ino",
        what: "Anda o carro ±50 e ±150 mm em 4 velocidades, partindo do meio do trilho.",
        ok: "sentido certo, 50 mm pedidos = 50 mm andados, 400 mm/s sem perder passo",
      },
      {
        n: "3",
        file: "teste_motor_v2.ino",
        what: "O mesmo, partindo encostado no batente do motor, com limite de 20 mm de cada batente.",
        ok: "é o esquema de partida do controle: o carro sempre começa no batente e o código conta dali",
      },
      {
        n: "4",
        file: "medir_pendulo.ino",
        what: "Mede o período e o atrito da haste pelo encoder. Ligue com ela pendurada e parada, levante uns 30° e solte.",
        ok: "a cada ida e volta, tempo e amplitude; no fim, o resumo (o meu deu 1,121 s)",
      },
    ],
  },

  /* ---------------------------------------------------------------- 06 */
  medicoes: {
    historia:
      "O controle depende de como a haste balança. No cronômetro, 10 idas e voltas deram 18 s: 1,8 s por ciclo. Pela física isso não fecha. Nem uma haste de 50 cm com todo o peso na ponta passaria de ~1,16 s. Em vez de recalcular tudo em cima de um número suspeito, o próprio encoder mediu.",
    log: `ciclo 23: periodo 1.125 s | amplitude 17.1 graus
ciclo 24: periodo 1.124 s | amplitude 16.5 graus
...
ciclo 47: periodo 1.113 s | amplitude 3.2 graus
ciclo 48: periodo 1.112 s | amplitude 2.7 graus
------ RESUMO ------
periodo medio (amplitude < 20 graus): 1.121 s
idas e voltas ate a amplitude cair pela metade: 24`,
    conclusao:
      "1,121 s, exatamente o valor calculado. O erro foi de contagem no olho. O mesmo teste mostrou o atrito: a amplitude cai ~0,6° por ida e volta, em linha reta, que é atrito seco do encoder (como uma borracha raspando), não de ar.",
    numeros: [
      { v: "110 g", k: "massa da haste (balança de cozinha)" },
      { v: "215 mm", k: "do eixo ao centro de massa (eixo a 35 mm da ponta)" },
      { v: "0,007388", k: "inércia J em kg·m², conferida pelo período" },
      { v: "0,075 mm", k: "por passo: 1/4 de passo e polia de 30 dentes" },
    ],
    equacao: "J·θ'' = m·g·d·sen θ − m·d·a·cos θ − atrito do encoder",
    equacaoNota:
      "O carro é levado por motor de passo: ele vai exatamente para onde o código manda. Para a física, a entrada é a aceleração do carro, não uma força. Não precisa saber a massa do carro nem o atrito do trilho, só a haste.",
    suaHaste:
      "Se a sua haste for diferente (outro comprimento, outro peso, eixo em outro ponto), troque m, d e J no topo do calcular_ganhos.py e rode. Ele imprime o período (compare com o que o medir_pendulo deu) e os quatro ganhos para colar no firmware.",
    comandos: `pip install numpy scipy
python calcular_ganhos.py   # os 4 ganhos do equilíbrio (LQR)
python sim_autonomo.py      # o firmware rodando numa haste simulada`,
    scripts: [
      { label: "calcular_ganhos.py", detail: "LQR: sai exatamente o que está no firmware", href: `${A}/simulacao/calcular_ganhos.py` },
      { label: "sim_autonomo.py", detail: "liga no batente, sobe, equilibra, leva tapas", href: `${A}/simulacao/sim_autonomo.py` },
    ] satisfies Download[],
    resultados: [
      { v: "60 de 60", k: "partidas do batente terminaram em pé (4,5 s típico, 10 s no pior caso)" },
      { v: "38 de 38", k: "quedas por tapa reerguidas (1,9 s típico, 6 s no pior caso)" },
      { v: "43 mm", k: "o mais perto que o carro chegou de um batente" },
    ],
    resultadosNota: "Na simulação, com o atrito medido, ruído, atraso de 5 ms e o modelo variando ±2 %.",
  },

  /* ---------------------------------------------------------------- 07 */
  ligar: {
    passos: [
      "Grave o pendulo_controle.ino pelo USB. Depois ligue o ramo livre do divisor Y da fonte no P4 do Arduino: a fonte passa a alimentar o Arduino e o motor juntos, e o computador não é mais necessário.",
      "Com a fonte desligada: carro encostado no batente do motor e haste pendurada e parada (o zero do ângulo é lido ao ligar).",
      "Ligue a fonte. Para parar, desligue. Para ligar de novo, volte ao passo 2.",
    ],
    sequencia: [
      { t: "0,5 s", title: "Confere o 12 V", text: "Um empurrãozinho de 6 mm, só para o lado do centro. Se a haste mexe, o motor tem força. Se não mexe, ele conclui que o carro continua no batente e tenta de novo a cada meio segundo, até a fonte ligar." },
      { t: "~5 s", title: "Sobe", text: "A saída do batente já é a subida: o carro faz um vai e vem que inverte quando a haste passa por baixo. Perto da energia do topo, o vai e vem enfraquece." },
      { t: "200 Hz", title: "Equilibra", text: "A menos de 15° do topo, indo para ele e com a energia certa, o LQR assume e o carro corre para baixo da haste." },
      { t: "~2 s", title: "Reergue", text: "Passou de 30°, caiu: no mesmo ciclo de 5 ms ele volta à subida, aproveitando a energia da queda." },
    ],
    serial: [
      "O Monitor Serial (115200) é opcional e mostra “pegou” e “caiu 3”.",
      "Abrir o Monitor Serial reinicia o Arduino. Antes, ponha o carro no batente do motor com a haste pendurada e parada. O mesmo vale para enviar código novo.",
      "Plugar o USB com tudo funcionando não reinicia. O que reinicia é abrir o Monitor.",
    ],
    seguranca: [
      "O gerador de passos se recusa a levar o carro a menos de 20 mm de um batente, mesmo que o controle peça. A trava mora dentro da interrupção que dá os passos: nem um bug no controle passa dela.",
      "Faixa de trabalho de ±165 mm a partir do centro, freando antes de chegar no fim.",
      "Perto do fim da faixa, a subida para de empurrar para fora e só puxa o carro de volta ao centro.",
    ],
    codigo: `// ====================== AJUSTES DE MONTAGEM ======================
const float CURSO_MM   = 412.0;  // de batente a batente
const float AJUSTE_CENTRO_MM = 3.0;  // + vai para o esticador, - para o motor
const bool  INVERTER_DIRECAO = false;
const int   SINAL_ENCODER    = 1;

// ====================== SUBIDA ======================
const float SW_VS   = 0.35;   // m/s, força do vai e vem
const float SW_KX   = 2.0;    // quanto puxa o carro para o centro
const float SW_EREF = 0.03;   // alvo de energia`,
    ajustes: [
      ["CURSO_MM", "412", "espaço livre entre os batentes: meça com o carro no centro, para um lado e para o outro"],
      ["AJUSTE_CENTRO_MM", "+3", "empurra o centro: + vai para o esticador, − para o motor"],
      ["INVERTER_DIRECAO", "false", "se o carro sair do batente para o lado errado"],
      ["SINAL_ENCODER", "1", "se o ângulo contar ao contrário (−1)"],
      ["SW_VS", "0,35 m/s", "força do vai e vem da subida"],
      ["SW_EREF", "0,03", "alvo de energia da subida"],
      ["SW_KX", "2", "quanto a subida puxa o carro para o centro"],
    ] as Row[],
    subida: [
      ["Balança alto, para um pouco antes do topo e nunca pega", "aumente SW_EREF (0,03 → 0,05)"],
      ["Chega rápido demais, passa direto ou pega e cai logo", "diminua SW_EREF (0,03 → 0,01)"],
      ["Demora muito para ganhar altura", "aumente SW_VS (0,35 → 0,40)"],
      ["O carro passa muito tempo nas pontas da faixa", "aumente SW_KX (2 → 3)"],
    ] as Row[],
    equilibrio: [
      ["Tremedeira rápida, zumbido no motor", "diminua K_W uns 20 % (−24,7 → −20)"],
      ["Equilibra, mas vai “passeando” devagar para um lado", "normal no começo: o K_BIAS corrige em ~10 s; se não corrigir, religue com a haste bem parada"],
      ["Motor apita e perde passo", "baixe AMAX de 8 para 6"],
      ["Fica sempre no vai e vem, sem nunca subir", "a haste não estava parada ao ligar: desligue, espere parar e ligue de novo"],
    ] as Row[],
  },

  licoes: [
    { title: "Medir antes de calcular em cima", text: "O cronômetro deu 1,8 s; o encoder deu 1,121 s. Um ganho calculado com o número errado teria derrubado a haste, e eu ia procurar o defeito no código." },
    { title: "Testar uma coisa de cada vez", text: "Encoder, motor, haste e só então o controle. Quando algo falha, só existe um suspeito." },
    { title: "Peça de teste pequena antes da grande", text: "51 minutos de impressão que salvaram uma de 4 horas." },
    { title: "Segurança no lugar mais baixo possível", text: "A trava dos 20 mm está dentro da interrupção que dá os passos, não no controle: nem um bug no controle passa dela." },
    { title: "Simular com os defeitos do mundo real", text: "Encoder em degraus, atraso, atrito e ±2 % no modelo. Uma simulação perfeita teria aprovado um controle frágil." },
  ],
};

export const sketchHref = (file: string) => `${A}/firmware/${file}`;
