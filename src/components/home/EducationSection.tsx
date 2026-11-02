import { useState } from "react";
import CertificateModal from "@/components/CertificateModal";
import { education, type EducationItem } from "@/data/education";
import { cn } from "@/lib/utils";
import SectionLabel from "./SectionLabel";

/** 03 · formação — graduação e certificações; a certificação abre o certificado. */
const EducationSection = () => {
  // o item fica guardado depois de fechar: a animação de saída ainda mostra a imagem
  const [item, setItem] = useState<EducationItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const show = (e: EducationItem) => {
    setItem(e);
    setIsOpen(true);
  };

  return (
    <section id="formacao" className="grid gap-10 border-t border-border py-20 lg:grid-cols-[260px_1fr]">
      <SectionLabel n="03">formação</SectionLabel>
      <ul>
        {education.map((e, i) => (
          <li
            key={e.title}
            className={cn(
              "relative grid grid-cols-[100px_1fr] gap-4 border-t py-4 sm:grid-cols-[120px_1fr_140px]",
              i === 0 ? "border-foreground" : "border-border",
              e.imageUrl && "transition-colors hover:bg-surface/60",
            )}
          >
            <span className="font-mono text-[11px] text-gold">{e.period}</span>
            <div>
              <h3 className="font-mono text-[15px] font-medium text-foreground">
                {e.imageUrl ? (
                  // o botão estica sobre a linha inteira: clicar em qualquer parte abre o certificado
                  <button type="button" onClick={() => show(e)} className="text-left after:absolute after:inset-0 after:content-['']">
                    {e.title}
                  </button>
                ) : (
                  e.title
                )}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {e.institution} — {e.description}
              </p>
            </div>
            <span className="hidden text-right font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
              {e.imageUrl ? "ver certificado ↗" : "graduação"}
            </span>
          </li>
        ))}
      </ul>

      <CertificateModal isOpen={isOpen} onClose={() => setIsOpen(false)} image={item?.imageUrl ?? ""} title={item?.title ?? ""} />
    </section>
  );
};

export default EducationSection;
