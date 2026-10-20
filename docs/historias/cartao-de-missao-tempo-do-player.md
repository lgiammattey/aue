# Cartão de Missão — tempo do player de áudio

- **Pista:** Fast lane.
- **Problema:** o player mostra tempo fixo, mesmo com o áudio correndo.
- **Resultado para a pessoa:** ela enxerga o tempo real avançar, a pausa preserva a posição e, quando termina, o player volta a `0:00`.
- **Escopo:** player de causos e de Arrotos no perfil; sem alterar captura, Arena, motor ou persistência.
- **Provas de aceite:** eventos de duração, progresso, fim e falha são refletidos na UI; áudio é parado e listeners são limpos ao sair da tela.
