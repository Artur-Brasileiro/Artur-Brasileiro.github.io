/*
  PÊNDULO INVERTIDO - CONTROLE AUTÔNOMO
  =====================================
  Arduino UNO + A4988 (1/4 de passo) + NEMA 17 + polia GT2 30 dentes
  Encoder LPD3806-1000BM (4000 contagens/volta) + haste inox Ø6 x 500 mm (110 g)

  SEM COMANDOS: é só ligar a fonte de 12 V.

  ANTES DE LIGAR A FONTE:
   1. Carro ENCOSTADO no batente do lado do MOTOR.
   2. Pêndulo PENDURADO e PARADO (o zero do ângulo é lido ao ligar).

  O QUE ACONTECE:
   - Ao ligar, o carro já sai do batente balançando a haste (a ida para o meio
     JÁ É a subida). Em ~5 s ela chega no topo e o equilíbrio assume.
   - Se o pêndulo cair, no mesmo instante (5 ms) volta a balançar para subir,
     sem parar e sem voltar ao centro antes. Reergue em ~2 s.
   - Para parar: desligue a fonte.

  PROTEÇÕES (as mesmas de antes):
   - O carro nunca chega a menos de 20 mm de um batente (trava no próprio gerador de passos).
   - Faixa de trabalho ±165 mm do centro, freando ANTES de chegar no fim da faixa.

  O Monitor Serial (115200) é opcional: só mostra quando pega e quando cai.
  Atenção: abrir o Monitor Serial REINICIA o Arduino -> carro no batente do motor antes.
*/

// ====================== AJUSTES DE MONTAGEM ======================
const float CURSO_MM   = 412.0;   // de batente a batente (medido: 202 + 210 com o carro no centro)
const float AJUSTE_CENTRO_MM = 3.0;  // empurra o centro para o lado do esticador (+) ou do motor (-)
const float MARGEM_MM  = 20.0;    // distância mínima de cada batente (trava de segurança)
const bool  INVERTER_DIRECAO = false;  // já conferido: positivo = lado do esticador
const int   SINAL_ENCODER    = 1;      // já conferido

// ====================== EQUILÍBRIO (LQR, calculado para a sua haste) ======================
const float K_X = -40.00;   // posição do carro (1/m)        -> a = -(K·estado)
const float K_V = -39.13;   // velocidade do carro
const float K_T = -179.9;   // ângulo (rad)
const float K_W = -24.66;   // velocidade angular (rad/s)
const float K_BIAS = -0.10; // corrige devagar um zero do encoder levemente torto

// ====================== SUBIDA ======================
// O carro anda em "vai e vem" e inverte o sentido quando a haste passa por baixo
// (é ali que o empurrão rende mais). A força do vai e vem diminui quando a energia
// chega na do topo, para a haste chegar lá quase parada.
const float INERCIA = 0.007388;               // kg·m² em torno do pivô (confere com o período medido de 1,121 s)
const float M_G_D   = 0.110 * 9.81 * 0.215;   // m·g·d
const float SW_VS   = 0.35;   // m/s, velocidade do vai e vem
const float SW_KE   = 10.0;   // quão rápido a força cai perto da energia do topo
const float SW_KX   = 2.0;    // puxa o carro de volta para o centro (1/s)
const float SW_TAU  = 0.05;   // s, rapidez com que o carro segue a velocidade pedida
const float SW_EREF = 0.03;   // alvo de energia (0 = exatamente a do topo; um pouco acima vence o atrito)
// o equilíbrio só assume se a haste chegar perto do topo, indo para ele, com a energia certa
const float PEGA_ANG = 15.0 * PI / 180.0;
const float PEGA_E   = 0.02;
const float ANG_QUEDA = 30.0 * PI / 180.0;    // no equilíbrio, acima disso considera que caiu

// ====================== LIMITES ======================
const float VMAX = 0.40;        // m/s  (testado: 400 mm/s sem perder passo)
const float AMAX = 8.0;         // m/s²
const float XLIM = 0.165;       // m, faixa de trabalho a partir do centro (±165 mm)
const float DT   = 0.005;       // s, controle a 200 Hz

// ====================== PINOS E MECÂNICA ======================
const uint8_t PIN_STEP = 9;     // PB1
const uint8_t PIN_DIR  = 8;     // PB0
const uint8_t PIN_EN   = 10;
const uint8_t ENC_A = 2, ENC_B = 3;
const float PASSOS_POR_MM = 800.0 / 60.0;
const long  CONT_VOLTA = 4000;
const float CENTRO_MM = CURSO_MM / 2.0 + AJUSTE_CENTRO_MM;

