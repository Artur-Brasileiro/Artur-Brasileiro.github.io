import { Code2, Cpu, type LucideIcon } from "lucide-react";

/** Projetos em destaque (home), catálogo completo (rotas de categoria) e os cases do Polpad e da CNC. */

export type FeaturedProject = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  /** Arte é um logo: exibir contido com respiro, não recortado. */
  logoCover: boolean;
  tags: string[];
  demoLink: string;
  githubLink: string;
  /** `true` quando demoLink é uma rota interna do próprio site. */
  isInternal: boolean;
};

export const featuredProjects: FeaturedProject[] = [
  {
    id: "viewcongresso",
    title: "ViewCongresso",
    category: "Software",
    description:
      "Plataforma corporativa para organização e participação em congressos e simpósios, oferecendo gestão de submissão de trabalhos, inscrições e avaliação por pares.",
    image: "viewcongresso.svg",
    logoCover: true,
    tags: ["Next.js", "React", "TypeScript"],
    demoLink: "https://viewcongresso.com.br",
    githubLink: "",
    isInternal: false,
  },
  {
    id: "atlas-fluency",
    title: "Atlas Fluency",
    category: "Software",
    description:
      "Plataforma de aprendizado de idiomas e SaaS de gestão para professores: registro de aulas, controle de pagamentos e atribuição de atividades criadas dentro da própria plataforma.",
    image: "atlasfluency-logo.svg",
    logoCover: true,
    tags: ["React", "TypeScript", "Tailwind CSS"],
    demoLink: "https://atlasfluency.com.br",
    githubLink: "",
    isInternal: false,
  },
  {
    id: "macropad-oled",
    title: "Polpad",
    category: "Hardware",
    description:
      "Macropad open source com display OLED e app para Windows e Linux que troca as funções das teclas conforme o programa em uso.",
    image: "capa_macropad.jpg",
    logoCover: false,
    tags: ["C++", "Python", "Integração de Hardware"],
    demoLink: "/projeto/macropad",
    githubLink: "https://github.com/gabriel-re-pires/polpad",
    isInternal: true,
  },
];

export type ProjectItem = {
  id: number;
  name: string;
  description: string;
  githubLink?: string;
  siteLink?: string;
  image?: string;
  youtubeId?: string;
  longDescription?: string;
  technicalLink?: string;
  tags?: string[];
  internalLink?: string;
};

export type SoftwareCategory = {
  slug: "programacao";
  title: string;
  lead: string;
  icon: LucideIcon;
  subsections: { title: string; projects: ProjectItem[] }[];
};

export type HardwareCategory = {
  slug: "hardware";
  title: string;
  lead: string;
  icon: LucideIcon;
  projects: ProjectItem[];
};

