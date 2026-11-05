import { Code2, Cpu, type LucideIcon } from "lucide-react";

/** Projetos em destaque (home), catálogo completo (rotas de categoria) e o case do Macropad. */

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
    title: "Macropad Inteligente",
    category: "Hardware",
    description:
      "Dispositivo IoT auxiliar com display OLED. Possui software desktop que se adapta dinamicamente ao contexto dos aplicativos em uso.",
    image: "capa_macropad.jpg",
    logoCover: false,
    tags: ["C++", "Python", "Integração de Hardware"],
    demoLink: "/projeto/macropad",
    githubLink: "https://github.com/Artur-Brasileiro/Macropad-TCC",
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
        name: "Macropad Inteligente",
        description:
          "Teclado auxiliar com display integrado e app multiplataforma que detecta programas ativos.",
        image: "capa_macropad.jpg",
        internalLink: "/projeto/macropad",
        longDescription:
          "Um teclado auxiliar customizado do zero, unindo design de circuito impresso, eletrônica embarcada e desenvolvimento de software multiplataforma. Ele possui um aplicativo desktop em Python que detecta a janela ativa para alterar dinamicamente o contexto e as funções das teclas do hardware.",
        technicalLink: "https://github.com/Artur-Brasileiro/Macropad-TCC",
        tags: ["C++", "EasyEDA", "PCB", "Python"],
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
/* Case: Macropad Inteligente                                          */
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
  repository?: { url: string; name: string; description: string; stack: string[] };
};

export const macropad = {
  title: "Macropad Inteligente",
  category: "Hardware & PCB",
  /** o hardware está pronto; o software segue evoluindo (ver a fase 5) */
  status: "Concluído",
  statusNote: "Em melhoria contínua",
  summary:
    "Um teclado auxiliar customizado do zero, unindo design de circuito impresso, eletrônica embarcada e desenvolvimento de software multiplataforma.",
  repository: "https://github.com/Artur-Brasileiro/Macropad-TCC",
  rationale: [
    "A motivação por trás deste projeto é criar uma ferramenta que realmente se adapte ao fluxo de trabalho do usuário, em vez de ser apenas um teclado genérico com atalhos fixos.",
    "Ao integrar um display OLED e desenvolver uma aplicação desktop inteligente, o Macropad saberá exatamente o que você está fazendo. Se você abrir o seu editor de código, as 18 teclas e a tela assumem funções de compilação, debug e formatação. Se você alternar para o navegador, os atalhos mudam instantaneamente.",
    "O grande desafio e diferencial deste projeto é construir a ponte completa: desenhar a própria placa, fabricar o protótipo, realizar a soldagem dos componentes e garantir que os códigos (C++ e Python) conversem perfeitamente com o sistema operacional.",
  ],
  specs: [
    { label: "Teclas", value: "18 switches mecânicos" },
    { label: "Display", value: "OLED integrado" },
    { label: "Firmware", value: "C++" },
    { label: "Aplicação desktop", value: "Python" },
    { label: "Placa", value: "PCB própria (EasyEDA / JLCPCB)" },
    { label: "Case", value: "Impressão 3D, inclinação de 7°" },
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
      status: "current",
      date: "Fase 5",
      title: "Desenvolvimento C++ e Python",
      description:
        "Criação do código em C++ para o firmware (varredura da matriz e controle do display) e desenvolvimento do software em Python para o computador, responsável por detectar a janela ativa e enviar os contextos corretos ao Macropad. O código é desenvolvido em aberto no GitHub.",
      repository: {
        url: "https://github.com/Artur-Brasileiro/Macropad-TCC",
        name: "Artur-Brasileiro/Macropad-TCC",
        description: "Firmware do ESP32-C3 e aplicação desktop que troca o contexto das teclas conforme o programa em uso.",
        stack: ["C++", "Python"],
      },
    },
  ] as TimelineItem[],
};
