/**
 * A CNC plotter em three.js puro — a cena do artifact "CNC Plotter do Artur",
 * trazida para o three do site (r183) e reescrita para rodar em celular.
 *
 * O que mudou em relação ao artifact, e por quê:
 *  - O modelo vem de um GLB com meshopt (300 KB) em vez de um JSON em base64
 *    (1,3 MB). O mesmo arquivo alimenta a vista explodida da home.
 *  - A tinta é geometria sobre o papel, não um canvas de 1400 × 2866 reenviado
 *    para a GPU a cada traço (16 MB por quadro enquanto desenhava). Cada traço
 *    novo sobe só os vértices dele, e a linha fica nítida em qualquer zoom.
 *  - Só desenha quando algo muda: parada, a cena não gasta bateria. A sombra só
 *    é recalculada quando a máquina se move, não quando a câmera gira.
 *  - Qualidade adaptativa: resolução e sombra começam pelo aparelho e caem
 *    sozinhas se os quadros ficarem lentos.
 *  - Cores convertidas para o three atual: o r147 tratava o hex como valor
 *    linear. Sem isso o PLA, que é 0x15171a, ficaria quase preto.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { applyGaussianPrefilter } from "@/components/three/pmrem";
import type { FitBox } from "@/components/three/explode";
import {
  BELT_THICKNESS,
  BELT_X_AXIS_Z,
  BELT_Y_AXIS_Z,
  H_DOWN,
  PAPER,
  PEN_HOME,
  R_P,
  SERVO_W,
  SHAFT,
  TABLE,
  TH_DOWN,
  TH_UP,
  V_DRAW,
  V_JOG,
  V_RAPID,
  X_MAX,
  Y_MAX,
  beltXAxisPath,
  beltYAxisPath,
  buildTimeline,
  penHeight,
  penIsDown,
  penWorld,
  ribbon,
  sampleTimeline,
  type Cmd,
  type Timeline,
} from "./machine";

export type ViewName = "geral" | "ponte" | "carro" | "baixo";
export type Quality = "high" | "medium" | "low";

/** o que a interface mostra; lido a ~15 Hz pelo componente */
export type Snapshot = {
  x: number;
  y: number;
  /** altura da caneta acima do papel, mm */
  lift: number;
  penDown: boolean;
  /** o alvo do servo: o que o botão de caneta deve oferecer */
  penTargetDown: boolean;
  ink: number;
  i: number;
  len: number;
  running: boolean;
  finished: boolean;
};

type Label = [string, string];

/* ---------- cores: o artifact (three r147) lia o hex como valor linear ---------- */
const lin = (hex: number) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
/* ---------- luzes: as intensidades do artifact valem como estão. O guia de
   migração do three manda multiplicar por π ao sair do modo "legacy", mas,
   conferido lado a lado com o artifact, isso estourava a madeira e o PLA. ---------- */
const LEGACY = 1;

function std(o: { color: number; roughness?: number; metalness?: number; envMapIntensity?: number; transparent?: boolean; opacity?: number }) {
  const { color, ...rest } = o;
  return new THREE.MeshStandardMaterial({ ...rest, color: lin(color) });
}

const MAT_DEFS: Record<string, Parameters<typeof std>[0]> = {
  pla: { color: 0x15171a, roughness: 0.58, metalness: 0.0, envMapIntensity: 0.35 },
  plaNew: { color: 0x15171a, roughness: 0.58, metalness: 0.0, envMapIntensity: 0.35 },
  steel: { color: 0xd9dde2, roughness: 0.26, metalness: 0.92 },
  bearing: { color: 0xc3c8ce, roughness: 0.34, metalness: 0.88 },
  alu: { color: 0xe5e8ec, roughness: 0.36, metalness: 0.9 },
  motor: { color: 0x101113, roughness: 0.45, metalness: 0.3, envMapIntensity: 0.5 },
  motorcap: { color: 0x1a1b1e, roughness: 0.5, metalness: 0.4, envMapIntensity: 0.5 },
  blackmetal: { color: 0x0e0f11, roughness: 0.42, metalness: 0.6, envMapIntensity: 0.6 },
  white: { color: 0xf1f0ec, roughness: 0.6 },
  servo: { color: 0x2f6fe0, roughness: 0.38, transparent: true, opacity: 0.93 },
  wire: { color: 0xc27a2c, roughness: 0.6 },
  switch: { color: 0x141517, roughness: 0.5, envMapIntensity: 0.4 },
  red: { color: 0xd23b2b, roughness: 0.5 },
  penTip: { color: 0x222222, roughness: 0.4, metalness: 0.5 },
  penBody: { color: 0xf4f4f1, roughness: 0.45 },
  penGrip: { color: 0x1c3fae, roughness: 0.5 },
  penCap: { color: 0x1c3fae, roughness: 0.4 },
};

/** "Cor por peça": uma cor por função, nas peças impressas */
const FUNC: Record<string, number> = {
  Suporte: 0x3b82c4,
  BasePrincipal: 0xe0703a,
  ApoioBase: 0xf0a050,
  ApoioSecundario: 0x4caf50,
  CarroPrincipal: 0xa24fc9,
  Presilha: 0xf2c94c,
  PenHolder: 0xe84a8a,
};

/* ---------- rótulos do tooltip ---------- */
const LABELS: [string, string, string][] = [
  ["Barra12mm", "Barra de aço Ø12 × 1000 mm", "Guia do eixo X (longo)"],
  ["Barra6mm", "Barra de aço Ø6 × 500 mm", "Guia do eixo Y (curto)"],
  ["SuporteLateral3", "Suporte lateral alto", "Barra esquerda a 80 mm da mesa"],
  ["SuporteLateral4", "Suporte lateral alto", "Barra esquerda a 80 mm da mesa"],
  ["SuporteLateral", "Suporte lateral baixo", "Barra direita a 51 mm · âncora da correia do X"],
  ["BasePrincipal", "Base Principal", "Carrega os dois motores e o fim de curso"],
  ["ApoioBase", "Apoio Base", "2 × LM12UU na barra da direita"],
  ["ApoioSecundario", "Apoio Secundário", "1 × LM12UU centralizado + polia louca do Y"],
  ["Rolamento", "Rolamento linear LM12UU", "Esferas recirculantes na barra de 12"],
  ["CarroPrincipal", "Carro Principal v2", "Ainda não impresso · vão do servo 23,5 mm · hastes 3,5 mm à frente · dedo do fim de curso"],
  ["PenHolder", "Pen Holder v2", "Sobe e desce em 2 × LM6UU · pino de 6,5 mm"],
  ["LM6UU", "Rolamento linear LM6UU", "Ø12 × 19 mm"],
  ["Haste6mm", "Haste Ø6 × 73,4 mm", "Guia vertical do Pen Holder"],
  ["Presilha", "Presilha da correia (GT2 belt end)", "A correia dá a volta no pino e trava em si mesma · M3 no rasgo do carro, ajustável"],
  ["Servo", "Servo SG90", "Levanta a caneta empurrando o pino do Pen Holder"],
  ["Horn", "Braço do servo (horn)", "Gira para cima e ergue o Pen Holder"],
  ["Caneta", "Caneta", "Desce pelo próprio peso quando o servo abaixa"],
  ["MotorY", "Motor do eixo Y (curto)", "NEMA 17 · 17HS4401 · preso por baixo da placa"],
  ["MotorX", "Motor do eixo X (longo)", "NEMA 17 · 17HS4401 · tração em ômega"],
  ["FimDeCurso", "Fim de curso (microswitch)", "Acionado pelo dedo do carro em Y0"],
];
const SUBS: Record<string, Label> = {
  PX: ["Polia GT2 20 dentes", "Motor do eixo X"],
  PY: ["Polia GT2 20 dentes", "Motor do eixo Y"],
  IX: ["Polia louca GT2 20T", "Retorno da correia do eixo Y"],
  IY1: ["Polia louca", "Ômega do eixo X"],
  IY2: ["Polia louca", "Ômega do eixo X"],
};
function labelFor(group: string, key: string): Label {
  if (SUBS[group]) return SUBS[group];
  for (const [k, a, b] of LABELS) if (key.startsWith(k)) return [a, b];
  return [key, ""];
}

