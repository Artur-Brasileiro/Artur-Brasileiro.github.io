/**
 * A CNC plotter sem three.js: medidas, cinemática da caneta, correias e o
 * programa de G-code. Tudo em milímetro, nos eixos do FreeCAD (Z para cima).
 *
 * Fica fora da cena de propósito: a interface (terminal, contadores, estimativa
 * de tempo) usa isto sem baixar o chunk do 3D, o script que gera o GLB monta
 * as correias com as mesmas funções, e os testes rodam direto no Node.
 *
 * Os números vêm do artifact "CNC Plotter do Artur", que foi montado em cima
 * do modelo do FreeCAD. Mexer aqui é mexer na máquina: confira contra o CAD.
 */

/* ---------- geometria da máquina ---------- */

/** curso útil, em mm */
export const X_MAX = 818;
export const Y_MAX = 402;
/** ponta da caneta no mundo com X = 0 e Y = 0 */
export const PEN_HOME = { x: -122.8, y: -244.0 };
/** base do pen holder (local) com a caneta no papel */
export const H_DOWN = 6.0;
/** raio primitivo da polia GT2 de 20 dentes */
export const R_P = 6.366;
/** 1/16 de micropasso */
export const STEPS_MM = 80;
/** eixo do servo (mundo, na origem) */
export const SHAFT = { x: 1015.1 - 1132.0, z: 30.75 + 65.3 };
/** o pino do pen holder fica 12 mm à esquerda do eixo do servo */
const PIN_DX = 12.0;
export const TH_UP = (8 * Math.PI) / 180;
export const TH_DOWN = (-35 * Math.PI) / 180;
export const PAPER = { x0: -533.8, x1: -113.8, y0: -1083, y1: -223, z: 1.55 };
export const TABLE = { x0: -690, x1: 130, y0: -1135, y1: -18, z0: -16.6, z1: 1.4 };

/** velocidades da simulação, em mm/s (a 1×) */
export const V_RAPID = 250;
export const V_DRAW = 100;
export const V_JOG = 300;
/** velocidade angular do servo, rad/s (~370°/s) */
export const SERVO_W = 6.5;
/** avanço gravado nos G1 */
export const FEED = 6000;

/* ---------- cinemática ---------- */

/** altura da base do pen holder para um ângulo do braço do servo */
const hFromArm = (th: number) => 30.75 + PIN_DX * Math.tan(th) + 2.4 / Math.cos(th) - 22.5;
/** a caneta desce pelo próprio peso até tocar o papel; o braço só a ergue */
export const penHeight = (th: number) => Math.max(H_DOWN, hFromArm(th));
export const penIsDown = (th: number) => penHeight(th) <= H_DOWN + 0.05;
/** ponta da caneta no mundo para uma posição da máquina */
export const penWorld = (x: number, y: number) => ({ x: PEN_HOME.x - y, y: PEN_HOME.y - x });

/* ---------- correias ---------- */

type P2 = [number, number];

