/**
 * Carga do simulador do pêndulo: o chunk da cena e o GLB saem em paralelo assim
 * que a página do projeto é avaliada. Em conexão lenta ou com economia de dados
 * ligada, nada sai sozinho: a pessoa escolhe carregar.
 */
import type { Quality } from "./PenduloScene";

export const PENDULO_GLB = "/projetos/pendulo/pendulo.glb";
/** o que o 3D custa (three ~213 KB gz + cena + GLB 158 KB), para o botão de carregar sob demanda */
export const PENDULO_3D_KB = 400;

export const loadScene = () => import("./PenduloScene");

type NetInfo = { saveData?: boolean; effectiveType?: string };

/** economia de dados ligada ou rede 2G: não baixa 3D sem a pessoa pedir */
export function constrainedNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: NetInfo }).connection;
  return !!c && (c.saveData === true || c.effectiveType === "slow-2g" || c.effectiveType === "2g");
}

let started = false;
export function preloadPendulo() {
  if (started || typeof document === "undefined" || constrainedNetwork()) return;
  started = true;
  loadScene()
    .then((m) => m.prefetchModel(PENDULO_GLB))
    .catch(() => {}); // a falha de verdade aparece no componente
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "fetch";
  link.crossOrigin = "anonymous";
  link.href = PENDULO_GLB;
  document.head.appendChild(link);
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
