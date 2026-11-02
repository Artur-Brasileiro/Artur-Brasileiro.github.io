import { useState } from "react";
import { Link } from "react-router-dom";
import DemoVideoDialog, { type DemoVideo } from "@/components/DemoVideoDialog";
import { homeProjects, type HomeProject } from "@/data/home";
import { cn } from "@/lib/utils";
import ProjectCard from "./ProjectCard";
import SectionLabel from "./SectionLabel";

type Filter = "all" | "SW" | "HW";

const filters: [Filter, string][] = [
  ["all", "todos"],
  ["SW", "software"],
  ["HW", "hardware"],
];

const toVideo = (p: HomeProject): DemoVideo => ({
  title: p.name,
  youtubeId: p.youtubeId!,
  code: p.code,
  summary: p.summary,
  github: p.github,
});

/** 02 · projetos — o que não é folha 3D, em cards; hardware abre o vídeo. */
const ProjectsSection = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [video, setVideo] = useState<DemoVideo | null>(null);
  const rows = homeProjects.filter((p) => filter === "all" || p.kind === filter);

  return (
    <section id="projetos" className="py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <SectionLabel n="02">projetos</SectionLabel>
          <h2 className="mt-4 font-mono text-[clamp(28px,3.4vw,44px)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
            outras coisas
            <br />
            que eu construí
          </h2>
        </div>
        <div className="flex gap-2 font-mono" role="group" aria-label="Filtrar projetos">
          {filters.map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={cn(
                "rounded-[5px] border px-3 py-1.5 text-[11px] transition-colors",
                filter === k ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* com contagem ímpar o primeiro ocupa a linha toda — a grade nunca fica com buraco */}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {rows.map((p, i) => (
          <ProjectCard key={p.code} p={p} wide={i === 0 && rows.length % 2 === 1} onPlay={(p) => setVideo(toVideo(p))} />
        ))}
      </div>

      <div className="mt-8 flex gap-3 font-mono text-[12px]">
        <Link to="/programacao" className="rounded-[7px] border border-border px-4 py-2.5 transition-colors hover:border-foreground">
          /programacao →
        </Link>
        <Link to="/hardware" className="rounded-[7px] border border-border px-4 py-2.5 transition-colors hover:border-foreground">
          /hardware →
        </Link>
      </div>

      <DemoVideoDialog video={video} onClose={() => setVideo(null)} />
    </section>
  );
};

export default ProjectsSection;
