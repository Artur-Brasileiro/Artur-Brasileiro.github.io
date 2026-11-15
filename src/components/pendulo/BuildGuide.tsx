/**
 * "Monte o seu": o guia de construção do pêndulo na página do projeto.
 *
 * Sete capítulos na ordem em que o aparelho foi feito, com um índice que fica
 * parado ao lado no desktop e marca o capítulo da vez. O conteúdo mora em
 * src/data/penduloGuia.ts; os arquivos para baixar, em /projetos/pendulo/arquivos/.
 */
import { useRef } from "react";
import { Box, Check, Download, FileCode2, ShieldCheck, Terminal } from "lucide-react";
import { Bullets, Callout, Chapter, Code, Figures, FileLink, H4, P, Steps, Table, Toc, useTocHidden } from "@/components/guide/kit";
import PenduloFiacao from "./PenduloFiacao";
import { guia, sketchHref } from "@/data/penduloGuia";
import { cn } from "@/lib/utils";

const ids = guia.capitulos.map((c) => c.id);

/* ------------------------------------------------------------------ guia */

export default function BuildGuide() {
  const [c1, c2, c3, c4, c5, c6, c7] = guia.capitulos;
  const { material, impressao, montagem, eletronica, testes, medicoes, ligar } = guia;

  // o desenho da fiação ocupa a largura toda: enquanto ele cruza a altura do índice, o índice sai
  const wide = useRef<HTMLDivElement>(null);
  const tocHidden = useTocHidden(wide);

  return (
    <>
      <section id="monte-o-seu" className="border-b border-border bg-surface">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">Guia de construção</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
            <div>
              <h2 className="font-display text-display-lg font-medium">Monte o seu</h2>
              <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{guia.intro}</p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={guia.downloads.principal.href}
                download
                className="inline-flex min-h-[52px] items-center gap-3 rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{guia.downloads.principal.label}</span>
                  <span className="text-[11.5px] opacity-80">{guia.downloads.principal.detail}</span>
                </span>
              </a>
              <div className="flex flex-wrap gap-2">
                {guia.downloads.outros.map((d) => (
                  <FileLink key={d.href} file={d} className="h-9 px-3 text-xs">
                    {d.href.endsWith(".stl") ? <Box className="h-3.5 w-3.5" aria-hidden /> : <FileCode2 className="h-3.5 w-3.5" aria-hidden />}
                    <span className="font-mono">{d.label}</span>
                  </FileLink>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
            <Toc chapters={guia.capitulos} ids={ids} hidden={tocHidden} />

            <div className="min-w-0 space-y-14">
              {/* 01 */}
              <Chapter {...c1}>
                <div className="grid gap-4 md:grid-cols-2">
                  {material.grupos.map((g) => (
                    <div key={g.title} className={cn("rounded-lg border border-border bg-background p-5", g.title === "Parafusos" && "md:col-span-2")}>
                      <H4>{g.title}</H4>
                      <ul className={cn("mt-4 grid gap-x-8 gap-y-3", g.title === "Parafusos" && "md:grid-cols-2")}>
                        {g.itens.map(([item, nota]) => (
                          <li key={item} className="text-[14.5px] leading-snug">
                            <span className="text-foreground">{item}</span>
                            {nota && <span className="block text-[13px] text-muted-foreground">{nota}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <P>{material.nota}</P>
              </Chapter>

              {/* 02 */}
              <Chapter {...c2}>
                <P>{impressao.resumo}</P>
                <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-background sm:grid-cols-3">
                  {impressao.destaques.map((d) => (
                    <div key={d.k} className="border-b border-r border-border p-4 [&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(3n)]:border-r-0 sm:[&:nth-last-child(-n+3)]:border-b-0 max-sm:[&:nth-child(2n)]:border-r-0">
                      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{d.k}</dt>
                      <dd className="mt-1 font-mono text-[15px] text-foreground">{d.v}</dd>
                    </div>
                  ))}
                </dl>
                <Callout tone="warn" title="Sem suporte">
                  {impressao.aviso}
                </Callout>
                <Table
                  head={["Peça", "Qtd", "Preench.", "Posição e observação", "STL"]}
                  rows={impressao.pecas}
                  cell={(row, i) =>
                    i === 0 ? (
                      <span className="font-mono text-[13px]">{row[0]}</span>
                    ) : i === 4 ? (
                      <a
                        href={impressao.stlBase + row[4]}
                        download
                        className="-my-2 inline-flex min-h-[40px] items-center gap-1.5 py-2 pr-2 text-foreground underline-offset-4 hover:text-primary hover:underline"
                        aria-label={`Baixar ${row[4]}`}
                      >
                        <Box className="h-3.5 w-3.5" aria-hidden />
                        .stl
                      </a>
                    ) : (
                      row[i]
                    )
                  }
                />
                <P className="text-[13.5px]">{impressao.stlNota}</P>
                <Callout tone="tip" title="Uma peça de teste antes da grande">
                  {impressao.dicaTeste}
                </Callout>
                <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
                  <div>
                    <H4>Depois de imprimir, confira</H4>
                    <div className="mt-4">
                      <Bullets items={impressao.conferir} />
                    </div>
                  </div>
                  <div>
                    <H4>Problemas comuns</H4>
                    <dl className="mt-4 divide-y divide-border">
                      {impressao.problemas.map(([p, s]) => (
                        <div key={p} className="py-2.5 first:pt-0">
                          <dt className="text-[14px] font-medium text-foreground">{p}</dt>
                          <dd className="text-[14px] leading-relaxed text-muted-foreground">{s}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </Chapter>

              {/* 03 */}
              <Chapter {...c3}>
                <P>{montagem.referencia}</P>
                <Figures items={montagem.medidas} />
                <div>
                  <H4>Ordem de montagem</H4>
                  <div className="mt-5">
                    <Steps items={montagem.passos} />
                  </div>
                </div>
                <Callout tone="tip" title="Polia metálica">
                  {montagem.polia}
                </Callout>
              </Chapter>

              {/* 04 */}
              <Chapter {...c4} eager>
                <P>{eletronica.resumo}</P>
                {/* no desktop o desenho sai da coluna do texto e usa a largura toda (210 px do índice + 56 de vão);
                    enquanto ele passa, o índice some para não ficar por cima */}
                <PenduloFiacao wideRef={wide} wideClassName="lg:-ml-[266px]" />
                <Table head={["Aconteceu comigo", "O que era"]} rows={eletronica.problemas} />
              </Chapter>

              {/* 05 */}
              <Chapter {...c5}>
                <P>{testes.resumo}</P>
                <ol className="grid gap-4 md:grid-cols-2">
                  {testes.sketches.map((s) => (
                    <li key={s.file} className="flex flex-col rounded-lg border border-border bg-background p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[12px] text-gold">teste {s.n}</span>
                        <FileLink file={{ href: sketchHref(s.file) }} className="h-8 px-2.5 text-[12px]">
                          <Download className="h-3.5 w-3.5" aria-hidden />
                          <span className="font-mono">{s.file}</span>
                        </FileLink>
                      </div>
                      <p className="mt-3 text-[14.5px] leading-relaxed text-foreground">{s.what}</p>
                      <p className="mt-auto flex gap-2 pt-4 text-[13.5px] leading-relaxed text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span>
                          <span className="font-medium text-foreground">Deu certo se: </span>
                          {s.ok}
                        </span>
                      </p>
                    </li>
                  ))}
                </ol>
              </Chapter>

              {/* 06 */}
              <Chapter {...c6}>
                <P>{medicoes.historia}</P>
                <Code label="medir_pendulo · Monitor Serial">{medicoes.log}</Code>
                <P>{medicoes.conclusao}</P>
                <Figures items={medicoes.numeros} />
                <div className="rounded-lg border border-border bg-background p-5">
                  <H4>O modelo, em uma linha</H4>
                  <p className="mt-4 overflow-x-auto whitespace-nowrap font-mono text-[15px] text-foreground md:text-base">{medicoes.equacao}</p>
                  <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">{medicoes.equacaoNota}</p>
                </div>
                <div>
                  <H4>Se a sua haste for diferente</H4>
                  <P className="mt-3">{medicoes.suaHaste}</P>
                </div>
                <Code label="terminal">{medicoes.comandos}</Code>
                <div className="flex flex-wrap gap-2">
                  {medicoes.scripts.map((s) => (
                    <FileLink key={s.href} file={s} className="min-h-[44px] px-3 py-1.5">
                      <Terminal className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="flex flex-col leading-tight">
                        <span className="font-mono text-[12.5px]">{s.label}</span>
                        <span className="text-[11.5px] text-muted-foreground">{s.detail}</span>
                      </span>
                    </FileLink>
                  ))}
                </div>
                <div>
                  <H4>Antes de ligar o motor com a haste, no computador</H4>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                    {medicoes.resultados.map((r) => (
                      <div key={r.k} className="rounded-lg border border-border bg-background p-4">
                        <dt className="sr-only">{r.k}</dt>
                        <dd className="font-display text-2xl font-medium tabular-nums text-foreground">{r.v}</dd>
                        <p className="mt-1 text-[13.5px] leading-snug text-muted-foreground">{r.k}</p>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-[13px] text-muted-foreground">{medicoes.resultadosNota}</p>
                </div>
              </Chapter>

              {/* 07 */}
              <Chapter {...c7}>
                <Steps items={ligar.passos} />
                <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
                  {ligar.sequencia.map((s) => (
                    <li key={s.title} className="bg-background p-4">
                      <span className="font-mono text-[12px] text-gold">{s.t}</span>
                      <p className="mt-1 font-semibold text-foreground">{s.title}</p>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{s.text}</p>
                    </li>
                  ))}
                </ol>
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <H4>O que protege o aparelho</H4>
                    <div className="mt-4">
                      <Bullets items={ligar.seguranca} icon={ShieldCheck} />
                    </div>
                  </div>
                  <div>
                    <H4>USB e Monitor Serial</H4>
                    <div className="mt-4">
                      <Bullets items={ligar.serial} />
                    </div>
                  </div>
                </div>
                <div>
                  <H4>Ajustes no topo do código</H4>
                  <div className="mt-4 space-y-4">
                    <Code label="pendulo_controle.ino">{ligar.codigo}</Code>
                    <Table
                      head={["Ajuste", "Valor", "Para que serve"]}
                      rows={ligar.ajustes}
                      cell={(row, i) => (i < 2 ? <span className={cn("font-mono text-[13px]", i === 1 && "text-foreground")}>{row[i]}</span> : row[i])}
                    />
                  </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <div>
                    <H4>Se a subida não pegar</H4>
                    <div className="mt-4">
                      <Table head={["Sintoma", "Ajuste"]} rows={ligar.subida} />
                    </div>
                  </div>
                  <div>
                    <H4>Se o equilíbrio der problema</H4>
                    <div className="mt-4">
                      <Table head={["Sintoma", "O que fazer"]} rows={ligar.equilibrio} />
                    </div>
                  </div>
                </div>
              </Chapter>
            </div>
          </div>
        </div>
      </section>

      {/* O que aprendi */}
      <section className="border-b border-border bg-background">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">Lições</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">O que aprendi</h2>
          <ol className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {guia.licoes.map((l, i) => (
              <li key={l.title} className="border-t border-foreground pt-4">
                <span className="font-mono text-[12px] text-gold">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-semibold text-foreground">{l.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{l.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
