/**
 * Pré-filtro do ambiente compartilhado pelos visualizadores 3D. Fica num
 * arquivo só dele porque a CNC (three puro, sem r3f) também usa.
 */
import * as THREE from "three";

/* ---------- pré-filtro do ambiente. Desde a r18x o three pré-filtra os
   reflexos com um shader GGX de 256 amostras, e no Windows (Chrome e Edge
   traduzem o GLSL para Direct3D) só compilar esse shader travava a página por
   ~1,9 s — mais que baixar o three e o modelo juntos. Este é o pré-filtro de
   até a r17x: o mesmo blur gaussiano que o fromScene já usa, ~0,2 s para
   compilar, numa cadeia de mips por rugosidade. Para um estúdio de painéis
   difusos a diferença não aparece. Usa membros privados do PMREMGenerator,
   então confere que existem; se uma versão do three os tirar, fica o GGX. ---------- */
const PHI = (1 + Math.sqrt(5)) / 2;
const INV_PHI = 1 / PHI;
// eixos de polo dos blurs sucessivos, girando para o borrão não ter direção preferida
const BLUR_AXES = [
  new THREE.Vector3(-PHI, INV_PHI, 0),
  new THREE.Vector3(PHI, INV_PHI, 0),
  new THREE.Vector3(-INV_PHI, 0, PHI),
  new THREE.Vector3(INV_PHI, 0, PHI),
  new THREE.Vector3(0, PHI, -INV_PHI),
  new THREE.Vector3(0, PHI, INV_PHI),
  new THREE.Vector3(-1, 1, -1),
  new THREE.Vector3(1, 1, -1),
  new THREE.Vector3(-1, 1, 1),
  new THREE.Vector3(1, 1, 1),
];

type PmremInternals = {
  _renderer: THREE.WebGLRenderer;
  _lodMeshes: unknown[];
  _sigmas: number[];
  _blur: (rt: THREE.WebGLRenderTarget, lodIn: number, lodOut: number, sigma: number, poleAxis: THREE.Vector3) => void;
  _applyPMREM: (rt: THREE.WebGLRenderTarget) => void;
};

export function applyGaussianPrefilter(pmrem: THREE.PMREMGenerator) {
  const p = pmrem as unknown as PmremInternals;
  if (typeof p._blur !== "function" || typeof p._applyPMREM !== "function") return;
  const ggx = p._applyPMREM;
  p._applyPMREM = function (rt) {
    // _sigmas e _lodMeshes só existem depois que o fromScene aloca os alvos
    if (!Array.isArray(this._sigmas) || !Array.isArray(this._lodMeshes)) return ggx.call(this, rt);
    const auto = this._renderer.autoClear;
    this._renderer.autoClear = false;
    for (let i = 1; i < this._lodMeshes.length; i++) {
      const sigma = Math.sqrt(this._sigmas[i] ** 2 - this._sigmas[i - 1] ** 2);
      this._blur(rt, i - 1, i, sigma, BLUR_AXES[(i - 1) % BLUR_AXES.length]);
    }
    this._renderer.autoClear = auto;
  };
}
