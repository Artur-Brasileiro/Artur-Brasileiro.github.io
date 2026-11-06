/**
 * Carga do simulador da CNC: o chunk da cena, o GLB e as fontes de traço.
 *
 * Sai tudo em paralelo assim que a página do projeto é avaliada — senão seria
 * uma fila (página → chunk do three → GLB). Em conexão lenta ou com economia
 * de dados ligada, nada sai sozinho: a pessoa vê o pôster e escolhe carregar.
 */
import type { StrokeFont, FontId } from "./text";
import type { Quality } from "./CncScene";

export const CNC_GLB = "/projetos/cnc/cnc.glb";
export const CNC_POSTER = "/projetos/cnc/poster";
/** o que o 3D custa (three ~213 KB gz + cena + GLB 304 KB), para o botão de carregar sob demanda */
export const CNC_3D_KB = 530;

export const loadScene = () => import("./CncScene");

type NetInfo = { saveData?: boolean; effectiveType?: string };

/** economia de dados ligada ou rede 2G: não baixa 3D sem a pessoa pedir */
export function constrainedNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: NetInfo }).connection;
  return !!c && (c.saveData === true || c.effectiveType === "slow-2g" || c.effectiveType === "2g");
}

let started = false;
export function preloadCnc() {
  if (started || typeof document === "undefined" || constrainedNetwork()) return;
  started = true;
  // o chunk da cena, e com ele o GLB já decodificado (fica em memória para a cena montar na hora)
  loadScene()
    .then((m) => m.prefetchModel(CNC_GLB))
    .catch(() => {}); // a falha de verdade aparece no componente
  // mesmo modo e credenciais do fetch do GLTFLoader, para o navegador
  // entregar a resposta pré-carregada em vez de baixar de novo
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "fetch";
  link.crossOrigin = "anonymous";
  link.href = CNC_GLB;
  document.head.appendChild(link);
}

const fonts = new Map<FontId, Promise<StrokeFont>>();
export function loadFont(id: FontId): Promise<StrokeFont> {
  let p = fonts.get(id);
  if (!p) {
    p = fetch(`/projetos/cnc/fontes/${id}.json`).then((r) => {
      if (!r.ok) throw new Error(`${r.status} fonte ${id}`);
      return r.json() as Promise<StrokeFont>;
    });
    p.catch(() => fonts.delete(id));
    fonts.set(id, p);
  }
  return p;
}

/** começa pelo aparelho; a cena ainda ajusta sozinha se os quadros ficarem lentos */
export function pickQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (mem <= 2 || (coarse && mem <= 4 && cores <= 4)) return "low";
  if (coarse || window.innerWidth < 900) return "medium";
  return "high";
}

/* ---------- a cena da home, pronta antes do clique ---------- */

let parking: HTMLDivElement | null = null;
let warm: Promise<import("./CncScene").CncScene> | null = null;

/** onde a cena espera, fora da vista, com o tamanho da tela (para compilar e enquadrar igual) */
function park() {
  if (!parking) {
    parking = document.createElement("div");
    parking.setAttribute("aria-hidden", "true");
    parking.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100svh;visibility:hidden;pointer-events:none;z-index:-1;contain:strict";
    document.body.appendChild(parking);
  }
  return parking;
}

/**
 * A cena da folha da CNC: criada uma vez, com o modelo e os shaders prontos, e
 * reaproveitada a cada troca de folha. A home pede no tempo ocioso; quando a
 * pessoa clica na seta, a máquina aparece na hora.
 */
export function homeScene(onProgress?: (p: number) => void) {
  if (warm) {
    const w = warm;
    return w.then((sc) => {
      if (!sc.contextLost) return sc;
      sc.dispose();
      if (warm === w) warm = null;
      return homeScene(onProgress);
    });
  }
  const p = loadScene().then(async ({ CncScene }) => {
    let sc;
    try {
      sc = new CncScene(park(), { quality: pickQuality() });
    } catch (e) {
      throw Object.assign(new Error("WebGL indisponível"), { nowebgl: true, cause: e });
    }
    sc.setActive(false);
    try {
      await sc.load(CNC_GLB, onProgress);
    } catch (e) {
      sc.dispose();
      throw e;
    }
    return sc;
  });
  warm = p;
  p.catch(() => {
    if (warm === p) warm = null;
  });
  return p;
}

/** pré-aquece a cena da home, se a rede e o aparelho comportam */
export function warmHomeScene() {
  if (typeof document === "undefined" || constrainedNetwork() || pickQuality() === "low") return;
  homeScene().catch(() => {});
}

/** a folha saiu: a cena volta a esperar fora da vista, parada */
export function parkHomeScene(sc: import("./CncScene").CncScene) {
  sc.setActive(false);
  sc.attach(park());
}

/** saiu da home: solta o contexto WebGL */
export function disposeHomeScene() {
  const w = warm;
  warm = null;
  w?.then((sc) => sc.dispose()).catch(() => {});
}