/* ---------- texturas geradas no navegador (nada a baixar) ---------- */
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

/**
 * Pinus desenhado no navegador. O tom é mais quente e escuro que o pinus de
 * verdade de propósito: o fundo do site é papel creme, e a mesa clara sumia
 * nele. O desenho fica guardado — trocar de folha e voltar não refaz.
 */
let woodCanvas: HTMLCanvasElement | null = null;
function woodTexture(aniso: number) {
  const t = new THREE.CanvasTexture((woodCanvas ??= paintWood()));
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

function paintWood() {
  const W = 512,
    H = 1024,
    c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#cf9c5c";
  g.fillRect(0, 0, W, H);
  let seed = 7;
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
  for (let k = 0; k < 3; k++) {
    // nós da madeira
    const cx = rnd() * W,
      cy = rnd() * H;
    for (let r = 22; r > 2; r -= 3) {
      g.strokeStyle = `rgba(104,56,20,${0.14 + (22 - r) / 110})`;
      g.lineWidth = 1.4;
      g.beginPath();
      g.ellipse(cx, cy, r * 0.6, r * 1.6, 0, 0, Math.PI * 2);
      g.stroke();
    }
  }
  return c;
}

/** sombra suave embaixo da mesa: assenta a máquina no fundo da página */
function groundShadow() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, "rgba(40,28,16,0.42)");
  grad.addColorStop(0.55, "rgba(40,28,16,0.2)");
  grad.addColorStop(1, "rgba(40,28,16,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry((TABLE.x1 - TABLE.x0) * 1.45, (TABLE.y1 - TABLE.y0) * 1.32),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }),
  );
  m.position.set((TABLE.x0 + TABLE.x1) / 2 + 30, (TABLE.y0 + TABLE.y1) / 2 - 30, TABLE.z0 - 0.5);
  m.renderOrder = -1;
  m.raycast = () => {};
  return m;
}

/* ---------- o GLB: baixado e decodificado uma vez por página, não a cada cena ---------- */
type Gltf = Awaited<ReturnType<GLTFLoader["loadAsync"]>>;
const models = new Map<string, Promise<Gltf>>();

/**
 * Baixa e decodifica o modelo. A home chama isto no tempo ocioso, antes de a
 * pessoa trocar de folha; a cena depois só monta o que já está na memória.
 */
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

/* ---------- tinta: faixas de 1 mm sobre o papel, crescendo sem realocar a cada traço ---------- */
const INK_W = 1.3;
const INK_Z = PAPER.z + 0.08;
const DISC = 8;

class InkLayer {
  readonly mesh: THREE.Mesh;
  private pos = new Float32Array(0);
  private idx = new Uint32Array(0);
  private v = 0;
  private n = 0;
  private dirtyV = 0;
  private dirtyI = 0;
  /** última faixa reta, para estender em vez de criar outra (linha longa a 1× = centenas de quadros) */
  private lastQuad = -1;
  private lastDir: [number, number] | null = null;
  /**
   * Esticar a faixa anterior em vez de criar outra. Na home fica desligado: lá
   * o desenho é revelado por contagem de índices, e esticar mexeria no que já
   * foi contado.
   */
  merge = true;
  /** largura do traço, mm. Na home ela engrossa: a máquina aparece pequena e 1,3 mm sumiria no celular */
  width = INK_W;

  constructor(material: THREE.Material) {
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.alloc(4096, 6144);
  }

  private alloc(verts: number, tris: number) {
    const pos = new Float32Array(verts * 3);
    const idx = new Uint32Array(tris * 3);
    pos.set(this.pos.subarray(0, this.v * 3));
    idx.set(this.idx.subarray(0, this.n));
    this.pos = pos;
    this.idx = idx;
    const old = this.mesh.geometry;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(new THREE.BufferAttribute(idx, 1).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, this.n);
    this.mesh.geometry = g;
    old.dispose();
    // geometria nova sobe inteira na próxima vez
    this.dirtyV = 0;
    this.dirtyI = 0;
  }

  private reserve(verts: number, idx: number) {
    if (this.v + verts <= this.pos.length / 3 && this.n + idx <= this.idx.length) return;
    this.alloc(Math.max(this.pos.length / 3, this.v + verts) * 2, Math.max(this.idx.length / 3, (this.n + idx) / 3) * 2);
  }

  private vert(x: number, y: number) {
    const k = this.v * 3;
    this.pos[k] = x;
    this.pos[k + 1] = y;
    this.pos[k + 2] = INK_Z;
    return this.v++;
  }

  private tri(a: number, b: number, c: number) {
    this.idx[this.n++] = a;
    this.idx[this.n++] = b;
    this.idx[this.n++] = c;
  }

  /** ponta arredondada: um octógono no ponto (início, fim e cantos de um traço) */
  disc(x: number, y: number) {
    this.reserve(DISC + 1, DISC * 3);
    const c = this.vert(x, y);
    const r = this.width / 2;
    for (let i = 0; i < DISC; i++) this.vert(x + r * Math.cos((i / DISC) * Math.PI * 2), y + r * Math.sin((i / DISC) * Math.PI * 2));
    for (let i = 0; i < DISC; i++) this.tri(c, c + 1 + i, c + 1 + ((i + 1) % DISC));
    this.lastQuad = -1;
  }

