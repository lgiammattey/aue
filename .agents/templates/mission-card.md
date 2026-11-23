# Cartão de Missão — Auê

> Obrigatório antes de abrir execução na oficina (exceto Hot lane, que registra logo após apagar o incêndio). Sem este cartão aprovado pelo Tiago, a conversa continua em **Exploração** (zero alteração de código).

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:**
- **Comportamento esperado na tela:**
- **Fora de escopo (Não vira):**
- **Pista (Lane):** Exploração | Fast lane | Full flow comum | Full flow sistêmica | Hot lane
- **Por que esta pista:**
- **Fonte de verdade afetada:** `ARENA.md` | `REGRAS.md` | `AUE.md` | `ADR 0001`

## 2. Donos e Fronteiras (Tiago)

- **Orquestração, mesa limpa e aceite final:** Tiago
- **Responsável pela implementação:** Diego (Telas/Arena) | Camillo (Áudio, Backend, Plataforma, Arquitetura)
- **Especificação visual:** Diego | não aplicável
- **Gate Arquitetural (Camillo):** não aplicável | pendente | aprovado
- **Auditoria e Prova Real (quem não implementou):** Camillo | Diego
- **Decisão pendente do Luiz:** nenhuma | descrever

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** Web Mobile (Safari iOS / Chrome Android) | Desktop | documentação
- **Estados obrigatórios da Arena:** inicial, gravando, analisando áudio, resultado, erro, microfone negado
- **Maior risco de quebra ou mentira visual:**
- **Limite da promessa (o que o motor de áudio/API não mede):**

## 4. Matriz de Aceite e Evidência (auditor → Tiago)

| Critério observável | Dono da prova | Ambiente exigido (Código / Teste / Safari iOS / Chrome Android) | Estado |
|---|---|---|---|
| | | | pendente |

> Um nível de evidência nunca substitui o seguinte ("compilou" não é "funcionou na tela").

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:**
- **Parecer do auditor:** `SEM ACHADOS MATERIAIS` | `AJUSTA` | `BLOQUEIA` | `ISSUE_FUTURA`
- **Veredito Final do Tiago:** `APROVADO` | `APROVADO COM RESSALVAS` | `REPROVADO` | `NÃO VALIDADO`
- **Pendências ou decisão necessária do Luiz:**
