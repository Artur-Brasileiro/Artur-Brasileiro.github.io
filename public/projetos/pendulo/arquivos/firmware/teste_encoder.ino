/*
  TESTE 1 - ENCODER (LPD3806-1000BM)
  ----------------------------------
  Lê o ângulo do pêndulo e mostra no Monitor Serial (115200 baud).
  Não liga o motor. Pode deixar a fonte de 12 V desligada; só o USB basta.

  Ligações: A (verde) -> D2, B (branco) -> D3, VCC (vermelho) -> 5V, GND (preto) -> GND

  1000 pulsos/volta x 4 (lemos as duas bordas de A e B) = 4000 contagens por volta
  => resolução de 0,09° por contagem.

  O que conferir:
   1. Com o pêndulo parado, o número não muda sozinho.
   2. Uma volta inteira devagar dá 4000 (ou -4000). Volte e confira que retorna perto de 0.
   3. Gire rápido para os dois lados e volte à posição inicial: deve voltar perto de 0.
      Se "perder" contagens, coloque resistores de 4,7 kΩ de A e B para o 5 V.
*/

const uint8_t ENC_A = 2;
const uint8_t ENC_B = 3;
const long CONTAGENS_POR_VOLTA = 4000;

volatile long contagem = 0;
volatile uint8_t estadoAnterior = 0;

// tabela de decodificação em quadratura: [anterior(2 bits) | atual(2 bits)] -> -1, 0, +1
const int8_t TABELA[16] = { 0, -1,  1,  0,
                            1,  0,  0, -1,
                           -1,  0,  0,  1,
                            0,  1, -1,  0 };

void lerEncoder() {
  uint8_t atual = (PIND >> 2) & 0x03;          // D2 = bit 2, D3 = bit 3 da porta D
  contagem += TABELA[(estadoAnterior << 2) | atual];
  estadoAnterior = atual;
}

void setup() {
  Serial.begin(115200);
  pinMode(ENC_A, INPUT_PULLUP);
  pinMode(ENC_B, INPUT_PULLUP);
  estadoAnterior = (PIND >> 2) & 0x03;
  attachInterrupt(digitalPinToInterrupt(ENC_A), lerEncoder, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENC_B), lerEncoder, CHANGE);
  Serial.println(F("Teste do encoder. Deixe o pendulo pendurado parado e envie 'z' para zerar."));
}

void loop() {
  if (Serial.available()) {
    char c = Serial.read();
    if (c == 'z') { noInterrupts(); contagem = 0; interrupts(); Serial.println(F("-- zerado --")); }
  }
  static unsigned long t = 0;
  if (millis() - t >= 100) {
    t = millis();
    noInterrupts(); long n = contagem; interrupts();
    float graus = n * 360.0 / CONTAGENS_POR_VOLTA;
    Serial.print(F("contagens: ")); Serial.print(n);
    Serial.print(F("\tangulo: ")); Serial.print(graus, 2); Serial.println(F(" graus"));
  }
}
