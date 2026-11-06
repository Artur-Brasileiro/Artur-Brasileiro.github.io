/**
 * O desenho da home: um par de engrenagens de dentes evolventes, como numa
 * folha de desenho técnico — a coroa de 24 dentes com cubo, furos de alívio e
 * rasgo de chaveta, o pinhão de 12 engrenado nela e as linhas de centro.
 *
 * Tudo em coordenadas da máquina (mm, X de 0 a 818, Y de 0 a 402). Círculos não
 * têm lado certo, então não há a inversão de X que o texto precisa.
 */
import { X_MAX, Y_MAX, programFromPolylines, type Cmd, type Polyline } from "./machine.ts";

/** módulo e ângulo de pressão: o par padrão de qualquer livro de elementos de máquina */
const M = 13;
const ALPHA = (20 * Math.PI) / 180;
const N1 = 24;
const N2 = 12;

const r1 = (M * N1) / 2;
const r2 = (M * N2) / 2;
/** os centros: as circunferências primitivas se tocam no meio */
const SPAN = r1 + M + (r1 + r2) + r2 + M;
const C1: [number, number] = [(X_MAX - SPAN) / 2 + r1 + M, Y_MAX / 2];
const C2: [number, number] = [C1[0] + r1 + r2, Y_MAX / 2];

const inv = (a: number) => Math.tan(a) - a;

