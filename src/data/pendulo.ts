/** O case do pêndulo invertido: textos e números da página /projeto/pendulo-invertido. */

import { tr } from "@/i18n/core";

export const pendulo = {
  title: tr("Pêndulo Invertido", "Inverted Pendulum"),
  category: tr("Hardware & controle", "Hardware & control"),
  status: tr("Concluído", "Completed"),
  statusNote: tr("Sobe e equilibra sozinho", "Swings up and balances on its own"),
  summary: tr(
    "Uma haste de inox de meio metro, em pé sobre um carrinho num trilho linear. Ao ligar, o carro sai do batente balançando a haste até ela subir e depois a segura em pé, corrigindo 200 vezes por segundo. A simulação aqui embaixo roda o mesmo controle do Arduino, com a física da haste medida.",
    "A half-meter stainless steel rod standing upright on a small cart on a linear rail. Once powered on, the cart leaves the end stop swinging the rod until it rises, then holds it upright, correcting 200 times per second. The simulation below runs the same Arduino control code, with the rod's measured physics.",
  ),
  specs: [
    { label: tr("Trilho", "Rail"), value: tr("MGN15H · 500 mm · 412 mm de curso", "MGN15H · 500 mm · 412 mm of travel") },
    { label: "Motor", value: tr("NEMA 17 (17HS4401S) · A4988 em 1/4 de passo", "NEMA 17 (17HS4401S) · A4988 in 1/4-step mode") },
    { label: tr("Transmissão", "Drive"), value: tr("Correia GT2 6 mm · polia de 30 dentes impressa", "6 mm GT2 belt · printed 30-tooth pulley") },
    { label: "Sensor", value: tr("Encoder LPD3806 · 4000 contagens por volta", "LPD3806 encoder · 4000 counts per revolution") },
    { label: tr("Haste", "Rod"), value: tr("Inox Ø6 × 500 mm · 110 g", "Stainless steel Ø6 × 500 mm · 110 g") },
    { label: tr("Controle", "Control"), value: "Arduino UNO · 200 Hz · LQR" },
    { label: tr("Peças", "Parts"), value: tr("9 impressas · modelo paramétrico em CadQuery", "9 printed · parametric model in CadQuery") },
  ],
  /** os dois modos do firmware e o que protege o aparelho */
  modes: [
    {
      ref: tr("subida", "swing-up"),
      title: tr("Subida por energia", "Energy-based swing-up"),
      text: tr(
        "O carro faz um vai e vem e inverte o sentido bem quando a haste passa por baixo, como quem empurra um balanço. A cada passada ela sobe mais. Perto da energia do topo o vai e vem enfraquece, para ela chegar lá quase parada.",
        "The cart moves back and forth and reverses right as the rod passes the bottom, like pushing someone on a swing. With each pass it climbs higher. As it nears the energy of the top, the back-and-forth eases off so the rod arrives there almost at rest.",
      ),
    },
    {
      ref: tr("equilíbrio", "balance"),
      title: tr("Equilíbrio com LQR", "LQR balance"),
      text: tr(
        "Quando a haste chega a menos de 15° do topo, indo para ele e com a energia certa, o equilíbrio assume. O carro acelera para baixo dela somando ângulo, velocidade angular, posição e velocidade do carro, cada um com um peso calculado para esta haste.",
        "When the rod gets within 15° of the top, moving toward it with the right energy, balance takes over. The cart accelerates to get under it, summing the angle, angular velocity, cart position and cart velocity, each with a weight computed for this rod.",
      ),
    },
    {
      ref: tr("segurança", "safety"),
      title: tr("Nunca bate no fim", "Never hits the end"),
      text: tr(
        "Não há chave de fim de curso. O gerador de passos se recusa a levar o carro a menos de 20 mm de um batente, o controle freia antes de ±165 mm do centro e, se a haste cai, volta a subir no mesmo ciclo de 5 ms.",
        "There's no limit switch. The step generator refuses to take the cart within 20 mm of an end stop, the controller brakes before ±165 mm from center, and if the rod falls, it starts swinging up again in the same 5 ms cycle.",
      ),
    },
  ],
  /** do CAD ao aparelho */
  pipeline: [
    {
      n: "01",
      title: tr("Modelo paramétrico", "Parametric model"),
      text: tr(
        "Nove peças em CadQuery, desenhadas em volta do que eu já tinha: trilho, encoder, motor e só parafusos M3 e M5. Conferidas sem colisão em todo o curso do carro.",
        "Nine parts in CadQuery, designed around what I already had: rail, encoder, motor, and only M3 and M5 screws. Verified collision-free over the cart's full travel.",
      ),
    },
    {
      n: "02",
      title: tr("A haste medida", "The rod, measured"),
      text: tr(
        "O período de balanço pendurada, 1,121 s, deu a inércia. A perda de 0,6° de amplitude por balanço deu o atrito do encoder. Esses números estão na simulação.",
        "Its swing period while hanging, 1.121 s, gave the inertia. The 0.6° of amplitude it loses per swing gave the encoder friction. Those numbers are in the simulation.",
      ),
    },
    {
      n: "03",
      title: tr("Simulação antes do motor", "Simulation before the motor"),
      text: tr(
        "Ganhos calculados por LQR e testados com ruído, atraso de 5 ms e o modelo variando ±2 %: subiu em 60 de 60 partidas e reergueu em 38 de 38 quedas.",
        "Gains computed with LQR and tested with noise, a 5 ms delay and the model varied by ±2%: it swung up in 60 of 60 starts and recovered from 38 of 38 falls.",
      ),
    },
    {
      n: "04",
      title: tr("O mesmo código no Arduino", "The same code on the Arduino"),
      text: tr(
        "O loop de 200 Hz que roda na placa é o que roda aqui, linha por linha: lê o encoder, conta os passos e decide a velocidade do motor.",
        "The 200 Hz loop running on the board is the one running here, line by line: it reads the encoder, counts the steps and sets the motor speed.",
      ),
    },
  ],
  numbers: [
    { value: "215 mm", label: tr("do eixo ao centro de massa", "from the pivot to the center of mass") },
    { value: tr("1,121 s", "1.121 s"), label: tr("período de balanço, pendurada", "swing period, hanging") },
    { value: "~5 s", label: tr("do batente até ficar em pé", "from the end stop to upright") },
    { value: "~2 s", label: tr("para reerguer depois de um tapa", "to recover after a tap") },
  ],
};
