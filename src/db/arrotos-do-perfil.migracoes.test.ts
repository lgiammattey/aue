import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261020000018_arrotos_do_perfil.sql`, 'utf8');

describe('migração de arrotos do perfil', () => {
  it('mantém o áudio fora de Arena, resultados, comunidade e feed', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.arrotos_do_perfil');
    expect(sql).not.toMatch(/REFERENCES public\.(resultados|posts_comunidade|grupos)/i);
  });

  it('usa bucket privado, caminho imutável e upload só para rascunho do autor', () => {
    expect(sql).toContain("'arrotos_de_perfil', 'arrotos_de_perfil', false");
    expect(sql).toContain('arrotos_do_perfil_caminho_imutavel');
    expect(sql).toContain('aue_pode_enviar_arroto_do_perfil(name)');
    expect(sql).toContain('aue_pode_ler_arroto_do_perfil(name)');
    expect(sql).not.toMatch(/FOR (UPDATE|DELETE) TO authenticated[\s\S]{0,90}arrotos_de_perfil/i);
  });

  it('resolve o destino no servidor e permite ocultar somente a autor ou dono do perfil', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.preparar_arroto_do_perfil');
    expect(sql).toContain("RAISE EXCEPTION 'Perfil de destino não existe'");
    expect(sql).toContain('(autor_id = auth.uid() OR perfil_id = auth.uid())');
    expect(sql).toContain("estado = 'oculto'");
  });
});
