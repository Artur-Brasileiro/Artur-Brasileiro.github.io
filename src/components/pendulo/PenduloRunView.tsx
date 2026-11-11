/**
 * A folha do pêndulo na home: o aparelho sobre a mesa, ligando sozinho. Confere
 * o motor, sobe balançando, pega no topo, equilibra; leva um tapa, cai e sobe
 * de novo sozinho.
 *
 * Toca como um vídeo, em tempo real: a rolagem só tira o título e dá a
 * partida, e rolar rápido ou devagar não muda nada. O carimbo tem play, pausa e
 * a linha do tempo. Fora da tela, pausa; de volta, continua.
 *
 * Mesmo contrato da folha da CNC (CncDrawView): trilha de scroll, área fixa e
 * o HUD por cima via `children`, para o hero tratar todas as folhas igual. A
 * corrida é a do simulador (física + firmware), gravada uma vez em run.ts.
 */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EL_LIMIT, type ExplodedState, type FitBox, type PartsConfig } from "@/components/three/explode";
import { layoutFromScroll, prefersReducedMotion, usePlayback } from "@/components/home/playback";
import { recordRun } from "./run";
import { loadScene, PENDULO_GLB, pickQuality } from "./preload";
import type { HomeFraming, PenduloScene } from "./PenduloScene";

/** tempo real: a corrida inteira leva ~12 s, e é o tempo do aparelho */
const SPEED = 1;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ramp = (q: number, a: number, b: number) => clamp01((q - a) / (b - a));
const FULL: FitBox = { x: 0, y: 0, w: 1, h: 1 };

type Phase = "loading" | "ready" | "error" | "nowebgl";

/** A corrida e o "carimbo" dela: cada momento vira uma linha da lista e uma etapa (na escala 0–1 da corrida). */
function useRun() {
  return useMemo(() => {
    const run = recordRun();
    const toU = (t: number) => t / run.duration;
    const cfg: PartsConfig = {
      model: "",
      groups: run.marks.map((m, i) => ({
        id: `m${i}`,
        ref: `T+${m.t.toFixed(1).replace(".", ",")}s`,
        name: m.name,
        spec: m.spec,
        explode: [0, 0, 0],
        stage: [0, 0],
        // acende quando a corrida chega neste momento
        reveal: [toU(m.t), toU(m.t) + 0.004],
      })),
      stages: [[0, "Desligado · carro no batente, haste pendurada"], ...run.marks.map((m): [number, string] => [toU(m.t), m.label])],
    };
    return { run, cfg };
  }, []);
}

type Props = {
  /** altura da trilha de scroll, em vh */
  trackVh?: number;
  className?: string;
  /** caixa (frações da área fixa) onde o aparelho deve caber inteiro, pelo progresso do layout */
  fit?: (q: number) => FitBox | null;
  children?: (s: ExplodedState) => ReactNode;
};

