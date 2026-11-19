/**
 * A fiação do pêndulo invertido: o diagrama da bancada (fonte, divisor Y,
 * Arduino, protoboard com o driver, motor e encoder), a lista de ligações ponto
 * a ponto, a calculadora do Vref do driver e a ordem segura para ligar.
 *
 * Dois jeitos de ler o desenho:
 *  - tocar numa cor da legenda (ou num fio, ou passar o mouse numa linha da
 *    tabela) destaca só aquela rede;
 *  - "Montar fio a fio" anda pela ordem segura de montagem: o fio da vez aceso,
 *    os já feitos apagados e os próximos quase sumidos. Os do motor ficam por
 *    último, depois do ajuste do Vref. No celular o desenho rola até o fio.
 *
 * O botão A4988/DRV8825 troca os nomes dos pinos, a fórmula do Vref e o único
 * fio que muda entre os dois drivers.
 *
 * SVG puro, sem three: pesa pouco e não precisa de carga sob demanda. Veio do
 * pacote do projeto (fiacao.html); daqui saíram o modo fio a fio, o destaque
 * pelo próprio fio e os rótulos que os fios atropelavam.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, ListOrdered, X } from "lucide-react";
import { formatNumber, tr, type Tx } from "@/i18n/core";
import { useLocale, useT } from "@/i18n/react";
import { cn } from "@/lib/utils";

/** texto nos dois idiomas (tr) ou que não muda (nome de pino, sigla) */
type Text = string | Tx;

/**
 * Longe da tela, o navegador pula o layout de cada bloco (o capítulo da
 * fiação é o mais pesado da página). Vai em cada bloco, não no capítulo: a
 * contenção corta o que sai da caixa, e o desenho sai da coluna do texto.
 */
const lazy = (h: number) => `[content-visibility:auto] [contain-intrinsic-size:auto_${h}px]`;

type Driver = "A4988" | "DRV8825";
type Net = "p12" | "p5" | "gnd" | "coilA" | "coilB" | "step" | "dir" | "en" | "encA" | "encB" | "jmp";

/* ---------- cores dos fios (as de bancada: vermelho é 12 V, laranja é 5 V...) ---------- */
const C = {
  w12: "#d6332a",
  w5: "#ea8a17",
  gnd: "#202423",
  step: "#8b5cf6",
  dir: "#0f9b9b",
  en: "#a5692c",
  a: "#2f9a4a",
  b: "#f4f4f2",
  blue: "#2c6fd6",
  jump: "#8a9490",
  edge: "#15171a",
  pin: "#d9b44a",
  pcb: "#1f5a8c",
  pcbInk: "#e9f1f8",
  ard: "#14808a",
  ardInk: "#e6f6f6",
  mark: "#94600f",
};

const NETS: Record<Net, { name: Text; col: string; col2?: string }> = {
  p12: { name: "+12 V", col: C.w12 },
  p5: { name: "+5 V", col: C.w5 },
  gnd: { name: "GND", col: C.gnd },
  coilA: { name: tr("Bobina A (preto/verde)", "Coil A (black/green)"), col: C.gnd, col2: C.a },
  coilB: { name: tr("Bobina B (vermelho/azul)", "Coil B (red/blue)"), col: C.w12, col2: C.blue },
  step: { name: "STEP", col: C.step },
  dir: { name: "DIR", col: C.dir },
  en: { name: "EN", col: C.en },
  encA: { name: "Encoder A", col: C.a },
  encB: { name: "Encoder B", col: C.b },
  jmp: { name: "RST–SLP", col: C.jump },
};

type P = [number, number];
/** os fios, na mesma ordem das linhas de ROWS (fio i = linha i) */
const WIRES: { n: Net; c: string; p: P[]; vdd?: boolean }[] = [
  { n: "p12", c: C.w12, p: [[448, 58], [490, 58], [490, 46], [540, 46]] },
  { n: "gnd", c: C.gnd, p: [[448, 86], [500, 86], [500, 74], [540, 74]] },
  { n: "p12", c: C.w12, p: [[630, 140], [630, 46]] },
  { n: "gnd", c: C.gnd, p: [[660, 140], [660, 74]] },
  { n: "p5", c: C.w5, p: [[200, 640], [200, 700], [960, 700], [960, 290], [925, 290]] },
  { n: "gnd", c: C.gnd, p: [[216, 640], [216, 690], [950, 690], [950, 308], [925, 308]] },
  { n: "p5", c: C.w5, p: [[810, 140], [810, 124], [890, 124], [890, 290]], vdd: true },
  { n: "gnd", c: C.gnd, p: [[840, 140], [875, 140], [875, 308]] },
  { n: "p5", c: C.w5, p: [[690, 220], [690, 290]] },
  { n: "jmp", c: C.jump, p: [[750, 220], [750, 242], [780, 242], [780, 220]] },
  { n: "step", c: C.step, p: [[810, 220], [810, 360], [214, 360], [214, 430]] },
  { n: "dir", c: C.dir, p: [[840, 220], [840, 375], [230, 375], [230, 430]] },
  { n: "en", c: C.en, p: [[630, 220], [630, 345], [198, 345], [198, 430]] },
  { n: "coilA", c: C.gnd, p: [[750, 140], [750, 102], [975, 102]] },
  { n: "coilA", c: C.a, p: [[780, 140], [780, 110], [975, 110]] },
  { n: "coilB", c: C.w12, p: [[720, 140], [720, 94], [975, 94]] },
  { n: "coilB", c: C.blue, p: [[690, 140], [690, 86], [975, 86]] },
  { n: "p5", c: C.w5, p: [[900, 555], [915, 555], [915, 290]] },
  { n: "gnd", c: C.gnd, p: [[900, 540], [905, 540], [905, 308]] },
  { n: "encA", c: C.a, p: [[600, 515], [560, 515], [560, 412], [334, 412], [334, 430]] },
  { n: "encB", c: C.b, p: [[600, 500], [575, 500], [575, 400], [318, 400], [318, 430]] },
];

