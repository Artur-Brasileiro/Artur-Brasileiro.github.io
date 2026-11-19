/**
 * Primeira coisa que o site faz, antes do React: quem chega num endereço sem
 * /en e não fala português vai para a versão em inglês do mesmo endereço.
 * Endereços com /en nunca são trocados: quem mandou o link escolheu o idioma.
 */
import { BOT_UA, SAVED_KEY, currentPath, detectLocale, localeFromPath, localizePath, setCurrentLocale } from "./core";

function readSaved(): string | null {
  try {
    return window.localStorage.getItem(SAVED_KEY);
  } catch {
    return null;
  }
}

function timeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function redirectToPreferredLocale() {
  const { search, hash } = window.location;
  const pathname = currentPath(window.location.pathname);
  if (localeFromPath(pathname) === "en") return;
  const locale = detectLocale({
    saved: readSaved(),
    languages: navigator.languages?.length ? navigator.languages : [navigator.language],
    timeZone: timeZone(),
    bot: navigator.webdriver === true || BOT_UA.test(navigator.userAgent),
  });
  if (locale === "en") {
    window.history.replaceState(window.history.state, "", localizePath(pathname, "en") + search + hash);
    setCurrentLocale("en");
  }
}
