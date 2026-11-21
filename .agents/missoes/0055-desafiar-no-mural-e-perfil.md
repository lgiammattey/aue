# Missão 0055 — Desafiar direto pelo Mural e pelo Perfil

- **Problema:** um usuário não conseguia desafiar outro diretamente a partir de um post no Mural ou da página de Perfil; os desafios só podiam ser iniciados pela tela da Arena.
- **Comportamento:**
  1. Adicionar botão **Desafiar (`⚔️ Desafiar`)** na barra de ações de cada post no Mural/Perfil (de outro arrotador) e no cabeçalho de Perfil de outros arrotadores;
  2. Abrir o compositor já em modo de desafio contra `@handle` (pré-preenchendo a intimação com `@handle` e a nota alvo quando existir, garantindo a menção para aparecer em `Marcados`/notificações e enviando também ao perfil desafiado quando houver áudio, além de atalho direto para `/arena?desafiar=<handle>`);
  3. Exibir `CONTRA @HANDLE` na Arena quando aberta a partir de `/arena?desafiar=<handle>`.
- **Pista:** front-end (`features/novo-aue` e `arena/v2`).
- **Donos:** Tiago (aceite), Iury (coordenação), Rian e Kayky (Mural, Perfil, Compositor e Arena), Marcelo (qualidade).
- **Aceite:** `typecheck`, `lint`, `test` e `build` verdes + app aberto no `localhost` para revisão do Luiz.
- **Estado:** concluída.
