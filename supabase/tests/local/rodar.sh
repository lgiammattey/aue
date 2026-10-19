#!/usr/bin/env bash
# Recria um banco PostgreSQL local, aplica as migrações REAIS de supabase/migrations
# (com os papéis e schemas do Supabase simulados em stubs.sql) e roda os testes SQL.
#
# Uso:   supabase/tests/local/rodar.sh [banco] [ate_versao]
#   banco       nome do banco descartável (padrão: aue_teste). É APAGADO e recriado.
#   ate_versao  para antes de uma migração (ex.: 20261019000013 para testar a 14 e a 15 à parte)
#
# Variável PSQL (padrão "psql"). Como root numa máquina onde só o usuário postgres entra no
# banco: PSQL="runuser -u postgres -- psql". Nada aqui toca no Supabase remoto.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(cd "$AQUI/../../.." && pwd)"
DB="${1:-aue_teste}"
ATE="${2:-}"
PSQL="${PSQL:-psql}"

$PSQL -q -d postgres -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB" >/dev/null
$PSQL -q -d "$DB" -v ON_ERROR_STOP=1 < "$AQUI/stubs.sql"

for f in $(ls "$RAIZ"/supabase/migrations/*.sql | sort); do
  v=$(basename "$f" | cut -d_ -f1)
  # O prelude simula os default privileges do Supabase: entra antes das migrações de tópicos.
  if [[ "$v" == "20261019000014" ]]; then $PSQL -q -d "$DB" -v ON_ERROR_STOP=1 < "$AQUI/prelude.sql"; fi
  if [[ -n "$ATE" && "$v" > "$ATE" ]]; then echo "parou antes de $v"; exit 0; fi
  $PSQL -q -d "$DB" -v ON_ERROR_STOP=1 -1 < "$f" 2>&1 | grep -v "NOTICE\|skipping" || true
done
echo "migrações aplicadas em $DB"

if [[ -z "$ATE" ]]; then
  $PSQL -q -d "$DB" -v ON_ERROR_STOP=1 < "$RAIZ/supabase/tests/topicos.sql" 2>&1 | grep -v "WARNING\|^CONTEXT\|PL/pgSQL"
fi
