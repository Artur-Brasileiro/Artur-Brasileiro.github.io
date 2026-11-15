/** O visualizador de fotos é um só por página: este é o estado dele. */
import { useSyncExternalStore } from "react";

export type Shown = { src: string; alt: string; title: string; caption: string; n?: string };
let shown: Shown | null = null;
let last: Shown | null = null;
const subs = new Set<() => void>();
const set = (v: Shown | null) => {
  shown = v;
  if (v) last = v;
  subs.forEach((f) => f());
};
export const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

export function openPhoto(p: Shown) {
  set(p);
}

/** a foto aberta agora (null fechado) e a última aberta, que segue desenhada enquanto o modal sai */
export function useShownPhoto() {
  const cur = useSyncExternalStore(subscribe, () => shown);
  return { cur, last };
}

export const closePhoto = () => set(null);

/**
 * Cada foto existe em 800, 1200 e 1600 px (<id>-800.webp, <id>-1200.webp, <id>.webp). Meia coluna
 * no desktop é o padrão; foto na largura toda do capítulo usa FULL. O
 * visualizador sempre abre a de 1600, para o zoom.
 */
export const HALF = "(max-width: 640px) 100vw, 560px";
export const FULL = "(max-width: 640px) 100vw, 1100px";
