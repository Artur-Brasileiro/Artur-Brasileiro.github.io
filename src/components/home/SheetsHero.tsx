/**
 * Hero da home: as "folhas" do desenho. Cada projeto com modelo 3D é uma folha;
 * rolar desmonta a folha aberta, e o carimbo troca de folha.
 *
 * Por cima do canvas, tudo é HUD de desenho técnico: título (some quando a
 * desmontagem começa), legenda da figura, lista de materiais montada do
 * parts.json, marcas de corte e o carimbo com etapa, folha e progresso.
 */
import { forwardRef, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { Link } from "react-router-dom";
import { getLenis } from "@/components/motion/SmoothScroll";
import ExplodedView from "@/components/three/ExplodedView";
import { isGroupOut, ramp, type ExplodedState, type FitBox, type Shift } from "@/components/three/explode";
import { sheets, type Sheet } from "@/data/sheets";
import { heroLead } from "@/data/home";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/* Enquadramento no desktop: o modelo começa à direita do título e desliza para
   perto do centro quando o título sai. No celular não há ajuste fixo — o modelo
   cabe na caixa medida entre o texto e o carimbo (veja o Hud). */
const DESKTOP: { zoom: number; shift: Shift } = { zoom: 1.08, shift: (q) => [0.15 - 0.1 * ramp(q, 0.03, 0.16), 0.04] };

const pad = (n: number) => String(n).padStart(2, "0");

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

/** Lista de materiais: cada linha acende quando a peça já saiu do conjunto. */
function PartsList({ cfg, q }: Pick<ExplodedState, "cfg" | "q">) {
  if (!cfg) return null;
  return (
    <div
      className="absolute right-12 top-28 hidden w-[260px] border-l border-border pl-4 lg:block"
      style={{ opacity: ramp(q, 0.05, 0.14) }}
    >
      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">lista de materiais</p>
      {cfg.groups.map((g) => (
        <div
          key={g.id}
          className="grid grid-cols-[64px_1fr] gap-2 py-[5px] transition-opacity duration-300"
          style={{ opacity: isGroupOut(g, q) ? 1 : 0.32 }}
        >
          <span className="text-[10px] tracking-[0.06em] text-gold">{g.ref}</span>
          <span className="font-sans text-[12px] leading-tight text-foreground">
            {g.name}
            {g.spec && <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{g.spec}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

const cell = "border-r border-border px-2.5 py-1.5 uppercase tracking-[0.12em] text-muted-foreground";

/** Troca de folha: o seletor de projetos 3D. Mora no carimbo, nas duas versões dele. */
function SheetPicker({ sheet, index, onSelect, labelWidth }: { sheet: Sheet; index: number; onSelect: (i: number) => void; labelWidth: string }) {
  return (
    <div className={cn("pointer-events-auto grid", labelWidth)}>
      <span className={cell}>
        folha {sheet.n}/{pad(sheets.length)}
      </span>
      <div className="flex" role="group" aria-label="Projetos em 3D">
        {sheets.map((s, i) => {
          const active = i === index;
          const ready = !!s.config;
          return (
            <button
              key={s.n}
              type="button"
              disabled={!ready}
              aria-pressed={active}
              onClick={() => onSelect(i)}
              title={ready ? `Ver ${s.full}` : `${s.full} — modelo em produção`}
              className={cn(
                "flex-1 border-r border-border px-2.5 py-1.5 text-left transition-colors last:border-r-0",
                active && "bg-foreground text-background",
                !active && ready && "text-foreground hover:bg-foreground/5",
                !ready && "cursor-not-allowed text-muted-foreground",
              )}
            >
              {s.n} {s.name}
              {!ready && <span className="ml-1 opacity-70">· em breve</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const Progress = ({ q }: { q: number }) => (
  <div className="h-[2px] bg-border">
    <div className="h-full bg-gold" style={{ width: `${q * 100}%` }} />
  </div>
);

type StampProps = { sheet: Sheet; index: number; onSelect: (i: number) => void; state: ExplodedState };

/** Carimbo completo (desktop): projeto, etapa, folha e progresso, no canto. */
function Stamp({ sheet, index, onSelect, state: { q, cfg, stage, stageIndex } }: StampProps) {
  return (
    <div className="absolute bottom-10 right-12 hidden w-[400px] border border-foreground bg-background/90 text-[10px] lg:block">
      <div className="grid grid-cols-[92px_1fr] border-b border-border">
        <span className={cell}>projeto</span>
        <span className="px-2.5 py-1.5 font-medium text-foreground">{sheet.full}</span>
      </div>
      <div className="grid grid-cols-[92px_1fr] border-b border-border">
        <span className={cell}>
          etapa {pad(stageIndex + 1)}/{pad(cfg?.stages.length ?? 1)}
        </span>
        <span className="px-2.5 py-1.5 font-sans text-[12px] text-foreground" aria-live="polite">
          {stage}
        </span>
      </div>
      <SheetPicker sheet={sheet} index={index} onSelect={onSelect} labelWidth="grid-cols-[92px_1fr]" />
      <Progress q={q} />
    </div>
  );
}

/**
 * Carimbo compacto (celular e tablet): só etapa e folha, ocupando a largura no
 * pé da tela. O nome do projeto já está na legenda da figura; a versão de quatro
 * linhas tampava o modelo.
 */
const StampCompact = forwardRef<HTMLDivElement, StampProps>(function StampCompact({ sheet, index, onSelect, state: { q, cfg, stage, stageIndex } }, ref) {
  return (
    <div ref={ref} className="absolute inset-x-4 bottom-4 border border-foreground bg-background/90 text-[10px] lg:hidden">
      <div className="grid grid-cols-[84px_1fr] border-b border-border">
        <span className={cell}>
          etapa {pad(stageIndex + 1)}/{pad(cfg?.stages.length ?? 1)}
        </span>
        <span className="truncate px-2.5 py-1.5 font-sans text-[12px] text-foreground" aria-live="polite">
          {stage}
        </span>
      </div>
      <SheetPicker sheet={sheet} index={index} onSelect={onSelect} labelWidth="grid-cols-[84px_1fr]" />
      <Progress q={q} />
    </div>
  );
});

/** Caixas onde o modelo cabe no celular: abaixo do título (início) e abaixo da legenda (rolando). */
type FitBoxes = { intro: FitBox; scroll: FitBox };

function Hud({
  sheet,
  index,
  onSelect,
  desktop,
  state,
  boxes,
}: {
  sheet: Sheet;
  index: number;
  onSelect: (i: number) => void;
  desktop: boolean;
  state: ExplodedState;
  boxes: MutableRefObject<FitBoxes | null>;
}) {
  const { q } = state;
  const intro = 1 - ramp(q, 0.03, 0.14);
  const hud = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const compact = useRef<HTMLDivElement>(null);

  // No celular o modelo vai no espaço que sobra entre o texto e o carimbo, e
  // esse espaço muda de aparelho a aparelho (altura da tela, barras do
  // navegador, quantas linhas o texto quebra). Então ele é medido, não chutado.
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
      const bottom = s.offsetTop - GAP;
      const below = (top: number): FitBox => ({ x: SIDE / W, y: top / H, w: (W - 2 * SIDE) / W, h: Math.max(0.15, (bottom - top) / H) });
      boxes.current = {
        intro: below(t.offsetTop + t.offsetHeight + GAP),
        scroll: below(c.offsetTop + c.offsetHeight + GAP),
      };
    };
    measure();
    const ro = new ResizeObserver(measure);
    [hud, title, compact].forEach((r) => r.current && ro.observe(r.current));
    return () => ro.disconnect();
  }, [boxes]);

  return (
    <div ref={hud} className="pointer-events-none absolute inset-0 font-mono">
      <CropMarks />

      {/* título: some quando a desmontagem começa */}
      <div
        ref={title}
        className="absolute left-6 right-6 top-[76px] max-w-[640px] md:left-12 md:right-auto md:top-28"
        style={{ opacity: intro, transform: `translateY(${(1 - intro) * -24}px)` }}
      >
        <p className="text-[12px] text-gold [text-shadow:0_0_14px_hsl(var(--gold-soft)/0.35)]">$ whoami</p>
        <h1 className="mt-3 text-[clamp(40px,6.4vw,92px)] font-medium leading-[0.98] tracking-[-0.045em] text-foreground">
          {/* o espaço antes da quebra mantém o nome legível para leitor de tela e busca */}
          artur <br />
          brasileiro
        </h1>
        <p className="mt-5 max-w-[46ch] font-sans text-[14px] leading-relaxed text-muted-foreground md:mt-6 md:text-[15px]">{heroLead}</p>
      </div>

      {/* legenda da figura, no lugar do título */}
      <p
        ref={caption}
        className="absolute left-6 right-6 top-[76px] text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:left-12 md:right-auto md:top-28"
        style={{ opacity: 1 - intro }}
        aria-hidden={intro > 0.5}
      >
        <span className="text-gold">fig. {sheet.n}</span> — {sheet.full.toLowerCase()}, vista explodida
      </p>

      <PartsList cfg={state.cfg} q={q} />

      {/* no celular o texto de cima já diz para rolar, e aqui o carimbo cobriria a dica */}
      <p className="absolute bottom-10 left-12 hidden text-[11px] text-muted-foreground lg:block">
        {q < 0.02 ? "↓ role para desmontar" : desktop ? "arraste para girar" : ""}
      </p>

      <Stamp sheet={sheet} index={index} onSelect={onSelect} state={state} />
      <StampCompact ref={compact} sheet={sheet} index={index} onSelect={onSelect} state={state} />
    </div>
  );
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpBox = (a: FitBox, b: FitBox, t: number): FitBox => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});

export default function SheetsHero() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLElement>(null);
  const boxes = useRef<FitBoxes | null>(null);
  const sheet = sheets[index];

  // celular: a caixa cresce do espaço abaixo do título para o espaço abaixo da
  // legenda, no mesmo trecho em que o título some
  const fit = desktop
    ? undefined
    : (q: number) => {
        const b = boxes.current;
        return b ? lerpBox(b.intro, b.scroll, ramp(q, 0.03, 0.14)) : null;
      };

  // trocar de folha volta ao começo da trilha: o modelo novo chega montado e a
  // pessoa o vê desmontar desde o início, em vez de cair no meio da explosão
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

  return (
    <>
      {sheet.config && (
        // key: cada folha monta o próprio canvas, com o próprio modelo
        <ExplodedView
          ref={track}
          key={sheet.config}
          configUrl={sheet.config}
          trackVh={460}
          className="bg-grid"
          zoom={desktop ? DESKTOP.zoom : 1}
          shift={desktop ? DESKTOP.shift : undefined}
          fit={fit}
        >
          {(state) => <Hud sheet={sheet} index={index} onSelect={selectSheet} desktop={desktop} state={state} boxes={boxes} />}
        </ExplodedView>
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
