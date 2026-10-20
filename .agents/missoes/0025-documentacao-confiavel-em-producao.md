# Cartão de Missão 0025 — Documentação confiável em produção

## 1. Enquadramento (Tiago)

- **Dor / Problema da pessoa:** a documentação mistura o que está publicado em `aue.web.app`, a direção aceita para depois e referências que já não existem.
- **Comportamento esperado na tela:** nenhum. A mudança é documental; quem abrir o repositório deve conseguir distinguir produto publicado de decisão ainda pendente.
- **Fora de escopo (Não vira):** alteração de código, banco, deploy, conteúdo publicado ou comportamento do site.
- **Pista (Lane):** Fast lane.
- **Por que esta pista:** correção localizada de fontes, índices e links, sem contrato de runtime.
- **Fonte de verdade afetada:** `README.md`, `docs/README.md`, `ESCOPO_ATUAL.md`, mapa de telas, arquitetura e ADRs.

## 2. Donos e Fronteiras (Iury)

- **Braço direito e Aceite Final:** Tiago.
- **Orquestração e Mesa Limpa:** Iury.
- **Responsável pela implementação:** documentação.
- **Especificação e Auditoria Visual:** não aplicável.
- **Gate Arquitetural (Camillo / Lucas):** não aplicável; ADRs aceitos não são reescritos para mudar decisão.
- **Auditoria e Prova Real:** Marcelo, por links locais e leitura do `aue.web.app`.
- **Decisão pendente do Luiz:** nenhuma.

## 3. Comportamento, Plataformas e Risco

- **Plataformas afetadas:** documentação do repositório.
- **Maior risco de quebra ou mentira visual:** apresentar a migração para tópicos como comportamento já publicado, ou manter referências a protótipos e hospedagem extintos.
- **Limite da promessa:** a verificação em produção confirma a superfície pública observada; não confirma permissões, escrita, Arena ou backend sem autenticação e sem executar ações.

## 4. Matriz de Aceite e Evidência

| Critério observável | Dono da prova | Ambiente exigido | Estado |
|---|---|---|---|
| Fontes canônicas distinguem publicado de direção pendente | Tiago | documentação + produção | validado |
| Links locais das fontes ativas resolvem | Marcelo | filesystem | validado |
| Nenhum arquivo de código é alterado | Marcelo | Git | validado |

## 5. Encerramento e Parecer Final

- **Arquivos/módulos alterados:** documentação e este cartão.
- **Parecer do Marcelo:** `SEM ACHADOS MATERIAIS` na documentação alterada.
- **Veredito Final do Tiago:** `APROVADO COM RESSALVAS` — produção foi conferida na superfície pública; ações autenticadas e a Arena não foram exercitadas.
- **Pendências ou decisão necessária do Luiz:** nenhuma.