export const projectData: {
  programacao: SoftwareCategory;
  hardware: HardwareCategory;
} = {
  programacao: {
    slug: "programacao",
    title: "Projetos de Programação",
    lead: "Aplicações web, experimentos em inteligência artificial e automações em ciência de dados.",
    icon: Code2,
    subsections: [
      {
        title: "Inteligência Artificial",
        projects: [
          {
            id: 9,
            name: "Introdução IA",
            description:
              "Projeto onde registro meu aprendizado e evolução no estudo de Inteligência Artificial.",
            githubLink: "https://github.com/Artur-Brasileiro/Introducao-IA",
          },
          {
            id: 5,
            name: "Perceptron Reconhecedor",
            description:
              'Desenvolvimento e treinamento de uma IA simples (Perceptron) para classificar a letra "A".',
            githubLink: "https://github.com/Artur-Brasileiro/Perceptron-Reconhecedor",
          },
          {
            id: 10,
            name: "Algoritmo KNN",
            description:
              "Implementação do algoritmo KNN para classificar dados com base nos vizinhos mais próximos.",
            githubLink: "https://github.com/Artur-Brasileiro/Algoritmo-KNN",
          },
        ],
      },
      {
        title: "Desenvolvimento Web",
        projects: [
          {
            id: 15,
            name: "ViewCongresso",
            description:
              "Plataforma web para organização e participação em congressos e eventos acadêmicos, com submissão de trabalhos, inscrições e avaliação por pares.",
            siteLink: "https://viewcongresso.com.br",
          },
          {
            id: 11,
            name: "Atlas Fluency",
            description:
              "Plataforma de aprendizado de idiomas e SaaS de gestão para professores: registro de aulas, controle de pagamentos e atribuição de atividades criadas na própria plataforma.",
            siteLink: "https://atlasfluency.com.br",
          },
          {
            id: 12,
            name: "Portfólio - Professor de Inglês",
            description:
              "Site portfólio para professor de inglês, destacando serviços e depoimentos.",
            githubLink: "https://github.com/Artur-Brasileiro/Portfolio-Professor",
            siteLink: "https://rodrigoalmeida.vercel.app/",
          },
          {
            id: 1,
            name: "Chatbot com React",
            description: "Desenvolvimento em React de um chatbot integrado com uma IA simples.",
            githubLink: "https://github.com/Artur-Brasileiro/Chatbot-React",
          },
          {
            id: 2,
            name: "Gerenciamento Familiar",
            description:
              "Criação de aplicação web feito com C# e Angular para fazer o controle financeiro de uma família.",
            githubLink: "https://github.com/Artur-Brasileiro/Gerenciamento-Familiar",
          },
        ],
      },
      {
        title: "Ciência de Dados & Automação",
        projects: [
          {
            id: 6,
            name: "Análise de Dados PRF",
            description:
              "Ciência de Dados aplicada em uma planilha do Excel da PRF para visualizarmos quais munícipios brasileiros tem o maior índice de acidentes em rodovias.",
            githubLink: "https://github.com/Artur-Brasileiro/Analise-PRF",
          },
          {
            id: 7,
            name: "Web Scraping Simples",
            description:
              "Web Scraping no site da CEMIG utilizando Python para comparar dados anuais.",
            githubLink: "https://github.com/Artur-Brasileiro/Web-Scraping",
          },
          {
            id: 8,
            name: "Relação Idade x Pressão",
            description:
              "Plotagem de um gráfico simples para visualizar a relação de Idade x Pressão Sistólica.",
            githubLink: "https://github.com/Artur-Brasileiro/Grafico-Dispersao",
          },
        ],
      },
    ],
  },
  hardware: {
    slug: "hardware",
    title: "Projetos de Hardware e Embarcados",
    lead: "Eletrônica, firmware e prototipagem — do esquemático à placa montada.",
    icon: Cpu,
    projects: [
      {
        id: 3,
        name: "Analisador de Espectro de Áudio",
        description: "Visualização de espectro em tempo real.",
        image: "projeto_espectro.webp",
        youtubeId: "9tUq1hGooeE",
        longDescription:
          "Um analisador de áudio compacto que usa um ESP32-S3 para capturar sons, processar as frequências e exibir o espectro em uma pequena tela OLED. Mostra a forma “visual” do som em tempo real.",
        technicalLink: "https://github.com/Artur-Brasileiro/Analisador-Espectro",
        tags: ["ESP32-S3", "OLED", "C++", "Processamento de Áudio"],
      },
      {
        id: 4,
        name: "Deauther Didático (2.4 e 5GHz)",
        description: "Desautenticação de redes em ambiente controlado.",
        image: "projeto_deauther.webp",
        youtubeId: "kmqZ7n9kF94",
        longDescription:
          'Dispositivo didático baseado no BW-16 com tela OLED de 0,96", usado para estudar o funcionamento de redes Wi-Fi e entender, em ambiente controlado, como pacotes de desautenticação afetam a conexão. O projeto inclui case em impressão 3D e uma placa de circuito impresso feita manualmente, tornando o dispositivo compacto e ideal para aprendizado prático.',
        technicalLink: "https://github.com/Artur-Brasileiro/Deauther-5GHz",
        tags: ["BW-16", "Redes Wi-Fi", "PCB Customizada", "Impressão 3D"],
      },
      {
        id: 13,
        name: "Monitor de Luminosidade com Feedback Visual",
        description: "Sistema de leitura analógica com acionamento inteligente de atuadores.",
        image: "projeto_sensorluz.webp",
        youtubeId: "rBSG0NzcMFI",
        longDescription:
          "Um projeto prático de sistemas embarcados focado em eletrônica analógica e conversão ADC. Utiliza um sensor LDR em configuração de divisor de tensão para monitorar a luz ambiente. O microcontrolador processa os sinais em tempo real e categoriza a luminosidade, acionando um semáforo de LEDs com base em limiares (thresholds) pré-definidos no código.",
        technicalLink: "https://github.com/Artur-Brasileiro/Sensor-Luz",
        tags: ["Arduino", "Eletrônica Analógica", "Sensores LDR", "C++"],
      },
      {
        id: 14,
        name: "Polpad",
        description:
          "Macropad open source com display integrado e app para Windows e Linux que detecta o programa ativo.",
        image: "capa_macropad.jpg",
        internalLink: "/projeto/macropad",
        longDescription:
          "Um teclado auxiliar feito do zero, unindo circuito impresso, eletrônica embarcada e software. O app desktop em Python detecta a janela ativa e troca as funções das teclas; placa, case, firmware e app são abertos para qualquer um montar e contribuir.",
        technicalLink: "https://github.com/gabriel-re-pires/polpad",
        tags: ["C++", "EasyEDA", "PCB", "Python"],
      },
      {
        id: 16,
        name: "CNC Plotter",
        description: "Plotter de mesa com área de 818 × 402 mm, com simulação 3D que desenha e escreve o que você digitar.",
        image: "projetos/cnc/poster-800.webp",
        internalLink: "/projeto/cnc-plotter",
        longDescription:
          "Uma plotter grande, montada sobre uma mesa de pinus: dois motores NEMA 17 e correias GT2 levam uma caneta por uma área de 818 × 402 mm, e um servo SG90 a levanta entre um traço e outro. A página do projeto tem a máquina inteira em 3D, desenhando em tempo real, com os eixos à mão e um campo onde você digita e ela escreve.",
        tags: ["NEMA 17", "GT2", "Servo SG90", "FreeCAD", "G-code"],
      },
    ],
  },
};

