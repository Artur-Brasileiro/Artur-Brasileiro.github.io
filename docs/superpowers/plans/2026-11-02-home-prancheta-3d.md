# Home "Prancheta" com vista explodida 3D — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a home pelo protótipo aprovado `/opcoes/d` (prancheta + folhas 3D + cards com vídeo), com o resto do site herdando a nova linguagem.

**Architecture:** Tokens globais (shadcn) passam à paleta da prancheta, então as páginas internas acompanham sem redesenho. O visualizador 3D é dividido em uma parte leve (trilha, scroll, HUD) e uma pesada carregada sob demanda (three/r3f), para o hero renderizar antes do three.js. A home vira um conjunto de seções em `src/components/home/`, alimentadas pelos arquivos de `src/data/`.

**Tech Stack:** React 18, Vite 7, TypeScript, Tailwind 3 (tokens shadcn), three 0.183, @react-three/fiber 8, Radix Dialog, Lenis.

**Spec:** `docs/superpowers/specs/2026-11-02-home-prancheta-3d-design.md`

## Global Constraints

- Só tema claro. Paleta: papel `#f2f1ec`, cartão `#f7f6f2`, tinta `#15171a`, cinza `#62666d`, borda `#d7d7d3`, faixa `#e9e8e4`, ouro `#94600f`, ouro claro `#c99a4b` (ouro claro nunca em texto).
- Fontes: IBM Plex Mono 400/500/600 (interface, títulos) e IBM Plex Sans 400/500/600 (parágrafos). Inter sai.
- Raios: 5px chips · 6px botões quadrados · 7px botões · 8px cards · 10px modais.
- Todo modal chama `useLenisLock(aberto)`.
- Nenhum nome de peça 3D no código; tudo vem do `parts.json`.
- Copy em português, minúsculas no estilo mono (`01 sobre`, `estudo de caso →`), como no protótipo.
- WhatsApp: `+55 62 99843-7904` → `https://wa.me/5562998437904`.
- Sem deploy. Commits na branch `redesign/home-3d`, um por task.

## Review Focus

- Toque no celular sobre o canvas: deve rolar a página, nunca girar o modelo (Task 2).
- three.js indisponível (WebGL falha ou chunk lento): título, carimbo e lista continuam visíveis (Task 2).
- Modal de vídeo aberto: Esc fecha, a página atrás não rola, o vídeo para ao fechar (Task 5).
- Filtro `software` (2 cards) e `hardware` (3 cards): a grade não deixa buraco (Task 5).
- Navegar de `/hardware` para "Voltar para projetos": a home rola até `#projetos` mesmo com a trilha 3D de ~460vh acima (Task 4).

---

### Task 1: Tokens, fontes e utilitários da prancheta

**Files:**
- Modify: `src/index.css` (bloco `:root`, `.rail`, `.eyebrow`, `.font-display`; novo `.bg-grid`)
- Modify: `tailwind.config.ts` (fontes; cores `gold`, `gold-soft`)
- Modify: `index.html` (fontes Google, `theme-color`)

**Interfaces:**
- Produces: classes `bg-grid`, `text-gold`, `text-gold-soft`, `border-gold`, `font-mono` (Plex Mono), `font-sans` (Plex Sans), `font-display` (= mono, `letter-spacing: -0.03em`), `.eyebrow` (mono 11px, `tracking-[0.18em]`, uppercase, ouro).

- [ ] **Step 1:** Em `:root`, HSL: `--background 50 19% 94%` · `--foreground 216 11% 9%` · `--surface 48 10% 90%` · `--card 48 24% 96%` · `--popover 48 24% 96%` · `--primary 216 11% 9%` · `--primary-foreground 50 19% 94%` · `--primary-hover 210 4% 20%` · `--secondary`/`--muted`/`--accent 48 10% 90%` · `--muted-foreground 218 5% 41%` · `--border`/`--input 60 5% 84%` · `--ring 216 11% 9%` · `--gold 37 82% 32%` · `--gold-soft 38 54% 54%` · `--radius 0.5rem`. Sombras tingidas de tinta (`hsl(216 11% 9% / …)`). `::selection` em ouro claro a 30%.
- [ ] **Step 2:** `.bg-grid` = papel + duas `linear-gradient` de `rgba(21,23,26,.045)` 1px, `background-size: 24px 24px`. `.rail` mantém largura e bordas laterais.
- [ ] **Step 3:** `index.html`: troca Inter por `IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600`, `theme-color` `#f2f1ec`.
- [ ] **Step 4: Verificar** — `npx tsc --noEmit -p tsconfig.app.json` sem erro; com o dev server, em `/hardware` via CDP: `getComputedStyle(document.body).backgroundColor === "rgb(242, 241, 236)"` e `fontFamily` começa com `"IBM Plex Sans"`.
- [ ] **Step 5: Commit** `feat(design): tokens e fontes da prancheta`

