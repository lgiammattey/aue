import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarSql } from './gerar-sql.mjs';

const item = () => ({ tipo: 'topico', id: '28edf340-3a31-5a4c-91f6-ec18e9f3c864', bucket: 'audio_da_casa', caminho: "pasta/d'agua.m4a", etag: '"0123456789abcdef0123456789abcdef"', resultado: { estado: 'analisado', nota_acustica_retrospectiva: 57.3 } });

test('gera lote transacional com valor escapado, conferência e preservação de nota', () => {
  const sql = gerarSql({ resultados: [item(), { resultado: { estado: 'indisponivel' } }] });
  assert.match(sql, /^BEGIN;/);
  assert.match(sql, /d''agua/);
  assert.match(sql, /o\.metadata->>'eTag'=l\.etag/);
  assert.match(sql, /t\.status IN \('aberto','fechado'\)/);
  assert.match(sql, /ON CONFLICT \(bucket,caminho\) DO NOTHING/);
  assert.match(sql, /,57\)/);
  assert.match(sql, /COMMIT;\n$/);
});

test('recusa ETag ausente, nota inválida e objeto duplicado', () => {
  assert.throws(() => gerarSql({ resultados: [{ ...item(), etag: undefined }] }));
  assert.throws(() => gerarSql({ resultados: [{ ...item(), resultado: { estado: 'analisado', nota_acustica_retrospectiva: NaN } }] }));
  assert.throws(() => gerarSql({ resultados: [item(), item()] }));
});
