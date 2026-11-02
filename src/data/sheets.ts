/**
 * Projetos com vista explodida em 3D — as "folhas" do desenho na home.
 *
 * Projeto novo: copie o .glb e o parts.json para /public/projetos/<slug>/ e
 * preencha `config`. Sem `config`, a folha aparece reservada ("em breve") no
 * seletor do carimbo, sem carregar nada.
 */
export type Sheet = {
  /** número da folha no carimbo */
  n: string;
  /** nome curto, no botão do seletor */
  name: string;
  /** nome completo, no carimbo e na legenda da figura */
  full: string;
  /** caminho do parts.json; o modelo fica na mesma pasta */
  config?: string;
  /** estudo de caso do projeto, se houver */
  caseUrl?: string;
};

export const sheets: Sheet[] = [
  {
    n: "01",
    name: "Macropad",
    full: "Macropad ESP32-C3",
    config: "/projetos/macropad/parts.json",
    caseUrl: "/projeto/macropad",
  },
  { n: "02", name: "CNC Plotter", full: "CNC Plotter" },
];
