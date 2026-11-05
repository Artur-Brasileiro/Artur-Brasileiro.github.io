/**
 * ExplodedCanvas — a parte pesada da vista explodida: three.js, o estúdio de
 * luz, a montagem e a câmera. Só é baixada quando o ExplodedView entra em cena
 * (lazy), para o texto do hero não esperar ~250 KB de 3D.
 *
 * Nenhum nome de peça aparece aqui. O GLB marca cada peça com um `group` nos
 * extras do nó; o parts.json diz o que cada grupo é, para onde vai e quando.
 */
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { useStudioEnvironment, type Studio } from "./studio";
import { boxShift, EL_LIMIT, explosionFrame, fitDistance, seg, type DragState, type FitBox, type PartsConfig, type Shift } from "./explode";

type Vec3 = [number, number, number];

const DEFAULT_DIST: [number, number] = [2.6, 5.3];
const FOV = 42;
const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** elevação da câmera com o modelo montado (a mesma do início do lerp abaixo) */
const EL_START = 0.52;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;


type SceneProps = {
  cfg: PartsConfig;
  baseUrl: string;
  studio: Studio;
  zoom: number;
  progress: MutableRefObject<number>;
  drag: MutableRefObject<DragState>;
  shift: MutableRefObject<Shift | undefined>;
  /** caixa onde o modelo deve caber; quando existe, manda no enquadramento no lugar de `shift` */
  fit: MutableRefObject<((q: number) => FitBox | null) | undefined>;
  onProgress: (q: number) => void;
};