### Task 2: Visualizador 3D em duas partes + folhas + chunk próprio

**Files:**
- Create: `src/components/three/explode.ts`, `src/components/three/ExplodedCanvas.tsx`, `src/data/sheets.ts`, `tests/explode.test.ts`
- Modify: `src/components/three/ExplodedView.tsx` (vira a parte leve), `vite.config.ts` (`manualChunks`)

**Interfaces:**
- Produces (`explode.ts`, sem import de three): tipos `PartGroup`, `PartsConfig`, `ExplodedState { q; cfg; stage; stageIndex }`, `Shift = [number, number] | ((q: number) => [number, number])`; `ramp(q, a, b): number`; `seg(p, [a, b]): number` (easeInOut cúbico, 0 se `b <= a`); `isGroupOut(g, q): boolean` (grupo parado = sempre aceso; móvel = `seg > 0.12`); `stageAt(cfg, q): { stage: string; stageIndex: number }`; `explosionFrame(offsets: [number, number, number][], fullSpan: number): { spread: number; center: [number, number, number] }`.
- Produces: `ExplodedView` (default, leve) com props `{ configUrl; trackVh?; className?; style?; studio?: "light" | "dark"; shift?: Shift; zoom?: number; children?: (s: ExplodedState) => ReactNode }`.
- Produces (`sheets.ts`): `type Sheet = { n: string; name: string; full: string; config?: string; caseUrl?: string }`, `sheets: Sheet[]` com macropad (`/projetos/macropad/parts.json`, `/projeto/macropad`) e CNC Plotter sem `config`.

- [ ] **Step 1: Teste que falha** — `tests/explode.test.ts` com `node:test`, importando `../src/components/three/explode.ts`:
  - `seg(0.5, [0, 1]) === 0.5`, `seg(0, [0, 1]) === 0`, `seg(2, [0, 1]) === 1`, `seg(0.3, [0.5, 0.5]) === 0`;
  - `isGroupOut` parado (`stage [0,0]`) → `true` em `q = 0`; móvel `[0.6, 0.84]` → `false` em `0.6`, `true` em `0.84`;
  - `stageAt` com os `stages` do macropad: `q 0 → índice 0`, `q 0.37 → 3 "Moldura e placa de encaixe"`, `q 1 → 6`;
  - `explosionFrame([[0,116,0],[0,-95,0]], 211)` → `spread 1`, `center [0, 10.5, 0]`; `explosionFrame([[0,0,0]], 211)` → `spread 0`; `explosionFrame([[60,0,0]], 0)` → `spread 0` sem `NaN`.
- [ ] **Step 2:** `node --test tests/explode.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `explode.ts` (lógica pura extraída do protótipo).
- [ ] **Step 4:** `node --test tests/explode.test.ts` → PASS.
- [ ] **Step 5:** `ExplodedCanvas.tsx` (default; props `{ cfg; baseUrl; studio; zoom; progress; drag; shift; onProgress }`, refs mutáveis): o `<Canvas>`, estúdio, montagem, câmera e suavização do protótipo, usando `seg`/`explosionFrame` de `explode.ts`. Envolto num limite de erro local que renderiza `null`.
- [ ] **Step 6:** `ExplodedView.tsx` leve: trilha, área fixa, fetch do config, progresso, arrasto (handlers no wrapper; `pointerType === "touch"` ignorado; `touch-action: pan-y`), `stageAt`, `children`, e `lazy(() => import("./ExplodedCanvas"))` em `<Suspense fallback={null}>`. Nenhum import de `three` neste arquivo. Se o fetch do config falhar, a trilha e o `children` continuam com `cfg: null` (sem canvas) — nada de trocar o hero por mensagem de erro.
- [ ] **Step 7:** `vite.config.ts`: `manualChunks` devolve `"three"` para `node_modules/three`, `@react-three`, `three-stdlib`, `troika`, `meshoptimizer`, `postprocessing`, e `"vendor"` para o resto.
- [ ] **Step 8: Verificar** — `npx vite build`: existe `assets/three-*.js`; o `index.html` gerado não referencia o chunk `three` (`grep three dist/index.html` vazio). CDP (GPU) em `/opcoes/d` (ainda vivo nesta task): hero em 0 / 45% / 100% igual ao protótipo; `node --test` passa.
- [ ] **Step 9: Commit** `feat(3d): visualizador em duas partes, folhas e chunk do three`

### Task 3: Barra e rodapé da prancheta

**Files:**
- Modify: `src/components/Navbar.tsx`
- Create: `src/components/SiteFooter.tsx`

**Interfaces:**
- Consumes: tokens da Task 1.
- Produces: `SiteFooter` (default, sem props).

- [ ] **Step 1:** Navbar: altura 56px, fundo papel 82% + blur, borda inferior; marca `artur.brasileiro` + `▋` em ouro (HashLink para `/#`); nav `01 sobre · 02 projetos · 03 formação · 04 contato` (ids `sobre`, `projetos`, `formacao`, `contato`), número em ouro, item ativo em tinta com traço inferior; à direita `● disponível` (ponto ouro claro). Mantém scroll-spy, fechamento do menu ao trocar de rota e o menu móvel (sanfona, mono). Offset de rolagem 72px. Remove o desvio `/opcoes`.
- [ ] **Step 2:** `SiteFooter`: borda superior, `© 2026 artur brasileiro` · `feito em C++, TypeScript e solda`, mono 11px cinza.
- [ ] **Step 3: Verificar** — tsc; CDP 1440 e 390: barra renderiza, menu móvel abre e fecha.
- [ ] **Step 4: Commit** `feat(nav): barra e rodapé da prancheta`

