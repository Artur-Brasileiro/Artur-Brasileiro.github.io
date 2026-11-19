/** Case do Polpad (antes Macropad Inteligente): linha do tempo, repositório e instaladores. */

import { tr, type Localized, type Tx } from "@/i18n/core";

/* ------------------------------------------------------------------ */
/* Case: Polpad (antes Macropad Inteligente)                           */
/* ------------------------------------------------------------------ */

/** texto nos dois idiomas (tr) ou igual nos dois (nomes, siglas) */
type Text = string | Tx;

export type TimelineStatus = "completed" | "current" | "planned";

type TimelineSource = {
  status: TimelineStatus;
  date: Text;
  title: Text;
  description: Text;
  image?: string;
  images?: string[];
  modelUrl?: string;
  /** frase ao lado do modelo 3D, dizendo o que se gira */
  modelHint?: Text;
  /** repositório onde a fase acontece, mostrado como cartão */
  repository?: {
    url: string;
    name: string;
    description: Text;
    stack: string[];
    /** quem mais assina o código, quando o repositório não é do Artur */
    credit?: Text;
    /** última versão para baixar */
    releaseUrl?: string;
  };
};

/** uma fase da linha do tempo, já no idioma da página (depois do useLocalized) */
export type TimelineItem = Localized<TimelineSource>;

/** O Polpad (antes "Macropad Inteligente"): repositório, licenças e os instaladores da última versão. */
export const POLPAD_REPO = "gabriel-re-pires/polpad";
const POLPAD_URL = `https://github.com/${POLPAD_REPO}`;

export type Installer = {
  os: "windows" | "linux";
  label: Text;
  /** para quem é: sistema e formato */
  detail: Text;
  /** nome do anexo no release (o link "latest" sempre aponta para a versão mais nova) */
  asset: string;
  url: string;
};

const latest = (asset: string) => `${POLPAD_URL}/releases/latest/download/${asset}`;

