# Missão 0054 — Nota 0–100 em todo arroto, da Arena ao Mural e Perfil

- **Problema:** arrotos gravados na Arena mostravam apenas duração detectada e potência relativa sem nota 0–100 consolidada; áudios recém-publicados no Mural, em respostas ou no Perfil precisavam esperar o processamento em segundo plano para exibir nota na tela; e respostas na prévia do Mural, tópicos de comunidade e aba Marcados não hidratavam os áudios e notas retrospectivas.
- **Comportamento:**
  1. Calcular e exibir a **Nota do arroto (0–100)** no laudo experimental da Arena (`/`, `/arena`) sempre que a tentativa for medida;
  2. Analisar o áudio publicado no cliente (`analisarNotaDoAudioPublicado`) ao publicar no Mural, enviar resposta ou gravar arroto direto no Perfil para exibir imediatamente o selo de nota `0–100` ao lado do player (sem chamar gravação cliente-banco de `registrarOuGuardarNotaPublicada`, mantendo a fila oficial do servidor intacta);
  3. Hidratar anexos de áudio e `listarNotasRetrospectivas` na prévia de conversas do Mural (`carregarPreviasDasConversas`), na listagem/abertura de tópicos de comunidade (`/c/:slug` e `/c/:slug/t/:id`) e na aba Marcados do Perfil (`listarPublicacoesMarcadas`).
- **Pista:** front-end e domínio (`nucleo/julgamento`, `arena/v2`, `features/novo-aue`).
- **Donos:** Tiago (aceite), Iury (coordenação), Rian e Kayky (Arena, Mural e Perfil), Marcelo (qualidade).
- **Aceite:** `typecheck`, `lint`, `test` (incluindo `laudoExperimental`, `ArenaV2`, `InicioOpenDesign`, `NotaNosComentarios`, testes de banco de notas e `arquitetura.fronteira`) e `build` verdes.
- **Estado:** concluída.
