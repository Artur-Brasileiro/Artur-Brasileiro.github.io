// Gera o GLB do pêndulo invertido a partir das malhas do modelo CAD (CadQuery).
//
// `scripts/pendulo/pendulo_cad.json` é a tesselação de cada peça, como saiu do
// pendulo.py (mm; x ao longo do trilho, y para trás, z para cima), com o carro
// no meio do trilho (centro do bloco em x = 250). Aqui elas viram um GLB com
// quantização e meshopt, e o MESMO arquivo serve aos dois lugares do site:
//
//   - a folha da home (vista explodida): cada nó leva `extras.group`, e o
//     parts.json diz para onde cada grupo vai;
//   - o simulador da página /projeto/pendulo-invertido: lê `extras.part` e
//     remonta o que se move (carro, haste, polia, rolo).
//
// O que muda em relação ao CAD:
//   - A haste do CAD tinha 300 mm; a de verdade tem 500 mm, com o eixo a 35 mm
//     da ponta. Ela é refeita aqui com essa medida.
//   - Haste e cubo são gravados EM PÉ (θ = 0), que é a pose da vista explodida
//     e o zero do simulador.
//   - O encoder e o motor viram duas ou três primitivas cada, para o eixo de
//     aço e o ressalto de alumínio não ficarem pretos.
//   - A correia entra parada, só para a home (`extras.belt`); o simulador gera
//     a dele, que anda com o carro.
//
// Rode de novo se o modelo mudar:
//
//   npm i --no-save @gltf-transform/core@4.5.1 @gltf-transform/extensions@4.5.1 @gltf-transform/functions@4.5.1 meshoptimizer@0.22.0
//   node scripts/build-pendulo-glb.mjs scripts/pendulo/pendulo_cad.json public/projetos/pendulo/pendulo.glb
//
// Eixos: o glTF sai em Y para cima, como manda o padrão e como a vista explodida
// espera: (x, y, z) do CAD vira (x, z, -y).
import fs from "node:fs";
import path from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, prune } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

const [, , IN, OUT] = process.argv;
if (!IN || !OUT) {
  console.error("uso: node scripts/build-pendulo-glb.mjs <pendulo_cad.json> <saida.glb>");
  process.exit(1);
}

/* ---------- medidas da montagem (as do pendulo.py) ---------- */
const XC0 = 250; // centro do bloco no CAD
const AXY = -40.5; // eixo do encoder: 40,5 mm à frente do eixo do trilho
const AXZ = 44.0; // e 44 mm acima da base
const ROD_D = 6;
const ROD_ACIMA = 35; // a haste passa 35 mm do eixo para o outro lado
const ROD_L = 500;

/* ---------- cor: sRGB do hex -> linear do glTF ---------- */
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lin = (hex) => [toLin(((hex >> 16) & 255) / 255), toLin(((hex >> 8) & 255) / 255), toLin((hex & 255) / 255), 1];
const MATS = {
  pla: [0x1d1f23, 0.6, 0],
  steel: [0xd9dde2, 0.26, 0.92],
  steelDark: [0xa7adb4, 0.34, 0.88],
  blackmetal: [0x17181b, 0.42, 0.6],
  alu: [0xe2e5e9, 0.36, 0.9],
  motor: [0x1a1b1e, 0.45, 0.35],
  belt: [0x1f1c1a, 0.85, 0],
};

/** peça -> [grupo da vista explodida, material] */
const PARTS = {
  carro_encoder: ["carro", "pla"],
  garra_correia: ["garra", "pla"],
  cubo_pendulo: ["cubo", "pla"],
  suporte_motor: ["suporte_motor", "pla"],
  polia_motor_gt2_30d: ["polia", "pla"],
  esticador_base: ["esticador_base", "pla"],
  esticador_carro: ["esticador_carro", "pla"],
  rolo_esticador: ["rolo", "pla"],
  batente_trilho_a: ["batentes", "pla"],
  batente_trilho_b: ["batentes", "pla"],
  ref_trilho: ["trilho", "steel"],
  ref_bloco: ["trilho", "steelDark"],
  ref_encoder: ["encoder", "blackmetal"],
  ref_motor: ["motor", "motor"],
  ref_haste: ["haste", "steel"],
  ref_correia: ["correia", "belt"],
};

const b64 = (s, T) => {
  const buf = Buffer.from(s, "base64");
  return new T(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
};

/** gira em torno do eixo do encoder (paralelo a y): a haste de pendurada para em pé */
function upright(pos) {
  for (let i = 0; i < pos.length; i += 3) {
    pos[i] = 2 * XC0 - pos[i];
    pos[i + 2] = 2 * AXZ - pos[i + 2];
  }
}

/** a haste de verdade: Ø6 × 500, eixo a 35 mm da ponta de cima (em pé) */
function rod() {
  const seg = 24;
  const r = ROD_D / 2;
  const z0 = AXZ - ROD_ACIMA,
    z1 = z0 + ROD_L;
  const pos = [],
    idx = [];
  // costado: vértices próprios (normal lisa); tampas: vértices próprios (normal reta)
  for (let k = 0; k <= seg; k++) {
    const a = (k / seg) * Math.PI * 2;
    const x = XC0 + r * Math.cos(a),
      y = AXY + r * Math.sin(a);
    pos.push(x, y, z0, x, y, z1);
  }
  for (let k = 0; k < seg; k++) {
    const a = 2 * k,
      b = 2 * k + 1,
      c = 2 * k + 2,
      d = 2 * k + 3;
    idx.push(a, c, b, b, c, d);
  }
  for (const [z, up] of [
    [z0, false],
    [z1, true],
  ]) {
    const base = pos.length / 3;
    pos.push(XC0, AXY, z);
    for (let k = 0; k < seg; k++) {
      const a = (k / seg) * Math.PI * 2;
      // chanfro de 0,5 mm na ponta, como haste cortada e lixada
      pos.push(XC0 + (r - 0.5) * Math.cos(a), AXY + (r - 0.5) * Math.sin(a), z);
    }
    for (let k = 0; k < seg; k++) {
      const p = base + 1 + k,
        q = base + 1 + ((k + 1) % seg);
      if (up) idx.push(base, p, q);
      else idx.push(base, q, p);
    }
  }
  return { pos: Float32Array.from(pos), idx: Uint32Array.from(idx) };
}

/** normais por vértice, média das faces ponderada pela área */
function vertexNormals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i] * 3, idx[i + 1] * 3, idx[i + 2] * 3];
    const ux = pos[b] - pos[a],
      uy = pos[b + 1] - pos[a + 1],
      uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a],
      vy = pos[c + 1] - pos[a + 1],
      vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) {
      n[k] += nx;
      n[k + 1] += ny;
      n[k + 2] += nz;
    }
  }
  for (let i = 0; i < n.length; i += 3) {
    const L = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= L;
    n[i + 1] /= L;
    n[i + 2] /= L;
  }
  return n;
}

