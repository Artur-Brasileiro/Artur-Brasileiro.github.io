/**
 * Projetos com vista explodida em 3D — as "folhas" do desenho na home.
 *
 * Dois tipos de folha:
 *  - "explode" (o padrão): vista explodida. Copie o .glb e o parts.json para
 *    /public/projetos/<slug>/ e preencha `config`.
 *  - "draw": a CNC desenhando conforme a rolagem (CncDrawView). Não usa config.
 * Folha sem nada disso fica fora das setas, sem carregar nada.
 */
export type Sheet = {
  /** número da folha no carimbo */
  n: string;
  /** nome curto, no botão do seletor */
  name: string;
  /** nome completo, no carimbo e na legenda da figura */
  full: string;
  /** o que a rolagem faz na folha */
  kind?: "explode" | "draw";
  /** caminho do parts.json; o modelo fica na mesma pasta (só "explode") */
  config?: string;
  /** estudo de caso do projeto, se houver */
  caseUrl?: string;
  /** uma frase sobre o projeto, na faixa logo abaixo da vista explodida */
  summary?: string;
  /** ajuste fino da distância da câmera na vista explodida (menor = mais perto) */
  zoom?: { desktop?: number; mobile?: number };
};

/** a folha tem o que mostrar? */
export const sheetReady = (s: Sheet) => s.kind === "draw" || !!s.config;

export const sheets: Sheet[] = [
  {
    n: "01",
    name: "Macropad",
    full: "Macropad ESP32-C3",
    config: "/projetos/macropad/parts.json",
    caseUrl: "/projeto/macropad",
    summary:
      "Desenhei o esquemático, roteei a placa, soldei os componentes e modelei a case. " +
      "O firmware em C++ e o app em Python são a próxima etapa.",
  },
  {
    n: "02",
    name: "CNC Plotter",
    full: "CNC Plotter",
    kind: "draw",
    caseUrl: "/projeto/cnc-plotter",
    summary:
      "Uma plotter de mesa com área de 818 × 402 mm. Aqui ela desenha um par de engrenagens enquanto você rola; na página do projeto, escreve o que você digitar.",
  },
];
