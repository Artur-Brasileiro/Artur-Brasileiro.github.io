/** Formação acadêmica e certificações. */
import { tr, type Tx } from "@/i18n/core";

export type EducationItem = {
  title: string | Tx;
  institution: string | Tx;
  period: string;
  description: string | Tx;
  /** Caminho relativo em /public. `null` na formação acadêmica (sem diploma anexo). */
  imageUrl: string | null;
};

export const education: EducationItem[] = [
  {
    title: tr("Engenharia da Computação", "Computer Engineering"),
    institution: "UEMG",
    period: "2021 — 2026",
    description: tr(
      "Bacharelado em Engenharia da Computação com foco em desenvolvimento de software e sistemas embarcados.",
      "Bachelor's degree in Computer Engineering focused on software development and embedded systems.",
    ),
    imageUrl: null,
  },
  {
    title: tr("Certificação React", "React Certification"),
    institution: "Udemy",
    period: "2025",
    description: tr(
      "Treinamento do básico ao avançado em React, hooks e roteamento.",
      "Beginner-to-advanced training in React, hooks and routing.",
    ),
    imageUrl: "certificados/cert-react.jpg",
  },
  {
    title: tr("Certificação JavaScript", "JavaScript Certification"),
    institution: tr("Plataforma DIO", "DIO"),
    period: "2025",
    description: tr(
      "Certificação avançada em JavaScript e frameworks modernos.",
      "Advanced certification in JavaScript and modern frameworks.",
    ),
    imageUrl: "certificados/cert-js.jpg",
  },
  {
    title: tr("Certificação C#", "C# Certification"),
    institution: tr("Plataforma DIO", "DIO"),
    period: "2025",
    description: tr(
      "Certificação de desenvolvimento em C# e ecossistema .NET.",
      "Development certification in C# and the .NET ecosystem.",
    ),
    imageUrl: "certificados/cert-csharp.jpg",
  },
  {
    title: tr("Certificação Angular", "Angular Certification"),
    institution: "Udemy",
    period: "2024",
    description: tr(
      "Treinamento avançado em Angular e arquitetura de front-end.",
      "Advanced training in Angular and front-end architecture.",
    ),
    imageUrl: "certificados/cert-angular.jpg",
  },
  {
    title: tr("Certificação Python", "Python Certification"),
    institution: "Udemy",
    period: "2022",
    description: tr(
      "Certificação em Python avançado, abordando estruturas de dados e automação.",
      "Advanced Python certification covering data structures and automation.",
    ),
    imageUrl: "certificados/cert-python.jpg",
  },
];

/** Quantas certificações (exclui a graduação, que não tem certificado anexo). */
export const certificationCount = education.filter((item) => item.imageUrl !== null).length;
