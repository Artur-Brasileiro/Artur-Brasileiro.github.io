import { useT } from "@/i18n/react";

/** Rodapé de todas as páginas: uma linha de carimbo, nada mais. */
const SiteFooter = () => {
  const t = useT();
  return (
    <footer className="border-t border-border">
      <div className="frame flex flex-wrap justify-between gap-2 py-6 font-mono text-[11px] text-muted-foreground">
        <span>© {new Date().getFullYear()} artur brasileiro</span>
        <span>{t("feito em C++, TypeScript e solda", "made with C++, TypeScript and solder")}</span>
      </div>
    </footer>
  );
};

export default SiteFooter;
