/**
 * Depois do build: dist/en.html, o mesmo index.html com título, descrição e
 * idioma em inglês. A Vercel serve esse arquivo em /en e /en/* (vercel.json),
 * porque LinkedIn, WhatsApp e companhia leem só o HTML, sem rodar o site.
 *
 * Também põe os <link rel="alternate" hreflang> da home nos dois arquivos.
 * Falha o build se alguma marcação esperada sumir do index.html.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const indexPath = path.join(dist, "index.html");
const SITE = "https://arturbrasileiro.com.br";

const TITLE_EN = "Artur Brasileiro — Computer Engineer";
const DESCRIPTION_EN =
  "Portfolio of Artur Brasileiro, a Computer Engineer specializing in modern web software and embedded systems.";
const OG_DESCRIPTION_EN = "Modern web software and embedded systems. Projects, education and contact.";

const alternates = [
  `<link rel="alternate" hreflang="pt-BR" href="${SITE}/" />`,
  `<link rel="alternate" hreflang="en" href="${SITE}/en" />`,
  `<link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
].join("\n    ");

function replaceOnce(html, pattern, replacement, what) {
  if (!pattern.test(html)) throw new Error(`html-en: não achei ${what} no index.html`);
  return html.replace(pattern, replacement);
}

let pt = fs.readFileSync(indexPath, "utf8");
if (!pt.includes('hreflang="en"')) {
  pt = replaceOnce(pt, /(<link rel="canonical"[^>]*>)/, `$1\n    ${alternates}`, "o canonical");
  fs.writeFileSync(indexPath, pt);
  // o 404.html (fallback do GitHub Pages) é cópia do index
  const notFound = path.join(dist, "404.html");
  if (fs.existsSync(notFound)) fs.writeFileSync(notFound, pt);
}

let en = pt;
en = replaceOnce(en, /<html lang="pt-BR">/, '<html lang="en">', "<html lang>");
en = replaceOnce(en, /<title>[^<]*<\/title>/, `<title>${TITLE_EN}</title>`, "o <title>");
en = replaceOnce(en, /(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}/en$2`, "o canonical");
en = replaceOnce(en, /(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${DESCRIPTION_EN}$2`, "a description");
en = replaceOnce(en, /(<meta property="og:url" content=")[^"]*(")/, `$1${SITE}/en$2`, "o og:url");
en = replaceOnce(en, /(<meta property="og:title" content=")[^"]*(")/, `$1${TITLE_EN}$2`, "o og:title");
en = replaceOnce(en, /(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${OG_DESCRIPTION_EN}$2`, "o og:description");
en = replaceOnce(en, /(<meta property="og:locale" content=")[^"]*(")/, `$1en_US$2`, "o og:locale");
en = replaceOnce(
  en,
  /(<meta property="og:locale:alternate" content=")[^"]*(")/,
  `$1pt_BR$2`,
  "o og:locale:alternate",
);

fs.writeFileSync(path.join(dist, "en.html"), en);
console.log("html-en: dist/en.html escrito");
