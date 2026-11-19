/**
 * Textos e listas da página inicial. Os componentes da home só apresentam;
 * tudo que é frase ou escolha de conteúdo mora aqui.
 */
import { tr, type Localized, type Tx } from "@/i18n/core";
import { featuredProjects, projectData } from "./projects";
import { profile } from "./profile";

/** "10" → "10th", para o período em inglês */
const ordinalEn = (n: number) => {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][v % 10] ?? "th");
  return `${n}${suffix}`;
};

/** Abaixo do nome, no hero. O cargo entra pelos dois lados: um tr() dentro de `${}` congelaria o idioma. */
export const heroLead = tr(
  `${profile.role.pt} — do esquemático da placa ao último pixel da interface. ` +
    "Role a página e veja os projetos em movimento.",
  `${profile.role.en} — from the board schematic to the last pixel of the interface. ` +
    "Scroll down and watch the projects in motion.",
);

/** Linhas da seção "sobre". `id` é a chave estável; `k` é o rótulo, que muda com o idioma. */
export const nowLines: { id: "faco" | "estudo" | "agora"; k: Tx; v: Tx }[] = [
  {
    id: "faco",
    k: tr("faço", "build"),
    v: tr(
      "Produtos web em React e TypeScript, e hardware do esquemático à placa montada.",
      "Web products in React and TypeScript, and hardware from the schematic to the assembled board.",
    ),
  },
  {
    id: "estudo",
    k: tr("estudo", "study"),
    v: tr(
      `Engenharia da Computação na UEMG — ${profile.currentSemester}º período, conclusão em ${profile.graduationYear}.`,
      `Computer Engineering at UEMG — ${ordinalEn(profile.currentSemester)} semester, graduating in ${profile.graduationYear}.`,
    ),
  },
  {
    id: "agora",
    k: tr("agora", "now"),
    v: tr(
      "Abrindo o Polpad em código aberto, montando a CNC plotter e mantendo o Atlas Fluency em produção.",
      "Open-sourcing Polpad, building the CNC plotter and keeping Atlas Fluency running in production.",
    ),
  },
];

/** Card de projeto da home, como sai dos dados (textos ainda nos dois idiomas). */
export type HomeProjectData = {
  /** referência no canto da imagem, como numa lista de desenhos */
  code: string;
  name: string | Tx;
  kind: "SW" | "HW";
  summary: string | Tx;
  stack: (string | Tx)[];
  image?: string;
  /** a imagem é um logo: vai contida sobre a grade, não recortada */
  logo?: boolean;
  /** site do projeto (software) */
  href?: string;
  github?: string;
  /** vídeo de demonstração no YouTube — o card de hardware abre por ele */
  youtubeId?: string;
};

/** Card de projeto da home já no idioma da página (depois de useLocalized). Os projetos com vista explodida não entram: estão nas folhas do hero. */
export type HomeProject = Localized<HomeProjectData>;

const featured = (id: string) => {
  const p = featuredProjects.find((f) => f.id === id);
  if (!p) throw new Error(`projeto em destaque inexistente: ${id}`);
  return p;
};

const software = (code: string, id: string): HomeProjectData => {
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

export const homeProjects: HomeProjectData[] = [
  software("SW-01", "viewcongresso"),
  software("SW-02", "atlas-fluency"),
  // o hardware com página própria (o macropad) é folha do hero, não card
  ...projectData.hardware.projects
    .filter((p) => !p.internalLink)
    .map(
      (p, i): HomeProjectData => ({
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
