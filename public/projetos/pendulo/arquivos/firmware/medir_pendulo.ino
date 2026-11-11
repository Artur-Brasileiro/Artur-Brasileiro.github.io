/*
  MEDIR PÊNDULO - período e atrito, medidos pelo próprio encoder
  ---------------------------------------------------------------
  1. Fonte ligada (o motor fica travado, o carro não se mexe) ou só o USB.
  2. Ao ligar/resetar, a haste deve estar PENDURADA e PARADA (vira o zero).
  3. Abra o Monitor Serial (115200).
  4. Levante a haste uns 30° para um lado e SOLTE (sem empurrar).
  5. Espere. A cada ida e volta aparece o tempo e a amplitude.
     No fim (quando a amplitude cai abaixo de 3°) aparece o resumo.
  Para medir de novo: aperte o reset com a haste parada.
*/
const uint8_t ENC_A = 2, ENC_B = 3, PIN_EN = 10;
volatile long cont = 0; volatile uint8_t ant = 0;
const int8_t TAB[16] = {0,-1,1,0, 1,0,0,-1, -1,0,0,1, 0,1,-1,0};
void isr() { uint8_t s = (PIND >> 2) & 0x03; cont += TAB[(ant << 2) | s]; ant = s; }
long ler() { noInterrupts(); long n = cont; interrupts(); return n; }

const float GRAUS = 360.0 / 4000.0;
const int HIST = 4;                 // histerese: 4 contagens = 0,36°
int lado = 0;                       // -1, 0, +1
unsigned long tSubida = 0;          // última passagem pelo zero indo para o lado +
long pico = 0;
int ciclo = 0;
float soma = 0; int nPer = 0;
float amp0 = 0; int cicloMetade = -1;
bool fim = false;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_EN, OUTPUT); digitalWrite(PIN_EN, LOW);   // motor travado
  pinMode(ENC_A, INPUT_PULLUP); pinMode(ENC_B, INPUT_PULLUP);
  ant = (PIND >> 2) & 0x03;
  attachInterrupt(digitalPinToInterrupt(ENC_A), isr, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENC_B), isr, CHANGE);
  Serial.println(F("Levante a haste ~30 graus e solte."));
}

void loop() {
  if (fim) return;
  long n = ler();
  long a = labs(n); if (a > pico) pico = a;
  int novo = lado;
  if (n > HIST) novo = 1; else if (n < -HIST) novo = -1;
  if (novo == 1 && lado == -1) {                     // cruzou o zero indo para o lado +
    unsigned long t = micros();
    if (tSubida != 0) {
      float per = (t - tSubida) / 1e6;
      float amp = pico * GRAUS;
      ciclo++;
      if (ciclo == 1) amp0 = amp;
      if (cicloMetade < 0 && amp <= amp0 / 2) cicloMetade = ciclo;
      if (amp < 20.0) { soma += per; nPer++; }
      Serial.print(F("ciclo ")); Serial.print(ciclo);
      Serial.print(F(": periodo ")); Serial.print(per, 3);
      Serial.print(F(" s | amplitude ")); Serial.print(amp, 1); Serial.println(F(" graus"));
      if (amp < 3.0 || ciclo >= 60) {
        Serial.println(F("------ RESUMO ------"));
        Serial.print(F("periodo medio (amplitude < 20 graus): "));
        if (nPer) Serial.print(soma / nPer, 3); else Serial.print(F("-"));
        Serial.println(F(" s"));
        Serial.print(F("idas e voltas ate a amplitude cair pela metade: "));
        if (cicloMetade > 0) Serial.println(cicloMetade); else Serial.println(F("nao caiu pela metade"));
        fim = true;
      }
    }
    tSubida = t; pico = 0;
  }
  lado = novo;
}
