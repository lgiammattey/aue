import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261020051808_registrar_agentes_da_squad.sql`, 'utf8');
const semComentarios = sql.replace(/--[^\n]*/g, '');

describe('registro dos agentes da squad', () => {
  it('é uma RPC administrativa fechada e limita os oito @ oficiais', () => {
    expect(semComentarios).toContain('SECURITY DEFINER');
    expect(semComentarios).toContain('SET search_path = public, pg_temp');
    for (const handle of ['tiago_aue', 'iury_aue', 'rian_aue', 'kayky_aue', 'lucas_aue', 'camillo_aue', 'rodrigo_aue', 'marcelo_aue']) {
      expect(semComentarios).toContain(`'${handle}'`);
    }
    expect(semComentarios).toContain('REVOKE ALL ON FUNCTION public.registrar_agente_da_squad(uuid, text, text, text) FROM PUBLIC');
    expect(semComentarios).toContain('GRANT EXECUTE ON FUNCTION public.registrar_agente_da_squad(uuid, text, text, text) TO service_role');
  });

  it('exige identidade interna, fecha a ficha social e não ocupa vaga de fundador', () => {
    expect(semComentarios).toContain("v_handle || '@contas-da-casa.invalid'");
    expect(semComentarios).toContain("INSERT INTO public.contas_da_casa (usuario_id, papel)");
    expect(semComentarios).toContain("VALUES (p_usuario_id, 'agente')");
    expect(semComentarios).toContain("set_config('aue.perfil_social', 'sim', true)");
    expect(semComentarios).toContain('perfil_social_concluido_em = coalesce(perfil_social_concluido_em, now())');
    expect(semComentarios).toContain('e_fundador = false');
    expect(semComentarios).toContain("slug = 'bonde-geral'");
  });
});
