/** Rótulo que abre cada seção da home: o número em ouro, como cota de desenho. */
const SectionLabel = ({ n, children }: { n: string; children: string }) => (
  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
    <span className="text-gold">{n}</span> · {children}
  </p>
);

export default SectionLabel;