const PINS = {
  A4988: { top: ["VMOT", "GND", "2B", "2A", "1A", "1B", "VDD", "GND"], bot: ["EN", "MS1", "MS2", "MS3", "RST", "SLP", "STEP", "DIR"] },
  DRV8825: { top: ["VMOT", "GND", "B2", "B1", "A1", "A2", "FLT", "GND"], bot: ["EN", "M0", "M1", "M2", "RST", "SLP", "STEP", "DIR"] },
};
const PX = [630, 660, 690, 720, 750, 780, 810, 840];
const DIG: [number, number][] = [[13, 150], [12, 166], [11, 182], [10, 198], [9, 214], [8, 230], [7, 254], [6, 270], [5, 286], [4, 302], [3, 318], [2, 334], [1, 350], [0, 366]];
const PWR: [string, number][] = [["IOREF", 152], ["RST", 168], ["3V3", 184], ["5V", 200], ["GND", 216], ["GND", 232], ["VIN", 248]];

/** linhas da tabela: [rede, fio, de, para]; as que mudam com o driver levam uma função */
type Row = { n: Net; wire: Text; from: (d: Driver) => Text; to: (d: Driver) => Text; color?: string; dim?: (d: Driver) => boolean; tip?: (d: Driver) => Text };
const dd = (d: Driver) => d === "DRV8825";
/* faixas da protoboard, repetidas em várias linhas */
const RAIL12 = tr("Faixa +12 V", "+12 V rail");
const RAIL5 = tr("Faixa +5 V", "+5 V rail");
const GND_TOP = tr("Faixa GND de cima", "Top GND rail");
const GND_BOT = tr("Faixa GND de baixo", "Bottom GND rail");
const BLACK = tr("preto", "black");
const GREEN = tr("verde", "green");
const RED = tr("vermelho", "red");
const ROWS: Row[] = [
  {
    n: "p12",
    wire: "+12 V",
    from: () => tr("Borne + da P4 fêmea", "+ terminal of the female P4"),
    to: () => tr("Faixa +12 V da protoboard", "Breadboard +12 V rail"),
    tip: () => tr("A P4 fêmea recebe o ramo do divisor Y que não vai no Arduino.", "The female P4 takes the Y splitter branch that doesn't go to the Arduino."),
  },
  { n: "gnd", wire: "GND", from: () => tr("Borne − da P4 fêmea", "− terminal of the female P4"), to: () => GND_TOP },
  { n: "p12", wire: "+12 V", from: () => "Driver VMOT", to: () => RAIL12, tip: () => tr("O capacitor fica entre esta faixa e o GND, perto deste pino.", "The capacitor goes between this rail and GND, close to this pin.") },
  { n: "gnd", wire: "GND", from: () => tr("Driver GND (ao lado do VMOT)", "Driver GND (next to VMOT)"), to: () => GND_TOP },
  { n: "p5", wire: "+5 V", from: () => "Arduino 5V", to: () => tr("Faixa +5 V de baixo", "Bottom +5 V rail") },
  {
    n: "gnd",
    wire: "GND",
    from: () => "Arduino GND",
    to: () => GND_BOT,
    tip: () =>
      tr(
        "É este fio que junta o terra do Arduino com o do driver: sem ele, os sinais não têm referência.",
        "This is the wire that ties the Arduino's ground to the driver's: without it, the signals have no reference.",
      ),
  },
  {
    n: "p5",
    wire: "+5 V",
    from: (d) => (dd(d) ? "Driver FLT" : "Driver VDD"),
    to: (d) => (dd(d) ? tr("não ligar", "do not connect") : RAIL5),
    dim: dd,
    tip: (d) =>
      dd(d)
        ? tr(
            "No DRV8825 este pino é o FLT (falha): fica solto, ele gera a própria alimentação da lógica.",
            "On the DRV8825 this pin is FLT (fault): leave it unconnected, the driver makes its own logic supply.",
          )
        : tr("Alimenta a lógica do driver.", "Powers the driver's logic."),
  },
  { n: "gnd", wire: "GND", from: () => tr("Driver GND (último pino)", "Driver GND (last pin)"), to: () => GND_BOT },
  {
    n: "p5",
    wire: "+5 V",
    from: (d) => (dd(d) ? "Driver M1" : "Driver MS2"),
    to: () => tr("Faixa +5 V (1/4 de passo)", "+5 V rail (1/4 step)"),
    tip: () =>
      tr(
        "Só este pino em 5 V: 1/4 de passo, 800 passos por volta. Os outros dois ficam soltos.",
        "Only this pin at 5 V: 1/4 step, 800 steps per revolution. The other two stay unconnected.",
      ),
  },
  { n: "jmp", wire: "jumper", from: () => "Driver RST", to: () => "Driver SLP", tip: () => tr("Sem esse jumper o driver fica dormindo e o motor não anda.", "Without this jumper the driver stays asleep and the motor won't move.") },
  {
    n: "step",
    wire: "STEP",
    from: () => "Driver STEP",
    to: () => "Arduino D9",
    tip: () => tr("Cada pulso é um passo; o firmware gera os pulsos pelo Timer1.", "Each pulse is one step; the firmware generates the pulses with Timer1."),
  },
  { n: "dir", wire: "DIR", from: () => "Driver DIR", to: () => "Arduino D8" },
  { n: "en", wire: "EN", from: () => "Driver EN", to: () => "Arduino D10", tip: () => tr("LOW liga o motor.", "LOW enables the motor.") },
  { n: "coilA", wire: BLACK, color: C.gnd, from: (d) => (dd(d) ? "Driver A1" : "Driver 1A"), to: () => "Motor A+" },
  {
    n: "coilA",
    wire: GREEN,
    color: C.a,
    from: (d) => (dd(d) ? "Driver A2" : "Driver 1B"),
    to: () => "Motor A−",
    tip: () => tr("Preto e verde são uma bobina: no multímetro, uns 1,5 a 2 Ω entre eles.", "Black and green are one coil: on the multimeter, about 1.5 to 2 Ω between them."),
  },
  { n: "coilB", wire: RED, color: C.w12, from: (d) => (dd(d) ? "Driver B1" : "Driver 2A"), to: () => "Motor B+" },
  {
    n: "coilB",
    wire: tr("azul", "blue"),
    color: C.blue,
    from: (d) => (dd(d) ? "Driver B2" : "Driver 2B"),
    to: () => "Motor B−",
    tip: () => tr("Se o motor só vibrar, inverta os dois fios de uma das bobinas.", "If the motor only vibrates, swap the two wires of one of the coils."),
  },
  { n: "p5", wire: RED, color: C.w12, from: () => "Encoder VCC", to: () => RAIL5 },
  { n: "gnd", wire: BLACK, color: C.gnd, from: () => tr("Encoder GND (e malha)", "Encoder GND (and shield)"), to: () => GND_BOT },
  {
    n: "encA",
    wire: GREEN,
    from: () => "Encoder A",
    to: () => "Arduino D2",
    tip: () => tr("D2 e D3 são os únicos pinos do UNO com interrupção externa.", "D2 and D3 are the only UNO pins with external interrupts."),
  },
  { n: "encB", wire: tr("branco", "white"), from: () => "Encoder B", to: () => "Arduino D3" },
];

