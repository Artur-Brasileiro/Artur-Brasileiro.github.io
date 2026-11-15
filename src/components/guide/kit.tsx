/**
 * Peças dos guias de construção ("Monte o seu"): capítulo, parágrafo, tabela que
 * vira cartão no celular, avisos, código, números grandes, passos e o índice
 * lateral que marca o capítulo da vez. Usadas pelo guia do pêndulo e pelo da CNC.
 *
 * Os textos dos guias moram em src/data como strings simples; fmt.tsx entende
 * `código` e **destaque** neles. Rolagem e índice ficam em nav.ts.
 */
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "./fmt";
import { goTo, LG, useMatch } from "./nav";

export type Row = string[];
export type ChapterInfo = { id: string; n: string; title: string };

/* ------------------------------------------------------------------ texto */

/* ------------------------------------------------------------------ peças */

/**
 * Capítulo do guia. Longe da tela, o navegador pula o layout dele
 * (content-visibility): os guias têm milhares de elementos, e o primeiro layout
 * no celular caía pela metade. `eager` desliga isso para o capítulo cujo
 * conteúdo sai da própria caixa (um diagrama largo): a contenção o cortaria.
 */
export function Chapter({ id, n, title, eager, children }: ChapterInfo & { eager?: boolean; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-t`}
      className={cn("border-t border-border pt-10 first:border-t-0 first:pt-0", !eager && "[contain-intrinsic-size:auto_1600px] [content-visibility:auto]")}
    >
      <p className="font-mono text-[12px] text-gold">{n}</p>
      <h3 id={`${id}-t`} className="font-display mt-1 text-2xl font-medium text-foreground md:text-[28px]">
        {title}
      </h3>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export const P = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("max-w-[74ch] text-[15px] leading-relaxed text-muted-foreground", className)}>{fmt(children)}</p>
);

export const H4 = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h4 className={cn("text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground", className)}>{children}</h4>
);

/** tabela simples; no celular cada linha vira um cartão, com o rótulo de cada coluna */
export function Table({ head, rows, cell }: { head: string[]; rows: Row[]; cell?: (row: Row, i: number) => ReactNode }) {
  const show = (row: Row, i: number) => (cell ? cell(row, i) : fmt(row[i]));
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <ul className="divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <li key={row[0]} className="px-4 py-3">
            <p className="text-[14.5px] font-medium text-foreground">{show(row, 0)}</p>
            <dl className="mt-1.5 space-y-1">
              {head.slice(1).map((h, j) =>
                row[j + 1] ? (
                  <div key={h} className="flex gap-2 text-[13.5px] leading-relaxed">
                    <dt className="shrink-0 text-[11px] uppercase leading-[1.9] tracking-wider text-muted-foreground/80">{h}</dt>
                    <dd className="min-w-0 text-muted-foreground">{show(row, j + 1)}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead>
          <tr className="border-b border-border bg-surface">
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row[0]} className="align-top">
              {head.map((_, i) => (
                <td key={i} className={cn("px-4 py-3 leading-relaxed", i === 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {show(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ tone, title, children }: { tone: "warn" | "tip"; title: string; children: ReactNode }) {
  const Icon = tone === "warn" ? AlertTriangle : Lightbulb;
  return (
    <div className={cn("flex gap-3 rounded-lg border p-4", tone === "warn" ? "border-gold/40 bg-gold/[0.07]" : "border-border bg-background")}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "warn" ? "text-gold" : "text-primary")} aria-hidden />
      <div className="min-w-0 text-[14.5px] leading-relaxed">
        <p className="font-semibold text-foreground">{title}</p>
        <div className="mt-1 text-muted-foreground">{fmt(children)}</div>
      </div>
    </div>
  );
}

export const Code = ({ children, label }: { children: string; label?: string }) => (
  <figure className="overflow-hidden rounded-lg border border-border bg-[hsl(220_13%_10%)]">
    {label && <figcaption className="border-b border-white/10 px-4 py-2 font-mono text-[11px] text-white/50">{label}</figcaption>}
    <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-white/85">
      <code>{children}</code>
    </pre>
  </figure>
);

/** números grandes com legenda */
export const Figures = ({ items, className }: { items: { v: string; k: string }[]; className?: string }) => (
  <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4", className)}>
    {items.map((it) => (
      <div key={it.k} className="border-t border-foreground pt-3">
        <dt className="sr-only">{it.k}</dt>
        <dd className="font-display text-2xl font-medium tabular-nums text-foreground">{it.v}</dd>
        <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">{it.k}</p>
      </div>
    ))}
  </dl>
);

export function FileLink({ file, className, children }: { file: { href: string }; className?: string; children: ReactNode }) {
  return (
    <a
      href={file.href}
      download
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      {children}
    </a>
  );
}

export const Steps = ({ items, start = 1 }: { items: ReactNode[]; start?: number }) => (
  <ol className="space-y-4">
    {items.map((s, i) => (
      <li key={i} className="flex gap-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background font-mono text-[12px] text-foreground">
          {i + start}
        </span>
        <div className="min-w-0 pt-0.5 text-[15px] leading-relaxed text-muted-foreground">{fmt(s)}</div>
      </li>
    ))}
  </ol>
);

export const Bullets = ({ items, icon: Icon = Check }: { items: ReactNode[]; icon?: typeof Check }) => (
  <ul className="space-y-2.5">
    {items.map((s, i) => (
      <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
        <Icon className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0">{fmt(s)}</span>
      </li>
    ))}
  </ul>
);

/* ------------------------------------------------------------------ índice */

/**
 * O capítulo da vez é o que cruza a linha a um terço da tela. Antes isto media
 * cada capítulo com getBoundingClientRect ao abrir e a cada rolagem: com uma
 * página de ~38 mil px, isso forçava o layout inteiro na hora e custava ~1,5 s
 * de CPU num celular lento. O IntersectionObserver avisa sem forçar nada; no
 * vão entre dois capítulos, fica o anterior.
 */
function useActiveChapter(ids: string[], on: boolean) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!on) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-33% 0px -66% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [ids, on]);
  return active;
}

/** índice parado ao lado no desktop; `ids` precisa ser estável (fora do componente) */
export function Toc({ chapters, ids, hidden }: { chapters: ChapterInfo[]; ids: string[]; hidden?: boolean }) {
  const lg = useMatch(LG);
  const active = useActiveChapter(ids, lg);
  // a coluna do índice continua no grid; só o conteúdo dele espera o lg
  if (!lg) return <div aria-hidden className="hidden" />;
  return (
    <nav
      aria-label="Capítulos do guia"
      aria-hidden={hidden || undefined}
      className={cn("hidden transition-opacity duration-300 lg:block", hidden && "pointer-events-none opacity-0")}
    >
      <ol data-guide-toc="" className="sticky top-24 space-y-1 border-l border-border">
        {chapters.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              onClick={(e) => goTo(e, c.id)}
              aria-current={active === c.id ? "true" : undefined}
              className={cn(
                "-ml-px flex gap-3 border-l py-1.5 pl-4 text-[13px] leading-snug transition-colors",
                active === c.id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-mono text-[11px] text-gold">{c.n}</span>
              {c.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