function arc(cx: number, cy: number, r: number, a0: number, a1: number, dir: number): P2[] {
  let d = a1 - a0;
  if (dir > 0) while (d < 0) d += 2 * Math.PI;
  else while (d > 0) d -= 2 * Math.PI;
  const k = Math.max(2, Math.ceil(Math.abs(d) / (Math.PI / 36)));
  const out: P2[] = [];
  for (let i = 0; i <= k; i++) {
    const a = a0 + (d * i) / k;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** tangente entre "círculos com sentido": s = +1 anti-horário (círculo à esquerda da correia), -1 horário */
function tangent(c1: P2, r1: number, s1: number, c2: P2, r2: number, s2: number): [P2, P2] {
  const Dx = c2[0] - c1[0],
    Dy = c2[1] - c1[1],
    L = Math.hypot(Dx, Dy),
    k = s2 * r2 - s1 * r1;
  const psi = Math.atan2(Dy, Dx) - Math.asin(Math.max(-1, Math.min(1, k / L)));
  const lx = -Math.sin(psi),
    ly = Math.cos(psi);
  return [
    [c1[0] - s1 * r1 * lx, c1[1] - s1 * r1 * ly],
    [c2[0] - s2 * r2 * lx, c2[1] - s2 * r2 * ly],
  ];
}

/** presilhas do carro, onde as pontas da correia do eixo Y dão a volta e travam */
const PRES = { a: 1003.2 - 1132.0, b: 1016.2 - 1132.0, y: 35.2 - 200.8, mouth: 12.86, rb: 4.95, h: 0.8 };

/**
 * Correia do eixo Y (curto): aberta, presa no carro pelas duas pontas, passando
 * pela polia louca do Apoio Secundário e pela polia do motor. `ox` é o
 * deslocamento do carro (= -Y da máquina). Coordenadas locais da ponte.
 */
export function beltYAxisPath(ox: number): P2[] {
  const yt = -173.1 + R_P,
    mot: P2 = [-27.8, -173.1],
    idl: P2 = [-557.3, -173.1];
  const cA = PRES.a + ox,
    cB = PRES.b + ox,
    yc = PRES.y,
    h = PRES.h,
    r = PRES.rb,
    a = Math.asin(h / r);
  const pts: P2[] = [];
  // ponta A (boca virada para a polia louca): rabo dentro do rasgo, volta no pino, sai pela boca
  pts.push([cA - 10.5, yc + h], [cA - r * Math.cos(a), yc + h]);
  pts.push(...arc(cA, yc, r, Math.PI - a, -Math.PI + a, -1).slice(1, -1));
  pts.push([cA - r * Math.cos(a), yc - h], [cA - PRES.mouth, yc - h], [cA - PRES.mouth - 4, yt]);
  pts.push(...arc(idl[0], idl[1], R_P, Math.PI / 2, (3 * Math.PI) / 2, 1));
  pts.push(...arc(mot[0], mot[1], R_P, -Math.PI / 2, Math.PI / 2, 1));
  // ponta B (boca virada para o motor)
  pts.push([cB + PRES.mouth + 4, yt], [cB + PRES.mouth, yc - h], [cB + r * Math.cos(a), yc - h]);
  pts.push(...arc(cB, yc, r, -a, a, -1).slice(1, -1));
  pts.push([cB + r * Math.cos(a), yc + h], [cB + 10.5, yc + h]);
  return pts;
}
export const BELT_Y_AXIS_Z: [number, number] = [86.3, 92.3];

/**
 * Correia do eixo X (longo): presa nos dois suportes, contornando duas polias
 * loucas e a polia do motor em ômega — o motor "escala" a correia. `g` é o
 * deslocamento da ponte (= -X da máquina). Coordenadas do mundo.
 */
export function beltXAxisPath(g: number): P2[] {
  const XL = -36.3 - R_P;
  const A: P2 = [XL, -122.0],
    Z: P2 = [XL, -1042.0];
  const seq: { c: P2; r: number; s: number }[] = [
    { c: A, r: 0, s: 1 },
    { c: [-36.3, -130.0 + g], r: R_P, s: 1 },
    { c: [28.2, -173.1 + g], r: R_P, s: -1 },
    { c: [-36.3, -216.1 + g], r: R_P, s: 1 },
    { c: Z, r: 0, s: 1 },
  ];
  const tans: [P2, P2][] = [];
  for (let i = 0; i < seq.length - 1; i++) tans.push(tangent(seq[i].c, seq[i].r, seq[i].s, seq[i + 1].c, seq[i + 1].r, seq[i + 1].s));
  const pts: P2[] = [A];
  for (let i = 1; i < seq.length - 1; i++) {
    const inP = tans[i - 1][1],
      outP = tans[i][0],
      c = seq[i];
    pts.push(...arc(c.c[0], c.c[1], c.r, Math.atan2(inP[1] - c.c[1], inP[0] - c.c[0]), Math.atan2(outP[1] - c.c[1], outP[0] - c.c[0]), c.s));
  }
  pts.push(Z);
  return pts;
}
export const BELT_X_AXIS_Z: [number, number] = [54.5, 60.5];
export const BELT_THICKNESS = 1.4;

export type Ribbon = { position: Float32Array; uv: Float32Array; index: number[] };

/**
 * Fita de espessura `t` ao longo de uma polilinha, de z0 a z1: as duas faces
 * (com os dentes na textura, via uv) e as bordas de cima e de baixo.
 */
export function ribbon(pts: P2[], closed: boolean, z0: number, z1: number, t: number): Ribbon {
  const n = pts.length,
    s = [0];
  for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const nor = pts.map((_, i) => {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)],
      b = pts[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    return [dy / L, -dx / L];
  });
  const position = new Float32Array(n * 2 * 3 * 4);
  const uv = new Float32Array(n * 2 * 2 * 4);
  const index: number[] = [];
  let v = 0;
  const strip = (A: number[][], B: number[][], u: number[], vA: number, vB: number) => {
    const base = v;
    for (let i = 0; i < n; i++) {
      position.set(A[i], v * 3);
      uv.set([u[i], vA], v * 2);
      v++;
      position.set(B[i], v * 3);
      uv.set([u[i], vB], v * 2);
      v++;
    }
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const a = base + 2 * i,
        b = base + 2 * ((i + 1) % n);
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  };
  const O = pts.map((p, i) => [p[0] + (nor[i][0] * t) / 2, p[1] + (nor[i][1] * t) / 2]);
  const I = pts.map((p, i) => [p[0] - (nor[i][0] * t) / 2, p[1] - (nor[i][1] * t) / 2]);
  const u = s.map((x) => x / 2);
  const zero = u.map(() => 0);
  strip(O.map((p) => [p[0], p[1], z0]), O.map((p) => [p[0], p[1], z1]), u, 0, 1);
  strip(I.map((p) => [p[0], p[1], z1]), I.map((p) => [p[0], p[1], z0]), u, 0, 1);
  strip(O.map((p) => [p[0], p[1], z1]), I.map((p) => [p[0], p[1], z1]), zero, 0.5, 0.5);
  strip(I.map((p) => [p[0], p[1], z0]), O.map((p) => [p[0], p[1], z0]), zero, 0.5, 0.5);
  return { position, uv, index };
}

/* ---------- programa ---------- */

export type Cmd =
  | { t: "note"; g: string }
  | { t: "pen"; down: boolean; g: string }
  | { t: "mv"; x: number; y: number; rapid: boolean; g: string };

export type Polyline = [number, number][];

const fmt = (v: number) => v.toFixed(2);

/** Polilinhas (coordenadas da máquina, mm) viram G-code: sobe, vai, desce, traça, sobe. */
export function programFromPolylines(polys: Polyline[], header: string[]): Cmd[] {
  const P: Cmd[] = [];
  const up = () => P.push({ t: "pen", down: false, g: "M5        ; caneta ↑" });
  const down = () => P.push({ t: "pen", down: true, g: "M3 S90    ; caneta ↓" });
  for (const h of header) P.push({ t: "note", g: h });
  P.push({ t: "note", g: "G21 G90   ; mm, absoluto" });
  up();
  for (const pts of polys) {
    if (pts.length < 2) continue;
    P.push({ t: "mv", x: pts[0][0], y: pts[0][1], rapid: true, g: `G0 X${fmt(pts[0][0])} Y${fmt(pts[0][1])}` });
    down();
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      P.push({ t: "mv", x, y, rapid: false, g: `G1 X${fmt(x)} Y${fmt(y)} F${FEED}` });
    }
    up();
  }
  P.push({ t: "mv", x: 0, y: 0, rapid: true, g: "G0 X0.00 Y0.00" });
  P.push({ t: "note", g: "M2        ; fim" });
  return P;
}

