/** Rodapé de todas as páginas: uma linha de carimbo, nada mais. */
const SiteFooter = () => (
  <footer className="border-t border-border">
    <div className="frame flex flex-wrap justify-between gap-2 py-6 font-mono text-[11px] text-muted-foreground">
      <span>© {new Date().getFullYear()} artur brasileiro</span>
      <span>feito em C++, TypeScript e solda</span>
    </div>
  </footer>
);

export default SiteFooter;
