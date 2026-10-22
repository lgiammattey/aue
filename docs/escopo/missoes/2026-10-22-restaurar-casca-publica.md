# Cartão de Missão — restaurar a casca anterior de login e páginas públicas

## Enquadramento

- **Dor:** a última revisão trocou o visual que Luiz reconhece no login e nas páginas públicas.
- **Pista:** Fast lane — reversão visual localizada, sem contrato, dados ou rota nova.
- **Decisão explícita de Luiz:** restaurar login e páginas públicas ao visual anterior. Esta decisão prevalece para esta missão sobre a regra geral nova de tema claro.
- **Fora de escopo:** publicação, Arena, copy de comunidade, Tropa, card do post e alterações de backend.

## Matriz de aceite

| Critério observável | Prova | Estado |
|---|---|---|
| `/login` volta à casca escura do OpenDesign | Chromium 1440 e 390 | atendido |
| Páginas públicas usam `CascaInformativaOpenDesign` escura | Chromium 1440 e 390 | atendido |
| `/landing` preserva o tema que já tinha antes da rodada clara | Chromium 1440 e 390 | atendido |
| Copy, alvos de 44 px e rotas permanecem | testes e inspeção | atendido |

## Donos

- **Implementação:** Kayky.
- **Auditoria:** Marcelo.
- **Coordenação e integração:** Iury.
- **Aceite proporcional:** Tiago.

## Encerramento

- **Marcelo:** `SEM ACHADOS MATERIAIS` após o ajuste dos alvos: `/login`, `/como-jogar` e `/landing` conferidos em 1440 e 390 sem overflow; controles visíveis com 44 px.
- **Tiago:** `APROVADO` — a decisão explícita de Luiz restaura esta família visual sem reverter copy, promessas honestas da Arena ou as demais correções já aceitas.
- **Gates desta missão:** `typecheck`, `lint`, 36 testes focados e 6 E2E de estabilidade verdes.
