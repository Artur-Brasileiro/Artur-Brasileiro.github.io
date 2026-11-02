# Home "Prancheta" com vista explodida 3D

**Data:** 2026-11-02
**Base:** commit `12a9809` (main), branch `redesign/home-3d`
**Origem:** protótipo aprovado em `/opcoes/d` ("D · Fusão A+B"), com três ajustes pedidos depois:
WhatsApp no contato, logo nova do Atlas Fluency e play/vídeo nos cards de hardware.

## Intenção

A página inicial muda por completo. O centro dela passa a ser um projeto de hardware em 3D que se
desmonta conforme a pessoa rola a página (vista explodida presa ao scroll), dentro de uma linguagem
de **folha de desenho técnico**: papel, grade milimetrada, lista de materiais e carimbo.

O Artur vai publicar mais projetos com esse tipo de visualização. O próximo é uma **CNC plotter**
grande. A home precisa receber esses modelos sem redesenho: cada projeto 3D é uma **folha** do
desenho, trocada no carimbo.

Só tema claro. Nada de modo escuro.

## Metas

- Home nova idêntica em linguagem ao protótipo `/opcoes/d`, com conteúdo real dos arquivos de dados.
- Visualizador 3D genérico: projeto novo = pasta em `public/projetos/<slug>/` + uma entrada de dados.
- Site coerente: as páginas internas (`/programacao`, `/hardware`, `/projeto/macropad`, 404) herdam a
  nova paleta e tipografia pelos tokens globais.
- O título e o texto do hero aparecem antes do three.js terminar de carregar.
- three.js fora do bundle inicial das páginas que não usam 3D.

## Fora do escopo

- Modelo da CNC (ainda não existe). A folha 02 fica reservada, desabilitada, com "em breve".
- Vista explodida dentro de `/projeto/macropad` (a página do case continua com o visualizador atual).
- Deploy. A branch fica pronta; publicar é decisão do Artur.
- Internacionalização, modo escuro, currículo em PDF.

## Antimetas (falha mesmo funcionando)

- Hero em branco enquanto o 3D carrega.
- Arrastar o dedo no celular girar o modelo em vez de rolar a página.
- Modal que deixa a página rolar por trás (o Lenis intercepta a roda — ver `useLenisLock`).
- Modal de vídeo que não fecha com Esc.
- Perder funcionalidade que a home atual tem: formulário de contato (Formspree), copiar e-mail,
  certificados que abrem ao clicar.

## Sistema de design

### Cor (tokens em `src/index.css`, nomes do shadcn mantidos)

| papel | valor | uso |
|---|---|---|
| papel (`--background`) | `#f2f1ec` | fundo de tudo |
| cartão (`--card`) | `#f7f6f2` | cards, campos |
| tinta (`--foreground`, `--primary`) | `#15171a` | texto, botões primários (fundo tinta, texto papel) |
| cinza (`--muted-foreground`) | `#62666d` | texto de apoio |
| linha (`--border`) | `rgba(21,23,26,.12)` | toda borda de 1px |
| ouro (`--gold`, novo) | `#94600f` | refs, rótulos numerados, etapa, links de destaque |
| ouro claro (`--gold-soft`, novo) | `#c99a4b` | só decoração: sublinhado, brilho, ponto de status |

Contraste medido: tinta/papel 15,9:1 · cinza/papel 5,1:1 · ouro/papel 4,7:1 · cinza/cartão 5,3:1 ·
ouro/cartão 4,9:1. Ouro claro (2,3:1) nunca carrega texto.

O ouro é o mesmo dos pads ENIG da placa do macropad — o acento vem do objeto.

### Tipografia

- **IBM Plex Mono** (400/500/600): interface, títulos, rótulos, botões, números, carimbo.
- **IBM Plex Sans** (400/500/600): parágrafos.
- Inter sai. `font-display` passa a ser mono.

### Geometria

Raios: 5px chips · 6px botões quadrados · 7px botões · 8px cards · 10px modais. Bordas sempre 1px.
Grade milimetrada: linhas `rgba(21,23,26,.045)` a cada 24px, atrás do 3D e dos logos nos cards.

## Home — estrutura

1. **Barra fixa**: `artur.brasileiro▋` (cursor em ouro) · nav numerada `01 sobre · 02 projetos ·
   03 formação · 04 contato` com scroll-spy · `● disponível`. No celular, menu sanfona.
2. **Folhas 3D** (hero): trilha de ~460vh com área fixa. Por cima do canvas:
   - título `$ whoami / artur brasileiro` + resumo; some entre 3% e 14% do progresso;
   - no lugar dele, a legenda `fig. 01 — <projeto>, vista explodida`;
   - lista de materiais à direita (desktop), montada do `parts.json`, linhas acendem quando a peça sai;
   - marcas de corte nos cantos; dica `↓ role para desmontar` / `arraste para girar`;
   - **carimbo** (canto inferior direito): projeto, etapa `NN/NN` + nome, **seletor de folha**
     (`01 Macropad` · `02 CNC Plotter · em breve`), barra de progresso em ouro.
3. **Faixa-ponte**: uma frase sobre o macropad + botão `estudo de caso →`.
4. **01 sobre**: linhas `faço / estudo / agora` + ficha técnica (`profile.facts`) + grade de stack.
5. **02 projetos**: `outras coisas que eu construí`, filtro `todos / software / hardware`, cards
   grandes (primeiro largo quando a contagem é ímpar). Projetos com 3D ficam de fora — estão nas folhas.
   - **Software**: o card inteiro é link para o site; seta `↗`.
   - **Hardware com vídeo**: selo de play sobre a foto, botão de play no lugar da seta, o card inteiro
     abre o **modal de vídeo**; `código no github ↗` no card (clicável por cima do alvo esticado) e no modal.
   - Links `/programacao →` e `/hardware →`.
