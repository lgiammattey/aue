---
name: modelar-dados-e-api
description: Guia para Camillo desenhar contratos, tabelas, mural e motor de áudio do Auê.
---

# Skill: modelar-dados-e-api

Procedimento do **Camillo** (Áudio, Backend e Arquitetura) para desenhar contratos, APIs, tabelas e módulos do jogo e do mural.

---

## 1. Princípios Arquiteturais do Auê

1. **Camadas Claras:**
   - **Áudio e nota:** preservar a separação entre a composição dos fluxos (`src/arena/`, `src/features/audio/`), as regras puras (`src/nucleo/`) e os adaptadores de navegador em `src/plataforma/`.
   - **Mural e perfil:** queries de mural paginado, posts com áudio, curtidas e respostas.
   - **Portas de Plataforma (`src/plataforma/`):** Acesso a microfone, armazenamento local e cliente Supabase vivem estritamente atrás de portas em `src/portas/`.
   - **Telas e UI:** identificar o componente ativo no [mapa de páginas e fluxos](../../../docs/design/MAPA_DE_PAGINAS_E_FLUXOS.md). A UI compõe e apresenta o fluxo usando casos de uso e portas.

2. **Supabase & Segurança (RLS):**
   - Definir leitura pública de áudio ou post somente quando o contrato e a policy aplicáveis a autorizarem; não inferir o grant implantado das migrations ou de PGlite.
   - Desafios privados (X1) precisam limitar escuta e resposta aos participantes autorizados, com teste no ambiente declarado.
   - Modelar moderação e denúncias conforme o escopo da missão, sem criar fluxo novo por esta skill.
   - Tratar integridade da nota como requisito a provar: o M00 encontrou métricas enviadas pelo cliente manipuláveis em laboratório. Nenhuma consequência competitiva nova depende delas até uma missão autorizada validar autoria, vínculo com o áudio e contrato remoto.

3. **Performance de Áudio Web:**
   - O contrato de cada fluxo define acesso, expiração e revogação do áudio. Para áudio privado ou moderável, verifique os cabeçalhos HTTP e a política de cache no ambiente autorizado. `NetworkOnly` comprova a estratégia do service worker no build examinado. A CDN exige verificação própria.
   - O player de áudio não pode gerar refetch desnecessário a cada rolagem da timeline.

---

## 2. Roteiro de Desenho Técnico

Ao fechar um módulo antes do código:
1. Definir o modelo de dados / schema (Postgres / Supabase);
2. Escrever os contratos de TypeScript (`interfaces` / `types`);
3. Especificar os estados de falha e offline;
4. Definir como Felipe valida o comportamento visível e como Renan conduz a Prova de Fogo;
5. Submeter a Marcelo para enquadramento e sequência.
