/**
 * Navegação dos guias: rolar até um ponto (corrigindo o pouso), o índice que
 * some sobre o diagrama largo e o pedido para montar o guia antes da hora.
 */
import { useEffect, useState, type RefObject } from "react";
import { getLenis } from "@/components/motion/SmoothScroll";

/** o índice só existe do lg (1024 px) para cima: no celular nenhum dos ganchos dele roda */
export const LG = "(min-width: 1024px)";
export function useMatch(query: string) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/**
 * Rola até um elemento pelo Lenis (que já desconta o scroll-padding-top do
 * html: 96 px, a barra e um respiro). Os capítulos longe da tela têm altura
 * estimada (content-visibility) até aparecerem, então o alvo anda durante a
 * viagem: ao chegar, se não pousou no lugar, corrige (até 3 vezes).
 */
export function scrollToEl(el: HTMLElement, tries = 4, duration?: number) {
  const lenis = getLenis();
  if (!lenis) {
    el.scrollIntoView();
    return;
  }
  // o Lenis guarda a altura da página; se o guia acabou de entrar, ela mudou e o limite dele está velho
  lenis.resize();
  lenis.scrollTo(el, {
    duration,
    onComplete: () =>
      requestAnimationFrame(() => {
        const off = el.getBoundingClientRect().top - 96;
        if (Math.abs(off) > 4 && tries > 0) scrollToEl(el, tries - 1, 0.35);
      }),
  });
}

/** rola até um capítulo pelo Lenis; sem ele, a âncora nativa resolve */
export function goTo(e: React.MouseEvent, id: string) {
  const el = document.getElementById(id);
  if (!el || !getLenis()) return;
  e.preventDefault();
  scrollToEl(el);
}

/**
 * Esconde o índice enquanto um bloco que sai da coluna (o diagrama largo)
 * passa pela altura dele. A faixa vigiada vai do topo do índice até o fim
 * dele, medido de verdade: um índice de 14 capítulos desce bem mais que um de
 * 7, e numa tela baixa ele ocupa a altura toda (aí qualquer pedaço do bloco à
 * vista já esconde o índice).
 */
export function useTocHidden(wide: RefObject<HTMLElement | null>) {
  const lg = useMatch(LG);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const el = wide.current;
    const toc = document.querySelector<HTMLElement>("[data-guide-toc]");
    if (!lg || !el || !toc) return;
    let io: IntersectionObserver | undefined;
    // a altura do índice chega pelo ResizeObserver (sem forçar layout ao abrir a página)
    const make = (tocH: number) => {
      io?.disconnect();
      const bottom = 96 + tocH + 24;
      io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), {
        rootMargin: `-80px 0px -${Math.max(0, window.innerHeight - bottom)}px 0px`,
      });
      io.observe(el);
    };
    let h = 0;
    const ro = new ResizeObserver(([e]) => {
      h = e.contentRect.height;
      make(h);
    });
    ro.observe(toc);
    const onResize = () => make(h);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [wide, lg]);
  return lg && hidden;
}

export const SHOW = "guide:show";

/**
 * Para um link que aponta para dentro do guia (o "Desenhos ↓" do topo): pede o
 * guia já e devolve o elemento quando ele existir (ou null depois de ~3 s).
 */
export function whenGuideHas(id: string): Promise<HTMLElement | null> {
  window.dispatchEvent(new Event(SHOW));
  return new Promise((resolve) => {
    const t0 = performance.now();
    const look = () => {
      const el = document.getElementById(id);
      if (el || performance.now() - t0 > 3000) resolve(el);
      else requestAnimationFrame(look);
    };
    look();
  });
}
