/**
 * Medidas da montagem, em mm, nos eixos do CAD (pendulo.py):
 *   x ao longo do trilho (0 = ponta do lado do motor), y para trás, z para cima.
 *
 * Lógica pura, sem three: a correia é calculada aqui e testada no Node.
 */
import { CENTRO_MM } from "./physics.ts";

/** centro do bloco no CAD: é onde o carro foi modelado */
export const XC0 = 250;
/** eixo do encoder (e do pêndulo): 40,5 mm à frente do eixo do trilho, 44 mm acima da base */
export const PIVOT = { y: -40.5, z: 44 } as const;
/** centro do carro encostado no batente do motor (batente em x = 10, Ø10; carro de 60 mm) */
export const XC_BATENTE = 45;

/** deslocamento do carro (mm, ao longo do trilho) para a posição do firmware x (m, 0 = centro) */
export const cartOffset = (x: number) => XC_BATENTE + x * 1000 + CENTRO_MM - XC0;

/* ---------- correia: polia do motor e rolo do esticador ---------- */
/** eixos medidos na malha do CAD; raio é o da face de dentro da correia */
export const MOTOR_PULLEY = { x: -30.24, z: 31.93, r: 8.45 } as const;
export const IDLER = { x: 530.5, z: 34.38, r: 10.6 } as const;
/** raio primitivo da GT2 de 30 dentes: 60 mm de correia por volta */
export const PULLEY_PITCH_R = 60 / (2 * Math.PI);
export const BELT = { t: 1.4, y0: 29, y1: 35 } as const;

export type P2 = [number, number];

/**
 * A linha média da correia, fechada, no plano xz: ramo de baixo indo para +x
 * (é o que vai preso no carro), volta no rolo, ramo de cima, volta na polia.
 * `s` é o comprimento acumulado, para a textura dos dentes andar com o carro.
 */
export function beltLoop(step = 6): { pts: P2[]; s: number[]; length: number } {
  const R1 = MOTOR_PULLEY.r + BELT.t / 2;
  const R2 = IDLER.r + BELT.t / 2;
  const dx = IDLER.x - MOTOR_PULLEY.x,
    dz = IDLER.z - MOTOR_PULLEY.z;
  const L = Math.hypot(dx, dz);
  const a = Math.atan2(dz, dx);
  const b = Math.acos((R1 - R2) / L);
  const nb = a - b; // normal das tangentes de baixo
  const nt = a + b; // e de cima
  const pts: P2[] = [];
  const arc = (cx: number, cz: number, r: number, a0: number, a1: number) => {
    const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * 180) / Math.PI / step));
    for (let i = 0; i < n; i++) {
      const t = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + r * Math.cos(t), cz + r * Math.sin(t)]);
    }
  };
  const line = (p: P2, q: P2) => {
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 40));
    for (let i = 0; i < n; i++) pts.push([p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n]);
  };
  const on = (c: { x: number; z: number }, r: number, ang: number): P2 => [c.x + r * Math.cos(ang), c.z + r * Math.sin(ang)];
  line(on(MOTOR_PULLEY, R1, nb), on(IDLER, R2, nb));
  arc(IDLER.x, IDLER.z, R2, nb, nt);
  line(on(IDLER, R2, nt), on(MOTOR_PULLEY, R1, nt));
  arc(MOTOR_PULLEY.x, MOTOR_PULLEY.z, R1, nt, nb + 2 * Math.PI);
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const n = pts.length;
  const length = s[n - 1] + Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]);
  return { pts, s, length };
}

/**
 * A fita fechada da correia: face de fora, de dentro e as duas laterais.
 * u da textura = s / 2 (passo da GT2 é 2 mm, um dente por repetição).
 */
export function beltRibbon() {
  const { pts, s, length } = beltLoop();
  const n = pts.length;
  const nor = pts.map((_, i) => {
    const p = pts[(i - 1 + n) % n],
      q = pts[(i + 1) % n];
    const tx = q[0] - p[0],
      tz = q[1] - p[1];
    const L = Math.hypot(tx, tz) || 1;
    return [tz / L, -tx / L]; // volta anti-horária: para fora é a tangente girada −90°
  });
  const t = BELT.t / 2;
  const O = pts.map((p, i) => [p[0] + nor[i][0] * t, p[1] + nor[i][1] * t]);
  const I = pts.map((p, i) => [p[0] - nor[i][0] * t, p[1] - nor[i][1] * t]);
  // fecha a volta duplicando o primeiro ponto no fim (a textura precisa de u contínuo)
  const ring = (A: number[][]) => [...A, A[0]];
  const u = [...s, length].map((v) => v / 2);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const strip = (A: number[][], ya: number, B: number[][], yb: number, uu: number[], va: number, vb: number) => {
    const base = pos.length / 3;
    for (let i = 0; i < A.length; i++) {
      pos.push(A[i][0], ya, A[i][1], B[i][0], yb, B[i][1]);
      uv.push(uu[i], va, uu[i], vb);
    }
    for (let i = 0; i < A.length - 1; i++) {
      const a = base + 2 * i,
        b = a + 2;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  };
  const Or = ring(O),
    Ir = ring(I);
  const zero = u.map(() => 0);
  strip(Or, BELT.y0, Or, BELT.y1, u, 0, 1);
  strip(Ir, BELT.y1, Ir, BELT.y0, u, 0, 1);
  strip(Or, BELT.y1, Ir, BELT.y1, zero, 0.5, 0.5);
  strip(Ir, BELT.y0, Or, BELT.y0, zero, 0.5, 0.5);
  return { position: new Float32Array(pos), uv: new Float32Array(uv), index: idx, length };
}
