/**
 * Física do pêndulo invertido e o controle que roda no Arduino.
 *
 * Duas metades, separadas de propósito:
 *
 *  - A PLANTA: o pêndulo de verdade. Haste de inox de 500 mm e 110 g, centro
 *    de massa a 215 mm do eixo, inércia que bate com o período medido (1,121 s)
 *    e o atrito seco do encoder (perde ~0,6° de amplitude por balanço). O carro
 *    é levado por um motor de passo: ele vai exatamente para onde o controle
 *    manda, então a aceleração do carro é uma entrada, não uma consequência.
 *
 *  - O CONTROLE: o loop() do pendulo_controle.ino, linha por linha, rodando a
 *    200 Hz. Ele não enxerga a planta: lê o ângulo como o encoder leria (4000
 *    contagens por volta), a velocidade angular por diferença entre leituras e a
 *    posição pela contagem de passos. Os ganhos e limites são os do firmware.
 *
 * Não importa three nem React: roda no Node (npm test) e no navegador igual.
 *
 * Convenções (as do firmware):
 *   x  m, 0 = centro da faixa, + = lado do esticador
 *   th rad, 0 = em pé, + = topo inclinado para o lado do esticador
 *   phi = th + π (0 = pendurado), que é o que o encoder conta
 */

/* ====================== o pêndulo (medido) ====================== */
export const MASS = 0.11; // kg, haste de inox Ø6 × 500 mm
export const D_CM = 0.215; // m, do eixo ao centro de massa
export const INERTIA = 0.007388; // kg·m² em torno do eixo
export const G = 9.81;
const MGD = MASS * G * D_CM;
/** atrito seco do encoder: 0,6° de amplitude perdidos por balanço = 4·τ/(m·g·d) */
const TAU_DRY = ((0.6 * Math.PI) / 180) * (MGD / 4);
/** um resto de atrito viscoso (ar, rolamento) */
const B_VISC = 0.00004;

/** período de pequenas oscilações, pendurado (s) — tem de dar 1,121 */
export const smallSwingPeriod = () => 2 * Math.PI * Math.sqrt(INERTIA / MGD);

/* ====================== o firmware (pendulo_controle.ino) ====================== */
export const FW = {
  CURSO_MM: 412,
  AJUSTE_CENTRO_MM: 3,
  MARGEM_MM: 20,
  // equilíbrio (LQR)
  K_X: -40.0,
  K_V: -39.13,
  K_T: -179.9,
  K_W: -24.66,
  K_BIAS: -0.1,
  // subida
  SW_VS: 0.35,
  SW_KE: 10.0,
  SW_KX: 2.0,
  SW_TAU: 0.05,
  SW_EREF: 0.03,
  PEGA_ANG: (15 * Math.PI) / 180,
  PEGA_E: 0.02,
  ANG_QUEDA: (30 * Math.PI) / 180,
  // limites
  VMAX: 0.4,
  AMAX: 8.0,
  XLIM: 0.165,
  DT: 0.005,
  // mecânica
  PASSOS_POR_MM: 800 / 60,
  CONT_VOLTA: 4000,
} as const;

export const CENTRO_MM = FW.CURSO_MM / 2 + FW.AJUSTE_CENTRO_MM;
/** posição do carro (m, a partir do centro) com ele encostado no batente do motor */
export const X_BATENTE_MOTOR = -CENTRO_MM / 1000;
/** o gerador de passos nunca deixa o carro chegar a menos de 20 mm de um batente */
const X_MIN_HARD = (FW.MARGEM_MM - CENTRO_MM) / 1000;
const X_MAX_HARD = (FW.CURSO_MM - FW.MARGEM_MM - CENTRO_MM) / 1000;

export type Mode = "conferindo" | "subindo" | "equilibrio" | "desligado";