  /** traço de a até b; `fresh` marca o primeiro trecho depois de a caneta descer */
  segment(ax: number, ay: number, bx: number, by: number, fresh: boolean) {
    const dx = bx - ax,
      dy = by - ay,
      L = Math.hypot(dx, dy);
    if (L < 1e-4) return;
    const ux = dx / L,
      uy = dy / L;
    // o primeiro trecho já tem a ponta redonda: o disco vem de quando a caneta tocou o papel
    if (fresh) this.disc(ax, ay);
    else if (this.lastDir) {
      const cos = ux * this.lastDir[0] + uy * this.lastDir[1];
      // mesma direção: só estica a faixa anterior
      if (this.merge && cos > 0.99995 && this.lastQuad >= 0) {
        const k = this.lastQuad * 3;
        const nx = -uy * (this.width / 2),
          ny = ux * (this.width / 2);
        this.pos[k + 6] = bx - nx;
        this.pos[k + 7] = by - ny;
        this.pos[k + 9] = bx + nx;
        this.pos[k + 10] = by + ny;
        this.dirtyV = Math.min(this.dirtyV, this.lastQuad);
        this.lastDir = [ux, uy];
        return;
      }
      if (cos < 0.94) this.disc(ax, ay); // canto: arredonda a junta
    }
    this.reserve(4, 6);
    const nx = -uy * (this.width / 2),
      ny = ux * (this.width / 2);
    const a0 = this.vert(ax + nx, ay + ny);
    this.vert(ax - nx, ay - ny);
    this.vert(bx - nx, by - ny);
    this.vert(bx + nx, by + ny);
    this.tri(a0, a0 + 1, a0 + 2);
    this.tri(a0, a0 + 2, a0 + 3);
    this.lastQuad = a0;
    this.lastDir = [ux, uy];
  }

  /** a caneta subiu: fecha o traço com a ponta redonda */
  lift(x: number, y: number) {
    if (this.lastDir) this.disc(x, y);
    this.lastDir = null;
    this.lastQuad = -1;
  }

  /** manda para a GPU só o que mudou desde a última vez */
  flush() {
    const g = this.mesh.geometry;
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    const ix = g.getIndex()!;
    if (this.dirtyV < this.v) {
      p.clearUpdateRanges();
      p.addUpdateRange(this.dirtyV * 3, (this.v - this.dirtyV) * 3);
      p.needsUpdate = true;
    }
    if (this.dirtyI < this.n) {
      ix.clearUpdateRanges();
      ix.addUpdateRange(this.dirtyI, this.n - this.dirtyI);
      ix.needsUpdate = true;
    }
    this.dirtyV = this.v;
    this.dirtyI = this.n;
    g.setDrawRange(0, this.n);
  }

  get dirty() {
    return this.dirtyV < this.v || this.dirtyI < this.n;
  }

  /** índices gravados até agora */
  get count() {
    return this.n;
  }

  /** mostra só os primeiros `n` índices (a rolagem da home volta e avança o desenho) */
  showUpTo(n: number) {
    this.mesh.geometry.setDrawRange(0, Math.min(n, this.n));
  }

  clear() {
    this.v = this.n = this.dirtyV = this.dirtyI = 0;
    this.lastQuad = -1;
    this.lastDir = null;
    this.mesh.geometry.setDrawRange(0, 0);
  }

  dispose() {
    this.mesh.geometry.dispose();
  }
}

/* ---------- câmera ---------- */
type View = { t: () => THREE.Vector3; o: THREE.Vector3; follow: boolean };

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Enquadramento da home, pedido a cada quadro: a caixa da tela onde a máquina
 * deve caber inteira e de onde a câmera olha (azimute e elevação, radianos,
 * em volta do eixo Z da mesa).
 */
export type HomeFraming = (q: number) => { box: FitBox; az: number; el: number } | null;

type Scrub = {
  tl: Timeline;
  /** índices de tinta visíveis durante cada trecho, e ao fim dele */
  n0: Int32Array;
  n1: Int32Array;
  tail: THREE.Mesh;
  /** progresso suavizado e o alvo (o scroll) */
  q: number;
  target: number;
  reported: number;
  /** o desenho ocupa esta faixa do progresso; antes e depois a máquina espera */
  window: [number, number];
  framing: HomeFraming;
  onProgress?: (q: number) => void;
  shown: number;
  key: number;
};

export type SceneOptions = {
  quality: Quality;
  /** dica flutuante com o nome da peça (o componente cuida do estilo) */
  tip?: HTMLElement | null;
  onSnapshot?: (s: Snapshot) => void;
  /** o programa terminou (ou foi pausado pela própria cena) */
  onRunChange?: (running: boolean) => void;
};

