# Idiomas (PT-BR e EN)

O site existe em português (endereços de sempre) e em inglês (prefixo `/en`).
Tudo mora em `src/i18n/`:

- `core.ts`: sem React. `tr()`, `localize()`, `getLocale()`, endereços e detecção.
- `react.tsx`: `LocaleProvider`, `useLocale()`, `useT()`, `useLocalized()`, `Link` e `HashLink`.
- `detect.ts`: roda em `main.tsx` antes do React. Quem chega sem `/en` e não fala português vai para `/en`.

## Como escrever um texto

Cada texto mora junto da sua tradução. Nada de chaves nem arquivos JSON separados.

**Num componente**, texto solto:

```tsx
import { useT } from "@/i18n/react";

const t = useT();
<button aria-label={t("Fechar", "Close")}>{t("Baixar STL", "Download STL")}</button>
```

**Num arquivo de dados**, use `tr("Português", "English")` em cada texto que muda
com o idioma. Nomes próprios, siglas e números que não mudam continuam strings puras.

```ts
import { tr } from "@/i18n/core";

export const pendulo = {
  title: tr("Pêndulo invertido", "Inverted pendulum"),
  rail: "MGN15H",                       // igual nos dois
  specs: [{ k: tr("Transmissão", "Drive"), v: "GT2 6 mm" }],
};
```

E quem lê o dado converte uma vez, no topo do componente:

```tsx
import { useLocalized } from "@/i18n/react";
import { pendulo as penduloData } from "@/data/pendulo";

const pendulo = useLocalized(penduloData); // todo tr() virou string, o resto igual
```

Ou, para um campo só: `t(item.title)` (`useT()` aceita um `tr()` ou uma string pura).
Para tipar um dado convertido: `Localized<typeof dado>` (de `core.ts`).

**Fora do React** (cenas three.js, canvas, funções puras): `getLocale()` devolve o
idioma da página, e `localize(dado, getLocale())` ou `txt(valor, getLocale())`
convertem. Arquivos que os testes do Node importam (`physics.ts`, `machine.ts`...)
importam `../../i18n/core.ts` com caminho relativo e extensão, nunca `@/`.

## Armadilhas

- **Trocar de idioma não remonta a página.** O seletor troca `/x` por `/en/x` e a
  página continua montada, na mesma rolagem; só os textos mudam. Texto calculado
  uma vez (num `useMemo` sem o idioma nas dependências, no construtor de uma cena
  3D, num `useRef`) fica no idioma velho. Ponha `useLocale()` nas dependências ou
  repasse o idioma para a cena.
- **`${tr(...)}` dentro de template string** não dá erro de tipo e vira o idioma do
  momento em que a string foi montada. Num dado de módulo, isso é o idioma da
  primeira visita para sempre. Monte a string no `tr()` dos dois lados.
- **Números:** `0,075 mm` em português, `0.075 mm` em inglês; `1.000` vira `1,000`.
  Para números calculados: `formatNumber(n, locale, opções)` de `core.ts`.
- **Links internos** usam `Link`/`HashLink` de `@/i18n/react` (põem o `/en`
  sozinhos). Âncoras (`id`) e caminhos (`/projeto/cnc-plotter`) são os mesmos nos
  dois idiomas. Arquivos para baixar (STL, `.ino`, zips) não mudam.
- **Imagens com texto:** SVG ganha uma cópia `nome.en.svg`, escolhida pelo idioma.
  Foto com rótulo gravado fica como está.

## Vocabulário

| PT | EN |
|---|---|
| Monte o seu / Monte a sua | Build your own |
| pêndulo invertido | inverted pendulum |
| carro (pêndulo) / carro (CNC) | cart / carriage |
| haste | rod |
| trilho | rail |
| batente | end stop |
| esticador | tensioner |
| correia, polia, polia louca | belt, pulley, idler pulley |
| subida por energia | energy-based swing-up |
| equilíbrio | balance |
| fiação, ligações | wiring, connections |
| protoboard | breadboard |
| fonte (de alimentação) | power supply |
| peças impressas | printed parts |
| vista explodida | exploded view |
| folha (da prancheta na home) | sheet |
| período (faculdade) | semester |

Tom: primeira pessoa, frases curtas e concretas, como no português. Inglês americano.
