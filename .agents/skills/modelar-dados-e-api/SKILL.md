---
name: modelar-dados-e-api
description: Guia para Camillo e Lucas desenharem contratos, tabelas, feeds e motor de áudio do Auê.
---

# Skill: modelar-dados-e-api

Procedimento do **Camillo** (Arquiteto de Sistemas) e **Lucas** (Áudio & Backend) para desenhar contratos, APIs, tabelas e módulos da rede social de arrotadores e da Arena.

---

## 1. Princípios Arquiteturais do Auê

1. **Camadas Claras:**
   - **Motor de Áudio & Score (`src/features/audio` / `src/features/score`):** YAMNet, Web Audio API e algoritmos de pontuação isolados de qualquer componente visual.
   - **Social & Comunidades (`src/features/feed` / `src/features/communities`):** Queries de feed paginado, posts com áudio, curtidas, respostas e dados de comunidades.
   - **Portas de Plataforma (`src/plataforma/`):** Acesso a microfone, armazenamento local e cliente Supabase vivem estritamente atrás de portas em `src/portas/`.
   - **Telas e UI (`src/components/`, `src/routes/`):** Somente apresentação e consumo das portas.

2. **Supabase & Segurança (RLS):**
   - Áudios e causos públicos no feed têm leitura livre.
   - Desafios privados (X1) só podem ser ouvidos e respondidos pelos participantes autorizados.
   - Moderação e denúncias com flag de revisão.
   - RPCs determinísticas para cálculo e persistência de pontuação oficial sem manipulação pelo cliente.

3. **Performance de Áudio Web:**
   - Áudios salvos em buckets Supabase com CDN e URLs cacheadas.
   - O player de áudio não pode gerar refetch desnecessário a cada rolagem da timeline.

---

## 2. Roteiro de Desenho Técnico

Ao fechar um módulo antes do código:
1. Definir o modelo de dados / schema (Postgres / Supabase);
2. Escrever os contratos de TypeScript (`interfaces` / `types`);
3. Especificar os estados de falha e offline;
4. Definir como o Marcelo vai auditar (testes unitários e de integração);
5. Submeter ao Iury para alocação de tarefas.
