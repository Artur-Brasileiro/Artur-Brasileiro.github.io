/*
  TESTE 2 - MOTOR E CARRO (NEMA 17 + A4988/DRV8825, 1/4 de passo)
  ----------------------------------------------------------------
  Move o carro pelo Monitor Serial (115200 baud, "Nenhum final de linha" ou "Nova linha").

  ANTES DE LIGAR:
   - Vref do driver ajustado (A4988 com R100: 0,80 V para 1,0 A).
   - Coloque o carro NO MEIO do trilho com a mão. Esse ponto vira o zero.
   - O código limita o curso a ±150 mm a partir do zero (o trilho tem ~410 mm úteis).

  Comandos:
   d  = anda +50 mm        a = anda -50 mm
   D  = anda +150 mm       A = anda -150 mm
   0  = volta ao zero
   1/2/3/4 = velocidade 50 / 100 / 200 / 400 mm/s
   e  = liga/desliga o motor (desligado o carro corre solto na mão)

  O que conferir:
   1. "d" deve levar o carro para o lado do ESTICADOR. Se for para o lado do motor,
      troque INVERTER_DIRECAO para true.
   2. Marque a posição, mande "d" e meça com uma régua: tem que andar 50 mm.
      Se andar 100 mm, o driver está em 1/2 passo; se andar 25 mm, está em 1/8.
   3. Vá subindo a velocidade (1, 2, 3, 4). Se o motor apitar e parar de girar
      (perder passo), anote a velocidade: ela é o limite para o controle.
*/

const uint8_t PIN_STEP = 9;
const uint8_t PIN_DIR  = 8;
const uint8_t PIN_EN   = 10;        // LOW = motor ligado

const bool  INVERTER_DIRECAO = false;
const float PASSOS_POR_MM = 800.0 / 60.0;   // 1/4 de passo = 800 passos/volta; polia GT2 30 dentes = 60 mm/volta
const float LIMITE_MM = 150.0;
const float ACELERACAO = 1500.0;            // mm/s²

long  posicao = 0;                          // em passos, a partir do zero
float velocidade = 100.0;                   // mm/s
bool  ligado = true;

void moverMM(float alvoMM) {
  if (alvoMM >  LIMITE_MM) alvoMM =  LIMITE_MM;
  if (alvoMM < -LIMITE_MM) alvoMM = -LIMITE_MM;
  long alvo = lround(alvoMM * PASSOS_POR_MM);
  long n = labs(alvo - posicao);
  if (n == 0) return;
  bool frente = alvo > posicao;
  digitalWrite(PIN_DIR, (frente != INVERTER_DIRECAO) ? HIGH : LOW);
  delayMicroseconds(5);

  const float acc = ACELERACAO * PASSOS_POR_MM;         // passos/s²
  const float vmax = velocidade * PASSOS_POR_MM;        // passos/s
  const float vmin = 200.0;                             // passos/s para arrancar
  for (long i = 0; i < n; i++) {
    float vSobe  = sqrt(vmin * vmin + 2.0 * acc * i);
    float vDesce = sqrt(vmin * vmin + 2.0 * acc * (n - i));
    float v = min(vmax, min(vSobe, vDesce));
    unsigned long periodo = (unsigned long)(1000000.0 / v);
    digitalWrite(PIN_STEP, HIGH);
    delayMicroseconds(3);
    digitalWrite(PIN_STEP, LOW);
    delayMicroseconds(periodo > 3 ? periodo - 3 : 0);
  }
  posicao = alvo;
}

float posicaoMM() { return posicao / PASSOS_POR_MM; }

void setup() {
  Serial.begin(115200);
  pinMode(PIN_STEP, OUTPUT);
  pinMode(PIN_DIR, OUTPUT);
  pinMode(PIN_EN, OUTPUT);
  digitalWrite(PIN_EN, LOW);
  Serial.println(F("Teste do motor. Carro no meio do trilho = zero."));
  Serial.println(F("d/a = +-50 mm | D/A = +-150 mm | 0 = zero | 1-4 = velocidade | e = liga/desliga"));
}

void loop() {
  if (!Serial.available()) return;
  char c = Serial.read();
  if (c == '\n' || c == '\r') return;
  switch (c) {
    case 'd': moverMM(posicaoMM() + 50);  break;
    case 'a': moverMM(posicaoMM() - 50);  break;
    case 'D': moverMM(posicaoMM() + 150); break;
    case 'A': moverMM(posicaoMM() - 150); break;
    case '0': moverMM(0); break;
    case '1': velocidade = 50;  break;
    case '2': velocidade = 100; break;
    case '3': velocidade = 200; break;
    case '4': velocidade = 400; break;
    case 'e':
      ligado = !ligado;
      digitalWrite(PIN_EN, ligado ? LOW : HIGH);
      if (!ligado) Serial.println(F("Motor desligado: o zero pode ter se perdido. Recoloque o carro no meio e reinicie."));
      break;
    default: Serial.println(F("comando desconhecido")); return;
  }
  Serial.print(F("posicao: ")); Serial.print(posicaoMM(), 1);
  Serial.print(F(" mm | velocidade: ")); Serial.print(velocidade, 0);
  Serial.print(F(" mm/s | motor ")); Serial.println(ligado ? F("ligado") : F("desligado"));
}
