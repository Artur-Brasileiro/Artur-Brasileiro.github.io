/**
 * Lógica pura da vista explodida. Roda direto no Node (type stripping), sem
 * dependência de teste:  node --test tests/
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boxShift, explosionFrame, fitDistance, isGroupOut, seg, stageAt, type PartGroup, type PartsConfig } from "../src/components/three/explode.ts";

const group = (stage: [number, number]): PartGroup => ({ id: "x", ref: "X1", name: "X", explode: [0, 0, 10], stage });

// os stages do parts.json do macropad
const macropad: PartsConfig = {
  model: "macropad.glb",
  groups: [],
  stages: [
    [0.0, "Conjunto montado"],
    [0.06, "Keycaps saindo das hastes"],
    [0.17, "Switches e display saindo da placa"],
    [0.37, "Moldura e placa de encaixe"],
    [0.56, "Bandeja inferior"],
    [0.66, "Soquetes, diodos e ESP32-C3"],
    [0.9, "Vista explodida completa"],
  ],
};

test("seg: easing dentro da faixa, preso nas pontas", () => {
  assert.equal(seg(0.5, [0, 1]), 0.5);
  assert.equal(seg(0, [0, 1]), 0);
  assert.equal(seg(2, [0, 1]), 1);
  assert.equal(seg(-1, [0, 1]), 0);
});

test("seg: faixa vazia nunca move", () => {
  assert.equal(seg(0.3, [0.5, 0.5]), 0);
  assert.equal(seg(0.9, [0.6, 0.2]), 0);
});

test("isGroupOut: grupo parado sempre aceso, móvel acende depois de sair um pouco", () => {
  assert.equal(isGroupOut(group([0, 0]), 0), true);
  assert.equal(isGroupOut(group([0.6, 0.84]), 0.6), false);
  assert.equal(isGroupOut(group([0.6, 0.84]), 0.84), true);
});

test("stageAt: etapa vigente pelo limiar", () => {
  assert.deepEqual(stageAt(macropad, 0), { stage: "Conjunto montado", stageIndex: 0 });
  assert.deepEqual(stageAt(macropad, 0.37), { stage: "Moldura e placa de encaixe", stageIndex: 3 });
  assert.deepEqual(stageAt(macropad, 1), { stage: "Vista explodida completa", stageIndex: 6 });
});

test("stageAt: sem config, etapa vazia", () => {
  assert.deepEqual(stageAt(null, 0.5), { stage: "", stageIndex: 0 });
});

test("explosionFrame: explosão completa ocupa a faixa inteira e centra entre os extremos", () => {
  const f = explosionFrame(
    [
      [0, 116, 0],
      [0, -95, 0],
    ],
    211,
  );
  assert.equal(f.span, 211);
  assert.equal(f.spread, 1);
  assert.deepEqual(f.center, [0, 10.5, 0]);
});

test("explosionFrame: montado não abre nada", () => {
  const f = explosionFrame([[0, 0, 0]], 211);
  assert.equal(f.spread, 0);
  assert.deepEqual(f.center, [0, 0, 0]);
});

test("explosionFrame: explosão lateral conta (CNC abre para os lados)", () => {
  const f = explosionFrame([[60, 0, 0]], 120);
  assert.equal(f.span, 60);
  assert.equal(f.spread, 0.5);
  assert.deepEqual(f.center, [30, 0, 0]);
});

test("explosionFrame: modelo sem explosão não gera NaN", () => {
  const f = explosionFrame([[60, 0, 0]], 0);
  assert.equal(f.spread, 0);
});

test("explosionFrame: tamanho da caixa por eixo", () => {
  const f = explosionFrame(
    [
      [0, 116, 0],
      [0, -95, 0],
      [30, 0, -10],
    ],
    1,
  );
  assert.deepEqual(f.size, [30, 211, 10]);
});

// tan(21°): metade do campo de visão vertical de 42°
const T = Math.tan((21 * Math.PI) / 180);

test("fitDistance: tela larga — quem limita é a altura", () => {
  const d = fitDistance(1, 1, { x: 0, y: 0, w: 1, h: 1 }, 16 / 9, T, 1);
  assert.ok(Math.abs(d - 1 / T) < 1e-9);
});

test("fitDistance: celular em pé — quem limita é a largura, e o modelo cabe nela", () => {
  const aspect = 393 / 784;
  const d = fitDistance(1, 0.6, { x: 0, y: 0, w: 1, h: 1 }, aspect, T, 1);
  assert.ok(Math.abs(d - 1 / (T * aspect)) < 1e-9);
  // metade da largura visível nessa distância = exatamente a metade do modelo
  assert.ok(Math.abs(d * T * aspect - 1) < 1e-9);
});

test("fitDistance: caixa menor afasta a câmera na mesma proporção", () => {
  const cheia = fitDistance(1, 1, { x: 0, y: 0, w: 1, h: 1 }, 1, T, 1);
  const metade = fitDistance(1, 1, { x: 0, y: 0.5, w: 1, h: 0.5 }, 1, T, 1);
  assert.ok(Math.abs(metade - 2 * cheia) < 1e-9);
});

test("fitDistance: a margem afasta", () => {
  assert.ok(fitDistance(1, 1, { x: 0, y: 0, w: 1, h: 1 }, 1, T, 1.1) > fitDistance(1, 1, { x: 0, y: 0, w: 1, h: 1 }, 1, T, 1));
});

test("boxShift: caixa centrada não desloca; caixa na metade de baixo desce um quarto", () => {
  assert.deepEqual(boxShift({ x: 0, y: 0, w: 1, h: 1 }), [0, 0]);
  assert.deepEqual(boxShift({ x: 0, y: 0.5, w: 1, h: 0.5 }), [0, 0.25]);
});