// ====================== GERADOR DE PASSOS (Timer1) ======================
volatile long posPassos = 0;               // a partir do batente do motor
volatile bool andando = false;
volatile bool sentidoPos = true;
long posMinHard, posMaxHard;

ISR(TIMER1_COMPA_vect) {
  if (!andando) return;
  if (sentidoPos) { if (posPassos >= posMaxHard) return; posPassos++; }
  else            { if (posPassos <= posMinHard) return; posPassos--; }
  PORTB |= _BV(1);
  __builtin_avr_delay_cycles(40);          // ~2,5 µs de pulso
  PORTB &= ~_BV(1);
}

void velocidadeCarro(float v) {            // v em m/s (+ = lado do esticador)
  float pps = v * 1000.0 * PASSOS_POR_MM;
  bool pos = pps > 0;
  if (pps < 0) pps = -pps;
  if (pps < 31.0) { andando = false; return; }
  if (pps > 20000.0) pps = 20000.0;
  uint16_t topo = (uint16_t)(2000000.0 / pps) - 1;
  if (pos != sentidoPos) {
    andando = false;
    sentidoPos = pos;
    digitalWrite(PIN_DIR, (pos != INVERTER_DIRECAO) ? HIGH : LOW);
    delayMicroseconds(2);
  }
  noInterrupts();
  OCR1A = topo;
  if (TCNT1 > topo) TCNT1 = 0;
  andando = true;
  interrupts();
}

long lerPos() { noInterrupts(); long p = posPassos; interrupts(); return p; }
float xCentro() { return (lerPos() / PASSOS_POR_MM - CENTRO_MM) / 1000.0; }   // m, 0 = centro

// ====================== ENCODER ======================
volatile long contagem = 0;
volatile uint8_t encAnt = 0;
const int8_t TAB[16] = {0,-1,1,0, 1,0,0,-1, -1,0,0,1, 0,1,-1,0};
void isrEncoder() {
  uint8_t s = (PIND >> 2) & 0x03;
  contagem += TAB[(encAnt << 2) | s];
  encAnt = s;
}
float anguloPendurado() {                  // rad, 0 = pendurado
  noInterrupts(); long n = contagem; interrupts();
  return SINAL_ENCODER * n * (2.0 * PI / CONT_VOLTA);
}
float embrulha(float a) { while (a > PI) a -= 2*PI; while (a < -PI) a += 2*PI; return a; }

// ====================== ESTADO ======================
enum Modo { SUBINDO, EQUILIBRIO };
Modo modo = SUBINDO;
float vCmd = 0, bias = 0;
float histPhi[3] = {0, 0, 0};
unsigned long tProx = 0;
unsigned int quedas = 0;

