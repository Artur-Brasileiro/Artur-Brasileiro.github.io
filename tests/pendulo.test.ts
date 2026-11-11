/**
 * Física do pêndulo, o controle do firmware e a corrida da home. Roda direto
 * no Node (type stripping):  npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { PendulumSim, X_BATENTE_MOTOR, smallSwingPeriod } from "../src/components/pendulo/physics.ts";
import { beltLoop, cartOffset, XC0, XC_BATENTE } from "../src/components/pendulo/rig.ts";
import { recordRun, sampleRun } from "../src/components/pendulo/run.ts";

const deg = (r: number) => (r * 180) / Math.PI;
/** advance() limita cada chamada a 0,1 s (proteção contra aba congelada): anda em passos */
const run = (s: PendulumSim, T: number) => {
  for (let t = 0; t < T; t += 0.01) s.advance(0.01);
};

test("a haste balança com o período medido (1,121 s)", () => {
  assert.ok(Math.abs(smallSwingPeriod() - 1.121) < 0.002);
});

test("atrito do encoder: perde ~0,6° de amplitude por balanço", () => {
  const s = new PendulumSim();
  s.setControl(false);
  s.s.phi = (20 * Math.PI) / 180;
  const picos: number[] = [];
  let w0 = 0;
  for (let i = 0; i < 6000; i++) {
    s.advance(0.001);
    if (w0 > 0 && s.s.w <= 0) picos.push(deg(s.s.phi));
    w0 = s.s.w;
  }
  const perda = (picos[0] - picos[4]) / 4;
  assert.ok(perda > 0.5 && perda < 0.8, `perda por balanço ${perda.toFixed(2)}°`);
});

test("ligado no batente, sobe e equilibra sem chegar a 20 mm de um batente", () => {
  const s = new PendulumSim();
  let xmin = 1,
    xmax = -1;
  for (let i = 0; i < 15000; i++) {
    s.advance(0.001);
    if (s.s.mode !== "conferindo") {
      xmin = Math.min(xmin, s.s.x);
      xmax = Math.max(xmax, s.s.x);
    }
  }
  assert.equal(s.s.mode, "equilibrio");
  assert.ok(Math.abs(deg(s.theta)) < 1);
  assert.ok(s.s.pegouEm! < 10, `pegou em ${s.s.pegouEm}`);
  assert.ok(xmin >= X_BATENTE_MOTOR + 0.02 - 1e-6 || xmin >= X_BATENTE_MOTOR, "não passa do batente do motor");
  assert.ok(xmax < 0.21);
});

test("peteleco o equilíbrio segura; tapa derruba e ele reergue sozinho", () => {
  const s = new PendulumSim();
  run(s, 12);
  s.drainEvents();
  s.kick(0.5);
  run(s, 4);
  assert.deepEqual(s.drainEvents(), []);
  s.kick(1.6);
  run(s, 6);
  const ev = s.drainEvents();
  assert.ok(ev.includes("caiu") && ev.at(-1) === "pegou", ev.join(","));
});

test("controle desligado: a haste cai; religado, volta a subir", () => {
  const s = new PendulumSim();
  run(s, 12);
  s.setControl(false);
  s.kick(0.3);
  let pior = 0;
  for (let t = 0; t < 5; t += 0.01) {
    s.advance(0.01);
    pior = Math.max(pior, Math.abs(deg(s.theta)));
  }
  assert.equal(s.s.mode, "desligado");
  assert.ok(pior > 90, `sem controle ela cai (pior ${pior.toFixed(0)}°)`);
  s.setControl(true);
  run(s, 15);
  assert.equal(s.s.mode, "equilibrio");
});

test("carro no batente do motor fica encostado no batente do CAD", () => {
  assert.equal(cartOffset(X_BATENTE_MOTOR) + XC0, XC_BATENTE);
});

test("correia: volta fechada em torno da polia e do rolo", () => {
  const { pts, length } = beltLoop();
  const n = pts.length;
  const gap = Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]);
  assert.ok(gap < 2);
  assert.ok(length > 1150 && length < 1200, `comprimento ${length.toFixed(0)} mm`);
});

test("corrida da home: sobe, pega, leva o tapa e reergue, nessa ordem", () => {
  const r = recordRun();
  const t = r.marks.map((m) => m.t);
  for (let i = 1; i < t.length; i++) assert.ok(t[i] > t[i - 1], r.marks[i].name);
  assert.ok(Math.abs(deg(sampleRun(r, r.duration).th)) < 2, "termina em pé");
  assert.ok(Math.abs(Math.abs(deg(sampleRun(r, 0).th)) - 180) < 1, "começa pendurada");
});
