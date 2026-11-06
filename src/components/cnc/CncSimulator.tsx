/**
 * Simulador da CNC plotter: a máquina em 3D desenhando, com os controles do
 * artifact (programa, velocidade, eixos, caneta, vistas, raio-X) e uma aba a
 * mais: a pessoa digita e a máquina escreve no papel.
 *
 * Carga em três degraus, para qualquer conexão: o pôster (uma imagem) aparece
 * na hora; o 3D (chunk do three + GLB, ~530 KB) chega por baixo com barra de
 * progresso; as fontes de traço (~8 KB cada) só quando alguém vai escrever.
 * Com economia de dados ou 2G, o 3D espera a pessoa pedir.
 *
 * A cena (CncScene) é three puro e imperativo. Os números que mudam a cada
 * quadro (posição, passos, progresso) são escritos direto no DOM pelas refs: re-
 * renderizar o React 15 vezes por segundo não acrescentaria nada.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Eraser, FileCode2, Maximize2, Minimize2, Pause, PenLine, Play, RotateCcw, Sparkles } from "lucide-react";
import { useLenisLock } from "@/components/motion/useLenisLock";
import { getLenis } from "@/components/motion/SmoothScroll";
import { cn } from "@/lib/utils";
import GcodeDialog from "./GcodeDialog";
import { CNC_3D_KB, CNC_GLB, CNC_POSTER, constrainedNetwork, loadFont, loadScene, pickQuality } from "./preload";
import { demoProgram, formatDuration, SERVO_W, STEPS_MM, TH_DOWN, TH_UP, V_DRAW, V_RAPID, X_MAX, Y_MAX, type Cmd } from "./machine";
import { FONT_CREDIT, FONT_IDS, FONT_LABEL, MAX_CHARS, normalizeText, textProgram, type FontId, type StrokeFont, type TextLayout } from "./text";
import type { CncScene, Snapshot, ViewName } from "./CncScene";

type Phase = "wait" | "loading" | "ready" | "error" | "nowebgl";
type Tab = "escrever" | "eixos" | "exibir";
type Program = { kind: "demo" | "texto"; label: string; cmds: Cmd[]; file: string };

const VIEWS: [ViewName, string][] = [
  ["geral", "Geral"],
  ["ponte", "Ponte"],
  ["carro", "Carro"],
  ["baixo", "Por baixo"],
];
const SPEEDS = [1, 5, 20];

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** tempo restante a partir de cada comando, a 1× (para o "faltam ~") */
function remainingTimes(P: Cmd[]): Float64Array {
  const out = new Float64Array(P.length + 1);
  const each = new Float64Array(P.length);
  let x = 0,
    y = 0;
  P.forEach((c, i) => {
    if (c.t === "pen") each[i] = (TH_UP - TH_DOWN) / SERVO_W;
    else if (c.t === "mv") {
      each[i] = Math.hypot(c.x - x, c.y - y) / (c.rapid ? V_RAPID : V_DRAW);
      x = c.x;
      y = c.y;
    }
  });
  for (let i = P.length - 1; i >= 0; i--) out[i] = out[i + 1] + each[i];
  return out;
}

const nf = new Intl.NumberFormat("pt-BR");

const DEMO: Program = { kind: "demo", label: "Desenho de demonstração", cmds: demoProgram(), file: "cnc-demo.gcode" };