export class CncScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 2, 12000);
  private controls: OrbitControls;
  private container: HTMLElement;
  private opts: SceneOptions;
  private disposed = false;
  private resizeObs: ResizeObserver;

  private frame = new THREE.Group();
  private gantry = new THREE.Group();
  private carro = new THREE.Group();
  private penG = new THREE.Group();
  private piv: Record<string, THREE.Group> = {};
  private sun: THREE.DirectionalLight;
  private pickables: THREE.Object3D[] = [];
  private plaMeshes: THREE.Mesh[] = [];
  private edgeLines: THREE.LineSegments[] = [];
  private matBeltX: THREE.MeshStandardMaterial;
  private matBeltY: THREE.MeshStandardMaterial;
  private beltS: THREE.Mesh;
  private beltX: THREE.Mesh;
  private ink: InkLayer;
  private ready = false;
  /** modo da home: a rolagem posiciona a máquina no programa; sem controles de órbita */
  private scrub: Scrub | null = null;
  /** pontos que precisam caber no quadro da home (cantos das peças e da mesa) */
  private fitPts: THREE.Vector3[] = [];
  private fitCenter = new THREE.Vector3();

  /* estado da máquina */
  private st = { x: 0, y: 0, th: TH_UP, thTarget: TH_UP, ink: 0 };
  private lastBeltG: number | null = null;
  private lastBeltS: number | null = null;
  private lastInk: { x: number; y: number } | null = null;
  private program: Cmd[] = [];
  private run = { on: false, i: 0, speed: 5, manual: null as null | { x: number; y: number } };

  /* câmera */
  private views: Record<ViewName, View>;
  private view: ViewName = "geral";
  private tween: null | { t0: THREE.Vector3; p0: THREE.Vector3; t1: THREE.Vector3; p1: THREE.Vector3; k: number } = null;
  private lastFollow: THREE.Vector3 | null = null;

  /* laço sob demanda */
  private raf = 0;
  private lastT = 0;
  private active = true;
  private needsRender = true;
  private shadowDirty = true;
  private uiTick = 0;
  private quality: Quality;
  private dprCap: number;
  private slowFrames = 0;

  /* tooltip */
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hover: { x: number; y: number } | null = null;
  private tap: { x: number; y: number; t: number; id: number } | null = null;
  private tipTimer = 0;

  constructor(container: HTMLElement, opts: SceneOptions) {
    this.container = container;
    this.opts = opts;
    this.quality = opts.quality;
    this.dprCap = opts.quality === "high" ? 2 : opts.quality === "medium" ? 1.5 : 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: opts.quality !== "low", alpha: true, powerPreference: "high-performance" });
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.dprCap));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = opts.quality !== "low";
    r.shadowMap.type = THREE.PCFShadowMap;
    r.shadowMap.autoUpdate = false;
    const canvas = r.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.outline = "none";
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Modelo 3D interativo da CNC plotter. Arraste para girar.");
    container.appendChild(canvas);

    // reflexos: o RoomEnvironment do artifact, com o pré-filtro rápido do site
    try {
      const pm = new THREE.PMREMGenerator(r);
      applyGaussianPrefilter(pm);
      this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      pm.dispose();
    } catch {
      /* sem env map os metais ficam mais foscos, e só */
    }

    const cam = this.camera;
    cam.up.set(0, 0, 1);
    const c = (this.controls = new OrbitControls(cam, canvas));
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 60;
    c.maxDistance = 4200;
    c.maxPolarAngle = Math.PI * 0.62;
    c.addEventListener("change", () => this.wake());
    c.addEventListener("start", () => {
      // girar à mão encerra o "seguir" da vista e qualquer transição
      this.tween = null;
      this.hideTip();
      this.wake();
    });

    /* ---------- luz ---------- */
    this.scene.add(new THREE.HemisphereLight(lin(0xffffff), lin(0x8a7a66), 0.45 * LEGACY));
    const sun = (this.sun = new THREE.DirectionalLight(lin(0xffffff), 1.55 * LEGACY));
    sun.position.set(-330 + 520, -560 + 380, 1100);
    sun.target.position.set(-330, -560, 0);
    sun.castShadow = r.shadowMap.enabled;
    const sm = opts.quality === "high" ? 2048 : 1024;
    sun.shadow.mapSize.set(sm, sm);
    Object.assign(sun.shadow.camera, { left: -760, right: 760, top: 760, bottom: -760, near: 200, far: 2600 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.6;
    sun.shadow.radius = 2;
    this.scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(lin(0xdfe7ff), 0.35 * LEGACY);
    fill.position.set(-1400, 600, 500);
    this.scene.add(fill);

    /* ---------- mesa e papel ---------- */
    const aniso = Math.min(8, r.capabilities.getMaxAnisotropy());
    const woodMap = woodTexture(aniso);
    const top = new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.78, color: 0xffffff });
    // a borda da tábua um tom abaixo: dá espessura e separa a mesa do fundo
    const edge = new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.8, color: lin(0x9a7650) });
    const table = new THREE.Mesh(new THREE.BoxGeometry(TABLE.x1 - TABLE.x0, TABLE.y1 - TABLE.y0, TABLE.z1 - TABLE.z0), [edge, edge, edge, edge, top, edge]);
    table.position.set((TABLE.x0 + TABLE.x1) / 2, (TABLE.y0 + TABLE.y1) / 2, (TABLE.z0 + TABLE.z1) / 2);
    table.receiveShadow = true;
    table.userData.label = ["Mesa de pinus", "Base de madeira onde os suportes são parafusados"] as Label;
    this.scene.add(table, groundShadow());

    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(PAPER.x1 - PAPER.x0, PAPER.y1 - PAPER.y0),
      new THREE.MeshStandardMaterial({ color: new THREE.Color("#fbfbf7"), roughness: 0.92 }),
    );
    paper.position.set((PAPER.x0 + PAPER.x1) / 2, (PAPER.y0 + PAPER.y1) / 2, PAPER.z);
    paper.receiveShadow = true;
    paper.userData.label = ["Papel 420 × 860 mm", "Área que a caneta alcança: 818 × 402 mm"] as Label;
    this.scene.add(paper, this.cornerMarks());
    this.pickables.push(table, paper);

    this.ink = new InkLayer(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1b3bb8"),
        roughness: 0.7,
        flatShading: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    );
    this.scene.add(this.ink.mesh);

    /* ---------- grupos móveis ---------- */
    this.scene.add(this.frame, this.gantry);
    this.gantry.add(this.carro);
    this.carro.add(this.penG);
    const pivot = (parent: THREE.Object3D, x: number, y: number, z: number) => {
      const p = new THREE.Group();
      p.position.set(x, y, z);
      parent.add(p);
      return p;
    };
    this.piv = {
      PY: pivot(this.gantry, -27.8, -173.1, 0),
      PX: pivot(this.gantry, 28.2, -173.1, 0),
      IX: pivot(this.gantry, -557.3, -173.1, 0),
      IY1: pivot(this.gantry, -36.3, -130.0, 0),
      IY2: pivot(this.gantry, -36.3, -216.1, 0),
      H: pivot(this.carro, SHAFT.x, 0, SHAFT.z),
    };

    /* ---------- correias ---------- */
    this.matBeltX = new THREE.MeshStandardMaterial({ color: 0xffffff, map: beltTexture(), roughness: 0.85 });
    this.matBeltY = new THREE.MeshStandardMaterial({ color: 0xffffff, map: beltTexture(), roughness: 0.85 });
    this.beltS = new THREE.Mesh(new THREE.BufferGeometry(), this.matBeltX);
    this.beltS.castShadow = true;
    this.beltS.userData.label = ["Correia GT2 6 mm · eixo Y", "Aberta: cada ponta dá a volta no pino de uma presilha e trava em si mesma"] as Label;
    this.gantry.add(this.beltS);
    this.beltX = new THREE.Mesh(new THREE.BufferGeometry(), this.matBeltY);
    this.beltX.castShadow = true;
    this.beltX.userData.label = ["Correia GT2 6 mm · eixo X", 'Presa nos dois suportes; o motor "escala" a correia (ômega)'] as Label;
    this.scene.add(this.beltX);
    this.pickables.push(this.beltS, this.beltX);

    /* ---------- vistas ---------- */
    const st = this.st;
    this.views = {
      geral: { t: () => new THREE.Vector3(-300, -590, 30), o: new THREE.Vector3(860, 640, 1080), follow: false },
      ponte: { t: () => new THREE.Vector3(-260, -175 - st.x, 75), o: new THREE.Vector3(210, 330, 230), follow: true },
      carro: {
        t: () => {
          const p = penWorld(st.x, st.y);
          return new THREE.Vector3(p.x, p.y + 25, 85);
        },
        o: new THREE.Vector3(150, -230, 95),
        follow: true,
      },
      baixo: { t: () => new THREE.Vector3(-45, -175 - st.x, 60), o: new THREE.Vector3(150, -150, -26), follow: true },
    };
    cam.position.set(480, 260, 900);
    c.target.set(-300, -600, 30);

    /* ---------- tooltip e toque ---------- */
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("webglcontextlost", this.onContextLost);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    this.resize();
    this.applyPose(true);
    this.wake();
  }

  /** marcas de canto da área útil, como no papel do artifact */
  private cornerMarks() {
    const g: number[] = [];
    const quad = (x0: number, y0: number, x1: number, y1: number) => {
      const z = PAPER.z + 0.04;
      const b = g.length / 3;
      g.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z);
      return b;
    };
    const idx: number[] = [];
    const ax0 = PEN_HOME.x - Y_MAX,
      ax1 = PEN_HOME.x,
      ay0 = PEN_HOME.y - X_MAX,
      ay1 = PEN_HOME.y;
    const arm = 4.2,
      w = 0.18;
    for (const [x, y] of [
      [ax0, ay0],
      [ax1, ay0],
      [ax0, ay1],
      [ax1, ay1],
    ]) {
      for (const b of [quad(x - arm, y - w, x + arm, y + w), quad(x - w, y - arm, x + w, y + arm)]) idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(g, 3));
    geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color("#c9ccd2"), side: THREE.DoubleSide }));
    m.renderOrder = 1;
    return m;
  }

  /* ---------- carga do modelo ---------- */

  async load(url: string, onProgress?: (p: number) => void) {
    const gltf = await prefetchModel(url, onProgress);
    if (this.disposed) return;

    const mats: Record<string, THREE.MeshStandardMaterial> = {};
    const material = (key: string) => (mats[key] ??= std(MAT_DEFS[key] ?? MAT_DEFS.pla));
    // glTF (Y para cima) de volta para os eixos do FreeCAD (Z para cima)
    const toZUp = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    const M = new THREE.Matrix4();
    const N = new THREE.Matrix3();
    const v = new THREE.Vector3();
    gltf.scene.updateMatrixWorld(true);

    gltf.scene.traverse((o) => {
      const src = o as THREE.Mesh;
      const full = (o.userData as { n?: string; belt?: boolean }).n;
      if (!src.isMesh || !full || o.userData.belt) return;
      // a geometria vem quantizada (int16 + escala no nó); aqui ela volta a
      // float, já nas coordenadas do mundo, como no JSON do artifact
      M.multiplyMatrices(toZUp, src.matrixWorld);
      N.getNormalMatrix(M);
      const sp = src.geometry.getAttribute("position");
      const sn = src.geometry.getAttribute("normal");
      const pos = new Float32Array(sp.count * 3);
      const nrm = new Float32Array(sp.count * 3);
      // o GLB grava a máquina com a ponte e o carro no meio do curso (para a
      // home); aqui cada peça volta para a origem, de onde a simulação parte
      const [hx, hy, hz] = (o.userData.home as number[] | undefined) ?? [0, 0, 0];
      for (let i = 0; i < sp.count; i++) {
        v.fromBufferAttribute(sp, i).applyMatrix4(M);
        v.x -= hx;
        v.y -= hy;
        v.z -= hz;
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

      const [head, matKey = "pla"] = full.split("__");
      const us = head.indexOf("_");
      const group = head.slice(0, us),
        key = head.slice(us + 1);
      const isPla = matKey === "pla" || matKey === "plaNew";
      const m = new THREE.Mesh(g, isPla ? material(matKey).clone() : material(matKey));
      m.name = full;
      m.castShadow = true;
      m.receiveShadow = isPla;
      m.userData.label = labelFor(group, key);
      let parent: THREE.Object3D = this.frame;
      if (group === "G") parent = this.gantry;
      else if (group === "C") parent = this.carro;
      else if (group === "P") parent = this.penG;
      else if (this.piv[group]) {
        parent = this.piv[group];
        m.position.set(-parent.position.x, -parent.position.y, -parent.position.z);
      }
      parent.add(m);
      this.pickables.push(m);
      if (isPla) {
        const k = Object.keys(FUNC).find((f) => key.startsWith(f));
        m.userData.funcColor = k ? FUNC[k] : 0x6b7280;
        m.userData.realColor = (m.material as THREE.MeshStandardMaterial).color.getHex(THREE.LinearSRGBColorSpace);
        this.plaMeshes.push(m);
      }
    });

    // Compila os shaders antes do primeiro quadro, em paralelo quando o
    // navegador deixa (KHR_parallel_shader_compile). Sem isto o primeiro
    // render travava a página ~1,5 s no Windows (ANGLE/D3D compila devagar).
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      /* compila no primeiro quadro, como antes */
    }
    if (this.disposed) return;

    this.ready = true;
    this.collectFitPoints();
    this.applyPose(true);
    if (this.scrub) this.scrub.key = -1;
    else this.setView("geral", true);
    this.shadowDirty = true;
    this.wake();
    // os contornos das peças impressas custam alguns quadros de CPU: ficam
    // para depois do primeiro desenho, uma peça por vez
    this.buildEdgesLater();
  }

  private buildEdgesLater() {
    const queue = [...this.plaMeshes];
    const step = () => {
      if (this.disposed) return;
      const t0 = performance.now();
      while (queue.length && performance.now() - t0 < 8) {
        const m = queue.shift()!;
        const e = new THREE.LineSegments(
          new THREE.EdgesGeometry(m.geometry, 32),
          new THREE.LineBasicMaterial({ color: lin(0x5a606b), transparent: true, opacity: 0.6 }),
        );
        e.position.copy(m.position);
        e.raycast = () => {};
        m.parent!.add(e);
        m.userData.edges = e;
        this.edgeLines.push(e);
      }
      this.wake();
      if (queue.length) idle(step);
    };
    const idle = (f: () => void) =>
      "requestIdleCallback" in window ? window.requestIdleCallback(f, { timeout: 400 }) : globalThis.setTimeout(f, 30);
    idle(step);
  }

  /* ---------- pose ---------- */

  private applyPose(force = false) {
    const st = this.st;
    const g = -st.x;
    this.gantry.position.y = g;
    this.carro.position.x = -st.y;
    this.penG.position.z = penHeight(st.th) - H_DOWN;
    this.piv.H.rotation.y = st.th;
    this.piv.PY.rotation.z = st.y / R_P;
    this.piv.IX.rotation.z = st.y / R_P;
    this.piv.PX.rotation.z = -g / R_P;
    this.piv.IY1.rotation.z = g / R_P;
    this.piv.IY2.rotation.z = g / R_P;
    if (force || this.lastBeltG === null || Math.abs(this.lastBeltG - g) > 0.05) {
      setRibbon(this.beltX, beltXAxisPath(g), BELT_X_AXIS_Z);
      this.lastBeltG = g;
    }
    if (force || this.lastBeltS === null || Math.abs(this.lastBeltS - st.y) > 0.02) {
      setRibbon(this.beltS, beltYAxisPath(-st.y), BELT_Y_AXIS_Z);
      this.lastBeltS = st.y;
    }
    this.shadowDirty = true;
    this.needsRender = true;
  }

  private inkTo() {
    const st = this.st;
    const p = penWorld(st.x, st.y);
    const down = penIsDown(st.th);
    if (down && this.lastInk) {
      const d = Math.hypot(p.x - this.lastInk.x, p.y - this.lastInk.y);
      if (d > 0.01) {
        this.ink.segment(this.lastInk.x, this.lastInk.y, p.x, p.y, false);
        st.ink += d;
        this.lastInk = { x: p.x, y: p.y };
      }
    } else if (down) {
      // a caneta acabou de tocar o papel
      this.ink.disc(p.x, p.y);
      this.lastInk = { x: p.x, y: p.y };
    } else if (this.lastInk) {
      this.ink.lift(this.lastInk.x, this.lastInk.y);
      this.lastInk = null;
    }
  }

  /* ---------- simulação (mesma lógica do artifact) ---------- */

  private servoStep(dt: number) {
    const st = this.st;
    const d = st.thTarget - st.th;
    if (Math.abs(d) <= SERVO_W * dt) {
      st.th = st.thTarget;
      return true;
    }
    st.th += Math.sign(d) * SERVO_W * dt;
    return false;
  }

  private moveToward(tx: number, ty: number, v: number, dt: number) {
    const st = this.st;
    const dx = tx - st.x,
      dy = ty - st.y,
      d = Math.hypot(dx, dy);
    const step = v * dt;
    if (d <= step) {
      st.x = tx;
      st.y = ty;
      return { done: true, left: dt - d / v };
    }
    st.x += (dx / d) * step;
    st.y += (dy / d) * step;
    return { done: false, left: 0 };
  }

  /** avança a máquina; devolve se ainda há movimento a fazer */
  private tick(dtReal: number): boolean {
    const st = this.st,
      R = this.run,
      P = this.program;
    const before = st.x + st.y * 1e3 + st.th * 1e6;
    if (R.on) {
      let dt = dtReal * R.speed;
      let guard = 0;
      while (dt > 1e-6 && R.i < P.length && guard++ < 4000) {
        const c = P[R.i];
        if (c.t === "note") {
          R.i++;
          continue;
        }
        if (c.t === "pen") {
          st.thTarget = c.down ? TH_DOWN : TH_UP;
          const sub = Math.min(dt, 0.02);
          const ok = this.servoStep(sub);
          dt -= sub;
          this.inkTo();
          if (ok) R.i++;
          continue;
        }
        const r = this.moveToward(c.x, c.y, c.rapid ? V_RAPID : V_DRAW, dt);
        this.servoStep(dt);
        this.inkTo();
        if (r.done) {
          R.i++;
          dt = r.left;
        } else dt = 0;
      }
      if (R.i >= P.length) {
        R.on = false;
        this.opts.onRunChange?.(false);
      }
    } else {
      this.servoStep(dtReal);
      if (R.manual) {
        const r = this.moveToward(R.manual.x, R.manual.y, V_JOG, dtReal);
        if (r.done) R.manual = null;
      }
      this.inkTo();
    }
    const moved = st.x + st.y * 1e3 + st.th * 1e6 !== before;
    if (moved) this.applyPose();
    return R.on || !!R.manual || st.th !== st.thTarget;
  }

  /* ---------- câmera ---------- */

  private distK() {
    return Math.max(1, Math.pow(1.45 / this.camera.aspect, 0.6));
  }

  setView(name: ViewName, instant = false) {
    this.view = name;
    const V = this.views[name],
      t = V.t(),
      p = t.clone().add(V.o.clone().multiplyScalar(this.distK()));
    if (instant || reduceMotion()) {
      this.controls.target.copy(t);
      this.camera.position.copy(p);
      this.controls.update();
      this.tween = null;
    } else this.tween = { t0: this.controls.target.clone(), p0: this.camera.position.clone(), t1: t, p1: p, k: 0 };
    this.lastFollow = t.clone();
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
        tw.p1.copy(t).add(V.o.clone().multiplyScalar(this.distK()));
      }
      this.controls.target.lerpVectors(tw.t0, tw.t1, e);
      this.camera.position.lerpVectors(tw.p0, tw.p1, e);
      if (tw.k >= 1) {
        this.tween = null;
        this.lastFollow = this.controls.target.clone();
      }
      return true;
    }
    if (V.follow && this.lastFollow) {
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

  /* ---------- laço: só roda enquanto há o que animar ---------- */

  private inLoop = false;
  private wake = () => {
    this.needsRender = true;
    // chamado de dentro do próprio quadro (o "change" dos controles dispara no
    // controls.update): o fim do quadro já decide se agenda o próximo. Agendar
    // aqui rodava o laço duas vezes por quadro, com dt negativo — e a transição
    // de câmera extrapolava até o infinito
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
    // primeiro quadro depois de parada: o carimbo do rAF pode ser anterior ao
    // momento em que acordamos, então conta um quadro padrão
    const raw = this.lastT < 0 ? 1 / 60 : (now - this.lastT) / 1000;
    this.lastT = now;
    const dt = Math.min(0.05, Math.max(0, raw));
    let busy = false;
    if (this.ready && this.scrub) {
      busy = this.scrubStep(dt);
    } else if (this.ready) {
      busy = this.tick(dt) || busy;
      busy = this.cameraStep(dt) || busy;
      if (this.ink.dirty) {
        this.ink.flush();
        this.needsRender = true;
      }
      if ((this.uiTick++ & 3) === 0 || !busy) this.emitSnapshot();
    }
    if (!this.scrub && this.controls.update()) busy = true;
    if (busy) this.needsRender = true;
    if (this.needsRender) {
      if (this.shadowDirty && this.renderer.shadowMap.enabled) {
        this.renderer.shadowMap.needsUpdate = true;
        this.shadowDirty = false;
      }
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
      this.adapt(raw, busy);
    }
    if (busy || this.needsRender) this.raf = requestAnimationFrame(this.loop);
    else this.emitSnapshot();
  }

  /**
   * Qualidade adaptativa: quadros lentos seguidos (abaixo de ~26 fps) baixam a
   * resolução em degraus; no piso, a sombra vai para 512 e depois sai. Só conta
   * enquanto a cena está animando — um quadro isolado depois de parada não diz nada.
   */
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
      this.shadowDirty = true;
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
    const st = this.st,
      R = this.run;
    this.opts.onSnapshot?.({
      x: st.x,
      y: st.y,
      lift: penHeight(st.th) - H_DOWN,
      penDown: penIsDown(st.th),
      penTargetDown: st.thTarget === TH_DOWN,
      ink: st.ink,
      i: R.i,
      len: this.program.length,
      running: R.on,
      finished: R.i >= this.program.length && this.program.length > 0,
    });
  }

  private resize() {
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // caixa quadrada ou em pé (celular, coluna do desktop) pede lente mais aberta;
    // no artifact a regra era a largura da tela, que aqui não diz o formato do palco
    // na home a caixa do enquadramento decide o tamanho; lente fechada, menos distorção
    this.camera.fov = this.scrub ? 30 : w / h < 1.25 ? 46 : 34;
    this.camera.updateProjectionMatrix();
    if (this.scrub) this.scrub.key = -1;
    this.wake();
  }

  /* ---------- API para a interface ---------- */

  /** fora da tela ou com a aba escondida: para tudo, até o relógio do programa */
  setActive(on: boolean) {
    if (this.active === on) return;
    this.active = on;
    if (on) this.wake();
    else if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  setProgram(P: Cmd[], start: boolean) {
    this.program = P;
    this.run.i = 0;
    this.run.manual = null;
    this.run.on = false;
    if (start) this.play();
    else this.wake();
  }

  play() {
    if (!this.program.length) return;
    if (this.run.i >= this.program.length) this.run.i = 0;
    this.run.on = true;
    this.run.manual = null;
    this.opts.onRunChange?.(true);
    this.wake();
  }

  pause() {
    if (!this.run.on) return;
    this.run.on = false;
    this.opts.onRunChange?.(false);
    this.wake();
  }

  /** começar do zero: papel limpo, caneta erguida, programa no início */
  restart() {
    this.clearPaper();
    this.run.i = 0;
    this.play();
  }

  setSpeed(s: number) {
    this.run.speed = s;
  }

  clearPaper() {
    this.ink.clear();
    this.st.ink = 0;
    // se a caneta está no papel, o próximo traço começa de onde ela está
    this.lastInk = null;
    this.needsRender = true;
    this.wake();
  }

  /** mover à mão (sliders): pausa o programa e vai até lá */
  jog(x: number, y: number) {
    this.pause();
    this.run.manual = { x: Math.min(X_MAX, Math.max(0, x)), y: Math.min(Y_MAX, Math.max(0, y)) };
    this.wake();
  }

  togglePen() {
    this.pause();
    this.st.thTarget = this.st.thTarget === TH_DOWN ? TH_UP : TH_DOWN;
    this.wake();
  }

  setColors(on: boolean) {
    for (const m of this.plaMeshes) (m.material as THREE.MeshStandardMaterial).color.setHex(on ? m.userData.funcColor : m.userData.realColor, THREE.LinearSRGBColorSpace);
    this.wake();
  }

  setXray(on: boolean) {
    for (const m of this.plaMeshes) {
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.transparent = on;
      mat.opacity = on ? 0.28 : 1;
      mat.depthWrite = !on;
      mat.needsUpdate = true;
      m.castShadow = !on;
    }
    this.shadowDirty = true;
    this.wake();
  }

  /** controles de toque: no meio da página o dedo vertical rola a página; em tela cheia, gira */
  setTouchMode(mode: "page" | "full") {
    this.renderer.domElement.style.touchAction = mode === "full" ? "none" : "pan-y";
  }

  /** a roda do mouse dá zoom só quando a interface deixa (Ctrl, pinça do trackpad, tela cheia) */
  setWheelZoom(on: boolean) {
    this.controls.enableZoom = on;
  }

  get webglOk() {
    return !!this.renderer.getContext();
  }

  /** o contexto WebGL foi perdido (o sistema recolhe contextos parados): a cena não serve mais */
  get contextLost() {
    return this.renderer.getContext().isContextLost();
  }

  /**
   * Muda a cena de lugar na página sem recriá-la: a home guarda uma cena
   * pronta fora da tela e a traz para a folha quando a pessoa troca de projeto.
   */
  attach(container: HTMLElement) {
    if (this.disposed || container === this.container) return;
    this.resizeObs.unobserve(this.container);
    this.container = container;
    container.appendChild(this.renderer.domElement);
    this.resizeObs.observe(container);
    this.resize();
  }

  /** um quadro como imagem (para o pôster) */
  snapshotDataURL(type = "image/webp", q = 0.82) {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL(type, q);
  }

  /* ---------- home: a rolagem desenha ---------- */

  /**
   * Liga o modo da home: o programa vira uma linha do tempo, a tinta do
   * desenho inteiro é gerada de uma vez e a rolagem só escolhe quanto dela
   * aparece. Ir e voltar não refaz geometria — muda um número.
   */
  enterScrub(P: Cmd[], framing: HomeFraming, opts: { window?: [number, number]; onProgress?: (q: number) => void } = {}) {
    const tl = buildTimeline(P);
    const ink = this.ink;
    ink.clear();
    ink.merge = false;
    ink.width = 2.6;
    const n0 = new Int32Array(tl.n);
    const n1 = new Int32Array(tl.n);
    let lastDraw = -1;
    let fresh = true;
    for (let k = 0; k < tl.n; k++) {
      if (tl.draw[k]) {
        const a = penWorld(tl.x0[k], tl.y0[k]);
        const b = penWorld(tl.x1[k], tl.y1[k]);
        if (fresh) ink.disc(a.x, a.y);
        n0[k] = ink.count;
        ink.segment(a.x, a.y, b.x, b.y, false);
        n1[k] = ink.count;
        fresh = false;
        lastDraw = k;
      } else {
        // caneta subindo depois de um traço: a ponta redonda entra no fim do traço
        if (!fresh && tl.th1[k] > tl.th0[k] && lastDraw >= 0) {
          const e = penWorld(tl.x1[lastDraw], tl.y1[lastDraw]);
          ink.lift(e.x, e.y);
          n1[lastDraw] = ink.count;
          fresh = true;
        }
        n0[k] = n1[k] = ink.count;
      }
    }
    ink.flush();
    ink.showUpTo(0);

    // cena reaproveitada: a faixa da volta anterior sai
    if (this.scrub) {
      this.scene.remove(this.scrub.tail);
      this.scrub.tail.geometry.dispose();
    }
    const tail = new THREE.Mesh(new THREE.BufferGeometry(), ink.mesh.material);
    tail.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3).setUsage(THREE.DynamicDrawUsage));
    tail.geometry.setIndex([0, 1, 2, 0, 2, 3]);
    tail.frustumCulled = false;
    tail.renderOrder = 1;
    tail.visible = false;
    this.scene.add(tail);

    this.scrub = { tl, n0, n1, tail, q: 0, target: 0, reported: -1, window: opts.window ?? [0, 1], framing, onProgress: opts.onProgress, shown: -1, key: -1 };
    this.run.on = false;
    this.controls.enabled = false;
    this.setTouchMode("page");
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

  /** cantos das peças (com a ponte nas duas pontas do curso) e da mesa */
  private collectFitPoints() {
    const pts: THREE.Vector3[] = [];
    const box = new THREE.Box3();
    const corners = (o: THREE.Object3D) => {
      o.traverse((m) => {
        if (!(m as THREE.Mesh).isMesh) return;
        box.setFromObject(m, false);
        if (box.isEmpty()) return;
        for (let i = 0; i < 8; i++) pts.push(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
      });
    };
    const x = this.st.x;
    this.scene.updateMatrixWorld(true);
    corners(this.frame);
    for (const gx of [0, X_MAX]) {
      this.gantry.position.y = -gx;
      this.gantry.updateMatrixWorld(true);
      corners(this.gantry);
    }
    this.gantry.position.y = -x;
    this.gantry.updateMatrixWorld(true);
    for (const [tx, ty] of [
      [TABLE.x0, TABLE.y0],
      [TABLE.x1, TABLE.y0],
      [TABLE.x0, TABLE.y1],
      [TABLE.x1, TABLE.y1],
    ])
      for (const tz of [TABLE.z0, TABLE.z1]) pts.push(new THREE.Vector3(tx, ty, tz));
    const all = new THREE.Box3().setFromPoints(pts);
    all.getCenter(this.fitCenter);
    this.fitPts = pts.map((p) => p.sub(this.fitCenter));
  }

  private scrubStep(dt: number): boolean {
    const s = this.scrub!;
    let busy = false;
    const d = s.target - s.q;
    if (Math.abs(d) < 1e-4 || reduceMotion()) s.q = s.target;
    else {
      // suavização por tempo, não por quadro: igual em 30 ou 144 fps
      s.q += d * (1 - Math.exp(-dt * 9));
      busy = true;
    }
    const q = s.q;

    /* a máquina no instante do programa que corresponde a q */
    const [w0, w1] = s.window;
    const u = Math.min(1, Math.max(0, (q - w0) / (w1 - w0)));
    const m = sampleTimeline(s.tl, u * s.tl.duration);
    const st = this.st;
    if (st.x !== m.x || st.y !== m.y || st.th !== m.th) {
      st.x = m.x;
      st.y = m.y;
      st.th = st.thTarget = m.th;
      this.applyPose();
    }
    const k = m.k;
    const drawing = k >= 0 && s.tl.draw[k] === 1 && m.f < 1;
    const shown = k < 0 ? 0 : m.f >= 1 ? s.n1[k] : s.n0[k];
    if (shown !== s.shown) {
      s.shown = shown;
      this.ink.showUpTo(shown);
      this.needsRender = true;
    }
    // o trecho em andamento: uma faixa só, da origem dele até a ponta da caneta
    const tailOn = drawing && m.f > 0;
    if (tailOn) {
      const a = penWorld(s.tl.x0[k], s.tl.y0[k]);
      const b = penWorld(m.x, m.y);
      const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = (-(b.y - a.y) / L) * (this.ink.width / 2),
        ny = ((b.x - a.x) / L) * (this.ink.width / 2);
      const pos = s.tail.geometry.getAttribute("position") as THREE.BufferAttribute;
      (pos.array as Float32Array).set([a.x + nx, a.y + ny, INK_Z, a.x - nx, a.y - ny, INK_Z, b.x - nx, b.y - ny, INK_Z, b.x + nx, b.y + ny, INK_Z]);
      pos.needsUpdate = true;
      this.needsRender = true;
    }
    if (s.tail.visible !== tailOn) {
      s.tail.visible = tailOn;
      this.needsRender = true;
    }

    /* a câmera: a caixa e o ângulo podem mudar com q (e com o arrasto) */
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

  /**
   * Distância exata para todos os pontos caberem na caixa: cada canto, visto
   * da direção da câmera, pede uma distância mínima na largura e na altura (os
   * cantos mais perto da câmera pedem mais). Depois o centro de projeção vai
   * para o meio da caixa.
   */
  private frameHome(q: number) {
    const fr = this.scrub?.framing(q);
    if (!fr || !this.fitPts.length) return;
    const { box, az, el } = fr;
    const cam = this.camera;
    const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el));
    const fwd = dir.clone().negate();
    const right = new THREE.Vector3().crossVectors(fwd, cam.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd);
    const tanY = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const tanX = tanY * cam.aspect;
    const MARGIN = 1.04;
    let dist = 0;
    for (const p of this.fitPts) {
      const z = p.dot(dir);
      dist = Math.max(dist, z + (Math.abs(p.dot(right)) * MARGIN) / (tanX * box.w), z + (Math.abs(p.dot(up)) * MARGIN) / (tanY * box.h));
    }
    cam.position.copy(this.fitCenter).addScaledVector(dir, dist);
    cam.lookAt(this.fitCenter);
    cam.near = Math.max(2, dist * 0.2);
    cam.far = dist * 4;
    const W = this.container.clientWidth,
      H = this.container.clientHeight;
    const sx = box.x + box.w / 2 - 0.5,
      sy = box.y + box.h / 2 - 0.5;
    if (Math.abs(sx) < 1e-4 && Math.abs(sy) < 1e-4) cam.clearViewOffset();
    else cam.setViewOffset(W, H, -sx * W, -sy * H, W, H);
    cam.updateProjectionMatrix();
  }

  /* ---------- tooltip ---------- */

  private pick(clientX: number, clientY: number): Label | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - r.left) / r.width) * 2 - 1, (-(clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.pointer, this.camera);
    const hit = this.ray.intersectObjects(this.pickables, false).find((h) => h.object.visible && h.object.userData.label);
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

  private hoverQueued = false;
  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !this.ready || !this.opts.tip) return;
    if (e.buttons) {
      this.hideTip();
      return;
    }
    this.hover = { x: e.clientX, y: e.clientY };
    if (this.hoverQueued) return;
    this.hoverQueued = true;
    requestAnimationFrame(() => {
      this.hoverQueued = false;
      if (!this.hover) return;
      const l = this.pick(this.hover.x, this.hover.y);
      if (l) this.showTip(l, this.hover.x, this.hover.y);
      else this.hideTip();
    });
  };

  private onPointerLeave = () => {
    this.hover = null;
    this.hideTip();
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    this.tap = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
  };

  /** no toque não há "passar o mouse": um toque curto e parado mostra o nome da peça */
  private onPointerUp = (e: PointerEvent) => {
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
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.controls.dispose();
    this.ink.dispose();
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

/**
 * Atualiza a fita da correia. Se a quantidade de pontos não mudou (o normal,
 * quadro a quadro), reescreve os vértices no mesmo buffer em vez de criar uma
 * geometria nova a cada quadro como no artifact.
 */
function setRibbon(mesh: THREE.Mesh, pts: [number, number][], [z0, z1]: [number, number]) {
  const r = ribbon(pts, false, z0, z1, BELT_THICKNESS);
  const g = mesh.geometry;
  const p = g.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (p && p.array.length === r.position.length) {
    (p.array as Float32Array).set(r.position);
    p.needsUpdate = true;
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    (uv.array as Float32Array).set(r.uv);
    uv.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return;
  }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute("position", new THREE.BufferAttribute(r.position, 3));
  ng.setAttribute("uv", new THREE.BufferAttribute(r.uv, 2));
  ng.setIndex(r.index);
  ng.computeVertexNormals();
  mesh.geometry = ng;
  g.dispose();
}
