/**
 * Monta o guia de construção só quando ele vai ser visto.
 *
 * O guia tem ~4 mil elementos. Montado junto com o topo, competia com o
 * simulador 3D pelo processador: num celular lento (CPU 4×), eram ~2,3 s a
 * mais de travamento ao abrir a página. Agora ele espera o primeiro destes:
 *  - o leitor chegar a 1500 px dele (ou clicar em "Monte a sua", que rola até
 *    o lugar guardado);
 *  - o navegador ficar ocioso (depois que o 3D assentou);
 *  - um endereço com âncora (#ligacoes, por exemplo), que precisa dele já.
 * A montagem vai numa transition: o React a fatia em pedaços pequenos e a
 * página continua respondendo enquanto isso.
 */
import { startTransition, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { SHOW } from "./nav";

export default function DeferredGuide({ id, children }: { id: string; children: ReactNode }) {
  const [show, setShow] = useState(() => typeof window !== "undefined" && window.location.hash.length > 1);
  const spot = useRef<HTMLElement>(null);

  useEffect(() => {
    if (show) return;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      startTransition(() => setShow(true));
    };
    const now = () => setShow(true);
    window.addEventListener(SHOW, now);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && go(), { rootMargin: "1500px 0px" });
    if (spot.current) io.observe(spot.current);
    const idle = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 6000 }) : window.setTimeout(go, 3000);
    return () => {
      window.removeEventListener(SHOW, now);
      io.disconnect();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [show]);

  // o lugar guardado tem a âncora do guia: "Monte a sua" rola até aqui antes de ele existir
  const placeholder = (ref?: React.Ref<HTMLElement>) => (
    <section ref={ref} id={id} className="min-h-[100svh] border-b border-border bg-surface" aria-busy="true" />
  );

  if (!show) return placeholder(spot);
  return <Suspense fallback={placeholder()}>{children}</Suspense>;
}
