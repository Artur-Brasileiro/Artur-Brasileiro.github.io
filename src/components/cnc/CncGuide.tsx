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
import { Bullets, Callout, Chapter, Code, Figures, FileLink, H4, P, Steps, Table, Toc, useTocHidden, fmt } from "@/components/guide/kit";
import { Photo, PhotoFrame, PhotoRow, PhotoViewer, openPhoto } from "@/components/guide/Photo";
import CncFiacao from "./CncFiacao";
import { FOTOS, IMG, fotos, guia, resultados, type Download as Dl, type Resultado } from "@/data/cncGuia";
import { cn } from "@/lib/utils";

const ids = guia.capitulos.map((c) => c.id);

/** a origem de cada número, como no caderno de bordo */
function Origem({ v }: { v: string }) {
  if (!v) return null;
  return (
    <span
      className={cn(
        "inline-flex rounded-[4px] border px-1.5 py-px font-mono text-[10.5px] uppercase tracking-wider",
        v === "medido" ? "border-primary/25 bg-primary/[0.06] text-primary" : "border-border bg-surface text-muted-foreground",
      )}
    >
      {v}
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
  return (
    <figure className={cn("min-w-0", className)}>
      <button
        type="button"
        onClick={() => openPhoto({ src, alt, title, caption })}
        className="group relative block w-full overflow-hidden rounded-lg border border-border bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={ratio ? { aspectRatio: ratio } : undefined}
        aria-label={`Ampliar: ${title}`}
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
  const f = r.foto ? fotos[r.foto] : undefined;
  const previa = r.previa && (
    <button
      type="button"
      onClick={() => openPhoto({ src: r.previa!.src, alt: r.previa!.alt, title: f ? `${r.title} · prévia` : r.title, caption: f ? "Prévia digital do G-code. A foto do papel entra aqui." : "O desenho que o G-code faz." })}
      className="group relative block w-full overflow-hidden rounded-lg border border-border bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      style={{ aspectRatio: (f?.ratio ?? "4/3").replace("/", " / ") }}
      aria-label={`Ampliar a prévia: ${r.title}`}
    >
      <img src={r.previa.src} alt={r.previa.alt} loading="lazy" decoding="async" className={cn("h-full w-full", r.previa.fit === "contain" ? (r.destaque ? "object-contain p-[3%] pt-10" : "object-contain p-[8%]") : "object-cover object-top")} />
      <span className="absolute left-3 top-3 rounded-[5px] border border-border bg-background/95 px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground shadow-soft-sm">
        {f ? "prévia digital · foto em breve" : "prévia digital"}
      </span>
    </button>
  );

  return (
    <article className={cn("flex min-w-0 flex-col", r.destaque && "md:row-span-2")}>
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
          <p className="eyebrow">Guia de construção</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
            <div>
              <h2 className="font-display text-display-lg font-medium">Monte a sua</h2>
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
          <nav aria-label="Atalhos para os capítulos" className="-mx-6 mt-10 lg:hidden">
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
                <Photo info={fotos.maquinaInteira} dir={FOTOS} />
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
                    src={`${IMG}/planta.svg`}
                    alt="Planta da máquina vista de cima: tampo de 1200 × 700 mm, as duas barras de 12 mm a 516 mm uma da outra, a área útil de 810 × 390 mm com a origem no canto da frente à esquerda, a ponte em home à direita e a eletrônica no meio da borda do fundo."
                    title="Planta da máquina"
                    caption="A máquina vista de cima, com o operador na frente. A ponte está em home: toda à direita, com o carro no fundo."
                    ratio="990 / 600"
                  />
                  <div>
                    <H4>Convenção de lados</H4>
                    <p className="mt-2 text-[13.5px] text-muted-foreground">De pé, de frente para a máquina. Todo o guia usa estes nomes.</p>
                    <div className="mt-4">
                      <Bullets items={visao.lados} />
                    </div>
                  </div>
                </div>
                <Table
                  head={["Especificação", "Valor", "Origem"]}
                  rows={visao.specs}
                  cell={(row, i) => (i === 2 ? <Origem v={row[2]} /> : fmt(row[i]))}
                />
                <p className="text-[13px] text-muted-foreground">
                  <span className="font-medium text-foreground">Origem:</span> medido na bancada, ou calculado a partir do projeto. Os do modelo do FreeCAD estão marcados no texto.
                </p>
              </Chapter>

              {/* 02 · material */}
              <Chapter {...c[1]}>
                <div className="space-y-3">
                  <H4>Mecânica</H4>
                  <Table head={["Item", "Qtd.", "Para quê"]} rows={material.mecanica} />
                </div>
                <div className="space-y-3">
                  <H4>Parafusos</H4>
                  <Table head={["Item", "Qtd.", "Onde"]} rows={material.parafusos} />
                </div>
                <div className="space-y-3">
                  <H4>Eletrônica</H4>
                  <Table head={["Item", "Qtd.", "Observação"]} rows={material.eletronica} />
                </div>
                <Callout tone="tip" title="Correia com sobra">
                  São ≈ 2,25 m de correia na máquina. Compre uns 3 m: o ajuste das presilhas e do esticador come um pedaço, e errar o corte é fácil.
                </Callout>
              </Chapter>

              {/* 03 · impressão */}
              <Chapter {...c[2]}>
                <P>{impressao.resumo}</P>
                <Table head={["Peça", "Qtd.", "Material", "Função"]} rows={impressao.pecas} />
                <Bullets items={impressao.dicas} />
                <Photo info={fotos.pecasImpressas} dir={FOTOS} />
                <Card className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-center">
                  <Figure
                    src={`${IMG}/base-shield.webp`}
                    alt="Base impressa do Arduino: um quadro fino com quatro pinos para a placa e duas abas com furo para parafusar na mesa."
                    title="Base do CNC Shield"
                    caption="Prévia do modelo: em perspectiva e de cima."
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
                <Callout tone="tip" title="O resto dos STL">
                  {impressao.pendente}
                </Callout>
              </Chapter>

              {/* 04 · mesa, barras e ponte */}
              <Chapter {...c[3]}>
                <Figures items={mesa.medidas} />
                <div>
                  <H4>Suportes e barras de 12 mm</H4>
                  <div className="mt-5">
                    <Steps items={mesa.suportes} />
                  </div>
                </div>
                <Photo info={fotos.suportes} dir={FOTOS} />
                <Callout tone="tip" title="Guiar de um lado, apoiar do outro">
                  {mesa.ideia}
                </Callout>
                <div>
                  <H4>A ponte</H4>
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
                <Callout tone="tip" title="O motor escala a correia">
                  {correias.omegaIdeia}
                </Callout>
                <div>
                  <H4>Eixo X, em ômega</H4>
                  <div className="mt-5">
                    <Steps items={correias.x} />
                  </div>
                </div>
                <Photo info={fotos.omega} dir={FOTOS} />
                <div>
                  <H4>Eixo Y, em laço</H4>
                  <div className="mt-5">
                    <Steps items={correias.y} />
                  </div>
                </div>
                <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-start">
                  <div>
                    <H4>Presilhas da correia do Y</H4>
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
                <Callout tone="tip" title="A caneta cai por gravidade (com ajuda da mola)">
                  {carro.gravidade}
                </Callout>
                <Callout tone="warn" title="Por que o rasgo aberto da v3">
                  {carro.rasgo}
                </Callout>
                <Figures items={carro.figuras} />
              </Chapter>

              {/* 07 · fins de curso e eletrônica */}
              <Chapter {...c[6]}>
                <div>
                  <H4>Fins de curso</H4>
                  <div className="mt-4">
                    <Bullets items={fins.chaves} />
                  </div>
                </div>
                <div>
                  <H4>Eletrônica na mesa</H4>
                  <div className="mt-5">
                    <Steps items={fins.eletronica} />
                  </div>
                </div>
                <PhotoRow>
                  <Photo info={fotos.fimDeCurso} dir={FOTOS} />
                  <Photo info={fotos.eletronicaMesa} dir={FOTOS} />
                </PhotoRow>
                <Callout tone="warn" title="Confira a altura antes de parafusar">
                  {fins.altura}
                </Callout>
              </Chapter>

              {/* 08 · ligações */}
              <Chapter {...c[7]} eager>
                <P>{ligacoes.resumo}</P>
                {/* no desktop o desenho sai da coluna do texto e usa a largura toda (210 px do índice + 56 de vão) */}
                <CncFiacao wideRef={wide} wideClassName="lg:-ml-[266px]" />
                <Callout tone="warn" title="Por que o servo tem fonte própria">
                  {ligacoes.servo}
                </Callout>
                <div className="space-y-3">
                  <H4>Tabela de pinos</H4>
                  <Table head={["Ligação", "No shield", "Pino do Arduino", "Observação"]} rows={ligacoes.pinos} />
                </div>
                <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-center">
                  <P>Para ajustar a corrente: fonte ligada, motores parados, ponta do multímetro no trimpot do driver. Gire devagar até ler ≈ 0,60 V.</P>
                  <Photo info={fotos.vref} dir={FOTOS} />
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card>
                    <H4>Antes de energizar</H4>
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
                    <H4>Ordem segura</H4>
                    <div className="flex gap-3 rounded-md border border-primary/25 bg-primary/[0.05] p-3 text-[14px] leading-relaxed">
                      <Power className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <p className="text-muted-foreground">
                        <b className="font-semibold text-foreground">Ligar: </b>
                        {fmt(ligacoes.ligar)}
                      </p>
                    </div>
                    <div className="flex gap-3 rounded-md border border-gold/40 bg-gold/[0.07] p-3 text-[14px] leading-relaxed">
                      <PowerOff className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                      <p className="text-muted-foreground">
                        <b className="font-semibold text-foreground">Desligar: </b>
                        {fmt(ligacoes.desligar)}
                      </p>
                    </div>
                  </Card>
                  <Card>
                    <H4>Testes rápidos</H4>
                    <div className="mt-4">
                      <Bullets items={ligacoes.testes} icon={ShieldCheck} />
                    </div>
                  </Card>
                </div>
              </Chapter>

              {/* 09 · firmware */}
              <Chapter {...c[8]}>
                <div>
                  <H4>Gravar no Arduino</H4>
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
                  <H4>Configurar</H4>
                  <P>
                    Envie os comandos do `configuracao_grbl.txt` pelo console do LaserGRBL (ou pelo Monitor Serial, 115200). Tudo fica gravado na EEPROM do Arduino. Os que mais importam:
                  </P>
                  <Table head={["Parâmetro", "Valor", "Por quê"]} rows={firmware.params} />
                </div>
                <Files items={firmware.arquivos} />
              </Chapter>

              {/* 10 · calibração */}
              <Chapter {...c[9]}>
                <div>
                  <H4>Sentido dos eixos</H4>
                  <div className="mt-5">
                    <Steps items={calibracao.sentido} />
                  </div>
                  <P className="mt-4 text-[13.5px]">{calibracao.sentidoNota}</P>
                </div>
                <div>
                  <H4>Escala</H4>
                  <div className="mt-5">
                    <Steps items={calibracao.escala} />
                  </div>
                </div>
                <Callout tone="warn" title="Cuidado com medição curta">
                  {calibracao.escalaAviso}
                </Callout>
                <Photo info={fotos.escala} dir={FOTOS} />
                <div>
                  <H4>Homing e origem</H4>
                  <div className="mt-5">
                    <Steps items={calibracao.homing} />
                  </div>
                </div>
                <Code label="configurar_origem.gcode · rode uma vez">{calibracao.origem}</Code>
                <P>{calibracao.origemNota}</P>
                <Callout tone="tip" title="Como a máquina “sabe” o tamanho">
                  {calibracao.escuro}
                </Callout>
                <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-start">
                  <div>
                    <H4>Um gabarito na mesa</H4>
                    <P className="mt-3">{calibracao.gabarito}</P>
                  </div>
                  <Photo info={fotos.gabarito} dir={FOTOS} />
                </div>
                <div className="space-y-4">
                  <H4>Caneta</H4>
                  <Table head={["Estado", "Comando", "O que acontece"]} rows={calibracao.caneta} />
                  <Bullets items={calibracao.canetaNotas} />
                </div>
                <div>
                  <H4>Os quatro G-codes de teste</H4>
                  <ol className="mt-4 grid gap-4 md:grid-cols-2">
                    {calibracao.testes.map((t, i) => (
                      <li key={t.file} className="flex flex-col rounded-lg border border-border bg-background p-5">
                        <span className="font-mono text-[12px] text-gold">teste {i + 1}</span>
                        <p className="mt-2 text-[14.5px] leading-relaxed text-foreground">{t.what}</p>
                        <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">Deu certo se </span>
                          {t.ok}
                        </p>
                        <div className="mt-auto pt-4">
                          <FileLink file={{ href: `/projetos/cnc/arquivos/gcode/testes/${t.file}` }} className="min-h-[36px] max-w-full px-2.5 py-1.5 text-[12px]">
                            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="min-w-0 break-all font-mono">{t.file}</span>
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
                    <H4>Dicas do LaserGRBL</H4>
                    <div className="mt-4">
                      <Bullets items={rotina.dicas} />
                    </div>
                  </div>
                  <Code label="comandos do dia a dia · console">{rotina.comandos}</Code>
                </div>
              </Chapter>

              {/* 12 · traço */}
              <Chapter {...c[11]}>
                <div>
                  <H4>Micropasso faz toda a diferença</H4>
                  <P className="mt-3">{traco.micropasso}</P>
                </div>
                <Figures items={traco.figuras} />
                <div className="space-y-3">
                  <H4>Testes em 1/16, na cartolina</H4>
                  <Table head={["Teste", "Resultado (medido)"]} rows={traco.testes} />
                </div>
                <Photo info={fotos.cartolina} dir={FOTOS} />
                <P>{traco.conclusao}</P>
                <Callout tone="tip" title="Velocidade de trabalho">
                  {traco.decisao}
                </Callout>
              </Chapter>

              {/* 13 · G-code */}
              <Chapter {...c[12]}>
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="A cadeia, do desenho à máquina">
                  {gcode.cadeia.map((s, i) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground">{s}</span>
                      {i < gcode.cadeia.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
                    </li>
                  ))}
                </ol>
                <div className="space-y-4">
                  <H4>SVG pronto → G-code</H4>
                  <P>{gcode.svg}</P>
                  <Code label="terminal">{gcode.svgCmd}</Code>
                  <Files items={gcode.software} />
                </div>
                <div className="space-y-4">
                  <H4>Imagem → SVG: o ponto mais importante</H4>
                  <P>{gcode.centerline}</P>
                  <Steps items={gcode.passos} />
                  <P className="text-[14px]">{gcode.fotosDica}</P>
                </div>
                <Card className="space-y-5">
                  <div>
                    <p className="font-mono text-[12px] text-gold">exemplo real</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">O pôster do F-16, da imagem ao G-code</p>
                  </div>
                  <Figure
                    src={`${IMG}/f16-simulacao.webp`}
                    alt="Simulação do G-code do pôster do F-16 na orientação da máquina: o pôster deitado, com o título na vertical à esquerda e o (0,0) marcado no canto de baixo à esquerda."
                    title="F-16 · simulação do G-code"
                    caption="O G-code simulado na orientação da máquina, com o (0,0) no canto: o pôster vai deitado para caber nos 810 × 390."
                    ratio="1600 / 1027"
                  />
                  <Figures items={gcode.f16} />
                  <Code label="vpype · depois dos scripts">{gcode.vpype}</Code>
                  <Files items={gcode.f16Scripts} />
                </Card>
                <div className="space-y-3">
                  <H4>Ou direto no LaserGRBL</H4>
                  <Table head={["Campo", "Valor"]} rows={gcode.laserGrbl} />
                  <Callout tone="warn" title="Sem pausa para o servo">
                    {gcode.laserGrblAviso}
                  </Callout>
                </div>
                <P className="text-[14px]">{gcode.simulador}</P>
              </Chapter>

              {/* 14 · problemas */}
              <Chapter {...c[13]}>
                <P>Tudo o que deu errado na minha, com a causa e o que resolveu.</P>
                <Table head={["Sintoma", "Causa provável", "Solução"]} rows={guia.problemas} />
              </Chapter>
            </div>
          </div>
        </div>
      </section>

      {/* Lições */}
      <section className="border-b border-border bg-background">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">Lições</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">O que deu errado antes</h2>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
            Antes desta versão, a máquina passou por várias tentativas que não funcionaram. São elas que explicam boa parte das decisões do guia.
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
          <p className="eyebrow">No papel</p>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 className="font-display text-display-lg font-medium">O que ela já desenhou</h2>
            <p className="max-w-[52ch] leading-relaxed text-muted-foreground">Cada desenho com o G-code que o gerou, para você rodar na sua.</p>
          </div>
          <Photo info={fotos.emAcao} dir={FOTOS} className="mt-10" />
          {/* o pôster (em pé) ocupa duas linhas; os outros fecham a grade ao lado dele */}
          <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr]">
            {resultados.map((r) => (
              <ResultCard key={r.id} r={r} />
            ))}
            <Photo info={fotos.f16Detalhe} dir={FOTOS} />
          </div>
        </div>
      </section>
    </>
  );
}
