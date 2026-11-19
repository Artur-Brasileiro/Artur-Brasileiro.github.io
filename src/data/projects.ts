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
        description: "Plotter de mesa com área de 810 × 390 mm, com simulação 3D e um guia completo para montar a sua.",
        image: "projetos/cnc/poster-800.webp",
        internalLink: "/projeto/cnc-plotter",
        longDescription:
          "Uma plotter grande, montada sobre uma mesa de pinus: dois motores NEMA 17 e correias GT2 levam uma caneta por uma área de 810 × 390 mm, e um servo MG90S a levanta entre um traço e outro. A página do projeto tem a máquina inteira em 3D, desenhando em tempo real, e um guia de montagem com o material, as ligações, o GRBL e o caminho da imagem ao G-code.",
        tags: ["NEMA 17", "GT2", "GRBL", "FreeCAD", "G-code"],
      },
      {
        id: 17,
        name: "Pêndulo Invertido",
        description: "Haste de meio metro que sobe e se equilibra sozinha sobre um carrinho, com simulador 3D em que você mesmo empurra.",
        image: "projetos/pendulo/poster-800.webp",
        internalLink: "/projeto/pendulo-invertido",
        longDescription:
          "Uma haste de inox de 500 mm, em pé sobre um carrinho num trilho MGN15H levado por um NEMA 17. Ao ligar, o carro balança a haste até ela subir e depois a segura em pé com um controle LQR a 200 Hz num Arduino UNO, lendo um encoder de 4000 contagens por volta. A página do projeto roda o mesmo firmware sobre a física medida da haste (dá para empurrar, desligar o controle e ver em câmera lenta) e traz o guia completo para montar o seu, com firmware, peças e ligações.",
        tags: ["Arduino", "LQR", "NEMA 17", "Encoder", "CadQuery"],
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