### Task 4: Hero de folhas e nova página inicial

**Files:**
- Create: `src/components/home/SheetsHero.tsx`, `src/data/home.ts`
- Modify: `src/pages/Index.tsx`

**Interfaces:**
- Consumes: `ExplodedView`, `isGroupOut`, `ramp`, `sheets`.
- Produces (`home.ts`): `nowLines: { k: "faço" | "estudo" | "agora"; v: string }[]`, `bridgeText: string`, `HomeProject` (o `ShowcaseProject` do protótipo, com `youtubeId?`) e `homeProjects: HomeProject[]` (derivado de `projects.ts`, sem anos inventados).

- [ ] **Step 1:** `SheetsHero`: trilha 460vh com `bg-grid`, `zoom` 1.08 (desktop) / 1.75 (`< 1024px`), `shift` desktop `q => [0.15 - 0.1·ramp(q,.03,.16), 0.04]`, móvel `q => [0, 0.2 - 0.26·ramp(q,.03,.14)]`; HUD do protótipo D (título, legenda `fig. NN`, lista de materiais, marcas de corte, dica, carimbo com seletor de folha). `key={sheet.config}` no `ExplodedView`; botões de folha sem `config` ficam `disabled` com `· em breve`. Faixa-ponte abaixo com `bridgeText` e `estudo de caso →` para `sheet.caseUrl`.
- [ ] **Step 2:** `Index.tsx` renderiza `SheetsHero` e as seções (as das Tasks 5–6 entram como estão sendo criadas; até lá, só o hero e o rodapé). Mantém a lógica `state.targetId` com offset 72.
- [ ] **Step 3: Verificar** — CDP `/`: em 0% o `h1` existe e está visível **antes** do canvas montar (capturar com o chunk `three` bloqueado via `Network.setBlockedURLs ["*three-*"]` no build de preview: `h1` visível, sem erro de página); 45% sem peça cortada; seletor mostra `02 CNC Plotter · em breve` desabilitado.
- [ ] **Step 4: Commit** `feat(home): hero de folhas com vista explodida`

### Task 5: Sobre, projetos (com vídeo) e formação

**Files:**
- Create: `src/components/home/AboutSection.tsx`, `src/components/home/ProjectsSection.tsx`, `src/components/home/ProjectCard.tsx`, `src/components/home/EducationSection.tsx`, `src/components/DemoVideoDialog.tsx`
- Modify: `src/components/CertificateModal.tsx` (só classes), `src/pages/ProjectsPage.tsx` (usa `DemoVideoDialog`), `src/pages/Index.tsx`

**Interfaces:**
- Produces: `DemoVideoDialog` (default) `{ video: { title: string; youtubeId: string; code?: string; summary?: string; github?: string } | null; onClose: () => void }` — `useLenisLock(!!video)`, foco inicial no próprio conteúdo (`onOpenAutoFocus` → `preventDefault` + `focus()` no ref), iframe `youtube-nocookie.com/embed/<id>?autoplay=1&rel=0` só quando aberto.
- Produces: `ProjectCard` `{ p: HomeProject; wide: boolean; onPlay: (p: HomeProject) => void }`.