/**
 * Separa os triângulos de uma malha por material. `pick(cx, cy, cz, rMax)` recebe
 * o centro do triângulo e o maior raio dos três vértices em torno do eixo.
 */
function split(pos, idx, axis, pick) {
  const [ax, az] = axis;
  const buckets = new Map();
  for (let i = 0; i < idx.length; i += 3) {
    let cx = 0,
      cy = 0,
      cz = 0,
      rMax = 0,
      yMax = -Infinity;
    for (let k = 0; k < 3; k++) {
      const v = idx[i + k] * 3;
      cx += pos[v] / 3;
      cy += pos[v + 1] / 3;
      cz += pos[v + 2] / 3;
      rMax = Math.max(rMax, Math.hypot(pos[v] - ax, pos[v + 2] - az));
      yMax = Math.max(yMax, pos[v + 1]);
    }
    const m = pick(cx, cy, cz, rMax, yMax);
    if (!buckets.has(m)) buckets.set(m, []);
    buckets.get(m).push(idx[i], idx[i + 1], idx[i + 2]);
  }
  return [...buckets].map(([mat, list]) => ({ mat, idx: Uint32Array.from(list) }));
}

/** só os vértices usados por uma primitiva, reindexados */
function compact(pos, idx) {
  const map = new Map();
  const out = [];
  const ni = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) {
    let j = map.get(idx[i]);
    if (j === undefined) {
      j = out.length / 3;
      map.set(idx[i], j);
      out.push(pos[idx[i] * 3], pos[idx[i] * 3 + 1], pos[idx[i] * 3 + 2]);
    }
    ni[i] = j;
  }
  return { pos: Float32Array.from(out), idx: ni };
}

/** Z-up -> Y-up, no lugar */
function toYUp(a) {
  for (let i = 0; i < a.length; i += 3) {
    const y = a[i + 1],
      z = a[i + 2];
    a[i + 1] = z;
    a[i + 2] = -y;
  }
  return a;
}

const data = JSON.parse(fs.readFileSync(IN, "utf8"));

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene("PenduloInvertido");
const materials = new Map();
const material = (key) => {
  if (!materials.has(key)) {
    const [hex, rough, metal] = MATS[key];
    materials.set(key, doc.createMaterial(key).setBaseColorFactor(lin(hex)).setRoughnessFactor(rough).setMetallicFactor(metal));
  }
  return materials.get(key);
};

let tris = 0;
for (const [part, [group, mat]] of Object.entries(PARTS)) {
  let pos, idx;
  if (part === "ref_haste") ({ pos, idx } = rod());
  else {
    const d = data[part];
    if (!d) throw new Error(`peça ausente no JSON: ${part}`);
    pos = Float32Array.from(b64(d.p, Float32Array));
    idx = Uint32Array.from(b64(d.i, Uint32Array));
  }
  if (part === "cubo_pendulo") upright(pos);

  let prims = [{ mat, idx }];
  // encoder: corpo preto, ressalto de alumínio (Ø20) e eixo de aço (Ø6)
  if (part === "ref_encoder")
    prims = split(pos, idx, [XC0, AXZ], (cx, cy, cz, r, yMax) => (r <= 3.05 ? "steel" : r <= 10.05 && yMax <= -15.99 ? "alu" : "blackmetal"));
  // motor: corpo escuro e o eixo de Ø5 que sai na frente
  if (part === "ref_motor") prims = split(pos, idx, [-30, 31.925], (cx, cy, cz, r, yMax) => (r <= 2.6 && yMax <= 48.6 ? "steel" : "motor"));

  const mesh = doc.createMesh(part);
  for (const p of prims) {
    const c = compact(pos, p.idx);
    const nrm = vertexNormals(c.pos, c.idx);
    toYUp(c.pos);
    toYUp(nrm);
    mesh.addPrimitive(
      doc
        .createPrimitive()
        .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(c.pos).setBuffer(buffer))
        .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(nrm).setBuffer(buffer))
        .setIndices(doc.createAccessor().setType("SCALAR").setArray(c.idx).setBuffer(buffer))
        .setMaterial(material(p.mat)),
    );
    tris += c.idx.length / 3;
  }
  const extras = { group, part };
  if (part === "ref_correia") extras.belt = true;
  scene.addChild(doc.createNode(part).setMesh(mesh).setExtras(extras));
}

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
await io.write(OUT, doc);
console.log(`${Object.keys(PARTS).length} peças, ${tris} triângulos -> ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