export type SimState = {
  /** tempo simulado, s */
  t: number;
  /** carro: posição e velocidade reais (m, m/s) */
  x: number;
  v: number;
  /** aceleração do carro no último passo (m/s²), para a interface */
  a: number;
  /** ângulo a partir de pendurado e velocidade angular (rad, rad/s) */
  phi: number;
  w: number;
  mode: Mode;
  quedas: number;
  /** quando o equilíbrio pegou pela última vez (s), ou null */
  pegouEm: number | null;
  /** quando a subida começou pela última vez (s) */
  subidaDesde: number;
};

/** th: 0 = em pé, ±π = pendurado */
export const wrap = (a: number) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
export const thetaOf = (s: Pick<SimState, "phi">) => wrap(s.phi - Math.PI);

/** energia normalizada do firmware: 0 = parado em pé, -1 = parado pendurado */
export const energy = (th: number, w: number) => (0.5 * INERTIA * w * w + MGD * (Math.cos(th) - 1)) / (2 * MGD);

/**
 * O controlador: o mesmo estado e as mesmas contas do loop() do Arduino.
 * Recebe só o que os sensores dariam e devolve a velocidade pedida ao motor.
 */
class Firmware {
  modo: "subindo" | "equilibrio" = "subindo";
  vCmd = 0;
  bias = 0;
  hist = [0, 0, 0];
  quedas = 0;
  /** eventos para a interface ("pegou", "caiu") */
  events: ("pegou" | "caiu")[] = [];

  reset(phi0: number) {
    this.modo = "subindo";
    this.vCmd = 0;
    this.bias = 0;
    this.hist = [phi0, phi0, phi0];
    this.quedas = 0;
    this.events.length = 0;
  }

  step(phi: number, x: number) {
    const { DT } = FW;
    const h = this.hist;
    h[2] = h[1];
    h[1] = h[0];
    h[0] = phi;
    const w = (h[0] - h[2]) / (2 * DT);
    const th = wrap(phi - Math.PI);
    let a = 0;

    // caiu? volta a subir neste mesmo ciclo
    if (this.modo === "equilibrio" && (Math.abs(th) > FW.ANG_QUEDA || Math.abs(x) > FW.XLIM + 0.01)) {
      this.modo = "subindo";
      this.quedas++;
      this.events.push("caiu");
    }

    if (this.modo === "subindo") {
      const E = energy(th, w);
      if (Math.abs(th) < FW.PEGA_ANG && th * w <= 0 && Math.abs(E) < FW.PEGA_E) {
        this.modo = "equilibrio";
        this.bias = 0;
        this.events.push("pegou");
      } else {
        const lado = -Math.sin(th);
        let sg = lado > 0 ? 1 : lado < 0 ? -1 : 0;
        // perto do fim da faixa (ou saindo do batente): só volta para o centro
        if (Math.abs(x) > FW.XLIM - 0.02) sg = 0;
        let u = FW.SW_KE * (FW.SW_EREF - E);
        if (u > 1) u = 1;
        if (u < -1) u = -1;
        const vRef = FW.SW_VS * u * sg - FW.SW_KX * x;
        a = (vRef - this.vCmd) / FW.SW_TAU;
      }
    }

    if (this.modo === "equilibrio") {
      this.bias += FW.K_BIAS * x * DT;
      a = -(FW.K_X * x + FW.K_V * this.vCmd + FW.K_T * (th - this.bias) + FW.K_W * w);
    }

    if (a > FW.AMAX) a = FW.AMAX;
    if (a < -FW.AMAX) a = -FW.AMAX;
    this.vCmd += a * DT;
    const vPos = Math.sqrt(Math.max(0, 2 * FW.AMAX * (FW.XLIM - x)));
    const vNeg = Math.sqrt(Math.max(0, 2 * FW.AMAX * (FW.XLIM + x)));
    if (this.vCmd > Math.min(FW.VMAX, vPos)) this.vCmd = Math.min(FW.VMAX, vPos);
    if (this.vCmd < -Math.min(FW.VMAX, vNeg)) this.vCmd = -Math.min(FW.VMAX, vNeg);
    return this.vCmd;
  }
}

