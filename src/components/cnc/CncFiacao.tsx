/**
 * Esquema de ligações da CNC, no capítulo 08 do guia.
 *
 * O desenho é o do pacote do projeto (esquemas/ligacoes.html), trazido como
 * SVG: cada fio e cada peça têm `data-g` (o sistema) e `data-tip` (o que é).
 * Tocar num sistema apaga o resto; passar o mouse ou tocar num fio mostra o
 * texto dele na faixa embaixo do desenho, que funciona igual no celular.
 */
import { useCallback, useEffect, useState } from "react";
import { MousePointerClick } from "lucide-react";
import { fmt } from "@/components/guide/fmt";
import { guia } from "@/data/cncGuia";
import { tr, type Locale, type Tx } from "@/i18n/core";
import { useLocale, useLocalized, useT } from "@/i18n/react";
import { cn } from "@/lib/utils";
// cada desenho tem uma cópia .en.svg com os rótulos e as dicas (data-tip) em inglês
import esquemaPt from "./fiacao/esquema.svg?raw";
import esquemaEn from "./fiacao/esquema.en.svg?raw";
import fimDeCursoPt from "./fiacao/fim-de-curso.svg?raw";
import fimDeCursoEn from "./fiacao/fim-de-curso.en.svg?raw";
import bobinasPt from "./fiacao/bobinas.svg?raw";
import bobinasEn from "./fiacao/bobinas.en.svg?raw";
import driverPt from "./fiacao/driver.svg?raw";
import driverEn from "./fiacao/driver.en.svg?raw";

const ESQUEMA: Record<Locale, string> = { pt: esquemaPt, en: esquemaEn };

/* cores do pacote; o SVG usa essas variáveis */
const VARS = {
  "--v12": "#d7263d",
  "--gnd": "#1d1d1f",
  "--v5": "#f08a00",
  "--sig": "#c9a100",
  "--c1": "#1f8a46",
  "--c1b": "#71c08d",
  "--c2": "#2563a8",
  "--c2b": "#86b6e6",
  "--end": "#8e44ad",
  "--usb": "#6b7280",
  "--p4": "#4b5563",
} as React.CSSProperties;

type Grupo = "all" | "p12" | "p5" | "mot" | "end" | "srv" | "usb";

type Text = string | Tx;

