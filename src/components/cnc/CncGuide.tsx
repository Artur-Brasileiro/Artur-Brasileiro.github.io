/**
 * "Monte a sua": o guia de construção da CNC plotter, as lições das versões
 * anteriores e os resultados no papel.
 *
 * Catorze capítulos na ordem da montagem, com o índice parado ao lado no
 * desktop. Os textos moram em src/data/cncGuia.ts; os arquivos, em
 * /projetos/cnc/arquivos/; as fotos, em /projetos/cnc/fotos/ (com espaço
 * reservado enquanto não chegam).
 */
import { useRef } from "react";
import { ArrowRight, Box, Download, ExternalLink, FileCode2, Maximize2, Power, PowerOff, ShieldCheck, Terminal } from "lucide-react";
import { Bullets, Callout, Chapter, Code, Figures, FileLink, H4, P, Steps, Table, Toc } from "@/components/guide/kit";
import { fmt } from "@/components/guide/fmt";
import { useTocHidden } from "@/components/guide/nav";
import { Photo, PhotoFrame, PhotoRow, PhotoViewer } from "@/components/guide/Photo";
import { FULL, openPhoto } from "@/components/guide/photos";
import CncFiacao from "./CncFiacao";
import {
  FOTOS,
  IMG,
  fotos as fotosData,
  guia as guiaData,
  resultados as resultadosData,
  type Download as DownloadData,
  type Resultado as ResultadoData,
} from "@/data/cncGuia";
import type { Localized } from "@/i18n/core";
import { useLocale, useLocalized, useT } from "@/i18n/react";
import { cn } from "@/lib/utils";

type Dl = Localized<DownloadData>;
type Resultado = Localized<ResultadoData>;

// os ids são os mesmos nos dois idiomas: a lista fica fora do componente, estável para o índice
const ids = guiaData.capitulos.map((c) => c.id);

