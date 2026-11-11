/**
 * Hero da home: as "folhas" do desenho. Cada projeto com modelo 3D é uma folha;
 * rolar faz a folha andar — o macropad desmonta pela rolagem; a CNC e o
 * pêndulo começam a tocar, como vídeo, com play e pausa no carimbo — e as setas
 * em cima do modelo trocam de folha.
 *
 * Por cima do canvas, tudo é HUD de desenho técnico: título (some quando a
 * rolagem começa), legenda da figura, a lista da folha (peças ou partes do
 * desenho), marcas de corte e o carimbo com etapa e progresso.
 */
import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { getLenis } from "@/components/motion/SmoothScroll";
import ExplodedView from "@/components/three/ExplodedView";
import CncDrawView from "@/components/cnc/CncDrawView";
import PenduloRunView from "@/components/pendulo/PenduloRunView";
import { preloadPendulo } from "@/components/pendulo/preload";
import { preloadExplodedView } from "@/components/three/preload";
import { disposeHomeScene, warmHomeScene } from "@/components/cnc/preload";
import { isGroupOut, ramp, type ExplodedState, type FitBox, type Shift } from "@/components/three/explode";
import { sheetReady, sheets, type Sheet } from "@/data/sheets";
import { heroLead } from "@/data/home";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Playback } from "@/components/home/playback";
import { cn } from "@/lib/utils";

/* Enquadramento no desktop: o modelo começa à direita do título e desliza para
   perto do centro quando o título sai. No celular não há ajuste fixo — o modelo
   cabe na caixa medida entre o texto e o carimbo (veja o Hud). */
const DESKTOP: { zoom: number; shift: Shift } = { zoom: 1.08, shift: (q) => [0.15 - 0.1 * ramp(q, 0.03, 0.16), 0.04] };
/* A CNC é larga e baixa: em vez de deslocamento, uma caixa onde ela cabe
   inteira — à direita do título no começo, no meio quando ele sai. A borda
   direita da segunda para antes da lista que aparece no canto. */
const DESKTOP_DRAW = {
  intro: { x: 0.38, y: 0.14, w: 0.61, h: 0.78 },
  scroll: { x: 0.04, y: 0.17, w: 0.7, h: 0.72 },
};
/* O pêndulo é alto (a haste em pé tem quase meio metro): a caixa usa mais altura. */
const DESKTOP_RUN = {
  intro: { x: 0.4, y: 0.12, w: 0.58, h: 0.8 },
  scroll: { x: 0.06, y: 0.15, w: 0.66, h: 0.76 },
};

/* CNC e pêndulo tocam como vídeo: a rolagem só tira o título e dá a partida,
   então a trilha é curta. O Polpad continua desmontando pela rolagem (460). */
const PLAY_TRACK_VH = 160;

// a folha que abre a home já começa a baixar quando este módulo é avaliado,
// em paralelo com o primeiro render da página, e não depois dele
const firstSheet = sheets.find((s) => s.config);
if (firstSheet?.config) preloadExplodedView(firstSheet.config);

const READY = sheets.map((s, i) => (sheetReady(s) ? i : -1)).filter((i) => i >= 0);

const pad = (n: number) => String(n).padStart(2, "0");

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpBox = (a: FitBox, b: FitBox, t: number): FitBox => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});

