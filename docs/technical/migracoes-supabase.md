# Migrações do Supabase: como chegam à produção

Quem aplica é a **integração do Supabase com o GitHub** (painel do projeto →
Project Settings → Integrations → GitHub). Não existe workflow nem segredo no
GitHub para isso.

Configuração em uso (18/10/2026):

- repositório `lgiammattey/aue`, diretório de trabalho `.`;
- **Deploy to production** ligado, branch `main`: o merge na `main` aplica no
  banco de produção as migrações novas de `supabase/migrations/`;
- **Branching** (preview por PR) desligado: exige o plano Pro. O check
  "Supabase Preview" nas PRs pode aparecer como falha por isso, e não bloqueia o
  deploy de produção.

## Baseline: obrigatório, uma vez

O histórico do banco remoto foi preenchido à mão e tem 7 entradas com datas que
não batem com os nomes dos arquivos do repositório. Enquanto isso valer, a
integração falha com `Remote migration versions not found in local migrations
directory` e **nenhuma migração nova é aplicada**.

Na sua máquina:

```
supabase login
supabase link --project-ref enjykrpprjfmeqxunzcs   # pede a senha do banco
bash supabase/scripts/baseline.sh
```

O script só mexe na tabela de histórico (`schema_migrations`), nunca no schema.
O esperado no fim é que só `20261018000002` em diante apareçam sem registro
remoto.

## Regras

- Migração nova é sempre para frente, com timestamp maior que todas.
- Não edite migração já aplicada: corrija com uma nova.
- Desfazer é manual: `supabase/rollback/`.
- Nomes seguem [`../schema/nomenclatura.md`](../schema/nomenclatura.md).
