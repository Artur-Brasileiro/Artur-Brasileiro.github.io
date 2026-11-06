/**
 * Carga do simulador da CNC: o chunk da cena, o GLB e as fontes de traço.
 *
 * Sai tudo em paralelo assim que a página do projeto é avaliada — senão seria
 * uma fila (página → chunk do three → GLB). Em conexão lenta ou com economia
 * de dados ligada, nada sai sozinho: a pessoa vê o pôster e escolhe carregar.
 */
import type { StrokeFont, FontId } from "./text";

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
  loadScene().catch(() => {}); // a falha de verdade aparece no componente
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
