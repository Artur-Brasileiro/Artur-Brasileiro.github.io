import { Code2, Cpu, type LucideIcon } from "lucide-react";
import { tr, type Tx } from "@/i18n/core";

/** Projetos em destaque (home), catálogo completo (rotas de categoria) e os cases do Polpad e da CNC. */

/** texto que muda com o idioma (tr) ou que é igual nos dois (nomes próprios, siglas) */
type Text = string | Tx;

export type FeaturedProject = {
  id: string;
  title: string;
  category: string;
  description: Text;
  image: string;
  /** Arte é um logo: exibir contido com respiro, não recortado. */
  logoCover: boolean;
  tags: Text[];
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
    description: tr(
      "Plataforma corporativa para organização e participação em congressos e simpósios, oferecendo gestão de submissão de trabalhos, inscrições e avaliação por pares.",
      "Enterprise platform for organizing and attending conferences and symposiums, with paper submission management, registration and peer review.",
    ),
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
    description: tr(
      "Plataforma de aprendizado de idiomas e SaaS de gestão para professores: registro de aulas, controle de pagamentos e atribuição de atividades criadas dentro da própria plataforma.",
      "Language-learning platform and management SaaS for teachers: lesson records, payment tracking and assigning activities created right inside the platform.",
    ),
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
    description: tr(
      "Macropad open source com display OLED e app para Windows e Linux que troca as funções das teclas conforme o programa em uso.",
      "Open-source macropad with an OLED display and a Windows and Linux app that switches the key functions based on the program in use.",
    ),
    image: "capa_macropad.jpg",
    logoCover: false,
    tags: ["C++", "Python", tr("Integração de Hardware", "Hardware Integration")],
    demoLink: "/projeto/macropad",
    githubLink: "https://github.com/gabriel-re-pires/polpad",
    isInternal: true,
  },
];

export type ProjectItem = {
  id: number;
  name: Text;
  description: Text;
  githubLink?: string;
  siteLink?: string;
  image?: string;
  youtubeId?: string;
  longDescription?: Text;
  technicalLink?: string;
  tags?: Text[];
  internalLink?: string;
};

export type SoftwareCategory = {
  slug: "programacao";
  title: Text;
  lead: Text;
  icon: LucideIcon;
  subsections: { title: Text; projects: ProjectItem[] }[];
};

export type HardwareCategory = {
  slug: "hardware";
  title: Text;
  lead: Text;
  icon: LucideIcon;
  projects: ProjectItem[];
};

