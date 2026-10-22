import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const caminho = fileURLToPath(new URL('../../supabase/migrations/20261022165204_corrigir_coleta_e_metricas_do_painel.sql', import.meta.url));
const sql = () => readFileSync(caminho, 'utf8').replace(/\s+/g, ' ');

describe('correção da coleta e do painel', () => {
  it('mantém o limitador em servidor sem abrir leitura da telemetria', () => {
    expect(sql()).toMatch(/FUNCTION public\.limitar_telemetria_por_sessao\(\)[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = public, pg_temp/i);
    expect(sql()).toMatch(/REVOKE ALL ON FUNCTION public\.limitar_telemetria_por_sessao\(\) FROM PUBLIC, anon, authenticated/i);
    expect(sql()).toMatch(/GRANT INSERT ON public\.eventos_de_telemetria TO anon, authenticated/i);
    expect(sql()).not.toMatch(/GRANT SELECT ON public\.eventos_de_telemetria/i);
  });

  it('não conta a pauta sintética como publicação, sem apagar respostas legítimas', () => {
    const texto = sql();
    const topicos = texto.slice(texto.indexOf('INTO v_topicos'), texto.indexOf('INTO v_respostas'));
    const respostas = texto.slice(texto.indexOf('INTO v_respostas'), texto.indexOf('INTO v_comunidades_ativas'));
    const inicioDia = texto.lastIndexOf('SELECT count(*)::integer FROM public.topicos t WHERE');
    const dias = texto.slice(inicioDia, texto.indexOf('AS topicos_publicados', inicioDia));
    expect(topicos).toContain('public.pautas_de_topicos');
    expect(dias).toContain('public.pautas_de_topicos');
    expect(respostas).not.toContain('public.pautas_de_topicos');
  });
});
