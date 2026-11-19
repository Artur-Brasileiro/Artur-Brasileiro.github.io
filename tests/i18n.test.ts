/**
 * Idiomas: endereços, escolha automática e a conversão dos dados.
 * Roda direto no Node (type stripping):  npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Tx, currentPath, detectLocale, localeFromPath, localize, localizePath, stripLocale, tr } from "../src/i18n/core.ts";

test("o idioma vem do prefixo /en", () => {
  assert.equal(localeFromPath("/"), "pt");
  assert.equal(localeFromPath("/hardware"), "pt");
  assert.equal(localeFromPath("/en"), "en");
  assert.equal(localeFromPath("/en/projeto/cnc-plotter"), "en");
  // uma página que só começa com "en" não é inglês
  assert.equal(localeFromPath("/engenharia"), "pt");
});

test("stripLocale tira só o prefixo", () => {
  assert.equal(stripLocale("/en"), "/");
  assert.equal(stripLocale("/en/hardware"), "/hardware");
  assert.equal(stripLocale("/hardware"), "/hardware");
  assert.equal(stripLocale("/engenharia"), "/engenharia");
});

test("localizePath troca o idioma e mantém âncora e busca", () => {
  assert.equal(localizePath("/", "en"), "/en");
  assert.equal(localizePath("/#sobre", "en"), "/en#sobre");
  assert.equal(localizePath("/hardware", "en"), "/en/hardware");
  assert.equal(localizePath("/projeto/cnc-plotter#guia", "en"), "/en/projeto/cnc-plotter#guia");
  assert.equal(localizePath("/x?y=1#z", "en"), "/en/x?y=1#z");
  assert.equal(localizePath("/en/hardware", "pt"), "/hardware");
  assert.equal(localizePath("/en", "pt"), "/");
  assert.equal(localizePath("/en#contato", "pt"), "/#contato");
  // idempotente
  assert.equal(localizePath("/en/hardware", "en"), "/en/hardware");
  // externos e relativos passam iguais
  assert.equal(localizePath("https://github.com", "en"), "https://github.com");
  assert.equal(localizePath("//cdn.x/y", "en"), "//cdn.x/y");
  assert.equal(localizePath("#guia", "en"), "#guia");
});

test("currentPath não deixa o seletor virar link para outro site", () => {
  assert.equal(currentPath("//evil.com/x"), "/evil.com/x");
  assert.equal(currentPath("///a"), "/a");
  assert.equal(currentPath("/hardware"), "/hardware");
  assert.equal(localizePath(currentPath("//evil.com"), "en"), "/en/evil.com");
});

test("detecção: escolha salva, robô, navegador, região", () => {
  const base = { saved: null, languages: [] as string[], timeZone: undefined as string | undefined, bot: false };
  assert.equal(detectLocale({ ...base, saved: "en", languages: ["pt-BR"] }), "en");
  assert.equal(detectLocale({ ...base, saved: "pt", languages: ["en-US"] }), "pt");
  assert.equal(detectLocale({ ...base, bot: true, languages: ["en-US"] }), "pt");
  assert.equal(detectLocale({ ...base, languages: ["pt-BR", "en"] }), "pt");
  assert.equal(detectLocale({ ...base, languages: ["pt"] }), "pt");
  assert.equal(detectLocale({ ...base, languages: ["pt-PT"] }), "pt");
  assert.equal(detectLocale({ ...base, languages: ["en-US"], timeZone: "America/New_York" }), "en");
  assert.equal(detectLocale({ ...base, languages: ["de-DE"], timeZone: "Europe/Berlin" }), "en");
  // navegador em inglês, mas o aparelho está no Brasil
  assert.equal(detectLocale({ ...base, languages: ["en-US"], timeZone: "America/Sao_Paulo" }), "pt");
  assert.equal(detectLocale({ ...base, languages: ["en-GB"], timeZone: "Europe/Lisbon" }), "pt");
  // sem nenhum sinal, fica no português
  assert.equal(detectLocale(base), "pt");
  // "pt" no meio de outra tag não conta
  assert.equal(detectLocale({ ...base, languages: ["ptx"] }), "en");
});

test("localize troca cada Tx e preserva o resto", () => {
  const icon = () => null;
  const data = {
    title: tr("Olá", "Hello"),
    plain: "MGN15H",
    n: 3,
    icon,
    list: [tr("um", "one"), "dois"],
    nested: { deep: [{ x: tr("a", "b") }] },
    untouched: { a: 1, b: ["c"] },
  };
  const en = localize(data, "en");
  assert.equal(en.title, "Hello");
  assert.equal(en.plain, "MGN15H");
  assert.equal(en.n, 3);
  assert.equal(en.icon, icon);
  assert.deepEqual(en.list, ["one", "dois"]);
  assert.equal(en.nested.deep[0].x, "b");
  // sem Tx dentro, a mesma referência
  assert.equal(en.untouched, data.untouched);
  // em cache: a mesma referência na segunda chamada
  assert.equal(localize(data, "en"), en);
  assert.equal(localize(data, "pt").title, "Olá");
  assert.ok(data.title instanceof Tx);
});
