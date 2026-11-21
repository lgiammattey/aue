# Missão 0053 — Reações competitivas no Mural e votação sem login

- **Problema:** os cards do Mural ainda exibiam coração de Twitter e as 3 reações antigas (`🔥`, `🤢`, `🏆`), exigiam login para reagir em publicações e ficavam em linhas soltas sem moldura de card.
- **Comportamento:**
  1. Trocar os botões de reação dos cards para **Like (`👍`)**, **Dislike (`👎`)**, **Dedo do meio (`🖕`)**, **Hangloose (`🤙`)**, **Sinal do rock (`🤘`)**, **Cerveja (`🍺`)** e **Refrigerante (`🥤`)**;
  2. Liberar votação em posts no Mural/Perfil sem exigir login (usando sessão anônima automática quando a pessoa ainda não entrou em conta), mantendo conta exigida no Perfil próprio e itens salvos;
  3. Devolver moldura de card competitivo para os itens do Mural.
- **Pista:** full flow sistêmica (migração SQL para `reacoes_de_topicos` + `alternar_reacao_do_topico` + `contar_reacoes_dos_topicos`, porta/adaptador e cards).
- **Donos:** Tiago (aceite), Iury (coordenação), Rian e Kayky (cards e Mural), Lucas (SQL/RPC), Marcelo (qualidade).
- **Aceite:** `typecheck`, `lint`, `test` (inclusive teste PGlite da migração) e `build` verdes.
- **Estado:** concluída.
