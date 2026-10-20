import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const arquivo = new URL('../../supabase/migrations/20261019000017_vida_social_das_comunidades.sql', import.meta.url);
const rollback = new URL('../../supabase/rollback/20261019000017_vida_social_das_comunidades.down.sql', import.meta.url);

describe('migração de vida social das comunidades', () => {
  const sql = readFileSync(arquivo, 'utf8');

  it('é aditiva, fecha acesso direto e acompanha rollback', () => {
    expect(existsSync(rollback)).toBe(true);
    expect(sql).toContain('CREATE TABLE public.votos_conversa');
    expect(sql).toContain('CREATE TABLE public.itens_salvos_conversa');
    expect(sql).toContain('CREATE TABLE public.notificacoes_sociais');
    expect(sql).toContain('CREATE TABLE public.acoes_moderacao_conversa');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('REVOKE ALL ON public.votos_conversa');
    expect(sql).not.toMatch(/DROP TABLE public\.(topicos|respostas|grupos)/);
  });

  it('impõe um alvo e um voto ou salvo por pessoa', () => {
    expect(sql).toContain('num_nonnulls(topico_id, resposta_id) = 1');
    expect(sql).toContain('votos_conversa_topico_por_usuario');
    expect(sql).toContain('votos_conversa_resposta_por_usuario');
    expect(sql).toContain('itens_salvos_conversa_topico_por_usuario');
  });
});
