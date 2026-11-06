// Gera o GLB da CNC plotter a partir do cnc_viz.json do artifact "CNC Plotter do Artur".
//
// O artifact guarda cada malha em base64 dentro de um JSON (1,3 MB). Aqui elas
// viram um GLB com quantização e meshopt (~4× menor), e o MESMO arquivo serve
// aos dois lugares do site:
//
//   - a folha 02 da home (vista explodida): cada nó leva `extras.group`, e o
//     parts.json diz para onde cada grupo vai;
//   - o simulador da página /projeto/cnc-plotter: lê o nome original da malha
//     em `extras.n` ("<grupo móvel>_<peça>__<material>") e remonta a hierarquia
//     da máquina (ponte, carro, caneta, polias) como no artifact.
//
// As duas correias entram como malhas paradas na posição de origem, só para a
// home; o simulador as ignora (`extras.belt`) e gera as dele, que se movem.
//
// Rode de novo se o artifact mudar a geometria:
//
//   npm i --no-save @gltf-transform/core@4.5.1 @gltf-transform/extensions@4.5.1 @gltf-transform/functions@4.5.1 meshoptimizer@0.22.0
//   node scripts/build-cnc-glb.mjs <cnc_viz.json> public/projetos/cnc/cnc.glb
//
// Eixos: o JSON está no FreeCAD (Z para cima, mm). O GLB sai em Y para cima,
// como manda o glTF e como a vista explodida espera: (x, y, z) vira (x, z, -y).
import fs from "node:fs";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, prune, simplifyPrimitive } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { beltXAxisPath, beltYAxisPath, ribbon, BELT_THICKNESS, BELT_X_AXIS_Z, BELT_Y_AXIS_Z } from "../src/components/cnc/machine.ts";

const [, , IN, OUT] = process.argv;
if (!IN || !OUT) {
  console.error("uso: node scripts/build-cnc-glb.mjs <cnc_viz.json> <saida.glb>");
  process.exit(1);
}

/** cor como no artifact: o three r147 dele tratava o hex como valor linear */
const lin = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255, 1];
const MATS = {
  pla: [0x15171a, 0.58, 0],
  plaNew: [0x15171a, 0.58, 0],
  steel: [0xd9dde2, 0.26, 0.92],
  bearing: [0xc3c8ce, 0.34, 0.88],
  alu: [0xe5e8ec, 0.36, 0.9],
  motor: [0x101113, 0.45, 0.3],
  motorcap: [0x1a1b1e, 0.5, 0.4],
  blackmetal: [0x0e0f11, 0.42, 0.6],
  white: [0xf1f0ec, 0.6, 0],
  servo: [0x2f6fe0, 0.38, 0],
  wire: [0xc27a2c, 0.6, 0],
  switch: [0x141517, 0.5, 0],
  red: [0xd23b2b, 0.5, 0],
  penTip: [0x222222, 0.4, 0.5],
  penBody: [0xf4f4f1, 0.45, 0],
  penGrip: [0x1c3fae, 0.5, 0],
  penCap: [0x1c3fae, 0.4, 0],
  belt: [0x1f1c1a, 0.85, 0],
};

/** grupo da vista explodida (parts.json) de cada malha, pelo nome */
function homeGroup(name) {
  const [head] = name.split("__");
  const us = head.indexOf("_");
  const g = head.slice(0, us),
    key = head.slice(us + 1);
  if (g === "P") return key.startsWith("Caneta") ? "caneta" : "penholder";
  if (g === "C" || g === "H") return "carro";
  if (g === "PX" || g === "PY") return "motores";
  if (g === "IX" || g === "IY1" || g === "IY2") return "ponte";
  if (g === "G") {
    if (key.startsWith("Motor")) return "motores";
    if (key.startsWith("Barra6mm")) return "barras6";
    if (key.startsWith("Correia")) return "correia_y";
    return "ponte";
  }
  if (g === "F") {
    if (key.startsWith("Barra12mm")) return "barras12";
    if (key.startsWith("Correia")) return "correia_x";
    return "suportes";
  }
  throw new Error(`malha sem grupo: ${name}`);
}