const GRUPOS: { g: Grupo; label: Text; cor?: string; title: Text; body: Text[] }[] = [
  {
    g: "all",
    label: tr("Tudo", "All"),
    title: tr("Visão geral", "Overview"),
    body: [
      tr("Dois circuitos de energia, com o **GND em comum** porque os dois vêm da mesma fonte:", "Two power circuits, with a **common GND** because both come from the same supply:"),
      tr("**12 V** → CNC Shield → drivers → motores.", "**12 V** → CNC Shield → drivers → motors."),
      tr("**12 V → 5 V** (step-down) → servo da caneta.", "**12 V → 5 V** (step-down) → pen servo."),
      tr(
        "O Arduino recebe a lógica e o G-code pelo **USB**. Os sinais de controle (fins de curso e servo) saem do conector END STOPS.",
        "The Arduino gets its logic power and the G-code over **USB**. The control signals (limit switches and servo) go through the END STOPS header.",
      ),
    ],
  },
  {
    g: "p12",
    label: tr("Alimentação 12 V", "12 V power"),
    cor: "#d7263d",
    title: tr("Alimentação 12 V", "12 V power"),
    body: [
      tr("Fonte 12 V / 5 A → divisor Y P4 → 2 jacks P4 fêmea com borne.", "12 V / 5 A supply → P4 Y splitter → 2 female P4 jacks with screw terminals."),
      tr("**Jack A** → borne do CNC Shield (motores). **Jack B** → step-down (servo).", "**Jack A** → CNC Shield screw terminal (motors). **Jack B** → step-down (servo)."),
      tr("Os dois fios da fonte são pretos: identifique o + com o multímetro.", "Both supply wires are black: find the + with the multimeter."),
      tr("Polaridade invertida no shield queima os drivers.", "Reversed polarity on the shield fries the drivers."),
    ],
  },
  {
    g: "p5",
    label: tr("5 V do servo", "Servo 5 V"),
    cor: "#f08a00",
    title: tr("5 V do servo", "Servo 5 V"),
    body: [
      tr(
        "O servo tem um **step-down próprio**. No 5 V do Arduino, que vem do USB, o pico de corrente dele resetava a placa no meio do desenho (`UnexpectedReset` no LaserGRBL, origem perdida).",
        "The servo has its **own step-down**. On the Arduino's 5 V, which comes from USB, its current spike reset the board mid-drawing (`UnexpectedReset` in LaserGRBL, origin lost).",
      ),
      tr("Ajuste a saída para **5,0 V** antes de conectar o servo.", "Set the output to **5.0 V** before connecting the servo."),
      tr("OUT+ → fio vermelho; OUT− → fio marrom ou preto.", "OUT+ → red wire; OUT− → brown or black wire."),
    ],
  },
  {
    g: "mot",
    label: tr("Motores", "Motors"),
    cor: "#2563a8",
    title: tr("Motores e drivers", "Motors and drivers"),
    body: [
      tr("**X = eixo longo** (ponte, 810 mm). **Y = eixo curto** (carro, 390 mm).", "**X = long axis** (gantry, 810 mm). **Y = short axis** (carriage, 390 mm)."),
      tr("NEMA 17 17HS4401S: 1,7 A/fase, ~1,5 Ω, 200 passos/volta.", "NEMA 17 17HS4401S: 1.7 A/phase, ~1.5 Ω, 200 steps/rev."),
      tr(
        "Micropasso 1/16 + polia GT2 20T (40 mm/volta) → **80 passos/mm**. Vref ≈ 0,60 V ≈ 1,5 A.",
        "1/16 microstepping + GT2 20T pulley (40 mm/rev) → **80 steps/mm**. Vref ≈ 0.60 V ≈ 1.5 A.",
      ),
      tr("Sentido errado: `$3` (1 = inverte X, 2 = inverte Y, 3 = os dois).", "Wrong direction: `$3` (1 = invert X, 2 = invert Y, 3 = both)."),
    ],
  },
  {
    g: "end",
    label: tr("Fins de curso", "Limit switches"),
    cor: "#8e44ad",
    title: tr("Fins de curso", "Limit switches"),
    body: [
      tr("Microswitch com rolete, COM + NO, `$5=0`.", "Roller microswitch, COM + NO, `$5=0`."),
      tr(
        "**X:** ponte toda à direita (X+) → pinos X+. **Y:** acionado pelo dedo do carro no fundo (Y+) → pinos Y+.",
        "**X:** gantry all the way right (X+) → X+ pins. **Y:** triggered by the carriage finger at the back (Y+) → Y+ pins.",
      ),
      tr("Alarme falso com o motor andando: 100 nF entre sinal e GND, perto do shield.", "False alarm while the motor runs: 100 nF between signal and GND, near the shield."),
      tr("Teste: `?` no Monitor Serial mostra `Pn:X` / `Pn:Y`.", "Test: `?` in the Serial Monitor shows `Pn:X` / `Pn:Y`."),
    ],
  },
  {
    g: "srv",
    label: "Servo",
    cor: "#c9a100",
    title: tr("Servo da caneta", "Pen servo"),
    body: [
      tr("Sinal no **Z+ branco (D11)**: é a saída PWM do spindle no GRBL 1.1.", "Signal on **white Z+ (D11)**: it's the spindle PWM output in GRBL 1.1."),
      tr("`$32=0` (modo laser desligado) e `$30=255`.", "`$32=0` (laser mode off) and `$30=255`."),
      tr(
        "**`M5`** = caneta em cima: o GRBL executa `M5` ao ligar, resetar ou entrar em alarme, então qualquer pane levanta a caneta. **`M3 S220`** = caneta embaixo.",
        "**`M5`** = pen up: GRBL runs `M5` on power-up, reset or alarm, so any fault lifts the pen. **`M3 S220`** = pen down.",
      ),
      tr("Depois de cada `M3`/`M5`: `G4 P0.3`, para o servo terminar o curso.", "After every `M3`/`M5`: `G4 P0.3`, so the servo finishes its travel."),
    ],
  },
  {
    g: "usb",
    label: "USB / PC",
    cor: "#6b7280",
    title: tr("USB e PC", "USB and PC"),
    body: [
      tr("LaserGRBL na porta COM, **115200** baud.", "LaserGRBL on the COM port, **115200** baud."),
      tr("Ao abrir a porta, o Uno reinicia: refaça o `$H`.", "Opening the port restarts the Uno: redo `$H`."),
      tr(
        "Só um programa usa a porta por vez (feche o LaserGRBL para usar o Monitor Serial).",
        "Only one program can use the port at a time (close LaserGRBL to use the Serial Monitor).",
      ),
      tr("Não aceite ativar o “Laser Mode” (`$32=1`): o servo para.", "Don't accept enabling “Laser Mode” (`$32=1`): the servo stops."),
    ],
  },
];

