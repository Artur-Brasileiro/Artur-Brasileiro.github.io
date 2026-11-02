import { getLenis } from "@/components/motion/SmoothScroll";

/** Altura da barra fixa (56px) mais um respiro: onde uma seção para depois do salto. */
export const NAV_OFFSET = 72;

/** Rola até a seção descontando a barra, pelo Lenis quando ele está ativo. */
export const scrollWithOffset = (el: HTMLElement) => {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(el, { offset: -NAV_OFFSET });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y - NAV_OFFSET, behavior: "smooth" });
  }
};
