/**
 * O pêndulo invertido em three.js puro: o modelo do CAD, peça por peça, movido
 * pela física de physics.ts com o controle do Arduino no meio.
 *
 * Como a cena da CNC: imperativa, sem React, com qualidade adaptativa e parada
 * quando sai da tela. A diferença é que aqui o aparelho nunca fica parado de
 * verdade (equilibrando, o carro corrige o tempo todo), então o laço roda
 * sempre que a cena está à vista e a simulação não está pausada.
 *
 * O visitante pode pegar a haste com o mouse e empurrar: vira um torque de mola
 * entre a haste e o ponteiro, que entra na física como uma mão de verdade. O
 * controle não sabe de nada disso; ele só sente o ângulo mudar e reage.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { applyGaussianPrefilter } from "@/components/three/pmrem";
import { energy, PendulumSim, wrap, type Mode } from "./physics.ts";
import { beltRibbon, cartOffset, IDLER, MOTOR_PULLEY, PIVOT, PULLEY_PITCH_R, XC0 } from "./rig.ts";
import { RUN_HZ, sampleRun, type Run } from "./run.ts";

/** Retângulo da área fixa onde o aparelho deve caber (frações, origem no canto superior esquerdo). */
export type FitBox = { x: number; y: number; w: number; h: number };
/** Home: para cada progresso da rolagem, a caixa e a direção da câmera (az, el em rad; az = −π/2 olha de frente). */
export type HomeFraming = (q: number) => { box: FitBox; az: number; el: number } | null;

type Scrub = {
  run: Run;
  /** progresso suavizado e o alvo (a rolagem) */
  q: number;
  target: number;
  reported: number;
  /** a corrida ocupa esta faixa da trilha; antes e depois o aparelho espera */
  window: [number, number];
  framing: HomeFraming;
  onProgress?: (q: number) => void;
  key: number;
  shownI: number;
};

export type ViewName = "geral" | "frente" | "carro" | "motor" | "esticador";
export type Quality = "high" | "medium" | "low";

/** o que a interface mostra; lido a ~15 Hz pelo componente */
export type Snapshot = {
  t: number;
  /** carro, m e m/s (0 = centro da faixa) */
  x: number;
  v: number;
  /** haste: rad e rad/s (0 = em pé) */
  th: number;
  w: number;
  /** energia normalizada: 0 = parada em pé, −1 = parada pendurada */
  E: number;
  mode: Mode;
  quedas: number;
  pegouEm: number | null;
  subidaDesde: number;
  running: boolean;
  grabbing: boolean;
};

export type SimEvent = { kind: "pegou" | "caiu"; t: number; after: number };

type Label = [string, string];

/* ---------- materiais ---------- */
const MAT_DEFS: Record<string, { color: number; roughness: number; metalness: number; envMapIntensity?: number }> = {
  pla: { color: 0x1d1f23, roughness: 0.6, metalness: 0, envMapIntensity: 0.4 },
  steel: { color: 0xd9dde2, roughness: 0.26, metalness: 0.92 },
  steelDark: { color: 0xa7adb4, roughness: 0.34, metalness: 0.88 },
  blackmetal: { color: 0x17181b, roughness: 0.42, metalness: 0.6, envMapIntensity: 0.6 },
  alu: { color: 0xe2e5e9, roughness: 0.36, metalness: 0.9 },
  motor: { color: 0x1a1b1e, roughness: 0.45, metalness: 0.35, envMapIntensity: 0.5 },
  belt: { color: 0x1f1c1a, roughness: 0.85, metalness: 0 },
};

/** "Cor por peça": uma cor por função, nas peças impressas (as do visualizador do projeto) */
const FUNC: Record<string, number> = {
  carro_encoder: 0xe8601c,
  garra_correia: 0xf0a050,
  cubo_pendulo: 0xd8283a,
  suporte_motor: 0x3a9a52,
  polia_motor_gt2_30d: 0x2f6fe0,
  esticador_base: 0x3a9a52,
  esticador_carro: 0x6cc07f,
  rolo_esticador: 0x2f6fe0,
  batente_trilho_a: 0xa24fc9,
  batente_trilho_b: 0xa24fc9,
};

const LABELS: Record<string, Label> = {
  carro_encoder: ["Carro do encoder", "Impresso · 4 × M3 no bloco · flange com rasgos em arco para o encoder"],
  garra_correia: ["Garra da correia", "Prende as duas pontas da GT2 por baixo do carro"],
  cubo_pendulo: ["Cubo do pêndulo", "Trava no chato do eixo do encoder e segura a haste"],
  suporte_motor: ["Suporte do motor", "A aba encosta no trilho e alinha a correia sem medir"],
  polia_motor_gt2_30d: ["Polia GT2 de 30 dentes", "Impressa · 60 mm de correia por volta"],
  esticador_base: ["Base do esticador", "Guia em rabo de andorinha a 45°"],
  esticador_carro: ["Carrinho do esticador", "Um M5 puxa o carrinho e dá tensão na correia"],
  rolo_esticador: ["Rolo do esticador", "Gira em 2 × rolamento 625ZZ"],
  batente_trilho_a: ["Batente", "Nas pontas do trilho · o carro nunca chega nele"],
  batente_trilho_b: ["Batente", "Nas pontas do trilho · o carro nunca chega nele"],
  ref_trilho: ["Trilho MGN15 · 500 mm", "412 mm livres entre os batentes"],
  ref_bloco: ["Bloco MGN15H", "Leva o carro, o encoder e o pêndulo"],
  ref_encoder: ["Encoder LPD3806-1000BM", "1000 pulsos → 4000 contagens por volta (0,09°)"],
  ref_motor: ["NEMA 17 · 17HS4401S", "Driver A4988 em 1/4 de passo: 13,3 passos por mm"],
  ref_haste: ["Haste de inox Ø6 × 500 mm", "110 g · centro de massa a 215 mm do eixo"],
  belt: ["Correia GT2 de 6 mm", "As duas pontas presas na garra, embaixo do carro"],
  board: ["Base de pinus", "O eixo do trilho fica a 30 mm da borda: a haste passa por fora"],
};

/** peças que andam com o carro, giram com a haste ou com a correia */
const CART = new Set(["carro_encoder", "garra_correia", "ref_bloco", "ref_encoder"]);
const SWING = new Set(["cubo_pendulo", "ref_haste"]);

