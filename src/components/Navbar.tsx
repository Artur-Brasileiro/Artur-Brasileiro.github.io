import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { profile } from "@/data/profile";
import { stripLocale, tr, type Locale } from "@/i18n/core";
import { HashLink, saveLocale, useLocale, useLocaleHref, useT } from "@/i18n/react";
import { scrollWithOffset } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/** Seções numeradas da home — os mesmos números dos rótulos de cada seção. */
const navItems = [
  { n: "01", name: tr("sobre", "about"), id: "sobre" },
  { n: "02", name: tr("projetos", "projects"), id: "projetos" },
  { n: "03", name: tr("formação", "education"), id: "formacao" },
  { n: "04", name: tr("contato", "contact"), id: "contato" },
];

/** Marca: o nome como um caminho de arquivo, com o cursor do terminal em ouro. */
const Brand = ({ onClick }: { onClick?: () => void }) => {
  const t = useT();
  return (
  <HashLink
    smooth
    to="/#"
    scroll={scrollWithOffset}
    onClick={onClick}
    aria-label={`${profile.name} — ${t("início", "home")}`}
    className="shrink-0 font-mono text-[14px] font-medium tracking-tight text-foreground"
  >
    {profile.name.toLowerCase().replace(" ", ".")}
    <span aria-hidden className="text-gold">
      ▋
    </span>
  </HashLink>
  );
};

/**
 * PT · EN: links de verdade para o mesmo endereço no outro idioma (robôs seguem,
 * dá para abrir em outra aba). Clicar guarda a escolha para as próximas visitas.
 */
const LanguageSwitch = ({ className, onPick }: { className?: string; onPick?: () => void }) => {
  const locale = useLocale();
  const t = useT();
  const hrefs: Record<Locale, string> = { pt: useLocaleHref("pt"), en: useLocaleHref("en") };
  return (
    <div role="group" aria-label={t("Idioma", "Language")} className={cn("flex items-center text-[11px]", className)}>
      {(["pt", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && (
            <span aria-hidden className="px-1 text-border">
              /
            </span>
          )}
          <RouterLink
            to={hrefs[l]}
            replace
            hrefLang={l === "pt" ? "pt-BR" : "en"}
            lang={l === "pt" ? "pt-BR" : "en"}
            aria-current={locale === l ? "true" : undefined}
            aria-label={l === "pt" ? "Português" : "English"}
            onClick={() => {
              saveLocale(l);
              onPick?.();
            }}
            className={cn(
              "rounded-[4px] px-1 py-1 uppercase tracking-wide transition-colors",
              locale === l ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </RouterLink>
        </span>
      ))}
    </div>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const location = useLocation();
  const t = useT();
  /** o caminho sem /en: a home é "/" nos dois idiomas */
  const page = stripLocale(location.pathname);

  // Sombra da barra ao sair do topo — listener leve com guard de rAF.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 8);
        if (window.scrollY < 100) setActiveSection("");
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu mobile ao trocar de rota.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // E com Esc, como qualquer painel que abre por cima do conteúdo.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  // Scroll-spy via IntersectionObserver, só na home (as seções só existem lá).
  // Re-tenta até as seções aparecerem no DOM (Index é lazy/Suspense).
  useEffect(() => {
    if (page !== "/") {
      setActiveSection("");
      return;
    }
    let obs: IntersectionObserver | null = null;
    let raf = 0;
    const setup = () => {
      const els = navItems
        .map((i) => document.getElementById(i.id))
        .filter((el): el is HTMLElement => el !== null);
      if (els.length === 0) {
        raf = requestAnimationFrame(setup);
        return;
      }
      // Quais seções cruzam a faixa do meio da tela agora. Guardar o conjunto (e
      // não só o último "entrou") permite apagar o destaque quando nenhuma
      // cruza — voltando ao hero de 460vh, "sobre" ficava aceso o caminho todo.
      const inBand = new Set<string>();
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            const id = (e.target as HTMLElement).id;
            if (e.isIntersecting) inBand.add(id);
            else inBand.delete(id);
          });
          setActiveSection(navItems.find((i) => inBand.has(i.id))?.id ?? "");
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
      );
      els.forEach((el) => obs!.observe(el));
    };
    raf = requestAnimationFrame(setup);
    return () => {
      cancelAnimationFrame(raf);
      obs?.disconnect();
    };
  }, [page]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border bg-background/[0.82] backdrop-blur-md transition-shadow duration-300",
        isScrolled && "shadow-soft-sm",
      )}
    >
      <div className="frame flex h-14 items-center justify-between font-mono">
        <Brand onClick={() => setIsMobileMenuOpen(false)} />

        {/* Navegação desktop — indicador ancorado na borda inferior da barra. */}
        <nav aria-label={t("Seções", "Sections")} className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <HashLink
                key={item.id}
                smooth
                to={`/#${item.id}`}
                scroll={scrollWithOffset}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "relative flex h-14 items-center gap-1.5 text-[11px] transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="text-gold">{item.n}</span>
                {t(item.name)}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-px origin-left bg-foreground transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </HashLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span title={t(profile.availability)} className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold-soft shadow-[0_0_8px_hsl(var(--gold-soft))]" />
            {t("disponível", "available")}
          </span>

          <LanguageSwitch className="ml-2" />

          <button
            type="button"
            aria-label={isMobileMenuOpen ? t("Fechar menu", "Close menu") : t("Abrir menu", "Open menu")}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-[6px] text-foreground transition-colors hover:bg-surface md:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Painel mobile — ancorado na barra, largura total. */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav aria-label={t("Seções", "Sections")} className="frame flex flex-col py-2 font-mono">
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <HashLink
                  key={item.id}
                  smooth
                  to={`/#${item.id}`}
                  scroll={scrollWithOffset}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex gap-3 border-l-2 py-3 pl-4 text-[13px] transition-colors",
                    active ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="text-gold">{item.n}</span>
                  {t(item.name)}
                </HashLink>
              );
            })}
            <span className="flex items-center gap-2 py-3 pl-4 text-[11px] text-muted-foreground sm:hidden">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold-soft" />
              {t(profile.availability).toLowerCase()}
            </span>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
