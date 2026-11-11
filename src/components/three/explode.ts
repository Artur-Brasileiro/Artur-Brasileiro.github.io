/**
 * Lógica pura da vista explodida — tipos, easing, etapas e enquadramento.
 *
 * Fica fora dos componentes de propósito: não importa three, então a parte
 * leve do visualizador (trilha, HUD) usa isto sem puxar o chunk do 3D, e os
 * testes rodam direto no Node.
 */

export type PartGroup = {
  id: string;
  ref: string;
  name: string;
  spec?: string;
  /** vetor em mm, eixos do Blender (Z para cima) */
  explode: [number, number, number];
  /** faixa do scroll em que o grupo se separa, de 0 a 1 */
  stage: [number, number];
  /**
   * Só para grupo que fica parado: faixa do scroll em que ele passa a ficar à
   * vista, porque o que o cobria saiu (a placa aparece quando a moldura sobe).
   * É o que acende a linha dele na lista de materiais. Sem ela, fica sempre aceso.
   */
  reveal?: [number, number];
};

export type PartsConfig = {
  /** arquivo do modelo, relativo à pasta do parts.json */
  model: string;
  groups: PartGroup[];
  stages: [number, string][];
  /** dist: multiplicador do raio do modelo, do montado ao explodido */
  camera?: { dist: [number, number]; lift?: number };
};

export type ExplodedState = {
  /** progresso suavizado da explosão, 0 a 1 */
  q: number;
  /** null enquanto carrega ou se o parts.json não veio */
  cfg: PartsConfig | null;
  /** texto da etapa atual, de `stages` */
  stage: string;
  stageIndex: number;
  /**
   * Folhas que tocam como vídeo (CNC, pêndulo): o relógio delas. Aí `q` é só o
   * layout (título saindo), e a lista e o progresso seguem `play.u`. Os
   * `reveal` e `stages` do `cfg` ficam na escala de `play.u`.
   */
  play?: import("@/components/home/playback").Playback;
};

/** Deslocamento do modelo na tela, em fração da largura e da altura. */
export type Shift = [number, number] | ((q: number) => [number, number]);

export type DragState = { az: number; el: number; active: boolean; touched: boolean; baseEl: number };

type Vec3 = [number, number, number];

/** ~80°. Passando de 90° a órbita cruza o polo e o modelo vira de cabeça para baixo. */
export const EL_LIMIT = 1.4;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 0 a 1 dentro da janela [a, b] — para fades amarrados ao progresso. */
export const ramp = (q: number, a: number, b: number) => clamp01((q - a) / (b - a));

/** Quanto um grupo já se separou, de 0 a 1, com easing. Faixa vazia não move. */
export const seg = (p: number, [a, b]: [number, number]) => (b <= a ? 0 : easeInOut(clamp01((p - a) / (b - a))));

/**
 * Um grupo "acende" na lista quando aparece: o que se move, depois de sair um
 * pouco da sua faixa; o que fica parado, quando o `reveal` dele avança (sem
 * `reveal`, está sempre aceso).
 */
export const isGroupOut = (g: PartGroup, q: number) => {
  const range = g.stage[1] > g.stage[0] ? g.stage : g.reveal;
  return range ? seg(q, range) > 0.12 : true;
};

/** Etapa vigente: a última cujo limiar o progresso já passou. */
export function stageAt(cfg: PartsConfig | null, q: number): { stage: string; stageIndex: number } {
  if (!cfg) return { stage: "", stageIndex: 0 };
  let stageIndex = 0;
  cfg.stages.forEach(([at], k) => {
    if (q >= at) stageIndex = k;
  });
  return { stage: cfg.stages[stageIndex]?.[1] ?? "", stageIndex };
}

/**
 * Enquadramento a partir do deslocamento atual de cada peça.
 *
 * `span` é a diagonal da caixa que as peças ocupam (a origem conta, porque a
 * peça que fica parada está nela); `spread` é essa diagonal relativa à da
 * explosão completa; `center` é o meio da caixa. Nos três eixos: um modelo que
 * abre para os lados precisa de enquadramento tanto quanto um que abre para cima.
 */
export function explosionFrame(
  offsets: Vec3[],
  fullSpan: number,
): { span: number; spread: number; center: Vec3; size: Vec3 } {
  const lo: Vec3 = [0, 0, 0];
  const hi: Vec3 = [0, 0, 0];
  for (const o of offsets) {
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], o[i]);
      hi[i] = Math.max(hi[i], o[i]);
    }
  }
  const size: Vec3 = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  const span = Math.hypot(...size);
  return {
    span,
    spread: fullSpan > 0 ? span / fullSpan : 0,
    center: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2],
    size,
  };
}

/** Retângulo da área fixa onde o modelo deve caber, em frações (origem no canto superior esquerdo). */
export type FitBox = { x: number; y: number; w: number; h: number };

/**
 * Distância da câmera para um modelo de meia-largura `halfW` e meia-altura
 * `halfH` (unidades do mundo) caber inteiro na caixa — a que for mais exigente,
 * largura ou altura. No celular em pé quem manda costuma ser a largura: o
 * enquadramento só pela altura era o que cortava o modelo nas laterais.
 */
export function fitDistance(halfW: number, halfH: number, box: FitBox, aspect: number, tanHalfFov: number, margin = 1.08) {
  const byHeight = (halfH * margin) / (tanHalfFov * box.h);
  const byWidth = (halfW * margin) / (tanHalfFov * aspect * box.w);
  return Math.max(byHeight, byWidth);
}

/** Deslocamento do centro de projeção que põe o modelo no meio da caixa. */
export const boxShift = (b: FitBox): [number, number] => [b.x + b.w / 2 - 0.5, b.y + b.h / 2 - 0.5];