/**
 * esperarMotor() do firmware: antes de tudo, um empurrãozinho de ~6 mm para o
 * lado do centro, para conferir se o motor tem 12 V (se a haste mexe, o motor
 * tem força). O carro não volta: a subida segue de onde ele parou. Aqui vira o
 * perfil de velocidade (m/s) que esse teste pede, em passos de 5 ms.
 */
function bootProfile(): number[] {
  const out: number[] = [];
  const rampa = (vFinal: number, vInicio: number) => {
    const passo = vFinal > vInicio ? 0.02 : -0.02;
    for (let v = vInicio + passo; passo > 0 ? v <= vFinal + 0.001 : v >= vFinal - 0.001; v += passo) out.push(v);
  };
  for (let i = 0; i < 100; i++) out.push(0); // delay(500): fonte e driver estabilizarem
  rampa(0.16, 0); // empurrãozinho para o centro
  rampa(0, 0.16);
  for (let i = 0; i < 6; i++) out.push(0); // 6 × 5 ms olhando o encoder
  return out;
}
const BOOT = bootProfile();

export type SimOptions = {
  /** ruído do mundo real: atraso de leitura ±, folga etc. Desligado por padrão */
  seed?: number;
};

/**
 * O aparelho inteiro: planta + firmware + gerador de passos.
 * `advance(dt)` anda o tempo real; internamente a física roda a 1 kHz e o
 * controle a 200 Hz, como no Arduino.
 */
export class PendulumSim {
  s: SimState;
  private fw = new Firmware();
  private ctrlClock = 0;
  private bootIdx = 0;
  /** velocidade que o gerador de passos está aplicando agora */
  private vMotor = 0;
  /** torque externo (mão do visitante), N·m — vale enquanto estiver setado */
  handTorque = 0;
  /** aceleração do carro na janela de controle atual */
  private aWin = 0;

  constructor() {
    this.s = {
      t: 0,
      x: X_BATENTE_MOTOR,
      v: 0,
      a: 0,
      phi: 0,
      w: 0,
      mode: "conferindo",
      quedas: 0,
      pegouEm: null,
      subidaDesde: 0,
    };
    this.reset();
  }

  /** como ligar a fonte: carro no batente do motor, haste pendurada e parada */
  reset(phi0 = 0) {
    const s = this.s;
    s.t = 0;
    s.x = X_BATENTE_MOTOR;
    s.v = 0;
    s.a = 0;
    s.phi = phi0;
    s.w = 0;
    s.mode = "conferindo";
    s.quedas = 0;
    s.pegouEm = null;
    s.subidaDesde = 0;
    this.fw.reset(phi0);
    this.ctrlClock = 0;
    this.bootIdx = 0;
    this.vMotor = 0;
    this.aWin = 0;
    this.handTorque = 0;
  }

  /**
   * Desliga o controle: o carro freia na aceleração máxima e fica travado (o
   * driver segura o motor), e a haste fica por conta própria. Religar põe o
   * firmware de volta na subida a partir de onde a haste está.
   */
  setControl(on: boolean) {
    const s = this.s;
    if (!on) {
      if (s.mode !== "desligado") s.mode = "desligado";
      return;
    }
    if (s.mode !== "desligado") return;
    const quedas = s.quedas;
    this.fw.reset(s.phi);
    this.fw.quedas = quedas;
    s.mode = "subindo";
    s.subidaDesde = s.t;
    s.pegouEm = null;
  }

  /** um tapa na haste: soma velocidade angular (rad/s) */
  kick(dw: number) {
    this.s.w += dw;
  }

  /** eventos do firmware desde a última chamada */
  drainEvents() {
    const e = this.fw.events.slice();
    this.fw.events.length = 0;
    return e;
  }

  get theta() {
    return thetaOf(this.s);
  }

  advance(dt: number) {
    const H = 0.001;
    let left = Math.min(dt, 0.1);
    while (left > 1e-9) {
      const h = Math.min(H, left);
      this.tick(h);
      left -= h;
    }
  }

