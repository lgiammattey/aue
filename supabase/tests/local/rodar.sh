#!/usr/bin/env bash
# Recria um banco PostgreSQL local, aplica as migrações REAIS de supabase/migrations
# (com os papéis e schemas do Supabase simulados em stubs.sql) e roda os testes SQL (topicos.sql e forum_leituras.sql).
#
# Uso:   supabase/tests/local/rodar.sh [banco] [ate_versao]
#   banco       nome do banco descartável (padrão: aue_teste). É APAGADO e recriado.
#   --somente-migracoes  aplica a cadeia sem rodar as suítes sociais
#   ate_versao  para antes de uma migração (ex.: 20261019000013 para testar a 14 e a 15 à parte)
#
# Variável PSQL (padrão "psql"). Como root numa máquina onde só o usuário postgres entra no
# banco: PSQL="runuser -u postgres -- psql". Nada aqui toca no Supabase remoto.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(cd "$AQUI/../../.." && pwd)"
DB="${1:-aue_teste}"
ATE="${2:-}"
read -r -a psql_cmd <<< "${PSQL:-psql}"
# O runner recria o banco. Aceita apenas um nome simples e uma conexão local.
[[ "$DB" =~ ^[a-z_][a-z0-9_]*$ && ${#DB} -le 63 && "$DB" != postgres && "$DB" != template[01] ]] || { echo 'use um nome de banco descartável' >&2; exit 2; }
case "${PGHOST:-}" in ""|/*|localhost|127.0.0.1|::1) ;; *) echo 'use PostgreSQL local' >&2; exit 2 ;; esac
[[ -z "${PGSERVICE:-}${PGHOSTADDR:-}" ]] || { echo 'use PGHOST local explícito' >&2; exit 2; }
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
psql_local() { "${psql_cmd[@]}" -X -q -v ON_ERROR_STOP=1 "$@"; }

psql_local -d postgres -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB" >/dev/null
psql_local -d "$DB" < "$AQUI/stubs.sql"

export LC_ALL=C
anterior=''
for f in "$RAIZ"/supabase/migrations/*.sql; do
  v=$(basename "$f" | cut -d_ -f1)
  if [[ -n "$ATE" && "$ATE" != --somente-migracoes && "$v" > "$ATE" ]]; then echo "parou antes de $v"; exit 0; fi
  if [[ "$v" = "$anterior" ]]; then echo "versão de migration duplicada: $v" >&2; exit 1; fi
  anterior="$v"
  # O prelude simula os default privileges do Supabase: entra antes das migrações de tópicos.
  if [[ "$v" == "20261019000014" ]]; then psql_local -d "$DB" < "$AQUI/prelude.sql"; fi
  psql_local -d "$DB" -1 -f "$f"
done
echo "migrações aplicadas em $DB"

if [[ -z "$ATE" ]]; then
  for teste in topicos forum_leituras; do
    psql_local -d "$DB" -f "$RAIZ/supabase/tests/$teste.sql"
  done
fi