6. **03 formação**: linhas período · título/instituição · tipo. Certificações abrem o certificado
   (`CertificateModal`, já existente).
7. **04 contato**: linhas grandes `e-mail` e `whatsapp` (`+55 62 99843-7904` → `wa.me`), copiar
   e-mail, formulário Formspree (nome, e-mail, mensagem) no estilo prancheta, GitHub e LinkedIn.
8. **Rodapé**: `© 2026 artur brasileiro` · `feito em C++, TypeScript e solda`.

## Visualizador 3D

Generaliza o `MacropadExploded` do pacote recebido. Nenhum nome de peça no código: o GLB marca cada
nó com `extras.group`; o `parts.json` diz o que cada grupo é, para onde vai e em que trecho do scroll.

Divisão em três arquivos, para o texto do hero não esperar o three.js:

| arquivo | carrega three? | papel |
|---|---|---|
| `src/components/three/explode.ts` | não | tipos, easing, `seg`, `isGroupOut`, `stageAt` |
| `src/components/three/ExplodedView.tsx` | não | trilha, área fixa, fetch do `parts.json`, progresso do scroll, arrasto, HUD (`children`), `lazy()` do canvas |
| `src/components/three/ExplodedCanvas.tsx` | sim | `<Canvas>`, estúdio de luz, montagem, câmera, suavização |

Comportamento:

- Progresso = posição na trilha; suavização por tempo (`1 - exp(-dt·9)`), igual em qualquer fps.
- **Enquadramento segue o tamanho real da explosão nos três eixos** (não o scroll linear): sem isso as
  keycaps saíam pelo topo no meio da animação, e modelos que abrem para os lados (CNC) não caberiam.
- `zoom` e `shift` (deslocamento do centro de projeção, fixo ou função do progresso) por página.
- Estúdio claro: ambiente PMREM com sala cinza e painéis brancos (o modelo é quase todo preto).
- Toque não gira (o dedo é do scroll); mouse arrasta para girar; giro ocioso para no primeiro arrasto
  e não existe em `prefers-reduced-motion`.
- Falha de WebGL não derruba a página: limite de erro em volta do canvas; o HUD continua.
- Falha ao buscar o `parts.json` também não: a trilha e o título continuam, só sem modelo e sem
  lista de materiais (o protótipo trocava o hero inteiro por uma mensagem de erro).
- O HUD só re-renderiza quando o progresso muda mais que 0,0008.

Folhas em `src/data/sheets.ts`:

```ts
{ n: "01", name: "Macropad", full: "Macropad ESP32-C3", config: "/projetos/macropad/parts.json", caseUrl: "/projeto/macropad" }
{ n: "02", name: "CNC Plotter", full: "CNC Plotter" } // sem config = reservada
```

Projeto 3D novo: copiar `<slug>.glb` + `parts.json` para `public/projetos/<slug>/`, preencher `config`.

## Páginas internas

- Herdam tokens e fontes. Ajustes pontuais onde a cor azul antiga era semântica.
- `/hardware`: o vídeo passa a usar o mesmo modal da home (`DemoVideoDialog`), que corrige o Esc —
  hoje o Radix foca o iframe do YouTube e o Esc não chega à página.

## Limpeza

- Sai o protótipo: `src/pages/opcoes/`, rotas `/opcoes*`, o desvio na `Navbar`.
- Saem os componentes da home antiga sem outro uso: `Hero`, `About`, `Projects`, `Education`,
  `Contact`, `Footer`, `ProfileAvatar`, `layout/Section`, `layout/SectionHeader`, `motion/CountUp`,
  `motion/Marquee`.
- `public/macropad-portfolio.zip` sai de `public/` (tudo em `public/` vai para o build e ficaria
  publicado). É arquivo do Artur, não versionado: é movido para a raiz, não apagado.
- `vite.config.ts`: o `manualChunks` atual joga todo `node_modules` num chunk `vendor` único — com
  isso o three.js entraria no carregamento de toda página. three/r3f/drei ganham chunk próprio.

## Verificação

`tsc --noEmit`, `eslint`, `vite build` (conferir chunk separado do three) e Chrome headless via CDP
com GPU (`--use-angle=d3d11`; o SwiftShader roda a ~0,5 fps e falseia o estado): hero em 0 / 45% /
100% em 1440×900 e 390×844, seções de baixo, modal de vídeo (alvo do clique, link do GitHub, Esc,
Lenis travado e liberado), certificado, formulário renderizado, páginas internas.

## Decisões tomadas por mim (para o Artur conferir)

- Formulário de contato, copiar e-mail e certificados clicáveis **ficam**, no estilo prancheta, embora
  o protótipo não os mostrasse — tirar seria perder função que já existe.
- Ids de seção: `sobre`, `projetos`, `formacao` (antes `educacao`), `contato`.
- **Uma barra só, em todo o site**: a `Navbar` global vira a barra da prancheta. Nas páginas
  internas os links numerados levam a `/#sobre` etc.; o scroll-spy só roda em `/`. O botão
  "Fale comigo" sai (o contato é o item `04`).
- Certificados de Angular e Python continuam clicáveis e mostram o aviso "imagem indisponível" do
  `CertificateModal` até as imagens chegarem — é o comportamento atual.
- Frases de "faço / estudo / agora" e da faixa-ponte são as do protótipo; revisáveis em um arquivo
  de dados só.
- Páginas internas mudam só por tokens e ajustes pontuais, sem redesenho de layout.
