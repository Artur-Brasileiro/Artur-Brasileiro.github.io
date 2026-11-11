/** O case do pêndulo invertido: textos e números da página /projeto/pendulo-invertido. */

export const pendulo = {
  title: "Pêndulo Invertido",
  category: "Hardware & controle",
  status: "Concluído",
  statusNote: "Sobe e equilibra sozinho",
  summary:
    "Uma haste de inox de meio metro, em pé sobre um carrinho num trilho linear. Ao ligar, o carro sai do batente balançando a haste até ela subir e depois a segura em pé, corrigindo 200 vezes por segundo. A simulação aqui embaixo roda o mesmo controle do Arduino, com a física da haste medida.",
  specs: [
    { label: "Trilho", value: "MGN15H · 500 mm · 412 mm de curso" },
    { label: "Motor", value: "NEMA 17 (17HS4401S) · A4988 em 1/4 de passo" },
    { label: "Transmissão", value: "Correia GT2 6 mm · polia de 30 dentes impressa" },
    { label: "Sensor", value: "Encoder LPD3806 · 4000 contagens por volta" },
    { label: "Haste", value: "Inox Ø6 × 500 mm · 110 g" },
    { label: "Controle", value: "Arduino UNO · 200 Hz · LQR" },
    { label: "Peças", value: "9 impressas · modelo paramétrico em CadQuery" },
  ],
  /** os dois modos do firmware e o que protege o aparelho */
  modes: [
    {
      ref: "subida",
      title: "Subida por energia",
      text: "O carro faz um vai e vem e inverte o sentido bem quando a haste passa por baixo, como quem empurra um balanço. A cada passada ela sobe mais. Perto da energia do topo o vai e vem enfraquece, para ela chegar lá quase parada.",
    },
    {
      ref: "equilíbrio",
      title: "Equilíbrio com LQR",
      text: "Quando a haste chega a menos de 15° do topo, indo para ele e com a energia certa, o equilíbrio assume. O carro acelera para baixo dela somando ângulo, velocidade angular, posição e velocidade do carro, cada um com um peso calculado para esta haste.",
    },
    {
      ref: "segurança",
      title: "Nunca bate no fim",
      text: "Não há chave de fim de curso. O gerador de passos se recusa a levar o carro a menos de 20 mm de um batente, o controle freia antes de ±165 mm do centro e, se a haste cai, volta a subir no mesmo ciclo de 5 ms.",
    },
  ],
  /** do CAD ao aparelho */
  pipeline: [
    {
      n: "01",
      title: "Modelo paramétrico",
      text: "Nove peças em CadQuery, desenhadas em volta do que eu já tinha: trilho, encoder, motor e só parafusos M3 e M5. Conferidas sem colisão em todo o curso do carro.",
    },
    {
      n: "02",
      title: "A haste medida",
      text: "O período de balanço pendurada, 1,121 s, deu a inércia. A perda de 0,6° de amplitude por balanço deu o atrito do encoder. Esses números estão na simulação.",
    },
    {
      n: "03",
      title: "Simulação antes do motor",
      text: "Ganhos calculados por LQR e testados com ruído, atraso de 5 ms e o modelo variando ±2 %: subiu em 60 de 60 partidas e reergueu em 38 de 38 quedas.",
    },
    {
      n: "04",
      title: "O mesmo código no Arduino",
      text: "O loop de 200 Hz que roda na placa é o que roda aqui, linha por linha: lê o encoder, conta os passos e decide a velocidade do motor.",
    },
  ],
  numbers: [
    { value: "215 mm", label: "do eixo ao centro de massa" },
    { value: "1,121 s", label: "período de balanço, pendurada" },
    { value: "~5 s", label: "do batente até ficar em pé" },
    { value: "~2 s", label: "para reerguer depois de um tapa" },
  ],
};