function Assembly({ cfg, baseUrl, studio, zoom, progress, drag, shift, fit, onProgress }: SceneProps) {
  const gltf = useLoader(GLTFLoader, baseUrl + cfg.model, (loader) => {
    (loader as GLTFLoader).setMeshoptDecoder(MeshoptDecoder);
  });
  const { camera, size } = useThree();
  useStudioEnvironment(studio);

  const { root, parts, offsets, radius, fullSpan, halfW0, halfH0 } = useMemo(() => {
    const byId = new Map(cfg.groups.map((g) => [g.id, g]));
    const root = gltf.scene.clone(true);
    const parts: { obj: THREE.Object3D; base: THREE.Vector3; vec: THREE.Vector3; stage: [number, number] }[] = [];
    root.traverse((o) => {
      // uma peça com vários materiais chega como Group de primitivas, então não
      // exigimos isMesh: os extras ficam no nó que o three criou para ela
      const id = (o.userData as { group?: string })?.group;
      if (!id) return;
      const g = byId.get(id);
      if (!g) {
        console.warn("grupo sem config em parts.json:", id);
        return;
      }
      const e = g.explode ?? [0, 0, 0];
      parts.push({
        obj: o,
        base: o.position.clone(),
        vec: new THREE.Vector3(e[0], e[2], -e[1]), // Blender Z-up -> glTF Y-up
        stage: g.stage ?? [0, 0],
      });
    });
    const box = new THREE.Box3().setFromObject(root);
    root.position.sub(box.getCenter(new THREE.Vector3()));
    // um deslocamento por peça, reaproveitado a cada quadro (sem alocar no useFrame)
    const offsets = parts.map((): Vec3 => [0, 0, 0]);
    const full = explosionFrame(
      parts.map((p): Vec3 => [p.vec.x, p.vec.y, p.vec.z]),
      0,
    );
    const sz = box.getSize(new THREE.Vector3());
    // meia-largura e meia-altura do conjunto montado como a câmera o vê: de
    // quina (a diagonal da planta) e de cima a ~30°. É o que precisa caber na
    // caixa; a esfera envolvente desperdiçaria espaço num objeto achatado
    const plan = Math.hypot(sz.x, sz.z) / 2;
    return {
      root,
      parts,
      offsets,
      radius: sz.length() * 0.5,
      fullSpan: full.span,
      halfW0: plan,
      halfH0: (sz.y / 2) * Math.cos(EL_START) + plan * Math.sin(EL_START),
    };
  }, [gltf, cfg]);

  // começa de onde o scroll já está: até o 3D chegar, o HUD andou com o scroll,
  // e partir de zero faria tudo voltar ao início por um instante
  const smooth = useRef(progress.current);
  const idle = useRef(0);
  const reported = useRef(-1);
  const center = useMemo(() => new THREE.Vector3(), []);
  const still = useMemo(prefersReducedMotion, []);

  useEffect(() => {
    camera.near = radius * 0.08;
    camera.far = radius * 40;
    camera.updateProjectionMatrix();
  }, [camera, radius]);

  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta);
    // suavização por tempo, não por quadro: igual em 30 ou 144 fps
    smooth.current += (progress.current - smooth.current) * (1 - Math.exp(-dt * 9));
    const q = smooth.current;

    parts.forEach((p, i) => {
      const k = seg(q, p.stage);
      p.obj.position.copy(p.base).addScaledVector(p.vec, k);
      const o = offsets[i];
      o[0] = p.vec.x * k;
      o[1] = p.vec.y * k;
      o[2] = p.vec.z * k;
    });

    // o enquadramento segue o tamanho real da explosão, não o scroll: as
    // camadas saem com easing e em trechos diferentes, então um lerp linear em
    // q deixava as keycaps saírem pelo topo no meio da animação
    const frame = explosionFrame(offsets, fullSpan);
    center.fromArray(frame.center);

    // a rotação ociosa cede de vez assim que o usuário arrasta
    if (!drag.current.touched && !still) idle.current += dt * 0.085;
    const dists = cfg.camera?.dist ?? DEFAULT_DIST;
    const az = -0.95 + q * 1.15 + drag.current.az + idle.current;
    drag.current.baseEl = THREE.MathUtils.lerp(EL_START, 0.34, q);
    const el = Math.max(-EL_LIMIT, Math.min(EL_LIMIT, drag.current.baseEl + drag.current.el));

    // Duas formas de enquadrar. Com caixa (celular): o modelo cabe inteiro no
    // retângulo livre da página, na largura e na altura, somando ao conjunto
    // montado o quanto a explosão já abriu. Sem caixa (desktop): distância pelo
    // parts.json e deslocamento ajustado à mão por quem usa o componente.
    const box = fit.current?.(q) ?? null;
    let dist: number;
    let sx: number;
    let sy: number;
    if (box) {
      const halfW = halfW0 + Math.hypot(frame.size[0], frame.size[2]) / 2;
      const halfH = halfH0 + frame.size[1] / 2;
      dist = zoom * fitDistance(halfW, halfH, box, size.width / size.height, TAN_HALF_FOV);
      [sx, sy] = boxShift(box);
    } else {
      dist = radius * zoom * THREE.MathUtils.lerp(dists[0], dists[1], frame.spread);
      const s = shift.current;
      [sx, sy] = typeof s === "function" ? s(q) : s ?? [0, 0];
    }
    camera.position.set(Math.cos(el) * Math.sin(az) * dist, Math.sin(el) * dist, Math.cos(el) * Math.cos(az) * dist).add(center);
    camera.lookAt(center);

    // desloca o centro de projeção sem mexer na órbita — o modelo anda na tela
    const persp = camera as THREE.PerspectiveCamera;
    if (sx === 0 && sy === 0) {
      if (persp.view?.enabled) persp.clearViewOffset();
    } else {
      persp.setViewOffset(size.width, size.height, -sx * size.width, -sy * size.height, size.width, size.height);
    }

    // o HUD só re-renderiza quando o progresso muda de verdade
    if (Math.abs(q - reported.current) > 0.0008) {
      reported.current = q;
      onProgress(q);
    }
  });

  return <primitive object={root} />;
}

export default function ExplodedCanvas({ active, ...props }: SceneProps & { active: boolean }) {
  const light = props.studio === "light";
  return (
    <Canvas
      className="!absolute inset-0 cursor-grab active:cursor-grabbing"
      // fora da tela não desenha: sem isso a cena seguia a 60 fps (DPR 2 no
      // celular) enquanto a pessoa lia o resto da página
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: FOV }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = light ? 1.0 : 0.92;
      }}
    >
      <directionalLight position={[-180, 260, 190]} intensity={1.5} />
      <directionalLight position={[220, 120, -90]} intensity={0.55} color="#dfe8ff" />
      <directionalLight position={[40, 90, -280]} intensity={0.85} color={light ? "#ffffff" : "#9fc2ff"} />
      <ambientLight intensity={light ? 0.55 : 0.35} color={light ? "#ffffff" : "#2a3042"} />
      {/* o GLB carrega dentro do canvas; o resto da página não espera por ele */}
      <Suspense fallback={null}>
        <Assembly {...props} />
      </Suspense>
    </Canvas>
  );
}
