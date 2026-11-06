/**
 * Lógica pura da CNC: cinemática, programa, estimativa e o texto que vira
 * traço. Roda direto no Node (type stripping):  npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  X_MAX,
  Y_MAX,
  TH_DOWN,
  TH_UP,
  beltXAxisPath,
  beltYAxisPath,
  demoProgram,
  estimateSeconds,
  formatDuration,
  gcodeFile,
  inkLength,
  penIsDown,
  penWorld,
  programFromPolylines,
  ribbon,
} from "../src/components/cnc/machine.ts";
import { MAX_CHARS, layoutText, normalizeText, textProgram, type StrokeFont } from "../src/components/cnc/text.ts";

const font = (id: string) => JSON.parse(fs.readFileSync(new URL(`../public/projetos/cnc/fontes/${id}.json`, import.meta.url), "utf8")) as StrokeFont;

test("caneta: o servo erguido tira a caneta do papel; abaixado, ela toca", () => {
  assert.equal(penIsDown(TH_UP), false);
  assert.equal(penIsDown(TH_DOWN), true);
});

test("ponta da caneta: X da máquina anda em -Y do mundo, Y anda em -X", () => {
  const o = penWorld(0, 0);
  const p = penWorld(100, 50);
  assert.ok(Math.abs(p.y - o.y + 100) < 1e-9);
  assert.ok(Math.abs(p.x - o.x + 50) < 1e-9);
});

test("correias: a fita tem quatro faixas e índices dentro do buffer", () => {
  for (const pts of [beltYAxisPath(0), beltYAxisPath(-200), beltXAxisPath(0), beltXAxisPath(-818)]) {
    const r = ribbon(pts, false, 0, 6, 1.4);
    const verts = r.position.length / 3;
    assert.equal(verts, pts.length * 8);
    assert.ok(r.index.every((i) => i >= 0 && i < verts));
  }
});

test("a correia do eixo Y mantém o número de pontos com o carro andando (o buffer é reaproveitado)", () => {
  const n = beltYAxisPath(0).length;
  for (const ox of [-1, -100, -250.5, -402]) assert.equal(beltYAxisPath(ox).length, n);
});

test("programa: sobe, vai, desce, traça, sobe — e termina na origem", () => {
  const P = programFromPolylines([[[10, 10], [20, 10], [20, 20]]], ["; teste"]);
  const kinds = P.map((c) => (c.t === "pen" ? (c.down ? "↓" : "↑") : c.t === "mv" ? (c.rapid ? "G0" : "G1") : "n"));
  assert.deepEqual(kinds, ["n", "n", "↑", "G0", "↓", "G1", "G1", "↑", "G0", "n"]);
  assert.equal(inkLength(P), 20);
  assert.match(gcodeFile(P), /^; teste\nG21 G90/);
});

test("demonstração: cabe na área útil e leva o tempo de sempre", () => {
  const P = demoProgram();
  for (const c of P) if (c.t === "mv") assert.ok(c.x >= 0 && c.x <= X_MAX && c.y >= 0 && c.y <= Y_MAX, `${c.g} fora da área`);
  const s = estimateSeconds(P);
  assert.ok(s > 60 && s < 200, `demo leva ${s} s a 1×`);
});

test("formatDuration", () => {
  assert.equal(formatDuration(12.4), "12 s");
  assert.equal(formatDuration(60), "1 min");
  assert.equal(formatDuration(95), "1 min 35 s");
});

test("texto: normaliza espaços e corta no limite do campo", () => {
  assert.equal(normalizeText("  olá   mundo \n"), "olá mundo");
  assert.equal(normalizeText("x".repeat(80)).length, MAX_CHARS);
});

for (const id of ["simples", "cursiva", "moderna"]) {
  test(`texto (${id}): tudo dentro da área útil, com acentos e ç`, () => {
    const f = font(id);
    for (const t of ["Olá, mundo!", "Ação ÇÃO é ü", "Artur Brasileiro", "a", "palavra ".repeat(6), "W".repeat(MAX_CHARS)]) {
      const { polys, lines, em } = layoutText(f, t);
      assert.ok(polys.length > 0, `"${t}" sem traço`);
      assert.ok(lines.length >= 1 && lines.length <= 4);
      assert.ok(em > 0 && em <= 190);
      for (const p of polys) for (const [x, y] of p) assert.ok(x >= 0 && x <= X_MAX && y >= 0 && y <= Y_MAX, `"${t}": ponto (${x}, ${y}) fora`);
    }
  });
}

test("texto: frase longa quebra em mais linhas e a letra encolhe", () => {
  const f = font("simples");
  const a = layoutText(f, "Oi");
  const b = layoutText(f, "Uma frase bem mais comprida que precisa quebrar");
  assert.equal(a.lines.length, 1);
  assert.ok(b.lines.length > 1);
  assert.ok(b.em < a.em);
});

test("texto: fica de pé para quem olha da vista geral (X da máquina diminui ao longo da frase)", () => {
  const f = font("simples");
  const { polys } = layoutText(f, "AB");
  const firstX = Math.max(...polys[0].map(([x]) => x));
  const lastX = Math.min(...polys[polys.length - 1].map(([x]) => x));
  assert.ok(firstX > lastX);
});

test("texto: o comentário do G-code leva o texto, e o programa termina", () => {
  const { program } = textProgram(font("cursiva"), "Oi");
  assert.match(program[0].g, /^; texto: "Oi" · fonte Cursiva/);
  assert.equal(program[program.length - 1].g, "M2        ; fim");
});

test("linha do tempo: soma o tempo do programa e acha a máquina em qualquer instante", async () => {
  const { buildTimeline, sampleTimeline } = await import("../src/components/cnc/machine.ts");
  const P = programFromPolylines([[[100, 0], [200, 0]]], []);
  const tl = buildTimeline(P);
  // a estimativa conta o M5 inicial como um curso inteiro do servo; a linha do tempo sabe que a caneta já está erguida
  assert.ok(Math.abs(estimateSeconds(P) - tl.duration - (TH_UP - TH_DOWN) / 6.5) < 1e-9);
  // no meio do único traço (G1 de 100 mm a 100 mm/s), a caneta está no papel e no meio do caminho
  const k = Array.from(tl.draw).indexOf(1);
  const mid = (tl.t0[k] + tl.t1[k]) / 2;
  const s = sampleTimeline(tl, mid);
  assert.equal(s.k, k);
  assert.ok(Math.abs(s.x - 150) < 1e-9 && s.y === 0);
  assert.ok(penIsDown(s.th));
  // antes de começar e depois de acabar
  assert.deepEqual([sampleTimeline(tl, -1).x, sampleTimeline(tl, -1).y], [0, 0]);
  const end = sampleTimeline(tl, tl.duration + 5);
  assert.deepEqual([end.x, end.y, end.f], [0, 0, 1]);
});

test("engrenagens da home: cabem na área útil e cada parte começa num G0", async () => {
  const { gearDrawing } = await import("../src/components/cnc/gear.ts");
  const { program, parts } = gearDrawing();
  for (const c of program) if (c.t === "mv") assert.ok(c.x >= 0 && c.x <= X_MAX && c.y >= 0 && c.y <= Y_MAX, `${c.g} fora da área`);
  assert.equal(parts.length, 5);
  for (const p of parts) assert.match(program[p.firstCmd].g, /^G0 /, `${p.name} não começa num G0`);
  // os firstCmd crescem e o último cabe no programa
  for (let i = 1; i < parts.length; i++) assert.ok(parts[i].firstCmd > parts[i - 1].firstCmd);
  const s = estimateSeconds(program);
  assert.ok(s > 30 && s < 150, `desenho leva ${s} s a 1×`);
});
