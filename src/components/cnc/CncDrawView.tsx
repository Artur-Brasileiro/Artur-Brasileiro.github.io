/**
 * A folha da CNC na home: a máquina sobre a mesa de pinus, com o papel, e a
 * rolagem da página fazendo ela desenhar um par de engrenagens. Rolar para cima
 * desfaz o desenho; rolar para baixo continua de onde estava.
 *
 * Mesmo contrato da vista explodida (trilha de scroll, área fixa, HUD por
 * cima via `children`), para o hero tratar as duas folhas igual. A diferença é
 * o motor: aqui é a CncScene do simulador, em modo de rolagem — sem controles
 * de órbita, com a tinta do desenho inteiro gerada uma vez só.
 */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EL_LIMIT, type ExplodedState, type FitBox, type PartsConfig } from "@/components/three/explode";
import { buildTimeline } from "./machine";
import { gearDrawing } from "./gear";
import { CNC_GLB, loadScene, pickQuality } from "./preload";
import type { CncScene, HomeFraming } from "./CncScene";

/** o desenho ocupa esta faixa da trilha: antes o título sai, depois o desenho fica à vista */
const WINDOW: [number, number] = [0.07, 0.92];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ramp = (q: number, a: number, b: number) => clamp01((q - a) / (b - a));
const FULL: FitBox = { x: 0, y: 0, w: 1, h: 1 };

type Phase = "loading" | "ready" | "error" | "nowebgl";

/** O programa da home e o "carimbo" dele: cada parte do desenho vira uma linha da lista e uma etapa. */
function useDrawing() {
  return useMemo(() => {
    const { program, parts } = gearDrawing();
    const tl = buildTimeline(program);
    const toQ = (t: number) => WINDOW[0] + (t / tl.duration) * (WINDOW[1] - WINDOW[0]);
    const startOf = (cmd: number) => {
      for (let k = 0; k < tl.n; k++) if (tl.cmd[k] >= cmd) return tl.t0[k];
      return tl.duration;
    };
    let lastInk = 0;
    for (let k = 0; k < tl.n; k++) if (tl.draw[k]) lastInk = tl.t1[k];
    const starts = parts.map((p) => toQ(startOf(p.firstCmd)));
    const cfg: PartsConfig = {
      model: "",
      groups: parts.map((p, i) => ({
        id: p.ref,
        ref: `DES-${p.ref}`,
        name: p.name,
        spec: p.spec,
        explode: [0, 0, 0],
        stage: [0, 0],
        // acende quando a caneta começa esta parte
        reveal: [starts[i], starts[i] + 0.004],
      })),
      stages: [[0, "Caneta erguida, papel em branco"], ...parts.map((p, i): [number, string] => [starts[i], p.name]), [toQ(lastInk), "Pronto · a caneta volta à origem"]],
    };
    return { program, cfg };
  }, []);
}

type Props = {
  /** altura da trilha de scroll, em vh */
  trackVh?: number;
  className?: string;
  /** caixa (frações da área fixa) onde a máquina deve caber inteira */
  fit?: (q: number) => FitBox | null;
  children?: (s: ExplodedState) => ReactNode;
};

