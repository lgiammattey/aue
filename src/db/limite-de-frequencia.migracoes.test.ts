import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261021003838_limite_de_frequencia_por_conta.sql`, 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').replace(/\s+/g, ' ');

const LIMITES: ReadonlyArray<[string, string]> = [
  ['topicos', "'autor_id', 'criado_em', '10', '3600'"],
  ['respostas', "'autor_id', 'criado_em', '60', '3600'"],
  ['comentarios', "'user_id', 'created_at', '60', '3600'"],
  ['reacoes', "'user_id', 'created_at', '120', '60'"],
  ['reacoes_de_topicos', "'user_id', 'criado_em', '120', '60'"],
  ['seguidores', "'follower_id', 'created_at', '60', '3600'"],
  ['denuncias', "'user_id', 'created_at', '20', '3600'"],
  ['denuncias_conversa', "'usuario_id', 'criado_em', '20', '3600'"],
];

describe('limite de frequência por conta (migration 20261021003838)', () => {
  it.each(LIMITES)('%s tem trigger BEFORE INSERT com o teto combinado', (tabela, args) => {
    expect(sql).toContain(`CREATE TRIGGER limitar_escrita BEFORE INSERT ON public.${tabela} FOR EACH ROW EXECUTE FUNCTION public.aue_limitar_escrita(${args})`);
  });

  it('só vale para conta logada escrevendo em nome dela: seed e migration passam', () => {
    expect(sql).toContain('IF v_uid IS NULL OR v_autor IS DISTINCT FROM v_uid THEN RETURN NEW; END IF');
  });

  it('o erro leva o HINT que o cliente traduz e recusa antes de gravar (BEFORE INSERT)', () => {
    expect(sql).toContain("USING ERRCODE = '54000', HINT = 'limite_de_frequencia'");
    expect(sql).not.toMatch(/AFTER INSERT/);
  });

  it('a contagem usa índice por usuário e tempo', () => {
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS comentarios_por_usuario_idx ON public.comentarios (user_id, created_at DESC)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS reacoes_por_usuario_idx ON public.reacoes (user_id, created_at DESC)');
  });
});
