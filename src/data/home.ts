/**
 * Textos e listas da página inicial. Os componentes da home só apresentam;
 * tudo que é frase ou escolha de conteúdo mora aqui.
 */
import { featuredProjects, projectData } from "./projects";
import { profile } from "./profile";

/** Abaixo do nome, no hero. */
export const heroLead =
  `${profile.role} — do esquemático da placa ao último pixel da interface. ` +
  "Role a página e veja os projetos em movimento.";

/** Linhas da seção "sobre". */
export const nowLines: { k: "faço" | "estudo" | "agora"; v: string }[] = [
  { k: "faço", v: "Produtos web em React e TypeScript, e hardware do esquemático à placa montada." },
  {
    k: "estudo",
    v: `Engenharia da Computação na UEMG — ${profile.currentSemester}º período, conclusão em ${profile.graduationYear}.`,
  },
  { k: "agora", v: "Abrindo o Polpad em código aberto, montando a CNC plotter e mantendo o Atlas Fluency em produção." },
];

/** Card de projeto da home. Os projetos com vista explodida não entram: estão nas folhas do hero. */
export type HomeProject = {
  /** referência no canto da imagem, como numa lista de desenhos */
  code: string;
  name: string;
  kind: "SW" | "HW";
  summary: string;
  stack: string[];
  image?: string;
  /** a imagem é um logo: vai contida sobre a grade, não recortada */
  logo?: boolean;
  /** site do projeto (software) */
  href?: string;
  github?: string;
  /** vídeo de demonstração no YouTube — o card de hardware abre por ele */
  youtubeId?: string;
};

const featured = (id: string) => {
  const p = featuredProjects.find((f) => f.id === id);
  if (!p) throw new Error(`projeto em destaque inexistente: ${id}`);
  return p;
};

const software = (code: string, id: string): HomeProject => {
  const p = featured(id);
  return {
    code,
    name: p.title,
    kind: "SW",
    summary: p.description,
    stack: p.tags,
    image: p.image,
    logo: p.logoCover,
    href: p.demoLink,
    github: p.githubLink || undefined,
  };
};

export const homeProjects: HomeProject[] = [
  software("SW-01", "viewcongresso"),
  software("SW-02", "atlas-fluency"),
  // o hardware com página própria (o macropad) é folha do hero, não card
  ...projectData.hardware.projects
    .filter((p) => !p.internalLink)
    .map(
      (p, i): HomeProject => ({
        code: `HW-${String(i + 1).padStart(2, "0")}`,
        name: p.name,
        kind: "HW",
        summary: p.longDescription ?? p.description,
        stack: p.tags ?? [],
        image: p.image,
        github: p.technicalLink,
        youtubeId: p.youtubeId,
      }),
    ),
];
