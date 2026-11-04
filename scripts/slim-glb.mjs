// Simplifica as malhas densas de um GLB de vista explodida e recomprime com meshopt.
//
// O GLB do macropad sai do Blender com 572 mil triângulos, 425 mil só nos 18
// switches. Simplificar switch, ESP32-C3, PCB e OLED com erro de 0,1% do raio
// da malha leva a 334 mil e de 545 para 351 KB sem diferença visível na home.
// Case e keycaps ficam como estão: já são leves e são superfícies grandes,
// onde um facetado apareceria.
//
// Rode depois de copiar um GLB novo do artifact (ele vem cheio de novo):
//
//   npm i --no-save @gltf-transform/core@4.5.1 @gltf-transform/extensions@4.5.1 @gltf-transform/functions@4.5.1 meshoptimizer@0.22.0
//   node scripts/slim-glb.mjs public/projetos/macropad/macropad.glb public/projetos/macropad/macropad.glb
//
// Os nós e os `extras.group` de cada peça são preservados, então o parts.json
// continua valendo. Confira a home depois (a vista explodida e um close).
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dequantize, meshopt, simplifyPrimitive, weld, prune } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const [, , IN, OUT, ERR = "0.001"] = process.argv;
if (!IN || !OUT) {
  console.error("uso: node scripts/slim-glb.mjs <entrada.glb> <saida.glb> [erro=0.001]");
  process.exit(1);
}
/** nomes de malha que valem simplificar; o resto passa intacto */
const DENSE = /^(Switch_|MCU_Module|PCB|OLED_Module)/;

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder,
  "meshopt.encoder": MeshoptEncoder,
});
const doc = await io.read(IN);
await doc.transform(dequantize(), weld());
const tri = (p) => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute("POSITION").getCount()) / 3;
let before = 0,
  after = 0;
for (const mesh of doc.getRoot().listMeshes()) {
  if (!DENSE.test(mesh.getName())) continue;
  for (const prim of mesh.listPrimitives()) {
    before += tri(prim);
    simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: 0, error: Number(ERR) });
    after += tri(prim);
  }
}
console.log(`malhas densas: ${before} -> ${after} triângulos (por instância)`);
await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
await io.write(OUT, doc);
