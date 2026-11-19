/**
 * Idiomas no React: o idioma vem do endereço (/en/... é inglês), e quem lê
 * texto usa useT() ou useLocalized(). Links internos usam o Link/HashLink
 * daqui, que põem o prefixo do idioma sozinhos.
 */
import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Link as RouterLink, useLocation, type LinkProps, type To } from "react-router-dom";
import { HashLink as RouterHashLink } from "react-router-hash-link";
import {
  LANG_TAG,
  SAVED_KEY,
  Tx,
  localeFromPath,
  localize,
  localizePath,
  setCurrentLocale,
  stripLocale,
  type Locale,
  type Localized,
} from "./core";

const LocaleContext = createContext<Locale>("pt");

const SITE = "https://arturbrasileiro.com.br";

const META: Record<Locale, { title: string; description: string; ogLocale: string }> = {
  pt: {
    title: "Artur Brasileiro — Engenheiro da Computação",
    description:
      "Portfólio de Artur Brasileiro, Engenheiro da Computação especializado em software web moderno e sistemas embarcados.",
    ogLocale: "pt_BR",
  },
  en: {
    title: "Artur Brasileiro — Computer Engineer",
    description:
      "Portfolio of Artur Brasileiro, a Computer Engineer specializing in modern web software and embedded systems.",
    ogLocale: "en_US",
  },
};

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/** <link rel="alternate" hreflang> de cada idioma, criados uma vez e atualizados a cada rota */
function setAlternate(hreflang: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = "alternate";
    el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Fica dentro do BrowserRouter: lê o idioma do endereço e o espalha. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const locale = localeFromPath(pathname);
  // antes dos filhos renderizarem, para o getLocale() deles já ver o idioma novo
  setCurrentLocale(locale);

  useEffect(() => {
    const m = META[locale];
    document.documentElement.lang = LANG_TAG[locale];
    document.title = m.title;
    setMeta('meta[name="description"]', "content", m.description);
    setMeta('meta[property="og:title"]', "content", m.title);
    setMeta('meta[property="og:locale"]', "content", m.ogLocale);
    const bare = stripLocale(pathname);
    const url = (l: Locale) => SITE + localizePath(bare, l);
    setMeta('link[rel="canonical"]', "href", url(locale));
    setMeta('meta[property="og:url"]', "content", url(locale));
    setAlternate("pt-BR", url("pt"));
    setAlternate("en", url("en"));
    setAlternate("x-default", url("pt"));
  }, [locale, pathname]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export type T = {
  /** t("Português", "English") */
  (pt: string, en: string): string;
  /** t(tr(...)) — um texto dos dados; string pura passa igual */
  (value: string | Tx): string;
};

/** const t = useT();  t("Abrir", "Open") */
export function useT(): T {
  const locale = useLocale();
  return useCallback(
    ((a: string | Tx, b?: string) => {
      if (a instanceof Tx) return a[locale];
      return b === undefined || locale === "pt" ? a : b;
    }) as T,
    [locale],
  );
}

/** um dado com tr() dentro, já no idioma da página (em cache: mesma referência entre renders) */
export function useLocalized<D>(data: D): Localized<D> {
  const locale = useLocale();
  return useMemo(() => localize(data, locale), [data, locale]);
}

function localizeTo(to: To, locale: Locale): To {
  if (typeof to === "string") return localizePath(to, locale);
  if (to.pathname) return { ...to, pathname: localizePath(to.pathname, locale) };
  return to;
}

/** Link do react-router que mantém o idioma: <Link to="/hardware"> vira /en/hardware no inglês */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  const locale = useLocale();
  return <RouterLink ref={ref} to={localizeTo(to, locale)} {...rest} />;
});

type HashLinkProps = React.ComponentProps<typeof RouterHashLink>;

/** HashLink que mantém o idioma: "/#sobre" vira "/en#sobre" no inglês */
export function HashLink({ to, ...rest }: HashLinkProps) {
  const locale = useLocale();
  return <RouterHashLink to={localizeTo(to as To, locale)} {...rest} />;
}

/** guarda a escolha do seletor (sem armazenamento, a escolha vale só para esta visita) */
export function saveLocale(locale: Locale) {
  try {
    window.localStorage.setItem(SAVED_KEY, locale);
  } catch {
    /* navegação privada, armazenamento bloqueado */
  }
}

/** O endereço atual no outro idioma, com âncora e busca, para o seletor. */
export function useLocaleHref(target: Locale): string {
  const { pathname, search, hash } = useLocation();
  return localizePath(stripLocale(pathname), target) + search + hash;
}