const DETALHES: { svg: Record<Locale, string>; label: Text }[] = [
  { svg: { pt: fimDeCursoPt, en: fimDeCursoEn }, label: tr("Fim de curso: COM, NO e NC", "Limit switch: COM, NO and NC") },
  { svg: { pt: bobinasPt, en: bobinasEn }, label: tr("As duas bobinas do motor", "The motor's two coils") },
  { svg: { pt: driverPt, en: driverEn }, label: tr("Driver e jumpers de micropasso", "Driver and microstepping jumpers") },
];

const HINT = tr("Passe o mouse ou toque num fio ou peça para ver o que ele faz.", "Hover over or tap a wire or part to see what it does.");

/* estilos do desenho: as classes vêm do SVG do pacote */
const CSS = `
.cncf svg text{font-family:inherit}
.cncf .lbl{font-size:12.5px;font-weight:600;fill:#1d1d1f}
.cncf .lbl-s{font-size:10.5px;font-weight:500;fill:#6b6b70}
.cncf .mono{font:600 10.5px ui-monospace,SFMono-Regular,Consolas,monospace;fill:#1d1d1f}
.cncf .w{fill:none;stroke-linecap:round;stroke-linejoin:round;transition:opacity .2s,stroke-width .2s}
.cncf .comp rect,.cncf .comp circle{transition:opacity .2s}
.cncf .dim .w:not(.hl),.cncf .dim .comp:not(.hl){opacity:.12}
.cncf .w.hl{stroke-width:5}
.cncf .w.on{stroke-width:6.5}
.cncf .comp.on > rect:first-child,.cncf .comp.on > circle:first-child{stroke:#c2410c;stroke-width:2.6}
@media (hover:hover){.cncf .w:hover{stroke-width:6.5}}
.cncf [data-tip]{cursor:pointer}
`;

