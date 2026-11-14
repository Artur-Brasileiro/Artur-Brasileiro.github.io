/**
 * Esquema de ligações da CNC, no capítulo 08 do guia.
 *
 * O desenho é o do pacote do projeto (esquemas/ligacoes.html), trazido como
 * SVG: cada fio e cada peça têm `data-g` (o sistema) e `data-tip` (o que é).
 * Tocar num sistema apaga o resto; passar o mouse ou tocar num fio mostra o
 * texto dele na faixa embaixo do desenho, que funciona igual no celular.
 */
import { useCallback, useState, type ReactNode } from "react";
import { MousePointerClick } from "lucide-react";
import { fmt } from "@/components/guide/kit";
import { guia } from "@/data/cncGuia";
import { cn } from "@/lib/utils";
import esquema from "./fiacao/esquema.svg?raw";
import fimDeCurso from "./fiacao/fim-de-curso.svg?raw";
import bobinas from "./fiacao/bobinas.svg?raw";
import driver from "./fiacao/driver.svg?raw";

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

const GRUPOS: { g: Grupo; label: string; cor?: string; title: string; body: ReactNode[] }[] = [
  {
    g: "all",
    label: "Tudo",
    title: "Visão geral",
    body: [
      "Dois circuitos de energia, com o **GND em comum** porque os dois vêm da mesma fonte:",
      "**12 V** → CNC Shield → drivers → motores.",
      "**12 V → 5 V** (step-down) → servo da caneta.",
      "O Arduino recebe a lógica e o G-code pelo **USB**. Os sinais de controle (fins de curso e servo) saem do conector END STOPS.",
    ],
  },
  {
    g: "p12",
    label: "Alimentação 12 V",
    cor: "#d7263d",
    title: "Alimentação 12 V",
    body: [
      "Fonte 12 V / 5 A → divisor Y P4 → 2 jacks P4 fêmea com borne.",
      "**Jack A** → borne do CNC Shield (motores). **Jack B** → step-down (servo).",
      "Os dois fios da fonte são pretos: identifique o + com o multímetro.",
      "Polaridade invertida no shield queima os drivers.",
    ],
  },
  {
    g: "p5",
    label: "5 V do servo",
    cor: "#f08a00",
    title: "5 V do servo",
    body: [
      "O servo tem um **step-down próprio**. No 5 V do Arduino, que vem do USB, o pico de corrente dele resetava a placa no meio do desenho (`UnexpectedReset` no LaserGRBL, origem perdida).",
      "Ajuste a saída para **5,0 V** antes de conectar o servo.",
      "OUT+ → fio vermelho; OUT− → fio marrom ou preto.",
    ],
  },
  {
    g: "mot",
    label: "Motores",
    cor: "#2563a8",
    title: "Motores e drivers",
    body: [
      "**X = eixo longo** (ponte, 810 mm). **Y = eixo curto** (carro, 390 mm).",
      "NEMA 17 17HS4401S: 1,7 A/fase, ~1,5 Ω, 200 passos/volta.",
      "Micropasso 1/16 + polia GT2 20T (40 mm/volta) → **80 passos/mm**. Vref ≈ 0,60 V ≈ 1,5 A.",
      "Sentido errado: `$3` (1 = inverte X, 2 = inverte Y, 3 = os dois).",
    ],
  },
  {
    g: "end",
    label: "Fins de curso",
    cor: "#8e44ad",
    title: "Fins de curso",
    body: [
      "Microswitch com rolete, COM + NO, `$5=0`.",
      "**X:** ponte toda à direita (X+) → pinos X+. **Y:** acionado pelo dedo do carro no fundo (Y+) → pinos Y+.",
      "Alarme falso com o motor andando: 100 nF entre sinal e GND, perto do shield.",
      "Teste: `?` no Monitor Serial mostra `Pn:X` / `Pn:Y`.",
    ],
  },
  {
    g: "srv",
    label: "Servo",
    cor: "#c9a100",
    title: "Servo da caneta",
    body: [
      "Sinal no **Z+ branco (D11)**: é a saída PWM do spindle no GRBL 1.1.",
      "`$32=0` (modo laser desligado) e `$30=255`.",
      "**`M5`** = caneta em cima: o GRBL executa `M5` ao ligar, resetar ou entrar em alarme, então qualquer pane levanta a caneta. **`M3 S220`** = caneta embaixo.",
      "Depois de cada `M3`/`M5`: `G4 P0.3`, para o servo terminar o curso.",
    ],
  },
  {
    g: "usb",
    label: "USB / PC",
    cor: "#6b7280",
    title: "USB e PC",
    body: [
      "LaserGRBL na porta COM, **115200** baud.",
      "Ao abrir a porta, o Uno reinicia: refaça o `$H`.",
      "Só um programa usa a porta por vez (feche o LaserGRBL para usar o Monitor Serial).",
      "Não aceite ativar o “Laser Mode” (`$32=1`): o servo para.",
    ],
  },
];