export const macropad = {
  title: "Polpad",
  /** o nome antigo, para quem chega procurando por ele */
  formerly: tr("Macropad Inteligente", "Smart Macropad"),
  category: tr("Hardware & software livre", "Open hardware & software"),
  /** o hardware está pronto; o software segue evoluindo em aberto */
  status: "Open source",
  statusNote: tr("Em desenvolvimento aberto", "Developed in the open"),
  summary: tr(
    "Um macropad de 18 teclas com display OLED, feito do zero — placa, case, firmware e app — e aberto para quem quiser montar o seu, adaptar e contribuir.",
    "An 18-key macropad with an OLED display, built from scratch — PCB, case, firmware and app — and open to anyone who wants to build their own, adapt it and contribute.",
  ),
  repository: POLPAD_URL,
  releases: `${POLPAD_URL}/releases`,
  installers: [
    {
      os: "windows",
      label: tr("Baixar para Windows", "Download for Windows"),
      detail: tr("Windows 10/11 · instalador .exe", "Windows 10/11 · .exe installer"),
      asset: "Polpad-Windows-Instalador.exe",
      url: latest("Polpad-Windows-Instalador.exe"),
    },
    {
      os: "linux",
      label: tr("Baixar para Linux", "Download for Linux"),
      detail: tr("Linux x86-64 · pacote .tar.gz", "Linux x86-64 · .tar.gz package"),
      asset: "Polpad-Linux-Instalador.tar.gz",
      url: latest("Polpad-Linux-Instalador.tar.gz"),
    },
  ] as Installer[],
  rationale: [
    tr(
      "O projeto nasceu como um macropad para o TCC, feito em parceria com Gabriel R. Pires: um teclado auxiliar que se adapta ao que você está fazendo. Abriu o editor de código, as 18 teclas e a tela assumem compilar, depurar e formatar; trocou para o navegador, os atalhos mudam junto.",
      "The project started as a macropad for our capstone project, built together with Gabriel R. Pires: a secondary keyboard that adapts to what you're doing. Open the code editor, and the 18 keys and the screen take on compile, debug and format; switch to the browser, and the shortcuts change with it.",
    ),
    tr(
      "No caminho ele virou o Polpad, e a premissa cresceu: em vez de um aparelho fechado, uma base aberta. A placa e a case estão sob licença de hardware livre (CERN-OHL-S), o firmware e o app sob GPL-3.0, e o repositório traz os STLs e o G-code da case prontos para imprimir.",
      "Along the way it became Polpad, and the premise grew: instead of a closed device, an open platform. The PCB and the case are under an open hardware license (CERN-OHL-S), the firmware and the app under GPL-3.0, and the repository ships the case STLs and G-code ready to print.",
    ),
    tr(
      "Qualquer pessoa pode montar o seu, mudar o que quiser e devolver para o projeto. No app, cada tipo de ação é uma função registrada — atalhos, comandos, chamadas HTTP, OBS Studio, Home Assistant —, então somar uma ação nova não mexe no resto do código.",
      "Anyone can build their own, change whatever they want and give back to the project. In the app, each action type is a registered function — shortcuts, commands, HTTP calls, OBS Studio, Home Assistant — so adding a new action doesn't touch the rest of the code.",
    ),
  ],
  specs: [
    { label: tr("Teclas", "Keys"), value: tr("18 switches mecânicos", "18 mechanical switches") },
    { label: "Display", value: tr("OLED 0,96\" · 128 × 64", "OLED 0.96\" · 128 × 64") },
    { label: tr("Microcontrolador", "Microcontroller"), value: "ESP32-C3 SuperMini" },
    { label: "Firmware", value: "C++ · USB serial + Bluetooth LE" },
    { label: "App", value: tr("Python · Qt · Windows e Linux", "Python · Qt · Windows and Linux") },
    { label: tr("Placa", "Board"), value: tr("PCB própria (EasyEDA / JLCPCB)", "Custom PCB (EasyEDA / JLCPCB)") },
    { label: "Case", value: tr("Impressão 3D, inclinação de 7°", "3D printed, 7° tilt") },
    { label: tr("Licenças", "Licenses"), value: "GPL-3.0 · CERN-OHL-S" },
  ],
  timeline: [
    {
      status: "completed",
      date: tr("Fase 1", "Phase 1"),
      title: tr("Desenho da PCB no EasyEDA", "PCB design in EasyEDA"),
      description: tr(
        "Elaboração do esquemático e roteamento completo da placa no EasyEDA. O layout foi cuidadosamente planejado para acomodar as 18 teclas mecânicas e o display OLED de forma ergonômica.",
        "Schematic capture and full board routing in EasyEDA. The layout was carefully planned to fit the 18 mechanical keys and the OLED display ergonomically.",
      ),
      modelUrl: "macropadpage/placa.glb",
      modelHint: tr(
        "Expanda para girar a placa montada em 3D: tela, ESP32-C3, soquetes Kailh e switches.",
        "Expand to rotate the assembled board in 3D: screen, ESP32-C3, Kailh sockets and switches.",
      ),
    },
    {
      status: "completed",
      date: tr("Fase 2", "Phase 2"),
      title: tr("Fabricação e Chegada da PCB", "PCB Fabrication and Arrival"),
      description: tr(
        "Os arquivos Gerber foram enviados à JLCPCB e a placa foi fabricada. O protótipo chegou ao Brasil, pronto para a etapa de montagem.",
        "The Gerber files went to JLCPCB and the board was fabricated. The prototype arrived in Brazil, ready for assembly.",
      ),
      images: ["macropadpage/macropad1.jpg", "macropadpage/macropad2.jpg"],
    },
    {
      status: "completed",
      date: tr("Fase 3", "Phase 3"),
      title: tr("Montagem da Placa", "Board Assembly"),
      description: tr(
        "Com a PCB em mãos, foi feita a montagem: soldagem dos diodos, dos switches mecânicos, do microcontrolador e a conexão do display OLED. A placa ficou montada e funcional, pronta para receber a case.",
        "With the PCB in hand, assembly came next: soldering the diodes, the mechanical switches and the microcontroller, and hooking up the OLED display. The board was assembled and working, ready for its case.",
      ),
      image: "capa_macropad.jpg",
    },
    {
      status: "completed",
      date: tr("Fase 4", "Phase 4"),
      title: tr("Criação da Case (Impressão 3D)", "Creating the Case (3D Printing)"),
      description: tr(
        "Case sob medida impressa em 3D, em duas peças: a moldura, com a placa de encaixe dos switches integrada, e a bandeja inferior, em cunha de 7° para a digitação ficar confortável. As peças se fecham por quatro parafusos M3 que entram por baixo, em insertos de latão, então nenhum parafuso aparece. O display ganhou uma moldura elevada que deixa à vista só o vidro.",
        "A custom 3D-printed case in two parts: the frame, with the switch plate built in, and the bottom tray, a 7° wedge for comfortable typing. Four M3 screws close it from below into brass inserts, so no screw shows. The display got a raised bezel that leaves only the glass in view.",
      ),
      modelUrl: "macropadpage/case.glb",
      modelHint: tr("Expanda para girar a case em 3D.", "Expand to rotate the case in 3D."),
    },
    {
      status: "completed",
      date: tr("Fase 5", "Phase 5"),
      title: tr("Firmware em C++ e app em Python", "C++ firmware and Python app"),
      description: tr(
        "O firmware no ESP32-C3 varre a matriz e desenha o que o computador manda no display; toda a lógica fica no app. Ele organiza as 18 teclas em perfis, troca de perfil sozinho conforme o programa em foco, mostra o mapa das teclas no OLED e grava o firmware pela USB. Sem o app, o Polpad vira um teclado Bluetooth com atalhos fixos.",
        "The firmware on the ESP32-C3 scans the key matrix and draws whatever the computer sends to the display; all the logic lives in the app. The app organizes the 18 keys into profiles, switches profiles on its own based on the program in focus, shows the key map on the OLED and flashes the firmware over USB. Without the app, Polpad works as a Bluetooth keyboard with fixed shortcuts.",
      ),
    },
    {
      status: "current",
      date: tr("Fase 6", "Phase 6"),
      title: tr("Polpad, em código aberto", "Polpad, open source"),
      description: tr(
        "O projeto ganhou nome, ícone e casa própria no GitHub, com instalador para Windows e Linux e atualização automática dentro do app. O código, a placa e a case estão abertos para quem quiser montar, adaptar ou contribuir com novas ações e integrações.",
        "The project got a name, an icon and its own home on GitHub, with installers for Windows and Linux and automatic updates inside the app. The code, the PCB and the case are open to anyone who wants to build, adapt or contribute new actions and integrations.",
      ),
      repository: {
        url: POLPAD_URL,
        name: POLPAD_REPO,
        description: tr(
          "App, firmware, protocolo e os arquivos da case (STL e G-code). Software sob GPL-3.0 e hardware sob CERN-OHL-S.",
          "App, firmware, protocol and the case files (STL and G-code). Software under GPL-3.0 and hardware under CERN-OHL-S.",
        ),
        stack: ["Python", "Qt", "C++", "ESP32-C3"],
        // o repositório é do Gabriel, parceiro no TCC; o Artur contribui nele
        credit: tr("Em parceria com Gabriel R. Pires", "In partnership with Gabriel R. Pires"),
        releaseUrl: `${POLPAD_URL}/releases/latest`,
      },
    },
  ] as TimelineSource[],
};
