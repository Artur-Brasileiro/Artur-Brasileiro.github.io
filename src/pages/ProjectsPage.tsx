import { useLayoutEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Github,
  PlayCircle,
} from "lucide-react";
import { useParams } from "react-router-dom";
import DemoVideoDialog, { type DemoVideo } from "@/components/DemoVideoDialog";
import SiteFooter from "@/components/SiteFooter";
import { Reveal } from "@/components/motion/Reveal";
import { projectData as projectDataRaw, projectCategories as projectCategoriesRaw } from "@/data/projects";
import { Link, useLocalized, useT } from "@/i18n/react";

const ProjectsPage = () => {
  const t = useT();
  const projectData = useLocalized(projectDataRaw);
  const projectCategories = useLocalized(projectCategoriesRaw);
  const { category } = useParams<{ category: string }>();
  const categoryData =
    category && category in projectData
      ? projectData[category as keyof typeof projectData]
      : undefined;

  // o modal de vídeo trava o Lenis por conta própria.
  // Guarda o id do projeto, não o texto: o vídeo aberto acompanha a troca de idioma.
  const [videoId, setVideoId] = useState<number | null>(null);
  const videoProject = projectData.hardware.projects.find((p) => p.id === videoId && p.youtubeId);
  const video: DemoVideo | null = videoProject
    ? {
        title: videoProject.name,
        youtubeId: videoProject.youtubeId!,
        summary: videoProject.longDescription ?? videoProject.description,
        github: videoProject.technicalLink,
      }
    : null;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  const handleOpenVideo = (project: { id: number; youtubeId?: string }) => {
    if (!project.youtubeId) return;
    setVideoId(project.id);
  };

  if (!categoryData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-14">
        <div className="max-w-md text-center">
          <p className="eyebrow">{t("Erro 404", "Error 404")}</p>
          <h1 className="font-display mt-4 text-display-lg font-medium">
            {t("Categoria não encontrada", "Category not found")}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {t("A categoria de projetos solicitada não existe.", "The requested project category doesn't exist.")}
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
          >
            {t("Voltar para a página inicial", "Back to the home page")}
          </Link>
        </div>
      </div>
    );
  }

  const Icon = categoryData.icon;
  const isHardware = categoryData.slug === "hardware";
  const otherCategory = projectCategories.find((c) => c.to !== `/${categoryData.slug}`)!;

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Cabeçalho da página */}
      <div className="border-b border-border bg-surface">
        <div className="rail py-12 md:py-16">
          <nav aria-label={t("Trilha de navegação", "Breadcrumb")} className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-primary">
              {t("Início", "Home")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <Link
              to="/"
              state={{ targetId: "projetos" }}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              {t("Projetos", "Projects")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <span className="font-medium text-foreground">
              {isHardware ? "Hardware" : t("Programação", "Software")}
            </span>
          </nav>

          <div className="mt-8 flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-display-lg font-medium">{categoryData.title}</h1>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {categoryData.lead}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rail py-16 md:py-20">
        <Link
          to="/"
          state={{ targetId: "projetos" }}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("Voltar para projetos", "Back to projects")}
        </Link>

        {isHardware ? (
          /* ================= HARDWARE ================= */
          <div className="mt-10 space-y-6">
            {projectData.hardware.projects.map((project, index) => (
              <Reveal key={project.id} delay={0.06 * index}>
                <article className="group overflow-hidden rounded-lg border border-border bg-background shadow-soft-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-soft-md">
                  <div className="grid md:grid-cols-[minmax(0,22rem)_1fr] xl:grid-cols-[minmax(0,30rem)_1fr]">
                    {/* Mídia */}
                    <div className="flex flex-col gap-4 border-b border-border p-5 md:border-b-0 md:border-r">
                      <div className="overflow-hidden rounded-md border border-border bg-surface">
                        <img
                          src={`${import.meta.env.BASE_URL}${project.image}`}
                          alt={t(`Projeto ${project.name}`, `${project.name} project`)}
                          loading="lazy"
                          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>

                      {project.internalLink ? (
                        <Link
                          to={project.internalLink}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
                        >
                          {t("Ver página do projeto", "View project page")}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenVideo(project)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
                        >
                          <PlayCircle className="h-4 w-4" />
                          {t("Ver demonstração", "Watch demo")}
                        </button>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex flex-col p-6 md:p-8">
                      <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                        {project.name}
                      </h2>
                      <p className="mt-1.5 text-sm font-medium text-muted-foreground">
                        {project.description}
                      </p>

                      {project.tags && (
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <li
                              key={tag}
                              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="mt-6 max-w-[75ch] border-t border-border pt-6 leading-relaxed text-muted-foreground">
                        {project.longDescription}
                      </p>

                      {project.technicalLink && (
                        <div className="mt-6">
                          <a
                            href={project.technicalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-soft-sm transition-colors hover:bg-surface hover:text-primary"
                          >
                            <Github className="h-4 w-4" />
                            {t("Detalhes técnicos no GitHub", "Technical details on GitHub")}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          /* ================= SOFTWARE ================= */
          <div className="mt-10 space-y-16">
            {projectData.programacao.subsections.map((subsection) => (
              <section key={subsection.title}>
                <div className="flex items-center gap-4">
                  <h2 className="shrink-0 text-lg font-semibold text-foreground">
                    {subsection.title}
                  </h2>
                  <span aria-hidden className="h-px flex-1 bg-border" />
                  <span className="tabular shrink-0 font-mono text-xs text-muted-foreground">
                    {String(subsection.projects.length).padStart(2, "0")}
                  </span>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {subsection.projects.map((project, index) => (
                    <Reveal key={project.id} delay={0.05 * index} className="h-full">
                      <article className="flex h-full flex-col rounded-lg border border-border bg-background p-5 shadow-soft-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-soft-md">
                        <h3 className="text-base font-semibold text-foreground">{project.name}</h3>
                        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                          {project.description}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
                          {project.siteLink && (
                            <a
                              href={project.siteLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                            >
                              {t("Acessar site", "Visit site")}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}

                          {project.githubLink && (
                            <a
                              href={project.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                              GitHub
                              <Github className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Ponte para a outra categoria — sem isto, cada página era um beco sem saída. */}
        <div className="mt-16 border-t border-border pt-8">
          <Link
            to={otherCategory.to}
            className="group flex items-center gap-4 rounded-lg border border-border bg-background p-5 shadow-soft-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-soft-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-primary">
              <otherCategory.icon className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                {t("Ver também", "See also")}
              </span>
              <span className="mt-0.5 block text-sm font-semibold text-foreground">
                {otherCategory.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                <span className="tabular">{otherCategory.count}</span> {t("projetos", "projects")} ·{" "}
                {otherCategory.summary}
              </span>
            </span>

            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </div>
      </div>

      <SiteFooter />
      <DemoVideoDialog video={video} onClose={() => setVideoId(null)} />
    </div>
  );
};

export default ProjectsPage;
