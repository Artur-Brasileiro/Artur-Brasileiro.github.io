import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { getLenis } from "@/components/motion/SmoothScroll";
import SiteFooter from "@/components/SiteFooter";
import CncSimulator from "@/components/cnc/CncSimulator";
import { preloadCnc } from "@/components/cnc/preload";
import { cnc } from "@/data/projects";
import { cn } from "@/lib/utils";

// o 3D começa a baixar junto com a página, não depois do primeiro render
preloadCnc();

const PIPELINE = [
  {
    n: "01",
    title: "Fonte de traço único",
    text: "Cada letra é uma linha só, como alguém escrevendo à caneta. Uma fonte comum só daria o contorno, e a máquina desenharia letras vazadas.",
  },
  {
    n: "02",
    title: "Encaixe no papel",
    text: "O texto é quebrado em até quatro linhas, na combinação que deixa a letra maior, e centralizado na área de 818 × 402 mm.",
  },
  {
    n: "03",
    title: "G-code",
    text: "Cada traço vira um G0 até o começo, M3 para baixar a caneta, uma sequência de G1 e M5 para subir. O arquivo pode ser baixado.",
  },
  {
    n: "04",
    title: "A máquina executa",
    text: "A simulação roda o programa com as velocidades da máquina: 250 mm/s no ar e 100 mm/s com a caneta no papel.",
  },
];

function Specs({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-6", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Especificações</h2>
      <dl className="mt-5 divide-y divide-border">
        {cnc.specs.map((spec) => (
          <div key={spec.label} className="flex items-baseline justify-between gap-6 py-3 first:pt-0 last:pb-0">
            <dt className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">{spec.label}</dt>
            <dd className="text-right text-sm font-medium text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const CncPage = () => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Cabeçalho */}
      <div className="border-b border-border bg-surface">
        <div className="rail py-10 md:py-16">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-primary">
              Início
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <Link to="/hardware" className="text-muted-foreground transition-colors hover:text-primary">
              Hardware
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <span className="font-medium text-foreground">{cnc.title}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">{cnc.category}</span>
                <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {cnc.status}
                </span>
                <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">{cnc.statusNote}</span>
              </div>

              <h1 className="font-display mt-5 text-display-xl font-medium">{cnc.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{cnc.summary}</p>

              <a
                href="#simulador"
                onClick={(e) => {
                  const el = document.getElementById("simulador");
                  const lenis = getLenis();
                  if (!el || !lenis) return; // sem Lenis, a âncora nativa resolve
                  e.preventDefault();
                  lenis.scrollTo(el, { offset: -56 });
                }}
                className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 font-mono text-[13px] font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
              >
                Ver a máquina desenhar ↓
              </a>
            </div>

            {/* no celular a ficha vai para depois do simulador: quem abre a página quer ver a máquina primeiro */}
            <Specs className="hidden lg:block" />
          </div>
        </div>
      </div>

      {/* Simulador */}
      <section id="simulador" className="scroll-mt-16 border-b border-border bg-background">
        <div className="rail py-12 md:py-16">
          <p className="eyebrow">Simulação</p>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 className="font-display text-display-lg font-medium">A máquina, desenhando</h2>
            <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
              Este é o modelo de verdade, peça por peça. Ela desenha sozinha; na aba <b className="font-medium text-foreground">Escrever</b>, digite uma frase e ela escreve no papel.
            </p>
          </div>
          {/* no celular o simulador vai de borda a borda: cada pixel de largura é modelo */}
          <div className="-mx-6 mt-8 sm:mx-0">
            <CncSimulator />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface lg:hidden">
        <div className="rail py-12">
          <Specs />
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-b border-border bg-surface">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">Mecânica</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">Como ela se move</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {cnc.mechanics.map((m, i) => (
              <Reveal key={m.ref} delay={0.06 * i}>
                <article className="h-full rounded-lg border border-border bg-background p-6">
                  <span className="font-mono text-[12px] text-gold">eixo {m.ref}</span>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{m.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Do texto ao papel */}
      <section className="bg-background">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">Escrita</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">Do texto ao papel</h2>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
            O que você digita no simulador passa pelo mesmo caminho que um desenho passaria na máquina real.
          </p>
          <ol className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((s) => (
              <li key={s.n} className="border-t border-foreground pt-4">
                <span className="font-mono text-[12px] text-gold">{s.n}</span>
                <h3 className="mt-2 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 border-t border-border pt-8">
            <Link
              to="/"
              state={{ targetId: "projetos" }}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para projetos
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default CncPage;