/**
 * A ordem de montagem: tudo menos o motor, o ajuste do Vref e só então o
 * motor. Os passos sem fio (`note`) marcam uma peça no desenho.
 */
type Step = { row: number } | { note: "inicio" | "vref" | "fim" };
const STEPS: Step[] = [
  { note: "inicio" },
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17, 18, 19, 20].map((row) => ({ row })),
  { note: "vref" },
  ...[13, 14, 15, 16].map((row) => ({ row })),
  { note: "fim" },
];
/** em que passo cada linha da tabela é montada */
const STEP_OF_ROW = Object.fromEntries(STEPS.flatMap((s, i) => ("row" in s ? [[s.row, i]] : []))) as Record<number, number>;

const path = (p: P[]) => "M" + p.map((q) => q.join(" ")).join(" L");

function Swatch({ col, col2 }: { col: string; col2?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-[22px] shrink-0 rounded-full border border-foreground/80"
      style={{ background: col2 ? `linear-gradient(90deg, ${col} 50%, ${col2} 50%)` : col }}
      aria-hidden
    />
  );
}

/** argola pulsando em volta de uma peça (passos sem fio) ou da ponta do fio da vez */
const Pulse = ({ x, y, r, color = C.mark }: { x: number; y: number; r: number; color?: string }) => (
  <g pointerEvents="none">
    <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2.5} />
    <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2} className="motion-safe:animate-ping" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
  </g>
);

const H4 = ({ children }: { children: React.ReactNode }) => (
  <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{children}</h4>
);

type Props = {
  /** classes da faixa larga (o desenho), para ela sair da coluna do texto */
  wideClassName?: string;
  /** a faixa larga, para quem precisa saber quando ela está na tela */
  wideRef?: React.Ref<HTMLDivElement>;
};

