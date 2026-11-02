/**
 * Hero da home: as "folhas" do desenho. Cada projeto com modelo 3D é uma folha;
 * rolar desmonta a folha aberta, e o carimbo troca de folha.
 *
 * Por cima do canvas, tudo é HUD de desenho técnico: título (some quando a
 * desmontagem começa), legenda da figura, lista de materiais montada do
 * parts.json, marcas de corte e o carimbo com etapa, folha e progresso.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import ExplodedView from "@/components/three/ExplodedView";
import { isGroupOut, ramp, type ExplodedState, type Shift } from "@/components/three/explode";
import { sheets, type Sheet } from "@/data/sheets";
import { heroLead } from "@/data/home";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/* Enquadramento: no desktop o modelo começa à direita do título e desliza para
   perto do centro quando o título sai; no celular começa abaixo do título e sobe. */
const DESKTOP: { zoom: number; shift: Shift } = { zoom: 1.08, shift: (q) => [0.15 - 0.1 * ramp(q, 0.03, 0.16), 0.04] };
const MOBILE: { zoom: number; shift: Shift } = { zoom: 1.75, shift: (q) => [0, 0.2 - 0.26 * ramp(q, 0.03, 0.14)] };

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

/** Carimbo: projeto, etapa e a troca de folha — o seletor de projetos 3D mora aqui. */
function Stamp({
  sheet,
  index,
  onSelect,
  state: { q, cfg, stage, stageIndex },
}: {
  sheet: Sheet;
  index: number;
  onSelect: (i: number) => void;
  state: ExplodedState;
}) {
  const cell = "border-r border-border px-2.5 py-1.5 uppercase tracking-[0.12em] text-muted-foreground";
  return (
    <div className="absolute bottom-8 right-6 w-[min(400px,calc(100%-48px))] border border-foreground bg-background/90 text-[10px] md:bottom-10 md:right-12">
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
      <div className="pointer-events-auto grid grid-cols-[92px_1fr]">
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
      <div className="h-[2px] bg-border">
        <div className="h-full bg-gold" style={{ width: `${q * 100}%` }} />
      </div>
    </div>
  );
}

function Hud({ sheet, index, onSelect, desktop, state }: { sheet: Sheet; index: number; onSelect: (i: number) => void; desktop: boolean; state: ExplodedState }) {
  const { q } = state;
  const intro = 1 - ramp(q, 0.03, 0.14);
  return (
    <div className="pointer-events-none absolute inset-0 font-mono">
      <CropMarks />

      {/* título: some quando a desmontagem começa */}
      <div
        className="absolute left-6 top-24 max-w-[640px] md:left-12 md:top-28"
        style={{ opacity: intro, transform: `translateY(${(1 - intro) * -24}px)` }}
      >
        <p className="text-[12px] text-gold [text-shadow:0_0_14px_hsl(var(--gold-soft)/0.35)]">$ whoami</p>
        <h1 className="mt-3 text-[clamp(40px,6.4vw,92px)] font-medium leading-[0.98] tracking-[-0.045em] text-foreground">
          {/* o espaço antes da quebra mantém o nome legível para leitor de tela e busca */}
          artur <br />
          brasileiro
        </h1>
        <p className="mt-6 max-w-[46ch] font-sans text-[15px] leading-relaxed text-muted-foreground">{heroLead}</p>
      </div>

      {/* legenda da figura, no lugar do título */}
      <p
        className="absolute left-6 top-24 text-[11px] uppercase tracking-[0.16em] text-muted-foreground md:left-12 md:top-28"
        style={{ opacity: 1 - intro }}
        aria-hidden={intro > 0.5}
      >
        <span className="text-gold">fig. {sheet.n}</span> — {sheet.full.toLowerCase()}, vista explodida
      </p>

      <PartsList cfg={state.cfg} q={q} />

      <p className="absolute bottom-10 left-8 text-[11px] text-muted-foreground md:left-12">
        {q < 0.02 ? "↓ role para desmontar" : desktop ? "arraste para girar" : ""}
      </p>

      <Stamp sheet={sheet} index={index} onSelect={onSelect} state={state} />
    </div>
  );
}

export default function SheetsHero() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [index, setIndex] = useState(0);
  const sheet = sheets[index];
  const frame = desktop ? DESKTOP : MOBILE;

  return (
    <>
      {sheet.config && (
        // key: trocar de folha recomeça a montagem do zero
        <ExplodedView key={sheet.config} configUrl={sheet.config} trackVh={460} className="bg-grid" zoom={frame.zoom} shift={frame.shift}>
          {(state) => <Hud sheet={sheet} index={index} onSelect={setIndex} desktop={desktop} state={state} />}
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
