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
import { tr, type Tx } from "../../i18n/core.ts";
import { PendulumSim } from "./physics.ts";

/** textos nos dois idiomas: quem mostra escolhe o idioma na hora (a corrida é gravada uma vez só) */
export type RunMark = { t: number; label: Tx; name: Tx; spec: Tx };

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
  /** em inglês, ponto decimal */
  const e1 = (v: number) => v.toFixed(1);
  const subida = tPegou1 - tSubida,
    reergueu = tPegou2 - tTapa;
  const marks: RunMark[] = [
    {
      t: 0,
      label: tr("Ligado no batente do motor", "Powered on at the motor-side end stop"),
      name: tr("Conferência do 12 V", "12 V check"),
      spec: tr("empurrãozinho de 6 mm para o centro", "a small 6 mm nudge toward the center"),
    },
    {
      t: tSubida,
      label: tr("Subindo: empurra o balanço", "Swinging up: pumping the swing"),
      name: tr("Subida por energia", "Energy-based swing-up"),
      spec: tr("inverte quando a haste passa por baixo", "reverses as the rod passes the bottom"),
    },
    {
      t: tPegou1,
      label: tr(`Pegou no topo · ${f1(subida)} s de subida`, `Caught at the top · ${e1(subida)} s of swing-up`),
      name: tr("Pegou no topo", "Caught at the top"),
      spec: tr(`${f1(subida)} s depois de sair do batente`, `${e1(subida)} s after leaving the end stop`),
    },
    {
      t: tPegou1 + 0.15,
      label: tr("Equilibrando a 200 Hz", "Balancing at 200 Hz"),
      name: tr("Equilíbrio (LQR)", "Balance (LQR)"),
      spec: tr("o carro corre para baixo da haste", "the cart runs under the rod"),
    },
    {
      t: tTapa,
      label: tr("Um tapa na haste", "A tap on the rod"),
      name: tr("Tapa", "Tap"),
      spec: tr("1,6 rad/s, de propósito", "1.6 rad/s, on purpose"),
    },
    {
      t: tCaiu,
      label: tr("Caiu · volta a subir no mesmo ciclo", "Fell · swings back up in the same cycle"),
      name: tr("Queda", "Fall"),
      spec: tr("passou de 30°", "past 30°"),
    },
    {
      t: tPegou2,
      label: tr(`Reergueu em ${f1(reergueu)} s`, `Back up in ${e1(reergueu)} s`),
      name: tr("Reergueu sozinho", "Back up on its own"),
      spec: tr(`${f1(reergueu)} s depois do tapa`, `${e1(reergueu)} s after the tap`),
    },
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
