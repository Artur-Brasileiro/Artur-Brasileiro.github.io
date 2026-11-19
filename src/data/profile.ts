/**
 * Identidade, narrativa e stack. Fonte única de verdade para tudo que descreve
 * a pessoa — os componentes só apresentam.
 */

import { tr } from "@/i18n/core";

const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

export const GITHUB_URL = "https://github.com/Artur-Brasileiro";
export const LINKEDIN_URL = "https://www.linkedin.com/in/artur-brasileiro/";
export const EMAIL = "arturbrasileiro00@gmail.com";
export const WHATSAPP = "+55 62 99843-7904";
export const WHATSAPP_URL = "https://wa.me/5562998437904";
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/xyzokkee";

export const profile = {
  name: "Artur Brasileiro",
  initials: "AB",
  role: tr("Engenheiro da Computação", "Computer Engineer"),
  availability: tr("Disponível para novas oportunidades", "Open to new opportunities"),

  headline: {
    lead: tr("Construindo", "Building"),
    accent: tr("Soluções Sólidas.", "Solid Solutions."),
  },

  summary: tr(
    "Especialista em software web moderno e sistemas embarcados. Transformo " +
      "problemas complexos em produtos eficientes, escaláveis e orientados a resultados.",
    "Specialized in modern web software and embedded systems. I turn complex " +
      "problems into efficient, scalable, results-driven products.",
  ),

  /** Período atual do curso — alimenta a bio, a ficha técnica e a faixa de métricas. */
  currentSemester: 10,
  totalSemesters: 10,
  graduationYear: "2026",

  bio: [
    tr(
      "Sou estudante do 10º período de Engenharia da Computação, movido pelo desafio de " +
        "transformar problemas complexos em soluções elegantes. Minha trajetória é marcada " +
        "pela intersecção entre o software de alto nível e as raízes da computação no hardware.",
      "I'm a final-semester Computer Engineering student, driven by the challenge of " +
        "turning complex problems into elegant solutions. My path sits at the intersection " +
        "of high-level software and the hardware roots of computing.",
    ),
    tr(
      "Tenho sólida experiência prática na concepção de sistemas embarcados e no desenvolvimento " +
        "de aplicações web modernas. Acredito que um bom produto nasce da atenção meticulosa " +
        "aos detalhes, desde a arquitetura da informação até o último pixel renderizado na tela.",
      "I have solid hands-on experience designing embedded systems and building modern web " +
        "applications. I believe a good product comes from meticulous attention to detail, " +
        "from the information architecture down to the last pixel rendered on screen.",
    ),
    tr(
      "Atualmente, busco aplicar boas práticas de engenharia de software para entregar " +
        "produtos com alto padrão de qualidade corporativa, garantindo não apenas que o código " +
        "funcione, mas que seja escalável, legível e seguro.",
      "Today I focus on applying sound software engineering practices to ship products " +
        "with enterprise-grade quality, making sure the code not only works but is " +
        "scalable, readable and secure.",
    ),
  ],

  /** Ficha técnica — pares chave/valor da seção Sobre. */
  facts: [
    { label: tr("Formação", "Degree"), value: tr("Engenharia da Computação", "Computer Engineering") },
    {
      label: tr("Instituição", "Institution"),
      value: tr("UEMG — Universidade do Estado de Minas Gerais", "UEMG — Minas Gerais State University"),
    },
    { label: tr("Período", "Semester"), value: tr("10º de 10 · conclusão em 2026", "10th of 10 · graduating in 2026") },
    { label: tr("Localização", "Location"), value: tr("Ituiutaba, MG — Brasil", "Ituiutaba, MG — Brazil") },
  ],

  location: tr("Ituiutaba, MG - Brasil", "Ituiutaba, MG - Brazil"),
  university: tr("UEMG (Universidade do Estado de Minas Gerais)", "UEMG (Minas Gerais State University)"),

  /**
   * Stack exibida na faixa rolante da seção Sobre. Ícones vêm do devicon
   * (CDN jsDelivr); caminhos relativos são resolvidos contra /public.
   */
  technologies: [
    { name: "JavaScript", icon: `${DEVICON}/javascript/javascript-original.svg` },
    { name: "TypeScript", icon: `${DEVICON}/typescript/typescript-original.svg` },
    { name: "React", icon: `${DEVICON}/react/react-original.svg` },
    { name: "Next.js", icon: `${DEVICON}/nextjs/nextjs-original.svg` },
    { name: "Python", icon: `${DEVICON}/python/python-original.svg` },
    { name: "C++", icon: `${DEVICON}/cplusplus/cplusplus-original.svg` },
    { name: "Linux", icon: `${DEVICON}/linux/linux-original.svg` },
    { name: "Git", icon: `${DEVICON}/git/git-original.svg` },
    { name: "Arduino", icon: `${DEVICON}/arduino/arduino-original.svg` },
    { name: "Raspberry Pi", icon: `${DEVICON}/raspberrypi/raspberrypi-original.svg` },
  ],
} as const;

export const socialLinks = [
  { name: "GitHub", href: GITHUB_URL },
  { name: "LinkedIn", href: LINKEDIN_URL },
] as const;
