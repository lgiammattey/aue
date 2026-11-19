import { supabase } from '../../db/supabase';
import type { ModeracaoDueloV2, DenunciaDueloV2 } from '../../portas/moderacaoDueloV2';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function criarModeracaoDueloV2(): ModeracaoDueloV2 {
  return {
    async listar() {
      const { data, error } = await supabase.rpc('aue_v2_listar_denuncias', { p_estado: 'pendente' });
      if (error || !Array.isArray(data)) throw new Error('Fila indisponível');
      return data.map((item: Record<string, unknown>): DenunciaDueloV2 => {
        if (typeof item.id !== 'string' || !uuid.test(item.id) || (item.motivo !== 'ofensivo' && item.motivo !== 'outro') || typeof item.criado_em !== 'string' || !Number.isFinite(Date.parse(item.criado_em))) throw new Error('Fila inválida');
        return { id: item.id, motivo: item.motivo, criadoEm: item.criado_em, audioDisponivel: item.bucket === 'duelos_v2' && typeof item.caminho === 'string' };
      });
    },
    async ouvir(id) {
      if (!uuid.test(id)) throw new Error('Denúncia inválida');
      const { data, error } = await supabase.functions.invoke('duelo-audio-v2', { body: { denunciaId: id } });
      if (error || !(data instanceof Blob) || data.size < 44 || data.size > 5 * 1024 * 1024) throw new Error('Áudio indisponível');
      return new Blob([data], { type: 'audio/wav' });
    },
    async decidir(id, decisao) {
      if (!uuid.test(id) || (decisao !== 'mantida' && decisao !== 'restaurada')) throw new Error('Decisão inválida');
      const { data, error } = await supabase.rpc('aue_v2_moderar_denuncia', { p_id: id, p_decisao: decisao });
      if (error || data?.estado !== decisao) throw new Error('Decisão não confirmada');
    },
  };
}