export default function CncSimulator() {
  const viewport = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const scene = useRef<CncScene | null>(null);

  const [want3d, setWant3d] = useState(() => !constrainedNetwork());
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => (constrainedNetwork() ? "wait" : "loading"));
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [view, setView] = useState<ViewName>("geral");
  const [colors, setColors] = useState(false);
  const [xray, setXray] = useState(false);
  const [full, setFull] = useState(false);
  const [tab, setTab] = useState<Tab>("escrever");
  const [program, setProgram] = useState<Program>(DEMO);
  const [penTargetDown, setPenTargetDown] = useState(false);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [interacted, setInteracted] = useState(false);
  /** a linha do programa que rodava quando a pessoa abriu o G-code (null: fechado) */
  const [gcodeAt, setGcodeAt] = useState<number | null>(null);

  // o que a cena precisa ler sem re-render
  const visible = useRef(false);
  const autoplay = useRef(true);
  const programRef = useRef(program);
  programRef.current = program;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const remaining = useMemo(() => remainingTimes(program.cmds), [program]);
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;

  /* ---------- leituras ao vivo, direto no DOM ---------- */
  const out = {
    x: useRef<HTMLOutputElement>(null),
    y: useRef<HTMLOutputElement>(null),
    sx: useRef<HTMLInputElement>(null),
    sy: useRef<HTMLInputElement>(null),
    stx: useRef<HTMLElement>(null),
    sty: useRef<HTMLElement>(null),
    ink: useRef<HTMLElement>(null),
    pen: useRef<HTMLSpanElement>(null),
    bar: useRef<HTMLDivElement>(null),
    eta: useRef<HTMLSpanElement>(null),
  };
  const lastI = useRef(0);
  const flags = useRef({ penTargetDown: false, finished: false, started: false });

  const onSnapshot = useCallback((s: Snapshot) => {
    const o = out;
    if (o.x.current) o.x.current.textContent = `${s.x.toFixed(1)} mm`;
    if (o.y.current) o.y.current.textContent = `${s.y.toFixed(1)} mm`;
    if (o.sx.current && document.activeElement !== o.sx.current) o.sx.current.value = String(s.x);
    if (o.sy.current && document.activeElement !== o.sy.current) o.sy.current.value = String(s.y);
    if (o.stx.current) o.stx.current.textContent = nf.format(Math.round(s.x * STEPS_MM));
    if (o.sty.current) o.sty.current.textContent = nf.format(Math.round(s.y * STEPS_MM));
    if (o.ink.current) o.ink.current.textContent = `${(s.ink / 1000).toFixed(2).replace(".", ",")} m`;
    if (o.pen.current) {
      o.pen.current.dataset.down = String(s.penDown);
      o.pen.current.lastChild!.textContent = s.penDown ? "caneta ↓ no papel" : `caneta ↑ ${s.lift.toFixed(1)} mm`;
    }
    if (o.bar.current) o.bar.current.style.transform = `scaleX(${s.len ? s.i / s.len : 0})`;
    if (o.eta.current) {
      const left = (remainingRef.current[Math.min(s.i, remainingRef.current.length - 1)] ?? 0) / speedRef.current;
      o.eta.current.textContent = s.finished ? "concluído" : s.i === 0 && !s.running ? `~${formatDuration(left)} a ${speedRef.current}×` : `faltam ~${formatDuration(left)}`;
    }
    lastI.current = s.i;
    // só o que muda texto de botão passa pelo React, e só quando muda
    if (flags.current.penTargetDown !== s.penTargetDown) {
      flags.current.penTargetDown = s.penTargetDown;
      setPenTargetDown(s.penTargetDown);
    }
    if (flags.current.finished !== s.finished) {
      flags.current.finished = s.finished;
      setFinished(s.finished);
    }
    const st = s.i > 0;
    if (flags.current.started !== st) {
      flags.current.started = st;
      setStarted(st);
    }
    // os refs são estáveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- montagem da cena ---------- */
  useEffect(() => {
    if (!want3d || !host.current) return;
    let disposed = false;
    let sc: CncScene | null = null;
    setPhase("loading");
    setProgress(0);
    loadScene()
      .then(({ CncScene }) => {
        if (disposed || !host.current) return;
        try {
          sc = new CncScene(host.current, {
            quality: pickQuality(),
            tip: tip.current,
            onSnapshot,
            onRunChange: setRunning,
          });
        } catch (e) {
          console.error(e);
          setPhase("nowebgl");
          return;
        }
        scene.current = sc;
        // só em desenvolvimento: deixa a cena à mão no console e nos testes de captura
        if (import.meta.env.DEV) (window as unknown as { __cnc?: CncScene }).__cnc = sc;
        sc.setSpeed(speedRef.current);
        sc.setTouchMode("page");
        sc.setProgram(programRef.current.cmds, false);
        sc.setActive(visible.current);
        return sc.load(CNC_GLB, (p) => setProgress(Math.round(p * 100))).then(() => {
          if (disposed) return;
          setPhase("ready");
          // começa a desenhar sozinha — mas só quando estiver à vista
          if (autoplay.current && !reduceMotion() && visible.current) {
            autoplay.current = false;
            sc!.play();
          }
        });
      })
      .catch((e) => {
        console.error(e);
        if (!disposed) setPhase("error");
      });
    return () => {
      disposed = true;
      sc?.dispose();
      scene.current = null;
    };
  }, [want3d, attempt, onSnapshot]);

  /* fora da tela, a cena para (inclusive o relógio do programa) */
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        scene.current?.setActive(e.isIntersecting);
        if (e.isIntersecting && autoplay.current && phase === "ready" && !reduceMotion()) {
          autoplay.current = false;
          scene.current?.play();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phase]);

  /* ---------- tela cheia (sobreposição, não a Fullscreen API: o iPhone não a tem para isto) ---------- */
  useLenisLock(full);
  useEffect(() => {
    scene.current?.setTouchMode(full ? "full" : "page");
    scene.current?.setActive(full || visible.current);
    if (!full) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);

  /* roda do mouse: na página ela rola a página; o zoom fica no Ctrl (ou na pinça do trackpad) e na tela cheia */
  const [wheelHint, setWheelHint] = useState(false);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    let t = 0;
    const onWheel = (e: WheelEvent) => {
      const zoom = full || e.ctrlKey || e.metaKey;
      scene.current?.setWheelZoom(zoom);
      if (!zoom && phase === "ready") {
        setWheelHint(true);
        window.clearTimeout(t);
        t = window.setTimeout(() => setWheelHint(false), 1400);
      }
    };
    el.addEventListener("wheel", onWheel, { capture: true, passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel, { capture: true });
      window.clearTimeout(t);
    };
  }, [full, phase]);

  /* ---------- ações ---------- */
  const ready = phase === "ready";
  const sc = () => scene.current;

  const togglePlay = () => {
    autoplay.current = false;
    if (running) sc()?.pause();
    else if (finished) sc()?.restart();
    else sc()?.play();
  };

  const startProgram = (p: Program) => {
    autoplay.current = false;
    setProgram(p);
    programRef.current = p;
    lastI.current = 0;
    const s = sc();
    if (!s) return; // ainda carregando: a cena pega o programa quando montar
    s.clearPaper();
    s.setProgram(p.cmds, true);
  };

  const write = (cmds: Cmd[], text: string) => {
    startProgram({ kind: "texto", label: `“${text}”`, cmds, file: `cnc-${slug(text)}.gcode` });
    // no celular o painel fica abaixo do 3D: volta para a máquina ver a escrita
    const el = viewport.current;
    if (el && !full) {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(el, { offset: -72 });
        else el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const chooseSpeed = (s: number) => {
    setSpeed(s);
    sc()?.setSpeed(s);
  };

  const chooseView = (v: ViewName) => {
    setView(v);
    sc()?.setView(v);
  };

  const jog = () => {
    autoplay.current = false;
    sc()?.jog(Number(out.sx.current?.value ?? 0), Number(out.sy.current?.value ?? 0));
  };

  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const hint = coarse
    ? full
      ? "Arraste para girar · pinça para zoom"
      : "Deslize de lado para girar · toque numa peça"
    : full
      ? "Arraste para girar · role para zoom · passe o mouse nas peças"
      : "Arraste para girar · Ctrl + roda para zoom · passe o mouse nas peças";

  return (
    <div
      className={cn(
        "overflow-hidden border border-border bg-background",
        full ? "fixed inset-0 z-[80] flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_400px]" : "relative border-x-0 sm:rounded-lg sm:border-x sm:shadow-soft-sm lg:grid lg:grid-cols-[minmax(0,1fr)_380px]",
      )}
      data-cnc-sim=""
      role={full ? "dialog" : undefined}
      aria-modal={full || undefined}
      aria-label={full ? "Simulador da CNC em tela cheia" : undefined}
    >
      {/* ---------- o 3D ---------- */}
      <div
        ref={viewport}
        className={cn(
          "relative isolate overflow-hidden bg-[radial-gradient(120%_90%_at_60%_35%,#f8f7f3_0%,#e6e5e0_72%)]",
          // no celular, a altura acompanha a largura: a máquina é larga e baixa, e uma caixa alta só sobraria fundo
          full ? "min-h-0 flex-1 lg:h-full" : "h-[clamp(300px,96vw,520px)] lg:h-auto lg:min-h-[640px]",
        )}
        onPointerDown={() => setInteracted(true)}
      >
        <div ref={host} className="absolute inset-0" />

        {/* pôster: aparece na hora e some quando o 3D assume */}
        <picture
          className={cn("pointer-events-none absolute inset-0 transition-opacity duration-500", ready ? "opacity-0" : "opacity-100")}
          aria-hidden={ready}
        >
          <source type="image/webp" srcSet={`${CNC_POSTER}-800.webp 800w, ${CNC_POSTER}-1400.webp 1400w`} sizes="(min-width: 1024px) 860px, 100vw" />
          <img
            src={`${CNC_POSTER}-800.jpg`}
            alt="A CNC plotter sobre a mesa de pinus, com o papel em branco"
            className="h-full w-full object-cover"
            width={1400}
            height={900}
            decoding="async"
            {...{ fetchpriority: "high" }}
          />
        </picture>

        {!ready && (
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="max-w-[320px] rounded-md border border-border bg-background/90 px-5 py-4 text-center font-mono text-[12px] text-muted-foreground shadow-soft-sm backdrop-blur-sm">
              {phase === "loading" && (
                <>
                  <p className="text-foreground">{progress > 0 ? "Carregando o modelo 3D" : "Preparando o 3D"}</p>
                  <div className="mt-3 h-[3px] w-56 max-w-full overflow-hidden rounded bg-border">
                    <div className="h-full origin-left bg-gold transition-transform duration-200" style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
                  </div>
                  <p className="mt-2 tabular-nums">{progress > 0 ? `${progress}%` : "…"}</p>
                </>
              )}
              {phase === "wait" && (
                <>
                  <p className="text-foreground">Sua conexão está no modo econômico.</p>
                  <button type="button" onClick={() => setWant3d(true)} className="mt-3 rounded-md bg-primary px-4 py-2.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover">
                    Carregar a simulação 3D (~{nf.format(CNC_3D_KB)} KB)
                  </button>
                </>
              )}
              {phase === "error" && (
                <>
                  <p className="text-foreground">Não foi possível carregar o modelo 3D.</p>
                  <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 rounded-md bg-primary px-4 py-2.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover">
                    Tentar de novo
                  </button>
                </>
              )}
              {phase === "nowebgl" && <p className="text-foreground">Este navegador não abriu o WebGL. Ative a aceleração de hardware ou tente outro navegador para ver a máquina em 3D.</p>}
            </div>
          </div>
        )}

        {/* vistas e tela cheia */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div
            role="group"
            aria-label="Vistas da câmera"
            className="flex max-w-full gap-0.5 overflow-x-auto rounded-md border border-border bg-background/85 p-0.5 backdrop-blur-sm [scrollbar-width:none]"
          >
            {VIEWS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={!ready}
                aria-pressed={view === id}
                onClick={() => chooseView(id)}
                className={cn(
                  "shrink-0 rounded-[5px] px-2.5 py-1.5 font-mono text-[11.5px] transition-colors disabled:opacity-50 sm:px-3",
                  view === id ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFull((f) => !f)}
            aria-label={full ? "Sair da tela cheia" : "Abrir em tela cheia"}
            title={full ? "Sair da tela cheia (Esc)" : "Tela cheia"}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background/85 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
          >
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {/* dica de uso: some depois do primeiro toque */}
        {ready && (
          <p
            className={cn(
              "pointer-events-none absolute bottom-3 left-3 right-3 font-mono text-[11px] text-muted-foreground transition-opacity duration-500",
              interacted && !wheelHint ? "opacity-0" : "opacity-100",
            )}
          >
            <span className="rounded bg-background/80 px-1.5 py-0.5 backdrop-blur-sm">{wheelHint ? "Use Ctrl + roda (ou a pinça do trackpad) para dar zoom" : hint}</span>
          </p>
        )}

        <div
          ref={tip}
          className="pointer-events-none absolute left-0 top-0 z-10 max-w-[260px] rounded-md border border-border bg-background px-3 py-2 opacity-0 shadow-soft-md transition-opacity duration-150"
          style={{ transform: "translate(-9999px, -9999px)" }}
          role="status"
        >
          <b className="block text-[13px] font-semibold leading-tight text-foreground" />
          <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground" />
        </div>
      </div>

      {/* ---------- painel ---------- */}
      <aside
        className={cn(
          "flex min-w-0 flex-col border-border bg-background lg:border-l",
          full ? "max-h-[46svh] overflow-y-auto overscroll-contain border-t lg:max-h-none lg:border-t-0" : "border-t lg:border-t-0",
        )}
        data-lenis-prevent={full || undefined}
      >
        {/* transporte: o que está rodando, play, velocidade, progresso */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              programa · <span className="normal-case tracking-normal text-foreground">{program.label}</span>
            </p>
            <span ref={out.eta} className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!ready}
              className="inline-flex h-10 min-w-[120px] items-center whitespace-nowrap justify-center gap-2 rounded-md bg-primary px-4 font-mono text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {running ? <Pause className="h-4 w-4" /> : finished ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pausar" : finished ? "Repetir" : started ? "Continuar" : "Desenhar"}
            </button>
            <IconButton label="Limpar papel" onClick={() => sc()?.clearPaper()} disabled={!ready}>
              <Eraser className="h-4 w-4" />
            </IconButton>
            {program.kind === "texto" && (
              <IconButton label="Voltar ao desenho de demonstração" onClick={() => startProgram(DEMO)} disabled={!ready}>
                <Sparkles className="h-4 w-4" />
              </IconButton>
            )}
            <div role="group" aria-label="Velocidade da simulação" className="ml-auto flex rounded-md border border-border p-0.5">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={speed === s}
                  onClick={() => chooseSpeed(s)}
                  className={cn(
                    "rounded-[5px] px-2 py-1.5 font-mono text-[11.5px] tabular-nums transition-colors",
                    speed === s ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5",
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 h-[3px] overflow-hidden rounded bg-border" aria-hidden>
            <div ref={out.bar} className="h-full origin-left bg-gold" style={{ transform: "scaleX(0)" }} />
          </div>
          {/* o G-code fica atrás de um botão: rolando na tela a cada passo, era mais ruído que informação */}
          <button
            type="button"
            onClick={() => setGcodeAt(lastI.current)}
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            <FileCode2 className="h-3.5 w-3.5" />
            Ver e baixar o G-code
          </button>
        </div>

        {/* abas */}
        <div role="tablist" aria-label="Controles" className="flex border-b border-border">
          {(
            [
              ["escrever", "Escrever"],
              ["eixos", "Eixos"],
              ["exibir", "Exibir"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`cnc-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`cnc-panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "-mb-px flex-1 border-b-2 px-3 py-2.5 font-mono text-[12px] transition-colors",
                tab === id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div role="tabpanel" id="cnc-panel-escrever" aria-labelledby="cnc-tab-escrever" hidden={tab !== "escrever"}>
            <WritePanel onWrite={write} disabled={phase === "error" || phase === "nowebgl"} />
          </div>

          <div role="tabpanel" id="cnc-panel-eixos" aria-labelledby="cnc-tab-eixos" hidden={tab !== "eixos"}>
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <b className="font-mono text-[13px]">X</b>
              <input ref={out.sx} type="range" min={0} max={X_MAX} step={0.5} defaultValue={0} onInput={jog} disabled={!ready} aria-label="Eixo X (longo), em mm" className="w-full accent-[#15171a]" />
              <output ref={out.x} className="min-w-[64px] text-right font-mono text-[12px] tabular-nums">0.0 mm</output>
              <small className="col-span-2 col-start-2 -mt-1 text-[11px] text-muted-foreground">eixo longo · barras de 12 mm · motor em ômega</small>
              <b className="mt-2 font-mono text-[13px]">Y</b>
              <input ref={out.sy} type="range" min={0} max={Y_MAX} step={0.5} defaultValue={0} onInput={jog} disabled={!ready} aria-label="Eixo Y (curto), em mm" className="mt-2 w-full accent-[#15171a]" />
              <output ref={out.y} className="mt-2 min-w-[64px] text-right font-mono text-[12px] tabular-nums">0.0 mm</output>
              <small className="col-span-2 col-start-2 -mt-1 text-[11px] text-muted-foreground">eixo curto · barras de 6 mm · fim de curso em Y0</small>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!ready}
                onClick={() => {
                  autoplay.current = false;
                  sc()?.togglePen();
                }}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 font-mono text-[12px] transition-colors hover:border-foreground disabled:opacity-50"
              >
                <PenLine className="h-3.5 w-3.5" />
                {penTargetDown ? "Levantar caneta" : "Baixar caneta"}
              </button>
              <span ref={out.pen} data-down="false" className="group inline-flex items-center gap-1.5 font-mono text-[12px]">
                <i className="h-2 w-2 rounded-full bg-[#b7791f] group-data-[down=true]:bg-[#1f9d55]" />
                <span>caneta ↑</span>
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <Stat label="Passos X" r={out.stx} />
              <Stat label="Passos Y" r={out.sty} />
              <Stat label="Tinta no papel" r={out.ink} />
            </dl>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              Com a caneta abaixada, mover os eixos desenha. Passos com 1/16 de micropasso: {STEPS_MM} por mm.
            </p>
          </div>

          <div role="tabpanel" id="cnc-panel-exibir" aria-labelledby="cnc-tab-exibir" hidden={tab !== "exibir"}>
            <div className="flex flex-wrap gap-2">
              <Chip
                on={colors}
                disabled={!ready}
                onClick={() => {
                  setColors(!colors);
                  sc()?.setColors(!colors);
                }}
              >
                Cor por peça
              </Chip>
              <Chip
                on={xray}
                disabled={!ready}
                onClick={() => {
                  setXray(!xray);
                  sc()?.setXray(!xray);
                }}
              >
                Raio-X
              </Chip>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              <b className="font-medium text-foreground">Cor por peça</b> pinta cada peça impressa de uma cor, para ver onde uma termina e a outra começa.{" "}
              <b className="font-medium text-foreground">Raio-X</b> deixa o PLA translúcido e mostra rolamentos, barras e o caminho das correias por dentro.
            </p>
          </div>
        </div>
      </aside>

      <GcodeDialog
        open={gcodeAt !== null}
        onClose={() => setGcodeAt(null)}
        label={program.label}
        file={program.file}
        cmds={program.cmds}
        current={gcodeAt ?? 0}
        seconds={remaining[0]}
      />
    </div>
  );
}

const slug = (s: string) =>
  normalizeText(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "texto";

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:border-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Chip({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-3 py-1.5 font-mono text-[12px] transition-colors disabled:opacity-50",
        on ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Stat({ label, r }: { label: string; r: React.RefObject<HTMLElement> }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd ref={r as React.RefObject<HTMLElement & HTMLElement>} className="mt-0.5 truncate font-mono text-[13px] tabular-nums text-foreground">
        0
      </dd>
    </div>
  );
}

/* ---------- aba Escrever: campo, fonte, prévia e o botão ---------- */

const SUGGESTIONS = ["Olá, mundo!", "Artur Brasileiro", "CNC feita em casa"];

function WritePanel({ onWrite, disabled }: { onWrite: (cmds: Cmd[], text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const [fontId, setFontId] = useState<FontId>("simples");
  const [font, setFont] = useState<StrokeFont | null>(null);
  const [fontError, setFontError] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    setFontError(false);
    loadFont(fontId)
      .then((f) => alive && setFont(f))
      .catch(() => alive && setFontError(true));
    return () => {
      alive = false;
    };
  }, [fontId]);

  // a prévia segue o que está digitado; a fonte certa é a do id escolhido
  const current = font && font.name === FONT_LABEL[fontId] ? font : null;
  const shown = normalizeText(text) || "Seu texto aqui";
  const preview = useMemo(() => (current ? textProgram(current, shown) : null), [current, shown]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = normalizeText(text);
    if (!t) {
      setError("Digite algo para a máquina escrever.");
      inputRef.current?.focus();
      return;
    }
    if (!current || !preview) return;
    if (!preview.layout.polys.length) {
      setError("Essa fonte não tem nenhuma dessas letras. Tente outra.");
      return;
    }
    setError("");
    inputRef.current?.blur(); // fecha o teclado do celular
    onWrite(preview.program, t);
  };

  const secs = preview ? estimate(preview.program) : 0;

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="cnc-text" className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        o que a máquina escreve
      </label>
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          id="cnc-text"
          type="text"
          inputMode="text"
          enterKeyHint="send"
          autoComplete="off"
          maxLength={MAX_CHARS}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError("");
          }}
          placeholder="Escreva uma frase curta"
          aria-invalid={!!error}
          aria-describedby="cnc-text-help"
          className="h-11 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-[16px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground sm:text-[14px]"
        />
        <button
          type="submit"
          disabled={disabled || !current}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-4 font-mono text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <PenLine className="h-4 w-4" />
          Escrever
        </button>
      </div>
      <div id="cnc-text-help" className="mt-1.5 flex justify-between gap-3 font-mono text-[11px] text-muted-foreground">
        <span className={cn(error && "text-destructive")} role={error ? "alert" : undefined}>
          {error || (fontError ? "Não deu para baixar a fonte. Confira a conexão." : "Acentos e ç funcionam. Enter também escreve.")}
        </span>
        <span className="tabular-nums">
          {text.length}/{MAX_CHARS}
        </span>
      </div>

      {!text && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setText(s)} className="rounded-full border border-border px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      )}

      <div role="group" aria-label="Fonte" className="mt-4 flex rounded-md border border-border p-0.5">
        {FONT_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={fontId === id}
            onClick={() => setFontId(id)}
            className={cn("flex-1 rounded-[5px] py-1.5 font-mono text-[12px] transition-colors", fontId === id ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5")}
          >
            {FONT_LABEL[id]}
          </button>
        ))}
      </div>

      {/* prévia: o papel visto de cima, com o texto já no tamanho que a máquina vai usar */}
      <figure className="mt-3">
        <div className="relative overflow-hidden rounded-md border border-border bg-[#fbfbf7]">
          <PreviewSvg layout={preview?.layout ?? null} placeholder={!normalizeText(text)} />
        </div>
        <figcaption className="mt-1.5 flex justify-between gap-3 font-mono text-[11px] text-muted-foreground">
          <span>prévia · área de 818 × 402 mm</span>
          {preview && normalizeText(text) && (
            <span className="tabular-nums">
              letra de {Math.round(preview.layout.em * 0.7)} mm · {formatDuration(secs / 5)} a 5×
            </span>
          )}
        </figcaption>
      </figure>
      <p className="mt-3 text-[10.5px] leading-relaxed text-muted-foreground">Fonte de traço único, feita para plotter: {FONT_CREDIT[fontId]}.</p>
    </form>
  );
}

const estimate = (P: Cmd[]) => remainingTimes(P)[0];

function PreviewSvg({ layout, placeholder }: { layout: TextLayout | null; placeholder: boolean }) {
  // o papel visto da vista geral: X da máquina cresce para a esquerda (ver text.ts)
  const d = useMemo(() => {
    if (!layout) return "";
    return layout.polys.map((p) => "M" + p.map(([x, y]) => `${(X_MAX - x).toFixed(1)} ${(Y_MAX - y).toFixed(1)}`).join("L")).join("");
  }, [layout]);
  return (
    <svg viewBox={`-10 -10 ${X_MAX + 20} ${Y_MAX + 20}`} className="block h-auto w-full" role="img" aria-label="Prévia do texto no papel">
      <rect x={0} y={0} width={X_MAX} height={Y_MAX} fill="none" stroke="#d7d7d3" strokeDasharray="6 6" strokeWidth={1.5} />
      {d && <path d={d} fill="none" stroke={placeholder ? "#b9bcc4" : "#1b3bb8"} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
