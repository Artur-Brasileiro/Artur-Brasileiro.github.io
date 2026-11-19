/** Case do Polpad (antes Macropad Inteligente): linha do tempo, repositório e instaladores. */

/* ------------------------------------------------------------------ */
/* Case: Polpad (antes Macropad Inteligente)                           */
/* ------------------------------------------------------------------ */

export type TimelineStatus = "completed" | "current" | "planned";

export type TimelineItem = {
  status: TimelineStatus;
  date: string;
  title: string;
  description: string;
  image?: string;
  images?: string[];
  modelUrl?: string;
  /** frase ao lado do modelo 3D, dizendo o que se gira */
  modelHint?: string;
  /** repositório onde a fase acontece, mostrado como cartão */
  repository?: {
    url: string;
    name: string;
    description: string;
    stack: string[];
    /** quem mais assina o código, quando o repositório não é do Artur */
    credit?: string;
    /** última versão para baixar */
    releaseUrl?: string;
  };
};

/** O Polpad (antes "Macropad Inteligente"): repositório, licenças e os instaladores da última versão. */
export const POLPAD_REPO = "gabriel-re-pires/polpad";
const POLPAD_URL = `https://github.com/${POLPAD_REPO}`;

export type Installer = {
  os: "windows" | "linux";
  label: string;
  /** para quem é: sistema e formato */
  detail: string;
  /** nome do anexo no release (o link "latest" sempre aponta para a versão mais nova) */
  asset: string;
  url: string;
};

const latest = (asset: string) => `${POLPAD_URL}/releases/latest/download/${asset}`;

export const macropad = {
  title: "Polpad",
  /** o nome antigo, para quem chega procurando por ele */
  formerly: "Macropad Inteligente",
  category: "Hardware & software livre",
  /** o hardware está pronto; o software segue evoluindo em aberto */
  status: "Open source",
  statusNote: "Em desenvolvimento aberto",
  summary:
    "Um macropad de 18 teclas com display OLED, feito do zero — placa, case, firmware e app — e aberto para quem quiser montar o seu, adaptar e contribuir.",
  repository: POLPAD_URL,
  releases: `${POLPAD_URL}/releases`,
  installers: [
    {
      os: "windows",
      label: "Baixar para Windows",
      detail: "Windows 10/11 · instalador .exe",
      asset: "Polpad-Windows-Instalador.exe",
      url: latest("Polpad-Windows-Instalador.exe"),
    },
    {
      os: "linux",
      label: "Baixar para Linux",
      detail: "Linux x86-64 · pacote .tar.gz",
      asset: "Polpad-Linux-Instalador.tar.gz",
      url: latest("Polpad-Linux-Instalador.tar.gz"),
    },
  ] as Installer[],
  rationale: [
    "O projeto nasceu como um macropad para o TCC, feito em parceria com Gabriel R. Pires: um teclado auxiliar que se adapta ao que você está fazendo. Abriu o editor de código, as 18 teclas e a tela assumem compilar, depurar e formatar; trocou para o navegador, os atalhos mudam junto.",
    "No caminho ele virou o Polpad, e a premissa cresceu: em vez de um aparelho fechado, uma base aberta. A placa e a case estão sob licença de hardware livre (CERN-OHL-S), o firmware e o app sob GPL-3.0, e o repositório traz os STLs e o G-code da case prontos para imprimir.",
    "Qualquer pessoa pode montar o seu, mudar o que quiser e devolver para o projeto. No app, cada tipo de ação é uma função registrada — atalhos, comandos, chamadas HTTP, OBS Studio, Home Assistant —, então somar uma ação nova não mexe no resto do código.",
  ],
  specs: [
    { label: "Teclas", value: "18 switches mecânicos" },
    { label: "Display", value: "OLED 0,96\" · 128 × 64" },
    { label: "Microcontrolador", value: "ESP32-C3 SuperMini" },
    { label: "Firmware", value: "C++ · USB serial + Bluetooth LE" },
    { label: "App", value: "Python · Qt · Windows e Linux" },
    { label: "Placa", value: "PCB própria (EasyEDA / JLCPCB)" },
    { label: "Case", value: "Impressão 3D, inclinação de 7°" },
    { label: "Licenças", value: "GPL-3.0 · CERN-OHL-S" },
  ],
  timeline: [
    {
      status: "completed",
      date: "Fase 1",
      title: "Desenho da PCB no EasyEDA",
      description:
        "Elaboração do esquemático e roteamento completo da placa no EasyEDA. O layout foi cuidadosamente planejado para acomodar as 18 teclas mecânicas e o display OLED de forma ergonômica.",
      modelUrl: "macropadpage/placa.glb",
      modelHint: "Expanda para girar a placa montada em 3D: tela, ESP32-C3, soquetes Kailh e switches.",
    },
    {
      status: "completed",
      date: "Fase 2",
      title: "Fabricação e Chegada da PCB",
      description:
        "Os arquivos Gerber foram enviados à JLCPCB e a placa foi fabricada. O protótipo chegou ao Brasil, pronto para a etapa de montagem.",
      images: ["macropadpage/macropad1.jpg", "macropadpage/macropad2.jpg"],
    },
    {
      status: "completed",
      date: "Fase 3",
      title: "Montagem da Placa",
      description:
        "Com a PCB em mãos, foi feita a montagem: soldagem dos diodos, dos switches mecânicos, do microcontrolador e a conexão do display OLED. A placa ficou montada e funcional, pronta para receber a case.",
      image: "capa_macropad.jpg",
    },
    {
      status: "completed",
      date: "Fase 4",
      title: "Criação da Case (Impressão 3D)",
      description:
        "Case sob medida impressa em 3D, em duas peças: a moldura, com a placa de encaixe dos switches integrada, e a bandeja inferior, em cunha de 7° para a digitação ficar confortável. As peças se fecham por quatro parafusos M3 que entram por baixo, em insertos de latão, então nenhum parafuso aparece. O display ganhou uma moldura elevada que deixa à vista só o vidro.",
      modelUrl: "macropadpage/case.glb",
      modelHint: "Expanda para girar a case em 3D.",
    },
    {
      status: "completed",
      date: "Fase 5",
      title: "Firmware em C++ e app em Python",
      description:
        "O firmware no ESP32-C3 varre a matriz e desenha o que o computador manda no display; toda a lógica fica no app. Ele organiza as 18 teclas em perfis, troca de perfil sozinho conforme o programa em foco, mostra o mapa das teclas no OLED e grava o firmware pela USB. Sem o app, o Polpad vira um teclado Bluetooth com atalhos fixos.",
    },
    {
      status: "current",
      date: "Fase 6",
      title: "Polpad, em código aberto",
      description:
        "O projeto ganhou nome, ícone e casa própria no GitHub, com instalador para Windows e Linux e atualização automática dentro do app. O código, a placa e a case estão abertos para quem quiser montar, adaptar ou contribuir com novas ações e integrações.",
      repository: {
        url: POLPAD_URL,
        name: POLPAD_REPO,
        description:
          "App, firmware, protocolo e os arquivos da case (STL e G-code). Software sob GPL-3.0 e hardware sob CERN-OHL-S.",
        stack: ["Python", "Qt", "C++", "ESP32-C3"],
        // o repositório é do Gabriel, parceiro no TCC; o Artur contribui nele
        credit: "Em parceria com Gabriel R. Pires",
        releaseUrl: `${POLPAD_URL}/releases/latest`,
      },
    },
  ] as TimelineItem[],
};
