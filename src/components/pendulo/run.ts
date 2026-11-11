/**
 * A corrida da home: o pêndulo ligado do batente, simulado uma vez e gravado,
 * para a rolagem da página andar para a frente e para trás nela.
 *
 * O roteiro é o do aparelho real: confere o motor, sobe balançando, pega no
 * topo, equilibra; aí leva um tapa, cai e sobe de novo sozinho. Tudo sai da
 * mesma física e do mesmo firmware do simulador — nada é animado à mão.
 *
 * Lógica pura, sem three: roda no Node (npm test).
 */
import { PendulumSim } from "./physics.ts";

export type RunMark = { t: number; label: string; name: string; spec: string };

export type Run = {
  /** amostras a 120 Hz */
  t: Float32Array;
  x: Float32Array;
  th: Float32Array;
  /** 0 conferindo · 1 subindo · 2 equilibrando */
  mode: Uint8Array;
  duration: number;
  /** momentos da história, em ordem: viram a lista e as etapas da folha */
  marks: RunMark[];
};

const HZ = 120;
/** quanto tempo mostrar equilibrando antes do tapa e no fim */
const HOLD = 2.4;
/** o tapa: forte o bastante para derrubar (rad/s na haste, topo para o lado do esticador) */
const TAPA = 1.6;

export function recordRun(): Run {
  const sim = new PendulumSim();
  const T: number[] = [],
    X: number[] = [],
    TH: number[] = [],
    M: number[] = [];
  const ev: { kind: string; t: number }[] = [];
  let tSubida = -1,
    tPegou1 = -1,
    tTapa = -1,
    tCaiu = -1,
    tPegou2 = -1;
  const dt = 1 / HZ;
  for (let i = 0; i < HZ * 40; i++) {
    const s = sim.s;
    T.push(s.t);
    X.push(s.x);
    TH.push(sim.theta);
    M.push(s.mode === "equilibrio" ? 2 : s.mode === "subindo" ? 1 : 0);
    if (tTapa < 0 && tPegou1 > 0 && s.t >= tPegou1 + HOLD) {
      tTapa = s.t;
      sim.kick(TAPA);
    }
    if (tPegou2 > 0 && s.t >= tPegou2 + HOLD) break;
    sim.advance(dt);
    if (tSubida < 0 && sim.s.mode === "subindo") tSubida = sim.s.t;
    for (const e of sim.drainEvents()) {
      ev.push({ kind: e, t: sim.s.t });
      if (e === "pegou" && tPegou1 < 0) tPegou1 = sim.s.t;
      else if (e === "caiu" && tCaiu < 0 && tTapa > 0) tCaiu = sim.s.t;
      else if (e === "pegou" && tCaiu > 0 && tPegou2 < 0) tPegou2 = sim.s.t;
    }
  }
  if (tPegou2 < 0) throw new Error("a corrida da home não reergueu: confira a física");
  const f1 = (v: number) => v.toFixed(1).replace(".", ",");
  const marks: RunMark[] = [
    { t: 0, label: "Ligado no batente do motor", name: "Conferência do 12 V", spec: "empurrãozinho de 6 mm para o centro" },
    { t: tSubida, label: "Subindo: empurra o balanço", name: "Subida por energia", spec: "inverte quando a haste passa por baixo" },
    { t: tPegou1, label: `Pegou no topo · ${f1(tPegou1 - tSubida)} s de subida`, name: "Pegou no topo", spec: `${f1(tPegou1 - tSubida)} s depois de sair do batente` },
    { t: tPegou1 + 0.15, label: "Equilibrando a 200 Hz", name: "Equilíbrio (LQR)", spec: "o carro corre para baixo da haste" },
    { t: tTapa, label: "Um tapa na haste", name: "Tapa", spec: "1,6 rad/s, de propósito" },
    { t: tCaiu, label: "Caiu · volta a subir no mesmo ciclo", name: "Queda", spec: "passou de 30°" },
    { t: tPegou2, label: `Reergueu em ${f1(tPegou2 - tTapa)} s`, name: "Reergueu sozinho", spec: `${f1(tPegou2 - tTapa)} s depois do tapa` },
  ];
  return {
    t: Float32Array.from(T),
    x: Float32Array.from(X),
    th: Float32Array.from(TH),
    mode: Uint8Array.from(M),
    duration: T[T.length - 1],
    marks,
  };
}

/** posição na corrida no instante t (s), interpolada; o ângulo pelo caminho curto */
export function sampleRun(r: Run, t: number): { x: number; th: number; mode: number; i: number } {
  const n = r.t.length;
  const u = Math.max(0, Math.min(n - 1.0001, t * HZ));
  const i = Math.floor(u),
    f = u - i;
  let d = r.th[i + 1] - r.th[i];
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return { x: r.x[i] + (r.x[i + 1] - r.x[i]) * f, th: r.th[i] + d * f, mode: r.mode[i], i };
}

export const RUN_HZ = HZ;