export default function PenduloFiacao({ wideClassName, wideRef }: Props) {
  const [driver, setDriver] = useState<Driver>("A4988");
  const [locked, setLocked] = useState<Net | null>(null);
  const [hover, setHover] = useState<Net | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [current, setCurrent] = useState("1.0");
  const [rs, setRs] = useState("0.1");
  const [copied, setCopied] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const focus = step === null ? (hover ?? locked) : null;
  const drv = dd(driver);
  // todo texto sai daqui, na renderização: a troca de idioma não remonta a página
  const t = useT();
  const locale = useLocale();
  /** "0,80" no português, "0.80" no inglês */
  const nf2 = (n: number) => formatNumber(n, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const vref = useMemo(() => {
    const I = Math.max(0, parseFloat(current.replace(",", ".")) || 0);
    return drv ? I / 2 : I * 8 * parseFloat(rs);
  }, [current, rs, drv]);

  const cur = step === null ? null : STEPS[step];
  const curRow = cur && "row" in cur ? cur.row : null;

  /** a linha (= o fio) i já foi montada, é a da vez, ou ainda vem? */
  const phase = (i: number): "done" | "now" | "next" => {
    if (step === null) return "done";
    const at = STEP_OF_ROW[i];
    return at < step ? "done" : at === step ? "now" : "next";
  };

  // no celular o desenho é mais largo que a tela: rola até o fio da vez
  useEffect(() => {
    const el = scroller.current;
    if (!el || step === null || el.scrollWidth <= el.clientWidth) return;
    const s = STEPS[step];
    const xs = "row" in s ? WIRES[s.row].p.map((q) => q[0]) : s.note === "vref" ? [660] : s.note === "inicio" ? [585, 740] : [0, 1110];
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    el.scrollTo({ left: (cx / 1110) * el.scrollWidth - el.clientWidth / 2, behavior: "smooth" });
  }, [step]);

  const go = (d: number) => setStep((s) => (s === null ? 0 : Math.min(STEPS.length - 1, Math.max(0, s + d))));
  const startSteps = (at = 0) => {
    setLocked(null);
    setStep(at);
  };

  const ms = drv ? "M1" : "MS2";
  const code = t(
    `#define PIN_STEP  9
#define PIN_DIR   8
#define PIN_EN   10   // LOW = motor ligado
#define ENC_A     2   // interrupção 0
#define ENC_B     3   // interrupção 1
// ${ms} em 5V: 1/4 de passo = 800 passos/volta
// polia GT2 30 dentes: 60 mm/volta = 0,075 mm/passo`,
    `#define PIN_STEP  9
#define PIN_DIR   8
#define PIN_EN   10   // LOW = motor on
#define ENC_A     2   // interrupt 0
#define ENC_B     3   // interrupt 1
// ${ms} at 5V: 1/4 step = 800 steps/rev
// GT2 pulley, 30 teeth: 60 mm/rev = 0.075 mm/step`,
  );

  const copy = () => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  const pins = PINS[driver];
  const mono = "IBM Plex Mono, ui-monospace, monospace";

  /* o que o passo da vez diz */
  const stepText = (() => {
    if (!cur) return null;
    if ("note" in cur) {
      if (cur.note === "inicio")
        return {
          title: t("Com tudo desligado", "With everything off"),
          body: t(
            "Encaixe o driver no meio da protoboard, uma fileira de pinos de cada lado do canal, e o capacitor de 100 µF entre +12 V e GND, bem perto do VMOT. A perna mais curta vai no GND.",
            "Seat the driver across the middle of the breadboard, one row of pins on each side of the channel, and the 100 µF capacitor between +12 V and GND, right next to VMOT. The shorter leg goes to GND.",
          ),
        };
      if (cur.note === "vref")
        return {
          title: t(`Ajuste o Vref: ${nf2(vref)} V`, `Set Vref: ${nf2(vref)} V`),
          body: t(
            "Ainda sem o motor: ligue a fonte e o USB, encoste a ponta vermelha do multímetro no parafuso do potenciômetro e a preta no GND, e gire até marcar o valor da calculadora abaixo. Depois desligue a fonte.",
            "Still without the motor: turn on the power supply and plug in the USB, touch the multimeter's red probe to the potentiometer screw and the black one to GND, and turn it until it reads the value from the calculator below. Then turn off the power supply.",
          ),
        };
      return {
        title: t("Pronto", "Done"),
        body: t(
          "Todos os fios no lugar. Confira as bobinas e o encoder na lista abaixo, grave o firmware e ligue a fonte com o carro no batente do motor.",
          "Every wire in place. Check the coils and the encoder in the list below, flash the firmware and turn on the power supply with the cart against the motor-side end stop.",
        ),
      };
    }
    const r = ROWS[cur.row];
    const tip = r.tip?.(driver);
    return { title: `${t(r.from(driver))} → ${t(r.to(driver))}`, body: tip ? t(tip) : "", row: r };
  })();

  return (
    <div className="flex flex-col gap-6" data-pendulo-fiacao="">
      {/* a faixa larga: driver, desenho, passo a passo e legenda */}
      <div ref={wideRef} className={cn("flex flex-col gap-3", lazy(900), wideClassName)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[12px] text-muted-foreground">
            {t("fonte 12 V · divisor Y", "12 V power supply · Y splitter")} · Arduino UNO · {driver} · NEMA 17 17HS4401S · LPD3806-1000BM
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Driver:</span>
            <div role="group" aria-label={t("Modelo do driver", "Driver model")} className="flex rounded-md border border-border bg-background p-0.5">
              {(["A4988", "DRV8825"] as Driver[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={driver === d}
                  onClick={() => setDriver(d)}
                  className={cn("rounded-[5px] px-3 py-1.5 font-mono text-[11.5px] transition-colors", driver === d ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5")}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-background">
          {/* passo a passo */}
          <div className="border-b border-border">
            {step === null ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => startSteps()}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 font-mono text-[12px] font-medium text-primary-foreground shadow-soft-sm transition-colors hover:bg-primary-hover"
                >
                  <ListOrdered className="h-4 w-4" aria-hidden />
                  {t("Montar fio a fio", "Wire it step by step")}
                </button>
                <p className="text-[13px] text-muted-foreground">
                  {t(
                    `${STEPS.length} passos na ordem segura, com o motor por último. Ou toque numa cor, ou num fio, para seguir só aquela ligação.`,
                    `${STEPS.length} steps in the safe order, with the motor last. Or tap a color, or a wire, to follow just that connection.`,
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 px-3 py-2.5" aria-live="polite">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    disabled={step === 0}
                    aria-label={t("Passo anterior", "Previous step")}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-35"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <span className="w-[54px] text-center font-mono text-[11px] tabular-nums text-muted-foreground">
                    <span className="text-foreground">{String(step + 1).padStart(2, "0")}</span>/{STEPS.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    disabled={step === STEPS.length - 1}
                    aria-label={t("Próximo passo", "Next step")}
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-35"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(null)}
                  aria-label={t("Sair do passo a passo", "Exit step by step")}
                  className="col-start-3 row-start-1 flex h-9 w-9 justify-self-end items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="col-span-3 min-w-0 pt-0.5 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                  <p className="flex items-center gap-2 text-[14px] font-medium leading-snug text-foreground">
                    {stepText?.row && <Swatch col={stepText.row.color ?? NETS[stepText.row.n].col} />}
                    <span className="min-w-0">{stepText?.title}</span>
                  </p>
                  {stepText?.body && <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{stepText.body}</p>}
                </div>

              </div>
            )}
            {step !== null && (
              <div className="h-[2px] bg-border">
                <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
            )}
          </div>

          {/* no celular o desenho fica no tamanho de leitura e anda de lado; reduzido para caber, os pinos sumiriam */}
          <p className="border-b border-border px-3 py-2 font-mono text-[11px] text-muted-foreground lg:hidden">
            {t("← arraste o desenho para os lados para ver tudo →", "← drag the diagram sideways to see all of it →")}
          </p>
          <div
            ref={scroller}
            className="overflow-x-auto bg-card [background-image:linear-gradient(hsl(var(--border)/.55)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/.55)_1px,transparent_1px)] [background-size:20px_20px]"
            data-lenis-prevent-horizontal=""
          >
            <svg viewBox="0 0 1110 720" className="block h-auto w-full min-w-[820px]" role="img"
              aria-label={t(
                "Diagrama de ligação: fonte, divisor Y, Arduino, protoboard com o driver, motor e encoder",
                "Wiring diagram: power supply, Y splitter, Arduino, breadboard with the driver, motor and encoder",
              )}
            >
              <defs>
                <pattern id="pf-holes" width="15" height="12" patternUnits="userSpaceOnUse">
                  <rect x="6" y="4.5" width="3" height="3" rx=".6" fill="#d6d6d1" />
                </pattern>
              </defs>

              {/* cabos P4 */}
              <g fill="none" stroke="#3b4240" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M174 72 H240" />
                <path d="M272 64 H330" />
                <path d="M272 80 H290 V150 H14 V600 H24" />
              </g>

              {/* fonte */}
              <rect x="24" y="40" width="150" height="64" rx="5" fill="#fff" stroke={C.edge} strokeWidth={1.5} />
              <text x="40" y="66" fontSize="15" fontFamily={mono} fontWeight={600} fill={C.edge}>
                {t("FONTE", "POWER SUPPLY")}
              </text>
              <text x="40" y="88" fontSize="13" fontFamily={mono} fill={C.edge}>
                12 V · 5 A
              </text>

              {/* divisor Y */}
              <path d="M240 62 h14 l18 -6 v16 l-18 0 l18 0 v16 l-18 -6 h-14 z" fill="#fff" stroke={C.edge} strokeWidth={1.5} />
              <text x="222" y="44" fontSize="11.5" fontFamily={mono} fill={C.edge}>
                {t("divisor Y P4", "P4 Y splitter")}
              </text>

              {/* P4 fêmea com borne */}
              <rect x="330" y="40" width="120" height="64" rx="5" fill="#fff" stroke={C.edge} strokeWidth={1.5} />
              <text x="342" y="64" fontSize="11.5" fontFamily={mono} fill={C.edge}>
                {t("P4 fêmea", "female P4")}
              </text>
              <text x="342" y="80" fontSize="11.5" fontFamily={mono} fill={C.edge}>
                {t("+ borne", "+ terminal")}
              </text>
              <rect x="432" y="50" width="16" height="16" rx="2" fill={C.w12} stroke={C.edge} />
              <text x="440" y="62" fontSize="12" textAnchor="middle" fill="#fff" fontWeight={700}>
                +
              </text>
              <rect x="432" y="78" width="16" height="16" rx="2" fill={C.gnd} stroke={C.edge} />
              <text x="440" y="90" fontSize="13" textAnchor="middle" fill="#fff" fontWeight={700}>
                −
              </text>

              {/* protoboard */}
              <rect x="520" y="24" width="420" height="306" rx="6" fill="#fbfbf8" stroke="#c9c9c3" strokeWidth={1.5} />
              <rect x="530" y="92" width="400" height="80" fill="url(#pf-holes)" />
              <rect x="530" y="188" width="400" height="80" fill="url(#pf-holes)" />
              <rect x="526" y="176" width="408" height="8" fill="#ecebe6" />
              <line x1="530" y1="46" x2="930" y2="46" stroke={C.w12} strokeWidth={2.5} opacity={0.55} />
              <line x1="530" y1="74" x2="930" y2="74" stroke={C.blue} strokeWidth={2.5} opacity={0.55} />
              <line x1="530" y1="290" x2="930" y2="290" stroke={C.w5} strokeWidth={2.5} opacity={0.7} />
              <line x1="530" y1="308" x2="930" y2="308" stroke={C.blue} strokeWidth={2.5} opacity={0.55} />
              <g fontFamily={mono} fontSize="10.5" fill={C.edge}>
                <text x="896" y="40" textAnchor="end">
                  +12 V
                </text>
                {/* do lado esquerdo: à direita os fios do motor passavam por cima */}
                <text x="548" y="89">
                  GND
                </text>
                <text x="548" y="284">
                  +5 V
                </text>
                <text x="548" y="324">
                  GND
                </text>
                <text x="930" y="20" fontSize="11" textAnchor="end">
                  {t("protoboard 400 pontos", "400-point breadboard")}
                </text>
              </g>

              {/* capacitor */}
              <circle cx="585" cy="60" r="11.5" fill="#222a33" stroke={C.edge} strokeWidth={1.2} />
              <path d="M577 66 a11.5 11.5 0 0 0 16 0" fill="none" stroke="#c9d2da" strokeWidth={3} />
              <text x="570" y="16" fontSize="11" fontFamily={mono} fill={C.edge}>
                100 µF ≥25 V
              </text>
              <line x1="585" y1="20" x2="585" y2="47" stroke="#62666d" strokeWidth={1} strokeDasharray="2 2" />

              {/* driver */}
              <rect x="612" y="128" width="246" height="104" rx="4" fill={C.pcb} stroke={C.edge} strokeWidth={1.5} />
              <rect x="712" y="166" width="46" height="30" rx="2" fill="#9aa6ad" stroke={C.edge} strokeWidth={1} />
              <g stroke={C.edge} strokeWidth={0.8} opacity={0.5}>
                {[720, 729, 738, 747].map((x) => (
                  <line key={x} x1={x} y1="166" x2={x} y2="196" />
                ))}
              </g>
              <circle cx="660" cy="181" r="6" fill="#d8d8d0" stroke={C.edge} />
              <line x1="656" y1="181" x2="664" y2="181" stroke={C.edge} strokeWidth={1.4} />
              <text x="660" y="203" fontSize="8.5" textAnchor="middle" fill={C.pcbInk} fontFamily={mono}>
                Vref
              </text>
              <text x="806" y="186" fontSize="12" textAnchor="middle" fill={C.pcbInk} fontFamily={mono} fontWeight={600}>
                {driver}
              </text>
              {PX.map((x, i) => (
                <g key={x}>
                  <circle cx={x} cy={140} r={4.2} fill={C.pin} stroke={C.edge} />
                  <circle cx={x} cy={220} r={4.2} fill={C.pin} stroke={C.edge} />
                  <text x={x} y={158} fontSize="8.6" textAnchor="middle" fill={C.pcbInk} fontFamily={mono}>
                    {pins.top[i]}
                  </text>
                  <text x={x} y={210} fontSize="8.6" textAnchor="middle" fill={C.pcbInk} fontFamily={mono}>
                    {pins.bot[i]}
                  </text>
                </g>
              ))}

              {/* motor */}
              <rect x="975" y="50" width="120" height="120" rx="10" fill="#26292b" stroke={C.edge} strokeWidth={1.5} />
              <circle cx="1035" cy="110" r="22" fill="#3a3e41" stroke="#5b6064" />
              <circle cx="1035" cy="110" r="5" fill="#b9c0c4" />
              <g fill="#5b6064">
                <circle cx="990" cy="65" r="3.5" />
                <circle cx="1080" cy="65" r="3.5" />
                <circle cx="990" cy="155" r="3.5" />
                <circle cx="1080" cy="155" r="3.5" />
              </g>
              <text x="1035" y="192" fontSize="13.5" textAnchor="middle" fontFamily={mono} fontWeight={600} fill={C.edge}>
                NEMA 17
              </text>
              <text x="1035" y="208" fontSize="11" textAnchor="middle" fontFamily={mono} fill={C.edge}>
                17HS4401S
              </text>

              {/* encoder: os rótulos do A e do B ficam por dentro, onde os fios não passam */}
              <rect x="600" y="450" width="300" height="140" rx="10" fill="#222527" stroke={C.edge} strokeWidth={1.5} />
              <circle cx="712" cy="520" r="44" fill="#2e3235" stroke="#4d5357" />
              <circle cx="712" cy="520" r="18" fill="#3b4044" stroke="#4d5357" />
              <circle cx="712" cy="520" r="5" fill="#b9c0c4" />
              <g fontFamily={mono}>
                <text x="770" y="490" fontSize="14" fill="#eef2f0" fontWeight={600}>
                  ENCODER
                </text>
                <text x="770" y="508" fontSize="11" fill="#c7cfcb">
                  LPD3806
                </text>
                <text x="770" y="524" fontSize="11" fill="#c7cfcb">
                  1000 P/R · NPN
                </text>
                <text x="610" y="503" fontSize="9" fill="#c7cfcb">
                  {t("B branco", "B white")}
                </text>
                <text x="610" y="518" fontSize="9" fill="#c7cfcb">
                  {t("A verde", "A green")}
                </text>
                <text x="892" y="543" fontSize="10" textAnchor="end" fill="#c7cfcb">
                  {t("preto GND", "black GND")}
                </text>
                <text x="892" y="566" fontSize="10" textAnchor="end" fill="#c7cfcb">
                  {t("vermelho 5 V", "red 5 V")}
                </text>
              </g>

              {/* arduino */}
              <rect x="40" y="425" width="360" height="220" rx="8" fill={C.ard} stroke={C.edge} strokeWidth={1.5} />
              <rect x="22" y="452" width="46" height="40" rx="3" fill="#c4cbcf" stroke={C.edge} />
              <text x="45" y="476" fontSize="9" textAnchor="middle" fill="#2a3134" fontFamily={mono}>
                USB
              </text>
              <rect x="22" y="586" width="40" height="28" rx="3" fill="#2a2e30" stroke={C.edge} />
              <text x="74" y="604" fontSize="9.5" fill={C.ardInk} fontFamily={mono}>
                {t("jack 12 V", "12 V jack")}
              </text>
              <rect x="134" y="424" width="248" height="13" rx="2" fill="#1d1f20" />
              <rect x="140" y="633" width="230" height="13" rx="2" fill="#1d1f20" />
              {DIG.map(([n, x]) => (
                <g key={n}>
                  <circle cx={x} cy={430} r={3.6} fill={C.pin} stroke={C.edge} />
                  <text x={x} y={452} fontSize="9.5" textAnchor="middle" fill={C.ardInk} fontFamily={mono}>
                    {n}
                  </text>
                </g>
              ))}
              {PWR.map(([n, x]) => (
                <g key={x}>
                  <circle cx={x} cy={640} r={3.6} fill={C.pin} stroke={C.edge} />
                  <text x={x} y={626} fontSize="8" textAnchor="middle" fill={C.ardInk} fontFamily={mono} transform={`rotate(-60 ${x} 626)`}>
                    {n}
                  </text>
                </g>
              ))}
              {[290, 306, 322, 338, 354, 370].map((x) => (
                <circle key={x} cx={x} cy={640} r={3.6} fill={C.pin} stroke={C.edge} />
              ))}
              <text x="220" y="535" fontSize="22" textAnchor="middle" fill={C.ardInk} fontFamily={mono} fontWeight={600}>
                ARDUINO UNO
              </text>
              <text x="220" y="558" fontSize="11" textAnchor="middle" fill={C.ardInk} fontFamily={mono} opacity={0.85}>
                {t("USB só para programar", "USB for programming only")}
              </text>

              {/* fios; o da vez (ou a rede em foco) por último, por cima dos outros */}
              {WIRES.map((w, i) => ({ w, i, ph: phase(i) }))
                .sort((a, b) => Number(a.ph === "now" || focus === a.w.n) - Number(b.ph === "now" || focus === b.w.n))
                .map(({ w, i, ph }) => {
                  const off = w.vdd && drv;
                  const on = step === null ? focus === w.n : ph === "now";
                  const opacity = step === null ? (focus !== null && !on ? 0.12 : off ? 0.35 : 1) : ph === "now" ? 1 : ph === "done" ? (cur && "note" in cur && cur.note === "fim" ? 1 : 0.3) : 0.06;
                  const d = path(w.p);
                  return (
                    <g
                      key={i}
                      style={{ opacity, transition: "opacity .2s" }}
                      onMouseEnter={() => step === null && setHover(w.n)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => (step === null ? setLocked((l) => (l === w.n ? null : w.n)) : startSteps(STEP_OF_ROW[i]))}
                      className="cursor-pointer"
                    >
                      {/* faixa invisível larga: o fio fino é difícil de acertar */}
                      <path d={d} fill="none" stroke="transparent" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
                      <path d={d} fill="none" stroke={C.edge} strokeWidth={on ? 7.5 : 6} strokeLinecap="round" strokeLinejoin="round" />
                      <path d={d} fill="none" stroke={w.c} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={off ? "4 5" : undefined} />
                      {[w.p[0], w.p[w.p.length - 1]].map(([x, y], k) => (
                        <circle key={k} cx={x} cy={y} r={3.4} fill={w.c} stroke={C.edge} strokeWidth={1.2} />
                      ))}
                    </g>
                  );
                })}

              {/* onde mexer agora */}
              {curRow !== null && [WIRES[curRow].p[0], WIRES[curRow].p[WIRES[curRow].p.length - 1]].map(([x, y], k) => <Pulse key={k} x={x} y={y} r={8} />)}
              {cur && "note" in cur && cur.note === "inicio" && (
                <>
                  <Pulse x={585} y={60} r={17} />
                  <rect x="606" y="122" width="258" height="116" rx="7" fill="none" stroke={C.mark} strokeWidth={2.5} strokeDasharray="6 5" pointerEvents="none" />
                </>
              )}
              {cur && "note" in cur && cur.note === "vref" && <Pulse x={660} y={181} r={13} />}
            </svg>
          </div>

          {/* legenda */}
          <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
            {(Object.keys(NETS) as Net[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={step === null && locked === k}
                onClick={() => {
                  setStep(null);
                  setLocked((l) => (l === k && step === null ? null : k));
                }}
                onMouseEnter={() => step === null && setHover(k)}
                onMouseLeave={() => setHover(null)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border bg-background py-1 pl-1.5 pr-2.5 text-[12.5px] text-foreground transition-colors",
                  step === null && locked === k ? "border-foreground shadow-[inset_0_0_0_1px_hsl(var(--foreground))]" : "border-border hover:border-foreground/40",
                )}
              >
                <Swatch col={NETS[k].col} col2={NETS[k].col2} />
                {t(NETS[k].name)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* tabela */}
      <div className={cn("min-w-0 rounded-lg border border-border bg-background p-5", lazy(1100))}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <H4>{t("Ligações, ponto a ponto", "Connections, point to point")}</H4>
          <p className="text-[12px] text-muted-foreground">{t("Toque num fio da tabela para vê-lo no desenho.", "Tap a wire in the table to see it in the diagram.")}</p>
        </div>
        {/* no celular cada fio é uma linha "de → para": numa tabela, o destino ficava escondido à direita */}
        <ul className="mt-3 divide-y divide-border sm:hidden">
          {ROWS.map((r, i) => {
            const ph = phase(i);
            const lit = step === null ? focus === r.n : ph === "now";
            return (
              <li key={i} className={cn(r.dim?.(driver) && "opacity-50")}>
                <button
                  type="button"
                  onClick={() => startSteps(STEP_OF_ROW[i])}
                  className={cn("-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors", lit && "bg-gold/10")}
                >
                  <span className="mt-1.5">
                    <Swatch col={r.color ?? NETS[r.n].col} />
                  </span>
                  <span className="min-w-0 flex-1 text-[13.5px] leading-snug">
                    <span className="text-foreground">{t(r.from(driver))}</span>
                    <span className="text-muted-foreground"> → {t(r.to(driver))}</span>
                    <span className="mt-0.5 block text-[12px] text-muted-foreground">{t(`fio ${t(r.wire)}`, `${t(r.wire)} wire`)}</span>
                  </span>
                  <span className="pt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {step !== null && ph === "done" ? <Check className="h-3.5 w-3.5 text-primary" aria-label={t("feito", "done")} /> : String(STEP_OF_ROW[i] + 1).padStart(2, "0")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[480px] border-collapse text-[13.5px]">
            <thead>
              <tr className="text-left">
                {[t("Fio", "Wire"), t("De", "From"), t("Para", "To"), t("Passo", "Step")].map((h) => (
                  <th key={h} className="border-b border-border px-2 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => {
                const ph = phase(i);
                const lit = step === null ? focus === r.n : ph === "now";
                return (
                  <tr
                    key={i}
                    onMouseEnter={() => step === null && setHover(r.n)}
                    onMouseLeave={() => setHover(null)}
                    className={cn("transition-colors", lit ? "bg-gold/10" : "hover:bg-surface", r.dim?.(driver) && "opacity-50")}
                  >
                    <td className="whitespace-nowrap border-b border-border px-2 py-1.5 align-top">
                      <button type="button" onClick={() => startSteps(STEP_OF_ROW[i])} className="inline-flex items-center gap-2 text-left hover:underline hover:underline-offset-4">
                        <Swatch col={r.color ?? NETS[r.n].col} />
                        {t(r.wire)}
                      </button>
                    </td>
                    <td className="border-b border-border px-2 py-1.5 align-top">{t(r.from(driver))}</td>
                    <td className="border-b border-border px-2 py-1.5 align-top">{t(r.to(driver))}</td>
                    <td className="border-b border-border px-2 py-1.5 align-top font-mono text-[12px] tabular-nums text-muted-foreground">
                      {step !== null && ph === "done" ? <Check className="h-3.5 w-3.5 text-primary" aria-label={t("feito", "done")} /> : String(STEP_OF_ROW[i] + 1).padStart(2, "0")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* calculadora + pinos no código */}
      <div className={cn("grid gap-4 md:grid-cols-2", lazy(560))}>
        <div className="rounded-lg border border-border bg-background p-5">
          <H4>{t("Ajuste da corrente (Vref)", "Current setting (Vref)")}</H4>
          <label htmlFor="pf-cur" className="mt-4 block text-[13px] font-medium text-foreground">
            {t("Corrente no motor (A)", "Motor current (A)")}
          </label>
          <input
            id="pf-cur"
            type="number"
            min={0.3}
            max={1.7}
            step={0.05}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-[15px] text-foreground"
          />
          {!drv && (
            <>
              <label htmlFor="pf-rs" className="mt-3 block text-[13px] font-medium text-foreground">
                {t("Resistor de sensor no driver (impresso perto dos pinos)", "Sense resistor on the driver (printed near the pins)")}
              </label>
              <select id="pf-rs" value={rs} onChange={(e) => setRs(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-[14px] text-foreground">
                <option value="0.1">{t("R100 (0,10 Ω) — o mais comum", "R100 (0.10 Ω) — the most common")}</option>
                <option value="0.068">{t("R068 (0,068 Ω)", "R068 (0.068 Ω)")}</option>
                <option value="0.05">{t("R050 (0,05 Ω)", "R050 (0.05 Ω)")}</option>
              </select>
            </>
          )}
          <div className="mt-4 flex items-baseline gap-3 rounded-md border border-border bg-card px-4 py-3">
            <b className="font-mono text-[30px] font-medium tabular-nums text-gold">{nf2(vref)}</b>
            <span className="text-[13px] text-muted-foreground">{t("V no potenciômetro, medido contra o GND", "V at the potentiometer, measured against GND")}</span>
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {drv ? t("DRV8825: Vref = corrente ÷ 2.", "DRV8825: Vref = current ÷ 2.") : t("A4988: Vref = corrente × 8 × Rs.", "A4988: Vref = current × 8 × Rs.")}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t(
              "O 17HS4401S aguenta 1,5 A, mas 1,0 A esquenta menos o driver e já sobra força para o carro.",
              "The 17HS4401S handles 1.5 A, but 1.0 A keeps the driver cooler and still leaves plenty of force for the cart.",
            )}
          </p>
        </div>

        <div className="flex min-w-0 flex-col rounded-lg border border-border bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <H4>{t("Pinos no código", "Pins in the code")}</H4>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-[11.5px] text-foreground transition-colors hover:bg-foreground/5"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? t("Copiado", "Copied") : t("Copiar", "Copy")}
            </button>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-card px-4 py-3 font-mono text-[12.5px] leading-relaxed text-foreground">{code}</pre>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {t(
              "São os mesmos pinos do pendulo_controle.ino: mudou um fio de lugar, mude aqui também.",
              "These are the same pins as in pendulo_controle.ino: if you move a wire, change it here too.",
            )}
          </p>
        </div>
      </div>

      {/* ordem segura + conferir */}
      <div className={cn("grid gap-4 md:grid-cols-2", lazy(640))}>
        <div className="rounded-lg border border-border bg-background p-5">
          <H4>{t("Ordem segura para ligar", "Safe order to wire it up")}</H4>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-relaxed text-foreground marker:font-mono marker:text-gold">
            <li>
              {t(
                "Com tudo desligado, encaixe o driver no meio da protoboard (uma fileira de cada lado do canal) e coloque o capacitor de 100 µF entre +12 V e GND, bem perto do VMOT. A perna mais curta vai no GND.",
                "With everything off, seat the driver across the middle of the breadboard (one row on each side of the channel) and place the 100 µF capacitor between +12 V and GND, right next to VMOT. The shorter leg goes to GND.",
              )}
            </li>
            <li>{t("Faça todas as ligações do diagrama, menos os 4 fios do motor.", "Make every connection in the diagram except the 4 motor wires.")}</li>
            <li>
              {t(
                "Ligue a fonte e o USB. Gire o potenciômetro do driver até o multímetro marcar o Vref da calculadora (ponta vermelha no parafuso do potenciômetro, preta no GND).",
                "Turn on the power supply and plug in the USB. Turn the driver's potentiometer until the multimeter reads the Vref from the calculator (red probe on the potentiometer screw, black on GND).",
              )}
            </li>
            <li>{t("Desligue a fonte, ligue o motor e só então ligue de novo.", "Turn off the power supply, connect the motor, and only then power up again.")}</li>
            <li>
              {t(
                "Se o motor só vibrar e não girar, um par de fios está trocado: inverta os dois fios de uma das bobinas.",
                "If the motor only vibrates and doesn't turn, a pair of wires is swapped: swap the two wires of one of the coils.",
              )}
            </li>
          </ol>
          <p className="mt-4 rounded-r-md border-l-[3px] border-destructive bg-destructive/5 px-3 py-2.5 text-[14px] text-foreground">
            <b className="text-destructive">{t("Nunca", "Never")}</b>{" "}
            {t(
              "encaixe ou tire o motor com a fonte ligada. O pico de tensão queima o driver na hora.",
              "plug or unplug the motor with the power supply on. The voltage spike burns out the driver instantly.",
            )}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-5">
          <H4>{t("Para conferir antes", "Check before you start")}</H4>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[14px] leading-relaxed text-foreground">
            <li>
              <b className="font-medium">{t("Bobinas do motor:", "Motor coils:")}</b>{" "}
              {t(
                "as cores do desenho são as mais comuns no 17HS4401S. No multímetro em Ω, os dois fios de uma mesma bobina dão uns 1,5 a 2 Ω; fios de bobinas diferentes não dão continuidade.",
                "the colors in the diagram are the most common ones on the 17HS4401S. With the multimeter on Ω, the two wires of the same coil read about 1.5 to 2 Ω; wires from different coils show no continuity.",
              )}
            </li>
            <li>
              <b className="font-medium">{t("Fios do encoder:", "Encoder wires:")}</b>{" "}
              {t(
                "vermelho 5 V, preto GND, verde A, branco B. Se tiver um fio sem capa (malha), ele vai no GND. Se a contagem sair invertida, troque o sinal no código (SINAL_ENCODER).",
                "red 5 V, black GND, green A, white B. If there's a bare wire (the shield), it goes to GND. If the count comes out reversed, flip the sign in the code (SINAL_ENCODER).",
              )}
            </li>
            <li>
              <b className="font-medium">{t("Faixas da protoboard:", "Breadboard rails:")}</b>{" "}
              {t(
                "confira qual está marcada + e qual está −. Algumas protoboards de 400 pontos têm a faixa partida no meio.",
                "check which one is marked + and which is −. Some 400-point breadboards have the rail split in the middle.",
              )}
            </li>
            {drv ? (
              <li>
                <b className="font-medium">{t("Pino FLT:", "FLT pin:")}</b>{" "}
                {t(
                  "no DRV8825, onde o A4988 tem o VDD, fica o pino de falha. Deixe ele solto (o fio tracejado no desenho): o DRV8825 gera a própria alimentação da lógica.",
                  "on the DRV8825, the fault pin sits where the A4988 has VDD. Leave it unconnected (the dashed wire in the diagram): the DRV8825 makes its own logic supply.",
                )}
              </li>
            ) : (
              <li>
                <b className="font-medium">{t("Pino VDD:", "VDD pin:")}</b>{" "}
                {t(
                  "no A4988 ele recebe os 5 V do Arduino, que alimentam a lógica do driver.",
                  "on the A4988 it takes the Arduino's 5 V, which powers the driver's logic.",
                )}
              </li>
            )}
            <li>
              <b className="font-medium">{t("Opcional:", "Optional:")}</b>{" "}
              {t(
                "2 resistores de 4,7 kΩ do A e do B do encoder para o 5 V. O código já liga o pull-up interno, mas com eles a leitura fica mais limpa em giros rápidos.",
                "two 4.7 kΩ resistors from the encoder's A and B to 5 V. The code already enables the internal pull-ups, but with them the reading is cleaner on fast spins.",
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
