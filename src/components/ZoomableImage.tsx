/**
 * Foto que cabe inteira na área e deixa ampliar e passear por ela.
 *
 * Roda do mouse e pinça ampliam em volta do ponteiro; duplo clique (ou toque)
 * alterna entre a foto inteira e 2,5×; arrastar move a foto ampliada. O
 * deslocamento é limitado para a borda da foto nunca descolar da borda da área.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Scan } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX = 5;
const STEP = 1.6;

type View = { s: number; x: number; y: number };
const FIT: View = { s: 1, x: 0, y: 0 };

export default function ZoomableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [view, setView] = useState<View>(FIT);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const moved = useRef(false);
  // durante o gesto a foto segue o dedo sem animação
  const [gesturing, setGesturing] = useState(false);

  // foto nova começa inteira
  useEffect(() => setView(FIT), [src]);

  /** mantém a foto ampliada cobrindo a área: sem faixa vazia entre a borda e a foto */
  const clamp = useCallback((v: View): View => {
    const b = box.current,
      i = img.current;
    if (!b || !i) return v;
    const s = Math.min(MAX, Math.max(1, v.s));
    const mx = Math.max(0, (i.offsetWidth * s - b.clientWidth) / 2);
    const my = Math.max(0, (i.offsetHeight * s - b.clientHeight) / 2);
    return { s, x: Math.min(mx, Math.max(-mx, v.x)), y: Math.min(my, Math.max(-my, v.y)) };
  }, []);

  /** amplia para `s` mantendo parado o ponto da foto sob (cx, cy), relativos ao centro da área */
  const zoomAt = useCallback(
    (s: number, cx = 0, cy = 0) =>
      setView((p) => {
        const ns = Math.min(MAX, Math.max(1, s));
        const k = ns / p.s;
        return clamp({ s: ns, x: cx - (cx - p.x) * k, y: cy - (cy - p.y) * k });
      }),
    [clamp],
  );

  const fromCenter = (clientX: number, clientY: number) => {
    const r = box.current!.getBoundingClientRect();
    return [clientX - r.left - r.width / 2, clientY - r.top - r.height / 2] as const;
  };

  // a roda precisa de listener não passivo para não rolar o que está atrás
  useEffect(() => {
    const b = box.current;
    if (!b) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [cx, cy] = fromCenter(e.clientX, e.clientY);
      setView((p) => {
        const ns = Math.min(MAX, Math.max(1, p.s * Math.exp(-e.deltaY * 0.0015)));
        const k = ns / p.s;
        return clamp({ s: ns, x: cx - (cx - p.x) * k, y: cy - (cy - p.y) * k });
      });
    };
    b.addEventListener("wheel", onWheel, { passive: false });
    return () => b.removeEventListener("wheel", onWheel);
  }, [clamp]);

  // a área muda de tamanho (girar o celular, redimensionar): refaz o limite
  useEffect(() => {
    const b = box.current;
    if (!b) return;
    const ro = new ResizeObserver(() => setView((p) => clamp(p)));
    ro.observe(b);
    return () => ro.disconnect();
  }, [clamp]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    setGesturing(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    if (Math.hypot(next.x - prev.x, next.y - prev.y) > 2) moved.current = true;

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const [cx, cy] = fromCenter((a.x + b.x) / 2, (a.y + b.y) / 2);
      zoomAt((pinch.current.s * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.d, cx, cy);
    } else if (pointers.current.size === 1) {
      setView((p) => (p.s > 1 ? clamp({ ...p, x: p.x + next.x - prev.x, y: p.y + next.y - prev.y }) : p));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setGesturing(false);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const [cx, cy] = fromCenter(e.clientX, e.clientY);
    if (view.s > 1.05) setView(FIT);
    else zoomAt(2.5, cx, cy);
  };

  const zoomed = view.s > 1.01;
  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div
        ref={box}
        className={cn(
          "flex h-full w-full select-none items-center justify-center overflow-hidden",
          zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        )}
        // os gestos são todos nossos: sem isso o navegador rola ou dá zoom na página
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <img
          ref={img}
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full object-contain"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`,
            // gesto acompanha o dedo; botões e duplo clique animam
            transition: gesturing ? "none" : "transform 160ms ease-out",
          }}
          onLoad={() => setView(FIT)}
        />
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-background/90 p-1 shadow-soft-sm backdrop-blur-sm">
        <button type="button" className={btn} onClick={() => zoomAt(view.s / STEP)} disabled={!zoomed} aria-label="Diminuir zoom">
          <Minus className="h-4 w-4" />
        </button>
        <span className="tabular w-12 text-center font-mono text-xs text-muted-foreground" aria-live="polite">
          {Math.round(view.s * 100)}%
        </span>
        <button type="button" className={btn} onClick={() => zoomAt(view.s * STEP)} disabled={view.s >= MAX} aria-label="Aumentar zoom">
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" className={btn} onClick={() => setView(FIT)} disabled={!zoomed} aria-label="Ver a foto inteira">
          <Scan className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