/* ---------- madeira desenhada no navegador (a mesma receita da mesa da CNC) ---------- */
let woodCanvas: HTMLCanvasElement | null = null;
function paintWood() {
  const W = 512,
    H = 1024,
    c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#cf9c5c";
  g.fillRect(0, 0, W, H);
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 160; i++) {
    const x = rnd() * W,
      w = 0.6 + rnd() * 2.6,
      a = 0.06 + rnd() * 0.2,
      wob = 4 + rnd() * 14,
      ph = rnd() * 6;
    g.strokeStyle = `rgba(128,74,26,${a})`;
    g.lineWidth = w;
    g.beginPath();
    for (let y = 0; y <= H; y += 16) {
      const xx = x + Math.sin(y / 140 + ph) * wob;
      if (y) g.lineTo(xx, y);
      else g.moveTo(xx, y);
    }
    g.stroke();
  }
  return c;
}
function woodTexture(aniso: number, rotate: boolean) {
  const t = new THREE.CanvasTexture((woodCanvas ??= paintWood()));
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (rotate) {
    // o veio corre ao longo da tábua
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
  }
  return t;
}

function beltTexture() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 8;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2a2724";
  g.fillRect(0, 0, 32, 8);
  g.fillStyle = "#151311";
  g.fillRect(0, 0, 13, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** sombra suave no tampo: assenta o aparelho na mesa */
function softShadow(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, "rgba(40,28,16,0.36)");
  grad.addColorStop(0.6, "rgba(40,28,16,0.14)");
  grad.addColorStop(1, "rgba(40,28,16,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  m.renderOrder = -1;
  m.raycast = () => {};
  return m;
}

/* ---------- o GLB: baixado e decodificado uma vez por página ---------- */
type Gltf = Awaited<ReturnType<GLTFLoader["loadAsync"]>>;
const models = new Map<string, Promise<Gltf>>();
export function prefetchModel(url: string, onProgress?: (p: number) => void): Promise<Gltf> {
  let p = models.get(url);
  if (!p) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    p = loader.loadAsync(url, (e) => {
      if (e.lengthComputable && e.total) onProgress?.(e.loaded / e.total);
    });
    p.catch(() => models.delete(url));
    models.set(url, p);
  }
  return p;
}

/**
 * Uma vista: alvo, direção da câmera e distância. As vistas abertas (`fit`)
 * calculam a distância para caber a haste inteira em pé e pendurada, na
 * largura e na altura do palco.
 */
type View = { t: () => THREE.Vector3; o: THREE.Vector3; follow: boolean; fit?: "tudo" | "topo" };

export type SceneOptions = {
  quality: Quality;
  tip?: HTMLElement | null;
  onSnapshot?: (s: Snapshot) => void;
  onEvent?: (e: SimEvent) => void;
  onRunChange?: (running: boolean) => void;
};

/** histórico para o gráfico: 12 s a 60 Hz de tempo simulado */
export const HIST_N = 720;
export const HIST_DT = 1 / 60;

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** mesa (tampo neutro) e a tábua de pinus por cima, com a borda da frente alinhada */
const BOARD = { x0: -110, x1: 612, y0: -30, y1: 108, t: 18 };
const TABLE = { x0: -900, x1: 1400, y0: -30, y1: 820, t: 24 };