/** a origem de cada número, como no caderno de bordo; `v` é a chave do dado ("medido", "calculado") */
function Origem({ v }: { v: string }) {
  const t = useT();
  if (!v) return null;
  const label = v === "medido" ? t("medido", "measured") : v === "calculado" ? t("calculado", "calculated") : v;
  return (
    <span
      className={cn(
        "inline-flex rounded-[4px] border px-1.5 py-px font-mono text-[10.5px] uppercase tracking-wider",
        v === "medido" ? "border-primary/25 bg-primary/[0.06] text-primary" : "border-border bg-surface text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

/** botões de arquivo: nome em mono e o que é embaixo */
function Files({ items }: { items: Dl[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((d) => (
        <FileLink key={d.href} file={d} className="min-h-[44px] px-3 py-1.5">
          {d.href.endsWith(".stl") || d.href.endsWith(".step") ? (
            <Box className="h-4 w-4 shrink-0" aria-hidden />
          ) : d.href.endsWith(".py") || d.href.endsWith(".toml") ? (
            <Terminal className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <FileCode2 className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <span className="flex flex-col text-left leading-tight">
            <span className="font-mono text-[12.5px]">{d.label}</span>
            <span className="text-[11.5px] text-muted-foreground">{d.detail}</span>
          </span>
        </FileLink>
      ))}
    </div>
  );
}

/** imagem do pacote (planta, prévia) que amplia ao tocar */
function Figure({ src, alt, title, caption, className, ratio }: { src: string; alt: string; title: string; caption: string; className?: string; ratio?: string }) {
  const t = useT();
  return (
    <figure className={cn("min-w-0", className)}>
      <button
        type="button"
        onClick={() => openPhoto({ src, alt, title, caption })}
        className="group relative block w-full overflow-hidden rounded-lg border border-border bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={ratio ? { aspectRatio: ratio } : undefined}
        aria-label={`${t("Ampliar", "Enlarge")}: ${title}`}
      >
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/90 text-foreground opacity-80 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" aria-hidden />
        </span>
      </button>
      <figcaption className="mt-2.5 text-[13px] leading-snug text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-lg border border-border bg-background p-5", className)}>{children}</div>
);

/* ------------------------------------------------------------------ resultados */

function ResultCard({ r }: { r: Resultado }) {
  const t = useT();
  const fotos = useLocalized(fotosData);
  const f = r.foto ? fotos[r.foto] : undefined;
  const previa = r.previa && (
    <button
      type="button"
      onClick={() =>
        openPhoto({
          src: r.previa!.src,
          alt: r.previa!.alt,
          title: f ? `${r.title} · ${t("prévia", "preview")}` : r.title,
          caption: f ? t("Prévia digital do G-code. A foto do papel entra aqui.", "Digital preview of the G-code. The photo of the paper goes here.") : t("O desenho que o G-code faz.", "The drawing the G-code makes."),
        })
      }
      className="group relative block w-full overflow-hidden rounded-lg border border-border bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      style={{ aspectRatio: (f?.ratio ?? "4/3").replace("/", " / ") }}
      aria-label={`${t("Ampliar a prévia", "Enlarge the preview")}: ${r.title}`}
    >
      <img src={r.previa.src} alt={r.previa.alt} loading="lazy" decoding="async" className={cn("h-full w-full", r.previa.fit === "contain" ? (r.destaque ? "object-contain p-[3%] pt-10" : "object-contain p-[8%]") : "object-cover object-top")} />
      <span className="absolute left-3 top-3 rounded-[5px] border border-border bg-background/95 px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground shadow-soft-sm">
        {f ? t("prévia digital · foto em breve", "digital preview · photo coming soon") : t("prévia digital", "digital preview")}
      </span>
    </button>
  );

  return (
    <article className="flex min-w-0 flex-col">
      {f ? <PhotoFrame info={f} dir={FOTOS} fallback={previa || undefined} /> : previa}
      <div className="mt-4 flex flex-1 flex-col">
        <p className="font-mono text-[11.5px] text-gold">{r.meta}</p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{r.title}</h3>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{r.text}</p>
        {r.numeros && (
          <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
            {r.numeros.map((x) => (
              <div key={x.k}>
                <dt className="sr-only">{x.k}</dt>
                <dd className="font-display text-xl font-medium tabular-nums text-foreground">{x.v}</dd>
                <p className="text-[12.5px] text-muted-foreground">{x.k}</p>
              </div>
            ))}
          </dl>
        )}
        {r.arquivos && (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {r.arquivos.map((a) => (
              <FileLink key={a.href} file={a} className="h-9 px-3 text-[12px]">
                <Download className="h-3.5 w-3.5" aria-hidden />
                <span className="font-mono">{a.label}</span>
                <span className="text-muted-foreground">{a.detail}</span>
              </FileLink>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ guia */

export default function CncGuide() {
  // trocar de idioma não remonta a página: os dados viram texto a cada render, no idioma da vez
  const t = useT();
  const locale = useLocale();
  const guia = useLocalized(guiaData);
  const fotos = useLocalized(fotosData);
  const resultados = useLocalized(resultadosData);
  const c = guia.capitulos;
  const { visao, material, impressao, mesa, correias, carro, fins, ligacoes, firmware, calibracao, rotina, traco, gcode } = guia;

  // o esquema de ligações ocupa a largura toda: enquanto ele cruza a altura do índice, o índice sai
  const wide = useRef<HTMLDivElement>(null);
  const tocHidden = useTocHidden(wide);

  return (
    <>
      <PhotoViewer />

      <section id="monte-a-sua" className="border-b border-border bg-surface">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">{t("Guia de construção", "Build guide")}</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
            <div>
              <h2 className="font-display text-display-lg font-medium">{t("Monte a sua", "Build your own")}</h2>
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

          {/* no celular, o índice vira uma faixa de atalhos que anda de lado */}
          <nav aria-label={t("Atalhos para os capítulos", "Chapter shortcuts")} className="-mx-6 mt-10 lg:hidden">
            <ol className="flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]" data-lenis-prevent-horizontal="">
              {c.map((ch) => (
                <li key={ch.id} className="shrink-0">
                  <a href={`#${ch.id}`} className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3.5 text-[12.5px] text-foreground">
                    <span className="font-mono text-[10.5px] text-gold">{ch.n}</span>
                    {ch.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
            <Toc chapters={c} ids={ids} hidden={tocHidden} />

            <div className="min-w-0 space-y-14">
              {/* 01 · visão geral */}
              <Chapter {...c[0]}>
                <P>{visao.resumo}</P>
                <Photo info={fotos.maquinaInteira} dir={FOTOS} sizes={FULL} />
                <div className="grid gap-4 md:grid-cols-3">
                  {visao.eixos.map((e) => (
                    <Card key={e.k}>
                      <H4>{e.k}</H4>
                      <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">{fmt(e.v)}</p>
                    </Card>
                  ))}
                </div>
                <div className="grid gap-8 xl:grid-cols-[1.25fr_1fr] xl:items-start">
                  <Figure
                    src={locale === "en" ? `${IMG}/planta.en.svg` : `${IMG}/planta.svg`}
                    alt={t(
                      "Planta da máquina vista de cima: tampo de 1200 × 700 mm, as duas barras de 12 mm a 516 mm uma da outra, a área útil de 810 × 390 mm com a origem no canto da frente à esquerda, a ponte em home à direita e a eletrônica no meio da borda do fundo.",
                      "Top-view plan of the machine: 1200 × 700 mm tabletop, the two 12 mm rods 516 mm apart, the 810 × 390 mm work area with the origin at the front left corner, the gantry at home on the right and the electronics in the middle of the back edge.",
                    )}
                    title={t("Planta da máquina", "Machine plan")}
                    caption={t(
                      "A máquina vista de cima, com o operador na frente. A ponte está em home: toda à direita, com o carro no fundo.",
                      "The machine from above, with the operator at the front. The gantry is at home: all the way right, with the carriage at the back.",
                    )}
                    ratio="990 / 600"
                  />
                  <div>
                    <H4>{t("Convenção de lados", "Side conventions")}</H4>
                    <p className="mt-2 text-[13.5px] text-muted-foreground">
                      {t("De pé, de frente para a máquina. Todo o guia usa estes nomes.", "Standing, facing the machine. The whole guide uses these names.")}
                    </p>
                    <div className="mt-4">
                      <Bullets items={visao.lados} />
                    </div>
                  </div>
                </div>
                <Table
                  head={[t("Especificação", "Spec"), t("Valor", "Value"), t("Origem", "Source")]}
                  rows={visao.specs}
                  cell={(row, i) => (i === 2 ? <Origem v={row[2]} /> : fmt(row[i]))}
                />
                <p className="text-[13px] text-muted-foreground">
                  <span className="font-medium text-foreground">{t("Origem:", "Source:")}</span>{" "}
                  {t(
                    "medido na bancada, ou calculado a partir do projeto. Os do modelo do FreeCAD estão marcados no texto.",
                    "measured on the bench, or calculated from the design. Values from the FreeCAD model are marked in the text.",
                  )}
                </p>
              </Chapter>

              {/* 02 · material */}
              <Chapter {...c[1]}>
                <div className="space-y-3">
                  <H4>{t("Mecânica", "Mechanical")}</H4>
                  <Table head={["Item", t("Qtd.", "Qty"), t("Para quê", "What for")]} rows={material.mecanica} />
                </div>
                <div className="space-y-3">
                  <H4>{t("Parafusos", "Screws")}</H4>
                  <Table head={["Item", t("Qtd.", "Qty"), t("Onde", "Where")]} rows={material.parafusos} />
                </div>
                <div className="space-y-3">
                  <H4>{t("Eletrônica", "Electronics")}</H4>
                  <Table head={["Item", t("Qtd.", "Qty"), t("Observação", "Notes")]} rows={material.eletronica} />
                </div>
                <Callout tone="tip" title={t("Correia com sobra", "Buy extra belt")}>
                  {t(
                    "São ≈ 2,25 m de correia na máquina. Compre uns 3 m: o ajuste das presilhas e do esticador come um pedaço, e errar o corte é fácil.",
                    "The machine uses ≈ 2.25 m of belt. Buy about 3 m: adjusting the clamps and the tensioner eats up a piece, and it's easy to cut it wrong.",
                  )}
                </Callout>
              </Chapter>

              {/* 03 · impressão */}
              <Chapter {...c[2]}>
                <P>{impressao.resumo}</P>
                <Photo info={fotos.pecasImpressas} dir={FOTOS} sizes={FULL} />
                <Table
                  head={[t("Peça", "Part"), t("Qtd.", "Qty"), "Material", t("Função", "Role"), t("Arquivos", "Files")]}
                  rows={impressao.pecas}
                  cell={(row, i) =>
                    i < 4 ? (
                      fmt(row[i])
                    ) : (
                      <span className="flex flex-wrap gap-x-3 gap-y-1">
                        {[row[4], row[5]].filter(Boolean).map((href) => (
                          <a
                            key={href}
                            href={href}
                            download
                            className="-my-1.5 inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap py-1.5 font-mono text-[12.5px] text-foreground underline-offset-4 hover:text-primary hover:underline"
                            aria-label={`${t("Baixar", "Download")} ${href.split("/").pop()}`}
                          >
                            <Box className="h-3.5 w-3.5" aria-hidden />
                            {href.endsWith(".stl") ? ".stl" : ".step"}
                          </a>
                        ))}
                      </span>
                    )
                  }
                />
                <Bullets items={impressao.dicas} />
                <Card className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-center">
                  <Figure
                    src={`${IMG}/base-shield.webp`}
                    alt={t(
                      "Base impressa do Arduino: um quadro fino com quatro pinos para a placa e duas abas com furo para parafusar na mesa.",
                      "Printed Arduino base: a thin frame with four pins for the board and two tabs with holes to screw it to the table.",
                    )}
                    title={t("Base do CNC Shield", "CNC Shield base")}
                    caption={t("Prévia do modelo: em perspectiva e de cima.", "Model preview: in perspective and from above.")}
                    ratio="2 / 1"
                  />
                  <div>
                    <H4>{impressao.base.title}</H4>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">{impressao.base.text}</p>
                    <div className="mt-4">
                      <Files items={impressao.base.files} />
                    </div>
                  </div>
                </Card>
                <Callout tone="tip" title={t("Todas as peças num arquivo só", "Every part in a single file")}>
                  {impressao.pendente}
                </Callout>
              </Chapter>

              {/* 04 · mesa, barras e ponte */}
              <Chapter {...c[3]}>
                <Figures items={mesa.medidas} />
                <div>
                  <H4>{t("Suportes e barras de 12 mm", "Supports and 12 mm rods")}</H4>
                  <div className="mt-5">
                    <Steps items={mesa.suportes} />
                  </div>
                </div>
                <Photo info={fotos.suportes} dir={FOTOS} className="max-w-4xl" sizes={FULL} />
                <Callout tone="tip" title={t("Guiar de um lado, apoiar do outro", "Guide on one side, support on the other")}>
                  {mesa.ideia}
                </Callout>
                <div>
                  <H4>{t("A ponte", "The gantry")}</H4>
                  <div className="mt-5">
                    <Steps items={mesa.ponte} />
                  </div>
                </div>
                <P>{mesa.barras6}</P>
                <PhotoRow>
                  <Photo info={fotos.apoioBase} dir={FOTOS} />
                  <Photo info={fotos.apoioSecundario} dir={FOTOS} />
                </PhotoRow>
              </Chapter>

              {/* 05 · motores e correias */}
              <Chapter {...c[4]}>
                <Callout tone="tip" title={t("O motor escala a correia", "The motor climbs the belt")}>
                  {correias.omegaIdeia}
                </Callout>
                <div>
                  <H4>{t("Eixo X, em ômega", "X axis, omega drive")}</H4>
                  <div className="mt-5">
                    <Steps items={correias.x} />
                  </div>
                </div>
                <Photo info={fotos.omega} dir={FOTOS} className="max-w-4xl" sizes={FULL} />
                <div>
                  <H4>{t("Eixo Y, em laço", "Y axis, closed loop")}</H4>
                  <div className="mt-5">
                    <Steps items={correias.y} />
                  </div>
                </div>
                <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-start">
                  <div>
                    <H4>{t("Presilhas da correia do Y", "Y belt clamps")}</H4>
                    <div className="mt-5">
                      <Steps items={correias.presilha} />
                    </div>
                  </div>
                  <Photo info={fotos.presilha} dir={FOTOS} />
                </div>
                <Figures items={correias.figuras} />
              </Chapter>

              {/* 06 · carro e caneta */}
              <Chapter {...c[5]}>
                <Steps items={carro.passos} />
                <PhotoRow>
                  <Photo info={fotos.carro} dir={FOTOS} />
                  <Photo info={fotos.canalV} dir={FOTOS} />
                </PhotoRow>
                <Callout tone="tip" title={t("A caneta cai por gravidade (com ajuda da mola)", "The pen drops by gravity (with help from the spring)")}>
                  {carro.gravidade}
                </Callout>
                <Callout tone="warn" title={t("Por que o rasgo aberto da v3", "Why v3 has an open slot")}>
                  {carro.rasgo}
                </Callout>
                <Figures items={carro.figuras} />
              </Chapter>

              {/* 07 · fins de curso e eletrônica */}
              <Chapter {...c[6]}>
                <div>
                  <H4>{t("Fins de curso", "Limit switches")}</H4>
                  <div className="mt-4">
                    <Bullets items={fins.chaves} />
                  </div>
                </div>
                <div>
                  <H4>{t("Eletrônica na mesa", "Electronics on the table")}</H4>
                  <div className="mt-5">
                    <Steps items={fins.eletronica} />
                  </div>
                </div>
                <PhotoRow>
                  <Photo info={fotos.fimDeCurso} dir={FOTOS} />
                  <Photo info={fotos.eletronicaMesa} dir={FOTOS} />
                </PhotoRow>
                <Callout tone="warn" title={t("Confira a altura antes de parafusar", "Check the height before screwing it down")}>
                  {fins.altura}
                </Callout>
              </Chapter>

              {/* 08 · ligações */}
              <Chapter {...c[7]} eager>
                <P>{ligacoes.resumo}</P>
                {/* no desktop o desenho sai da coluna do texto e usa a largura toda (210 px do índice + 56 de vão) */}
                <CncFiacao wideRef={wide} wideClassName="lg:-ml-[266px]" />
                <Callout tone="warn" title={t("Por que o servo tem fonte própria", "Why the servo has its own supply")}>
                  {ligacoes.servo}
                </Callout>
                <div className="space-y-3">
                  <H4>{t("Tabela de pinos", "Pin table")}</H4>
                  <Table
                    head={[t("Ligação", "Connection"), t("No shield", "On the shield"), t("Pino do Arduino", "Arduino pin"), t("Observação", "Notes")]}
                    rows={ligacoes.pinos}
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-center">
                  <P>
                    {t(
                      "Para ajustar a corrente: fonte ligada, motores parados, ponta do multímetro no trimpot do driver. Gire devagar até ler ≈ 0,60 V.",
                      "To set the current: supply on, motors stopped, multimeter probe on the driver trimpot. Turn slowly until it reads ≈ 0.60 V.",
                    )}
                  </P>
                  <Photo info={fotos.vref} dir={FOTOS} />
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card>
                    <H4>{t("Antes de energizar", "Before powering up")}</H4>
                    <ol className="mt-4 space-y-2.5">
                      {ligacoes.antes.map((s, i) => (
                        <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-muted-foreground">
                          <span className="font-mono text-[11.5px] leading-[1.9] text-gold">{String(i + 1).padStart(2, "0")}</span>
                          <span className="min-w-0">{fmt(s)}</span>
                        </li>
                      ))}
                    </ol>
                  </Card>
                  <Card className="space-y-3">
                    <H4>{t("Ordem segura", "Safe order")}</H4>
                    <div className="flex gap-3 rounded-md border border-primary/25 bg-primary/[0.05] p-3 text-[14px] leading-relaxed">
                      <Power className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <p className="text-muted-foreground">
                        <b className="font-semibold text-foreground">{t("Ligar: ", "Power on: ")}</b>
                        {fmt(ligacoes.ligar)}
                      </p>
                    </div>
                    <div className="flex gap-3 rounded-md border border-gold/40 bg-gold/[0.07] p-3 text-[14px] leading-relaxed">
                      <PowerOff className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                      <p className="text-muted-foreground">
                        <b className="font-semibold text-foreground">{t("Desligar: ", "Power off: ")}</b>
                        {fmt(ligacoes.desligar)}
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <H4>{t("Testes rápidos", "Quick tests")}</H4>
                    <div className="mt-4">
                      <Bullets items={ligacoes.testes} icon={ShieldCheck} />
                    </div>
                  </Card>
                </div>
              </Chapter>

              {/* 09 · firmware */}
              <Chapter {...c[8]}>
                <div>
                  <H4>{t("Gravar no Arduino", "Flash the Arduino")}</H4>
                  <div className="mt-5">
                    <Steps items={firmware.gravar} />
                  </div>
                  <a
                    href={firmware.forkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3.5 font-mono text-[12.5px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    vankesteren/grbl-servo
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
                <div className="space-y-3">
                  <H4>{t("Configurar", "Configure")}</H4>
                  <P>
                    {t(
                      "Envie os comandos do `configuracao_grbl.txt` pelo console do LaserGRBL (ou pelo Monitor Serial, 115200). Tudo fica gravado na EEPROM do Arduino. Os que mais importam:",
                      "Send the commands from `configuracao_grbl.txt` through the LaserGRBL console (or the Serial Monitor, 115200). Everything is stored in the Arduino's EEPROM. The ones that matter most:",
                    )}
                  </P>
                  <Table head={[t("Parâmetro", "Setting"), t("Valor", "Value"), t("Por quê", "Why")]} rows={firmware.params} />
                </div>
                <Files items={firmware.arquivos} />
              </Chapter>

              {/* 10 · calibração */}
              <Chapter {...c[9]}>
                <div>
                  <H4>{t("Sentido dos eixos", "Axis direction")}</H4>
                  <div className="mt-5">
                    <Steps items={calibracao.sentido} />
                  </div>
                  <P className="mt-4 text-[13.5px]">{calibracao.sentidoNota}</P>
                </div>
                <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-start">
                  <div className="space-y-6">
                    <div>
                      <H4>{t("Escala", "Scale")}</H4>
                      <div className="mt-5">
                        <Steps items={calibracao.escala} />
                      </div>
                    </div>
                    <Callout tone="warn" title={t("Cuidado com medição curta", "Beware of short measurements")}>
                      {calibracao.escalaAviso}
                    </Callout>
                  </div>
                  <Photo info={fotos.escala} dir={FOTOS} />
                </div>
                <div>
                  <H4>{t("Homing e origem", "Homing and origin")}</H4>
                  <div className="mt-5">
                    <Steps items={calibracao.homing} />
                  </div>
                </div>
                <Code label={t("configurar_origem.gcode · rode uma vez", "configurar_origem.gcode · run once")}>{calibracao.origem}</Code>
                <P>{calibracao.origemNota}</P>
                <Callout tone="tip" title={t("Como a máquina “sabe” o tamanho", "How the machine “knows” its size")}>
                  {calibracao.escuro}
                </Callout>
                <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-start">
                  <div>
                    <H4>{t("Um gabarito na mesa", "A template on the table")}</H4>
                    <P className="mt-3">{calibracao.gabarito}</P>
                  </div>
                  <Photo info={fotos.gabarito} dir={FOTOS} />
                </div>
                <div className="space-y-4">
                  <H4>{t("Caneta", "Pen")}</H4>
                  <Table head={[t("Estado", "State"), t("Comando", "Command"), t("O que acontece", "What happens")]} rows={calibracao.caneta} />
                  <Bullets items={calibracao.canetaNotas} />
                </div>
                <div>
                  <H4>{t("Os quatro G-codes de teste", "The four test G-codes")}</H4>
                  <ol className="mt-4 grid gap-4 md:grid-cols-2">
                    {calibracao.testes.map((tst, i) => (
                      <li key={tst.file} className="flex flex-col rounded-lg border border-border bg-background p-5">
                        <span className="font-mono text-[12px] text-gold">
                          {t("teste", "test")} {i + 1}
                        </span>
                        <p className="mt-2 text-[14.5px] leading-relaxed text-foreground">{tst.what}</p>
                        <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">{t("Deu certo se ", "It worked if ")}</span>
                          {tst.ok}
                        </p>
                        <div className="mt-auto pt-4">
                          <FileLink file={{ href: `/projetos/cnc/arquivos/gcode/testes/${tst.file}` }} className="min-h-[36px] max-w-full px-2.5 py-1.5 text-[12px]">
                            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="min-w-0 break-all font-mono">{tst.file}</span>
                          </FileLink>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4">
                    <Files items={[calibracao.origemFile]} />
                  </div>
                </div>
              </Chapter>

              {/* 11 · rotina */}
              <Chapter {...c[10]}>
                <Steps items={rotina.passos} />
                <div className="grid gap-8 xl:grid-cols-[1fr_1fr] xl:items-start">
                  <div>
                    <H4>{t("Dicas do LaserGRBL", "LaserGRBL tips")}</H4>
                    <div className="mt-4">
                      <Bullets items={rotina.dicas} />
                    </div>
                  </div>
                  <Code label={t("comandos do dia a dia · console", "everyday commands · console")}>{rotina.comandos}</Code>
                </div>
              </Chapter>

              {/* 12 · traço */}
              <Chapter {...c[11]}>
                <div>
                  <H4>{t("Micropasso faz toda a diferença", "Microstepping makes all the difference")}</H4>
                  <P className="mt-3">{traco.micropasso}</P>
                </div>
                <Figures items={traco.figuras} />
                <div className="space-y-3">
                  <H4>{t("Testes em 1/16, na cartolina", "Tests at 1/16, on poster board")}</H4>
                  <Table head={[t("Teste", "Test"), t("Resultado (medido)", "Result (measured)")]} rows={traco.testes} />
                </div>
                <Photo info={fotos.cartolina} dir={FOTOS} className="max-w-4xl" sizes={FULL} />
                <P>{traco.conclusao}</P>
                <Callout tone="tip" title={t("Velocidade de trabalho", "Working speed")}>
                  {traco.decisao}
                </Callout>
              </Chapter>

              {/* 13 · G-code */}
              <Chapter {...c[12]}>
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label={t("A cadeia, do desenho à máquina", "The pipeline, from drawing to machine")}>
                  {gcode.cadeia.map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground">{s}</span>
                      {i < gcode.cadeia.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
                    </li>
                  ))}
                </ol>
                <div className="space-y-4">
                  <H4>{t("SVG pronto → G-code", "Finished SVG → G-code")}</H4>
                  <P>{gcode.svg}</P>
                  <Code label="terminal">{gcode.svgCmd}</Code>
                  <Files items={gcode.software} />
                </div>
                <div className="space-y-4">
                  <H4>{t("Imagem → SVG: o ponto mais importante", "Image → SVG: the most important step")}</H4>
                  <P>{gcode.centerline}</P>
                  <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-start">
                    <div className="space-y-4">
                      <Steps items={gcode.passos} />
                      <P className="text-[14px]">{gcode.fotosDica}</P>
                    </div>
                    <Photo info={fotos.f16Detalhe} dir={FOTOS} />
                  </div>
                </div>
                <Card className="space-y-5">
                  <div>
                    <p className="font-mono text-[12px] text-gold">{t("exemplo real", "real example")}</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{t("O pôster do F-16, da imagem ao G-code", "The F-16 poster, from image to G-code")}</p>
                  </div>
                  <Figure
                    src={`${IMG}/f16-simulacao.webp`}
                    alt={t(
                      "Simulação do G-code do pôster do F-16 na orientação da máquina: o pôster deitado, com o título na vertical à esquerda e o (0,0) marcado no canto de baixo à esquerda.",
                      "Simulation of the F-16 poster G-code in the machine's orientation: the poster on its side, with the title running vertically on the left and (0,0) marked at the bottom left corner.",
                    )}
                    title={t("F-16 · simulação do G-code", "F-16 · G-code simulation")}
                    caption={t(
                      "O G-code simulado na orientação da máquina, com o (0,0) no canto: o pôster vai deitado para caber nos 810 × 390.",
                      "The G-code simulated in the machine's orientation, with (0,0) in the corner: the poster goes on its side to fit in the 810 × 390.",
                    )}
                    ratio="1600 / 1027"
                  />
                  <Figures items={gcode.f16} />
                  <Code label={t("vpype · depois dos scripts", "vpype · after the scripts")}>{gcode.vpype}</Code>
                  <Files items={gcode.f16Scripts} />
                </Card>
                <div className="space-y-3">
                  <H4>{t("Ou direto no LaserGRBL", "Or straight in LaserGRBL")}</H4>
                  <Table head={[t("Campo", "Field"), t("Valor", "Value")]} rows={gcode.laserGrbl} />
                  <Callout tone="warn" title={t("Sem pausa para o servo", "No pause for the servo")}>
                    {gcode.laserGrblAviso}
                  </Callout>
                </div>
                <P className="text-[14px]">{gcode.simulador}</P>
              </Chapter>

              {/* 14 · problemas */}
              <Chapter {...c[13]}>
                <P>{t("Tudo o que deu errado na minha, com a causa e o que resolveu.", "Everything that went wrong on mine, with the cause and what fixed it.")}</P>
                <Table head={[t("Sintoma", "Symptom"), t("Causa provável", "Likely cause"), t("Solução", "Fix")]} rows={guia.problemas} />
              </Chapter>
            </div>
          </div>
        </div>
      </section>

      {/* Lições */}
      <section className="border-b border-border bg-background">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">{t("Lições", "Lessons")}</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">{t("O que deu errado antes", "What went wrong before")}</h2>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
            {t(
              "Antes desta versão, a máquina passou por várias tentativas que não funcionaram. São elas que explicam boa parte das decisões do guia.",
              "Before this version, the machine went through several attempts that didn't work. They explain many of the decisions in this guide.",
            )}
          </p>
          <ol className="mt-12 grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Resultados */}
      <section id="resultados" className="border-b border-border bg-surface">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">{t("No papel", "On paper")}</p>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 className="font-display text-display-lg font-medium">{t("O que ela já desenhou", "What it has drawn so far")}</h2>
            <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
              {t("Cada desenho com o G-code que o gerou, para você rodar na sua.", "Each drawing with the G-code that made it, so you can run it on yours.")}
            </p>
          </div>
          {/* o pôster é o destaque, com a máquina desenhando ao lado; embaixo, os outros */}
          <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-[1.3fr_1fr] md:items-start">
            {resultados.filter((r) => r.destaque).map((r) => (
              <ResultCard key={r.id} r={r} />
            ))}
            <Photo info={fotos.emAcao} dir={FOTOS} />
          </div>
          <div className="mt-14 grid gap-x-8 gap-y-12 border-t border-border pt-12 md:grid-cols-3">
            {resultados.filter((r) => !r.destaque).map((r) => (
              <ResultCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