const CncDrawView = forwardRef<HTMLElement, Props>(function CncDrawView({ trackVh = 460, className = "", fit, children }, ref) {
  const { program, cfg } = useDrawing();
  const track = useRef<HTMLElement | null>(null);
  const stick = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CncScene | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [loaded, setLoaded] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [q, setQ] = useState(0);
  const progress = useRef(0);
  const sceneDriving = useRef(false);
  const fitRef = useRef(fit);
  fitRef.current = fit;
  const drag = useRef({ az: 0, el: 0, active: false, x: 0, y: 0 });

  const setTrack = useCallback(
    (el: HTMLElement | null) => {
      track.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  /* a rolagem manda: progresso de 0 a 1 ao longo da trilha */
  const readScroll = useCallback(() => {
    const t = track.current,
      s = stick.current;
    if (!t || !s) return;
    const span = t.offsetHeight - s.offsetHeight;
    progress.current = clamp01(span > 0 ? -t.getBoundingClientRect().top / span : 0);
    scene.current?.scrubTo(progress.current);
    if (!sceneDriving.current) setQ(Math.round(progress.current * 1000) / 1000);
  }, []);

  useEffect(() => {
    readScroll();
    addEventListener("scroll", readScroll, { passive: true });
    // a caixa do celular é medida pelo HUD; depois de girar a tela, refaz a câmera
    let t = 0;
    const onResize = () => {
      readScroll();
      window.clearTimeout(t);
      t = window.setTimeout(() => scene.current?.reframe(), 120);
    };
    addEventListener("resize", onResize);
    return () => {
      removeEventListener("scroll", readScroll);
      removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [readScroll]);

  /* câmera: começa de quina, baixa, mostrando a máquina; conforme o desenho
     avança, sobe e gira até o papel ficar alinhado com a tela, para o par de
     engrenagens aparecer inteiro e legível no fim. A mesa é mais comprida que
     larga: em caixa deitada (desktop) o comprimento fica na horizontal; em
     caixa em pé (celular) ele vai para a vertical, senão sobraria tela vazia
     em cima e embaixo da máquina */
  const framing = useCallback<HomeFraming>((v) => {
    const box = fitRef.current?.(v) ?? FULL;
    const d = drag.current;
    const k = ramp(v, 0.05, 0.95);
    const ease = k * k * (3 - 2 * k);
    const s = stick.current;
    const tall = !!s && (box.w * s.clientWidth) / (box.h * s.clientHeight) < 0.9;
    const az = (tall ? 1.02 + 0.5 * ease : 0.42 - 0.36 * ease) + d.az;
    const el = Math.max(0.12, Math.min(EL_LIMIT, (tall ? 0.62 + 0.46 * ease : 0.52 + 0.5 * ease) + d.el));
    return { box, az, el };
  }, []);

  /* a cena: chunk do three, GLB, e o modo de rolagem */
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let sc: CncScene | null = null;
    setPhase("loading");
    setLoaded(0);
    loadScene()
      .then(({ CncScene }) => {
        if (disposed) return;
        try {
          sc = new CncScene(el, { quality: pickQuality() });
        } catch (e) {
          console.warn("WebGL indisponível:", e);
          setPhase("nowebgl");
          return;
        }
        scene.current = sc;
        sc.enterScrub(program, framing, {
          window: WINDOW,
          onProgress: (v) => {
            sceneDriving.current = true;
            setQ(v);
          },
        });
        sc.scrubTo(progress.current, true);
        return sc.load(CNC_GLB, (p) => setLoaded(Math.round(p * 100))).then(() => {
          if (!disposed) setPhase("ready");
        });
      })
      .catch((e) => {
        console.warn("folha da CNC indisponível:", e);
        if (!disposed) setPhase("error");
      });
    return () => {
      disposed = true;
      sceneDriving.current = false;
      sc?.dispose();
      scene.current = null;
    };
  }, [program, framing, attempt]);

  /* fora da tela, a cena não desenha */
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    const io = new IntersectionObserver(([e]) => scene.current?.setActive(e.isIntersecting), { rootMargin: "200px 0px" });
    io.observe(t);
    return () => io.disconnect();
  }, [phase]);

  /* girar com o mouse; no toque, o dedo é da rolagem da página */
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || !(e.target instanceof HTMLCanvasElement)) return;
    const d = drag.current;
    d.active = true;
    d.x = e.clientX;
    d.y = e.clientY;
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.az -= (e.clientX - d.x) * 0.006;
    d.el = Math.max(-0.6, Math.min(0.6, d.el + (e.clientY - d.y) * 0.005));
    d.x = e.clientX;
    d.y = e.clientY;
    scene.current?.reframe();
  };
  const onUp = () => {
    drag.current.active = false;
  };

  const { stage, stageIndex } = useMemo(() => {
    let i = 0;
    cfg.stages.forEach(([at], k) => {
      if (q >= at) i = k;
    });
    return { stage: cfg.stages[i][1], stageIndex: i };
  }, [cfg, q]);

  // o aviso de carga fica no meio da caixa onde a máquina vai aparecer
  const box = fit?.(q) ?? FULL;

  return (
    <section ref={setTrack} className={`relative ${className}`} style={{ height: `${trackVh}vh` }}>
      <div
        ref={stick}
        className="sticky top-0 h-[100svh] overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div
          ref={host}
          className="absolute inset-0 cursor-grab transition-opacity duration-700 active:cursor-grabbing"
          style={{ opacity: phase === "ready" ? 1 : 0 }}
        />

        {phase !== "ready" && (
          <div
            className="pointer-events-none absolute grid place-items-center font-mono text-[11px] text-muted-foreground"
            style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
          >
            {phase === "loading" && (
              <div className="w-48 text-center">
                <p>carregando o modelo 3D{loaded > 0 ? ` · ${loaded}%` : "…"}</p>
                <div className="mt-2 h-[2px] overflow-hidden bg-border">
                  <div className="h-full origin-left bg-gold transition-transform duration-200" style={{ transform: `scaleX(${Math.max(0.04, loaded / 100)})` }} />
                </div>
              </div>
            )}
            {phase === "error" && (
              <p className="pointer-events-auto text-center">
                não deu para carregar o modelo 3D.{" "}
                <button type="button" onClick={() => setAttempt((a) => a + 1)} className="text-foreground underline underline-offset-4">
                  tentar de novo
                </button>
              </p>
            )}
            {phase === "nowebgl" && <p className="max-w-[34ch] text-center">este navegador não abriu o WebGL, então a máquina não aparece em 3D.</p>}
          </div>
        )}

        {children?.({ q, cfg, stage, stageIndex })}
      </div>
    </section>
  );
});

export default CncDrawView;
