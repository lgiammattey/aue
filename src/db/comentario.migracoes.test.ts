import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const sql = readFileSync(`${raiz}/supabase/migrations/20261021011500_apagar_e_denunciar_comentario_de_causo.sql`, 'utf8')
  .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n').replace(/\s+/g, ' ');

describe('apagar e denunciar comentário de causo (migration 20261021011500)', () => {
  it('apagar vira marcador no espelho, sem levar as respostas dos outros', () => {
    expect(sql).toContain("UPDATE public.respostas SET status = 'removido' WHERE id = v_resposta");
    expect(sql).toContain("v_dono <> auth.uid() THEN PERFORM public.aue_falhar_conversa('42501', 'Só quem escreveu pode alterar', 'nao_e_autor')");
  });

  it('comentário sem espelho e com respostas não é apagado de vez', () => {
    expect(sql).toContain('IF EXISTS (SELECT 1 FROM public.comentarios f WHERE f.resposta_a_id = p_comentario_id)');
  });

  it('denunciar reaproveita a regra da resposta espelho', () => {
    expect(sql).toContain('RETURN public.denunciar_resposta(v_resposta, p_motivo)');
  });

  it('a lista esconde texto e autor de comentário removido ou oculto e avisa com `removido`', () => {
    expect(sql).toContain("CASE WHEN rm.removido THEN '' ELSE c.content END");
    expect(sql).toContain('CASE WHEN rm.removido THEN NULL ELSE p.handle END');
    expect(sql).toContain("r.legado_comentario_id = c.id AND r.status <> 'visivel'");
  });

  it('escrever exige conta logada: visitante não executa, leitura segue pública', () => {
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.apagar_meu_comentario(uuid), public.denunciar_comentario(uuid, text) FROM PUBLIC, anon');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.listar_comentarios(uuid, uuid) TO anon, authenticated');
  });
});
