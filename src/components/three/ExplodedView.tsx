/**
 * ExplodedView — vista explodida de um modelo 3D controlada pelo scroll.
 *
 * Esta é a parte leve: a trilha de scroll, a área fixa, o parts.json, o arrasto
 * e o HUD. O three.js mora no ExplodedCanvas, carregado sob demanda — então o
 * que a página desenha por cima (`children`) aparece antes do 3D, e continua lá
 * se o 3D falhar (WebGL indisponível, chunk que não baixou, GLB quebrado).
 *
 * Um projeto novo com vista explodida é uma pasta em /public/projetos/<slug>/
 * com o .glb e o parts.json; nada aqui muda.
 */
import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EL_LIMIT, stageAt, type DragState, type ExplodedState, type PartsConfig, type Shift } from "./explode";

const ExplodedCanvas = lazy(() => import("./ExplodedCanvas"));

type Props = {
  /** caminho do parts.json; o modelo é buscado na mesma pasta */
  configUrl: string;
  /** altura da trilha de scroll, em vh. Menor = explosão mais rápida */
  trackVh?: number;
  className?: string;
  /** estilo da trilha — o fundo dela aparece atrás do canvas transparente */
  style?: CSSProperties;
  /** iluminação do estúdio: `light` para fundo claro, `dark` para escuro */
  studio?: "light" | "dark";
  /** desloca o modelo na tela; pode variar com o progresso para abrir espaço ao texto */
  shift?: Shift;
  /** multiplica a distância da câmera: >1 afasta, <1 aproxima */
  zoom?: number;
  /** HUD desenhado por cima do canvas, dentro da área fixa */
  children?: (s: ExplodedState) => ReactNode;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Se o 3D quebrar, some só o 3D: o HUD e a página seguem de pé. */
class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("vista explodida indisponível:", error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ExplodedView({
  configUrl,
  trackVh = 480,
  className = "",
  style,
  studio = "light",
  shift,
  zoom = 1,
  children,
}: Props) {
  const [cfg, setCfg] = useState<PartsConfig | null>(null);
  const [q, setQ] = useState(0);
  const track = useRef<HTMLElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const drag = useRef<DragState>({ az: 0, el: 0, active: false, touched: false, baseEl: 0.52 });
  const pointer = useRef({ x: 0, y: 0 });
  // em ref: a função de deslocamento muda a cada render da página, e o
  // quadro do canvas só precisa ler a versão mais recente
  const shiftRef = useRef(shift);
  shiftRef.current = shift;

  const baseUrl = useMemo(() => configUrl.replace(/[^/]*$/, ""), [configUrl]);

  useEffect(() => {
    let alive = true;
    fetch(configUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${configUrl}`);
        return r.json();
      })
      .then((d) => {
        if (alive) setCfg(d as PartsConfig);
      })
      // sem config não há modelo, mas a trilha e o HUD ficam: o hero nunca some
      .catch((e) => console.warn("parts.json indisponível:", e));
    return () => {
      alive = false;
    };
  }, [configUrl]);

  useEffect(() => {
    const onScroll = () => {
      const t = track.current,
        s = stick.current;
      if (!t || !s) return;
      const span = t.offsetHeight - s.offsetHeight;
      progress.current = clamp01(span > 0 ? -t.getBoundingClientRect().top / span : 0);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    // no toque, o dedo é do scroll da página; girar é coisa de mouse. E só o
    // próprio canvas gira — um botão do HUD não pode virar alça de arrasto
    if (e.pointerType === "touch" || !(e.target instanceof HTMLCanvasElement)) return;
    drag.current.active = true;
    drag.current.touched = true;
    pointer.current = { x: e.clientX, y: e.clientY };
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    // pega e gira: o modelo segue o ponteiro, então os dois eixos subtraem
    drag.current.az -= (e.clientX - pointer.current.x) * 0.006;
    drag.current.el += (e.clientY - pointer.current.y) * 0.005;
    const b = drag.current.baseEl;
    drag.current.el = Math.max(-EL_LIMIT - b, Math.min(EL_LIMIT - b, drag.current.el));
    pointer.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => {
    drag.current.active = false;
  };

  const { stage, stageIndex } = useMemo(() => stageAt(cfg, q), [cfg, q]);

  return (
    <section ref={track} className={`relative ${className}`} style={{ ...style, height: `${trackVh}vh` }}>
      <div
        ref={stick}
        className="sticky top-0 h-[100svh] overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {cfg && (
          <CanvasBoundary>
            <Suspense fallback={null}>
              <ExplodedCanvas
                cfg={cfg}
                baseUrl={baseUrl}
                studio={studio}
                zoom={zoom}
                progress={progress}
                drag={drag}
                shift={shiftRef}
                onProgress={setQ}
              />
            </Suspense>
          </CanvasBoundary>
        )}

        {children?.({ q, cfg, stage, stageIndex })}
      </div>
    </section>
  );
}
