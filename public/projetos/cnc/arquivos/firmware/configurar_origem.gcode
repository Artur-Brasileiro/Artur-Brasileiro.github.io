; Define a origem do papel (0,0) no canto da frente à esquerda.
; Rode UMA vez, logo depois de um $H. Fica gravado na EEPROM (G54).
; Depois disso, todo $H devolve o (0,0) exatamente ao mesmo ponto.
G92.1
G10 L2 P1 X-810 Y-390
G90
G0 X0 Y0
; a caneta para em cima do (0,0): marque esse ponto na mesa
