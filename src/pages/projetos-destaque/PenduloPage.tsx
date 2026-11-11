import { lazy, Suspense, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { getLenis } from "@/components/motion/SmoothScroll";
import SiteFooter from "@/components/SiteFooter";
import PenduloSimulator from "@/components/pendulo/PenduloSimulator";
import { preloadPendulo } from "@/components/pendulo/preload";
import { pendulo } from "@/data/pendulo";
import { cn } from "@/lib/utils";

// o 3D começa a baixar junto com a página, não depois do primeiro render
preloadPendulo();

/*
 * O guia de construção é a maior parte da página (~3 mil elementos, dez telas
 * abaixo). Montado junto, ele segurava a primeira pintura: no celular o topo
 * só aparecia depois de ~5 s. Num pedaço separado, o topo e o simulador saem
 * primeiro e o guia chega logo depois, bem antes de alguém rolar até ele. O
 * download começa já, em paralelo com o resto.
 */
const loadGuide = () => import("@/components/pendulo/BuildGuide");
const BuildGuide = lazy(loadGuide);
void loadGuide();

/**
 * Rola até uma seção pelo Lenis; sem ele, a âncora nativa resolve. O Lenis já
 * desconta o scroll-padding-top do html e o scroll-margin-top da seção.
 */
function jump(e: React.MouseEvent, id: string) {
  const el = document.getElementById(id);
  const lenis = getLenis();
  if (!el || !lenis) return;
  e.preventDefault();
  lenis.scrollTo(el);
}

function Specs({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-6", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Especificações</h2>
      <dl className="mt-5 divide-y divide-border">
        {pendulo.specs.map((spec) => (
          <div key={spec.label} className="flex items-baseline justify-between gap-6 py-3 first:pt-0 last:pb-0">
            <dt className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">{spec.label}</dt>
            <dd className="text-right text-sm font-medium text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const PenduloPage = () => {
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
            <span className="font-medium text-foreground">{pendulo.title}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">{pendulo.category}</span>
                <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {pendulo.status}
                </span>
                <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">{pendulo.statusNote}</span>
              </div>

              <h1 className="font-display mt-5 text-display-xl font-medium">{pendulo.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{pendulo.summary}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#simulador"
                  onClick={(e) => jump(e, "simulador")}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 font-mono text-[13px] font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
                >
                  Ver o pêndulo subir ↓
                </a>
                <a
                  href="#monte-o-seu"
                  onClick={(e) => jump(e, "monte-o-seu")}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-background px-5 font-mono text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  Monte o seu ↓
                </a>
              </div>
            </div>

            {/* no celular a ficha vai para depois do simulador */}
            <Specs className="hidden lg:block" />
          </div>
        </div>
      </div>

      {/* Simulador */}
      <section id="simulador" className="scroll-mt-16 border-b border-border bg-background">
        <div className="rail py-12 md:py-16">
          <p className="eyebrow">Simulação</p>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 className="font-display text-display-lg font-medium">Ele sobe sozinho</h2>
            <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
              O modelo do CAD, peça por peça, com a física da haste e o controle do Arduino rodando a 200 Hz. Pegue a haste com o mouse e empurre, ou{" "}
              <b className="font-medium text-foreground">desligue o controle</b> para ver o que ele está segurando.
            </p>
          </div>
          {/* no celular o simulador vai de borda a borda */}
          <div className="-mx-6 mt-8 sm:mx-0">
            <PenduloSimulator />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface lg:hidden">
        <div className="rail py-12">
          <Specs />
        </div>
      </section>

      {/* Como ele pensa */}
      <section className="border-b border-border bg-surface">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">Controle</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">Como ele pensa</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {pendulo.modes.map((m, i) => (
              <Reveal key={m.ref} delay={0.06 * i}>
                <article className="h-full rounded-lg border border-border bg-background p-6">
                  <span className="font-mono text-[12px] text-gold">{m.ref}</span>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{m.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 md:grid-cols-4">
            {pendulo.numbers.map((n) => (
              <div key={n.label}>
                <dt className="sr-only">{n.label}</dt>
                <dd className="font-display text-3xl font-medium tabular-nums text-foreground">{n.value}</dd>
                <p className="mt-1 text-[14px] leading-snug text-muted-foreground">{n.label}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Do CAD ao trilho */}
      <section className="bg-background">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">Projeto</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">Do CAD ao trilho</h2>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">Cada número da simulação veio do aparelho: medido com paquímetro, com cronômetro ou no próprio encoder.</p>
          <ol className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
            {pendulo.pipeline.map((s) => (
              <li key={s.n} className="border-t border-foreground pt-4">
                <span className="font-mono text-[12px] text-gold">{s.n}</span>
                <h3 className="mt-2 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* enquanto o guia não chega, a seção vazia guarda o lugar (e a âncora "Monte o seu") */}
      <Suspense fallback={<section id="monte-o-seu" className="min-h-[100svh] border-b border-border bg-surface" aria-busy="true" />}>
        <BuildGuide />
      </Suspense>

      <div className="bg-background">
        <div className="rail py-8">
          <Link to="/" state={{ targetId: "projetos" }} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Voltar para projetos
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default PenduloPage;