export class PenduloScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 5, 20000);
  private controls: OrbitControls;
  private container: HTMLElement;
  private opts: SceneOptions;
  private disposed = false;
  private resizeObs: ResizeObserver;

  readonly sim = new PendulumSim();

  private cart = new THREE.Group();
  private swing = new THREE.Group();
  private pulley = new THREE.Group();
  private roller = new THREE.Group();
  private sun: THREE.DirectionalLight;
  private beltMat: THREE.MeshStandardMaterial;
  private beltLen = 1;
  private pickables: THREE.Object3D[] = [];
  private plaMeshes: THREE.Mesh[] = [];
  private grabProxy: THREE.Mesh;
  private ready = false;

  /* rastro da ponta da haste */
  private trail: THREE.Line;
  /** anel com as posições, na ordem em que chegaram */
  private trailRing: Float32Array;
  private trailPos: Float32Array;
  private trailCol: Float32Array;
  private trailN = 150;
  private trailHead = 0;
  private trailCount = 0;
  private trailOn = true;
  private trailClock = 0;

  /* mão: elástico entre a haste e o ponteiro */
  private band: THREE.Line;
  private grab: null | { id: number; target: number; r: number; client: [number, number] } = null;
  private grabPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PIVOT.y);

  /** modo da home: a rolagem escolhe o instante da corrida gravada; sem órbita nem física ao vivo */
  private scrub: Scrub | null = null;
  /** o tampo da mesa: na home sai, e o aparelho fica sobre a folha quadriculada */
  private table: THREE.Mesh | null = null;
  private homeSets: Record<"wide" | "tall", { pts: THREE.Vector3[]; center: THREE.Vector3 }> | null = null;

  /* execução */
  private running = false;
  private speed = 1;
  private follow = false;

  /* histórico do gráfico (anel) */
  readonly hist = { t: new Float32Array(HIST_N), th: new Float32Array(HIST_N), x: new Float32Array(HIST_N), m: new Uint8Array(HIST_N), head: 0, count: 0 };
  private histClock = 0;

  /* câmera */
  private views: Record<ViewName, View>;
  private view: ViewName = "geral";
  private tween: null | { t0: THREE.Vector3; p0: THREE.Vector3; t1: THREE.Vector3; p1: THREE.Vector3; k: number } = null;
  private lastFollow: THREE.Vector3 | null = null;
  /** a pessoa já girou a câmera: mudar o tamanho do palco não reposiciona */
  private touchedCamera = false;

  /* laço */
  private raf = 0;
  private lastT = -1;
  private active = true;
  private needsRender = true;
  private uiTick = 0;
  private dprCap: number;
  private slowFrames = 0;
  private inLoop = false;

  /* tooltip */
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hover: { x: number; y: number } | null = null;
  private hoverQueued = false;
  private tap: { x: number; y: number; t: number; id: number } | null = null;
  private tipTimer = 0;

  constructor(container: HTMLElement, opts: SceneOptions) {
    this.container = container;
    this.opts = opts;
    this.dprCap = opts.quality === "high" ? 2 : opts.quality === "medium" ? 1.5 : 1;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: opts.quality !== "low", alpha: true, powerPreference: "high-performance" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.dprCap));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = opts.quality !== "low";
    r.shadowMap.type = THREE.PCFShadowMap;
    const canvas = r.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.outline = "none";
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Modelo 3D interativo do pêndulo invertido. Arraste a haste para empurrar; arraste o fundo para girar.");
    container.appendChild(canvas);

    // a mão tem prioridade sobre a órbita: este ouvinte é registrado antes dos controles
    canvas.addEventListener("pointerdown", this.onGrabDown);
    canvas.addEventListener("pointermove", this.onGrabMove);
    canvas.addEventListener("pointerup", this.onGrabUp);
    canvas.addEventListener("pointercancel", this.onGrabUp);

    try {
      const pm = new THREE.PMREMGenerator(r);
      applyGaussianPrefilter(pm);
      this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environmentIntensity = 0.85;
      pm.dispose();
    } catch {
      /* sem env map os metais ficam mais foscos, e só */
    }

    const cam = this.camera;
    cam.up.set(0, 0, 1);
    const c = (this.controls = new OrbitControls(cam, canvas));
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 120;
    c.maxDistance = 4200;
    c.maxPolarAngle = Math.PI * 0.6;
    c.addEventListener("change", () => this.wake());
    c.addEventListener("start", () => {
      this.tween = null;
      this.touchedCamera = true;
      this.hideTip();
      this.wake();
    });

    /* ---------- luz ---------- */
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 0.55));
    const sun = (this.sun = new THREE.DirectionalLight(0xffffff, 1.7));
    sun.position.set(250 - 420, -520, 1250);
    sun.target.position.set(250, 40, 0);
    sun.castShadow = r.shadowMap.enabled;
    const sm = opts.quality === "high" ? 2048 : 1024;
    sun.shadow.mapSize.set(sm, sm);
    Object.assign(sun.shadow.camera, { left: -700, right: 700, top: 700, bottom: -700, near: 200, far: 3000 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.8;
    sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xdfe7ff, 0.45);
    fill.position.set(900, -900, 300);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.35);
    rim.position.set(-600, 900, 500);
    this.scene.add(rim);

    /* ---------- mesa e tábua ---------- */
    const aniso = Math.min(8, r.capabilities.getMaxAnisotropy());
    const wood = woodTexture(aniso, true);
    const top = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.78 });
    const edge = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.8, color: 0xb08a62 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0, BOARD.t), [edge, edge, edge, edge, top, edge]);
    board.position.set((BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, -BOARD.t / 2);
    board.receiveShadow = true;
    board.castShadow = true;
    board.userData.label = LABELS.board;
    // o tampo quase na cor do fundo: a mesa conta onde fica a borda, sem roubar a cena
    const desk = new THREE.MeshStandardMaterial({ color: 0xebe8e1, roughness: 0.7 });
    const deskEdge = new THREE.MeshStandardMaterial({ color: 0xdedad2, roughness: 0.75 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(TABLE.x1 - TABLE.x0, TABLE.y1 - TABLE.y0, TABLE.t), [deskEdge, deskEdge, deskEdge, deskEdge, desk, deskEdge]);
    table.position.set((TABLE.x0 + TABLE.x1) / 2, (TABLE.y0 + TABLE.y1) / 2, -BOARD.t - TABLE.t / 2);
    table.receiveShadow = true;
    const shadow = softShadow((BOARD.x1 - BOARD.x0) * 1.35, (BOARD.y1 - BOARD.y0) * 2.2);
    shadow.position.set((BOARD.x0 + BOARD.x1) / 2 + 20, (BOARD.y0 + BOARD.y1) / 2 + 30, -BOARD.t + 0.4);
    this.table = table;
    this.scene.add(table, board, shadow);
    this.pickables.push(board);

    /* ---------- grupos móveis ---------- */
    this.scene.add(this.cart, this.pulley, this.roller);
    this.cart.add(this.swing);
    this.swing.position.set(XC0, PIVOT.y, PIVOT.z);
    this.pulley.position.set(MOTOR_PULLEY.x, 0, MOTOR_PULLEY.z);
    this.roller.position.set(IDLER.x, 0, IDLER.z);

    /* ---------- correia (gerada aqui; anda com o carro) ---------- */
    this.beltMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: beltTexture(), roughness: 0.85, side: THREE.DoubleSide });
    const rb = beltRibbon();
    this.beltLen = rb.length;
    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.BufferAttribute(rb.position, 3));
    bg.setAttribute("uv", new THREE.BufferAttribute(rb.uv, 2));
    bg.setIndex(rb.index);
    bg.computeVertexNormals();
    const belt = new THREE.Mesh(bg, this.beltMat);
    belt.castShadow = true;
    belt.userData.label = LABELS.belt;
    this.scene.add(belt);
    this.pickables.push(belt);

    /* ---------- área de pegar a haste: um cilindro invisível mais gordo que ela ---------- */
    const proxyGeo = new THREE.CylinderGeometry(16, 16, 500, 10, 1, false);
    proxyGeo.rotateX(Math.PI / 2); // eixo do cilindro em z
    proxyGeo.translate(0, 0, 250 - 35);
    this.grabProxy = new THREE.Mesh(proxyGeo, new THREE.MeshBasicMaterial({ visible: false }));
    this.swing.add(this.grabProxy);

    /* ---------- rastro da ponta ---------- */
    this.trailRing = new Float32Array(this.trailN * 3);
    this.trailPos = new Float32Array(this.trailN * 3);
    this.trailCol = new Float32Array(this.trailN * 4);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(this.trailPos, 3));
    tg.setAttribute("color", new THREE.BufferAttribute(this.trailCol, 4));
    tg.setDrawRange(0, 0);
    this.trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }));
    this.trail.frustumCulled = false;
    this.trail.raycast = () => {};
    this.scene.add(this.trail);

    /* ---------- elástico da mão ---------- */
    const bandGeo = new THREE.BufferGeometry();
    bandGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    this.band = new THREE.Line(bandGeo, new THREE.LineBasicMaterial({ color: 0x94600f, transparent: true, opacity: 0.9, depthTest: false }));
    this.band.renderOrder = 10;
    this.band.visible = false;
    this.band.frustumCulled = false;
    this.band.raycast = () => {};
    this.scene.add(this.band);

    /* ---------- vistas (z para cima; a frente do aparelho olha para −y) ---------- */
    const cartX = () => XC0 + this.cart.position.x;
    this.views = {
      geral: { t: () => new THREE.Vector3(258, -20, 140), o: new THREE.Vector3(0.36, -0.9, 0.28), follow: false, fit: "topo" },
      frente: { t: () => new THREE.Vector3(255, -40, 45), o: new THREE.Vector3(0, -1, 0.06), follow: false, fit: "tudo" },
      carro: { t: () => new THREE.Vector3(cartX(), -25, 52), o: new THREE.Vector3(210, -300, 150), follow: true },
      motor: { t: () => new THREE.Vector3(-25, 40, 30), o: new THREE.Vector3(-210, -250, 190), follow: false },
      esticador: { t: () => new THREE.Vector3(528, 35, 28), o: new THREE.Vector3(230, -240, 180), follow: false },
    };
    this.setView("geral", true);

    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("pointerdown", this.onTapDown);
    canvas.addEventListener("pointerup", this.onTapUp);
    canvas.addEventListener("webglcontextlost", this.onContextLost);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    this.resize();
    this.wake();
  }

  /* ---------- carga do modelo ---------- */

  async load(url: string, onProgress?: (p: number) => void) {
    const gltf = await prefetchModel(url, onProgress);
    if (this.disposed) return;

    const mats: Record<string, THREE.MeshStandardMaterial> = {};
    const material = (key: string) =>
      (mats[key] ??= (() => {
        const d = MAT_DEFS[key] ?? MAT_DEFS.pla;
        return new THREE.MeshStandardMaterial({ color: d.color, roughness: d.roughness, metalness: d.metalness, envMapIntensity: d.envMapIntensity ?? 1 });
      })());
    // glTF (Y para cima) de volta para os eixos do CAD (Z para cima)
    const toZUp = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    const M = new THREE.Matrix4();
    const N = new THREE.Matrix3();
    const v = new THREE.Vector3();
    gltf.scene.updateMatrixWorld(true);

    gltf.scene.traverse((o) => {
      const src = o as THREE.Mesh;
      if (!src.isMesh) return;
      // a peça pode ter várias primitivas (encoder, motor): os extras ficam no nó pai
      const owner = src.userData.part ? src : src.parent;
      const part = (owner?.userData as { part?: string; belt?: boolean } | undefined)?.part;
      if (!part || owner!.userData.belt) return;
      M.multiplyMatrices(toZUp, src.matrixWorld);
      N.getNormalMatrix(M);
      const sp = src.geometry.getAttribute("position");
      const sn = src.geometry.getAttribute("normal");
      const pos = new Float32Array(sp.count * 3);
      const nrm = new Float32Array(sp.count * 3);
      for (let i = 0; i < sp.count; i++) {
        v.fromBufferAttribute(sp, i).applyMatrix4(M);
        pos[i * 3] = v.x;
        pos[i * 3 + 1] = v.y;
        pos[i * 3 + 2] = v.z;
        if (sn) {
          v.fromBufferAttribute(sn, i).applyMatrix3(N).normalize();
          nrm[i * 3] = v.x;
          nrm[i * 3 + 1] = v.y;
          nrm[i * 3 + 2] = v.z;
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
      if (src.geometry.index) g.setIndex(src.geometry.index.clone());
      g.computeBoundingSphere();

      const matKey = (src.material as THREE.Material).name || "pla";
      const isPla = matKey === "pla";
      const m = new THREE.Mesh(g, isPla ? material("pla").clone() : material(matKey));
      m.name = part;
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.label = LABELS[part] ?? [part, ""];

      let parent: THREE.Object3D = this.scene;
      const at = (grp: THREE.Object3D) => {
        parent = grp;
        m.position.set(-grp.position.x, -grp.position.y, -grp.position.z);
      };
      if (SWING.has(part)) at(this.swing);
      else if (CART.has(part)) parent = this.cart;
      else if (part === "polia_motor_gt2_30d") at(this.pulley);
      else if (part === "rolo_esticador") at(this.roller);
      parent.add(m);
      this.pickables.push(m);
      if (isPla) {
        m.userData.funcColor = FUNC[part] ?? 0x6b7280;
        m.userData.realColor = (m.material as THREE.MeshStandardMaterial).color.getHex();
        this.plaMeshes.push(m);
      }
    });

    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      /* compila no primeiro quadro */
    }
    if (this.disposed) return;
    this.ready = true;
    this.applyPose();
    if (this.scrub) {
      // a home: a pose e a câmera vêm da rolagem
      this.scrub.key = -1;
      this.scrub.shownI = -1;
    } else this.setView(this.view, true);
    this.wake();
  }

  /* ---------- pose: a simulação vira posição das peças ---------- */

  private applyPose() {
    const s = this.sim.s;
    const dx = cartOffset(s.x);
    this.cart.position.x = dx;
    this.swing.rotation.y = this.sim.theta;
    // a correia anda com o carro: o ramo de baixo vai preso nele
    const travel = dx;
    this.beltMat.map!.offset.x = -travel / 2;
    this.pulley.rotation.y = -travel / PULLEY_PITCH_R;
    this.roller.rotation.y = -travel / (IDLER.r + 0.7);
    this.needsRender = true;
  }

  /** ponta da haste no mundo (mm) */
  private tipWorld(out: THREE.Vector3) {
    const th = this.sim.theta;
    const L = 500 - 35;
    return out.set(XC0 + cartOffset(this.sim.s.x) + Math.sin(th) * L, PIVOT.y, PIVOT.z + Math.cos(th) * L);
  }

  private pushTrail() {
    const p = this.tipWorld(new THREE.Vector3());
    const i = this.trailHead;
    this.trailRing.set([p.x, p.y - 0.5, p.z], i * 3);
    this.trailHead = (i + 1) % this.trailN;
    this.trailCount = Math.min(this.trailN, this.trailCount + 1);
  }

  /** o anel vira uma linha em ordem, do mais velho (transparente) ao mais novo */
  private refreshTrail() {
    const n = this.trailCount;
    const g = this.trail.geometry;
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const col = g.getAttribute("color") as THREE.BufferAttribute;
    const P = pos.array as Float32Array,
      C = col.array as Float32Array;
    const start = (this.trailHead - n + this.trailN) % this.trailN;
    // ouro do site (#c99a4b) em linear
    const [r, gg, b] = [0.584, 0.323, 0.07];
    const R = this.trailRing;
    for (let k = 0; k < n; k++) {
      const j = (start + k) % this.trailN;
      P[k * 3] = R[j * 3];
      P[k * 3 + 1] = R[j * 3 + 1];
      P[k * 3 + 2] = R[j * 3 + 2];
      const a = Math.pow((k + 1) / n, 1.6) * 0.95;
      C.set([r, gg, b, a], k * 4);
    }
    g.setDrawRange(0, this.trailOn ? n : 0);
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  private recordHist() {
    const h = this.hist,
      s = this.sim.s;
    const i = h.head;
    h.t[i] = s.t;
    h.th[i] = this.sim.theta;
    h.x[i] = s.x;
    h.m[i] = s.mode === "equilibrio" ? 2 : s.mode === "subindo" ? 1 : 0;
    h.head = (i + 1) % HIST_N;
    h.count = Math.min(HIST_N, h.count + 1);
  }

  /** avança a simulação; devolve se algo se moveu */
  private tick(dtReal: number): boolean {
    if (!this.running) return false;
    const dt = Math.min(0.05, dtReal) * this.speed;
    if (dt <= 0) return false;

    // mão: torque de mola-amortecedor entre a haste e o ponteiro
    if (this.grab) {
      const th = this.sim.theta;
      const err = wrap(this.grab.target - th);
      const k = 0.55,
        c = 0.05,
        cap = 0.7;
      this.sim.handTorque = Math.max(-cap, Math.min(cap, k * err - c * this.sim.s.w));
    } else this.sim.handTorque = 0;

    // a física corre em fatias de 1/60 s para o histórico e o rastro sairem regulares
    let left = dt;
    while (left > 1e-9) {
      const h = Math.min(left, HIST_DT - this.histClock);
      this.sim.advance(h);
      this.histClock += h;
      left -= h;
      if (this.histClock >= HIST_DT - 1e-9) {
        this.histClock = 0;
        this.recordHist();
        this.pushTrail();
      }
    }
    for (const e of this.sim.drainEvents()) {
      const s = this.sim.s;
      if (e === "pegou") this.opts.onEvent?.({ kind: "pegou", t: s.t, after: s.t - s.subidaDesde });
      else this.opts.onEvent?.({ kind: "caiu", t: s.t, after: 0 });
    }
    this.applyPose();
    this.refreshTrail();
    return true;
  }

  /* ---------- câmera ---------- */

  private distK() {
    return Math.max(1, Math.pow(1.45 / this.camera.aspect, 0.7));
  }

  /** a faixa vertical livre do palco, em fração da altura (os botões ocupam ~92 px no topo) */
  private freeBox() {
    const H = this.container.clientHeight || 600;
    const top = Math.min(0.3, 96 / H),
      bottom = Math.min(0.1, 30 / H);
    return { y: top, h: 1 - top - bottom };
  }

  /** desloca o centro de projeção para o meio da área livre (só nas vistas abertas) */
  private applyViewShift(V: View) {
    const cam = this.camera;
    const W = this.container.clientWidth,
      H = this.container.clientHeight;
    if (!V.fit || !W || !H) {
      if (cam.view?.enabled) cam.clearViewOffset();
      return;
    }
    const b = this.freeBox();
    const sy = b.y + b.h / 2 - 0.5;
    cam.setViewOffset(W, H, 0, -sy * H, W, H);
  }

  /**
   * Pontos que as vistas abertas precisam mostrar: a tábua e o círculo que a
   * ponta da haste varre, com o carro nas duas pontas da faixa de trabalho.
   */
  private fitPts = (maxAng: number, xm: number, lowest: number) => {
    const pts: THREE.Vector3[] = [];
    for (const x of [BOARD.x0, BOARD.x1]) for (const y of [BOARD.y0, BOARD.y1]) for (const z of [-BOARD.t, 0]) pts.push(new THREE.Vector3(x, y, z));
    for (const sx of [-1, 1]) {
      const px = XC0 + cartOffset(sx * xm);
      for (let k = 0; k <= 24; k++) {
        const a = -maxAng + (2 * maxAng * k) / 24;
        pts.push(new THREE.Vector3(px + Math.sin(a) * 468, PIVOT.y, Math.max(lowest, PIVOT.z + Math.cos(a) * 468)));
      }
    }
    return pts;
  };
  /**
   * "tudo": o círculo inteiro que a ponta varre, com o carro nas pontas da faixa.
   * "topo": a haste em pé (±35°) e um pedaço dela pendurada — é como ela passa
   * quase todo o tempo; na subida as pontas dos arcos podem sair do quadro.
   */
  private fitSets = {
    tudo: this.fitPts(Math.PI, 0.165, -Infinity),
    topo: [...this.fitPts(0.6, 0.1, -Infinity), new THREE.Vector3(XC0, PIVOT.y, PIVOT.z - 240)],
  };

  /**
   * Onde a câmera fica para uma vista. Nas abertas, a distância exata para
   * todos os pontos caberem: cada um, visto da direção da câmera, pede uma
   * distância mínima na largura e na altura (os mais perto da câmera pedem mais).
   */
  private viewOffset(V: View) {
    if (!V.fit) return V.o.clone().multiplyScalar(this.distK());
    const cam = this.camera;
    const dir = V.o.clone().normalize();
    const fwd = dir.clone().negate();
    const right = new THREE.Vector3().crossVectors(fwd, cam.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd);
    // o modelo cabe na área livre do palco, abaixo dos botões de vista e do modo
    const box = this.freeBox();
    const tanY = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * box.h;
    const tanX = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect;
    const c = V.t();
    const MX = 1.06,
      MY = 1.04;
    let d = 0;
    const q = new THREE.Vector3();
    for (const p of this.fitSets[V.fit]) {
      q.copy(p).sub(c);
      const z = q.dot(dir);
      d = Math.max(d, z + (Math.abs(q.dot(right)) * MX) / tanX, z + (Math.abs(q.dot(up)) * MY) / tanY);
    }
    return dir.multiplyScalar(d);
  }

  setView(name: ViewName, instant = false) {
    this.touchedCamera = false;
    this.view = name;
    const V = this.views[name],
      t = V.t(),
      p = t.clone().add(this.viewOffset(V));
    this.applyViewShift(V);
    if (instant || reduceMotion()) {
      this.controls.target.copy(t);
      this.camera.position.copy(p);
      this.controls.update();
      this.tween = null;
    } else this.tween = { t0: this.controls.target.clone(), p0: this.camera.position.clone(), t1: t, p1: p, k: 0 };
    this.lastFollow = t.clone();
    this.follow = V.follow;
    this.wake();
  }

  private cameraStep(dt: number): boolean {
    const V = this.views[this.view];
    if (this.tween) {
      const tw = this.tween;
      tw.k = Math.min(1, Math.max(0, tw.k + dt / 0.9));
      const e = tw.k < 0.5 ? 4 * tw.k ** 3 : 1 - (-2 * tw.k + 2) ** 3 / 2;
      if (V.follow) {
        const t = V.t();
        tw.t1.copy(t);
        tw.p1.copy(t).add(this.viewOffset(V));
      }
      this.controls.target.lerpVectors(tw.t0, tw.t1, e);
      this.camera.position.lerpVectors(tw.p0, tw.p1, e);
      if (tw.k >= 1) {
        this.tween = null;
        this.lastFollow = this.controls.target.clone();
      }
      return true;
    }
    if (this.follow && this.lastFollow) {
      const t = V.t(),
        d = t.clone().sub(this.lastFollow);
      this.lastFollow = t;
      if (d.lengthSq() > 1e-6) {
        this.controls.target.add(d);
        this.camera.position.add(d);
        return true;
      }
    }
    return false;
  }

  /* ---------- laço ---------- */

  private wake = () => {
    this.needsRender = true;
    if (this.inLoop || this.raf || this.disposed || !this.active) return;
    this.lastT = -1;
    this.raf = requestAnimationFrame(this.loop);
  };

  private loop = (now: number) => {
    this.raf = 0;
    if (this.disposed || !this.active) return;
    this.inLoop = true;
    try {
      this.step(now);
    } finally {
      this.inLoop = false;
    }
  };

  private step(now: number) {
    const raw = this.lastT < 0 ? 1 / 60 : (now - this.lastT) / 1000;
    this.lastT = now;
    let busy = false;
    if (this.ready && this.scrub) {
      busy = this.scrubStep(raw);
    } else if (this.ready) {
      busy = this.tick(raw) || busy;
      busy = this.cameraStep(raw) || busy;
      this.updateBand();
      if ((this.uiTick++ & 3) === 0 || !busy) this.emitSnapshot();
    }
    if (!this.scrub && this.controls.update()) busy = true;
    if (busy) this.needsRender = true;
    if (this.needsRender) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
      this.adapt(raw, busy);
    }
    if (busy || this.needsRender || this.running) this.raf = requestAnimationFrame(this.loop);
    else this.emitSnapshot();
  }

  private adapt(raw: number, busy: boolean) {
    if (!busy || raw <= 0 || raw > 0.25) return;
    if (raw > 0.038) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames < 24) return;
    this.slowFrames = 0;
    const r = this.renderer;
    const dpr = r.getPixelRatio();
    if (dpr > 1.01) {
      r.setPixelRatio(Math.max(1, dpr - 0.25));
      this.resize();
    } else if (r.shadowMap.enabled && this.sun.shadow.mapSize.x > 512) {
      this.sun.shadow.mapSize.set(512, 512);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    } else if (r.shadowMap.enabled) {
      r.shadowMap.enabled = false;
      this.sun.castShadow = false;
      this.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        for (const x of Array.isArray(m) ? m : m ? [m] : []) x.needsUpdate = true;
      });
    }
  }

  private emitSnapshot() {
    const s = this.sim.s;
    const th = this.sim.theta;
    this.opts.onSnapshot?.({
      t: s.t,
      x: s.x,
      v: s.v,
      th,
      w: s.w,
      E: energy(th, s.w),
      mode: s.mode,
      quedas: s.quedas,
      pegouEm: s.pegouEm,
      subidaDesde: s.subidaDesde,
      running: this.running,
      grabbing: !!this.grab,
    });
  }

  private resize() {
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = this.scrub ? 30 : w / h < 1.25 ? 40 : 32;
    this.camera.updateProjectionMatrix();
    if (this.scrub) this.scrub.key = -1;
    else if (!this.touchedCamera) this.setView(this.view, true);
    this.wake();
  }

  /* ---------- a mão do visitante ---------- */

  private rayFrom(clientX: number, clientY: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - r.left) / r.width) * 2 - 1, (-(clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.pointer, this.camera);
    return this.ray;
  }

  /** ângulo (0 = em pé) que aponta do eixo para o ponteiro, no plano da haste */
  private angleAt(clientX: number, clientY: number): { th: number; r: number } | null {
    const ray = this.rayFrom(clientX, clientY);
    const hit = ray.ray.intersectPlane(this.grabPlane, new THREE.Vector3());
    if (!hit) return null;
    const px = XC0 + this.cart.position.x;
    const dx = hit.x - px,
      dz = hit.z - PIVOT.z;
    return { th: Math.atan2(dx, dz), r: Math.hypot(dx, dz) };
  }

  private onGrabDown = (e: PointerEvent) => {
    if (!this.ready || this.scrub || this.grab || (e.pointerType === "mouse" && e.button !== 0)) return;
    const ray = this.rayFrom(e.clientX, e.clientY);
    if (!ray.intersectObject(this.grabProxy, false).length) return;
    const a = this.angleAt(e.clientX, e.clientY);
    if (!a) return;
    // a órbita não recebe este gesto
    e.stopImmediatePropagation();
    e.preventDefault();
    this.renderer.domElement.setPointerCapture(e.pointerId);
    if (!this.running) this.play();
    this.grab = { id: e.pointerId, target: this.sim.theta, r: Math.max(60, Math.min(465, a.r)), client: [e.clientX, e.clientY] };
    this.hideTip();
    this.renderer.domElement.style.cursor = "grabbing";
    this.wake();
  };

  private onGrabMove = (e: PointerEvent) => {
    if (!this.grab) {
      if (e.pointerType === "mouse" && !e.buttons && this.ready && !this.scrub) {
        const over = this.rayFrom(e.clientX, e.clientY).intersectObject(this.grabProxy, false).length > 0;
        this.renderer.domElement.style.cursor = over ? "grab" : "";
      }
      return;
    }
    if (e.pointerId !== this.grab.id) return;
    e.stopImmediatePropagation();
    const a = this.angleAt(e.clientX, e.clientY);
    if (a) {
      this.grab.target = a.th;
      this.grab.r = Math.max(60, Math.min(465, a.r));
    }
    this.grab.client = [e.clientX, e.clientY];
    this.wake();
  };

  private onGrabUp = (e: PointerEvent) => {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    e.stopImmediatePropagation();
    this.grab = null;
    this.sim.handTorque = 0;
    this.band.visible = false;
    this.renderer.domElement.style.cursor = "";
    try {
      this.renderer.domElement.releasePointerCapture(e.pointerId);
    } catch {
      /* já solto */
    }
    this.wake();
  };

  /** o elástico vai do ponto da haste até onde o ponteiro está */
  private updateBand() {
    if (!this.grab) {
      if (this.band.visible) {
        this.band.visible = false;
        this.needsRender = true;
      }
      return;
    }
    const th = this.sim.theta,
      r = this.grab.r;
    const px = XC0 + this.cart.position.x;
    const a = this.angleAt(this.grab.client[0], this.grab.client[1]);
    const p = this.band.geometry.getAttribute("position") as THREE.BufferAttribute;
    const tx = a ? px + Math.sin(a.th) * r : px,
      tz = a ? PIVOT.z + Math.cos(a.th) * r : PIVOT.z;
    (p.array as Float32Array).set([px + Math.sin(th) * r, PIVOT.y - 4, PIVOT.z + Math.cos(th) * r, tx, PIVOT.y - 4, tz]);
    p.needsUpdate = true;
    this.band.visible = true;
    this.needsRender = true;
  }

  /* ---------- API para a interface ---------- */

  setActive(on: boolean) {
    if (this.active === on) return;
    this.active = on;
    if (on) this.wake();
    else if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.opts.onRunChange?.(true);
    this.wake();
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    this.opts.onRunChange?.(false);
    this.wake();
  }

  /** como ligar a fonte: carro no batente do motor, haste pendurada e parada */
  restart() {
    this.sim.reset();
    this.hist.head = this.hist.count = 0;
    this.trailHead = this.trailCount = 0;
    this.histClock = 0;
    this.applyPose();
    this.refreshTrail();
    this.play();
    this.emitSnapshot();
  }

  /** um tapa na haste, em rad/s (+ empurra o topo para o lado do esticador) */
  kick(dw: number) {
    this.sim.kick(dw);
    if (!this.running) this.play();
    this.wake();
  }

  /** desliga o controle (o carro freia e fica) ou religa (o firmware volta a subir de onde está) */
  setControl(on: boolean) {
    this.sim.setControl(on);
    this.wake();
    this.emitSnapshot();
  }

  setSpeed(s: number) {
    this.speed = s;
  }

  setTrail(on: boolean) {
    this.trailOn = on;
    this.refreshTrail();
    this.wake();
  }

  setColors(on: boolean) {
    for (const m of this.plaMeshes) (m.material as THREE.MeshStandardMaterial).color.setHex(on ? m.userData.funcColor : m.userData.realColor);
    this.wake();
  }

  setXray(on: boolean) {
    for (const m of this.plaMeshes) {
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.transparent = on;
      mat.opacity = on ? 0.25 : 1;
      mat.depthWrite = !on;
      mat.needsUpdate = true;
      m.castShadow = !on;
    }
    this.wake();
  }

  /* ---------- home: a rolagem liga o pêndulo ---------- */

  /**
   * Liga o modo da home: a corrida gravada (run.ts) vira uma linha do tempo e
   * a rolagem escolhe o instante. Ir e voltar não simula nada — só lê a gravação.
   */
  enterScrub(run: Run, framing: HomeFraming, opts: { window?: [number, number]; onProgress?: (q: number) => void } = {}) {
    this.pause();
    this.scrub = { run, q: 0, target: 0, reported: -1, window: opts.window ?? [0, 1], framing, onProgress: opts.onProgress, key: -1, shownI: -1 };
    this.controls.enabled = false;
    if (this.table) this.table.visible = false;
    this.setTouchMode("page");
    this.collectHomePoints(run);
    this.resize();
    this.wake();
  }

  /** o progresso da rolagem, de 0 a 1; a cena chega lá suavizando */
  scrubTo(q: number, instant = false) {
    const s = this.scrub;
    if (!s) return;
    s.target = Math.min(1, Math.max(0, q));
    if (instant) s.q = s.target;
    if (Math.abs(s.target - s.q) > 1e-5 || instant) this.wake();
  }

  /** algo do enquadramento mudou (arrasto, caixa): refaz a câmera */
  reframe() {
    if (this.scrub) this.scrub.key = -1;
    this.wake();
  }

  /**
   * Pontos que a home precisa mostrar: a tábua e o círculo da ponta da haste
   * em toda a faixa que o carro percorre na corrida. Embaixo, a haste
   * pendurada pode passar um pouco da caixa: é só no começo.
   */
  private collectHomePoints(run: Run) {
    let x0 = Infinity,
      x1 = -Infinity;
    for (let i = 0; i < run.x.length; i++) {
      x0 = Math.min(x0, run.x[i]);
      x1 = Math.max(x1, run.x[i]);
    }
    const set = (maxAng: number, lowest: number) => {
      const pts: THREE.Vector3[] = [];
      for (const x of [BOARD.x0, BOARD.x1]) for (const y of [BOARD.y0, BOARD.y1]) for (const z of [-BOARD.t, 0]) pts.push(new THREE.Vector3(x, y, z));
      for (const xm of [x0, x1]) {
        const px = XC0 + cartOffset(xm);
        for (let k = 0; k <= 24; k++) {
          const a = -maxAng + (2 * maxAng * k) / 24;
          pts.push(new THREE.Vector3(px + Math.sin(a) * 468, PIVOT.y, Math.max(lowest, PIVOT.z + Math.cos(a) * 468)));
        }
        pts.push(new THREE.Vector3(px, PIVOT.y, lowest));
      }
      const center = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
      return { pts: pts.map((p) => p.sub(center)), center };
    };
    // caixa deitada: o círculo inteiro cabe; em pé (celular), a haste em pé
    // manda e os arcos da subida podem passar das laterais
    this.homeSets = { wide: set(Math.PI, PIVOT.z - 300), tall: set(0.3, PIVOT.z - 200) };
  }

  private scrubStep(dt: number): boolean {
    const s = this.scrub!;
    let busy = false;
    const d = s.target - s.q;
    if (Math.abs(d) < 1e-4 || reduceMotion()) s.q = s.target;
    else {
      // suavização por tempo, não por quadro: igual em 30 ou 144 fps
      s.q += d * (1 - Math.exp(-Math.min(0.1, dt) * 9));
      busy = true;
    }
    const q = s.q;
    const [w0, w1] = s.window;
    const u = Math.min(1, Math.max(0, (q - w0) / (w1 - w0)));
    const t = u * s.run.duration;
    const m = sampleRun(s.run, t);
    const key = Math.round(t * 1000);
    if (key !== s.shownI) {
      s.shownI = key;
      const st = this.sim.s;
      st.x = m.x;
      st.phi = m.th + Math.PI;
      this.applyPose();
      this.homeTrail(m.i, t);
    }
    if (s.key !== q) {
      s.key = q;
      this.frameHome(q);
      this.needsRender = true;
    }
    if (Math.abs(q - s.reported) > 0.0008 || (q === s.target && s.reported !== q)) {
      s.reported = q;
      s.onProgress?.(q);
    }
    return busy;
  }

  /** rastro da ponta: o último 1,2 s da gravação até o instante atual */
  private homeTrail(i: number, t: number) {
    const r = this.scrub!.run;
    const g = this.trail.geometry;
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const col = g.getAttribute("color") as THREE.BufferAttribute;
    const P = pos.array as Float32Array,
      C = col.array as Float32Array;
    const span = Math.round(1.2 * RUN_HZ);
    const step = Math.max(1, Math.ceil(span / (this.trailN - 1)));
    const i0 = Math.max(0, i - span);
    let n = 0;
    const put = (x: number, th: number) => {
      P[n * 3] = XC0 + cartOffset(x) + Math.sin(th) * 465;
      P[n * 3 + 1] = PIVOT.y - 0.5;
      P[n * 3 + 2] = PIVOT.z + Math.cos(th) * 465;
      n++;
    };
    for (let k = i0; k <= i && n < this.trailN - 1; k += step) put(r.x[k], r.th[k]);
    const m = sampleRun(r, t);
    put(m.x, m.th);
    const [cr, cg, cb] = [0.584, 0.323, 0.07];
    for (let k = 0; k < n; k++) C.set([cr, cg, cb, Math.pow((k + 1) / n, 1.6) * 0.9], k * 4);
    // equilibrando quase parado, o rastro vira um ponto: some
    g.setDrawRange(0, this.trailOn && n > 1 ? n : 0);
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  /**
   * Distância exata para todos os pontos caberem na caixa: cada um, visto da
   * direção da câmera, pede uma distância mínima na largura e na altura. Depois
   * o centro de projeção vai para o meio da caixa (o mesmo cálculo da CNC).
   */
  private frameHome(q: number) {
    const fr = this.scrub?.framing(q);
    if (!fr || !this.homeSets) return;
    const { box, az, el } = fr;
    const cam = this.camera;
    const W = this.container.clientWidth,
      H = this.container.clientHeight;
    // o círculo inteiro da haste só cabe com folga numa caixa de desktop; no
    // celular ele encolhia o aparelho a ~1/3 da largura, então lá manda a tábua
    // e a haste perto de em pé (os arcos da subida podem sair da caixa: o canvas é a tela toda)
    // (celular deitado tem caixa larga, mas baixa: também fica no compacto)
    const wide = box.w * W >= 640 && box.h * H >= 360 && (box.w * W) / (box.h * H || 1) >= 0.9;
    const { pts, center } = this.homeSets[wide ? "wide" : "tall"];
    const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el));
    const fwd = dir.clone().negate();
    const right = new THREE.Vector3().crossVectors(fwd, cam.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd);
    const tanY = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const tanX = tanY * cam.aspect;
    const MARGIN = 1.04;
    let dist = 0;
    for (const p of pts) {
      const z = p.dot(dir);
      dist = Math.max(dist, z + (Math.abs(p.dot(right)) * MARGIN) / (tanX * box.w), z + (Math.abs(p.dot(up)) * MARGIN) / (tanY * box.h));
    }
    cam.position.copy(center).addScaledVector(dir, dist);
    cam.lookAt(center);
    cam.near = Math.max(5, dist * 0.15);
    cam.far = dist * 6;
    const sx = box.x + box.w / 2 - 0.5,
      sy = box.y + box.h / 2 - 0.5;
    if (Math.abs(sx) < 1e-4 && Math.abs(sy) < 1e-4) cam.clearViewOffset();
    else cam.setViewOffset(W, H, -sx * W, -sy * H, W, H);
    cam.updateProjectionMatrix();
  }

  /** muda a cena de lugar na página sem recriá-la */
  attach(container: HTMLElement) {
    if (this.disposed || container === this.container) return;
    this.resizeObs.unobserve(this.container);
    this.container = container;
    container.appendChild(this.renderer.domElement);
    this.resizeObs.observe(container);
    this.resize();
  }

  setTouchMode(mode: "page" | "full") {
    this.renderer.domElement.style.touchAction = mode === "full" ? "none" : "pan-y";
  }

  setWheelZoom(on: boolean) {
    this.controls.enableZoom = on;
  }

  get isRunning() {
    return this.running;
  }

  get contextLost() {
    return this.renderer.getContext().isContextLost();
  }

  /* ---------- tooltip ---------- */

  private pick(clientX: number, clientY: number): Label | null {
    const ray = this.rayFrom(clientX, clientY);
    const hit = ray.intersectObjects(this.pickables, false).find((h) => h.object.visible && h.object.userData.label);
    return hit ? (hit.object.userData.label as Label) : null;
  }

  private showTip(label: Label, clientX: number, clientY: number) {
    const tip = this.opts.tip;
    if (!tip) return;
    const [a, b] = label;
    (tip.firstElementChild as HTMLElement).textContent = a;
    (tip.lastElementChild as HTMLElement).textContent = b;
    const host = this.container.getBoundingClientRect();
    tip.style.opacity = "1";
    const x = Math.min(clientX - host.left + 14, host.width - tip.offsetWidth - 8);
    const y = Math.min(clientY - host.top + 16, host.height - tip.offsetHeight - 8);
    tip.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
  }

  private hideTip() {
    const tip = this.opts.tip;
    if (tip) tip.style.opacity = "0";
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !this.ready || !this.opts.tip || this.grab) return;
    if (e.buttons) {
      this.hideTip();
      return;
    }
    this.hover = { x: e.clientX, y: e.clientY };
    if (this.hoverQueued) return;
    this.hoverQueued = true;
    requestAnimationFrame(() => {
      this.hoverQueued = false;
      if (!this.hover || this.grab) return;
      const l = this.pick(this.hover.x, this.hover.y);
      if (l) this.showTip(l, this.hover.x, this.hover.y);
      else this.hideTip();
    });
  };

  private onPointerLeave = () => {
    this.hover = null;
    this.hideTip();
  };

  private onTapDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    this.tap = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
  };

  private onTapUp = (e: PointerEvent) => {
    const t = this.tap;
    this.tap = null;
    if (!t || t.id !== e.pointerId || !this.ready) return;
    if (performance.now() - t.t > 300 || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8) return;
    const l = this.pick(e.clientX, e.clientY);
    window.clearTimeout(this.tipTimer);
    if (!l) return this.hideTip();
    this.showTip(l, e.clientX, e.clientY);
    this.tipTimer = window.setTimeout(() => this.hideTip(), 2600);
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.setActive(false);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.tipTimer);
    this.resizeObs.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onGrabDown);
    canvas.removeEventListener("pointermove", this.onGrabMove);
    canvas.removeEventListener("pointerup", this.onGrabUp);
    canvas.removeEventListener("pointercancel", this.onGrabUp);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    canvas.removeEventListener("pointerdown", this.onTapDown);
    canvas.removeEventListener("pointerup", this.onTapUp);
    canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      for (const x of Array.isArray(mat) ? mat : mat ? [mat] : []) {
        (x as THREE.MeshStandardMaterial).map?.dispose();
        x.dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}
