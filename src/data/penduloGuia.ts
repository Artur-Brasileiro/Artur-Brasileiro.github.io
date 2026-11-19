/**
 * Guia "Monte o seu" do pêndulo invertido, na página /projeto/pendulo-invertido.
 *
 * Tudo aqui vem da documentação do projeto (pendulo-invertido-documentacao.zip),
 * que também está para baixar em /projetos/pendulo/arquivos/. Se a documentação
 * mudar, mude aqui e troque o zip.
 */

import { tr, type Tx } from "@/i18n/core";

const A = "/projetos/pendulo/arquivos";

/** texto nos dois idiomas (tr) ou que não muda (nome de arquivo, número) */
type Text = string | Tx;

export type Download = { label: Text; detail: Text; href: string };
export type Row = Text[];

export const guia = {
  intro: tr(
    "Tudo o que eu usei para construir o meu, na ordem em que fiz: o material, as peças impressas, a montagem, as ligações, os testes, a medição da haste e o controle. Cada número aqui veio do aparelho.",
    "Everything I used to build mine, in the order I did it: the materials, the printed parts, the assembly, the wiring, the tests, measuring the rod and the controller. Every number here came from the actual build.",
  ),

  downloads: {
    principal: {
      label: tr("Documentação completa", "Full documentation"),
      detail: tr(".zip · 570 KB · firmware, scripts, STL, fiação e guias", ".zip · 570 KB · firmware, scripts, STL, wiring and guides (in Portuguese)"),
      href: `${A}/pendulo-invertido-documentacao.zip`,
    } satisfies Download,
    outros: [
      { label: "pendulo_controle.ino", detail: tr("o firmware final", "the final firmware"), href: `${A}/firmware/pendulo_controle.ino` },
      { label: "MONTAGEM_completa.stl", detail: tr("o aparelho inteiro em 3D · 1,2 MB", "the whole rig in 3D · 1.2 MB"), href: `${A}/stl/MONTAGEM_completa.stl` },
    ] satisfies Download[],
  },

  capitulos: [
    { id: "material", n: "01", title: tr("Material", "Materials") },
    { id: "impressao", n: "02", title: tr("Imprimir as peças", "Print the parts") },
    { id: "montagem", n: "03", title: tr("Montar a mecânica", "Assemble the mechanics") },
    { id: "eletronica", n: "04", title: tr("Ligar a eletrônica", "Wire the electronics") },
    { id: "testes", n: "05", title: tr("Testar uma coisa de cada vez", "Test one thing at a time") },
    { id: "medicoes", n: "06", title: tr("Medir a sua haste", "Measure your rod") },
    { id: "ligar", n: "07", title: tr("Gravar o controle e ligar", "Flash the controller and power up") },
  ],

  /* ---------------------------------------------------------------- 01 */
  material: {
    grupos: [
      {
        title: tr("Mecânica", "Mechanics"),
        itens: [
          [tr("Trilho linear MGN15H, 500 mm, com bloco", "MGN15H linear rail, 500 mm, with block"), tr("412 mm de curso livre entre os batentes", "412 mm of free travel between the end stops")],
          [tr("Motor de passo NEMA 17 (17HS4401S)", "NEMA 17 stepper motor (17HS4401S)"), ""],
          [tr("Correia GT2 de 6 mm", "6 mm GT2 belt"), tr("a polia de 30 dentes é impressa", "the 30-tooth pulley is printed")],
          [tr("2× rolamento 625ZZ", "2× 625ZZ bearing"), tr("no rolo do esticador", "in the tensioner roller")],
          [tr("Haste de inox Ø6 × 500 mm", "Stainless steel rod, Ø6 × 500 mm"), tr("a minha pesa 110 g", "mine weighs 110 g")],
          [tr("Tábua de madeira para a base", "Wooden board for the base"), tr("o trilho fica perto da borda da frente", "the rail sits near the front edge")],
        ],
      },
      {
        title: tr("Eletrônica", "Electronics"),
        itens: [
          ["Arduino UNO", ""],
          [tr("Driver de passo A4988", "A4988 stepper driver"), tr("usei um HR4988 vermelho (placa HW-134A), compatível", "I used a red HR4988 (HW-134A board), which is compatible")],
          [tr("Encoder óptico LPD3806-1000BM", "LPD3806-1000BM optical encoder"), tr("4000 contagens por volta (0,09°)", "4000 counts per revolution (0.09°)")],
          [tr("Fonte de 12 V 5 A", "12 V 5 A power supply"), tr("uma fonte só alimenta tudo", "a single supply powers everything")],
          [tr("Divisor Y e um P4 fêmea com borne", "Y splitter and a female P4 barrel jack with screw terminals"), tr("um ramo vai no Arduino, o outro no motor", "one branch goes to the Arduino, the other to the motor")],
          [tr("Protoboard, jumpers e capacitor de 100 µF / 25 V", "Breadboard, jumper wires and a 100 µF / 25 V capacitor"), tr("o capacitor protege o driver", "the capacitor protects the driver")],
        ],
      },
      {
        title: tr("Parafusos", "Screws"),
        // ocupa as duas colunas no desktop
        wide: true,
        itens: [
          ["4× M3×8", tr("carro no bloco do trilho", "cart to the rail block")],
          [tr("3× M3×8 + arruela", "3× M3×8 + washer"), tr("encoder na flange (M3×10 se a rosca do encoder for funda)", "encoder to the flange (M3×10 if the encoder's threads are deep)")],
          [tr("4× M3×12 + 4 porcas", "4× M3×12 + 4 nuts"), tr("garra da correia (as porcas encaixam por baixo do carro)", "belt clamp (the nuts fit under the cart)")],
          [tr("1× M3×10 + porca", "1× M3×10 + nut"), tr("cubo travando no chato do eixo do encoder", "hub locking onto the flat of the encoder shaft")],
          [tr("1× M3×8 + porca", "1× M3×8 + nut"), tr("cubo travando a haste", "hub clamping the rod")],
          ["4× M3×10", tr("motor no suporte", "motor to the mount")],
          [tr("1× M3×6 sem cabeça (ou M3×8) + porca", "1× M3×6 set screw (or M3×8) + nut"), tr("polia no eixo do motor", "pulley to the motor shaft")],
          [tr("2× M5×30 + porcas e arruelas", "2× M5×30 + nuts and washers"), tr("um no rolo do esticador, outro como tensor", "one for the tensioner roller, one as the tension screw")],
          ["2× M3×25", tr("trocam o 1º e o último parafuso do trilho e prendem os batentes", "replace the first and last rail screws and hold the end stops")],
          [tr("~9× parafuso para madeira 4 mm, cabeça chata", "~9× 4 mm flat-head wood screws"), tr("fixação na base", "to fix everything to the base")],
        ],
      },
    ],
    nota: tr(
      "Só M3 e M5, de propósito: era o que eu tinha na gaveta. Nada de chave de fim de curso.",
      "Only M3 and M5, on purpose: that's what I had in the drawer. No limit switches.",
    ),
  },

  /* ---------------------------------------------------------------- 02 */
  impressao: {
    resumo: tr(
      "Ender-3 V3 SE, Cura, PLA, perfil Super Quality (0,12 mm). Todas as peças foram desenhadas para imprimir sem suporte: furos horizontais em gota, cada peça já na posição de imprimir.",
      "Ender-3 V3 SE, Cura, PLA, Super Quality profile (0.12 mm). Every part was designed to print without supports: horizontal holes are teardrop-shaped, and each part is already in its print orientation.",
    ),
    destaques: [
      { k: tr("Camada", "Layer"), v: tr("0,12 mm", "0.12 mm") },
      { k: tr("Paredes", "Walls"), v: tr("4 filetes", "4 lines") },
      { k: tr("Preenchimento", "Infill"), v: tr("40 % giroide", "40% gyroid") },
      { k: tr("Bico / mesa", "Nozzle / bed"), v: "210 °C / 60–65 °C" },
      { k: tr("Velocidade", "Speed"), v: "80 mm/s" },
      { k: tr("Aderência", "Adhesion"), v: tr("brim de 5 mm", "5 mm brim") },
    ],
    aviso: tr(
      "Gerar Suporte: DESLIGADO. Com suporte o Cura enche os furos e os encaixes não funcionam. Expansão horizontal em 0,0 mm: as folgas já estão no desenho.",
      "Generate Support: OFF. With supports, Cura fills the holes and the fits stop working. Horizontal Expansion at 0.0 mm: the clearances are already in the design.",
    ),
    pecas: [
      ["carro_encoder", "1", tr("40 %", "40%"), tr("base no bico; a peça principal do carro", "base facing the nozzle; the main part of the cart"), "carro_encoder.stl"],
      ["garra_correia", "1", tr("40 %", "40%"), tr("dentinhos para cima", "small teeth facing up"), "garra_correia.stl"],
      ["cubo_pendulo", "1", tr("100 %", "100%"), tr("face da frente na mesa; leva parafuso apertando", "front face on the bed; it takes a clamping screw"), "cubo_pendulo.stl"],
      ["suporte_motor", "1", tr("40 %", "40%"), tr("pé na mesa", "foot on the bed"), "suporte_motor.stl"],
      ["polia_motor_gt2_30d", "1", tr("100 %", "100%"), tr("se os dentes saírem ruins, imprima só ela a 40 mm/s", "if the teeth come out poorly, print it alone at 40 mm/s"), "polia_motor_gt2_30d.stl"],
      ["esticador_base", "1", tr("40 %", "40%"), tr("piso na mesa", "floor on the bed"), "esticador_base.stl"],
      ["esticador_carro", "1", tr("40 %", "40%"), tr("base na mesa; se ficar justo, lixe de leve o chanfro", "base on the bed; if it's tight, lightly sand the chamfer"), "esticador_carro.stl"],
      ["rolo_esticador", "1", tr("40 %", "40%"), tr("furo de Ø16,1 para os dois 625ZZ prensados", "Ø16.1 bore for the two press-fit 625ZZ"), "rolo_esticador.stl"],
      ["batente_trilho", "2", tr("40 %", "40%"), tr("TPU fica melhor, PLA funciona", "TPU is better, PLA works"), "batente_trilho.stl"],
    ] as Row[],
    stlBase: `${A}/stl/`,
    stlNota: tr(
      "Os STL daqui são os da documentação, na posição de montagem: servem para ver as peças em 3D (o GitHub e o Windows abrem direto). No fatiador, deite cada peça como diz a coluna da posição.",
      "The STLs here are the ones from the documentation, in assembly position: they're for viewing the parts in 3D (GitHub and Windows open them directly). In the slicer, lay each part down as the orientation column says.",
    ),
    dicaTeste: tr(
      "Antes do carro (~4 h de impressão), imprima uma peça de teste: só a flange do encoder e o começo do cubo, 51 min. As medidas do meu encoder vinham da ficha técnica, e o eixo do exemplar real era 2 mm mais comprido.",
      "Before the cart (~4 h of printing), print a test piece: just the encoder flange and the start of the hub, 51 min. My encoder's dimensions came from the datasheet, and the shaft on my actual unit was 2 mm longer.",
    ),
    conferir: [
      tr("Rolamentos do rolo do esticador entram com pressão firme.", "The bearings go into the tensioner roller with a firm press."),
      tr("O carrinho do esticador corre na base sem levantar.", "The tensioner carriage runs along the base without lifting."),
      tr("Furos M3 apertados: broca de 2,5 mm (rosca) ou 3,2 mm (passagem) na mão.", "Tight M3 holes: a 2.5 mm (tapping) or 3.2 mm (clearance) drill bit, by hand."),
    ],
    problemas: [
      [tr("Cantos levantando", "Corners lifting"), tr("mesa limpa com álcool isopropílico, 65 °C, brim de 5 mm, sem vento perto", "bed cleaned with isopropyl alcohol, 65 °C, 5 mm brim, no drafts nearby")],
      [tr("Fiapos", "Stringing"), tr("retração em 1,0 mm; se continuar, 205 °C", "retraction at 1.0 mm; if it persists, 205 °C")],
      [tr("Peça quebrando nas camadas", "Part splitting between layers"), tr("215 °C e 80 mm/s", "215 °C and 80 mm/s")],
      [tr("Dentes da polia ruins", "Poor pulley teeth"), tr("imprima só a polia a 40 mm/s, ou use uma GT2 metálica de 20 dentes", "print the pulley alone at 40 mm/s, or use a 20-tooth metal GT2")],
    ] as Row[],
  },

  /* ---------------------------------------------------------------- 03 */
  montagem: {
    referencia: tr(
      "Tudo é referenciado ao eixo do trilho. A aba fina (3 mm) do suporte do motor e da base do esticador encosta na lateral de trás do trilho: isso já põe a correia a 32 mm do eixo, alinhada com a garra do carro, sem medir nada.",
      "Everything is referenced to the rail's centerline. The thin tab (3 mm) on the motor mount and on the tensioner base rests against the back side of the rail: that alone puts the belt 32 mm from the centerline, lined up with the cart's belt clamp, without measuring anything.",
    ),
    medidas: [
      { v: "30 mm", k: tr("do eixo do motor ao início do trilho (e do fim do trilho ao eixo do rolo)", "from the motor shaft to the start of the rail (and from the end of the rail to the roller axle)") },
      { v: "22 mm", k: tr("da base ao ramo de baixo da correia, no topo da garra", "from the base to the lower run of the belt, at the top of the clamp") },
      { v: "44 mm", k: tr("da base ao eixo do encoder", "from the base to the encoder shaft") },
      { v: "≤ 30 mm", k: tr("do eixo do trilho à borda da base, para a haste passar livre por baixo", "from the rail centerline to the edge of the base, so the rod swings freely below it") },
    ],
    passos: [
      tr("Prenda o trilho na base, perto da borda da frente.", "Fasten the rail to the base, near the front edge."),
      tr(
        "Parafuse o carro no bloco (4× M3×8) antes de colocar o encoder: os parafusos ficam embaixo dele.",
        "Screw the cart to the block (4× M3×8) before mounting the encoder: the screws end up underneath it.",
      ),
      tr(
        "Encaixe o ressalto Ø20 do encoder no furo da flange, gire até o cabo apontar para cima e aperte os 3× M3 nos rasgos em arco (eles aceitam furos de Ø28 e Ø30 em qualquer posição).",
        "Fit the encoder's Ø20 boss into the flange hole, turn it until the cable points up and tighten the 3× M3 in the arc slots (they take Ø28 and Ø30 bolt circles at any angle).",
      ),
      tr(
        "Monte motor e polia no suporte; monte o rolo, com os dois 625ZZ, no carrinho do esticador. A base do esticador não tem porca escondida: pode parafusá-la na tábua primeiro. O carrinho entra deslizando pela ponta aberta da base e é puxado pelo M5, que rosca na porca encaixada por cima dele.",
        "Fit the motor and pulley to the motor mount; fit the roller, with both 625ZZ, to the tensioner carriage. The tensioner base has no hidden nut: you can screw it to the board first. The carriage slides in through the open end of the base and is pulled by the M5, which threads into the nut seated on top of it.",
      ),
      tr(
        "Encoste as abas na lateral do trilho e parafuse os dois suportes na base.",
        "Press the tabs against the side of the rail and screw both mounts to the base.",
      ),
      tr(
        "Passe a correia e prenda as duas pontas embaixo da garra, com os dentes da correia para cima, encaixando nos dentinhos da garra. Tensione girando o M5 da ponta: a própria tensão da correia segura a regulagem.",
        "Route the belt and secure both ends under the belt clamp, belt teeth facing up so they mesh with the clamp's small teeth. Tension it by turning the M5 at the end: the belt's own tension holds the setting.",
      ),
      tr(
        "Cubo no eixo do encoder (travando no chato do “D”), haste no cubo, com o eixo a 35 mm de uma das pontas.",
        "Hub on the encoder shaft (locking onto the flat of the “D”), rod in the hub, with the pivot 35 mm from one end.",
      ),
    ],
    polia: tr(
      "Polia metálica no lugar da impressa: uma GT2 de 20 dentes, furo de 5 mm, também serve. No firmware, PASSOS_POR_MM passa a ser 800.0 / 40.0.",
      "A metal pulley instead of the printed one: a 20-tooth GT2 with a 5 mm bore also works. In the firmware, PASSOS_POR_MM becomes 800.0 / 40.0.",
    ),
  },

  /* ---------------------------------------------------------------- 04 */
  eletronica: {
    resumo: tr(
      "Arduino UNO e o driver de passo numa protoboard, sem CNC shield. Uma fonte de 12 V alimenta tudo pelo divisor Y: o Arduino pelo jack e o motor pela protoboard. Monte fio a fio pelo desenho, na ordem segura, ou toque numa cor para seguir só aquela ligação.",
      "An Arduino UNO and the stepper driver on a breadboard, no CNC shield. One 12 V power supply feeds everything through the Y splitter: the Arduino through its jack and the motor through the breadboard. Wire it step by step from the diagram, in the safe order, or tap a color to follow just that connection.",
    ),
    problemas: [
      [
        tr("“Acesso negado” na porta COM ao enviar o código", "“Access denied” on the COM port when uploading the code"),
        tr("outro programa (no meu caso, o Cura) estava segurando a porta serial: feche e envie de novo", "another program (Cura, in my case) was holding the serial port: close it and upload again"),
      ],
      [
        tr("Tirar o USB com tudo ligado queima algo?", "Does unplugging the USB with everything on burn anything?"),
        tr("não: com a fonte ligada, o Arduino continua alimentado pelo jack", "no: with the power supply on, the Arduino stays powered through the jack"),
      ],
    ] as Row[],
  },

  /* ---------------------------------------------------------------- 05 */
  testes: {
    resumo: tr(
      "Antes do controle, cada parte foi testada sozinha. Assim, quando algo não funciona, só existe um suspeito. Todos os sketches usam o Monitor Serial em 115200.",
      "Before the controller, I tested each part on its own. That way, when something doesn't work, there's only one suspect. All the sketches use the Serial Monitor at 115200.",
    ),
    sketches: [
      {
        n: "1",
        file: "teste_encoder.ino",
        what: tr("Lê o encoder e mostra o ângulo. Gire a haste uma volta completa com a mão.", "Reads the encoder and prints the angle. Turn the rod one full revolution by hand."),
        ok: tr("uma volta = 4000 contagens, sem perder contagem em giro rápido", "one revolution = 4000 counts, with no missed counts on fast spins"),
      },
      {
        n: "2",
        file: "teste_motor.ino",
        what: tr("Anda o carro ±50 e ±150 mm em 4 velocidades, partindo do meio do trilho.", "Moves the cart ±50 and ±150 mm at 4 speeds, starting from the middle of the rail."),
        ok: tr("sentido certo, 50 mm pedidos = 50 mm andados, 400 mm/s sem perder passo", "right direction, 50 mm commanded = 50 mm traveled, 400 mm/s without skipping steps"),
      },
      {
        n: "3",
        file: "teste_motor_v2.ino",
        what: tr(
          "O mesmo, partindo encostado no batente do motor, com limite de 20 mm de cada batente.",
          "The same, starting against the motor-side end stop, with a 20 mm limit from each end stop.",
        ),
        ok: tr(
          "é o esquema de partida do controle: o carro sempre começa no batente e o código conta dali",
          "this is how the controller starts: the cart always begins at the end stop and the code counts from there",
        ),
      },
      {
        n: "4",
        file: "medir_pendulo.ino",
        what: tr(
          "Mede o período e o atrito da haste pelo encoder. Ligue com ela pendurada e parada, levante uns 30° e solte.",
          "Measures the rod's period and friction through the encoder. Power up with it hanging still, lift it about 30° and let go.",
        ),
        ok: tr(
          "a cada ida e volta, tempo e amplitude; no fim, o resumo (o meu deu 1,121 s)",
          "time and amplitude for every full swing; at the end, the summary (mine gave 1.121 s)",
        ),
      },
    ],
  },

  /* ---------------------------------------------------------------- 06 */
  medicoes: {
    historia: tr(
      "O controle depende de como a haste balança. No cronômetro, 10 idas e voltas deram 18 s: 1,8 s por ciclo. Pela física isso não fecha. Nem uma haste de 50 cm com todo o peso na ponta passaria de ~1,16 s. Em vez de recalcular tudo em cima de um número suspeito, o próprio encoder mediu.",
      "The controller depends on how the rod swings. With a stopwatch, 10 full swings took 18 s: 1.8 s per cycle. The physics doesn't add up. Even a 50 cm rod with all its weight at the tip wouldn't go past ~1.16 s. Instead of recalculating everything on a suspicious number, I let the encoder itself measure it.",
    ),
    // a saída do medir_pendulo (o sketch imprime em português; o inglês é a tradução linha a linha)
    log: tr(
      `ciclo 23: periodo 1.125 s | amplitude 17.1 graus
ciclo 24: periodo 1.124 s | amplitude 16.5 graus
...
ciclo 47: periodo 1.113 s | amplitude 3.2 graus
ciclo 48: periodo 1.112 s | amplitude 2.7 graus
------ RESUMO ------
periodo medio (amplitude < 20 graus): 1.121 s
idas e voltas ate a amplitude cair pela metade: 24`,
      `cycle 23: period 1.125 s | amplitude 17.1 degrees
cycle 24: period 1.124 s | amplitude 16.5 degrees
...
cycle 47: period 1.113 s | amplitude 3.2 degrees
cycle 48: period 1.112 s | amplitude 2.7 degrees
------ SUMMARY ------
mean period (amplitude < 20 degrees): 1.121 s
full swings until the amplitude halved: 24`,
    ),
    conclusao: tr(
      "1,121 s, exatamente o valor calculado. O erro foi de contagem no olho. O mesmo teste mostrou o atrito: a amplitude cai ~0,6° por ida e volta, em linha reta, que é atrito seco do encoder (como uma borracha raspando), não de ar.",
      "1.121 s, exactly the calculated value. The error was in counting by eye. The same test showed the friction: the amplitude drops ~0.6° per full swing, in a straight line, which is dry friction in the encoder (like rubber scraping), not air drag.",
    ),
    numeros: [
      { v: "110 g", k: tr("massa da haste (balança de cozinha)", "rod mass (kitchen scale)") },
      { v: "215 mm", k: tr("do eixo ao centro de massa (eixo a 35 mm da ponta)", "from the pivot to the center of mass (pivot 35 mm from the end)") },
      { v: tr("0,007388", "0.007388"), k: tr("inércia J em kg·m², conferida pelo período", "inertia J in kg·m², checked against the period") },
      { v: tr("0,075 mm", "0.075 mm"), k: tr("por passo: 1/4 de passo e polia de 30 dentes", "per step: 1/4 microstepping and a 30-tooth pulley") },
    ],
    equacao: tr("J·θ'' = m·g·d·sen θ − m·d·a·cos θ − atrito do encoder", "J·θ'' = m·g·d·sin θ − m·d·a·cos θ − encoder friction"),
    equacaoNota: tr(
      "O carro é levado por motor de passo: ele vai exatamente para onde o código manda. Para a física, a entrada é a aceleração do carro, não uma força. Não precisa saber a massa do carro nem o atrito do trilho, só a haste.",
      "The cart is driven by a stepper motor: it goes exactly where the code tells it to. For the physics, the input is the cart's acceleration, not a force. You don't need the cart's mass or the rail friction, only the rod.",
    ),
    suaHaste: tr(
      "Se a sua haste for diferente (outro comprimento, outro peso, eixo em outro ponto), troque m, d e J no topo do calcular_ganhos.py e rode. Ele imprime o período (compare com o que o medir_pendulo deu) e os quatro ganhos para colar no firmware.",
      "If your rod is different (another length, another weight, the pivot at another point), change m, d and J at the top of calcular_ganhos.py and run it. It prints the period (compare it with what medir_pendulo gave you) and the four gains to paste into the firmware.",
    ),
    comandos: tr(
      `pip install numpy scipy
python calcular_ganhos.py   # os 4 ganhos do equilíbrio (LQR)
python sim_autonomo.py      # o firmware rodando numa haste simulada`,
      `pip install numpy scipy
python calcular_ganhos.py   # the 4 balance gains (LQR)
python sim_autonomo.py      # the firmware running on a simulated rod`,
    ),
    scripts: [
      {
        label: "calcular_ganhos.py",
        detail: tr("LQR: sai exatamente o que está no firmware", "LQR: outputs exactly what's in the firmware"),
        href: `${A}/simulacao/calcular_ganhos.py`,
      },
      {
        label: "sim_autonomo.py",
        detail: tr("liga no batente, sobe, equilibra, leva tapas", "starts at the end stop, swings up, balances, takes taps"),
        href: `${A}/simulacao/sim_autonomo.py`,
      },
    ] satisfies Download[],
    resultados: [
      { v: tr("60 de 60", "60 of 60"), k: tr("partidas do batente terminaram em pé (4,5 s típico, 10 s no pior caso)", "starts from the end stop ended upright (4.5 s typical, 10 s worst case)") },
      { v: tr("38 de 38", "38 of 38"), k: tr("quedas por tapa reerguidas (1,9 s típico, 6 s no pior caso)", "falls from a tap brought back up (1.9 s typical, 6 s worst case)") },
      { v: "43 mm", k: tr("o mais perto que o carro chegou de um batente", "the closest the cart got to an end stop") },
    ],
    resultadosNota: tr(
      "Na simulação, com o atrito medido, ruído, atraso de 5 ms e o modelo variando ±2 %.",
      "In simulation, with the measured friction, noise, a 5 ms delay and the model varying by ±2%.",
    ),
  },

  /* ---------------------------------------------------------------- 07 */
  ligar: {
    passos: [
      tr(
        "Grave o pendulo_controle.ino pelo USB. Depois ligue o ramo livre do divisor Y da fonte no P4 do Arduino: a fonte passa a alimentar o Arduino e o motor juntos, e o computador não é mais necessário.",
        "Flash pendulo_controle.ino over USB. Then plug the free branch of the power supply's Y splitter into the Arduino's P4 jack: the supply now powers the Arduino and the motor together, and the computer is no longer needed.",
      ),
      tr(
        "Com a fonte desligada: carro encostado no batente do motor e haste pendurada e parada (o zero do ângulo é lido ao ligar).",
        "With the power supply off: cart against the motor-side end stop and the rod hanging still (the angle's zero is read at power-up).",
      ),
      tr(
        "Ligue a fonte. Para parar, desligue. Para ligar de novo, volte ao passo 2.",
        "Turn on the power supply. To stop, turn it off. To start again, go back to step 2.",
      ),
    ],
    sequencia: [
      {
        t: tr("0,5 s", "0.5 s"),
        title: tr("Confere o 12 V", "Checks the 12 V"),
        text: tr(
          "Um empurrãozinho de 6 mm, só para o lado do centro. Se a haste mexe, o motor tem força. Se não mexe, ele conclui que o carro continua no batente e tenta de novo a cada meio segundo, até a fonte ligar.",
          "A small 6 mm nudge, only toward the center. If the rod moves, the motor has power. If it doesn't, it concludes the cart is still at the end stop and tries again every half second until the power supply comes on.",
        ),
      },
      {
        t: "~5 s",
        title: tr("Sobe", "Swings up"),
        text: tr(
          "A saída do batente já é a subida: o carro faz um vai e vem que inverte quando a haste passa por baixo. Perto da energia do topo, o vai e vem enfraquece.",
          "Leaving the end stop is already the swing-up: the cart moves back and forth, reversing each time the rod passes underneath. Near the energy of the top, the back-and-forth eases off.",
        ),
      },
      {
        t: "200 Hz",
        title: tr("Equilibra", "Balances"),
        text: tr(
          "A menos de 15° do topo, indo para ele e com a energia certa, o LQR assume e o carro corre para baixo da haste.",
          "Within 15° of the top, heading toward it and with the right energy, the LQR takes over and the cart runs under the rod.",
        ),
      },
      {
        t: "~2 s",
        title: tr("Reergue", "Recovers"),
        text: tr(
          "Passou de 30°, caiu: no mesmo ciclo de 5 ms ele volta à subida, aproveitando a energia da queda.",
          "Past 30°, it has fallen: in the same 5 ms cycle it goes back to the swing-up, using the energy of the fall.",
        ),
      },
    ],
    serial: [
      // "pegou" e "caiu N" são o que o firmware imprime, em português: no inglês ficam com a tradução ao lado
      tr(
        "O Monitor Serial (115200) é opcional e mostra “pegou” e “caiu 3”.",
        "The Serial Monitor (115200) is optional and prints “pegou” (caught) and “caiu 3” (fell, with the fall count).",
      ),
      tr(
        "Abrir o Monitor Serial reinicia o Arduino. Antes, ponha o carro no batente do motor com a haste pendurada e parada. O mesmo vale para enviar código novo.",
        "Opening the Serial Monitor resets the Arduino. Before you do, put the cart against the motor-side end stop with the rod hanging still. The same goes for uploading new code.",
      ),
      tr(
        "Plugar o USB com tudo funcionando não reinicia. O que reinicia é abrir o Monitor.",
        "Plugging in the USB while everything is running doesn't reset it. Opening the Monitor does.",
      ),
    ],
    seguranca: [
      tr(
        "O gerador de passos se recusa a levar o carro a menos de 20 mm de um batente, mesmo que o controle peça. A trava mora dentro da interrupção que dá os passos: nem um bug no controle passa dela.",
        "The step generator refuses to take the cart within 20 mm of an end stop, even if the controller asks. The lock lives inside the interrupt that issues the steps: not even a bug in the controller gets past it.",
      ),
      tr(
        "Faixa de trabalho de ±165 mm a partir do centro, freando antes de chegar no fim.",
        "A working range of ±165 mm from the center, braking before it reaches the end.",
      ),
      tr(
        "Perto do fim da faixa, a subida para de empurrar para fora e só puxa o carro de volta ao centro.",
        "Near the end of the range, the swing-up stops pushing outward and only pulls the cart back toward the center.",
      ),
    ],
    // trecho do pendulo_controle.ino: no inglês só os comentários mudam, os nomes ficam os do arquivo
    codigo: tr(
      `// ====================== AJUSTES DE MONTAGEM ======================
const float CURSO_MM   = 412.0;  // de batente a batente
const float AJUSTE_CENTRO_MM = 3.0;  // + vai para o esticador, - para o motor
const bool  INVERTER_DIRECAO = false;
const int   SINAL_ENCODER    = 1;

// ====================== SUBIDA ======================
const float SW_VS   = 0.35;   // m/s, força do vai e vem
const float SW_KX   = 2.0;    // quanto puxa o carro para o centro
const float SW_EREF = 0.03;   // alvo de energia`,
      `// ====================== ASSEMBLY SETTINGS ======================
const float CURSO_MM   = 412.0;  // end stop to end stop
const float AJUSTE_CENTRO_MM = 3.0;  // + toward the tensioner, - toward the motor
const bool  INVERTER_DIRECAO = false;
const int   SINAL_ENCODER    = 1;

// ====================== SWING-UP ======================
const float SW_VS   = 0.35;   // m/s, strength of the back-and-forth
const float SW_KX   = 2.0;    // how hard it pulls the cart to the center
const float SW_EREF = 0.03;   // energy target`,
    ),
    ajustes: [
      ["CURSO_MM", "412", tr("espaço livre entre os batentes: meça com o carro no centro, para um lado e para o outro", "free travel between the end stops: measure it by moving the cart from the center to each side")],
      ["AJUSTE_CENTRO_MM", "+3", tr("empurra o centro: + vai para o esticador, − para o motor", "shifts the center: + toward the tensioner, − toward the motor")],
      ["INVERTER_DIRECAO", "false", tr("se o carro sair do batente para o lado errado", "if the cart leaves the end stop in the wrong direction")],
      ["SINAL_ENCODER", "1", tr("se o ângulo contar ao contrário (−1)", "if the angle counts backwards (−1)")],
      ["SW_VS", tr("0,35 m/s", "0.35 m/s"), tr("força do vai e vem da subida", "strength of the swing-up's back-and-forth")],
      ["SW_EREF", tr("0,03", "0.03"), tr("alvo de energia da subida", "swing-up energy target")],
      ["SW_KX", "2", tr("quanto a subida puxa o carro para o centro", "how hard the swing-up pulls the cart to the center")],
    ] as Row[],
    subida: [
      [tr("Balança alto, para um pouco antes do topo e nunca pega", "Swings high, stops just short of the top and never catches"), tr("aumente SW_EREF (0,03 → 0,05)", "increase SW_EREF (0.03 → 0.05)")],
      [tr("Chega rápido demais, passa direto ou pega e cai logo", "Arrives too fast, overshoots, or catches and falls right away"), tr("diminua SW_EREF (0,03 → 0,01)", "decrease SW_EREF (0.03 → 0.01)")],
      [tr("Demora muito para ganhar altura", "Takes too long to gain height"), tr("aumente SW_VS (0,35 → 0,40)", "increase SW_VS (0.35 → 0.40)")],
      [tr("O carro passa muito tempo nas pontas da faixa", "The cart spends too much time at the ends of the range"), tr("aumente SW_KX (2 → 3)", "increase SW_KX (2 → 3)")],
    ] as Row[],
    equilibrio: [
      [tr("Tremedeira rápida, zumbido no motor", "Fast jitter, buzzing motor"), tr("diminua K_W uns 20 % (−24,7 → −20)", "reduce K_W by about 20% (−24.7 → −20)")],
      [
        tr("Equilibra, mas vai “passeando” devagar para um lado", "Balances, but slowly “wanders” to one side"),
        tr(
          "normal no começo: o K_BIAS corrige em ~10 s; se não corrigir, religue com a haste bem parada",
          "normal at first: K_BIAS corrects it in ~10 s; if it doesn't, power-cycle with the rod completely still",
        ),
      ],
      [tr("Motor apita e perde passo", "Motor whines and skips steps"), tr("baixe AMAX de 8 para 6", "lower AMAX from 8 to 6")],
      [
        tr("Fica sempre no vai e vem, sem nunca subir", "Keeps going back and forth and never swings up"),
        tr(
          "a haste não estava parada ao ligar: desligue, espere parar e ligue de novo",
          "the rod wasn't still at power-up: turn it off, wait for it to stop and turn it on again",
        ),
      ],
    ] as Row[],
  },

  licoes: [
    {
      title: tr("Medir antes de calcular em cima", "Measure before you build on a number"),
      text: tr(
        "O cronômetro deu 1,8 s; o encoder deu 1,121 s. Um ganho calculado com o número errado teria derrubado a haste, e eu ia procurar o defeito no código.",
        "The stopwatch said 1.8 s; the encoder said 1.121 s. A gain calculated from the wrong number would have dropped the rod, and I'd have gone looking for the bug in the code.",
      ),
    },
    {
      title: tr("Testar uma coisa de cada vez", "Test one thing at a time"),
      text: tr(
        "Encoder, motor, haste e só então o controle. Quando algo falha, só existe um suspeito.",
        "Encoder, motor, rod, and only then the controller. When something fails, there's only one suspect.",
      ),
    },
    {
      title: tr("Peça de teste pequena antes da grande", "A small test print before the big one"),
      text: tr("51 minutos de impressão que salvaram uma de 4 horas.", "51 minutes of printing that saved a 4-hour print."),
    },
    {
      title: tr("Segurança no lugar mais baixo possível", "Safety at the lowest possible level"),
      text: tr(
        "A trava dos 20 mm está dentro da interrupção que dá os passos, não no controle: nem um bug no controle passa dela.",
        "The 20 mm lock lives inside the interrupt that issues the steps, not in the controller: not even a bug in the controller gets past it.",
      ),
    },
    {
      title: tr("Simular com os defeitos do mundo real", "Simulate with real-world flaws"),
      text: tr(
        "Encoder em degraus, atraso, atrito e ±2 % no modelo. Uma simulação perfeita teria aprovado um controle frágil.",
        "A quantized encoder, delay, friction and ±2% on the model. A perfect simulation would have approved a fragile controller.",
      ),
    },
  ],
};

export const sketchHref = (file: string) => `${A}/firmware/${file}`;