- [ ] **Step 1:** `AboutSection` (`#sobre`): rótulo `01 · sobre`, `nowLines`, ficha `profile.facts`, grade de stack 5 colunas (2 no celular).
- [ ] **Step 2:** `ProjectCard` e `ProjectsSection` (`#projetos`) como no protótipo D: filtro, `homeProjects` sem `has3d`, primeiro largo só com contagem ímpar; software = link com seta; hardware com `youtubeId` = `<article>` com botão de play esticado (`after:absolute after:inset-0`), selo de play na foto, `código no github ↗` com `relative z-10`.
- [ ] **Step 3:** `DemoVideoDialog` no estilo prancheta (cabeçalho `código · nome`, vídeo 16:9, resumo + `código no github ↗`). `ProjectsPage` troca o `Dialog` próprio por ele.
- [ ] **Step 4:** `EducationSection` (`#formacao`): linhas período (ouro) · título/instituição · tipo; certificação é botão que abre `CertificateModal`; `CertificateModal` só ganha cores/raios da prancheta.
- [ ] **Step 5: Verificar** — CDP: clique no centro da foto do Espectro abre modal com `iframe` `…/embed/9tUq1hGooeE…`; `elementFromPoint` no link do GitHub é o `<a>`; Esc fecha, `iframe` some, `html` perde `lenis-stopped`; mesmo teste em `/hardware`; filtro `software` → 2 cards sem largo, `hardware` → 3 com o primeiro largo; certificado React abre e fecha com Esc.
- [ ] **Step 6: Commit** `feat(home): sobre, projetos com vídeo e formação`

### Task 6: Contato

**Files:**
- Create: `src/components/home/ContactSection.tsx`

**Interfaces:**
- Consumes: `EMAIL`, `WHATSAPP`, `WHATSAPP_URL`, `FORMSPREE_ENDPOINT`, `GITHUB_URL`, `LINKEDIN_URL`.

- [ ] **Step 1:** `#contato`: rótulo `04 · contato`; linhas `e-mail` (link + botão `copiar`, estado `copiado` por 2s) e `whatsapp` (abre `wa.me` em nova aba) em mono grande; formulário Formspree (nome, e-mail, mensagem; estados `enviando…`, `mensagem enviada`, `não foi possível enviar — use o e-mail ao lado`) em cartão com borda; `github ↗`, `linkedin ↗`.
- [ ] **Step 2: Verificar** — CDP: links `mailto:` e `https://wa.me/5562998437904`; campos `required`; submit sem enviar de verdade (interceptar `fetch` com `Fetch.enable` e responder 200) mostra `mensagem enviada`.
- [ ] **Step 3: Commit** `feat(home): contato com whatsapp e formulário`

### Task 7: Limpeza, páginas internas e verificação final

**Files:**
- Delete: `src/pages/opcoes/`, `src/components/{Hero,About,Projects,Education,Contact,Footer,ProfileAvatar}.tsx`, `src/components/layout/`, `src/components/motion/{CountUp,Marquee}.tsx`
- Modify: `src/App.tsx` (rotas `/opcoes*` saem), `src/pages/ProjectsPage.tsx`, `src/pages/projetos-destaque/MacropadPage.tsx`, `src/pages/NotFound.tsx` (ajustes pontuais), `.gitignore`
- Move: `public/macropad-portfolio.zip` → raiz do projeto

- [ ] **Step 1:** Remover o protótipo e os componentes antigos; `grep -rn "opcoes\|components/Hero\|layout/Section\|CountUp\|Marquee" src` vazio.
- [ ] **Step 2:** Páginas internas: botões primários tinta, `eyebrow` em ouro, títulos `font-display font-medium` (mono não ganha bold sintético), raios 7px/8px; `SiteFooter` no fim de `ProjectsPage`, `MacropadPage`.
- [ ] **Step 3:** Mover o zip para a raiz; `.gitignore` ganha `*.zip`.
- [ ] **Step 4: Verificar** — `node --test tests/`, `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint .` (0 erros), `npx vite build` (chunk `three` separado, `vendor` sem three). CDP 1440×900 e 390×844: `/` (0/45/100% + seções), `/hardware`, `/programacao`, `/projeto/macropad`, `/qualquer`; console sem erros.
- [ ] **Step 5: Commit** `chore: remove protótipo e home antiga; páginas internas na prancheta`