  private control() {
    const s = this.s;
    if (s.mode === "desligado") {
      // sem controle: o gerador de passos só freia até parar
      const dv = Math.min(Math.abs(this.vMotor), FW.AMAX * FW.DT);
      const vNew = this.vMotor - Math.sign(this.vMotor) * dv;
      this.aWin = (vNew - this.vMotor) / FW.DT;
      this.vMotor = vNew;
      return;
    }
    // o que os sensores dariam
    const cont = Math.round((s.phi * FW.CONT_VOLTA) / (2 * Math.PI));
    const phiLido = (cont * 2 * Math.PI) / FW.CONT_VOLTA;
    const passos = Math.round((s.x * 1000 + CENTRO_MM) * FW.PASSOS_POR_MM);
    const xLido = (passos / FW.PASSOS_POR_MM - CENTRO_MM) / 1000;

    let vNew: number;
    if (s.mode === "conferindo") {
      vNew = BOOT[this.bootIdx++] ?? 0;
      if (this.bootIdx >= BOOT.length) {
        s.mode = "subindo";
        s.subidaDesde = s.t;
        this.fw.reset(phiLido);
        this.fw.hist = [phiLido, phiLido, phiLido];
      }
    } else {
      const antes = this.fw.modo;
      vNew = this.fw.step(phiLido, xLido);
      if (antes !== this.fw.modo) {
        if (this.fw.modo === "equilibrio") s.pegouEm = s.t;
        else s.subidaDesde = s.t;
      }
      s.mode = this.fw.modo;
      s.quedas = this.fw.quedas;
    }
    // velocidadeCarro(): abaixo de 31 passos/s o gerador para
    if (Math.abs(vNew * 1000 * FW.PASSOS_POR_MM) < 31) vNew = 0;
    this.aWin = (vNew - this.vMotor) / FW.DT;
    this.vMotor = vNew;
  }

  private tick(h: number) {
    const s = this.s;
    this.ctrlClock -= h;
    if (this.ctrlClock <= 1e-9) {
      this.control();
      this.ctrlClock += FW.DT;
    }

    // carro: o motor de passo leva o carro na velocidade pedida. A mudança de
    // velocidade de cada ciclo é espalhada ao longo dos 5 ms (o driver em 1/4
    // de passo e a correia fazem isso no aparelho real)
    let a = 0;
    {
      const vTarget = this.vMotor;
      const dv = vTarget - s.v;
      const step = this.aWin * h;
      if (Math.abs(dv) <= Math.abs(step) || Math.abs(this.aWin) < 1e-9) {
        a = dv / h;
        s.v = vTarget;
      } else {
        a = this.aWin;
        s.v += step;
      }
    }
    s.x += s.v * h;
    // trava do gerador de passos: nunca a menos de 20 mm de um batente
    if (s.mode !== "conferindo") {
      if (s.x > X_MAX_HARD && s.v > 0) {
        s.x = X_MAX_HARD;
        s.v = 0;
      }
      if (s.x < X_MIN_HARD && s.v < 0) {
        s.x = X_MIN_HARD;
        s.v = 0;
      }
    }
    s.a = a;

    // haste: J·φ'' = −m·g·d·sen φ + m·d·a·cos φ − atrito + mão
    const drive = -MGD * Math.sin(s.phi) + MASS * D_CM * a * Math.cos(s.phi) + this.handTorque - B_VISC * s.w;
    let alpha: number;
    if (Math.abs(s.w) < 1e-3 && Math.abs(drive) <= TAU_DRY) {
      // atrito seco segura a haste parada
      s.w = 0;
      alpha = 0;
    } else {
      const dir = Math.abs(s.w) >= 1e-3 ? Math.sign(s.w) : Math.sign(drive);
      alpha = (drive - TAU_DRY * dir) / INERTIA;
      const wNew = s.w + alpha * h;
      // o atrito não inverte o sentido sozinho: para no zero
      if (Math.abs(s.w) >= 1e-3 && Math.sign(wNew) !== Math.sign(s.w) && Math.abs(drive) <= TAU_DRY) {
        s.w = 0;
      } else s.w = wNew;
    }
    s.phi += s.w * h;
    s.t += h;
  }
}