const PenduloRunView = forwardRef<HTMLElement, Props>(function PenduloRunView({ trackVh = 160, className = "", fit, children }, ref) {
  const { run, cfg } = useRun();
  const track = useRef<HTMLElement | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<PenduloScene | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [loaded, setLoaded] = useState(0);
  const [attempt, setAttempt] = useState(0);
  // o aviso de carga só aparece se a carga demorar
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 600);
    return () => window.clearTimeout(t);
  }, [attempt]);
  /** layout: o título saindo e a caixa indo para o meio; vem da rolagem */
  const [q, setQ] = useState(0);
  const layout = useRef(0);
  /** a pessoa rolou: a corrida deve começar assim que a cena estiver pronta */
  const [wants, setWants] = useState(false);
  const fitRef = useRef(fit);
  fitRef.current = fit;
  const drag = useRef({ az: 0, el: 0, active: false, x: 0, y: 0 });

  const play = usePlayback(run.duration, SPEED, (u) => scene.current?.scrubTo(u, true));
  const playRef = useRef(play);
  playRef.current = play;

  const setTrack = useCallback(
    (el: HTMLElement | null) => {
      track.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  /* a rolagem só mexe no layout e dá a partida */
  const readScroll = useCallback(() => {
    const t = track.current;
    if (!t) return;
    const px = -t.getBoundingClientRect().top;
    const v = Math.round(layoutFromScroll(px) * 1000) / 1000;
    if (v !== layout.current) {
      layout.current = v;
      setQ(v);
      scene.current?.reframe();
    }
    if (px > 4) setWants(true);
  }, []);

  useEffect(() => {
    readScroll();
    addEventListener("scroll", readScroll, { passive: true });
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

  /* rolou e a cena está pronta: toca (uma vez; depois, só pelos botões) */
  useEffect(() => {
    if (phase === "ready" && wants && !playRef.current.started && !prefersReducedMotion()) playRef.current.play();
  }, [phase, wants]);

  /* câmera: de frente e um pouco de lado, quase na altura do trilho, para a
     haste em pé contra o fundo; conforme a corrida anda, gira devagar para a
     frente, que é de onde o balanço se lê melhor. A caixa vem do layout. */
  const framing = useCallback<HomeFraming>((u) => {
    const box = fitRef.current?.(layout.current) ?? FULL;
    const d = drag.current;
    const k = ramp(u, 0.05, 0.95);
    const ease = k * k * (3 - 2 * k);
    const az = -Math.PI / 2 + 0.62 - 0.4 * ease + d.az;
    const el = Math.max(0.05, Math.min(EL_LIMIT, 0.3 - 0.1 * ease + d.el));
    return { box, az, el };
  }, []);

  /* a cena: chunk do three, GLB, e o modo da home (a corrida gravada como linha do tempo) */
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let sc: PenduloScene | null = null;
    setPhase("loading");
    setLoaded(0);
    loadScene()
      .then(({ PenduloScene }) => {
        if (disposed) return;
        try {
          sc = new PenduloScene(el, { quality: pickQuality() });
        } catch (e) {
          throw Object.assign(new Error("WebGL indisponível"), { nowebgl: true, cause: e });
        }
        scene.current = sc;
        sc.enterScrub(run, framing, { window: [0, 1] });
        sc.scrubTo(playRef.current.u, true);
        return sc.load(PENDULO_GLB, (p) => setLoaded(Math.round(p * 100))).then(() => {
          if (!disposed) setPhase("ready");
        });
      })
      .catch((e) => {
        console.warn("folha do pêndulo indisponível:", e);
        if (!disposed) setPhase((e as { nowebgl?: boolean }).nowebgl ? "nowebgl" : "error");
      });
    return () => {
      disposed = true;
      sc?.dispose();
      scene.current = null;
    };
  }, [run, framing, attempt]);

  /* fora da tela: a cena não desenha e o vídeo pausa; de volta, continua */
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let autoPaused = false;
    const io = new IntersectionObserver(
      ([e]) => {
        scene.current?.setActive(e.isIntersecting);
        const p = playRef.current;
        if (!e.isIntersecting && p.playing) {
          p.pause();
          autoPaused = true;
        } else if (e.isIntersecting && autoPaused) {
          autoPaused = false;
          p.play();
        }
      },
      { rootMargin: "200px 0px" },
    );
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
    d.el = Math.max(-0.25, Math.min(0.6, d.el + (e.clientY - d.y) * 0.005));
    d.x = e.clientX;
    d.y = e.clientY;
    scene.current?.reframe();
  };
  const onUp = () => {
    drag.current.active = false;
  };

  const { stage, stageIndex } = useMemo(() => {
    let i = 0;
    // antes do play, o aparelho está desligado
    if (play.started)
      cfg.stages.forEach(([at], k) => {
        if (play.u >= at) i = k;
      });
    return { stage: cfg.stages[i][1], stageIndex: i };
  }, [cfg, play.u, play.started]);

  const box = fit?.(q) ?? FULL;

  return (
    <section ref={setTrack} className={`relative ${className}`} style={{ height: `${trackVh}vh` }}>
      <div
        className="sticky top-0 h-[100svh] overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div ref={host} className="absolute inset-0 cursor-grab transition-opacity duration-500 active:cursor-grabbing" style={{ opacity: phase === "ready" ? 1 : 0 }} />

        {phase !== "ready" && (slow || phase !== "loading") && (
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
            {phase === "nowebgl" && <p className="max-w-[34ch] text-center">este navegador não abriu o WebGL, então o pêndulo não aparece em 3D.</p>}
          </div>
        )}

        {children?.({ q, cfg, stage, stageIndex, play })}
      </div>
    </section>
  );
});

export default PenduloRunView;
