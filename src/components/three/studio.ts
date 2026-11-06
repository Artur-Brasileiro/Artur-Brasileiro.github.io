/**
 * Estúdio de luz compartilhado pelos visualizadores 3D do site (a vista
 * explodida da home e os modelos da página do projeto): o ambiente que as peças
 * refletem, gerado no próprio navegador, sem baixar HDR de CDN.
 */
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { applyGaussianPrefilter } from "./pmrem";

export type Studio = "light" | "dark";
type Vec3 = [number, number, number];

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
