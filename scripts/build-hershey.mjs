// Converte fontes de traço único (SVG font) em JSON compacto para a CNC do site.
//
// Fontes de plotter: cada letra é desenhada com uma linha só, como à caneta —
// uma fonte comum só daria o contorno das letras. Vêm do pacote npm
// `hersheytext` (MIT), que redistribui as Hershey Fonts e as EMS fonts
// convertidas por Windell H. Oskay (Evil Mad Scientist), com Latin-1 completo
// (ç, ã, é...).
//
//   npm pack hersheytext@2.0.0 && tar xzf hersheytext-2.0.0.tgz
//   node scripts/build-hershey.mjs package/svg_fonts public/projetos/cnc/fontes
//
// Formato de saída: { name, asc, desc, adv, credit, g: { "<char>": [avanço, "x y x y;x y ..."] } }
// em unidades de 1/1000 de em, y para cima; cada trecho entre ";" é um traço.
import fs from "node:fs";
import path from "node:path";

const [, , IN, OUT] = process.argv;
if (!IN || !OUT) {
  console.error("uso: node scripts/build-hershey.mjs <pasta svg_fonts> <pasta de saída>");
  process.exit(1);
}

const HERSHEY_CREDIT =
  "The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the U. S. National Bureau of Standards. " +
  "The format of the Font data in this distribution was originally created by James Hurt, Cognition, Inc., 900 Technology Park Drive, Billerica, MA 01821. " +
  "SVG conversion by Windell H. Oskay, Evil Mad Scientist Laboratories.";
const EMS_CREDIT = (by) => `${by}; SVG font conversion by Windell H. Oskay. SIL Open Font License 1.1 (https://openfontlicense.org).`;

const FONTS = [
  { id: "simples", file: "HersheySans1.svg", name: "Simples", credit: HERSHEY_CREDIT },
  { id: "cursiva", file: "HersheyScript1.svg", name: "Cursiva", credit: HERSHEY_CREDIT },
  { id: "moderna", file: "EMSReadability.svg", name: "Moderna", credit: EMS_CREDIT("EMS Readability, by Sheldon B. Michaels, derived from Source Sans Pro (Paul D. Hunt, Adobe)") },
];

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/** caminho SVG (M, L, C, Z absolutos, que é o que essas fontes usam) em polilinhas */
function strokes(d) {
  const tok = d.match(/[MLCZmlcz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const out = [];
  let cur = null,
    cmd = "",
    i = 0,
    x = 0,
    y = 0,
    sx = 0,
    sy = 0;
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    if (cmd !== cmd.toUpperCase()) throw new Error(`comando relativo não suportado: ${cmd}`);
    if (cmd === "M") {
      x = num();
      y = num();
      sx = x;
      sy = y;
      cur = [[x, y]];
      out.push(cur);
      cmd = "L"; // pares seguidos de um M são L
    } else if (cmd === "L") {
      x = num();
      y = num();
      cur.push([x, y]);
    } else if (cmd === "C") {
      const [x1, y1, x2, y2, x3, y3] = [num(), num(), num(), num(), num(), num()];
      const n = 10;
      for (let k = 1; k <= n; k++) {
        const t = k / n,
          u = 1 - t;
        cur.push([
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        ]);
      }
      x = x3;
      y = y3;
    } else if (cmd === "Z") {
      cur.push([sx, sy]);
      x = sx;
      y = sy;
    } else throw new Error(`comando inesperado: ${cmd}`);
  }
  return out.filter((s) => s.length > 1);
}

/** tira pontos repetidos e os colineares que não mudam o desenho */
function clean(s) {
  const r = [s[0]];
  for (let k = 1; k < s.length; k++) {
    const p = s[k],
      q = r[r.length - 1];
    if (Math.round(p[0]) === Math.round(q[0]) && Math.round(p[1]) === Math.round(q[1])) continue;
    r.push(p);
  }
  return r;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of FONTS) {
  const svg = fs.readFileSync(path.join(IN, f.file), "utf8");
  const attr = (tag, a) => tag.match(new RegExp(`\\s${a}="([^"]*)"`))?.[1];
  const fontTag = svg.match(/<font\s[^>]*>/)[0];
  const faceTag = svg.match(/<font-face[^>]*>/s)[0];
  const font = {
    name: f.name,
    asc: +attr(faceTag, "ascent"),
    desc: +attr(faceTag, "descent"),
    adv: +attr(fontTag, "horiz-adv-x"),
    credit: f.credit,
    g: {},
  };
  for (const [tag] of svg.matchAll(/<glyph\s[^>]*\/>/gs)) {
    const u = attr(tag, "unicode");
    if (u == null) continue;
    const ch = decode(u);
    if ([...ch].length !== 1) continue;
    const adv = +(attr(tag, "horiz-adv-x") ?? font.adv);
    const d = attr(tag, "d");
    const s = d ? strokes(d).map(clean).filter((x) => x.length > 1) : [];
    font.g[ch] = [Math.round(adv), s.map((pts) => pts.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join(" ")).join(";")];
  }
  const file = path.join(OUT, `${f.id}.json`);
  fs.writeFileSync(file, JSON.stringify(font));
  console.log(`${f.id}: ${Object.keys(font.g).length} glifos, ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}
