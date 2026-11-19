import { profile } from "@/data/profile";
import { nowLines } from "@/data/home";
import { useLocalized, useT } from "@/i18n/react";
import SectionLabel from "./SectionLabel";

/** 01 · sobre — o que faço, estudo e estou fazendo agora, a ficha técnica e a stack. */
const AboutSection = () => {
  const t = useT();
  const lines = useLocalized(nowLines);
  const facts = useLocalized(profile.facts);

  return (
    <>
      <section id="sobre" className="grid gap-10 py-20 lg:grid-cols-[260px_1fr]">
        <SectionLabel n="01">{t("sobre", "about")}</SectionLabel>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            {lines.map(({ id, k, v }) => (
              <div key={id} className="grid grid-cols-[72px_1fr] gap-4 border-t border-border pt-5">
                <span className="font-mono text-[11px] text-gold">{k}</span>
                <p className="text-[17px] leading-relaxed text-foreground">{v}</p>
              </div>
            ))}
          </div>

          <dl className="self-start border border-border font-mono">
            {facts.map((f, i) => (
              <div key={i} className="grid grid-cols-[110px_1fr] border-b border-border text-[12px] last:border-b-0">
                <dt className="border-r border-border px-3 py-2.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="px-3 py-2.5 font-sans text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* stack em tabela: as linhas de 1px são o fundo aparecendo entre as células */}
      <ul aria-label={t("Tecnologias", "Technologies")} className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-5">
        {profile.technologies.map((tech) => (
          <li key={tech.name} className="flex items-center gap-3 bg-background px-4 py-4">
            <img src={tech.icon} alt="" className="h-5 w-5" loading="lazy" />
            <span className="font-mono text-[13px] font-medium text-foreground">{tech.name}</span>
          </li>
        ))}
      </ul>
    </>
  );
};

export default AboutSection;
