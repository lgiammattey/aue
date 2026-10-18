#!/usr/bin/env bash
# BASELINE — rode UMA vez, na sua máquina, antes do primeiro `db push` do CI.
#
# O QUE RESOLVE
#   O histórico do projeto remoto (supabase_migrations.schema_migrations) foi
#   preenchido à mão e tem só 7 entradas, com datas diferentes dos arquivos do
#   repositório (ex.: remoto 20260809233820 x repo 20260809000001). Sem este
#   passo, `db push` acharia que NADA foi aplicado e tentaria rodar tudo de novo
#   em produção.
#
# O QUE FAZ
#   1. marca como "reverted" as versões que só existem no remoto (não são
#      arquivos do repo) — isso só mexe na tabela de histórico, não no schema;
#   2. marca como "applied" toda migração do repo anterior à 20261018000002.
#
# ANTES DE RODAR, CONFIRME que a produção realmente tem tudo isso aplicado
# (em 18/10/2026 tinha, até a 20261018000001). Nada aqui executa SQL de schema.
#
# USO:  supabase login && supabase link --project-ref enjykrpprjfmeqxunzcs
#       bash supabase/scripts/baseline.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

CORTE="20261018000002"
REMOTAS_AVULSAS=(
  20260809233820 20260811020708 20260812030703 20260812030923
  20260812031236 20260812031256 20260826130828
)

echo "Marcando versões só-remotas como revertidas (só histórico)…"
supabase migration repair --status reverted "${REMOTAS_AVULSAS[@]}"

echo "Marcando migrações do repositório anteriores a ${CORTE} como aplicadas…"
VERSOES=()
for f in supabase/migrations/*.sql; do
  v="$(basename "$f" | cut -d_ -f1)"
  if [[ "$v" < "$CORTE" ]]; then VERSOES+=("$v"); fi
done
supabase migration repair --status applied "${VERSOES[@]}"

echo
supabase migration list
echo
echo "Esperado: só 20261018000002 em diante com Remote vazio. Se bater, o CI já pode rodar."
