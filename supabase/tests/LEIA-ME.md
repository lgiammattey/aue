# Testes SQL do banco

O `validacao.yml` **não roda SQL**. Estes testes rodam à mão, num PostgreSQL local, e são a
prova exigida antes de mergear qualquer migração: o merge na `main` aplica a migração na
produção (integração GitHub ↔ Supabase), junto com o deploy.

```bash
# PostgreSQL 16 rodando localmente, com um usuário que possa criar banco
supabase/tests/local/rodar.sh aue_teste
```

O script recria o banco `aue_teste` (apaga o que houver), aplica as migrações reais com os
papéis do Supabase simulados (`local/stubs.sql`, `local/prelude.sql`) e roda
`supabase/tests/topicos.sql` e `supabase/tests/forum_leituras.sql`, que falham alto em qualquer asserção.

- `topicos.sql`: ADR 0010 (tópicos, respostas, acervo e espelho). Cobre permissões, regras de
  escrita, limites, paginação, backfill idempotente e o espelho do frontend antigo.
- `forum_leituras.sql`: leituras do fórum e reparo do espelho (migração 000016). Cobre visitante, contagens
  contra oráculo independente, cursor com empates, handle que não enumera perfil, grants e
  `aue_reconciliar_acervo` (repara, idempotente, não reabre o que a denúncia ocultou).
- `local/stubs.sql`: `auth`, `storage` e papéis (`anon`, `authenticated`, `service_role`) mínimos.
- `local/prelude.sql`: simula os *default privileges* do Supabase. Sem ele o `REVOKE` das
  tabelas novas não seria testado de verdade.

**O que isto não prova:** o ambiente é uma simulação. Não valida o PostgREST, o Auth nem o
Storage reais, e não mede carga. Depois do merge, confira em leitura (`list_migrations`).

Rollback: `supabase/rollback/*.down.sql`, na ordem inversa (16, 15 e depois 14). O rollback não é
aplicado automaticamente.
