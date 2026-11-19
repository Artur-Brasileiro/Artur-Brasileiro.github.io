import { lazy, useLayoutEffect } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { getLenis } from "@/components/motion/SmoothScroll";
import SiteFooter from "@/components/SiteFooter";
import DeferredGuide from "@/components/guide/Deferred";
import { scrollToEl, whenGuideHas } from "@/components/guide/nav";
import CncSimulator from "@/components/cnc/CncSimulator";
import { preloadCnc } from "@/components/cnc/preload";
import { cnc as cncData } from "@/data/cnc";
import { Link, useLocalized, useT } from "@/i18n/react";
import { cn } from "@/lib/utils";

// o 3D começa a baixar junto com a página, não depois do primeiro render
preloadCnc();

/*
 * O guia de construção é a maior parte da página (catorze capítulos, o esquema
 * de ligações e os resultados). Num pedaço separado, o topo e o simulador saem
 * primeiro e o guia chega logo depois, bem antes de alguém rolar até ele. O
 * download começa já, em paralelo com o resto.
 */
const loadGuide = () => import("@/components/cnc/CncGuide");
const CncGuide = lazy(loadGuide);
void loadGuide();

/**
 * Rola até uma seção pelo Lenis; sem ele, a âncora nativa resolve. O Lenis já
 * desconta o scroll-padding-top do html e o scroll-margin-top da seção.
 */
function jump(e: React.MouseEvent, id: string) {
  const el = document.getElementById(id);
  if (el) {
    if (!getLenis()) return;
    e.preventDefault();
    scrollToEl(el);
    return;
  }
  // o alvo mora dentro do guia, que ainda não foi montado: pede o guia e rola quando ele chegar
  e.preventDefault();
  void whenGuideHas(id).then((t) => t && scrollToEl(t));
}

function Specs({ className }: { className?: string }) {
  const cnc = useLocalized(cncData);
  const t = useT();
  return (
    <div className={cn("rounded-lg border border-border bg-background p-6", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t("Especificações", "Specifications")}</h2>
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
  const cnc = useLocalized(cncData);
  const t = useT();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Cabeçalho */}
      <div className="border-b border-border bg-surface">
        <div className="rail py-10 md:py-16">
          <nav aria-label={t("Trilha de navegação", "Breadcrumb")} className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-primary">
              {t("Início", "Home")}
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

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#simulador"
                  onClick={(e) => jump(e, "simulador")}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 font-mono text-[13px] font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
                >
                  {t("Ver a máquina desenhar ↓", "Watch the machine draw ↓")}
                </a>
                <a
                  href="#monte-a-sua"
                  onClick={(e) => jump(e, "monte-a-sua")}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-background px-5 font-mono text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {t("Monte a sua ↓", "Build your own ↓")}
                </a>
                <a
                  href="#resultados"
                  onClick={(e) => jump(e, "resultados")}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-background px-5 font-mono text-[13px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {t("Desenhos ↓", "Drawings ↓")}
                </a>
              </div>
            </div>

            {/* no celular a ficha vai para depois do simulador: quem abre a página quer ver a máquina primeiro */}
            <Specs className="hidden lg:block" />
          </div>
        </div>
      </div>

      {/* Simulador */}
      <section id="simulador" className="scroll-mt-16 border-b border-border bg-background">
        <div className="rail py-12 md:py-16">
          <p className="eyebrow">{t("Simulação", "Simulation")}</p>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 className="font-display text-display-lg font-medium">{t("A máquina, desenhando", "The machine, drawing")}</h2>
            <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
              {t("Este é o modelo de verdade, peça por peça. Ela desenha sozinha; na aba ", "This is the real model, part by part. It draws on its own; in the ")}
              <b className="font-medium text-foreground">{t("Escrever", "Write")}</b>
              {t(", digite uma frase e ela escreve no papel.", " tab, type a phrase and it writes it on the paper.")}
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
          <p className="eyebrow">{t("Mecânica", "Mechanics")}</p>
          <h2 className="font-display mt-5 text-display-lg font-medium">{t("Como ela se move", "How it moves")}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {cnc.mechanics.map((m, i) => (
              <Reveal key={m.ref} delay={0.06 * i}>
                <article className="h-full rounded-lg border border-border bg-background p-6">
                  <span className="font-mono text-[12px] text-gold">{t(`eixo ${m.ref}`, `${m.ref} axis`)}</span>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{m.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 md:grid-cols-4">
            {cnc.numbers.map((n) => (
              <div key={n.label}>
                <dt className="sr-only">{n.label}</dt>
                <dd className="font-display text-3xl font-medium tabular-nums text-foreground">{n.value}</dd>
                <p className="mt-1 text-[14px] leading-snug text-muted-foreground">{n.label}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Diário de bordo */}
      <section className="border-b border-border bg-background">
        <div className="rail py-16 md:py-20">
          <p className="eyebrow">{t("Diário de bordo", "Build log")}</p>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 className="font-display text-display-lg font-medium">{t("Do primeiro traço ao pôster", "From the first line to the poster")}</h2>
            <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
              {t(
                "Uma semana de novembro de 2026: dos motores trocados de lugar ao pôster de 600 × 385 mm.",
                "One week in November 2026: from swapped motors to a 600 × 385 mm poster.",
              )}
            </p>
          </div>
          <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-7">
            {cnc.marcos.map((m, i) => (
              <li key={m.data} className="relative border-t border-foreground pt-4">
                <span className={cn("absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full border-2 border-foreground", i === cnc.marcos.length - 1 ? "bg-primary" : "bg-background")} aria-hidden />
                <span className="font-mono text-[12px] text-gold">{m.data}</span>
                <p className="mt-2 text-[14.5px] leading-snug text-foreground">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* o guia só é montado perto da hora de ser lido; até lá o lugar dele guarda a âncora */}
      <DeferredGuide id="monte-a-sua">
        <CncGuide />
      </DeferredGuide>

      <div className="bg-background">
        <div className="rail py-8">
          <Link to="/" state={{ targetId: "projetos" }} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            {t("Voltar para projetos", "Back to projects")}
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default CncPage;