function circle(cx: number, cy: number, r: number, start = 0): Polyline {
  const n = Math.max(24, Math.ceil((2 * Math.PI * r) / 6));
  const out: Polyline = [];
  for (let i = 0; i <= n; i++) {
    const a = start + (i / n) * 2 * Math.PI;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/**
 * Contorno fechado de uma engrenagem de dentes retos: para cada dente, raiz →
 * flanco evolvente → topo → flanco de volta → raiz. `phase` gira a roda (o
 * pinhão entra com meio passo, para dente cair em vão).
 */
function gearOutline(cx: number, cy: number, N: number, phase: number): Polyline {
  const rp = (M * N) / 2;
  const rb = rp * Math.cos(ALPHA);
  const ra = rp + M;
  const rf = rp - 1.25 * M;
  const tMax = Math.sqrt((ra / rb) ** 2 - 1);
  const half = Math.PI / (2 * N) + inv(ALPHA); // meia largura angular do dente na base
  const pitch = (2 * Math.PI) / N;
  const P = (r: number, a: number): [number, number] => [cx + r * Math.cos(a + phase), cy + r * Math.sin(a + phase)];
  const STEPS = 6;
  const out: Polyline = [];
  for (let k = 0; k < N; k++) {
    const c = k * pitch;
    const aA = c - half; // pé do flanco que sobe
    const aB = c + half; // pé do flanco que desce
    // o fundo do vão anterior já chegou até aqui (no primeiro dente, é o ponto de partida)
    out.push(P(rf, aA));
    if (rb > rf) out.push(P(rb, aA));
    for (let i = 1; i <= STEPS; i++) {
      const t = (tMax * i) / STEPS;
      out.push(P(rb * Math.sqrt(1 + t * t), aA + (t - Math.atan(t))));
    }
    // topo: um arco curto entre os dois flancos
    const tipA = aA + (tMax - Math.atan(tMax));
    const tipB = aB - (tMax - Math.atan(tMax));
    for (let i = 1; i < 3; i++) out.push(P(ra, tipA + ((tipB - tipA) * i) / 3));
    for (let i = STEPS; i >= 1; i--) {
      const t = (tMax * i) / STEPS;
      out.push(P(rb * Math.sqrt(1 + t * t), aB - (t - Math.atan(t))));
    }
    if (rb > rf) out.push(P(rb, aB));
    out.push(P(rf, aB));
    // fundo do vão até o próximo dente
    const next = aB + (pitch - 2 * half);
    for (let i = 1; i < 4; i++) out.push(P(rf, aB + ((next - aB) * i) / 4));
  }
  out.push(out[0]);
  return out;
}

/** furo do eixo com rasgo de chaveta para cima (largura b, profundidade t) */
function keyedBore(cx: number, cy: number, r: number, b: number, t: number): Polyline {
  const a0 = Math.asin(b / 2 / r);
  const out: Polyline = [];
  const n = Math.ceil((2 * Math.PI * r) / 5);
  // começa no canto direito do rasgo e dá a volta pelo lado de baixo
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 - a0 - (i / n) * (2 * Math.PI - 2 * a0);
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const yTop = cy + Math.sqrt(r * r - (b / 2) ** 2) + t;
  out.push([cx - b / 2, yTop], [cx + b / 2, yTop], out[0]);
  return out;
}

/** linha tracejada de a até b, traço `dash` e espaço `gap` */
function dashed(a: [number, number], b: [number, number], dash: number, gap: number): Polyline[] {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / L,
    uy = (b[1] - a[1]) / L;
  const out: Polyline[] = [];
  for (let s = 0; s < L; s += dash + gap) {
    const e = Math.min(L, s + dash);
    out.push([
      [a[0] + ux * s, a[1] + uy * s],
      [a[0] + ux * e, a[1] + uy * e],
    ]);
  }
  return out;
}

export type DrawingPart = {
  /** referência curta, na lista da home */
  ref: string;
  name: string;
  spec: string;
  polys: Polyline[];
};

function parts(): DrawingPart[] {
  const holes: Polyline[] = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    holes.push(circle(C1[0] + 92 * Math.cos(a), C1[1] + 92 * Math.sin(a), 25, a + Math.PI));
  }
  const ext = 18;
  return [
    {
      ref: "01",
      name: "Coroa de 24 dentes",
      spec: `módulo ${M} · Ø ${Math.round(2 * (r1 + M))} mm`,
      polys: [gearOutline(C1[0], C1[1], N1, 0)],
    },
    {
      ref: "02",
      name: "Cubo e furos de alívio",
      spec: "6 furos Ø 50 · cubo Ø 92",
      polys: [circle(C1[0], C1[1], 46), ...holes],
    },
    {
      ref: "03",
      name: "Furo com chaveta",
      spec: "Ø 40 · rasgo 12 × 5",
      polys: [keyedBore(C1[0], C1[1], 20, 12, 5)],
    },
    {
      ref: "04",
      name: "Pinhão de 12 dentes",
      spec: `engrenado · Ø ${Math.round(2 * (r2 + M))} mm`,
      polys: [gearOutline(C2[0], C2[1], N2, Math.PI / N2), keyedBore(C2[0], C2[1], 13, 8, 3.5)],
    },
    {
      ref: "05",
      name: "Linhas de centro",
      spec: `entre eixos ${r1 + r2} mm`,
      polys: [
        ...dashed([C1[0] - r1 - M - ext, C1[1]], [C2[0] + r2 + M + ext, C2[1]], 26, 7),
        ...dashed([C1[0], C1[1] - r1 - M - ext], [C1[0], C1[1] + r1 + M + ext], 26, 7),
        ...dashed([C2[0], C2[1] - r2 - M - ext], [C2[0], C2[1] + r2 + M + ext], 26, 7),
      ],
    },
  ];
}

/**
 * O programa e onde cada parte começa nele. programFromPolylines gera, para o
 * cabeçalho, as notas + "G21" + caneta ↑; e para cada polilinha de n pontos,
 * G0 + caneta ↓ + (n − 1) G1 + caneta ↑ = n + 2 comandos.
 */
export function gearDrawing(): { program: Cmd[]; parts: (DrawingPart & { firstCmd: number })[] } {
  const ps = parts();
  const header = [`; par de engrenagens · coroa ${N1} + pinhão ${N2} · módulo ${M}`];
  const program = programFromPolylines(
    ps.flatMap((p) => p.polys),
    header,
  );
  let at = header.length + 2;
  const out = ps.map((p) => {
    const firstCmd = at;
    for (const poly of p.polys) if (poly.length >= 2) at += poly.length + 2;
    return { ...p, firstCmd };
  });
  return { program, parts: out };
}