// Confere se o motor tem 12 V (ex.: Arduino ligado pelo USB antes da fonte).
// Dá um empurrãozinho de ~6 mm para o lado do centro. Com força no motor, a haste
// mexe e o encoder vê: segue a partir dali (é o primeiro empurrão da subida).
// Sem força, nada mexe: o carro continua no batente, a posição volta a zero,
// e ele tenta de novo a cada meio segundo. Nunca anda em direção ao batente.
long maxMov;
void olharEncoder() {
  noInterrupts(); long n = contagem; interrupts();
  if (labs(n) > maxMov) maxMov = labs(n);
}
void rampa(float vFinal, float vInicio) {
  float passo = (vFinal > vInicio) ? 0.02 : -0.02;
  for (float v = vInicio + passo; (passo > 0) ? v <= vFinal + 0.001 : v >= vFinal - 0.001; v += passo) {
    velocidadeCarro(v); delay(5); olharEncoder();
  }
}
void esperarMotor() {
  bool avisou = false;
  while (true) {
    noInterrupts(); contagem = 0; posPassos = 0; interrupts();   // zero do ângulo = pendurado parado
    maxMov = 0;
    rampa(0.16, 0); rampa(0, 0.16);                    // empurrãozinho de ~6 mm para o centro
    velocidadeCarro(0);
    for (int i = 0; i < 6; i++) { delay(5); olharEncoder(); }
    if (maxMov >= 3) return;                           // a haste mexeu: motor com força, segue daqui
    noInterrupts(); posPassos = 0; interrupts();       // não mexeu: o carro ainda está no batente
    if (!avisou) { Serial.println(F("Motor sem 12 V? Esperando a fonte...")); avisou = true; }
    delay(500);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_STEP, OUTPUT); pinMode(PIN_DIR, OUTPUT); pinMode(PIN_EN, OUTPUT);
  digitalWrite(PIN_EN, LOW);
  digitalWrite(PIN_DIR, INVERTER_DIRECAO ? LOW : HIGH);
  pinMode(ENC_A, INPUT_PULLUP); pinMode(ENC_B, INPUT_PULLUP);
  encAnt = (PIND >> 2) & 0x03;
  attachInterrupt(digitalPinToInterrupt(ENC_A), isrEncoder, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENC_B), isrEncoder, CHANGE);

  posPassos = 0;                                       // carro encostado no batente do motor
  posMinHard = lround(MARGEM_MM * PASSOS_POR_MM);
  posMaxHard = lround((CURSO_MM - MARGEM_MM) * PASSOS_POR_MM);

  TCCR1A = 0; TCCR1B = _BV(WGM12) | _BV(CS11);         // CTC, prescaler 8 -> 2 MHz
  OCR1A = 60000; TCNT1 = 0; TIMSK1 = _BV(OCIE1A);

  delay(500);                                          // fonte e driver estabilizarem
  esperarMotor();                                      // grava o zero do ângulo e confere o 12 V
  modo = SUBINDO;
  histPhi[0] = histPhi[1] = histPhi[2] = anguloPendurado();   // velocidade angular começa certa
  Serial.println(F("Pendulo invertido: subindo"));
  tProx = micros();
}

void loop() {
  if ((long)(micros() - tProx) < 0) return;
  tProx += (unsigned long)(DT * 1e6);

  float phi = anguloPendurado();
  histPhi[2] = histPhi[1]; histPhi[1] = histPhi[0]; histPhi[0] = phi;
  float w  = (histPhi[0] - histPhi[2]) / (2 * DT);       // rad/s
  float th = embrulha(phi - PI);                        // rad, 0 = em pé, + = topo para o lado do esticador
  float x  = xCentro();
  float a  = 0;

  // caiu? volta a subir neste mesmo ciclo
  if (modo == EQUILIBRIO && (fabs(th) > ANG_QUEDA || fabs(x) > XLIM + 0.01)) {
    modo = SUBINDO;
    quedas++;
    Serial.print(F("caiu ")); Serial.println(quedas);
  }

  if (modo == SUBINDO) {
    float E = (0.5 * INERCIA * w * w + M_G_D * (cos(th) - 1)) / (2 * M_G_D);   // 0 = topo, -1 = pendurado
    if (fabs(th) < PEGA_ANG && th * w <= 0 && fabs(E) < PEGA_E) {
      modo = EQUILIBRIO; bias = 0;
      Serial.println(F("pegou"));
    } else {
      float lado = -sin(th);                           // de que lado da vertical de baixo a haste está
      float sg = (lado > 0) ? 1.0 : ((lado < 0) ? -1.0 : 0.0);
      if (fabs(x) > XLIM - 0.02) sg = 0;              // perto do fim da faixa (ou saindo do batente): só volta para o centro
      float u = SW_KE * (SW_EREF - E);
      if (u > 1) u = 1;
      if (u < -1) u = -1;
      float vRef = SW_VS * u * sg - SW_KX * x;
      a = (vRef - vCmd) / SW_TAU;
    }
  }

  if (modo == EQUILIBRIO) {
    bias += K_BIAS * x * DT;
    a = -(K_X * x + K_V * vCmd + K_T * (th - bias) + K_W * w);
  }

  // limites: aceleração, velocidade e freio antes do fim da faixa
  if (a >  AMAX) a =  AMAX;
  if (a < -AMAX) a = -AMAX;
  vCmd += a * DT;
  float vPos = sqrt(max(0.0f, 2 * AMAX * (XLIM - x)));    // freia antes do limite
  float vNeg = sqrt(max(0.0f, 2 * AMAX * (XLIM + x)));    // (no início, fora da faixa, só deixa ir para o centro)
  if (vCmd >  min(VMAX, vPos)) vCmd =  min(VMAX, vPos);
  if (vCmd < -min(VMAX, vNeg)) vCmd = -min(VMAX, vNeg);
  velocidadeCarro(vCmd);
}
