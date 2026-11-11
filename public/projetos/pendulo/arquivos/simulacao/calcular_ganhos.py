"""
Cálculo dos ganhos do equilíbrio (LQR) do pêndulo invertido.

Reproduz exatamente os ganhos que estão no firmware:
    K_X = -40.00   K_V = -39.13   K_T = -179.9   K_W = -24.66

Modelo (linearizado em torno da haste em pé):
  - O carro é levado por motor de passo: ele vai para onde o código manda.
    Então a ENTRADA do sistema é a aceleração do carro (a), não uma força.
  - A haste:  J·θ'' = m·g·d·θ − m·d·a     (θ = 0 em pé)

Estado: [x, v, θ, ω]  (posição e velocidade do carro, ângulo e velocidade angular)
Lei de controle no firmware:  a = −(K_X·x + K_V·v + K_T·θ + K_W·ω)

Rodar:  pip install numpy scipy && python calcular_ganhos.py
"""
import numpy as np
from scipy.linalg import solve_continuous_are

# ---- a haste, medida ----
m = 0.110      # kg   (balança de cozinha)
d = 0.215      # m    do eixo ao centro de massa (haste de 500 mm, eixo a 35 mm da ponta)
J = 0.007388   # kg·m² em torno do eixo (bate com o período medido: 1,121 s)
g = 9.81

A = np.array([[0, 1, 0, 0],
              [0, 0, 0, 0],
              [0, 0, 0, 1],
              [0, 0, m * g * d / J, 0]])
B = np.array([[0], [1], [0], [-m * d / J]])

# ---- pesos (regra de Bryson: 1 / erro máximo aceitável²) ----
#   carro até 15 cm do centro, carro a 0,5 m/s, haste a 0,05 rad (~3°), haste a 1 rad/s
Q = np.diag([1 / 0.15**2, 1 / 0.5**2, 1 / 0.05**2, 1 / 1.0**2])
#   aceleração do carro até ~6 m/s² (o firmware limita a 8)
R = np.array([[1 / 6**2]])

P = solve_continuous_are(A, B, Q, R)
K = np.linalg.solve(R, B.T @ P).ravel()

periodo = 2 * np.pi * np.sqrt(J / (m * g * d))
print(f"período de pequenas oscilações, pendurada: {periodo:.3f} s  (medido: 1,121 s)")
print("ganhos:")
for nome, k in zip(("K_X", "K_V", "K_T", "K_W"), K):
    print(f"  {nome} = {k:8.2f}")
polos = np.linalg.eigvals(A - B @ K.reshape(1, -1))
print("polos em malha fechada:", np.round(polos, 2))
