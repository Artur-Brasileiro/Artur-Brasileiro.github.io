/**
 * Simulador do pêndulo invertido: o modelo do CAD em 3D, movido pela física da
 * haste com o controle do Arduino no meio. Liga sozinho como o aparelho real:
 * o carro sai do batente do motor balançando a haste até ela ficar em pé.
 *
 * A pessoa pode empurrar a haste (botões ou arrastando com o mouse), desligar
 * o controle para ver o que acontece sem ele, e acompanhar ângulo, posição e
 * energia ao vivo.
 *
 * A cena (PenduloScene) é three puro e imperativo. Os números que mudam a cada
 * quadro são escritos direto no DOM pelas refs, como no simulador da CNC.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { useLenisLock } from "@/components/motion/useLenisLock";
import { LANG_TAG, tr, type Locale, type Tx } from "@/i18n/core";
import { useLocale, useT } from "@/i18n/react";
import { cn } from "@/lib/utils";
import { constrainedNetwork, loadScene, PENDULO_3D_KB, PENDULO_GLB, pickQuality } from "./preload";
import { FW, type Mode } from "./physics";
import type { PenduloScene, SimEvent, Snapshot, ViewName } from "./PenduloScene";

type Phase = "wait" | "loading" | "ready" | "error" | "nowebgl";

const VIEWS: [ViewName, string | Tx][] = [
  ["geral", tr("Geral", "Overview")],
  ["frente", tr("Frente", "Front")],
  ["carro", tr("Carro", "Cart")],
  ["motor", "Motor"],
  ["esticador", tr("Esticador", "Tensioner")],
];
const SPEEDS: [number, string][] = [
  [1, "1×"],
  [0.5, "½×"],
  [0.25, "¼×"],
];
/** empurrões, em rad/s na haste: o leve o equilíbrio segura; o forte derruba */
const PUSH = { leve: 0.55, forte: 1.6 } as const;
const PUSH_LABEL: Record<keyof typeof PUSH, Tx> = { leve: tr("leve", "light"), forte: tr("forte", "hard") };

const MODE_TEXT: Record<Mode, [Tx, Tx]> = {
  conferindo: [
    tr("Conferindo o motor", "Checking the motor"),
    tr("Um empurrãozinho de 6 mm para o centro: se a haste mexe, o motor tem os 12 V", "A small 6 mm nudge toward the center: if the rod moves, the motor has its 12 V"),
  ],
  subindo: [
    tr("Subindo", "Swinging up"),
    tr("O carro vai e volta e inverte quando a haste passa por baixo, como quem empurra um balanço", "The cart moves back and forth and reverses as the rod passes the bottom, like pushing someone on a swing"),
  ],
  equilibrio: [
    tr("Equilibrando", "Balancing"),
    tr("200 vezes por segundo o carro corre para baixo da haste, como a mão equilibrando uma vassoura", "200 times per second the cart runs under the rod, like a hand balancing a broom"),
  ],
  desligado: [
    tr("Controle desligado", "Control off"),
    tr("O carro freou e ficou parado; a haste está por conta própria", "The cart braked and stopped; the rod is on its own"),
  ],
};

