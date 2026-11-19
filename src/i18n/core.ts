/**
 * Idiomas do site, sem React: o tipo dos textos traduzidos, a conversão dos
 * dados para um idioma, os endereços e a escolha automática na primeira visita.
 * Roda direto no Node (os testes importam este arquivo).
 *
 * Português fica nos endereços de sempre; inglês ganha o prefixo /en.
 * Cada texto mora junto da sua tradução: tr("Português", "English").
 */

export type Locale = "pt" | "en";
export const LOCALES: readonly Locale[] = ["pt", "en"];
export const DEFAULT_LOCALE: Locale = "pt";

/** o código de idioma para Intl, <html lang> e hreflang */
export const LANG_TAG: Record<Locale, string> = { pt: "pt-BR", en: "en" };

// ─── idioma corrente, para código fora do React (cenas 3D, canvas) ─────────
// O LocaleProvider atualiza a cada troca de rota; antes dele, vale o endereço.

let current: Locale =
  typeof window !== "undefined" ? localeFromPath(window.location.pathname) : DEFAULT_LOCALE;

export function getLocale(): Locale {
  return current;
}

export function setCurrentLocale(locale: Locale) {
  current = locale;
}

// ─── textos ─────────────────────────────────────────────────────────────────

/** Um texto nos dois idiomas. Crie com tr(). */
export class Tx {
  readonly pt: string;
  readonly en: string;
  constructor(pt: string, en: string) {
    this.pt = pt;
    this.en = en;
  }
  /** dentro de `${...}` vira o texto do idioma corrente (rede de segurança: prefira t() ou localize()) */
  toString() {
    return this[current];
  }
}

/** tr("Português", "English") */
export const tr = (pt: string, en: string) => new Tx(pt, en);

/** o texto no idioma, aceitando string pura (texto que não muda: nomes, siglas) */
export function txt(value: string | Tx, locale: Locale): string {
  return typeof value === "string" ? value : value[locale];
}

/** o tipo de um dado depois de localize(): cada Tx vira string, o resto fica igual */
export type Localized<T> = T extends Tx
  ? string
  : T extends (...args: never[]) => unknown
    ? T
    : T extends { $$typeof: symbol }
      ? T
      : T extends object
        ? { [K in keyof T]: Localized<T[K]> }
        : T;

const caches: Record<Locale, WeakMap<object, unknown>> = { pt: new WeakMap(), en: new WeakMap() };

/**
 * Troca cada Tx de um dado (objeto, array, aninhados) pelo texto do idioma.
 * Funções, componentes, elementos React e instâncias de classe passam intactos;
 * o que não tem nenhum Tx dentro volta o mesmo objeto. Resultado em cache.
 */
export function localize<T>(value: T, locale: Locale): Localized<T> {
  return walk(value, locale) as Localized<T>;
}

function walk(v: unknown, locale: Locale): unknown {
  if (v instanceof Tx) return v[locale];
  if (v === null || typeof v !== "object") return v;
  const isArray = Array.isArray(v);
  if (!isArray) {
    const proto = Object.getPrototypeOf(v);
    if ((proto !== Object.prototype && proto !== null) || "$$typeof" in v) return v;
  }
  const cache = caches[locale];
  const hit = cache.get(v);
  if (hit !== undefined) return hit;
  let changed = false;
  let out: unknown;
  if (isArray) {
    out = (v as unknown[]).map((x) => {
      const y = walk(x, locale);
      if (y !== x) changed = true;
      return y;
    });
  } else {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const y = walk(x, locale);
      if (y !== x) changed = true;
      o[k] = y;
    }
    out = o;
  }
  const result = changed ? out : v;
  cache.set(v, result);
  return result;
}

// ─── endereços ──────────────────────────────────────────────────────────────

/**
 * O caminho da página atual, seguro para virar link: "//x.com/y" (endereço
 * digitado com barra dupla) vira "/x.com/y", senão seria um link para outro site.
 */
export function currentPath(pathname: string): string {
  return pathname.replace(/\/{2,}/g, "/") || "/";
}

export function localeFromPath(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "pt";
}

/** o caminho sem o prefixo do idioma ("/en/hardware" → "/hardware", "/en" → "/") */
export function stripLocale(pathname: string): string {
  const bare = localeFromPath(pathname) === "en" ? pathname.slice(3) || "/" : pathname;
  // "/en//x" não pode virar "//x" (endereço de outro site)
  return bare.replace(/^\/{2,}/, "/");
}

/**
 * Um endereço do site no idioma pedido. Só mexe em caminhos absolutos
 * ("/x", "/x#y", "/#y", "/x?y"); links externos e relativos passam iguais.
 */
export function localizePath(to: string, locale: Locale): string {
  if (!to.startsWith("/") || to.startsWith("//")) return to;
  const cut = to.search(/[?#]/);
  const path = cut < 0 ? to : to.slice(0, cut);
  const rest = cut < 0 ? "" : to.slice(cut);
  const bare = stripLocale(path);
  if (locale === "pt") return bare + rest;
  return (bare === "/" ? "/en" : `/en${bare}`) + rest;
}

// ─── escolha automática ─────────────────────────────────────────────────────

/** fusos de países de língua portuguesa: a região, sem perguntar a ninguém */
const LUSOPHONE_ZONES = new Set([
  // Brasil
  "America/Sao_Paulo", "America/Bahia", "America/Fortaleza", "America/Recife", "America/Maceio",
  "America/Belem", "America/Araguaina", "America/Santarem", "America/Manaus", "America/Cuiaba",
  "America/Campo_Grande", "America/Porto_Velho", "America/Boa_Vista", "America/Rio_Branco",
  "America/Eirunepe", "America/Noronha",
  // Portugal
  "Europe/Lisbon", "Atlantic/Azores", "Atlantic/Madeira",
  // África e Timor
  "Africa/Luanda", "Africa/Maputo", "Africa/Bissau", "Africa/Sao_Tome", "Atlantic/Cape_Verde", "Asia/Dili",
]);

export function isLusophoneZone(timeZone: string | undefined): boolean {
  if (!timeZone) return false;
  return LUSOPHONE_ZONES.has(timeZone) || timeZone.startsWith("Brazil/") || timeZone === "Portugal";
}

/** robôs de busca e de prévia de link não são redirecionados */
export const BOT_UA =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|pinterest|vkshare|lighthouse|headless|prerender/i;

export type LocaleSignals = {
  /** escolha salva pelo seletor ("pt" | "en"), se houver */
  saved: string | null;
  /** navigator.languages */
  languages: readonly string[];
  /** fuso horário do aparelho */
  timeZone?: string;
  bot: boolean;
};

/**
 * O idioma de quem chega num endereço sem /en.
 * 1. a escolha salva no seletor; 2. robô fica no português;
 * 3. navegador em português → pt; 4. aparelho num país lusófono → pt; 5. en.
 */
export function detectLocale(s: LocaleSignals): Locale {
  if (s.saved === "pt" || s.saved === "en") return s.saved;
  if (s.bot) return DEFAULT_LOCALE;
  const first = s.languages.find((l) => typeof l === "string" && l.length > 0);
  if (first && /^pt(-|_|$)/i.test(first)) return "pt";
  if (isLusophoneZone(s.timeZone)) return "pt";
  return first ? "en" : DEFAULT_LOCALE;
}

/** onde o seletor guarda a escolha */
export const SAVED_KEY = "idioma";

/** "1.234,5" ou "1,234.5" */
export function formatNumber(n: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return n.toLocaleString(LANG_TAG[locale], options);
}
