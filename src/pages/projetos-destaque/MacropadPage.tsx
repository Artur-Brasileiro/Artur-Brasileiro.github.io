import { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Github,
  Maximize2,
  Rotate3d,
} from "lucide-react";
import ModelViewer from "@/components/ModelViewer";
import ZoomableImage from "@/components/ZoomableImage";
import { useLenisLock } from "@/components/motion/useLenisLock";
import { Reveal } from "@/components/motion/Reveal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SiteFooter from "@/components/SiteFooter";
import { macropad, type TimelineItem, type TimelineStatus } from "@/data/projects";
import { cn } from "@/lib/utils";

const statusLabel: Record<TimelineStatus, string> = {
  completed: "Concluído",
  current: "Em progresso",
  planned: "Planejado",
};

/**
 * Um único par semântico: azul marca o que já existe ou está em curso, slate
 * marca o que ainda não começou. Três cores diferentes viram decoração.
 */
const markerClass: Record<TimelineStatus, string> = {
  completed: "border-primary bg-primary text-primary-foreground",
  current: "border-primary bg-background text-primary",
  planned: "border-border bg-surface text-muted-foreground",
};

const badgeClass: Record<TimelineStatus, string> = {
  completed: "border-primary/20 bg-primary/10 text-primary",
  current: "border-primary/20 bg-primary/10 text-primary",
  planned: "border-border bg-surface text-muted-foreground",
};

