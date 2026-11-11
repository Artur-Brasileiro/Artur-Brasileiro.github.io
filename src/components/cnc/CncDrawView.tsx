/**
 * A folha da CNC na home: a máquina sobre a mesa de pinus, com o papel,
 * desenhando um par de engrenagens.
 *
 * Toca como um vídeo, em velocidade constante: a rolagem só tira o título e dá
 * a partida, e rolar rápido ou devagar não muda nada. O carimbo tem play,
 * pausa e a linha do tempo. Fora da tela, pausa; de volta, continua. O
 * desenho de verdade leva ~80 s de máquina; aqui ele passa a 2,5×.
 *
 * Mesmo contrato da vista explodida (trilha de scroll, área fixa, HUD por
 * cima via `children`), para o hero tratar as folhas igual. O motor é a
 * CncScene do simulador no modo da home: sem controles de órbita, com a tinta
 * do desenho inteiro gerada uma vez só.
 */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EL_LIMIT, type ExplodedState, type FitBox, type PartsConfig } from "@/components/three/explode";
import { layoutFromScroll, prefersReducedMotion, usePlayback } from "@/components/home/playback";
import { buildTimeline } from "./machine";
import { gearDrawing } from "./gear";
import { homeScene, parkHomeScene } from "./preload";
import type { CncScene, HomeFraming } from "./CncScene";

/** o desenho real leva ~79 s; a 2,5× fica em ~32 s, ainda legível */
const SPEED = 2.5;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ramp = (q: number, a: number, b: number) => clamp01((q - a) / (b - a));
const FULL: FitBox = { x: 0, y: 0, w: 1, h: 1 };

type Phase = "loading" | "ready" | "error" | "nowebgl";

/** O programa da home e o "carimbo" dele: cada parte do desenho vira uma linha da lista e uma etapa (na escala 0–1 do desenho). */
function useDrawing() {
  return useMemo(() => {
    const { program, parts } = gearDrawing();
    const tl = buildTimeline(program);
    const toU = (t: number) => t / tl.duration;
    const startOf = (cmd: number) => {
      for (let k = 0; k < tl.n; k++) if (tl.cmd[k] >= cmd) return tl.t0[k];
      return tl.duration;
    };
    let lastInk = 0;
    for (let k = 0; k < tl.n; k++) if (tl.draw[k]) lastInk = tl.t1[k];
    const starts = parts.map((p) => toU(startOf(p.firstCmd)));
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
      stages: [[0, "Caneta erguida, papel em branco"], ...parts.map((p, i): [number, string] => [starts[i], p.name]), [toU(lastInk), "Pronto · a caneta volta à origem"]],
    };
    return { program, cfg, duration: tl.duration };
  }, []);
}

type Props = {
  /** altura da trilha de scroll, em vh */
  trackVh?: number;
  className?: string;
  /** caixa (frações da área fixa) onde a máquina deve caber inteira, pelo progresso do layout */
  fit?: (q: number) => FitBox | null;
  children?: (s: ExplodedState) => ReactNode;
};

const CncDrawView = forwardRef<HTMLElement, Props>(function CncDrawView({ trackVh = 160, className = "", fit, children }, ref) {
  const { program, cfg, duration } = useDrawing();
  const track = useRef<HTMLElement | null>(null);
  const stick = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CncScene | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [loaded, setLoaded] = useState(0);
  const [attempt, setAttempt] = useState(0);
  // o aviso de carga só aparece se a carga demorar: com o modelo pré-carregado
  // a máquina surge antes disso, e o aviso piscando seria só ruído
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 600);
    return () => window.clearTimeout(t);
  }, [attempt]);
  /** layout: o título saindo e a caixa indo para o meio; vem da rolagem */
  const [q, setQ] = useState(0);
  const layout = useRef(0);
  /** a pessoa rolou: o desenho deve começar assim que a cena estiver pronta */
  const [wants, setWants] = useState(false);
  const fitRef = useRef(fit);
  fitRef.current = fit;
  const drag = useRef({ az: 0, el: 0, active: false, x: 0, y: 0 });

  const play = usePlayback(duration, SPEED, (u) => scene.current?.scrubTo(u, true));
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

  /* rolou e a cena está pronta: toca (uma vez; depois, só pelos botões) */
  useEffect(() => {
    if (phase === "ready" && wants && !playRef.current.started && !prefersReducedMotion()) playRef.current.play();
  }, [phase, wants]);

  /* câmera: começa de quina, baixa, mostrando a máquina; conforme o desenho
     avança, sobe e gira até o papel ficar alinhado com a tela, para o par de
     engrenagens aparecer inteiro e legível no fim. A mesa é mais comprida que
     larga: em caixa deitada (desktop) o comprimento fica na horizontal; em
     caixa em pé (celular) ele vai para a vertical, senão sobraria tela vazia
     em cima e embaixo da máquina. A caixa vem do layout; o ângulo, do desenho. */
  const framing = useCallback<HomeFraming>((u) => {
    const box = fitRef.current?.(layout.current) ?? FULL;
    const d = drag.current;
    const k = ramp(u, 0.05, 0.95);
    const ease = k * k * (3 - 2 * k);
    const s = stick.current;
    const tall = !!s && (box.w * s.clientWidth) / (box.h * s.clientHeight) < 0.9;
    // a frente da máquina é o lado −X da mesa (onde o carro aponta a caneta); az = π olha dali
    const az = (tall ? Math.PI - 0.5 - (Math.PI / 2 - 0.54) * ease : Math.PI + 0.34 - 0.3 * ease) + d.az;
    const el = Math.max(0.12, Math.min(EL_LIMIT, (tall ? 0.6 + 0.48 * ease : 0.46 + 0.56 * ease) + d.el));
    return { box, az, el };
  }, []);

  /* a cena: a guardada da home (ou uma nova), e o desenho como linha do tempo */
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let sc: CncScene | null = null;
    setPhase("loading");
    setLoaded(0);
    homeScene((p) => setLoaded(Math.round(p * 100)))
      .then((s) => {
        if (disposed) return;
        sc = s;
        scene.current = s;
        s.attach(el);
        s.enterScrub(program, framing, { window: [0, 1] });
        s.scrubTo(playRef.current.u, true);
        s.setActive(true);
        setPhase("ready");
      })
      .catch((e) => {
        console.warn("folha da CNC indisponível:", e);
        if (!disposed) setPhase((e as { nowebgl?: boolean }).nowebgl ? "nowebgl" : "error");
      });
    return () => {
      disposed = true;
      // a cena não morre: volta a esperar, pronta para a próxima troca
      if (sc) parkHomeScene(sc);
      scene.current = null;
    };
  }, [program, framing, attempt]);

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
      if (play.u >= at) i = k;
    });
    return { stage: cfg.stages[i][1], stageIndex: i };
  }, [cfg, play.u]);

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
          className="absolute inset-0 cursor-grab transition-opacity duration-500 active:cursor-grabbing"
          style={{ opacity: phase === "ready" ? 1 : 0 }}
        />

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
            {phase === "nowebgl" && <p className="max-w-[34ch] text-center">este navegador não abriu o WebGL, então a máquina não aparece em 3D.</p>}
          </div>
        )}

        {children?.({ q, cfg, stage, stageIndex, play })}
      </div>
    </section>
  );
});

export default CncDrawView;
