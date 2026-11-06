/**
 * Texto digitado vira traços de caneta. Usa fontes de traço único (Hershey e
 * EMS, ver scripts/build-hershey.mjs): cada letra é uma linha só, como alguém
 * escrevendo à mão, e não o contorno de uma letra vazada.
 *
 * Sem three, sem DOM: a prévia em SVG, o G-code e os testes usam isto direto.
 */
import { X_MAX, Y_MAX, programFromPolylines, type Cmd, type Polyline } from "./machine.ts";

export type StrokeFont = {
  name: string;
  /** ascendente e descendente, em unidades da fonte (1000 por em, y para cima) */
  asc: number;
  desc: number;
  /** avanço padrão, para glifo sem avanço próprio */
  adv: number;
  credit: string;
  /** glifo: [avanço, "x y x y;x y ..."] — cada trecho entre ";" é um traço */
  g: Record<string, [number, string]>;
};

export const FONT_IDS = ["simples", "cursiva", "moderna"] as const;
export type FontId = (typeof FONT_IDS)[number];
export const FONT_LABEL: Record<FontId, string> = { simples: "Simples", cursiva: "Cursiva", moderna: "Moderna" };
/** crédito curto na interface; o texto completo que as licenças pedem vai junto do JSON de cada fonte */
export const FONT_CREDIT: Record<FontId, string> = {
  simples: "Hershey Sans, do Dr. A. V. Hershey (U.S. National Bureau of Standards), em SVG por Windell H. Oskay",
  cursiva: "Hershey Script, do Dr. A. V. Hershey (U.S. National Bureau of Standards), em SVG por Windell H. Oskay",
  moderna: "EMS Readability, de Sheldon B. Michaels, em SVG por Windell H. Oskay (SIL Open Font License)",
};

/** limite do campo: mais que isso vira letra miúda e minutos de máquina */
export const MAX_CHARS = 48;
/** margem da área útil, em mm */
const MARGIN = 34;
/** a letra maior que isso fica desproporcional no papel (altura do em, mm) */
const MAX_EM = 190;
const LINE = 1.18;

type Glyph = { adv: number; strokes: [number, number][][] };
const cache = new WeakMap<StrokeFont, Map<string, Glyph | null>>();

function glyph(font: StrokeFont, ch: string): Glyph | null {
  let m = cache.get(font);
  if (!m) cache.set(font, (m = new Map()));
  if (m.has(ch)) return m.get(ch)!;
  // letra sem glifo: tenta sem o acento ("ŭ" -> "u"); se nem assim, ignora
  const raw = font.g[ch] ?? font.g[ch.normalize("NFD")[0]];
  let out: Glyph | null = null;
  if (raw) {
    const strokes = raw[1]
      ? raw[1].split(";").map((s) => {
          const n = s.split(" ").map(Number);
          const pts: [number, number][] = [];
          for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
          return pts;
        })
      : [];
    out = { adv: raw[0] || font.adv, strokes };
  }
  m.set(ch, out);
  return out;
}

/** só o que a fonte sabe desenhar, sem espaços sobrando, com o limite do campo */
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
}

const width = (font: StrokeFont, s: string) => [...s].reduce((w, ch) => w + (glyph(font, ch)?.adv ?? 0), 0);

/** quebra em `n` linhas, por palavra, mirando a mesma largura em todas */
function wrap(font: StrokeFont, words: string[], n: number): string[] {
  if (n <= 1) return [words.join(" ")];
  const sp = glyph(font, " ")?.adv ?? font.adv;
  const total = width(font, words.join(" "));
  const target = total / n;
  const lines: string[] = [];
  let cur: string[] = [];
  let w = 0;
  words.forEach((word, i) => {
    const ww = width(font, word);
    const left = words.length - i;
    const linesLeft = n - lines.length;
    // fecha a linha quando passa do alvo — mas nunca deixa linha sem palavra
    if (cur.length && w + sp + ww / 2 > target && linesLeft > 1 && left >= linesLeft - 1) {
      lines.push(cur.join(" "));
      cur = [];
      w = 0;
    }
    w += (cur.length ? sp : 0) + ww;
    cur.push(word);
  });
  if (cur.length) lines.push(cur.join(" "));
  return lines;
}

export type TextLayout = {
  /** traços já no sistema da máquina (mm) */
  polys: Polyline[];
  lines: string[];
  /** altura do em, mm */
  em: number;
};

/**
 * Encaixa o texto na área útil (818 × 402 mm): escolhe o número de linhas que
 * deixa a letra maior, centraliza e converte para coordenadas da máquina.
 *
 * Orientação: a linha corre ao longo do eixo X (o lado comprido do papel) e o
 * texto fica de pé para quem olha da vista geral, a da câmera inicial. Por isso
 * X da máquina diminui conforme a frase avança: X = 818 − u, Y = v.
 */
export function layoutText(font: StrokeFont, text: string): TextLayout {
  const clean = normalizeText(text);
  const words = clean.split(" ").filter(Boolean);
  if (!words.length) return { polys: [], lines: [], em: 0 };
  const W = X_MAX - 2 * MARGIN,
    H = Y_MAX - 2 * MARGIN;
  const em = font.asc - font.desc;
  let best: { lines: string[]; s: number } | null = null;
  for (let n = 1; n <= Math.min(4, words.length); n++) {
    const lines = wrap(font, words, n);
    const maxW = Math.max(...lines.map((l) => width(font, l)));
    const s = Math.min(W / maxW, H / (em * (1 + (lines.length - 1) * LINE)), MAX_EM / em);
    if (!best || s > best.s * 1.04) best = { lines, s };
  }
  const { lines, s } = best!;
  const blockH = em * s * (1 + (lines.length - 1) * LINE);
  // topo do bloco centralizado na altura útil; cada linha desce LINE em
  const top = (Y_MAX + blockH) / 2;
  const polys: Polyline[] = [];
  lines.forEach((line, k) => {
    const baseV = top - font.asc * s - k * em * s * LINE;
    let u = (X_MAX - width(font, line) * s) / 2;
    for (const ch of line) {
      const g = glyph(font, ch);
      if (!g) continue;
      for (const st of g.strokes) {
        polys.push(st.map(([gx, gy]) => [clampX(X_MAX - (u + gx * s)), clampY(baseV + gy * s)]));
      }
      u += g.adv * s;
    }
  });
  return { polys: orderStrokes(polys), lines, em: em * s };
}

const clampX = (v: number) => Math.min(X_MAX, Math.max(0, +v.toFixed(2)));
const clampY = (v: number) => Math.min(Y_MAX, Math.max(0, +v.toFixed(2)));

/**
 * Ordem de traçado: a do texto, mas cada traço pode ser feito ao contrário se a
 * ponta de lá estiver mais perto de onde a caneta parou. Corta parte do
 * vaivém da caneta erguida sem embaralhar a escrita.
 */
function orderStrokes(polys: Polyline[]): Polyline[] {
  let at: [number, number] = [X_MAX, Y_MAX / 2];
  return polys.map((p) => {
    const a = p[0],
      b = p[p.length - 1];
    const da = Math.hypot(a[0] - at[0], a[1] - at[1]),
      db = Math.hypot(b[0] - at[0], b[1] - at[1]);
    const q = db < da * 0.6 ? [...p].reverse() : p;
    at = q[q.length - 1];
    return q;
  });
}

export function textProgram(font: StrokeFont, text: string): { program: Cmd[]; layout: TextLayout } {
  const layout = layoutText(font, text);
  const program = programFromPolylines(layout.polys, [`; texto: "${normalizeText(text)}" · fonte ${font.name}`]);
  return { program, layout };
}
