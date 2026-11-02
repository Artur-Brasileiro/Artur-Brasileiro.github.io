import { ArrowUpRight, Play } from "lucide-react";
import type { HomeProject } from "@/data/home";
import { cn } from "@/lib/utils";

/**
 * Card de projeto: imagem grande em cima, texto e ação embaixo.
 *
 * A ação depende do que o projeto tem para mostrar. Software abre o site
 * (seta). Hardware com vídeo abre a demonstração (play) — é o que convence de
 * que a coisa funciona — e o código fica a um link de distância.
 */
const ProjectCard = ({ p, wide, onPlay }: { p: HomeProject; wide: boolean; onPlay: (p: HomeProject) => void }) => {
  const playable = !!p.youtubeId;
  const card = cn(
    "group relative flex flex-col overflow-hidden rounded-[8px] border border-border bg-card transition-[transform,border-color] duration-500 hover:-translate-y-1 hover:border-foreground",
    wide && "md:col-span-2",
  );
  const square =
    "grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-foreground text-foreground transition-colors group-hover:bg-foreground group-hover:text-background";

  const media = (
    // logos sobre a grade milimetrada; fotos ocupam a área inteira
    <div className={cn("relative overflow-hidden border-b border-border", wide ? "aspect-[21/8]" : "aspect-[16/10]", p.logo ? "bg-grid" : "bg-surface")}>
      {p.image && (
        <img
          src={`${import.meta.env.BASE_URL}${p.image}`}
          alt=""
          loading="lazy"
          className={cn("h-full w-full transition-transform duration-700 group-hover:scale-[1.03]", p.logo ? "object-contain p-14" : "object-cover")}
        />
      )}
      <span className="absolute left-3 top-3 border border-border bg-card/90 px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-gold">
        {p.code}
      </span>
      {playable && (
        // selo de play sobre a foto: diz "isto é um vídeo" antes do clique
        <span aria-hidden className="absolute inset-0 grid place-items-center transition-colors duration-300 group-hover:bg-foreground/15">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-background/95 text-foreground shadow-[0_8px_24px_-6px_rgba(0,0,0,.45)] transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-1 h-6 w-6" fill="currentColor" />
          </span>
        </span>
      )}
    </div>
  );

  const text = (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {p.kind === "SW" ? "software" : "hardware"} · {p.stack.slice(0, 3).join(" · ")}
      </p>
      <h3 className="mt-2.5 font-mono text-[20px] font-medium tracking-[-0.02em] text-foreground">{p.name}</h3>
      <p className="mt-2 line-clamp-2 max-w-[58ch] text-[14px] leading-relaxed text-muted-foreground">{p.summary}</p>
    </div>
  );

  if (!playable) {
    return (
      <a href={p.href ?? p.github} target="_blank" rel="noreferrer" className={card}>
        {media}
        <div className="flex flex-1 items-start justify-between gap-6 p-6">
          {text}
          <span className={square}>
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </a>
    );
  }

  return (
    <article className={card}>
      {media}
      <div className="flex flex-1 items-start justify-between gap-6 p-6">
        <div>
          {text}
          {p.github && (
            // acima do botão esticado, para continuar clicável
            <a
              href={p.github}
              target="_blank"
              rel="noreferrer"
              className="relative z-10 mt-4 inline-block font-mono text-[11px] text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-foreground"
            >
              código no github ↗
            </a>
          )}
        </div>
        {/* o play é o alvo do card inteiro: o ::after estica o clique por cima de tudo */}
        <button
          type="button"
          onClick={() => onPlay(p)}
          aria-label={`Ver demonstração em vídeo: ${p.name}`}
          className={cn(square, "after:absolute after:inset-0 after:content-['']")}
        >
          <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />
        </button>
      </div>
    </article>
  );
};

export default ProjectCard;