/** O que está aberto no lightbox: fotos de uma fase (navegáveis entre si) ou um modelo 3D. */
type Maximized = { type: "image"; urls: string[]; index: number } | { type: "model"; url: string };

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const MacropadPage = () => {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [maximizedMedia, setMaximizedMedia] = useState<Maximized | null>(null);

  // Pausa o smooth-scroll enquanto o lightbox está aberto (senão a roda do mouse
  // rola a página atrás; com isso, o wheel também passa a dar zoom no modelo 3D).
  useLenisLock(!!maximizedMedia);

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Cabeçalho */}
      <div className="border-b border-border bg-surface">
        <div className="rail py-12 md:py-16">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-primary">
              Início
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <Link
              to="/hardware"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Hardware
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <span className="font-medium text-foreground">{macropad.title}</span>
          </nav>

          {/* Resumo à esquerda, ficha de especificações à direita: sem a coluna
              da direita, metade da largura ficava vazia. */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {macropad.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Check className="h-3 w-3" aria-hidden />
                  {macropad.status}
                </span>
                {/* concluído não quer dizer parado: o software segue recebendo
                    melhorias, e o ponto pulsando diz isso sem precisar de texto longo */}
                <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {macropad.statusNote}
                </span>
              </div>

              <h1 className="font-display mt-5 text-display-xl font-medium">{macropad.title}</h1>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                {macropad.summary}
              </p>

              <a
                href={macropad.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-11 items-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground shadow-soft-sm transition-colors hover:text-primary"
              >
                <Github className="h-4 w-4" />
                Acompanhar no GitHub
              </a>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Especificações
              </h2>
              <dl className="mt-5 divide-y divide-border">
                {macropad.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-6 py-3 first:pt-0 last:pb-0"
                  >
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      {spec.label}
                    </dt>
                    <dd className="text-right text-sm font-medium text-foreground">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* A ideia — título fixo à esquerda, texto à direita. */}
      <div className="border-b border-border bg-background">
        <div className="rail grid gap-10 py-16 md:py-20 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="eyebrow">Contexto</p>
            <h2 className="font-display mt-5 text-display-lg font-medium lg:sticky lg:top-24">
              A ideia do projeto
            </h2>
          </div>

          <div className="space-y-5">
            {macropad.rationale.map((paragraph, i) => (
              <p key={i} className="text-lg leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="rail py-16 md:py-20">
        <p className="eyebrow">Execução</p>
        <h2 className="font-display mt-5 text-display-lg font-medium">Roadmap do projeto</h2>

        <ol className="mt-12">
          {macropad.timeline.map((item, index) => {
            const isLast = index === macropad.timeline.length - 1;
            const hasMedia = Boolean(item.image || item.images || item.modelUrl || item.repository);

            return (
              <li key={item.date} className="flex gap-5 md:gap-8">
                {/* Trilho e marcador */}
                <div className="flex w-9 shrink-0 flex-col items-center" aria-hidden>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2",
                      markerClass[item.status],
                    )}
                  >
                    {item.status === "completed" && <Check className="h-4 w-4" />}
                    {/* Em progresso: ponto sólido, não um check — o check afirma
                        conclusão e contradiz o rótulo da fase. */}
                    {item.status === "current" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                    {item.status === "planned" && <CircleDashed className="h-4 w-4" />}
                  </span>
                  {!isLast && <span className="w-px flex-1 bg-border" />}
                </div>

                {/* Conteúdo */}
                <div className={cn("min-w-0 flex-1", isLast ? "pb-0" : "pb-14")}>
                  <Reveal>
                    {/* Com mídia, texto e imagem dividem a linha; sem mídia, o
                        texto ocupa a largura toda em vez de deixar um vazio. */}
                    <div
                      className={cn(
                        "grid gap-8",
                        hasMedia && "lg:grid-cols-2 lg:items-start lg:gap-12",
                      )}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="tabular font-mono text-sm font-medium text-foreground">
                            {item.date}
                          </span>
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-xs font-medium",
                              badgeClass[item.status],
                            )}
                          >
                            {statusLabel[item.status]}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-3 leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>

                        {item.modelUrl && (
                          <p className="mt-4 flex items-start gap-2 text-sm font-medium text-primary">
                            <Rotate3d className="mt-0.5 h-4 w-4 shrink-0" />
                            {item.modelHint ?? "Expanda para girar o modelo em 3D."}
                          </p>
                        )}
                      </div>

                    {item.repository && <RepositoryCard repo={item.repository} />}

                    {hasMedia && !item.repository && (
                      <div
                        className={cn(
                          "grid gap-4",
                          item.images ? "grid-cols-2" : "grid-cols-1",
                        )}
                      >
                        {item.images
                          ? item.images.map((img, i, all) => (
                              <MediaFrame
                                key={img}
                                ratio="aspect-[3/4]"
                                onExpand={() => setMaximizedMedia({ type: "image", urls: all, index: i })}
                              >
                                <img
                                  src={asset(img)}
                                  alt={item.title}
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              </MediaFrame>
                            ))
                          : (
                              <MediaFrame
                                ratio="aspect-video"
                                onExpand={() =>
                                  setMaximizedMedia(
                                    item.modelUrl
                                      ? { type: "model", url: item.modelUrl }
                                      : { type: "image", urls: [item.image as string], index: 0 },
                                  )
                                }
                              >
                                {/* A miniatura não habilita zoom para não travar a rolagem. */}
                                {item.modelUrl ? (
                                  <ModelViewer url={item.modelUrl} enableZoom={false} />
                                ) : (
                                  <img
                                    src={asset(item.image as string)}
                                    alt={item.title}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </MediaFrame>
                            )}
                      </div>
                    )}
                    </div>
                  </Reveal>
                </div>
              </li>
            );
          })}
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

      <Dialog
        open={!!maximizedMedia}
        onOpenChange={(open) => !open && setMaximizedMedia(null)}
      >
        {/* flex em coluna, não o grid padrão do DialogContent: no grid a foto
            com h-full não tinha altura de referência, saía com o dobro da
            altura do diálogo e aparecia cortada, como um zoom travado */}
        <DialogContent className="flex h-[90svh] w-[95vw] max-w-6xl flex-col gap-0 overflow-hidden border-border bg-background p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Mídia expandida</DialogTitle>
            <DialogDescription>Visualização em tela cheia da etapa do projeto.</DialogDescription>
          </DialogHeader>

          {maximizedMedia?.type === "image" && (
            <PhotoViewer
              media={maximizedMedia}
              onIndex={(index) => setMaximizedMedia({ ...maximizedMedia, index })}
            />
          )}

          {maximizedMedia?.type === "model" && (
            <div className="relative min-h-0 flex-1 bg-surface">
              <ModelViewer url={maximizedMedia.url} enableZoom />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

/** Fotos de uma fase no lightbox: zoom e arrasto na foto, setas para passar entre elas. */
const PhotoViewer = ({
  media,
  onIndex,
}: {
  media: Extract<Maximized, { type: "image" }>;
  onIndex: (index: number) => void;
}) => {
  const { urls, index } = media;
  const many = urls.length > 1;

  // setas do teclado passam as fotos; Esc já fecha pelo próprio diálogo
  useEffect(() => {
    if (!many) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % urls.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + urls.length) % urls.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [many, index, urls.length, onIndex]);

  const go = (step: number) => onIndex((index + step + urls.length) % urls.length);
  const nav =
    "absolute top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-soft-sm backdrop-blur-sm transition-colors hover:text-primary";

  return (
    <div className="relative min-h-0 flex-1 bg-surface">
      <ZoomableImage src={asset(urls[index])} alt={`Foto ${index + 1} de ${urls.length}`} />
      {many && (
        <>
          <button type="button" className={cn(nav, "left-3")} onClick={() => go(-1)} aria-label="Foto anterior">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" className={cn(nav, "right-3")} onClick={() => go(1)} aria-label="Próxima foto">
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="tabular absolute left-3 top-3 rounded-md border border-border bg-background/90 px-2 py-1 font-mono text-xs text-muted-foreground">
            {index + 1}/{urls.length}
          </span>
        </>
      )}
    </div>
  );
};

/** Cartão do repositório da fase: onde o código está sendo escrito, em aberto. */
const RepositoryCard = ({ repo }: { repo: NonNullable<TimelineItem["repository"]> }) => (
  <a
    href={repo.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group/repo block rounded-lg border border-border bg-background p-6 shadow-soft-sm transition-colors hover:border-primary/40"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
          <Github className="h-5 w-5 text-foreground" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Repositório no GitHub</p>
          <p className="truncate font-mono text-sm font-medium text-foreground group-hover/repo:text-primary">
            {repo.name}
          </p>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover/repo:text-primary" aria-hidden />
    </div>
    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{repo.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {repo.stack.map((t) => (
        <span key={t} className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-foreground">
          {t}
        </span>
      ))}
    </div>
  </a>
);

/** Moldura de mídia com botão de expandir — mesma linguagem em foto e modelo 3D. */
const MediaFrame = ({
  ratio,
  onExpand,
  children,
}: {
  ratio: string;
  onExpand: () => void;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "group/media relative overflow-hidden rounded-lg border border-border bg-surface shadow-soft-sm",
      ratio,
    )}
  >
    {children}
    <button
      type="button"
      onClick={onExpand}
      aria-label="Expandir mídia"
      className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/90 text-foreground opacity-0 shadow-soft-sm backdrop-blur-sm transition-opacity hover:bg-background focus-visible:opacity-100 group-hover/media:opacity-100"
    >
      <Maximize2 className="h-4 w-4" />
    </button>
  </div>
);

export default MacropadPage;
