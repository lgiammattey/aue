import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const caminho = fileURLToPath(new URL('../../supabase/migrations/20261022002000_acessos_de_paginas_no_painel.sql', import.meta.url));
const sql = () => readFileSync(caminho, 'utf8').replace(/\s+/g, ' ');

describe('painel administrativo: alcance por página sem rastrear pessoas', () => {
  it('aceita somente categorias públicas de página e mantém telemetria write-only', () => {
    expect(sql()).toMatch(/evento = 'visitou_pagina' AND pagina IN/i);
    expect(sql()).toContain("'comunidades'");
    expect(sql()).toContain("'topico'");
    expect(sql()).not.toMatch(/GRANT SELECT ON public\.eventos_de_telemetria/i);
    expect(sql()).not.toMatch(/CREATE POLICY[\s\S]*eventos_de_telemetria/i);
  });

  it('protege o resumo no servidor e não retorna identificadores ou URLs', () => {
    expect(sql()).toMatch(/FUNCTION public\.painel_administrativo_resumo[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = public, pg_temp/i);
    expect(sql()).toMatch(/IF NOT public\.aue_e_administrador\(\) THEN[\s\S]*?Acesso administrativo negado/i);
    const retorno = sql().slice(sql().indexOf('RETURN jsonb_build_object'));
    for (const proibido of ['email', 'usuario_id', 'sessao_id', 'batalha_codigo', 'caminho', 'url']) {
      expect(retorno).not.toContain(`'${proibido}'`);
    }
  });

  it('declara o início da coleta em vez de fabricar tráfego passado', () => {
    expect(sql()).toContain("'acessos_de_paginas'");
    expect(sql()).toContain("'acompanhamento_de_acessos_iniciado_em'");
  });
});