const curve = (f: (t: number) => [number, number], t0: number, t1: number, n: number): Polyline => {
  const a: Polyline = [];
  for (let i = 0; i <= n; i++) a.push(f(t0 + ((t1 - t0) * i) / n));
  return a;
};

/** o desenho de demonstração do artifact: moldura dupla, espirógrafo, lissajous e rosa */
export function demoProgram(): Cmd[] {
  return programFromPolylines(
    [
      [[12, 12], [806, 12], [806, 390], [12, 390], [12, 12]],
      [[20, 20], [798, 20], [798, 382], [20, 382], [20, 20]],
      // espirógrafo (hipotrocoide R=5 r=3 d=5) à esquerda
      curve((t) => [213 + 21 * (2 * Math.cos(t) + 5 * Math.cos((2 * t) / 3)), 201 + 21 * (2 * Math.sin(t) - 5 * Math.sin((2 * t) / 3))], 0, 6 * Math.PI, 900),
      // lissajous no centro
      curve((t) => [409 + 38 * Math.sin(3 * t + Math.PI / 2), 201 + 120 * Math.sin(2 * t)], 0, 2 * Math.PI, 360),
      // rosa (k = 5/3) à direita
      curve((t) => {
        const r = 150 * Math.cos((5 * t) / 3);
        return [605 + r * Math.cos(t), 201 + r * Math.sin(t)];
      }, 0, 6 * Math.PI, 1100),
    ],
    ["; demo · moldura + espirógrafo + rosa"],
  );
}

/** Quanto o programa leva a 1×, em segundos, partindo da origem com a caneta erguida. */
export function estimateSeconds(P: Cmd[]): number {
  let x = 0,
    y = 0,
    s = 0;
  const servo = (TH_UP - TH_DOWN) / SERVO_W;
  for (const c of P) {
    if (c.t === "pen") s += servo;
    else if (c.t === "mv") {
      s += Math.hypot(c.x - x, c.y - y) / (c.rapid ? V_RAPID : V_DRAW);
      x = c.x;
      y = c.y;
    }
  }
  return s;
}

/** Quanto de tinta o programa põe no papel, em mm. */
export function inkLength(P: Cmd[]): number {
  let x = 0,
    y = 0,
    down = false,
    s = 0;
  for (const c of P) {
    if (c.t === "pen") down = c.down;
    else if (c.t === "mv") {
      if (down) s += Math.hypot(c.x - x, c.y - y);
      x = c.x;
      y = c.y;
    }
  }
  return s;
}

/** O programa como arquivo .gcode, numerado como no terminal. */
export function gcodeFile(P: Cmd[]): string {
  return P.map((c) => c.g).join("\n") + "\n";
}

/** "1 min 20 s", "45 s" */
export function formatDuration(sec: number): string {
  const s = Math.max(1, Math.round(sec));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60),
    r = s % 60;
  return r ? `${m} min ${r} s` : `${m} min`;
}