function CropMarks() {
  const mark = "absolute h-4 w-4 border-foreground/35";
  return (
    <div aria-hidden className="absolute inset-x-4 bottom-4 top-[72px] md:inset-x-6 md:bottom-6">
      <span className={cn(mark, "left-0 top-0 border-l border-t")} />
      <span className={cn(mark, "right-0 top-0 border-r border-t")} />
      <span className={cn(mark, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(mark, "bottom-0 right-0 border-b border-r")} />
    </div>
  );
}

/**
 * Lista da folha: cada linha acende quando a peça já saiu do conjunto (ou,
 * na CNC, quando a caneta começa aquela parte do desenho).
 *
 * Ela desce do topo e o carimbo sobe do pé, na mesma coluna. Em tela baixa
 * (notebook de 768 px menos as barras do navegador) as duas se encontravam e o
 * carimbo tampava as últimas linhas. Então: larga o bastante para nenhuma
 * especificação quebrar em duas linhas; abaixo de 680 px de altura some a
 * especificação e fica só referência e nome; abaixo de 520 px some a lista.
 */
function PartsList({ cfg, q, play, title }: Pick<ExplodedState, "cfg" | "q" | "play"> & { title: string }) {
  if (!cfg) return null;
  // nas folhas que tocam como vídeo, as linhas acendem pelo relógio (e nenhuma antes do play)
  const p = play ? (play.started ? play.u : -1) : q;
  return (
    <div
      className="absolute right-12 top-28 hidden w-[320px] border-l border-border pl-4 lg:block [@media(max-height:680px)]:top-24 [@media(max-height:520px)]:!hidden"
      style={{ opacity: ramp(q, 0.05, 0.14) }}
    >
      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {cfg.groups.map((g) => (
        <div
          key={g.id}
          className="grid grid-cols-[64px_1fr] gap-2 py-[5px] transition-opacity duration-300 [@media(max-height:680px)]:py-[3px]"
          style={{ opacity: isGroupOut(g, p) ? 1 : 0.32 }}
        >
          <span className="text-[10px] tracking-[0.06em] text-gold">{g.ref}</span>
          <span className="font-sans text-[12px] leading-tight text-foreground">
            {g.name}
            {g.spec && (
              <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground [@media(max-height:680px)]:hidden">{g.spec}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Troca de folha: ← nome do projeto →, em cima do modelo. Com as setas a
 * pessoa vê que há mais de um projeto sem precisar achar o seletor no carimbo.
 * Passar o mouse ou tocar já começa a baixar a folha seguinte.
 */
const SheetSwitcher = forwardRef<HTMLDivElement, { index: number; onSelect: (i: number) => void; className?: string; style?: React.CSSProperties }>(
  function SheetSwitcher({ index, onSelect, className, style }, ref) {
    const pos = READY.indexOf(index);
    const go = (d: number) => onSelect(READY[(pos + d + READY.length) % READY.length]);
    const near = (d: number) => {
      const s = sheets[READY[(pos + d + READY.length) % READY.length]];
      if (s.kind === "draw") warmHomeScene();
      else if (s.kind === "run") preloadPendulo();
      else if (s.config) preloadExplodedView(s.config);
    };
    const sheet = sheets[index];
    const prev = sheets[READY[(pos - 1 + READY.length) % READY.length]];
    const next = sheets[READY[(pos + 1) % READY.length]];
    const arrow =
      "inline-flex h-10 w-10 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background focus-visible:outline-none";
    if (READY.length < 2) return null;
    return (
      <div
        ref={ref}
        role="group"
        aria-label="Projetos em 3D"
        className={cn("pointer-events-auto flex items-stretch border border-foreground bg-background/90 font-mono backdrop-blur-[2px]", className)}
        style={style}
      >
        <button type="button" className={arrow} onClick={() => go(-1)} onPointerEnter={() => near(-1)} onFocus={() => near(-1)} onTouchStart={() => near(-1)} aria-label={`Projeto anterior: ${prev.full}`}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="flex w-[22ch] min-w-0 flex-col items-center justify-center border-x border-border px-2 text-center leading-tight" aria-live="polite">
          <span className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
            folha <span className="text-gold">{sheet.n}</span>/{pad(sheets.length)}
          </span>
          <span className="w-full truncate text-[12px] font-medium text-foreground">{sheet.name}</span>
        </p>
        <button type="button" className={arrow} onClick={() => go(1)} onPointerEnter={() => near(1)} onFocus={() => near(1)} onTouchStart={() => near(1)} aria-label={`Próximo projeto: ${next.full}`}>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  },
);

const cell = "border-r border-border px-2.5 py-1.5 uppercase tracking-[0.12em] text-muted-foreground";

const Progress = ({ q }: { q: number }) => (
  <div className="h-[2px] bg-border">
    <div className="h-full bg-gold" style={{ width: `${q * 100}%` }} />
  </div>
);

const clock = (s: number) => {
  const n = Math.floor(s);
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
};

/**
 * Controles de vídeo das folhas que tocam sozinhas (CNC, pêndulo): play/pausa
 * (ou "de novo", no fim), a linha do tempo — clicar ou arrastar leva para
 * aquele instante — e o tempo. Fica na base do carimbo, no lugar da barra.
 */
function PlayBar({ play }: { play: Playback }) {
  const bar = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const seekAt = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect();
    if (r && r.width) play.seek((clientX - r.left) / r.width);
  };
  const Icon = play.ended ? RotateCcw : play.playing ? Pause : Play;
  const label = play.ended ? "Ver de novo" : play.playing ? "Pausar" : "Reproduzir";
  const step = 5 / play.duration;
  return (
    <div className="pointer-events-auto grid grid-cols-[auto_1fr_auto] items-center border-t border-border">
      <button
        type="button"
        onClick={play.ended ? play.restart : play.toggle}
        aria-label={label}
        title={label}
        className="flex h-9 w-10 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background focus-visible:outline-none lg:h-8 lg:w-9"
      >
        <Icon className="h-3.5 w-3.5" fill={Icon === RotateCcw ? "none" : "currentColor"} aria-hidden />
      </button>
      <div
        ref={bar}
        role="slider"
        tabIndex={0}
        aria-label="Linha do tempo da animação"
        aria-valuemin={0}
        aria-valuemax={Math.round(play.duration)}
        aria-valuenow={Math.round(play.t)}
        aria-valuetext={`${clock(play.t)} de ${clock(play.duration)}`}
        className="group relative mx-3 h-9 cursor-pointer touch-none focus-visible:outline-none lg:h-8"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          seekAt(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && seekAt(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            play.seek(play.u + (e.key === "ArrowRight" ? step : -step));
          } else if (e.key === " " || e.key === "k") {
            e.preventDefault();
            play.toggle();
          }
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-border transition-[height] group-hover:h-[3px]">
          <div className="h-full bg-gold" style={{ width: `${play.u * 100}%` }} />
        </div>
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold ring-2 ring-background group-focus-visible:ring-foreground"
          style={{ left: `${play.u * 100}%` }}
        />
      </div>
      <span className="whitespace-nowrap border-l border-border px-2.5 py-1.5 tabular-nums text-muted-foreground">
        {clock(play.t)}/{clock(play.duration)}
        {play.speed !== 1 && <span className="ml-1.5 text-gold" title={`${String(play.speed).replace(".", ",")} vezes mais rápido que a máquina`}>{String(play.speed).replace(".", ",")}×</span>}
      </span>
    </div>
  );
}

type StampProps = { sheet: Sheet; state: ExplodedState };

/** Carimbo completo (desktop): projeto, folha, etapa e progresso, no canto. */
function Stamp({ sheet, state: { q, cfg, stage, stageIndex, play } }: StampProps) {
  return (
    <div className="absolute bottom-10 right-12 hidden w-[400px] border border-foreground bg-background/90 text-[10px] lg:block">
      <div className="grid grid-cols-[92px_1fr_auto] border-b border-border">
        <span className={cell}>projeto</span>
        <span className="truncate px-2.5 py-1.5 font-medium text-foreground">{sheet.full}</span>
        <span className="border-l border-border px-2.5 py-1.5 uppercase tracking-[0.12em] text-muted-foreground">
          folha {sheet.n}/{pad(sheets.length)}
        </span>
      </div>
      <div className="grid grid-cols-[92px_1fr]">
        <span className={cell}>
          etapa {pad(stageIndex + 1)}/{pad(cfg?.stages.length ?? 1)}
        </span>
        <span className="truncate px-2.5 py-1.5 font-sans text-[12px] text-foreground" aria-live="polite">
          {stage}
        </span>
      </div>
      {play ? <PlayBar play={play} /> : <Progress q={q} />}
    </div>
  );
}

/**
 * Carimbo compacto (celular e tablet): só a etapa, na largura do pé da tela.
 * O nome do projeto já está nas setas e na legenda.
 */
const StampCompact = forwardRef<HTMLDivElement, StampProps>(function StampCompact({ state: { q, cfg, stage, stageIndex, play } }, ref) {
  return (
    <div ref={ref} className="absolute inset-x-4 bottom-4 border border-foreground bg-background/90 text-[10px] lg:hidden">
      <div className="grid grid-cols-[84px_1fr]">
        <span className={cell}>
          etapa {pad(stageIndex + 1)}/{pad(cfg?.stages.length ?? 1)}
        </span>
        <span className="truncate px-2.5 py-1.5 font-sans text-[12px] text-foreground" aria-live="polite">
          {stage}
        </span>
      </div>
      {play ? <PlayBar play={play} /> : <Progress q={q} />}
    </div>
  );
});

/** Caixas onde o modelo cabe no celular: abaixo do título (início) e abaixo da legenda (rolando). */
type FitBoxes = { intro: FitBox; scroll: FitBox };
/** Onde as setas ficam no celular (px do topo), nos mesmos dois momentos. */
type SwitcherTops = { intro: number; scroll: number };

const SWITCHER_W = 270;

/**
 * Celular deitado: a tela tem ~360 px de altura, e título grande + setas +
 * carimbo não deixavam espaço para o modelo (o carimbo cobria o título). Aí o
 * título fica numa linha só, sem o texto de apoio, e as setas vão para o canto
 * de cima, ao lado do título, em vez de ficar acima do modelo.
 */
const SHORT = "(max-height: 500px) and (orientation: landscape)";
const isShort = () => typeof window !== "undefined" && window.matchMedia(SHORT).matches && !window.matchMedia("(min-width: 1024px)").matches;

function Hud({
  sheet,
  index,
  onSelect,
  desktop,
  state,
  boxes,
  modelX,
}: {
  sheet: Sheet;
  index: number;
  onSelect: (i: number) => void;
  desktop: boolean;
  state: ExplodedState;
  boxes: MutableRefObject<FitBoxes | null>;
  /** centro horizontal do modelo no desktop, em fração da largura */
  modelX: number;
}) {
  const { q } = state;
  const draw = sheet.kind === "draw";
  const run = sheet.kind === "run";
  const intro = 1 - ramp(q, 0.03, 0.14);
  const hud = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const compact = useRef<HTMLDivElement>(null);
  const switcher = useRef<HTMLDivElement>(null);
  const [tops, setTops] = useState<SwitcherTops | null>(null);

  // No celular o modelo vai no espaço que sobra entre o texto e o carimbo, e
  // esse espaço muda de aparelho a aparelho (altura da tela, barras do
  // navegador, quantas linhas o texto quebra). Então ele é medido, não chutado.
  // As setas ficam no topo desse espaço, e o modelo logo abaixo delas.
  // offsetTop/offsetHeight ignoram o transform do título enquanto ele some.
  useLayoutEffect(() => {
    const measure = () => {
      const h = hud.current,
        t = title.current,
        c = caption.current,
        s = compact.current;
      if (!h || !t || !c || !s || !s.offsetHeight) return;
      const W = h.offsetWidth,
        H = h.offsetHeight;
      const GAP = 14,
        SIDE = 16;
      // deitado, as setas ficam no canto, fora da coluna do modelo
      const sw = isShort() ? 0 : (switcher.current?.offsetHeight ?? 0);
      const bottom = s.offsetTop - GAP;
      const top = { intro: t.offsetTop + t.offsetHeight + GAP, scroll: c.offsetTop + c.offsetHeight + GAP };
      const below = (y: number): FitBox => {
        const y0 = y + (sw ? sw + 6 : 0);
        return { x: SIDE / W, y: y0 / H, w: (W - 2 * SIDE) / W, h: Math.max(0.15, (bottom - y0) / H) };
      };
      boxes.current = { intro: below(top.intro), scroll: below(top.scroll) };
      setTops((p) => (p && p.intro === top.intro && p.scroll === top.scroll ? p : top));
    };
    measure();
    const ro = new ResizeObserver(measure);
    [hud, title, compact, switcher].forEach((r) => r.current && ro.observe(r.current));
    return () => ro.disconnect();
  }, [boxes]);

  const t = ramp(q, 0.03, 0.14);
  const short = useMediaQuery(SHORT) && !desktop;
  const switcherStyle: React.CSSProperties = desktop
    ? // centrado no modelo, sem passar por cima da lista do canto direito
      { left: `clamp(${SWITCHER_W / 2 + 24}px, ${modelX * 100}%, calc(100% - ${48 + 320 + 24 + SWITCHER_W / 2}px))`, top: 76, transform: "translateX(-50%)" }
    : short
      ? { right: 16, top: 64 }
      : { left: "50%", top: tops ? lerp(tops.intro, tops.scroll, t) : -999, transform: "translateX(-50%)" };

  return (
    <div ref={hud} className="pointer-events-none absolute inset-0 font-mono">
      <CropMarks />

      {/* título: some quando a rolagem começa */}
      <div
        ref={title}
        className="absolute left-6 right-6 top-[76px] max-w-[640px] md:left-12 md:right-auto md:top-28 [@media(max-height:500px)_and_(orientation:landscape)]:!right-[330px] [@media(max-height:500px)_and_(orientation:landscape)]:!top-[64px]"
        style={{ opacity: intro, transform: `translateY(${(1 - intro) * -24}px)` }}
      >
        <p className="text-[12px] text-gold [text-shadow:0_0_14px_hsl(var(--gold-soft)/0.35)]">$ whoami</p>
        <h1 className="mt-3 text-[clamp(40px,6.4vw,92px)] [@media(max-height:500px)_and_(orientation:landscape)]:mt-1 [@media(max-height:500px)_and_(orientation:landscape)]:text-[32px] font-medium leading-[0.98] tracking-[-0.045em] text-foreground">
          {/* o espaço antes da quebra mantém o nome legível para leitor de tela e busca */}
          artur <br className="[@media(max-height:500px)_and_(orientation:landscape)]:hidden" />
          brasileiro
        </h1>
        <p className="mt-5 max-w-[46ch] font-sans text-[14px] leading-relaxed text-muted-foreground md:mt-6 md:text-[15px] [@media(max-height:500px)_and_(orientation:landscape)]:hidden">{heroLead}</p>
      </div>

      {/* legenda da figura, no lugar do título */}
      <p
        ref={caption}
        className="absolute left-6 right-6 top-[76px] text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:left-12 md:right-auto md:top-[128px] [@media(max-height:500px)_and_(orientation:landscape)]:!right-[330px] [@media(max-height:500px)_and_(orientation:landscape)]:!top-[72px]"
        style={{ opacity: 1 - intro }}
        aria-hidden={intro > 0.5}
      >
        <span className="text-gold">fig. {sheet.n}</span> — {sheet.full.toLowerCase()}, {draw ? "desenhando" : run ? "funcionando" : "vista explodida"}
      </p>

      <SheetSwitcher ref={switcher} index={index} onSelect={onSelect} className="absolute" style={switcherStyle} />

      <PartsList cfg={state.cfg} q={q} play={state.play} title={draw ? "o que ela desenha" : run ? "o que acontece" : "lista de materiais"} />

      {/* no celular o texto de cima já diz para rolar, e aqui o carimbo cobriria a dica */}
      <p className="absolute bottom-10 left-12 hidden text-[11px] text-muted-foreground lg:block">
        {q < 0.02 && !state.play?.started ? (draw ? "↓ role para a máquina desenhar" : run ? "↓ role para ligar o pêndulo" : "↓ role para desmontar") : desktop ? "arraste para girar" : ""}
      </p>

      <Stamp sheet={sheet} state={state} />
      <StampCompact ref={compact} sheet={sheet} state={state} />
    </div>
  );
}

export default function SheetsHero() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [index, setIndex] = useState(READY[0] ?? 0);

  // Com a primeira folha já na tela e o navegador ocioso, as outras vão
  // baixando por trás (na CNC, ~130 KB: o three já veio com o macropad). Assim
  // a seta troca na hora, sem "carregando". Com economia de dados, nada sai.
  useEffect(() => {
    let idle = 0;
    const run = () => {
      for (const i of READY) {
        const s = sheets[i];
        if (i === index) continue;
        if (s.kind === "draw") warmHomeScene();
        else if (s.kind === "run") preloadPendulo();
        else if (s.config) preloadExplodedView(s.config);
      }
    };
    const t = window.setTimeout(() => {
      idle = "requestIdleCallback" in window ? window.requestIdleCallback(run, { timeout: 3000 }) : (globalThis.setTimeout(run, 0) as unknown as number);
    }, 2500);
    return () => {
      window.clearTimeout(t);
      if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      // saindo da home, a cena guardada da CNC solta o WebGL
      disposeHomeScene();
    };
    // só a folha de abertura importa: depois disso a pessoa já está navegando
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const track = useRef<HTMLElement>(null);
  const boxes = useRef<FitBoxes | null>(null);
  const sheet = sheets[index];
  const draw = sheet.kind === "draw";
  const run = sheet.kind === "run";

  // celular: a caixa cresce do espaço abaixo do título para o espaço abaixo da
  // legenda, no mesmo trecho em que o título some
  const mobileFit = (q: number) => {
    const b = boxes.current;
    return b ? lerpBox(b.intro, b.scroll, ramp(q, 0.03, 0.14)) : null;
  };
  const drawFit = desktop ? (q: number) => lerpBox(DESKTOP_DRAW.intro, DESKTOP_DRAW.scroll, ramp(q, 0.03, 0.16)) : mobileFit;
  const runFit = desktop ? (q: number) => lerpBox(DESKTOP_RUN.intro, DESKTOP_RUN.scroll, ramp(q, 0.03, 0.16)) : mobileFit;
  const modelX = (q: number) => {
    if (!draw && !run) return 0.5 + (DESKTOP.shift as (q: number) => [number, number])(q)[0];
    const b = (run ? runFit : drawFit)(q);
    return b ? b.x + b.w / 2 : 0.5;
  };

  // trocar de folha volta ao começo da trilha: o modelo novo chega inteiro e a
  // pessoa o vê andar desde o início, em vez de cair no meio
  const selectSheet = (i: number) => {
    if (i === index) return;
    const el = track.current;
    setIndex(i);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(top);
    else window.scrollTo({ top, behavior: "smooth" });
  };

  const hud = (state: ExplodedState) => (
    <Hud sheet={sheet} index={index} onSelect={selectSheet} desktop={desktop} state={state} boxes={boxes} modelX={modelX(state.q)} />
  );

  return (
    <>
      {/* key: cada folha monta o próprio canvas, com o próprio modelo */}
      {draw ? (
        <CncDrawView ref={track} key={sheet.n} trackVh={PLAY_TRACK_VH} className="bg-grid" fit={drawFit}>
          {hud}
        </CncDrawView>
      ) : run ? (
        <PenduloRunView ref={track} key={sheet.n} trackVh={PLAY_TRACK_VH} className="bg-grid" fit={runFit}>
          {hud}
        </PenduloRunView>
      ) : (
        sheet.config && (
          <ExplodedView
            ref={track}
            key={sheet.config}
            configUrl={sheet.config}
            trackVh={460}
            className="bg-grid"
            zoom={desktop ? DESKTOP.zoom * (sheet.zoom?.desktop ?? 1) : (sheet.zoom?.mobile ?? 1)}
            shift={desktop ? DESKTOP.shift : undefined}
            fit={desktop ? undefined : mobileFit}
          >
            {hud}
          </ExplodedView>
        )
      )}

      {/* faixa-ponte entre a figura e o resto da folha */}
      {(sheet.summary || sheet.caseUrl) && (
        <div className="border-y border-border">
          <div className="frame flex flex-col items-start justify-between gap-4 py-8 md:flex-row md:items-center">
            {sheet.summary && <p className="max-w-[60ch] text-[15px] text-muted-foreground">{sheet.summary}</p>}
            {sheet.caseUrl && (
              <Link
                to={sheet.caseUrl}
                className="shrink-0 rounded-[7px] bg-primary px-5 py-3 font-mono text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                estudo de caso →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