export const projectData: {
  programacao: SoftwareCategory;
  hardware: HardwareCategory;
} = {
  programacao: {
    slug: "programacao",
    title: tr("Projetos de Programação", "Software Projects"),
    lead: tr(
      "Aplicações web, experimentos em inteligência artificial e automações em ciência de dados.",
      "Web applications, artificial intelligence experiments and data science automations.",
    ),
    icon: Code2,
    subsections: [
      {
        title: tr("Inteligência Artificial", "Artificial Intelligence"),
        projects: [
          {
            id: 9,
            name: tr("Introdução IA", "Intro to AI"),
            description: tr(
              "Projeto onde registro meu aprendizado e evolução no estudo de Inteligência Artificial.",
              "A project where I log what I learn and how I progress as I study Artificial Intelligence.",
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Introducao-IA",
          },
          {
            id: 5,
            name: tr("Perceptron Reconhecedor", "Perceptron Recognizer"),
            description: tr(
              'Desenvolvimento e treinamento de uma IA simples (Perceptron) para classificar a letra "A".',
              'Building and training a simple AI (a Perceptron) to classify the letter "A".',
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Perceptron-Reconhecedor",
          },
          {
            id: 10,
            name: tr("Algoritmo KNN", "KNN Algorithm"),
            description: tr(
              "Implementação do algoritmo KNN para classificar dados com base nos vizinhos mais próximos.",
              "An implementation of the KNN algorithm that classifies data based on its nearest neighbors.",
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Algoritmo-KNN",
          },
        ],
      },
      {
        title: tr("Desenvolvimento Web", "Web Development"),
        projects: [
          {
            id: 15,
            name: "ViewCongresso",
            description: tr(
              "Plataforma web para organização e participação em congressos e eventos acadêmicos, com submissão de trabalhos, inscrições e avaliação por pares.",
              "Web platform for organizing and attending conferences and academic events, with paper submission, registration and peer review.",
            ),
            siteLink: "https://viewcongresso.com.br",
          },
          {
            id: 11,
            name: "Atlas Fluency",
            description: tr(
              "Plataforma de aprendizado de idiomas e SaaS de gestão para professores: registro de aulas, controle de pagamentos e atribuição de atividades criadas na própria plataforma.",
              "Language-learning platform and management SaaS for teachers: lesson records, payment tracking and assigning activities created in the platform itself.",
            ),
            siteLink: "https://atlasfluency.com.br",
          },
          {
            id: 12,
            name: tr("Portfólio - Professor de Inglês", "Portfolio - English Teacher"),
            description: tr(
              "Site portfólio para professor de inglês, destacando serviços e depoimentos.",
              "Portfolio website for an English teacher, highlighting services and testimonials.",
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Portfolio-Professor",
            siteLink: "https://rodrigoalmeida.vercel.app/",
          },
          {
            id: 1,
            name: tr("Chatbot com React", "React Chatbot"),
            description: tr(
              "Desenvolvimento em React de um chatbot integrado com uma IA simples.",
              "A chatbot built in React and connected to a simple AI.",
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Chatbot-React",
          },
          {
            id: 2,
            name: tr("Gerenciamento Familiar", "Family Finance Manager"),
            description: tr(
              "Criação de aplicação web feito com C# e Angular para fazer o controle financeiro de uma família.",
              "A web app built with C# and Angular to keep track of a family's finances.",
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Gerenciamento-Familiar",
          },
        ],
      },
      {
        title: tr("Ciência de Dados & Automação", "Data Science & Automation"),
        projects: [
          {
            id: 6,
            name: tr("Análise de Dados PRF", "PRF Data Analysis"),
            description: tr(
              "Ciência de Dados aplicada em uma planilha do Excel da PRF para visualizarmos quais munícipios brasileiros tem o maior índice de acidentes em rodovias.",
              "Data science applied to an Excel spreadsheet from the PRF (Brazil's Federal Highway Police) to see which Brazilian municipalities have the highest rate of highway accidents.",
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Analise-PRF",
          },
          {
            id: 7,
            name: tr("Web Scraping Simples", "Simple Web Scraping"),
            description: tr(
              "Web Scraping no site da CEMIG utilizando Python para comparar dados anuais.",
              "Web scraping the website of CEMIG (a Brazilian power utility) with Python to compare yearly data.",
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Web-Scraping",
          },
          {
            id: 8,
            name: tr("Relação Idade x Pressão", "Age vs. Blood Pressure"),
            description: tr(
              "Plotagem de um gráfico simples para visualizar a relação de Idade x Pressão Sistólica.",
              "A simple chart that plots the relationship between age and systolic blood pressure.",
            ),
            githubLink: "https://github.com/Artur-Brasileiro/Grafico-Dispersao",
          },
        ],
      },
    ],
  },
  hardware: {
    slug: "hardware",
    title: tr("Projetos de Hardware e Embarcados", "Hardware and Embedded Projects"),
    lead: tr(
      "Eletrônica, firmware e prototipagem — do esquemático à placa montada.",
      "Electronics, firmware and prototyping — from schematic to assembled board.",
    ),
    icon: Cpu,
    projects: [
      {
        id: 3,
        name: tr("Analisador de Espectro de Áudio", "Audio Spectrum Analyzer"),
        description: tr("Visualização de espectro em tempo real.", "Real-time spectrum visualization."),
        image: "projeto_espectro.webp",
        youtubeId: "9tUq1hGooeE",
        longDescription: tr(
          "Um analisador de áudio compacto que usa um ESP32-S3 para capturar sons, processar as frequências e exibir o espectro em uma pequena tela OLED. Mostra a forma “visual” do som em tempo real.",
          "A compact audio analyzer that uses an ESP32-S3 to capture sound, process the frequencies and display the spectrum on a small OLED screen. It shows the “visual” shape of sound in real time.",
        ),
        technicalLink: "https://github.com/Artur-Brasileiro/Analisador-Espectro",
        tags: ["ESP32-S3", "OLED", "C++", tr("Processamento de Áudio", "Audio Processing")],
      },
      {
        id: 4,
        name: tr("Deauther Didático (2.4 e 5GHz)", "Educational Deauther (2.4 and 5GHz)"),
        description: tr(
          "Desautenticação de redes em ambiente controlado.",
          "Network deauthentication in a controlled environment.",
        ),
        image: "projeto_deauther.webp",
        youtubeId: "kmqZ7n9kF94",
        longDescription: tr(
          'Dispositivo didático baseado no BW-16 com tela OLED de 0,96", usado para estudar o funcionamento de redes Wi-Fi e entender, em ambiente controlado, como pacotes de desautenticação afetam a conexão. O projeto inclui case em impressão 3D e uma placa de circuito impresso feita manualmente, tornando o dispositivo compacto e ideal para aprendizado prático.',
          'An educational device based on the BW-16 with a 0.96" OLED screen, used to study how Wi-Fi networks work and to understand, in a controlled environment, how deauthentication packets affect a connection. The project includes a 3D-printed case and a hand-made printed circuit board, which make the device compact and ideal for hands-on learning.',
        ),
        technicalLink: "https://github.com/Artur-Brasileiro/Deauther-5GHz",
        tags: [
          "BW-16",
          tr("Redes Wi-Fi", "Wi-Fi Networks"),
          tr("PCB Customizada", "Custom PCB"),
          tr("Impressão 3D", "3D Printing"),
        ],
      },
      {
        id: 13,
        name: tr("Monitor de Luminosidade com Feedback Visual", "Light Level Monitor with Visual Feedback"),
        description: tr(
          "Sistema de leitura analógica com acionamento inteligente de atuadores.",
          "Analog sensing system with smart actuator control.",
        ),
        image: "projeto_sensorluz.webp",
        youtubeId: "rBSG0NzcMFI",
        longDescription: tr(
          "Um projeto prático de sistemas embarcados focado em eletrônica analógica e conversão ADC. Utiliza um sensor LDR em configuração de divisor de tensão para monitorar a luz ambiente. O microcontrolador processa os sinais em tempo real e categoriza a luminosidade, acionando um semáforo de LEDs com base em limiares (thresholds) pré-definidos no código.",
          "A hands-on embedded systems project focused on analog electronics and ADC conversion. It uses an LDR sensor in a voltage divider configuration to monitor ambient light. The microcontroller processes the signals in real time and classifies the light level, driving an LED traffic light based on thresholds predefined in the code.",
        ),
        technicalLink: "https://github.com/Artur-Brasileiro/Sensor-Luz",
        tags: ["Arduino", tr("Eletrônica Analógica", "Analog Electronics"), tr("Sensores LDR", "LDR Sensors"), "C++"],
      },
      {
        id: 14,
        name: "Polpad",
        description: tr(
          "Macropad open source com display integrado e app para Windows e Linux que detecta o programa ativo.",
          "Open-source macropad with a built-in display and a Windows and Linux app that detects the active program.",
        ),
        image: "capa_macropad.jpg",
        internalLink: "/projeto/macropad",
        longDescription: tr(
          "Um teclado auxiliar feito do zero, unindo circuito impresso, eletrônica embarcada e software. O app desktop em Python detecta a janela ativa e troca as funções das teclas; placa, case, firmware e app são abertos para qualquer um montar e contribuir.",
          "An auxiliary keyboard built from scratch, combining a printed circuit board, embedded electronics and software. The Python desktop app detects the active window and switches the key functions; the board, case, firmware and app are open for anyone to build and contribute to.",
        ),
        technicalLink: "https://github.com/gabriel-re-pires/polpad",
        tags: ["C++", "EasyEDA", "PCB", "Python"],
      },
      {
        id: 16,
        name: "CNC Plotter",
        description: tr(
          "Plotter de mesa com área de 810 × 390 mm, com simulação 3D e um guia completo para montar a sua.",
          "Tabletop plotter with an 810 × 390 mm drawing area, a 3D simulation and a complete guide to build your own.",
        ),
        image: "projetos/cnc/poster-800.webp",
        internalLink: "/projeto/cnc-plotter",
        longDescription: tr(
          "Uma plotter grande, montada sobre uma mesa de pinus: dois motores NEMA 17 e correias GT2 levam uma caneta por uma área de 810 × 390 mm, e um servo MG90S a levanta entre um traço e outro. A página do projeto tem a máquina inteira em 3D, desenhando em tempo real, e um guia de montagem com o material, as ligações, o GRBL e o caminho da imagem ao G-code.",
          "A large plotter built on a pine table: two NEMA 17 motors and GT2 belts move a pen across an 810 × 390 mm area, and an MG90S servo lifts it between strokes. The project page has the whole machine in 3D, drawing in real time, and a build guide with the materials, the wiring, GRBL and the path from image to G-code.",
        ),
        tags: ["NEMA 17", "GT2", "GRBL", "FreeCAD", "G-code"],
      },
      {
        id: 17,
        name: tr("Pêndulo Invertido", "Inverted Pendulum"),
        description: tr(
          "Haste de meio metro que sobe e se equilibra sozinha sobre um carrinho, com simulador 3D em que você mesmo empurra.",
          "A half-meter rod that swings up and balances itself on a cart, with a 3D simulator where you push it yourself.",
        ),
        image: "projetos/pendulo/poster-800.webp",
        internalLink: "/projeto/pendulo-invertido",
        longDescription: tr(
          "Uma haste de inox de 500 mm, em pé sobre um carrinho num trilho MGN15H levado por um NEMA 17. Ao ligar, o carro balança a haste até ela subir e depois a segura em pé com um controle LQR a 200 Hz num Arduino UNO, lendo um encoder de 4000 contagens por volta. A página do projeto roda o mesmo firmware sobre a física medida da haste (dá para empurrar, desligar o controle e ver em câmera lenta) e traz o guia completo para montar o seu, com firmware, peças e ligações.",
          "A 500 mm stainless steel rod standing upright on a cart, on an MGN15H rail driven by a NEMA 17. At power-on, the cart swings the rod until it comes up, then holds it upright with an LQR controller at 200 Hz on an Arduino UNO, reading a 4,000-count-per-revolution encoder. The project page runs the same firmware on the rod's measured physics (you can push it, turn off the controller and watch in slow motion) and includes the complete guide to build your own, with firmware, parts and wiring.",
        ),
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
    title: tr("Programação", "Software"),
    summary: tr("Web, inteligência artificial e ciência de dados", "Web, artificial intelligence and data science"),
    count: softwareCount,
  },
  {
    to: "/hardware",
    icon: Cpu,
    title: tr("Hardware e embarcados", "Hardware and embedded"),
    summary: tr("Eletrônica, firmware e prototipagem em PCB", "Electronics, firmware and PCB prototyping"),
    count: hardwareCount,
  },
];
