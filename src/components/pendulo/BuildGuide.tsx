/**
 * "Monte o seu": o guia de construção do pêndulo na página do projeto.
 *
 * Sete capítulos na ordem em que o aparelho foi feito, com um índice que fica
 * parado ao lado no desktop e marca o capítulo da vez. O conteúdo mora em
 * src/data/penduloGuia.ts; os arquivos para baixar, em /projetos/pendulo/arquivos/.
 */
import { useRef } from "react";
import { Box, Check, Download, FileCode2, ShieldCheck, Terminal } from "lucide-react";
import { Bullets, Callout, Chapter, Code, Figures, FileLink, H4, P, Steps, Table, Toc } from "@/components/guide/kit";
import { useTocHidden } from "@/components/guide/nav";
import PenduloFiacao from "./PenduloFiacao";
import { guia as guiaData, sketchHref } from "@/data/penduloGuia";
import { useLocalized, useT } from "@/i18n/react";
import { cn } from "@/lib/utils";

// os ids não mudam com o idioma; precisam ser estáveis para o índice
const ids = guiaData.capitulos.map((c) => c.id);

/* ------------------------------------------------------------------ guia */

export default function BuildGuide() {
  // todo tr() do guia vira texto do idioma da página (e muda junto na troca)
  const guia = useLocalized(guiaData);
  const t = useT();
  const [c1, c2, c3, c4, c5, c6, c7] = guia.capitulos;
  const { material, impressao, montagem, eletronica, testes, medicoes, ligar } = guia;

  // o desenho da fiação ocupa a largura toda: enquanto ele cruza a altura do índice, o índice sai
  const wide = useRef<HTMLDivElement>(null);
  const tocHidden = useTocHidden(wide);

  return (
    <>
      <section id="monte-o-seu" className="border-b border-border bg-surface">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">{t("Guia de construção", "Build guide")}</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
            <div>
              <h2 className="font-display text-display-lg font-medium">{t("Monte o seu", "Build your own")}</h2>
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
                    <div key={g.title} className={cn("rounded-lg border border-border bg-background p-5", g.wide && "md:col-span-2")}>
                      <H4>{g.title}</H4>
                      <ul className={cn("mt-4 grid gap-x-8 gap-y-3", g.wide && "md:grid-cols-2")}>
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
                <Callout tone="warn" title={t("Sem suporte", "No supports")}>
                  {impressao.aviso}
                </Callout>
                <Table
                  head={[t("Peça", "Part"), t("Qtd", "Qty"), t("Preench.", "Infill"), t("Posição e observação", "Orientation and notes"), "STL"]}
                  rows={impressao.pecas}
                  cell={(row, i) =>
                    i === 0 ? (
                      <span className="font-mono text-[13px]">{row[0]}</span>
                    ) : i === 4 ? (
                      <a
                        href={impressao.stlBase + row[4]}
                        download
                        className="-my-2 inline-flex min-h-[40px] items-center gap-1.5 py-2 pr-2 text-foreground underline-offset-4 hover:text-primary hover:underline"
                        aria-label={t(`Baixar ${row[4]}`, `Download ${row[4]}`)}
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
                <Callout tone="tip" title={t("Uma peça de teste antes da grande", "A test piece before the big one")}>
                  {impressao.dicaTeste}
                </Callout>
                <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
                  <div>
                    <H4>{t("Depois de imprimir, confira", "After printing, check")}</H4>
                    <div className="mt-4">
                      <Bullets items={impressao.conferir} />
                    </div>
                  </div>
                  <div>
                    <H4>{t("Problemas comuns", "Common problems")}</H4>
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
                  <H4>{t("Ordem de montagem", "Assembly order")}</H4>
                  <div className="mt-5">
                    <Steps items={montagem.passos} />
                  </div>
                </div>
                <Callout tone="tip" title={t("Polia metálica", "Metal pulley")}>
                  {montagem.polia}
                </Callout>
              </Chapter>

              {/* 04 */}
              <Chapter {...c4} eager>
                <P>{eletronica.resumo}</P>
                {/* no desktop o desenho sai da coluna do texto e usa a largura toda (210 px do índice + 56 de vão);
                    enquanto ele passa, o índice some para não ficar por cima */}
                <PenduloFiacao wideRef={wide} wideClassName="lg:-ml-[266px]" />
                <Table head={[t("Aconteceu comigo", "What happened to me"), t("O que era", "What it was")]} rows={eletronica.problemas} />
              </Chapter>

              {/* 05 */}
              <Chapter {...c5}>
                <P>{testes.resumo}</P>
                <ol className="grid gap-4 md:grid-cols-2">
                  {testes.sketches.map((s) => (
                    <li key={s.file} className="flex flex-col rounded-lg border border-border bg-background p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[12px] text-gold">{t(`teste ${s.n}`, `test ${s.n}`)}</span>
                        <FileLink file={{ href: sketchHref(s.file) }} className="h-8 px-2.5 text-[12px]">
                          <Download className="h-3.5 w-3.5" aria-hidden />
                          <span className="font-mono">{s.file}</span>
                        </FileLink>
                      </div>
                      <p className="mt-3 text-[14.5px] leading-relaxed text-foreground">{s.what}</p>
                      <p className="mt-auto flex gap-2 pt-4 text-[13.5px] leading-relaxed text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <span>
                          <span className="font-medium text-foreground">{t("Deu certo se: ", "It worked if: ")}</span>
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
                <Code label={t("medir_pendulo · Monitor Serial", "medir_pendulo · Serial Monitor")}>{medicoes.log}</Code>
                <P>{medicoes.conclusao}</P>
                <Figures items={medicoes.numeros} />
                <div className="rounded-lg border border-border bg-background p-5">
                  <H4>{t("O modelo, em uma linha", "The model, in one line")}</H4>
                  <p className="mt-4 overflow-x-auto whitespace-nowrap font-mono text-[15px] text-foreground md:text-base">{medicoes.equacao}</p>
                  <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">{medicoes.equacaoNota}</p>
                </div>
                <div>
                  <H4>{t("Se a sua haste for diferente", "If your rod is different")}</H4>
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
                  <H4>{t("Antes de ligar o motor com a haste, no computador", "On the computer, before running the motor with the rod")}</H4>
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
                    <H4>{t("O que protege o aparelho", "What protects the rig")}</H4>
                    <div className="mt-4">
                      <Bullets items={ligar.seguranca} icon={ShieldCheck} />
                    </div>
                  </div>
                  <div>
                    <H4>{t("USB e Monitor Serial", "USB and Serial Monitor")}</H4>
                    <div className="mt-4">
                      <Bullets items={ligar.serial} />
                    </div>
                  </div>
                </div>
                <div>
                  <H4>{t("Ajustes no topo do código", "Settings at the top of the code")}</H4>
                  <div className="mt-4 space-y-4">
                    <Code label="pendulo_controle.ino">{ligar.codigo}</Code>
                    <Table
                      head={[t("Ajuste", "Setting"), t("Valor", "Value"), t("Para que serve", "What it does")]}
                      rows={ligar.ajustes}
                      cell={(row, i) => (i < 2 ? <span className={cn("font-mono text-[13px]", i === 1 && "text-foreground")}>{row[i]}</span> : row[i])}
                    />
                  </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <div>
                    <H4>{t("Se a subida não pegar", "If the swing-up doesn't catch")}</H4>
                    <div className="mt-4">
                      <Table head={[t("Sintoma", "Symptom"), t("Ajuste", "Adjustment")]} rows={ligar.subida} />
                    </div>
                  </div>
                  <div>
                    <H4>{t("Se o equilíbrio der problema", "If balancing goes wrong")}</H4>
                    <div className="mt-4">
                      <Table head={[t("Sintoma", "Symptom"), t("O que fazer", "What to do")]} rows={ligar.equilibrio} />
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
          <p className="eyebrow">{t("Lições", "Lessons")}</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">{t("O que aprendi", "What I learned")}</h2>
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