export const softwareCount = projectData.programacao.subsections.reduce(
  (sum, s) => sum + s.projects.length,
  0,
);
export const hardwareCount = projectData.hardware.projects.length;

/** Total de projetos catalogados — alimenta a faixa de métricas do hero. */
export const projectCount = softwareCount + hardwareCount;

/** Atalhos de categoria exibidos abaixo dos destaques na home. */
export const projectCategories = [
  {
    to: "/programacao",
    icon: Code2,
    title: "Programação",
    summary: "Web, inteligência artificial e ciência de dados",
    count: softwareCount,
  },
  {
    to: "/hardware",
    icon: Cpu,
    title: "Hardware e embarcados",
    summary: "Eletrônica, firmware e prototipagem em PCB",
    count: hardwareCount,
  },
];

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

/* ------------------------------------------------------------------ */
/* Case: CNC Plotter                                                   */
/* ------------------------------------------------------------------ */

export const cnc = {
  title: "CNC Plotter",
  category: "Hardware & mecânica",
  status: "Em desenvolvimento",
  statusNote: "Carro v2 a imprimir",
  summary:
    "Uma plotter de mesa grande, feita em casa: barras de aço de 1 metro, correias GT2 e dois NEMA 17 levam uma caneta por uma área de 818 × 402 mm. A máquina inteira está modelada no FreeCAD, e é esse modelo que desenha aqui embaixo.",
  specs: [
    { label: "Área útil", value: "818 × 402 mm" },
    { label: "Eixo X", value: "2 × barra Ø12 × 1000 mm · 3 × LM12UU" },
    { label: "Eixo Y", value: "2 × barra Ø6 × 500 mm · LM6UU" },
    { label: "Motores", value: "2 × NEMA 17 (17HS4401)" },
    { label: "Transmissão", value: "Correia GT2 6 mm · polias 20T" },
    { label: "Caneta", value: "Servo SG90 · pen holder em LM6UU" },
    { label: "Resolução", value: "80 passos/mm (1/16 de micropasso)" },
  ],
  /** como cada eixo se move — tirado do modelo, peça por peça */
  mechanics: [
    {
      ref: "X",
      title: "Eixo X em ômega",
      text: "A correia do eixo longo fica presa nos dois suportes da mesa e não se move. O motor viaja com a ponte e passa a correia por duas polias loucas e pela própria polia, num desenho de ômega: girando, ele “escala” a correia e arrasta a ponte inteira sobre as barras de 12 mm.",
    },
    {
      ref: "Y",
      title: "Eixo Y com correia aberta",
      text: "No eixo curto a correia é aberta: cada ponta dá a volta no pino de uma presilha do carro e trava em si mesma, com um M3 no rasgo para ajustar a tensão. Ela passa pela polia louca do Apoio Secundário e pela polia do motor, preso por baixo da base principal.",
    },
    {
      ref: "Z",
      title: "Caneta por gravidade",
      text: "O pen holder corre em dois rolamentos LM6UU. O braço do servo SG90 empurra o pino dele para levantar a caneta; para baixar, o servo só sai da frente e a caneta desce pelo próprio peso até o papel. Um fim de curso, acionado por um dedo do carro, marca o Y zero.",
    },
  ],
};