/** os rótulos do gráfico, desenhados no canvas */
const CHART_UP = tr("em pé", "upright"),
  CHART_DOWN = tr("pendurada", "hanging");

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** formatos de número por idioma (0,5 no português, 0.5 no inglês), criados uma vez: as leituras mudam a cada quadro */
const numberFormats = (l: Locale) => ({
  nf1: new Intl.NumberFormat(LANG_TAG[l], { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  nf0: new Intl.NumberFormat(LANG_TAG[l], { maximumFractionDigits: 0 }),
});
const NF: Record<Locale, ReturnType<typeof numberFormats>> = { pt: numberFormats("pt"), en: numberFormats("en") };
const deg = (r: number) => (r * 180) / Math.PI;

/** as cores do site, para o canvas do gráfico */
const INK = "#15171a",
  GOLD = "#94600f",
  GOLD_SOFT = "rgba(201,154,75,0.16)",
  MUTED = "#62666d",
  GRID = "rgba(21,23,26,0.08)",
  OK = "rgba(21,128,61,0.08)";

export default function PenduloSimulator() {
  const viewport = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const chart = useRef<HTMLCanvasElement>(null);
  const scene = useRef<PenduloScene | null>(null);

  const [want3d, setWant3d] = useState(() => !constrainedNetwork());
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => (constrainedNetwork() ? "wait" : "loading"));
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState<ViewName>("geral");
  const [force, setForce] = useState<keyof typeof PUSH>("forte");
  const [control, setControl] = useState(true);
  const [trail, setTrail] = useState(true);
  const [colors, setColors] = useState(false);
  const [xray, setXray] = useState(false);
  const [full, setFull] = useState(false);
  const [mode, setMode] = useState<Mode>("conferindo");
  const [interacted, setInteracted] = useState(false);
  /** o aviso guarda o evento, não o texto: o texto sai no idioma da hora */
  const [toast, setToast] = useState<{ kind: SimEvent["kind"]; after: number; key: number } | null>(null);
  const locale = useLocale();
  const t = useT();
  const nf = NF[locale];
  /** para o que é escrito fora do render (leituras no DOM, gráfico no canvas) */
  const localeRef = useRef(locale);
  localeRef.current = locale;
  /** a última leitura, para reescrever os textos ao trocar de idioma com a simulação parada */
  const lastSnap = useRef<Snapshot | null>(null);

  const visible = useRef(false);
  const autoplay = useRef(true);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  /* ---------- leituras ao vivo, direto no DOM ---------- */
  const out = {
    th: useRef<HTMLElement>(null),
    x: useRef<HTMLElement>(null),
    v: useRef<HTMLElement>(null),
    e: useRef<HTMLDivElement>(null),
    eTxt: useRef<HTMLElement>(null),
    t: useRef<HTMLSpanElement>(null),
    note: useRef<HTMLParagraphElement>(null),
  };
  const modeRef = useRef<Mode>("conferindo");

  const drawChart = useCallback(() => {
    const cv = chart.current,
      sc = scene.current;
    if (!cv || !sc) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth,
      H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const g = cv.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const h = sc.hist;
    const n = h.count;
    const SPAN = 12;
    const tEnd = n ? h.t[(h.head - 1 + h.t.length) % h.t.length] : 0;
    const t0 = Math.max(0, tEnd - SPAN);
    const X = (t: number) => ((t - t0) / SPAN) * W;
    const mid = H / 2;
    // grade: zero e ±90°
    g.strokeStyle = GRID;
    g.lineWidth = 1;
    g.beginPath();
    for (const y of [mid, mid - H * 0.25, mid + H * 0.25]) {
      g.moveTo(0, Math.round(y) + 0.5);
      g.lineTo(W, Math.round(y) + 0.5);
    }
    g.stroke();
    if (!n) return;
    const start = (h.head - n + h.t.length) % h.t.length;
    // faixas do modo: subida em ouro, equilíbrio em verde bem claro
    let k0 = 0;
    for (let k = 1; k <= n; k++) {
      const a = h.m[(start + k0) % h.t.length];
      const b = k < n ? h.m[(start + k) % h.t.length] : -1;
      if (b !== a) {
        if (a > 0) {
          g.fillStyle = a === 2 ? OK : GOLD_SOFT;
          const xa = X(h.t[(start + k0) % h.t.length]),
            xb = X(h.t[(start + k - 1) % h.t.length]);
          g.fillRect(xa, 0, Math.max(1, xb - xa), H);
        }
        k0 = k;
      }
    }
    const line = (val: (j: number) => number, color: string, width: number) => {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.lineJoin = "round";
      g.beginPath();
      let prev: number | null = null;
      for (let k = 0; k < n; k++) {
        const j = (start + k) % h.t.length;
        if (h.t[j] < t0) continue;
        const y = val(j);
        // o ângulo dá a volta em ±180°: não liga o ponto de lá com o de cá
        if (prev !== null && Math.abs(y - prev) > H * 0.6) g.moveTo(X(h.t[j]), y);
        else if (prev === null) g.moveTo(X(h.t[j]), y);
        else g.lineTo(X(h.t[j]), y);
        prev = y;
      }
      g.stroke();
    };
    line((j) => mid - (h.x[j] / 0.21) * (H * 0.45), GOLD, 1.5);
    line((j) => mid - (deg(h.th[j]) / 180) * (H * 0.5), INK, 1.6);
    g.fillStyle = MUTED;
    g.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    g.fillText(CHART_UP[localeRef.current], 4, mid - 4);
    g.fillText(CHART_DOWN[localeRef.current], 4, 11);
  }, []);

  const onSnapshot = useCallback(
    (s: Snapshot) => {
      lastSnap.current = s;
      const o = out;
      const l = localeRef.current;
      const { nf1, nf0 } = NF[l];
      const tl = (pt: string, en: string) => (l === "en" ? en : pt);
      const th = deg(s.th);
      if (o.th.current) o.th.current.textContent = `${th >= 0 ? "+" : "−"}${nf1.format(Math.abs(th))}°`;
      if (o.x.current) o.x.current.textContent = `${s.x >= 0 ? "+" : "−"}${nf0.format(Math.abs(s.x * 1000))} mm`;
      if (o.v.current) o.v.current.textContent = `${nf0.format(Math.abs(s.v * 1000))} mm/s`;
      if (o.e.current) {
        // de −1 (pendurada parada) a +0,1 (um pouco acima da energia do topo)
        const f = Math.max(0, Math.min(1, (s.E + 1) / 1.1));
        o.e.current.style.transform = `scaleX(${f})`;
      }
      if (o.eTxt.current) {
        const pct = nf0.format(Math.max(0, (s.E + 1) * 100));
        o.eTxt.current.textContent = s.E > -0.02 ? tl("na do topo", "at top energy") : tl(`${pct}% da do topo`, `${pct}% of top energy`);
      }
      if (o.t.current) o.t.current.textContent = `t = ${nf1.format(s.t)} s`;
      if (o.note.current) {
        const note =
          s.mode === "equilibrio" && s.pegouEm !== null
            ? tl(`Pegou ${nf1.format(s.pegouEm - s.subidaDesde)} s depois de começar a subir`, `Caught ${nf1.format(s.pegouEm - s.subidaDesde)} s after starting the swing-up`)
            : s.mode === "subindo"
              ? tl(`Subindo há ${nf1.format(Math.max(0, s.t - s.subidaDesde))} s`, `Swinging up for ${nf1.format(Math.max(0, s.t - s.subidaDesde))} s`)
              : MODE_TEXT[s.mode][1][l];
        const quedas = s.quedas === 1 ? tl("queda", "fall") : tl("quedas", "falls");
        o.note.current.textContent = `${note}${s.quedas ? ` · ${s.quedas} ${quedas}` : ""}`;
      }
      if (modeRef.current !== s.mode) {
        modeRef.current = s.mode;
        setMode(s.mode);
      }
      drawChart();
    },
    // os refs são estáveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawChart],
  );

  const onEvent = useCallback((e: SimEvent) => {
    setToast({ kind: e.kind, after: e.after, key: e.t });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ---------- montagem da cena ---------- */
  useEffect(() => {
    if (!want3d || !host.current) return;
    let disposed = false;
    let sc: PenduloScene | null = null;
    setPhase("loading");
    setProgress(0);
    loadScene()
      .then(({ PenduloScene }) => {
        if (disposed || !host.current) return;
        try {
          sc = new PenduloScene(host.current, { quality: pickQuality(), tip: tip.current, onSnapshot, onEvent, onRunChange: setRunning });
        } catch (e) {
          console.error(e);
          setPhase("nowebgl");
          return;
        }
        scene.current = sc;
        if (import.meta.env.DEV) (window as unknown as { __pendulo?: PenduloScene }).__pendulo = sc;
        sc.setSpeed(speedRef.current);
        sc.setTouchMode("page");
        sc.setActive(visible.current);
        return sc.load(PENDULO_GLB, (p) => setProgress(Math.round(p * 100))).then(() => {
          if (disposed) return;
          setPhase("ready");
          // liga sozinho, como o aparelho com a fonte — mas só quando estiver à vista
          if (autoplay.current && !reduceMotion() && visible.current) {
            autoplay.current = false;
            sc!.restart();
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
  }, [want3d, attempt, onSnapshot, onEvent]);

  /* trocar de idioma não remonta: o aria-label do canvas e os textos escritos fora do render */
  useEffect(() => {
    scene.current?.setLocale(locale);
    if (lastSnap.current) onSnapshot(lastSnap.current);
    else drawChart();
  }, [locale, onSnapshot, drawChart]);

  /* fora da tela, a cena para (inclusive o relógio da simulação) */
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        scene.current?.setActive(e.isIntersecting || full);
        if (e.isIntersecting && autoplay.current && phase === "ready" && !reduceMotion()) {
          autoplay.current = false;
          scene.current?.restart();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phase, full]);

  /* ---------- tela cheia ---------- */
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

  /* roda do mouse: na página rola a página; o zoom fica no Ctrl (ou na pinça) e na tela cheia */
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

  /* o gráfico acompanha a largura do painel */
  useEffect(() => {
    const cv = chart.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => drawChart());
    ro.observe(cv);
    return () => ro.disconnect();
  }, [drawChart]);

  /* ---------- ações ---------- */
  const ready = phase === "ready";
  const sc = () => scene.current;

  const togglePlay = () => {
    autoplay.current = false;
    const s = sc();
    if (!s) return;
    if (running) s.pause();
    else if (s.sim.s.t === 0) s.restart();
    else s.play();
  };
  const restart = () => {
    autoplay.current = false;
    setControl(true);
    sc()?.restart();
  };
  const chooseSpeed = (s: number) => {
    setSpeed(s);
    sc()?.setSpeed(s);
  };
  const chooseView = (v: ViewName) => {
    setView(v);
    sc()?.setView(v);
  };
  const push = (dir: 1 | -1) => {
    autoplay.current = false;
    sc()?.kick(dir * PUSH[force]);
  };
  const toggleControl = () => {
    const on = !control;
    setControl(on);
    sc()?.setControl(on);
    if (on && !running) sc()?.play();
  };

  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const hint = coarse
    ? full
      ? t("Arraste a haste para empurrar · arraste o fundo para girar", "Drag the rod to push it · drag the background to rotate")
      : t("Deslize de lado para girar · use os botões para empurrar", "Swipe sideways to rotate · use the buttons to push")
    : t("Pegue a haste com o mouse e empurre · arraste o fundo para girar", "Grab the rod with your mouse and push · drag the background to rotate");
  const toastText = toast
    ? toast.kind === "pegou"
      ? t(`Pegou no topo · ${nf.nf1.format(toast.after)} s de subida`, `Caught at the top · ${nf.nf1.format(toast.after)} s of swing-up`)
      : t("Caiu · voltando a subir", "Fell · swinging back up")
    : null;

  const modeDot = mode === "equilibrio" ? "bg-success" : mode === "desligado" ? "bg-muted-foreground" : "bg-gold";

  return (
    <div
      className={cn(
        "overflow-hidden border border-border bg-background",
        full ? "fixed inset-0 z-[80] flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_400px]" : "relative border-x-0 sm:rounded-lg sm:border-x sm:shadow-soft-sm lg:grid lg:grid-cols-[minmax(0,1fr)_380px]",
      )}
      data-pendulo-sim=""
      role={full ? "dialog" : undefined}
      aria-modal={full || undefined}
      aria-label={full ? t("Simulador do pêndulo invertido em tela cheia", "Inverted pendulum simulator, full screen") : undefined}
    >
      {/* ---------- o 3D ---------- */}
      <div
        ref={viewport}
        className={cn(
          "relative isolate overflow-hidden bg-[radial-gradient(120%_90%_at_55%_30%,#f8f7f3_0%,#e6e5e0_72%)]",
          // a haste em pé e pendurada ocupa quase um metro de altura: a caixa é mais alta que a da CNC
          full ? "min-h-0 flex-1 lg:h-full" : "h-[clamp(380px,118vw,560px)] lg:h-auto lg:min-h-[680px]",
        )}
        onPointerDown={() => setInteracted(true)}
      >
        <div ref={host} className="absolute inset-0" />

        {!ready && (
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="max-w-[320px] rounded-md border border-border bg-background/90 px-5 py-4 text-center font-mono text-[12px] text-muted-foreground shadow-soft-sm backdrop-blur-sm">
              {phase === "loading" && (
                <>
                  <p className="text-foreground">{progress > 0 ? t("Carregando o modelo 3D", "Loading the 3D model") : t("Preparando o 3D", "Preparing the 3D view")}</p>
                  <div className="mt-3 h-[3px] w-56 max-w-full overflow-hidden rounded bg-border">
                    <div className="h-full origin-left bg-gold transition-transform duration-200" style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
                  </div>
                  <p className="mt-2 tabular-nums">{progress > 0 ? `${progress}%` : "…"}</p>
                </>
              )}
              {phase === "wait" && (
                <>
                  <p className="text-foreground">{t("Sua conexão está no modo econômico.", "Your connection is in data saver mode.")}</p>
                  <button type="button" onClick={() => setWant3d(true)} className="mt-3 rounded-md bg-primary px-4 py-2.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover">
                    {t("Carregar a simulação 3D", "Load the 3D simulation")} (~{nf.nf0.format(PENDULO_3D_KB)} KB)
                  </button>
                </>
              )}
              {phase === "error" && (
                <>
                  <p className="text-foreground">{t("Não foi possível carregar o modelo 3D.", "Couldn't load the 3D model.")}</p>
                  <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 rounded-md bg-primary px-4 py-2.5 text-[12px] font-medium text-primary-foreground hover:bg-primary-hover">
                    {t("Tentar de novo", "Try again")}
                  </button>
                </>
              )}
              {phase === "nowebgl" && (
                <p className="text-foreground">
                  {t(
                    "Este navegador não abriu o WebGL. Ative a aceleração de hardware ou tente outro navegador para ver o pêndulo em 3D.",
                    "This browser couldn't start WebGL. Turn on hardware acceleration or try another browser to see the pendulum in 3D.",
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* vistas e tela cheia */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div role="group" aria-label={t("Vistas da câmera", "Camera views")} className="flex max-w-full gap-0.5 overflow-x-auto rounded-md border border-border bg-background/85 p-0.5 backdrop-blur-sm [scrollbar-width:none]">
            {VIEWS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={!ready}
                aria-pressed={view === id}
                onClick={() => chooseView(id)}
                className={cn(
                  "h-8 shrink-0 rounded-[5px] px-2 font-mono text-[11.5px] transition-colors disabled:opacity-50 sm:px-3",
                  view === id ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5",
                )}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFull((f) => !f)}
            aria-label={full ? t("Sair da tela cheia", "Exit full screen") : t("Abrir em tela cheia", "Open in full screen")}
            title={full ? t("Sair da tela cheia (Esc)", "Exit full screen (Esc)") : t("Tela cheia", "Full screen")}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background/85 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
          >
            {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {/* o modo, sempre à vista (no celular o painel fica lá embaixo) */}
        {ready && (
          <div className="pointer-events-none absolute left-3 top-14 flex flex-col items-start gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background/85 px-2.5 py-1.5 font-mono text-[11.5px] text-foreground backdrop-blur-sm">
              <span className="relative flex h-2 w-2" aria-hidden>
                {running && mode !== "desligado" && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none", modeDot)} />}
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", modeDot)} />
              </span>
              {running ? t(MODE_TEXT[mode][0]) : t("Pausado", "Paused")}
            </span>
            <span
              aria-live="polite"
              className={cn(
                "rounded-md bg-foreground px-2.5 py-1.5 font-mono text-[11.5px] text-background shadow-soft-sm transition-all duration-300",
                toast ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
              )}
            >
              {toastText ?? " "}
            </span>
          </div>
        )}

        {ready && (
          <p className={cn("pointer-events-none absolute bottom-3 left-3 right-3 font-mono text-[11px] text-muted-foreground transition-opacity duration-500", interacted && !wheelHint ? "opacity-0" : "opacity-100")}>
            <span className="rounded bg-background/80 px-1.5 py-0.5 backdrop-blur-sm">{wheelHint ? t("Use Ctrl + roda (ou a pinça do trackpad) para dar zoom", "Use Ctrl + scroll wheel (or pinch on the trackpad) to zoom") : hint}</span>
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
        className={cn("flex min-w-0 flex-col border-border bg-background lg:border-l", full ? "max-h-[46svh] overflow-y-auto overscroll-contain border-t lg:max-h-none lg:border-t-0" : "border-t lg:border-t-0")}
        data-lenis-prevent={full || undefined}
      >
        {/* estado e transporte */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t("modo", "mode")} · <span className="normal-case tracking-normal text-foreground">{t(MODE_TEXT[mode][0])}</span>
            </p>
            <span ref={out.t} className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground" />
          </div>
          <p ref={out.note} className="mt-2 min-h-[2.6em] text-[13.5px] leading-snug text-muted-foreground" />
          {/* no celular estreito a velocidade desce para a linha de baixo em vez de sair da tela */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!ready}
              className="inline-flex h-10 min-w-[112px] items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 font-mono text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? t("Pausar", "Pause") : t("Ligar", "Run")}
            </button>
            <button
              type="button"
              onClick={restart}
              disabled={!ready}
              title={t("Carro no batente do motor, haste pendurada e parada — e liga", "Cart at the motor-side end stop, rod hanging still — then it starts")}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border px-3 font-mono text-[12.5px] text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              {t("Do batente", "From end stop")}
            </button>
            <div role="group" aria-label={t("Velocidade da simulação", "Simulation speed")} className="ml-auto flex rounded-md border border-border p-0.5">
              {SPEEDS.map(([s, label]) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={speed === s}
                  onClick={() => chooseSpeed(s)}
                  title={s === 1 ? t("Tempo real", "Real time") : t(`Câmera lenta (${label})`, `Slow motion (${label})`)}
                  className={cn("h-9 min-w-[36px] rounded-[5px] px-2 font-mono text-[11.5px] tabular-nums transition-colors", speed === s ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* empurrar */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("Empurrar a haste", "Push the rod")}</h3>
            <div role="group" aria-label={t("Força do empurrão", "Push strength")} className="flex rounded-md border border-border p-0.5">
              {(["leve", "forte"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={force === f}
                  onClick={() => setForce(f)}
                  className={cn("h-9 rounded-[5px] px-3 font-mono text-[11.5px] transition-colors", force === f ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5")}
                >
                  {t(PUSH_LABEL[f])}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => push(-1)}
              disabled={!ready}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border font-mono text-[12.5px] text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" /> {t("para o motor", "toward the motor")}
            </button>
            <button
              type="button"
              onClick={() => push(1)}
              disabled={!ready}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border font-mono text-[12.5px] text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50"
            >
              {t("para o esticador", "toward the tensioner")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2.5 text-[12.5px] leading-snug text-muted-foreground">
            {force === "leve"
              ? t("Um peteleco: o equilíbrio segura sem a haste cair.", "A flick: the balance holds and the rod stays up.")
              : t("Um tapa: a haste cai e o controle volta a subir sozinho, no mesmo instante.", "A hard tap: the rod falls and the controller swings it back up on its own, right away.")}
          </p>
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
            <span>
              <span className="block text-[13.5px] font-medium text-foreground">{t("Controle ligado", "Control on")}</span>
              <span className="block text-[12px] text-muted-foreground">{t("Desligue para ver a haste sem ninguém segurando", "Turn it off to see the rod with nothing holding it up")}</span>
            </span>
            <input type="checkbox" checked={control} onChange={toggleControl} disabled={!ready} className="h-4 w-4 shrink-0 accent-[#15171a]" />
          </label>
        </div>

        {/* leituras */}
        <div className="border-b border-border p-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("Leituras", "Readings")}</h3>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <dt className="text-[11.5px] text-muted-foreground">{t("Ângulo", "Angle")}</dt>
              <dd ref={out.th} className="font-mono text-[15px] tabular-nums text-foreground">
                —
              </dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-muted-foreground">{t("Carro", "Cart")}</dt>
              <dd ref={out.x} className="font-mono text-[15px] tabular-nums text-foreground">
                —
              </dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-muted-foreground">{t("Velocidade", "Speed")}</dt>
              <dd ref={out.v} className="font-mono text-[15px] tabular-nums text-foreground">
                —
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-[11.5px] text-muted-foreground">
              <span>{t("Energia da haste", "Rod energy")}</span>
              <span ref={out.eTxt} className="font-mono tabular-nums" />
            </div>
            <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-border">
              <div ref={out.e} className="h-full origin-left rounded-full bg-gold" style={{ transform: "scaleX(0)" }} />
              {/* a energia que a subida persegue: um pouco acima da do topo */}
              <span className="absolute inset-y-0 w-px bg-foreground" style={{ left: `${((1 + FW.SW_EREF) / 1.1) * 100}%` }} aria-hidden />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10.5px] text-muted-foreground">
              <span>{t("pendurada", "hanging")}</span>
              <span>{t("topo", "top")}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-4 text-[11.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3 bg-foreground" aria-hidden /> {t("ângulo", "angle")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3 bg-gold" aria-hidden /> {t("carro", "cart")}
              </span>
              <span className="ml-auto font-mono text-[10.5px]">{t("últimos 12 s", "last 12 s")}</span>
            </div>
            <canvas ref={chart} className="mt-2 block h-[112px] w-full rounded-md border border-border bg-card" aria-label={t("Gráfico do ângulo da haste e da posição do carro nos últimos 12 segundos", "Chart of the rod angle and cart position over the last 12 seconds")} role="img" />
          </div>
        </div>

        {/* exibir */}
        <div className="p-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("Exibir", "Display")}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["trail", t("Rastro da ponta", "Tip trail"), trail, () => (setTrail(!trail), sc()?.setTrail(!trail))],
                ["colors", t("Cor por peça", "Color by part"), colors, () => (setColors(!colors), sc()?.setColors(!colors))],
                ["xray", t("Raio-X", "X-ray"), xray, () => (setXray(!xray), sc()?.setXray(!xray))],
              ] as [string, string, boolean, () => void][]
            ).map(([id, label, on, fn]) => (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                disabled={!ready}
                onClick={fn}
                className={cn(
                  "h-9 rounded-md border px-3 font-mono text-[11.5px] transition-colors disabled:opacity-50",
                  on ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-foreground/5",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
