/*
  TESTE 2 (v2) - MOTOR E CARRO, COMEÇANDO NUMA PONTA
  ---------------------------------------------------
  Antes de ligar a fonte: empurre o carro com a mão até ENCOSTAR no batente
  da ponta escolhida em LADO_INICIAL. O código assume que ele começou ali.

  Ao ligar:
   1. Espera 3 s (dá tempo de puxar a tomada se você esqueceu o carro fora da ponta).
   2. Vai devagar (30 mm/s) até o centro do trilho.
   3. A partir daí aceita comandos, sempre dentro dos limites de segurança.

  Régua do trilho (em mm), sempre medida a partir da ponta do MOTOR:
     0 ......... MARGEM ............. CENTRO ............. CURSO-MARGEM ......... CURSO
   batente      limite                                       limite              batente
   (motor)                                                                    (esticador)

  Comandos (Monitor Serial, 115200):
   d / a = +50 / -50 mm       D / A = +150 / -150 mm      c = vai para o centro
   1/2/3/4 = 50 / 100 / 200 / 400 mm/s                    p = mostra a posição
   e = desliga o motor (o carro fica solto; depois disso só volta a andar após o reset)
*/

// ---------- AJUSTES ----------
const bool  LADO_INICIAL_MOTOR = true;  // true = começa no batente do motor; false = no do esticador
const float CURSO_MM  = 410.0;          // distância de batente a batente (MEÇA o seu e corrija aqui)
const float MARGEM_MM = 20.0;           // nunca chega a menos disso de cada batente
const bool  INVERTER_DIRECAO = false;   // já conferido: "d" vai para o lado do esticador

// ---------- PINOS E MECÂNICA ----------
const uint8_t PIN_STEP = 9;
const uint8_t PIN_DIR  = 8;
const uint8_t PIN_EN   = 10;            // LOW = motor ligado
const float PASSOS_POR_MM = 800.0 / 60.0;   // 1/4 de passo, polia GT2 30 dentes
const float ACELERACAO = 1500.0;            // mm/s²
const float LIM_MIN = MARGEM_MM;
const float LIM_MAX = CURSO_MM - MARGEM_MM;
const float CENTRO  = CURSO_MM / 2.0;

long  posicao = 0;          // passos, contados a partir do batente do motor
float velocidade = 100.0;   // mm/s
bool  posicaoValida = true; // vira false se o motor for desligado (carro solto)

float posicaoMM() { return posicao / PASSOS_POR_MM; }

void irPara(float alvoMM, float vel) {
  if (!posicaoValida) { Serial.println(F("Posicao desconhecida: encoste o carro na ponta e aperte o reset.")); return; }
  if (alvoMM < LIM_MIN) { alvoMM = LIM_MIN; Serial.println(F("(limite do lado do motor)")); }
  if (alvoMM > LIM_MAX) { alvoMM = LIM_MAX; Serial.println(F("(limite do lado do esticador)")); }
  long alvo = lround(alvoMM * PASSOS_POR_MM);
  long n = labs(alvo - posicao);
  if (n == 0) return;
  bool frente = alvo > posicao;               // frente = em direção ao esticador
  digitalWrite(PIN_DIR, (frente != INVERTER_DIRECAO) ? HIGH : LOW);
  delayMicroseconds(5);
  const float acc = ACELERACAO * PASSOS_POR_MM;
  const float vmax = vel * PASSOS_POR_MM;
  const float vmin = 200.0;
  for (long i = 0; i < n; i++) {
    float vSobe  = sqrt(vmin * vmin + 2.0 * acc * i);
    float vDesce = sqrt(vmin * vmin + 2.0 * acc * (n - i));
    float v = min(vmax, min(vSobe, vDesce));
    unsigned long periodo = (unsigned long)(1000000.0 / v);
    digitalWrite(PIN_STEP, HIGH);
    delayMicroseconds(3);
    digitalWrite(PIN_STEP, LOW);
    delayMicroseconds(periodo > 3 ? periodo - 3 : 0);
    posicao += frente ? 1 : -1;
  }
}

void mostrar() {
  Serial.print(F("posicao: ")); Serial.print(posicaoMM(), 1);
  Serial.print(F(" mm (centro = ")); Serial.print(CENTRO, 1);
  Serial.print(F(") | velocidade: ")); Serial.print(velocidade, 0); Serial.println(F(" mm/s"));
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_STEP, OUTPUT);
  pinMode(PIN_DIR, OUTPUT);
  pinMode(PIN_EN, OUTPUT);
  digitalWrite(PIN_EN, LOW);
  posicao = lround((LADO_INICIAL_MOTOR ? 0.0 : CURSO_MM) * PASSOS_POR_MM);

  Serial.println(LADO_INICIAL_MOTOR ? F("Carro deve estar encostado no batente do MOTOR.")
                                    : F("Carro deve estar encostado no batente do ESTICADOR."));
  for (int s = 3; s > 0; s--) { Serial.print(F("Indo para o centro em ")); Serial.println(s); delay(1000); }
  irPara(CENTRO, 30.0);
  Serial.println(F("No centro. d/a = +-50 | D/A = +-150 | c = centro | 1-4 = velocidade | p = posicao | e = soltar"));
  mostrar();
}

void loop() {
  if (!Serial.available()) return;
  char c = Serial.read();
  if (c == '\n' || c == '\r') return;
  switch (c) {
    case 'd': irPara(posicaoMM() + 50,  velocidade); break;
    case 'a': irPara(posicaoMM() - 50,  velocidade); break;
    case 'D': irPara(posicaoMM() + 150, velocidade); break;
    case 'A': irPara(posicaoMM() - 150, velocidade); break;
    case 'c': irPara(CENTRO, velocidade); break;
    case '1': velocidade = 50;  break;
    case '2': velocidade = 100; break;
    case '3': velocidade = 200; break;
    case '4': velocidade = 400; break;
    case 'p': break;
    case 'e':
      digitalWrite(PIN_EN, HIGH);
      posicaoValida = false;
      Serial.println(F("Motor solto. Para voltar: encoste o carro na ponta e aperte o reset do Arduino."));
      return;
    default: Serial.println(F("comando desconhecido")); return;
  }
  mostrar();
}
