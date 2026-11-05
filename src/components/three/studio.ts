/**
 * Estúdio de luz compartilhado pelos visualizadores 3D do site (a vista
 * explodida da home e os modelos da página do projeto): o ambiente que as peças
 * refletem, gerado no próprio navegador, sem baixar HDR de CDN.
 */
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type Studio = "light" | "dark";
type Vec3 = [number, number, number];

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

function applyGaussianPrefilter(pmrem: THREE.PMREMGenerator) {
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

/* ---------- estúdio: o ambiente que as peças refletem. O modelo é quase todo
              preto, então quem dá forma a ele são os reflexos ---------- */
export function useStudioEnvironment(studio: Studio) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const env = new THREE.Scene();
    const light = studio === "light";
    // sem luz na cena do ambiente, só material básico e emissivo aparecem
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: light ? 0x5d636e : 0x0a0c11 }),
    );
    room.scale.setScalar(14);
    env.add(room);
    const panel = (hex: number, power: number, w: number, h: number, pos: Vec3) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshStandardMaterial({
          color: 0x000000,
          emissive: new THREE.Color(hex),
          emissiveIntensity: power,
          side: THREE.DoubleSide,
        }),
      );
      m.position.fromArray(pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    if (light) {
      panel(0xffffff, 6.0, 8, 5, [-3.4, 4.6, 2.6]);
      panel(0xffffff, 2.4, 6, 6, [5.6, 1.2, -1.4]);
      panel(0xf2f5ff, 3.0, 9, 3, [0, 2.2, -5.8]);
      panel(0xffffff, 1.6, 10, 10, [0, 6.2, 0]);
    } else {
      panel(0xffffff, 7.0, 8, 5, [-3.4, 4.6, 2.6]);
      panel(0xc3d8ff, 2.0, 6, 6, [5.6, 1.2, -1.4]);
      panel(0xa8c6ff, 3.2, 9, 3, [0, 2.2, -5.8]);
      panel(0xffffff, 1.0, 10, 10, [0, 6.2, 0]);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    applyGaussianPrefilter(pmrem);
    const rt = pmrem.fromScene(env, 0.03);
    scene.environment = rt.texture;
    scene.environmentIntensity = light ? 0.75 : 0.85;
    return () => {
      rt.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene, studio]);
}