const DETALHES = [
  { svg: fimDeCurso, label: "Fim de curso: COM, NO e NC" },
  { svg: bobinas, label: "As duas bobinas do motor" },
  { svg: driver, label: "Driver e jumpers de micropasso" },
];

const HINT = "Passe o mouse ou toque num fio ou peça para ver o que ele faz.";

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
  const [grupo, setGrupo] = useState<Grupo>("all");
  const [tip, setTip] = useState<string | null>(null);
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);

  // o SVG vem pronto (innerHTML); as classes de destaque são postas direto nele
  const paint = useCallback(
    (g: Grupo, picked: Element | null) => {
      if (!svgEl) return;
      svgEl.classList.toggle("dim", g !== "all");
      svgEl.querySelectorAll<SVGElement>("[data-g]").forEach((el) => {
        el.classList.toggle("hl", g !== "all" && el.dataset.g === g);
        el.classList.toggle("on", el === picked);
      });
    },
    [svgEl],
  );

  const box = useCallback((node: HTMLDivElement | null) => {
    setSvgEl(node?.querySelector("svg") ?? null);
  }, []);

  const choose = (g: Grupo) => {
    setGrupo(g);
    paint(g, null);
    setTip(null);
  };

  const target = (e: React.SyntheticEvent) => (e.target as Element).closest?.("[data-tip]") as SVGElement | null;

  const info = GRUPOS.find((x) => x.g === grupo)!;

  return (
    <div className="cncf space-y-6" style={VARS}>
      <style>{CSS}</style>

      <div ref={wideRef} className={cn("flex flex-col gap-3", wideClassName)}>
        <div role="group" aria-label="Destacar um sistema" className="flex flex-wrap gap-2">
          {GRUPOS.map((x) => (
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
          <p className="border-b border-border px-3 py-2 font-mono text-[11px] text-muted-foreground lg:hidden">← arraste o desenho para os lados para ver tudo →</p>
          <div className="overflow-x-auto bg-white" data-lenis-prevent-horizontal="">
            <div
              ref={box}
              role="img"
              aria-label="Esquema de ligações da CNC: fonte 12 V, divisor P4, step-down do servo, Arduino Uno com CNC Shield, dois drivers, dois motores, dois fins de curso, servo e USB"
              className="min-w-[820px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              onPointerOver={(e) => {
                if (e.pointerType !== "mouse") return;
                const t = target(e);
                setTip(t?.dataset.tip ?? null);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setTip(null);
              }}
              onClick={(e) => {
                const t = target(e);
                if (!t) return;
                setTip(t.dataset.tip ?? null);
                const g = t.dataset.g as Grupo | undefined;
                if (g && GRUPOS.some((x) => x.g === g)) {
                  setGrupo(g);
                  paint(g, t);
                } else paint(grupo, t);
              }}
              dangerouslySetInnerHTML={{ __html: esquema }}
            />
          </div>
          <p className="flex min-h-[52px] items-start gap-2.5 border-t border-border bg-surface px-4 py-3 text-[14px] leading-relaxed" aria-live="polite">
            <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className={tip ? "text-foreground" : "text-muted-foreground"}>{tip ?? HINT}</span>
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
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Três pontos que, ligados errado, travam a máquina ou queimam componente</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {guia.ligacoes.detalhes.map((d, i) => (
          <article key={d.title} className="flex min-w-0 flex-col rounded-lg border border-border bg-background p-4">
            {/* desenho estático do próprio pacote, sem nada vindo de fora */}
            <div
              role="img"
              aria-label={DETALHES[i].label}
              className="overflow-hidden rounded-md border border-border bg-white [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: DETALHES[i].svg }}
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