const b64 = (s, T) => {
  const buf = Buffer.from(s, "base64");
  return new T(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
};

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

/** normais por vértice, média das faces (para as correias, que o JSON não traz) */
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

// Pose em que a máquina é gravada: ponte no meio das barras de 12 mm e carro
// no meio da ponte (X = 409, Y = 201). Na origem do artifact (X = 0, Y = 0)
// tudo fica amontoado num canto, e a vista explodida da home vira um bolo de
// peças sobre uma ponta da barra. Cada nó deslocado guarda o deslocamento em
// `extras.home` (mm, FreeCAD), e o simulador o desfaz ao montar a máquina.
const POSE = { x: 409, y: 201 };
const offsetFor = (name) => {
  const g = name.slice(0, name.indexOf("_"));
  if (g === "C" || g === "H" || g === "P") return [-POSE.y, -POSE.x, 0];
  if (g === "G" || g === "PX" || g === "PY" || g === "IX" || g === "IY1" || g === "IY2") return [0, -POSE.x, 0];
  return null;
};

const data = JSON.parse(fs.readFileSync(IN, "utf8"));
const meshes = data.meshes.map((d) => {
  const q = b64(d.q, Int8Array);
  const nrm = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) nrm[i] = Math.max(-1, q[i] / 127);
  const idx = d.w === 2 ? b64(d.i, Uint16Array) : b64(d.i, Uint32Array);
  const pos = b64(d.p, Float32Array);
  const home = offsetFor(d.n);
  if (home) for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) pos[i + k] += home[k];
  return { name: d.n, pos, nrm, idx: Uint32Array.from(idx), home };
});

// correias na mesma pose; a do eixo Y vive na ponte, a do X no mundo
const beltY = beltYAxisPath(-POSE.y).map(([x, y]) => [x, y - POSE.x]);
for (const [name, pts, [z0, z1]] of [
  ["G_CorreiaY__belt", beltY, BELT_Y_AXIS_Z],
  ["F_CorreiaX__belt", beltXAxisPath(-POSE.x), BELT_X_AXIS_Z],
]) {
  const r = ribbon(pts, false, z0, z1, BELT_THICKNESS);
  const idx = Uint32Array.from(r.index);
  meshes.push({ name, pos: r.position, nrm: vertexNormals(r.position, idx), idx, belt: true });
}

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene("CNC");
const materials = new Map();
const material = (key) => {
  if (!materials.has(key)) {
    const [hex, rough, metal] = MATS[key] ?? MATS.pla;
    materials.set(key, doc.createMaterial(key).setBaseColorFactor(lin(hex)).setRoughnessFactor(rough).setMetallicFactor(metal));
  }
  return materials.get(key);
};

// Peças repetidas (parafusos, abas das polias, os dois motores, rolamentos
// LM6UU...) são a mesma malha deslocada: guardamos uma vez e o nó leva a
// translação. São 40 das 102 malhas.
const minCorner = (p) => {
  const mn = [Infinity, Infinity, Infinity];
  for (let i = 0; i < p.length; i += 3) for (let k = 0; k < 3; k++) mn[k] = Math.min(mn[k], p[i + k]);
  return mn;
};
const shared = new Map();

let tris = 0;
for (const m of meshes) {
  const matKey = m.name.split("__")[1] ?? "pla";
  const mn = minCorner(m.pos);
  const key = [matKey, m.idx.join(","), Array.from(m.nrm, (v) => Math.round(v * 127)).join(","), Array.from(m.pos, (v, i) => Math.round((v - mn[i % 3]) * 100)).join(",")].join("|");
  const extras = { group: homeGroup(m.name), n: m.name };
  if (m.belt) extras.belt = true;
  if (m.home) extras.home = m.home;
  const twin = shared.get(key);
  if (twin) {
    const d = [mn[0] - twin.mn[0], mn[1] - twin.mn[1], mn[2] - twin.mn[2]];
    scene.addChild(doc.createNode(m.name).setMesh(twin.mesh).setTranslation([d[0], d[2], -d[1]]).setExtras(extras));
    continue;
  }
  const pos = toYUp(Float32Array.from(m.pos));
  const nrm = toYUp(Float32Array.from(m.nrm));
  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(pos).setBuffer(buffer))
    .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(nrm).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(m.idx).setBuffer(buffer))
    .setMaterial(material(matKey));
  tris += m.idx.length / 3;
  const mesh = doc.createMesh(m.name).addPrimitive(prim);
  shared.set(key, { mesh, mn });
  scene.addChild(doc.createNode(m.name).setMesh(mesh).setExtras(extras));
}

// Os três LM12UU têm as esferas modeladas: 13 mil triângulos, um quarto da
// máquina. Simplificar com erro de 0,1% do raio da malha não muda o que se vê.
await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
let dense = 0;
for (const mesh of doc.getRoot().listMeshes()) {
  if (!/Rolamento/.test(mesh.getName())) continue;
  for (const prim of mesh.listPrimitives()) {
    simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: 0, error: Number(process.env.ERR ?? 0.001) });
    dense += prim.getIndices().getCount() / 3;
  }
}
console.log("LM12UU depois de simplificar:", dense, "triângulos");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
await io.write(OUT, doc);
console.log(`${meshes.length} malhas, ${tris} triângulos -> ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