export default function CncFiacao({ wideRef, wideClassName }: { wideRef?: React.Ref<HTMLDivElement>; wideClassName?: string }) {
  const t = useT();
  const locale = useLocale();
  const grupos = useLocalized(GRUPOS);
  const [grupo, setGrupo] = useState<Grupo>("all");
  const [tip, setTip] = useState<string | null>(null);
  const [picked, setPicked] = useState<Element | null>(null);
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);

  // trocar de idioma troca o desenho inteiro (outro SVG, outras dicas): a dica e a peça escolhida saem
  const [shownLocale, setShownLocale] = useState(locale);
  if (shownLocale !== locale) {
    setShownLocale(locale);
    setTip(null);
    setPicked(null);
  }

  // o SVG vem pronto (innerHTML); as classes de destaque são postas direto nele,
  // de novo a cada SVG novo (troca de idioma), grupo ou peça escolhida
  useEffect(() => {
    if (!svgEl) return;
    svgEl.classList.toggle("dim", grupo !== "all");
    svgEl.querySelectorAll<SVGElement>("[data-g]").forEach((el) => {
      el.classList.toggle("hl", grupo !== "all" && el.dataset.g === grupo);
      el.classList.toggle("on", el === picked);
    });
  }, [svgEl, grupo, picked]);

  const box = useCallback((node: HTMLDivElement | null) => {
    setSvgEl(node?.querySelector("svg") ?? null);
  }, []);

  const choose = (g: Grupo) => {
    setGrupo(g);
    setPicked(null);
    setTip(null);
  };

  const target = (e: React.SyntheticEvent) => (e.target as Element).closest?.("[data-tip]") as SVGElement | null;

  const info = grupos.find((x) => x.g === grupo)!;

  return (
    <div className="cncf space-y-6" style={VARS}>
      <style>{CSS}</style>

      <div ref={wideRef} className={cn("flex flex-col gap-3", wideClassName)}>
        <div role="group" aria-label={t("Destacar um sistema", "Highlight a system")} className="flex flex-wrap gap-2">
          {grupos.map((x) => (
            <button
              key={x.g}
              type="button"
              aria-pressed={grupo === x.g}
              onClick={() => choose(x.g)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[12.5px] font-medium transition-colors",
                grupo === x.g ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:border-foreground/40",
              )}
            >
              {x.cor && <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: x.cor }} aria-hidden />}
              {x.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-background">
          {/* no celular o desenho fica no tamanho de leitura e anda de lado; reduzido para caber, os pinos sumiriam */}
          <p className="border-b border-border px-3 py-2 font-mono text-[11px] text-muted-foreground lg:hidden">
            {t("← arraste o desenho para os lados para ver tudo →", "← drag the diagram sideways to see all of it →")}
          </p>
          <div className="overflow-x-auto bg-white" data-lenis-prevent-horizontal="">
            <div
              // a chave remonta o quadro na troca de idioma: o ref pega o SVG novo
              key={locale}
              ref={box}
              role="img"
              aria-label={t(
                "Esquema de ligações da CNC: fonte 12 V, divisor P4, step-down do servo, Arduino Uno com CNC Shield, dois drivers, dois motores, dois fins de curso, servo e USB",
                "CNC wiring diagram: 12 V supply, P4 splitter, servo step-down, Arduino Uno with CNC Shield, two drivers, two motors, two limit switches, servo and USB",
              )}
              className="min-w-[820px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              onPointerOver={(e) => {
                if (e.pointerType !== "mouse") return;
                const el = target(e);
                setTip(el?.dataset.tip ?? null);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setTip(null);
              }}
              onClick={(e) => {
                const el = target(e);
                if (!el) return;
                setTip(el.dataset.tip ?? null);
                setPicked(el);
                const g = el.dataset.g as Grupo | undefined;
                if (g && GRUPOS.some((x) => x.g === g)) setGrupo(g);
              }}
              dangerouslySetInnerHTML={{ __html: ESQUEMA[locale] }}
            />
          </div>
          <p className="flex min-h-[52px] items-start gap-2.5 border-t border-border bg-surface px-4 py-3 text-[14px] leading-relaxed" aria-live="polite">
            <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className={tip ? "text-foreground" : "text-muted-foreground"}>{tip ?? t(HINT)}</span>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-5">
        <p className="text-[15px] font-semibold text-foreground">{info.title}</p>
        <ul className="mt-3 space-y-2">
          {info.body.map((b, i) => (
            <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed text-muted-foreground">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
              <span className="min-w-0">{fmt(b)}</span>
            </li>
          ))}
        </ul>
      </div>

      <DetailFigures />
    </div>
  );
}

/** os três desenhos pequenos do pacote: o que mais dá problema na ligação */
function DetailFigures() {
  const t = useT();
  const locale = useLocale();
  const detalhes = useLocalized(guia.ligacoes.detalhes);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {t("Três pontos que, ligados errado, travam a máquina ou queimam componente", "Three spots that, wired wrong, stall the machine or burn out a part")}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {detalhes.map((d, i) => (
          <article key={d.title} className="flex min-w-0 flex-col rounded-lg border border-border bg-background p-4">
            {/* desenho estático do próprio pacote, sem nada vindo de fora */}
            <div
              role="img"
              aria-label={t(DETALHES[i].label)}
              className="overflow-hidden rounded-md border border-border bg-white [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: DETALHES[i].svg[locale] }}
            />
            <h5 className="mt-4 font-semibold text-foreground">{d.title}</h5>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{fmt(d.text)}</p>
            <ul className="mt-3 space-y-2">
              {d.itens.map((it, j) => (
                <li key={j} className="flex gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
                  <span className="min-w-0">{fmt(it)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
